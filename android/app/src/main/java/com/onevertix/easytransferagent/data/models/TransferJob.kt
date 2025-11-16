package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Represents a transfer job received from the backend
 */
@JsonClass(generateAdapter = true)
data class TransferJob(
    @Json(name = "job_type")
    val jobType: String,  // "transfer" or "balance"

    @Json(name = "request_id")
    val requestId: String?,  // For transfer jobs

    @Json(name = "job_id")
    val jobId: String?,  // For balance jobs

    @Json(name = "recipient_phone")
    val recipientPhone: String?,

    @Json(name = "amount")
    val amount: Int?,

    @Json(name = "operator_code")
    val operatorCode: String?,  // "SYRIATEL" or "MTN" for transfer

    @Json(name = "operator")
    val operator: String?,  // "syriatel" or "mtn" for balance

    @Json(name = "ussd_pattern")
    val ussdPattern: String?
)

