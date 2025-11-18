-- Blend Difference Animation - Database Schema
-- MySQL 5.7 Compatible
-- For integration with Moodle 3.7

-- Create database
CREATE DATABASE IF NOT EXISTS blend_difference_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE blend_difference_db;

-- Problems table
-- Stores mathematical function comparison problems
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  function1 VARCHAR(500) NOT NULL COMMENT 'Mathematical expression for first function',
  function2 VARCHAR(500) NOT NULL COMMENT 'Mathematical expression for second function',
  color1 VARCHAR(7) DEFAULT '#3B82F6' COMMENT 'Hex color for first function',
  color2 VARCHAR(7) DEFAULT '#EC4899' COMMENT 'Hex color for second function',
  expected_difference VARCHAR(500) COMMENT 'Expected difference expression',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  category VARCHAR(100) NOT NULL,
  blend_mode ENUM('difference', 'multiply', 'screen', 'overlay', 'add', 'subtract') DEFAULT 'difference',
  x_min DECIMAL(10, 2) DEFAULT -5.00,
  x_max DECIMAL(10, 2) DEFAULT 5.00,
  y_min DECIMAL(10, 2) DEFAULT -10.00,
  y_max DECIMAL(10, 2) DEFAULT 10.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem hints table
CREATE TABLE IF NOT EXISTS problem_hints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  hint_text TEXT NOT NULL,
  hint_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  student_id INT COMMENT 'Moodle user ID',
  student_name VARCHAR(255),
  submitted_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  score DECIMAL(5, 2) DEFAULT 0.00,
  time_spent INT COMMENT 'Time spent in seconds',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_problem (problem_id),
  INDEX idx_student (student_id),
  INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle integration mapping table
CREATE TABLE IF NOT EXISTS moodle_integration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  moodle_course_id INT NOT NULL,
  moodle_activity_id INT COMMENT 'Moodle quiz or assignment ID',
  moodle_question_id INT COMMENT 'Moodle question ID',
  integration_type ENUM('quiz', 'assignment', 'activity') DEFAULT 'quiz',
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_moodle_course (moodle_course_id),
  INDEX idx_moodle_activity (moodle_activity_id),
  UNIQUE KEY unique_moodle_mapping (moodle_course_id, moodle_activity_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Animation settings table
CREATE TABLE IF NOT EXISTS animation_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  duration DECIMAL(4, 2) DEFAULT 5.00 COMMENT 'Animation duration in seconds',
  fps INT DEFAULT 60,
  show_grid BOOLEAN DEFAULT TRUE,
  show_axes BOOLEAN DEFAULT TRUE,
  animation_speed DECIMAL(3, 2) DEFAULT 1.00 COMMENT 'Playback speed multiplier',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample problems
INSERT INTO problems (title, description, function1, function2, color1, color2, difficulty, category) VALUES
('Linear vs Quadratic', 'Compare a linear function with a quadratic function', 'x', 'x^2', '#3B82F6', '#EC4899', 'easy', 'Basic Functions'),
('Sine vs Cosine', 'Visualize the phase difference between sine and cosine', 'sin(x)', 'cos(x)', '#10B981', '#F59E0B', 'medium', 'Trigonometric Functions'),
('Exponential Growth', 'Compare exponential and linear growth', '2*x', '2^x', '#8B5CF6', '#EF4444', 'medium', 'Growth Functions'),
('Polynomial Comparison', 'Compare two polynomial functions', 'x^2 - 2*x + 1', 'x^3 - 3*x + 2', '#06B6D4', '#F97316', 'hard', 'Polynomials');

-- Insert sample hints
INSERT INTO problem_hints (problem_id, hint_text, hint_order) VALUES
(1, 'Notice how the curves diverge', 1),
(1, 'The difference increases as x grows', 2),
(2, 'They are 90 degrees out of phase', 1),
(2, 'The maximum difference is √2', 2),
(3, 'Exponential growth eventually dominates', 1),
(3, 'Notice the dramatic difference at larger x values', 2),
(4, 'Look for intersection points', 1),
(4, 'Higher degree dominates at extremes', 2);

-- Insert sample animation settings
INSERT INTO animation_settings (problem_id, duration, fps, show_grid, show_axes) VALUES
(1, 5.00, 60, TRUE, TRUE),
(2, 5.00, 60, TRUE, TRUE),
(3, 5.00, 60, TRUE, TRUE),
(4, 5.00, 60, TRUE, TRUE);

-- Create views for easier querying

-- View: Complete problem details with hints
CREATE OR REPLACE VIEW vw_problem_details AS
SELECT
  p.*,
  GROUP_CONCAT(ph.hint_text ORDER BY ph.hint_order SEPARATOR '|||') AS hints
FROM problems p
LEFT JOIN problem_hints ph ON p.id = ph.problem_id
GROUP BY p.id;

-- View: Problem statistics
CREATE OR REPLACE VIEW vw_problem_stats AS
SELECT
  p.id AS problem_id,
  p.title,
  p.category,
  p.difficulty,
  COUNT(s.id) AS total_submissions,
  SUM(CASE WHEN s.is_correct THEN 1 ELSE 0 END) AS correct_submissions,
  AVG(s.score) AS avg_score,
  AVG(s.time_spent) AS avg_time_spent
FROM problems p
LEFT JOIN submissions s ON p.id = s.problem_id
GROUP BY p.id, p.title, p.category, p.difficulty;
