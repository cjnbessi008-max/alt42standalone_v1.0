-- ========================================
-- Moodle 3.7 Integration Schema
-- MySQL 5.7 Compatible
-- Purpose: Track student problem attempts and retry speed improvements
-- ========================================

-- Moodle 연동 설정 테이블
CREATE TABLE IF NOT EXISTS moodle_integration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_url VARCHAR(255) NOT NULL COMMENT 'Moodle LMS URL',
    lti_consumer_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'LTI Consumer Key',
    lti_shared_secret VARCHAR(255) NOT NULL COMMENT 'LTI Shared Secret (encrypted)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '연동 활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_consumer_key (lti_consumer_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle LTI 연동 설정';

-- Moodle 사용자 매핑 테이블
CREATE TABLE IF NOT EXISTS moodle_user_mapping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id VARCHAR(100) NOT NULL COMMENT 'Moodle User ID',
    local_student_id VARCHAR(36) NOT NULL COMMENT '로컬 Student UUID',
    moodle_username VARCHAR(100) COMMENT 'Moodle Username',
    moodle_email VARCHAR(255) COMMENT 'Moodle Email',
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_user_id),
    UNIQUE KEY unique_local_student (local_student_id),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_local_student (local_student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle과 로컬 사용자 매핑';

-- 모듈 정보 테이블
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    name VARCHAR(255) NOT NULL COMMENT '모듈명',
    description TEXT COMMENT '모듈 설명',
    subject ENUM('mathematics', 'science', 'language') DEFAULT 'mathematics',
    grade_level VARCHAR(20) COMMENT '학년 수준',
    teacher_id VARCHAR(36) COMMENT '담당 교사 ID',
    status ENUM('generating', 'active', 'archived') DEFAULT 'active',
    world_model JSON COMMENT 'AI 생성 도메인 모델',
    generated_schema JSON COMMENT '생성된 DB 스키마',
    generated_ui JSON COMMENT '생성된 UI 정의',
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status),
    INDEX idx_subject_grade (subject, grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='교육 모듈';

-- 문제 테이블 (분수 예시)
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    module_id VARCHAR(36) NOT NULL COMMENT '모듈 ID',
    problem_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (visualization, addition, subtraction 등)',
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5) COMMENT '난이도 (1-5)',
    problem_data JSON NOT NULL COMMENT '문제 데이터 (numerator, denominator 등)',
    correct_answer JSON NOT NULL COMMENT '정답 데이터',
    visual_representation VARCHAR(50) DEFAULT 'default' COMMENT '시각화 유형',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_module_type (module_id, problem_type),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제 정보';

