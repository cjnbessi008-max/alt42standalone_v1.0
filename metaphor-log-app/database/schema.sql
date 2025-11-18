-- Metaphor Log Database Schema for MySQL 5.7
-- Created for Moodle 3.7 integration

CREATE DATABASE IF NOT EXISTS metaphor_log CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE metaphor_log;

-- Problems table: stores logarithm problems from Moodle
CREATE TABLE IF NOT EXISTS log_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT DEFAULT NULL,
    base DECIMAL(10,4) NOT NULL,
    result DECIMAL(10,4) NOT NULL,
    answer DECIMAL(10,4) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    metaphor_type ENUM('tree', 'stairs', 'magnify', 'blocks') DEFAULT 'tree',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_count INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INT DEFAULT 0, -- seconds
    metaphor_interactions JSON, -- interaction tracking
    submitted_answer DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES log_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metaphor preferences: tracks which visualization works best for each student
CREATE TABLE IF NOT EXISTS metaphor_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    metaphor_type ENUM('tree', 'stairs', 'magnify', 'blocks') NOT NULL,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_metaphor (moodle_user_id, metaphor_type),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample problems
INSERT INTO log_problems (base, result, answer, difficulty, metaphor_type) VALUES
(2, 8, 3, 'easy', 'tree'),      -- log₂8 = 3
(2, 16, 4, 'easy', 'stairs'),   -- log₂16 = 4
(10, 100, 2, 'easy', 'magnify'), -- log₁₀100 = 2
(3, 27, 3, 'medium', 'blocks'),  -- log₃27 = 3
(2, 32, 5, 'medium', 'tree'),    -- log₂32 = 5
(5, 125, 3, 'medium', 'stairs'), -- log₅125 = 3
(10, 1000, 3, 'hard', 'magnify'), -- log₁₀1000 = 3
(2, 64, 6, 'hard', 'blocks');    -- log₂64 = 6
