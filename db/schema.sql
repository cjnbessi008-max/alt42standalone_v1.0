-- Boundary Slider 데이터베이스 스키마
-- MySQL 5.7 호환
-- Moodle 3.7 연동용

-- 1. 적분 경계값 문제 테이블
CREATE TABLE IF NOT EXISTS mdl_boundary_problems (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    quiz_id BIGINT(10) UNSIGNED DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_expression VARCHAR(500) NOT NULL COMMENT '적분할 함수 f(x)',

    -- 슬라이더 범위 설정
    min_bound DECIMAL(10,2) NOT NULL DEFAULT -10.00 COMMENT '슬라이더 최소값',
    max_bound DECIMAL(10,2) NOT NULL DEFAULT 10.00 COMMENT '슬라이더 최대값',
    step_size DECIMAL(10,2) NOT NULL DEFAULT 0.10 COMMENT '슬라이더 단계',

    -- 초기값
    initial_lower DECIMAL(10,2) DEFAULT 0.00 COMMENT '하한 초기값',
    initial_upper DECIMAL(10,2) DEFAULT 1.00 COMMENT '상한 초기값',

    -- 정답
    correct_lower DECIMAL(10,2) NOT NULL COMMENT '정답 하한',
    correct_upper DECIMAL(10,2) NOT NULL COMMENT '정답 상한',
    tolerance DECIMAL(10,2) DEFAULT 0.10 COMMENT '허용 오차',

    -- 메타 정보
    difficulty ENUM('쉬움', '중급', '어려움') DEFAULT '중급',
    time_limit INT(11) DEFAULT NULL COMMENT '제한 시간 (초)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT(10) UNSIGNED DEFAULT NULL,

    PRIMARY KEY (id),
    KEY idx_quiz_id (quiz_id),
    KEY idx_difficulty (difficulty),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='적분 경계값 문제 테이블';

-- 2. 학생 답안 테이블
CREATE TABLE IF NOT EXISTS mdl_boundary_answers (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    user_id BIGINT(10) UNSIGNED NOT NULL,

    -- 제출된 답안
    lower_bound DECIMAL(10,2) NOT NULL,
    upper_bound DECIMAL(10,2) NOT NULL,

    -- 채점 결과
    is_correct TINYINT(1) DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수 (0-100)',

    -- 메타 정보
    attempt_number INT(11) DEFAULT 1 COMMENT '시도 횟수',
    time_taken INT(11) DEFAULT NULL COMMENT '소요 시간 (초)',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL,

    PRIMARY KEY (id),
    KEY idx_problem_id (problem_id),
    KEY idx_user_id (user_id),
    KEY idx_submitted_at (submitted_at),
    KEY idx_is_correct (is_correct),

    CONSTRAINT fk_boundary_answers_problem
        FOREIGN KEY (problem_id)
        REFERENCES mdl_boundary_problems(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_boundary_answers_user
        FOREIGN KEY (user_id)
        REFERENCES mdl_user(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 답안 기록 테이블';

-- 3. 슬라이더 상호작용 로그 테이블 (학습 분석용)
CREATE TABLE IF NOT EXISTS mdl_boundary_interactions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    session_id VARCHAR(100) NOT NULL,

    -- 상호작용 데이터
    slider_type ENUM('lower', 'upper') NOT NULL,
    old_value DECIMAL(10,2) NOT NULL,
    new_value DECIMAL(10,2) NOT NULL,

    -- 타임스탬프
    interaction_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    elapsed_time INT(11) DEFAULT NULL COMMENT '문제 시작 후 경과 시간 (ms)',

    PRIMARY KEY (id),
    KEY idx_problem_user (problem_id, user_id),
    KEY idx_session_id (session_id),
    KEY idx_interaction_time (interaction_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='슬라이더 상호작용 로그';

-- 4. 샘플 데이터 삽입
INSERT INTO mdl_boundary_problems
    (title, description, function_expression, min_bound, max_bound, step_size,
     initial_lower, initial_upper, correct_lower, correct_upper, tolerance, difficulty)
VALUES
    ('기본 적분 문제',
     '함수 f(x) = x²의 적분 구간을 설정하세요. 올바른 적분 구간은 [0, 2]입니다.',
     'x²',
     -5.00, 5.00, 0.10,
     0.00, 1.00,
     0.00, 2.00, 0.10,
     '쉬움'),

    ('삼각함수 적분',
     '함수 f(x) = sin(x)의 적분 구간을 설정하세요. 올바른 적분 구간은 [0, π]입니다.',
     'sin(x)',
     -6.28, 6.28, 0.10,
     0.00, 3.14,
     0.00, 3.14, 0.10,
     '중급'),

    ('지수함수 적분',
     '함수 f(x) = e^x의 적분 구간을 설정하세요. 올바른 적분 구간은 [0, 1]입니다.',
     'e^x',
     -3.00, 3.00, 0.05,
     0.00, 1.00,
     0.00, 1.00, 0.05,
     '중급'),

    ('고급 다항식 적분',
     '함수 f(x) = x³ - 2x² + x - 1의 적분 구간을 설정하세요. 올바른 적분 구간은 [-1, 2]입니다.',
     'x³ - 2x² + x - 1',
     -5.00, 5.00, 0.10,
     0.00, 1.00,
     -1.00, 2.00, 0.10,
     '어려움');

-- 5. 뷰 생성: 학생별 통계
CREATE OR REPLACE VIEW mdl_boundary_student_stats AS
SELECT
    a.user_id,
    u.firstname,
    u.lastname,
    u.email,
    COUNT(DISTINCT a.problem_id) as problems_attempted,
    SUM(a.is_correct) as problems_correct,
    ROUND(AVG(a.score), 2) as average_score,
    COUNT(a.id) as total_attempts,
    MAX(a.submitted_at) as last_attempt
FROM mdl_boundary_answers a
LEFT JOIN mdl_user u ON a.user_id = u.id
GROUP BY a.user_id, u.firstname, u.lastname, u.email;

-- 6. 뷰 생성: 문제별 통계
CREATE OR REPLACE VIEW mdl_boundary_problem_stats AS
SELECT
    p.id,
    p.title,
    p.difficulty,
    COUNT(DISTINCT a.user_id) as students_attempted,
    COUNT(a.id) as total_attempts,
    SUM(a.is_correct) as correct_answers,
    ROUND(SUM(a.is_correct) / COUNT(a.id) * 100, 2) as success_rate,
    ROUND(AVG(a.score), 2) as average_score,
    ROUND(AVG(a.time_taken), 2) as average_time
FROM mdl_boundary_problems p
LEFT JOIN mdl_boundary_answers a ON p.id = a.problem_id
GROUP BY p.id, p.title, p.difficulty;

-- 7. 인덱스 최적화
CREATE INDEX idx_answer_score ON mdl_boundary_answers(score);
CREATE INDEX idx_answer_user_problem ON mdl_boundary_answers(user_id, problem_id);
CREATE INDEX idx_interaction_elapsed ON mdl_boundary_interactions(elapsed_time);

-- 8. 트리거: 시도 횟수 자동 증가
DELIMITER //
CREATE TRIGGER before_boundary_answer_insert
BEFORE INSERT ON mdl_boundary_answers
FOR EACH ROW
BEGIN
    DECLARE attempt_count INT;

    SELECT COUNT(*) + 1 INTO attempt_count
    FROM mdl_boundary_answers
    WHERE problem_id = NEW.problem_id
    AND user_id = NEW.user_id;

    SET NEW.attempt_number = attempt_count;
    SET NEW.ip_address = COALESCE(NEW.ip_address, '127.0.0.1');
END//
DELIMITER ;

-- 9. 권한 설정 (선택적)
-- GRANT SELECT, INSERT, UPDATE ON mdl_boundary_problems TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT ON mdl_boundary_answers TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT ON mdl_boundary_interactions TO 'moodle_user'@'localhost';
