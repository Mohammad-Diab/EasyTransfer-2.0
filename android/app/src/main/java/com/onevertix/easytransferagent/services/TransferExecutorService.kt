package com.onevertix.easytransferagent.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import com.onevertix.easytransferagent.utils.Logger

/**
 * Foreground service for executing transfer jobs
 * Polls backend for pending jobs and executes USSD codes
 */
class TransferExecutorService : Service() {

    override fun onCreate() {
        super.onCreate()
        Logger.i("TransferExecutorService created", TAG)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Logger.i("TransferExecutorService started", TAG)

        // TODO: Task 3 - Start foreground notification
        // TODO: Task 3 - Begin polling for jobs

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null  // Not a bound service
    }

    override fun onDestroy() {
        super.onDestroy()
        Logger.i("TransferExecutorService destroyed", TAG)
    }

    companion object {
        private const val TAG = "TransferExecutorService"
    }
}

