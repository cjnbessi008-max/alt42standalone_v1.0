package com.classreminder.utils

import android.content.Context
import android.content.SharedPreferences
import com.classreminder.models.AppTheme
import com.classreminder.models.Course
import com.classreminder.models.NotificationMode
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * SharedPreferences를 관리하는 싱글톤 클래스
 */
class PreferencesManager private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val PREFS_NAME = "class_reminder_prefs"
        private const val KEY_LMS_URL = "lms_url"
        private const val KEY_LMS_USERNAME = "lms_username"
        private const val KEY_LMS_PASSWORD = "lms_password"
        private const val KEY_COURSES = "courses"
        private const val KEY_NOTIFICATION_MODE = "notification_mode"
        private const val KEY_APP_THEME = "app_theme"
        private const val KEY_NOTIFICATION_ENABLED = "notification_enabled"
        private const val KEY_VIBRATION_ENABLED = "vibration_enabled"
        private const val KEY_SOUND_ENABLED = "sound_enabled"

        @Volatile
        private var instance: PreferencesManager? = null

        fun getInstance(context: Context): PreferencesManager {
            return instance ?: synchronized(this) {
                instance ?: PreferencesManager(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }

    // LMS 설정
    var lmsUrl: String
        get() = prefs.getString(KEY_LMS_URL, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LMS_URL, value).apply()

    var lmsUsername: String
        get() = prefs.getString(KEY_LMS_USERNAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LMS_USERNAME, value).apply()

    var lmsPassword: String
        get() = prefs.getString(KEY_LMS_PASSWORD, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LMS_PASSWORD, value).apply()

    // 수업 목록
    var courses: List<Course>
        get() {
            val json = prefs.getString(KEY_COURSES, null) ?: return emptyList()
            val type = object : TypeToken<List<Course>>() {}.type
            return gson.fromJson(json, type)
        }
        set(value) {
            val json = gson.toJson(value)
            prefs.edit().putString(KEY_COURSES, json).apply()
        }

    // 알림 모드
    var notificationMode: NotificationMode
        get() {
            val modeString = prefs.getString(KEY_NOTIFICATION_MODE, NotificationMode.FRESH.name)
            return NotificationMode.fromString(modeString ?: NotificationMode.FRESH.name)
        }
        set(value) = prefs.edit().putString(KEY_NOTIFICATION_MODE, value.name).apply()

    // 앱 테마
    var appTheme: AppTheme
        get() {
            val themeString = prefs.getString(KEY_APP_THEME, AppTheme.OCEAN_BLUE.name)
            return AppTheme.fromString(themeString ?: AppTheme.OCEAN_BLUE.name)
        }
        set(value) = prefs.edit().putString(KEY_APP_THEME, value.name).apply()

    // 알림 설정
    var notificationEnabled: Boolean
        get() = prefs.getBoolean(KEY_NOTIFICATION_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_NOTIFICATION_ENABLED, value).apply()

    var vibrationEnabled: Boolean
        get() = prefs.getBoolean(KEY_VIBRATION_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_VIBRATION_ENABLED, value).apply()

    var soundEnabled: Boolean
        get() = prefs.getBoolean(KEY_SOUND_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_SOUND_ENABLED, value).apply()

    /**
     * 수업 추가
     */
    fun addCourse(course: Course) {
        val currentCourses = courses.toMutableList()
        currentCourses.add(course)
        courses = currentCourses
    }

    /**
     * 수업 삭제
     */
    fun removeCourse(courseId: String) {
        val currentCourses = courses.toMutableList()
        currentCourses.removeAll { it.id == courseId }
        courses = currentCourses
    }

    /**
     * 모든 설정 초기화
     */
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
