package com.onevertix.easytransferagent.ussd

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import androidx.core.content.ContextCompat
import com.onevertix.easytransferagent.data.models.TransferJob
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.utils.Constants
import com.onevertix.easytransferagent.utils.Logger

/**
 * USSD executor for executing transfer and balance inquiry codes
 * Supports dual SIM with TelecomManager
 */
class UssdExecutor(private val context: Context) {

    private val secureStorage = SecureStorage(context)
    private val localPreferences = LocalPreferences(context)
    private val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager

    /**
     * Execute transfer USSD code
     */
    fun executeTransfer(job: TransferJob): ExecutionResult {
        try {
            // Check CALL_PHONE permission
            if (!hasCallPermission()) {
                Logger.e("CALL_PHONE permission not granted", tag = TAG)
                return ExecutionResult.Error("Permission denied: CALL_PHONE required")
            }

            // Get USSD password
            val password = secureStorage.getUssdPassword()
            if (password.isNullOrEmpty()) {
                Logger.e("USSD password not configured", tag = TAG)
                return ExecutionResult.Error("USSD password not configured")
            }

            // Validate job data
            val phone = job.recipientPhone
            val amount = job.amount
            val operator = job.operatorCode

            if (phone.isNullOrEmpty() || amount == null || amount <= 0 || operator.isNullOrEmpty()) {
                Logger.e("Invalid job data: phone=$phone, amount=$amount, operator=$operator", tag = TAG)
                return ExecutionResult.Error("Invalid job data")
            }

            // Get SIM slot for operator
            val simSlot = getSIMSlotForOperator(operator)
            if (simSlot == -1) {
                Logger.e("No SIM configured for operator: $operator", tag = TAG)
                return ExecutionResult.Error("No SIM card found for operator $operator")
            }

            // Build USSD code
            val ussdCode = buildTransferUssdCode(
                phone = phone,
                amount = amount,
                password = password,
                operator = operator
            )

            // Log without exposing password (log only pattern)
            Logger.i("Executing transfer USSD for job: ${job.requestId}, operator: $operator, SIM slot: $simSlot", tag = TAG)

            // Execute USSD
            executeUssdCode(ussdCode, simSlot)

            return ExecutionResult.Success(
                jobId = job.requestId ?: job.jobId ?: "unknown",
                operator = operator,
                simSlot = simSlot
            )

        } catch (e: Exception) {
            Logger.e("Failed to execute transfer USSD: ${e.message}", e, TAG)
            return ExecutionResult.Error("Execution failed: ${e.message}")
        }
    }

    /**
     * Execute balance inquiry USSD code
     */
    fun executeBalanceInquiry(operator: String): ExecutionResult {
        try {
            // Check CALL_PHONE permission
            if (!hasCallPermission()) {
                Logger.e("CALL_PHONE permission not granted", tag = TAG)
                return ExecutionResult.Error("Permission denied: CALL_PHONE required")
            }

            val simSlot = getSIMSlotForOperator(operator)
            if (simSlot == -1) {
                Logger.e("No SIM configured for operator: $operator", tag = TAG)
                return ExecutionResult.Error("No SIM card found for operator $operator")
            }

            val ussdCode = when (operator.uppercase()) {
                Constants.OPERATOR_SYRIATEL_UPPER -> Constants.SYRIATEL_BALANCE_CODE
                Constants.OPERATOR_MTN_UPPER -> Constants.MTN_BALANCE_CODE
                else -> {
                    Logger.e("Unknown operator: $operator", tag = TAG)
                    return ExecutionResult.Error("Unknown operator: $operator")
                }
            }

            Logger.i("Executing balance inquiry USSD for operator: $operator, SIM slot: $simSlot", tag = TAG)
            executeUssdCode(ussdCode, simSlot)

            return ExecutionResult.Success(
                jobId = "balance_$operator",
                operator = operator,
                simSlot = simSlot
            )

        } catch (e: Exception) {
            Logger.e("Failed to execute balance USSD: ${e.message}", e, TAG)
            return ExecutionResult.Error("Execution failed: ${e.message}")
        }
    }

    /**
     * Check if CALL_PHONE permission is granted
     */
    private fun hasCallPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Build transfer USSD code based on operator
     * NOTE: Full USSD code is NEVER logged to protect password
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
     * Execute USSD code on specific SIM slot using TelecomManager
     */
    private fun executeUssdCode(ussdCode: String, simSlot: Int) {
        val encodedCode = Uri.encode(ussdCode)

        // Try dual SIM method first
        executeDualSimUssd(encodedCode, simSlot)

        // NEVER log the full USSD code (contains password)
        Logger.d("USSD code executed on SIM slot: $simSlot", tag = TAG)
    }

