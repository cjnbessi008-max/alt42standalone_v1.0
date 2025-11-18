-- Feature Spotlight Database Schema
-- Compatible with MySQL 5.7

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS feature_spotlight
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE feature_spotlight;

-- Table: Question Metadata
-- Stores cached feature analysis results and custom data for Moodle questions
CREATE TABLE IF NOT EXISTS fs_question_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL COMMENT 'Moodle question ID',
    meta_key VARCHAR(100) NOT NULL COMMENT 'Metadata key (e.g., feature_analysis)',
    meta_value JSON NOT NULL COMMENT 'Metadata value stored as JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_question_meta (question_id, meta_key),
    INDEX idx_question_id (question_id),
    INDEX idx_meta_key (meta_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores metadata and cached analysis for Moodle questions';

-- Table: Student Interactions
-- Tracks student interactions with highlighted features
CREATE TABLE IF NOT EXISTS fs_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL COMMENT 'Moodle question ID',
    user_id INT NOT NULL DEFAULT 0 COMMENT 'Moodle user ID (0 for anonymous)',
    feature_type VARCHAR(50) NOT NULL COMMENT 'Type of feature (maxima, minima, inflection, etc.)',
    feature_data JSON NULL COMMENT 'Additional feature data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_id (question_id),
    INDEX idx_user_id (user_id),
    INDEX idx_feature_type (feature_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks student interactions with mathematical features';

-- Table: Analysis Jobs
-- Tracks background analysis jobs for complex functions
CREATE TABLE IF NOT EXISTS fs_analysis_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    function_expression TEXT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    x_min DECIMAL(10,4) DEFAULT -10.0000,
    x_max DECIMAL(10,4) DEFAULT 10.0000,
    result JSON NULL COMMENT 'Analysis result',
    error_message TEXT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_id (question_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks analysis jobs for mathematical functions';

-- Table: Feature Definitions
-- Stores configuration for different feature types
CREATE TABLE IF NOT EXISTS fs_feature_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_type VARCHAR(50) NOT NULL UNIQUE COMMENT 'Feature type identifier',
    display_name_en VARCHAR(100) NOT NULL COMMENT 'English display name',
    display_name_ko VARCHAR(100) NOT NULL COMMENT 'Korean display name',
    color VARCHAR(20) NOT NULL COMMENT 'Highlight color (hex or CSS color name)',
    description_en TEXT NULL,
    description_ko TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_feature_type (feature_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for feature types';

-- Insert default feature definitions
INSERT INTO fs_feature_definitions
    (feature_type, display_name_en, display_name_ko, color, description_en, description_ko, display_order)
VALUES
    ('local_maximum', 'Local Maximum', '극대값', '#FF4444', 'Point where function reaches a local peak', '함수가 국소적으로 최대가 되는 점', 1),
    ('local_minimum', 'Local Minimum', '극소값', '#4444FF', 'Point where function reaches a local valley', '함수가 국소적으로 최소가 되는 점', 2),
    ('inflection_point', 'Inflection Point', '변곡점', '#44FF44', 'Point where concavity changes', '오목/볼록이 바뀌는 점', 3),
    ('increasing_interval', 'Increasing', '증가 구간', '#FFAA00', 'Interval where function is increasing', '함수가 증가하는 구간', 4),
    ('decreasing_interval', 'Decreasing', '감소 구간', '#AA00FF', 'Interval where function is decreasing', '함수가 감소하는 구간', 5),
    ('critical_point', 'Critical Point', '임계점', '#FF00AA', 'Point where derivative is zero or undefined', '미분값이 0이거나 정의되지 않는 점', 6)
ON DUPLICATE KEY UPDATE
    display_name_en = VALUES(display_name_en),
    display_name_ko = VALUES(display_name_ko),
    color = VALUES(color);

-- Sample data for testing (optional)
-- Uncomment to insert test data

-- INSERT INTO fs_question_metadata (question_id, meta_key, meta_value)
-- VALUES (1, 'feature_analysis', JSON_OBJECT(
--     'timestamp', UNIX_TIMESTAMP(),
--     'function', 'x^2 - 4*x + 3',
--     'features', JSON_OBJECT(
--         'local_minimum', JSON_ARRAY(JSON_OBJECT('x', 2, 'y', -1)),
--         'increasing_intervals', JSON_ARRAY(JSON_ARRAY(2, 10)),
--         'decreasing_intervals', JSON_ARRAY(JSON_ARRAY(-10, 2))
--     )
-- ));

-- Create indexes for performance
-- (already included above in table definitions)

-- Grant permissions (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON feature_spotlight.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
