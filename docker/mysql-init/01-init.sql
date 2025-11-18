-- Smooth Interval Database Schema
-- MySQL 5.7 compatible

USE smooth_interval_db;

-- Problems table: stores math problems from Moodle LMS
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_expression VARCHAR(500) NOT NULL,
    domain_start DECIMAL(10, 4),
    domain_end DECIMAL(10, 4),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_problem_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Function intervals table: stores differentiable/non-differentiable intervals
CREATE TABLE IF NOT EXISTS function_intervals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    interval_start DECIMAL(10, 4) NOT NULL,
    interval_end DECIMAL(10, 4) NOT NULL,
    is_differentiable BOOLEAN NOT NULL,
    interval_type ENUM('smooth', 'corner', 'cusp', 'discontinuity') DEFAULT 'smooth',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_differentiable (is_differentiable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student sessions table: tracks student interactions
CREATE TABLE IF NOT EXISTS student_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(100),
    problem_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    score DECIMAL(5, 2),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (moodle_problem_id, title, description, function_expression, domain_start, domain_end, difficulty_level) VALUES
('MOODLE_001', '절댓값 함수의 미분가능성', '절댓값 함수 f(x) = |x|의 미분 가능한 구간을 찾으세요', 'abs(x)', -5.0, 5.0, 'easy'),
('MOODLE_002', '구간별 정의 함수', 'x < 0일 때 x^2, x >= 0일 때 x인 함수의 미분가능성', 'x < 0 ? x^2 : x', -3.0, 3.0, 'medium'),
('MOODLE_003', '삼각함수와 절댓값의 합성', 'f(x) = |sin(x)|의 미분 가능한 구간', 'abs(sin(x))', -6.28, 6.28, 'hard');

-- Insert interval data for sample problems
INSERT INTO function_intervals (problem_id, interval_start, interval_end, is_differentiable, interval_type) VALUES
-- For |x|: differentiable everywhere except x=0
(1, -5.0, 0.0, 1, 'smooth'),
(1, 0.0, 0.0, 0, 'corner'),
(1, 0.0, 5.0, 1, 'smooth'),

-- For piecewise function
(2, -3.0, 0.0, 1, 'smooth'),
(2, 0.0, 0.0, 0, 'corner'),
(2, 0.0, 3.0, 1, 'smooth'),

-- For |sin(x)|
(3, -6.28, -3.14, 1, 'smooth'),
(3, -3.14, -3.14, 0, 'corner'),
(3, -3.14, 0.0, 1, 'smooth'),
(3, 0.0, 0.0, 0, 'corner'),
(3, 0.0, 3.14, 1, 'smooth'),
(3, 3.14, 3.14, 0, 'corner'),
(3, 3.14, 6.28, 1, 'smooth');

-- Create view for easy querying
CREATE OR REPLACE VIEW problem_details AS
SELECT
    p.id,
    p.moodle_problem_id,
    p.title,
    p.description,
    p.function_expression,
    p.domain_start,
    p.domain_end,
    p.difficulty_level,
    COUNT(fi.id) as interval_count,
    SUM(CASE WHEN fi.is_differentiable = 1 THEN 1 ELSE 0 END) as smooth_interval_count
FROM problems p
LEFT JOIN function_intervals fi ON p.id = fi.problem_id
GROUP BY p.id;
