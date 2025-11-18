-- Number Constellation App - MySQL 5.7 Database Schema
-- Compatible with MySQL 5.7, Moodle 3.7, PHP 7.1.9

-- Create database
CREATE DATABASE IF NOT EXISTS number_constellation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE number_constellation;

-- Table: problems
-- Stores problem data received from Moodle
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_problem_id VARCHAR(255) NOT NULL,
  moodle_course_id INT NOT NULL,
  moodle_user_id INT NOT NULL,
  problem_type ENUM('prime', 'multiple', 'natural', 'composite', 'mixed') NOT NULL,
  number_range_start INT NOT NULL DEFAULT 1,
  number_range_end INT NOT NULL DEFAULT 100,
  difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  problem_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_problem (moodle_problem_id),
  INDEX idx_moodle_user (moodle_user_id),
  INDEX idx_problem_type (problem_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_progress
-- Tracks student interaction with constellations
CREATE TABLE IF NOT EXISTS student_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  moodle_user_id INT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  numbers_selected JSON,
  numbers_correct JSON,
  numbers_incorrect JSON,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  score DECIMAL(5,2) DEFAULT 0.00,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_user_problem (moodle_user_id, problem_id),
  INDEX idx_session (session_id),
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: constellation_configs
-- Stores visualization configuration
CREATE TABLE IF NOT EXISTS constellation_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_name VARCHAR(100) NOT NULL UNIQUE,
  star_color VARCHAR(50) DEFAULT '#FFD700',
  prime_color VARCHAR(50) DEFAULT '#FF4444',
  multiple_color VARCHAR(50) DEFAULT '#4444FF',
  natural_color VARCHAR(50) DEFAULT '#44FF44',
  composite_color VARCHAR(50) DEFAULT '#FFAA44',
  connection_color VARCHAR(50) DEFAULT 'rgba(255,255,255,0.3)',
  background_color VARCHAR(50) DEFAULT '#000033',
  animation_speed INT DEFAULT 1000,
  show_labels BOOLEAN DEFAULT TRUE,
  show_connections BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: analytics
-- Stores analytics data for teacher insights
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  moodle_course_id INT NOT NULL,
  total_attempts INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  average_time_seconds INT DEFAULT 0,
  difficulty_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_course (moodle_course_id),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default constellation configuration
INSERT INTO constellation_configs (
  config_name,
  star_color,
  prime_color,
  multiple_color,
  natural_color,
  composite_color,
  connection_color,
  background_color,
  animation_speed,
  show_labels,
  show_connections
) VALUES (
  'default',
  '#FFD700',
  '#FF4444',
  '#4444FF',
  '#44FF44',
  '#FFAA44',
  'rgba(255,255,255,0.3)',
  '#000033',
  1000,
  TRUE,
  TRUE
);

-- Sample problem data (for testing)
INSERT INTO problems (
  moodle_problem_id,
  moodle_course_id,
  moodle_user_id,
  problem_type,
  number_range_start,
  number_range_end,
  difficulty_level,
  problem_data
) VALUES (
  'PRIME_001',
  1,
  1,
  'prime',
  1,
  50,
  'easy',
  '{"instruction": "별자리에서 소수를 모두 찾으세요 (Find all prime numbers in the constellation)", "targets": [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47]}'
);
