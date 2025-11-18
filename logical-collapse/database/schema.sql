-- Logical Collapse Database Schema
-- MySQL 5.7 compatible
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS logical_collapse
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE logical_collapse;

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reasoning_steps JSON NOT NULL COMMENT 'Array of reasoning steps with validation info',
  moodle_id INT DEFAULT NULL COMMENT 'Reference to Moodle quiz/problem ID',
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_moodle_id (moodle_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT DEFAULT NULL COMMENT 'Reference to Moodle user ID',
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  grade_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_moodle_user (moodle_user_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step validations table
CREATE TABLE IF NOT EXISTS step_validations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  step_index INT NOT NULL COMMENT 'Index of the reasoning step (0-based)',
  is_correct TINYINT(1) NOT NULL COMMENT '1 = correct, 0 = incorrect',
  student_id INT NOT NULL,
  time_spent INT DEFAULT NULL COMMENT 'Time spent on this step in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_problem_student (problem_id, student_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  problem_id INT NOT NULL,
  total_steps INT NOT NULL,
  completed_steps INT DEFAULT 0,
  correct_steps INT DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_problem (student_id, problem_id),
  INDEX idx_progress (progress_percentage),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collapse animations log (for analytics)
CREATE TABLE IF NOT EXISTS collapse_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  step_index INT NOT NULL,
  student_id INT NOT NULL,
  collapse_triggered TINYINT(1) DEFAULT 0,
  error_type VARCHAR(100) COMMENT 'Type of logical error that triggered collapse',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_problem_step (problem_id, step_index),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle synchronization log
CREATE TABLE IF NOT EXISTS moodle_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('problem', 'student', 'validation') NOT NULL,
  entity_id INT NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'fetch, push, update',
  status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
