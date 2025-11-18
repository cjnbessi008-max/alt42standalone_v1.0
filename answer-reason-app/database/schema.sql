-- Answer Reason Tracking System Database Schema
-- Compatible with MySQL 5.7
-- Designed to integrate with Moodle 3.7

CREATE DATABASE IF NOT EXISTS answer_reason_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE answer_reason_db;

-- Students table (synced from Moodle or standalone)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_user_id),
    UNIQUE KEY unique_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz attempts (synced from Moodle quiz attempts)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    moodle_attempt_id INT NULL,
    moodle_quiz_id INT NULL,
    quiz_name VARCHAR(255) NOT NULL,
    question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    student_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0,
    max_score DECIMAL(5,2) DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    explanation_text TEXT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_attempt (student_id, attempted_at),
    INDEX idx_moodle_attempt (moodle_attempt_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answer reasons (student reflections)
CREATE TABLE IF NOT EXISTS answer_reasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    student_id INT NOT NULL,
    reason_text TEXT NOT NULL,
    reason_category VARCHAR(50) NULL COMMENT 'conceptual, calculation, careless, misread, other',
    word_count INT DEFAULT 0,
    explanation_viewed_at TIMESTAMP NULL,
    reason_submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    teacher_viewed BOOLEAN DEFAULT 0,
    teacher_feedback TEXT NULL,
    teacher_feedback_at TIMESTAMP NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_reasons (student_id, reason_submitted_at),
    INDEX idx_attempt (attempt_id),
    INDEX idx_category (reason_category),
    INDEX idx_teacher_review (teacher_viewed, reason_submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_teacher (moodle_user_id),
    UNIQUE KEY unique_teacher_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle integration settings
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Moodle configuration
INSERT INTO moodle_config (config_key, config_value, description) VALUES
('moodle_url', '', 'Base URL of your Moodle installation (e.g., https://your-moodle.com)'),
('moodle_token', '', 'Moodle Web Service token for API access'),
('moodle_service', 'moodle_mobile_app', 'Moodle Web Service name'),
('sync_enabled', '0', 'Enable automatic sync with Moodle (0=disabled, 1=enabled)'),
('sync_interval', '300', 'Sync interval in seconds (default: 5 minutes)'),
('last_sync', NULL, 'Last successful sync timestamp');

-- System logs for debugging
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_type VARCHAR(50) NOT NULL COMMENT 'info, warning, error, sync',
    message TEXT NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_type (log_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics view for teachers
CREATE OR REPLACE VIEW student_reason_analytics AS
SELECT
    s.id as student_id,
    s.full_name,
    s.username,
    COUNT(DISTINCT qa.id) as total_attempts,
    COUNT(DISTINCT ar.id) as reasons_submitted,
    ROUND(COUNT(DISTINCT ar.id) / COUNT(DISTINCT qa.id) * 100, 2) as submission_rate,
    AVG(ar.word_count) as avg_word_count,
    ar.reason_category,
    COUNT(CASE WHEN ar.reason_category = 'conceptual' THEN 1 END) as conceptual_count,
    COUNT(CASE WHEN ar.reason_category = 'calculation' THEN 1 END) as calculation_count,
    COUNT(CASE WHEN ar.reason_category = 'careless' THEN 1 END) as careless_count,
    COUNT(CASE WHEN ar.reason_category = 'misread' THEN 1 END) as misread_count
FROM students s
LEFT JOIN quiz_attempts qa ON s.id = qa.student_id
LEFT JOIN answer_reasons ar ON qa.id = ar.attempt_id
GROUP BY s.id, ar.reason_category;
