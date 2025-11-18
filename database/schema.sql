-- Eye Tracking Attention Detection System
-- MySQL 5.7 Database Schema
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS eye_tracking_attention DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eye_tracking_attention;

-- =====================================================
-- Table: tracking_sessions
-- 학습 세션 정보 저장
-- =====================================================
CREATE TABLE IF NOT EXISTS tracking_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE COMMENT '세션 고유 ID (UUID)',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle 사용자 ID',
    course_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle 코스 ID',
    activity_id BIGINT UNSIGNED NULL COMMENT 'Moodle 활동 ID (옵션)',
    activity_type VARCHAR(50) NULL COMMENT '활동 타입 (quiz, lesson, page, etc.)',

    -- 세션 타임스탬프
    started_at DATETIME NOT NULL COMMENT '세션 시작 시간',
    ended_at DATETIME NULL COMMENT '세션 종료 시간',
    duration_seconds INT UNSIGNED NULL COMMENT '세션 지속 시간 (초)',

    -- 세션 상태
    status ENUM('active', 'completed', 'abandoned', 'error') DEFAULT 'active' COMMENT '세션 상태',

    -- 기기 정보
    user_agent TEXT NULL COMMENT '사용자 브라우저 정보',
    ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
    screen_width INT UNSIGNED NULL COMMENT '화면 너비',
    screen_height INT UNSIGNED NULL COMMENT '화면 높이',

    -- 통계 요약
    total_blinks INT UNSIGNED DEFAULT 0 COMMENT '총 깜빡임 횟수',
    total_events INT UNSIGNED DEFAULT 0 COMMENT '총 이벤트 수',
    avg_attention_score DECIMAL(5,2) NULL COMMENT '평균 집중도 점수 (0-100)',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='눈 추적 세션 정보';

-- =====================================================
-- Table: eye_tracking_events
-- 눈 추적 이벤트 상세 데이터 (고빈도 데이터)
-- =====================================================
CREATE TABLE IF NOT EXISTS eye_tracking_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL COMMENT '세션 ID (외래키)',

    -- 타임스탬프 (밀리초 단위)
    timestamp BIGINT UNSIGNED NOT NULL COMMENT '이벤트 타임스탬프 (Unix timestamp ms)',
    relative_time INT UNSIGNED NOT NULL COMMENT '세션 시작 후 경과 시간 (ms)',

    -- 눈 깜빡임 데이터
    blink_detected BOOLEAN DEFAULT FALSE COMMENT '깜빡임 감지 여부',
    blink_duration INT UNSIGNED NULL COMMENT '깜빡임 지속 시간 (ms)',

    -- 시선 위치 (정규화된 좌표 0.0 ~ 1.0)
    gaze_x DECIMAL(5,4) NULL COMMENT '시선 X 좌표 (0=좌측, 1=우측)',
    gaze_y DECIMAL(5,4) NULL COMMENT '시선 Y 좌표 (0=상단, 1=하단)',
    gaze_on_screen BOOLEAN DEFAULT TRUE COMMENT '화면 내 시선 여부',

    -- 얼굴 방향 및 거리
    face_direction ENUM('center', 'left', 'right', 'up', 'down', 'away') DEFAULT 'center' COMMENT '얼굴 방향',
    face_distance DECIMAL(6,2) NULL COMMENT '화면과의 거리 (cm, 추정치)',
    head_rotation_x DECIMAL(6,2) NULL COMMENT '머리 회전 X축 (도)',
    head_rotation_y DECIMAL(6,2) NULL COMMENT '머리 회전 Y축 (도)',
    head_rotation_z DECIMAL(6,2) NULL COMMENT '머리 회전 Z축 (도)',

    -- 신뢰도 및 품질
    tracking_confidence DECIMAL(4,3) NULL COMMENT '추적 신뢰도 (0.0 ~ 1.0)',
    face_detected BOOLEAN DEFAULT TRUE COMMENT '얼굴 감지 여부',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_blink_detected (blink_detected),
    INDEX idx_gaze_on_screen (gaze_on_screen),

    FOREIGN KEY (session_id) REFERENCES tracking_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='눈 추적 이벤트 원시 데이터';

