-- Zone Breeze Database Schema
-- MySQL 5.7 compatible

-- Database creation
CREATE DATABASE IF NOT EXISTS zone_breeze
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zone_breeze;

-- Table: problems
-- Stores inequality problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_activity_id INT NOT NULL,
  moodle_course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  inequalities JSON NOT NULL COMMENT 'Array of inequality strings',
  visualization_bounds JSON COMMENT 'Graph bounds {xMin, xMax, yMin, yMax}',
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT COMMENT 'Moodle user ID of creator',
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_moodle_activity (moodle_activity_id),
  INDEX idx_moodle_course (moodle_course_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: student_solutions
-- Stores student attempts and solutions
CREATE TABLE IF NOT EXISTS student_solutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  moodle_user_id INT NOT NULL,
  student_name VARCHAR(255),
  solution_vertices JSON COMMENT 'Calculated solution region vertices',
  solution_data JSON COMMENT 'Full solution data including regions',
  attempt_count INT DEFAULT 1,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade DECIMAL(5,2) COMMENT 'Grade out of 100',
  feedback TEXT,
  INDEX idx_problem (problem_id),
  INDEX idx_student (moodle_user_id),
  INDEX idx_submitted (submitted_at),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: visualization_sessions
-- Tracks student interaction with visualizations
CREATE TABLE IF NOT EXISTS visualization_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  moodle_user_id INT NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP NULL,
  interactions JSON COMMENT 'Array of interaction events',
  zoom_events INT DEFAULT 0,
  hover_events INT DEFAULT 0,
  click_events INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,
  device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'desktop',
  INDEX idx_problem (problem_id),
  INDEX idx_user (moodle_user_id),
  INDEX idx_session_start (session_start),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: inequality_cache
-- Caches computed solution regions for performance
CREATE TABLE IF NOT EXISTS inequality_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inequalities_hash VARCHAR(64) UNIQUE NOT NULL COMMENT 'SHA256 hash of inequalities array',
  inequalities JSON NOT NULL,
  solution_vertices JSON NOT NULL,
  solution_regions JSON NOT NULL,
  computation_time_ms INT,
  hit_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hash (inequalities_hash),
  INDEX idx_last_accessed (last_accessed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: app_settings
-- Application configuration and settings
CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT COMMENT 'Moodle user ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
  ('smartphone_position', 'bottom-right', 'string', 'Position of smartphone screen (bottom-right, bottom-left, top-right, top-left)'),
  ('default_bounds_x_min', '-10', 'number', 'Default minimum X coordinate'),
  ('default_bounds_x_max', '10', 'number', 'Default maximum X coordinate'),
  ('default_bounds_y_min', '-10', 'number', 'Default minimum Y coordinate'),
  ('default_bounds_y_max', '10', 'number', 'Default maximum Y coordinate'),
  ('energy_visualization_enabled', '1', 'boolean', 'Enable zone energy visualization effects'),
  ('max_cache_age_days', '30', 'number', 'Maximum age of cached solutions in days'),
  ('enable_analytics', '1', 'boolean', 'Enable student interaction analytics');

-- Table: problem_templates
-- Pre-defined problem templates for teachers
CREATE TABLE IF NOT EXISTS problem_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('linear', 'quadratic', 'absolute_value', 'mixed') DEFAULT 'linear',
  template_inequalities JSON NOT NULL,
  suggested_bounds JSON,
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  usage_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_by INT COMMENT 'Moodle user ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample problem templates
INSERT INTO problem_templates (template_name, description, category, template_inequalities, suggested_bounds, difficulty_level) VALUES
  (
    '기본 선형 연립부등식 1',
    '두 개의 선형 부등식으로 구성된 기본 문제',
    'linear',
    '["x + y <= 5", "x - y >= 2", "x >= 0", "y >= 0"]',
    '{"xMin": -2, "xMax": 8, "yMin": -2, "yMax": 8}',
    'easy'
  ),
  (
    '기본 선형 연립부등식 2',
    '세 개의 선형 부등식으로 구성된 중급 문제',
    'linear',
    '["2x + y <= 10", "x + 2y <= 11", "x >= 0", "y >= 0"]',
    '{"xMin": -1, "xMax": 10, "yMin": -1, "yMax": 10}',
    'medium'
  ),
  (
    '절댓값 부등식',
    '절댓값을 포함한 부등식',
    'absolute_value',
    '["|x| + |y| <= 5", "x >= -5", "y >= -5"]',
    '{"xMin": -6, "xMax": 6, "yMin": -6, "yMax": 6}',
    'medium'
  ),
  (
    '고급 연립부등식',
    '여러 제약 조건이 있는 복잡한 문제',
    'mixed',
    '["x + 2y <= 12", "2x + y <= 12", "x - y <= 3", "x >= 0", "y >= 0"]',
    '{"xMin": -1, "xMax": 10, "yMin": -1, "yMax": 10}',
    'hard'
  );

-- Indexes for performance optimization
CREATE INDEX idx_problems_active_course ON problems(is_active, moodle_course_id);
CREATE INDEX idx_solutions_problem_user ON student_solutions(problem_id, moodle_user_id);
CREATE INDEX idx_sessions_user_date ON visualization_sessions(moodle_user_id, session_start);

-- Views for analytics
CREATE VIEW student_performance AS
SELECT
  s.moodle_user_id,
  s.student_name,
  COUNT(DISTINCT s.problem_id) as problems_attempted,
  SUM(s.is_correct) as problems_correct,
  ROUND(AVG(s.grade), 2) as average_grade,
  SUM(s.time_spent_seconds) as total_time_spent,
  ROUND(AVG(s.time_spent_seconds), 0) as avg_time_per_problem
FROM student_solutions s
GROUP BY s.moodle_user_id, s.student_name;

CREATE VIEW problem_statistics AS
SELECT
  p.id,
  p.title,
  p.difficulty_level,
  COUNT(DISTINCT s.moodle_user_id) as students_attempted,
  SUM(s.is_correct) as correct_submissions,
  COUNT(s.id) as total_submissions,
  ROUND(100.0 * SUM(s.is_correct) / COUNT(s.id), 2) as success_rate,
  ROUND(AVG(s.time_spent_seconds), 0) as avg_time_spent,
  ROUND(AVG(s.grade), 2) as avg_grade
FROM problems p
LEFT JOIN student_solutions s ON p.id = s.problem_id
GROUP BY p.id, p.title, p.difficulty_level;

-- Cleanup procedure for old cache entries
DELIMITER $$
CREATE PROCEDURE cleanup_old_cache()
BEGIN
  DELETE FROM inequality_cache
  WHERE last_accessed < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND hit_count < 5;
END$$

DELIMITER ;

-- Event to run cleanup daily (requires event scheduler to be enabled)
-- SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS daily_cache_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_old_cache();

-- Grant permissions (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON zone_breeze.* TO 'zone_breeze_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- FLUSH PRIVILEGES;
