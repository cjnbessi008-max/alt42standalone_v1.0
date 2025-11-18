-- Inverse Reflection Module Database Schema
-- Compatible with MySQL 5.7

-- Table for storing inverse function problems
CREATE TABLE IF NOT EXISTS inverse_reflection_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    function_type VARCHAR(50) NOT NULL COMMENT 'linear, quadratic, exponential, etc.',
    original_function TEXT NOT NULL COMMENT 'f(x) expression',
    inverse_function TEXT NOT NULL COMMENT 'f^-1(x) expression',
    domain_min DECIMAL(10,2) DEFAULT -10,
    domain_max DECIMAL(10,2) DEFAULT 10,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    hints JSON COMMENT 'Step-by-step hints in JSON format',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores inverse function problems';

-- Table for student attempts and progress
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Moodle user ID',
    problem_id INT NOT NULL,
    attempted_inverse TEXT COMMENT 'Student submitted inverse function',
    is_correct BOOLEAN DEFAULT FALSE,
    points_reflected INT DEFAULT 0 COMMENT 'Number of points correctly reflected',
    time_spent_seconds INT DEFAULT 0,
    interaction_data JSON COMMENT 'Visualization interaction logs',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES inverse_reflection_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_attempt_time (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks student attempts and interactions';

-- Table for visualization settings
CREATE TABLE IF NOT EXISTS visualization_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    show_grid BOOLEAN DEFAULT TRUE,
    show_reflection_line BOOLEAN DEFAULT TRUE COMMENT 'Show y=x line',
    animation_speed ENUM('slow', 'medium', 'fast') DEFAULT 'medium',
    color_original VARCHAR(7) DEFAULT '#2196F3' COMMENT 'Color for f(x)',
    color_inverse VARCHAR(7) DEFAULT '#F44336' COMMENT 'Color for f^-1(x)',
    color_reflection_line VARCHAR(7) DEFAULT '#4CAF50' COMMENT 'Color for y=x',
    enable_interactive_points BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (problem_id) REFERENCES inverse_reflection_problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Visualization customization settings';

-- Sample data for testing
INSERT INTO inverse_reflection_problems
    (moodle_question_id, function_type, original_function, inverse_function, domain_min, domain_max, difficulty_level, hints)
VALUES
    (1, 'linear', '2*x + 3', '(x - 3) / 2', -5, 5, 'easy',
     '["Step 1: Replace f(x) with y", "Step 2: Swap x and y", "Step 3: Solve for y"]'),
    (2, 'quadratic', 'x^2', 'sqrt(x)', 0, 10, 'medium',
     '["Restriction: Domain must be non-negative", "y = x^2, swap to get x = y^2", "Solve: y = sqrt(x)"]'),
    (3, 'exponential', '2^x', 'log2(x)', -3, 3, 'hard',
     '["Use logarithms to find inverse", "y = 2^x becomes x = 2^y", "Apply log base 2 to both sides"]');

INSERT INTO visualization_settings (problem_id, show_grid, show_reflection_line, animation_speed)
VALUES
    (1, TRUE, TRUE, 'medium'),
    (2, TRUE, TRUE, 'medium'),
    (3, TRUE, TRUE, 'slow');
