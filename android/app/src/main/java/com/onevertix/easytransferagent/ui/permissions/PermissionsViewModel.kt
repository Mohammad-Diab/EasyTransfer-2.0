package com.onevertix.easytransferagent.ui.permissions

import android.app.Activity
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.utils.PermissionUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for managing runtime permissions state
 */
class PermissionsViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<PermissionsUiState>(PermissionsUiState.Loading)
    val uiState: StateFlow<PermissionsUiState> = _uiState.asStateFlow()

    /**
     * Check current permission status
     */
    fun checkPermissions(context: Context) {
        viewModelScope.launch {
            val hasAll = PermissionUtils.hasAllRequiredPermissions(context)

            if (hasAll) {
                _uiState.value = PermissionsUiState.Granted
            } else {
                val missing = PermissionUtils.getMissingPermissions(context)
                _uiState.value = PermissionsUiState.Required(
                    missingPermissions = missing,
                    showSettingsButton = false
                )
            }
        }
    }

    /**
     * Request all required permissions
     */
    fun requestPermissions(activity: Activity) {
        PermissionUtils.requestAllPermissions(activity)
    }

    /**
     * Handle permission request result
     */
    fun handlePermissionResult(
        activity: Activity,
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        viewModelScope.launch {
            val result = PermissionUtils.handlePermissionResult(requestCode, permissions, grantResults)

            when (result) {
                is PermissionUtils.PermissionResult.Granted -> {
                    _uiState.value = PermissionsUiState.Granted
                }
                is PermissionUtils.PermissionResult.Denied,
                is PermissionUtils.PermissionResult.PartiallyDenied -> {
                    val missing = PermissionUtils.getMissingPermissions(activity)
                    val hasPermanentlyDenied = PermissionUtils.hasPermanentlyDeniedPermissions(activity)

                    _uiState.value = PermissionsUiState.Required(
                        missingPermissions = missing,
                        showSettingsButton = hasPermanentlyDenied
                    )
                }
                is PermissionUtils.PermissionResult.Unknown -> {
                    // Re-check permissions
                    checkPermissions(activity)
                }
            }
        }
    }

    /**
     * Open app settings
     */
    fun openAppSettings(context: Context) {
        PermissionUtils.openAppSettings(context)
    }

    /**
     * Reset to granted state (for navigation purposes)
     */
    fun markAsGranted() {
        _uiState.value = PermissionsUiState.Granted
    }
}

/**
 * UI state for permissions screen
 */
sealed class PermissionsUiState {
    object Loading : PermissionsUiState()
    object Granted : PermissionsUiState()
    data class Required(
        val missingPermissions: List<String>,
        val showSettingsButton: Boolean
    ) : PermissionsUiState()
}

