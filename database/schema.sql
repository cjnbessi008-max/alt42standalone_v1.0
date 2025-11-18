-- Inequality Arrow App Database Schema
-- MySQL 5.7+ compatible

-- Create database
CREATE DATABASE IF NOT EXISTS inequality_arrow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inequality_arrow_db;

-- Users table (integrates with Moodle users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inequality problems table
CREATE TABLE IF NOT EXISTS inequality_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_text VARCHAR(500) NOT NULL,
    left_value DECIMAL(10,2) NOT NULL,
    right_value DECIMAL(10,2) NOT NULL,
    correct_operator ENUM('<', '>', '=', '<=', '>=') NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    category VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student responses table
CREATE TABLE IF NOT EXISTS student_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    selected_operator ENUM('<', '>', '=', '<=', '>=') NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_seconds INT,
    attempt_number INT DEFAULT 1,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES inequality_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    moodle_course_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    total_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Arrow animation settings table
CREATE TABLE IF NOT EXISTS arrow_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    animation_speed ENUM('slow', 'medium', 'fast') DEFAULT 'medium',
    arrow_color VARCHAR(7) DEFAULT '#FF5722',
    enable_sound BOOLEAN DEFAULT TRUE,
    enable_haptics BOOLEAN DEFAULT TRUE,
    theme ENUM('light', 'dark') DEFAULT 'light',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle integration log table
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    session_id VARCHAR(100),
    sync_type ENUM('grade_sync', 'progress_sync', 'completion_sync') NOT NULL,
    sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    grade_value DECIMAL(5,2),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_sync_status (sync_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample inequality problems
INSERT INTO inequality_problems (problem_text, left_value, right_value, correct_operator, difficulty_level, category) VALUES
('5와 3을 비교하세요', 5, 3, '>', 'easy', 'basic_numbers'),
('2와 7을 비교하세요', 2, 7, '<', 'easy', 'basic_numbers'),
('4와 4를 비교하세요', 4, 4, '=', 'easy', 'basic_numbers'),
('12와 8을 비교하세요', 12, 8, '>', 'easy', 'basic_numbers'),
('15와 20을 비교하세요', 15, 20, '<', 'medium', 'basic_numbers'),
('25 + 5와 30을 비교하세요', 30, 30, '=', 'medium', 'arithmetic'),
('10 - 3와 8을 비교하세요', 7, 8, '<', 'medium', 'arithmetic'),
('6 × 2와 13을 비교하세요', 12, 13, '<', 'hard', 'multiplication'),
('18 ÷ 3와 5를 비교하세요', 6, 5, '>', 'hard', 'division'),
('(4 + 6) × 2와 19를 비교하세요', 20, 19, '>', 'hard', 'complex');

-- Create stored procedure for calculating user progress
DELIMITER //
CREATE PROCEDURE GetUserProgress(IN p_user_id INT)
BEGIN
    SELECT
        u.username,
        COUNT(DISTINCT sr.problem_id) as problems_attempted,
        SUM(CASE WHEN sr.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        ROUND(AVG(CASE WHEN sr.is_correct = 1 THEN 100 ELSE 0 END), 2) as accuracy_percentage,
        AVG(sr.response_time_seconds) as avg_response_time
    FROM users u
    LEFT JOIN student_responses sr ON u.id = sr.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.username;
END //
DELIMITER ;

-- Create view for session statistics
CREATE OR REPLACE VIEW session_statistics AS
SELECT
    ls.session_id,
    ls.user_id,
    u.username,
    ls.moodle_course_id,
    ls.total_problems,
    ls.correct_answers,
    ROUND((ls.correct_answers / NULLIF(ls.total_problems, 0)) * 100, 2) as accuracy_percentage,
    ls.total_time_seconds,
    ls.start_time,
    ls.end_time,
    TIMESTAMPDIFF(MINUTE, ls.start_time, ls.end_time) as session_duration_minutes
FROM learning_sessions ls
JOIN users u ON ls.user_id = u.id;

-- Grant permissions (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON inequality_arrow_db.* TO 'inequality_user'@'localhost' IDENTIFIED BY 'secure_password_here';
-- FLUSH PRIVILEGES;
