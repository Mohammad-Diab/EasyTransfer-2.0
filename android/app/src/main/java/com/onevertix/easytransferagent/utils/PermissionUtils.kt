package com.onevertix.easytransferagent.utils

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Utility object for runtime permission management
 * Handles all permission checks and requests for the application
 */
object PermissionUtils {

    // Required permissions list
    private val REQUIRED_PERMISSIONS_BASE = arrayOf(
        Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_PHONE_STATE
    )

    /**
     * Get all required permissions for current Android version
     */
    fun getRequiredPermissions(): Array<String> {
        val permissions = REQUIRED_PERMISSIONS_BASE.toMutableList()

        // Add READ_PHONE_NUMBERS for dual SIM support (API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            permissions.add(Manifest.permission.READ_PHONE_NUMBERS)
        }

        // Add POST_NOTIFICATIONS for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        return permissions.toTypedArray()
    }

    /**
     * Check if CALL_PHONE permission is granted
     */
    fun hasCallPhonePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Check if READ_PHONE_STATE permission is granted
     */
    fun hasReadPhoneStatePermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Check if READ_PHONE_NUMBERS permission is granted (API 26+)
     */
    fun hasReadPhoneNumbersPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_PHONE_NUMBERS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true  // Not required for older versions
        }
    }

    /**
     * Check if POST_NOTIFICATIONS permission is granted (Android 13+)
     */
    fun hasPostNotificationsPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true  // Not required for older versions
        }
    }

    /**
     * Check if all required permissions are granted
     */
    fun hasAllRequiredPermissions(context: Context): Boolean {
        return hasCallPhonePermission(context) &&
                hasReadPhoneStatePermission(context) &&
                hasReadPhoneNumbersPermission(context) &&
                hasPostNotificationsPermission(context)
    }

    /**
     * Get list of missing permissions
     */
    fun getMissingPermissions(context: Context): List<String> {
        val missingPermissions = mutableListOf<String>()

        getRequiredPermissions().forEach { permission ->
            if (ContextCompat.checkSelfPermission(context, permission)
                != PackageManager.PERMISSION_GRANTED) {
                missingPermissions.add(permission)
            }
        }

        return missingPermissions
    }

    /**
     * Request all required permissions at once
     */
    fun requestAllPermissions(activity: Activity) {
        val missingPermissions = getMissingPermissions(activity)

        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                activity,
                missingPermissions.toTypedArray(),
                Constants.REQUEST_CODE_ALL_PERMISSIONS
            )
        }
    }

    /**
     * Request specific permission
     */
    fun requestPermission(activity: Activity, permission: String, requestCode: Int) {
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(permission),
            requestCode
        )
    }

    /**
     * Check if user has permanently denied permission (show rationale)
     */
    fun shouldShowRequestPermissionRationale(activity: Activity, permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }

    /**
     * Check if any permission was permanently denied
     */
    fun hasPermanentlyDeniedPermissions(activity: Activity): Boolean {
        return getMissingPermissions(activity).any { permission ->
            !shouldShowRequestPermissionRationale(activity, permission) &&
            ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Open app settings screen
     */
    fun openAppSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    /**
     * Handle permission result
     * Returns true if all permissions granted, false otherwise
     */
    fun handlePermissionResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ): PermissionResult {
        if (requestCode != Constants.REQUEST_CODE_ALL_PERMISSIONS) {
            return PermissionResult.Unknown
        }

        if (grantResults.isEmpty()) {
            return PermissionResult.Denied
        }

        val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }

        return if (allGranted) {
            PermissionResult.Granted
        } else {
            val deniedPermissions = permissions.filterIndexed { index, _ ->
                grantResults[index] != PackageManager.PERMISSION_GRANTED
            }
            PermissionResult.PartiallyDenied(deniedPermissions)
        }
    }

    /**
     * Get human-readable permission name
     */
    fun getPermissionName(permission: String): String {
        return when (permission) {
            Manifest.permission.CALL_PHONE -> "Phone Call"
            Manifest.permission.READ_PHONE_STATE -> "Phone State"
            Manifest.permission.READ_PHONE_NUMBERS -> "Phone Numbers"
            Manifest.permission.POST_NOTIFICATIONS -> "Notifications"
            else -> permission.substringAfterLast('.')
        }
    }

    /**
     * Get permission description for user
     */
    fun getPermissionDescription(permission: String): String {
        return when (permission) {
            Manifest.permission.CALL_PHONE ->
                "Required to execute USSD codes for money transfers"
            Manifest.permission.READ_PHONE_STATE ->
                "Required to detect SIM cards and manage dual SIM"
            Manifest.permission.READ_PHONE_NUMBERS ->
                "Required for dual SIM support and operator detection"
            Manifest.permission.POST_NOTIFICATIONS ->
                "Required to show transfer status notifications"
            else -> "Required for app functionality"
        }
    }

    /**
     * Permission result sealed class
     */
    sealed class PermissionResult {
        object Granted : PermissionResult()
        object Denied : PermissionResult()
        data class PartiallyDenied(val deniedPermissions: List<String>) : PermissionResult()
        object Unknown : PermissionResult()
    }
}

