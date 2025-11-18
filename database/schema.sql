-- Dynamic Tree Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS dynamic_tree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dynamic_tree;

-- Problems table (from Moodle)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    moodle_question_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tree_config JSON,
    problem_type ENUM('probability_tree', 'combination_tree', 'decision_tree', 'factorization_tree') DEFAULT 'probability_tree',
    difficulty_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_problem_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tree nodes table
CREATE TABLE IF NOT EXISTS tree_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    node_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    parent_key VARCHAR(100),
    probability DECIMAL(10, 6),
    value VARCHAR(255),
    level INT NOT NULL DEFAULT 0,
    position_x DECIMAL(10, 2),
    position_y DECIMAL(10, 2),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_nodes (problem_id),
    INDEX idx_parent (parent_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    student_name VARCHAR(255),
    answer JSON,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT,
    tree_interaction_log JSON,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_problem (moodle_user_id, problem_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    mastery_level DECIMAL(5, 2) DEFAULT 0.00,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem (moodle_user_id, problem_id),
    INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calculation results cache
CREATE TABLE IF NOT EXISTS calculation_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    result JSON,
    calculation_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_calculation (problem_id, input_hash),
    INDEX idx_calc_type (calculation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle sync log
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('pull_problems', 'push_results', 'user_sync') NOT NULL,
    moodle_entity_id INT,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    request_data JSON,
    response_data JSON,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_status (status),
    INDEX idx_sync_type (sync_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
