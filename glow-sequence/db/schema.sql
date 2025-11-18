-- Glow Sequence Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS glow_sequence_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE glow_sequence_db;

-- Table: glow_sequences
-- Stores sequence problems and patterns
CREATE TABLE IF NOT EXISTS glow_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT DEFAULT NULL,
    sequence_type VARCHAR(50) NOT NULL COMMENT 'arithmetic, geometric, fibonacci, custom',
    sequence_pattern VARCHAR(255) NOT NULL COMMENT 'e.g., "2,4,6,8,?" or "1,2,4,8,?"',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    correct_answer VARCHAR(100) NOT NULL,
    hint_text TEXT,
    max_attempts INT DEFAULT 3,
    time_limit_seconds INT DEFAULT 60,
    glow_color_primary VARCHAR(7) DEFAULT '#00ffff' COMMENT 'Hex color for glow effect',
    glow_color_secondary VARCHAR(7) DEFAULT '#ff00ff',
    animation_speed ENUM('slow', 'medium', 'fast') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: glow_students
-- Student information (can sync with Moodle users)
CREATE TABLE IF NOT EXISTS glow_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    grade_level VARCHAR(20),
    total_score INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: glow_attempts
-- Records each student attempt at solving a sequence
CREATE TABLE IF NOT EXISTS glow_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    sequence_id INT NOT NULL,
    student_answer VARCHAR(100),
    is_correct BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    time_spent_seconds INT DEFAULT 0,
    hint_used BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score_earned INT DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES glow_students(id) ON DELETE CASCADE,
    FOREIGN KEY (sequence_id) REFERENCES glow_sequences(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_sequence (sequence_id),
    INDEX idx_correct (is_correct),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: glow_progress
-- Tracks overall student progress
CREATE TABLE IF NOT EXISTS glow_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    sequence_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'failed') DEFAULT 'not_started',
    best_score INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    first_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    mastery_level DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage 0-100',
    FOREIGN KEY (student_id) REFERENCES glow_students(id) ON DELETE CASCADE,
    FOREIGN KEY (sequence_id) REFERENCES glow_sequences(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_sequence (student_id, sequence_id),
    INDEX idx_status (status),
    INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: glow_sessions
-- Tracks user sessions for activity monitoring
CREATE TABLE IF NOT EXISTS glow_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES glow_students(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: glow_settings
-- Application settings and configurations
CREATE TABLE IF NOT EXISTS glow_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample sequences for testing
INSERT INTO glow_sequences (sequence_type, sequence_pattern, difficulty_level, correct_answer, hint_text, glow_color_primary, glow_color_secondary) VALUES
('arithmetic', '2,4,6,8,?', 'easy', '10', '각 숫자는 이전 숫자에 2를 더한 값입니다', '#00ffff', '#00aaff'),
('arithmetic', '5,10,15,20,?', 'easy', '25', '각 숫자는 이전 숫자에 5를 더한 값입니다', '#00ff00', '#00aa00'),
('geometric', '1,2,4,8,?', 'medium', '16', '각 숫자는 이전 숫자에 2를 곱한 값입니다', '#ff00ff', '#aa00ff'),
('geometric', '3,9,27,81,?', 'medium', '243', '각 숫자는 이전 숫자에 3을 곱한 값입니다', '#ffff00', '#aaaa00'),
('fibonacci', '1,1,2,3,5,?', 'hard', '8', '각 숫자는 이전 두 숫자의 합입니다', '#ff0000', '#aa0000'),
('arithmetic', '100,90,80,70,?', 'easy', '60', '각 숫자는 이전 숫자에서 10을 뺀 값입니다', '#00ffaa', '#00aa77'),
('custom', '1,4,9,16,?', 'hard', '25', '각 숫자는 자연수의 제곱입니다 (n²)', '#ff00aa', '#aa0077');

-- Insert default settings
INSERT INTO glow_settings (setting_key, setting_value, description) VALUES
('app_name', 'Glow Sequence', 'Application name'),
('default_time_limit', '60', 'Default time limit in seconds'),
('default_max_attempts', '3', 'Default maximum attempts per sequence'),
('enable_hints', 'true', 'Enable or disable hints'),
('enable_sound', 'true', 'Enable or disable sound effects'),
('moodle_integration', 'true', 'Enable Moodle LMS integration');

-- Create views for easy data access

-- View: student_statistics
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    s.id,
    s.username,
    s.grade_level,
    COUNT(DISTINCT a.sequence_id) as sequences_attempted,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
    COUNT(a.id) as total_attempts,
    ROUND(AVG(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100, 2) as success_rate,
    SUM(a.score_earned) as total_score,
    AVG(a.time_spent_seconds) as avg_time_per_attempt
FROM glow_students s
LEFT JOIN glow_attempts a ON s.id = a.student_id
GROUP BY s.id, s.username, s.grade_level;

-- View: sequence_statistics
CREATE OR REPLACE VIEW sequence_statistics AS
SELECT
    seq.id,
    seq.sequence_type,
    seq.sequence_pattern,
    seq.difficulty_level,
    COUNT(DISTINCT a.student_id) as unique_students,
    COUNT(a.id) as total_attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100, 2) as success_rate,
    AVG(a.time_spent_seconds) as avg_time_to_solve
FROM glow_sequences seq
LEFT JOIN glow_attempts a ON seq.id = a.sequence_id
WHERE seq.is_active = TRUE
GROUP BY seq.id, seq.sequence_type, seq.sequence_pattern, seq.difficulty_level;
