-- Reflection Mode Database Schema
-- MySQL 5.7 compatible
-- For use with Moodle 3.7 integration

-- Create database (if needed)
CREATE DATABASE IF NOT EXISTS reflection_mode
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE reflection_mode;

-- Problems table: stores problem definitions from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT UNSIGNED NULL COMMENT 'Moodle course ID',
    moodle_activity_id INT UNSIGNED NULL COMMENT 'Moodle activity ID',
    moodle_user_id INT UNSIGNED NULL COMMENT 'Moodle user ID of creator',

    title VARCHAR(255) NOT NULL COMMENT 'Problem title',
    description TEXT NULL COMMENT 'Problem description',

    shape_type ENUM('polygon', 'circle', 'rectangle', 'triangle', 'custom') DEFAULT 'polygon',
    shape_data JSON NOT NULL COMMENT 'Shape points and configuration in JSON format',

    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    tags VARCHAR(500) NULL COMMENT 'Comma-separated tags',

    correct_answer JSON NULL COMMENT 'Expected answer (area, overlap, etc.)',
    hints JSON NULL COMMENT 'Array of hints',

    time_limit INT UNSIGNED NULL COMMENT 'Time limit in seconds (NULL = no limit)',
    max_attempts INT UNSIGNED NULL COMMENT 'Maximum attempts allowed (NULL = unlimited)',

    is_active TINYINT(1) DEFAULT 1 COMMENT 'Is problem active?',
    is_public TINYINT(1) DEFAULT 0 COMMENT 'Is problem publicly accessible?',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_activity (moodle_activity_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table: tracks student work
CREATE TABLE IF NOT EXISTS attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    moodle_user_id INT UNSIGNED NOT NULL COMMENT 'Moodle student ID',

    session_id VARCHAR(64) NOT NULL COMMENT 'Session identifier',

    student_answer JSON NULL COMMENT 'Student submitted answer',
    student_shape_data JSON NULL COMMENT 'Student drawn shape',

    calculated_area DECIMAL(10, 4) NULL COMMENT 'Calculated area',
    calculated_overlap DECIMAL(10, 4) NULL COMMENT 'Calculated overlap',
    overlap_ratio DECIMAL(5, 2) NULL COMMENT 'Overlap ratio percentage',

    is_correct TINYINT(1) NULL COMMENT 'Is answer correct?',
    score DECIMAL(5, 2) NULL COMMENT 'Score (0-100)',

    time_spent INT UNSIGNED NULL COMMENT 'Time spent in seconds',
    attempt_number INT UNSIGNED DEFAULT 1 COMMENT 'Attempt number for this problem',

    feedback TEXT NULL COMMENT 'Automated feedback',

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,

    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,

    INDEX idx_problem (problem_id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_session (session_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LTI sessions table: manages Moodle LTI integration sessions
CREATE TABLE IF NOT EXISTS lti_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    consumer_key VARCHAR(255) NOT NULL COMMENT 'LTI consumer key',
    resource_link_id VARCHAR(255) NOT NULL COMMENT 'LTI resource link ID',

    moodle_course_id INT UNSIGNED NULL,
    moodle_user_id INT UNSIGNED NULL,

    user_email VARCHAR(255) NULL,
    user_name VARCHAR(255) NULL,
    user_role ENUM('student', 'teacher', 'admin') DEFAULT 'student',

    session_token VARCHAR(64) NOT NULL COMMENT 'Secure session token',

    launch_data JSON NULL COMMENT 'Full LTI launch parameters',

    outcome_service_url VARCHAR(500) NULL COMMENT 'LTI outcome service URL for grade passback',
    result_sourcedid VARCHAR(255) NULL COMMENT 'LTI result sourcedid',

    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_session (consumer_key, resource_link_id, moodle_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_consumer (consumer_key),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics table: tracks usage and interaction data
CREATE TABLE IF NOT EXISTS analytics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    problem_id INT UNSIGNED NULL,
    user_id INT UNSIGNED NULL,
    session_id VARCHAR(64) NULL,

    event_type VARCHAR(50) NOT NULL COMMENT 'Event type: view, draw, calculate, submit, etc.',
    event_data JSON NULL COMMENT 'Event specific data',

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_event_type (event_type),
    INDEX idx_problem (problem_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table: application configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',

    description VARCHAR(500) NULL,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'Reflection Mode', 'string', 'Application name'),
('app_version', '1.0.0', 'string', 'Application version'),
('lti_enabled', 'true', 'boolean', 'Enable LTI integration'),
('max_points_per_shape', '20', 'integer', 'Maximum points allowed per shape'),
('default_time_limit', '300', 'integer', 'Default time limit in seconds'),
('enable_analytics', 'true', 'boolean', 'Enable analytics tracking'),
('allow_export', 'true', 'boolean', 'Allow students to export images'),
('show_hints', 'true', 'boolean', 'Show hints to students')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample problems for testing
INSERT INTO problems (
    title,
    description,
    shape_type,
    shape_data,
    difficulty,
    tags,
    correct_answer,
    hints,
    is_public
) VALUES
(
    '삼각형의 y=x 대칭',
    '삼각형을 y=x 선을 기준으로 대칭시켰을 때 겹치는 부분의 넓이를 구하세요.',
    'triangle',
    JSON_OBJECT(
        'points', JSON_ARRAY(
            JSON_OBJECT('x', 0, 'y', 4),
            JSON_OBJECT('x', -3, 'y', -2),
            JSON_OBJECT('x', 3, 'y', -2)
        ),
        'settings', JSON_OBJECT(
            'showOriginal', true,
            'showReflected', true,
            'showOverlap', true
        )
    ),
    'easy',
    '기초,삼각형,대칭',
    JSON_OBJECT(
        'area', 18.0,
        'overlap_area', 3.0,
        'overlap_ratio', 16.67
    ),
    JSON_ARRAY(
        'y=x 선을 기준으로 점의 x와 y 좌표가 바뀝니다.',
        '원본 삼각형과 대칭된 삼각형이 겹치는 부분을 찾으세요.',
        '겹치는 부분도 삼각형 모양입니다.'
    ),
    1
),
(
    '정사각형의 대칭',
    '정사각형을 y=x 선으로 대칭시켰을 때의 특성을 관찰하세요.',
    'rectangle',
    JSON_OBJECT(
        'points', JSON_ARRAY(
            JSON_OBJECT('x', -2, 'y', -2),
            JSON_OBJECT('x', 2, 'y', -2),
            JSON_OBJECT('x', 2, 'y', 2),
            JSON_OBJECT('x', -2, 'y', 2)
        ),
        'settings', JSON_OBJECT(
            'showOriginal', true,
            'showReflected', true,
            'showOverlap', true
        )
    ),
    'easy',
    '기초,사각형,대칭',
    JSON_OBJECT(
        'area', 16.0,
        'overlap_area', 16.0,
        'overlap_ratio', 100.0
    ),
    JSON_ARRAY(
        '정사각형이 y=x 선을 기준으로 대칭이면 어떤 특성이 있을까요?',
        '원본과 대칭된 도형이 완전히 겹칠 수 있습니다.'
    ),
    1
),
(
    '복잡한 다각형',
    '다각형의 y=x 대칭과 겹침 비율을 계산하세요.',
    'polygon',
    JSON_OBJECT(
        'points', JSON_ARRAY(
            JSON_OBJECT('x', -2, 'y', -3),
            JSON_OBJECT('x', 2, 'y', -2),
            JSON_OBJECT('x', 3, 'y', 1),
            JSON_OBJECT('x', 0, 'y', 3),
            JSON_OBJECT('x', -3, 'y', 1)
        ),
        'settings', JSON_OBJECT(
            'showOriginal', true,
            'showReflected', true,
            'showOverlap', true
        )
    ),
    'medium',
    '중급,다각형,대칭',
    NULL,
    JSON_ARRAY(
        '각 꼭짓점의 좌표를 y=x 대칭시켜 보세요.',
        '겹치는 영역은 여러 개의 작은 도형으로 나눠질 수 있습니다.'
    ),
    1
);

-- Create indexes for JSON fields (MySQL 5.7.8+)
-- Note: Virtual generated columns for JSON fields can improve query performance
ALTER TABLE problems
    ADD COLUMN shape_type_gen VARCHAR(20) AS (JSON_UNQUOTE(JSON_EXTRACT(shape_data, '$.type'))) VIRTUAL,
    ADD INDEX idx_shape_type_gen (shape_type_gen);

-- Create view for problem statistics
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id,
    p.title,
    p.difficulty,
    COUNT(DISTINCT a.moodle_user_id) as unique_students,
    COUNT(a.id) as total_attempts,
    AVG(a.score) as average_score,
    AVG(a.time_spent) as average_time,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    (SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(a.id) * 100) as success_rate
FROM problems p
LEFT JOIN attempts a ON p.id = a.problem_id
WHERE p.is_active = 1
GROUP BY p.id, p.title, p.difficulty;

-- Create view for student progress
CREATE OR REPLACE VIEW student_progress AS
SELECT
    a.moodle_user_id,
    COUNT(DISTINCT a.problem_id) as problems_attempted,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as problems_solved,
    AVG(a.score) as average_score,
    SUM(a.time_spent) as total_time_spent,
    MAX(a.submitted_at) as last_activity
FROM attempts a
GROUP BY a.moodle_user_id;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON reflection_mode.* TO 'moodle_user'@'localhost';
