# Testing Checklist - EasyTransfer Agent

**Date**: November 16, 2025  
**Version**: 1.0.0  
**Status**: Ready for Testing

---

## 1. Unit Testing

### 1.1 Validation Tests

**File**: `utils/Validation.kt`

- [ ] **isValidSyrianPhone()**
  - [ ] Valid: +9639XXXXXXXX (returns true)
  - [ ] Valid: 09XXXXXXXX (returns true)
  - [ ] Invalid: 08XXXXXXXX (returns false)
  - [ ] Invalid: +9638XXXXXXXX (returns false)
  - [ ] Invalid: too short (returns false)
  - [ ] Invalid: too long (returns false)

- [ ] **isValidOtp()**
  - [ ] Valid: 123456 (returns true)
  - [ ] Invalid: 12345 (returns false)
  - [ ] Invalid: abc123 (returns false)
  - [ ] Invalid: empty (returns false)

### 1.2 USSD Code Construction

**File**: `ussd/UssdExecutor.kt`

- [ ] **Syriatel Pattern**
  - [ ] Correct format: `*150*1*{pwd}*1*{ph}*{ph}*{amt}#`
  - [ ] Password inserted correctly
  - [ ] Phone duplicated correctly
  - [ ] Amount formatted correctly

- [ ] **MTN Pattern**
  - [ ] Correct format: `*135*{pwd}*{ph}*{amt}#`
  - [ ] Password inserted correctly
  - [ ] Phone inserted once
  - [ ] Amount formatted correctly

### 1.3 SIM Slot Selection

**File**: `ussd/UssdExecutor.kt`

- [ ] **getSIMSlotForOperator()**
  - [ ] SYRIATEL mapped to SIM1 → returns 0
  - [ ] MTN mapped to SIM2 → returns 1
  - [ ] Unknown operator → returns -1
  - [ ] Case insensitive (syriatel, SYRIATEL)

### 1.4 Response Parsing

**File**: `ussd/ResponseParser.kt`

- [ ] **Success Keywords**
  - [ ] Arabic: "نجحت العملية" → Success
  - [ ] Arabic: "تمت العملية" → Success
  - [ ] English: "success" → Success
  - [ ] English: "successful" → Success
  - [ ] Case insensitive matching

- [ ] **Failure Keywords**
  - [ ] Arabic: "فشل" → Failure
  - [ ] Arabic: "خطأ" → Failure
  - [ ] Arabic: "رصيد غير كافي" → Failure
  - [ ] English: "failed" → Failure
  - [ ] English: "insufficient balance" → Failure

- [ ] **Unknown Response**
  - [ ] No keywords matched → Unknown
  - [ ] Conservative approach (treat as failure)

### 1.5 Token Validation

**File**: `data/storage/SecureStorage.kt`

- [ ] **isTokenValid()**
  - [ ] Token not expired → true
  - [ ] Token expired → false
  - [ ] Token expiry with 120s skew
  - [ ] No token → false

---

## 2. Integration Testing

### 2.1 Authentication Flow

- [ ] **Request OTP**
  - [ ] Valid phone → OTP sent (200 OK)
  - [ ] Invalid phone → Error (400)
  - [ ] Backend unreachable → Network error

- [ ] **Verify OTP**
  - [ ] Correct OTP → Token received (200 OK)
  - [ ] Incorrect OTP → Error (401)
  - [ ] Expired OTP → Error (410)
  - [ ] Token stored encrypted
  - [ ] Device ID generated and stored

- [ ] **Logout**
  - [ ] Token invalidated on backend
  - [ ] Local token cleared
  - [ ] Return to login screen

### 2.2 Configuration

- [ ] **Server URL**
  - [ ] HTTPS URL → Accepted
  - [ ] HTTP URL → Rejected with error
  - [ ] Invalid URL → Rejected
  - [ ] URL saved to LocalPreferences

- [ ] **SIM Mapping**
  - [ ] SIM1 operator selected → Saved
  - [ ] SIM2 operator selected → Saved
  - [ ] Both required → Validation works

- [ ] **USSD Password**
  - [ ] Password entered → Saved encrypted
  - [ ] Password retrieved → Decrypted correctly
  - [ ] Never logged

### 2.3 Job Polling

- [ ] **Service Start**
  - [ ] Service starts successfully
  - [ ] Foreground notification appears
  - [ ] Polling begins (check logs)

- [ ] **Polling Behavior**
  - [ ] Polls every 5s initially
  - [ ] Jobs received → 3s interval
  - [ ] No jobs → 5s interval
  - [ ] Error → Exponential backoff (5s, 10s, 20s, 30s)
  - [ ] Success after error → Reset to 5s

- [ ] **Service Stop**
  - [ ] Service stops cleanly
  - [ ] Notification removed
  - [ ] Polling stops

### 2.4 USSD Execution

