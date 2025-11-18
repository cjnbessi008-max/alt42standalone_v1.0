-- Dual Dance Standalone Web App - Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-01-18

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `attempts`;
DROP TABLE IF EXISTS `grades`;
DROP TABLE IF EXISTS `problems`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `users`;

-- Users table
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  `settings` JSON DEFAULT NULL COMMENT 'User preferences: difficulty, animation_speed, etc.',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User accounts';

-- Problems table
CREATE TABLE `problems` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL COMMENT 'NULL for system-generated problems',
  `problem_type` ENUM('exponential', 'logarithmic', 'intersection') NOT NULL,
  `exp_base` DECIMAL(10,2) NOT NULL,
  `log_base` DECIMAL(10,2) NOT NULL,
  `exp_coefficient` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `log_coefficient` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `question_text` TEXT NOT NULL,
  `answer` DECIMAL(15,4) NOT NULL,
  `tolerance` DECIMAL(10,4) NOT NULL DEFAULT 0.0100,
  `difficulty` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-5 difficulty level',
  `metadata` JSON DEFAULT NULL COMMENT 'Additional problem data',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_problem_type` (`problem_type`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_problems_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Generated math problems';

-- Attempts table
CREATE TABLE `attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `problem_id` INT UNSIGNED NOT NULL,
  `answer` DECIMAL(15,4) NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `time_spent` INT UNSIGNED NOT NULL COMMENT 'Time in seconds',
  `interaction_data` JSON DEFAULT NULL COMMENT 'Canvas interaction data, animation state, etc.',
  `grade` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Score 0-100',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_problem_id` (`problem_id`),
  KEY `idx_is_correct` (`is_correct`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_attempts_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attempts_problem` FOREIGN KEY (`problem_id`)
    REFERENCES `problems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student attempt records';

-- Grades table (aggregated statistics)
CREATE TABLE `grades` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `total_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `correct_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `average_grade` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_time` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total time in seconds',
  `best_streak` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Best consecutive correct answers',
  `current_streak` INT UNSIGNED NOT NULL DEFAULT 0,
  `level` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'User level based on performance',
  `experience_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'XP for gamification',
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_average_grade` (`average_grade`),
  KEY `idx_level` (`level`),
  CONSTRAINT `fk_grades_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User performance statistics';

-- Sessions table (optional - for database-backed sessions)
CREATE TABLE `sessions` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `data` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_last_activity` (`last_activity`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User session data';

-- Create trigger to update grades table after each attempt
DELIMITER $$

CREATE TRIGGER `after_attempt_insert` AFTER INSERT ON `attempts`
FOR EACH ROW
BEGIN
  INSERT INTO `grades` (
    `user_id`,
    `total_attempts`,
    `correct_attempts`,
    `average_grade`,
    `total_time`,
    `current_streak`
  )
  VALUES (
    NEW.user_id,
    1,
    IF(NEW.is_correct = 1, 1, 0),
    NEW.grade,
    NEW.time_spent,
    IF(NEW.is_correct = 1, 1, 0)
  )
  ON DUPLICATE KEY UPDATE
    `total_attempts` = `total_attempts` + 1,
    `correct_attempts` = `correct_attempts` + IF(NEW.is_correct = 1, 1, 0),
    `average_grade` = (
      (`average_grade` * `total_attempts` + NEW.grade) / (`total_attempts` + 1)
    ),
    `total_time` = `total_time` + NEW.time_spent,
    `current_streak` = IF(NEW.is_correct = 1, `current_streak` + 1, 0),
    `best_streak` = GREATEST(`best_streak`, IF(NEW.is_correct = 1, `current_streak` + 1, 0)),
    `experience_points` = `experience_points` + FLOOR(NEW.grade),
    `level` = FLOOR(`experience_points` / 1000) + 1;
END$$

DELIMITER ;

-- Create views for common queries

-- User statistics view
CREATE OR REPLACE VIEW `v_user_stats` AS
SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u.role,
  COALESCE(g.total_attempts, 0) AS total_attempts,
  COALESCE(g.correct_attempts, 0) AS correct_attempts,
  COALESCE(g.average_grade, 0) AS average_grade,
  COALESCE(g.total_time, 0) AS total_time,
  COALESCE(g.best_streak, 0) AS best_streak,
  COALESCE(g.current_streak, 0) AS current_streak,
  COALESCE(g.level, 1) AS level,
  COALESCE(g.experience_points, 0) AS experience_points,
  CASE
    WHEN g.total_attempts > 0 THEN ROUND((g.correct_attempts / g.total_attempts) * 100, 2)
    ELSE 0
  END AS accuracy_percentage,
  u.created_at AS joined_at,
  u.last_login
FROM users u
LEFT JOIN grades g ON u.id = g.user_id
WHERE u.is_active = 1;

-- Leaderboard view
CREATE OR REPLACE VIEW `v_leaderboard` AS
SELECT
  u.id,
  u.username,
  g.level,
  g.experience_points,
  g.average_grade,
  g.total_attempts,
  g.correct_attempts,
  g.best_streak,
  CASE
    WHEN g.total_attempts > 0 THEN ROUND((g.correct_attempts / g.total_attempts) * 100, 2)
    ELSE 0
  END AS accuracy_percentage
FROM users u
INNER JOIN grades g ON u.id = g.user_id
WHERE u.is_active = 1
ORDER BY g.experience_points DESC, g.average_grade DESC
LIMIT 100;

-- Recent activity view
CREATE OR REPLACE VIEW `v_recent_activity` AS
SELECT
  a.id,
  a.user_id,
  u.username,
  a.problem_id,
  p.problem_type,
  p.difficulty,
  a.is_correct,
  a.grade,
  a.time_spent,
  a.created_at
FROM attempts a
INNER JOIN users u ON a.user_id = u.id
INNER JOIN problems p ON a.problem_id = p.id
ORDER BY a.created_at DESC
LIMIT 100;

-- Insert default admin user (password: admin123)
-- Note: Change this password immediately after installation!
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`) VALUES
('admin', 'admin@dualdance.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample problems for testing
INSERT INTO `problems` (`problem_type`, `exp_base`, `log_base`, `exp_coefficient`, `log_coefficient`, `question_text`, `answer`, `tolerance`, `difficulty`) VALUES
('exponential', 2.00, 2.00, 1.00, 1.00, 'Calculate: 1.0 × 2^3', 8.0000, 0.0100, 1),
('logarithmic', 2.00, 2.00, 1.00, 1.00, 'Calculate: 1.0 × log₂(16)', 4.0000, 0.0100, 1),
('exponential', 3.00, 2.00, 1.50, 1.00, 'Calculate: 1.5 × 3^2', 13.5000, 0.0100, 2),
('logarithmic', 10.00, 10.00, 2.00, 1.00, 'Calculate: 2.0 × log₁₀(100)', 4.0000, 0.0100, 2),
('intersection', 2.00, 2.00, 1.00, 1.00, 'At what x value do these functions intersect?<br>f(x) = 1.0 × 2^x<br>g(x) = 1.0 × log₂(x)', 2.0000, 0.1000, 3);
