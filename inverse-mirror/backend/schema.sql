-- Inverse Mirror Database Schema
-- MySQL 5.7 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS inverse_mirror CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inverse_mirror;

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    function_expression VARCHAR(255) NOT NULL COMMENT 'Mathematical function expression (e.g., x^2, sin(x))',
    domain JSON NOT NULL COMMENT 'Domain as [min, max] array',
    point DECIMAL(10, 4) NOT NULL COMMENT 'Point where derivative is calculated',
    question_type ENUM('derivative', 'inverse_derivative', 'both') NOT NULL DEFAULT 'both',
    moodle_question_id INT NULL COMMENT 'Reference to Moodle question ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_type (question_type),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Math problems for inverse derivative learning';

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Reference to Moodle user ID',
    problem_id INT NOT NULL COMMENT 'Reference to problem ID',
    attempts INT DEFAULT 1 COMMENT 'Number of attempts',
    completed BOOLEAN DEFAULT FALSE COMMENT 'Whether student completed the problem',
    score DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Score (0-100)',
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_problem (student_id, problem_id),
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_completed (completed),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student learning progress tracking';

-- Insert sample problems
INSERT INTO problems (function_expression, domain, point, question_type) VALUES
('x^2', '[-3, 3]', 1.5, 'both'),
('sqrt(x)', '[0, 4]', 2.0, 'both'),
('exp(x)', '[-2, 2]', 1.0, 'both'),
('x^3', '[-2, 2]', 1.0, 'derivative'),
('sin(x)', '[-1.5, 1.5]', 0.5, 'both'),
('log(x)', '[0.1, 5]', 2.0, 'both'),
('2*x + 1', '[-5, 5]', 2.0, 'both'),
('x^2 + 2*x', '[-4, 4]', 1.0, 'both');

-- Create view for problem statistics
CREATE OR REPLACE VIEW problem_stats AS
SELECT
    p.id,
    p.function_expression,
    p.question_type,
    COUNT(DISTINCT sp.student_id) AS total_students,
    COUNT(*) AS total_attempts,
    AVG(sp.score) AS average_score,
    SUM(sp.completed) AS completed_count,
    AVG(sp.time_spent) AS average_time_spent
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.function_expression, p.question_type;

-- Create view for student statistics
CREATE OR REPLACE VIEW student_stats AS
SELECT
    sp.student_id,
    COUNT(DISTINCT sp.problem_id) AS total_problems_attempted,
    SUM(sp.completed) AS problems_completed,
    AVG(sp.score) AS average_score,
    SUM(sp.time_spent) AS total_time_spent,
    SUM(sp.attempts) AS total_attempts,
    MAX(sp.updated_at) AS last_activity
FROM student_progress sp
GROUP BY sp.student_id;

-- Show tables
SHOW TABLES;

-- Display schema
DESCRIBE problems;
DESCRIBE student_progress;
