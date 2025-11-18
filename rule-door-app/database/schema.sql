-- Rule Door Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Create database
CREATE DATABASE IF NOT EXISTS rule_door_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rule_door_db;

-- Rules table: stores rule definitions for duplicate handling
CREATE TABLE IF NOT EXISTS rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('duplicate_allowed', 'duplicate_not_allowed') NOT NULL DEFAULT 'duplicate_not_allowed',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_quiz (moodle_quiz_id),
    INDEX idx_course (moodle_course_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Door states table: tracks current door status (open/closed)
CREATE TABLE IF NOT EXISTS door_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id INT NOT NULL,
    student_id INT,
    door_status ENUM('open', 'closed') NOT NULL,
    reason TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    INDEX idx_rule (rule_id),
    INDEX idx_student (student_id),
    INDEX idx_status (door_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem attempts table: tracks student attempts and duplicate detection
CREATE TABLE IF NOT EXISTS problem_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id INT NOT NULL,
    student_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    answer_data JSON,
    is_duplicate TINYINT(1) DEFAULT 0,
    is_correct TINYINT(1),
    time_spent_seconds INT,
    attempt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    INDEX idx_student_question (student_id, moodle_question_id),
    INDEX idx_rule (rule_id),
    INDEX idx_duplicate (is_duplicate),
    INDEX idx_timestamp (attempt_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table: audit trail for rule door interactions
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_id INT,
    student_id INT,
    action_type ENUM('door_opened', 'door_closed', 'duplicate_detected', 'rule_created', 'rule_updated') NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL,
    INDEX idx_rule (rule_id),
    INDEX idx_student (student_id),
    INDEX idx_action (action_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table: manages active user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_key VARCHAR(64) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    moodle_session_id VARCHAR(128),
    current_rule_id INT,
    session_data JSON,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_rule_id) REFERENCES rules(id) ON DELETE SET NULL,
    INDEX idx_session_key (session_key),
    INDEX idx_student (student_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO rules (moodle_quiz_id, moodle_course_id, rule_name, rule_type, description) VALUES
(1, 101, 'Math Quiz - No Duplicates', 'duplicate_not_allowed', 'Students cannot submit duplicate answers'),
(2, 101, 'Practice Mode - Duplicates OK', 'duplicate_allowed', 'Students can retry with same answers in practice mode'),
(3, 102, 'Final Exam - Strict Mode', 'duplicate_not_allowed', 'No duplicate attempts allowed in final exam');

-- Create views for common queries
CREATE OR REPLACE VIEW v_active_door_states AS
SELECT
    ds.id,
    ds.rule_id,
    r.rule_name,
    r.rule_type,
    ds.student_id,
    ds.door_status,
    ds.reason,
    ds.updated_at
FROM door_states ds
INNER JOIN rules r ON ds.rule_id = r.id
WHERE r.is_active = 1
ORDER BY ds.updated_at DESC;

CREATE OR REPLACE VIEW v_student_attempt_summary AS
SELECT
    pa.student_id,
    pa.rule_id,
    r.rule_name,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN pa.is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_attempts,
    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    AVG(pa.time_spent_seconds) as avg_time_spent
FROM problem_attempts pa
INNER JOIN rules r ON pa.rule_id = r.id
GROUP BY pa.student_id, pa.rule_id, r.rule_name;
