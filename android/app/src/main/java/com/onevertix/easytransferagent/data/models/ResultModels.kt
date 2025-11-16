package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Request body for reporting transfer result
 */
@JsonClass(generateAdapter = true)
data class TransferResult(
    @Json(name = "request_id")
    val requestId: String,

    @Json(name = "status")
    val status: String,  // "success" or "failed"

    @Json(name = "message")
    val message: String,  // Carrier response

    @Json(name = "executed_at")
    val executedAt: String  // ISO 8601 timestamp
)

/**
 * Request body for reporting balance result
 */
@JsonClass(generateAdapter = true)
data class BalanceResult(
    @Json(name = "status")
    val status: String,  // "success" or "failed"

    @Json(name = "message")
    val message: String  // Raw USSD response text
)

/**
 * Generic error response
 */
@JsonClass(generateAdapter = true)
data class ErrorResponse(
    @Json(name = "error")
    val error: String,

    @Json(name = "message")
    val message: String
)