-- =====================================================
-- Table: attention_metrics
-- 집중도 분석 결과 (시간 윈도우별 집계)
-- =====================================================
CREATE TABLE IF NOT EXISTS attention_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL COMMENT '세션 ID (외래키)',

    -- 시간 윈도우 (기본 30초 단위)
    window_start BIGINT UNSIGNED NOT NULL COMMENT '윈도우 시작 시간 (Unix timestamp ms)',
    window_end BIGINT UNSIGNED NOT NULL COMMENT '윈도우 종료 시간 (Unix timestamp ms)',
    window_duration INT UNSIGNED NOT NULL COMMENT '윈도우 지속 시간 (ms)',

    -- 깜빡임 메트릭
    blink_count INT UNSIGNED DEFAULT 0 COMMENT '깜빡임 횟수',
    blink_rate DECIMAL(6,2) NULL COMMENT '분당 깜빡임 횟수',
    avg_blink_duration DECIMAL(6,2) NULL COMMENT '평균 깜빡임 지속 시간 (ms)',
    blink_irregularity DECIMAL(5,4) NULL COMMENT '깜빡임 불규칙성 (표준편차)',

    -- 시선 메트릭
    gaze_on_screen_ratio DECIMAL(5,4) NULL COMMENT '화면 내 시선 비율 (0.0 ~ 1.0)',
    gaze_movement_score DECIMAL(6,2) NULL COMMENT '시선 이동 점수 (0=정지, 높을수록 활발)',
    avg_gaze_fixation_duration INT UNSIGNED NULL COMMENT '평균 시선 고정 시간 (ms)',

    -- 얼굴/자세 메트릭
    face_center_ratio DECIMAL(5,4) NULL COMMENT '정면 응시 비율 (0.0 ~ 1.0)',
    face_detected_ratio DECIMAL(5,4) NULL COMMENT '얼굴 감지 비율 (0.0 ~ 1.0)',
    avg_face_distance DECIMAL(6,2) NULL COMMENT '평균 얼굴 거리 (cm)',
    posture_stability DECIMAL(5,4) NULL COMMENT '자세 안정성 (0.0 ~ 1.0)',

    -- 집중도 점수 (0 ~ 100)
    blink_score DECIMAL(5,2) NULL COMMENT '깜빡임 기반 점수',
    gaze_score DECIMAL(5,2) NULL COMMENT '시선 기반 점수',
    face_score DECIMAL(5,2) NULL COMMENT '얼굴/자세 기반 점수',
    attention_score DECIMAL(5,2) NULL COMMENT '종합 집중도 점수',
    attention_level ENUM('high', 'medium', 'low', 'critical') NULL COMMENT '집중도 레벨',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session_id (session_id),
    INDEX idx_window_start (window_start),
    INDEX idx_attention_score (attention_score),
    INDEX idx_attention_level (attention_level),

    FOREIGN KEY (session_id) REFERENCES tracking_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='집중도 분석 메트릭 (윈도우별)';

