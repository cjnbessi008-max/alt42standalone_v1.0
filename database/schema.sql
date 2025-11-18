-- MySQL 5.7 Database Schema for Incorrect Solutions Comparison System
-- Compatible with Moodle 3.7

-- Main problems table
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100) DEFAULT 'mathematics',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    grade_level VARCHAR(50),
    problem_data JSON COMMENT 'Problem details, equations, values',
    moodle_course_id INT DEFAULT NULL,
    moodle_activity_id INT DEFAULT NULL,
    created_by INT DEFAULT NULL COMMENT 'Teacher ID from Moodle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_subject (subject),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solutions table (both correct and incorrect)
CREATE TABLE IF NOT EXISTS solutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    solution_type ENUM('correct', 'incorrect') NOT NULL,
    title VARCHAR(255) NOT NULL,
    steps JSON NOT NULL COMMENT 'Step-by-step solution process',
    final_answer VARCHAR(255) NOT NULL,
    mistake_type VARCHAR(100) DEFAULT NULL COMMENT 'Type of error: calculation, conceptual, procedural',
    mistake_description TEXT DEFAULT NULL COMMENT 'What makes this incorrect',
    explanation TEXT COMMENT 'Detailed explanation of why this is right/wrong',
    generated_by ENUM('ai', 'teacher', 'manual') DEFAULT 'ai',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_type (problem_id, solution_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts and comparisons
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL COMMENT 'Moodle user ID',
    correct_solution_id INT NOT NULL,
    incorrect_solution_id INT NOT NULL,
    selected_solution_id INT NOT NULL COMMENT 'Which solution student chose',
    is_correct TINYINT(1) NOT NULL COMMENT 'Did student identify correct solution',
    reasoning TEXT COMMENT 'Student explanation of their choice',
    time_spent_seconds INT DEFAULT NULL,
    attempt_number INT DEFAULT 1,
    hints_used INT DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_solution_id) REFERENCES solutions(id),
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mistake patterns catalog (for AI generation)
CREATE TABLE IF NOT EXISTS mistake_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL COMMENT 'calculation, algebra, geometry, etc',
    description TEXT NOT NULL,
    example_mistake TEXT,
    frequency ENUM('common', 'occasional', 'rare') DEFAULT 'common',
    grade_level_min INT DEFAULT 1,
    grade_level_max INT DEFAULT 12,
    pattern_rules JSON COMMENT 'Rules for generating this type of mistake',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_frequency (frequency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress and analytics
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_identifications INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    average_time_seconds INT DEFAULT 0,
    mistake_types_identified JSON COMMENT 'Which types of mistakes student can identify',
    weak_areas JSON COMMENT 'Areas needing improvement',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student (student_id),
    INDEX idx_accuracy (accuracy_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle integration logs
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_id INT NOT NULL,
    grade_sent DECIMAL(5,2),
    moodle_response TEXT,
    sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES student_attempts(id),
    INDEX idx_status (sync_status),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common mistake patterns
INSERT INTO mistake_patterns (pattern_name, category, description, example_mistake, frequency, grade_level_min, grade_level_max, pattern_rules) VALUES
('Sign Error', 'algebra', 'Incorrect handling of negative signs', 'Using -3 + 5 = -8 instead of 2', 'common', 6, 12, '{"rule": "flip_sign", "probability": 0.7}'),
('Order of Operations', 'arithmetic', 'Not following PEMDAS/BODMAS correctly', 'Calculating 2 + 3 × 4 = 20 instead of 14', 'common', 5, 10, '{"rule": "left_to_right_only", "probability": 0.6}'),
('Division by Zero', 'algebra', 'Attempting to divide by zero', 'Simplifying x/0 as if valid', 'occasional', 7, 12, '{"rule": "ignore_zero_denominator", "probability": 0.4}'),
('Fraction Addition', 'fractions', 'Adding numerators and denominators separately', '1/2 + 1/3 = 2/5 instead of 5/6', 'common', 4, 8, '{"rule": "add_across", "probability": 0.8}'),
('Exponent Distribution', 'algebra', 'Incorrectly distributing exponents', '(a + b)² = a² + b² instead of a² + 2ab + b²', 'common', 8, 12, '{"rule": "distribute_exponent", "probability": 0.7}'),
('Square Root of Negative', 'algebra', 'Treating square root of negative as positive', '√(-4) = 2 instead of 2i', 'occasional', 9, 12, '{"rule": "ignore_negative", "probability": 0.5}');
