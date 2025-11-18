-- AI Problem Optimizer for Moodle 3.7
-- MySQL 5.7 Compatible Schema
-- Installation Script

-- ============================================
-- Table 1: Student Performance Metrics
-- ============================================
CREATE TABLE IF NOT EXISTS mdl_ai_student_metrics (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL COMMENT '학생 ID (mdl_user 참조)',
    courseid BIGINT(10) UNSIGNED NOT NULL COMMENT '과목 ID (mdl_course 참조)',

    -- 성과 지표
    total_attempts INT(10) UNSIGNED DEFAULT 0 COMMENT '총 문제 시도 횟수',
    correct_attempts INT(10) UNSIGNED DEFAULT 0 COMMENT '정답 횟수',
    accuracy DECIMAL(5,4) DEFAULT 0.0000 COMMENT '정확도 (0.0000 ~ 1.0000)',

    -- 시간 지표
    avg_time_per_problem INT(10) UNSIGNED DEFAULT 0 COMMENT '문제당 평균 소요 시간 (초)',
    total_time_spent INT(10) UNSIGNED DEFAULT 0 COMMENT '총 학습 시간 (초)',

    -- 학습 패턴
    consecutive_learning_days INT(5) UNSIGNED DEFAULT 0 COMMENT '연속 학습 일수',
    last_activity_date INT(10) UNSIGNED DEFAULT 0 COMMENT '마지막 활동 시각 (Unix timestamp)',

    -- 난이도 추적
    current_difficulty_level INT(2) UNSIGNED DEFAULT 1 COMMENT '현재 난이도 (1-5)',
    difficulty_adaptation_score DECIMAL(5,4) DEFAULT 0.5000 COMMENT '난이도 적응도 점수',

    -- 최적화 결과
    recommended_problems INT(5) UNSIGNED DEFAULT 10 COMMENT '권장 문제 수',
    last_calculated INT(10) UNSIGNED DEFAULT 0 COMMENT '마지막 계산 시각 (Unix timestamp)',

    -- 메타데이터
    timecreated INT(10) UNSIGNED NOT NULL COMMENT '레코드 생성 시각',
    timemodified INT(10) UNSIGNED NOT NULL COMMENT '레코드 수정 시각',

    KEY idx_user_course (userid, courseid),
    KEY idx_last_activity (last_activity_date),
    KEY idx_difficulty (current_difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생별 성과 메트릭 및 최적화 데이터';

-- ============================================
-- Table 2: Problem Solving History
-- ============================================
CREATE TABLE IF NOT EXISTS mdl_ai_problem_history (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL COMMENT '학생 ID',
    courseid BIGINT(10) UNSIGNED NOT NULL COMMENT '과목 ID',
    quizid BIGINT(10) UNSIGNED NOT NULL COMMENT '퀴즈 ID (mdl_quiz 참조)',
    questionid BIGINT(10) UNSIGNED DEFAULT NULL COMMENT '문제 ID (선택적)',

    -- 문제 정보
    problem_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (예: fraction_addition, algebra_basic)',
    difficulty_level INT(2) UNSIGNED NOT NULL COMMENT '문제 난이도 (1-5)',

    -- 풀이 결과
    is_correct TINYINT(1) NOT NULL COMMENT '정답 여부 (1: 정답, 0: 오답)',
    time_spent INT(10) UNSIGNED NOT NULL COMMENT '소요 시간 (초)',
    attempt_number INT(5) UNSIGNED DEFAULT 1 COMMENT '시도 횟수',

    -- 학생 답안 (디버깅 및 분석용)
    student_answer TEXT DEFAULT NULL COMMENT '학생 답안',
    correct_answer TEXT DEFAULT NULL COMMENT '정답',

    -- 추가 메타데이터
    hint_used TINYINT(1) DEFAULT 0 COMMENT '힌트 사용 여부',
    quiz_session_id VARCHAR(100) DEFAULT NULL COMMENT '퀴즈 세션 ID',

    -- 메타데이터
    timecreated INT(10) UNSIGNED NOT NULL COMMENT '기록 시각',

    KEY idx_user_course (userid, courseid),
    KEY idx_quiz (quizid),
    KEY idx_timecreated (timecreated),
    KEY idx_problem_type (problem_type),
    KEY idx_difficulty (difficulty_level),
    KEY idx_user_time (userid, timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생별 문제 풀이 이력';

-- ============================================
-- Table 3: Optimization Calculation Log
-- ============================================
CREATE TABLE IF NOT EXISTS mdl_ai_optimization_log (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL COMMENT '학생 ID',
    courseid BIGINT(10) UNSIGNED NOT NULL COMMENT '과목 ID',

    -- 입력 파라미터
    accuracy DECIMAL(5,4) NOT NULL COMMENT '입력된 정확도',
    avg_time INT(10) UNSIGNED NOT NULL COMMENT '평균 시간 (초)',
    consistency_days INT(5) UNSIGNED NOT NULL COMMENT '학습 지속 일수',
    difficulty_level INT(2) UNSIGNED NOT NULL COMMENT '현재 난이도',

    -- 계산 인자들
    accuracy_factor DECIMAL(5,2) NOT NULL COMMENT '정확도 가중치',
    speed_factor DECIMAL(5,2) NOT NULL COMMENT '속도 가중치',
    consistency_factor DECIMAL(5,2) NOT NULL COMMENT '지속도 가중치',

    -- 결과
    recommended_problems INT(5) UNSIGNED NOT NULL COMMENT '최종 권장 문제 수',

    -- 알고리즘 버전 (향후 개선 추적용)
    calculation_version VARCHAR(10) DEFAULT '1.0' COMMENT '계산 알고리즘 버전',
    calculation_notes TEXT DEFAULT NULL COMMENT '계산 관련 노트',

    -- 메타데이터
    timecreated INT(10) UNSIGNED NOT NULL COMMENT '계산 시각',

    KEY idx_user_course (userid, courseid),
    KEY idx_timecreated (timecreated),
    KEY idx_version (calculation_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='최적화 계산 로그 (디버깅 및 분석용)';

-- ============================================
-- Table 4: Course-specific Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS mdl_ai_problem_config (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    courseid BIGINT(10) UNSIGNED NOT NULL COMMENT '과목 ID',

    -- 기본 설정
    base_problems INT(5) UNSIGNED DEFAULT 10 COMMENT '기본 문제 수',
    min_problems INT(5) UNSIGNED DEFAULT 5 COMMENT '최소 문제 수',
    max_problems INT(5) UNSIGNED DEFAULT 30 COMMENT '최대 문제 수',

    -- 난이도 임계값
    difficulty_up_threshold DECIMAL(5,4) DEFAULT 0.9000 COMMENT '난이도 상승 임계값 (정확도)',
    difficulty_down_threshold DECIMAL(5,4) DEFAULT 0.6000 COMMENT '난이도 하락 임계값 (정확도)',
    optimal_accuracy_min DECIMAL(5,4) DEFAULT 0.7000 COMMENT '최적 정확도 최소값',
    optimal_accuracy_max DECIMAL(5,4) DEFAULT 0.8500 COMMENT '최적 정확도 최대값',

    -- 시간 임계값 (초)
    fast_time_threshold INT(10) UNSIGNED DEFAULT 30 COMMENT '빠른 풀이 임계값 (초)',
    slow_time_threshold INT(10) UNSIGNED DEFAULT 60 COMMENT '느린 풀이 임계값 (초)',

    -- 지속도 임계값
    high_consistency_days INT(5) UNSIGNED DEFAULT 5 COMMENT '높은 지속도 임계값 (일)',

    -- 가중치 설정 (고급)
    accuracy_weight DECIMAL(3,2) DEFAULT 0.40 COMMENT '정확도 가중치 (0.0 ~ 1.0)',
    speed_weight DECIMAL(3,2) DEFAULT 0.30 COMMENT '속도 가중치 (0.0 ~ 1.0)',
    consistency_weight DECIMAL(3,2) DEFAULT 0.30 COMMENT '지속도 가중치 (0.0 ~ 1.0)',

    -- 활성화 설정
    is_enabled TINYINT(1) DEFAULT 1 COMMENT '플러그인 활성화 여부',
    auto_adjust_difficulty TINYINT(1) DEFAULT 1 COMMENT '자동 난이도 조정 여부',

    -- 메타데이터
    timecreated INT(10) UNSIGNED NOT NULL COMMENT '생성 시각',
    timemodified INT(10) UNSIGNED NOT NULL COMMENT '수정 시각',

    UNIQUE KEY idx_courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='과목별 최적화 설정';

-- ============================================
-- Table 5: Daily Activity Summary (성능 최적화용)
-- ============================================
CREATE TABLE IF NOT EXISTS mdl_ai_daily_summary (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL COMMENT '학생 ID',
    courseid BIGINT(10) UNSIGNED NOT NULL COMMENT '과목 ID',
    activity_date INT(10) UNSIGNED NOT NULL COMMENT '활동 날짜 (Unix timestamp, 00:00:00)',

    -- 일일 통계
    problems_attempted INT(10) UNSIGNED DEFAULT 0 COMMENT '시도한 문제 수',
    problems_correct INT(10) UNSIGNED DEFAULT 0 COMMENT '맞힌 문제 수',
    total_time_spent INT(10) UNSIGNED DEFAULT 0 COMMENT '총 소요 시간 (초)',
    avg_accuracy DECIMAL(5,4) DEFAULT 0.0000 COMMENT '평균 정확도',

    -- 난이도별 성과
    level_1_attempts INT(10) UNSIGNED DEFAULT 0,
    level_1_correct INT(10) UNSIGNED DEFAULT 0,
    level_2_attempts INT(10) UNSIGNED DEFAULT 0,
    level_2_correct INT(10) UNSIGNED DEFAULT 0,
    level_3_attempts INT(10) UNSIGNED DEFAULT 0,
    level_3_correct INT(10) UNSIGNED DEFAULT 0,
    level_4_attempts INT(10) UNSIGNED DEFAULT 0,
    level_4_correct INT(10) UNSIGNED DEFAULT 0,
    level_5_attempts INT(10) UNSIGNED DEFAULT 0,
    level_5_correct INT(10) UNSIGNED DEFAULT 0,

    -- 메타데이터
    timecreated INT(10) UNSIGNED NOT NULL COMMENT '생성 시각',
    timemodified INT(10) UNSIGNED NOT NULL COMMENT '수정 시각',

    UNIQUE KEY idx_user_course_date (userid, courseid, activity_date),
    KEY idx_activity_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일일 활동 요약 (성능 최적화 및 리포팅용)';

-- ============================================
-- Initial Configuration Data
-- ============================================
-- Note: 실제 courseid는 Moodle 설치 후 삽입해야 합니다.
-- 아래는 예시입니다.
/*
INSERT INTO mdl_ai_problem_config (
    courseid, base_problems, min_problems, max_problems,
    difficulty_up_threshold, difficulty_down_threshold,
    optimal_accuracy_min, optimal_accuracy_max,
    fast_time_threshold, slow_time_threshold,
    high_consistency_days,
    accuracy_weight, speed_weight, consistency_weight,
    is_enabled, auto_adjust_difficulty,
    timecreated, timemodified
) VALUES (
    1, 10, 5, 30,
    0.9000, 0.6000,
    0.7000, 0.8500,
    30, 60,
    5,
    0.40, 0.30, 0.30,
    1, 1,
    UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
);
*/

-- ============================================
-- Indexes for Performance Optimization
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_metrics_user_modified ON mdl_ai_student_metrics(userid, timemodified);
CREATE INDEX idx_history_user_quiz_time ON mdl_ai_problem_history(userid, quizid, timecreated);
CREATE INDEX idx_history_correct_time ON mdl_ai_problem_history(is_correct, timecreated);

-- ============================================
-- Views for Convenient Querying
-- ============================================

-- View 1: Student Performance Dashboard
CREATE OR REPLACE VIEW vw_student_performance AS
SELECT
    m.userid,
    m.courseid,
    u.firstname,
    u.lastname,
    u.email,
    m.total_attempts,
    m.correct_attempts,
    m.accuracy,
    m.avg_time_per_problem,
    m.current_difficulty_level,
    m.recommended_problems,
    m.consecutive_learning_days,
    FROM_UNIXTIME(m.last_activity_date) as last_activity,
    FROM_UNIXTIME(m.last_calculated) as last_calculated,
    c.fullname as course_name
FROM mdl_ai_student_metrics m
JOIN mdl_user u ON m.userid = u.id
JOIN mdl_course c ON m.courseid = c.id;

-- View 2: Recent Problem History (최근 7일)
CREATE OR REPLACE VIEW vw_recent_problem_history AS
SELECT
    h.id,
    h.userid,
    h.courseid,
    u.firstname,
    u.lastname,
    h.problem_type,
    h.difficulty_level,
    h.is_correct,
    h.time_spent,
    FROM_UNIXTIME(h.timecreated) as attempt_time,
    c.fullname as course_name
FROM mdl_ai_problem_history h
JOIN mdl_user u ON h.userid = u.id
JOIN mdl_course c ON h.courseid = c.id
WHERE h.timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));

-- View 3: Course Statistics
CREATE OR REPLACE VIEW vw_course_statistics AS
SELECT
    c.id as courseid,
    c.fullname as course_name,
    COUNT(DISTINCT m.userid) as total_students,
    AVG(m.accuracy) as avg_accuracy,
    AVG(m.recommended_problems) as avg_recommended_problems,
    AVG(m.current_difficulty_level) as avg_difficulty_level,
    SUM(m.total_attempts) as total_attempts,
    SUM(m.correct_attempts) as total_correct
FROM mdl_course c
LEFT JOIN mdl_ai_student_metrics m ON c.id = m.courseid
GROUP BY c.id, c.fullname;

-- ============================================
-- Stored Procedures for Common Operations
-- ============================================

DELIMITER //

-- Procedure 1: Initialize or Update Student Metrics
CREATE PROCEDURE sp_update_student_metrics(
    IN p_userid BIGINT,
    IN p_courseid BIGINT,
    IN p_is_correct TINYINT,
    IN p_time_spent INT
)
BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_correct INT DEFAULT 0;
    DECLARE v_avg_time INT DEFAULT 0;
    DECLARE v_accuracy DECIMAL(5,4) DEFAULT 0.0000;
    DECLARE v_last_activity INT DEFAULT 0;
    DECLARE v_consecutive_days INT DEFAULT 0;
    DECLARE v_exists INT DEFAULT 0;

    -- Check if record exists
    SELECT COUNT(*) INTO v_exists
    FROM mdl_ai_student_metrics
    WHERE userid = p_userid AND courseid = p_courseid;

    IF v_exists = 0 THEN
        -- Insert new record
        INSERT INTO mdl_ai_student_metrics (
            userid, courseid,
            total_attempts, correct_attempts, accuracy,
            avg_time_per_problem, total_time_spent,
            consecutive_learning_days, last_activity_date,
            current_difficulty_level, difficulty_adaptation_score,
            recommended_problems, last_calculated,
            timecreated, timemodified
        ) VALUES (
            p_userid, p_courseid,
            1, IF(p_is_correct = 1, 1, 0), IF(p_is_correct = 1, 1.0000, 0.0000),
            p_time_spent, p_time_spent,
            1, UNIX_TIMESTAMP(),
            1, 0.5000,
            10, UNIX_TIMESTAMP(),
            UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
        );
    ELSE
        -- Update existing record
        SELECT total_attempts, correct_attempts, total_time_spent, last_activity_date
        INTO v_total, v_correct, v_avg_time, v_last_activity
        FROM mdl_ai_student_metrics
        WHERE userid = p_userid AND courseid = p_courseid;

        SET v_total = v_total + 1;
        SET v_correct = v_correct + IF(p_is_correct = 1, 1, 0);
        SET v_accuracy = v_correct / v_total;
        SET v_avg_time = (v_avg_time + p_time_spent) / 2;

        -- Calculate consecutive days
        IF UNIX_TIMESTAMP() - v_last_activity < 86400 * 2 THEN
            SET v_consecutive_days = v_consecutive_days + 1;
        ELSE
            SET v_consecutive_days = 1;
        END IF;

        UPDATE mdl_ai_student_metrics SET
            total_attempts = v_total,
            correct_attempts = v_correct,
            accuracy = v_accuracy,
            avg_time_per_problem = v_avg_time,
            total_time_spent = total_time_spent + p_time_spent,
            consecutive_learning_days = v_consecutive_days,
            last_activity_date = UNIX_TIMESTAMP(),
            timemodified = UNIX_TIMESTAMP()
        WHERE userid = p_userid AND courseid = p_courseid;
    END IF;
END//

-- Procedure 2: Calculate Optimal Problems for a Student
CREATE PROCEDURE sp_calculate_optimal_problems(
    IN p_userid BIGINT,
    IN p_courseid BIGINT,
    OUT p_recommended_problems INT
)
BEGIN
    DECLARE v_accuracy DECIMAL(5,4) DEFAULT 0.0000;
    DECLARE v_avg_time INT DEFAULT 0;
    DECLARE v_consistency_days INT DEFAULT 0;
    DECLARE v_base_problems INT DEFAULT 10;
    DECLARE v_min_problems INT DEFAULT 5;
    DECLARE v_max_problems INT DEFAULT 30;
    DECLARE v_accuracy_factor DECIMAL(5,2) DEFAULT 1.0;
    DECLARE v_speed_factor DECIMAL(5,2) DEFAULT 1.0;
    DECLARE v_consistency_factor DECIMAL(5,2) DEFAULT 1.0;
    DECLARE v_fast_threshold INT DEFAULT 30;
    DECLARE v_slow_threshold INT DEFAULT 60;
    DECLARE v_high_consistency INT DEFAULT 5;

    -- Get student metrics
    SELECT accuracy, avg_time_per_problem, consecutive_learning_days
    INTO v_accuracy, v_avg_time, v_consistency_days
    FROM mdl_ai_student_metrics
    WHERE userid = p_userid AND courseid = p_courseid;

    -- Get course configuration
    SELECT base_problems, min_problems, max_problems,
           fast_time_threshold, slow_time_threshold, high_consistency_days
    INTO v_base_problems, v_min_problems, v_max_problems,
         v_fast_threshold, v_slow_threshold, v_high_consistency
    FROM mdl_ai_problem_config
    WHERE courseid = p_courseid;

    -- Calculate accuracy factor
    IF v_accuracy >= 0.9000 THEN
        SET v_accuracy_factor = 1.3;
    ELSEIF v_accuracy >= 0.7000 THEN
        SET v_accuracy_factor = 1.0;
    ELSE
        SET v_accuracy_factor = 0.7;
    END IF;

    -- Calculate speed factor
    IF v_avg_time < v_fast_threshold THEN
        SET v_speed_factor = 1.2;
    ELSEIF v_avg_time < v_slow_threshold THEN
        SET v_speed_factor = 1.0;
    ELSE
        SET v_speed_factor = 0.8;
    END IF;

    -- Calculate consistency factor
    IF v_consistency_days >= v_high_consistency THEN
        SET v_consistency_factor = 1.1;
    ELSE
        SET v_consistency_factor = 1.0;
    END IF;

    -- Final calculation
    SET p_recommended_problems = ROUND(
        v_base_problems * v_accuracy_factor * v_speed_factor * v_consistency_factor
    );

    -- Apply constraints
    IF p_recommended_problems < v_min_problems THEN
        SET p_recommended_problems = v_min_problems;
    ELSEIF p_recommended_problems > v_max_problems THEN
        SET p_recommended_problems = v_max_problems;
    END IF;

    -- Update metrics table
    UPDATE mdl_ai_student_metrics SET
        recommended_problems = p_recommended_problems,
        last_calculated = UNIX_TIMESTAMP(),
        timemodified = UNIX_TIMESTAMP()
    WHERE userid = p_userid AND courseid = p_courseid;

    -- Log the calculation
    INSERT INTO mdl_ai_optimization_log (
        userid, courseid,
        accuracy, avg_time, consistency_days, difficulty_level,
        accuracy_factor, speed_factor, consistency_factor,
        recommended_problems, calculation_version, timecreated
    ) VALUES (
        p_userid, p_courseid,
        v_accuracy, v_avg_time, v_consistency_days,
        (SELECT current_difficulty_level FROM mdl_ai_student_metrics WHERE userid = p_userid AND courseid = p_courseid),
        v_accuracy_factor, v_speed_factor, v_consistency_factor,
        p_recommended_problems, '1.0', UNIX_TIMESTAMP()
    );
END//

DELIMITER ;

-- ============================================
-- Verification Queries
-- ============================================
-- Use these queries to verify installation

-- Show all tables
-- SHOW TABLES LIKE 'mdl_ai_%';

-- Show table structures
-- DESCRIBE mdl_ai_student_metrics;
-- DESCRIBE mdl_ai_problem_history;
-- DESCRIBE mdl_ai_optimization_log;
-- DESCRIBE mdl_ai_problem_config;
-- DESCRIBE mdl_ai_daily_summary;

-- Show views
-- SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';

-- Show procedures
-- SHOW PROCEDURE STATUS WHERE Db = DATABASE() AND Name LIKE 'sp_%';
