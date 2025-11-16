package com.onevertix.easytransferagent.data.repository

import android.content.Context
import com.onevertix.easytransferagent.data.api.ApiService
import com.onevertix.easytransferagent.data.api.RetrofitClient
import com.onevertix.easytransferagent.data.models.CachedRules
import com.onevertix.easytransferagent.data.models.OperatorRules
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.ussd.ResponseParser
import com.onevertix.easytransferagent.utils.Logger
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

/**
 * Repository for managing operator rules
 */
class RulesRepository(
    private val context: Context,
    private val localPrefs: LocalPreferences
) {

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private var cachedParser: ResponseParser? = null

    /**
     * Get response parser (uses cached rules or default)
     */
    fun getParser(): ResponseParser {
        // Return cached parser if available
        cachedParser?.let { return it }

        // Try to load cached rules
        val cached = loadCachedRules()
        if (cached != null) {
            Logger.i("Using cached rules version ${cached.version}", TAG)
            cachedParser = ResponseParser(cached.rules)
            return cachedParser!!
        }

        // Fallback to default parser
        Logger.i("Using default hardcoded rules", TAG)
        cachedParser = ResponseParser.createDefault()
        return cachedParser!!
    }

    /**
     * Fetch rules from backend and cache them
     */
    suspend fun fetchAndCacheRules(): Result<Unit> {
        return try {
            val api = getApi()
            val response = api.getOperatorRules(
                token = "", // Will be added by AuthInterceptor
                deviceId = "" // Will be added by AuthInterceptor
            )

            if (response.isSuccessful && response.body() != null) {
                val rulesResponse = response.body()!!

                // Convert list to map
                val rulesMap = rulesResponse.rules.associateBy { it.operator.uppercase() }

                // Cache rules
                cacheRules(CachedRules(
                    rules = rulesMap,
                    version = rulesResponse.version,
                    cachedAt = System.currentTimeMillis()
                ))

                // Update parser
                cachedParser = ResponseParser(rulesMap)

                Logger.i("Fetched and cached rules version ${rulesResponse.version}", TAG)
                Result.success(Unit)
            } else {
                Logger.e("Failed to fetch rules: ${response.code()}", null, TAG)
                Result.failure(Exception("Failed to fetch rules: ${response.code()}"))
            }

        } catch (e: Exception) {
            Logger.e("Error fetching rules: ${e.message}", e, TAG)
            Result.failure(e)
        }
    }

    /**
     * Check if rules need updating (compare version with backend)
     */
    suspend fun checkForUpdates(): Boolean {
        return try {
            val cached = loadCachedRules()
            val currentVersion = cached?.version ?: 0

            val api = getApi()
            val response = api.getRulesVersion(
                token = "",
                deviceId = ""
            )

            if (response.isSuccessful && response.body() != null) {
                val serverVersion = response.body()!!["version"] ?: 0
                val needsUpdate = serverVersion > currentVersion

                if (needsUpdate) {
                    Logger.i("Rules update available: $currentVersion -> $serverVersion", TAG)
                }

                needsUpdate
            } else {
                Logger.w("Failed to check rules version: ${response.code()}", TAG)
                false
            }

        } catch (e: Exception) {
            Logger.e("Error checking rules version: ${e.message}", e, TAG)
            false
        }
    }

    /**
     * Load cached rules from local storage
     */
    private fun loadCachedRules(): CachedRules? {
        return try {
            val json = localPrefs.getOperatorRules()
            if (json.isNullOrEmpty()) return null

            val adapter = moshi.adapter(CachedRules::class.java)
            adapter.fromJson(json)

        } catch (e: Exception) {
            Logger.e("Error loading cached rules: ${e.message}", e, TAG)
            null
        }
    }

    /**
     * Cache rules to local storage
     */
    private fun cacheRules(cached: CachedRules) {
        try {
            val adapter = moshi.adapter(CachedRules::class.java)
            val json = adapter.toJson(cached)
            localPrefs.saveOperatorRules(json)

            Logger.d("Rules cached successfully", TAG)

        } catch (e: Exception) {
            Logger.e("Error caching rules: ${e.message}", e, TAG)
        }
    }

    /**
     * Get API service
     */
    private fun getApi(): ApiService {
        val baseUrl = localPrefs.getServerUrl()
            ?: throw IllegalStateException("Server URL not configured")
        return RetrofitClient.getClient(baseUrl)
    }

    companion object {
        private const val TAG = "RulesRepository"
    }
}

