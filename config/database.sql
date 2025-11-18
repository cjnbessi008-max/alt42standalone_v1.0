-- ALT42 Database Schema
-- MySQL 5.7 compatible
-- Creates necessary tables for the standalone app

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS alt42_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alt42_app;

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    total_score INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    streak INT NOT NULL DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_total_score (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Attempts Table
CREATE TABLE IF NOT EXISTS user_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    problem_id VARCHAR(50) NOT NULL,
    answer TEXT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_attempt_time (attempt_time),
    FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session Table (optional, for custom session management)
CREATE TABLE IF NOT EXISTS app_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    session_data TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement/Badges Table (optional, for gamification)
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_data JSON,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Statistics Summary Table
CREATE TABLE IF NOT EXISTS user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    total_time_spent INT NOT NULL DEFAULT 0, -- in seconds
    best_streak INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data for Testing
INSERT IGNORE INTO user_progress (user_id, total_score, level, streak)
VALUES ('demo_user', 0, 1, 0);

-- Trigger to update statistics automatically
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_statistics_after_attempt
AFTER INSERT ON user_attempts
FOR EACH ROW
BEGIN
    INSERT INTO user_statistics (user_id, total_attempts, correct_attempts)
    VALUES (NEW.user_id, 1, IF(NEW.is_correct = 1, 1, 0))
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + IF(NEW.is_correct = 1, 1, 0);

    -- Update best streak if current streak is higher
    UPDATE user_statistics us
    INNER JOIN user_progress up ON us.user_id = up.user_id
    SET us.best_streak = GREATEST(us.best_streak, up.streak)
    WHERE us.user_id = NEW.user_id;
END$$

DELIMITER ;

-- View for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    up.user_id,
    up.total_score,
    up.level,
    up.streak,
    us.total_attempts,
    us.correct_attempts,
    ROUND((us.correct_attempts / NULLIF(us.total_attempts, 0)) * 100, 2) AS accuracy_percentage,
    up.last_activity
FROM user_progress up
LEFT JOIN user_statistics us ON up.user_id = us.user_id
ORDER BY up.total_score DESC, up.level DESC
LIMIT 100;

-- Indexes for performance
CREATE INDEX idx_attempts_user_time ON user_attempts(user_id, attempt_time);
CREATE INDEX idx_progress_score_level ON user_progress(total_score DESC, level DESC);
