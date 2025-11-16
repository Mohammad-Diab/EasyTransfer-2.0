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
import com.onevertix.easytransferagent.ussd.UssdExecutor
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
    private lateinit var ussdExecutor: UssdExecutor
    private lateinit var rulesRepository: com.onevertix.easytransferagent.data.repository.RulesRepository
    private lateinit var responseParser: com.onevertix.easytransferagent.ussd.ResponseParser

    // Polling configuration
    private var pollingInterval = POLLING_INTERVAL_NORMAL
    private var consecutiveErrors = 0

    // Job execution queue
    private val jobQueue = mutableListOf<com.onevertix.easytransferagent.data.models.TransferJob>()
    private var isExecutingJob = false

    override fun onCreate() {
        super.onCreate()
        Logger.i("TransferExecutorService created", TAG)

        // Initialize dependencies
        val localPrefs = LocalPreferences(this)
        transferRepository = DefaultTransferRepository(localPrefs)
        ussdExecutor = UssdExecutor(this)
        rulesRepository = com.onevertix.easytransferagent.data.repository.RulesRepository(this, localPrefs)
        responseParser = rulesRepository.getParser()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel
        createNotificationChannel()

        // Fetch latest rules from backend (async, don't block)
        serviceScope.launch {
            try {
                rulesRepository.fetchAndCacheRules()
                // Update parser with fresh rules
                responseParser = rulesRepository.getParser()
                Logger.i("Rules refreshed successfully", TAG)
            } catch (e: Exception) {
                Logger.w("Failed to refresh rules, using cached/default: ${e.message}", TAG)
            }
        }
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

                // Add jobs to queue
                synchronized(jobQueue) {
                    jobQueue.addAll(jobs)
                }

                // Execute jobs
                executeNextJob()
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
     * Execute next job in queue
     */
    private fun executeNextJob() {
        if (isExecutingJob) {
            Logger.d("Job execution already in progress", TAG)
            return
        }

        val job = synchronized(jobQueue) {
            if (jobQueue.isEmpty()) null else jobQueue.removeAt(0)
        } ?: return

        isExecutingJob = true

        serviceScope.launch {
            try {
                Logger.i("Executing job: ${job.jobType} - ${job.requestId ?: job.jobId}", TAG)

                when (job.jobType) {
                    "transfer" -> executeTransferJob(job)
                    "balance" -> executeBalanceJob(job)
                    else -> {
                        Logger.w("Unknown job type: ${job.jobType}", TAG)
                    }
                }

                // Wait before next job (give time for USSD to complete)
                delay(JOB_EXECUTION_DELAY)

            } catch (e: Exception) {
                Logger.e("Error executing job: ${e.message}", e, TAG)
            } finally {
                isExecutingJob = false

                // Execute next job if queue not empty
                if (jobQueue.isNotEmpty()) {
                    executeNextJob()
                }
            }
        }
    }

    /**
     * Execute transfer job
     */
    private suspend fun executeTransferJob(job: com.onevertix.easytransferagent.data.models.TransferJob) {
        updateNotification("Executing transfer to ${job.recipientPhone?.takeLast(4)?.let { "***$it" } ?: "unknown"}")

        val result = ussdExecutor.executeTransfer(job)

        when (result) {
            is com.onevertix.easytransferagent.ussd.ExecutionResult.Success -> {
                Logger.i("Transfer USSD executed successfully: ${result.jobId}", TAG)

                // Get response (simulated for now, will be from Accessibility Service)
                val simulatedResponse = simulateUssdResponse(result.operator)

                // Parse the response
                val parseResult = responseParser.parseResponse(result.operator, simulatedResponse)

                // Determine status and report to backend
                val (status, message) = when (parseResult) {
                    is com.onevertix.easytransferagent.data.models.ParseResult.Success -> {
                        Logger.i("Transfer successful: ${parseResult.message}", TAG)
                        updateNotification("Transfer completed successfully")
                        "success" to parseResult.message
                    }
                    is com.onevertix.easytransferagent.data.models.ParseResult.Failure -> {
                        Logger.w("Transfer failed: ${parseResult.message}", TAG)
                        updateNotification("Transfer failed")
                        "failed" to parseResult.message
                    }
                    is com.onevertix.easytransferagent.data.models.ParseResult.Unknown -> {
                        Logger.w("Transfer result unknown: ${parseResult.message}", TAG)
                        updateNotification("Transfer result unclear")
                        "unknown" to parseResult.message
                    }
                }

                // Report to backend
                reportTransferResult(
                    requestId = job.requestId ?: job.jobId ?: "unknown",
                    jobId = job.jobId,
                    status = status,
                    message = message,
                    operator = result.operator,
                    simSlot = result.simSlot
                )
            }
            is com.onevertix.easytransferagent.ussd.ExecutionResult.Error -> {
                Logger.e("Transfer execution failed: ${result.message}", TAG)
                updateNotification("Transfer error: ${result.message}")

                // Report error to backend
                reportTransferResult(
                    requestId = job.requestId ?: job.jobId ?: "unknown",
                    jobId = job.jobId,
                    status = "error",
                    message = result.message,
                    operator = job.operatorCode ?: "UNKNOWN",
                    simSlot = -1
                )
            }
        }
    }

    /**
     * Report transfer result to backend
     */
    private suspend fun reportTransferResult(
        requestId: String,
        jobId: String?,
        status: String,
        message: String,
        operator: String,
        simSlot: Int
    ) {
        try {
            val report = com.onevertix.easytransferagent.data.models.TransferResultReport(
                requestId = requestId,
                jobId = jobId,
                status = status,
                message = message,
                executedAt = java.time.Instant.now().toString(),
                operator = operator,
                simSlot = simSlot
            )

            val result = transferRepository.reportTransferResultNew(report)

            if (result.isSuccess) {
                Logger.i("Transfer result reported successfully: $requestId", TAG)
            } else {
                Logger.e("Failed to report transfer result: ${result.exceptionOrNull()?.message}", TAG)
                // TODO: Queue for retry with WorkManager
            }

        } catch (e: Exception) {
            Logger.e("Error reporting transfer result: ${e.message}", e, TAG)
            // TODO: Queue for retry with WorkManager
        }
    }

    /**
     * Simulate USSD response for testing (will be replaced by Accessibility Service)
     */
    private fun simulateUssdResponse(operator: String): String {
        // Simulate a successful response
        return when (operator.uppercase()) {
            "SYRIATEL" -> "تمت العملية بنجاح" // "Operation completed successfully"
            "MTN" -> "تمت بنجاح" // "Completed successfully"
            else -> "Success"
        }
    }

    /**
     * Execute balance inquiry job
     */
    private suspend fun executeBalanceJob(job: com.onevertix.easytransferagent.data.models.TransferJob) {
        val operator = job.operator ?: return

        updateNotification("Checking balance for $operator")

        val result = ussdExecutor.executeBalanceInquiry(operator)

        when (result) {
            is com.onevertix.easytransferagent.ussd.ExecutionResult.Success -> {
                Logger.i("Balance inquiry executed successfully for $operator", TAG)

                // Simulated response
                val simulatedResponse = simulateBalanceResponse(operator)
                val parseResult = responseParser.parseResponse(operator, simulatedResponse)

                val (status, message) = when (parseResult) {
                    is com.onevertix.easytransferagent.data.models.ParseResult.Success -> {
                        Logger.i("Balance check successful: ${parseResult.message}", TAG)
                        "success" to parseResult.message
                    }
                    else -> {
                        Logger.w("Balance check unclear: ${parseResult}", TAG)
                        "failed" to "Unable to determine balance"
                    }
                }

                // Report to backend
                reportBalanceResult(
                    operator = operator,
                    status = status,
                    message = message,
                    balance = extractBalance(message),
                    simSlot = result.simSlot
                )
            }
            is com.onevertix.easytransferagent.ussd.ExecutionResult.Error -> {
                Logger.e("Balance inquiry failed: ${result.message}", TAG)

                // Report error
                reportBalanceResult(
                    operator = operator,
                    status = "failed",
                    message = result.message,
                    balance = null,
                    simSlot = -1
                )
            }
        }
    }

    /**
     * Report balance result to backend
     */
    private suspend fun reportBalanceResult(
        operator: String,
        status: String,
        message: String,
        balance: String?,
        simSlot: Int
    ) {
        try {
            val report = com.onevertix.easytransferagent.data.models.BalanceResultReport(
                operator = operator,
                status = status,
                balance = balance,
                message = message,
                executedAt = java.time.Instant.now().toString(),
                simSlot = simSlot
            )

            val result = transferRepository.reportBalanceResultNew(report)

            if (result.isSuccess) {
                Logger.i("Balance result reported successfully: $operator", TAG)
            } else {
                Logger.e("Failed to report balance result: ${result.exceptionOrNull()?.message}", TAG)
            }

        } catch (e: Exception) {
            Logger.e("Error reporting balance result: ${e.message}", e, TAG)
        }
    }

    /**
     * Extract balance from response message (simple pattern matching)
     */
    private fun extractBalance(message: String): String? {
        // Simple regex to extract numbers (balance amount)
        val numberPattern = Regex("\\d+")
        val match = numberPattern.find(message)
        return match?.value
    }

    /**
     * Simulate balance inquiry response
     */
    private fun simulateBalanceResponse(operator: String): String {
        return when (operator.uppercase()) {
            "SYRIATEL" -> "رصيدك الحالي 5000 ل.س"
            "MTN" -> "Your balance: 3000 SYP"
            else -> "Balance: 1000"
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

        // Job execution delay (wait for USSD to complete)
        private const val JOB_EXECUTION_DELAY = 10000L         // 10 seconds between jobs

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

