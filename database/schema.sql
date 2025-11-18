-- =====================================================
-- Deviation Breeze Database Schema
-- MySQL 5.7 Compatible
-- =====================================================

-- Drop existing database if exists (개발 환경용)
-- DROP DATABASE IF EXISTS deviation_breeze;

-- Create database
CREATE DATABASE IF NOT EXISTS deviation_breeze
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE deviation_breeze;

-- =====================================================
-- Table: courses
-- Moodle 코스 정보 캐싱
-- =====================================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE COMMENT 'Moodle 코스 ID',
    course_name VARCHAR(255) NOT NULL COMMENT '코스명',
    course_fullname VARCHAR(500) DEFAULT NULL COMMENT '코스 전체명',
    category_id INT DEFAULT NULL COMMENT '카테고리 ID',
    visible TINYINT(1) DEFAULT 1 COMMENT '공개 여부',
    start_date TIMESTAMP NULL DEFAULT NULL COMMENT '시작일',
    end_date TIMESTAMP NULL DEFAULT NULL COMMENT '종료일',
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 동기화 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course_id (moodle_course_id),
    INDEX idx_visible (visible),
    INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 코스 정보';

-- =====================================================
-- Table: students
-- 학생 정보
-- =====================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE COMMENT 'Moodle 사용자 ID',
    username VARCHAR(100) NOT NULL COMMENT '사용자명',
    full_name VARCHAR(255) NOT NULL COMMENT '전체 이름',
    email VARCHAR(255) DEFAULT NULL COMMENT '이메일',
    first_name VARCHAR(100) DEFAULT NULL COMMENT '이름',
    last_name VARCHAR(100) DEFAULT NULL COMMENT '성',
    profile_image_url VARCHAR(500) DEFAULT NULL COMMENT '프로필 이미지',
    last_access TIMESTAMP NULL DEFAULT NULL COMMENT '마지막 접속',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 정보';

-- =====================================================
-- Table: teachers
-- 교사 정보
-- =====================================================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE COMMENT 'Moodle 사용자 ID',
    username VARCHAR(100) NOT NULL COMMENT '사용자명',
    full_name VARCHAR(255) NOT NULL COMMENT '전체 이름',
    email VARCHAR(255) DEFAULT NULL COMMENT '이메일',
    department VARCHAR(255) DEFAULT NULL COMMENT '부서',
    role ENUM('teacher', 'admin', 'super_admin') DEFAULT 'teacher' COMMENT '권한',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='교사 정보';

-- =====================================================
-- Table: quizzes
-- 퀴즈/문제 정보
-- =====================================================
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL UNIQUE COMMENT 'Moodle 퀴즈 ID',
    course_id INT NOT NULL COMMENT '코스 ID',
    quiz_name VARCHAR(255) NOT NULL COMMENT '퀴즈명',
    intro TEXT DEFAULT NULL COMMENT '퀴즈 설명',
    question_count INT DEFAULT 0 COMMENT '문제 수',
    time_limit INT DEFAULT 0 COMMENT '제한 시간 (초)',
    attempts_allowed INT DEFAULT 0 COMMENT '허용 시도 횟수 (0=무제한)',
    grade_method ENUM('highest', 'average', 'first', 'last') DEFAULT 'highest' COMMENT '채점 방법',
    passing_grade DECIMAL(5,2) DEFAULT 0.00 COMMENT '합격 점수',
    max_grade DECIMAL(5,2) DEFAULT 100.00 COMMENT '최대 점수',
    time_open TIMESTAMP NULL DEFAULT NULL COMMENT '시작 가능 시간',
    time_close TIMESTAMP NULL DEFAULT NULL COMMENT '종료 시간',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 동기화',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_moodle_quiz_id (moodle_quiz_id),
    INDEX idx_course_id (course_id),
    INDEX idx_is_active (is_active),
    INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='퀴즈 정보';

