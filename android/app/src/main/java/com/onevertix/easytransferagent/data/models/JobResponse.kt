package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Response envelope for job requests from backend
 */
@JsonClass(generateAdapter = true)
data class JobResponse(
    @Json(name = "success")
    val success: Boolean,

    @Json(name = "message")
    val message: String? = null,

    @Json(name = "job_type")
    val jobType: String? = null,  // "transfer" or "balance"

    @Json(name = "job_id")
    val jobId: String? = null,  // For balance jobs

    @Json(name = "operator")
    val operator: String? = null,  // For balance jobs

    @Json(name = "request")
    val request: TransferRequest? = null  // For transfer jobs
)

/**
 * Transfer request details nested in JobResponse
 */
@JsonClass(generateAdapter = true)
data class TransferRequest(
    @Json(name = "id")
    val id: String,

    @Json(name = "recipient_phone")
    val recipientPhone: String,

    @Json(name = "amount")
    val amount: Int,

    @Json(name = "operator")
    val operator: String
)

