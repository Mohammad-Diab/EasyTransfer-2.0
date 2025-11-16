# Production Deployment Guide - EasyTransfer Agent

**Date**: November 16, 2025  
**Version**: 1.0.0  
**Status**: Ready for Production

---

## Prerequisites

### Backend Requirements
- ✅ Backend API deployed and accessible
- ✅ HTTPS enabled with valid SSL certificate
- ✅ Authentication endpoints operational
- ✅ Job polling endpoints functional
- ✅ Result reporting endpoints ready
- ✅ Operator rules endpoints configured

### Android Requirements
- ✅ Android Studio installed
- ✅ JDK 17 or higher
- ✅ Android SDK 34 (target)
- ✅ Minimum SDK 24 (Android 7.0)
- ✅ Signing key generated

---

## 1. Build Configuration

### 1.1 Update build.gradle.kts

```kotlin
android {
    ...
    
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            
            // Signing configuration
            signingConfig = signingConfigs.getByName("release")
        }
    }
    
    signingConfigs {
        create("release") {
            storeFile = file("release-keystore.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
}
```

### 1.2 ProGuard Rules

Add to `proguard-rules.pro`:

```proguard
# Keep data models for Moshi
-keep class com.onevertix.easytransferagent.data.models.** { *; }

# Keep Retrofit interfaces
-keep interface com.onevertix.easytransferagent.data.api.** { *; }

# Keep ViewModel classes
-keep class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}

# Moshi
-keepclasseswithmembers class * {
    @com.squareup.moshi.* <methods>;
}

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

---

## 2. Generate Release Build

### 2.1 Create Signing Key

```bash
keytool -genkey -v -keystore release-keystore.jks \
  -alias easytransfer-release \
  -keyalg RSA -keysize 2048 -validity 10000

# Store passwords securely!
# KEYSTORE_PASSWORD=<your-password>
# KEY_ALIAS=easytransfer-release
# KEY_PASSWORD=<your-password>
```

### 2.2 Build Release APK

```bash
# Set environment variables
export KEYSTORE_PASSWORD=<your-password>
export KEY_ALIAS=easytransfer-release
export KEY_PASSWORD=<your-password>

# Build release
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

### 2.3 Verify APK

```bash
# Check signing
jarsigner -verify -verbose -certs app-release.apk

# Check zipalign
zipalign -c -v 4 app-release.apk
```

---

## 3. First-Time Setup

### 3.1 Install APK

```bash
# Install on device
adb install app-release.apk

# Or distribute via MDM/Email
```

### 3.2 Initial Configuration

**On Device**:

1. **Grant Permissions**:
   - Phone (CALL_PHONE, READ_PHONE_STATE)
   - Notifications

2. **Configure Server**:
   - Server URL: `https://api.easytransfer.com`
   - Must be HTTPS

