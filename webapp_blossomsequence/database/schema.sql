-- Blossom Sequence Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS blossom_sequence
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE blossom_sequence;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    current_level DECIMAL(3,1) DEFAULT 1.0,
    total_completed INT DEFAULT 0,
    total_time INT DEFAULT 0, -- in seconds
    avg_accuracy DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User profiles for recommendation system
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    strengths JSON, -- Array of sequence types user is good at
    weaknesses JSON, -- Array of sequence types user struggles with
    preferred_types JSON, -- User's preferred sequence types
    learning_style VARCHAR(50) DEFAULT 'balanced', -- visual, analytical, balanced
    performance_trend VARCHAR(20) DEFAULT 'stable', -- improving, declining, stable
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attempts/Sessions table
CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sequence_type VARCHAR(50) NOT NULL,
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    petal_count INT NOT NULL,
    sequence_data JSON, -- The actual sequence shown
    user_answers JSON, -- Array of user's answers
    correct_answers JSON, -- Array of correct answers
    correct_count INT DEFAULT 0,
    total_questions INT DEFAULT 10,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT NOT NULL, -- in seconds
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_sequence_type (sequence_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual problem attempts (detail level)
CREATE TABLE IF NOT EXISTS problem_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    user_id INT NOT NULL,
    problem_number INT NOT NULL,
    sequence_shown JSON,
    user_answer DECIMAL(10,2),
    correct_answer DECIMAL(10,2) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INT, -- in seconds
    hint_used BOOLEAN DEFAULT FALSE,
    skipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations history
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sequence_type VARCHAR(50) NOT NULL,
    difficulty INT NOT NULL,
    petal_count INT NOT NULL,
    reason TEXT,
    algorithm_version VARCHAR(20) DEFAULT 'v1.0',
    accepted BOOLEAN DEFAULT FALSE, -- Did user accept recommendation?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance metrics (for analytics)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_date DATE NOT NULL,
    problems_completed INT DEFAULT 0,
    problems_correct INT DEFAULT 0,
    avg_time_per_problem DECIMAL(6,2),
    avg_accuracy DECIMAL(5,2),
    sequence_types_attempted JSON,
    peak_difficulty INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_date (user_id, metric_date),
    INDEX idx_user_id (user_id),
    INDEX idx_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badges/Achievements (gamification)
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(50),
    criteria JSON, -- Conditions to unlock
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User achievements (junction table)
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default achievements
INSERT INTO achievements (name, description, badge_icon, criteria, points) VALUES
('첫 걸음', '첫 번째 문제를 완료했습니다', '🎯', '{"problems_completed": 1}', 10),
('열정 학습자', '10개의 문제를 완료했습니다', '🔥', '{"problems_completed": 10}', 50),
('수학 마스터', '100개의 문제를 완료했습니다', '🏆', '{"problems_completed": 100}', 500),
('완벽주의자', '10문제 연속 100% 정확도', '💯', '{"consecutive_perfect": 10}', 100),
('피보나치 전문가', '피보나치 수열 20문제 완료', '🌻', '{"fibonacci_completed": 20}', 75);

-- Create default test user (password: test123)
INSERT INTO users (username, email, password_hash, current_level) VALUES
('testuser', 'test@example.com', '$2b$10$rU8IQ0vJYzKxfLnBqXqhVe5yYzJZKZ0QXKxKxGJQXQ5YQXKxKxGJQ', 1.0);

-- Create user profile for test user
INSERT INTO user_profiles (user_id, strengths, weaknesses, preferred_types) VALUES
(1, '["fibonacci"]', '[]', '["fibonacci", "arithmetic"]');
