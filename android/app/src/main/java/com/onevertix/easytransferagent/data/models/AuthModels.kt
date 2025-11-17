package com.onevertix.easytransferagent.data.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Response from OTP request endpoint
 */
@JsonClass(generateAdapter = true)
data class OtpRequestResponse(
    @Json(name = "success")
    val success: Boolean = true,  // Default to true if not provided

    @Json(name = "message")
    val message: String
)

/**
 * Response from OTP verification endpoint
 */
@JsonClass(generateAdapter = true)
data class AuthResponse(
    @Json(name = "access_token")
    val accessToken: String,

    @Json(name = "device_id")
    val deviceId: String,

    @Json(name = "expires_in")
    val expiresIn: Long,  // 90 days in seconds

    @Json(name = "user")
    val user: User
)

/**
 * User info from auth response
 */
@JsonClass(generateAdapter = true)
data class User(
    @Json(name = "id")
    val id: String,

    @Json(name = "phone")
    val phone: String,

    @Json(name = "name")
    val name: String?,

    @Json(name = "role")
    val role: String
)

/**
 * Request body for OTP request
 */
@JsonClass(generateAdapter = true)
data class OtpRequest(
    @Json(name = "phone")
    val phone: String
)

/**
 * Request body for OTP verification
 */
@JsonClass(generateAdapter = true)
data class OtpVerification(
    @Json(name = "phone")
    val phone: String,

    @Json(name = "code")
    val code: String,

    @Json(name = "device_id")
    val deviceId: String,

    @Json(name = "device_name")
    val deviceName: String
)

