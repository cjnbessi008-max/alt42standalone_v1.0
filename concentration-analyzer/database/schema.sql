-- Concentration Analyzer Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS concentration_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE concentration_analyzer;

-- 사용자 활동 로그 테이블 (Moodle에서 동기화)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Moodle 사용자 ID',
    course_id INT UNSIGNED NOT NULL COMMENT 'Moodle 코스 ID',
    activity_type VARCHAR(50) NOT NULL COMMENT '활동 유형 (view, submit, click 등)',
    component VARCHAR(100) COMMENT 'Moodle 컴포넌트',
    action VARCHAR(100) COMMENT '액션',
    target VARCHAR(100) COMMENT '타겟',
    object_id INT UNSIGNED COMMENT '객체 ID',
    context_id INT UNSIGNED COMMENT '컨텍스트 ID',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    time_created INT UNSIGNED NOT NULL COMMENT '생성 시간 (Unix timestamp)',
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '동기화 시간',
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_time_created (time_created),
    INDEX idx_user_time (user_id, time_created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 활동 로그';

-- 집중도 계산 결과 테이블
CREATE TABLE IF NOT EXISTS concentration_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    time_window_start INT UNSIGNED NOT NULL COMMENT '시간 윈도우 시작 (Unix timestamp)',
    time_window_end INT UNSIGNED NOT NULL COMMENT '시간 윈도우 종료 (Unix timestamp)',
    activity_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '활동 횟수',
    concentration_score DECIMAL(5,2) NOT NULL COMMENT '집중도 점수 (0-100)',
    active_duration_seconds INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '실제 활동 시간 (초)',
    click_rate DECIMAL(8,4) COMMENT '클릭률 (분당)',
    response_time_avg DECIMAL(10,4) COMMENT '평균 응답 시간 (초)',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_time_window (time_window_start, time_window_end),
    INDEX idx_user_course_time (user_id, course_id, time_window_start),
    UNIQUE KEY unique_user_course_window (user_id, course_id, time_window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='집중도 측정 데이터';

-- 들쭉날쭉한 구간 분석 결과 테이블
CREATE TABLE IF NOT EXISTS fluctuation_analysis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    analysis_start INT UNSIGNED NOT NULL COMMENT '분석 시작 시간',
    analysis_end INT UNSIGNED NOT NULL COMMENT '분석 종료 시간',
    fluctuation_type VARCHAR(50) NOT NULL COMMENT '변동 유형 (spike, drop, irregular)',
    severity ENUM('low', 'medium', 'high') NOT NULL COMMENT '심각도',
    start_time INT UNSIGNED NOT NULL COMMENT '변동 시작 시간',
    end_time INT UNSIGNED NOT NULL COMMENT '변동 종료 시간',
    baseline_score DECIMAL(5,2) COMMENT '기준선 점수',
    peak_score DECIMAL(5,2) COMMENT '최고 점수',
    trough_score DECIMAL(5,2) COMMENT '최저 점수',
    standard_deviation DECIMAL(8,4) COMMENT '표준편차',
    z_score DECIMAL(8,4) COMMENT 'Z-점수',
    description TEXT COMMENT '분석 설명',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_severity (severity),
    INDEX idx_fluctuation_type (fluctuation_type),
    INDEX idx_time_range (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='집중도 변동 분석';

-- 분석 리포트 테이블
CREATE TABLE IF NOT EXISTS analysis_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    report_type VARCHAR(50) NOT NULL COMMENT '리포트 유형 (daily, weekly, monthly)',
    period_start INT UNSIGNED NOT NULL,
    period_end INT UNSIGNED NOT NULL,
    total_sessions INT UNSIGNED DEFAULT 0 COMMENT '총 세션 수',
    avg_concentration_score DECIMAL(5,2) COMMENT '평균 집중도',
    max_concentration_score DECIMAL(5,2) COMMENT '최대 집중도',
    min_concentration_score DECIMAL(5,2) COMMENT '최소 집중도',
    fluctuation_count INT UNSIGNED DEFAULT 0 COMMENT '변동 구간 수',
    high_severity_count INT UNSIGNED DEFAULT 0 COMMENT '높은 심각도 변동 수',
    total_active_time INT UNSIGNED DEFAULT 0 COMMENT '총 활동 시간 (초)',
    summary_text TEXT COMMENT '요약',
    recommendations JSON COMMENT '추천 사항',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_report_type (report_type),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='분석 리포트';

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 설정';

-- 기본 설정 데이터 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('last_moodle_sync', '0', '마지막 Moodle 동기화 시간'),
('concentration_algorithm_version', '1.0', '집중도 계산 알고리즘 버전'),
('auto_sync_enabled', '1', '자동 동기화 활성화 여부'),
('sync_interval_minutes', '10', '동기화 간격 (분)');

-- 동기화 이력 테이블
CREATE TABLE IF NOT EXISTS sync_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL COMMENT '동기화 유형',
    records_synced INT UNSIGNED DEFAULT 0,
    sync_start TIMESTAMP NULL,
    sync_end TIMESTAMP NULL,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='동기화 이력';
