-- DMN Dropout Detection System - MySQL 5.7 Schema
-- Created: 2025-11-18
-- Compatible with: MySQL 5.7, Moodle 3.7

-- ============================================================================
-- 1. Students Table (Synchronized from Moodle)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL UNIQUE COMMENT 'Moodle user ID',
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP NULL COMMENT 'Last sync time from Moodle',

    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 정보 (Moodle 동기화)';

-- ============================================================================
-- 2. Courses Table (Synchronized from Moodle)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_course_id INT NOT NULL UNIQUE COMMENT 'Moodle course ID',
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    teacher_moodle_id INT COMMENT 'Primary teacher Moodle user ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP NULL,

    INDEX idx_moodle_course_id (moodle_course_id),
    INDEX idx_teacher (teacher_moodle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='코스 정보 (Moodle 동기화)';

-- ============================================================================
-- 3. Learning Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_learning_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    moodle_activity_id INT COMMENT 'Moodle quiz/lesson/activity ID',
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP NULL,
    total_duration_seconds INT DEFAULT 0 COMMENT 'Total session duration',
    active_duration_seconds INT DEFAULT 0 COMMENT 'Active (focused) duration',
    inactive_duration_seconds INT DEFAULT 0 COMMENT 'Inactive duration',
    page_hidden_duration_seconds INT DEFAULT 0 COMMENT 'Time when page was hidden',
    engagement_score DECIMAL(4, 3) DEFAULT 0.000 COMMENT 'Engagement score 0-1',
    dropout_event_count INT DEFAULT 0 COMMENT 'Number of dropout events',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES dmn_students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES dmn_courses(id) ON DELETE CASCADE,

    INDEX idx_student_course (student_id, course_id),
    INDEX idx_session_start (session_start),
    INDEX idx_engagement_score (engagement_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 세션 추적';

-- ============================================================================
-- 4. Behavior Events Table (Detailed tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_behavior_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    event_type ENUM(
        'mouse_move',
        'mouse_click',
        'key_press',
        'scroll',
        'page_visible',
        'page_hidden',
        'mouse_inactive',
        'key_inactive',
        'random_clicks',
        'problem_started',
        'problem_submitted',
        'answer_correct',
        'answer_incorrect'
    ) NOT NULL,
    event_timestamp TIMESTAMP(3) NOT NULL COMMENT 'Precise event time with milliseconds',
    event_data JSON COMMENT 'Additional event data (coordinates, duration, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES dmn_learning_sessions(id) ON DELETE CASCADE,

    INDEX idx_session_event_type (session_id, event_type),
    INDEX idx_event_timestamp (event_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='상세 행동 이벤트';

-- ============================================================================
-- 5. Dropout Events Table (DMN activation signals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_dropout_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    dropout_type ENUM(
        'inactivity_5min',          -- 5분 비활성
        'inactivity_10min',         -- 10분 비활성
        'page_hidden_prolonged',    -- 페이지 장시간 숨김
        'page_switch_frequent',     -- 잦은 페이지 전환
        'response_too_fast',        -- 비정상적으로 빠른 응답
        'response_too_slow',        -- 비정상적으로 느린 응답
        'accuracy_drop',            -- 정확도 급락
        'random_clicking',          -- 무작위 클릭
        'repetitive_clicking'       -- 반복 클릭
    ) NOT NULL,
    severity_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    detected_at TIMESTAMP NOT NULL,
    detection_data JSON COMMENT 'Detection algorithm data (thresholds, values, etc.)',
    is_notified BOOLEAN DEFAULT FALSE COMMENT 'Teacher notification sent',
    notified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES dmn_learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES dmn_students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES dmn_courses(id) ON DELETE CASCADE,

    INDEX idx_student_course_time (student_id, course_id, detected_at),
    INDEX idx_severity (severity_level),
    INDEX idx_notification (is_notified, notified_at),
    INDEX idx_dropout_type (dropout_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DMN 이탈 이벤트';

-- ============================================================================
-- 6. Student Engagement Statistics (Aggregated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_engagement_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    stat_date DATE NOT NULL COMMENT 'Statistics date',
    total_sessions INT DEFAULT 0,
    total_learning_time_seconds INT DEFAULT 0,
    active_time_seconds INT DEFAULT 0,
    inactive_time_seconds INT DEFAULT 0,
    average_engagement_score DECIMAL(4, 3) DEFAULT 0.000,
    dropout_event_count INT DEFAULT 0,
    high_severity_dropout_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_student_course_date (student_id, course_id, stat_date),
    FOREIGN KEY (student_id) REFERENCES dmn_students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES dmn_courses(id) ON DELETE CASCADE,

    INDEX idx_stat_date (stat_date),
    INDEX idx_engagement (average_engagement_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 참여도 통계 (일별 집계)';

-- ============================================================================
-- 7. Alert Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_alert_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_moodle_id INT NOT NULL,
    course_id INT NULL COMMENT 'NULL for global settings',
    alert_type ENUM(
        'inactivity',
        'page_switch',
        'accuracy_drop',
        'random_behavior',
        'all'
    ) NOT NULL DEFAULT 'all',
    severity_threshold ENUM('low', 'medium', 'high') DEFAULT 'medium',
    notification_method ENUM('email', 'websocket', 'both') DEFAULT 'websocket',
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_teacher (teacher_moodle_id),
    INDEX idx_course (course_id),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='교사 알림 설정';

-- ============================================================================
-- 8. Alert Notifications Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_alert_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dropout_event_id BIGINT NOT NULL,
    teacher_moodle_id INT NOT NULL,
    notification_method ENUM('email', 'websocket', 'both') NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dropout_event_id) REFERENCES dmn_dropout_events(id) ON DELETE CASCADE,

    INDEX idx_teacher_read (teacher_moodle_id, is_read),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='교사 알림 기록';

-- ============================================================================
-- 9. System Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type ENUM('string', 'int', 'float', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='시스템 설정';

-- ============================================================================
-- Default System Configuration
-- ============================================================================
INSERT INTO dmn_system_config (config_key, config_value, config_type, description) VALUES
('inactivity_warning_threshold_seconds', '300', 'int', '비활성 경고 임계값 (초) - 5분'),
('inactivity_critical_threshold_seconds', '600', 'int', '비활성 위험 임계값 (초) - 10분'),
('page_hidden_threshold_seconds', '120', 'int', '페이지 숨김 임계값 (초) - 2분'),
('page_switch_count_threshold', '5', 'int', '1시간당 페이지 전환 횟수 임계값'),
('response_too_fast_ratio', '0.2', 'float', '너무 빠른 응답 비율 (평균 대비)'),
('response_too_slow_ratio', '3.0', 'float', '너무 느린 응답 비율 (평균 대비)'),
('accuracy_drop_threshold', '0.5', 'float', '정확도 하락 임계값 (이전 대비)'),
('random_click_count_threshold', '20', 'int', '30초 내 무작위 클릭 횟수'),
('repetitive_click_count_threshold', '10', 'int', '1분 내 반복 클릭 횟수'),
('engagement_score_weights', '{"active_time": 0.4, "accuracy": 0.3, "response_pattern": 0.2, "dropout_events": 0.1}', 'json', '참여도 점수 가중치')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- ============================================================================
-- Views for easier querying
-- ============================================================================

-- Student Current Engagement View
CREATE OR REPLACE VIEW dmn_v_student_current_engagement AS
SELECT
    s.id AS student_id,
    s.moodle_user_id,
    s.username,
    c.id AS course_id,
    c.course_name,
    ls.id AS session_id,
    ls.session_start,
    ls.engagement_score,
    ls.dropout_event_count,
    COUNT(de.id) AS recent_dropouts,
    MAX(de.detected_at) AS last_dropout_time
FROM dmn_students s
INNER JOIN dmn_learning_sessions ls ON s.id = ls.student_id
INNER JOIN dmn_courses c ON ls.course_id = c.id
LEFT JOIN dmn_dropout_events de ON ls.id = de.session_id
    AND de.detected_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
WHERE ls.session_end IS NULL  -- Only active sessions
GROUP BY s.id, s.moodle_user_id, s.username, c.id, c.course_name,
         ls.id, ls.session_start, ls.engagement_score, ls.dropout_event_count;

-- Daily Statistics View
CREATE OR REPLACE VIEW dmn_v_daily_stats AS
SELECT
    es.stat_date,
    c.course_name,
    COUNT(DISTINCT es.student_id) AS active_students,
    AVG(es.average_engagement_score) AS avg_engagement,
    SUM(es.total_sessions) AS total_sessions,
    SUM(es.dropout_event_count) AS total_dropouts,
    SUM(es.high_severity_dropout_count) AS high_severity_dropouts
FROM dmn_engagement_stats es
INNER JOIN dmn_courses c ON es.course_id = c.id
GROUP BY es.stat_date, c.course_name;

-- Teacher Alert Dashboard View
CREATE OR REPLACE VIEW dmn_v_teacher_alerts AS
SELECT
    de.id AS dropout_event_id,
    s.username AS student_username,
    s.first_name,
    s.last_name,
    c.course_name,
    de.dropout_type,
    de.severity_level,
    de.detected_at,
    de.is_notified,
    ls.engagement_score,
    ls.session_start
FROM dmn_dropout_events de
INNER JOIN dmn_students s ON de.student_id = s.id
INNER JOIN dmn_courses c ON de.course_id = c.id
INNER JOIN dmn_learning_sessions ls ON de.session_id = ls.id
WHERE de.detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY de.detected_at DESC;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- Calculate Engagement Score
CREATE PROCEDURE sp_calculate_engagement_score(
    IN p_session_id BIGINT,
    OUT p_engagement_score DECIMAL(4, 3)
)
BEGIN
    DECLARE v_active_time INT;
    DECLARE v_total_time INT;
    DECLARE v_dropout_count INT;
    DECLARE v_time_score DECIMAL(4, 3);
    DECLARE v_dropout_penalty DECIMAL(4, 3);

    -- Get session data
    SELECT
        active_duration_seconds,
        total_duration_seconds,
        dropout_event_count
    INTO v_active_time, v_total_time, v_dropout_count
    FROM dmn_learning_sessions
    WHERE id = p_session_id;

    -- Calculate time-based score
    IF v_total_time > 0 THEN
        SET v_time_score = v_active_time / v_total_time;
    ELSE
        SET v_time_score = 0;
    END IF;

    -- Calculate dropout penalty
    SET v_dropout_penalty = LEAST(v_dropout_count * 0.1, 0.5);

    -- Final engagement score
    SET p_engagement_score = GREATEST(v_time_score - v_dropout_penalty, 0);

    -- Update session
    UPDATE dmn_learning_sessions
    SET engagement_score = p_engagement_score
    WHERE id = p_session_id;
END //

-- Aggregate Daily Statistics
CREATE PROCEDURE sp_aggregate_daily_stats(IN p_date DATE)
BEGIN
    INSERT INTO dmn_engagement_stats (
        student_id,
        course_id,
        stat_date,
        total_sessions,
        total_learning_time_seconds,
        active_time_seconds,
        inactive_time_seconds,
        average_engagement_score,
        dropout_event_count,
        high_severity_dropout_count
    )
    SELECT
        ls.student_id,
        ls.course_id,
        DATE(ls.session_start) AS stat_date,
        COUNT(ls.id) AS total_sessions,
        SUM(ls.total_duration_seconds) AS total_learning_time_seconds,
        SUM(ls.active_duration_seconds) AS active_time_seconds,
        SUM(ls.inactive_duration_seconds) AS inactive_time_seconds,
        AVG(ls.engagement_score) AS average_engagement_score,
        SUM(ls.dropout_event_count) AS dropout_event_count,
        SUM(CASE WHEN de.severity_level = 'high' THEN 1 ELSE 0 END) AS high_severity_dropout_count
    FROM dmn_learning_sessions ls
    LEFT JOIN dmn_dropout_events de ON ls.id = de.session_id
    WHERE DATE(ls.session_start) = p_date
    GROUP BY ls.student_id, ls.course_id, DATE(ls.session_start)
    ON DUPLICATE KEY UPDATE
        total_sessions = VALUES(total_sessions),
        total_learning_time_seconds = VALUES(total_learning_time_seconds),
        active_time_seconds = VALUES(active_time_seconds),
        inactive_time_seconds = VALUES(inactive_time_seconds),
        average_engagement_score = VALUES(average_engagement_score),
        dropout_event_count = VALUES(dropout_event_count),
        high_severity_dropout_count = VALUES(high_severity_dropout_count),
        updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_session_student_course_time
ON dmn_learning_sessions(student_id, course_id, session_start);

CREATE INDEX idx_behavior_session_time
ON dmn_behavior_events(session_id, event_timestamp);

CREATE INDEX idx_dropout_student_time
ON dmn_dropout_events(student_id, detected_at DESC);

-- ============================================================================
-- Grant permissions (adjust as needed for your Moodle setup)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON dmn_* TO 'moodle_dmn_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- Schema Version Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS dmn_schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO dmn_schema_version (version, description) VALUES
('1.0.0', 'Initial schema for DMN Dropout Detection System');
