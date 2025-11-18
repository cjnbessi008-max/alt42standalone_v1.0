-- Thinking Tempo Tracking Database Schema
-- MySQL 5.7 Compatible
-- Microsecond precision timing for cognitive pattern analysis

-- ============================================
-- 1. Event Tracking Tables
-- ============================================

-- 문제 풀이 세션 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_sessions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) UNSIGNED NOT NULL,
    quiz_id BIGINT(10) UNSIGNED NOT NULL,
    question_id BIGINT(10) UNSIGNED NOT NULL,
    attempt_id BIGINT(10) UNSIGNED NOT NULL,
    session_start BIGINT(20) NOT NULL COMMENT 'Unix timestamp in microseconds',
    session_end BIGINT(20) DEFAULT NULL COMMENT 'Unix timestamp in microseconds',
    total_duration BIGINT(20) DEFAULT NULL COMMENT 'Duration in microseconds',
    is_completed TINYINT(1) DEFAULT 0,
    final_answer TEXT,
    is_correct TINYINT(1) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_quiz (userid, quiz_id),
    KEY idx_question (question_id),
    KEY idx_attempt (attempt_id),
    KEY idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제 풀이 세션 추적';

-- 마이크로 이벤트 추적 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_events (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT 'keydown, keyup, mousemove, click, focus, blur, paste, etc',
    event_timestamp BIGINT(20) NOT NULL COMMENT 'Unix timestamp in microseconds',
    elapsed_time BIGINT(20) NOT NULL COMMENT 'Microseconds since session start',
    event_data JSON DEFAULT NULL COMMENT 'Additional event details',
    element_id VARCHAR(255) DEFAULT NULL,
    element_type VARCHAR(50) DEFAULT NULL,
    x_position INT DEFAULT NULL,
    y_position INT DEFAULT NULL,
    key_code VARCHAR(20) DEFAULT NULL,
    key_char VARCHAR(10) DEFAULT NULL,
    input_value TEXT DEFAULT NULL COMMENT 'Current input value at event time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_event_type (event_type),
    KEY idx_timestamp (event_timestamp),
    KEY idx_elapsed_time (elapsed_time),
    CONSTRAINT fk_session FOREIGN KEY (session_id)
        REFERENCES mdl_thinking_tempo_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='마이크로초 단위 이벤트 추적';

-- ============================================
-- 2. Tempo Analysis Tables
-- ============================================

-- 사고 템포 분석 결과 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_analysis (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) UNSIGNED NOT NULL,
    tempo_category VARCHAR(50) NOT NULL COMMENT 'fast, normal, deep, stuck',
    start_time BIGINT(20) NOT NULL COMMENT 'Microseconds from session start',
    end_time BIGINT(20) NOT NULL COMMENT 'Microseconds from session start',
    duration BIGINT(20) NOT NULL COMMENT 'Duration in microseconds',
    event_count INT DEFAULT 0,
    thinking_intensity DECIMAL(5,2) DEFAULT NULL COMMENT '0-100 scale',
    cognitive_load DECIMAL(5,2) DEFAULT NULL COMMENT '0-100 scale',
    confidence_score DECIMAL(5,2) DEFAULT NULL COMMENT '0-1 scale',
    analysis_metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_tempo_category (tempo_category),
    KEY idx_start_time (start_time),
    CONSTRAINT fk_tempo_session FOREIGN KEY (session_id)
        REFERENCES mdl_thinking_tempo_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사고 템포 분석 결과';

-- 사고 패턴 프로파일 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_profiles (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) UNSIGNED NOT NULL,
    quiz_id BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'NULL for overall profile',
    question_type VARCHAR(100) DEFAULT NULL,
    avg_fast_tempo_duration BIGINT(20) DEFAULT NULL,
    avg_normal_tempo_duration BIGINT(20) DEFAULT NULL,
    avg_deep_tempo_duration BIGINT(20) DEFAULT NULL,
    avg_stuck_duration BIGINT(20) DEFAULT NULL,
    fast_tempo_percentage DECIMAL(5,2) DEFAULT NULL,
    normal_tempo_percentage DECIMAL(5,2) DEFAULT NULL,
    deep_tempo_percentage DECIMAL(5,2) DEFAULT NULL,
    stuck_percentage DECIMAL(5,2) DEFAULT NULL,
    avg_typing_speed DECIMAL(10,2) DEFAULT NULL COMMENT 'characters per second',
    avg_pause_duration BIGINT(20) DEFAULT NULL,
    revision_count INT DEFAULT 0,
    backspace_count INT DEFAULT 0,
    copy_paste_count INT DEFAULT 0,
    thinking_style VARCHAR(50) DEFAULT NULL COMMENT 'impulsive, reflective, methodical, etc',
    confidence_level DECIMAL(5,2) DEFAULT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sample_size INT DEFAULT 0 COMMENT 'Number of sessions analyzed',
    PRIMARY KEY (id),
    UNIQUE KEY idx_user_quiz_type (userid, quiz_id, question_type),
    KEY idx_userid (userid),
    KEY idx_thinking_style (thinking_style)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습자 사고 패턴 프로파일';

-- ============================================
-- 3. Pattern Detection Tables
-- ============================================

-- 사고 패턴 라이브러리 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_patterns (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL COMMENT 'solving_strategy, struggle_indicator, mastery_signal, etc',
    description TEXT,
    detection_rules JSON NOT NULL COMMENT 'Pattern detection criteria',
    temporal_signature JSON DEFAULT NULL COMMENT 'Expected timing patterns',
    confidence_threshold DECIMAL(5,2) DEFAULT 0.75,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_pattern_name (pattern_name),
    KEY idx_pattern_type (pattern_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사고 패턴 정의 라이브러리';

-- 감지된 패턴 인스턴스 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_detected_patterns (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) UNSIGNED NOT NULL,
    pattern_id BIGINT(10) UNSIGNED NOT NULL,
    start_time BIGINT(20) NOT NULL,
    end_time BIGINT(20) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    matched_features JSON DEFAULT NULL,
    impact_on_outcome VARCHAR(50) DEFAULT NULL COMMENT 'positive, negative, neutral',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_pattern (pattern_id),
    KEY idx_confidence (confidence_score),
    CONSTRAINT fk_pattern_session FOREIGN KEY (session_id)
        REFERENCES mdl_thinking_tempo_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_pattern_def FOREIGN KEY (pattern_id)
        REFERENCES mdl_thinking_tempo_patterns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='감지된 사고 패턴 인스턴스';

-- ============================================
-- 4. Visualization Data Tables
-- ============================================

-- 사고 템포 지도 데이터 (미리 계산된 시각화 데이터)
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_map_data (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) UNSIGNED NOT NULL,
    time_bucket BIGINT(20) NOT NULL COMMENT 'Time bucket in microseconds (e.g., 100ms intervals)',
    bucket_start BIGINT(20) NOT NULL,
    bucket_end BIGINT(20) NOT NULL,
    tempo_score DECIMAL(5,2) NOT NULL COMMENT '0-100, higher = faster tempo',
    activity_level DECIMAL(5,2) DEFAULT NULL COMMENT 'Event frequency in bucket',
    cognitive_load DECIMAL(5,2) DEFAULT NULL,
    dominant_event_type VARCHAR(50) DEFAULT NULL,
    event_count INT DEFAULT 0,
    visualization_metadata JSON DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_session_bucket (session_id, time_bucket),
    KEY idx_session (session_id),
    CONSTRAINT fk_map_session FOREIGN KEY (session_id)
        REFERENCES mdl_thinking_tempo_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사고 템포 지도 시각화 데이터';

-- ============================================
-- 5. Configuration Tables
-- ============================================

-- 추적 설정 테이블
CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_config (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    quiz_id BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'NULL for global config',
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string' COMMENT 'string, int, float, json, boolean',
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_quiz_key (quiz_id, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추적 시스템 설정';

-- ============================================
-- 6. Insert Default Configurations
-- ============================================

INSERT INTO mdl_thinking_tempo_config (quiz_id, config_key, config_value, config_type, description) VALUES
(NULL, 'fast_tempo_threshold_ms', '500', 'int', 'Threshold for fast tempo in milliseconds'),
(NULL, 'normal_tempo_max_ms', '3000', 'int', 'Maximum duration for normal tempo in milliseconds'),
(NULL, 'deep_thinking_max_ms', '10000', 'int', 'Maximum duration for deep thinking in milliseconds'),
(NULL, 'stuck_threshold_ms', '10000', 'int', 'Threshold for stuck state in milliseconds'),
(NULL, 'event_sampling_rate', '1', 'float', 'Event sampling rate (1.0 = all events, 0.5 = 50% sample)'),
(NULL, 'enable_mouse_tracking', 'true', 'boolean', 'Enable mouse movement tracking'),
(NULL, 'enable_keyboard_tracking', 'true', 'boolean', 'Enable keyboard event tracking'),
(NULL, 'enable_focus_tracking', 'true', 'boolean', 'Enable focus/blur tracking'),
(NULL, 'time_bucket_size_ms', '100', 'int', 'Time bucket size for visualization in milliseconds'),
(NULL, 'min_session_duration_ms', '1000', 'int', 'Minimum session duration to analyze');

-- ============================================
-- 7. Insert Default Pattern Definitions
-- ============================================

INSERT INTO mdl_thinking_tempo_patterns (pattern_name, pattern_type, description, detection_rules, temporal_signature) VALUES
('Quick Recall', 'mastery_signal', '빠른 회상 - 학습자가 즉시 답을 알고 있음을 나타냄',
    '{"max_duration_ms": 2000, "max_revisions": 1, "min_typing_speed_cps": 3}',
    '{"fast_tempo_percentage": 0.8, "typing_continuous": true}'),

('Deep Analysis', 'solving_strategy', '깊은 분석 - 체계적으로 문제를 분석하는 패턴',
    '{"min_pauses": 3, "min_pause_duration_ms": 2000, "steady_progress": true}',
    '{"deep_tempo_percentage": 0.6, "normal_tempo_percentage": 0.3}'),

('Trial and Error', 'solving_strategy', '시행착오 - 여러 시도를 통해 답을 찾는 패턴',
    '{"min_revisions": 3, "high_backspace_count": true}',
    '{"alternating_tempo": true, "revision_clusters": true}'),

('Cognitive Struggle', 'struggle_indicator', '인지적 어려움 - 개념 이해에 어려움을 겪음',
    '{"stuck_percentage": 0.4, "low_activity": true, "no_progress": true}',
    '{"long_pauses": true, "stuck_duration_avg_ms": 15000}'),

('Impulsive Response', 'behavioral_pattern', '충동적 응답 - 충분한 고민 없이 빠르게 답변',
    '{"max_duration_ms": 3000, "fast_tempo_percentage": 0.9, "min_events": 5}',
    '{"continuous_fast_tempo": true, "no_pauses": true}'),

('Methodical Solving', 'solving_strategy', '체계적 풀이 - 단계적으로 문제를 해결',
    '{"steady_tempo": true, "consistent_pace": true, "progressive_input": true}',
    '{"normal_tempo_percentage": 0.7, "tempo_variance_low": true}'),

('Copy-Paste Behavior', 'behavioral_pattern', '복사-붙여넣기 행동 감지',
    '{"paste_events": 1, "sudden_input_increase": true}',
    '{"instant_content_addition": true}'),

('Uncertainty Pattern', 'struggle_indicator', '불확실성 - 답에 대한 확신이 없음',
    '{"high_revision_count": true, "alternating_answers": true, "long_pauses_before_submit": true}',
    '{"mixed_tempo": true, "revision_before_submit": true}');

-- ============================================
-- 8. Performance Indexes
-- ============================================

-- 이벤트 분석을 위한 복합 인덱스
CREATE INDEX idx_events_session_time ON mdl_thinking_tempo_events(session_id, event_timestamp);
CREATE INDEX idx_events_session_type_time ON mdl_thinking_tempo_events(session_id, event_type, event_timestamp);

-- 템포 분석 조회를 위한 인덱스
CREATE INDEX idx_analysis_session_tempo ON mdl_thinking_tempo_analysis(session_id, tempo_category, start_time);

-- 프로파일 조회 최적화
CREATE INDEX idx_profiles_user_updated ON mdl_thinking_tempo_profiles(userid, last_updated);

-- ============================================
-- 9. Views for Common Queries
-- ============================================

-- 세션 요약 뷰
CREATE OR REPLACE VIEW v_thinking_tempo_session_summary AS
SELECT
    s.id AS session_id,
    s.userid,
    s.quiz_id,
    s.question_id,
    s.session_start,
    s.session_end,
    s.total_duration,
    s.is_completed,
    s.is_correct,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'keydown' THEN e.id END) AS keydown_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'mousemove' THEN e.id END) AS mousemove_events,
    COUNT(DISTINCT CASE WHEN e.event_type LIKE '%click%' THEN e.id END) AS click_events,
    COUNT(DISTINCT a.id) AS tempo_segments,
    AVG(a.thinking_intensity) AS avg_thinking_intensity,
    AVG(a.cognitive_load) AS avg_cognitive_load
FROM mdl_thinking_tempo_sessions s
LEFT JOIN mdl_thinking_tempo_events e ON s.id = e.session_id
LEFT JOIN mdl_thinking_tempo_analysis a ON s.id = a.session_id
GROUP BY s.id;

-- 사용자 사고 스타일 요약 뷰
CREATE OR REPLACE VIEW v_user_thinking_style AS
SELECT
    p.userid,
    p.quiz_id,
    p.thinking_style,
    p.avg_typing_speed,
    p.fast_tempo_percentage,
    p.normal_tempo_percentage,
    p.deep_tempo_percentage,
    p.stuck_percentage,
    p.sample_size,
    CASE
        WHEN p.fast_tempo_percentage > 0.6 THEN 'Quick Thinker'
        WHEN p.deep_tempo_percentage > 0.5 THEN 'Deep Thinker'
        WHEN p.revision_count > p.sample_size * 5 THEN 'Iterative Thinker'
        ELSE 'Balanced Thinker'
    END AS thinking_archetype
FROM mdl_thinking_tempo_profiles p;

-- ============================================
-- 10. Stored Procedures for Common Operations
-- ============================================

DELIMITER $$

-- 세션 종료 및 집계
CREATE PROCEDURE sp_close_thinking_session(
    IN p_session_id BIGINT,
    IN p_final_answer TEXT,
    IN p_is_correct TINYINT
)
BEGIN
    DECLARE v_end_time BIGINT;
    DECLARE v_start_time BIGINT;

    SET v_end_time = UNIX_TIMESTAMP(NOW(6)) * 1000000;

    SELECT session_start INTO v_start_time
    FROM mdl_thinking_tempo_sessions
    WHERE id = p_session_id;

    UPDATE mdl_thinking_tempo_sessions
    SET
        session_end = v_end_time,
        total_duration = v_end_time - session_start,
        is_completed = 1,
        final_answer = p_final_answer,
        is_correct = p_is_correct
    WHERE id = p_session_id;

    -- 프로파일 업데이트는 별도의 분석 프로세스에서 수행
END$$

-- 템포 카테고리 계산
CREATE FUNCTION fn_calculate_tempo_category(
    p_duration_ms BIGINT
) RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE v_category VARCHAR(50);

    IF p_duration_ms < 500 THEN
        SET v_category = 'fast';
    ELSEIF p_duration_ms < 3000 THEN
        SET v_category = 'normal';
    ELSEIF p_duration_ms < 10000 THEN
        SET v_category = 'deep';
    ELSE
        SET v_category = 'stuck';
    END IF;

    RETURN v_category;
END$$

DELIMITER ;

-- ============================================
-- Schema Version
-- ============================================

CREATE TABLE IF NOT EXISTS mdl_thinking_tempo_schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO mdl_thinking_tempo_schema_version (version, description) VALUES
('1.0.0', 'Initial schema with microsecond precision event tracking and tempo analysis');
