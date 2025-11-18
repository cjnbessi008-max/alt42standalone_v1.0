-- Step Simplifier Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Problems table: Stores equation problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    equation_text VARCHAR(500) NOT NULL,
    difficulty_level ENUM('easy', 'medium', hard') NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solution steps table: Stores step-by-step solutions
CREATE TABLE IF NOT EXISTS solution_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    step_number INT NOT NULL,
    step_description TEXT NOT NULL,
    step_equation VARCHAR(500) NOT NULL,
    step_type ENUM('simplify', 'combine', 'isolate', 'solve', 'verify') NOT NULL,
    hint_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_step (problem_id, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table: Stores student information
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User progress table: Tracks overall progress
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    current_step INT NOT NULL DEFAULT 1,
    total_steps INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_progress (user_id, completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User attempts table: Records each step attempt
CREATE TABLE IF NOT EXISTS user_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    step_id INT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    attempts_count INT DEFAULT 1,
    time_spent INT COMMENT 'Time in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES solution_steps(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, problem_id, step_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle integration log table: Tracks sync status
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('problem', 'user', 'grade') NOT NULL,
    moodle_id INT NOT NULL,
    status ENUM('success', 'failed', 'pending') NOT NULL,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_status (sync_type, status, synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (moodle_question_id, equation_text, difficulty_level) VALUES
(1001, '3x + 12 = 27', 'easy'),
(1002, '2(x - 5) + 4 = 18', 'medium'),
(1003, '5x - 3(2x + 1) = 4x - 15', 'hard');

-- Insert solution steps for sample problem 1
INSERT INTO solution_steps (problem_id, step_number, step_description, step_equation, step_type, hint_text) VALUES
(1, 1, 'Subtract 12 from both sides', '3x + 12 - 12 = 27 - 12', 'isolate', 'To isolate x, first remove the constant term'),
(1, 2, 'Simplify', '3x = 15', 'simplify', 'Combine like terms'),
(1, 3, 'Divide both sides by 3', '3x ÷ 3 = 15 ÷ 3', 'solve', 'Isolate the variable by dividing'),
(1, 4, 'Solution', 'x = 5', 'verify', 'Check your answer by substituting back');

-- Insert solution steps for sample problem 2
INSERT INTO solution_steps (problem_id, step_number, step_description, step_equation, step_type, hint_text) VALUES
(2, 1, 'Distribute 2 into (x - 5)', '2x - 10 + 4 = 18', 'simplify', 'Use the distributive property'),
(2, 2, 'Combine like terms', '2x - 6 = 18', 'combine', 'Add -10 and 4'),
(2, 3, 'Add 6 to both sides', '2x - 6 + 6 = 18 + 6', 'isolate', 'Isolate the variable term'),
(2, 4, 'Simplify', '2x = 24', 'simplify', 'Combine like terms'),
(2, 5, 'Divide both sides by 2', '2x ÷ 2 = 24 ÷ 2', 'solve', 'Solve for x'),
(2, 6, 'Solution', 'x = 12', 'verify', 'Verify by substituting x = 12 into the original equation');
