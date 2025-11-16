package com.onevertix.easytransferagent.data.repository

import com.onevertix.easytransferagent.data.api.ApiService
import com.onevertix.easytransferagent.data.models.AuthResponse
import com.onevertix.easytransferagent.data.models.OtpRequest
import com.onevertix.easytransferagent.data.models.OtpRequestResponse
import com.onevertix.easytransferagent.data.models.OtpVerification
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.utils.Validation

interface AuthRepository {
    suspend fun requestOtp(rawPhone: String): Result<OtpRequestResponse>
    suspend fun verifyOtp(rawPhone: String, otp: String): Result<AuthResponse>
    suspend fun logout(): Result<Unit>
    fun isLoggedIn(): Boolean
}

class DefaultAuthRepository(
    private val localPrefs: LocalPreferences,
    private val secure: SecureStorage
) : AuthRepository {

    private fun api(): ApiService {
        val baseUrl = localPrefs.getServerUrl() ?: throw IllegalStateException("Server URL not configured")
        return RetrofitClient.getClient(baseUrl)
    }

    override suspend fun requestOtp(rawPhone: String): Result<OtpRequestResponse> {
        val phone = Validation.normalizeToE164Syrian(rawPhone)
        if (!Validation.isValidSyrianPhone(rawPhone)) {
            return Result.failure(IllegalArgumentException("Invalid phone number format"))
        }
        val response = api().requestOtp(OtpRequest(phone))
        return if (response.isSuccessful && response.body() != null) {
            Result.success(response.body()!!)
        } else {
            Result.failure(Exception("Failed to request OTP: ${response.code()}"))
        }
    }

    override suspend fun verifyOtp(rawPhone: String, otp: String): Result<AuthResponse> {
        val phone = Validation.normalizeToE164Syrian(rawPhone)
        if (!Validation.isValidSyrianPhone(rawPhone)) {
            return Result.failure(IllegalArgumentException("Invalid phone number format"))
        }
        if (!Validation.isValidOtp(otp)) {
            return Result.failure(IllegalArgumentException("Invalid OTP format"))
        }
        val response = api().verifyOtp(OtpVerification(phone = phone, otp = otp))
        return if (response.isSuccessful && response.body() != null) {
            val body = response.body()!!
            // Persist auth
            secure.saveAccessToken(body.accessToken)
            secure.saveTokenExpiry((System.currentTimeMillis() / 1000) + body.expiresIn)
            secure.saveUserId(body.userId)
            secure.saveDeviceId(body.deviceId)
            Result.success(body)
        } else {
            Result.failure(Exception("Failed to verify OTP: ${response.code()}"))
        }
    }

    override suspend fun logout(): Result<Unit> {
        val token = secure.getAccessToken() ?: return Result.success(Unit)
        val deviceId = secure.getDeviceId().orEmpty()
        val resp = api().logout("Bearer $token", deviceId)
        if (!resp.isSuccessful) {
            // Still clear local auth even if server failed
        }
        secure.clearAccessToken()
        secure.saveTokenExpiry(0)
        return Result.success(Unit)
    }

    override fun isLoggedIn(): Boolean = secure.isTokenValid()
}

