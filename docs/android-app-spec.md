# Android App – Final Specification

## 0. Technology Stack

### 0.1 Core Technologies
- **Language**: Kotlin
- **Architecture**: MVVM (Model-View-ViewModel)
- **Minimum SDK**: Android 6.0 (API 23)
- **Target SDK**: Android 14 (API 34)

### 0.2 Key Libraries & Components

**Networking:**
- **Retrofit 2**: HTTP client for backend API communication
- **OkHttp**: HTTP client engine with interceptors for auth
- **Moshi**: JSON serialization/deserialization

**Background Execution:**
- **Foreground Service**: Keeps app alive for continuous job polling
- **WorkManager**: Scheduled retry logic for failed operations

**USSD Execution:**
- **Telephony Intent**: `ACTION_CALL` with USSD code (`tel:*150*...#`)
- **Accessibility Service**: Parse USSD response dialogs automatically
- **Dual SIM Support**: `TelecomManager` for SIM slot selection

**Security:**
- **EncryptedSharedPreferences**: Secure storage for USSD password and tokens
- **Android Keystore**: Hardware-backed encryption for sensitive data

**Architecture Components:**
- **ViewModel**: State management and business logic
- **LiveData/StateFlow**: Reactive UI updates
- **Room Database** (Optional): Local caching of job queue

### 0.3 USSD Execution Architecture

**Foreground Service Pattern:**
```kotlin
// TransferExecutorService.kt
class TransferExecutorService : Service() {
    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.IO + job)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Show notification to keep service alive
        val notification = createNotification("خدمة التحويلات نشطة")
        startForeground(NOTIFICATION_ID, notification)

        // Start polling for jobs every 3-5 seconds
        scope.launch {
            while (isActive) {
                pollAndExecuteJobs()
                delay(3000)  // 3 seconds polling interval
            }
        }

        return START_STICKY
    }

    private suspend fun pollAndExecuteJobs() {
        val jobs = apiClient.getPendingJobs()
        jobs.forEach { job ->
            executeTransfer(job)
        }
    }
}
```

**USSD Execution via Telephony Intent:**
```kotlin
// UssdExecutor.kt
class UssdExecutor(private val context: Context) {
    fun executeTransfer(job: TransferJob) {
        val password = getStoredPassword()  // From encrypted storage
        val ussdCode = buildUssdCode(job.phone, job.amount, password)
        val simSlot = getSIMSlotForOperator(job.operator)

        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:${Uri.encode(ussdCode)}")
            putExtra("com.android.phone.extra.slot", simSlot)  // Dual SIM support
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        context.startActivity(intent)
    }

    private fun buildUssdCode(phone: String, amount: Int, password: String): String {
        // Format: *150*1*PASSWORD*1*PHONE*PHONE*AMOUNT#
        return "*150*1*${password}*1*${phone}*${phone}*${amount}#"
    }
}
```

**Accessibility Service for Response Parsing:**
```kotlin
// UssdResponseAccessibilityService.kt
class UssdResponseAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val text = event.text.joinToString(" ")
            
            // Parse USSD response
            val isSuccess = when {
                text.contains("تمت العملية بنجاح") -> true
                text.contains("فشلت العملية") -> false
                else -> null
            }

            // Report result to backend
            isSuccess?.let {
                reportResult(currentJobId, if (it) "success" else "failed", text)
            }
        }
    }
}
```

**AndroidManifest.xml Configuration:**
```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Accessibility Service -->
<service
    android:name=".services.UssdResponseAccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>

<!-- Foreground Service -->
<service
    android:name=".services.TransferExecutorService"
    android:foregroundServiceType="dataSync" />
```

### 0.4 Short Polling Strategy

**Polling Configuration:**
- **Interval**: 3-5 seconds when service is active
- **Endpoint**: `GET /api/android/jobs/pending`
- **Backoff**: Increase interval to 10s if no jobs found (optional)

**Polling Implementation:**
```kotlin
// JobPoller.kt
class JobPoller(private val apiClient: AndroidApiClient) {
    private var pollingInterval = 3000L  // 3 seconds default

    suspend fun startPolling() = coroutineScope {
        while (isActive) {
            try {
                val jobs = apiClient.getPendingJobs()
                
                if (jobs.isNotEmpty()) {
                    pollingInterval = 3000L  // Reset to fast polling
                    jobs.forEach { executeTransfer(it) }
                } else {
                    pollingInterval = 5000L  // Slow down if no jobs
                }
            } catch (e: Exception) {
                Log.e(TAG, "Polling failed", e)
                pollingInterval = 10000L  // Backoff on error
            }

            delay(pollingInterval)
        }
    }
}
```

