-- Database Schema for Math App with Extrema Tremor Fix
-- MySQL 5.7 Compatible
-- Moodle 3.7 Integration

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE moodle;

-- ===================================================================
-- Custom Math Problems Table
-- ===================================================================

CREATE TABLE IF NOT EXISTS `math_problems` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `function_expression` VARCHAR(500) NOT NULL COMMENT 'Mathematical function expression',
    `x_min` DECIMAL(10, 4) DEFAULT -10.0000,
    `x_max` DECIMAL(10, 4) DEFAULT 10.0000,
    `y_min` DECIMAL(10, 4) DEFAULT -10.0000,
    `y_max` DECIMAL(10, 4) DEFAULT 10.0000,
    `hints` JSON DEFAULT NULL COMMENT 'Array of hint strings',
    `difficulty` ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    `topic` VARCHAR(100) DEFAULT NULL,
    `subtopic` VARCHAR(100) DEFAULT NULL,
    `course_id` INT(11) DEFAULT NULL COMMENT 'Reference to Moodle course',
    `display_order` INT(11) DEFAULT 0,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` INT(11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_course` (`course_id`),
    KEY `idx_active` (`active`),
    KEY `idx_difficulty` (`difficulty`),
    KEY `idx_topic` (`topic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Custom math problems with extrema detection';

-- ===================================================================
-- Student Sessions Table
-- ===================================================================

CREATE TABLE IF NOT EXISTS `student_sessions` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` VARCHAR(64) NOT NULL UNIQUE,
    `user_id` INT(11) NOT NULL COMMENT 'Reference to Moodle user',
    `course_id` INT(11) DEFAULT NULL,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `problems_completed` INT(11) DEFAULT 0,
    `score` INT(11) DEFAULT 0,
    `session_data` JSON DEFAULT NULL COMMENT 'Additional session metadata',
    `status` ENUM('active', 'completed', 'expired') DEFAULT 'active',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_session_id` (`session_id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_course` (`course_id`),
    KEY `idx_status` (`status`),
    KEY `idx_updated` (`last_updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student session tracking';

-- ===================================================================
-- Student Submissions Table
-- ===================================================================

CREATE TABLE IF NOT EXISTS `student_submissions` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `problem_id` INT(11) UNSIGNED NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `answer` JSON NOT NULL COMMENT 'Student answer data',
    `correct` TINYINT(1) DEFAULT 0,
    `score` DECIMAL(5, 2) DEFAULT 0.00,
    `time_spent` INT(11) DEFAULT NULL COMMENT 'Time in seconds',
    `attempt_number` INT(11) DEFAULT 1,
    `feedback` TEXT DEFAULT NULL,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_problem` (`problem_id`),
    KEY `idx_session` (`session_id`),
    KEY `idx_submitted` (`submitted_at`),
    KEY `idx_correct` (`correct`),
    FOREIGN KEY (`problem_id`) REFERENCES `math_problems`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student answer submissions';

-- ===================================================================
-- Problem Access Log Table
-- ===================================================================

CREATE TABLE IF NOT EXISTS `problem_access_log` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `problem_id` INT(11) UNSIGNED NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `accessed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_problem` (`problem_id`),
    KEY `idx_session` (`session_id`),
    KEY `idx_accessed` (`accessed_at`),
    FOREIGN KEY (`problem_id`) REFERENCES `math_problems`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track problem access for analytics';

-- ===================================================================
-- Users Table (Simplified - in production, use Moodle users)
-- ===================================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) DEFAULT NULL,
    `moodle_user_id` INT(11) DEFAULT NULL COMMENT 'Reference to Moodle user ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_email` (`email`),
    KEY `idx_moodle_user` (`moodle_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Local user table (synced with Moodle)';

-- ===================================================================
-- Insert Sample Data
-- ===================================================================

-- Sample Math Problems
INSERT INTO `math_problems`
(`title`, `description`, `function_expression`, `x_min`, `x_max`, `y_min`, `y_max`, `hints`, `difficulty`, `topic`, `subtopic`, `active`)
VALUES
('Find Extrema - Trigonometric Function',
 'Identify all local maxima and minima of the given trigonometric function within the specified range.',
 'sin(x) + 0.5 * sin(3*x)',
 -6.2832, 6.2832, -2.0, 2.0,
 '["Look for points where the derivative equals zero", "Use the second derivative test to classify extrema", "There are multiple extrema in this range"]',
 'medium',
 'Calculus',
 'Extrema Detection',
 1),

('Polynomial Extrema',
 'Find the local maximum and minimum of this cubic polynomial.',
 'x*x*x - 3*x*x - 9*x + 5',
 -5.0, 5.0, -20.0, 20.0,
 '["Take the derivative and set it to zero", "Factor the derivative if possible", "Check the second derivative to classify each critical point"]',
 'easy',
 'Calculus',
 'Polynomial Functions',
 1),

('Complex Trigonometric',
 'Analyze this complex function and identify all extrema points.',
 'cos(x) * sin(2*x)',
 -3.1416, 3.1416, -1.5, 1.5,
 '["Use the product rule for differentiation", "This function has multiple extrema", "Symmetry can help you verify your answer"]',
 'hard',
 'Calculus',
 'Advanced Functions',
 1),

('Exponential Decay with Oscillation',
 'Find extrema of this damped oscillation function.',
 'exp(-x/5) * sin(x)',
 0.0, 15.0, -1.0, 1.0,
 '["Notice the exponential decay envelope", "Extrema decrease in amplitude over time", "Use the product rule for derivatives"]',
 'hard',
 'Calculus',
 'Damped Oscillations',
 1),

('Simple Quadratic',
 'Find the vertex (extremum) of this parabola.',
 '-x*x + 4*x + 1',
 -2.0, 6.0, -5.0, 10.0,
 '["Complete the square or use derivative", "This is a downward-opening parabola", "There is exactly one extremum"]',
 'easy',
 'Algebra',
 'Quadratic Functions',
 1);

-- Sample User
INSERT INTO `users` (`username`, `email`, `full_name`, `moodle_user_id`, `active`)
VALUES
('demo_student', 'demo@example.com', 'Demo Student', 1, 1),
('test_user', 'test@example.com', 'Test User', 2, 1);

-- Sample Session
INSERT INTO `student_sessions` (`session_id`, `user_id`, `course_id`, `problems_completed`, `score`, `status`)
VALUES
('demo_session_123456789', 1, 1, 0, 0, 'active');

-- ===================================================================
-- Create Views for Analytics
-- ===================================================================

CREATE OR REPLACE VIEW `problem_statistics` AS
SELECT
    p.id,
    p.title,
    p.difficulty,
    p.topic,
    COUNT(DISTINCT s.session_id) as total_attempts,
    SUM(s.correct) as correct_submissions,
    AVG(s.score) as average_score,
    AVG(s.time_spent) as average_time_spent,
    COUNT(DISTINCT pal.session_id) as unique_views
FROM math_problems p
LEFT JOIN student_submissions s ON p.id = s.problem_id
LEFT JOIN problem_access_log pal ON p.id = pal.problem_id
WHERE p.active = 1
GROUP BY p.id;

CREATE OR REPLACE VIEW `student_progress_summary` AS
SELECT
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT ss.session_id) as total_sessions,
    SUM(ss.problems_completed) as total_problems_completed,
    SUM(ss.score) as total_score,
    COUNT(DISTINCT sub.problem_id) as unique_problems_attempted,
    SUM(sub.correct) as correct_answers,
    ROUND(100.0 * SUM(sub.correct) / NULLIF(COUNT(sub.id), 0), 2) as accuracy_percentage
FROM users u
LEFT JOIN student_sessions ss ON u.id = ss.user_id
LEFT JOIN student_submissions sub ON ss.session_id = sub.session_id
WHERE u.active = 1
GROUP BY u.id;

-- ===================================================================
-- Indexes for Performance Optimization
-- ===================================================================

-- Add composite indexes for common queries
ALTER TABLE student_submissions
ADD INDEX `idx_session_problem` (`session_id`, `problem_id`);

ALTER TABLE problem_access_log
ADD INDEX `idx_session_problem_time` (`session_id`, `problem_id`, `accessed_at`);

-- ===================================================================
-- Stored Procedures
-- ===================================================================

DELIMITER //

-- Get problem with statistics
CREATE PROCEDURE `get_problem_with_stats`(IN prob_id INT)
BEGIN
    SELECT
        p.*,
        ps.total_attempts,
        ps.correct_submissions,
        ps.average_score
    FROM math_problems p
    LEFT JOIN problem_statistics ps ON p.id = ps.id
    WHERE p.id = prob_id AND p.active = 1;
END//

-- Update session progress
CREATE PROCEDURE `update_session_progress`(
    IN sess_id VARCHAR(64),
    IN is_correct TINYINT(1),
    IN points INT
)
BEGIN
    UPDATE student_sessions
    SET
        problems_completed = problems_completed + 1,
        score = score + points,
        last_updated = CURRENT_TIMESTAMP
    WHERE session_id = sess_id;
END//

DELIMITER ;

-- ===================================================================
-- Triggers
-- ===================================================================

DELIMITER //

-- Auto-update session when submission is made
CREATE TRIGGER `after_submission_insert`
AFTER INSERT ON `student_submissions`
FOR EACH ROW
BEGIN
    UPDATE student_sessions
    SET
        last_updated = CURRENT_TIMESTAMP,
        problems_completed = problems_completed + 1,
        score = score + NEW.score
    WHERE session_id = NEW.session_id;
END//

DELIMITER ;

-- ===================================================================
-- Grants (adjust as needed for your environment)
-- ===================================================================

-- GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ===================================================================
-- End of Schema
-- ===================================================================
