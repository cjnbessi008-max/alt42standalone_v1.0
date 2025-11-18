-- Term Motion Database Schema
-- MySQL 5.7 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS termmotion
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE termmotion;

-- Problems table
-- 문제 정보 저장
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    initial_expression VARCHAR(500) NOT NULL,
    target_expression VARCHAR(500) NOT NULL,
    steps JSON NOT NULL COMMENT 'Animation steps in JSON format',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'algebra',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress table
-- 학생 진행 상황 저장
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL COMMENT 'Reference to Moodle user ID',
    current_step INT DEFAULT 0,
    total_steps INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    attempts INT DEFAULT 0 COMMENT 'Number of attempts',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_problem (problem_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table (local cache of Moodle users)
-- Moodle 사용자 정보 캐시
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY COMMENT 'Same as Moodle user ID',
    username VARCHAR(100) NOT NULL,
    fullname VARCHAR(255),
    email VARCHAR(255),
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem categories table
-- 문제 카테고리 관리
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('algebra', 'Algebraic expressions and equations'),
('arithmetic', 'Basic arithmetic operations'),
('fractions', 'Fractions and rational numbers'),
('polynomials', 'Polynomial expressions'),
('equations', 'Linear and quadratic equations')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert sample problems
INSERT INTO problems (title, description, initial_expression, target_expression, steps, difficulty, category) VALUES
(
    'Combining Like Terms',
    'Learn how to combine like terms in algebraic expressions',
    '2x + 3x + 5',
    '5x + 5',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'step1',
            'description', 'Initial expression',
            'descriptionKo', '초기 수식',
            'duration', 2
        ),
        JSON_OBJECT(
            'id', 'step2',
            'description', 'Combine like terms: 2x + 3x = 5x',
            'descriptionKo', '동류항 결합하기: 2x + 3x = 5x',
            'duration', 3
        ),
        JSON_OBJECT(
            'id', 'step3',
            'description', 'Final simplified expression',
            'descriptionKo', '최종 간소화된 수식',
            'duration', 2
        )
    ),
    'easy',
    'algebra'
),
(
    'Distributive Property',
    'Apply the distributive property to expand expressions',
    '3(x + 2)',
    '3x + 6',
    JSON_ARRAY(
        JSON_OBJECT(
            'id', 'step1',
            'description', 'Initial expression',
            'descriptionKo', '초기 수식',
            'duration', 2
        ),
        JSON_OBJECT(
            'id', 'step2',
            'description', 'Distribute 3 to each term: 3 × x and 3 × 2',
            'descriptionKo', '3을 각 항에 분배: 3 × x 그리고 3 × 2',
            'duration', 3
        ),
        JSON_OBJECT(
            'id', 'step3',
            'description', 'Simplified: 3x + 6',
            'descriptionKo', '간소화: 3x + 6',
            'duration', 2
        )
    ),
    'medium',
    'algebra'
);

-- Create view for progress statistics
-- 진행 상황 통계 뷰
CREATE OR REPLACE VIEW progress_stats AS
SELECT
    p.id AS problem_id,
    p.title,
    p.category,
    p.difficulty,
    COUNT(DISTINCT sp.student_id) AS total_students,
    SUM(sp.completed) AS completed_count,
    AVG(sp.time_spent) AS avg_time_spent,
    AVG(sp.attempts) AS avg_attempts
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.title, p.category, p.difficulty;
