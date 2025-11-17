package com.onevertix.easytransferagent.utils

object Validation {
    // Only accepts 09XXXXXXXX format (local Syrian format)
    private val syLocalRegex = Regex("^09\\d{8}$")
    private val otpRegex = Regex("^\\d{6}$")

    /**
     * Validates Syrian phone number - MUST be in 09xxxxxxxx format
     */
    fun isValidSyrianPhone(input: String): Boolean {
        val clean = input.trim().replace(" ", "")
        return syLocalRegex.matches(clean)
    }

    /**
     * Normalize phone number to 09xxxxxxxx format only.
     * If input is not already 09xxxxxxxx, throw error so caller can show validation message.
     */
    fun normalizeToLocalSyrian(input: String): String {
        val clean = input.trim().replace(" ", "")
        if (!syLocalRegex.matches(clean)) {
            throw IllegalArgumentException("Phone must be in 09xxxxxxxx format")
        }
        return clean
    }

    fun isValidOtp(input: String): Boolean = otpRegex.matches(input.trim())
}
