-- Impossible Shadow Database Schema
-- MySQL 5.7 compatible
-- For integration with Moodle 3.7 (PHP 7.1.9)

-- Create database
CREATE DATABASE IF NOT EXISTS impossible_shadow
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE impossible_shadow;

-- ============================================
-- Students Table
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  course_id INT,
  moodle_user_id INT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user (moodle_user_id),
  INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Problems Table
-- Stores generated division problems
-- ============================================
CREATE TABLE IF NOT EXISTS problems (
  id BIGINT PRIMARY KEY,
  student_id INT,
  dividend INT NOT NULL,
  divisor INT NOT NULL,
  quotient INT,
  remainder INT,
  difficulty ENUM('easy', 'medium', 'hard', 'impossible') DEFAULT 'medium',
  is_impossible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_difficulty (difficulty),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Answers Table
-- Stores student answers and validation results
-- ============================================
CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  student_id INT NOT NULL,
  answer VARCHAR(50) NOT NULL,
  correct BOOLEAN NOT NULL,
  time_taken INT DEFAULT 0, -- seconds
  attempts INT DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_problem (problem_id),
  INDEX idx_student (student_id),
  INDEX idx_correct (correct),
  INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Courses Table
-- Syncs with Moodle courses
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_course_id INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  description TEXT,
  teacher_id INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_course (moodle_course_id),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sessions Table
-- Tracks student learning sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  problems_attempted INT DEFAULT 0,
  problems_correct INT DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Activity Log Table
-- Logs all student interactions
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  session_id INT,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Moodle Integration Table
-- Stores Moodle sync status
-- ============================================
CREATE TABLE IF NOT EXISTS moodle_sync (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('student', 'course', 'grade') NOT NULL,
  entity_id INT NOT NULL,
  moodle_id INT NOT NULL,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sync_status ENUM('success', 'pending', 'failed') DEFAULT 'pending',
  error_message TEXT,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_moodle (moodle_id),
  INDEX idx_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Demo Data
-- ============================================

-- Demo course
INSERT INTO courses (moodle_course_id, name, short_name, description) VALUES
(1, '초등 수학 3학년', 'MATH3', '나눗셈 학습 과정');

-- Demo students
INSERT INTO students (name, email, course_id, moodle_user_id) VALUES
('김철수', 'student1@example.com', 1, 101),
('이영희', 'student2@example.com', 1, 102),
('박지민', 'student3@example.com', 1, 103);

-- ============================================
-- Views for Statistics
-- ============================================

-- Student performance view
CREATE OR REPLACE VIEW student_performance AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.email,
  COUNT(DISTINCT p.id) AS total_problems,
  COUNT(DISTINCT CASE WHEN a.correct = 1 THEN p.id END) AS correct_problems,
  ROUND(AVG(CASE WHEN a.correct = 1 THEN 100 ELSE 0 END), 2) AS accuracy,
  COUNT(DISTINCT DATE(p.created_at)) AS days_active,
  MAX(a.submitted_at) AS last_activity
FROM students s
LEFT JOIN problems p ON s.id = p.student_id
LEFT JOIN answers a ON p.id = a.problem_id
GROUP BY s.id, s.name, s.email;

-- Problem difficulty statistics
CREATE OR REPLACE VIEW problem_difficulty_stats AS
SELECT
  difficulty,
  COUNT(*) AS total_problems,
  SUM(CASE WHEN is_impossible = 1 THEN 1 ELSE 0 END) AS impossible_problems,
  AVG(CASE WHEN a.correct = 1 THEN 1 ELSE 0 END) * 100 AS avg_accuracy
FROM problems p
LEFT JOIN answers a ON p.id = a.problem_id
GROUP BY difficulty;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Get student statistics
CREATE PROCEDURE GetStudentStats(IN student_id_param INT)
BEGIN
  SELECT
    COUNT(DISTINCT p.id) AS total_problems,
    COUNT(DISTINCT CASE WHEN a.correct = 1 THEN p.id END) AS correct_problems,
    COUNT(DISTINCT CASE WHEN p.is_impossible = 1 THEN p.id END) AS impossible_problems,
    ROUND(AVG(CASE WHEN a.correct = 1 THEN 100 ELSE 0 END), 2) AS accuracy,
    COUNT(DISTINCT DATE(p.created_at)) AS days_active
  FROM problems p
  LEFT JOIN answers a ON p.id = a.problem_id
  WHERE p.student_id = student_id_param;
END //

-- Create new session
CREATE PROCEDURE StartSession(
  IN student_id_param INT,
  IN course_id_param INT
)
BEGIN
  INSERT INTO sessions (student_id, course_id, started_at)
  VALUES (student_id_param, course_id_param, NOW());

  SELECT LAST_INSERT_ID() AS session_id;
END //

DELIMITER ;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_student_date ON problems(student_id, created_at);
CREATE INDEX idx_problem_answer ON answers(problem_id, correct);

-- ============================================
-- Permissions
-- ============================================

-- Create application user (run this separately with proper credentials)
-- CREATE USER 'impossible_shadow'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON impossible_shadow.* TO 'impossible_shadow'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- Schema Complete
-- ============================================

SELECT 'Database schema created successfully!' AS status;
