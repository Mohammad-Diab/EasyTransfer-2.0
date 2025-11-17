package com.onevertix.easytransferagent.data.repository

import com.onevertix.easytransferagent.data.api.ApiService
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.data.models.BalanceResult
import com.onevertix.easytransferagent.data.models.SubmitResultDto
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
                val jobResponse = response.body()!!

                // If no jobs available
                if (jobResponse.request == null && jobResponse.jobType == null) {
                    return Result.success(emptyList())
                }

                // Convert response to TransferJob list
                val jobs = mutableListOf<TransferJob>()

                when (jobResponse.jobType) {
                    "balance" -> {
                        jobs.add(TransferJob(
                            jobType = "balance",
                            requestId = null,
                            jobId = jobResponse.jobId,
                            recipientPhone = null,
                            amount = null,
                            operatorCode = null,
                            operator = jobResponse.operator,
                            ussdPattern = null
                        ))
                    }
                    "transfer" -> {
                        jobResponse.request?.let { req ->
                            jobs.add(TransferJob(
                                jobType = "transfer",
                                requestId = req.id,
                                jobId = null,
                                recipientPhone = req.recipientPhone,
                                amount = req.amount,
                                operatorCode = req.operator,
                                operator = null,
                                ussdPattern = null
                            ))
                        }
                    }
                }

                Result.success(jobs)
            } else {
                Result.failure(Exception("Failed to get pending jobs: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun reportTransferResult(result: TransferResult): Result<Unit> {
        return try {
            // Convert to SubmitResultDto matching backend expectations
            val submitDto = SubmitResultDto(
                status = result.status,
                carrierResponse = result.message
            )

            // Convert requestId to Int (backend expects numeric ID in path)
            val requestIdInt = result.requestId.toIntOrNull()
                ?: throw IllegalArgumentException("Invalid request ID: ${result.requestId}")

            val response = api().reportTransferResult(
                requestId = requestIdInt,
                token = "", // Will be added by AuthInterceptor
                deviceId = "", // Will be added by AuthInterceptor
                result = submitDto
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

