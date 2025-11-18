-- ALT42 Standalone Database Schema
-- MySQL 5.7 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS alt42_standalone
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alt42_standalone;

-- Quiz tracking table
CREATE TABLE IF NOT EXISTS quiz_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    score DECIMAL(5, 2) NOT NULL,
    max_score DECIMAL(5, 2) NOT NULL,
    completion_status ENUM('started', 'in_progress', 'completed') DEFAULT 'started',
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Graph data cache table
CREATE TABLE IF NOT EXISTS graph_data_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    data_type ENUM('statistics', 'time_series', 'user_progress') NOT NULL,
    data_json JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cache (quiz_id, user_id, data_type),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session tracking for analytics
CREATE TABLE IF NOT EXISTS session_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT DEFAULT NULL,
    quiz_id INT DEFAULT NULL,
    page_view VARCHAR(255) DEFAULT NULL,
    action VARCHAR(100) DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API request log
CREATE TABLE IF NOT EXISTS api_request_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
    request_params JSON DEFAULT NULL,
    response_code INT DEFAULT NULL,
    response_time_ms INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO quiz_tracking (quiz_id, user_id, score, max_score, completion_status, time_spent)
VALUES
    (1, 1, 85.5, 100, 'completed', 1200),
    (1, 2, 92.0, 100, 'completed', 980),
    (1, 3, 78.5, 100, 'completed', 1450),
    (1, 1, 88.0, 100, 'completed', 1100),
    (2, 1, 95.0, 100, 'completed', 800),
    (2, 2, 87.5, 100, 'in_progress', 600);

-- Create stored procedure for getting quiz statistics
DELIMITER //

CREATE PROCEDURE GetQuizStatistics(IN p_quiz_id INT, IN p_user_id INT)
BEGIN
    SELECT
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100 as completion_rate,
        AVG(time_spent) as avg_time_spent
    FROM quiz_tracking
    WHERE quiz_id = p_quiz_id
        AND (p_user_id IS NULL OR user_id = p_user_id);
END //

DELIMITER ;

-- Create function for calculating progress trend
DELIMITER //

CREATE FUNCTION GetProgressTrend(p_quiz_id INT, p_user_id INT)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_trend VARCHAR(20);
    DECLARE v_recent_avg DECIMAL(5,2);
    DECLARE v_overall_avg DECIMAL(5,2);

    SELECT AVG(score) INTO v_recent_avg
    FROM (
        SELECT score FROM quiz_tracking
        WHERE quiz_id = p_quiz_id
            AND (p_user_id IS NULL OR user_id = p_user_id)
        ORDER BY created_at DESC
        LIMIT 5
    ) recent;

    SELECT AVG(score) INTO v_overall_avg
    FROM quiz_tracking
    WHERE quiz_id = p_quiz_id
        AND (p_user_id IS NULL OR user_id = p_user_id);

    IF v_recent_avg > v_overall_avg + 5 THEN
        SET v_trend = 'improving';
    ELSEIF v_recent_avg < v_overall_avg - 5 THEN
        SET v_trend = 'declining';
    ELSE
        SET v_trend = 'stable';
    END IF;

    RETURN v_trend;
END //

DELIMITER ;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_standalone.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
