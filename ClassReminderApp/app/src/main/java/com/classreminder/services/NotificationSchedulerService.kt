package com.classreminder.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import com.classreminder.utils.AlarmScheduler
import com.classreminder.utils.PreferencesManager

/**
 * 알림 스케줄링을 관리하는 백그라운드 서비스
 */
class NotificationSchedulerService : Service() {

    private lateinit var alarmScheduler: AlarmScheduler
    private lateinit var prefsManager: PreferencesManager

    override fun onCreate() {
        super.onCreate()
        alarmScheduler = AlarmScheduler(this)
        prefsManager = PreferencesManager.getInstance(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SCHEDULE_ALL -> scheduleAllAlarms()
            ACTION_CANCEL_ALL -> cancelAllAlarms()
            ACTION_RESCHEDULE -> rescheduleAllAlarms()
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun scheduleAllAlarms() {
        val courses = prefsManager.courses
        if (courses.isNotEmpty()) {
            alarmScheduler.scheduleAllWeeklyAlarms(courses)
        }
    }

    private fun cancelAllAlarms() {
        val courses = prefsManager.courses
        alarmScheduler.cancelAllAlarms(courses)
    }

    private fun rescheduleAllAlarms() {
        cancelAllAlarms()
        scheduleAllAlarms()
    }

    companion object {
        const val ACTION_SCHEDULE_ALL = "com.classreminder.action.SCHEDULE_ALL"
        const val ACTION_CANCEL_ALL = "com.classreminder.action.CANCEL_ALL"
        const val ACTION_RESCHEDULE = "com.classreminder.action.RESCHEDULE"
    }
}
