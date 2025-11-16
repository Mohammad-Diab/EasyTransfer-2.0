package com.onevertix.easytransferagent.data.api

import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.logging.HttpLoggingInterceptor.Level

/**
 * Safe logging interceptor that redacts sensitive data
 */
class SafeLoggingInterceptor : HttpLoggingInterceptor.Logger {

    private val sensitiveKeys = setOf(
        "password",
        "ussd_password",
        "access_token",
        "otp",
        "authorization",
        "x-device-id"
    )

    override fun log(message: String) {
        var safeMessage = message

        // Redact Authorization headers
        if (message.contains("Authorization:", ignoreCase = true)) {
            safeMessage = message.replace(
                Regex("Authorization: Bearer [^ ]+", RegexOption.IGNORE_CASE),
                "Authorization: Bearer [REDACTED]"
            )
        }

        // Redact X-Device-ID headers
        if (message.contains("X-Device-ID:", ignoreCase = true)) {
            safeMessage = safeMessage.replace(
                Regex("X-Device-ID: [^ ]+", RegexOption.IGNORE_CASE),
                "X-Device-ID: [REDACTED]"
            )
        }

        // Redact sensitive JSON fields
        sensitiveKeys.forEach { key ->
            safeMessage = safeMessage.replace(
                Regex("\"$key\"\\s*:\\s*\"[^\"]+\"", RegexOption.IGNORE_CASE),
                "\"$key\":\"[REDACTED]\""
            )
        }

        // Redact phone numbers (partial masking)
        safeMessage = safeMessage.replace(
            Regex("(\\+?963|0)9(\\d{2})\\d{6}"),
            "$1$2******"
        )

        android.util.Log.d("HTTP", safeMessage)
    }
}

/**
 * Factory for creating safe logging interceptors
 */
object SafeLoggingInterceptorFactory {

    fun create(level: Level = Level.BODY): HttpLoggingInterceptor {
        return HttpLoggingInterceptor(SafeLoggingInterceptor()).apply {
            this.level = level
        }
    }
}

