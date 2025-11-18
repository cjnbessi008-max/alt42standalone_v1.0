-- Cognitive Recovery Tracking System for Moodle Integration
-- MySQL 5.7 Compatible Schema
-- Created: 2025-11-18

-- Users table (synced from Moodle)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP NULL,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses table (synced from Moodle)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course_id (moodle_course_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    INDEX idx_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cognitive assessment types
CREATE TABLE IF NOT EXISTS assessment_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    configuration JSON,
    -- Example configurations:
    -- {"duration": 300, "question_count": 20, "difficulty": "medium"}
    -- {"test_type": "reaction_time", "trials": 10}
    -- {"test_type": "memory_span", "max_items": 9}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rest sessions
CREATE TABLE IF NOT EXISTS rest_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    session_type ENUM('scheduled', 'manual', 'automatic') DEFAULT 'manual',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    planned_duration INT, -- in seconds
    actual_duration INT, -- in seconds
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cognitive assessments
CREATE TABLE IF NOT EXISTS cognitive_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    rest_session_id INT,
    assessment_type_id INT NOT NULL,
    assessment_timing ENUM('baseline', 'pre_rest', 'post_rest', 'control') NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    duration INT, -- in seconds
    status ENUM('created', 'in_progress', 'completed', 'abandoned') DEFAULT 'created',
    raw_score DECIMAL(10,2),
    normalized_score DECIMAL(5,2), -- 0-100 scale
    accuracy_rate DECIMAL(5,2), -- percentage
    reaction_time_avg INT, -- in milliseconds
    reaction_time_median INT, -- in milliseconds
    questions_attempted INT,
    questions_correct INT,
    response_data JSON,
    -- Example: {"responses": [{"question_id": 1, "answer": "A", "correct": true, "time_ms": 1234}]}
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (rest_session_id) REFERENCES rest_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_rest_session (rest_session_id),
    INDEX idx_timing (assessment_timing),
    INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recovery metrics
CREATE TABLE IF NOT EXISTS recovery_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rest_session_id INT NOT NULL,
    user_id INT NOT NULL,
    pre_assessment_id INT,
    post_assessment_id INT,

    -- Score-based metrics
    score_recovery_rate DECIMAL(5,2), -- percentage improvement
    score_change DECIMAL(10,2),

    -- Accuracy metrics
    accuracy_recovery_rate DECIMAL(5,2),
    accuracy_change DECIMAL(5,2),

    -- Reaction time metrics
    reaction_time_improvement INT, -- in milliseconds (negative = faster)
    reaction_time_recovery_rate DECIMAL(5,2),

    -- Overall recovery assessment
    overall_recovery_score DECIMAL(5,2), -- composite score 0-100
    recovery_category ENUM('excellent', 'good', 'moderate', 'poor', 'declined') NULL,

    -- Rest effectiveness
    rest_duration INT, -- in seconds
    rest_effectiveness_score DECIMAL(5,2),

    -- Additional metrics
    consistency_score DECIMAL(5,2), -- how consistent responses were
    fatigue_indicator DECIMAL(5,2), -- derived from performance over time

    calculation_metadata JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rest_session_id) REFERENCES rest_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pre_assessment_id) REFERENCES cognitive_assessments(id) ON DELETE SET NULL,
    FOREIGN KEY (post_assessment_id) REFERENCES cognitive_assessments(id) ON DELETE SET NULL,
    INDEX idx_rest_session (rest_session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_recovery_category (recovery_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assessment questions bank
CREATE TABLE IF NOT EXISTS assessment_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_type_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'numeric', 'reaction_time', 'memory') NOT NULL,
    options JSON, -- For multiple choice: ["option1", "option2", ...]
    correct_answer VARCHAR(255),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    cognitive_domain VARCHAR(100), -- e.g., 'memory', 'attention', 'processing_speed'
    time_limit INT, -- in seconds
    points DECIMAL(5,2) DEFAULT 1.00,
    metadata JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id) ON DELETE CASCADE,
    INDEX idx_assessment_type (assessment_type_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_cognitive_domain (cognitive_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User responses to individual questions
CREATE TABLE IF NOT EXISTS assessment_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    reaction_time INT, -- in milliseconds
    response_timestamp TIMESTAMP NOT NULL,
    metadata JSON,
    FOREIGN KEY (assessment_id) REFERENCES cognitive_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle sync log
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('users', 'courses', 'enrollments', 'grades', 'full') NOT NULL,
    status ENUM('started', 'completed', 'failed') DEFAULT 'started',
    records_synced INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    metadata JSON,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default assessment types
INSERT INTO assessment_types (type_name, type_code, description, configuration) VALUES
('기본 인지 평가', 'basic_cognitive', '일반적인 인지 능력 측정 평가', '{"duration": 600, "question_count": 20, "difficulty": "medium"}'),
('반응 속도 테스트', 'reaction_time', '시각 자극에 대한 반응 속도 측정', '{"trials": 10, "stimulus_type": "visual"}'),
('작업 기억 평가', 'working_memory', '작업 기억 용량 측정 (N-back test)', '{"n_level": 2, "trials": 20}'),
('주의력 테스트', 'attention', '지속적 주의력 및 선택적 주의력 측정', '{"duration": 300, "distractors": true}');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('moodle_url', '', 'string', 'Moodle installation URL'),
('moodle_token', '', 'string', 'Moodle web service token'),
('sync_interval', '3600', 'integer', 'Sync interval in seconds'),
('auto_sync_enabled', 'false', 'boolean', 'Enable automatic synchronization'),
('default_rest_duration', '900', 'integer', 'Default rest duration in seconds (15 minutes)'),
('recovery_threshold_excellent', '20', 'integer', 'Threshold for excellent recovery (% improvement)'),
('recovery_threshold_good', '10', 'integer', 'Threshold for good recovery (% improvement)'),
('recovery_threshold_moderate', '0', 'integer', 'Threshold for moderate recovery (% improvement)');
