# Android App Implementation Tasks

**Project**: EasyTransfer 2.0 Android App  
**Language**: Kotlin  
**Architecture**: MVVM  
**Status**: In Progress  
**Last Updated**: November 16, 2025  
**Current Phase**: Authentication System (Task 3)  
**Overall Progress**: 20% (2/10 tasks complete)

---

## Task Tracking Legend

- [ ] Not Started
- [⏳] In Progress
- [✅] Completed
- [⚠️] Blocked
- [🔄] Under Review

---

## Task 1: Project Setup & Core Architecture
**Status**: [✅] Completed (November 16, 2025)  
**Priority**: Critical (Foundation)  
**Estimated Effort**: Medium  
**Actual Effort**: Medium  
**Completed By**: Implementation Team

### Description
Initialize the Android project with Kotlin, MVVM architecture, and all necessary dependencies (Retrofit, OkHttp, Moshi, EncryptedSharedPreferences, WorkManager). Set up the project structure with proper packages (ui, data, services, ussd) following MVVM pattern. Configure build.gradle with required dependencies for networking, security, and background execution. Create base classes for ViewModels, Activities, and data models. Set up proper Android SDK versions (minimum API 23, target API 34).

### Deliverables
- [x] Android project initialized with Kotlin
- [x] MVVM architecture structure (ui/, data/, services/, ussd/)
- [x] build.gradle.kts with all dependencies (Retrofit, OkHttp, Moshi, Security, WorkManager)
- [x] Base ViewModel and Activity classes
- [x] AndroidManifest.xml with required permissions
- [x] ProGuard rules for production
- [x] Minimum SDK 23, Target SDK 34
- [x] Material Design 3 theme setup
- [x] Resource files (strings.xml, colors.xml, themes.xml)
- [x] **Runtime Permissions System** (Bonus)
  - [x] PermissionUtils with comprehensive permission management
  - [x] PermissionsScreen (Material Design 3 Compose UI)
  - [x] PermissionsViewModel (StateFlow-based state management)
  - [x] MainActivity integration with lifecycle handling
  - [x] Permission request flows (grant/deny/settings navigation)

### Acceptance Criteria
- ✅ Project compiles successfully
- ✅ All dependencies resolved
- ✅ MVVM package structure created
- ✅ Required permissions declared in manifest
- ✅ Base architecture classes ready for use
- ✅ No build errors or warnings
- ✅ **BUILD SUCCESSFUL** - Verified November 16, 2025

### Implementation Details
- **Build System**: Gradle 8.13 with Kotlin DSL
- **Compose**: Material Design 3 with Jetpack Compose
- **Architecture**: MVVM with StateFlow for reactive state
- **Security**: EncryptedSharedPreferences with AES256_GCM
- **Permissions**: All dangerous permissions handled properly

### Documentation
- ✅ `docs/RUNTIME_PERMISSIONS_IMPLEMENTATION.md`
- ✅ `docs/RUNTIME_PERMISSIONS_COMPLETION.md`

### Notes
- ✅ Using Kotlin coroutines for async operations
- ✅ Following Android best practices and architecture guidelines
- ✅ ProGuard rules configured
- ✅ R8 optimization enabled for production builds
- ✅ BuildConfig generation enabled

---

## Task 2: Secure Storage & Configuration Management
**Status**: [✅] Completed (November 16, 2025)  
**Priority**: Critical  
**Estimated Effort**: Medium  
**Actual Effort**: Medium  
**Completed By**: Implementation Team

### Description
Implement secure storage using EncryptedSharedPreferences for sensitive data (USSD password, access token, device ID). Create a SecureStorage class that handles encryption/decryption using Android Keystore with AES256_GCM. Build configuration management for server URL, SIM-to-operator mapping (local storage), and user preferences. Ensure USSD password and tokens are NEVER stored in plain text. Create a configuration screen where users can set server URL, map SIM slots to operators (Syriatel/MTN), and enter USSD password with masked input.

