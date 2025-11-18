package com.classreminder.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * 기기 재부팅 시 알람을 다시 설정하는 Receiver
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // 재부팅 후 모든 알람 재설정
            val serviceIntent = Intent(context, NotificationSchedulerService::class.java).apply {
                action = NotificationSchedulerService.ACTION_SCHEDULE_ALL
            }
            context.startService(serviceIntent)
        }
    }
}
