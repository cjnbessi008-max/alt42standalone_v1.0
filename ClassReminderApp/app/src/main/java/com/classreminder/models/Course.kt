package com.classreminder.models

import java.io.Serializable
import java.util.Calendar

/**
 * 수업 정보를 담는 데이터 클래스
 */
data class Course(
    val id: String,
    val name: String,
    val instructor: String,
    val room: String,
    val dayOfWeek: Int, // Calendar.MONDAY, TUESDAY, etc.
    val startHour: Int,
    val startMinute: Int,
    val endHour: Int,
    val endMinute: Int,
    val color: String = "#FF6B6B"
) : Serializable {

    /**
     * 수업 시작 시간을 Calendar 객체로 반환
     */
    fun getStartTimeCalendar(): Calendar {
        return Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, dayOfWeek)
            set(Calendar.HOUR_OF_DAY, startHour)
            set(Calendar.MINUTE, startMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
    }

    /**
     * 수업 시작 1시간 전 시간을 Calendar 객체로 반환
     */
    fun getReminderTimeCalendar(): Calendar {
        return getStartTimeCalendar().apply {
            add(Calendar.HOUR_OF_DAY, -1)
        }
    }

    /**
     * 시간 포맷 (09:00 - 10:30)
     */
    fun getTimeString(): String {
        return String.format("%02d:%02d - %02d:%02d", startHour, startMinute, endHour, endMinute)
    }

    /**
     * 요일 이름 반환
     */
    fun getDayName(): String {
        return when (dayOfWeek) {
            Calendar.MONDAY -> "월요일"
            Calendar.TUESDAY -> "화요일"
            Calendar.WEDNESDAY -> "수요일"
            Calendar.THURSDAY -> "목요일"
            Calendar.FRIDAY -> "금요일"
            Calendar.SATURDAY -> "토요일"
            Calendar.SUNDAY -> "일요일"
            else -> "알 수 없음"
        }
    }
}
