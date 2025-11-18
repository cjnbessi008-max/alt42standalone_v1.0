-- Touch Math Academy - Graph Calculator Database Schema
-- Compatible with MySQL 5.7
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS touchmath_graphs
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE touchmath_graphs;

-- Table: problems
-- Stores math problems and graph exercises
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_expr VARCHAR(255) NOT NULL COMMENT 'Mathematical function expression (e.g., x^2, sin(x))',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'general' COMMENT 'algebra, calculus, trigonometry, etc.',
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    moodle_id INT UNSIGNED DEFAULT NULL COMMENT 'Reference to Moodle problem ID',
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_moodle_id (moodle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: problem_access
-- Tracks when students access problems
CREATE TABLE IF NOT EXISTS problem_access (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_problem_id (problem_id),
    INDEX idx_user_id (user_id),
    INDEX idx_accessed_at (accessed_at),

    FOREIGN KEY (problem_id) REFERENCES problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_activities
-- Logs all student interactions with the graph calculator
CREATE TABLE IF NOT EXISTS student_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    problem_id INT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'plot, show_derivative, hide_derivative, reset, etc.',
    details TEXT COMMENT 'Additional action details (e.g., function expression)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_user_problem (user_id, problem_id),

    FOREIGN KEY (problem_id) REFERENCES problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_progress
-- Tracks overall student progress on problems
CREATE TABLE IF NOT EXISTS student_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    problem_id INT UNSIGNED NOT NULL,
    actions_count INT UNSIGNED DEFAULT 0 COMMENT 'Total number of actions performed',
    last_action VARCHAR(50) DEFAULT NULL,
    completed TINYINT(1) DEFAULT 0 COMMENT '1 if student completed the problem',
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_completed (completed),
    INDEX idx_updated_at (updated_at),

    FOREIGN KEY (problem_id) REFERENCES problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moodle_sync_log
-- Logs synchronization attempts with Moodle
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL COMMENT 'activity, progress, problem, etc.',
    reference_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'ID of the synced record',
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT DEFAULT NULL,
    request_data TEXT COMMENT 'JSON data sent to Moodle',
    response_data TEXT COMMENT 'JSON response from Moodle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert demo problems
INSERT INTO problems (title, description, function_expr, difficulty, category) VALUES
    ('Quadratic Function', 'Plot f(x) = x² and observe its derivative f\'(x) = 2x', 'x^2', 'easy', 'algebra'),
    ('Sine Wave', 'Explore the sine function and its derivative (cosine)', 'sin(x)', 'medium', 'trigonometry'),
    ('Cubic Function', 'Graph f(x) = x³ and analyze its derivative f\'(x) = 3x²', 'x^3', 'medium', 'algebra'),
    ('Natural Exponential', 'Study the exponential function f(x) = e^x and its self-derivative', 'exp(x)', 'hard', 'calculus'),
    ('Cosine Function', 'Plot cosine and observe how its derivative is -sin(x)', 'cos(x)', 'medium', 'trigonometry'),
    ('Linear Function', 'Simple linear function f(x) = 2x + 3 with constant derivative', '2*x + 3', 'easy', 'algebra'),
    ('Square Root', 'Explore f(x) = √x and its derivative f\'(x) = 1/(2√x)', 'sqrt(x)', 'medium', 'calculus'),
    ('Absolute Value', 'Graph f(x) = |x| and observe the derivative discontinuity', 'abs(x)', 'medium', 'algebra');

-- Create user for the application (update password)
-- Run this separately with appropriate privileges:
-- CREATE USER IF NOT EXISTS 'touchmath_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE ON touchmath_graphs.* TO 'touchmath_user'@'localhost';
-- FLUSH PRIVILEGES;
