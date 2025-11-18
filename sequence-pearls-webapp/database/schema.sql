-- Sequence Pearls Database Schema
-- MySQL 5.7+ Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS sequence_pearls
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sequence_pearls;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User profiles (learning preferences and stats)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_level INT DEFAULT 1,
    total_problems_solved INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    preferred_sequence_type VARCHAR(20) DEFAULT 'arithmetic',
    learning_speed DECIMAL(3,2) DEFAULT 1.00,
    last_difficulty INT DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_profile (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table (pre-generated or dynamically created)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_type ENUM('arithmetic', 'geometric', 'fibonacci', 'custom') NOT NULL,
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    sequence_data JSON NOT NULL,
    missing_position INT NOT NULL,
    correct_answer DECIMAL(10,2) NOT NULL,
    rule_formula VARCHAR(255),
    hint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_difficulty (sequence_type, difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User attempts
CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    user_answer DECIMAL(10,2) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INT NOT NULL COMMENT 'Time in seconds',
    hint_used BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    problems_attempted INT DEFAULT 0,
    problems_correct INT DEFAULT 0,
    total_time INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, started_at),
    INDEX idx_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations (AI-generated problem recommendations)
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    recommendation_score DECIMAL(3,2) NOT NULL,
    reason VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user_score (user_id, recommendation_score DESC),
    INDEX idx_user_pending (user_id, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type ENUM('streak', 'speed', 'accuracy', 'milestone') NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_achievements (user_id, earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for analytics
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id as user_id,
    u.username,
    up.total_problems_solved,
    up.total_correct,
    CASE
        WHEN up.total_problems_solved > 0
        THEN ROUND((up.total_correct / up.total_problems_solved) * 100, 2)
        ELSE 0
    END as accuracy_percentage,
    up.best_streak,
    up.current_streak,
    up.current_level,
    up.learning_speed,
    COUNT(DISTINCT a.id) as total_attempts,
    AVG(a.time_spent) as avg_time_per_problem
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY u.id, u.username, up.total_problems_solved, up.total_correct,
         up.best_streak, up.current_streak, up.current_level, up.learning_speed;

-- Insert sample data (for testing)
INSERT INTO users (username, email, password_hash, full_name) VALUES
('demo_student', 'demo@example.com', '$2a$10$XQEj5vQYxKYOYQXGXLXXXeOQYzYQYQYQYQYQYQYQYQYQYQY', 'Demo Student');

INSERT INTO user_profiles (user_id, current_level, preferred_sequence_type) VALUES
(1, 1, 'arithmetic');
