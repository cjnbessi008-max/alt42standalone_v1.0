-- Derivative Focus Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS derivative_focus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE derivative_focus;

-- Table: derivative_rules
-- Stores the 3 core derivative rules with their patterns
CREATE TABLE IF NOT EXISTS derivative_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('power_rule', 'chain_rule', 'product_rule', 'quotient_rule', 'constant_rule', 'sum_rule') NOT NULL,
    rule_formula TEXT NOT NULL,
    pattern_regex TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_core_rule BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rule_type (rule_type),
    INDEX idx_is_core (is_core_rule)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: problems
-- Stores derivative problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT,
    problem_text TEXT NOT NULL,
    problem_latex TEXT,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: problem_rules
-- Maps problems to detected derivative rules
CREATE TABLE IF NOT EXISTS problem_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    rule_id INT NOT NULL,
    matched_expression TEXT,
    highlight_start INT,
    highlight_end INT,
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES derivative_rules(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_rule_id (rule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sessions
-- Tracks user sessions for the virtual smartphone display
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    moodle_user_id INT,
    current_problem_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (current_problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_session_token (session_token),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the 3 core derivative rules
INSERT INTO derivative_rules (rule_name, rule_type, rule_formula, pattern_regex, description, display_order, is_core_rule) VALUES
('Power Rule', 'power_rule', 'd/dx[x^n] = n·x^(n-1)', 'x\s*\^\s*[0-9]+|x\s*\^[a-z]', 'The power rule: derivative of x to the power n is n times x to the power (n-1)', 1, TRUE),
('Chain Rule', 'chain_rule', 'd/dx[f(g(x))] = f\'(g(x))·g\'(x)', '\([^\)]+\)\s*\^|sin\(|cos\(|tan\(|log\(|ln\(|e\^', 'The chain rule: derivative of composite function f(g(x)) is f\'(g(x)) times g\'(x)', 2, TRUE),
('Product Rule', 'product_rule', 'd/dx[f·g] = f\'·g + f·g\'', '\([^\)]+\)\s*\*\s*\([^\)]+\)|[a-z]\s*\*\s*[a-z]', 'The product rule: derivative of f times g is f\' times g plus f times g\'', 3, TRUE);

-- Insert additional common rules (non-core)
INSERT INTO derivative_rules (rule_name, rule_type, rule_formula, pattern_regex, description, display_order, is_core_rule) VALUES
('Quotient Rule', 'quotient_rule', 'd/dx[f/g] = (f\'·g - f·g\')/g^2', '\([^\)]+\)\s*\/\s*\([^\)]+\)', 'The quotient rule: derivative of f divided by g', 4, FALSE),
('Constant Rule', 'constant_rule', 'd/dx[c] = 0', '^[0-9]+$', 'The derivative of a constant is zero', 5, FALSE),
('Sum Rule', 'sum_rule', 'd/dx[f + g] = f\' + g\'', '\+|\-', 'The derivative of a sum is the sum of derivatives', 6, FALSE);
