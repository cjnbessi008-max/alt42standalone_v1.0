package com.classreminder

import android.app.Application
import com.classreminder.utils.PreferencesManager

/**
 * Application 클래스
 */
class ClassReminderApplication : Application() {

    lateinit var preferencesManager: PreferencesManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferencesManager = PreferencesManager.getInstance(this)
    }

    companion object {
        lateinit var instance: ClassReminderApplication
            private set
    }
}
