package com.onevertix.easytransferagent.ui.auth

import android.content.Context
import androidx.lifecycle.viewModelScope
import com.onevertix.easytransferagent.R
import com.onevertix.easytransferagent.data.repository.AuthRepository
import com.onevertix.easytransferagent.ui.base.BaseViewModel
import com.onevertix.easytransferagent.utils.Validation
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    data class PhoneEntry(
        val phone: String = "",
        val phoneError: String? = null,
        val isLoading: Boolean = false,
        val message: String? = null
    ) : AuthUiState()

    data class OtpEntry(
        val phone: String,
        val otp: String = "",
        val otpError: String? = null,
        val isLoading: Boolean = false,
        val resendSecondsLeft: Int = 60,
        val message: String? = null
    ) : AuthUiState()

    object Authenticated : AuthUiState()
}

class AuthViewModel(
    private val repo: AuthRepository,
    private val context: Context
) : BaseViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.PhoneEntry())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null

    fun checkExistingAuth() {
        if (repo.isLoggedIn()) {
            _uiState.value = AuthUiState.Authenticated
        }
    }

    fun onPhoneChange(value: String) {
        val st = (_uiState.value as? AuthUiState.PhoneEntry) ?: AuthUiState.PhoneEntry()
        _uiState.value = st.copy(phone = value, phoneError = null)
    }

    fun submitPhone() {
        val st = (_uiState.value as? AuthUiState.PhoneEntry) ?: return
        val phone = st.phone
        if (!Validation.isValidSyrianPhone(phone)) {
            _uiState.value = st.copy(phoneError = "الرجاء إدخال رقم بصيغة 09XXXXXXXX")
            return
        }
        _uiState.value = st.copy(isLoading = true, phoneError = null)
        viewModelScope.launch {
            try {
                val res = repo.requestOtp(phone)
                if (res.isSuccess) {
                    _uiState.value = AuthUiState.OtpEntry(phone = phone, resendSecondsLeft = 60)
                    startResendTimer(60)
                } else {
                    _uiState.value = st.copy(isLoading = false, phoneError = "تعذر إرسال الرمز، حاول لاحقًا")
                }
            } catch (e: Exception) {
                _uiState.value = st.copy(
                    isLoading = false,
                    phoneError = when {
                        e.message?.contains("Server URL not configured") == true -> "Server URL not configured"
                        e.message?.contains("Unable to resolve host") == true -> "Cannot connect to server"
                        else -> "Error: ${e.message}"
                    }
                )
            }
        }
    }

    fun onOtpChange(value: String) {
        val st = (_uiState.value as? AuthUiState.OtpEntry) ?: return
        _uiState.value = st.copy(otp = value.take(6), otpError = null)
    }

    fun submitOtp() {
        val st = (_uiState.value as? AuthUiState.OtpEntry) ?: return
        val otp = st.otp
        if (!Validation.isValidOtp(otp)) {
            _uiState.value = st.copy(otpError = context.getString(R.string.error_invalid_otp))
            return
        }
        _uiState.value = st.copy(isLoading = true, otpError = null)
        viewModelScope.launch {
            try {
                val res = repo.verifyOtp(st.phone, otp)
                if (res.isSuccess) {
                    _uiState.value = AuthUiState.Authenticated
                } else {
                    _uiState.value = st.copy(isLoading = false, otpError = context.getString(R.string.error_wrong_otp))
                }
            } catch (e: Exception) {
                _uiState.value = st.copy(
                    isLoading = false,
                    otpError = context.getString(R.string.error_generic, e.message ?: "")
                )
            }
        }
    }

    fun resendOtp() {
        val st = (_uiState.value as? AuthUiState.OtpEntry) ?: return
        if (st.resendSecondsLeft > 0) return
        viewModelScope.launch {
            repo.requestOtp(st.phone)
            _uiState.value = st.copy(resendSecondsLeft = 60)
            startResendTimer(60)
        }
    }

    fun backToPhone() {
        _uiState.value = AuthUiState.PhoneEntry()
        stopTimer()
    }

    private fun startResendTimer(seconds: Int) {
        stopTimer()
        timerJob = viewModelScope.launch {
            var left = seconds
            while (left > 0) {
                val st = (_uiState.value as? AuthUiState.OtpEntry) ?: break
                _uiState.value = st.copy(resendSecondsLeft = left)
                delay(1000)
                left--
            }
            val st = (_uiState.value as? AuthUiState.OtpEntry) ?: return@launch
            _uiState.value = st.copy(resendSecondsLeft = 0)
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }
}
