-- Ratio Spring Database Schema
-- MySQL 5.7 호환

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ratio_spring_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ratio_spring_db;

-- 비율 문제 테이블
CREATE TABLE IF NOT EXISTS ratio_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Moodle 연동 정보
    moodle_course_id INT DEFAULT NULL,
    moodle_activity_id INT DEFAULT NULL,

    -- 비율 데이터
    ratio_a INT NOT NULL CHECK (ratio_a >= 1 AND ratio_a <= 10),
    ratio_b INT NOT NULL CHECK (ratio_b >= 1 AND ratio_b <= 10),

    -- 문제 정보
    question TEXT NOT NULL,
    description TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',

    -- 힌트 및 메타데이터 (JSON)
    hints JSON,
    metadata JSON,

    -- 정답 정보
    correct_answer JSON,

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,

    -- 생성/수정 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,

    INDEX idx_moodle_activity (moodle_activity_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 답변 테이블
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- 문제 참조
    problem_id INT NOT NULL,

    -- 학생 정보 (Moodle 사용자 ID)
    user_id INT NOT NULL,

    -- 답변 데이터
    answer JSON NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,

    -- 시도 정보
    attempt_number INT DEFAULT 1,
    time_spent INT DEFAULT NULL COMMENT '소요 시간 (초)',

    -- 제출 시간
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES ratio_problems(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 진도 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- 진도 상태
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',

    -- 통계
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    best_time INT DEFAULT NULL COMMENT '최고 기록 (초)',

    -- 시작/완료 시간
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES ratio_problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 활동 로그 테이블 (옵션)
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    problem_id INT DEFAULT NULL,

    -- 활동 타입
    action_type VARCHAR(50) NOT NULL,
    action_data JSON,

    -- IP 및 사용자 에이전트
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 세션 테이블 (옵션)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,

    user_id INT NOT NULL,
    session_data JSON,

    -- 만료 시간
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- 샘플 비율 문제
INSERT INTO ratio_problems (ratio_a, ratio_b, question, description, difficulty, hints, metadata) VALUES
(2, 3, '피자를 2:3 비율로 나누어 보세요', '두 명의 친구가 피자를 2:3 비율로 나누어 먹습니다.', 'easy',
 JSON_ARRAY('먼저 전체를 5등분 해보세요', '2:3은 5조각 중 2조각과 3조각입니다'),
 JSON_OBJECT('category', 'food', 'topic', 'fractions')),

(3, 4, '물과 주스를 3:4 비율로 섞어보세요', '건강한 음료를 만들기 위해 물과 주스를 섞습니다.', 'medium',
 JSON_ARRAY('전체는 3+4=7입니다', '물 3컵, 주스 4컵을 사용합니다'),
 JSON_OBJECT('category', 'drinks', 'topic', 'mixing')),

(5, 2, '남학생과 여학생의 비율은 5:2입니다', '우리 반의 남녀 학생 비율을 나타냅니다.', 'medium',
 JSON_ARRAY('전체 학생은 7명입니다', '남학생 5명, 여학생 2명'),
 JSON_OBJECT('category', 'classroom', 'topic', 'population')),

(1, 1, '같은 비율 1:1을 표현해보세요', '똑같이 나누는 경우입니다.', 'easy',
 JSON_ARRAY('1:1은 반반입니다', '스프링 길이가 같아야 합니다'),
 JSON_OBJECT('category', 'basic', 'topic', 'equality')),

(4, 1, '빨간 구슬과 파란 구슬의 비율은 4:1입니다', '구슬이 담긴 주머니에서 비율을 찾아봅니다.', 'hard',
 JSON_ARRAY('빨간 구슬이 4배 더 많습니다', '전체는 5개입니다'),
 JSON_OBJECT('category', 'objects', 'topic', 'comparison'));

-- ============================================
-- 뷰 (선택사항)
-- ============================================

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id,
    p.question,
    p.difficulty,
    COUNT(DISTINCT sa.user_id) as total_students,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100, 2) as success_rate,
    AVG(sa.time_spent) as avg_time_spent
FROM ratio_problems p
LEFT JOIN student_answers sa ON p.id = sa.problem_id
WHERE p.is_active = TRUE
GROUP BY p.id;

-- 학생별 통계 뷰
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    sa.user_id,
    COUNT(DISTINCT sa.problem_id) as problems_attempted,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(AVG(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100, 2) as accuracy_rate,
    AVG(sa.time_spent) as avg_time_spent,
    MIN(sa.submitted_at) as first_attempt,
    MAX(sa.submitted_at) as last_attempt
FROM student_answers sa
GROUP BY sa.user_id;

-- ============================================
-- 저장 프로시저 (선택사항)
-- ============================================

DELIMITER //

-- 학생 진도 업데이트 프로시저
CREATE PROCEDURE update_student_progress(
    IN p_user_id INT,
    IN p_problem_id INT,
    IN p_is_correct BOOLEAN,
    IN p_time_spent INT
)
BEGIN
    -- 진도 레코드가 없으면 생성
    INSERT INTO student_progress (user_id, problem_id, status, started_at)
    VALUES (p_user_id, p_problem_id, 'in_progress', NOW())
    ON DUPLICATE KEY UPDATE last_activity_at = NOW();

    -- 시도 횟수 업데이트
    UPDATE student_progress
    SET
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + IF(p_is_correct, 1, 0),
        best_time = CASE
            WHEN p_is_correct AND (best_time IS NULL OR p_time_spent < best_time)
            THEN p_time_spent
            ELSE best_time
        END,
        status = CASE
            WHEN correct_attempts >= 3 THEN 'mastered'
            WHEN correct_attempts >= 1 THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE
            WHEN p_is_correct AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END
    WHERE user_id = p_user_id AND problem_id = p_problem_id;
END //

DELIMITER ;

-- ============================================
-- 권한 설정 (선택사항)
-- ============================================

-- 웹 애플리케이션용 사용자 생성 (실제 배포 시)
-- CREATE USER 'ratio_spring_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON ratio_spring_db.* TO 'ratio_spring_user'@'localhost';
-- FLUSH PRIVILEGES;