3. **Configure SIM Cards**:
   - SIM 1: SYRIATEL
   - SIM 2: MTN
   - USSD Password: (agent's password)

4. **Login**:
   - Enter agent phone number
   - Receive OTP via Telegram
   - Enter OTP

5. **Start Service**:
   - Tap "Start Service" on dashboard
   - Service begins polling

---

## 4. Backend Configuration

### 4.1 Required Endpoints

```
Authentication:
POST /api/android/auth/request-otp
POST /api/android/auth/verify-otp
POST /api/android/auth/logout

Jobs:
GET /api/android/jobs/pending

Results:
POST /api/android/results/transfer
POST /api/android/results/balance

Rules:
GET /api/android/rules
GET /api/android/rules/version

Health:
GET /api/android/status
```

### 4.2 Operator Rules

**Configure in backend**:

```json
{
  "rules": [
    {
      "operator": "SYRIATEL",
      "version": 1,
      "success_keywords": [
        "نجحت العملية",
        "تمت العملية",
        "success",
        "successful"
      ],
      "failure_keywords": [
        "فشلت العملية",
        "خطأ",
        "رصيد غير كافي",
        "failed"
      ],
      "updated_at": "2025-11-16T00:00:00Z"
    },
    {
      "operator": "MTN",
      "version": 1,
      "success_keywords": [
        "تمت بنجاح",
        "نجحت",
        "success"
      ],
      "failure_keywords": [
        "فشل",
        "خطأ",
        "insufficient"
      ],
      "updated_at": "2025-11-16T00:00:00Z"
    }
  ],
  "version": 1
}
```

---

## 5. USSD Code Configuration

### 5.1 Syriatel Pattern

**Format**: `*150*1*{password}*1*{phone}*{phone}*{amount}#`

**Example**:
- Password: 1234
- Phone: 0991234567
- Amount: 1000
- Code: `*150*1*1234*1*0991234567*0991234567*1000#`

### 5.2 MTN Pattern

**Format**: `*135*{password}*{phone}*{amount}#`

**Example**:
- Password: 5678
- Phone: 0951234567
- Amount: 2000
- Code: `*135*5678*0951234567*2000#`

### 5.3 Balance Inquiry

**Syriatel**: `*150#`  
**MTN**: `*135#`

**Update Constants.kt if patterns change!**

---

## 6. Monitoring & Maintenance

### 6.1 Check Service Status

**On Device**:
- Dashboard shows "Connected" (green)
- Service status: "Service is running and polling for jobs"
- Statistics update in real-time

**Logs** (via adb logcat):
```bash
adb logcat -s TransferExecutorService UssdExecutor ResponseParser
```

### 6.2 Key Metrics

**Monitor**:
- Transfer success rate (should be >90%)
- Polling errors (should be minimal)
- Response parsing accuracy
- Network connectivity
- Battery usage

### 6.3 Common Issues

**Service Not Polling**:
- Check connection status
- Verify server URL (HTTPS)
- Check authentication (token valid)
- Review logs for errors

**USSD Not Executing**:
- Check CALL_PHONE permission
- Verify SIM card mapping
- Check USSD password configured
- Test with balance inquiry first

**Results Not Reporting**:
- Check network connectivity
- Verify backend endpoints operational
- Review SafeLoggingInterceptor output

---

## 7. Security Checklist

### 7.1 Pre-Deployment

- [x] USSD password encrypted
- [x] Access tokens encrypted
- [x] Safe logging implemented
- [x] HTTPS enforced
- [x] No hardcoded secrets
- [x] Permissions properly requested
- [x] ProGuard enabled (release)
- [ ] Certificate pinning (optional)

### 7.2 Device Security

**Recommendations**:
- Use devices with lock screen
- Enable device encryption
- Keep Android updated
- Avoid rooted devices
- Secure physical access

### 7.3 Operational Security

**Best Practices**:
- Rotate USSD passwords regularly
- Monitor for suspicious activity
- Limit agent access
- Audit transfer logs
- Backup configuration

---

## 8. Troubleshooting

### 8.1 Login Issues

**OTP Not Received**:
- Check phone number format (+9639XXXXXXXX)
- Verify backend sending OTP to Telegram
- Check Telegram bot operational

**Token Expired**:
- Re-login required (90 day expiry)
- Normal behavior
- Clear app data if stuck

### 8.2 Transfer Execution Issues

**Permission Denied**:
- Grant CALL_PHONE permission
- Re-install if permission stuck

**No SIM Found**:
- Check SIM card mapping in config
- Verify SIM cards inserted
- Operator must match config

**Wrong SIM Selected**:
- Review operator mapping
- SIM 1 → Operator in config
- Swap if needed

### 8.3 Polling Issues

**Not Receiving Jobs**:
- Check connection status
- Verify backend API operational
- Check auth token valid
- Review polling logs

**High Battery Usage**:
- Normal for foreground service
- Request battery optimization exemption
- Consider reducing polling frequency

---

## 9. Updates & Upgrades

### 9.1 App Updates

**Process**:
1. Build new release APK
2. Test on staging device
3. Deploy via MDM or manual install
4. Monitor for issues
5. Rollback if needed

### 9.2 Operator Rules Updates

**Automatic**:
- App fetches latest rules on service start
- Rules cached locally
- Version checking implemented

**Manual**:
- Clear app data to force refresh
- Or update backend rules version

### 9.3 Backend Updates

**Compatibility**:
- Maintain backward compatibility
- Version API endpoints if needed
- Test before deployment

---

## 10. Support & Contact

### 10.1 Technical Support

**For Issues**:
- Check logs first (adb logcat)
- Review this deployment guide
- Consult security audit report
- Contact backend team if API issues

### 10.2 Documentation

**Reference Docs**:
- Security Audit Report
- Implementation Tasks (complete history)
- API Documentation (backend team)
- This Deployment Guide

---

## 11. Success Criteria

**Deployment Successful When**:

✅ App installed on all agent devices  
✅ All agents authenticated  
✅ Services running and polling  
✅ Transfers executing successfully  
✅ Results reporting to backend  
✅ Statistics updating in real-time  
✅ No critical errors in logs  
✅ Battery usage acceptable  
✅ Network usage reasonable  

**Expected Performance**:
- Transfer success rate: >90%
- Polling reliability: >99%
- Response parsing accuracy: >95%
- Result reporting success: >98%

---

**Deployment Status**: ✅ READY FOR PRODUCTION

**Last Updated**: November 16, 2025  
**Version**: 1.0.0  
**Approved By**: Implementation Team

