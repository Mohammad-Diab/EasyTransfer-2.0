package com.onevertix.easytransferagent.ui.base

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Base ViewModel with common functionality
 */
abstract class BaseViewModel : ViewModel() {

    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Error state
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // Exception handler for coroutines
    protected val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
        handleError(throwable)
    }

    /**
     * Launch a coroutine with loading state and error handling
     */
    protected fun launchWithLoading(
        showLoading: Boolean = true,
        block: suspend () -> Unit
    ) {
        viewModelScope.launch(exceptionHandler) {
            try {
                if (showLoading) _isLoading.value = true
                block()
            } catch (e: Exception) {
                handleError(e)
            } finally {
                if (showLoading) _isLoading.value = false
            }
        }
    }

    /**
     * Handle errors and update error state
     */
    protected open fun handleError(throwable: Throwable) {
        _error.value = throwable.message ?: "Unknown error occurred"
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _error.value = null
    }

    /**
     * Set loading state manually
     */
    protected fun setLoading(loading: Boolean) {
        _isLoading.value = loading
    }

    /**
     * Set error state manually
     */
    protected fun setError(message: String) {
        _error.value = message
    }
}

