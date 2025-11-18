-- Truth Temperature App Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS truth_temperature
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE truth_temperature;

-- Problems table: stores inequality problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    inequality_expression VARCHAR(500) NOT NULL,
    left_side VARCHAR(250) NOT NULL,
    right_side VARCHAR(250) NOT NULL,
    operator ENUM('<', '<=', '>', '>=', '=', '!=') NOT NULL,
    correct_answer BOOLEAN NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table: tracks user activity
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    username VARCHAR(100),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_user (moodle_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_active_sessions (is_active, last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User responses table: stores user answers to problems
CREATE TABLE IF NOT EXISTS user_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    user_answer BOOLEAN NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT,
    temperature_displayed INT COMMENT 'Temperature shown: -20 to 50 degrees',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_problem (problem_id),
    INDEX idx_correctness (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Temperature logs table: detailed temperature change tracking
CREATE TABLE IF NOT EXISTS temperature_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    temperature_value INT NOT NULL COMMENT 'Temperature: -20 to 50 degrees',
    temperature_type ENUM('cold', 'cool', 'warm', 'hot') NOT NULL,
    is_truth BOOLEAN NOT NULL COMMENT 'TRUE if inequality is true, FALSE if false',
    display_duration_ms INT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_temperature (temperature_value),
    INDEX idx_truth (is_truth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration table: app settings
CREATE TABLE IF NOT EXISTS app_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO app_config (config_key, config_value, description) VALUES
('temp_true_min', '30', 'Minimum temperature for TRUE inequalities (warm)'),
('temp_true_max', '50', 'Maximum temperature for TRUE inequalities (hot)'),
('temp_false_min', '-20', 'Minimum temperature for FALSE inequalities (cold)'),
('temp_false_max', '10', 'Maximum temperature for FALSE inequalities (cool)'),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)'),
('moodle_api_url', 'http://localhost/moodle', 'Moodle base URL'),
('moodle_api_token', '', 'Moodle web service token');

-- Sample data for testing
INSERT INTO problems (
    moodle_question_id,
    question_text,
    inequality_expression,
    left_side,
    right_side,
    operator,
    correct_answer,
    difficulty_level,
    category
) VALUES
(1, '5 + 3은 10보다 작습니까?', '5 + 3 < 10', '5 + 3', '10', '<', TRUE, 'easy', 'basic_arithmetic'),
(2, '15는 20보다 큽니까?', '15 > 20', '15', '20', '>', FALSE, 'easy', 'basic_arithmetic'),
(3, '2 × 6은 12와 같습니까?', '2 × 6 = 12', '2 × 6', '12', '=', TRUE, 'easy', 'multiplication'),
(4, '25 - 10은 20보다 작거나 같습니까?', '25 - 10 <= 20', '25 - 10', '20', '<=', TRUE, 'medium', 'mixed_operations'),
(5, '100 ÷ 5는 25보다 작습니까?', '100 ÷ 5 < 25', '100 ÷ 5', '25', '<', TRUE, 'medium', 'division');