-- =====================================================
-- Table: attention_alerts
-- 집중 이탈 경고 이벤트
-- =====================================================
CREATE TABLE IF NOT EXISTS attention_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL COMMENT '세션 ID (외래키)',
    metric_id BIGINT UNSIGNED NULL COMMENT '메트릭 ID (옵션)',

    -- 경고 정보
    alert_type ENUM(
        'excessive_blinking',      -- 과도한 깜빡임
        'insufficient_blinking',   -- 깜빡임 부족
        'gaze_away',               -- 시선 이탈
        'face_away',               -- 고개 돌림
        'no_face_detected',        -- 얼굴 미감지 (자리 이탈)
        'irregular_pattern',       -- 불규칙한 패턴
        'low_attention',           -- 낮은 집중도
        'fatigue_detected'         -- 피로 감지
    ) NOT NULL COMMENT '경고 유형',

    severity ENUM('info', 'warning', 'critical') DEFAULT 'warning' COMMENT '심각도',

    -- 타임스탬프
    detected_at BIGINT UNSIGNED NOT NULL COMMENT '감지 시간 (Unix timestamp ms)',
    duration INT UNSIGNED NULL COMMENT '지속 시간 (ms)',

    -- 경고 상세
    description TEXT NULL COMMENT '경고 설명',
    threshold_value DECIMAL(10,4) NULL COMMENT '임계값',
    actual_value DECIMAL(10,4) NULL COMMENT '실제값',

    -- 조치 사항
    notification_sent BOOLEAN DEFAULT FALSE COMMENT '알림 전송 여부',
    acknowledged BOOLEAN DEFAULT FALSE COMMENT '확인 여부',
    acknowledged_at DATETIME NULL COMMENT '확인 시간',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session_id (session_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_detected_at (detected_at),

    FOREIGN KEY (session_id) REFERENCES tracking_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (metric_id) REFERENCES attention_metrics(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='집중 이탈 경고';

-- =====================================================
-- Table: user_settings
-- 사용자별 설정 및 선호도
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Moodle 사용자 ID',

    -- 추적 설정
    tracking_enabled BOOLEAN DEFAULT TRUE COMMENT '추적 활성화 여부',
    consent_given BOOLEAN DEFAULT FALSE COMMENT '동의 여부',
    consent_date DATETIME NULL COMMENT '동의 날짜',

    -- 경고 설정
    alerts_enabled BOOLEAN DEFAULT TRUE COMMENT '경고 활성화',
    alert_sound_enabled BOOLEAN DEFAULT FALSE COMMENT '소리 경고',
    alert_visual_enabled BOOLEAN DEFAULT TRUE COMMENT '시각 경고',

    -- 임계값 설정 (커스터마이즈)
    blink_rate_min DECIMAL(5,2) DEFAULT 10.0 COMMENT '최소 분당 깜빡임 (이하 시 경고)',
    blink_rate_max DECIMAL(5,2) DEFAULT 35.0 COMMENT '최대 분당 깜빡임 (이상 시 경고)',
    gaze_away_threshold INT UNSIGNED DEFAULT 5000 COMMENT '시선 이탈 경고 시간 (ms)',
    face_away_threshold INT UNSIGNED DEFAULT 5000 COMMENT '얼굴 이탈 경고 시간 (ms)',
    no_face_threshold INT UNSIGNED DEFAULT 10000 COMMENT '얼굴 미감지 경고 시간 (ms)',

    -- 프라이버시 설정
    data_retention_days INT UNSIGNED DEFAULT 30 COMMENT '데이터 보존 기간 (일)',
    share_with_teacher BOOLEAN DEFAULT TRUE COMMENT '교사와 데이터 공유',
    anonymize_data BOOLEAN DEFAULT FALSE COMMENT '데이터 익명화',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_tracking_enabled (tracking_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 설정';

-- =====================================================
-- Table: calibration_data
-- 눈 추적 캘리브레이션 데이터
-- =====================================================
CREATE TABLE IF NOT EXISTS calibration_data (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle 사용자 ID',

    -- 캘리브레이션 정보
    calibration_date DATETIME NOT NULL COMMENT '캘리브레이션 날짜',
    calibration_score DECIMAL(5,4) NULL COMMENT '캘리브레이션 정확도 (0.0 ~ 1.0)',
    calibration_points INT UNSIGNED DEFAULT 9 COMMENT '캘리브레이션 포인트 수',

    -- 캘리브레이션 파라미터 (JSON)
    parameters JSON NULL COMMENT '캘리브레이션 파라미터',

    -- 디바이스 정보
    device_id VARCHAR(128) NULL COMMENT '디바이스 고유 ID',
    camera_info TEXT NULL COMMENT '카메라 정보',

    -- 유효성
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 캘리브레이션 여부',
    expires_at DATETIME NULL COMMENT '만료 일시',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_calibration_date (calibration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='눈 추적 캘리브레이션 데이터';

-- =====================================================
-- Table: analytics_summary
-- 교사/관리자용 분석 요약 (일별 집계)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 집계 범위
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle 사용자 ID',
    course_id BIGINT UNSIGNED NULL COMMENT 'Moodle 코스 ID (NULL=전체)',
    date DATE NOT NULL COMMENT '집계 날짜',

    -- 세션 통계
    total_sessions INT UNSIGNED DEFAULT 0 COMMENT '총 세션 수',
    total_duration_seconds BIGINT UNSIGNED DEFAULT 0 COMMENT '총 학습 시간 (초)',
    avg_session_duration DECIMAL(10,2) NULL COMMENT '평균 세션 시간 (초)',

    -- 집중도 통계
    avg_attention_score DECIMAL(5,2) NULL COMMENT '평균 집중도 점수',
    high_attention_percentage DECIMAL(5,2) NULL COMMENT '높은 집중도 비율 (%)',
    medium_attention_percentage DECIMAL(5,2) NULL COMMENT '보통 집중도 비율 (%)',
    low_attention_percentage DECIMAL(5,2) NULL COMMENT '낮은 집중도 비율 (%)',

    -- 경고 통계
    total_alerts INT UNSIGNED DEFAULT 0 COMMENT '총 경고 수',
    critical_alerts INT UNSIGNED DEFAULT 0 COMMENT '심각 경고 수',
    warning_alerts INT UNSIGNED DEFAULT 0 COMMENT '일반 경고 수',

    -- 패턴 통계
    avg_blink_rate DECIMAL(6,2) NULL COMMENT '평균 분당 깜빡임',
    avg_gaze_on_screen DECIMAL(5,4) NULL COMMENT '평균 화면 시선 비율',
    avg_face_detected DECIMAL(5,4) NULL COMMENT '평균 얼굴 감지 비율',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_course_date (user_id, course_id, date),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='분석 요약 (일별 집계)';

-- =====================================================
-- Table: system_logs
-- 시스템 로그 및 오류 추적
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 로그 정보
    level ENUM('debug', 'info', 'warning', 'error', 'critical') DEFAULT 'info' COMMENT '로그 레벨',
    category VARCHAR(50) NOT NULL COMMENT '카테고리 (tracking, api, auth, etc.)',
    message TEXT NOT NULL COMMENT '로그 메시지',

    -- 컨텍스트
    user_id BIGINT UNSIGNED NULL COMMENT '관련 사용자 ID',
    session_id VARCHAR(64) NULL COMMENT '관련 세션 ID',
    request_uri TEXT NULL COMMENT '요청 URI',
    request_method VARCHAR(10) NULL COMMENT 'HTTP 메소드',

    -- 오류 정보
    error_code VARCHAR(50) NULL COMMENT '오류 코드',
    error_details JSON NULL COMMENT '오류 상세 (JSON)',
    stack_trace TEXT NULL COMMENT '스택 트레이스',

    -- 클라이언트 정보
    ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
    user_agent TEXT NULL COMMENT '사용자 에이전트',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_level (level),
    INDEX idx_category (category),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 로그';

-- =====================================================
-- Views for reporting
-- =====================================================

-- 활성 세션 뷰
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT
    s.session_id,
    s.user_id,
    s.course_id,
    s.activity_type,
    s.started_at,
    TIMESTAMPDIFF(SECOND, s.started_at, NOW()) as duration_seconds,
    s.avg_attention_score,
    COUNT(DISTINCT a.id) as alert_count
FROM tracking_sessions s
LEFT JOIN attention_alerts a ON s.session_id = a.session_id AND a.severity IN ('warning', 'critical')
WHERE s.status = 'active'
GROUP BY s.session_id, s.user_id, s.course_id, s.activity_type, s.started_at, s.avg_attention_score;

-- 최근 경고 뷰
CREATE OR REPLACE VIEW v_recent_alerts AS
SELECT
    a.id,
    a.session_id,
    s.user_id,
    s.course_id,
    a.alert_type,
    a.severity,
    FROM_UNIXTIME(a.detected_at/1000) as detected_time,
    a.duration,
    a.notification_sent,
    a.acknowledged
FROM attention_alerts a
JOIN tracking_sessions s ON a.session_id = s.session_id
WHERE a.detected_at >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 HOUR)) * 1000
ORDER BY a.detected_at DESC;

-- 사용자별 집중도 통계 뷰
CREATE OR REPLACE VIEW v_user_attention_stats AS
SELECT
    s.user_id,
    s.course_id,
    COUNT(DISTINCT s.session_id) as total_sessions,
    SUM(s.duration_seconds) as total_duration_seconds,
    AVG(s.avg_attention_score) as avg_attention_score,
    SUM(CASE WHEN s.avg_attention_score >= 80 THEN 1 ELSE 0 END) as high_attention_sessions,
    SUM(CASE WHEN s.avg_attention_score < 50 THEN 1 ELSE 0 END) as low_attention_sessions,
    COUNT(DISTINCT a.id) as total_alerts
FROM tracking_sessions s
LEFT JOIN attention_alerts a ON s.session_id = a.session_id
WHERE s.status = 'completed'
GROUP BY s.user_id, s.course_id;

-- =====================================================
-- Stored Procedures
-- =====================================================

DELIMITER //

-- 세션 시작 프로시저
CREATE PROCEDURE sp_start_session(
    IN p_session_id VARCHAR(64),
    IN p_user_id BIGINT,
    IN p_course_id BIGINT,
    IN p_activity_id BIGINT,
    IN p_activity_type VARCHAR(50),
    IN p_user_agent TEXT,
    IN p_ip_address VARCHAR(45),
    IN p_screen_width INT,
    IN p_screen_height INT
)
BEGIN
    INSERT INTO tracking_sessions (
        session_id, user_id, course_id, activity_id, activity_type,
        started_at, status, user_agent, ip_address, screen_width, screen_height
    ) VALUES (
        p_session_id, p_user_id, p_course_id, p_activity_id, p_activity_type,
        NOW(), 'active', p_user_agent, p_ip_address, p_screen_width, p_screen_height
    );
END //

-- 세션 종료 프로시저
CREATE PROCEDURE sp_end_session(
    IN p_session_id VARCHAR(64)
)
BEGIN
    UPDATE tracking_sessions
    SET
        ended_at = NOW(),
        duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
        status = 'completed'
    WHERE session_id = p_session_id AND status = 'active';
END //

-- 집중도 점수 계산 프로시저
CREATE PROCEDURE sp_calculate_attention_score(
    IN p_metric_id BIGINT
)
BEGIN
    DECLARE v_blink_score DECIMAL(5,2);
    DECLARE v_gaze_score DECIMAL(5,2);
    DECLARE v_face_score DECIMAL(5,2);
    DECLARE v_attention_score DECIMAL(5,2);
    DECLARE v_attention_level VARCHAR(20);

    -- 메트릭 조회
    SELECT
        -- 깜빡임 점수 (15-20 bpm이 최적)
        CASE
            WHEN blink_rate BETWEEN 15 AND 20 THEN 100
            WHEN blink_rate BETWEEN 10 AND 25 THEN 80
            WHEN blink_rate BETWEEN 5 AND 30 THEN 60
            ELSE 40
        END,
        -- 시선 점수 (화면 내 시선 비율)
        gaze_on_screen_ratio * 100,
        -- 얼굴 점수 (정면 응시 비율 + 얼굴 감지 비율)
        (face_center_ratio * 0.6 + face_detected_ratio * 0.4) * 100
    INTO v_blink_score, v_gaze_score, v_face_score
    FROM attention_metrics
    WHERE id = p_metric_id;

    -- 종합 점수 계산 (가중 평균)
    SET v_attention_score = (v_blink_score * 0.3) + (v_gaze_score * 0.4) + (v_face_score * 0.3);

    -- 레벨 결정
    SET v_attention_level = CASE
        WHEN v_attention_score >= 80 THEN 'high'
        WHEN v_attention_score >= 60 THEN 'medium'
        WHEN v_attention_score >= 40 THEN 'low'
        ELSE 'critical'
    END;

    -- 업데이트
    UPDATE attention_metrics
    SET
        blink_score = v_blink_score,
        gaze_score = v_gaze_score,
        face_score = v_face_score,
        attention_score = v_attention_score,
        attention_level = v_attention_level
    WHERE id = p_metric_id;
END //

-- 일별 분석 요약 생성 프로시저
CREATE PROCEDURE sp_generate_daily_summary(
    IN p_date DATE
)
BEGIN
    INSERT INTO analytics_summary (
        user_id, course_id, date,
        total_sessions, total_duration_seconds, avg_session_duration,
        avg_attention_score,
        high_attention_percentage, medium_attention_percentage, low_attention_percentage,
        total_alerts, critical_alerts, warning_alerts,
        avg_blink_rate, avg_gaze_on_screen, avg_face_detected
    )
    SELECT
        s.user_id,
        s.course_id,
        p_date,
        COUNT(DISTINCT s.session_id),
        SUM(s.duration_seconds),
        AVG(s.duration_seconds),
        AVG(m.attention_score),
        SUM(CASE WHEN m.attention_level = 'high' THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id),
        SUM(CASE WHEN m.attention_level = 'medium' THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id),
        SUM(CASE WHEN m.attention_level IN ('low', 'critical') THEN 1 ELSE 0 END) * 100.0 / COUNT(m.id),
        COUNT(DISTINCT a.id),
        SUM(CASE WHEN a.severity = 'critical' THEN 1 ELSE 0 END),
        SUM(CASE WHEN a.severity = 'warning' THEN 1 ELSE 0 END),
        AVG(m.blink_rate),
        AVG(m.gaze_on_screen_ratio),
        AVG(m.face_detected_ratio)
    FROM tracking_sessions s
    LEFT JOIN attention_metrics m ON s.session_id = m.session_id
    LEFT JOIN attention_alerts a ON s.session_id = a.session_id
    WHERE DATE(s.started_at) = p_date
    GROUP BY s.user_id, s.course_id
    ON DUPLICATE KEY UPDATE
        total_sessions = VALUES(total_sessions),
        total_duration_seconds = VALUES(total_duration_seconds),
        avg_session_duration = VALUES(avg_session_duration),
        avg_attention_score = VALUES(avg_attention_score),
        high_attention_percentage = VALUES(high_attention_percentage),
        medium_attention_percentage = VALUES(medium_attention_percentage),
        low_attention_percentage = VALUES(low_attention_percentage),
        total_alerts = VALUES(total_alerts),
        critical_alerts = VALUES(critical_alerts),
        warning_alerts = VALUES(warning_alerts),
        avg_blink_rate = VALUES(avg_blink_rate),
        avg_gaze_on_screen = VALUES(avg_gaze_on_screen),
        avg_face_detected = VALUES(avg_face_detected),
        updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- Indexes for performance optimization
-- =====================================================

-- 복합 인덱스 추가
CREATE INDEX idx_session_timestamp ON eye_tracking_events(session_id, timestamp);
CREATE INDEX idx_metric_session_window ON attention_metrics(session_id, window_start);
CREATE INDEX idx_alert_session_detected ON attention_alerts(session_id, detected_at);

-- =====================================================
-- Sample data for testing (optional)
-- =====================================================

-- INSERT INTO user_settings (user_id, consent_given, consent_date) VALUES
-- (1, TRUE, NOW()),
-- (2, TRUE, NOW()),
-- (3, TRUE, NOW());

-- =====================================================
-- Database maintenance tasks
-- =====================================================

-- 오래된 이벤트 데이터 정리 (30일 이상)
-- 크론잡으로 정기 실행 권장
-- DELETE FROM eye_tracking_events
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 통계 업데이트
-- ANALYZE TABLE tracking_sessions, eye_tracking_events, attention_metrics;
