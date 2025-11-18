-- Slope Sound Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7

-- Table for storing function problems
CREATE TABLE IF NOT EXISTS `mdl_slopesound_problems` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `moodle_quiz_id` BIGINT(10) UNSIGNED DEFAULT NULL,
  `moodle_question_id` BIGINT(10) UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `function_expression` TEXT NOT NULL COMMENT 'Mathematical function (e.g., x^2, sin(x))',
  `x_min` DECIMAL(10,2) NOT NULL DEFAULT -10.00,
  `x_max` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `difficulty_level` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Easy, 2=Medium, 3=Hard',
  `sound_mapping_type` VARCHAR(50) NOT NULL DEFAULT 'pitch' COMMENT 'pitch, volume, frequency',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_moodle_quiz` (`moodle_quiz_id`),
  KEY `idx_moodle_question` (`moodle_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores derivative problems for Slope Sound';

-- Table for storing user progress and attempts
CREATE TABLE IF NOT EXISTS `mdl_slopesound_attempts` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `problem_id` BIGINT(10) UNSIGNED NOT NULL,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `moodle_attempt_id` BIGINT(10) UNSIGNED DEFAULT NULL,
  `points_explored` TEXT COMMENT 'JSON array of x values explored by student',
  `time_spent` INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Time in seconds',
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `score` DECIMAL(5,2) DEFAULT NULL,
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_problem` (`problem_id`),
  KEY `idx_user` (`userid`),
  KEY `idx_moodle_attempt` (`moodle_attempt_id`),
  CONSTRAINT `fk_slopesound_problem` FOREIGN KEY (`problem_id`)
    REFERENCES `mdl_slopesound_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks student attempts and progress';

-- Table for storing audio playback events (analytics)
CREATE TABLE IF NOT EXISTS `mdl_slopesound_audio_events` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `attempt_id` BIGINT(10) UNSIGNED NOT NULL,
  `x_value` DECIMAL(10,4) NOT NULL,
  `slope_value` DECIMAL(10,4) NOT NULL,
  `frequency_hz` INT(10) UNSIGNED NOT NULL,
  `duration_ms` INT(10) UNSIGNED NOT NULL DEFAULT 200,
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attempt` (`attempt_id`),
  CONSTRAINT `fk_slopesound_attempt` FOREIGN KEY (`attempt_id`)
    REFERENCES `mdl_slopesound_attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Logs audio playback events for analytics';

-- Insert sample problems
INSERT INTO `mdl_slopesound_problems`
  (`title`, `function_expression`, `x_min`, `x_max`, `difficulty_level`, `sound_mapping_type`, `timecreated`, `timemodified`)
VALUES
  ('Basic Quadratic', 'x^2', -5.00, 5.00, 1, 'pitch', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  ('Cubic Function', 'x^3 - 3*x', -3.00, 3.00, 2, 'pitch', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  ('Sine Wave', 'sin(x)', -6.28, 6.28, 1, 'pitch', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  ('Exponential', 'exp(x/2)', -4.00, 4.00, 3, 'pitch', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  ('Polynomial', '0.1*x^3 - 0.5*x^2 + 2*x', -5.00, 10.00, 2, 'pitch', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
