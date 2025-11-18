-- LMS Focus Mode Database Schema
-- MySQL 5.7 Compatible

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    time_limit INT DEFAULT NULL COMMENT 'Time limit in seconds, NULL for unlimited',
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer') DEFAULT 'multiple_choice',
    points INT DEFAULT 1,
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_order (quiz_id, order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answer options table
CREATE TABLE IF NOT EXISTS answer_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    score DECIMAL(5,2) DEFAULT NULL,
    total_points INT DEFAULT 0,
    earned_points INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_quiz (user_id, quiz_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT DEFAULT NULL,
    answer_text TEXT DEFAULT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES answer_options(id) ON DELETE SET NULL,
    INDEX idx_attempt (attempt_id),
    UNIQUE KEY unique_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Focus mode settings table
CREATE TABLE IF NOT EXISTS focus_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    blur_intensity INT DEFAULT 5 COMMENT 'Blur intensity 0-10',
    dim_opacity INT DEFAULT 70 COMMENT 'Dim opacity 0-100',
    hide_timer BOOLEAN DEFAULT FALSE,
    hide_score BOOLEAN DEFAULT FALSE,
    hide_navigation BOOLEAN DEFAULT FALSE,
    fullscreen_mode BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT FALSE,
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO users (username, email, password_hash, role) VALUES
('teacher1', 'teacher@example.com', 'hashed_password_1', 'teacher'),
('student1', 'student1@example.com', 'hashed_password_2', 'student'),
('student2', 'student2@example.com', 'hashed_password_3', 'student');

INSERT INTO quizzes (title, description, created_by, time_limit, passing_score) VALUES
('수학 기초 테스트', '초등 수학 기본 개념을 테스트합니다', 1, 1200, 70.00),
('영어 어휘 퀴즈', '기초 영어 단어 퀴즈입니다', 1, 600, 80.00);

INSERT INTO questions (quiz_id, question_text, question_type, points, order_num) VALUES
(1, '2 + 2 = ?', 'multiple_choice', 1, 1),
(1, '5 x 3 = ?', 'multiple_choice', 1, 2),
(1, '10 - 4 = ?', 'multiple_choice', 1, 3),
(2, 'Apple은 한글로 무엇인가?', 'multiple_choice', 1, 1),
(2, 'Dog는 한글로 무엇인가?', 'multiple_choice', 1, 2);

INSERT INTO answer_options (question_id, option_text, is_correct, order_num) VALUES
-- Question 1 options
(1, '3', FALSE, 1),
(1, '4', TRUE, 2),
(1, '5', FALSE, 3),
(1, '6', FALSE, 4),
-- Question 2 options
(2, '8', FALSE, 1),
(2, '15', TRUE, 2),
(2, '20', FALSE, 3),
(2, '12', FALSE, 4),
-- Question 3 options
(3, '5', FALSE, 1),
(3, '6', TRUE, 2),
(3, '7', FALSE, 3),
(3, '14', FALSE, 4),
-- Question 4 options
(4, '사과', TRUE, 1),
(4, '바나나', FALSE, 2),
(4, '오렌지', FALSE, 3),
(4, '포도', FALSE, 4),
-- Question 5 options
(5, '고양이', FALSE, 1),
(5, '강아지', TRUE, 2),
(5, '토끼', FALSE, 3),
(5, '햄스터', FALSE, 4);

INSERT INTO focus_settings (user_id, blur_intensity, dim_opacity, hide_timer, fullscreen_mode) VALUES
(2, 5, 70, FALSE, TRUE),
(3, 7, 80, TRUE, TRUE);
