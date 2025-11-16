package com.onevertix.easytransferagent.data.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure storage for sensitive data using EncryptedSharedPreferences
 * Stores: Access Token, Device ID, USSD Password, etc.
 */
class SecureStorage(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // Access Token
    fun saveAccessToken(token: String) {
        encryptedPrefs.edit().putString(KEY_ACCESS_TOKEN, token).apply()
    }

    fun getAccessToken(): String? {
        return encryptedPrefs.getString(KEY_ACCESS_TOKEN, null)
    }

    fun clearAccessToken() {
        encryptedPrefs.edit().remove(KEY_ACCESS_TOKEN).apply()
    }

    // Device ID
    fun saveDeviceId(deviceId: String) {
        encryptedPrefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    }

    fun getDeviceId(): String? {
        return encryptedPrefs.getString(KEY_DEVICE_ID, null)
    }

    fun clearDeviceId() {
        encryptedPrefs.edit().remove(KEY_DEVICE_ID).apply()
    }

    // Token Expiry
    fun saveTokenExpiry(expiryTimestamp: Long) {
        encryptedPrefs.edit().putLong(KEY_TOKEN_EXPIRY, expiryTimestamp).apply()
    }

    fun getTokenExpiry(): Long {
        return encryptedPrefs.getLong(KEY_TOKEN_EXPIRY, 0)
    }

    // USSD Password
    fun saveUssdPassword(password: String) {
        encryptedPrefs.edit().putString(KEY_USSD_PASSWORD, password).apply()
    }

    fun getUssdPassword(): String? {
        return encryptedPrefs.getString(KEY_USSD_PASSWORD, null)
    }

    fun clearUssdPassword() {
        encryptedPrefs.edit().remove(KEY_USSD_PASSWORD).apply()
    }

    // User ID
    fun saveUserId(userId: String) {
        encryptedPrefs.edit().putString(KEY_USER_ID, userId).apply()
    }

    fun getUserId(): String? {
        return encryptedPrefs.getString(KEY_USER_ID, null)
    }

    // Clear all secure data (logout)
    fun clearAll() {
        encryptedPrefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "secure_prefs"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_TOKEN_EXPIRY = "token_expiry"
        private const val KEY_USSD_PASSWORD = "ussd_password"
        private const val KEY_USER_ID = "user_id"
    }
}

