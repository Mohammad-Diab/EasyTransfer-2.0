package com.onevertix.easytransferagent.ui.config

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.utils.Constants
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for Configuration Screen
 * Manages server URL, SIM mapping, and USSD password
 */
class ConfigViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<ConfigUiState>(ConfigUiState.Loading)
    val uiState: StateFlow<ConfigUiState> = _uiState.asStateFlow()

    private var localPreferences: LocalPreferences? = null
    private var secureStorage: SecureStorage? = null

    /**
     * Initialize with storage instances
     */
    fun initialize(context: Context) {
        localPreferences = LocalPreferences(context)
        secureStorage = SecureStorage(context)
        loadConfiguration()
    }

    /**
     * Load existing configuration
     */
    private fun loadConfiguration() {
        viewModelScope.launch {
            val serverUrl = localPreferences?.getServerUrl() ?: Constants.DEFAULT_SERVER_URL
            val sim1Operator = localPreferences?.getSim1Operator() ?: ""
            val sim2Operator = localPreferences?.getSim2Operator() ?: ""
            val hasUssdPassword = secureStorage?.getUssdPassword() != null

            _uiState.value = ConfigUiState.Editing(
                serverUrl = serverUrl,
                sim1Operator = sim1Operator,
                sim2Operator = sim2Operator,
                ussdPassword = "", // Never pre-fill password
                hasExistingPassword = hasUssdPassword,
                serverUrlError = null,
                ussdPasswordError = null,
                isSaving = false
            )
        }
    }

    /**
     * Update server URL
     */
    fun updateServerUrl(url: String) {
        val currentState = _uiState.value as? ConfigUiState.Editing ?: return
        _uiState.value = currentState.copy(
            serverUrl = url,
            serverUrlError = null
        )
    }

    /**
     * Update SIM 1 operator
     */
    fun updateSim1Operator(operator: String) {
        val currentState = _uiState.value as? ConfigUiState.Editing ?: return
        _uiState.value = currentState.copy(sim1Operator = operator)
    }

    /**
     * Update SIM 2 operator
     */
    fun updateSim2Operator(operator: String) {
        val currentState = _uiState.value as? ConfigUiState.Editing ?: return
        _uiState.value = currentState.copy(sim2Operator = operator)
    }

    /**
     * Update USSD password
     */
    fun updateUssdPassword(password: String) {
        val currentState = _uiState.value as? ConfigUiState.Editing ?: return
        _uiState.value = currentState.copy(
            ussdPassword = password,
            ussdPasswordError = null
        )
    }

    /**
     * Validate and save configuration
     */
    fun saveConfiguration() {
        val currentState = _uiState.value as? ConfigUiState.Editing ?: return

        // Validate inputs
        val serverUrlError = validateServerUrl(currentState.serverUrl)
        val ussdPasswordError = validateUssdPassword(
            currentState.ussdPassword,
            currentState.hasExistingPassword
        )

        val simError = validateSimMapping(
            currentState.sim1Operator,
            currentState.sim2Operator
        )

        if (serverUrlError != null || ussdPasswordError != null || simError != null) {
            _uiState.value = currentState.copy(
                serverUrlError = serverUrlError ?: simError,
                ussdPasswordError = ussdPasswordError
            )
            return
        }

        // Save configuration
        _uiState.value = currentState.copy(isSaving = true)

        viewModelScope.launch {
            try {
                // Save server URL
                localPreferences?.saveServerUrl(currentState.serverUrl)

                // Save SIM mappings
                if (currentState.sim1Operator.isNotBlank()) {
                    localPreferences?.saveSim1Operator(currentState.sim1Operator)
                }
                if (currentState.sim2Operator.isNotBlank()) {
                    localPreferences?.saveSim2Operator(currentState.sim2Operator)
                }

                // Save USSD password if provided
                if (currentState.ussdPassword.isNotBlank()) {
                    secureStorage?.saveUssdPassword(currentState.ussdPassword)
                }

                // Mark first launch complete
                localPreferences?.setFirstLaunchComplete()

                _uiState.value = ConfigUiState.Success
            } catch (e: Exception) {
                _uiState.value = currentState.copy(
                    serverUrlError = "Failed to save configuration: ${e.localizedMessage}",
                    isSaving = false
                )
            }
        }
    }

    /**
     * Validate server URL
     */
    private fun validateServerUrl(url: String): String? {
        return when {
            url.isBlank() -> "Server URL is required"
            !url.startsWith("https://") -> "Server URL must use HTTPS"
            !isValidUrl(url) -> "Invalid URL format"
            else -> null
        }
    }

    /**
     * Validate USSD password
     */
    private fun validateUssdPassword(password: String, hasExisting: Boolean): String? {
        // Password is optional if one already exists
        if (password.isBlank() && hasExisting) {
            return null
        }

        return when {
            password.isBlank() -> "USSD password is required"
            password.length < 4 -> "Password must be at least 4 digits"
            !password.all { it.isDigit() } -> "Password must contain only digits"
            else -> null
        }
    }

    /**
     * Validate SIM mapping
     */
    private fun validateSimMapping(sim1: String, sim2: String): String? {
        if (sim1.isBlank() && sim2.isBlank()) {
            return "At least one SIM card must be mapped"
        }
        return null
    }

    /**
     * Simple URL validation
     */
    private fun isValidUrl(url: String): Boolean {
        return try {
            val pattern = Regex(
                "^https://([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(:[0-9]+)?(/.*)?$"
            )
            pattern.matches(url)
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Check if configuration already exists
     */
    fun hasExistingConfiguration(): Boolean {
        return localPreferences?.isSetupComplete() == true
    }
}

/**
 * UI state for configuration screen
 */
sealed class ConfigUiState {
    object Loading : ConfigUiState()

    data class Editing(
        val serverUrl: String,
        val sim1Operator: String,
        val sim2Operator: String,
        val ussdPassword: String,
        val hasExistingPassword: Boolean,
        val serverUrlError: String?,
        val ussdPasswordError: String?,
        val isSaving: Boolean
    ) : ConfigUiState()

    object Success : ConfigUiState()
}

