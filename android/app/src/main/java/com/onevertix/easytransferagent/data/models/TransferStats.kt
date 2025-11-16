package com.onevertix.easytransferagent.data.models

/**
 * Transfer statistics for dashboard display
 */
data class TransferStats(
    val todayCount: Int = 0,
    val todaySuccess: Int = 0,
    val todayFailed: Int = 0,
    val weekCount: Int = 0,
    val totalCount: Int = 0,
    val lastTransferTime: String? = null,
    val pendingJobsCount: Int = 0,
    val serviceRunning: Boolean = false,
    val connected: Boolean = false
)

/**
 * Transfer history item
 */
data class TransferHistoryItem(
    val requestId: String,
    val status: String,  // success, failed, unknown, error
    val operator: String,
    val amount: Int?,
    val message: String,
    val timestamp: String
)

