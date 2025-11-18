-- MySQL Schema for Moodle Integration WebApp
-- MySQL 5.7 Compatible

-- Database creation
CREATE DATABASE IF NOT EXISTS moodle_integration_app
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE moodle_integration_app;

-- Table for storing quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_quiz_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_moodle_quiz_id (moodle_quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing question attempts
CREATE TABLE IF NOT EXISTS question_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent INT DEFAULT 0 COMMENT 'Time in seconds',
    wave_effect_triggered BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_moodle_question_id (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for caching Moodle questions
CREATE TABLE IF NOT EXISTS question_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT UNIQUE NOT NULL,
    quiz_id INT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options JSON COMMENT 'Multiple choice options',
    correct_answer TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for users (simplified for demo)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Cross Wave animation logs
CREATE TABLE IF NOT EXISTS wave_effects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    effect_type VARCHAR(50) DEFAULT 'cross_wave',
    trigger_position JSON COMMENT 'X, Y coordinates',
    color VARCHAR(20) DEFAULT '#4CAF50',
    intensity INT DEFAULT 100 COMMENT '1-100 scale',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES question_attempts(id) ON DELETE CASCADE,
    INDEX idx_attempt_id (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO users (moodle_user_id, username, email) VALUES
(1, 'demo_student', 'demo@example.com'),
(2, 'test_user', 'test@example.com');

-- Create views for analytics
CREATE OR REPLACE VIEW session_statistics AS
SELECT
    qs.id,
    qs.user_id,
    u.username,
    qs.moodle_quiz_id,
    qs.total_questions,
    qs.correct_answers,
    qs.score,
    COUNT(qa.id) as attempts_count,
    SUM(qa.time_spent) as total_time_spent,
    SUM(CASE WHEN qa.wave_effect_triggered THEN 1 ELSE 0 END) as wave_effects_count,
    qs.started_at,
    qs.completed_at
FROM quiz_sessions qs
LEFT JOIN question_attempts qa ON qs.id = qa.session_id
LEFT JOIN users u ON qs.user_id = u.id
GROUP BY qs.id;
