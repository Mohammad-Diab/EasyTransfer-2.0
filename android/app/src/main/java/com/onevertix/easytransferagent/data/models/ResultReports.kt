package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Transfer result report to backend
 */
@JsonClass(generateAdapter = true)
data class TransferResultReport(
    @Json(name = "request_id")
    val requestId: String,

    @Json(name = "job_id")
    val jobId: String?,

    @Json(name = "status")
    val status: String,  // "success", "failed", "error", "unknown"

    @Json(name = "message")
    val message: String,  // Carrier response message

    @Json(name = "executed_at")
    val executedAt: String,  // ISO 8601 timestamp

    @Json(name = "operator")
    val operator: String,

    @Json(name = "sim_slot")
    val simSlot: Int
)

/**
 * Balance result report to backend
 */
@JsonClass(generateAdapter = true)
data class BalanceResultReport(
    @Json(name = "operator")
    val operator: String,

    @Json(name = "status")
    val status: String,  // "success", "failed"

    @Json(name = "balance")
    val balance: String?,  // Extracted balance if available

    @Json(name = "message")
    val message: String,  // Carrier response

    @Json(name = "executed_at")
    val executedAt: String,

    @Json(name = "sim_slot")
    val simSlot: Int
)

/**
 * Generic response from result reporting endpoints
 */
@JsonClass(generateAdapter = true)
data class ResultReportResponse(
    @Json(name = "success")
    val success: Boolean,

    @Json(name = "message")
    val message: String?
)

