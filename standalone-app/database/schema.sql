-- Standalone Reflection Mode Database Schema
-- MySQL 5.7+ compatible

CREATE DATABASE IF NOT EXISTS reflection_mode_standalone
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE reflection_mode_standalone;

-- Users table: authentication and profiles
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed',
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',

    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,

    is_active TINYINT(1) DEFAULT 1,
    email_verified TINYINT(1) DEFAULT 0,

    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_by INT UNSIGNED NOT NULL COMMENT 'User ID of creator',

    title VARCHAR(255) NOT NULL,
    description TEXT NULL,

    shape_type ENUM('polygon', 'circle', 'rectangle', 'triangle', 'custom') DEFAULT 'polygon',
    shape_data JSON NOT NULL COMMENT 'Shape coordinates and config',

    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    tags VARCHAR(500) NULL COMMENT 'Comma-separated tags',

    correct_answer JSON NULL COMMENT 'Expected answer',
    hints JSON NULL COMMENT 'Array of hints',

    time_limit INT UNSIGNED NULL COMMENT 'Time limit in seconds',
    max_attempts INT UNSIGNED NULL COMMENT 'Max attempts allowed',

    is_active TINYINT(1) DEFAULT 1,
    is_public TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_created_by (created_by),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,

    student_answer JSON NULL,
    student_shape_data JSON NULL,

    calculated_area DECIMAL(10, 4) NULL,
    calculated_overlap DECIMAL(10, 4) NULL,
    overlap_ratio DECIMAL(5, 2) NULL,

    is_correct TINYINT(1) NULL,
    score DECIMAL(5, 2) NULL COMMENT 'Score 0-100',

    time_spent INT UNSIGNED NULL COMMENT 'Time in seconds',
    attempt_number INT UNSIGNED DEFAULT 1,

    feedback TEXT NULL,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,

    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics/Events table
CREATE TABLE IF NOT EXISTS analytics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NULL,
    problem_id INT UNSIGNED NULL,

    event_type VARCHAR(50) NOT NULL COMMENT 'page_view, problem_start, problem_submit, etc.',
    event_data JSON NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_event_type (event_type),
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
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
('app_version', '2.0.0', 'string', 'Application version'),
('allow_registration', 'true', 'boolean', 'Allow new user registration'),
('max_points_per_shape', '20', 'integer', 'Maximum points per shape'),
('default_time_limit', '300', 'integer', 'Default time limit in seconds'),
('enable_leaderboard', 'true', 'boolean', 'Enable public leaderboard'),
('enable_hints', 'true', 'boolean', 'Show hints to students')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (email, password, name, role, email_verified) VALUES
('admin@reflection.local', '$2a$10$xQx0ZYVQYZYZYZYZYZYZYuE8K6K6K6K6K6K6K6K6K6K6K6K6K6', 'Administrator', 'admin', 1),
('teacher@reflection.local', '$2a$10$xQx0ZYVQYZYZYZYZYZYZYuE8K6K6K6K6K6K6K6K6K6K6K6K6K6', 'Teacher Demo', 'teacher', 1),
('student@reflection.local', '$2a$10$xQx0ZYVQYZYZYZYZYZYZYuE8K6K6K6K6K6K6K6K6K6K6K6K6K6', 'Student Demo', 'student', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Sample problems
INSERT INTO problems (
    created_by, title, description, shape_type, shape_data, difficulty, tags, correct_answer, hints, is_public
) VALUES
(
    1,
    '삼각형의 y=x 대칭',
    '삼각형을 y=x 선을 기준으로 대칭시켰을 때 겹치는 부분의 넓이를 구하세요.',
    'triangle',
    '{"points": [{"x": 0, "y": 4}, {"x": -3, "y": -2}, {"x": 3, "y": -2}]}',
    'easy',
    '기초,삼각형,대칭',
    '{"area": 18.0, "overlap_area": 3.0, "overlap_ratio": 16.67}',
    '["y=x 선을 기준으로 점의 x와 y 좌표가 바뀝니다.", "원본 삼각형과 대칭된 삼각형이 겹치는 부분을 찾으세요."]',
    1
),
(
    1,
    '정사각형의 완전 대칭',
    '정사각형을 y=x 선으로 대칭시키면 완전히 겹칠까요?',
    'rectangle',
    '{"points": [{"x": -2, "y": -2}, {"x": 2, "y": -2}, {"x": 2, "y": 2}, {"x": -2, "y": 2}]}',
    'easy',
    '기초,사각형,대칭',
    '{"area": 16.0, "overlap_area": 16.0, "overlap_ratio": 100.0}',
    '["정사각형이 y=x 선을 기준으로 대칭이면 어떤 특성이 있을까요?"]',
    1
),
(
    1,
    '복잡한 다각형',
    '5개의 꼭짓점을 가진 다각형의 대칭을 분석하세요.',
    'polygon',
    '{"points": [{"x": -2, "y": -3}, {"x": 2, "y": -2}, {"x": 3, "y": 1}, {"x": 0, "y": 3}, {"x": -3, "y": 1}]}',
    'medium',
    '중급,다각형,대칭',
    NULL,
    '["각 꼭짓점의 좌표를 y=x 대칭시켜 보세요.", "겹치는 영역은 여러 부분으로 나눠질 수 있습니다."]',
    1
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Views for statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id as user_id,
    u.name,
    u.role,
    COUNT(DISTINCT a.problem_id) as problems_attempted,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as problems_solved,
    AVG(a.score) as average_score,
    SUM(a.time_spent) as total_time_spent,
    MAX(a.submitted_at) as last_activity
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY u.id, u.name, u.role;

CREATE OR REPLACE VIEW problem_stats AS
SELECT
    p.id as problem_id,
    p.title,
    p.difficulty,
    p.created_by,
    COUNT(DISTINCT a.user_id) as unique_students,
    COUNT(a.id) as total_attempts,
    AVG(a.score) as average_score,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    (SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100) as success_rate
FROM problems p
LEFT JOIN attempts a ON p.id = a.problem_id
WHERE p.is_active = 1
GROUP BY p.id, p.title, p.difficulty, p.created_by;
