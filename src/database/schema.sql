-- ============================================================
-- Unstable Concept Detection System - Database Schema
-- MySQL 5.7 Compatible
-- ============================================================

-- Drop tables if exist (for clean installation)
DROP TABLE IF EXISTS `concept_stability`;
DROP TABLE IF EXISTS `student_responses`;
DROP TABLE IF EXISTS `problem_concepts`;
DROP TABLE IF EXISTS `problems`;
DROP TABLE IF EXISTS `concepts`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `teachers`;

-- ============================================================
-- Core Tables
-- ============================================================

-- Teachers table
CREATE TABLE `teachers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE `students` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NULL,
  `grade_level` VARCHAR(20) NULL,
  `teacher_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_teacher_id` (`teacher_id`),
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Concepts table (e.g., "fraction addition", "multiplication", etc.)
CREATE TABLE `concepts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `subject` VARCHAR(50) NOT NULL DEFAULT 'mathematics',
  `grade_level` VARCHAR(20) NULL,
  `parent_concept_id` INT UNSIGNED NULL COMMENT 'For hierarchical concepts',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_subject` (`subject`),
  INDEX `idx_parent_concept` (`parent_concept_id`),
  FOREIGN KEY (`parent_concept_id`) REFERENCES `concepts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table
CREATE TABLE `problems` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `difficulty_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-5 scale',
  `correct_answer` TEXT NOT NULL,
  `problem_type` VARCHAR(50) NOT NULL COMMENT 'multiple_choice, numeric, text, etc.',
  `metadata` JSON NULL COMMENT 'Additional problem data',
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_difficulty` (`difficulty_level`),
  INDEX `idx_created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem-Concept mapping (many-to-many)
CREATE TABLE `problem_concepts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `problem_id` INT UNSIGNED NOT NULL,
  `concept_id` INT UNSIGNED NOT NULL,
  `importance` DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT 'Weight 0.0-1.0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_problem_concept` (`problem_id`, `concept_id`),
  INDEX `idx_problem_id` (`problem_id`),
  INDEX `idx_concept_id` (`concept_id`),
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Response Tracking Tables
-- ============================================================

