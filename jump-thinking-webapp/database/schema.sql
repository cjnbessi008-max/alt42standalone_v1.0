-- Jump Thinking Detection System Database Schema
-- MySQL 5.7+ Compatible

CREATE DATABASE IF NOT EXISTS jump_thinking_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE jump_thinking_db;

-- LTI 소비자(Moodle) 정보
CREATE TABLE lti_consumers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consumer_key VARCHAR(255) NOT NULL UNIQUE,
  consumer_secret VARCHAR(255) NOT NULL,
  consumer_name VARCHAR(255) NOT NULL,
  lms_type VARCHAR(50) DEFAULT 'moodle',
  lms_version VARCHAR(20),
  enabled TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_consumer_key (consumer_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 (교사 및 학생)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lti_user_id VARCHAR(255) NOT NULL,
  consumer_id INT NOT NULL,
  username VARCHAR(100),
  email VARCHAR(255),
  full_name VARCHAR(255),
  role ENUM('teacher', 'student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_lti_user (lti_user_id, consumer_id),
  FOREIGN KEY (consumer_id) REFERENCES lti_consumers(id) ON DELETE CASCADE,
  INDEX idx_role (role),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제 세트
CREATE TABLE problem_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) DEFAULT 'mathematics',
  grade_level INT,
  teacher_id INT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제 (단계별 구조)
CREATE TABLE problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  set_id INT NOT NULL,
  problem_order INT NOT NULL DEFAULT 0,
  step_level INT NOT NULL DEFAULT 1 COMMENT '1=기초단계, 2=중간단계, 3=최종단계',
  parent_problem_id INT NULL COMMENT '이전 단계 문제 ID',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  problem_type ENUM('multiple_choice', 'short_answer', 'numeric', 'essay') DEFAULT 'short_answer',
  correct_answer TEXT,
  options JSON COMMENT '객관식 선택지',
  hints JSON COMMENT '힌트 배열',
  max_time_seconds INT DEFAULT 300 COMMENT '권장 풀이 시간(초)',
  points DECIMAL(5,2) DEFAULT 10.00,
  is_required TINYINT(1) DEFAULT 1 COMMENT '필수 문제 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (set_id) REFERENCES problem_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_problem_id) REFERENCES problems(id) ON DELETE SET NULL,
  INDEX idx_set_order (set_id, problem_order),
  INDEX idx_step_level (step_level),
  INDEX idx_parent (parent_problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 세션 (문제 풀이 세션)
CREATE TABLE student_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  set_id INT NOT NULL,
  lti_resource_link_id VARCHAR(255),
  session_token VARCHAR(255) UNIQUE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  total_time_seconds INT DEFAULT 0,
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES problem_sets(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제 풀이 시도
CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  problem_id INT NOT NULL,
  attempt_number INT DEFAULT 1,
  student_answer TEXT,
  is_correct TINYINT(1) DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  hints_used INT DEFAULT 0,
  skipped TINYINT(1) DEFAULT 0 COMMENT '건너뛴 문제 여부',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_problem (problem_id),
  INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 비약 사고 이벤트 로그
CREATE TABLE jump_thinking_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  event_type ENUM('step_skip', 'fast_solve', 'sequence_violation', 'direct_answer') NOT NULL,
  from_problem_id INT NULL,
  to_problem_id INT NOT NULL,
  expected_step_level INT,
  actual_step_level INT,
  time_difference_seconds INT COMMENT '예상 시간 대비 실제 시간 차이',
  severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
  description TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (from_problem_id) REFERENCES problems(id) ON DELETE SET NULL,
  FOREIGN KEY (to_problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity),
  INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 비약 사고 점수 (세션별 종합)
CREATE TABLE jump_thinking_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL UNIQUE,
  student_id INT NOT NULL,
  set_id INT NOT NULL,
  jump_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '비약 사고 점수 (0-100)',
  total_events INT DEFAULT 0,
  step_skips INT DEFAULT 0,
  fast_solves INT DEFAULT 0,
  sequence_violations INT DEFAULT 0,
  direct_answers INT DEFAULT 0,
  avg_time_ratio DECIMAL(5,2) COMMENT '평균 시간 대비 실제 시간 비율',
  analysis_completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES problem_sets(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_jump_score (jump_score),
  INDEX idx_set (set_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 패턴 분석 (학생별 장기 추적)
CREATE TABLE learning_patterns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  total_sessions INT DEFAULT 0,
  avg_jump_score DECIMAL(5,2) DEFAULT 0.00,
  tendency ENUM('sequential', 'jumper', 'mixed') DEFAULT 'mixed',
  strength_areas JSON COMMENT '강점 영역',
  improvement_areas JSON COMMENT '개선 필요 영역',
  last_analyzed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student (student_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tendency (tendency),
  INDEX idx_avg_score (avg_jump_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 시스템 설정
CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 시스템 설정 삽입
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('jump_detection_threshold', '0.7', 'float', '비약 사고 감지 민감도 (0.0-1.0)'),
('fast_solve_multiplier', '0.5', 'float', '빠른 풀이 기준 (권장 시간의 배수)'),
('step_skip_penalty', '20', 'integer', '단계 건너뛰기 벌점'),
('sequence_violation_penalty', '15', 'integer', '순서 위반 벌점'),
('max_jump_score', '100', 'integer', '최대 비약 사고 점수'),
('enable_analytics', 'true', 'boolean', '분석 기능 활성화');
