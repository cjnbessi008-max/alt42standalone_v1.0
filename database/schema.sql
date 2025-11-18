-- Alt42 Learning Activity Monitor Database Schema
-- MySQL 5.7 Compatible
-- Moodle 3.7 Integration

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS alt42_monitor
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alt42_monitor;

-- 1. 활동 로그 테이블 (메인 테이블)
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    moodle_user_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 사용자 ID',
    moodle_course_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 코스 ID',
    moodle_module_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 모듈 ID',
    student_name VARCHAR(255) NOT NULL COMMENT '학생 이름',
    activity_type ENUM('answer', 'correct', 'incorrect', 'hint', 'start', 'complete', 'view') NOT NULL COMMENT '활동 유형',
    content TEXT NOT NULL COMMENT '활동 내용',
    problem_id BIGINT(10) UNSIGNED NULL COMMENT '문제 ID',
    answer_data JSON NULL COMMENT '답안 데이터 (JSON)',
    is_correct TINYINT(1) NULL COMMENT '정답 여부 (1: 정답, 0: 오답)',
    time_spent INT(10) UNSIGNED NULL COMMENT '소요 시간 (초)',
    score DECIMAL(10, 2) NULL COMMENT '점수',
    ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
    user_agent TEXT NULL COMMENT '사용자 에이전트',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    PRIMARY KEY (id),
    INDEX idx_student_name (student_name),
    INDEX idx_activity_type (activity_type),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_composite_user_time (moodle_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학습 활동 로그';

-- 2. 문제 정보 테이블
CREATE TABLE IF NOT EXISTS problems (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    moodle_question_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 문제 ID',
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT NULL COMMENT '문제 설명',
    problem_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (fractions, algebra, etc.)',
    difficulty_level TINYINT(1) NOT NULL DEFAULT 1 COMMENT '난이도 (1-5)',
    correct_answer TEXT NOT NULL COMMENT '정답',
    hints JSON NULL COMMENT '힌트 배열 (JSON)',
    max_score DECIMAL(10, 2) NOT NULL DEFAULT 100.00 COMMENT '최대 점수',
    time_limit INT(10) UNSIGNED NULL COMMENT '제한 시간 (초)',
    metadata JSON NULL COMMENT '추가 메타데이터',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제 정보';

-- 3. 학생 세션 테이블
CREATE TABLE IF NOT EXISTS student_sessions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_token VARCHAR(255) NOT NULL COMMENT '세션 토큰',
    moodle_user_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 사용자 ID',
    student_name VARCHAR(255) NOT NULL COMMENT '학생 이름',
    moodle_course_id BIGINT(10) UNSIGNED NULL COMMENT 'Moodle 코스 ID',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '세션 시작 시간',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 활동 시간',
    ended_at TIMESTAMP NULL COMMENT '세션 종료 시간',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '활성화 여부',
    total_time_spent INT(10) UNSIGNED DEFAULT 0 COMMENT '총 소요 시간 (초)',
    problems_attempted INT(10) UNSIGNED DEFAULT 0 COMMENT '시도한 문제 수',
    problems_correct INT(10) UNSIGNED DEFAULT 0 COMMENT '정답 문제 수',
    total_score DECIMAL(10, 2) DEFAULT 0.00 COMMENT '총 점수',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_session_token (session_token),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 세션';

-- 4. Moodle 연동 설정 테이블
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL COMMENT '설정 키',
    config_value TEXT NOT NULL COMMENT '설정 값',
    description TEXT NULL COMMENT '설명',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 연동 설정';

-- 5. 실시간 모니터링 뷰
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT
    al.id,
    al.student_name,
    al.activity_type,
    al.content,
    al.is_correct,
    al.score,
    al.created_at,
    p.title AS problem_title,
    p.problem_type,
    p.difficulty_level,
    ss.session_token,
    ss.total_score AS session_total_score
FROM activity_logs al
LEFT JOIN problems p ON al.problem_id = p.id
LEFT JOIN student_sessions ss ON al.moodle_user_id = ss.moodle_user_id
    AND ss.is_active = 1
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY al.created_at DESC;

-- 6. 학생별 통계 뷰
CREATE OR REPLACE VIEW v_student_statistics AS
SELECT
    al.student_name,
    al.moodle_user_id,
    COUNT(*) AS total_activities,
    SUM(CASE WHEN al.activity_type = 'correct' THEN 1 ELSE 0 END) AS correct_count,
    SUM(CASE WHEN al.activity_type = 'incorrect' THEN 1 ELSE 0 END) AS incorrect_count,
    SUM(CASE WHEN al.activity_type = 'hint' THEN 1 ELSE 0 END) AS hint_count,
    AVG(al.score) AS avg_score,
    SUM(al.time_spent) AS total_time_spent,
    MIN(al.created_at) AS first_activity,
    MAX(al.created_at) AS last_activity
FROM activity_logs al
WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY al.student_name, al.moodle_user_id
ORDER BY total_activities DESC;

-- 초기 설정 데이터 삽입
INSERT INTO moodle_config (config_key, config_value, description) VALUES
('moodle_url', 'http://localhost/moodle', 'Moodle 기본 URL'),
('moodle_token', '', 'Moodle Web Service 토큰'),
('moodle_service', 'moodle_mobile_app', 'Moodle 서비스 이름'),
('sync_interval', '5', '동기화 간격 (초)'),
('max_logs_display', '50', '최대 표시 로그 개수'),
('enable_realtime', '1', '실시간 업데이트 활성화')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 샘플 문제 데이터 (테스트용)
INSERT INTO problems (title, description, problem_type, difficulty_level, correct_answer, hints, max_score) VALUES
('분수 덧셈 1', '1/2 + 1/4 = ?', 'fractions', 1, '3/4', '["분모를 같게 만드세요", "1/2는 2/4와 같습니다"]', 10.00),
('분수 덧셈 2', '2/3 + 1/6 = ?', 'fractions', 2, '5/6', '["최소공배수를 찾으세요", "2/3는 4/6과 같습니다"]', 15.00),
('분수 뺄셈 1', '3/4 - 1/2 = ?', 'fractions', 2, '1/4', '["분모를 같게 만드세요"]', 15.00),
('간단한 방정식', '2x + 5 = 13, x = ?', 'algebra', 3, '4', '["양쪽에서 5를 빼세요", "2로 나누세요"]', 20.00)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 샘플 활동 로그 (테스트용)
INSERT INTO activity_logs (student_name, activity_type, content, problem_id, is_correct, score, time_spent) VALUES
('김민수', 'start', '🎯 학습을 시작했습니다', NULL, NULL, NULL, NULL),
('이지은', 'answer', '✏️ 분수 덧셈 문제를 풀었습니다', 1, 1, 10.00, 45),
('박준호', 'hint', '💡 힌트를 요청했습니다', 2, NULL, NULL, NULL),
('최서연', 'correct', '✅ 정답입니다!', 1, 1, 10.00, 32),
('정우진', 'incorrect', '❌ 오답입니다. 다시 시도해보세요', 3, 0, 0.00, 28);

-- 인덱스 성능 확인을 위한 프로시저
DELIMITER $$

CREATE PROCEDURE sp_get_recent_logs(
    IN p_limit INT,
    IN p_activity_type VARCHAR(50)
)
BEGIN
    IF p_activity_type IS NULL OR p_activity_type = '' THEN
        SELECT * FROM v_recent_activity
        ORDER BY created_at DESC
        LIMIT p_limit;
    ELSE
        SELECT * FROM v_recent_activity
        WHERE activity_type = p_activity_type
        ORDER BY created_at DESC
        LIMIT p_limit;
    END IF;
END$$

DELIMITER ;

-- 권한 설정 (보안을 위해 실제 환경에서는 적절히 수정 필요)
-- CREATE USER IF NOT EXISTS 'alt42_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_monitor.* TO 'alt42_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 스키마 정보 출력
SELECT
    'Database schema created successfully!' AS message,
    DATABASE() AS current_database,
    VERSION() AS mysql_version,
    NOW() AS created_at;
