package com.onevertix.easytransferagent.ussd

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.onevertix.easytransferagent.data.models.TransferJob
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.utils.Constants
import com.onevertix.easytransferagent.utils.Logger

/**
 * USSD executor for executing transfer and balance inquiry codes
 */
class UssdExecutor(private val context: Context) {

    private val secureStorage = SecureStorage(context)
    private val localPreferences = LocalPreferences(context)

    /**
     * Execute transfer USSD code
     */
    fun executeTransfer(job: TransferJob): Boolean {
        try {
            val password = secureStorage.getUssdPassword()
            if (password.isNullOrEmpty()) {
                Logger.e("USSD password not configured", tag = TAG)
                return false
            }

            val simSlot = getSIMSlotForOperator(job.operatorCode ?: "")
            if (simSlot == -1) {
                Logger.e("No SIM configured for operator: ${job.operatorCode}", tag = TAG)
                return false
            }

            val ussdCode = buildTransferUssdCode(
                phone = job.recipientPhone ?: "",
                amount = job.amount ?: 0,
                password = password,
                operator = job.operatorCode ?: ""
            )

            Logger.i("Executing transfer USSD for job: ${job.requestId}", tag = TAG)
            executeUssdCode(ussdCode, simSlot)
            return true

        } catch (e: Exception) {
            Logger.e("Failed to execute transfer USSD", e, TAG)
            return false
        }
    }

    /**
     * Execute balance inquiry USSD code
     */
    fun executeBalanceInquiry(operator: String): Boolean {
        try {
            val simSlot = getSIMSlotForOperator(operator)
            if (simSlot == -1) {
                Logger.e("No SIM configured for operator: $operator", tag = TAG)
                return false
            }

            val ussdCode = when (operator.uppercase()) {
                Constants.OPERATOR_SYRIATEL_UPPER -> Constants.SYRIATEL_BALANCE_CODE
                Constants.OPERATOR_MTN_UPPER -> Constants.MTN_BALANCE_CODE
                else -> {
                    Logger.e("Unknown operator: $operator", tag = TAG)
                    return false
                }
            }

            Logger.i("Executing balance inquiry USSD for operator: $operator", tag = TAG)
            executeUssdCode(ussdCode, simSlot)
            return true

        } catch (e: Exception) {
            Logger.e("Failed to execute balance USSD", e, TAG)
            return false
        }
    }

    /**
     * Build transfer USSD code based on operator
     */
    private fun buildTransferUssdCode(
        phone: String,
        amount: Int,
        password: String,
        operator: String
    ): String {
        return when (operator.uppercase()) {
            Constants.OPERATOR_SYRIATEL_UPPER -> {
                // Syriatel: *150*1*PASSWORD*1*PHONE*PHONE*AMOUNT#
                Constants.SYRIATEL_TRANSFER_PATTERN
                    .replace("{password}", password)
                    .replace("{phone}", phone)
                    .replace("{amount}", amount.toString())
            }
            Constants.OPERATOR_MTN_UPPER -> {
                // MTN: *135*PASSWORD*PHONE*AMOUNT#
                Constants.MTN_TRANSFER_PATTERN
                    .replace("{password}", password)
                    .replace("{phone}", phone)
                    .replace("{amount}", amount.toString())
            }
            else -> throw IllegalArgumentException("Unknown operator: $operator")
        }
    }

    /**
     * Execute USSD code on specific SIM slot
     */
    private fun executeUssdCode(ussdCode: String, simSlot: Int) {
        val encodedCode = Uri.encode(ussdCode)
        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:$encodedCode")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK

            // Add SIM slot selection (varies by manufacturer)
            putExtra("com.android.phone.extra.slot", simSlot)
            putExtra("Cdma_Supp", simSlot)
            putExtra("simSlot", simSlot)
        }

        context.startActivity(intent)
        Logger.d("USSD code executed on SIM slot: $simSlot", tag = TAG)
    }

    /**
     * Get SIM slot number for operator
     * Returns -1 if no matching SIM found
     */
    private fun getSIMSlotForOperator(operator: String): Int {
        val sim1Operator = localPreferences.getSim1Operator()
        val sim2Operator = localPreferences.getSim2Operator()

        return when (operator.uppercase()) {
            sim1Operator?.uppercase() -> 0
            sim2Operator?.uppercase() -> 1
            else -> -1
        }
    }

    companion object {
        private const val TAG = "UssdExecutor"
    }
}

