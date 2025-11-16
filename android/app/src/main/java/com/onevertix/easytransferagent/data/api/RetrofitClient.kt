package com.onevertix.easytransferagent.data.api

import com.onevertix.easytransferagent.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Retrofit client builder for API communication with authentication support
 */
object RetrofitClient {

    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String? = null

    // Token and Device ID providers for authentication
    private var tokenProvider: (() -> String?)? = null
    private var deviceIdProvider: (() -> String?)? = null

    /**
     * Set providers for authentication headers
     */
    fun setAuthProviders(
        tokenProvider: () -> String?,
        deviceIdProvider: () -> String?
    ) {
        this.tokenProvider = tokenProvider
        this.deviceIdProvider = deviceIdProvider
        // Reset client to rebuild with new providers
        if (currentBaseUrl != null) {
            resetClient()
        }
    }

    fun getClient(baseUrl: String): ApiService {
        if (retrofit == null || currentBaseUrl != baseUrl) {
            currentBaseUrl = baseUrl
            retrofit = buildRetrofit(baseUrl)
        }
        return retrofit!!.create(ApiService::class.java)
    }

    private fun buildRetrofit(baseUrl: String): Retrofit {
        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .apply {
                // Add authentication interceptor if providers are set
                if (tokenProvider != null && deviceIdProvider != null) {
                    addInterceptor(
                        AuthInterceptor(
                            tokenProvider = tokenProvider!!,
                            deviceIdProvider = deviceIdProvider!!
                        )
                    )
                }

                // Add safe logging interceptor
                addInterceptor(createSafeLoggingInterceptor())
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    private fun createSafeLoggingInterceptor(): HttpLoggingInterceptor {
        return if (BuildConfig.DEBUG) {
            SafeLoggingInterceptorFactory.create(HttpLoggingInterceptor.Level.BODY)
        } else {
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    fun resetClient() {
        retrofit = null
    }
}

