package com.classreminder.activities

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.classreminder.R
import com.classreminder.services.NotificationSchedulerService
import com.classreminder.utils.LmsParser
import com.classreminder.utils.PreferencesManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.launch

/**
 * LMS 로그인 및 시간표 동기화 액티비티
 */
class LmsLoginActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var lmsParser: LmsParser

    private lateinit var editLmsUrl: TextInputEditText
    private lateinit var editUsername: TextInputEditText
    private lateinit var editPassword: TextInputEditText
    private lateinit var btnLogin: MaterialButton
    private lateinit var btnUseSampleData: MaterialButton
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_lms_login)

        prefsManager = PreferencesManager.getInstance(this)
        lmsParser = LmsParser()

        setupToolbar()
        setupViews()
        loadSavedCredentials()
        setupListeners()
    }

    private fun setupToolbar() {
        setSupportActionBar(findViewById(R.id.toolbar))
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar).setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupViews() {
        editLmsUrl = findViewById(R.id.editLmsUrl)
        editUsername = findViewById(R.id.editUsername)
        editPassword = findViewById(R.id.editPassword)
        btnLogin = findViewById(R.id.btnLogin)
        btnUseSampleData = findViewById(R.id.btnUseSampleData)
        progressBar = findViewById(R.id.progressBar)
    }

    private fun loadSavedCredentials() {
        editLmsUrl.setText(prefsManager.lmsUrl)
        editUsername.setText(prefsManager.lmsUsername)
        editPassword.setText(prefsManager.lmsPassword)
    }

    private fun setupListeners() {
        btnLogin.setOnClickListener {
            loginAndFetchTimetable()
        }

        btnUseSampleData.setOnClickListener {
            useSampleData()
        }
    }

    private fun loginAndFetchTimetable() {
        val url = editLmsUrl.text.toString().trim()
        val username = editUsername.text.toString().trim()
        val password = editPassword.text.toString().trim()

        if (url.isEmpty() || username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "모든 필드를 입력해주세요", Toast.LENGTH_SHORT).show()
            return
        }

        // 자격 증명 저장
        prefsManager.lmsUrl = url
        prefsManager.lmsUsername = username
        prefsManager.lmsPassword = password

        showLoading(true)

        lifecycleScope.launch {
            try {
                // LMS 로그인 시도
                val loginSuccess = lmsParser.login(url, username, password)

                if (loginSuccess) {
                    Toast.makeText(this@LmsLoginActivity,
                        getString(R.string.login_success), Toast.LENGTH_SHORT).show()

                    // 시간표 가져오기
                    fetchTimetable(url)
                } else {
                    showLoading(false)
                    Toast.makeText(this@LmsLoginActivity,
                        getString(R.string.login_failed), Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                showLoading(false)
                Toast.makeText(this@LmsLoginActivity,
                    "오류: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private suspend fun fetchTimetable(url: String) {
        try {
            val courses = lmsParser.fetchTimetable(url)

            if (courses.isNotEmpty()) {
                // 시간표 저장
                prefsManager.courses = courses

                // 알람 스케줄링
                val intent = android.content.Intent(this, NotificationSchedulerService::class.java).apply {
                    action = NotificationSchedulerService.ACTION_SCHEDULE_ALL
                }
                startService(intent)

                showLoading(false)
                Toast.makeText(this,
                    "${getString(R.string.fetch_success)} (${courses.size}개 수업)",
                    Toast.LENGTH_SHORT).show()

                // 메인 화면으로 돌아가기
                finish()
            } else {
                showLoading(false)
                Toast.makeText(this,
                    "시간표가 비어있습니다. 샘플 데이터를 사용해보세요.",
                    Toast.LENGTH_LONG).show()
            }
        } catch (e: Exception) {
            showLoading(false)
            Toast.makeText(this,
                "시간표 가져오기 실패: ${e.message}",
                Toast.LENGTH_LONG).show()
        }
    }

    private fun useSampleData() {
        val sampleCourses = lmsParser.getSampleTimetable()
        prefsManager.courses = sampleCourses

        // 알람 스케줄링
        val intent = android.content.Intent(this, NotificationSchedulerService::class.java).apply {
            action = NotificationSchedulerService.ACTION_SCHEDULE_ALL
        }
        startService(intent)

        Toast.makeText(this,
            "샘플 데이터가 로드되었습니다 (${sampleCourses.size}개 수업)",
            Toast.LENGTH_SHORT).show()

        finish()
    }

    private fun showLoading(show: Boolean) {
        progressBar.visibility = if (show) View.VISIBLE else View.GONE
        btnLogin.isEnabled = !show
        btnUseSampleData.isEnabled = !show
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
