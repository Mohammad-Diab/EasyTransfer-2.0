# EasyTransfer Android App

**USSD Execution Agent for Money Transfers**

---

## 📱 Project Overview

Android application for executing USSD money transfers via Syriatel and MTN operators. Acts as an execution agent receiving transfer jobs from the backend and executing them via USSD codes.

**Technology**: Kotlin + Jetpack Compose + MVVM Architecture  
**Min SDK**: API 23 (Android 6.0)  
**Target SDK**: API 34 (Android 14)

---

## ✅ Current Implementation Status

### Completed Features

#### ✅ Runtime Permissions System (November 16, 2025)
- Comprehensive permission management
- Material Design 3 UI
- Handles all permission scenarios (grant, deny, permanent deny)
- Settings navigation for manually enabling permissions
- Lifecycle-aware permission checking

**Documentation**: [`docs/RUNTIME_PERMISSIONS_COMPLETION.md`](docs/RUNTIME_PERMISSIONS_COMPLETION.md)

#### ✅ Configuration Screen (November 16, 2025)
- Server URL configuration with HTTPS validation
- SIM card operator mapping (Syriatel/MTN)
- USSD password input with encryption
- Real-time validation and error handling
- Secure storage integration (LocalPreferences + SecureStorage)

**Documentation**: [`docs/CONFIGURATION_SCREEN_IMPLEMENTATION.md`](docs/CONFIGURATION_SCREEN_IMPLEMENTATION.md)

### In Progress

Currently ready to implement:
- [ ] Authentication System (Phone + OTP)
- [ ] USSD Execution Engine
- [ ] Job Polling Service

### Project Structure

```
app/
├── src/main/java/com/onevertix/easytransferagent/
│   ├── MainActivity.kt                    # ✅ Main entry with navigation
│   ├── ui/
│   │   ├── permissions/                   # ✅ Runtime permissions
│   │   │   ├── PermissionsScreen.kt
│   │   │   └── PermissionsViewModel.kt
│   │   ├── config/                        # ✅ Configuration screen
│   │   │   ├── ConfigScreen.kt
│   │   │   └── ConfigViewModel.kt
│   │   ├── theme/                         # ✅ Material Design 3
│   │   │   ├── Color.kt
│   │   │   ├── Theme.kt
│   │   │   └── Type.kt
│   │   └── base/
│   │       ├── BaseActivity.kt
│   │       └── BaseViewModel.kt
│   ├── data/
│   │   ├── api/
│   │   │   ├── ApiService.kt
│   │   │   └── RetrofitClient.kt
│   │   ├── models/
│   │   │   ├── AuthModels.kt
│   │   │   ├── ResultModels.kt
│   │   │   └── TransferJob.kt
│   │   └── storage/
│   │       ├── LocalPreferences.kt        # ✅ Non-sensitive storage
│   │       └── SecureStorage.kt           # ✅ Encrypted storage
│   ├── services/
│   │   └── TransferExecutorService.kt
│   ├── ussd/
│   │   └── UssdExecutor.kt
│   └── utils/
│       ├── Constants.kt
│       ├── Logger.kt
│       └── PermissionUtils.kt            # ✅ Enhanced permission utils
```

## Setup

To create the Android project, use Android Studio:

1. **Open Android Studio**
2. **Create New Project** → "Empty Activity"
3. **Project Settings:**
   - Name: `EasyTransfer`
   - Package: `com.easytransfer.android`
   - Language: `Kotlin`
   - Minimum SDK: `API 23 (Android 6.0)`
   - Build configuration: `Kotlin DSL (build.gradle.kts)`

4. **Add Dependencies** (see `build.gradle.kts` below)

5. **Configure Permissions** (see `AndroidManifest.xml` below)

## Project Structure

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
│   │   │       │   ├── activity_login.xml
│   │   │       │   ├── activity_config.xml
│   │   │       │   └── activity_main.xml
│   │   │       ├── values/
│   │   │       │   ├── strings.xml
│   │   │       │   ├── colors.xml
│   │   │       │   └── themes.xml
│   │   │       └── xml/
│   │   │           └── accessibility_service_config.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Key Files

### 1. `app/build.gradle.kts`

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.easytransfer.android"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.easytransfer.android"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    buildFeatures {
        viewBinding = true
    }
}

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

### 2. `AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.EasyTransfer">

        <!-- Main Activity -->
        <activity
            android:name=".ui.main.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Login Activity -->
        <activity android:name=".ui.login.LoginActivity" />

        <!-- Config Activity -->
        <activity android:name=".ui.config.ConfigActivity" />

        <!-- Foreground Service -->
        <service
            android:name=".services.TransferExecutorService"
            android:foregroundServiceType="dataSync" />

        <!-- Accessibility Service -->
        <service
            android:name=".services.UssdResponseAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>

</manifest>
```

### 3. `res/xml/accessibility_service_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100" />
```

## Implementation Guide

See the complete specification at `docs/android-app-spec.md` for:

- USSD execution architecture
- Foreground Service implementation
- Accessibility Service setup
- Secure storage patterns
- API integration
- Dual SIM support

## Building

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug
```

## Notes

- **Permissions**: App requires CALL_PHONE and Accessibility permissions
- **Background Execution**: Uses Foreground Service for continuous operation
- **Security**: All sensitive data stored in EncryptedSharedPreferences
- **USSD Parsing**: Requires Accessibility Service to be enabled by user

## Resources

- Android Developer Guide: https://developer.android.com/
- Kotlin Documentation: https://kotlinlang.org/docs/
- Material Design: https://material.io/
