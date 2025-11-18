-- Focus Tracking LMS Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS focus_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE focus_lms;

-- ============================================================================
-- Users Table (학생 및 교사)
-- ============================================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    grade_level TINYINT UNSIGNED NULL COMMENT '학년 (학생만)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_role (role),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Problems Table (문제 은행)
-- ============================================================================
CREATE TABLE problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty_level TINYINT UNSIGNED NOT NULL COMMENT '1=쉬움, 5=매우 어려움',
    problem_type ENUM('multiple_choice', 'short_answer', 'essay', 'coding') NOT NULL DEFAULT 'multiple_choice',
    question_data JSON NOT NULL COMMENT '문제 내용 (JSON 형식)',
    correct_answer JSON NOT NULL COMMENT '정답 (JSON 형식)',
    hints JSON NULL COMMENT '힌트 배열',
    estimated_time INT UNSIGNED NOT NULL DEFAULT 300 COMMENT '예상 소요 시간 (초)',
    subject VARCHAR(50) NOT NULL DEFAULT 'mathematics',
    tags JSON NULL COMMENT '태그 배열',
    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_subject (subject),
    INDEX idx_type (problem_type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (difficulty_level BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Learning Sessions Table (학습 세션)
-- ============================================================================
CREATE TABLE learning_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_uuid VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID for frontend',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT UNSIGNED NULL COMMENT '실제 세션 시간',
    target_difficulty TINYINT UNSIGNED NOT NULL COMMENT '목표 난이도',
    problems_attempted INT UNSIGNED DEFAULT 0,
    problems_correct INT UNSIGNED DEFAULT 0,
    session_status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    device_info JSON NULL COMMENT '디바이스 정보',
    INDEX idx_user (user_id),
    INDEX idx_status (session_status),
    INDEX idx_started (started_at),
    INDEX idx_uuid (session_uuid),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Problem Attempts Table (문제 풀이 시도)
-- ============================================================================
CREATE TABLE problem_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    problem_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    attempt_number TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '시도 횟수',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    time_spent_seconds INT UNSIGNED NULL,
    user_answer JSON NOT NULL COMMENT '사용자 답안',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-100점',
    hints_used TINYINT UNSIGNED DEFAULT 0,
    INDEX idx_session (session_id),
    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_submitted (submitted_at),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Focus Events Table (집중도 이벤트 로그)
-- ============================================================================
CREATE TABLE focus_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    attempt_id INT UNSIGNED NULL COMMENT '특정 문제 풀이와 연결 (선택)',
    event_type ENUM(
        'page_focus',
        'page_blur',
        'mouse_move',
        'mouse_click',
        'keyboard_input',
        'scroll',
        'idle_start',
        'idle_end',
        'window_resize'
    ) NOT NULL,
    event_timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '밀리초 정밀도',
    event_data JSON NULL COMMENT '이벤트별 추가 데이터',
    INDEX idx_session (session_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_type (event_type),
    INDEX idx_timestamp (event_timestamp),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES problem_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (TO_DAYS(event_timestamp)) (
    PARTITION p_2025_q1 VALUES LESS THAN (TO_DAYS('2025-04-01')),
    PARTITION p_2025_q2 VALUES LESS THAN (TO_DAYS('2025-07-01')),
    PARTITION p_2025_q3 VALUES LESS THAN (TO_DAYS('2025-10-01')),
    PARTITION p_2025_q4 VALUES LESS THAN (TO_DAYS('2026-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================================================
-- Focus Metrics Table (집중도 메트릭 집계)
-- ============================================================================
CREATE TABLE focus_metrics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    attempt_id INT UNSIGNED NULL,
    metric_type ENUM(
        'attention_score',      -- 집중도 점수
        'stability_index',      -- 안정성 지수
        'activity_ratio',       -- 활동 비율
        'idle_time',           -- 비활동 시간
        'interaction_count',   -- 상호작용 횟수
        'focus_duration'       -- 집중 지속 시간
    ) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    window_start TIMESTAMP NOT NULL COMMENT '측정 시작 시간',
    window_end TIMESTAMP NOT NULL COMMENT '측정 종료 시간',
    difficulty_level TINYINT UNSIGNED NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_type (metric_type),
    INDEX idx_window (window_start, window_end),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES problem_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Session Scores Table (세션별 종합 점수)
-- ============================================================================
CREATE TABLE session_scores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL,

    -- 기본 통계
    total_problems INT UNSIGNED NOT NULL DEFAULT 0,
    correct_problems INT UNSIGNED NOT NULL DEFAULT 0,
    accuracy_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '정답률 (%)',
    average_time_per_problem INT UNSIGNED NULL COMMENT '문제당 평균 시간 (초)',

    -- 집중도 점수
    focus_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '집중도 점수 (0-100)',
    stability_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '안정성 점수 (0-100)',
    activity_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '활동 점수 (0-100)',

    -- 최종 점수 (가중치 적용)
    final_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '최종 점수 (0-100)',

    -- 난이도별 성과
    difficulty_breakdown JSON NULL COMMENT '난이도별 상세 점수',

    -- 집중도 분석
    total_focus_time INT UNSIGNED NULL COMMENT '총 집중 시간 (초)',
    total_idle_time INT UNSIGNED NULL COMMENT '총 비활동 시간 (초)',
    focus_ratio DECIMAL(5,4) NULL COMMENT '집중 비율',
    focus_variance DECIMAL(10,4) NULL COMMENT '집중도 변동성',

    -- 메타 정보
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_final_score (final_score),
    INDEX idx_calculated (calculated_at),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- System Logs Table (시스템 로그)
-- ============================================================================
CREATE TABLE system_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    log_level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    user_id INT UNSIGNED NULL,
    session_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (log_level),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Initial Data: Sample Users
-- ============================================================================
-- Password: 'password123' hashed with PASSWORD_DEFAULT
INSERT INTO users (username, password_hash, email, full_name, role, grade_level) VALUES
('student1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student1@example.com', '김학생', 'student', 5),
('student2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student2@example.com', '이학생', 'student', 6),
('teacher1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher1@example.com', '박선생', 'teacher', NULL),
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', '관리자', 'admin', NULL);

-- ============================================================================
-- Initial Data: Sample Problems (수학 문제 예시)
-- ============================================================================
INSERT INTO problems (title, description, difficulty_level, problem_type, question_data, correct_answer, hints, estimated_time, subject, tags, created_by) VALUES
-- Level 1: 기초
('분수의 덧셈 1', '다음 분수의 덧셈을 계산하세요: 1/4 + 1/4 = ?', 1, 'multiple_choice',
 '{"question": "1/4 + 1/4 = ?", "choices": ["1/8", "1/2", "2/4", "2/8"]}',
 '{"answer": "1/2", "explanation": "분모가 같으므로 분자끼리 더합니다: (1+1)/4 = 2/4 = 1/2"}',
 '["분모가 같으면 분자끼리 더해요", "약분을 잊지 마세요"]',
 180, 'mathematics', '["분수", "덧셈", "기초"]', 3),

-- Level 2: 기본
('분수의 뺄셈', '다음 분수의 뺄셈을 계산하세요: 3/5 - 1/5 = ?', 2, 'short_answer',
 '{"question": "3/5 - 1/5 = ?", "format": "fraction"}',
 '{"numerator": 2, "denominator": 5, "explanation": "분모가 같으므로 분자끼리 뺍니다: (3-1)/5 = 2/5"}',
 '["분모는 그대로 두세요", "분자끼리만 계산해요"]',
 240, 'mathematics', '["분수", "뺄셈"]', 3),

-- Level 3: 중급
('분모가 다른 분수의 덧셈', '다음 계산을 하세요: 1/3 + 1/6 = ?', 3, 'short_answer',
 '{"question": "1/3 + 1/6 = ?", "format": "fraction", "show_work": true}',
 '{"numerator": 1, "denominator": 2, "steps": ["1/3 = 2/6", "2/6 + 1/6 = 3/6", "3/6 = 1/2"]}',
 '["통분을 먼저 해보세요", "최소공배수는 6입니다", "마지막에 약분하세요"]',
 360, 'mathematics', '["분수", "덧셈", "통분"]', 3),

-- Level 4: 고급
('분수의 곱셈과 덧셈 혼합', '다음을 계산하세요: (2/3 × 3/4) + 1/6 = ?', 4, 'short_answer',
 '{"question": "(2/3 × 3/4) + 1/6 = ?", "format": "fraction", "show_work": true}',
 '{"numerator": 2, "denominator": 3, "steps": ["2/3 × 3/4 = 6/12 = 1/2", "1/2 + 1/6 = 3/6 + 1/6 = 4/6 = 2/3"]}',
 '["곱셈을 먼저 계산하세요", "곱셈은 분자끼리, 분모끼리", "통분 후 덧셈", "약분하세요"]',
 480, 'mathematics', '["분수", "사칙연산", "혼합계산"]', 3),

-- Level 5: 매우 어려움
('복잡한 분수 문장제', '철수는 전체 케이크의 2/5를 먹고, 영희는 남은 케이크의 1/3을 먹었습니다. 전체 케이크 중 몇 분의 몇이 남았나요?', 5, 'short_answer',
 '{"question": "철수는 전체 케이크의 2/5를 먹고, 영희는 남은 케이크의 1/3을 먹었습니다. 전체 케이크 중 몇 분의 몇이 남았나요?", "format": "fraction", "show_work": true}',
 '{"numerator": 2, "denominator": 5, "steps": ["철수가 먹은 후 남은 양: 1 - 2/5 = 3/5", "영희가 먹은 양: 3/5 × 1/3 = 3/15 = 1/5", "최종 남은 양: 3/5 - 1/5 = 2/5"]}',
 '["단계별로 나누어 생각하세요", "먼저 철수가 먹고 남은 양을 구하세요", "영희는 남은 것의 1/3을 먹었어요", "전체에서 두 사람이 먹은 양을 빼세요"]',
 600, 'mathematics', '["분수", "문장제", "다단계문제", "응용"]', 3);

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- 사용자별 종합 통계 뷰
CREATE VIEW user_statistics AS
SELECT
    u.id AS user_id,
    u.username,
    u.full_name,
    u.role,
    COUNT(DISTINCT ls.id) AS total_sessions,
    SUM(ls.problems_attempted) AS total_problems_attempted,
    SUM(ls.problems_correct) AS total_problems_correct,
    AVG(ss.final_score) AS average_final_score,
    AVG(ss.focus_score) AS average_focus_score,
    AVG(ss.stability_score) AS average_stability_score,
    SUM(ls.duration_seconds) AS total_learning_time_seconds
FROM users u
LEFT JOIN learning_sessions ls ON u.id = ls.user_id AND ls.session_status = 'completed'
LEFT JOIN session_scores ss ON ls.id = ss.session_id
GROUP BY u.id, u.username, u.full_name, u.role;

-- 난이도별 성과 통계 뷰
CREATE VIEW difficulty_performance AS
SELECT
    p.difficulty_level,
    COUNT(pa.id) AS total_attempts,
    SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
    AVG(CASE WHEN pa.is_correct THEN 100 ELSE 0 END) AS accuracy_rate,
    AVG(pa.time_spent_seconds) AS avg_time_spent,
    AVG(fm.metric_value) AS avg_focus_score
FROM problems p
JOIN problem_attempts pa ON p.id = pa.problem_id
LEFT JOIN focus_metrics fm ON pa.id = fm.attempt_id AND fm.metric_type = 'attention_score'
GROUP BY p.difficulty_level
ORDER BY p.difficulty_level;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- 세션 점수 계산 프로시저
CREATE PROCEDURE calculate_session_score(IN p_session_id INT UNSIGNED)
BEGIN
    DECLARE v_total_problems INT DEFAULT 0;
    DECLARE v_correct_problems INT DEFAULT 0;
    DECLARE v_accuracy_rate DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_avg_time INT DEFAULT 0;
    DECLARE v_focus_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_stability_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_activity_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_final_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_user_id INT UNSIGNED;
    DECLARE v_total_focus_time INT DEFAULT 0;
    DECLARE v_total_idle_time INT DEFAULT 0;
    DECLARE v_focus_ratio DECIMAL(5,4) DEFAULT 0.0000;
    DECLARE v_focus_variance DECIMAL(10,4) DEFAULT 0.0000;

    -- 기본 통계 계산
    SELECT
        user_id,
        problems_attempted,
        problems_correct,
        CASE WHEN problems_attempted > 0
             THEN (problems_correct / problems_attempted) * 100
             ELSE 0 END
    INTO v_user_id, v_total_problems, v_correct_problems, v_accuracy_rate
    FROM learning_sessions
    WHERE id = p_session_id;

    -- 평균 시간 계산
    SELECT AVG(time_spent_seconds) INTO v_avg_time
    FROM problem_attempts
    WHERE session_id = p_session_id AND submitted_at IS NOT NULL;

    -- 집중도 점수 계산
    SELECT
        COALESCE(AVG(CASE WHEN metric_type = 'attention_score' THEN metric_value END), 0),
        COALESCE(AVG(CASE WHEN metric_type = 'stability_index' THEN metric_value END), 0),
        COALESCE(AVG(CASE WHEN metric_type = 'activity_ratio' THEN metric_value * 100 END), 0)
    INTO v_focus_score, v_stability_score, v_activity_score
    FROM focus_metrics
    WHERE session_id = p_session_id;

    -- 집중/비활동 시간 계산
    SELECT
        COALESCE(SUM(CASE WHEN metric_type = 'focus_duration' THEN metric_value END), 0),
        COALESCE(SUM(CASE WHEN metric_type = 'idle_time' THEN metric_value END), 0)
    INTO v_total_focus_time, v_total_idle_time
    FROM focus_metrics
    WHERE session_id = p_session_id;

    -- 집중 비율 계산
    IF (v_total_focus_time + v_total_idle_time) > 0 THEN
        SET v_focus_ratio = v_total_focus_time / (v_total_focus_time + v_total_idle_time);
    END IF;

    -- 집중도 변동성 계산 (표준편차)
    SELECT COALESCE(STDDEV(metric_value), 0) INTO v_focus_variance
    FROM focus_metrics
    WHERE session_id = p_session_id AND metric_type = 'attention_score';

    -- 최종 점수 계산 (가중치: 집중도 60%, 안정성 20%, 정확도 20%)
    SET v_final_score = (v_focus_score * 0.6) + (v_stability_score * 0.2) + (v_accuracy_rate * 0.2);

    -- 결과 저장
    INSERT INTO session_scores (
        session_id, user_id, total_problems, correct_problems, accuracy_rate,
        average_time_per_problem, focus_score, stability_score, activity_score,
        final_score, total_focus_time, total_idle_time, focus_ratio, focus_variance
    ) VALUES (
        p_session_id, v_user_id, v_total_problems, v_correct_problems, v_accuracy_rate,
        v_avg_time, v_focus_score, v_stability_score, v_activity_score,
        v_final_score, v_total_focus_time, v_total_idle_time, v_focus_ratio, v_focus_variance
    )
    ON DUPLICATE KEY UPDATE
        total_problems = v_total_problems,
        correct_problems = v_correct_problems,
        accuracy_rate = v_accuracy_rate,
        average_time_per_problem = v_avg_time,
        focus_score = v_focus_score,
        stability_score = v_stability_score,
        activity_score = v_activity_score,
        final_score = v_final_score,
        total_focus_time = v_total_focus_time,
        total_idle_time = v_total_idle_time,
        focus_ratio = v_focus_ratio,
        focus_variance = v_focus_variance,
        updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- 복합 인덱스 추가
CREATE INDEX idx_session_user_status ON learning_sessions(user_id, session_status, started_at);
CREATE INDEX idx_attempt_session_problem ON problem_attempts(session_id, problem_id, submitted_at);
CREATE INDEX idx_focus_session_type_time ON focus_events(session_id, event_type, event_timestamp);

-- ============================================================================
-- Database Info
-- ============================================================================
SELECT 'Database schema created successfully!' AS status;
SELECT VERSION() AS mysql_version;
SELECT DATABASE() AS current_database;