-- =====================================================
-- Table: quiz_questions
-- 퀴즈 문제 상세
-- =====================================================
CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE COMMENT 'Moodle 문제 ID',
    quiz_id INT NOT NULL COMMENT '퀴즈 ID',
    question_text TEXT NOT NULL COMMENT '문제 내용',
    question_type ENUM('multichoice', 'truefalse', 'shortanswer', 'numerical', 'essay', 'matching') DEFAULT 'multichoice' COMMENT '문제 유형',
    default_grade DECIMAL(10,5) DEFAULT 1.00000 COMMENT '기본 점수',
    penalty DECIMAL(10,5) DEFAULT 0.10000 COMMENT '오답 패널티',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    answer_options JSON DEFAULT NULL COMMENT '선택지 (JSON 형식)',
    correct_answer TEXT DEFAULT NULL COMMENT '정답',
    feedback TEXT DEFAULT NULL COMMENT '피드백',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_moodle_question_id (moodle_question_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_question_type (question_type),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='퀴즈 문제 상세';

-- =====================================================
-- Table: quiz_attempts
-- 학생 퀴즈 응시 기록
-- =====================================================
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_attempt_id INT NOT NULL UNIQUE COMMENT 'Moodle 응시 ID',
    quiz_id INT NOT NULL COMMENT '퀴즈 ID',
    student_id INT NOT NULL COMMENT '학생 ID',
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    state ENUM('inprogress', 'finished', 'abandoned') DEFAULT 'inprogress' COMMENT '상태',
    score DECIMAL(10,2) NOT NULL COMMENT '획득 점수',
    max_score DECIMAL(10,2) NOT NULL COMMENT '최대 점수',
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score / max_score) * 100, 2)) STORED COMMENT '백분율 점수',
    time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
    time_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시간',
    time_finished TIMESTAMP NULL DEFAULT NULL COMMENT '완료 시간',
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '응시 일시',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_moodle_attempt_id (moodle_attempt_id),
    INDEX idx_quiz_student (quiz_id, student_id),
    INDEX idx_state (state),
    INDEX idx_attempt_date (attempt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='퀴즈 응시 기록';

-- =====================================================
-- Table: question_responses
-- 개별 문제 응답 기록
-- =====================================================
CREATE TABLE question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL COMMENT '응시 ID',
    question_id INT NOT NULL COMMENT '문제 ID',
    student_answer TEXT DEFAULT NULL COMMENT '학생 답안',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '정답 여부',
    score DECIMAL(10,5) DEFAULT 0.00000 COMMENT '획득 점수',
    response_time INT DEFAULT 0 COMMENT '응답 시간 (초)',
    feedback TEXT DEFAULT NULL COMMENT '피드백',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_attempt_id (attempt_id),
    INDEX idx_question_id (question_id),
    INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개별 문제 응답';

-- =====================================================
-- Table: deviation_analytics
-- 편차 분석 결과 (핵심 테이블)
-- =====================================================
CREATE TABLE deviation_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL COMMENT '퀴즈 ID',
    student_id INT NOT NULL COMMENT '학생 ID',
    score DECIMAL(10,2) NOT NULL COMMENT '학생 점수',
    avg_score DECIMAL(10,2) NOT NULL COMMENT '평균 점수',
    std_deviation DECIMAL(10,4) NOT NULL COMMENT '표준편차',
    deviation_score DECIMAL(10,4) NOT NULL COMMENT 'Z-score (편차 점수)',
    variance DECIMAL(10,4) DEFAULT 0.0000 COMMENT '분산',
    percentile INT NOT NULL COMMENT '백분위',
    rank INT DEFAULT NULL COMMENT '순위',
    total_students INT DEFAULT NULL COMMENT '전체 학생 수',
    cluster_group ENUM('high', 'medium', 'low', 'outlier') NOT NULL COMMENT '클러스터 그룹',
    breeze_intensity DECIMAL(5,2) DEFAULT 0.00 COMMENT '시각화 강도 (0-100)',
    breeze_direction DECIMAL(5,2) DEFAULT 0.00 COMMENT '시각화 방향 (0-360도)',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '계산 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quiz_student (quiz_id, student_id),
    INDEX idx_deviation_score (deviation_score),
    INDEX idx_cluster_group (cluster_group),
    INDEX idx_percentile (percentile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='편차 분석 결과';

-- =====================================================
-- Table: deviation_history
-- 편차 변화 추이
-- =====================================================
CREATE TABLE deviation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT '학생 ID',
    quiz_id INT NOT NULL COMMENT '퀴즈 ID',
    deviation_score DECIMAL(10,4) NOT NULL COMMENT 'Z-score',
    cluster_group ENUM('high', 'medium', 'low', 'outlier') NOT NULL COMMENT '그룹',
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 시점',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_snapshot_date (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='편차 변화 추이';

-- =====================================================
-- Table: smartphone_sessions
-- 스마트폰 시뮬레이터 세션
-- =====================================================
CREATE TABLE smartphone_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL UNIQUE COMMENT '세션 토큰',
    student_id INT NOT NULL COMMENT '학생 ID',
    quiz_id INT NOT NULL COMMENT '현재 퀴즈 ID',
    current_question_id INT DEFAULT NULL COMMENT '현재 문제 ID',
    device_type ENUM('smartphone', 'tablet') DEFAULT 'smartphone' COMMENT '디바이스 타입',
    screen_width INT DEFAULT 375 COMMENT '화면 너비 (px)',
    screen_height INT DEFAULT 812 COMMENT '화면 높이 (px)',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성 상태',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 활동',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (current_question_id) REFERENCES quiz_questions(id) ON DELETE SET NULL,
    INDEX idx_session_token (session_token),
    INDEX idx_student_id (student_id),
    INDEX idx_is_active (is_active),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='스마트폰 세션';

-- =====================================================
-- Table: app_settings
-- 애플리케이션 설정
-- =====================================================
CREATE TABLE app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
    setting_value TEXT DEFAULT NULL COMMENT '설정 값',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '데이터 타입',
    description VARCHAR(500) DEFAULT NULL COMMENT '설명',
    is_public TINYINT(1) DEFAULT 0 COMMENT '공개 여부 (API 노출)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='애플리케이션 설정';

-- =====================================================
-- Table: api_logs
-- API 호출 로그 (디버깅 및 모니터링)
-- =====================================================
CREATE TABLE api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL COMMENT 'API 엔드포인트',
    method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL COMMENT 'HTTP 메서드',
    user_id INT DEFAULT NULL COMMENT '사용자 ID',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP 주소',
    request_data TEXT DEFAULT NULL COMMENT '요청 데이터',
    response_code INT DEFAULT NULL COMMENT '응답 코드',
    response_time INT DEFAULT NULL COMMENT '응답 시간 (ms)',
    error_message TEXT DEFAULT NULL COMMENT '에러 메시지',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint),
    INDEX idx_method (method),
    INDEX idx_response_code (response_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 호출 로그';

-- =====================================================
-- Insert Default Settings
-- =====================================================
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', 'Deviation Breeze', 'string', '애플리케이션 이름', 1),
('app_version', '1.0.0', 'string', '애플리케이션 버전', 1),
('sync_interval', '300', 'number', 'Moodle 동기화 간격 (초)', 0),
('deviation_calculation_method', 'zscore', 'string', '편차 계산 방식 (zscore, percentile)', 0),
('cluster_threshold_high', '1.0', 'number', '상위 클러스터 임계값 (Z-score)', 0),
('cluster_threshold_low', '-1.0', 'number', '하위 클러스터 임계값 (Z-score)', 0),
('breeze_animation_speed', '1.5', 'number', '바람 애니메이션 속도', 1),
('smartphone_default_width', '375', 'number', '스마트폰 기본 너비 (px)', 1),
('smartphone_default_height', '812', 'number', '스마트폰 기본 높이 (px)', 1),
('max_attempts_per_quiz', '3', 'number', '퀴즈당 최대 시도 횟수', 0),
('enable_realtime_updates', 'true', 'boolean', '실시간 업데이트 활성화', 0),
('log_retention_days', '30', 'number', '로그 보관 기간 (일)', 0);

-- =====================================================
-- Create Views for Quick Analytics
-- =====================================================

-- View: 퀴즈별 통계 요약
CREATE OR REPLACE VIEW view_quiz_statistics AS
SELECT
    q.id AS quiz_id,
    q.quiz_name,
    q.course_id,
    c.course_name,
    COUNT(DISTINCT qa.student_id) AS total_students,
    COUNT(qa.id) AS total_attempts,
    AVG(qa.percentage) AS avg_percentage,
    STDDEV(qa.percentage) AS std_deviation,
    MIN(qa.percentage) AS min_percentage,
    MAX(qa.percentage) AS max_percentage,
    q.last_sync
FROM quizzes q
LEFT JOIN courses c ON q.course_id = c.id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.state = 'finished'
GROUP BY q.id, q.quiz_name, q.course_id, c.course_name, q.last_sync;

-- View: 학생별 성과 요약
CREATE OR REPLACE VIEW view_student_performance AS
SELECT
    s.id AS student_id,
    s.full_name,
    s.username,
    COUNT(DISTINCT qa.quiz_id) AS quizzes_taken,
    COUNT(qa.id) AS total_attempts,
    AVG(qa.percentage) AS avg_percentage,
    AVG(da.deviation_score) AS avg_deviation,
    AVG(da.percentile) AS avg_percentile
FROM students s
LEFT JOIN quiz_attempts qa ON s.id = qa.student_id AND qa.state = 'finished'
LEFT JOIN deviation_analytics da ON s.id = da.student_id
GROUP BY s.id, s.full_name, s.username;

-- View: 최근 편차 분석 (최신 데이터만)
CREATE OR REPLACE VIEW view_latest_deviation AS
SELECT
    da.*,
    s.full_name AS student_name,
    s.username,
    q.quiz_name,
    q.course_id
FROM deviation_analytics da
INNER JOIN students s ON da.student_id = s.id
INNER JOIN quizzes q ON da.quiz_id = q.id
WHERE da.calculated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- =====================================================
-- Stored Procedures
-- =====================================================

DELIMITER //

-- 편차 재계산 프로시저
CREATE PROCEDURE sp_recalculate_deviation(IN p_quiz_id INT)
BEGIN
    DECLARE v_avg DECIMAL(10,2);
    DECLARE v_std DECIMAL(10,4);
    DECLARE v_total INT;

    -- 평균 및 표준편차 계산
    SELECT
        AVG(percentage),
        STDDEV(percentage),
        COUNT(DISTINCT student_id)
    INTO v_avg, v_std, v_total
    FROM quiz_attempts
    WHERE quiz_id = p_quiz_id AND state = 'finished';

    -- 기존 분석 데이터 삭제
    DELETE FROM deviation_analytics WHERE quiz_id = p_quiz_id;

    -- 새 분석 데이터 삽입
    INSERT INTO deviation_analytics (
        quiz_id, student_id, score, avg_score, std_deviation,
        deviation_score, percentile, rank, total_students, cluster_group,
        breeze_intensity, breeze_direction
    )
    SELECT
        qa.quiz_id,
        qa.student_id,
        qa.percentage AS score,
        v_avg AS avg_score,
        v_std AS std_deviation,
        CASE
            WHEN v_std > 0 THEN (qa.percentage - v_avg) / v_std
            ELSE 0
        END AS deviation_score,
        ROUND(
            (SELECT COUNT(*) FROM quiz_attempts qa2
             WHERE qa2.quiz_id = qa.quiz_id
             AND qa2.state = 'finished'
             AND qa2.percentage < qa.percentage) / v_total * 100
        ) AS percentile,
        (SELECT COUNT(*) + 1 FROM quiz_attempts qa3
         WHERE qa3.quiz_id = qa.quiz_id
         AND qa3.state = 'finished'
         AND qa3.percentage > qa.percentage) AS rank,
        v_total AS total_students,
        CASE
            WHEN (qa.percentage - v_avg) / v_std >= 1.0 THEN 'high'
            WHEN (qa.percentage - v_avg) / v_std <= -1.0 THEN 'low'
            WHEN ABS((qa.percentage - v_avg) / v_std) > 2.5 THEN 'outlier'
            ELSE 'medium'
        END AS cluster_group,
        LEAST(ABS((qa.percentage - v_avg) / v_std) * 30, 100) AS breeze_intensity,
        CASE
            WHEN (qa.percentage - v_avg) >= 0 THEN 45
            ELSE 225
        END AS breeze_direction
    FROM quiz_attempts qa
    WHERE qa.quiz_id = p_quiz_id
    AND qa.state = 'finished'
    GROUP BY qa.student_id;

END //

DELIMITER ;

-- =====================================================
-- Triggers
-- =====================================================

DELIMITER //

-- 퀴즈 응시 완료 시 자동 편차 계산 트리거
CREATE TRIGGER trg_after_attempt_finished
AFTER UPDATE ON quiz_attempts
FOR EACH ROW
BEGIN
    IF NEW.state = 'finished' AND OLD.state != 'finished' THEN
        CALL sp_recalculate_deviation(NEW.quiz_id);
    END IF;
END //

DELIMITER ;

-- =====================================================
-- Indexes for Performance Optimization
-- =====================================================

-- 복합 인덱스 추가 (자주 조회되는 조건)
ALTER TABLE quiz_attempts ADD INDEX idx_quiz_state_student (quiz_id, state, student_id);
ALTER TABLE deviation_analytics ADD INDEX idx_quiz_cluster (quiz_id, cluster_group);
ALTER TABLE question_responses ADD INDEX idx_attempt_correct (attempt_id, is_correct);

-- =====================================================
-- End of Schema
-- =====================================================
