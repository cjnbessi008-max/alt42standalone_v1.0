-- MySQL 5.7 Database Schema for Morning/Evening Thinking Pattern Analysis
-- Compatible with Moodle 3.7 LMS Integration

-- 학생 학습 세션 기록
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    session_start DATETIME NOT NULL,
    session_end DATETIME,
    time_of_day ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
    -- morning: 06:00-11:59, afternoon: 12:00-17:59, evening: 18:00-23:59, night: 00:00-05:59
    session_duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_time (moodle_user_id, time_of_day),
    INDEX idx_course (moodle_course_id),
    INDEX idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 활동 상세 기록
CREATE TABLE IF NOT EXISTS learning_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'quiz', 'assignment', 'forum', 'resource', etc.
    activity_id INT NOT NULL,
    activity_name VARCHAR(255),
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    time_spent_seconds INT,
    score DECIMAL(5,2), -- 점수 (0-100)
    max_score DECIMAL(5,2),
    attempts_count INT DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_user_activity (moodle_user_id, activity_type),
    INDEX idx_session (session_id),
    INDEX idx_time (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사고력 지표 측정 데이터
CREATE TABLE IF NOT EXISTS thinking_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    time_of_day ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,

    -- 문제 해결 속도 (초)
    problem_solving_speed INT,

    -- 정확도 (%)
    accuracy_rate DECIMAL(5,2),

    -- 복잡도 점수 (1-10)
    complexity_score INT CHECK (complexity_score BETWEEN 1 AND 10),

    -- 집중도 지표 (상호작용 패턴 기반)
    concentration_score DECIMAL(5,2), -- 0-100

    -- 오류 패턴
    error_count INT DEFAULT 0,
    error_types JSON, -- ['calculation', 'conceptual', 'careless']

    -- 힌트 사용 횟수
    hint_usage_count INT DEFAULT 0,

    -- 재시도 횟수
    retry_count INT DEFAULT 0,

    -- 사고 깊이 (응답 복잡도, 작성 시간 등 종합)
    thinking_depth_score DECIMAL(5,2), -- 0-100

    measured_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (activity_id) REFERENCES learning_activities(id) ON DELETE CASCADE,
    INDEX idx_user_time_metrics (moodle_user_id, time_of_day),
    INDEX idx_measured_at (measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 시간대별 사고력 분석 결과 (집계 테이블)
CREATE TABLE IF NOT EXISTS thinking_pattern_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    time_of_day ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,

    -- 평균 지표들
    avg_problem_solving_speed DECIMAL(10,2),
    avg_accuracy_rate DECIMAL(5,2),
    avg_concentration_score DECIMAL(5,2),
    avg_thinking_depth_score DECIMAL(5,2),

    -- 활동 통계
    total_activities INT DEFAULT 0,
    total_time_spent_seconds INT DEFAULT 0,
    completion_rate DECIMAL(5,2),

    -- 성과 지표
    avg_score DECIMAL(5,2),
    improvement_rate DECIMAL(5,2), -- 기간 내 향상도

    -- 최적 시간대 여부
    is_peak_performance BOOLEAN DEFAULT FALSE,
    performance_rank INT, -- 1=최고, 2=두번째 등

    analyzed_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_analysis (moodle_user_id, analysis_period_start, analysis_period_end, time_of_day),
    INDEX idx_user_period (moodle_user_id, analysis_period_start, analysis_period_end),
    INDEX idx_peak_performance (is_peak_performance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 상호작용 이벤트 (클릭, 스크롤, 입력 등)
CREATE TABLE IF NOT EXISTS interaction_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'click', 'scroll', 'input', 'submit', 'pause', 'resume'
    event_data JSON,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (activity_id) REFERENCES learning_activities(id) ON DELETE CASCADE,
    INDEX idx_activity_events (activity_id, timestamp),
    INDEX idx_user_events (moodle_user_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle 연동 설정
CREATE TABLE IF NOT EXISTS moodle_integration_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 설정 데이터
INSERT INTO moodle_integration_config (config_key, config_value, description) VALUES
('moodle_url', 'http://localhost/moodle', 'Moodle LMS URL'),
('moodle_token', '', 'Moodle Web Service Token'),
('sync_interval_minutes', '5', 'Data synchronization interval'),
('morning_start_hour', '6', 'Morning period start (24h format)'),
('afternoon_start_hour', '12', 'Afternoon period start'),
('evening_start_hour', '18', 'Evening period start'),
('night_start_hour', '0', 'Night period start'),
('enable_realtime_tracking', '1', 'Enable real-time interaction tracking')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
