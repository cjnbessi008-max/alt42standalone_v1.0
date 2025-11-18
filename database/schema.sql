-- DMN Drift Quantification System Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_moodle_user (moodle_user_id),
    UNIQUE KEY idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning sessions tracking
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    total_duration_seconds INT UNSIGNED DEFAULT 0,
    activity_count INT UNSIGNED DEFAULT 0,
    dmn_drift_score DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_session (student_id, session_start),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interaction events (for DMN drift analysis)
CREATE TABLE IF NOT EXISTS interaction_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    event_type ENUM('click', 'keypress', 'scroll', 'focus_loss', 'focus_gain', 'answer_submit', 'idle_start', 'idle_end', 'mouse_move') NOT NULL,
    event_data JSON,
    response_time_ms INT UNSIGNED,
    timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_session_events (session_id, timestamp),
    INDEX idx_event_type (event_type),
    INDEX idx_student_time (student_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem attempts (for accuracy tracking)
CREATE TABLE IF NOT EXISTS problem_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    difficulty_level TINYINT UNSIGNED DEFAULT 1,
    attempt_number TINYINT UNSIGNED DEFAULT 1,
    is_correct BOOLEAN NOT NULL,
    response_time_seconds DECIMAL(10,2),
    hint_used BOOLEAN DEFAULT FALSE,
    skip_count TINYINT UNSIGNED DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_session_attempts (session_id, attempted_at),
    INDEX idx_student_problems (student_id, problem_id),
    INDEX idx_correctness (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DMN drift metrics (calculated periodically)
CREATE TABLE IF NOT EXISTS dmn_drift_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    time_window_start TIMESTAMP NOT NULL,
    time_window_end TIMESTAMP NOT NULL,

    -- Core DMN Drift Indicators
    avg_response_time_ms DECIMAL(10,2),
    response_time_variance DECIMAL(10,2),
    response_time_trend DECIMAL(5,2), -- negative = getting slower

    accuracy_rate DECIMAL(5,2), -- percentage
    accuracy_trend DECIMAL(5,2), -- negative = getting worse

    click_frequency DECIMAL(8,2), -- clicks per minute
    click_pattern_irregularity DECIMAL(5,2), -- 0-100 score

    idle_time_seconds INT UNSIGNED DEFAULT 0,
    idle_event_count INT UNSIGNED DEFAULT 0,

    focus_loss_count INT UNSIGNED DEFAULT 0,
    tab_switch_count INT UNSIGNED DEFAULT 0,

    scroll_activity_score DECIMAL(5,2),

    -- Composite DMN Drift Score (0-100, higher = more drift)
    dmn_drift_score DECIMAL(5,2) NOT NULL,
    drift_level ENUM('low', 'moderate', 'high', 'critical') NOT NULL,

    -- Recommendations
    intervention_needed BOOLEAN DEFAULT FALSE,
    recommended_action TEXT,

    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_session_metrics (session_id, time_window_start),
    INDEX idx_student_drift (student_id, dmn_drift_score),
    INDEX idx_drift_level (drift_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher feedback and interventions
CREATE TABLE IF NOT EXISTS teacher_interventions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED,
    metric_id BIGINT UNSIGNED,
    teacher_id INT UNSIGNED,
    intervention_type ENUM('message', 'break_reminder', 'difficulty_adjustment', 'encouragement', 'custom') NOT NULL,
    intervention_text TEXT,
    was_automated BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_response TEXT,
    effectiveness_rating TINYINT UNSIGNED, -- 1-5 scale
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (metric_id) REFERENCES dmn_drift_metrics(id) ON DELETE SET NULL,
    INDEX idx_student_interventions (student_id, delivered_at),
    INDEX idx_session_interventions (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle LTI integration tracking
CREATE TABLE IF NOT EXISTS moodle_lti_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED,
    lti_consumer_key VARCHAR(255) NOT NULL,
    lti_context_id VARCHAR(255),
    lti_resource_link_id VARCHAR(255),
    lti_user_id VARCHAR(255),
    launch_data JSON,
    grade_sync_enabled BOOLEAN DEFAULT TRUE,
    last_grade_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL,
    INDEX idx_lti_consumer (lti_consumer_key),
    INDEX idx_lti_user (lti_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('dmn_drift_threshold_moderate', '40', 'float', 'DMN drift score threshold for moderate level (0-100)'),
('dmn_drift_threshold_high', '60', 'float', 'DMN drift score threshold for high level (0-100)'),
('dmn_drift_threshold_critical', '80', 'float', 'DMN drift score threshold for critical level (0-100)'),
('idle_time_threshold_seconds', '5', 'integer', 'Seconds of inactivity before marking as idle'),
('response_time_window_minutes', '5', 'integer', 'Time window for calculating DMN metrics'),
('auto_intervention_enabled', 'true', 'boolean', 'Enable automatic interventions when drift is high'),
('moodle_integration_enabled', 'true', 'boolean', 'Enable Moodle LTI integration'),
('moodle_grade_sync_enabled', 'true', 'boolean', 'Sync progress back to Moodle gradebook')
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);
