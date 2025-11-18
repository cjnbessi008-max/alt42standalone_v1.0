-- Chaos Harmony Database Schema
-- MySQL 5.7 Compatible
--
-- This schema stores quiz data from Moodle LMS and tracks Chaos Harmony visualization patterns

-- Create database
CREATE DATABASE IF NOT EXISTS chaos_harmony DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chaos_harmony;

-- Quiz questions table (synced from Moodle)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question_id (moodle_question_id),
    INDEX idx_quiz_id (quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    moodle_attempt_id INT NOT NULL UNIQUE,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    is_correct BOOLEAN,
    response_time INT, -- in seconds
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_attempt_date (attempt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chaos Harmony patterns table
-- Stores the "seemingly random but patterned" visualization data
CREATE TABLE IF NOT EXISTS chaos_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'success_rhythm', 'struggle_wave', 'breakthrough_burst', etc.
    intensity FLOAT NOT NULL, -- 0.0 to 1.0
    frequency FLOAT NOT NULL, -- how often this pattern appears
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON, -- additional pattern properties
    INDEX idx_student_id (student_id),
    INDEX idx_pattern_type (pattern_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visualization state table
-- Tracks current state of Chaos Harmony visualization for each student
CREATE TABLE IF NOT EXISTS visualization_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    current_emotion VARCHAR(50), -- 'joy', 'struggle', 'flow', 'breakthrough'
    color_palette JSON, -- dynamic color scheme based on patterns
    animation_speed FLOAT DEFAULT 1.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle sync log
CREATE TABLE IF NOT EXISTS sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('questions', 'attempts', 'full') NOT NULL,
    status ENUM('started', 'completed', 'failed') NOT NULL,
    records_processed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
