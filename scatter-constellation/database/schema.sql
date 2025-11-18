-- Scatter Constellation Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS scatter_constellation
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE scatter_constellation;

-- Problems table: stores problem data from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL,
    course_id INT NOT NULL,
    problem_name VARCHAR(255) NOT NULL,
    problem_type ENUM('quiz', 'question', 'assignment') DEFAULT 'question',
    difficulty DECIMAL(3,1) DEFAULT 5.0 CHECK (difficulty >= 0 AND difficulty <= 10),
    max_grade DECIMAL(5,2) DEFAULT 0,
    time_limit INT DEFAULT 0 COMMENT 'in seconds',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_problem (moodle_problem_id, course_id),
    INDEX idx_course (course_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Constellation points: stores visualization data
CREATE TABLE IF NOT EXISTS constellation_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    x_coordinate DECIMAL(10,2) NOT NULL COMMENT 'X position (difficulty axis)',
    y_coordinate DECIMAL(10,2) NOT NULL COMMENT 'Y position (score axis)',
    color VARCHAR(7) DEFAULT '#4444FF' COMMENT 'Hex color code',
    size INT DEFAULT 5 COMMENT 'Point size in pixels',
    constellation_group INT DEFAULT 0 COMMENT 'Group ID for connecting lines',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_coordinates (x_coordinate, y_coordinate),
    INDEX idx_group (constellation_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student progress: tracks student performance on problems
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    attempts INT DEFAULT 0,
    time_spent INT DEFAULT 0 COMMENT 'in seconds',
    completed BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_problem (moodle_user_id, problem_id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Constellation connections: defines lines between points
CREATE TABLE IF NOT EXISTS constellation_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_point_id INT NOT NULL,
    to_point_id INT NOT NULL,
    line_width INT DEFAULT 2,
    line_color VARCHAR(7) DEFAULT '#FFFFFF',
    line_style ENUM('solid', 'dashed', 'dotted') DEFAULT 'solid',
    strength DECIMAL(3,2) DEFAULT 1.0 COMMENT 'Connection strength (0-1)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_point_id) REFERENCES constellation_points(id) ON DELETE CASCADE,
    FOREIGN KEY (to_point_id) REFERENCES constellation_points(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (from_point_id, to_point_id),
    INDEX idx_from (from_point_id),
    INDEX idx_to (to_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Courses cache: stores course info from Moodle
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    category_id INT DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- App sessions: track user sessions
CREATE TABLE IF NOT EXISTS app_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    moodle_user_id INT,
    course_id INT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings table: app configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'int', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('constellation_auto_connect', 'true', 'boolean', 'Automatically connect nearby points'),
('max_connection_distance', '3.0', 'string', 'Maximum distance for auto-connecting points'),
('default_point_color', '#4444FF', 'string', 'Default color for constellation points'),
('animation_enabled', 'true', 'boolean', 'Enable constellation animations'),
('sync_interval', '300', 'int', 'Moodle sync interval in seconds');

-- View for constellation data
CREATE OR REPLACE VIEW v_constellation_data AS
SELECT
    p.id AS problem_id,
    p.problem_name,
    p.problem_type,
    p.difficulty,
    cp.x_coordinate,
    cp.y_coordinate,
    cp.color,
    cp.size,
    cp.constellation_group,
    COALESCE(AVG(sp.score), 0) AS avg_score,
    COUNT(sp.id) AS student_count
FROM problems p
LEFT JOIN constellation_points cp ON p.id = cp.problem_id
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, cp.id;
