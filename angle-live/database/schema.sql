-- Angle Live Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

CREATE DATABASE IF NOT EXISTS angle_live DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE angle_live;

-- Table: angle_sessions
-- Stores user session data and angle manipulation records
CREATE TABLE IF NOT EXISTS angle_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    angle_value DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    angle_status VARCHAR(100) DEFAULT NULL,
    status_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_angle_value (angle_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: angle_thresholds
-- Defines what happens at specific angle values
CREATE TABLE IF NOT EXISTS angle_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    angle_min DECIMAL(5,2) NOT NULL,
    angle_max DECIMAL(5,2) NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    status_description TEXT,
    visual_feedback VARCHAR(255),
    audio_feedback VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_angle_range (angle_min, angle_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_progress
-- Tracks user learning progress
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_user_id INT DEFAULT NULL,
    total_sessions INT DEFAULT 0,
    angles_discovered INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_angle DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moodle_integration
-- Links Angle Live with Moodle LMS
CREATE TABLE IF NOT EXISTS moodle_integration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    angle_live_user_id INT NOT NULL,
    grade DECIMAL(5,2) DEFAULT 0.00,
    last_synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_course_id, moodle_user_id),
    INDEX idx_angle_user (angle_live_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default angle thresholds
INSERT INTO angle_thresholds (angle_min, angle_max, status_name, status_description, visual_feedback, audio_feedback) VALUES
(0.00, 30.00, 'Acute Angle - Very Sharp', '매우 좁은 각도입니다. 예각이라고 합니다.', 'color-blue', 'sound-1.mp3'),
(30.01, 60.00, 'Acute Angle - Moderate', '중간 크기의 예각입니다.', 'color-cyan', 'sound-2.mp3'),
(60.01, 89.99, 'Acute Angle - Wide', '넓은 예각입니다.', 'color-green', 'sound-3.mp3'),
(90.00, 90.00, 'Right Angle', '직각입니다! 90도 정확히 맞췄습니다.', 'color-yellow', 'sound-special.mp3'),
(90.01, 120.00, 'Obtuse Angle - Narrow', '좁은 둔각입니다.', 'color-orange', 'sound-4.mp3'),
(120.01, 150.00, 'Obtuse Angle - Moderate', '중간 크기의 둔각입니다.', 'color-red', 'sound-5.mp3'),
(150.01, 179.99, 'Obtuse Angle - Wide', '매우 넓은 둔각입니다.', 'color-purple', 'sound-6.mp3'),
(180.00, 180.00, 'Straight Angle', '평각입니다! 180도 정확히 맞췄습니다.', 'color-pink', 'sound-special-2.mp3'),
(180.01, 270.00, 'Reflex Angle - Narrow', '좁은 우각입니다.', 'color-brown', 'sound-7.mp3'),
(270.01, 360.00, 'Reflex Angle - Wide', '넓은 우각입니다.', 'color-gray', 'sound-8.mp3');

-- Create views for easier querying
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    up.user_id,
    up.moodle_user_id,
    up.total_sessions,
    up.angles_discovered,
    up.completion_percentage,
    up.last_angle,
    COUNT(DISTINCT as2.angle_value) as unique_angles_tried,
    MAX(as2.created_at) as last_activity
FROM user_progress up
LEFT JOIN angle_sessions as2 ON up.user_id = as2.user_id
GROUP BY up.user_id, up.moodle_user_id, up.total_sessions, up.angles_discovered, up.completion_percentage, up.last_angle;
