-- Divisor Molecules Database Schema
-- MySQL 5.7 compatible

-- Create database
CREATE DATABASE IF NOT EXISTS divisor_molecules
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE divisor_molecules;

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS students;

-- Students table
CREATE TABLE students (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  grade_level VARCHAR(20),
  moodle_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table
CREATE TABLE problems (
  id VARCHAR(50) PRIMARY KEY,
  number INT NOT NULL,
  divisors JSON NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  time_limit INT DEFAULT 120,
  moodle_quiz_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_difficulty (difficulty),
  INDEX idx_number (number),
  INDEX idx_moodle_quiz_id (moodle_quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Progress table
CREATE TABLE student_progress (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  problem_id VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  time_spent INT NOT NULL COMMENT 'Time spent in seconds',
  attempts INT DEFAULT 1,
  completed_at TIMESTAMP NOT NULL,
  synced_to_moodle BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_problem_id (problem_id),
  INDEX idx_completed_at (completed_at),
  INDEX idx_synced_to_moodle (synced_to_moodle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
-- Sample students
INSERT INTO students (id, name, email, grade_level) VALUES
  ('student_001', '김민수', 'minsu@example.com', '4학년'),
  ('student_002', '이지은', 'jieun@example.com', '4학년'),
  ('student_003', '박준호', 'junho@example.com', '5학년');

-- Sample problems
INSERT INTO problems (id, number, divisors, difficulty, time_limit) VALUES
  ('prob_001', 12, '[1, 2, 3, 4, 6, 12]', 'easy', 120),
  ('prob_002', 24, '[1, 2, 3, 4, 6, 8, 12, 24]', 'medium', 180),
  ('prob_003', 36, '[1, 2, 3, 4, 6, 9, 12, 18, 36]', 'medium', 180),
  ('prob_004', 48, '[1, 2, 3, 4, 6, 8, 12, 16, 24, 48]', 'hard', 240),
  ('prob_005', 60, '[1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]', 'hard', 300),
  ('prob_006', 8, '[1, 2, 4, 8]', 'easy', 90),
  ('prob_007', 15, '[1, 3, 5, 15]', 'easy', 90),
  ('prob_008', 18, '[1, 2, 3, 6, 9, 18]', 'medium', 150),
  ('prob_009', 20, '[1, 2, 4, 5, 10, 20]', 'medium', 150),
  ('prob_010', 30, '[1, 2, 3, 5, 6, 10, 15, 30]', 'medium', 180);

-- Sample progress data
INSERT INTO student_progress (id, student_id, problem_id, score, time_spent, attempts, completed_at) VALUES
  ('prog_001', 'student_001', 'prob_001', 100, 85, 1, NOW() - INTERVAL 2 DAY),
  ('prog_002', 'student_001', 'prob_002', 85, 145, 2, NOW() - INTERVAL 1 DAY),
  ('prog_003', 'student_002', 'prob_001', 95, 90, 1, NOW() - INTERVAL 3 DAY),
  ('prog_004', 'student_002', 'prob_003', 70, 175, 3, NOW() - INTERVAL 1 HOUR),
  ('prog_005', 'student_003', 'prob_001', 100, 75, 1, NOW() - INTERVAL 5 DAY);

-- Create views for analytics
CREATE OR REPLACE VIEW student_performance AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.grade_level,
  COUNT(sp.id) AS total_problems_completed,
  AVG(sp.score) AS average_score,
  SUM(sp.time_spent) AS total_time_spent,
  MAX(sp.completed_at) AS last_activity
FROM students s
LEFT JOIN student_progress sp ON s.id = sp.student_id
GROUP BY s.id, s.name, s.grade_level;

CREATE OR REPLACE VIEW problem_statistics AS
SELECT
  p.id AS problem_id,
  p.number,
  p.difficulty,
  COUNT(sp.id) AS total_attempts,
  AVG(sp.score) AS average_score,
  AVG(sp.time_spent) AS average_time_spent,
  AVG(sp.attempts) AS average_attempts
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.number, p.difficulty;

-- Success message
SELECT 'Database schema created successfully!' AS message;
