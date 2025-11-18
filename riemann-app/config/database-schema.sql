-- ============================================================
-- Riemann Sum Application Database Schema
-- For Moodle 3.7 + MySQL 5.7
-- ============================================================

-- Create database (if not using existing Moodle database)
-- CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE moodle;

-- ============================================================
-- Table: mdl_riemann_problems
-- Stores Riemann Sum problems/questions
-- ============================================================

CREATE TABLE IF NOT EXISTS mdl_riemann_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Problem title',
    description TEXT COMMENT 'Problem description/instructions',
    function_expr VARCHAR(255) NOT NULL COMMENT 'Function expression (e.g., "x*x", "x^2")',
    function_display VARCHAR(255) NOT NULL COMMENT 'Display format (e.g., "f(x) = x²")',
    interval_a DECIMAL(10, 4) NOT NULL COMMENT 'Lower bound of integration interval',
    interval_b DECIMAL(10, 4) NOT NULL COMMENT 'Upper bound of integration interval',
    riemann_type ENUM('left', 'right', 'midpoint', 'trapezoid') DEFAULT 'midpoint' COMMENT 'Default Riemann sum type',
    exact_answer DECIMAL(15, 6) NOT NULL COMMENT 'Exact integral value',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT 'Problem difficulty level',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Is problem active and available',
    created_by INT DEFAULT NULL COMMENT 'User ID who created the problem',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Riemann Sum problems for interactive learning';

-- ============================================================
-- Table: mdl_riemann_submissions
-- Stores student submissions and answers
-- ============================================================

