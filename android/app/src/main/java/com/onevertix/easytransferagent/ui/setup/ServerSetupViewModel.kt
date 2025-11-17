package com.onevertix.easytransferagent.ui.setup

import android.content.Context
import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.R
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
    private lateinit var context: Context

    fun initialize(ctx: Context) {
        context = ctx
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
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
            _uiState.value = current.copy(errorMessage = context.getString(R.string.error_https_required))
            return
        }

        if (url.length < 12) { // https://x.x minimum
            _uiState.value = current.copy(errorMessage = context.getString(R.string.error_invalid_url))
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
                        errorMessage = context.getString(R.string.error_connection_failed, response.code().toString())
                    )
                }
            } catch (e: Exception) {
                _uiState.value = current.copy(
                    isLoading = false,
                    errorMessage = when {
                        e.message?.contains("Unable to resolve host") == true ->
                            context.getString(R.string.error_cannot_connect)
                        e.message?.contains("timeout") == true ->
                            context.getString(R.string.error_timeout)
                        e.message?.contains("SSLHandshake") == true ->
                            context.getString(R.string.error_ssl)
                        else -> context.getString(R.string.error_connection_failed, e.message ?: "Unknown")
                    }
                )
            }
        }
    }
}
