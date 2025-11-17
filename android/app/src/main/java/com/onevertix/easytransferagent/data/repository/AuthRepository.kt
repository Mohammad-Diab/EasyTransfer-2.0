package com.onevertix.easytransferagent.data.repository

import com.onevertix.easytransferagent.data.api.ApiService
import com.onevertix.easytransferagent.data.models.AuthResponse
import com.onevertix.easytransferagent.data.models.OtpRequest
import com.onevertix.easytransferagent.data.models.OtpRequestResponse
import com.onevertix.easytransferagent.data.models.OtpVerification
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.utils.DeviceUtils
import com.onevertix.easytransferagent.utils.Validation

interface AuthRepository {
    suspend fun requestOtp(rawPhone: String): Result<OtpRequestResponse>
    suspend fun verifyOtp(rawPhone: String, otp: String): Result<AuthResponse>
    suspend fun logout(): Result<Unit>
    suspend fun healthCheck(): Result<Boolean>
    fun isLoggedIn(): Boolean
}

class DefaultAuthRepository(
    private val localPrefs: LocalPreferences,
    private val secure: SecureStorage
) : AuthRepository {

    init {
        // Set up auth providers for RetrofitClient
        RetrofitClient.setAuthProviders(
            tokenProvider = { secure.getAccessToken() },
            deviceIdProvider = { secure.getDeviceId() }
        )
    }

    private fun api(): ApiService {
        val baseUrl = localPrefs.getServerUrl() ?: throw IllegalStateException("Server URL not configured")
        return RetrofitClient.getClient(baseUrl)
    }

    override suspend fun requestOtp(rawPhone: String): Result<OtpRequestResponse> {
        return try {
            val phone = Validation.normalizeToLocalSyrian(rawPhone)
            if (!Validation.isValidSyrianPhone(phone)) {
                return Result.failure(IllegalArgumentException("Invalid phone number format"))
            }
            val response = api().requestOtp(OtpRequest(phone))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to request OTP: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun verifyOtp(rawPhone: String, otp: String): Result<AuthResponse> {
        return try {
            val phone = Validation.normalizeToLocalSyrian(rawPhone)
            if (!Validation.isValidSyrianPhone(phone)) {
                return Result.failure(IllegalArgumentException("Invalid phone number format"))
            }
            if (!Validation.isValidOtp(otp)) {
                return Result.failure(IllegalArgumentException("Invalid OTP format"))
            }

            // Get or create device ID
            val deviceId = secure.getOrCreateDeviceId()
            val deviceName = DeviceUtils.getDeviceName()

            val response = api().verifyOtp(OtpVerification(
                phone = phone,
                code = otp,  // Backend expects 'code' not 'otp'
                deviceId = deviceId,
                deviceName = deviceName
            ))

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                // Persist auth
                secure.saveAccessToken(body.accessToken)
                secure.saveTokenExpiry((System.currentTimeMillis() / 1000) + body.expiresIn)
                secure.saveUserId(body.user.id)
                secure.saveDeviceId(body.deviceId)

                // Auth providers are already set in init, token is now available
                Result.success(body)
            } else {
                Result.failure(Exception("Failed to verify OTP: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        val token = secure.getAccessToken() ?: return Result.success(Unit)
        val deviceId = secure.getDeviceId().orEmpty()
        val resp = api().logout("Bearer $token", deviceId)
        // Clear local auth even if server request failed
        secure.clearAccessToken()
        secure.saveTokenExpiry(0)
        return Result.success(Unit)
    }

    override suspend fun healthCheck(): Result<Boolean> {
        return try {
            val response = api().healthCheck()
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                Result.success(false)
            }
        } catch (e: Exception) {
            Result.success(false)
        }
    }

    override fun isLoggedIn(): Boolean = secure.isTokenValid()
}

