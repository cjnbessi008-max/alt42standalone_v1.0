-- Shift Trail Web App Database Schema
-- MySQL 5.7 Compatible
--
-- Purpose: Store problems, student interactions, vector trails, and Moodle integration data

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================
-- Table: moodle_users
-- Synced from Moodle LMS user data
-- =====================================================
CREATE TABLE IF NOT EXISTS `moodle_users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` INT(11) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_moodle_user` (`moodle_user_id`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: problems
-- Math problems from Moodle containing vector exercises
-- =====================================================
CREATE TABLE IF NOT EXISTS `problems` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_problem_id` INT(11) NOT NULL,
  `moodle_course_id` INT(11),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `problem_type` ENUM('vector_translation', 'vector_addition', 'vector_subtraction', 'vector_rotation') DEFAULT 'vector_translation',
  `difficulty_level` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `initial_vector` JSON COMMENT 'Starting vector coordinates {x1, y1, x2, y2}',
  `target_vector` JSON COMMENT 'Target vector coordinates (for validation)',
  `grid_size` INT(11) DEFAULT 20 COMMENT 'Grid unit size',
  `max_attempts` INT(11) DEFAULT 3,
  `time_limit` INT(11) COMMENT 'Time limit in seconds',
  `points` INT(11) DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_moodle_problem` (`moodle_problem_id`),
  KEY `idx_problem_type` (`problem_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: trails
-- Records of vector translation trails created by students
-- =====================================================
CREATE TABLE IF NOT EXISTS `trails` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `problem_id` INT(11) NOT NULL,
  `student_id` INT(11) NOT NULL,
  `session_id` VARCHAR(100) COMMENT 'Browser session identifier',

  -- Vector start and end positions
  `vector_start_x` DECIMAL(10,2) NOT NULL,
  `vector_start_y` DECIMAL(10,2) NOT NULL,
  `vector_end_x` DECIMAL(10,2) NOT NULL,
  `vector_end_y` DECIMAL(10,2) NOT NULL,

  -- Trail visualization data
  `trail_points` JSON COMMENT 'Array of {x, y, timestamp} points showing the complete trail path',
  `trail_color` VARCHAR(20) DEFAULT '#3498db' COMMENT 'Trail line color',
  `trail_width` INT(11) DEFAULT 3 COMMENT 'Trail line width in pixels',

  -- Translation metrics
  `translation_vector` JSON COMMENT 'Translation vector {dx, dy}',
  `translation_distance` DECIMAL(10,2) COMMENT 'Euclidean distance of translation',
  `translation_angle` DECIMAL(10,2) COMMENT 'Angle of translation in degrees',

  -- Animation data
  `animation_duration` INT(11) DEFAULT 1000 COMMENT 'Animation duration in milliseconds',
  `animation_easing` VARCHAR(50) DEFAULT 'ease-in-out',

  -- Submission data
  `is_correct` TINYINT(1) DEFAULT 0,
  `is_submitted` TINYINT(1) DEFAULT 0,
  `score` DECIMAL(5,2),
  `feedback` TEXT,

  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,

  PRIMARY KEY (`id`),
  KEY `idx_problem` (`problem_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_trail_problem` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trail_student` FOREIGN KEY (`student_id`) REFERENCES `moodle_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: trail_interactions
-- Detailed interaction logs during trail creation
-- =====================================================
CREATE TABLE IF NOT EXISTS `trail_interactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `trail_id` INT(11) NOT NULL,
  `interaction_type` ENUM('start_drag', 'drag_move', 'end_drag', 'click', 'rotate', 'scale', 'reset', 'animate') NOT NULL,
  `position_x` DECIMAL(10,2),
  `position_y` DECIMAL(10,2),
  `user_input` JSON COMMENT 'Additional interaction data',
  `timestamp` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'High precision timestamp',

  PRIMARY KEY (`id`),
  KEY `idx_trail` (`trail_id`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_interaction_trail` FOREIGN KEY (`trail_id`) REFERENCES `trails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: submissions
-- Student problem submissions (synced back to Moodle)
-- =====================================================
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `problem_id` INT(11) NOT NULL,
  `student_id` INT(11) NOT NULL,
  `trail_id` INT(11) COMMENT 'Associated trail if applicable',
  `attempt_number` INT(11) DEFAULT 1,
  `answer_data` JSON COMMENT 'Student answer in structured format',
  `is_correct` TINYINT(1) DEFAULT 0,
  `score` DECIMAL(5,2),
  `max_score` DECIMAL(5,2),
  `feedback` TEXT,
  `time_spent` INT(11) COMMENT 'Time spent in seconds',
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `synced_to_moodle` TINYINT(1) DEFAULT 0,
  `moodle_submission_id` INT(11),

  PRIMARY KEY (`id`),
  KEY `idx_problem` (`problem_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_trail` (`trail_id`),
  KEY `idx_submitted_at` (`submitted_at`),
  CONSTRAINT `fk_submission_problem` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_student` FOREIGN KEY (`student_id`) REFERENCES `moodle_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submission_trail` FOREIGN KEY (`trail_id`) REFERENCES `trails` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: sessions
-- Track student learning sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(100) NOT NULL,
  `student_id` INT(11),
  `moodle_course_id` INT(11),
  `lti_launch_id` VARCHAR(255) COMMENT 'LTI launch identifier',
  `user_agent` VARCHAR(500),
  `ip_address` VARCHAR(45),
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session` (`session_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_started_at` (`started_at`),
  CONSTRAINT `fk_session_student` FOREIGN KEY (`student_id`) REFERENCES `moodle_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: app_settings
-- Application configuration and settings
-- =====================================================
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT,
  `setting_type` ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert default settings
-- =====================================================
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('trail_default_color', '#3498db', 'string', 'Default trail line color'),
('trail_default_width', '3', 'integer', 'Default trail line width in pixels'),
('trail_animation_duration', '1000', 'integer', 'Default animation duration in ms'),
('enable_trail_recording', 'true', 'boolean', 'Enable detailed trail interaction recording'),
('grid_size', '20', 'integer', 'Default grid unit size'),
('smartphone_width', '375', 'integer', 'Virtual smartphone display width in pixels'),
('smartphone_height', '667', 'integer', 'Virtual smartphone display height in pixels');