    /**
     * Execute USSD using TelecomManager (dual SIM support)
     */
    private fun executeDualSimUssd(encodedCode: String, simSlot: Int) {
        try {
            val phoneAccountHandle = getPhoneAccountHandleForSlot(simSlot)

            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$encodedCode")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK

                // Set the specific SIM card
                if (phoneAccountHandle != null) {
                    putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, phoneAccountHandle)
                    Logger.d("Using PhoneAccountHandle for SIM slot $simSlot", tag = TAG)
                } else {
                    // Fallback to legacy method
                    addLegacySimExtras(this, simSlot)
                }
            }

            context.startActivity(intent)

        } catch (e: Exception) {
            Logger.w("Failed to use TelecomManager, using legacy extras: ${e.message}", TAG)
            executeLegacyUssd(encodedCode, simSlot)
        }
    }

    /**
     * Get PhoneAccountHandle for specific SIM slot
     */
    private fun getPhoneAccountHandleForSlot(simSlot: Int): PhoneAccountHandle? {
        try {
            // Check READ_PHONE_STATE permission
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
                != PackageManager.PERMISSION_GRANTED) {
                Logger.w("READ_PHONE_STATE permission not granted, using legacy method", TAG)
                return null
            }

            val phoneAccounts = telecomManager?.callCapablePhoneAccounts ?: return null

            if (simSlot >= 0 && simSlot < phoneAccounts.size) {
                return phoneAccounts[simSlot]
            }

            Logger.w("SIM slot $simSlot out of range, available slots: ${phoneAccounts.size}", TAG)
            return phoneAccounts.getOrNull(0) // Fallback to first SIM

        } catch (e: SecurityException) {
            Logger.e("Security exception accessing phone accounts: ${e.message}", e, TAG)
            return null
        } catch (e: Exception) {
            Logger.e("Failed to get PhoneAccountHandle: ${e.message}", e, TAG)
            return null
        }
    }

    /**
     * Add legacy SIM selection extras to intent
     */
    private fun addLegacySimExtras(intent: Intent, simSlot: Int) {
        intent.apply {
            putExtra("com.android.phone.extra.slot", simSlot)
            putExtra("Cdma_Supp", simSlot)
            putExtra("simSlot", simSlot)
            putExtra("slot", simSlot)
            putExtra("simId", simSlot)
        }
    }

    /**
     * Execute USSD using legacy method (fallback)
     */
    private fun executeLegacyUssd(encodedCode: String, simSlot: Int) {
        val intent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:$encodedCode")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            addLegacySimExtras(this, simSlot)
        }

        context.startActivity(intent)
        Logger.d("Executed USSD using legacy method for SIM slot: $simSlot", tag = TAG)
    }

    /**
     * Get SIM slot number for operator
     * Returns -1 if no matching SIM found
     */
    private fun getSIMSlotForOperator(operator: String): Int {
        val sim1Operator = localPreferences.getSim1Operator()
        val sim2Operator = localPreferences.getSim2Operator()

        val normalizedOperator = operator.uppercase()

        return when {
            sim1Operator?.uppercase() == normalizedOperator -> 0
            sim2Operator?.uppercase() == normalizedOperator -> 1
            else -> {
                Logger.w("No SIM found for operator: $operator (SIM1: $sim1Operator, SIM2: $sim2Operator)", TAG)
                -1
            }
        }
    }

    /**
     * Get available SIM information for debugging
     */
    fun getAvailableSimInfo(): SimInfo {
        val sim1 = localPreferences.getSim1Operator()
        val sim2 = localPreferences.getSim2Operator()

        val phoneAccounts = try {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED) {
                telecomManager?.callCapablePhoneAccounts?.size ?: 0
            } else {
                0
            }
        } catch (e: SecurityException) {
            0
        }

        return SimInfo(
            sim1Operator = sim1,
            sim2Operator = sim2,
            availableSlots = phoneAccounts,
            hasCallPermission = hasCallPermission()
        )
    }

    companion object {
        private const val TAG = "UssdExecutor"
    }
}

/**
 * Result of USSD execution
 */
sealed class ExecutionResult {
    data class Success(
        val jobId: String,
        val operator: String,
        val simSlot: Int
    ) : ExecutionResult()

    data class Error(val message: String) : ExecutionResult()
}

/**
 * SIM information for debugging
 */
data class SimInfo(
    val sim1Operator: String?,
    val sim2Operator: String?,
    val availableSlots: Int,
    val hasCallPermission: Boolean
)

