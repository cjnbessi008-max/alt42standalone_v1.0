-- EquaMap Database Schema
-- MySQL 5.7

CREATE DATABASE IF NOT EXISTS equamap_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE equamap_db;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_moodle_user (moodle_user_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 방정식 문제 테이블
CREATE TABLE IF NOT EXISTS equations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_question_id INT,
  expression TEXT NOT NULL,
  equation_type ENUM('linear', 'quadratic', 'arithmetic', 'system', 'other') DEFAULT 'linear',
  title VARCHAR(255),
  description TEXT,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_question (moodle_question_id),
  INDEX idx_type (equation_type),
  INDEX idx_difficulty (difficulty),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 방정식 시각화 캐시 테이블
CREATE TABLE IF NOT EXISTS equation_visualizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equation_id INT NOT NULL,
  graph_data JSON,
  nodes_count INT,
  edges_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equation_id) REFERENCES equations(id) ON DELETE CASCADE,
  INDEX idx_equation (equation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 활동 로그 테이블
CREATE TABLE IF NOT EXISTS student_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equation_id INT NOT NULL,
  activity_type ENUM('view', 'interact', 'submit') DEFAULT 'view',
  session_id VARCHAR(255),
  time_spent INT DEFAULT 0,
  interaction_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (equation_id) REFERENCES equations(id) ON DELETE CASCADE,
  INDEX idx_user_equation (user_id, equation_id),
  INDEX idx_session (session_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 답안 테이블
CREATE TABLE IF NOT EXISTS student_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equation_id INT NOT NULL,
  moodle_attempt_id INT,
  answer TEXT,
  is_correct BOOLEAN,
  score DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (equation_id) REFERENCES equations(id) ON DELETE CASCADE,
  INDEX idx_user_equation (user_id, equation_id),
  INDEX idx_moodle_attempt (moodle_attempt_id),
  INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 설정 데이터 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('moodle_url', '', 'Moodle 서버 URL'),
  ('moodle_token', '', 'Moodle Web Service 토큰'),
  ('visualization_mode', 'mindmap', '시각화 모드 (mindmap, tree, graph)'),
  ('default_difficulty', 'medium', '기본 난이도')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 샘플 방정식 데이터
INSERT INTO equations (expression, equation_type, title, difficulty) VALUES
  ('2x + 5 = 3x - 7', 'linear', '일차방정식 - 기본', 'easy'),
  ('x^2 - 5x + 6 = 0', 'quadratic', '이차방정식 - 인수분해', 'medium'),
  ('3(x + 2) = 2(x - 1) + 14', 'linear', '일차방정식 - 괄호', 'medium'),
  ('x/2 + x/3 = 5', 'linear', '일차방정식 - 분수', 'hard');
