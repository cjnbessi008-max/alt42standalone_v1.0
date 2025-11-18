-- LMS Rhythm Analysis Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS lms_rhythm_analysis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_rhythm_analysis;

-- Moodle 사용자 정보 캐시
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    fullname VARCHAR(255),
    first_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 활동 로그
CREATE TABLE IF NOT EXISTS learning_activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    moodle_activity_id INT,
    activity_type VARCHAR(50) NOT NULL, -- 'quiz', 'assignment', 'forum', 'resource', 'page'
    course_id INT NOT NULL,
    course_name VARCHAR(255),
    module_name VARCHAR(255),
    action VARCHAR(50), -- 'viewed', 'submitted', 'graded', 'completed'
    time_started DATETIME NOT NULL,
    time_completed DATETIME,
    duration_seconds INT,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, time_started),
    INDEX idx_activity_type (activity_type),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 퀴즈 응답 상세 로그 (사고 루틴 분석용)
CREATE TABLE IF NOT EXISTS quiz_responses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    activity_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    question_type VARCHAR(50), -- 'multichoice', 'truefalse', 'shortanswer', 'numerical', 'essay'
    question_text TEXT,
    response_text TEXT,
    is_correct TINYINT(1),
    time_started DATETIME NOT NULL,
    time_submitted DATETIME NOT NULL,
    response_time_seconds INT NOT NULL,
    attempt_number INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES learning_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_question (user_id, question_id),
    INDEX idx_response_time (response_time_seconds)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 세션 (리듬 분석용)
CREATE TABLE IF NOT EXISTS learning_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_start DATETIME NOT NULL,
    session_end DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    activity_count INT DEFAULT 0,
    quiz_count INT DEFAULT 0,
    avg_response_time DECIMAL(10,2),
    success_rate DECIMAL(5,2),
    day_of_week TINYINT, -- 0=Sunday, 6=Saturday
    hour_of_day TINYINT, -- 0-23
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_start),
    INDEX idx_day_hour (day_of_week, hour_of_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 리듬 패턴 분석 결과
CREATE TABLE IF NOT EXISTS rhythm_patterns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'concentrated', 'distributed'
    peak_hours JSON, -- [9, 10, 14, 20] 집중도가 높은 시간대
    optimal_session_duration INT, -- 최적 학습 세션 시간 (분)
    avg_session_gap_hours DECIMAL(10,2), -- 평균 학습 간격
    consistency_score DECIMAL(5,2), -- 0-100, 학습 규칙성 점수
    pattern_strength DECIMAL(5,2), -- 0-100, 패턴 강도
    analyzed_period_start DATE NOT NULL,
    analyzed_period_end DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_pattern (user_id, pattern_type),
    INDEX idx_period (analyzed_period_start, analyzed_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사고 루틴 분석 결과
CREATE TABLE IF NOT EXISTS thinking_routines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    routine_type VARCHAR(50) NOT NULL, -- 'quick_thinker', 'deliberate_thinker', 'varied'
    avg_response_time DECIMAL(10,2), -- 평균 응답 시간 (초)
    response_time_variance DECIMAL(10,2), -- 응답 시간 분산
    quick_question_ratio DECIMAL(5,2), -- 빠르게 푸는 문제 비율
    slow_question_ratio DECIMAL(5,2), -- 천천히 푸는 문제 비율
    revision_pattern VARCHAR(50), -- 'minimal', 'moderate', 'extensive' 재시도 패턴
    error_correction_rate DECIMAL(5,2), -- 오답 후 정답률
    problem_solving_approach VARCHAR(50), -- 'sequential', 'selective', 'random'
    analyzed_period_start DATE NOT NULL,
    analyzed_period_end DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_routine (user_id, routine_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 일일 집중도 스냅샷
CREATE TABLE IF NOT EXISTS daily_focus_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    snapshot_date DATE NOT NULL,
    total_learning_minutes INT DEFAULT 0,
    session_count INT DEFAULT 0,
    quiz_accuracy DECIMAL(5,2),
    avg_response_time DECIMAL(10,2),
    focus_score DECIMAL(5,2), -- 0-100, 당일 집중도 점수
    distraction_events INT DEFAULT 0, -- 중단/이탈 횟수
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, snapshot_date),
    INDEX idx_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle 연동 설정
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기본 설정값 삽입
INSERT INTO moodle_config (config_key, config_value, description) VALUES
('moodle_url', 'http://localhost/moodle', 'Moodle 설치 URL'),
('ws_token', '', 'Moodle Web Services Token'),
('sync_interval_minutes', '30', '데이터 동기화 간격 (분)'),
('analysis_period_days', '30', '분석 기간 (일)'),
('session_gap_minutes', '30', '세션 구분 기준 시간 (분)');
