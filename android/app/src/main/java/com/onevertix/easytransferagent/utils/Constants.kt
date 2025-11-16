package com.onevertix.easytransferagent.utils

/**
 * Application constants
 */
object Constants {

    // API Related
    const val DEFAULT_SERVER_URL = "https://api.easytransfer.com"
    const val AUTH_HEADER_PREFIX = "Bearer "
    const val DEVICE_ID_HEADER = "X-Device-ID"

    // USSD Patterns
    const val SYRIATEL_TRANSFER_PATTERN = "*150*1*{password}*1*{phone}*{phone}*{amount}#"
    const val MTN_TRANSFER_PATTERN = "*135*{password}*{phone}*{amount}#"
    const val SYRIATEL_BALANCE_CODE = "*141#"
    const val MTN_BALANCE_CODE = "*141#"

    // Operators
    const val OPERATOR_SYRIATEL = "syriatel"
    const val OPERATOR_MTN = "mtn"
    const val OPERATOR_SYRIATEL_UPPER = "SYRIATEL"
    const val OPERATOR_MTN_UPPER = "MTN"

    // Job Types
    const val JOB_TYPE_TRANSFER = "transfer"
    const val JOB_TYPE_BALANCE = "balance"

    // Transfer Status
    const val STATUS_SUCCESS = "success"
    const val STATUS_FAILED = "failed"

    // Polling
    const val POLLING_INTERVAL_MS = 3000L  // 3 seconds
    const val POLLING_INTERVAL_SLOW_MS = 5000L  // 5 seconds
    const val POLLING_INTERVAL_ERROR_MS = 10000L  // 10 seconds

    // Notifications
    const val NOTIFICATION_CHANNEL_ID = "transfer_execution"
    const val NOTIFICATION_CHANNEL_NAME = "Transfer Execution"
    const val SERVICE_NOTIFICATION_ID = 1001

    // Permissions Request Codes
    const val REQUEST_CODE_ALL_PERMISSIONS = 1000
    const val REQUEST_CODE_CALL_PHONE = 1001
    const val REQUEST_CODE_READ_PHONE_STATE = 1002
    const val REQUEST_CODE_POST_NOTIFICATIONS = 1003
    const val REQUEST_CODE_READ_PHONE_NUMBERS = 1004

    // Timeout
    const val USSD_TIMEOUT_MS = 60000L  // 60 seconds
    const val API_TIMEOUT_SECONDS = 30L
}

