-- Light Interval Database Schema
-- MySQL 5.7 compatible

-- Create database
CREATE DATABASE IF NOT EXISTS light_interval
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE light_interval;

-- Problems table
-- Stores inequality problems from Moodle or created manually
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  inequality VARCHAR(255) NOT NULL,
  moodle_id VARCHAR(100) NULL,
  difficulty_level TINYINT NOT NULL DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_id (moodle_id),
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
-- Stores student information
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  moodle_user_id VARCHAR(100) NULL,
  grade_level VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_email (email),
  INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
-- Tracks student attempts at solving problems
CREATE TABLE IF NOT EXISTS student_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  problem_id INT NOT NULL,
  answer VARCHAR(255) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent_seconds INT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_problem_id (problem_id),
  INDEX idx_attempted_at (attempted_at),
  INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
-- Tracks learning sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  problems_attempted INT DEFAULT 0,
  problems_correct INT DEFAULT 0,
  total_time_seconds INT DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visualization settings table
-- Stores custom visualization settings per student
CREATE TABLE IF NOT EXISTS visualization_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NULL,
  min_value DECIMAL(10, 2) DEFAULT -10,
  max_value DECIMAL(10, 2) DEFAULT 10,
  resolution INT DEFAULT 200,
  light_color VARCHAR(7) DEFAULT '#FFD700',
  background_color VARCHAR(7) DEFAULT '#1a1a1a',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO problems (title, description, inequality, difficulty_level) VALUES
  ('기본 부등식 1', 'x가 2보다 큰 경우를 찾으세요', 'x > 2', 1),
  ('기본 부등식 2', 'x가 5보다 작거나 같은 경우를 찾으세요', 'x <= 5', 1),
  ('기본 부등식 3', 'x가 -3보다 크거나 같은 경우를 찾으세요', 'x >= -3', 2),
  ('범위 부등식 1', 'x가 -3 이상 5 미만인 경우를 찾으세요', '-3 <= x < 5', 3),
  ('범위 부등식 2', 'x가 2보다 크고 8 이하인 경우를 찾으세요', '2 < x <= 8', 3),
  ('복합 부등식 1', 'x가 -5 이상 0 미만인 경우를 찾으세요', '-5 <= x < 0', 4),
  ('복합 부등식 2', 'x가 -2.5보다 크고 3.5 이하인 경우를 찾으세요', '-2.5 < x <= 3.5', 4);

INSERT INTO students (name, email, grade_level) VALUES
  ('김철수', 'chulsoo@example.com', '중학교 1학년'),
  ('이영희', 'younghee@example.com', '중학교 1학년'),
  ('박민수', 'minsoo@example.com', '중학교 2학년');

-- Create views for analytics

-- Problem statistics view
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
  p.id,
  p.title,
  p.inequality,
  p.difficulty_level,
  COUNT(sa.id) AS total_attempts,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
  ROUND(
    100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.id), 0),
    2
  ) AS success_rate,
  AVG(sa.time_spent_seconds) AS avg_time_seconds
FROM problems p
LEFT JOIN student_attempts sa ON p.id = sa.problem_id
GROUP BY p.id, p.title, p.inequality, p.difficulty_level;

-- Student performance view
CREATE OR REPLACE VIEW student_performance AS
SELECT
  s.id,
  s.name,
  s.grade_level,
  COUNT(DISTINCT sa.problem_id) AS problems_attempted,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS correct_answers,
  COUNT(sa.id) AS total_attempts,
  ROUND(
    100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.id), 0),
    2
  ) AS success_rate,
  AVG(sa.time_spent_seconds) AS avg_time_per_attempt
FROM students s
LEFT JOIN student_attempts sa ON s.id = sa.student_id
GROUP BY s.id, s.name, s.grade_level;

-- Create stored procedures

DELIMITER //

-- Procedure to record a student attempt
CREATE PROCEDURE record_attempt(
  IN p_student_id INT,
  IN p_problem_id INT,
  IN p_answer VARCHAR(255),
  IN p_is_correct BOOLEAN,
  IN p_time_spent INT
)
BEGIN
  DECLARE v_attempt_number INT;

  -- Get next attempt number for this student and problem
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO v_attempt_number
  FROM student_attempts
  WHERE student_id = p_student_id AND problem_id = p_problem_id;

  -- Insert the attempt
  INSERT INTO student_attempts (
    student_id,
    problem_id,
    answer,
    is_correct,
    time_spent_seconds,
    attempt_number
  ) VALUES (
    p_student_id,
    p_problem_id,
    p_answer,
    p_is_correct,
    p_time_spent,
    v_attempt_number
  );
END //

-- Procedure to get student progress
CREATE PROCEDURE get_student_progress(IN p_student_id INT)
BEGIN
  SELECT
    p.id AS problem_id,
    p.title,
    p.inequality,
    p.difficulty_level,
    COUNT(sa.id) AS attempts,
    MAX(sa.is_correct) AS ever_correct,
    MAX(sa.attempted_at) AS last_attempt
  FROM problems p
  LEFT JOIN student_attempts sa ON p.id = sa.problem_id AND sa.student_id = p_student_id
  GROUP BY p.id, p.title, p.inequality, p.difficulty_level
  ORDER BY p.difficulty_level, p.id;
END //

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_student_problem ON student_attempts(student_id, problem_id);
CREATE INDEX idx_attempt_time ON student_attempts(attempted_at DESC);

-- Display summary
SELECT 'Database schema created successfully!' AS message;
SELECT COUNT(*) AS sample_problems FROM problems;
SELECT COUNT(*) AS sample_students FROM students;
