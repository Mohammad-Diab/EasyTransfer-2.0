package com.onevertix.easytransferagent.ui.setup

import android.content.Context
import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.ui.base.BaseViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ServerSetupUiState {
    object Loading : ServerSetupUiState()
    data class Editing(
        val serverUrl: String = "",
        val isLoading: Boolean = false,
        val errorMessage: String? = null
    ) : ServerSetupUiState()
    data class Success(val serverUrl: String) : ServerSetupUiState()
}

class ServerSetupViewModel : BaseViewModel() {

    private val _uiState = MutableStateFlow<ServerSetupUiState>(ServerSetupUiState.Loading)
    val uiState: StateFlow<ServerSetupUiState> = _uiState.asStateFlow()

    private lateinit var localPrefs: LocalPreferences

    fun initialize(context: Context) {
        localPrefs = LocalPreferences(context)

        // Check if server URL already configured
        val existingUrl = localPrefs.getServerUrl()
        if (existingUrl != null) {
            _uiState.value = ServerSetupUiState.Success(existingUrl)
        } else {
            _uiState.value = ServerSetupUiState.Editing()
        }
    }

    fun updateServerUrl(url: String) {
        val current = _uiState.value as? ServerSetupUiState.Editing ?: return
        _uiState.value = current.copy(serverUrl = url, errorMessage = null)
    }

    fun testConnection() {
        val current = _uiState.value as? ServerSetupUiState.Editing ?: return
        val url = current.serverUrl.trim()

        // Validate URL format
        if (!url.startsWith("https://")) {
            _uiState.value = current.copy(errorMessage = "URL must start with https://")
            return
        }

        if (url.length < 12) { // https://x.x minimum
            _uiState.value = current.copy(errorMessage = "Invalid URL format")
            return
        }

        _uiState.value = current.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            try {
                // Create API client with the URL
                val api = RetrofitClient.getClient(url)

                // Call health check endpoint
                val response = api.healthCheck()

                if (response.isSuccessful) {
                    // Save URL
                    localPrefs.saveServerUrl(url)
                    _uiState.value = ServerSetupUiState.Success(url)
                } else {
                    _uiState.value = current.copy(
                        isLoading = false,
                        errorMessage = "Server responded with error: ${response.code()}"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = current.copy(
                    isLoading = false,
                    errorMessage = when {
                        e.message?.contains("Unable to resolve host") == true ->
                            "Cannot connect to server. Check URL and internet connection."
                        e.message?.contains("timeout") == true ->
                            "Connection timeout. Server not responding."
                        e.message?.contains("SSLHandshake") == true ->
                            "SSL certificate error. Check server configuration."
                        else -> "Connection failed: ${e.message}"
                    }
                )
            }
        }
    }
}

