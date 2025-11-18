-- Alt42 Value Bounce App - Database Schema
-- MySQL 5.7 compatible
-- Custom tables for Moodle 3.7 integration

-- Function Problems Table
CREATE TABLE IF NOT EXISTS mdl_custom_function_problems (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id INT(10) UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_type VARCHAR(50) NOT NULL,
    function_expression VARCHAR(255) NOT NULL,
    min_value DECIMAL(10,2) DEFAULT 0,
    max_value DECIMAL(10,2) DEFAULT 100,
    correct_answer TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_course_id (course_id),
    INDEX idx_function_type (function_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Answers Table
CREATE TABLE IF NOT EXISTS mdl_custom_function_answers (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT(10) UNSIGNED NOT NULL,
    problem_id INT(10) UNSIGNED NOT NULL,
    answer TEXT NOT NULL,
    time_taken DECIMAL(10,2) DEFAULT 0,
    is_correct TINYINT(1) DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_submitted_at (submitted_at),
    FOREIGN KEY (problem_id) REFERENCES mdl_custom_function_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data
INSERT INTO mdl_custom_function_problems
    (course_id, title, description, function_type, function_expression, min_value, max_value, difficulty)
VALUES
    (1, '함수 값 변화 관찰 - 제곱 함수', 'f(x) = x² 함수의 값 변화를 공의 튀김으로 표현합니다.', 'quadratic', 'x^2', 0, 30, 'easy'),
    (1, '선형 함수 이해하기', 'f(x) = 2x 함수의 값 변화를 관찰하세요.', 'linear', '2*x', 0, 50, 'easy'),
    (1, '제곱근 함수 탐험', 'f(x) = √|x| 함수의 특성을 알아봅시다.', 'sqrt', 'sqrt(abs(x))', 0, 100, 'medium'),
    (1, '절댓값 함수 학습', 'f(x) = |x| 함수의 그래프를 이해합니다.', 'absolute', 'abs(x)', -50, 50, 'easy'),
    (1, '3차 함수 도전', 'f(x) = x³ 함수의 급격한 변화를 관찰하세요.', 'cubic', 'x^3', -10, 10, 'hard');

-- View for problem statistics
CREATE OR REPLACE VIEW mdl_custom_function_problem_stats AS
SELECT
    p.id,
    p.title,
    p.function_type,
    COUNT(DISTINCT a.user_id) as total_attempts,
    AVG(a.time_taken) as avg_time_taken,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
    SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count
FROM mdl_custom_function_problems p
LEFT JOIN mdl_custom_function_answers a ON p.id = a.problem_id
GROUP BY p.id, p.title, p.function_type;
