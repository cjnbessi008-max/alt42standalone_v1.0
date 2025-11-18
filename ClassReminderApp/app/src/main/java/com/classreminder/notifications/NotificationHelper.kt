package com.classreminder.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.classreminder.R
import com.classreminder.activities.MainActivity
import com.classreminder.models.Course
import com.classreminder.models.NotificationMode
import com.classreminder.utils.PreferencesManager

/**
 * 알림 생성 및 표시를 담당하는 헬퍼 클래스
 */
class NotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_ID = "class_reminder_channel"
        const val CHANNEL_NAME = "수업 알림"
        const val NOTIFICATION_ID_BASE = 1000
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val prefsManager = PreferencesManager.getInstance(context)

    init {
        createNotificationChannel()
    }

    /**
     * 알림 채널 생성 (Android O 이상)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "수업 시작 1시간 전 알림을 받습니다"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * 수업 알림 표시
     */
    fun showClassNotification(course: Course) {
        if (!prefsManager.notificationEnabled) return

        val mode = prefsManager.notificationMode
        val message = mode.getRandomMessage(course)

        // 메인 액티비티로 이동하는 Intent
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("course_id", course.id)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            course.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 알림 스타일에 따른 이모지와 제목 설정
        val title = "${mode.emoji} ${mode.displayName} ${mode.emoji}"
        val contentText = message

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(getNotificationIcon(mode))
            .setContentTitle(title)
            .setContentText(contentText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setColor(getNotificationColor(mode))

        // 사운드 설정
        if (prefsManager.soundEnabled) {
            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            builder.setSound(soundUri)
        }

        // 진동 설정
        if (prefsManager.vibrationEnabled) {
            builder.setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
        }

        // 알림 표시
        val notificationId = NOTIFICATION_ID_BASE + course.id.hashCode()
        notificationManager.notify(notificationId, builder.build())
    }

    /**
     * 모드에 따른 알림 아이콘 반환
     */
    private fun getNotificationIcon(mode: NotificationMode): Int {
        return when (mode) {
            NotificationMode.HORROR -> android.R.drawable.ic_dialog_alert
            NotificationMode.SURPRISE -> android.R.drawable.ic_dialog_info
            NotificationMode.FRESH -> android.R.drawable.ic_menu_today
            NotificationMode.MOOD_CHANGE -> android.R.drawable.ic_menu_gallery
            NotificationMode.CUTE -> android.R.drawable.ic_menu_mylocation
            NotificationMode.SERIOUS -> android.R.drawable.ic_menu_info_details
            NotificationMode.MOTIVATIONAL -> android.R.drawable.ic_menu_compass
        }
    }

    /**
     * 모드에 따른 알림 색상 반환
     */
    private fun getNotificationColor(mode: NotificationMode): Int {
        return when (mode) {
            NotificationMode.HORROR -> 0x8B0000 // 다크 레드
            NotificationMode.SURPRISE -> 0xFFD700 // 골드
            NotificationMode.FRESH -> 0x90EE90 // 라이트 그린
            NotificationMode.MOOD_CHANGE -> 0xFF69B4 // 핫 핑크
            NotificationMode.CUTE -> 0xFFB6C1 // 라이트 핑크
            NotificationMode.SERIOUS -> 0x708090 // 슬레이트 그레이
            NotificationMode.MOTIVATIONAL -> 0xFF6347 // 토마토 레드
        }
    }

    /**
     * 특정 알림 취소
     */
    fun cancelNotification(courseId: String) {
        val notificationId = NOTIFICATION_ID_BASE + courseId.hashCode()
        notificationManager.cancel(notificationId)
    }

    /**
     * 모든 알림 취소
     */
    fun cancelAllNotifications() {
        notificationManager.cancelAll()
    }
}
