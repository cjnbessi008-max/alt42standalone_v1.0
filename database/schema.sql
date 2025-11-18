-- LMS Problem Tracker Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS lms_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_tracker;

-- ============================================================================
-- 학생 테이블
-- ============================================================================
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 문제 테이블 (Moodle에서 가져온 문제 캐싱)
-- ============================================================================
CREATE TABLE problems (
    id VARCHAR(36) PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_quiz_id INT,
    question_type ENUM('multichoice', 'shortanswer', 'numerical', 'essay', 'truefalse', 'calculated', 'other') DEFAULT 'other',
    question_text TEXT NOT NULL,
    question_html TEXT,
    difficulty_level TINYINT CHECK (difficulty_level BETWEEN 1 AND 5),
    points DECIMAL(5,2),
    category VARCHAR(255),
    tags JSON COMMENT 'Array of tag strings',
    correct_answer TEXT,
    answer_options JSON COMMENT 'Array of possible answers for multiple choice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_question (moodle_question_id),
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 문제 시도 기록
-- ============================================================================
CREATE TABLE problem_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    moodle_attempt_id INT,
    student_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    score DECIMAL(5,2),
    time_spent_seconds INT COMMENT 'Time spent on this problem in seconds',
    attempt_number INT DEFAULT 1,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, attempted_at),
    INDEX idx_problem (problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI 추론 구조 분석 결과
-- ============================================================================
CREATE TABLE reasoning_structures (
    id VARCHAR(36) PRIMARY KEY,
    problem_id VARCHAR(36) NOT NULL,
    attempt_id VARCHAR(36),

    -- 개념 분석
    concepts JSON COMMENT 'Array of identified concepts/topics',
    difficulty_assessment ENUM('trivial', 'easy', 'medium', 'hard', 'very_hard'),
    prerequisites JSON COMMENT 'Array of prerequisite concepts',

    -- 추론 단계
    reasoning_steps JSON COMMENT 'Array of step objects with description, concept, formula',

    -- 학생 접근 방식 분석
    student_approach JSON COMMENT 'Analysis of student solution approach',
    common_mistakes JSON COMMENT 'Array of common mistakes for this problem type',

    -- 관련 개념 및 확장
    related_concepts JSON COMMENT 'Array of related concepts for further study',
    next_recommended_topics JSON COMMENT 'Suggested next learning topics',

    -- 메타데이터
    ai_model VARCHAR(100) DEFAULT 'claude-3-5-sonnet-20241022',
    analysis_quality_score DECIMAL(3,2) COMMENT 'Self-assessed quality score 0-1',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES problem_attempts(id) ON DELETE SET NULL,
    INDEX idx_problem_id (problem_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 개념 태그 (정규화된 개념 목록)
-- ============================================================================
CREATE TABLE concept_tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) COMMENT 'e.g., algebra, geometry, calculus',
    description TEXT,
    parent_concept_id VARCHAR(36),
    level TINYINT COMMENT 'Educational level: 1=elementary, 2=middle, 3=high, 4=college',
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_concept_id) REFERENCES concept_tags(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_usage (usage_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 문제-개념 연결 테이블 (Many-to-Many)
-- ============================================================================
CREATE TABLE problem_concepts (
    problem_id VARCHAR(36) NOT NULL,
    concept_id VARCHAR(36) NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.00 COMMENT 'How relevant this concept is (0-1)',
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'Is this a primary concept for the problem',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (problem_id, concept_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES concept_tags(id) ON DELETE CASCADE,
    INDEX idx_concept_id (concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 학습 패턴 분석 (Daily Summary)
-- ============================================================================
CREATE TABLE learning_patterns (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    analysis_date DATE NOT NULL,

    -- 활동 요약
    total_problems_attempted INT DEFAULT 0,
    problems_correct INT DEFAULT 0,
    problems_incorrect INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) COMMENT 'Percentage',
    total_time_spent_minutes INT,

    -- 개념 숙달도
    strong_concepts JSON COMMENT 'Array of concept IDs with high performance',
    weak_concepts JSON COMMENT 'Array of concept IDs needing improvement',
    improving_concepts JSON COMMENT 'Array of concept IDs showing improvement',

    -- AI 인사이트
    learning_insights TEXT COMMENT 'AI-generated insights about learning pattern',
    recommended_focus_areas JSON COMMENT 'Array of recommended topics to focus on',
    study_tips TEXT COMMENT 'Personalized study tips',

    -- 메타데이터
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_date (student_id, analysis_date),
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Moodle 동기화 로그
-- ============================================================================
CREATE TABLE sync_logs (
    id VARCHAR(36) PRIMARY KEY,
    sync_type ENUM('problems', 'attempts', 'students', 'full') NOT NULL,
    status ENUM('started', 'in_progress', 'completed', 'failed') NOT NULL,
    records_synced INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 초기 데이터: 샘플 개념 태그
-- ============================================================================
INSERT INTO concept_tags (id, name, category, description, level) VALUES
('c1', '분수의 기초', 'arithmetic', '분수의 개념과 기본 표현', 1),
('c2', '분수의 덧셈', 'arithmetic', '같은 분모와 다른 분모의 분수 덧셈', 1),
('c3', '분수의 뺄셈', 'arithmetic', '분수의 뺄셈 연산', 1),
('c4', '통분', 'arithmetic', '서로 다른 분모를 같게 만드는 과정', 1),
('c5', '최소공배수', 'arithmetic', '두 수의 최소공배수 구하기', 1),
('c6', '기약분수', 'arithmetic', '분자와 분모의 최대공약수로 나눈 분수', 1),
('c7', '대수 기초', 'algebra', '변수와 식의 기본 개념', 2),
('c8', '일차방정식', 'algebra', '일차방정식의 풀이', 2),
('c9', '기하 기초', 'geometry', '도형의 기본 성질', 2),
('c10', '확률과 통계', 'statistics', '확률의 기본 개념', 2);

-- ============================================================================
-- 뷰: 오늘의 문제 요약
-- ============================================================================
CREATE OR REPLACE VIEW today_problems_summary AS
SELECT
    s.id as student_id,
    s.full_name,
    DATE(pa.attempted_at) as attempt_date,
    COUNT(DISTINCT pa.problem_id) as total_problems,
    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
    SUM(CASE WHEN pa.is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count,
    ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100 ELSE 0 END), 2) as accuracy_percentage,
    SUM(pa.time_spent_seconds) as total_time_seconds
FROM students s
JOIN problem_attempts pa ON s.id = pa.student_id
WHERE DATE(pa.attempted_at) = CURDATE()
GROUP BY s.id, s.full_name, DATE(pa.attempted_at);

-- ============================================================================
-- 뷰: 개념별 성취도
-- ============================================================================
CREATE OR REPLACE VIEW concept_performance AS
SELECT
    s.id as student_id,
    s.full_name,
    ct.id as concept_id,
    ct.name as concept_name,
    ct.category,
    COUNT(DISTINCT pa.problem_id) as problems_attempted,
    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as problems_correct,
    ROUND(AVG(CASE WHEN pa.is_correct = 1 THEN 100 ELSE 0 END), 2) as mastery_percentage
FROM students s
JOIN problem_attempts pa ON s.id = pa.student_id
JOIN problems p ON pa.problem_id = p.id
JOIN problem_concepts pc ON p.id = pc.problem_id
JOIN concept_tags ct ON pc.concept_id = ct.id
GROUP BY s.id, s.full_name, ct.id, ct.name, ct.category
HAVING problems_attempted >= 3;

-- ============================================================================
-- 저장 프로시저: 오늘의 학습 패턴 생성
-- ============================================================================
DELIMITER //

CREATE PROCEDURE generate_daily_learning_pattern(IN p_student_id VARCHAR(36))
BEGIN
    DECLARE v_total_problems INT;
    DECLARE v_correct INT;
    DECLARE v_incorrect INT;
    DECLARE v_accuracy DECIMAL(5,2);
    DECLARE v_total_time INT;

    -- 오늘의 통계 계산
    SELECT
        COUNT(*),
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END),
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END), 2),
        SUM(COALESCE(time_spent_seconds, 0))
    INTO
        v_total_problems,
        v_correct,
        v_incorrect,
        v_accuracy,
        v_total_time
    FROM problem_attempts
    WHERE student_id = p_student_id
        AND DATE(attempted_at) = CURDATE();

    -- 학습 패턴 레코드 생성 또는 업데이트
    INSERT INTO learning_patterns (
        id,
        student_id,
        analysis_date,
        total_problems_attempted,
        problems_correct,
        problems_incorrect,
        accuracy_rate,
        total_time_spent_minutes
    ) VALUES (
        UUID(),
        p_student_id,
        CURDATE(),
        v_total_problems,
        v_correct,
        v_incorrect,
        v_accuracy,
        ROUND(v_total_time / 60)
    ) ON DUPLICATE KEY UPDATE
        total_problems_attempted = v_total_problems,
        problems_correct = v_correct,
        problems_incorrect = v_incorrect,
        accuracy_rate = v_accuracy,
        total_time_spent_minutes = ROUND(v_total_time / 60),
        generated_at = CURRENT_TIMESTAMP;

END //

DELIMITER ;

-- ============================================================================
-- 인덱스 최적화를 위한 추가 인덱스
-- ============================================================================

-- 복합 인덱스: 학생별 오늘 문제 조회 최적화
ALTER TABLE problem_attempts
ADD INDEX idx_student_today (student_id, attempted_at, is_correct);

-- 전문 검색 인덱스: 문제 텍스트 검색
ALTER TABLE problems
ADD FULLTEXT INDEX ft_question_text (question_text);

-- ============================================================================
-- 권한 설정 (선택사항)
-- ============================================================================
-- CREATE USER IF NOT EXISTS 'lms_app'@'%' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lms_tracker.* TO 'lms_app'@'%';
-- FLUSH PRIVILEGES;
