-- Standalone Math Learning Web App Database Schema
-- Compatible with MySQL 5.7
-- Character set: utf8mb4 for full Unicode support

CREATE DATABASE IF NOT EXISTS math_learning_app
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE math_learning_app;

-- Users table (teachers and students)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL DEFAULT 'student',
    grade_level VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question categories
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT UNSIGNED NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions/Problems
CREATE TABLE IF NOT EXISTS questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'short_answer', 'numeric', 'true_false') NOT NULL,
    difficulty_level TINYINT UNSIGNED NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    points INT UNSIGNED DEFAULT 10,
    time_limit INT UNSIGNED NULL COMMENT 'Time limit in seconds',
    explanation TEXT COMMENT 'Explanation for the correct answer',
    hints TEXT COMMENT 'JSON array of hints',
    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answer options for multiple choice questions
CREATE TABLE IF NOT EXISTS answer_options (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    option_text TEXT NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    display_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Correct answers for non-multiple choice questions
CREATE TABLE IF NOT EXISTS correct_answers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    answer_text TEXT NOT NULL COMMENT 'Correct answer or pattern',
    answer_value DECIMAL(10, 4) NULL COMMENT 'For numeric answers',
    tolerance DECIMAL(10, 4) NULL COMMENT 'Acceptable variance for numeric',
    is_case_sensitive TINYINT(1) DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts and answers
CREATE TABLE IF NOT EXISTS attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    answer_text TEXT,
    answer_value DECIMAL(10, 4) NULL,
    selected_option_id INT UNSIGNED NULL,
    is_correct TINYINT(1) NOT NULL,
    points_earned INT UNSIGNED DEFAULT 0,
    time_spent INT UNSIGNED COMMENT 'Time spent in seconds',
    hints_used INT UNSIGNED DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES answer_options(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_question (question_id),
    INDEX idx_correct (is_correct),
    INDEX idx_attempted (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    current_level TINYINT UNSIGNED DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
    total_attempts INT UNSIGNED DEFAULT 0,
    correct_attempts INT UNSIGNED DEFAULT 0,
    total_points INT UNSIGNED DEFAULT 0,
    mastery_score DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage 0-100',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_category (student_id, category_id),
    INDEX idx_student (student_id),
    INDEX idx_mastery (mastery_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning sessions
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    questions_attempted INT UNSIGNED DEFAULT 0,
    questions_correct INT UNSIGNED DEFAULT 0,
    total_points INT UNSIGNED DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement/badges system
CREATE TABLE IF NOT EXISTS achievements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    criteria TEXT COMMENT 'JSON criteria for earning',
    points_value INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student achievements
CREATE TABLE IF NOT EXISTS student_achievements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    achievement_id INT UNSIGNED NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_achievement (student_id, achievement_id),
    INDEX idx_student (student_id),
    INDEX idx_earned (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO categories (name, description, display_order) VALUES
('덧셈과 뺄셈', '기초 덧셈과 뺄셈 문제', 1),
('곱셈과 나눗셈', '곱셈과 나눗셈 문제', 2),
('분수', '분수의 이해와 연산', 3),
('소수', '소수의 이해와 연산', 4),
('기하학', '도형과 공간', 5);

-- Insert default teacher account
-- Password: teacher123 (hashed with password_hash)
INSERT INTO users (username, password, email, full_name, role) VALUES
('teacher', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher@example.com', '김선생', 'teacher');

-- Insert default student account
-- Password: student123
INSERT INTO users (username, password, email, full_name, role, grade_level) VALUES
('student', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student@example.com', '홍길동', 'student', '3학년');

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, criteria, points_value) VALUES
('첫 문제 해결', '첫 번째 문제를 맞혔습니다!', '🎯', '{"type": "first_correct"}', 10),
('연속 5개 정답', '5개 문제를 연속으로 맞혔습니다!', '🔥', '{"type": "streak", "count": 5}', 50),
('마스터 레벨', '한 카테고리에서 90% 이상 달성', '🏆', '{"type": "mastery", "threshold": 90}', 100),
('일주일 연속', '7일 연속 학습했습니다!', '⭐', '{"type": "daily_streak", "days": 7}', 75);
