package com.onevertix.easytransferagent.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.onevertix.easytransferagent.MainActivity
import com.onevertix.easytransferagent.R
import com.onevertix.easytransferagent.data.repository.DefaultTransferRepository
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.utils.Logger
import kotlinx.coroutines.*
import kotlin.math.min

/**
 * Foreground service for polling and executing transfer jobs
 * Runs continuously, polling backend every 3-5 seconds
 */
class TransferExecutorService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var pollingJob: Job? = null

    private lateinit var transferRepository: DefaultTransferRepository
    private lateinit var notificationManager: NotificationManager

    // Polling configuration
    private var pollingInterval = POLLING_INTERVAL_NORMAL
    private var consecutiveErrors = 0

    override fun onCreate() {
        super.onCreate()
        Logger.i("TransferExecutorService created", TAG)

        // Initialize dependencies
        val localPrefs = LocalPreferences(this)
        transferRepository = DefaultTransferRepository(localPrefs)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Logger.i("TransferExecutorService started", TAG)

        when (intent?.action) {
            ACTION_START -> startPolling()
            ACTION_STOP -> stopSelf()
            else -> startPolling()
        }

        // Start foreground service with notification
        startForeground(NOTIFICATION_ID, createNotification("Service running"))

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null  // Not a bound service
    }

    override fun onDestroy() {
        super.onDestroy()
        Logger.i("TransferExecutorService destroyed", TAG)
        stopPolling()
        serviceScope.cancel()
    }

    /**
     * Start polling for jobs
     */
    private fun startPolling() {
        if (pollingJob?.isActive == true) {
            Logger.d("Polling already active", TAG)
            return
        }

        Logger.i("Starting job polling", TAG)
        pollingJob = serviceScope.launch {
            while (isActive) {
                try {
                    pollForJobs()

                    // Reset error counter on success
                    if (consecutiveErrors > 0) {
                        consecutiveErrors = 0
                        pollingInterval = POLLING_INTERVAL_NORMAL
                    }

                    // Wait for next poll
                    delay(pollingInterval)

                } catch (e: Exception) {
                    Logger.e("Polling error: ${e.message}", TAG, e)
                    handlePollingError()
                    delay(pollingInterval)
                }
            }
        }
    }

    /**
     * Stop polling
     */
    private fun stopPolling() {
        Logger.i("Stopping job polling", TAG)
        pollingJob?.cancel()
        pollingJob = null
    }

    /**
     * Poll backend for pending jobs
     */
    private suspend fun pollForJobs() {
        Logger.d("Polling for pending jobs...", TAG)

        val result = transferRepository.getPendingJobs()

        if (result.isSuccess) {
            val jobs = result.getOrNull() ?: emptyList()
            Logger.i("Received ${jobs.size} pending jobs", TAG)

            if (jobs.isNotEmpty()) {
                // Update notification
                updateNotification("Processing ${jobs.size} job(s)")

                // Adjust polling interval (faster when jobs present)
                pollingInterval = POLLING_INTERVAL_ACTIVE

                // TODO: Task 6 - Execute jobs via USSD
                // For now, just log them
                jobs.forEach { job ->
                    Logger.d("Job: ${job.jobType} - ${job.requestId ?: job.jobId}", TAG)
                }
            } else {
                // No jobs - slower polling
                pollingInterval = POLLING_INTERVAL_NORMAL
                updateNotification("Waiting for jobs")
            }
        } else {
            val error = result.exceptionOrNull()
            Logger.e("Failed to fetch jobs: ${error?.message}", TAG, error)
            handlePollingError()
        }
    }

    /**
     * Handle polling errors with exponential backoff
     */
    private fun handlePollingError() {
        consecutiveErrors++

        // Exponential backoff: 5s, 10s, 20s, 30s (max)
        pollingInterval = min(
            POLLING_INTERVAL_ERROR * (1 shl (consecutiveErrors - 1)),
            POLLING_INTERVAL_MAX_BACKOFF
        )

        Logger.w("Polling error #$consecutiveErrors, backing off to ${pollingInterval}ms", TAG)
        updateNotification("Connection error, retrying...")
    }

    /**
     * Create notification channel (required for Android 8+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Transfer Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Runs continuously to process money transfers"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Create foreground service notification
     */
    private fun createNotification(message: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Transfer Service Active")
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_menu_send) // TODO: Use custom icon
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    /**
     * Update notification text
     */
    private fun updateNotification(message: String) {
        val notification = createNotification(message)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        private const val TAG = "TransferExecutorService"

        // Notification
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "transfer_service_channel"

        // Actions
        const val ACTION_START = "com.onevertix.easytransferagent.ACTION_START_SERVICE"
        const val ACTION_STOP = "com.onevertix.easytransferagent.ACTION_STOP_SERVICE"

        // Polling intervals (milliseconds)
        private const val POLLING_INTERVAL_ACTIVE = 3000L      // 3 seconds (when jobs present)
        private const val POLLING_INTERVAL_NORMAL = 5000L      // 5 seconds (idle)
        private const val POLLING_INTERVAL_ERROR = 5000L       // 5 seconds (first error)
        private const val POLLING_INTERVAL_MAX_BACKOFF = 30000L // 30 seconds (max backoff)

        /**
         * Start the transfer service
         */
        fun start(context: Context) {
            val intent = Intent(context, TransferExecutorService::class.java).apply {
                action = ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop the transfer service
         */
        fun stop(context: Context) {
            val intent = Intent(context, TransferExecutorService::class.java).apply {
                action = ACTION_STOP
            }
            context.stopService(intent)
        }
    }
}