### 0.5 Secure Storage (EncryptedSharedPreferences)

**Storing Sensitive Data:**
```kotlin
// SecureStorage.kt
class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun savePassword(password: String) {
        encryptedPrefs.edit().putString("ussd_password", password).apply()
    }

    fun getPassword(): String? {
        return encryptedPrefs.getString("ussd_password", null)
    }

    fun saveAuthToken(token: String) {
        encryptedPrefs.edit().putString("auth_token", token).apply()
    }

    fun getAuthToken(): String? {
        return encryptedPrefs.getString("auth_token", null)
    }
}
```

**NEVER store in plain SharedPreferences:**
- ❌ `sharedPreferences.putString("password", password)` - INSECURE
- ✅ `encryptedPrefs.putString("password", password)` - SECURE

### 0.6 Project Structure (MVVM)
```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/easytransfer/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── LoginActivity.kt
│   │   │   │   │   │   └── LoginViewModel.kt
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── ConfigActivity.kt
│   │   │   │   │   │   └── ConfigViewModel.kt
│   │   │   │   │   └── main/
│   │   │   │   │       ├── MainActivity.kt
│   │   │   │   │       └── MainViewModel.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── AndroidApiClient.kt
│   │   │   │   │   │   └── ApiService.kt
│   │   │   │   │   ├── models/
│   │   │   │   │   │   ├── TransferJob.kt
│   │   │   │   │   │   └── AuthResponse.kt
│   │   │   │   │   └── storage/
│   │   │   │   │       └── SecureStorage.kt
│   │   │   │   ├── services/
│   │   │   │   │   ├── TransferExecutorService.kt
│   │   │   │   │   └── UssdResponseAccessibilityService.kt
│   │   │   │   └── ussd/
│   │   │   │       ├── UssdExecutor.kt
│   │   │   │       └── ResponseParser.kt
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/
│   │   │       ├── layout/
│   │   │       ├── values/
│   │   │       └── xml/
│   │   │           └── accessibility_service_config.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
├── build.gradle.kts
└── settings.gradle.kts
```

### 0.7 Key Dependencies (build.gradle.kts)
```kotlin
dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")

    // Architecture Components
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.0")

    // Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Background Work
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

## 1. Purpose & Responsibilities

The Android app serves a **single, focused role**:

> **Execute USSD transfer requests immediately when delivered by the backend.**

### Core Principle: Executor Only

The app is **NOT** a business logic layer. It is a **USSD execution agent**.

**App Responsibilities:**
- Receive transfer instructions from backend
- Execute USSD codes on the correct SIM card
- Parse carrier responses
- Report execution results back to backend

**App Does NOT:**
- Apply business logic or validation
- Calculate transfer limits or tiers
- Generate OTPs (backend handles this)
- Communicate with Telegram bot directly
- Make transfer decisions

## 2. Server URL Configuration

### First Launch Setup

On the app's first launch, the user must configure the server URL.

**Setup Flow:**
1. App detects no server URL is stored
2. Display configuration screen
3. User enters: `https://api.easytransfer.com`
4. App validates URL format
5. Store URL securely for all future communications

**Storage:**
- Save in encrypted SharedPreferences or Keystore
- Persist across app restarts
- Allow changing URL in settings (admin only)

**Validation:**
```kotlin
fun isValidServerUrl(url: String): Boolean {
    return url.startsWith("https://") && url.contains(".")
}
```

## 3. Login (Phone Number + OTP)

### Authentication Flow

The app uses a **two-step authentication** process:

#### Step 1: Phone Number Submission
1. User enters phone number in app
2. App sends to backend: `POST /api/android/auth/request-otp`
   ```json
   {
     "phone": "0912345678"
   }
   ```
3. Backend validates phone and sends OTP via **Telegram bot**
4. User receives OTP in their Telegram chat

#### Step 2: OTP Verification
1. User enters OTP in app
2. App sends to backend: `POST /api/android/auth/verify-otp`
   ```json
   {
     "phone": "0912345678",
     "otp": "123456"
   }
   ```
