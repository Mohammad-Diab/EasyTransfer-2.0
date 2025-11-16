package com.onevertix.easytransferagent

import android.app.Application
import com.onevertix.easytransferagent.utils.Logger

/**
 * Main Application class for EasyTransferAgent
 */
class EasyTransferApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        Logger.i("EasyTransferAgent Application Started")
    }

    companion object {
        lateinit var instance: EasyTransferApp
            private set
    }
}

