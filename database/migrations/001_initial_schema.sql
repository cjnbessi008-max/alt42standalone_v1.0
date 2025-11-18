-- Moodle Self-Grading Math System Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Drop tables if exist (for clean installation)
DROP TABLE IF EXISTS lti_sessions;
DROP TABLE IF EXISTS student_submissions;
DROP TABLE IF EXISTS problem_verifications;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS lti_consumers;

-- LTI Consumer Configuration
CREATE TABLE lti_consumers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consumer_key VARCHAR(255) NOT NULL UNIQUE,
    consumer_secret VARCHAR(255) NOT NULL,
    consumer_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consumer_key (consumer_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table (synced from Moodle via LTI)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lti_user_id VARCHAR(255) NOT NULL,
    consumer_id INT NOT NULL,
    username VARCHAR(100),
    full_name VARCHAR(255),
    email VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_lti_user (lti_user_id, consumer_id),
    FOREIGN KEY (consumer_id) REFERENCES lti_consumers(id) ON DELETE CASCADE,
    INDEX idx_lti_user_id (lti_user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Math Problems Table
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    problem_type ENUM('arithmetic', 'algebra', 'geometry', 'word_problem', 'other') DEFAULT 'arithmetic',
    difficulty_level TINYINT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    points DECIMAL(5,2) DEFAULT 10.00,
    hints TEXT,
    grading_rubric JSON,
    requires_work_shown TINYINT(1) DEFAULT 1,
    requires_verification TINYINT(1) DEFAULT 1,
    time_limit_minutes INT DEFAULT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_active (active),
    INDEX idx_problem_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Submissions Table
CREATE TABLE student_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL,
    lti_resource_link_id VARCHAR(255),
    student_answer TEXT NOT NULL,
    work_shown TEXT,
    self_verification TEXT NOT NULL COMMENT 'Student explains their verification/checking process',
    is_correct TINYINT(1) DEFAULT NULL,
    teacher_feedback TEXT,
    ai_feedback JSON COMMENT 'AI analysis of self-verification quality',
    score DECIMAL(5,2) DEFAULT NULL,
    max_score DECIMAL(5,2) DEFAULT NULL,
    time_spent_seconds INT DEFAULT NULL,
    attempt_number INT DEFAULT 1,
    status ENUM('draft', 'submitted', 'graded', 'returned') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    graded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem Verification Analysis (AI-powered)
CREATE TABLE problem_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    verification_text TEXT NOT NULL,
    ai_score DECIMAL(4,2) COMMENT 'AI assessment of verification quality (0-100)',
    logic_score DECIMAL(4,2) COMMENT 'Logical reasoning score',
    completeness_score DECIMAL(4,2) COMMENT 'Completeness of verification',
    clarity_score DECIMAL(4,2) COMMENT 'Clarity of explanation',
    ai_feedback TEXT,
    ai_suggestions TEXT,
    processed_by ENUM('claude', 'manual', 'hybrid') DEFAULT 'claude',
    processing_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES student_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LTI Session Management
CREATE TABLE lti_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    consumer_id INT NOT NULL,
    user_id INT NOT NULL,
    resource_link_id VARCHAR(255),
    context_id VARCHAR(255),
    lis_result_sourcedid TEXT COMMENT 'For grade passback',
    lis_outcome_service_url TEXT COMMENT 'For grade passback',
    custom_params JSON,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumer_id) REFERENCES lti_consumers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_resource_link_id (resource_link_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default LTI consumer for development
INSERT INTO lti_consumers (consumer_key, consumer_secret, consumer_name, institution, enabled)
VALUES
('moodle_key_dev', 'moodle_secret_dev', 'Moodle Development', 'KAIST Touch Math Academy', 1);

-- Insert sample admin user
INSERT INTO users (lti_user_id, consumer_id, username, full_name, email, role)
VALUES
('admin_001', 1, 'admin', 'System Administrator', 'admin@kaist.edu', 'admin');

-- Insert sample teacher user
INSERT INTO users (lti_user_id, consumer_id, username, full_name, email, role)
VALUES
('teacher_001', 1, 'teacher', 'Math Teacher', 'teacher@kaist.edu', 'teacher');
