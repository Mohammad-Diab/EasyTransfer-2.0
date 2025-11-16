package com.onevertix.easytransferagent.ussd

import com.onevertix.easytransferagent.data.models.OperatorRules
import com.onevertix.easytransferagent.data.models.ParseResult
import com.onevertix.easytransferagent.utils.Logger

/**
 * Parser for USSD responses using operator-specific rules
 */
class ResponseParser(
    private val rules: Map<String, OperatorRules>
) {

    /**
     * Parse USSD response to determine success/failure
     */
    fun parseResponse(operator: String, response: String): ParseResult {
        val normalizedOperator = operator.uppercase()
        val operatorRules = rules[normalizedOperator]

        if (operatorRules == null) {
            Logger.w("No rules found for operator: $normalizedOperator, using default", TAG)
            return parseWithDefaultRules(normalizedOperator, response)
        }

        // Normalize response for matching (lowercase for case-insensitive matching)
        val normalizedResponse = response.lowercase()

        // Check for success keywords first
        for (keyword in operatorRules.successKeywords) {
            if (normalizedResponse.contains(keyword.lowercase())) {
                Logger.i("Success keyword matched: '$keyword' in response", TAG)
                return ParseResult.Success(response)
            }
        }

        // Check for failure keywords
        for (keyword in operatorRules.failureKeywords) {
            if (normalizedResponse.contains(keyword.lowercase())) {
                Logger.i("Failure keyword matched: '$keyword' in response", TAG)
                return ParseResult.Failure(response)
            }
        }

        // No keywords matched - conservative approach: assume failure
        Logger.w("No keywords matched in response, assuming failure", TAG)
        return ParseResult.Unknown(response)
    }

    /**
     * Parse using default hardcoded rules (fallback)
     */
    private fun parseWithDefaultRules(operator: String, response: String): ParseResult {
        val normalizedResponse = response.lowercase()

        // Common success patterns (Arabic and English)
        val defaultSuccessKeywords = listOf(
            "نجحت", "تمت", "success", "successful", "completed", "done",
            "تم", "نجاح", "أنجزت", "مقبول"
        )

        // Common failure patterns (Arabic and English)
        val defaultFailureKeywords = listOf(
            "فشل", "خطأ", "error", "failed", "insufficient", "invalid",
            "رصيد غير كافي", "رقم خاطئ", "كلمة سر خاطئة", "غير صحيح"
        )

        // Check success keywords
        for (keyword in defaultSuccessKeywords) {
            if (normalizedResponse.contains(keyword.lowercase())) {
                Logger.i("Default success keyword matched: '$keyword'", TAG)
                return ParseResult.Success(response)
            }
        }

        // Check failure keywords
        for (keyword in defaultFailureKeywords) {
            if (normalizedResponse.contains(keyword.lowercase())) {
                Logger.i("Default failure keyword matched: '$keyword'", TAG)
                return ParseResult.Failure(response)
            }
        }

        // Unknown - conservative approach
        Logger.w("No default keywords matched, result unknown", TAG)
        return ParseResult.Unknown(response)
    }

    companion object {
        private const val TAG = "ResponseParser"

        /**
         * Create default parser with hardcoded rules
         */
        fun createDefault(): ResponseParser {
            val defaultRules = mapOf(
                "SYRIATEL" to OperatorRules(
                    operator = "SYRIATEL",
                    version = 1,
                    successKeywords = listOf(
                        "نجحت العملية",
                        "تمت العملية",
                        "تم التحويل",
                        "success",
                        "successful",
                        "completed"
                    ),
                    failureKeywords = listOf(
                        "فشلت العملية",
                        "خطأ",
                        "رصيد غير كافي",
                        "رقم خاطئ",
                        "كلمة سر خاطئة",
                        "error",
                        "failed",
                        "insufficient balance",
                        "invalid"
                    ),
                    updatedAt = "2025-11-16T00:00:00Z"
                ),
                "MTN" to OperatorRules(
                    operator = "MTN",
                    version = 1,
                    successKeywords = listOf(
                        "تمت بنجاح",
                        "نجحت",
                        "تم",
                        "success",
                        "successful",
                        "done"
                    ),
                    failureKeywords = listOf(
                        "فشل",
                        "خطأ",
                        "رصيد غير كافي",
                        "غير صحيح",
                        "error",
                        "failed",
                        "insufficient",
                        "invalid"
                    ),
                    updatedAt = "2025-11-16T00:00:00Z"
                )
            )

            return ResponseParser(defaultRules)
        }
    }
}

