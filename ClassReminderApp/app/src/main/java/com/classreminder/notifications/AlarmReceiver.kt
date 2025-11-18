package com.classreminder.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.classreminder.models.Course
import com.classreminder.utils.PreferencesManager
import com.google.gson.Gson

/**
 * 알람을 받아서 알림을 표시하는 BroadcastReceiver
 */
class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val EXTRA_COURSE_JSON = "extra_course_json"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val courseJson = intent.getStringExtra(EXTRA_COURSE_JSON) ?: return
        val course = Gson().fromJson(courseJson, Course::class.java) ?: return

        val prefsManager = PreferencesManager.getInstance(context)
        if (!prefsManager.notificationEnabled) return

        // 알림 표시
        val notificationHelper = NotificationHelper(context)
        notificationHelper.showClassNotification(course)
    }
}
