-- Higher Derivative Lines Database Schema
-- MySQL 5.7 Compatible
-- For Moodle 3.7 Integration

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodle;

-- ============================================================================
-- Derivative Functions Table
-- Stores mathematical functions for derivative exercises
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_derivative_functions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL DEFAULT 0,
    function_expression TEXT NOT NULL,
    function_description VARCHAR(255) DEFAULT NULL,
    max_derivative_order INT(2) NOT NULL DEFAULT 3,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'general',
    domain_min DECIMAL(10,2) DEFAULT -10.00,
    domain_max DECIMAL(10,2) DEFAULT 10.00,
    created_by BIGINT(10) UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_course_id (course_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores derivative function exercises';

-- ============================================================================
-- Student Derivative Work Table
-- Tracks student attempts and answers
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_student_derivative_work (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    function_id BIGINT(10) UNSIGNED NOT NULL,
    derivative_order INT(2) NOT NULL,
    student_answer TEXT,
    correct_answer TEXT,
    is_correct TINYINT(1) DEFAULT 0,
    time_spent_seconds INT(10) UNSIGNED DEFAULT 0,
    attempt_number INT(5) UNSIGNED DEFAULT 1,
    score DECIMAL(5,2) DEFAULT 0.00,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (function_id) REFERENCES mdl_derivative_functions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_function_id (function_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_user_function (user_id, function_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student derivative work submissions';

-- ============================================================================
-- Derivative Graph Settings Table
-- User preferences for graph visualization
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_derivative_graph_settings (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    show_function TINYINT(1) DEFAULT 1,
    show_first_derivative TINYINT(1) DEFAULT 1,
    show_second_derivative TINYINT(1) DEFAULT 1,
    show_third_derivative TINYINT(1) DEFAULT 0,
    show_fourth_derivative TINYINT(1) DEFAULT 0,
    color_scheme VARCHAR(50) DEFAULT 'professional',
    line_style_preferences JSON,
    virtual_screen_enabled TINYINT(1) DEFAULT 1,
    virtual_screen_position VARCHAR(20) DEFAULT 'bottom-right',
    virtual_screen_size VARCHAR(20) DEFAULT 'medium',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User graph display preferences';

-- ============================================================================
-- Activity Log Table
-- Tracks user interactions with the module
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_derivative_activity_log (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    question_id BIGINT(10) UNSIGNED,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User activity log';

-- ============================================================================
-- Quiz Integration Table
-- Links derivative exercises to Moodle quizzes
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_derivative_quiz_questions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    quiz_id BIGINT(10) UNSIGNED NOT NULL,
    function_id BIGINT(10) UNSIGNED NOT NULL,
    question_text TEXT NOT NULL,
    points DECIMAL(10,2) DEFAULT 1.00,
    required_orders VARCHAR(50) DEFAULT '0,1,2',
    time_limit_seconds INT(10) UNSIGNED DEFAULT 0,
    allow_multiple_attempts TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (function_id) REFERENCES mdl_derivative_functions(id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_function_id (function_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Quiz question mapping';

-- ============================================================================
-- Progress Tracking Table
-- Overall student progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_derivative_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    total_problems_attempted INT(10) UNSIGNED DEFAULT 0,
    total_problems_correct INT(10) UNSIGNED DEFAULT 0,
    total_time_spent_seconds BIGINT(20) UNSIGNED DEFAULT 0,
    highest_derivative_order INT(2) DEFAULT 0,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    last_activity_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_course (user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_proficiency (proficiency_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student progress tracking';

-- ============================================================================
-- Insert sample data
-- ============================================================================

-- Sample functions
INSERT INTO mdl_derivative_functions (course_id, function_expression, function_description, max_derivative_order, difficulty_level, category) VALUES
(1, 'x**2 + 2*x + 1', 'Simple quadratic function', 2, 'easy', 'polynomial'),
(1, 'x**3 - 3*x**2 + 2*x + 1', 'Cubic polynomial with critical points', 3, 'medium', 'polynomial'),
(1, 'sin(x)', 'Sine function - periodic derivatives', 4, 'medium', 'trigonometric'),
(1, 'exp(x)', 'Exponential function', 4, 'medium', 'exponential'),
(1, 'x**4 - 4*x**3 + 6*x**2 - 4*x + 1', 'Fourth-degree polynomial', 4, 'hard', 'polynomial'),
(1, 'cos(x)', 'Cosine function', 4, 'medium', 'trigonometric'),
(1, 'ln(x)', 'Natural logarithm', 3, 'medium', 'logarithmic'),
(1, 'x*exp(x)', 'Product of polynomial and exponential', 3, 'hard', 'mixed');

-- Sample graph settings for a test user
INSERT INTO mdl_derivative_graph_settings (user_id, color_scheme, line_style_preferences) VALUES
(1, 'professional', '{"order_0": {"color": "#2C3E50"}, "order_1": {"color": "#E74C3C"}}');

-- ============================================================================
-- Create views for reporting
-- ============================================================================

-- View: Student performance summary
CREATE OR REPLACE VIEW v_student_performance AS
SELECT
    w.user_id,
    f.function_expression,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN w.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    AVG(w.score) as average_score,
    SUM(w.time_spent_seconds) as total_time_spent
FROM mdl_student_derivative_work w
JOIN mdl_derivative_functions f ON w.function_id = f.id
GROUP BY w.user_id, f.function_expression;

-- View: Popular functions
CREATE OR REPLACE VIEW v_popular_functions AS
SELECT
    f.id,
    f.function_expression,
    f.function_description,
    f.difficulty_level,
    COUNT(DISTINCT w.user_id) as unique_users,
    COUNT(w.id) as total_attempts,
    AVG(w.score) as average_score
FROM mdl_derivative_functions f
LEFT JOIN mdl_student_derivative_work w ON f.id = w.function_id
GROUP BY f.id, f.function_expression, f.function_description, f.difficulty_level
ORDER BY total_attempts DESC;

-- ============================================================================
-- Indexes for performance optimization
-- ============================================================================

-- Composite index for common queries
CREATE INDEX idx_work_user_correct ON mdl_student_derivative_work(user_id, is_correct, submitted_at);
CREATE INDEX idx_function_difficulty_category ON mdl_derivative_functions(difficulty_level, category, course_id);

-- ============================================================================
-- Triggers for data integrity and automation
-- ============================================================================

DELIMITER $$

-- Trigger: Update progress after work submission
CREATE TRIGGER trg_update_progress_after_work
AFTER INSERT ON mdl_student_derivative_work
FOR EACH ROW
BEGIN
    INSERT INTO mdl_derivative_progress (user_id, course_id, total_problems_attempted, total_problems_correct, total_time_spent_seconds, last_activity_at)
    SELECT
        NEW.user_id,
        f.course_id,
        1,
        IF(NEW.is_correct = 1, 1, 0),
        NEW.time_spent_seconds,
        NOW()
    FROM mdl_derivative_functions f
    WHERE f.id = NEW.function_id
    ON DUPLICATE KEY UPDATE
        total_problems_attempted = total_problems_attempted + 1,
        total_problems_correct = total_problems_correct + IF(NEW.is_correct = 1, 1, 0),
        total_time_spent_seconds = total_time_spent_seconds + NEW.time_spent_seconds,
        last_activity_at = NOW();
END$$

DELIMITER ;

-- ============================================================================
-- Grant permissions (adjust as needed)
-- ============================================================================

-- For Moodle user
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle.* TO 'moodleuser'@'%';
FLUSH PRIVILEGES;

-- ============================================================================
-- Completion message
-- ============================================================================

SELECT 'Database schema created successfully!' AS status;
SELECT COUNT(*) AS sample_functions_count FROM mdl_derivative_functions;
