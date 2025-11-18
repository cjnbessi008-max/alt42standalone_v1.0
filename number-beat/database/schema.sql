-- Number Beat Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS number_beat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE number_beat;

-- Problems table: Stores number sequence problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    number_sequence VARCHAR(500) NOT NULL COMMENT 'Comma-separated numbers to arrange',
    rhythm_pattern VARCHAR(500) NOT NULL COMMENT 'Beat pattern: quarter,half,quarter,etc',
    correct_order VARCHAR(500) NOT NULL COMMENT 'Correct number sequence',
    time_limit INT DEFAULT 60 COMMENT 'Seconds',
    points INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_problem (moodle_problem_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table: Basic student information (synced from Moodle)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    fullname VARCHAR(255),
    email VARCHAR(255),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts: Track all game attempts
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    submitted_order VARCHAR(500) NOT NULL COMMENT 'Student submitted sequence',
    rhythm_accuracy DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage accuracy of rhythm timing',
    is_correct BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,
    time_spent INT NOT NULL COMMENT 'Seconds taken',
    mistakes_count INT DEFAULT 0,
    hint_used BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress: Overall progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    total_problems_attempted INT DEFAULT 0,
    total_problems_correct INT DEFAULT 0,
    total_score INT DEFAULT 0,
    average_rhythm_accuracy DECIMAL(5,2) DEFAULT 0.00,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_progress (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions: Track individual game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle sync log: Track synchronization with Moodle
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('problems', 'students', 'grades') NOT NULL,
    moodle_course_id INT,
    records_synced INT DEFAULT 0,
    status ENUM('success', 'partial', 'failed') NOT NULL,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (moodle_problem_id, moodle_course_id, title, description, difficulty_level, number_sequence, rhythm_pattern, correct_order, time_limit, points) VALUES
(1001, 1, '순서대로 배열하기 1', '1부터 5까지 숫자를 순서대로 리듬에 맞춰 배열하세요', 'easy', '3,1,5,2,4', 'quarter,quarter,quarter,quarter,quarter', '1,2,3,4,5', 60, 100),
(1002, 1, '역순 배열하기', '5부터 1까지 역순으로 배열하세요', 'easy', '2,4,1,5,3', 'half,quarter,half,quarter,quarter', '5,4,3,2,1', 60, 100),
(1003, 1, '짝수 먼저 배열', '짝수를 먼저, 그 다음 홀수를 배열하세요', 'medium', '5,2,8,3,6,1', 'quarter,quarter,half,quarter,half,quarter', '2,6,8,1,3,5', 90, 150),
(1004, 1, '크기 비교하기', '작은 수부터 큰 수 순서로 배열하세요', 'medium', '15,3,22,8,11', 'half,half,quarter,quarter,half', '3,8,11,15,22', 90, 150),
(1005, 1, '복잡한 패턴', '규칙을 찾아 배열하세요 (2의 배수 오름차순)', 'hard', '10,4,14,2,8,12,6', 'quarter,eighth,quarter,eighth,quarter,quarter,half', '2,4,6,8,10,12,14', 120, 200);

-- Insert sample student
INSERT INTO students (moodle_user_id, username, fullname, email, grade_level) VALUES
(2001, 'student1', '김철수', 'student1@example.com', '3학년');

-- Create view for student statistics
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    s.id,
    s.username,
    s.fullname,
    sp.total_problems_attempted,
    sp.total_problems_correct,
    CASE
        WHEN sp.total_problems_attempted > 0
        THEN ROUND((sp.total_problems_correct / sp.total_problems_attempted) * 100, 2)
        ELSE 0
    END AS success_rate,
    sp.total_score,
    sp.average_rhythm_accuracy,
    sp.current_streak,
    sp.best_streak,
    sp.last_activity
FROM students s
LEFT JOIN student_progress sp ON s.id = sp.student_id;
