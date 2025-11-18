-- Integration Arms Database Schema
-- MySQL 5.7
-- Created: 2025-11-18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: integration_arms
--

-- --------------------------------------------------------

--
-- Table: integration_problems
-- 부분적분 문제 정보
--

CREATE TABLE IF NOT EXISTS `integration_problems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moodle_question_id` int(11) NOT NULL,
  `problem_latex` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_u` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correct_dv` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `hints` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of hints',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_moodle_question` (`moodle_question_id`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table: student_attempts
-- 학생 풀이 기록
--

CREATE TABLE IF NOT EXISTS `student_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `selected_u` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_dv` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `attempt_time` float DEFAULT NULL COMMENT 'Time in seconds',
  `hint_used` int(11) DEFAULT '0',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_problem` (`moodle_user_id`,`problem_id`),
  KEY `fk_problem` (`problem_id`),
  CONSTRAINT `fk_problem` FOREIGN KEY (`problem_id`) REFERENCES `integration_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table: animation_settings
-- 사용자별 애니메이션 설정
--

CREATE TABLE IF NOT EXISTS `animation_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `animation_speed` float DEFAULT '1.0',
  `auto_play` tinyint(1) DEFAULT '1',
  `show_hints` tinyint(1) DEFAULT '1',
  `sound_enabled` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table: learning_progress
-- 학습 진도 추적
--

CREATE TABLE IF NOT EXISTS `learning_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` int(11) NOT NULL,
  `total_attempts` int(11) DEFAULT '0',
  `correct_attempts` int(11) DEFAULT '0',
  `average_time` float DEFAULT NULL,
  `mastery_level` enum('beginner','intermediate','advanced','expert') COLLATE utf8mb4_unicode_ci DEFAULT 'beginner',
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_progress` (`moodle_user_id`),
  KEY `idx_mastery` (`mastery_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table: session_logs
-- 세션 및 활동 로그
--

CREATE TABLE IF NOT EXISTS `session_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` int(11) NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `activity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activity_data` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_session` (`moodle_user_id`,`session_token`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Views
--

-- 학생별 성과 요약
CREATE OR REPLACE VIEW `student_performance` AS
SELECT
  lp.moodle_user_id,
  lp.total_attempts,
  lp.correct_attempts,
  ROUND((lp.correct_attempts / lp.total_attempts * 100), 2) AS success_rate,
  lp.average_time,
  lp.mastery_level,
  COUNT(DISTINCT sa.problem_id) AS unique_problems_attempted,
  lp.last_activity
FROM learning_progress lp
LEFT JOIN student_attempts sa ON lp.moodle_user_id = sa.moodle_user_id
GROUP BY lp.moodle_user_id;

-- 문제별 난이도 통계
CREATE OR REPLACE VIEW `problem_statistics` AS
SELECT
  ip.id,
  ip.problem_latex,
  ip.difficulty,
  COUNT(sa.id) AS total_attempts,
  SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
  ROUND(AVG(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) * 100, 2) AS success_rate,
  ROUND(AVG(sa.attempt_time), 2) AS avg_time,
  ROUND(AVG(sa.hint_used), 2) AS avg_hints_used
FROM integration_problems ip
LEFT JOIN student_attempts sa ON ip.id = sa.problem_id
GROUP BY ip.id;
