-- Function Live Sync Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- 문제 테이블 (Moodle에서 가져온 문제 정보)
CREATE TABLE IF NOT EXISTS `problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moodle_question_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `function_type` ENUM('linear', 'quadratic', 'cubic', 'exponential', 'logarithmic', 'trigonometric', 'custom') DEFAULT 'linear',
  `initial_function` VARCHAR(500) NOT NULL COMMENT '초기 함수식 (예: y = 2x + 3)',
  `x_range_min` DECIMAL(10, 2) DEFAULT -10,
  `x_range_max` DECIMAL(10, 2) DEFAULT 10,
  `y_range_min` DECIMAL(10, 2) DEFAULT -10,
  `y_range_max` DECIMAL(10, 2) DEFAULT 10,
  `grid_size` DECIMAL(5, 2) DEFAULT 1,
  `show_grid` BOOLEAN DEFAULT TRUE,
  `show_axes` BOOLEAN DEFAULT TRUE,
  `allow_student_edit` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_moodle_question` (`moodle_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 세션 테이블
CREATE TABLE IF NOT EXISTS `student_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `problem_id` INT NOT NULL,
  `student_id` INT NOT NULL COMMENT 'Moodle user ID',
  `student_name` VARCHAR(255),
  `session_token` VARCHAR(64) UNIQUE NOT NULL,
  `current_function` VARCHAR(500) NOT NULL COMMENT '현재 작업 중인 함수식',
  `attempt_count` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE,
  INDEX `idx_student` (`student_id`),
  INDEX `idx_session_token` (`session_token`),
  INDEX `idx_active_sessions` (`is_active`, `last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 함수 변경 로그 (실시간 동기화 기록)
CREATE TABLE IF NOT EXISTS `function_changes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `function_expression` VARCHAR(500) NOT NULL,
  `change_type` ENUM('edit', 'parameter_change', 'reset', 'submit') DEFAULT 'edit',
  `parameters` JSON COMMENT '함수 파라미터 (계수, 상수 등)',
  `graph_data` JSON COMMENT '그래프 포인트 데이터 (캐싱용)',
  `timestamp` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`id`) ON DELETE CASCADE,
  INDEX `idx_session_time` (`session_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 답안 테이블
CREATE TABLE IF NOT EXISTS `student_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `submitted_function` VARCHAR(500) NOT NULL,
  `is_correct` BOOLEAN DEFAULT FALSE,
  `correctness_score` DECIMAL(5, 2) COMMENT '정답률 (0.00 - 100.00)',
  `feedback` TEXT,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`id`) ON DELETE CASCADE,
  INDEX `idx_session_answers` (`session_id`, `submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 실시간 동기화 상태 테이블 (WebSocket/Long Polling 상태 관리)
CREATE TABLE IF NOT EXISTS `sync_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL UNIQUE,
  `last_sync` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_version` BIGINT DEFAULT 0 COMMENT '동기화 버전 (충돌 감지용)',
  `client_connected` BOOLEAN DEFAULT FALSE,
  `connection_id` VARCHAR(64) COMMENT 'WebSocket connection ID',
  FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`id`) ON DELETE CASCADE,
  INDEX `idx_connected` (`client_connected`, `last_sync`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO `problems`
  (`title`, `description`, `function_type`, `initial_function`, `x_range_min`, `x_range_max`, `y_range_min`, `y_range_max`)
VALUES
  ('일차함수 그래프 그리기', '일차함수 y = mx + b의 그래프를 그려보세요. m과 b 값을 변경하면서 그래프가 어떻게 변하는지 관찰하세요.', 'linear', 'y = 2x + 1', -10, 10, -10, 10),
  ('이차함수 탐구', '이차함수 y = ax² + bx + c의 그래프를 탐구해보세요.', 'quadratic', 'y = x^2', -5, 5, -2, 10),
  ('삼각함수 학습', 'sin, cos 함수의 주기와 진폭을 이해해보세요.', 'trigonometric', 'y = sin(x)', -6.28, 6.28, -2, 2);
