-- Log Focus Application Database Schema
-- MySQL 5.7 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS log_focus_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE log_focus_app;

-- Table for storing activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    problem_id INT DEFAULT NULL,
    problem_name VARCHAR(255) DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    result VARCHAR(50) DEFAULT NULL,
    score DECIMAL(5,2) DEFAULT NULL,
    log_message TEXT NOT NULL,
    raw_data JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (moodle_user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for keyword highlighting configuration
CREATE TABLE IF NOT EXISTS highlight_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default highlight keywords
INSERT INTO highlight_keywords (keyword, category, color, priority) VALUES
-- Error & Warning Keywords (Red)
('ERROR', 'error', '#ff4444', 10),
('FAIL', 'error', '#ff4444', 10),
('FAILED', 'error', '#ff4444', 10),
('EXCEPTION', 'error', '#ff4444', 10),
('WARNING', 'warning', '#ff9800', 9),
('ALERT', 'warning', '#ff9800', 9),
('TIMEOUT', 'warning', '#ff9800', 9),

-- Success Keywords (Green)
('SUCCESS', 'success', '#4caf50', 8),
('PASS', 'success', '#4caf50', 8),
('PASSED', 'success', '#4caf50', 8),
('CORRECT', 'success', '#4caf50', 8),
('COMPLETE', 'success', '#4caf50', 8),
('COMPLETED', 'success', '#4caf50', 8),

-- Student Action Keywords (Blue)
('SUBMIT', 'action', '#2196f3', 7),
('SUBMITTED', 'action', '#2196f3', 7),
('ATTEMPT', 'action', '#2196f3', 7),
('ANSWER', 'action', '#2196f3', 7),
('VIEW', 'action', '#2196f3', 6),
('VIEWED', 'action', '#2196f3', 6),
('START', 'action', '#2196f3', 7),
('STARTED', 'action', '#2196f3', 7),

-- Problem Related Keywords (Purple)
('QUESTION', 'problem', '#9c27b0', 6),
('QUIZ', 'problem', '#9c27b0', 6),
('PROBLEM', 'problem', '#9c27b0', 6),
('GRADE', 'problem', '#9c27b0', 7),
('GRADED', 'problem', '#9c27b0', 7),
('SCORE', 'problem', '#9c27b0', 7),

-- Incorrect/Negative Keywords (Orange)
('INCORRECT', 'negative', '#ff5722', 8),
('WRONG', 'negative', '#ff5722', 8),
('INVALID', 'negative', '#ff5722', 7),

-- Time Related Keywords (Teal)
('DEADLINE', 'time', '#009688', 6),
('END', 'time', '#009688', 5),
('ENDED', 'time', '#009688', 5);

-- Table for Moodle sync status
CREATE TABLE IF NOT EXISTS sync_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_type VARCHAR(50) NOT NULL,
    records_synced INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT DEFAULT NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_last_sync_time (last_sync_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
