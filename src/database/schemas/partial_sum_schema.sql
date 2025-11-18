-- ============================================================
-- Partial Sum Flow Database Schema
-- Compatible with MySQL 5.7 and Moodle 3.7
-- ============================================================

-- Table: mdl_partialsum_problems
-- Stores partial sum problems with data arrays
-- ============================================================
CREATE TABLE IF NOT EXISTS `mdl_partialsum_problems` (
  `id` bigint(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` bigint(10) UNSIGNED NULL DEFAULT NULL COMMENT 'Reference to mdl_question.id if integrated with Moodle quiz',
  `title` varchar(255) NOT NULL COMMENT 'Problem title in Korean/English',
  `description` text NOT NULL COMMENT 'Problem description',
  `data_array` text NOT NULL COMMENT 'JSON array of numbers for partial sum calculation',
  `expected_answer` bigint(20) NOT NULL COMMENT 'Correct answer (final partial sum)',
  `difficulty_level` enum('easy','medium','hard') DEFAULT 'medium' COMMENT 'Difficulty level',
  `created_by` bigint(10) UNSIGNED NOT NULL COMMENT 'User ID of creator (teacher)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  PRIMARY KEY (`id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_deleted` (`deleted`),
  KEY `idx_difficulty` (`difficulty_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Partial sum problems for flow curve visualization';

-- ============================================================
-- Table: mdl_partialsum_attempts
-- Stores student attempts and answers
-- ============================================================
CREATE TABLE IF NOT EXISTS `mdl_partialsum_attempts` (
  `id` bigint(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` bigint(10) UNSIGNED NOT NULL COMMENT 'Reference to mdl_user.id',
  `problem_id` bigint(10) UNSIGNED NOT NULL COMMENT 'Reference to mdl_partialsum_problems.id',
  `answer` bigint(20) NOT NULL COMMENT 'Student submitted answer',
  `is_correct` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether answer is correct',
  `time_spent` int(11) DEFAULT NULL COMMENT 'Time spent in seconds',
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_problem_id` (`problem_id`),
  KEY `idx_submitted_at` (`submitted_at`),
  KEY `idx_student_problem` (`student_id`, `problem_id`),
  CONSTRAINT `fk_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `mdl_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempts_problem` FOREIGN KEY (`problem_id`) REFERENCES `mdl_partialsum_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student attempts for partial sum problems';

-- ============================================================
-- Table: mdl_partialsum_progress
-- Tracks student overall progress
-- ============================================================
CREATE TABLE IF NOT EXISTS `mdl_partialsum_progress` (
  `id` bigint(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` bigint(10) UNSIGNED NOT NULL COMMENT 'Reference to mdl_user.id',
  `total_problems_attempted` int(11) NOT NULL DEFAULT 0,
  `total_problems_correct` int(11) NOT NULL DEFAULT 0,
  `total_attempts` int(11) NOT NULL DEFAULT 0,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student_unique` (`student_id`),
  CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `mdl_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student progress tracking';

-- ============================================================
-- Table: mdl_partialsum_sessions
-- Tracks user sessions for the app
-- ============================================================
CREATE TABLE IF NOT EXISTS `mdl_partialsum_sessions` (
  `id` bigint(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` bigint(10) UNSIGNED NOT NULL COMMENT 'Reference to mdl_user.id',
  `session_token` varchar(255) NOT NULL COMMENT 'JWT session token hash',
  `device_info` varchar(255) DEFAULT NULL COMMENT 'Device information (mobile/desktop)',
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_session_token` (`session_token`),
  CONSTRAINT `fk_sessions_student` FOREIGN KEY (`student_id`) REFERENCES `mdl_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User session tracking';

-- ============================================================
-- Insert Sample Data for Testing
-- ============================================================

-- Sample problems (assuming teacher user ID 2 exists)
INSERT INTO `mdl_partialsum_problems`
  (`question_id`, `title`, `description`, `data_array`, `expected_answer`, `difficulty_level`, `created_by`)
VALUES
  (NULL, '부분합 문제 1 - 양수 배열', '다음 배열의 부분합을 계산하세요: [1, 2, 3, 4, 5]', '[1,2,3,4,5]', 15, 'easy', 2),
  (NULL, '부분합 문제 2 - 혼합 배열', '다음 배열의 부분합을 계산하세요: [5, -2, 3, -1, 4]', '[5,-2,3,-1,4]', 9, 'medium', 2),
  (NULL, '부분합 문제 3 - 큰 숫자', '다음 배열의 부분합을 계산하세요: [10, 20, 30, 40, 50]', '[10,20,30,40,50]', 150, 'easy', 2),
  (NULL, '부분합 문제 4 - 피보나치 수열', '다음 피보나치 배열의 부분합을 계산하세요: [1, 1, 2, 3, 5, 8]', '[1,1,2,3,5,8]', 20, 'medium', 2),
  (NULL, '부분합 문제 5 - 음수 포함', '다음 배열의 부분합을 계산하세요: [-5, 10, -3, 8, -2]', '[-5,10,-3,8,-2]', 8, 'hard', 2),
  (NULL, '부분합 문제 6 - 등차수열', '다음 등차수열 배열의 부분합을 계산하세요: [2, 4, 6, 8, 10]', '[2,4,6,8,10]', 30, 'easy', 2),
  (NULL, '부분합 문제 7 - 제곱수', '다음 제곱수 배열의 부분합을 계산하세요: [1, 4, 9, 16, 25]', '[1,4,9,16,25]', 55, 'medium', 2),
  (NULL, '부분합 문제 8 - 복합 배열', '다음 배열의 부분합을 계산하세요: [3, -7, 11, -4, 6, -9, 12]', '[3,-7,11,-4,6,-9,12]', 12, 'hard', 2);

-- ============================================================
-- Indexes for Performance
-- ============================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_attempts_correct_time` ON `mdl_partialsum_attempts` (`is_correct`, `submitted_at`);
CREATE INDEX `idx_problems_difficulty_deleted` ON `mdl_partialsum_problems` (`difficulty_level`, `deleted`);

-- ============================================================
-- Views for Reporting
-- ============================================================

-- View: Student performance summary
CREATE OR REPLACE VIEW `v_student_performance` AS
SELECT
  u.id AS student_id,
  u.username,
  CONCAT(u.firstname, ' ', u.lastname) AS fullname,
  COUNT(DISTINCT a.problem_id) AS problems_attempted,
  SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS problems_correct,
  COUNT(a.id) AS total_attempts,
  ROUND(100 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(DISTINCT a.problem_id), 2) AS success_rate,
  MAX(a.submitted_at) AS last_attempt
FROM
  mdl_user u
  LEFT JOIN mdl_partialsum_attempts a ON u.id = a.student_id
WHERE
  u.deleted = 0
GROUP BY
  u.id, u.username, u.firstname, u.lastname;

-- View: Problem difficulty statistics
CREATE OR REPLACE VIEW `v_problem_statistics` AS
SELECT
  p.id AS problem_id,
  p.title,
  p.difficulty_level,
  COUNT(a.id) AS total_attempts,
  COUNT(DISTINCT a.student_id) AS unique_students,
  SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
  ROUND(100 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(a.id), 2) AS success_rate,
  AVG(a.time_spent) AS avg_time_spent
FROM
  mdl_partialsum_problems p
  LEFT JOIN mdl_partialsum_attempts a ON p.id = a.problem_id
WHERE
  p.deleted = 0
GROUP BY
  p.id, p.title, p.difficulty_level;

-- ============================================================
-- Triggers for Automatic Progress Tracking
-- ============================================================

DELIMITER //

-- Trigger: Update progress after new attempt
CREATE TRIGGER `trg_update_progress_after_attempt`
AFTER INSERT ON `mdl_partialsum_attempts`
FOR EACH ROW
BEGIN
  INSERT INTO `mdl_partialsum_progress`
    (`student_id`, `total_problems_attempted`, `total_problems_correct`, `total_attempts`)
  VALUES
    (NEW.student_id, 1, IF(NEW.is_correct = 1, 1, 0), 1)
  ON DUPLICATE KEY UPDATE
    `total_problems_attempted` = (
      SELECT COUNT(DISTINCT problem_id)
      FROM mdl_partialsum_attempts
      WHERE student_id = NEW.student_id
    ),
    `total_problems_correct` = (
      SELECT COUNT(DISTINCT problem_id)
      FROM mdl_partialsum_attempts
      WHERE student_id = NEW.student_id AND is_correct = 1
    ),
    `total_attempts` = `total_attempts` + 1;
END//

DELIMITER ;

-- ============================================================
-- Stored Procedures for Common Operations
-- ============================================================

DELIMITER //

-- Procedure: Get student ranking
CREATE PROCEDURE `sp_get_student_ranking`()
BEGIN
  SELECT
    u.id,
    u.username,
    CONCAT(u.firstname, ' ', u.lastname) AS fullname,
    p.total_problems_correct,
    p.total_attempts,
    ROUND(100 * p.total_problems_correct / p.total_problems_attempted, 2) AS success_rate,
    @rank := @rank + 1 AS ranking
  FROM
    mdl_partialsum_progress p
    JOIN mdl_user u ON p.student_id = u.id
    CROSS JOIN (SELECT @rank := 0) r
  WHERE
    u.deleted = 0
  ORDER BY
    p.total_problems_correct DESC,
    p.total_attempts ASC;
END//

DELIMITER ;

-- ============================================================
-- Grants (Run as appropriate for your setup)
-- ============================================================

-- Example: Grant permissions to Moodle database user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mdl_partialsum_problems TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mdl_partialsum_attempts TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mdl_partialsum_progress TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mdl_partialsum_sessions TO 'moodle_user'@'localhost';

-- ============================================================
-- Schema Version Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS `mdl_partialsum_version` (
  `version` varchar(20) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `mdl_partialsum_version` (`version`) VALUES ('1.0.0');
