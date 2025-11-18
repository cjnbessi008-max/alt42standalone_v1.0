-- Logical Linker Database Schema
-- MySQL 5.7 Compatible
-- Character Set: UTF-8

CREATE DATABASE IF NOT EXISTS logical_linker
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE logical_linker;

-- ============================================
-- 1. 문제 정보 테이블 (Moodle 연동)
-- ============================================
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_question_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  question_type ENUM('and', 'or', 'if_then', 'mixed') NOT NULL DEFAULT 'mixed',
  difficulty_level TINYINT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_moodle_question (moodle_question_id),
  INDEX idx_question_type (question_type),
  INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. 논리연결사 정보 테이블
-- ============================================
CREATE TABLE logical_operators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operator_type ENUM('and', 'or', 'if_then') NOT NULL,
  korean_name VARCHAR(50) NOT NULL,
  english_name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10),
  description TEXT,
  color_code VARCHAR(7) DEFAULT '#000000',
  animation_type ENUM('flow', 'pulse', 'connect', 'branch') NOT NULL DEFAULT 'flow',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_operator (operator_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 논리연결사 데이터 삽입
INSERT INTO logical_operators (operator_type, korean_name, english_name, symbol, description, color_code, animation_type) VALUES
('and', '그리고', 'AND', '∧', '두 조건이 모두 참일 때', '#4CAF50', 'connect'),
('or', '또는', 'OR', '∨', '두 조건 중 하나 이상이 참일 때', '#2196F3', 'branch'),
('if_then', '이면', 'IF-THEN', '→', '조건이 참이면 결과가 참', '#FF9800', 'flow');

-- ============================================
-- 3. 문제-논리연결사 관계 테이블
-- ============================================
CREATE TABLE question_operators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  operator_id INT NOT NULL,
  position_order TINYINT NOT NULL DEFAULT 1,
  operand_left TEXT,
  operand_right TEXT,
  expected_result BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES logical_operators(id) ON DELETE RESTRICT,
  INDEX idx_question (question_id),
  INDEX idx_operator (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 학생 정보 테이블
-- ============================================
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  grade_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NULL,
  UNIQUE KEY unique_moodle_user (moodle_user_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. 학생 진행 상황 테이블
-- ============================================
CREATE TABLE student_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  question_id INT NOT NULL,
  session_id VARCHAR(100),
  attempt_number INT NOT NULL DEFAULT 1,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  interaction_count INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  answer_data JSON,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_question (question_id),
  INDEX idx_session (session_id),
  INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 애니메이션 설정 테이블
-- ============================================
CREATE TABLE animation_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  duration_ms INT NOT NULL DEFAULT 1000,
  easing_function VARCHAR(50) DEFAULT 'ease-in-out',
  config_json JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 애니메이션 설정 삽입
INSERT INTO animation_settings (name, duration_ms, easing_function, config_json) VALUES
('connect_line', 800, 'ease-in-out', '{"strokeWidth": 3, "dashArray": "5,5"}'),
('pulse_node', 600, 'ease-in-out', '{"scale": [1, 1.2, 1], "opacity": [1, 0.8, 1]}'),
('flow_path', 1200, 'linear', '{"direction": "forward", "repeat": true}'),
('branch_split', 1000, 'ease-out', '{"angle": 30, "distance": 100}');

-- ============================================
-- 7. Moodle 연동 로그 테이블
-- ============================================
CREATE TABLE moodle_sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('question', 'user', 'grade') NOT NULL,
  moodle_id INT,
  action ENUM('fetch', 'create', 'update', 'delete') NOT NULL,
  status ENUM('success', 'failed', 'partial') NOT NULL,
  request_data JSON,
  response_data JSON,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_type (sync_type),
  INDEX idx_moodle_id (moodle_id),
  INDEX idx_status (status),
  INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. 세션 정보 테이블
-- ============================================
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session (session_id),
  INDEX idx_student (student_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. 시스템 설정 테이블
-- ============================================
CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 시스템 설정 삽입
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('moodle_api_url', 'http://localhost/moodle', 'string', 'Moodle LMS API Base URL'),
('moodle_api_token', '', 'string', 'Moodle Web Service Token'),
('app_version', '1.0.0', 'string', 'Application Version'),
('max_attempt_per_question', '3', 'number', 'Maximum attempts per question'),
('session_timeout_minutes', '30', 'number', 'Session timeout in minutes'),
('enable_animations', 'true', 'boolean', 'Enable/Disable animations'),
('smartphone_width', '375', 'number', 'Virtual smartphone screen width'),
('smartphone_height', '667', 'number', 'Virtual smartphone screen height');
