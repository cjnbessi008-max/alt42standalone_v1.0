-- Trap Detection LMS Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS trap_detection_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trap_detection_lms;

-- Table: users (synced from Moodle or standalone)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT DEFAULT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_user_id),
    UNIQUE KEY unique_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: questions (imported from Moodle quizzes)
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT DEFAULT NULL,
    quiz_id INT DEFAULT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multichoice', 'truefalse', 'numerical', 'shortanswer') DEFAULT 'multichoice',
    difficulty_level TINYINT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    subject VARCHAR(100) DEFAULT 'mathematics',
    topic VARCHAR(255) DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_question (moodle_question_id),
    INDEX idx_quiz (quiz_id),
    INDEX idx_topic (topic),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_options (answer choices for multiple choice)
CREATE TABLE IF NOT EXISTS question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question (question_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: traps (identified misconceptions/distractors)
CREATE TABLE IF NOT EXISTS traps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_id INT DEFAULT NULL,
    trap_type ENUM('conceptual', 'procedural', 'arithmetic', 'reading', 'careless') DEFAULT 'conceptual',
    trap_description TEXT NOT NULL,
    explanation TEXT NOT NULL,
    hint TEXT DEFAULT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    detection_count INT DEFAULT 0,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question (question_id),
    INDEX idx_option (option_id),
    INDEX idx_trap_type (trap_type),
    INDEX idx_severity (severity),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES question_options(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_attempts (track student answers)
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT DEFAULT NULL,
    answer_text TEXT DEFAULT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0,
    attempt_number TINYINT DEFAULT 1,
    session_id VARCHAR(100) DEFAULT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_id),
    INDEX idx_question (question_id),
    INDEX idx_session (session_id),
    INDEX idx_attempted_at (attempted_at),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: trap_incidents (when students fall into traps)
CREATE TABLE IF NOT EXISTS trap_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trap_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_id INT NOT NULL,
    was_resolved BOOLEAN DEFAULT FALSE,
    help_requested BOOLEAN DEFAULT FALSE,
    resolution_time_seconds INT DEFAULT NULL,
    feedback_rating TINYINT DEFAULT NULL CHECK (feedback_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_trap (trap_id),
    INDEX idx_student (student_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (trap_id) REFERENCES traps(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: trap_patterns (detected patterns across multiple students)
CREATE TABLE IF NOT EXISTS trap_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trap_id INT NOT NULL,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT DEFAULT NULL,
    student_count INT DEFAULT 0,
    occurrence_rate DECIMAL(5,2) DEFAULT 0.00,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    first_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trap (trap_id),
    INDEX idx_occurrence_rate (occurrence_rate),
    FOREIGN KEY (trap_id) REFERENCES traps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: interventions (suggested or applied interventions)
CREATE TABLE IF NOT EXISTS interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trap_id INT NOT NULL,
    intervention_type ENUM('hint', 'explanation', 'example', 'practice', 'video') DEFAULT 'hint',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    resource_url VARCHAR(500) DEFAULT NULL,
    effectiveness_score DECIMAL(5,2) DEFAULT 0.00,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_trap (trap_id),
    INDEX idx_type (intervention_type),
    INDEX idx_effectiveness (effectiveness_score),
    FOREIGN KEY (trap_id) REFERENCES traps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lti_sessions (Moodle LTI integration)
CREATE TABLE IF NOT EXISTS lti_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL,
    moodle_user_id INT NOT NULL,
    context_id VARCHAR(255) DEFAULT NULL,
    resource_link_id VARCHAR(255) DEFAULT NULL,
    consumer_key VARCHAR(255) NOT NULL,
    user_id INT DEFAULT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_session_token (session_token),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: analytics_events (tracking for analytics)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INT DEFAULT NULL,
    question_id INT DEFAULT NULL,
    trap_id INT DEFAULT NULL,
    event_data JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL,
    FOREIGN KEY (trap_id) REFERENCES traps(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT INTO users (username, email, full_name, role) VALUES
('admin', 'admin@example.com', 'System Administrator', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Sample data for testing (optional)
-- INSERT INTO questions (question_text, question_type, difficulty_level, subject, topic) VALUES
-- ('2/3 + 1/3 = ?', 'multichoice', 1, 'mathematics', 'fractions');
