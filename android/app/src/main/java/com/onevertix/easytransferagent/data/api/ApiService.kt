package com.onevertix.easytransferagent.data.api

import com.onevertix.easytransferagent.data.models.*
import retrofit2.Response
import retrofit2.http.*

/**
 * API service interface for backend communication
 */
interface ApiService {

    // ========== Authentication Endpoints ==========

    @POST("/api/android/auth/request-otp")
    suspend fun requestOtp(
        @Body request: OtpRequest
    ): Response<OtpRequestResponse>

    @POST("/api/android/auth/verify-otp")
    suspend fun verifyOtp(
        @Body request: OtpVerification
    ): Response<AuthResponse>

    @POST("/api/android/auth/logout")
    suspend fun logout(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String
    ): Response<Unit>

    // ========== Transfer Execution Endpoints ==========

    @GET("/api/android/jobs/pending")
    suspend fun getPendingJobs(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String
    ): Response<List<TransferJob>>

    @POST("/api/android/transfers/result")
    suspend fun reportTransferResult(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String,
        @Body result: TransferResult
    ): Response<Unit>

    @POST("/api/android/balance/result")
    suspend fun reportBalanceResult(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String,
        @Body result: BalanceResult
    ): Response<Unit>

    // ========== Health Check ==========

    @GET("/api/android/status")
    suspend fun healthCheck(): Response<Unit>

    // ========== Operator Rules ==========

    @GET("/api/android/rules")
    suspend fun getOperatorRules(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String
    ): Response<OperatorRulesResponse>

    @GET("/api/android/rules/version")
    suspend fun getRulesVersion(
        @Header("Authorization") token: String,
        @Header("X-Device-ID") deviceId: String
    ): Response<Map<String, Int>>  // {"version": 123}
}

