package com.onevertix.easytransferagent.utils

import android.util.Log
import com.onevertix.easytransferagent.BuildConfig
import java.text.SimpleDateFormat
import java.util.*

/**
 * Logger utility with sensitive data protection
 */
object Logger {

    private const val TAG = "EasyTransferAgent"

    /**
     * Log info message
     */
    fun i(message: String, tag: String = TAG) {
        Log.i(tag, message)
    }

    /**
     * Log debug message (only in debug builds)
     */
    fun d(message: String, tag: String = TAG) {
        if (BuildConfig.DEBUG) {
            Log.d(tag, message)
        }
    }

    /**
     * Log warning message
     */
    fun w(message: String, tag: String = TAG) {
        Log.w(tag, message)
    }

    /**
     * Log error message
     */
    fun e(message: String, throwable: Throwable? = null, tag: String = TAG) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
    }

    /**
     * Mask phone number for safe logging
     * Example: 0912345678 -> 091234****
     */
    fun maskPhone(phone: String): String {
        if (phone.length < 6) return "****"
        return phone.substring(0, 6) + "****"
    }

    /**
     * Mask sensitive data (password, token, etc.)
     */
    fun maskSensitive(data: String): String {
        return "****"
    }

    /**
     * Get current timestamp in ISO 8601 format
     */
    fun getCurrentTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }
}

