-- Cognitive Recovery Detection System Database Schema
-- MySQL 5.7 Compatible

-- Users table (synced from Moodle)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity sessions table
CREATE TABLE IF NOT EXISTS activity_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    course_id INT,
    module_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_duration INT DEFAULT 0 COMMENT 'Total session duration in seconds',
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, is_active),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity events table (detailed tracking)
CREATE TABLE IF NOT EXISTS activity_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    event_type ENUM('mouse_move', 'click', 'keypress', 'scroll', 'focus', 'blur', 'page_visible', 'page_hidden') NOT NULL,
    event_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    metadata JSON COMMENT 'Additional event data (coordinates, key, element, etc.)',
    FOREIGN KEY (session_id) REFERENCES activity_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_events (session_id, event_timestamp),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cognitive recovery periods table
CREATE TABLE IF NOT EXISTS cognitive_recovery_periods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    started_at TIMESTAMP(3) NOT NULL,
    ended_at TIMESTAMP(3) NULL,
    duration INT COMMENT 'Duration in seconds',
    recovery_type ENUM('micro_break', 'cognitive_recovery', 'extended_pause', 'potential_dropout') NOT NULL,
    pre_activity_intensity FLOAT COMMENT 'Activity intensity before pause (events per minute)',
    post_activity_intensity FLOAT COMMENT 'Activity intensity after pause (events per minute)',
    context_data JSON COMMENT 'What user was doing before/after',
    is_beneficial BOOLEAN DEFAULT NULL COMMENT 'ML-determined if recovery was beneficial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES activity_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_recovery (session_id, started_at),
    INDEX idx_recovery_type (recovery_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity intensity metrics (aggregated per minute)
CREATE TABLE IF NOT EXISTS activity_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    minute_timestamp TIMESTAMP NOT NULL,
    mouse_events INT DEFAULT 0,
    click_events INT DEFAULT 0,
    keypress_events INT DEFAULT 0,
    scroll_events INT DEFAULT 0,
    focus_changes INT DEFAULT 0,
    total_events INT DEFAULT 0,
    intensity_score FLOAT COMMENT 'Calculated activity intensity (0-100)',
    FOREIGN KEY (session_id) REFERENCES activity_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_minute (session_id, minute_timestamp),
    INDEX idx_session_metrics (session_id, minute_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Learning performance correlation
CREATE TABLE IF NOT EXISTS performance_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    recovery_period_id BIGINT,
    task_type VARCHAR(100) COMMENT 'Type of learning task',
    task_completed BOOLEAN DEFAULT FALSE,
    completion_time INT COMMENT 'Time to complete in seconds',
    accuracy_score FLOAT COMMENT 'Performance score (0-100)',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES activity_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (recovery_period_id) REFERENCES cognitive_recovery_periods(id) ON DELETE SET NULL,
    INDEX idx_session_performance (session_id),
    INDEX idx_recovery_performance (recovery_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User cognitive patterns (ML insights)
CREATE TABLE IF NOT EXISTS user_cognitive_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    optimal_session_length INT COMMENT 'Optimal learning session in minutes',
    average_recovery_frequency FLOAT COMMENT 'Average recovery periods per hour',
    preferred_recovery_duration INT COMMENT 'Average beneficial recovery duration in seconds',
    peak_productivity_time VARCHAR(50) COMMENT 'Time of day when most productive',
    pattern_data JSON COMMENT 'Detailed pattern analysis',
    confidence_score FLOAT COMMENT 'ML model confidence (0-1)',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_pattern (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System analytics (aggregated statistics)
CREATE TABLE IF NOT EXISTS daily_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analytics_date DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_users INT DEFAULT 0,
    total_recovery_periods INT DEFAULT 0,
    avg_session_duration FLOAT COMMENT 'Average in minutes',
    avg_recovery_duration FLOAT COMMENT 'Average in seconds',
    total_learning_time INT COMMENT 'Total minutes of active learning',
    analytics_data JSON COMMENT 'Detailed daily metrics',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (analytics_date),
    INDEX idx_date (analytics_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configuration table
CREATE TABLE IF NOT EXISTS system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('cognitive_recovery_min_duration', '10', 'Minimum seconds for cognitive recovery detection'),
('cognitive_recovery_max_duration', '60', 'Maximum seconds for cognitive recovery (above is dropout)'),
('micro_break_max_duration', '10', 'Maximum seconds for micro break'),
('extended_pause_min_duration', '60', 'Minimum seconds for extended pause'),
('dropout_threshold', '300', 'Seconds of inactivity to consider dropout (5 minutes)'),
('activity_tracking_interval', '1000', 'Milliseconds between activity checks'),
('intensity_calculation_window', '60', 'Seconds window for intensity calculation'),
('moodle_api_url', '', 'Moodle REST API endpoint URL'),
('moodle_api_token', '', 'Moodle REST API authentication token');
