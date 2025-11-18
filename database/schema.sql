-- Mean Center Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS mean_center_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mean_center_db;

-- Table: sessions
-- Stores student session information
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(100) NOT NULL,
    student_name VARCHAR(255),
    problem_id VARCHAR(100),
    problem_title TEXT,
    canvas_width INT DEFAULT 800,
    canvas_height INT DEFAULT 600,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: coordinates
-- Stores individual touch/click coordinates
CREATE TABLE IF NOT EXISTS coordinates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    x DECIMAL(10, 2) NOT NULL,
    y DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mean_center_stats
-- Stores calculated mean center statistics
CREATE TABLE IF NOT EXISTS mean_center_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    mean_x DECIMAL(10, 2) NOT NULL,
    mean_y DECIMAL(10, 2) NOT NULL,
    point_count INT NOT NULL,
    variance_x DECIMAL(10, 2) DEFAULT 0,
    variance_y DECIMAL(10, 2) DEFAULT 0,
    std_dev_x DECIMAL(10, 2) DEFAULT 0,
    std_dev_y DECIMAL(10, 2) DEFAULT 0,
    min_x DECIMAL(10, 2),
    max_x DECIMAL(10, 2),
    min_y DECIMAL(10, 2),
    max_y DECIMAL(10, 2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moodle_users
-- Cache for Moodle user information
CREATE TABLE IF NOT EXISTS moodle_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    full_name VARCHAR(255),
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO sessions (session_id, student_id, student_name, problem_id, problem_title, canvas_width, canvas_height)
VALUES
    ('demo-session-001', 'student001', 'Kim Minho', 'prob001', 'Understanding Mean Center', 800, 600),
    ('demo-session-002', 'student002', 'Lee Jieun', 'prob001', 'Understanding Mean Center', 800, 600);

-- Insert sample coordinates for demo session
INSERT INTO coordinates (session_id, x, y, timestamp)
VALUES
    ('demo-session-001', 120.50, 200.75, NOW()),
    ('demo-session-001', 150.25, 220.30, NOW()),
    ('demo-session-001', 180.00, 190.50, NOW()),
    ('demo-session-001', 140.75, 210.20, NOW()),
    ('demo-session-001', 160.50, 205.80, NOW());

-- Calculate initial mean center stats for demo
INSERT INTO mean_center_stats (session_id, mean_x, mean_y, point_count, variance_x, variance_y, std_dev_x, std_dev_y, min_x, max_x, min_y, max_y)
VALUES (
    'demo-session-001',
    150.40,  -- mean_x
    205.51,  -- mean_y
    5,       -- point_count
    376.54,  -- variance_x
    124.25,  -- variance_y
    19.41,   -- std_dev_x
    11.15,   -- std_dev_y
    120.50,  -- min_x
    180.00,  -- max_x
    190.50,  -- min_y
    220.30   -- max_y
);

-- View: session_summary
-- Convenient view for session overview
CREATE OR REPLACE VIEW session_summary AS
SELECT
    s.session_id,
    s.student_id,
    s.student_name,
    s.problem_title,
    s.started_at,
    s.is_active,
    COUNT(c.id) as coordinate_count,
    mcs.mean_x,
    mcs.mean_y,
    mcs.point_count,
    mcs.calculated_at as stats_updated_at
FROM sessions s
LEFT JOIN coordinates c ON s.session_id = c.session_id
LEFT JOIN mean_center_stats mcs ON s.session_id = mcs.session_id
GROUP BY s.session_id, s.student_id, s.student_name, s.problem_title, s.started_at, s.is_active,
         mcs.mean_x, mcs.mean_y, mcs.point_count, mcs.calculated_at;

-- Stored Procedure: Calculate Mean Center
DELIMITER //

CREATE PROCEDURE CalculateMeanCenter(IN p_session_id VARCHAR(100))
BEGIN
    DECLARE v_count INT;
    DECLARE v_mean_x DECIMAL(10, 2);
    DECLARE v_mean_y DECIMAL(10, 2);
    DECLARE v_variance_x DECIMAL(10, 2);
    DECLARE v_variance_y DECIMAL(10, 2);
    DECLARE v_min_x DECIMAL(10, 2);
    DECLARE v_max_x DECIMAL(10, 2);
    DECLARE v_min_y DECIMAL(10, 2);
    DECLARE v_max_y DECIMAL(10, 2);

    -- Calculate statistics
    SELECT
        COUNT(*),
        AVG(x),
        AVG(y),
        VARIANCE(x),
        VARIANCE(y),
        MIN(x),
        MAX(x),
        MIN(y),
        MAX(y)
    INTO
        v_count,
        v_mean_x,
        v_mean_y,
        v_variance_x,
        v_variance_y,
        v_min_x,
        v_max_x,
        v_min_y,
        v_max_y
    FROM coordinates
    WHERE session_id = p_session_id;

    -- Insert or update stats
    INSERT INTO mean_center_stats (
        session_id, mean_x, mean_y, point_count,
        variance_x, variance_y,
        std_dev_x, std_dev_y,
        min_x, max_x, min_y, max_y
    ) VALUES (
        p_session_id, v_mean_x, v_mean_y, v_count,
        v_variance_x, v_variance_y,
        SQRT(v_variance_x), SQRT(v_variance_y),
        v_min_x, v_max_x, v_min_y, v_max_y
    )
    ON DUPLICATE KEY UPDATE
        mean_x = v_mean_x,
        mean_y = v_mean_y,
        point_count = v_count,
        variance_x = v_variance_x,
        variance_y = v_variance_y,
        std_dev_x = SQRT(v_variance_x),
        std_dev_y = SQRT(v_variance_y),
        min_x = v_min_x,
        max_x = v_max_x,
        min_y = v_min_y,
        max_y = v_max_y,
        calculated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON mean_center_db.* TO 'mean_center_user'@'localhost';
-- FLUSH PRIVILEGES;
