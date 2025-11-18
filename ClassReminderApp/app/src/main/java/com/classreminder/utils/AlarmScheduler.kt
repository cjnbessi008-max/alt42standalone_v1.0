package com.classreminder.utils

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.classreminder.models.Course
import com.classreminder.notifications.AlarmReceiver
import com.google.gson.Gson
import java.util.Calendar

/**
 * 수업 알람을 스케줄링하는 클래스
 */
class AlarmScheduler(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private val gson = Gson()

    /**
     * 특정 수업에 대한 알람 설정
     */
    fun scheduleAlarm(course: Course) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(AlarmReceiver.EXTRA_COURSE_JSON, gson.toJson(course))
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 수업 시작 1시간 전 시간 계산
        val triggerTime = calculateNextAlarmTime(course)

        // 알람 설정
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        }
    }

    /**
     * 모든 수업에 대한 알람 설정
     */
    fun scheduleAllAlarms(courses: List<Course>) {
        courses.forEach { course ->
            scheduleAlarm(course)
        }
    }

    /**
     * 특정 수업의 알람 취소
     */
    fun cancelAlarm(course: Course) {
        val intent = Intent(context, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }

    /**
     * 모든 알람 취소
     */
    fun cancelAllAlarms(courses: List<Course>) {
        courses.forEach { course ->
            cancelAlarm(course)
        }
    }

    /**
     * 다음 알람 시간 계산
     * 수업 시작 1시간 전 시간을 반환하며, 이미 지난 시간이면 다음 주 같은 요일로 설정
     */
    private fun calculateNextAlarmTime(course: Course): Long {
        val now = Calendar.getInstance()
        val alarmTime = course.getReminderTimeCalendar()

        // 현재 시간보다 이전이면 다음 주로 설정
        if (alarmTime.timeInMillis <= now.timeInMillis) {
            alarmTime.add(Calendar.WEEK_OF_YEAR, 1)
        }

        return alarmTime.timeInMillis
    }

    /**
     * 주간 반복 알람 설정 (매주 같은 요일 같은 시간)
     */
    fun scheduleWeeklyAlarm(course: Course) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(AlarmReceiver.EXTRA_COURSE_JSON, gson.toJson(course))
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            course.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val triggerTime = calculateNextAlarmTime(course)
        val intervalMillis = 7 * 24 * 60 * 60 * 1000L // 1주일

        // 반복 알람 설정
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            triggerTime,
            intervalMillis,
            pendingIntent
        )
    }

    /**
     * 모든 수업에 대한 주간 반복 알람 설정
     */
    fun scheduleAllWeeklyAlarms(courses: List<Course>) {
        courses.forEach { course ->
            scheduleWeeklyAlarm(course)
        }
    }
}
