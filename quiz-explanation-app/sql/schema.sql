-- Quiz Explanation App Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS quiz_explanation_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE quiz_explanation_app;

-- Users table (synchronized with Moodle)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP NULL,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quizzes table
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    moodle_quiz_id INT NULL,
    teacher_id INT NOT NULL,
    time_limit INT NULL COMMENT 'Time limit in minutes',
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    show_feedback TINYINT(1) DEFAULT 1,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status),
    INDEX idx_moodle_quiz_id (moodle_quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false') DEFAULT 'multiple_choice',
    points DECIMAL(5,2) DEFAULT 1.00,
    explanation_required TINYINT(1) DEFAULT 1,
    explanation_weight DECIMAL(3,2) DEFAULT 0.30 COMMENT 'Weight of explanation in total score (0-1)',
    model_explanation TEXT COMMENT 'Model/ideal explanation for reference',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_order_num (order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question options/choices table
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    option_order INT DEFAULT 0,
    feedback TEXT COMMENT 'Feedback when this option is selected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keywords for explanation evaluation
CREATE TABLE explanation_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    keyword_type ENUM('required', 'bonus', 'negative') DEFAULT 'required',
    weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Weight of this keyword in scoring',
    description TEXT COMMENT 'Why this keyword is important',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_keyword_type (keyword_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student quiz attempts
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    time_spent INT NULL COMMENT 'Time spent in seconds',
    total_score DECIMAL(5,2) NULL,
    passing TINYINT(1) NULL,
    synced_to_moodle TINYINT(1) DEFAULT 0,
    synced_at TIMESTAMP NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt (quiz_id, student_id, attempt_number),
    INDEX idx_student_id (student_id),
    INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student answers with explanations
CREATE TABLE student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    explanation_text TEXT COMMENT 'Student explanation of their answer',
    answer_score DECIMAL(5,2) NULL COMMENT 'Score for the selected answer',
    explanation_score DECIMAL(5,2) NULL COMMENT 'Score for the explanation',
    total_score DECIMAL(5,2) NULL COMMENT 'Combined score',
    auto_evaluated TINYINT(1) DEFAULT 0,
    teacher_reviewed TINYINT(1) DEFAULT 0,
    teacher_id INT NULL COMMENT 'Teacher who reviewed this answer',
    teacher_feedback TEXT COMMENT 'Teacher feedback on explanation',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_id (question_id),
    INDEX idx_teacher_reviewed (teacher_reviewed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Explanation evaluation details
CREATE TABLE explanation_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    answer_id INT NOT NULL,
    keyword_id INT NOT NULL,
    found TINYINT(1) DEFAULT 0,
    match_context TEXT COMMENT 'Where/how the keyword was found',
    score_contribution DECIMAL(5,2) DEFAULT 0.00,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (answer_id) REFERENCES student_answers(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES explanation_keywords(id) ON DELETE CASCADE,
    INDEX idx_answer_id (answer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle sync log
CREATE TABLE moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('user', 'quiz', 'grade') NOT NULL,
    entity_id INT NOT NULL COMMENT 'ID of the entity being synced',
    moodle_id INT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    request_data JSON,
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('moodle_url', '', 'string', 'Moodle installation URL'),
('moodle_token', '', 'string', 'Moodle web service token'),
('auto_sync_enabled', '1', 'boolean', 'Enable automatic grade sync to Moodle'),
('default_explanation_weight', '0.30', 'number', 'Default weight for explanation scoring'),
('min_explanation_length', '20', 'number', 'Minimum characters required for explanation');

-- Sample data for testing
INSERT INTO users (moodle_user_id, username, email, full_name, role) VALUES
(1, 'teacher1', 'teacher@example.com', 'Test Teacher', 'teacher'),
(2, 'student1', 'student1@example.com', 'Test Student 1', 'student'),
(3, 'student2', 'student2@example.com', 'Test Student 2', 'student');

-- Sample quiz
INSERT INTO quizzes (title, description, teacher_id, time_limit, passing_score, status) VALUES
('Sample Math Quiz', 'This is a sample quiz to test the explanation feature', 1, 30, 70.00, 'active');

-- Sample question
INSERT INTO questions (quiz_id, question_text, points, explanation_weight, model_explanation, difficulty_level, order_num) VALUES
(1, 'What is 2 + 2?', 10.00, 0.30, 'Adding 2 and 2 gives us 4 because when we combine two groups of 2 items, we get a total of 4 items.', 'easy', 1);

-- Sample options
INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES
(1, '3', 0, 1),
(1, '4', 1, 2),
(1, '5', 0, 3),
(1, '22', 0, 4);

-- Sample keywords for evaluation
INSERT INTO explanation_keywords (question_id, keyword, keyword_type, weight, description) VALUES
(1, 'add', 'required', 1.00, 'Must mention addition operation'),
(1, 'combine', 'bonus', 0.50, 'Bonus for explaining combination concept'),
(1, 'total', 'bonus', 0.50, 'Bonus for mentioning total'),
(1, 'multiply', 'negative', -0.50, 'Wrong operation mentioned');