3. If valid, backend responds with:
   ```json
   {
     "access_token": "eyJhbGc...",
     "device_id": "device_abc123",
     "expires_in": 7776000,  // 90 days in seconds
     "user_id": "user_123"
   }
   ```

### Token Management

**Access Token:**
- Long-lived (1-3 months validity)
- Used for all authenticated API requests
- Stored securely in Android Keystore

**Device ID:**
- Unique identifier for this device
- Links this device to the user account
- Backend enforces: **One device per user** only

**Storage Requirements:**
```kotlin
// Store using Android Keystore or EncryptedSharedPreferences
secureStorage.save("access_token", token)
secureStorage.save("device_id", deviceId)
secureStorage.save("token_expiry", expiryTimestamp)
```

### Single Device Policy

- Each user can only have **one active device**
- If user logs in on a new device, the old device is automatically logged out
- Backend enforces this rule, not the app

## 4. Post-Login Configuration

After successful authentication, the user must configure two critical settings:

### A) SIM → Operator Mapping (Local Only)

**Purpose:** Map each physical SIM slot to its telecom operator.

**Why Local?** 
- The backend doesn't know which SIM card is in which slot
- The backend sends `operator` name (e.g., "SYRIATEL", "MTN")
- The app uses this mapping to select the correct SIM for execution

**Configuration UI:**
```
SIM 1: [Dropdown: None | Syriatel | MTN]
SIM 2: [Dropdown: None | Syriatel | MTN]
```

**Storage:**
```kotlin
// Store locally in preferences
preferences.save("sim1_operator", "SYRIATEL")
preferences.save("sim2_operator", "MTN")
```

**Execution Logic:**
```kotlin
fun getSIMSlotForOperator(operator: String): Int {
    return when (operator.uppercase()) {
        preferences.getString("sim1_operator") -> 0  // SIM slot 1
        preferences.getString("sim2_operator") -> 1  // SIM slot 2
        else -> -1  // No matching SIM
    }
}
```

### B) USSD Transfer Password

**Purpose:** Store the telecom operator's USSD transfer password.

**Security Requirements:**
- **MUST** be stored using Android Keystore or EncryptedSharedPreferences
- **NEVER** log this password
- **NEVER** include in error messages
- **NEVER** transmit to backend

**Storage:**
```kotlin
// Use EncryptedSharedPreferences
val encryptedPrefs = EncryptedSharedPreferences.create(...)
encryptedPrefs.edit()
    .putString("ussd_password", password)
    .apply()
```

**Usage:**
```kotlin
// Retrieve only when constructing USSD code
val password = encryptedPrefs.getString("ussd_password", "")
val ussdCode = "*150*1*${password}*1*${phone}*${phone}*${amount}#"
```

**UI Considerations:**
- Use password input field (masked)
- Show "eye" icon to toggle visibility
- Confirm password on initial setup
- Allow changing in settings (requires re-authentication)

## 5. Receiving and Executing Transfer Requests

### Near-Real-Time Requirement

The app must execute transfers **as soon as they are created** by the backend.

### Request Delivery Methods (Backend Decision)

The exact mechanism will be determined during backend design. Options:

**Option 1: WebSocket (Recommended)**
- Maintains persistent connection
- Instant delivery
- Low latency

**Option 2: Firebase Cloud Messaging (FCM)**
- Push notifications with data payload
- Works even when app is closed
- Reliable delivery

**Option 3: Fast Polling**
- Poll backend every 5-10 seconds
- Fallback option
- Higher battery usage

### Data Received for Each Request

Backend sends transfer instructions:

```json
{
  "request_id": "req_abc123",
  "phone_number": "0919876543",
  "amount": 50,
  "operator": "SYRIATEL",
  "ussd_pattern": "*150*1*{password}*1*{phone}*{phone}*{amount}#"  // Optional
}
```

**Fields:**
- `request_id`: Unique identifier for tracking
- `phone_number`: Recipient's phone number
- `amount`: Transfer amount
- `operator`: Telecom operator (SYRIATEL, MTN, etc.)
- `ussd_pattern`: Optional custom USSD code pattern

### Execution Flow

**Step-by-Step Process:**

1. **Receive Request**
   ```kotlin
   fun onTransferRequestReceived(request: TransferRequest) {
       // Validate request has all required fields
       if (!isValidRequest(request)) {
           reportError(request.requestId, "Invalid request data")
           return
       }
       
       executeTransfer(request)
   }
   ```

