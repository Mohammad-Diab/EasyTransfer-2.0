package com.onevertix.easytransferagent.data.storage

import android.content.Context
import android.content.SharedPreferences

/**
 * Local preferences for non-sensitive data
 * Stores: Server URL, SIM mappings, app settings
 */
class LocalPreferences(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    // Server URL
    fun saveServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getServerUrl(): String? {
        return prefs.getString(KEY_SERVER_URL, null)
    }

    fun clearServerUrl() {
        prefs.edit().remove(KEY_SERVER_URL).apply()
    }

    // SIM 1 Operator Mapping
    fun saveSim1Operator(operator: String) {
        prefs.edit().putString(KEY_SIM1_OPERATOR, operator).apply()
    }

    fun getSim1Operator(): String? {
        return prefs.getString(KEY_SIM1_OPERATOR, null)
    }

    // SIM 2 Operator Mapping
    fun saveSim2Operator(operator: String) {
        prefs.edit().putString(KEY_SIM2_OPERATOR, operator).apply()
    }

    fun getSim2Operator(): String? {
        return prefs.getString(KEY_SIM2_OPERATOR, null)
    }

    // Check if initial setup is complete
    fun isSetupComplete(): Boolean {
        return getServerUrl() != null
    }

    // Check if configuration is complete
    fun isConfigurationComplete(): Boolean {
        return getSim1Operator() != null || getSim2Operator() != null
    }

    // First launch check
    fun isFirstLaunch(): Boolean {
        return prefs.getBoolean(KEY_FIRST_LAUNCH, true)
    }

    fun setFirstLaunchComplete() {
        prefs.edit().putBoolean(KEY_FIRST_LAUNCH, false).apply()
    }

    // Service enabled state
    fun isServiceEnabled(): Boolean {
        return prefs.getBoolean(KEY_SERVICE_ENABLED, false)
    }

    fun setServiceEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SERVICE_ENABLED, enabled).apply()
    }

    // Clear all local preferences
    fun clearAll() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "local_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_SIM1_OPERATOR = "sim1_operator"
        private const val KEY_SIM2_OPERATOR = "sim2_operator"
        private const val KEY_FIRST_LAUNCH = "first_launch"
        private const val KEY_SERVICE_ENABLED = "service_enabled"
    }
}

