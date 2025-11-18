-- Alternative Solutions Database Schema
-- MySQL 5.7+
-- Character Set: utf8mb4

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Users table (teachers and students)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('teacher','student','admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activities table
CREATE TABLE IF NOT EXISTS `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `problem_text` text NOT NULL,
  `min_steps` int(11) NOT NULL DEFAULT '3',
  `min_alternatives` int(11) NOT NULL DEFAULT '2',
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `access_code` varchar(20) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `status` (`status`),
  KEY `access_code` (`access_code`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Steps table
CREATE TABLE IF NOT EXISTS `steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) NOT NULL,
  `step_number` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `hint_text` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_step` (`activity_id`,`step_number`),
  CONSTRAINT `steps_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student enrollments
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_user` (`activity_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts for each step
CREATE TABLE IF NOT EXISTS `attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `step_id` int(11) NOT NULL,
  `selected_approach` text NOT NULL,
  `solution` text NOT NULL,
  `confidence_level` int(11) NOT NULL CHECK (`confidence_level` >= 1 AND `confidence_level` <= 5),
  `time_spent_seconds` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_step` (`user_id`,`step_id`),
  KEY `activity_id` (`activity_id`),
  KEY `step_id` (`step_id`),
  CONSTRAINT `attempts_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attempts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attempts_ibfk_3` FOREIGN KEY (`step_id`) REFERENCES `steps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alternative approaches explored
CREATE TABLE IF NOT EXISTS `alternatives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attempt_id` int(11) NOT NULL,
  `alternative_number` int(11) NOT NULL,
  `description` text NOT NULL,
  `reasoning` text,
  `is_selected` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attempt_id` (`attempt_id`),
  CONSTRAINT `alternatives_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student reflections
CREATE TABLE IF NOT EXISTS `reflections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `most_effective` text,
  `what_learned` text,
  `would_change` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_user` (`activity_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reflections_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reflections_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (optional - for database session storage)
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `payload` text NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - change this!)
INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`, `is_active`)
VALUES
  ('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin', 1),
  ('teacher1', 'teacher@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sample Teacher', 'teacher', 1),
  ('student1', 'student@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sample Student', 'student', 1);

-- Create indexes for better performance
CREATE INDEX idx_activities_teacher_status ON activities(teacher_id, status);
CREATE INDEX idx_attempts_user_activity ON attempts(user_id, activity_id);
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);

SET foreign_key_checks = 1;

-- Sample activity for testing
INSERT INTO `activities` (`teacher_id`, `title`, `description`, `problem_text`, `min_steps`, `min_alternatives`, `is_public`, `status`)
VALUES
  (2, '분수의 덧셈 - 다양한 접근법', '3학년을 위한 분수 덧셈 학습', '민수는 피자 3/4를 가지고 있고, 지영이는 피자 2/3를 가지고 있습니다. 두 사람이 가진 피자를 합치면 몇 판이 될까요?', 4, 2, 1, 'published');

-- Sample steps
INSERT INTO `steps` (`activity_id`, `step_number`, `title`, `description`, `hint_text`)
VALUES
  (1, 1, '문제 이해하기', '주어진 정보를 정리하고 구해야 할 것을 명확히 합니다.', '주어진 것과 구할 것을 각각 나열해보세요.'),
  (1, 2, '풀이 전략 세우기', '문제를 해결하기 위한 여러 전략을 생각해봅니다.', '분수를 더하는 방법에는 어떤 것들이 있을까요?'),
  (1, 3, '계산 실행하기', '선택한 전략으로 실제 계산을 수행합니다.', '각 단계를 자세히 기록하세요.'),
  (1, 4, '답 검증하기', '답이 합리적인지 확인하고 다른 방법으로도 검증해봅니다.', '답이 1보다 크다는 것이 맞나요?');

-- Enable event scheduler (for cleanup tasks)
SET GLOBAL event_scheduler = ON;

-- Create event to clean old sessions (run daily)
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_old_sessions
ON SCHEDULE EVERY 1 DAY
DO BEGIN
  DELETE FROM sessions WHERE last_activity < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
END$$
DELIMITER ;

-- Success message
SELECT 'Database schema created successfully!' AS status;
SELECT CONCAT('Default users created:
  - Admin: admin / admin123
  - Teacher: teacher1 / admin123
  - Student: student1 / admin123

IMPORTANT: Change these passwords immediately!') AS credentials;