2. **Determine SIM Slot**
   ```kotlin
   val simSlot = getSIMSlotForOperator(request.operator)
   if (simSlot == -1) {
       reportError(request.requestId, "No SIM found for operator ${request.operator}")
       return
   }
   ```

3. **Construct USSD Code**
   ```kotlin
   val password = getStoredPassword()
   val ussdCode = if (request.ussdPattern != null) {
       // Use custom pattern if provided
       request.ussdPattern
           .replace("{password}", password)
           .replace("{phone}", request.phoneNumber)
           .replace("{amount}", request.amount.toString())
   } else {
       // Use default Syriatel pattern
       "*150*1*${password}*1*${request.phoneNumber}*${request.phoneNumber}*${request.amount}#"
   }
   ```

4. **Execute USSD**
   ```kotlin
   try {
       val response = executeUSSD(ussdCode, simSlot)
       parseAndReportResult(request.requestId, response)
   } catch (e: Exception) {
       reportError(request.requestId, e.message ?: "USSD execution failed")
   }
   ```

5. **Parse Carrier Response**
   ```kotlin
   fun parseAndReportResult(requestId: String, carrierResponse: String) {
       val status = if (isSuccessResponse(carrierResponse)) {
           "success"
       } else {
           "failed"
       }
       
       sendResultToBackend(requestId, status, carrierResponse)
   }
   
   fun isSuccessResponse(response: String): Boolean {
       // Pattern matching for success indicators
       // Examples (adjust based on actual carrier responses):
       return response.contains("نجح", ignoreCase = true) ||
              response.contains("تم", ignoreCase = true) ||
              response.contains("successful", ignoreCase = true)
   }
   ```

### USSD Code Construction Examples

**Default Syriatel Pattern:**
```
*150*1*PASSWORD*1*PHONE*PHONE*AMOUNT#
Example: *150*1*1234*1*0919876543*0919876543*50#
```

**MTN Pattern (if different):**
```
*135*PASSWORD*PHONE*AMOUNT#
Example: *135*1234*0919876543*50#
```

**Custom Pattern from Backend:**
```json
{
  "ussd_pattern": "*150*1*{password}*1*{phone}*{phone}*{amount}#"
}
```

## 6. Sending Execution Results Back to Backend

### Result Reporting

After USSD execution, immediately report results to backend:

**Endpoint:**
```
POST /api/android/transfers/result
Headers:
  Authorization: Bearer <access_token>
  X-Device-ID: <device_id>
```

**Request Body:**
```json
{
  "request_id": "req_abc123",
  "status": "success",  // or "failed"
  "message": "تم تنفيذ عملية التحويل بنجاح",  // Carrier response
  "executed_at": "2025-11-14T15:30:45Z"
}
```

### Backend Processing

Once backend receives the result:

1. Update transfer status in database
2. Send result to **Telegram bot**
3. Bot notifies the user who initiated the transfer

### Important Separation

**App NEVER:**
- Communicates directly with Telegram
- Notifies users directly
- Manages user-facing notifications

**Backend Always:**
- Receives results from app
- Coordinates with Telegram bot
- Manages all user notifications

### Result Flow Diagram
```
User Request → Backend → Android App (execute USSD)
                  ↑            ↓
                  └── Result ──┘
                  ↓
           Telegram Bot → User (notification)
```

## 7. Security Requirements

### Data Protection

**Access Token & Device ID:**
```kotlin
// Store in Android Keystore
val keyStore = KeyStore.getInstance("AndroidKeyStore")
// Or use EncryptedSharedPreferences (easier)
val encryptedPrefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build(),
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

**USSD Password:**
```kotlin
// MUST be encrypted - never store in plain text
// Use EncryptedSharedPreferences or Android Keystore
val password = encryptedPrefs.getString("ussd_password", "")
```

### Logging Best Practices

**Safe to Log:**
- Request received (with request_id only)
- USSD execution initiated
- Response status (success/failed)
- API call status codes
- Error types (not details)

**NEVER Log:**
- USSD password
- Full USSD code (contains password)
- Access tokens
- Full phone numbers (mask: `091234****`)
- Carrier response content (may contain sensitive info)
- Device ID in plain text

**Example Logging:**
```kotlin
// ✅ GOOD
Log.i(TAG, "Transfer request received: ${request.requestId}")
Log.i(TAG, "USSD execution completed: status=${status}")
Log.i(TAG, "Result reported to backend: ${response.code}")