### Deliverables
- [x] SecureStorage class using EncryptedSharedPreferences
- [x] Android Keystore integration (AES256_GCM)
- [x] Save/retrieve methods for: USSD password, access token, device ID
- [x] Configuration storage for: server URL, SIM1/SIM2 operator mapping
- [x] Configuration UI screen with server URL input
- [x] SIM-to-operator mapping UI (dropdowns for SIM1/SIM2)
- [x] USSD password input with mask/unmask toggle
- [x] Validation for server URL (HTTPS enforcement)
- [x] ConfigViewModel for state management
- [x] **Additional Features**:
  - [x] ConfigScreen with Material Design 3 Compose UI
  - [x] Real-time field validation with error messages
  - [x] Multi-screen navigation (Permissions → Config → Login)
  - [x] Success confirmation screen
  - [x] Loading states during save operations

### Acceptance Criteria
- ✅ USSD password stored encrypted, never in plain text
- ✅ Access token and device ID stored encrypted
- ✅ Server URL validated (HTTPS only)
- ✅ SIM mapping persisted locally
- ✅ Configuration UI allows editing all settings
- ✅ Encrypted data survives app restart
- ✅ No sensitive data exposed in logs
- ✅ **BUILD SUCCESSFUL** - Verified November 16, 2025

### Implementation Details
- **SecureStorage**: `data/storage/SecureStorage.kt`
  - EncryptedSharedPreferences with MasterKey
  - AES256_GCM encryption scheme
  - Methods for password, token, device ID
- **LocalPreferences**: `data/storage/LocalPreferences.kt`
  - Plain SharedPreferences for non-sensitive data
  - Server URL, SIM mappings, app settings
- **ConfigViewModel**: `ui/config/ConfigViewModel.kt`
  - StateFlow-based state management
  - Real-time validation logic
  - Integration with storage classes
- **ConfigScreen**: `ui/config/ConfigScreen.kt`
  - Material Design 3 card-based layout
  - Server URL input with HTTPS validation
  - SIM operator dropdowns (Syriatel/MTN/Not Used)
  - Password input with show/hide toggle
  - Loading and success states

### Security Features
- ✅ USSD password encrypted with AES256_GCM
- ✅ HTTPS enforcement for server URLs
- ✅ Password masking by default
- ✅ No password pre-fill for security
- ✅ Password never logged
- ✅ Validation prevents insecure configurations

### Documentation
- ✅ `docs/CONFIGURATION_SCREEN_IMPLEMENTATION.md`
- ✅ `docs/CONFIGURATION_SCREEN_COMPLETION.md`

### Notes
- ✅ Using MasterKey with AES256_GCM scheme
- ✅ NEVER logs USSD password or tokens
- ✅ Enforces HTTPS for server URL
- ✅ Clear UI labels and descriptions for all fields
- ✅ Existing password detection (optional update)

---