CREATE TABLE IF NOT EXISTS mdl_riemann_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL COMMENT 'Reference to problem',
    user_id INT NOT NULL COMMENT 'Moodle user ID',
    submitted_answer DECIMAL(15, 6) NOT NULL COMMENT 'Student submitted answer',
    correct_answer DECIMAL(15, 6) NOT NULL COMMENT 'Correct answer for this submission',
    error_value DECIMAL(15, 6) NOT NULL COMMENT 'Absolute error',
    percent_error DECIMAL(8, 4) NOT NULL COMMENT 'Percentage error',
    is_correct TINYINT(1) NOT NULL COMMENT 'Is answer correct (within threshold)',
    subdivisions_used INT DEFAULT NULL COMMENT 'Number of subdivisions used',
    riemann_type VARCHAR(20) DEFAULT NULL COMMENT 'Type of Riemann sum used',
    time_spent_seconds INT DEFAULT NULL COMMENT 'Time spent on problem',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_problem_id (problem_id),
    INDEX idx_user_id (user_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_is_correct (is_correct),
    FOREIGN KEY (problem_id) REFERENCES mdl_riemann_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student submissions for Riemann Sum problems';

-- ============================================================
-- Table: mdl_riemann_progress
-- Tracks student progress and analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS mdl_riemann_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Moodle user ID',
    problem_id INT NOT NULL COMMENT 'Reference to problem',
    attempts INT DEFAULT 0 COMMENT 'Number of attempts',
    correct_attempts INT DEFAULT 0 COMMENT 'Number of correct attempts',
    best_error DECIMAL(15, 6) DEFAULT NULL COMMENT 'Best error achieved',
    best_subdivisions INT DEFAULT NULL COMMENT 'Subdivisions used for best attempt',
    total_time_seconds INT DEFAULT 0 COMMENT 'Total time spent on this problem',
    completed TINYINT(1) DEFAULT 0 COMMENT 'Has student completed this problem',
    completed_at TIMESTAMP NULL DEFAULT NULL,
    first_attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_completed (completed),
    FOREIGN KEY (problem_id) REFERENCES mdl_riemann_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student progress tracking for Riemann Sum problems';

-- ============================================================
-- Insert Sample Data
-- ============================================================

-- Sample Problem 1: f(x) = x² on [0, 2]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('기본 함수의 적분', 'f(x) = x² 함수를 [0, 2] 구간에서 적분하세요.', 'x*x', 'f(x) = x²', 0, 2, 'midpoint', 2.6667, 'easy', 1);

-- Sample Problem 2: f(x) = x³ on [0, 1]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('3차 함수의 적분', 'f(x) = x³ 함수를 [0, 1] 구간에서 적분하세요.', 'x*x*x', 'f(x) = x³', 0, 1, 'midpoint', 0.2500, 'easy', 1);

-- Sample Problem 3: f(x) = 2x + 1 on [0, 3]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('선형 함수의 적분', 'f(x) = 2x + 1 함수를 [0, 3] 구간에서 적분하세요.', '2*x+1', 'f(x) = 2x + 1', 0, 3, 'trapezoid', 12.0000, 'easy', 1);

-- Sample Problem 4: f(x) = sin(x) on [0, π]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('삼각 함수의 적분', 'f(x) = sin(x) 함수를 [0, π] 구간에서 적분하세요.', 'Math.sin(x)', 'f(x) = sin(x)', 0, 3.1416, 'midpoint', 2.0000, 'medium', 1);

-- Sample Problem 5: f(x) = e^x on [0, 1]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('지수 함수의 적분', 'f(x) = e^x 함수를 [0, 1] 구간에서 적분하세요.', 'Math.exp(x)', 'f(x) = e^x', 0, 1, 'midpoint', 1.7183, 'medium', 1);

-- Sample Problem 6: f(x) = 1/x on [1, 2]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('역수 함수의 적분', 'f(x) = 1/x 함수를 [1, 2] 구간에서 적분하세요.', '1/x', 'f(x) = 1/x', 1, 2, 'midpoint', 0.6931, 'medium', 1);

-- Sample Problem 7: f(x) = √x on [0, 4]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('제곱근 함수의 적분', 'f(x) = √x 함수를 [0, 4] 구간에서 적분하세요.', 'Math.sqrt(x)', 'f(x) = √x', 0, 4, 'midpoint', 5.3333, 'hard', 1);

-- Sample Problem 8: f(x) = x² - 4x + 3 on [0, 4]
INSERT INTO mdl_riemann_problems
(title, description, function_expr, function_display, interval_a, interval_b, riemann_type, exact_answer, difficulty, is_active)
VALUES
('2차 다항식의 적분', 'f(x) = x² - 4x + 3 함수를 [0, 4] 구간에서 적분하세요.', 'x*x-4*x+3', 'f(x) = x² - 4x + 3', 0, 4, 'midpoint', -5.3333, 'hard', 1);

-- ============================================================
-- Useful Queries
-- ============================================================

-- Get all active problems
-- SELECT * FROM mdl_riemann_problems WHERE is_active = 1 ORDER BY difficulty, id;

-- Get student progress for a specific user
-- SELECT
--     p.title,
--     pr.attempts,
--     pr.correct_attempts,
--     pr.best_error,
--     pr.completed
-- FROM mdl_riemann_progress pr
-- JOIN mdl_riemann_problems p ON pr.problem_id = p.id
-- WHERE pr.user_id = ?
-- ORDER BY pr.last_attempted_at DESC;

-- Get leaderboard (students with least error)
-- SELECT
--     s.user_id,
--     p.title,
--     s.submitted_answer,
--     s.error_value,
--     s.subdivisions_used,
--     s.submitted_at
-- FROM mdl_riemann_submissions s
-- JOIN mdl_riemann_problems p ON s.problem_id = p.id
-- WHERE s.is_correct = 1
-- ORDER BY s.error_value ASC, s.submitted_at ASC
-- LIMIT 10;

-- Analytics: Average performance by problem
-- SELECT
--     p.id,
--     p.title,
--     COUNT(s.id) as total_submissions,
--     AVG(s.error_value) as avg_error,
--     AVG(s.percent_error) as avg_percent_error,
--     SUM(s.is_correct) as correct_count,
--     (SUM(s.is_correct) / COUNT(s.id) * 100) as success_rate
-- FROM mdl_riemann_problems p
-- LEFT JOIN mdl_riemann_submissions s ON p.id = s.problem_id
-- WHERE p.is_active = 1
-- GROUP BY p.id, p.title
-- ORDER BY success_rate DESC;
