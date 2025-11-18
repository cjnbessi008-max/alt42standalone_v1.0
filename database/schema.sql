-- Mathematical Garden Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

CREATE DATABASE IF NOT EXISTS mathematical_garden
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mathematical_garden;

-- Problems Table (문제 정보)
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_problem_id INT NULL COMMENT 'Moodle quiz question ID',
  title VARCHAR(255) NOT NULL COMMENT '문제 제목',
  description TEXT COMMENT '문제 설명',
  problem_type ENUM('number_comparison', 'addition', 'subtraction', 'multiplication', 'division', 'fraction', 'pattern') NOT NULL DEFAULT 'number_comparison',
  difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
  target_grade INT NOT NULL DEFAULT 1 COMMENT '대상 학년',
  numbers JSON NOT NULL COMMENT '문제에 사용되는 숫자 배열',
  correct_answer VARCHAR(100) NOT NULL COMMENT '정답',
  visualization_config JSON NULL COMMENT '시각화 설정 (오브제 타입, 색상 등)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_problem_type (problem_type),
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수학 문제 정보';

-- Garden Objects Table (정원 오브제 정의)
CREATE TABLE IF NOT EXISTS garden_objects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  object_type ENUM('flower', 'tree', 'bush', 'stone', 'fountain', 'butterfly', 'bird') NOT NULL,
  object_name VARCHAR(100) NOT NULL COMMENT '오브제 이름',
  svg_path TEXT NULL COMMENT 'SVG 경로 데이터',
  color_scheme VARCHAR(50) NULL COMMENT '기본 색상',
  size_unit INT NOT NULL DEFAULT 1 COMMENT '크기 단위 (숫자 1당 크기)',
  description TEXT COMMENT '오브제 설명',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_object (object_type, object_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='정원 오브제 정의';

-- Student Sessions Table (학생 세션)
CREATE TABLE IF NOT EXISTS student_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  student_name VARCHAR(100) NULL COMMENT '학생 이름 (선택)',
  moodle_user_id INT NULL COMMENT 'Moodle 사용자 ID',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total_problems_attempted INT DEFAULT 0,
  total_correct_answers INT DEFAULT 0,
  INDEX idx_session (session_id),
  INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 세션 정보';

-- Student Attempts Table (학생 답안 기록)
CREATE TABLE IF NOT EXISTS student_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  problem_id INT NOT NULL,
  student_answer VARCHAR(100) NOT NULL COMMENT '학생이 제출한 답',
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT NULL COMMENT '문제 푸는데 걸린 시간 (초)',
  interaction_data JSON NULL COMMENT '인터랙션 데이터 (클릭, 드래그 등)',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_session_problem (session_id, problem_id),
  INDEX idx_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 답안 기록';

-- Moodle Sync Log (Moodle 연동 로그)
CREATE TABLE IF NOT EXISTS moodle_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('problem_import', 'result_export', 'user_sync') NOT NULL,
  moodle_endpoint VARCHAR(255) NOT NULL,
  request_data JSON NULL,
  response_data JSON NULL,
  status ENUM('success', 'failed', 'pending') NOT NULL,
  error_message TEXT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_type (sync_type),
  INDEX idx_status (status),
  INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 연동 로그';

-- App Settings Table (앱 설정)
CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  description TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='앱 설정';

-- Insert Default Garden Objects
INSERT INTO garden_objects (object_type, object_name, color_scheme, size_unit, description) VALUES
('flower', '해바라기', 'yellow', 1, '노란색 해바라기 - 덧셈/양수 표현'),
('flower', '장미', 'red', 1, '빨간 장미 - 중요한 숫자 표현'),
('flower', '튤립', 'pink', 1, '분홍 튤립 - 작은 숫자 표현'),
('tree', '사과나무', 'green', 2, '사과나무 - 큰 숫자 표현'),
('tree', '소나무', 'green', 3, '소나무 - 매우 큰 숫자 표현'),
('bush', '관목', 'green', 1, '작은 관목 - 기본 단위'),
('stone', '돌', 'gray', 1, '돌 - 0 또는 변하지 않는 값'),
('butterfly', '나비', 'rainbow', 1, '나비 - 변환/이동 표현'),
('bird', '새', 'blue', 1, '새 - 빠른 변화 표현');

-- Insert Default Settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('app_title', 'Mathematical Garden', 'string', '앱 제목'),
('default_visualization', 'flower', 'string', '기본 시각화 오브제'),
('animation_speed', '1000', 'number', '애니메이션 속도 (ms)'),
('enable_sound', 'true', 'boolean', '사운드 효과 활성화'),
('phone_screen_width', '375', 'number', '가상 스마트폰 화면 너비 (px)'),
('phone_screen_height', '667', 'number', '가상 스마트폰 화면 높이 (px)');
