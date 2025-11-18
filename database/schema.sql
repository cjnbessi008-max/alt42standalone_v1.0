-- Dot Collector Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Drop tables if exist (for clean reinstall)
DROP TABLE IF EXISTS `dot_accumulations`;
DROP TABLE IF EXISTS `student_attempts`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `sessions`;

-- Sessions table: Track user sessions
CREATE TABLE `sessions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `moodle_user_id` INT(11) NOT NULL,
    `moodle_course_id` INT(11) NOT NULL,
    `session_token` VARCHAR(255) NOT NULL,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `session_token` (`session_token`),
    KEY `idx_user_id` (`moodle_user_id`),
    KEY `idx_course_id` (`moodle_course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions table: Store area calculation problems from Moodle
CREATE TABLE `questions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `moodle_question_id` INT(11) NOT NULL,
    `moodle_quiz_id` INT(11) DEFAULT NULL,
    `question_type` VARCHAR(50) DEFAULT 'area_calculation',
    `question_text` TEXT NOT NULL,
    `shape_type` VARCHAR(50) DEFAULT 'rectangle' COMMENT 'rectangle, triangle, circle, etc',
    `total_area` DECIMAL(10,2) NOT NULL,
    `unit` VARCHAR(20) DEFAULT 'cm²',
    `difficulty_level` TINYINT(1) DEFAULT 1 COMMENT '1-5 difficulty scale',
    `correct_answer` DECIMAL(10,2) NOT NULL,
    `metadata` JSON DEFAULT NULL COMMENT 'Additional question parameters',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_moodle_question_id` (`moodle_question_id`),
    KEY `idx_quiz_id` (`moodle_quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table: Track student answers and progress
CREATE TABLE `student_attempts` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `session_id` INT(11) NOT NULL,
    `question_id` INT(11) NOT NULL,
    `moodle_user_id` INT(11) NOT NULL,
    `student_answer` DECIMAL(10,2) DEFAULT NULL,
    `is_correct` TINYINT(1) DEFAULT 0,
    `attempt_number` TINYINT(2) DEFAULT 1,
    `time_spent_seconds` INT(11) DEFAULT 0,
    `hints_used` TINYINT(2) DEFAULT 0,
    `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_question_id` (`question_id`),
    KEY `idx_user_id` (`moodle_user_id`),
    CONSTRAINT `fk_attempts_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attempts_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dot accumulations table: Store dot visualization data for partial area accumulation
CREATE TABLE `dot_accumulations` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `attempt_id` INT(11) NOT NULL,
    `question_id` INT(11) NOT NULL,
    `moodle_user_id` INT(11) NOT NULL,
    `accumulated_area` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Current accumulated area value',
    `dot_count` INT(11) DEFAULT 0 COMMENT 'Number of dots placed',
    `dot_positions` JSON DEFAULT NULL COMMENT 'Array of {x, y, value} dot positions',
    `visualization_data` JSON DEFAULT NULL COMMENT 'Additional visualization state',
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_attempt_id` (`attempt_id`),
    KEY `idx_question_id` (`question_id`),
    KEY `idx_user_id` (`moodle_user_id`),
    CONSTRAINT `fk_dots_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `student_attempts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dots_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample question data for testing
INSERT INTO `questions` (`moodle_question_id`, `question_type`, `question_text`, `shape_type`, `total_area`, `correct_answer`, `difficulty_level`, `metadata`) VALUES
(1001, 'area_calculation', '직사각형의 넓이를 구하세요. 가로: 5cm, 세로: 3cm', 'rectangle', 15.00, 15.00, 1, '{"width": 5, "height": 3}'),
(1002, 'area_calculation', '삼각형의 넓이를 구하세요. 밑변: 8cm, 높이: 6cm', 'triangle', 24.00, 24.00, 2, '{"base": 8, "height": 6}'),
(1003, 'area_calculation', '원의 넓이를 구하세요. 반지름: 4cm (π ≈ 3.14)', 'circle', 50.24, 50.24, 3, '{"radius": 4, "pi": 3.14}');

-- Create indexes for performance
CREATE INDEX idx_attempts_completed ON student_attempts(completed_at);
CREATE INDEX idx_dots_updated ON dot_accumulations(last_updated);
