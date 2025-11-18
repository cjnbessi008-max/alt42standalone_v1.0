-- Stat Digest Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Problems table: stores problem data from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_quiz_id INT DEFAULT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty_level TINYINT DEFAULT 1,
    category VARCHAR(100) DEFAULT NULL,
    points DECIMAL(5,2) DEFAULT 1.00,
    time_limit INT DEFAULT NULL COMMENT 'Time limit in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_qid (moodle_question_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student attempts table: stores student interaction data
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    answer TEXT,
    is_correct TINYINT(1) DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT DEFAULT NULL COMMENT 'Time spent in seconds',
    attempt_number TINYINT DEFAULT 1,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stat digest table: stores pre-computed statistics
CREATE TABLE IF NOT EXISTS stat_digests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    total_students INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    incorrect_attempts INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_time_spent DECIMAL(8,2) DEFAULT 0.00,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    difficulty_index DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Calculated difficulty 0-100',
    last_computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_problem (problem_id),
    INDEX idx_accuracy (accuracy_rate),
    INDEX idx_difficulty (difficulty_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Real-time stat summary view for smartphone display
CREATE TABLE IF NOT EXISTS digest_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    summary_type VARCHAR(50) NOT NULL COMMENT 'e.g., daily, weekly, quiz-specific',
    total_problems INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.00,
    average_difficulty DECIMAL(5,2) DEFAULT 0.00,
    most_difficult_topic VARCHAR(100) DEFAULT NULL,
    improvement_trend VARCHAR(20) DEFAULT NULL COMMENT 'improving, stable, declining',
    data_json JSON DEFAULT NULL COMMENT 'Detailed breakdown data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configuration table for Moodle sync settings
CREATE TABLE IF NOT EXISTS sync_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default configuration
INSERT INTO sync_config (config_key, config_value, description) VALUES
('moodle_base_url', 'http://localhost/moodle', 'Moodle installation base URL'),
('moodle_api_token', '', 'Moodle web service token'),
('sync_interval', '300', 'Sync interval in seconds (default 5 minutes)'),
('last_sync_timestamp', '0', 'Last successful sync timestamp')
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);
