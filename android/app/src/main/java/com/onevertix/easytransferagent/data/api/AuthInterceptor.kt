package com.onevertix.easytransferagent.data.api

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Authentication interceptor that adds Bearer token and Device ID headers
 */
class AuthInterceptor(
    private val tokenProvider: () -> String?,
    private val deviceIdProvider: () -> String?
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val builder = originalRequest.newBuilder()

        // Add Authorization header if token is available
        tokenProvider()?.let { token ->
            builder.header("Authorization", "Bearer $token")
        }

        // Add X-Device-ID header if device ID is available
        deviceIdProvider()?.let { deviceId ->
            builder.header("X-Device-ID", deviceId)
        }

        return chain.proceed(builder.build())
    }
}

