-- ============================================
-- Area Recombination App - Database Schema
-- MySQL 5.7 Compatible
-- ============================================

-- Database creation
CREATE DATABASE IF NOT EXISTS area_recombination
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE area_recombination;

-- ============================================
-- Table: shapes
-- Stores predefined shapes for the app
-- ============================================
CREATE TABLE IF NOT EXISTS shapes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shape_name VARCHAR(100) NOT NULL,
    shape_type ENUM('triangle', 'rectangle', 'parallelogram', 'trapezoid', 'polygon') NOT NULL,
    vertices JSON NOT NULL COMMENT 'Array of {x, y} coordinates',
    original_area DECIMAL(10, 4) NOT NULL,
    difficulty_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    color_code VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shape_type (shape_type),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: student_sessions
-- Tracks student learning sessions
-- ============================================
CREATE TABLE IF NOT EXISTS student_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED NOT NULL,
    moodle_course_id INT UNSIGNED NOT NULL,
    shape_id INT UNSIGNED NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5, 2) DEFAULT 0.00,
    attempts INT UNSIGNED DEFAULT 0,
    session_data JSON COMMENT 'Stores state of torn pieces and reassembly',
    INDEX idx_user (moodle_user_id),
    INDEX idx_course (moodle_course_id),
    INDEX idx_shape (shape_id),
    INDEX idx_completed (completed),
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: student_progress
-- Tracks overall student progress and achievements
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED NOT NULL,
    moodle_course_id INT UNSIGNED NOT NULL,
    total_shapes_completed INT UNSIGNED DEFAULT 0,
    total_attempts INT UNSIGNED DEFAULT 0,
    average_score DECIMAL(5, 2) DEFAULT 0.00,
    total_time_spent INT UNSIGNED DEFAULT 0 COMMENT 'Total time in seconds',
    highest_difficulty_level TINYINT UNSIGNED DEFAULT 0,
    achievements JSON COMMENT 'Array of achievement badges earned',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course (moodle_user_id, moodle_course_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: shape_manipulations
-- Logs each shape manipulation action
-- ============================================
CREATE TABLE IF NOT EXISTS shape_manipulations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    action_type ENUM('tear', 'move', 'rotate', 'reassemble', 'validate') NOT NULL,
    action_data JSON NOT NULL COMMENT 'Details of the manipulation',
    calculated_area DECIMAL(10, 4) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_action_type (action_type),
    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: app_settings
-- Stores application configuration
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert default shapes
-- ============================================
INSERT INTO shapes (shape_name, shape_type, vertices, original_area, difficulty_level, color_code) VALUES
('기본 삼각형', 'triangle',
 '[{"x": 150, "y": 50}, {"x": 50, "y": 250}, {"x": 250, "y": 250}]',
 20000.0000, 1, '#e74c3c'),

('기본 직사각형', 'rectangle',
 '[{"x": 50, "y": 50}, {"x": 250, "y": 50}, {"x": 250, "y": 200}, {"x": 50, "y": 200}]',
 30000.0000, 1, '#3498db'),

('평행사변형', 'parallelogram',
 '[{"x": 50, "y": 50}, {"x": 200, "y": 50}, {"x": 250, "y": 200}, {"x": 100, "y": 200}]',
 22500.0000, 2, '#2ecc71'),

('사다리꼴', 'trapezoid',
 '[{"x": 100, "y": 50}, {"x": 200, "y": 50}, {"x": 250, "y": 200}, {"x": 50, "y": 200}]',
 22500.0000, 2, '#f39c12'),

('복잡한 오각형', 'polygon',
 '[{"x": 150, "y": 30}, {"x": 250, "y": 120}, {"x": 220, "y": 230}, {"x": 80, "y": 230}, {"x": 50, "y": 120}]',
 28000.0000, 3, '#9b59b6');

-- ============================================
-- Insert default app settings
-- ============================================
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('app_version', '1.0.0', 'string', 'Current version of the Area Recombination App'),
('enable_sound', 'true', 'boolean', 'Enable sound effects'),
('enable_hints', 'true', 'boolean', 'Enable hints for students'),
('max_attempts_per_shape', '5', 'integer', 'Maximum attempts allowed per shape'),
('area_tolerance', '0.05', 'string', 'Acceptable area calculation tolerance (5%)'),
('smartphone_width', '375', 'integer', 'Virtual smartphone screen width in pixels'),
('smartphone_height', '667', 'integer', 'Virtual smartphone screen height in pixels');

-- ============================================
-- Views for analytics
-- ============================================
CREATE OR REPLACE VIEW v_student_performance AS
SELECT
    ss.moodle_user_id,
    ss.moodle_course_id,
    s.shape_name,
    s.difficulty_level,
    ss.completed,
    ss.score,
    ss.attempts,
    TIMESTAMPDIFF(SECOND, ss.session_start, ss.session_end) as duration_seconds,
    ss.session_start,
    ss.session_end
FROM student_sessions ss
JOIN shapes s ON ss.shape_id = s.id
WHERE ss.completed = TRUE;

CREATE OR REPLACE VIEW v_shape_statistics AS
SELECT
    s.id,
    s.shape_name,
    s.shape_type,
    s.difficulty_level,
    COUNT(ss.id) as total_attempts,
    COUNT(CASE WHEN ss.completed = TRUE THEN 1 END) as completed_count,
    AVG(ss.score) as average_score,
    AVG(ss.attempts) as average_attempts,
    AVG(TIMESTAMPDIFF(SECOND, ss.session_start, ss.session_end)) as avg_duration_seconds
FROM shapes s
LEFT JOIN student_sessions ss ON s.id = ss.shape_id
GROUP BY s.id;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Procedure to start a new session
CREATE PROCEDURE sp_start_session(
    IN p_user_id INT UNSIGNED,
    IN p_course_id INT UNSIGNED,
    IN p_shape_id INT UNSIGNED,
    OUT p_session_id INT UNSIGNED
)
BEGIN
    INSERT INTO student_sessions (moodle_user_id, moodle_course_id, shape_id)
    VALUES (p_user_id, p_course_id, p_shape_id);

    SET p_session_id = LAST_INSERT_ID();
END //

-- Procedure to complete a session
CREATE PROCEDURE sp_complete_session(
    IN p_session_id INT UNSIGNED,
    IN p_score DECIMAL(5, 2),
    IN p_session_data JSON
)
BEGIN
    DECLARE v_user_id INT UNSIGNED;
    DECLARE v_course_id INT UNSIGNED;
    DECLARE v_duration INT UNSIGNED;

    -- Update session
    UPDATE student_sessions
    SET session_end = CURRENT_TIMESTAMP,
        completed = TRUE,
        score = p_score,
        session_data = p_session_data
    WHERE id = p_session_id;

    -- Get session details
    SELECT moodle_user_id, moodle_course_id,
           TIMESTAMPDIFF(SECOND, session_start, session_end)
    INTO v_user_id, v_course_id, v_duration
    FROM student_sessions
    WHERE id = p_session_id;

    -- Update student progress
    INSERT INTO student_progress
        (moodle_user_id, moodle_course_id, total_shapes_completed,
         total_attempts, average_score, total_time_spent)
    VALUES
        (v_user_id, v_course_id, 1, 1, p_score, v_duration)
    ON DUPLICATE KEY UPDATE
        total_shapes_completed = total_shapes_completed + 1,
        total_attempts = total_attempts + 1,
        average_score = ((average_score * total_attempts) + p_score) / (total_attempts + 1),
        total_time_spent = total_time_spent + v_duration,
        last_activity = CURRENT_TIMESTAMP;
END //

-- Procedure to log manipulation
CREATE PROCEDURE sp_log_manipulation(
    IN p_session_id INT UNSIGNED,
    IN p_action_type VARCHAR(20),
    IN p_action_data JSON,
    IN p_calculated_area DECIMAL(10, 4)
)
BEGIN
    INSERT INTO shape_manipulations
        (session_id, action_type, action_data, calculated_area)
    VALUES
        (p_session_id, p_action_type, p_action_data, p_calculated_area);

    -- Update attempts count
    UPDATE student_sessions
    SET attempts = attempts + 1
    WHERE id = p_session_id;
END //

DELIMITER ;

-- ============================================
-- Grant permissions (adjust as needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON area_recombination.* TO 'moodle_user'@'localhost';

-- ============================================
-- End of schema
-- ============================================