-- Student responses to problems
CREATE TABLE `student_responses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL,
  `problem_id` INT UNSIGNED NOT NULL,
  `answer` TEXT NOT NULL,
  `is_correct` BOOLEAN NOT NULL,
  `time_spent_seconds` INT UNSIGNED NULL COMMENT 'Time spent on problem',
  `attempt_number` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Which attempt (1st, 2nd, etc.)',
  `confidence_level` TINYINT UNSIGNED NULL COMMENT 'Student self-reported 1-5',
  `hesitation_score` DECIMAL(5,2) NULL COMMENT 'Calculated from behavior',
  `metadata` JSON NULL COMMENT 'Click patterns, mouse movements, etc.',
  `responded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_student_id` (`student_id`),
  INDEX `idx_problem_id` (`problem_id`),
  INDEX `idx_is_correct` (`is_correct`),
  INDEX `idx_responded_at` (`responded_at`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Concept Stability Analysis Tables
-- ============================================================

-- Concept stability scores per student
CREATE TABLE `concept_stability` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` INT UNSIGNED NOT NULL,
  `concept_id` INT UNSIGNED NOT NULL,

  -- Core metrics
  `total_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `correct_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  `accuracy_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Percentage',

  -- Instability indicators
  `avg_time_spent` DECIMAL(8,2) NULL COMMENT 'Average seconds per problem',
  `time_variance` DECIMAL(8,2) NULL COMMENT 'Variance in time spent',
  `multiple_attempts_rate` DECIMAL(5,2) NULL COMMENT 'How often needs retries',
  `recent_regression_count` INT UNSIGNED DEFAULT 0 COMMENT 'Previously correct -> incorrect',

  -- Stability score (0-100, lower = more unstable)
  `stability_score` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `is_unstable` BOOLEAN GENERATED ALWAYS AS (`stability_score` < 60) STORED,

  -- Recommendation flags
  `needs_review` BOOLEAN NOT NULL DEFAULT FALSE,
  `recommended_action` VARCHAR(50) NULL COMMENT 'review, practice, assess, etc.',

  -- Timestamps
  `last_response_at` TIMESTAMP NULL,
  `last_calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_concept` (`student_id`, `concept_id`),
  INDEX `idx_stability_score` (`stability_score`),
  INDEX `idx_is_unstable` (`is_unstable`),
  INDEX `idx_needs_review` (`needs_review`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed Data for Testing
-- ============================================================

-- Sample teacher
INSERT INTO `teachers` (`name`, `email`, `password_hash`) VALUES
('김선생님', 'teacher@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password: password

-- Sample students
INSERT INTO `students` (`name`, `email`, `grade_level`, `teacher_id`) VALUES
('홍길동', 'student1@example.com', '3학년', 1),
('김영희', 'student2@example.com', '3학년', 1),
('이철수', 'student3@example.com', '4학년', 1);

-- Sample concepts
INSERT INTO `concepts` (`name`, `description`, `subject`, `grade_level`) VALUES
('분수의 기본 개념', '분수가 무엇인지 이해하기', 'mathematics', '3-4학년'),
('분수의 덧셈', '같은 분모를 가진 분수끼리 더하기', 'mathematics', '3-4학년'),
('분수의 뺄셈', '같은 분모를 가진 분수끼리 빼기', 'mathematics', '3-4학년'),
('분수의 약분', '분수를 간단하게 만들기', 'mathematics', '4-5학년'),
('곱셈 구구단 (2단)', '2의 배수 곱셈', 'mathematics', '2학년'),
('곱셈 구구단 (3단)', '3의 배수 곱셈', 'mathematics', '2학년');

-- Sample problems
INSERT INTO `problems` (`title`, `description`, `difficulty_level`, `correct_answer`, `problem_type`, `created_by`) VALUES
('분수 비교 1', '1/2와 1/4 중 어느 것이 더 큽니까?', 2, '1/2', 'multiple_choice', 1),
('분수 덧셈 1', '1/4 + 2/4 = ?', 2, '3/4', 'numeric', 1),
('분수 뺄셈 1', '3/5 - 1/5 = ?', 2, '2/5', 'numeric', 1),
('분수 약분 1', '4/8을 약분하면?', 3, '1/2', 'numeric', 1),
('구구단 2x3', '2 × 3 = ?', 1, '6', 'numeric', 1),
('구구단 3x4', '3 × 4 = ?', 1, '12', 'numeric', 1);

-- Link problems to concepts
INSERT INTO `problem_concepts` (`problem_id`, `concept_id`, `importance`) VALUES
(1, 1, 1.0),  -- Problem 1 -> Concept 1 (분수 기본)
(2, 2, 1.0),  -- Problem 2 -> Concept 2 (분수 덧셈)
(3, 3, 1.0),  -- Problem 3 -> Concept 3 (분수 뺄셈)
(4, 4, 1.0),  -- Problem 4 -> Concept 4 (약분)
(5, 5, 1.0),  -- Problem 5 -> Concept 5 (2단)
(6, 6, 1.0);  -- Problem 6 -> Concept 6 (3단)

-- Sample responses showing instability patterns
-- Student 1: Good at basic fractions, but unstable at addition
INSERT INTO `student_responses` (`student_id`, `problem_id`, `answer`, `is_correct`, `time_spent_seconds`, `attempt_number`, `confidence_level`) VALUES
-- Correct answer but took very long (INSTABILITY SIGNAL)
(1, 2, '3/4', 1, 180, 1, 2),
-- Second attempt on same type of problem - much faster (INCONSISTENT)
(1, 2, '3/4', 1, 45, 2, 4),
-- Another similar problem - slow again (UNSTABLE PATTERN)
(1, 2, '3/4', 1, 165, 1, 2);

-- Student 2: Previously correct, then regression (INSTABILITY SIGNAL)
INSERT INTO `student_responses` (`student_id`, `problem_id`, `answer`, `is_correct`, `time_spent_seconds`, `attempt_number`) VALUES
(2, 5, '6', 1, 10, 1),   -- Correct initially
(2, 5, '6', 1, 8, 1),    -- Still correct
(2, 5, '8', 0, 45, 1),   -- REGRESSION - wrong answer
(2, 5, '6', 1, 30, 2);   -- Corrected but slow

-- Student 3: Consistent and stable (GOOD PATTERN)
INSERT INTO `student_responses` (`student_id`, `problem_id`, `answer`, `is_correct`, `time_spent_seconds`, `attempt_number`) VALUES
(3, 1, '1/2', 1, 25, 1),
(3, 1, '1/2', 1, 20, 1),
(3, 1, '1/2', 1, 22, 1);
