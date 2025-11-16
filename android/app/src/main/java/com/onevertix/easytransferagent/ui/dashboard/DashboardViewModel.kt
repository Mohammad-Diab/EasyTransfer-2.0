package com.onevertix.easytransferagent.ui.dashboard

import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.data.repository.AuthRepository
import com.onevertix.easytransferagent.ui.base.BaseViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for dashboard screen
 */
class DashboardViewModel(
    private val authRepo: AuthRepository
) : BaseViewModel() {

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    private fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Ready(
                serviceRunning = false, // Will be updated dynamically
                isLoggedIn = authRepo.isLoggedIn()
            )
        }
    }

    fun startService() {
        val current = _uiState.value as? DashboardUiState.Ready ?: return
        _uiState.value = current.copy(serviceRunning = true)
    }

    fun stopService() {
        val current = _uiState.value as? DashboardUiState.Ready ?: return
        _uiState.value = current.copy(serviceRunning = false)
    }

    fun logout() {
        viewModelScope.launch {
            authRepo.logout()
            _uiState.value = DashboardUiState.LoggedOut
        }
    }
}

/**
 * Dashboard UI state
 */
sealed class DashboardUiState {
    object Loading : DashboardUiState()
    data class Ready(
        val serviceRunning: Boolean,
        val isLoggedIn: Boolean
    ) : DashboardUiState()
    object LoggedOut : DashboardUiState()
}

