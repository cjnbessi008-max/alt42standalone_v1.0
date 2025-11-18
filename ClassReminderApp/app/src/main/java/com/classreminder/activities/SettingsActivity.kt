package com.classreminder.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.classreminder.R
import com.classreminder.utils.PreferencesManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.switchmaterial.SwitchMaterial
import com.google.android.material.textfield.TextInputEditText

/**
 * 설정 액티비티
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager

    private lateinit var switchNotification: SwitchMaterial
    private lateinit var switchVibration: SwitchMaterial
    private lateinit var switchSound: SwitchMaterial
    private lateinit var editLmsUrl: TextInputEditText
    private lateinit var editLmsUsername: TextInputEditText
    private lateinit var editLmsPassword: TextInputEditText
    private lateinit var btnSave: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        prefsManager = PreferencesManager.getInstance(this)

        setupToolbar()
        setupViews()
        loadSettings()
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
        switchNotification = findViewById(R.id.switchNotification)
        switchVibration = findViewById(R.id.switchVibration)
        switchSound = findViewById(R.id.switchSound)
        editLmsUrl = findViewById(R.id.editLmsUrl)
        editLmsUsername = findViewById(R.id.editLmsUsername)
        editLmsPassword = findViewById(R.id.editLmsPassword)
        btnSave = findViewById(R.id.btnSave)
    }

    private fun loadSettings() {
        // 알림 설정 로드
        switchNotification.isChecked = prefsManager.notificationEnabled
        switchVibration.isChecked = prefsManager.vibrationEnabled
        switchSound.isChecked = prefsManager.soundEnabled

        // LMS 설정 로드
        editLmsUrl.setText(prefsManager.lmsUrl)
        editLmsUsername.setText(prefsManager.lmsUsername)
        editLmsPassword.setText(prefsManager.lmsPassword)
    }

    private fun setupListeners() {
        btnSave.setOnClickListener {
            saveSettings()
        }
    }

    private fun saveSettings() {
        // 알림 설정 저장
        prefsManager.notificationEnabled = switchNotification.isChecked
        prefsManager.vibrationEnabled = switchVibration.isChecked
        prefsManager.soundEnabled = switchSound.isChecked

        // LMS 설정 저장
        prefsManager.lmsUrl = editLmsUrl.text.toString().trim()
        prefsManager.lmsUsername = editLmsUsername.text.toString().trim()
        prefsManager.lmsPassword = editLmsPassword.text.toString().trim()

        Toast.makeText(this, getString(R.string.settings_saved), Toast.LENGTH_SHORT).show()
        finish()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
