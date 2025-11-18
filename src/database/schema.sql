-- Function Digest Database Schema
-- MySQL 5.7 Compatible
-- Database for storing problem function digests

CREATE DATABASE IF NOT EXISTS `function_digest_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `function_digest_db`;

-- Table: problems
-- Stores problem information from Moodle LMS
CREATE TABLE IF NOT EXISTS `problems` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `moodle_question_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_moodle_question_id` (`moodle_question_id`),
  INDEX `idx_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: function_digests
-- Stores 3-line summaries of functions found in problems
CREATE TABLE IF NOT EXISTS `function_digests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `problem_id` INT UNSIGNED NOT NULL,
  `function_name` VARCHAR(255) NOT NULL,
  `function_code` TEXT,
  `summary_line1` VARCHAR(500) NOT NULL COMMENT 'First line: Function purpose',
  `summary_line2` VARCHAR(500) NOT NULL COMMENT 'Second line: Parameters and return type',
  `summary_line3` VARCHAR(500) NOT NULL COMMENT 'Third line: Key behavior or example',
  `language` VARCHAR(50) DEFAULT 'python' COMMENT 'Programming language',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE,
  INDEX `idx_problem_id` (`problem_id`),
  INDEX `idx_function_name` (`function_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_digest_views
-- Tracks when users view function digests
CREATE TABLE IF NOT EXISTS `user_digest_views` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `moodle_user_id` INT UNSIGNED NOT NULL,
  `digest_id` INT UNSIGNED NOT NULL,
  `viewed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`digest_id`) REFERENCES `function_digests`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`moodle_user_id`),
  INDEX `idx_digest_id` (`digest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO `problems` (`moodle_question_id`, `course_id`, `question_text`, `question_type`)
VALUES
  (1001, 101, 'Write a function called `calculate_area` that takes width and height as parameters and returns the area of a rectangle.', 'coding'),
  (1002, 101, 'Create a function `fibonacci(n)` that returns the nth Fibonacci number using recursion.', 'coding');

INSERT INTO `function_digests` (`problem_id`, `function_name`, `function_code`, `summary_line1`, `summary_line2`, `summary_line3`, `language`)
VALUES
  (1, 'calculate_area', 'def calculate_area(width, height):\n    return width * height',
   '📐 Calculates the area of a rectangle',
   '📥 Parameters: width (float), height (float) → Returns: float',
   '💡 Example: calculate_area(5, 10) returns 50'),
  (2, 'fibonacci', 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
   '🔢 Computes the nth Fibonacci number recursively',
   '📥 Parameter: n (int) → Returns: int (Fibonacci number)',
   '⚠️ Time complexity: O(2^n), inefficient for large n');