-- 학생 시도 기록 테이블 (재시도 속도 추적 강화)
CREATE TABLE IF NOT EXISTS student_attempts (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    student_id VARCHAR(36) NOT NULL COMMENT '학생 ID',
    problem_id VARCHAR(36) NOT NULL COMMENT '문제 ID',
    attempt_number INT NOT NULL DEFAULT 1 COMMENT '시도 횟수 (1, 2, 3...)',
    student_answer JSON NOT NULL COMMENT '학생 답안',
    is_correct BOOLEAN NOT NULL COMMENT '정답 여부',
    time_spent_seconds INT NOT NULL COMMENT '소요 시간 (초)',
    started_at TIMESTAMP NOT NULL COMMENT '시작 시간',
    completed_at TIMESTAMP NOT NULL COMMENT '완료 시간',
    interaction_data JSON COMMENT '상호작용 데이터 (클릭, 이동 등)',
    moodle_activity_id VARCHAR(100) COMMENT 'Moodle Activity ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_student_attempts (student_id, problem_id, attempt_number),
    INDEX idx_completed (completed_at),
    INDEX idx_moodle_activity (moodle_activity_id),
    UNIQUE KEY unique_attempt (student_id, problem_id, attempt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 문제 시도 기록';

-- 재시도 속도 분석 테이블
CREATE TABLE IF NOT EXISTS retry_speed_analysis (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    student_id VARCHAR(36) NOT NULL COMMENT '학생 ID',
    problem_id VARCHAR(36) NOT NULL COMMENT '문제 ID',
    first_attempt_id VARCHAR(36) NOT NULL COMMENT '첫 시도 ID',
    latest_attempt_id VARCHAR(36) NOT NULL COMMENT '최근 시도 ID',
    first_attempt_time INT NOT NULL COMMENT '첫 시도 소요 시간 (초)',
    latest_attempt_time INT NOT NULL COMMENT '최근 시도 소요 시간 (초)',
    time_improvement_seconds INT COMMENT '시간 개선 (초, 음수면 느려짐)',
    improvement_percentage DECIMAL(5,2) COMMENT '개선율 (%, 음수면 느려짐)',
    total_attempts INT NOT NULL COMMENT '총 시도 횟수',
    correct_attempts INT NOT NULL COMMENT '정답 횟수',
    is_improving BOOLEAN COMMENT '개선 중 여부',
    last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id, problem_id) REFERENCES student_attempts(student_id, problem_id),
    FOREIGN KEY (first_attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (latest_attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE,
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_improvement (is_improving),
    INDEX idx_analyzed (last_analyzed_at),
    UNIQUE KEY unique_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='재시도 속도 개선 분석';

-- 학생 진행상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
    student_id VARCHAR(36) NOT NULL COMMENT '학생 ID',
    module_id VARCHAR(36) NOT NULL COMMENT '모듈 ID',
    problems_attempted INT DEFAULT 0 COMMENT '시도한 문제 수',
    problems_correct INT DEFAULT 0 COMMENT '정답 문제 수',
    problems_retried INT DEFAULT 0 COMMENT '재시도한 문제 수',
    average_time_seconds DECIMAL(10,2) COMMENT '평균 소요 시간',
    average_improvement_percentage DECIMAL(5,2) COMMENT '평균 개선율',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '진행률',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT '완료 시간',
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_student_module (student_id, module_id),
    INDEX idx_progress (progress_percentage),
    INDEX idx_activity (last_activity_at),
    UNIQUE KEY unique_student_module (student_id, module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 모듈 진행상황';

-- Moodle 성적 동기화 테이블
CREATE TABLE IF NOT EXISTS moodle_grade_sync (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(36) NOT NULL COMMENT '학생 ID',
    module_id VARCHAR(36) NOT NULL COMMENT '모듈 ID',
    moodle_activity_id VARCHAR(100) NOT NULL COMMENT 'Moodle Activity ID',
    grade_value DECIMAL(5,2) NOT NULL COMMENT '성적 (0-100)',
    max_grade DECIMAL(5,2) DEFAULT 100.00 COMMENT '최대 점수',
    sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    sync_attempts INT DEFAULT 0 COMMENT '동기화 시도 횟수',
    last_sync_at TIMESTAMP NULL COMMENT '마지막 동기화 시간',
    error_message TEXT COMMENT '에러 메시지',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_student_module (student_id, module_id),
    INDEX idx_sync_status (sync_status),
    INDEX idx_moodle_activity (moodle_activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 성적 동기화';

-- ========================================
-- 뷰(View): 학생별 재시도 속도 개선 현황
-- ========================================
CREATE OR REPLACE VIEW v_student_retry_improvement AS
SELECT
    rsa.student_id,
    rsa.problem_id,
    p.module_id,
    p.problem_type,
    p.difficulty_level,
    rsa.first_attempt_time,
    rsa.latest_attempt_time,
    rsa.time_improvement_seconds,
    rsa.improvement_percentage,
    rsa.total_attempts,
    rsa.correct_attempts,
    rsa.is_improving,
    CASE
        WHEN rsa.improvement_percentage >= 30 THEN 'Excellent'
        WHEN rsa.improvement_percentage >= 15 THEN 'Good'
        WHEN rsa.improvement_percentage >= 5 THEN 'Fair'
        WHEN rsa.improvement_percentage < 0 THEN 'Slower'
        ELSE 'No Change'
    END AS improvement_level,
    rsa.last_analyzed_at
FROM retry_speed_analysis rsa
JOIN problems p ON rsa.problem_id = p.id
WHERE rsa.total_attempts > 1;

-- ========================================
-- 뷰(View): 모듈별 전체 통계
-- ========================================
CREATE OR REPLACE VIEW v_module_statistics AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    m.subject,
    m.grade_level,
    COUNT(DISTINCT sp.student_id) AS total_students,
    COUNT(DISTINCT p.id) AS total_problems,
    AVG(sp.progress_percentage) AS avg_progress,
    AVG(sp.average_time_seconds) AS avg_time_per_problem,
    AVG(sp.average_improvement_percentage) AS avg_improvement,
    SUM(sp.problems_attempted) AS total_attempts,
    SUM(sp.problems_correct) AS total_correct,
    SUM(sp.problems_retried) AS total_retries
FROM modules m
LEFT JOIN student_progress sp ON m.id = sp.module_id
LEFT JOIN problems p ON m.id = p.module_id
GROUP BY m.id, m.name, m.subject, m.grade_level;

-- ========================================
-- 저장 프로시저: 재시도 속도 분석 업데이트
-- ========================================
DELIMITER //

CREATE PROCEDURE sp_update_retry_speed_analysis(
    IN p_student_id VARCHAR(36),
    IN p_problem_id VARCHAR(36)
)
BEGIN
    DECLARE v_first_attempt_id VARCHAR(36);
    DECLARE v_latest_attempt_id VARCHAR(36);
    DECLARE v_first_time INT;
    DECLARE v_latest_time INT;
    DECLARE v_time_diff INT;
    DECLARE v_improvement_pct DECIMAL(5,2);
    DECLARE v_total_attempts INT;
    DECLARE v_correct_attempts INT;
    DECLARE v_is_improving BOOLEAN;

    -- 첫 시도와 최근 시도 정보 가져오기
    SELECT
        id, time_spent_seconds
    INTO
        v_first_attempt_id, v_first_time
    FROM student_attempts
    WHERE student_id = p_student_id
        AND problem_id = p_problem_id
        AND attempt_number = 1
    LIMIT 1;

    SELECT
        id, time_spent_seconds, attempt_number
    INTO
        v_latest_attempt_id, v_latest_time, v_total_attempts
    FROM student_attempts
    WHERE student_id = p_student_id
        AND problem_id = p_problem_id
    ORDER BY attempt_number DESC
    LIMIT 1;

    -- 정답 횟수 계산
    SELECT COUNT(*)
    INTO v_correct_attempts
    FROM student_attempts
    WHERE student_id = p_student_id
        AND problem_id = p_problem_id
        AND is_correct = TRUE;

    -- 2회 이상 시도한 경우에만 분석
    IF v_total_attempts > 1 THEN
        SET v_time_diff = v_first_time - v_latest_time;
        SET v_improvement_pct = (v_time_diff / v_first_time) * 100;
        SET v_is_improving = IF(v_improvement_pct > 0, TRUE, FALSE);

        -- 분석 결과 저장 (UPSERT)
        INSERT INTO retry_speed_analysis (
            id,
            student_id,
            problem_id,
            first_attempt_id,
            latest_attempt_id,
            first_attempt_time,
            latest_attempt_time,
            time_improvement_seconds,
            improvement_percentage,
            total_attempts,
            correct_attempts,
            is_improving
        ) VALUES (
            UUID(),
            p_student_id,
            p_problem_id,
            v_first_attempt_id,
            v_latest_attempt_id,
            v_first_time,
            v_latest_time,
            v_time_diff,
            v_improvement_pct,
            v_total_attempts,
            v_correct_attempts,
            v_is_improving
        ) ON DUPLICATE KEY UPDATE
            latest_attempt_id = v_latest_attempt_id,
            latest_attempt_time = v_latest_time,
            time_improvement_seconds = v_time_diff,
            improvement_percentage = v_improvement_pct,
            total_attempts = v_total_attempts,
            correct_attempts = v_correct_attempts,
            is_improving = v_is_improving,
            last_analyzed_at = CURRENT_TIMESTAMP;
    END IF;
END//

DELIMITER ;

-- ========================================
-- 트리거: 새로운 시도 기록 시 자동 분석
-- ========================================
DELIMITER //

CREATE TRIGGER trg_after_attempt_insert
AFTER INSERT ON student_attempts
FOR EACH ROW
BEGIN
    -- 재시도 속도 분석 업데이트
    CALL sp_update_retry_speed_analysis(NEW.student_id, NEW.problem_id);

    -- 학생 진행상황 업데이트
    INSERT INTO student_progress (
        id, student_id, module_id, problems_attempted, problems_correct, started_at
    )
    SELECT
        UUID(),
        NEW.student_id,
        p.module_id,
        1,
        IF(NEW.is_correct, 1, 0),
        NOW()
    FROM problems p
    WHERE p.id = NEW.problem_id
    ON DUPLICATE KEY UPDATE
        problems_attempted = problems_attempted + 1,
        problems_correct = problems_correct + IF(NEW.is_correct, 1, 0),
        problems_retried = IF(NEW.attempt_number > 1, problems_retried + 1, problems_retried),
        last_activity_at = NOW();
END//

DELIMITER ;

-- ========================================
-- 샘플 데이터 삽입 (테스트용)
-- ========================================

-- Moodle 연동 설정
INSERT INTO moodle_integration (moodle_url, lti_consumer_key, lti_shared_secret, is_active)
VALUES ('https://moodle.kaist.ac.kr', 'kaist_lti_key_2025', 'encrypted_secret_here', TRUE);

-- 샘플 모듈
INSERT INTO modules (id, name, description, subject, grade_level, status, version)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '분수 학습 모듈', '3학년 분수 덧셈과 뺄셈', 'mathematics', '3학년', 'active', 1),
    ('550e8400-e29b-41d4-a716-446655440001', '곱셈 구구단', '2학년 곱셈 구구단 연습', 'mathematics', '2학년', 'active', 1);

-- 샘플 문제 (분수)
INSERT INTO problems (id, module_id, problem_type, difficulty_level, problem_data, correct_answer)
VALUES
    ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'addition', 2,
     '{"numerator1": 1, "denominator1": 4, "numerator2": 1, "denominator2": 4}',
     '{"numerator": 2, "denominator": 4, "simplified": {"numerator": 1, "denominator": 2}}'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'subtraction', 3,
     '{"numerator1": 3, "denominator1": 4, "numerator2": 1, "denominator2": 4}',
     '{"numerator": 2, "denominator": 4, "simplified": {"numerator": 1, "denominator": 2}}');

-- ========================================
-- 인덱스 성능 최적화 확인 쿼리
-- ========================================

-- 학생별 재시도 개선 현황 조회 (빠른 쿼리)
-- SELECT * FROM v_student_retry_improvement WHERE student_id = 'student_uuid';

-- 특정 문제의 전체 시도 기록
-- SELECT * FROM student_attempts WHERE problem_id = 'problem_uuid' ORDER BY attempt_number;

-- 모듈별 통계
-- SELECT * FROM v_module_statistics WHERE module_id = 'module_uuid';
