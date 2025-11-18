-- Root Wave Database Schema
-- MySQL 5.7 호환

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS `root_wave` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `root_wave`;

-- ============================================
-- 1. 사용자 세션 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` VARCHAR(100) NOT NULL,
    `user_id` INT UNSIGNED NULL,
    `course_id` INT UNSIGNED NULL,
    `started_at` DATETIME NOT NULL,
    `last_activity` DATETIME NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_session_id` (`session_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_is_active` (`is_active`),
    KEY `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. 문제 정보 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS `problems` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `moodle_question_id` INT UNSIGNED NULL COMMENT 'Moodle 문제 ID',
    `equation` VARCHAR(500) NOT NULL COMMENT '방정식',
    `equation_type` ENUM('linear', 'quadratic', 'cubic', 'polynomial', 'other') DEFAULT 'quadratic',
    `difficulty` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    `expected_root_count` TINYINT UNSIGNED NULL COMMENT '예상 근의 개수',
    `expected_roots` TEXT NULL COMMENT '예상 근 (JSON)',
    `course_id` INT UNSIGNED NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_moodle_question_id` (`moodle_question_id`),
    KEY `idx_equation_type` (`equation_type`),
    KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 근 변화 기록 테이블 (핵심)
-- ============================================
CREATE TABLE IF NOT EXISTS `root_changes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` INT UNSIGNED NULL COMMENT '세션 ID',
    `user_id` INT UNSIGNED NULL COMMENT '사용자 ID',
    `problem_id` INT UNSIGNED NULL COMMENT '문제 ID',
    `equation` VARCHAR(500) NOT NULL COMMENT '방정식',
    `old_count` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '이전 근의 개수',
    `new_count` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '새로운 근의 개수',
    `count_change` TINYINT NOT NULL COMMENT '변화량 (+ 증가, - 감소)',
    `roots` TEXT NULL COMMENT '근의 값들 (JSON)',
    `change_type` ENUM('increase', 'decrease', 'same') NOT NULL COMMENT '변화 유형',
    `wave_triggered` TINYINT(1) DEFAULT 1 COMMENT 'Wave 애니메이션 트리거 여부',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_problem_id` (`problem_id`),
    KEY `idx_change_type` (`change_type`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 근 변화 자동 계산 트리거
DELIMITER //
CREATE TRIGGER `trg_root_changes_before_insert`
BEFORE INSERT ON `root_changes`
FOR EACH ROW
BEGIN
    SET NEW.count_change = NEW.new_count - NEW.old_count;
    SET NEW.change_type = CASE
        WHEN NEW.new_count > NEW.old_count THEN 'increase'
        WHEN NEW.new_count < NEW.old_count THEN 'decrease'
        ELSE 'same'
    END;
END//
DELIMITER ;

-- ============================================
-- 4. 학생 응답 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS `problem_answers` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` INT UNSIGNED NULL,
    `user_id` INT UNSIGNED NULL,
    `problem_id` INT UNSIGNED NULL,
    `answer` TEXT NOT NULL COMMENT '학생 응답',
    `is_correct` TINYINT(1) NULL COMMENT '정답 여부',
    `submitted_at` DATETIME NOT NULL,
    `graded_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_problem_id` (`problem_id`),
    KEY `idx_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Wave 애니메이션 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS `wave_animations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` INT UNSIGNED NULL,
    `user_id` INT UNSIGNED NULL,
    `root_change_id` INT UNSIGNED NULL COMMENT '근 변화 ID',
    `animation_type` ENUM('increase', 'decrease') NOT NULL,
    `intensity` TINYINT UNSIGNED DEFAULT 1 COMMENT '애니메이션 강도 (1-10)',
    `duration_ms` INT UNSIGNED DEFAULT 1500 COMMENT '지속 시간 (밀리초)',
    `triggered_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_root_change_id` (`root_change_id`),
    KEY `idx_triggered_at` (`triggered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 시스템 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS `system_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` INT UNSIGNED NULL,
    `level` ENUM('info', 'warning', 'error', 'debug') DEFAULT 'info',
    `message` TEXT NOT NULL,
    `context` TEXT NULL COMMENT '추가 컨텍스트 (JSON)',
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_level` (`level`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 통계 뷰 (성능 최적화)
-- ============================================
CREATE OR REPLACE VIEW `v_root_change_statistics` AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_changes,
    SUM(CASE WHEN change_type = 'increase' THEN 1 ELSE 0 END) as increases,
    SUM(CASE WHEN change_type = 'decrease' THEN 1 ELSE 0 END) as decreases,
    AVG(new_count) as avg_root_count,
    MAX(new_count) as max_root_count
FROM root_changes
GROUP BY DATE(created_at);

-- ============================================
-- 8. 샘플 데이터 삽입
-- ============================================

-- 샘플 문제들
INSERT INTO `problems` (`equation`, `equation_type`, `difficulty`, `expected_root_count`, `expected_roots`) VALUES
('x^2 - 4 = 0', 'quadratic', 'easy', 2, '[-2, 2]'),
('x^2 + 1 = 0', 'quadratic', 'medium', 0, '[]'),
('x^2 - 2x + 1 = 0', 'quadratic', 'easy', 1, '[1]'),
('2x - 6 = 0', 'linear', 'easy', 1, '[3]'),
('x^2 - 5x + 6 = 0', 'quadratic', 'medium', 2, '[2, 3]'),
('x^3 - 6x^2 + 11x - 6 = 0', 'cubic', 'hard', 3, '[1, 2, 3]');

-- ============================================
-- 9. 인덱스 최적화
-- ============================================

-- 복합 인덱스 추가
ALTER TABLE `root_changes`
    ADD INDEX `idx_user_created` (`user_id`, `created_at`),
    ADD INDEX `idx_session_created` (`session_id`, `created_at`);

-- ============================================
-- 10. 데이터 정리 프로시저 (선택사항)
-- ============================================

DELIMITER //
CREATE PROCEDURE `sp_cleanup_old_logs`(IN days_to_keep INT)
BEGIN
    -- 오래된 로그 삭제 (기본 90일)
    DELETE FROM system_logs
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);

    -- 비활성 세션 삭제
    DELETE FROM sessions
    WHERE is_active = 0
    AND last_activity < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);

    SELECT ROW_COUNT() as deleted_rows;
END//
DELIMITER ;

-- ============================================
-- 완료 메시지
-- ============================================
SELECT 'Root Wave 데이터베이스 스키마 생성 완료!' as status;
