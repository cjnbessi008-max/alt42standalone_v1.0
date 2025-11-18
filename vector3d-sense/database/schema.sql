-- Vector 3D Sense Database Schema
-- Compatible with MySQL 5.7
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS vector3d_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vector3d_sense;

-- Table: vector_problems
-- Stores vector mathematics problems from Moodle LMS
CREATE TABLE IF NOT EXISTS vector_problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT UNSIGNED NOT NULL,
    moodle_course_id INT UNSIGNED NOT NULL,
    problem_type ENUM('addition', 'subtraction', 'dot_product', 'cross_product', 'magnitude', 'visualization') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level TINYINT UNSIGNED CHECK (difficulty_level BETWEEN 1 AND 5),

    -- Vector data stored as JSON for flexibility
    vectors_data JSON NOT NULL COMMENT 'Array of vectors with x,y,z components',

    -- Expected answer
    expected_answer JSON COMMENT 'Expected result vector or scalar',

    -- Visualization settings
    show_grid BOOLEAN DEFAULT TRUE,
    show_axes BOOLEAN DEFAULT TRUE,
    show_labels BOOLEAN DEFAULT TRUE,
    camera_position JSON COMMENT 'Default camera position {x,y,z}',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_attempts
-- Tracks student interactions and answers
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    moodle_user_id INT UNSIGNED NOT NULL,
    student_name VARCHAR(255),

    -- Attempt data
    attempt_number TINYINT UNSIGNED DEFAULT 1,
    student_answer JSON COMMENT 'Student submitted answer',
    is_correct BOOLEAN,
    score DECIMAL(5,2) COMMENT 'Percentage score 0-100',

    -- Interaction tracking
    time_spent_seconds INT UNSIGNED,
    interaction_count INT UNSIGNED DEFAULT 0 COMMENT 'Number of 3D interactions',
    camera_movements INT UNSIGNED DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,

    FOREIGN KEY (problem_id) REFERENCES vector_problems(id) ON DELETE CASCADE,
    INDEX idx_student (moodle_user_id),
    INDEX idx_problem_student (problem_id, moodle_user_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: visualization_sessions
-- Tracks real-time 3D visualization sessions
CREATE TABLE IF NOT EXISTS visualization_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    moodle_user_id INT UNSIGNED NOT NULL,
    session_token VARCHAR(64) UNIQUE NOT NULL,

    -- Session state
    current_state JSON COMMENT 'Current 3D scene state',
    last_camera_position JSON,

    -- Session metadata
    device_type ENUM('desktop', 'tablet', 'mobile', 'virtual_phone') DEFAULT 'virtual_phone',
    browser_info VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES vector_problems(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_session (moodle_user_id, created_at),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: vector_templates
-- Predefined vector problem templates for teachers
CREATE TABLE IF NOT EXISTS vector_templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type ENUM('addition', 'subtraction', 'dot_product', 'cross_product', 'magnitude', 'visualization') NOT NULL,
    description TEXT,

    -- Template configuration
    default_vectors JSON NOT NULL,
    default_settings JSON,

    -- Metadata
    created_by INT UNSIGNED COMMENT 'Moodle teacher user ID',
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_template_type (template_type),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: analytics_events
-- Detailed learning analytics and interaction tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED,
    problem_id INT UNSIGNED NOT NULL,
    moodle_user_id INT UNSIGNED NOT NULL,

    -- Event data
    event_type ENUM('view', 'rotate', 'zoom', 'pan', 'vector_select', 'answer_submit', 'hint_request') NOT NULL,
    event_data JSON,

    -- Context
    camera_position JSON,
    timestamp_ms BIGINT UNSIGNED NOT NULL COMMENT 'Unix timestamp in milliseconds',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES visualization_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES vector_problems(id) ON DELETE CASCADE,
    INDEX idx_event_type (event_type),
    INDEX idx_user_events (moodle_user_id, created_at),
    INDEX idx_session_events (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample vector problem template
INSERT INTO vector_templates (template_name, template_type, description, default_vectors, default_settings) VALUES
(
    'Basic Vector Addition',
    'addition',
    '두 개의 3D 벡터 덧셈 시각화',
    JSON_OBJECT(
        'vectors', JSON_ARRAY(
            JSON_OBJECT('name', 'A', 'x', 3, 'y', 2, 'z', 1, 'color', '#FF6B6B'),
            JSON_OBJECT('name', 'B', 'x', 1, 'y', 3, 'z', 2, 'color', '#4ECDC4')
        )
    ),
    JSON_OBJECT(
        'showGrid', true,
        'showAxes', true,
        'showLabels', true,
        'gridSize', 10,
        'cameraPosition', JSON_OBJECT('x', 10, 'y', 10, 'z', 10)
    )
);

-- Insert sample problem
INSERT INTO vector_problems (
    moodle_question_id,
    moodle_course_id,
    problem_type,
    title,
    description,
    difficulty_level,
    vectors_data,
    expected_answer,
    camera_position
) VALUES (
    1001,
    1,
    'addition',
    '3D 벡터 덧셈',
    '두 벡터 A(3, 2, 1)와 B(1, 3, 2)의 합을 구하세요.',
    2,
    JSON_OBJECT(
        'vectors', JSON_ARRAY(
            JSON_OBJECT('name', 'A', 'x', 3, 'y', 2, 'z', 1, 'color', '#FF6B6B'),
            JSON_OBJECT('name', 'B', 'x', 1, 'y', 3, 'z', 2, 'color', '#4ECDC4')
        )
    ),
    JSON_OBJECT('x', 4, 'y', 5, 'z', 3),
    JSON_OBJECT('x', 12, 'y', 12, 'z', 12)
);
