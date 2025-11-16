package com.onevertix.easytransferagent.data.repository

import com.onevertix.easytransferagent.data.api.ApiService
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.data.models.BalanceResult
import com.onevertix.easytransferagent.data.models.TransferJob
import com.onevertix.easytransferagent.data.models.TransferResult
import com.onevertix.easytransferagent.data.storage.LocalPreferences

/**
 * Repository for transfer-related API operations
 */
interface TransferRepository {
    suspend fun getPendingJobs(): Result<List<TransferJob>>
    suspend fun reportTransferResult(result: TransferResult): Result<Unit>
    suspend fun reportBalanceResult(result: BalanceResult): Result<Unit>
    suspend fun checkHealth(): Result<Unit>
}

class DefaultTransferRepository(
    private val localPrefs: LocalPreferences
) : TransferRepository {

    private fun api(): ApiService {
        val baseUrl = localPrefs.getServerUrl()
            ?: throw IllegalStateException("Server URL not configured")
        return RetrofitClient.getClient(baseUrl)
    }

    override suspend fun getPendingJobs(): Result<List<TransferJob>> {
        return try {
            val response = api().getPendingJobs(
                token = "", // Will be added by AuthInterceptor
                deviceId = "" // Will be added by AuthInterceptor
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to get pending jobs: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun reportTransferResult(result: TransferResult): Result<Unit> {
        return try {
            val response = api().reportTransferResult(
                token = "", // Will be added by AuthInterceptor
                deviceId = "", // Will be added by AuthInterceptor
                result = result
            )
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to report transfer result: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun reportBalanceResult(result: BalanceResult): Result<Unit> {
        return try {
            val response = api().reportBalanceResult(
                token = "", // Will be added by AuthInterceptor
                deviceId = "", // Will be added by AuthInterceptor
                result = result
            )
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to report balance result: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkHealth(): Result<Unit> {
        return try {
            val response = api().healthCheck()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Health check failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

