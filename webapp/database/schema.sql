-- Invariant Finder Standalone Web App Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-01-18

-- Create database
CREATE DATABASE IF NOT EXISTS invariant_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE invariant_finder;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activities table (shape exploration activities)
CREATE TABLE IF NOT EXISTS activities (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    shape_type ENUM('triangle', 'rectangle', 'circle', 'parallelogram') NOT NULL,
    difficulty INT(1) DEFAULT 1,
    show_hints TINYINT(1) DEFAULT 1,
    created_by INT(11) UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shape_type (shape_type),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attempts table (user attempts at activities)
CREATE TABLE IF NOT EXISTS attempts (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) UNSIGNED NOT NULL,
    activity_id INT(11) UNSIGNED NOT NULL,
    attempt_number INT(5) DEFAULT 1,
    invariants_found JSON,
    scale_actions INT(10) DEFAULT 0,
    time_spent INT(10) DEFAULT 0 COMMENT 'Time in seconds',
    completed TINYINT(1) DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id, activity_id),
    INDEX idx_completed (completed),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interactions table (detailed interaction logs)
CREATE TABLE IF NOT EXISTS interactions (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT(11) UNSIGNED NOT NULL,
    action_type VARCHAR(50) NOT NULL COMMENT 'scale, rotate, check_invariant, submit',
    action_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leaderboard view (materialized for performance)
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) UNSIGNED NOT NULL,
    shape_type VARCHAR(50),
    total_score DECIMAL(10,2) DEFAULT 0.00,
    total_attempts INT(10) DEFAULT 0,
    completed_attempts INT(10) DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    total_time INT(10) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_shape (user_id, shape_type),
    INDEX idx_total_score (total_score),
    INDEX idx_avg_score (avg_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for PHP session management)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id INT(11) UNSIGNED,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    payload TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@invariantfinder.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- Insert sample activities
INSERT INTO activities (title, description, shape_type, difficulty, show_hints, created_by) VALUES
('Triangle Exploration - Beginner', 'Discover the invariant properties of triangles. Focus on angles and their sum.', 'triangle', 1, 1, 1),
('Rectangle Basics', 'Learn about rectangles and their unchanging properties.', 'rectangle', 1, 1, 1),
('Circle and Pi', 'Explore the relationship between a circle''s circumference and diameter.', 'circle', 2, 1, 1),
('Advanced Triangle Study', 'Deep dive into triangle ratios and advanced properties.', 'triangle', 3, 0, 1),
('Parallelogram Challenge', 'Master the invariant properties of parallelograms.', 'parallelogram', 3, 1, 1);

-- Create stored procedure to update leaderboard
DELIMITER $$

CREATE PROCEDURE update_leaderboard(IN p_user_id INT)
BEGIN
    -- Update or insert leaderboard for each shape type
    INSERT INTO leaderboard (user_id, shape_type, total_score, total_attempts, completed_attempts, avg_score, best_score, total_time)
    SELECT
        a.user_id,
        act.shape_type,
        SUM(a.score) as total_score,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN a.completed = 1 THEN 1 ELSE 0 END) as completed_attempts,
        AVG(CASE WHEN a.completed = 1 THEN a.score ELSE NULL END) as avg_score,
        MAX(a.score) as best_score,
        SUM(a.time_spent) as total_time
    FROM attempts a
    JOIN activities act ON a.activity_id = act.id
    WHERE a.user_id = p_user_id
    GROUP BY a.user_id, act.shape_type
    ON DUPLICATE KEY UPDATE
        total_score = VALUES(total_score),
        total_attempts = VALUES(total_attempts),
        completed_attempts = VALUES(completed_attempts),
        avg_score = VALUES(avg_score),
        best_score = VALUES(best_score),
        total_time = VALUES(total_time);
END$$

DELIMITER ;

-- Create trigger to auto-update leaderboard
DELIMITER $$

CREATE TRIGGER after_attempt_update
AFTER UPDATE ON attempts
FOR EACH ROW
BEGIN
    IF NEW.completed = 1 AND OLD.completed = 0 THEN
        CALL update_leaderboard(NEW.user_id);
    END IF;
END$$

DELIMITER ;

-- Grant privileges (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON invariant_finder.* TO 'webapp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- FLUSH PRIVILEGES;