// ❌ BAD
Log.d(TAG, "USSD code: ${ussdCode}")  // Contains password!
Log.d(TAG, "Password: ${password}")
Log.d(TAG, "Token: ${accessToken}")
Log.d(TAG, "Response: ${carrierResponse}")  // May contain sensitive info
```

### Network Security

**HTTPS Only:**
```kotlin
// Enforce HTTPS in all API calls
if (!serverUrl.startsWith("https://")) {
    throw SecurityException("Server URL must use HTTPS")
}
```

**Certificate Pinning (Optional but Recommended):**
```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.easytransfer.com", "sha256/AAAAAAAAAA...")
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

### Permissions

**Required Permissions:**
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<!-- For dual SIM support -->
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
```

**Runtime Permissions:**
- Request `CALL_PHONE` permission before USSD execution
- Handle permission denial gracefully
- Guide user to enable permissions

## 8. Error Handling

### Common Error Scenarios

**1. No Matching SIM for Operator**
```kotlin
if (simSlot == -1) {
    sendErrorToBackend(
        requestId = request.requestId,
        error = "NO_SIM_CONFIGURED",
        message = "No SIM configured for operator ${request.operator}"
    )
}
```

**2. USSD Permission Denied**
```kotlin
if (!hasCallPermission()) {
    sendErrorToBackend(
        requestId = request.requestId,
        error = "PERMISSION_DENIED",
        message = "CALL_PHONE permission not granted"
    )
}
```

**3. Network Unreachable**
```kotlin
try {
    sendResultToBackend(...)
} catch (e: IOException) {
    // Queue for retry
    queueForRetry(result)
    Log.e(TAG, "Failed to send result, will retry: ${e.message}")
}
```

**4. Invalid USSD Response**
```kotlin
if (response.isEmpty() || response.contains("error", ignoreCase = true)) {
    sendResultToBackend(
        requestId = request.requestId,
        status = "failed",
        message = response.ifEmpty { "No response from carrier" }
    )
}
```

### Retry Logic

**For Result Reporting:**
```kotlin
class ResultRetryQueue {
    private val maxRetries = 3
    private val retryDelay = 5000L  // 5 seconds
    
    fun queueForRetry(result: TransferResult) {
        // Store locally
        // Retry with exponential backoff
        // Remove after max retries or success
    }
}
```

## 9. App States & Lifecycle

### App States

**1. Not Configured**
- No server URL set
- Show configuration screen

**2. Not Authenticated**
- Server URL set, but no valid token
- Show login screen

**3. Not Configured (Post-Auth)**
- Authenticated, but SIM mapping or password not set
- Show configuration screen

**4. Ready**
- Fully configured and authenticated
- Listening for transfer requests
- Show status dashboard

**5. Executing**
- Currently executing a USSD transfer
- Show progress indicator
- Queue new requests

### Background Execution

**Requirements:**
- App must work even when in background
- Use Foreground Service for USSD execution
- Show persistent notification during active session

**Foreground Service:**
```kotlin
class TransferExecutionService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        // Listen for transfer requests
        // Execute USSD codes
        
        return START_STICKY
    }
    
    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EasyTransfer Active")
            .setContentText("Ready to process transfers")
            .setSmallIcon(R.drawable.ic_transfer)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
