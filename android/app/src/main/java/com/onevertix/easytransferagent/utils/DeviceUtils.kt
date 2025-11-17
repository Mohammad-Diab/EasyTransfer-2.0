package com.onevertix.easytransferagent.utils

import android.os.Build

object DeviceUtils {
    /**
     * Get a human-readable device name
     * Example: "Samsung Galaxy S21" or "Google Pixel 5"
     */
    fun getDeviceName(): String {
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL

        return if (model.startsWith(manufacturer, ignoreCase = true)) {
            capitalize(model)
        } else {
            "${capitalize(manufacturer)} $model"
        }
    }

    private fun capitalize(str: String): String {
        return str.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
    }
}

