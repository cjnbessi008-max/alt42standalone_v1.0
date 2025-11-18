-- Operation Trail 데이터베이스 스키마
-- MySQL 5.7 호환
-- Moodle 3.7 연동

-- 데이터베이스 생성 (필요한 경우)
-- CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE moodle;

-- ============================================
-- 문제 테이블 (operation_trail_problems)
-- ============================================
CREATE TABLE IF NOT EXISTS operation_trail_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'arithmetic',
    question TEXT NOT NULL,
    expression VARCHAR(255) NOT NULL,
    steps JSON NOT NULL,
    answer DECIMAL(10, 4) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 답안 제출 테이블 (operation_trail_submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS operation_trail_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    user_answer DECIMAL(10, 4) NOT NULL,
    correct_answer DECIMAL(10, 4) NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    attempt_time INT DEFAULT NULL COMMENT '답안 작성 시간 (초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES operation_trail_problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 학습 진도 테이블 (operation_trail_progress)
-- ============================================
CREATE TABLE IF NOT EXISTS operation_trail_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    viewed_trail TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Operation Trail을 봤는지',
    attempts INT NOT NULL DEFAULT 0,
    best_time INT DEFAULT NULL COMMENT '최단 시간 (초)',
    last_attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    FOREIGN KEY (problem_id) REFERENCES operation_trail_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- 문제 1: 간단한 덧셈과 뺄셈
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: 45 + 23 - 8', '45 + 23 - 8',
'[{"operation":"덧셈","expression":"45 + 23","result":68},{"operation":"뺄셈","expression":"68 - 8","result":60}]',
60, 'easy');

-- 문제 2: 곱셈과 나눗셈 혼합
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: 12 × 5 + 18 ÷ 3', '12 × 5 + 18 ÷ 3',
'[{"operation":"곱셈","expression":"12 × 5","result":60},{"operation":"나눗셈","expression":"18 ÷ 3","result":6},{"operation":"덧셈","expression":"60 + 6","result":66}]',
66, 'medium');

-- 문제 3: 괄호가 있는 계산
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: (15 + 9) × 2 - 10', '(15 + 9) × 2 - 10',
'[{"operation":"괄호 안 덧셈","expression":"15 + 9","result":24},{"operation":"곱셈","expression":"24 × 2","result":48},{"operation":"뺄셈","expression":"48 - 10","result":38}]',
38, 'medium');

-- 문제 4: 복잡한 연산
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: 100 - 25 × 2 + 10 ÷ 2', '100 - 25 × 2 + 10 ÷ 2',
'[{"operation":"곱셈","expression":"25 × 2","result":50},{"operation":"나눗셈","expression":"10 ÷ 2","result":5},{"operation":"뺄셈","expression":"100 - 50","result":50},{"operation":"덧셈","expression":"50 + 5","result":55}]',
55, 'hard');

-- 문제 5: 다단계 계산
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: (20 + 4) ÷ 6 + 15 × 3', '(20 + 4) ÷ 6 + 15 × 3',
'[{"operation":"괄호 안 덧셈","expression":"20 + 4","result":24},{"operation":"나눗셈","expression":"24 ÷ 6","result":4},{"operation":"곱셈","expression":"15 × 3","result":45},{"operation":"덧셈","expression":"4 + 45","result":49}]',
49, 'hard');

-- 문제 6: 분수 계산 (소수점)
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: 10 ÷ 4 + 2.5', '10 ÷ 4 + 2.5',
'[{"operation":"나눗셈","expression":"10 ÷ 4","result":2.5},{"operation":"덧셈","expression":"2.5 + 2.5","result":5}]',
5, 'medium');

-- 문제 7: 연속 연산
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: 8 + 7 - 3 + 12 - 5', '8 + 7 - 3 + 12 - 5',
'[{"operation":"덧셈","expression":"8 + 7","result":15},{"operation":"뺄셈","expression":"15 - 3","result":12},{"operation":"덧셈","expression":"12 + 12","result":24},{"operation":"뺄셈","expression":"24 - 5","result":19}]',
19, 'easy');

