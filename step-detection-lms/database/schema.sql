-- Step Detection LMS Database Schema
-- MySQL 5.7+
-- Created: 2025-11-18

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 사용자 관리
-- ============================================

-- 학생 정보 (Moodle과 연동)
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `moodle_user_id` INT UNSIGNED NULL COMMENT 'Moodle 사용자 ID',
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `grade_level` VARCHAR(20) DEFAULT NULL COMMENT '학년',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_moodle_user` (`moodle_user_id`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 정보';

-- 교사 정보
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `moodle_user_id` INT UNSIGNED NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(200) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_moodle_user` (`moodle_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='교사 정보';

-- ============================================
-- 2. 문제 및 단계 정의
-- ============================================

-- 문제 유형 정의
CREATE TABLE IF NOT EXISTS `problem_types` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '문제 유형명 (예: fraction_addition)',
  `display_name` VARCHAR(200) NOT NULL COMMENT '표시명 (예: 분수 덧셈)',
  `description` TEXT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT '카테고리 (예: fractions, equations, geometry)',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제 유형 정의';

-- 문제 정의
CREATE TABLE IF NOT EXISTS `problems` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `problem_type_id` INT UNSIGNED NOT NULL,
  `moodle_quiz_id` INT UNSIGNED NULL COMMENT 'Moodle 퀴즈 ID',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL COMMENT '문제 설명',
  `difficulty_level` TINYINT UNSIGNED DEFAULT 1 COMMENT '난이도 (1-5)',
  `expected_time_seconds` INT UNSIGNED DEFAULT 300 COMMENT '예상 소요 시간 (초)',
  `correct_answer` TEXT NULL COMMENT '정답 (JSON 형식)',
  `metadata` JSON NULL COMMENT '추가 메타데이터',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_by` INT UNSIGNED NULL COMMENT '생성 교사 ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`problem_type_id`) REFERENCES `problem_types`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
  INDEX `idx_problem_type` (`problem_type_id`),
  INDEX `idx_difficulty` (`difficulty_level`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제 정의';

-- 문제 단계 정의
CREATE TABLE IF NOT EXISTS `problem_steps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `problem_id` INT UNSIGNED NOT NULL,
  `step_order` TINYINT UNSIGNED NOT NULL COMMENT '단계 순서 (1, 2, 3...)',
  `step_name` VARCHAR(100) NOT NULL COMMENT '단계명 (예: common_denominator)',
  `display_name` VARCHAR(200) NOT NULL COMMENT '표시명 (예: 통분하기)',
  `description` TEXT NULL COMMENT '단계 설명',
  `is_required` TINYINT(1) DEFAULT 1 COMMENT '필수 단계 여부',
  `expected_time_seconds` INT UNSIGNED DEFAULT 60 COMMENT '이 단계의 예상 소요 시간',
  `validation_rule` TEXT NULL COMMENT '검증 규칙 (JSON 또는 정규식)',
  `hint_text` TEXT NULL COMMENT '힌트 내용',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_problem_step` (`problem_id`, `step_order`),
  INDEX `idx_problem` (`problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제별 단계 정의';

-- ============================================
-- 3. 학생 풀이 추적
-- ============================================

-- 학생 풀이 세션
CREATE TABLE IF NOT EXISTS `student_solutions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `problem_id` INT UNSIGNED NOT NULL,
  `session_token` VARCHAR(64) NOT NULL UNIQUE COMMENT '세션 고유 토큰',
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` TIMESTAMP NULL COMMENT '최종 제출 시간',
  `total_time_seconds` INT UNSIGNED NULL COMMENT '전체 소요 시간',
  `final_answer` TEXT NULL COMMENT '최종 답안',
  `is_correct` TINYINT(1) NULL COMMENT '정답 여부',
  `score` DECIMAL(5,2) NULL COMMENT '점수 (0-100)',
  `status` ENUM('in_progress', 'submitted', 'abandoned') DEFAULT 'in_progress',
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE,
  INDEX `idx_student` (`student_id`),
  INDEX `idx_problem` (`problem_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_submitted` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 풀이 세션';

-- 단계별 제출 기록
CREATE TABLE IF NOT EXISTS `step_submissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `step_id` INT UNSIGNED NOT NULL COMMENT 'problem_steps.id',
  `attempt_number` TINYINT UNSIGNED DEFAULT 1 COMMENT '시도 횟수',
  `student_input` TEXT NOT NULL COMMENT '학생이 입력한 값',
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `time_spent_seconds` INT UNSIGNED NOT NULL COMMENT '이 단계에 소요된 시간',
  `hint_used` TINYINT(1) DEFAULT 0 COMMENT '힌트 사용 여부',
  `hint_viewed_at` TIMESTAMP NULL COMMENT '힌트를 본 시간',
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON NULL COMMENT '추가 데이터 (키 입력 속도, 수정 횟수 등)',
  FOREIGN KEY (`solution_id`) REFERENCES `student_solutions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`step_id`) REFERENCES `problem_steps`(`id`) ON DELETE CASCADE,
  INDEX `idx_solution` (`solution_id`),
  INDEX `idx_step` (`step_id`),
  INDEX `idx_submitted` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='단계별 제출 기록';

-- ============================================
-- 4. 건너뛰기 탐지
-- ============================================

-- 건너뛰기 탐지 결과
CREATE TABLE IF NOT EXISTS `skip_detections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `solution_id` INT UNSIGNED NOT NULL,
  `detection_type` ENUM('time_anomaly', 'logical_inconsistency', 'sequence_violation', 'hint_dependency') NOT NULL COMMENT '탐지 유형',
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT '심각도',
  `confidence_score` DECIMAL(5,2) NOT NULL COMMENT '신뢰도 점수 (0-100)',
  `description` TEXT NOT NULL COMMENT '탐지 내용 설명',
  `affected_steps` JSON NULL COMMENT '영향받은 단계 ID 배열',
  `evidence_data` JSON NULL COMMENT '증거 데이터',
  `detected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` INT UNSIGNED NULL COMMENT '검토한 교사 ID',
  `review_status` ENUM('pending', 'confirmed', 'false_positive', 'dismissed') DEFAULT 'pending',
  `review_notes` TEXT NULL,
  `reviewed_at` TIMESTAMP NULL,
  FOREIGN KEY (`solution_id`) REFERENCES `student_solutions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
  INDEX `idx_solution` (`solution_id`),
  INDEX `idx_type` (`detection_type`),
  INDEX `idx_severity` (`severity`),
  INDEX `idx_review_status` (`review_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='건너뛰기 탐지 결과';

-- 학생별 신뢰도 프로필
CREATE TABLE IF NOT EXISTS `student_trust_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL UNIQUE,
  `overall_trust_score` DECIMAL(5,2) DEFAULT 100.00 COMMENT '전체 신뢰도 점수 (0-100)',
  `total_solutions` INT UNSIGNED DEFAULT 0,
  `suspicious_solutions` INT UNSIGNED DEFAULT 0,
  `time_anomaly_count` INT UNSIGNED DEFAULT 0,
  `logical_inconsistency_count` INT UNSIGNED DEFAULT 0,
  `sequence_violation_count` INT UNSIGNED DEFAULT 0,
  `hint_dependency_count` INT UNSIGNED DEFAULT 0,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_trust_score` (`overall_trust_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생별 신뢰도 프로필';

-- ============================================
-- 5. 통계 및 분석
-- ============================================

-- 문제별 통계 (요약 테이블)
CREATE TABLE IF NOT EXISTS `problem_statistics` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `problem_id` INT UNSIGNED NOT NULL UNIQUE,
  `total_attempts` INT UNSIGNED DEFAULT 0,
  `correct_attempts` INT UNSIGNED DEFAULT 0,
  `avg_time_seconds` DECIMAL(10,2) NULL,
  `avg_score` DECIMAL(5,2) NULL,
  `skip_detection_rate` DECIMAL(5,2) NULL COMMENT '건너뛰기 탐지율 (%)',
  `last_calculated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제별 통계';

-- ============================================
-- 6. Moodle 연동
-- ============================================

-- Moodle 연동 로그
CREATE TABLE IF NOT EXISTS `moodle_sync_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `sync_type` ENUM('user', 'grade', 'quiz', 'activity') NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL COMMENT '연동된 엔티티 ID',
  `moodle_entity_id` INT UNSIGNED NOT NULL COMMENT 'Moodle 엔티티 ID',
  `sync_status` ENUM('success', 'failed', 'pending') DEFAULT 'pending',
  `request_data` JSON NULL,
  `response_data` JSON NULL,
  `error_message` TEXT NULL,
  `synced_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sync_type` (`sync_type`),
  INDEX `idx_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 연동 로그';

-- ============================================
-- 7. 시스템 설정
-- ============================================

-- 시스템 설정
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `data_type` ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
  `description` VARCHAR(500) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 설정';

-- ============================================
-- 인덱스 최적화
-- ============================================

-- 복합 인덱스 추가
CREATE INDEX `idx_solution_student_problem` ON `student_solutions`(`student_id`, `problem_id`, `submitted_at`);
CREATE INDEX `idx_step_submission_solution_step` ON `step_submissions`(`solution_id`, `step_id`, `submitted_at`);
CREATE INDEX `idx_detection_solution_type` ON `skip_detections`(`solution_id`, `detection_type`, `severity`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 기본 데이터 삽입
-- ============================================

-- 시스템 설정 기본값
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `data_type`, `description`) VALUES
('time_anomaly_threshold', '0.5', 'string', '시간 이상 탐지 임계값 (평균의 50%)'),
('skip_detection_enabled', 'true', 'boolean', '건너뛰기 탐지 활성화'),
('moodle_sync_enabled', 'false', 'boolean', 'Moodle 연동 활성화'),
('moodle_api_url', '', 'string', 'Moodle REST API URL'),
('moodle_api_token', '', 'string', 'Moodle API 토큰'),
('default_language', 'ko', 'string', '기본 언어 (ko/en)');

-- 문제 유형 기본 데이터
INSERT INTO `problem_types` (`name`, `display_name`, `description`, `category`) VALUES
('fraction_addition', '분수 덧셈', '분모가 다른 분수의 덧셈', 'fractions'),
('fraction_subtraction', '분수 뺄셈', '분모가 다른 분수의 뺄셈', 'fractions'),
('linear_equation', '일차방정식', '일차방정식 풀이', 'equations'),
('quadratic_equation', '이차방정식', '이차방정식 풀이', 'equations'),
('triangle_area', '삼각형 넓이', '삼각형의 넓이 구하기', 'geometry'),
('circle_area', '원의 넓이', '원의 넓이 구하기', 'geometry');

-- 완료
SELECT 'Database schema created successfully!' AS message;