## Task 3: Authentication System (Phone + OTP)
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Implement two-step authentication flow: phone number submission and OTP verification. Create login UI screens for phone input and OTP entry. Build API client using Retrofit to communicate with backend authentication endpoints (request-otp, verify-otp). Handle OTP delivery via Telegram (backend sends OTP to user's Telegram). Store access token (1-3 months validity) and device ID securely after successful authentication. Implement token expiration handling and logout functionality. Ensure single device policy is respected (backend revokes old device on new login).

### Deliverables
- [ ] LoginActivity with phone number input screen
- [ ] OTP entry screen with 6-digit input
- [ ] LoginViewModel for authentication state management
- [ ] Retrofit ApiService with auth endpoints (request-otp, verify-otp, logout)
- [ ] Phone number validation (digits only, proper format)
- [ ] OTP request API call implementation
- [ ] OTP verification API call implementation
- [ ] Token storage (access_token, device_id, expires_in)
- [ ] Token expiration detection and handling
- [ ] Logout functionality (token invalidation)
- [ ] Error handling for auth failures
- [ ] Loading states and user feedback

### Acceptance Criteria
- User can enter phone number and request OTP
- Backend sends OTP via Telegram (user receives in Telegram chat)
- User can enter OTP and verify
- Valid OTP returns access token and device ID
- Tokens stored securely in EncryptedSharedPreferences
- Token expiration handled gracefully (re-login prompt)
- Logout invalidates token on backend
- Clear error messages for failed authentication

### Notes
- Access token validity: 1-3 months (backend decides)
- Backend enforces one device per user (old device logged out)
- Use Bearer token authentication for API calls
- Display clear Arabic messages for errors

---

## Task 4: Backend API Client & Network Layer
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Create a centralized AndroidApiClient using Retrofit and OkHttp for all backend communication. Implement Bearer token authentication interceptor that adds access token to all requests. Build data models for API requests/responses (TransferJob, AuthResponse, ResultReport) using Moshi for JSON parsing. Configure OkHttp with timeouts, logging interceptor (safe logs only), and optional certificate pinning for security. Implement error handling for network failures, timeouts, and HTTP errors. Create repository classes to abstract API calls from ViewModels.

### Deliverables
- [ ] AndroidApiClient singleton with Retrofit
- [ ] OkHttp client configuration (timeouts, interceptors)
- [ ] Bearer token authentication interceptor
- [ ] Logging interceptor (safe data only, no tokens/passwords)
- [ ] Moshi JSON converters
- [ ] Data models: TransferJob, AuthResponse, ResultReport, OperatorRules
- [ ] ApiService interface with all endpoints
- [ ] Repository classes for data access abstraction
- [ ] Error handling for network failures
- [ ] HTTPS enforcement validation
- [ ] Optional: Certificate pinning configuration

### Acceptance Criteria
- All API calls use Bearer token authentication
- Access token automatically added to request headers
- Network errors handled gracefully with retries
- Timeouts configured properly
- Logging does NOT expose tokens, passwords, or USSD codes
- Certificate pinning works (if enabled)
- Repository pattern cleanly abstracts API calls

### Notes
- Add "Authorization: Bearer <token>" header automatically
- Add "X-Device-ID: <device_id>" header to requests
- Use OkHttp logging interceptor for debugging (disable in production)
- NEVER log full request bodies (may contain sensitive data)

---

## Task 5: Job Polling & Short Polling Strategy
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Implement short polling mechanism (3-5 seconds interval) to fetch pending transfer jobs from backend. Create a Foreground Service (TransferExecutorService) that runs continuously, polling for jobs and executing them. Configure polling with adaptive intervals (3s when jobs present, 5s when idle, 10s on errors). Implement job queue management to handle multiple pending transfers. Integrate polling service with USSD executor to process jobs immediately upon receipt. Show persistent notification to keep foreground service alive. Handle service lifecycle (start, stop, restart on device reboot).

### Deliverables
- [ ] TransferExecutorService (Foreground Service)
- [ ] Polling logic with coroutines (3-5s interval)
- [ ] Adaptive polling interval (fast when active, slow when idle)
- [ ] Job polling endpoint integration (GET /android/jobs/pending)
- [ ] Job queue management for multiple pending transfers
- [ ] Persistent notification for foreground service
- [ ] Service start/stop control from UI
- [ ] Service restart on device reboot (optional)
- [ ] Job execution trigger on poll success
- [ ] Error handling for polling failures (backoff strategy)

### Acceptance Criteria
- Foreground service runs continuously with notification
- Polls backend every 3-5 seconds for pending jobs
- Jobs received are queued and executed in order
- Polling interval adapts based on activity (fast/slow)
- Service survives app backgrounding
- Service restarts on device reboot (if enabled)
- Polling failures trigger exponential backoff
- Service can be started/stopped from UI

### Notes
- Use START_STICKY to restart service if killed
- Show low-priority notification to avoid disturbing user
- Consider WorkManager for retry logic on failures
- Test background execution with battery optimization

---

## Task 6: USSD Execution Engine & Dual SIM Support
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Implement USSD execution logic using Telephony Intent (ACTION_CALL with USSD code). Build USSD code construction from transfer job data (phone, amount) and stored USSD password. Implement dual SIM support using TelecomManager to select correct SIM slot based on operator. Create Accessibility Service to automatically parse USSD response dialogs from carrier. Implement response parsing to determine success/failure based on carrier message patterns. Handle CALL_PHONE runtime permission requests and edge cases (no SIM, no matching SIM, permission denied).

### Deliverables
- [ ] UssdExecutor class for USSD execution
- [ ] USSD code construction logic (pattern: *150*1*{password}*1*{phone}*{phone}*{amount}#)
- [ ] Dual SIM support (TelecomManager for slot selection)
- [ ] SIM slot selection based on operator mapping
- [ ] Telephony Intent with ACTION_CALL implementation
- [ ] Accessibility Service for response parsing
- [ ] Response parser with success/failure detection
- [ ] CALL_PHONE runtime permission handling
- [ ] Error handling: no SIM, no matching SIM, permission denied
- [ ] USSD response capture and storage
- [ ] Integration with job executor

### Acceptance Criteria
- USSD code correctly constructed from job data and password
- Correct SIM slot selected based on operator
- USSD code executed via Telephony Intent
- Accessibility Service captures carrier response
- Response parsed correctly (success/failed detection)
- CALL_PHONE permission requested before execution
- No matching SIM error reported to backend
- USSD password NEVER logged
- Full USSD code NEVER logged (contains password)

### Notes
- USSD code format: *150*1*PASSWORD*1*PHONE*PHONE*AMOUNT#
- Use putExtra("com.android.phone.extra.slot", slotId) for dual SIM
- Accessibility Service requires user to enable in settings
- Guide user to enable accessibility service on first run
- NEVER log the full USSD code (contains password)

---

## Task 7: Operator Rules & Response Parsing
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Implement operator-specific message rules system to parse USSD responses from different carriers (Syriatel, MTN). Fetch operator rules from backend on app startup and cache locally. Build response parser that uses success/failure keywords from rules to determine transfer outcome. Implement rules versioning to detect when backend rules are updated and refresh local cache. Store rules in local preferences for offline fallback. Handle multiple languages in carrier responses (Arabic, English).

### Deliverables
- [ ] Operator rules fetch endpoint integration (GET /android/rules)
- [ ] Rules caching in local storage
- [ ] Rules last-updated check endpoint (GET /android/rules/last-updated)
- [ ] Response parser using rules (success/failure keyword matching)
- [ ] Rules versioning and update detection
- [ ] Multi-language support (Arabic, English keywords)
- [ ] Offline fallback to cached rules
- [ ] Default rules if backend unavailable

### Acceptance Criteria
- Operator rules fetched from backend on startup
- Rules cached locally and persist across restarts
- Response parser correctly identifies success/failure using rules
- Rules updated when backend version changes
- Parser handles Arabic and English responses
- Works offline with cached rules

### Notes
- Cache rules for offline operation
- Default to conservative parsing (assume failure if unclear)
- Log parsing results for debugging (without sensitive data)
- Consider adding rule validation

---

## Task 8: Result Reporting & Backend Communication
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Implement result reporting system that sends transfer execution outcomes to backend immediately after USSD execution. Build retry queue with exponential backoff for failed result reports. Create result models with request ID, status (success/failed), carrier message, and execution timestamp. Implement WorkManager for reliable retry delivery even if app is closed. Handle network failures gracefully by queuing results locally and retrying. Ensure results are reported exactly once (deduplication). Log all reporting attempts without exposing sensitive data.

### Deliverables
- [ ] Result reporting endpoint integration (POST /android/transfers/result)
- [ ] Result model with: request_id, status, message, executed_at
- [ ] Immediate result reporting after USSD execution
- [ ] Retry queue for failed reports
- [ ] WorkManager integration for reliable delivery
- [ ] Exponential backoff retry strategy
- [ ] Result deduplication (avoid duplicate reports)
- [ ] Network error handling with local queueing
- [ ] Success/failure result tracking
- [ ] Logging without sensitive data

### Acceptance Criteria
- Results reported immediately after execution
- Failed reports queued and retried with backoff
- WorkManager ensures delivery even if app closed
- No duplicate result reports sent
- Network failures handled gracefully
- Retry queue persists across app restarts
- All reporting attempts logged safely

### Notes
- Use WorkManager for guaranteed delivery
- Implement exponential backoff (5s, 10s, 30s, 60s)
- Store pending results in local database or preferences
- Remove from queue after successful delivery
- NEVER log carrier response content (may be sensitive)

---

## Task 9: UI/UX - Status Dashboard & User Feedback
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Medium

### Description
Build minimal but informative UI for monitoring app status and activity. Create status dashboard showing connection status, last transfer time, pending job count, and daily transfer statistics. Implement user notifications for key events (transfer started, completed, failed, connection lost). Build settings screen for changing configuration (server URL, SIM mapping, password) with re-authentication requirement for sensitive changes. Create onboarding flow guiding users through initial setup (server URL, SIM mapping, USSD password, accessibility service). Add Arabic language support for all UI elements.

### Deliverables
- [ ] MainActivity with status dashboard
- [ ] Connection status indicator (Connected/Disconnected)
- [ ] Last transfer timestamp display
- [ ] Pending jobs count
- [ ] Daily transfer statistics
- [ ] User notifications for key events
- [ ] Notification channels (transfer execution, errors, service status)
- [ ] Settings screen for configuration changes
- [ ] Re-authentication for sensitive settings
- [ ] Onboarding flow for first-time setup
- [ ] Accessibility service enable prompt
- [ ] Arabic language support (strings.xml)

### Acceptance Criteria
- Dashboard shows real-time connection status
- Transfer statistics updated correctly
- Notifications shown for important events
- Settings allow changing server URL, SIM mapping, password
- Sensitive settings require re-authentication
- Onboarding guides new users through setup
- User prompted to enable accessibility service
- All UI text in Arabic

### Notes
- Keep UI minimal and functional (not consumer-facing)
- Use Material Design 3 components
- Ensure RTL layout support for Arabic
- Show clear error messages for configuration issues
- Guide users to enable accessibility service (required for USSD parsing)

---

## Task 10: Security Hardening, Logging & Testing
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Conduct comprehensive security audit of the entire application. Ensure all sensitive data (USSD password, tokens, USSD codes) are encrypted and never logged. Implement safe logging that excludes passwords, tokens, full phone numbers, and carrier responses. Add certificate pinning for backend API (optional but recommended). Review all permissions and request only necessary ones. Implement runtime permission handling with clear explanations. Test USSD execution on real devices with actual carrier networks (Syriatel, MTN). Verify dual SIM functionality across different manufacturers. Test foreground service background execution and battery optimization scenarios. Document security best practices and testing results.

### Deliverables
- [ ] Security audit of all code (no plain text sensitive data)
- [ ] Safe logging implementation (no passwords, tokens, USSD codes)
- [ ] Phone number masking in logs (091234****)
- [ ] Certificate pinning implementation (optional)
- [ ] Runtime permission handling with user education
- [ ] Unit tests for USSD construction, SIM selection, response parsing
- [ ] Integration tests for API communication
- [ ] Manual testing on real devices (Syriatel, MTN)
- [ ] Dual SIM testing (different manufacturers)
- [ ] Foreground service background execution tests
- [ ] Battery optimization exemption request
- [ ] Security documentation

### Acceptance Criteria
- No sensitive data in logs (audit complete)
- USSD password NEVER logged
- Full USSD codes NEVER logged
- Access tokens NEVER logged
- Phone numbers masked in logs
- Certificate pinning working (if enabled)
- All permissions properly requested and explained
- USSD execution tested on real networks
- Dual SIM works on multiple device manufacturers
- Foreground service survives backgrounding
- Battery optimization handled
- Security best practices documented

### Notes
- Review ALL log statements for sensitive data
- Use masked logging: Log.i(TAG, "Transfer for 091234****")
- NEVER log: password, token, full USSD code, carrier response
- Test on Samsung, Xiaomi, Huawei devices (different dual SIM implementations)
- Request battery optimization exemption for foreground service
- Document all security measures and test results

---

## Overall Progress

**Total Tasks**: 10  
**Completed**: 0  
**In Progress**: 0  
**Not Started**: 10  
**Blocked**: 0  

**Overall Completion**: 0%

---

## Implementation Order (Recommended)

1. **Task 1** - Project Setup & Core Architecture (Foundation)
2. **Task 2** - Secure Storage & Configuration Management (Security Foundation)
3. **Task 4** - Backend API Client & Network Layer (Infrastructure)
4. **Task 3** - Authentication System (Phone + OTP) (User Access)
5. **Task 5** - Job Polling & Short Polling Strategy (Core Execution)
6. **Task 6** - USSD Execution Engine & Dual SIM Support (Core Execution)
7. **Task 7** - Operator Rules & Response Parsing (Enhancement)
8. **Task 8** - Result Reporting & Backend Communication (Core Execution)
9. **Task 9** - UI/UX - Status Dashboard & User Feedback (User Experience)
10. **Task 10** - Security Hardening, Logging & Testing (Quality Assurance)

---

## Dependencies Between Tasks

- Task 2 depends on Task 1 (needs project structure)
- Task 3 depends on Task 2, 4 (needs secure storage and API client)
- Task 4 depends on Task 1, 2 (needs project setup and secure storage for token)
- Task 5 depends on Task 3, 4 (needs auth and API client)
- Task 6 depends on Task 2 (needs USSD password from secure storage)
- Task 7 depends on Task 4 (needs API client)
- Task 8 depends on Task 4, 6 (needs API client and execution results)
- Task 9 depends on Task 3, 5, 6 (needs auth, polling, execution for status)
- Task 10 depends on all previous tasks (testing and security audit)

---

## Notes & Decisions

### Architecture Decisions
- MVVM pattern for clean separation of concerns
- Kotlin coroutines for async operations
- Foreground Service for continuous job polling
- Short polling (3-5s) for simplicity (WebSocket/FCM optional future enhancement)
- Repository pattern to abstract data access
- Single Activity with multiple fragments (optional)

### Security Considerations
- EncryptedSharedPreferences for all sensitive data
- Android Keystore for hardware-backed encryption
- HTTPS enforcement for all API calls
- Optional certificate pinning for production
- USSD password and tokens NEVER logged
- Phone numbers masked in logs
- Runtime permission requests with clear explanations

### USSD Execution Strategy
- Telephony Intent (ACTION_CALL) for USSD execution
- Accessibility Service for response parsing
- Dual SIM support via TelecomManager
- SIM-to-operator mapping stored locally (not in backend)
- USSD code pattern: *150*1*{password}*1*{phone}*{phone}*{amount}#

### Background Execution
- Foreground Service with persistent notification
- START_STICKY to restart if killed
- Optional: Auto-start on device reboot
- Battery optimization exemption required
- WorkManager for retry logic on failures

### Communication Patterns
- Short polling (3-5s interval) for job fetching
- Bearer token authentication for all API calls
- Device ID sent in headers for device tracking
- Result reporting with retry queue and exponential backoff
- Backend enforces one device per user (app respects this)

### Testing Strategy
- Unit tests for business logic (USSD construction, parsing)
- Integration tests for API communication
- Manual testing on real carrier networks (Syriatel, MTN)
- Dual SIM testing on multiple manufacturers
- Foreground service testing with battery optimization
- Security audit for sensitive data exposure

---

**Last Review**: November 15, 2025  
**Next Review**: TBD