-- 문제 8: 복잡한 괄호
INSERT INTO operation_trail_problems (type, question, expression, steps, answer, difficulty) VALUES
('arithmetic', '다음 식을 계산하세요: ((8 + 2) × 3 - 6) ÷ 4', '((8 + 2) × 3 - 6) ÷ 4',
'[{"operation":"괄호 안 덧셈","expression":"8 + 2","result":10},{"operation":"곱셈","expression":"10 × 3","result":30},{"operation":"뺄셈","expression":"30 - 6","result":24},{"operation":"나눗셈","expression":"24 ÷ 4","result":6}]',
6, 'hard');

-- ============================================
-- 뷰 생성 (통계용)
-- ============================================

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW operation_trail_problem_stats AS
SELECT
    p.id,
    p.question,
    p.expression,
    p.difficulty,
    COUNT(s.id) AS total_attempts,
    SUM(s.is_correct) AS correct_attempts,
    ROUND(SUM(s.is_correct) / COUNT(s.id) * 100, 2) AS success_rate,
    AVG(s.attempt_time) AS avg_attempt_time
FROM operation_trail_problems p
LEFT JOIN operation_trail_submissions s ON p.id = s.problem_id
GROUP BY p.id;

-- 사용자별 통계 뷰
CREATE OR REPLACE VIEW operation_trail_user_stats AS
SELECT
    user_id,
    COUNT(DISTINCT problem_id) AS problems_attempted,
    SUM(is_correct) AS correct_answers,
    COUNT(id) AS total_submissions,
    ROUND(SUM(is_correct) / COUNT(id) * 100, 2) AS success_rate,
    AVG(attempt_time) AS avg_time_per_problem
FROM operation_trail_submissions
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- ============================================
-- 인덱스 최적화 (추가)
-- ============================================

-- 성능 향상을 위한 복합 인덱스
CREATE INDEX idx_submission_user_correct ON operation_trail_submissions(user_id, is_correct);
CREATE INDEX idx_progress_user_completed ON operation_trail_progress(user_id, completed);

-- ============================================
-- 트리거 (자동화)
-- ============================================

-- 답안 제출 시 진도 자동 업데이트
DELIMITER //

CREATE TRIGGER after_submission_insert
AFTER INSERT ON operation_trail_submissions
FOR EACH ROW
BEGIN
    -- 진도 테이블에 레코드가 있는지 확인 후 업데이트 또는 생성
    INSERT INTO operation_trail_progress (user_id, problem_id, attempts, completed)
    VALUES (NEW.user_id, NEW.problem_id, 1, NEW.is_correct)
    ON DUPLICATE KEY UPDATE
        attempts = attempts + 1,
        completed = IF(NEW.is_correct = 1, 1, completed),
        last_attempted_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- ============================================
-- 프로시저 (유틸리티)
-- ============================================

-- 사용자 통계 조회 프로시저
DELIMITER //

CREATE PROCEDURE get_user_statistics(IN p_user_id INT)
BEGIN
    SELECT
        user_id,
        problems_attempted,
        correct_answers,
        total_submissions,
        success_rate,
        avg_time_per_problem
    FROM operation_trail_user_stats
    WHERE user_id = p_user_id;
END//

DELIMITER ;

-- 랜덤 문제 가져오기 프로시저
DELIMITER //

CREATE PROCEDURE get_random_problem(IN p_difficulty VARCHAR(20))
BEGIN
    IF p_difficulty IS NULL OR p_difficulty = '' THEN
        SELECT * FROM operation_trail_problems
        ORDER BY RAND()
        LIMIT 1;
    ELSE
        SELECT * FROM operation_trail_problems
        WHERE difficulty = p_difficulty
        ORDER BY RAND()
        LIMIT 1;
    END IF;
END//

DELIMITER ;

-- ============================================
-- 완료 메시지
-- ============================================

SELECT 'Database schema created successfully!' AS message;
SELECT COUNT(*) AS sample_problems FROM operation_trail_problems;
