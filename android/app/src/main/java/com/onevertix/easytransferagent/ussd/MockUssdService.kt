package com.onevertix.easytransferagent.ussd

import com.onevertix.easytransferagent.BuildConfig
import com.onevertix.easytransferagent.data.models.TransferJob
import com.onevertix.easytransferagent.utils.Logger
import kotlinx.coroutines.delay
import kotlin.random.Random

/**
 * Mock USSD service for testing on emulator/VM
 * Automatically enabled in debug builds, disabled in release
 */
class MockUssdService {

    companion object {
        private const val TAG = "MockUssdService"

        /**
         * Check if mock USSD is enabled
         */
        fun isEnabled(): Boolean = BuildConfig.USE_MOCK_USSD

        /**
         * Get mock delay duration
         */
        fun getDelayMs(): Long = BuildConfig.MOCK_USSD_DELAY_MS
    }

    /**
     * Execute mock transfer with simulated delay
     */
    suspend fun executeMockTransfer(
        job: TransferJob
    ): MockUssdResult {
        val operator = job.operatorCode ?: "UNKNOWN"
        val phone = job.recipientPhone ?: "0900000000"
        val amount = job.amount ?: 0

        Logger.d("🧪 MOCK USSD: Transfer $amount SYP to $phone via $operator", TAG)

        // Simulate USSD processing time
        delay(getDelayMs())

        // Simulate occasional failures (10% failure rate)
        if (Random.nextFloat() < 0.1f) {
            Logger.w("🧪 MOCK USSD: Simulated failure", TAG)
            return MockUssdResult(
                success = false,
                response = when (operator.uppercase()) {
                    "SYRIATEL" -> "فشلت العملية. رصيد غير كافي"
                    "MTN" -> "فشل التحويل. رصيد غير كافي"
                    else -> "Transfer failed. Insufficient balance"
                }
            )
        }

        // Simulate successful response
        val response = when (operator.uppercase()) {
            "SYRIATEL" -> buildSyriatelResponse(amount, phone)
            "MTN" -> buildMtnResponse(amount, phone)
            else -> "Transfer completed successfully"
        }

        Logger.i("🧪 MOCK USSD: Success - $response", TAG)
        return MockUssdResult(
            success = true,
            response = response
        )
    }

    /**
     * Execute mock balance inquiry
     */
    suspend fun executeMockBalance(operator: String): MockUssdResult {
        Logger.d("🧪 MOCK USSD: Balance check for $operator", TAG)

        // Simulate USSD processing time
        delay(getDelayMs())

        val balance = Random.nextInt(1000, 10000)
        val response = when (operator.lowercase()) {
            "syriatel" -> "رصيدك الحالي: $balance ليرة سورية"
            "mtn" -> "الرصيد المتوفر: $balance ليرة"
            else -> "Your balance is: $balance SYP"
        }

        Logger.i("🧪 MOCK USSD: Balance retrieved - $response", TAG)
        return MockUssdResult(
            success = true,
            response = response
        )
    }

    /**
     * Build realistic Syriatel response
     */
    private fun buildSyriatelResponse(amount: Int, phone: String): String {
        val ref = "SYR${System.currentTimeMillis() % 1000000}"
        val remainingBalance = Random.nextInt(2000, 8000)
        return """
            تمت العملية بنجاح
            تم تحويل $amount ليرة سورية إلى $phone
            الرصيد المتبقي: $remainingBalance ليرة
            رقم العملية: $ref
        """.trimIndent()
    }

    /**
     * Build realistic MTN response
     */
    private fun buildMtnResponse(amount: Int, phone: String): String {
        val ref = "MTN${System.currentTimeMillis() % 1000000}"
        val remainingBalance = Random.nextInt(1000, 5000)
        return """
            تمت بنجاح
            المبلغ: $amount ل.س
            إلى: $phone
            الرصيد: $remainingBalance ل.س
            المرجع: $ref
        """.trimIndent()
    }
}

/**
 * Mock USSD execution result
 */
data class MockUssdResult(
    val success: Boolean,
    val response: String
)

