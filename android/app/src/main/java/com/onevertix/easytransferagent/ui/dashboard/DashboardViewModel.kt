package com.onevertix.easytransferagent.ui.dashboard

import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.data.models.TransferStats
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

    private val _stats = MutableStateFlow(TransferStats())
    val stats: StateFlow<TransferStats> = _stats.asStateFlow()

    init {
        loadDashboard()
    }

    private fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Ready(
                serviceRunning = false,
                isLoggedIn = authRepo.isLoggedIn()
            )

            // Load initial stats
            loadStats()
        }
    }

    private fun loadStats() {
        // TODO: Load real stats from local storage or backend
        // For now, using placeholder data
        _stats.value = TransferStats(
            todayCount = 0,
            todaySuccess = 0,
            todayFailed = 0,
            weekCount = 0,
            totalCount = 0,
            lastTransferTime = null,
            pendingJobsCount = 0,
            serviceRunning = false,
            connected = false
        )
    }

    fun startService() {
        val current = _uiState.value as? DashboardUiState.Ready ?: return
        _uiState.value = current.copy(serviceRunning = true)

        // Update stats
        _stats.value = _stats.value.copy(serviceRunning = true)
    }

    fun stopService() {
        val current = _uiState.value as? DashboardUiState.Ready ?: return
        _uiState.value = current.copy(serviceRunning = false)

        // Update stats
        _stats.value = _stats.value.copy(serviceRunning = false)
    }

    fun updateStats(stats: TransferStats) {
        _stats.value = stats
    }

    fun incrementTransferCount(success: Boolean) {
        _stats.value = _stats.value.copy(
            todayCount = _stats.value.todayCount + 1,
            todaySuccess = if (success) _stats.value.todaySuccess + 1 else _stats.value.todaySuccess,
            todayFailed = if (!success) _stats.value.todayFailed + 1 else _stats.value.todayFailed,
            totalCount = _stats.value.totalCount + 1,
            lastTransferTime = java.time.Instant.now().toString()
        )
    }

    fun updateConnectionStatus(connected: Boolean) {
        _stats.value = _stats.value.copy(connected = connected)
    }

    fun updatePendingJobs(count: Int) {
        _stats.value = _stats.value.copy(pendingJobsCount = count)
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

