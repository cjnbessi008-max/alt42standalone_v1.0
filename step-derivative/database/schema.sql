-- Step Derivative Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Create database
CREATE DATABASE IF NOT EXISTS step_derivative CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE step_derivative;

-- Problems table: stores derivative problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_quiz_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    expression TEXT NOT NULL,
    difficulty_level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solution steps table: stores each step of derivative solution
CREATE TABLE IF NOT EXISTS solution_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    step_number INT NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'power_rule', 'chain_rule', 'product_rule', 'quotient_rule', etc.
    expression_before TEXT NOT NULL,
    expression_after TEXT NOT NULL,
    explanation TEXT NOT NULL,
    rule_applied VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_step_number (step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table: tracks student interactions
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_number INT NOT NULL,
    current_step INT DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    time_spent INT DEFAULT 0, -- in seconds
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user (moodle_user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Derivative rules reference table
CREATE TABLE IF NOT EXISTS derivative_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_formula TEXT NOT NULL,
    description TEXT,
    example TEXT,
    difficulty_level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common derivative rules
INSERT INTO derivative_rules (rule_name, rule_formula, description, example, difficulty_level) VALUES
('constant_rule', 'd/dx(c) = 0', 'The derivative of a constant is zero', 'd/dx(5) = 0', 'basic'),
('power_rule', 'd/dx(x^n) = n*x^(n-1)', 'Power rule for differentiation', 'd/dx(x³) = 3x²', 'basic'),
('constant_multiple', 'd/dx(c*f) = c*d/dx(f)', 'Constant multiple rule', 'd/dx(3x²) = 3*2x = 6x', 'basic'),
('sum_rule', 'd/dx(f + g) = d/dx(f) + d/dx(g)', 'Sum rule for differentiation', 'd/dx(x² + x³) = 2x + 3x²', 'basic'),
('product_rule', 'd/dx(f*g) = f\'*g + f*g\'', 'Product rule for differentiation', 'd/dx(x²*sin(x)) = 2x*sin(x) + x²*cos(x)', 'intermediate'),
('quotient_rule', 'd/dx(f/g) = (f\'*g - f*g\')/g²', 'Quotient rule for differentiation', 'd/dx(x²/x³) = (2x*x³ - x²*3x²)/(x³)²', 'intermediate'),
('chain_rule', 'd/dx(f(g(x))) = f\'(g(x))*g\'(x)', 'Chain rule for composite functions', 'd/dx(sin(x²)) = cos(x²)*2x', 'advanced'),
('exponential_rule', 'd/dx(e^x) = e^x', 'Derivative of exponential function', 'd/dx(e^x) = e^x', 'basic'),
('logarithm_rule', 'd/dx(ln(x)) = 1/x', 'Derivative of natural logarithm', 'd/dx(ln(x)) = 1/x', 'intermediate'),
('sin_rule', 'd/dx(sin(x)) = cos(x)', 'Derivative of sine function', 'd/dx(sin(x)) = cos(x)', 'basic'),
('cos_rule', 'd/dx(cos(x)) = -sin(x)', 'Derivative of cosine function', 'd/dx(cos(x)) = -sin(x)', 'basic'),
('tan_rule', 'd/dx(tan(x)) = sec²(x)', 'Derivative of tangent function', 'd/dx(tan(x)) = sec²(x)', 'intermediate');

-- Session management table for virtual smartphone display
CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_id INT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user (moodle_user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics table for tracking usage
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'step_viewed', 'hint_requested', 'problem_completed', etc.
    moodle_user_id INT NOT NULL,
    problem_id INT,
    step_number INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user (moodle_user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
