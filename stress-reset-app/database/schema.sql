-- Stress Detection & Reset System Database Schema
-- MySQL 5.7 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS stress_reset_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE stress_reset_db;

-- Users table (synced from Moodle)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    moodle_course_id INT UNSIGNED,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    duration_minutes INT UNSIGNED DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity tracking table
CREATE TABLE IF NOT EXISTS activity_tracking (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    activity_type ENUM('click', 'keypress', 'scroll', 'idle') NOT NULL,
    activity_count INT UNSIGNED DEFAULT 1,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_timestamp (session_id, timestamp),
    INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stress scores table
CREATE TABLE IF NOT EXISTS stress_scores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    time_score DECIMAL(5,2) DEFAULT 0.00,
    click_score DECIMAL(5,2) DEFAULT 0.00,
    typing_score DECIMAL(5,2) DEFAULT 0.00,
    combined_score DECIMAL(5,2) DEFAULT 0.00,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_score (session_id, combined_score),
    INDEX idx_calculated_at (calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reset events table
CREATE TABLE IF NOT EXISTS reset_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    stress_score_id INT UNSIGNED,
    trigger_reason VARCHAR(255),
    effect_type VARCHAR(50) DEFAULT 'light_gradient',
    effect_duration_seconds INT UNSIGNED DEFAULT 10,
    user_acknowledged TINYINT(1) DEFAULT 0,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (stress_score_id) REFERENCES stress_scores(id) ON DELETE SET NULL,
    INDEX idx_session_created (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    log_level ENUM('debug', 'info', 'warning', 'error') NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    context JSON,
    user_id INT UNSIGNED,
    session_id INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL,
    INDEX idx_log_level (log_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table for per-user customization
CREATE TABLE IF NOT EXISTS user_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    enable_stress_detection TINYINT(1) DEFAULT 1,
    time_threshold_minutes INT UNSIGNED DEFAULT 45,
    enable_light_effect TINYINT(1) DEFAULT 1,
    enable_sound TINYINT(1) DEFAULT 1,
    custom_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics summary table (for dashboard)
CREATE TABLE IF NOT EXISTS analytics_summary (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    total_sessions INT UNSIGNED DEFAULT 0,
    total_study_minutes INT UNSIGNED DEFAULT 0,
    total_reset_events INT UNSIGNED DEFAULT 0,
    avg_stress_score DECIMAL(5,2) DEFAULT 0.00,
    max_stress_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
