package com.onevertix.easytransferagent.data.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID
import androidx.core.content.edit

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

    // Token Expiry (epoch seconds)
    fun saveTokenExpiry(expiryTimestamp: Long) {
        encryptedPrefs.edit().putLong(KEY_TOKEN_EXPIRY, expiryTimestamp).apply()
    }

    fun getTokenExpiry(): Long {
        return encryptedPrefs.getLong(KEY_TOKEN_EXPIRY, 0)
    }

    fun isTokenValid(nowEpochSeconds: Long = System.currentTimeMillis() / 1000): Boolean {
        val token = getAccessToken()
        val expiry = getTokenExpiry()
        if (token.isNullOrBlank() || expiry <= 0) return false
        // Allow small clock skew margin (120s)
        return nowEpochSeconds + 120 < expiry
    }

    // Device ID
    fun saveDeviceId(deviceId: String) {
        encryptedPrefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    }

    fun getDeviceId(): String? {
        return encryptedPrefs.getString(KEY_DEVICE_ID, null)
    }

    fun getOrCreateDeviceId(): String {
        val existing = getDeviceId()
        if (!existing.isNullOrBlank()) return existing
        val newId = "android_" + UUID.randomUUID().toString()
        saveDeviceId(newId)
        return newId
    }

    // USSD Password
    fun saveUssdPassword(password: String) {
        encryptedPrefs.edit { putString(KEY_USSD_PASSWORD, password) }
    }

    fun getUssdPassword(): String? {
        return encryptedPrefs.getString(KEY_USSD_PASSWORD, null)
    }

    fun clearUssdPassword() {
        encryptedPrefs.edit { remove(KEY_USSD_PASSWORD) }
    }

    fun hasUssdPassword(): Boolean {
        return !getUssdPassword().isNullOrBlank()
    }

    // User ID
    fun saveUserId(userId: String) {
        encryptedPrefs.edit { putString(KEY_USER_ID, userId) }
    }

    fun getUserId(): String? {
        return encryptedPrefs.getString(KEY_USER_ID, null)
    }

    // Clear all secure data (logout)
    fun clearAll() {
        encryptedPrefs.edit { clear() }
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