```

## 10. UI/UX Considerations

### Minimal UI Design

The app is **not user-facing** for regular users. It's an **agent** for executing transfers.

**Required Screens:**
1. **Configuration** - Server URL, SIM mapping, password
2. **Login** - Phone number and OTP entry
3. **Status Dashboard** - Show active status, recent transfers, connection health
4. **Settings** - Change configuration (requires re-auth for sensitive changes)

**Status Dashboard Elements:**
- Connection status (Connected / Disconnected)
- Last transfer executed time
- Number of pending requests
- Today's transfer count
- Error count

### User Notifications

**When to Notify User:**
- Transfer execution started
- Transfer completed successfully
- Transfer failed
- Connection lost
- Configuration required
- Error requiring attention

**Notification Channels:**
```kotlin
// Create notification channels
val channelId = "transfer_execution"
val channel = NotificationChannel(
    channelId,
    "Transfer Execution",
    NotificationManager.IMPORTANCE_HIGH
)
notificationManager.createNotificationChannel(channel)
```

## 11. API Endpoints Summary

### Authentication
- `POST /api/android/auth/request-otp` - Request OTP via Telegram
- `POST /api/android/auth/verify-otp` - Verify OTP and get access token
- `POST /api/android/auth/refresh-token` - Refresh access token
- `POST /api/android/auth/logout` - Invalidate token and device

### Transfer Execution
- `GET /api/android/transfers/pending` - Get pending transfers (polling)
- `WebSocket /api/android/transfers/stream` - Real-time transfer stream (WebSocket)
- `POST /api/android/transfers/result` - Report execution result

### Configuration
- `GET /api/android/config` - Get app configuration (optional)
- `GET /api/android/status` - Health check

## 12. Implementation Checklist

### Phase 1: Core Setup
- [ ] Create Android project (Kotlin recommended)
- [ ] Set up HTTPS networking (Retrofit/OkHttp)
- [ ] Implement secure storage (EncryptedSharedPreferences)
- [ ] Create server URL configuration screen

### Phase 2: Authentication
- [ ] Implement phone number login screen
- [ ] Create OTP entry screen
- [ ] Integrate with backend auth endpoints
- [ ] Store access token and device ID securely
- [ ] Handle token expiration and refresh

### Phase 3: Configuration
- [ ] Create SIM mapping configuration UI
- [ ] Implement USSD password input (encrypted storage)
- [ ] Validate configuration completeness
- [ ] Allow editing configuration in settings

### Phase 4: Transfer Execution
- [ ] Implement request receiving mechanism (WebSocket/FCM/Polling)
- [ ] Create USSD execution logic with dual SIM support
- [ ] Implement carrier response parsing
- [ ] Build result reporting to backend
- [ ] Add retry logic for failed API calls

### Phase 5: Background & Lifecycle
- [ ] Implement Foreground Service
- [ ] Handle app states and transitions
- [ ] Create persistent notification
- [ ] Test background execution
- [ ] Handle device reboot (optional auto-start)

### Phase 6: Security & Error Handling
- [ ] Audit all logging for sensitive data
- [ ] Implement certificate pinning
- [ ] Add comprehensive error handling
- [ ] Test permission requests
- [ ] Security review

### Phase 7: Polish
- [ ] Create status dashboard UI
- [ ] Implement user notifications
- [ ] Add settings screen
- [ ] Test with real USSD codes
- [ ] Performance optimization

## 13. Testing Requirements

### Unit Tests
- USSD code construction logic
- SIM slot selection logic
- Response parsing logic
- Token management

### Integration Tests
- Backend API integration
- USSD execution (with test codes)
- Result reporting
- Error handling

### Manual Tests
- Full authentication flow
- Configuration changes
- Transfer execution on both SIMs
- Background execution
- Network interruption handling
- Token expiration handling

## 14. Technology Recommendations

### Recommended Stack
- **Language**: Kotlin
- **Networking**: Retrofit + OkHttp
- **JSON Parsing**: Kotlinx Serialization or Gson
- **Secure Storage**: EncryptedSharedPreferences (Jetpack Security)
- **Real-time**: WebSocket (OkHttp) or Firebase Cloud Messaging
- **Background**: Foreground Service + WorkManager for retries
- **UI**: Jetpack Compose or XML layouts

### Dependencies (build.gradle)
```gradle
dependencies {
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    
    // Security
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    
    // Real-time (WebSocket)
    implementation 'com.squareup.okhttp3:okhttp-ws:4.11.0'
    
    // Or Firebase Cloud Messaging
    implementation 'com.google.firebase:firebase-messaging:23.3.1'
    
    // WorkManager for retries
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
}
```

## 15. Production Considerations

### Battery Optimization
- Request exemption from battery optimization for foreground service
- Use efficient polling intervals if using polling
- Prefer WebSocket or FCM over polling

### Data Usage
- Minimize API calls
- Use compression where possible
- Cache configuration data

### Device Compatibility
- Test on various Android versions (minimum API 24 / Android 7.0)
- Handle dual SIM on different manufacturers (Samsung, Xiaomi, etc.)
- Test USSD execution across different carriers

### Monitoring & Analytics
- Track execution success/failure rates
- Monitor API response times
- Log critical errors (without sensitive data)
- Optional: Crashlytics integration
