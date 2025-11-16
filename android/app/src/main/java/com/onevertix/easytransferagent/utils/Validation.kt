package com.onevertix.easytransferagent.utils

object Validation {
    // Accepts +9639XXXXXXXX or 09XXXXXXXX, normalizes to +9639XXXXXXXX
    private val syLocalRegex = Regex("^09\\d{8}$")
    private val syE164Regex = Regex("^\\+9639\\d{8}$")
    private val otpRegex = Regex("^\\d{6}$")

    fun isValidSyrianPhone(input: String): Boolean {
        val clean = input.trim().replace(" ", "")
        return syLocalRegex.matches(clean) || syE164Regex.matches(clean)
    }

    fun normalizeToE164Syrian(input: String): String {
        val clean = input.trim().replace(" ", "")
        return when {
            syE164Regex.matches(clean) -> clean
            syLocalRegex.matches(clean) -> "+963" + clean.drop(1)
            else -> clean // return as-is; caller should validate first
        }
    }

    fun isValidOtp(input: String): Boolean = otpRegex.matches(input.trim())
}
