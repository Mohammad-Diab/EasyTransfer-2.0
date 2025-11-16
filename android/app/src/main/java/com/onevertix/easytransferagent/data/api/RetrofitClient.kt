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
 * Retrofit client builder for API communication
 */
object RetrofitClient {

    private var retrofit: Retrofit? = null

    fun getClient(baseUrl: String): ApiService {
        if (retrofit == null || retrofit?.baseUrl().toString() != baseUrl) {
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
            .addInterceptor(createLoggingInterceptor())
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    private fun createLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    fun resetClient() {
        retrofit = null
    }
}

