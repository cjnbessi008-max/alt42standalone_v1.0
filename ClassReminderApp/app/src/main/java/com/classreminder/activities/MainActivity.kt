package com.classreminder.activities

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.classreminder.R
import com.classreminder.adapters.CourseAdapter
import com.classreminder.models.AppTheme
import com.classreminder.models.Course
import com.classreminder.models.NotificationMode
import com.classreminder.notifications.NotificationHelper
import com.classreminder.services.NotificationSchedulerService
import com.classreminder.utils.AlarmScheduler
import com.classreminder.utils.PreferencesManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton

/**
 * 메인 액티비티 - 시간표 표시 및 설정
 */
class MainActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var courseAdapter: CourseAdapter
    private lateinit var alarmScheduler: AlarmScheduler
    private lateinit var notificationHelper: NotificationHelper

    private lateinit var spinnerMode: Spinner
    private lateinit var spinnerTheme: Spinner
    private lateinit var recyclerView: RecyclerView
    private lateinit var textEmptyState: android.widget.TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefsManager = PreferencesManager.getInstance(this)
        alarmScheduler = AlarmScheduler(this)
        notificationHelper = NotificationHelper(this)

        setupToolbar()
        setupViews()
        setupSpinners()
        setupRecyclerView()
        setupButtons()

        loadCourses()
        applyTheme()
    }

    override fun onResume() {
        super.onResume()
        loadCourses()
        applyTheme()
    }

    private fun setupToolbar() {
        setSupportActionBar(findViewById(R.id.toolbar))
    }

    private fun setupViews() {
        spinnerMode = findViewById(R.id.spinnerMode)
        spinnerTheme = findViewById(R.id.spinnerTheme)
        recyclerView = findViewById(R.id.recyclerViewCourses)
        textEmptyState = findViewById(R.id.textEmptyState)
    }

    private fun setupSpinners() {
        // 알림 모드 스피너
        val modeNames = NotificationMode.values().map { "${it.emoji} ${it.displayName}" }
        val modeAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, modeNames)
        modeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerMode.adapter = modeAdapter

        // 현재 설정된 모드 선택
        val currentMode = prefsManager.notificationMode
        val modePosition = NotificationMode.values().indexOf(currentMode)
        spinnerMode.setSelection(modePosition)

        spinnerMode.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedMode = NotificationMode.values()[position]
                prefsManager.notificationMode = selectedMode
                Toast.makeText(this@MainActivity,
                    "${selectedMode.emoji} ${selectedMode.displayName} 선택됨",
                    Toast.LENGTH_SHORT).show()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        // 테마 스피너
        val themeNames = AppTheme.values().map { "${it.emoji} ${it.displayName}" }
        val themeAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, themeNames)
        themeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerTheme.adapter = themeAdapter

        // 현재 설정된 테마 선택
        val currentTheme = prefsManager.appTheme
        val themePosition = AppTheme.values().indexOf(currentTheme)
        spinnerTheme.setSelection(themePosition)

        spinnerTheme.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedTheme = AppTheme.values()[position]
                prefsManager.appTheme = selectedTheme
                applyTheme()
                Toast.makeText(this@MainActivity,
                    "${selectedTheme.emoji} ${selectedTheme.displayName} 적용됨",
                    Toast.LENGTH_SHORT).show()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun setupRecyclerView() {
        courseAdapter = CourseAdapter(mutableListOf()) { course ->
            deleteCourse(course)
        }

        recyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = courseAdapter
        }
    }

    private fun setupButtons() {
        // LMS 동기화 버튼
        findViewById<MaterialButton>(R.id.btnSyncLms).setOnClickListener {
            val intent = Intent(this, LmsLoginActivity::class.java)
            startActivity(intent)
        }

        // 알림 테스트 버튼
        findViewById<MaterialButton>(R.id.btnTestNotification).setOnClickListener {
            testNotification()
        }

        // 설정 FAB
        findViewById<FloatingActionButton>(R.id.fabSettings).setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
    }

    private fun loadCourses() {
        val courses = prefsManager.courses
        if (courses.isEmpty()) {
            textEmptyState.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            textEmptyState.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            courseAdapter.updateCourses(courses)

            // 알람 스케줄링
            scheduleAlarms()
        }
    }

    private fun deleteCourse(course: Course) {
        prefsManager.removeCourse(course.id)
        courseAdapter.removeCourse(course)
        alarmScheduler.cancelAlarm(course)
        Toast.makeText(this, getString(R.string.course_deleted), Toast.LENGTH_SHORT).show()

        // 남은 수업이 없으면 빈 상태 표시
        if (prefsManager.courses.isEmpty()) {
            textEmptyState.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        }
    }

    private fun scheduleAlarms() {
        val courses = prefsManager.courses
        val intent = Intent(this, NotificationSchedulerService::class.java).apply {
            action = NotificationSchedulerService.ACTION_SCHEDULE_ALL
        }
        startService(intent)
    }

    private fun testNotification() {
        val courses = prefsManager.courses
        if (courses.isNotEmpty()) {
            val randomCourse = courses.random()
            notificationHelper.showClassNotification(randomCourse)
            Toast.makeText(this, getString(R.string.test_notification_sent), Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, getString(R.string.no_courses), Toast.LENGTH_SHORT).show()
        }
    }

    private fun applyTheme() {
        val theme = prefsManager.appTheme
        val rootView = findViewById<View>(android.R.id.content)
        rootView.setBackgroundColor(theme.getBackgroundColorInt())

        // ActionBar 색상 변경
        supportActionBar?.setBackgroundDrawable(
            android.graphics.drawable.ColorDrawable(theme.getPrimaryColorInt())
        )

        // Status Bar 색상 변경
        window.statusBarColor = theme.getSecondaryColorInt()
    }
}
