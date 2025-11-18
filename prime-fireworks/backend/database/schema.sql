-- Prime Fireworks Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS prime_fireworks
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE prime_fireworks;

-- ========================================
-- 1. Problems Table
-- ========================================
CREATE TABLE IF NOT EXISTS prime_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL COMMENT 'Moodle 문제 ID',
    number_to_factor INT NOT NULL COMMENT '분해할 숫자',
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    prime_factors JSON NOT NULL COMMENT '정답 소수 인수들',
    hint TEXT COMMENT '힌트 메시지',
    time_limit_seconds INT DEFAULT 300 COMMENT '제한 시간 (초)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='소수 분해 문제 테이블';

-- ========================================
-- 2. Student Progress Table
-- ========================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    submitted_answer JSON COMMENT '제출한 답안',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent_seconds INT COMMENT '소요 시간 (초)',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수',
    fireworks_triggered BOOLEAN DEFAULT FALSE COMMENT '폭죽 애니메이션 실행 여부',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES prime_problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_user_progress (moodle_user_id, problem_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생 진도 추적 테이블';

-- ========================================
-- 3. Fireworks Log Table
-- ========================================
CREATE TABLE IF NOT EXISTS fireworks_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    progress_id INT NOT NULL COMMENT '진도 ID',
    number INT NOT NULL COMMENT '분해된 숫자',
    prime_factors JSON NOT NULL COMMENT '소수 인수들',
    animation_data JSON COMMENT '애니메이션 데이터',
    duration_ms INT COMMENT '애니메이션 재생 시간 (밀리초)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (progress_id) REFERENCES student_progress(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_progress (progress_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='폭죽 애니메이션 로그 테이블';

-- ========================================
-- 4. Moodle Integration Config Table
-- ========================================
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moodle 연동 설정 테이블';

-- ========================================
-- 5. User Statistics Table
-- ========================================
CREATE TABLE IF NOT EXISTS user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    total_problems INT DEFAULT 0,
    completed_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    fireworks_count INT DEFAULT 0,
    last_activity_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (moodle_user_id),
    INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 통계 테이블';

-- ========================================
-- Initial Data: Sample Problems
-- ========================================
INSERT INTO prime_problems (moodle_question_id, number_to_factor, difficulty_level, prime_factors, hint, time_limit_seconds)
VALUES
    -- Easy problems (작은 숫자, 간단한 소수 분해)
    (1001, 6, 'easy', '[2, 3]', '6은 2와 3의 곱입니다.', 180),
    (1002, 10, 'easy', '[2, 5]', '10은 2와 5의 곱입니다.', 180),
    (1003, 14, 'easy', '[2, 7]', '14는 2와 7의 곱입니다.', 180),
    (1004, 15, 'easy', '[3, 5]', '15는 3과 5의 곱입니다.', 180),
    (1005, 21, 'easy', '[3, 7]', '21은 3과 7의 곱입니다.', 180),

    -- Medium problems (중간 크기 숫자)
    (2001, 24, 'medium', '[2, 2, 2, 3]', '24를 2로 여러 번 나눌 수 있습니다.', 300),
    (2002, 30, 'medium', '[2, 3, 5]', '30은 2, 3, 5의 곱입니다.', 300),
    (2003, 60, 'medium', '[2, 2, 3, 5]', '60을 작은 소수부터 차례대로 나누어보세요.', 300),
    (2004, 48, 'medium', '[2, 2, 2, 2, 3]', '48은 2의 거듭제곱과 3의 곱입니다.', 300),
    (2005, 72, 'medium', '[2, 2, 2, 3, 3]', '72는 8과 9의 곱입니다.', 300),

    -- Hard problems (큰 숫자, 복잡한 분해)
    (3001, 120, 'hard', '[2, 2, 2, 3, 5]', '120은 여러 소수의 곱입니다.', 420),
    (3002, 144, 'hard', '[2, 2, 2, 2, 3, 3]', '144는 12의 제곱입니다.', 420),
    (3003, 180, 'hard', '[2, 2, 3, 3, 5]', '180을 체계적으로 분해해보세요.', 420),
    (3004, 210, 'hard', '[2, 3, 5, 7]', '210은 연속된 네 소수의 곱입니다.', 420),
    (3005, 300, 'hard', '[2, 2, 3, 5, 5]', '300은 3과 100의 곱입니다.', 420);

-- ========================================
-- Initial Data: Moodle Configuration
-- ========================================
INSERT INTO moodle_config (config_key, config_value, description)
VALUES
    ('moodle_url', 'http://localhost/moodle', 'Moodle 서버 URL'),
    ('moodle_token', 'YOUR_MOODLE_TOKEN_HERE', 'Moodle Web Services 토큰'),
    ('moodle_service_name', 'prime_fireworks_service', 'Moodle 서비스 이름'),
    ('api_timeout', '30', 'API 타임아웃 (초)'),
    ('enable_logging', 'true', '로깅 활성화 여부'),
    ('max_attempts', '3', '최대 시도 횟수'),
    ('passing_score', '70.00', '합격 점수 (백분율)');

-- ========================================
-- Views for Analytics
-- ========================================

-- 난이도별 통계 뷰
CREATE OR REPLACE VIEW v_difficulty_stats AS
SELECT
    p.difficulty_level,
    COUNT(DISTINCT sp.moodle_user_id) AS total_students,
    COUNT(sp.id) AS total_attempts,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(AVG(sp.time_spent_seconds), 2) AS avg_time_seconds,
    ROUND(SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(sp.id), 2) AS success_rate
FROM prime_problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
WHERE p.is_active = TRUE
GROUP BY p.difficulty_level;

-- 사용자별 성적 뷰
CREATE OR REPLACE VIEW v_user_performance AS
SELECT
    sp.moodle_user_id,
    COUNT(DISTINCT sp.problem_id) AS problems_attempted,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) AS problems_correct,
    ROUND(AVG(sp.score), 2) AS avg_score,
    SUM(sp.time_spent_seconds) AS total_time_seconds,
    SUM(CASE WHEN sp.fireworks_triggered THEN 1 ELSE 0 END) AS fireworks_count,
    MAX(sp.submitted_at) AS last_submission
