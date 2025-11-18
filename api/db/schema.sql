-- =====================================================
-- Change Wave Database Schema
-- MySQL 5.7 호환
-- =====================================================

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS changewave
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE changewave;

-- =====================================================
-- 1. 문제 테이블 (changewave_problems)
-- =====================================================
CREATE TABLE IF NOT EXISTS changewave_problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 문제 기본 정보
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT NOT NULL COMMENT '문제 설명',

    -- 함수 정의
    function_expr VARCHAR(500) NOT NULL COMMENT '함수 표현식 (JavaScript)',
    function_name VARCHAR(100) NOT NULL COMMENT '함수 이름 표기',

    -- 좌표계 범위
    x_min DECIMAL(10, 2) NOT NULL DEFAULT -10.00 COMMENT 'X축 최소값',
    x_max DECIMAL(10, 2) NOT NULL DEFAULT 10.00 COMMENT 'X축 최대값',
    y_min DECIMAL(10, 2) NOT NULL DEFAULT -10.00 COMMENT 'Y축 최소값',
    y_max DECIMAL(10, 2) NOT NULL DEFAULT 10.00 COMMENT 'Y축 최대값',

    -- 분류 및 난이도
    category VARCHAR(50) NOT NULL DEFAULT '기타' COMMENT '카테고리',
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium' COMMENT '난이도',

    -- Moodle 연동
    moodle_quiz_id INT UNSIGNED NULL COMMENT 'Moodle 퀴즈 ID',
    moodle_question_id INT UNSIGNED NULL COMMENT 'Moodle 질문 ID',

    -- 상태 및 메타데이터
    active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '활성화 여부',
    views INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '조회수',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

    -- 인덱스
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (active),
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_created (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Change Wave 문제 정보';

-- =====================================================
-- 2. 학습 기록 테이블 (changewave_learning_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS changewave_learning_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 사용자 정보
    user_id INT UNSIGNED NOT NULL COMMENT '사용자 ID (Moodle 연동)',
    username VARCHAR(100) NOT NULL COMMENT '사용자 이름',

    -- 문제 정보
    problem_id INT UNSIGNED NOT NULL COMMENT '문제 ID',

    -- 학습 데이터
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시간',
    end_time TIMESTAMP NULL COMMENT '종료 시간',
    duration INT UNSIGNED NULL COMMENT '학습 시간 (초)',

    -- 상호작용 데이터
    play_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '재생 횟수',
    pause_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '일시정지 횟수',
    reset_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '리셋 횟수',
    speed_changes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '속도 변경 횟수',

    -- 완료 여부
    completed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '완료 여부',
    completion_time TIMESTAMP NULL COMMENT '완료 시간',

    -- 점수 및 평가
    score DECIMAL(5, 2) NULL COMMENT '점수 (0-100)',
    feedback TEXT NULL COMMENT '피드백',

    -- 메타데이터
    session_id VARCHAR(100) NOT NULL COMMENT '세션 ID',
    ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
    user_agent TEXT NULL COMMENT 'User Agent',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',

    -- 외래키
    FOREIGN KEY (problem_id) REFERENCES changewave_problems(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- 인덱스
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id),
    INDEX idx_completed (completed),
    INDEX idx_created (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Change Wave 학습 기록';

-- =====================================================
-- 3. 사용자 진도 테이블 (changewave_user_progress)
-- =====================================================
CREATE TABLE IF NOT EXISTS changewave_user_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- 사용자 정보
    user_id INT UNSIGNED NOT NULL COMMENT '사용자 ID',

    -- 문제 정보
    problem_id INT UNSIGNED NOT NULL COMMENT '문제 ID',

    -- 진도 정보
    status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started' COMMENT '상태',
    attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '시도 횟수',
    best_score DECIMAL(5, 2) NULL COMMENT '최고 점수',

    -- 시간 정보
    first_attempt_at TIMESTAMP NULL COMMENT '첫 시도 시간',
    last_attempt_at TIMESTAMP NULL COMMENT '마지막 시도 시간',
    completed_at TIMESTAMP NULL COMMENT '완료 시간',

    -- 메타데이터
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

    -- 외래키
    FOREIGN KEY (problem_id) REFERENCES changewave_problems(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- 유니크 제약
    UNIQUE KEY uk_user_problem (user_id, problem_id),

    -- 인덱스
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_updated (updated_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 진도 관리';

-- =====================================================
-- 4. 설정 테이블 (changewave_settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS changewave_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
    setting_value TEXT NOT NULL COMMENT '설정 값',
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT '설정 타입',
    description TEXT NULL COMMENT '설명',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

    INDEX idx_key (setting_key)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 설정';

-- =====================================================
-- 샘플 데이터 삽입
-- =====================================================

-- 문제 샘플 데이터
INSERT INTO changewave_problems (
    title, description, function_expr, function_name,
    x_min, x_max, y_min, y_max, category, difficulty
) VALUES
(
    '이차함수의 변화 관찰하기',
    'f(x) = x² 함수의 변화를 관찰하세요. x값이 증가할 때 함수값과 변화율이 어떻게 변하는지 파동을 통해 확인할 수 있습니다.',
    'x * x',
    'f(x) = x²',
    -5, 5, -2, 25,
    '이차함수',
    'easy'
),
(
    '삼차함수의 극값 찾기',
    'f(x) = x³ - 3x 함수의 극댓값과 극솟값을 파동을 통해 찾아보세요. 변화율이 0이 되는 지점을 관찰하세요.',
    'x * x * x - 3 * x',
    'f(x) = x³ - 3x',
    -3, 3, -5, 5,
    '삼차함수',
    'medium'
),
(
    '사인 함수의 주기 이해하기',
    'f(x) = sin(x) 함수의 주기적 변화를 파동으로 경험하세요. 삼각함수의 특성을 시각적으로 이해할 수 있습니다.',
    'sin(x)',
    'f(x) = sin(x)',
    -6.28, 6.28, -1.5, 1.5,
    '삼각함수',
    'medium'
),
(
    '지수함수의 급격한 증가',
    'f(x) = 2^x 함수의 지수적 증가를 관찰하세요. 변화율도 함께 급격히 증가하는 것을 확인할 수 있습니다.',
    'pow(2, x)',
    'f(x) = 2ˣ',
    -2, 4, -1, 16,
    '지수함수',
    'hard'
),
(
    '절댓값 함수의 불연속',
    'f(x) = |x| 함수에서 x=0 지점의 변화율 불연속을 파동으로 관찰하세요.',
    'abs(x)',
    'f(x) = |x|',
    -5, 5, -1, 5,
    '절댓값함수',
    'easy'
),
(
    '코사인 함수와 사인 함수 비교',
    'f(x) = cos(x) 함수의 변화를 관찰하고 sin(x)와 어떻게 다른지 비교해보세요.',
    'cos(x)',
    'f(x) = cos(x)',
    -6.28, 6.28, -1.5, 1.5,
    '삼각함수',
    'medium'
),
(
    '일차함수의 기본',
    'f(x) = 2x + 1 함수의 일정한 변화율을 파동으로 확인하세요.',
    '2 * x + 1',
    'f(x) = 2x + 1',
    -5, 5, -10, 11,
    '일차함수',
    'easy'
),
(
    '로그함수의 증가 패턴',
    'f(x) = ln(x) 함수의 느린 증가 패턴을 관찰하세요. x가 커질수록 변화율이 감소합니다.',
    'log(x)',
    'f(x) = ln(x)',
    0.1, 5, -3, 2,
    '로그함수',
    'hard'
);

-- 기본 설정 데이터
INSERT INTO changewave_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', 'Change Wave', 'string', '애플리케이션 이름'),
('default_speed', '1.0', 'number', '기본 재생 속도'),
('max_speed', '3.0', 'number', '최대 재생 속도'),
('enable_moodle_sync', 'true', 'boolean', 'Moodle 동기화 활성화'),
('session_timeout', '3600', 'number', '세션 타임아웃 (초)');

-- =====================================================
-- 뷰 생성
-- =====================================================

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW v_problem_stats AS
SELECT
    p.id,
    p.title,
    p.category,
    p.difficulty,
    COUNT(DISTINCT l.user_id) AS total_users,
    COUNT(l.id) AS total_attempts,
    AVG(l.duration) AS avg_duration,
    AVG(l.score) AS avg_score,
    SUM(CASE WHEN l.completed = 1 THEN 1 ELSE 0 END) AS completed_count,
    p.views
FROM changewave_problems p
LEFT JOIN changewave_learning_logs l ON p.id = l.problem_id
WHERE p.active = 1
GROUP BY p.id;

-- =====================================================
-- 저장 프로시저
-- =====================================================

-- 문제 조회수 증가
DELIMITER //
CREATE PROCEDURE sp_increment_problem_views(IN p_problem_id INT)
BEGIN
    UPDATE changewave_problems
    SET views = views + 1
    WHERE id = p_problem_id;
END //
DELIMITER ;

-- 학습 기록 시작
DELIMITER //
CREATE PROCEDURE sp_start_learning(
    IN p_user_id INT,
    IN p_username VARCHAR(100),
    IN p_problem_id INT,
    IN p_session_id VARCHAR(100),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    OUT p_log_id BIGINT
)
BEGIN
    INSERT INTO changewave_learning_logs (
        user_id, username, problem_id, session_id, ip_address, user_agent
    ) VALUES (
        p_user_id, p_username, p_problem_id, p_session_id, p_ip_address, p_user_agent
    );

    SET p_log_id = LAST_INSERT_ID();

    -- 사용자 진도 업데이트
    INSERT INTO changewave_user_progress (user_id, problem_id, status, first_attempt_at, last_attempt_at)
    VALUES (p_user_id, p_problem_id, 'in_progress', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        status = 'in_progress',
        attempts = attempts + 1,
        last_attempt_at = NOW();

    -- 조회수 증가
    CALL sp_increment_problem_views(p_problem_id);
END //
DELIMITER ;

-- =====================================================
-- 권한 설정 (필요시)
-- =====================================================

-- Change Wave 전용 사용자 생성 (비밀번호는 실제 운영시 변경 필요)
-- CREATE USER IF NOT EXISTS 'changewave_user'@'localhost' IDENTIFIED BY 'changewave_password';
-- GRANT SELECT, INSERT, UPDATE ON changewave.* TO 'changewave_user'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- 완료
-- =====================================================
