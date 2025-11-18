-- Calm Growth App Database Schema
-- MySQL 5.7 compatible

CREATE DATABASE IF NOT EXISTS calm_growth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE calm_growth_db;

-- Problems table - stores problem information from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User activity log - tracks user interactions for Calm Growth algorithm
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    action_type ENUM('view', 'attempt', 'correct', 'incorrect') NOT NULL,
    log_value DECIMAL(10, 4) DEFAULT 1.0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vibration settings - stores user-specific Calm Growth settings
CREATE TABLE IF NOT EXISTS vibration_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    base_intensity DECIMAL(5, 2) DEFAULT 100.00,
    damping_factor DECIMAL(5, 2) DEFAULT 1.50,
    min_intensity DECIMAL(5, 2) DEFAULT 10.00,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for testing
INSERT INTO problems (moodle_question_id, title, description, difficulty_level, category) VALUES
(1001, 'Basic Addition', 'What is 5 + 3?', 'easy', 'arithmetic'),
(1002, 'Multiplication Problem', 'Calculate 12 × 7', 'medium', 'arithmetic'),
(1003, 'Fraction Division', 'Divide 3/4 by 2/3', 'hard', 'fractions');

-- Default vibration settings
INSERT INTO vibration_settings (user_id, base_intensity, damping_factor, min_intensity) VALUES
(1, 100.00, 1.50, 10.00);