FROM student_progress sp
GROUP BY sp.moodle_user_id;

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW v_problem_stats AS
SELECT
    p.id,
    p.number_to_factor,
    p.difficulty_level,
    COUNT(sp.id) AS attempt_count,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(AVG(sp.time_spent_seconds), 2) AS avg_time,
    ROUND(SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(sp.id), 2) AS success_rate
FROM prime_problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.number_to_factor, p.difficulty_level;

-- ========================================
-- Stored Procedures
-- ========================================

DELIMITER //

-- 사용자 통계 업데이트 프로시저
CREATE PROCEDURE update_user_statistics(IN user_id INT)
BEGIN
    INSERT INTO user_statistics (
        moodle_user_id,
        total_problems,
        completed_problems,
        correct_answers,
        total_time_seconds,
        fireworks_count,
        last_activity_at
    )
    SELECT
        user_id,
        COUNT(DISTINCT problem_id),
        COUNT(DISTINCT CASE WHEN is_correct THEN problem_id END),
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
        SUM(time_spent_seconds),
        SUM(CASE WHEN fireworks_triggered THEN 1 ELSE 0 END),
        MAX(submitted_at)
    FROM student_progress
    WHERE moodle_user_id = user_id
    ON DUPLICATE KEY UPDATE
        total_problems = VALUES(total_problems),
        completed_problems = VALUES(completed_problems),
        correct_answers = VALUES(correct_answers),
        total_time_seconds = VALUES(total_time_seconds),
        fireworks_count = VALUES(fireworks_count),
        last_activity_at = VALUES(last_activity_at),
        updated_at = CURRENT_TIMESTAMP;
END //

-- 다음 문제 추천 프로시저
CREATE PROCEDURE get_next_problem(IN user_id INT, IN target_difficulty VARCHAR(10))
BEGIN
    SELECT p.*
    FROM prime_problems p
    LEFT JOIN (
        SELECT problem_id, MAX(submitted_at) as last_attempt
        FROM student_progress
        WHERE moodle_user_id = user_id AND is_correct = TRUE
        GROUP BY problem_id
    ) sp ON p.id = sp.problem_id
    WHERE p.is_active = TRUE
        AND p.difficulty_level = target_difficulty
        AND sp.problem_id IS NULL
    ORDER BY RAND()
    LIMIT 1;
END //

DELIMITER ;

-- ========================================
-- Triggers
-- ========================================

DELIMITER //

-- 진도 입력 후 통계 자동 업데이트
CREATE TRIGGER after_progress_insert
AFTER INSERT ON student_progress
FOR EACH ROW
BEGIN
    CALL update_user_statistics(NEW.moodle_user_id);
END //

-- 진도 수정 후 통계 자동 업데이트
CREATE TRIGGER after_progress_update
AFTER UPDATE ON student_progress
FOR EACH ROW
BEGIN
    CALL update_user_statistics(NEW.moodle_user_id);
END //

DELIMITER ;

-- ========================================
-- Indexes for Performance
-- ========================================

-- Composite indexes for common queries
CREATE INDEX idx_progress_user_correct ON student_progress(moodle_user_id, is_correct);
CREATE INDEX idx_progress_problem_correct ON student_progress(problem_id, is_correct);
CREATE INDEX idx_fireworks_progress_created ON fireworks_log(progress_id, created_at);

-- ========================================
-- Completion Message
-- ========================================
SELECT 'Prime Fireworks Database Schema Created Successfully!' AS status;
SELECT CONCAT('Total Tables: ', COUNT(*)) AS table_count
FROM information_schema.tables
WHERE table_schema = 'prime_fireworks';