- [ ] **Permission Checks**
  - [ ] CALL_PHONE granted → Executes
  - [ ] CALL_PHONE denied → Error returned
  - [ ] Error message clear

- [ ] **SIM Selection**
  - [ ] Syriatel job → SIM slot 0 used
  - [ ] MTN job → SIM slot 1 used
  - [ ] Unknown operator → Error
  - [ ] No matching SIM → Error

- [ ] **Code Execution**
  - [ ] USSD code constructed correctly
  - [ ] Intent.ACTION_CALL launched
  - [ ] PhoneAccountHandle used (modern)
  - [ ] Legacy extras fallback works

### 2.5 Response Parsing

- [ ] **Success Response**
  - [ ] Keywords matched → ParseResult.Success
  - [ ] Status "success" reported
  - [ ] Carrier message preserved

- [ ] **Failure Response**
  - [ ] Keywords matched → ParseResult.Failure
  - [ ] Status "failed" reported
  - [ ] Error message preserved

- [ ] **Unknown Response**
  - [ ] No keywords → ParseResult.Unknown
  - [ ] Status "unknown" reported
  - [ ] Conservative handling

### 2.6 Result Reporting

- [ ] **Transfer Result**
  - [ ] Success → POST to backend (200 OK)
  - [ ] Failed → POST to backend (200 OK)
  - [ ] Unknown → POST to backend (200 OK)
  - [ ] Error → POST with error status
  - [ ] Network error → Logged (TODO: retry)

- [ ] **Balance Result**
  - [ ] Success → POST to backend
  - [ ] Balance extracted correctly
  - [ ] Operator included

---

## 3. Manual Testing on Device

### 3.1 Initial Setup

- [ ] **Fresh Install**
  - [ ] Permissions screen appears
  - [ ] All permissions listed clearly
  - [ ] Grant permissions one-by-one

- [ ] **Configuration Screen**
  - [ ] Server URL input works
  - [ ] HTTPS validation works
  - [ ] SIM mapping dropdowns work
  - [ ] USSD password input masked
  - [ ] Save button enables after all fields

- [ ] **Login Screen**
  - [ ] Phone number input works
  - [ ] Syrian format validation
  - [ ] Request OTP button enables
  - [ ] Loading state shows

- [ ] **OTP Screen**
  - [ ] 6-digit input works
  - [ ] Verify button enables
  - [ ] Countdown timer shows
  - [ ] Resend OTP works

- [ ] **Dashboard**
  - [ ] Loads successfully
  - [ ] Service status shows
  - [ ] Start/Stop service works

### 3.2 Service Operation

- [ ] **Start Service**
  - [ ] Notification appears
  - [ ] Dashboard shows "Service is running"
  - [ ] Logs show polling started

- [ ] **Job Execution** (with test job)
  - [ ] Job received from backend
  - [ ] USSD dialog appears
  - [ ] Carrier response shown
  - [ ] Result reported to backend
  - [ ] Dashboard stats update

- [ ] **Stop Service**
  - [ ] Service stops cleanly
  - [ ] Notification removed
  - [ ] Dashboard updates

### 3.3 Real Carrier Testing

**⚠️ CRITICAL - Test with REAL SIM cards**

- [ ] **Syriatel Transfer**
  - [ ] Insert Syriatel SIM in slot 1
  - [ ] Execute small transfer (100 SYP)
  - [ ] USSD code accepted by carrier
  - [ ] Response captured
  - [ ] Success/failure parsed correctly
  - [ ] Result reported to backend

- [ ] **MTN Transfer**
  - [ ] Insert MTN SIM in slot 2
  - [ ] Execute small transfer (100 SYP)
  - [ ] USSD code accepted by carrier
  - [ ] Response captured
  - [ ] Success/failure parsed correctly
  - [ ] Result reported to backend

- [ ] **Balance Inquiry**
  - [ ] Syriatel: *150# works
  - [ ] MTN: *135# works
  - [ ] Balance extracted correctly

### 3.4 Dual SIM Testing

- [ ] **Syriatel + MTN**
  - [ ] Both SIMs recognized
  - [ ] Correct SIM selected per operator
  - [ ] No SIM conflicts

- [ ] **Single SIM**
  - [ ] Works with only SIM1
  - [ ] Works with only SIM2
  - [ ] Error if wrong SIM for operator

### 3.5 Error Scenarios

- [ ] **No Network**
  - [ ] Airplane mode → Polling fails gracefully
  - [ ] Backoff strategy activates
  - [ ] Recovers when network returns

- [ ] **Backend Down**
  - [ ] Polling errors logged
  - [ ] Exponential backoff applied
  - [ ] No crashes

- [ ] **Permission Revoked**
  - [ ] CALL_PHONE revoked → Clear error
  - [ ] Service continues polling
  - [ ] Execution fails gracefully

- [ ] **Token Expired**
  - [ ] 401 from backend → Logout
  - [ ] Return to login screen
  - [ ] Re-authentication required

