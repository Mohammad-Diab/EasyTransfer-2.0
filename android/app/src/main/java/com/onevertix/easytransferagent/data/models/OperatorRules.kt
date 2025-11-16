package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Operator-specific USSD response parsing rules
 */
@JsonClass(generateAdapter = true)
data class OperatorRules(
    @Json(name = "operator")
    val operator: String,  // "SYRIATEL" or "MTN"

    @Json(name = "version")
    val version: Int,

    @Json(name = "success_keywords")
    val successKeywords: List<String>,  // Keywords indicating success

    @Json(name = "failure_keywords")
    val failureKeywords: List<String>,  // Keywords indicating failure

    @Json(name = "updated_at")
    val updatedAt: String  // ISO 8601 timestamp
)

/**
 * Response from rules endpoint
 */
@JsonClass(generateAdapter = true)
data class OperatorRulesResponse(
    @Json(name = "rules")
    val rules: List<OperatorRules>,

    @Json(name = "version")
    val version: Int
)

/**
 * Cached rules with metadata
 */
data class CachedRules(
    val rules: Map<String, OperatorRules>,  // operator -> rules
    val version: Int,
    val cachedAt: Long  // epoch millis
)

/**
 * USSD response parsing result
 */
sealed class ParseResult {
    data class Success(val message: String) : ParseResult()
    data class Failure(val message: String) : ParseResult()
    data class Unknown(val message: String) : ParseResult()
}

