-- Color Pattern Classifier Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Table: Problems from Moodle
CREATE TABLE IF NOT EXISTS `problems` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `moodle_question_id` INT(11) NOT NULL,
  `pattern_type` VARCHAR(50) NOT NULL COMMENT 'arithmetic, geometric, fibonacci, custom',
  `sequence_data` TEXT NOT NULL COMMENT 'JSON array of sequence numbers',
  `color_mapping` TEXT NOT NULL COMMENT 'JSON object mapping pattern to color',
  `difficulty_level` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1-5 difficulty scale',
  `correct_answer` TEXT NOT NULL COMMENT 'JSON array of correct color classifications',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_moodle_question_id` (`moodle_question_id`),
  KEY `idx_pattern_type` (`pattern_type`),
  KEY `idx_difficulty_level` (`difficulty_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Pattern classification problems';

-- Table: Student Progress
CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `moodle_user_id` INT(11) NOT NULL,
  `problem_id` INT(11) UNSIGNED NOT NULL,
  `student_answer` TEXT COMMENT 'JSON array of student color classifications',
  `is_correct` TINYINT(1) DEFAULT NULL,
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT 'Percentage score 0-100',
  `attempt_number` INT(11) NOT NULL DEFAULT 1,
  `time_spent_seconds` INT(11) DEFAULT NULL,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_problem` (`moodle_user_id`, `problem_id`),
  KEY `idx_problem_id` (`problem_id`),
  KEY `idx_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_progress_problem` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student attempt records';

-- Table: App Sessions
CREATE TABLE IF NOT EXISTS `app_sessions` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_token` VARCHAR(64) NOT NULL,
  `moodle_user_id` INT(11) NOT NULL,
  `moodle_course_id` INT(11) DEFAULT NULL,
  `user_name` VARCHAR(255) DEFAULT NULL,
  `user_email` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_session_token` (`session_token`),
  KEY `idx_moodle_user_id` (`moodle_user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User session management';

-- Table: Pattern Templates
CREATE TABLE IF NOT EXISTS `pattern_templates` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `pattern_type` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `rule_formula` VARCHAR(255) COMMENT 'Mathematical formula for pattern',
  `color_code` VARCHAR(7) NOT NULL COMMENT 'Hex color code',
  `icon_path` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT(11) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_pattern_name` (`name`),
  KEY `idx_pattern_type` (`pattern_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Predefined pattern classification templates';

-- Table: Moodle Sync Log
CREATE TABLE IF NOT EXISTS `moodle_sync_log` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sync_type` VARCHAR(50) NOT NULL COMMENT 'problem_fetch, grade_submit, user_auth',
  `moodle_endpoint` VARCHAR(255) NOT NULL,
  `request_data` TEXT,
  `response_data` TEXT,
  `status_code` INT(11) DEFAULT NULL,
  `is_success` TINYINT(1) NOT NULL DEFAULT 0,
  `error_message` TEXT,
  `sync_duration_ms` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_success` (`is_success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle API integration audit log';

-- Insert default pattern templates
INSERT INTO `pattern_templates` (`name`, `pattern_type`, `description`, `rule_formula`, `color_code`, `display_order`) VALUES
('Arithmetic Sequence', 'arithmetic', 'Constant difference between consecutive terms', 'a(n) = a(1) + (n-1)d', '#FF6B6B', 1),
('Geometric Sequence', 'geometric', 'Constant ratio between consecutive terms', 'a(n) = a(1) * r^(n-1)', '#4ECDC4', 2),
('Fibonacci Sequence', 'fibonacci', 'Each term is sum of previous two terms', 'a(n) = a(n-1) + a(n-2)', '#FFE66D', 3),
('Square Numbers', 'quadratic', 'Perfect squares sequence', 'a(n) = n^2', '#A8E6CF', 4),
('Prime Numbers', 'prime', 'Numbers divisible only by 1 and itself', 'prime(n)', '#FF8B94', 5),
('Powers of 2', 'exponential', 'Powers of two sequence', 'a(n) = 2^n', '#C7CEEA', 6);