### 3.6 Battery & Performance

- [ ] **Battery Usage**
  - [ ] Foreground service uses power
  - [ ] Acceptable drain (<10%/hour)
  - [ ] Request battery optimization exemption

- [ ] **Memory Usage**
  - [ ] No memory leaks
  - [ ] Service runs for hours without issues
  - [ ] App responsive

- [ ] **Network Usage**
  - [ ] Polling = ~1KB per request
  - [ ] Reasonable data usage
  - [ ] No excessive requests

### 3.7 Device Compatibility

- [ ] **Samsung**
  - [ ] Dual SIM works (TelecomManager)
  - [ ] USSD execution works
  - [ ] No manufacturer-specific issues

- [ ] **Xiaomi**
  - [ ] Dual SIM works (legacy extras)
  - [ ] MIUI permissions handled
  - [ ] Background service runs

- [ ] **Huawei**
  - [ ] Dual SIM works
  - [ ] EMUI permissions handled
  - [ ] Service survives battery optimization

- [ ] **Generic AOSP**
  - [ ] All features work
  - [ ] Clean Android experience

### 3.8 Android Versions

- [ ] **Android 7.0 (API 24 - Min SDK)**
  - [ ] App installs
  - [ ] All features work
  - [ ] Legacy dual SIM extras work

- [ ] **Android 10 (API 29)**
  - [ ] All features work
  - [ ] Scoped storage OK (not used)

- [ ] **Android 11 (API 30)**
  - [ ] All features work
  - [ ] Background restrictions handled

- [ ] **Android 12+ (API 31+)**
  - [ ] All features work
  - [ ] Exact alarms OK (not used)
  - [ ] Notification permissions handled

---

## 4. Security Testing

### 4.1 Sensitive Data

- [ ] **Logs Inspection**
  - [ ] No USSD passwords in logcat
  - [ ] No access tokens in logcat
  - [ ] No full USSD codes in logcat
  - [ ] Phone numbers masked (09XX******)

- [ ] **Storage Inspection**
  - [ ] EncryptedSharedPreferences file encrypted
  - [ ] Cannot read data in file explorer
  - [ ] Root access shows encrypted blobs only

- [ ] **Network Traffic**
  - [ ] All requests use HTTPS
  - [ ] No plain HTTP requests
  - [ ] Tokens in Authorization header only

### 4.2 Authentication

- [ ] **Token Storage**
  - [ ] Token encrypted at rest
  - [ ] Token cleared on logout
  - [ ] Token not shared between apps

- [ ] **Session Management**
  - [ ] Token expires after 90 days
  - [ ] Re-login required after expiry
  - [ ] Logout clears session

### 4.3 ProGuard/R8

- [ ] **Code Obfuscation** (Release Build)
  - [ ] Classes obfuscated
  - [ ] Methods obfuscated
  - [ ] Data models preserved (Moshi)
  - [ ] Retrofit interfaces preserved

---

## 5. Regression Testing

### 5.1 After Updates

Run full manual test suite after:
- [ ] App version update
- [ ] Backend API changes
- [ ] Operator rules changes
- [ ] Android OS updates

### 5.2 Smoke Tests

Quick verification (15 minutes):
- [ ] Login works
- [ ] Service starts
- [ ] Job executes
- [ ] Result reports
- [ ] Dashboard shows stats

---

## 6. User Acceptance Testing (UAT)

### 6.1 Agent Feedback

- [ ] UI intuitive
- [ ] Error messages clear
- [ ] Performance acceptable
- [ ] Battery usage OK
- [ ] No crashes

### 6.2 Real-World Usage

- [ ] Test with real agents
- [ ] Monitor for 24 hours
- [ ] Gather feedback
- [ ] Fix critical issues
- [ ] Re-deploy if needed

---

## 7. Test Results Summary

### Test Status

| Category | Tests | Passed | Failed | N/A |
|----------|-------|--------|--------|-----|
| Unit Tests | - | - | - | - |
| Integration Tests | - | - | - | - |
| Manual Tests | - | - | - | - |
| Security Tests | - | - | - | - |
| Performance Tests | - | - | - | - |
| **Total** | **-** | **-** | **-** | **-** |

### Critical Issues

| # | Description | Severity | Status | Resolution |
|---|-------------|----------|--------|------------|
| - | - | - | - | - |

### Known Issues

| # | Description | Impact | Workaround | Fix Version |
|---|-------------|--------|------------|-------------|
| - | - | - | - | - |

---

## 8. Sign-Off

### Testing Team

- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] Manual tests passed
- [ ] Security audit passed
- [ ] Performance acceptable

**Tested By**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

### Approval

- [ ] Ready for production deployment
- [ ] All critical issues resolved
- [ ] Documentation complete

**Approved By**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

---

**Testing Status**: ⏳ READY TO START

**Last Updated**: November 16, 2025  
**Version**: 1.0.0

