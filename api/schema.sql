-- MySQL Database Schema for Extrema Blink
-- Moodle 3.7 연동을 위한 데이터베이스 스키마

-- 1. 수학 극값 문제 테이블
CREATE TABLE IF NOT EXISTS mdl_math_extrema_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    function_expression VARCHAR(500) NOT NULL COMMENT '함수 수식 (예: x^2 - 4*x + 3)',
    x_min DECIMAL(10, 4) NOT NULL DEFAULT -10 COMMENT 'X 범위 최소값',
    x_max DECIMAL(10, 4) NOT NULL DEFAULT 10 COMMENT 'X 범위 최대값',
    correct_extrema JSON COMMENT '정답 극값 배열 (JSON)',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    active TINYINT(1) DEFAULT 1 COMMENT '활성화 상태',
    course_id INT COMMENT 'Moodle 코스 ID',
    created_by INT COMMENT '생성자 (Moodle user ID)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='극값 문제 테이블';

-- 2. 학생 답안 제출 테이블
CREATE TABLE IF NOT EXISTS mdl_math_extrema_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL COMMENT '문제 ID',
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    student_answers JSON COMMENT '학생 답안 배열 (JSON)',
    score DECIMAL(5, 2) DEFAULT 0 COMMENT '점수 (0-100)',
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent INT COMMENT '소요 시간 (초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES mdl_math_extrema_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 답안 제출 기록';

-- 3. 학습 진행도 테이블
CREATE TABLE IF NOT EXISTS mdl_math_extrema_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    best_score DECIMAL(5, 2) DEFAULT 0 COMMENT '최고 점수',
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',
    first_attempt_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학습 진행도 추적';

-- 4. 샘플 문제 데이터 삽입
INSERT INTO mdl_math_extrema_problems
    (title, description, function_expression, x_min, x_max, correct_extrema, difficulty, course_id)
VALUES
    (
        '이차함수의 극값',
        '다음 이차함수의 극값을 찾으세요: f(x) = x² - 4x + 3',
        'x^2 - 4*x + 3',
        -2, 6,
        '[{"x": 2, "y": -1, "type": "minimum", "label": "극소"}]',
        'easy',
        1
    ),
    (
        '삼차함수의 극값',
        '다음 삼차함수의 모든 극값을 찾으세요: f(x) = x³ - 3x² - 9x + 5',
        'x^3 - 3*x^2 - 9*x + 5',
        -5, 5,
        '[{"x": -1, "y": 10, "type": "maximum", "label": "극대"}, {"x": 3, "y": -22, "type": "minimum", "label": "극소"}]',
        'medium',
        1
    ),
    (
        '삼각함수의 극값',
        '주어진 범위에서 다음 삼각함수의 극값을 찾으세요: f(x) = sin(x) + 0.5cos(2x)',
        'sin(x) + 0.5*cos(2*x)',
        0, 6.28,
        '[{"x": 0.5236, "y": 1.299, "type": "maximum", "label": "극대"}, {"x": 2.618, "y": -1.299, "type": "minimum", "label": "극소"}]',
        'hard',
        2
    ),
    (
        '사차함수의 극값',
        '다음 사차함수의 모든 극값을 찾으세요: f(x) = x⁴ - 4x³ + 4x²',
        'x^4 - 4*x^3 + 4*x^2',
        -2, 4,
        '[{"x": 0, "y": 0, "type": "minimum", "label": "극소"}, {"x": 1, "y": 1, "type": "maximum", "label": "극대"}, {"x": 2, "y": 0, "type": "minimum", "label": "극소"}]',
        'hard',
        2
    ),
    (
        '지수함수와 다항식의 극값',
        '다음 함수의 극값을 찾으세요: f(x) = x²e⁻ˣ (근사: x^2 * exp(-x))',
        'x^2 / exp(x)',
        -1, 5,
        '[{"x": 2, "y": 0.5413, "type": "maximum", "label": "극대"}]',
        'hard',
        3
    );

-- 5. 뷰: 문제별 통계
CREATE OR REPLACE VIEW v_problem_statistics AS
SELECT
    p.id,
    p.title,
    p.difficulty,
    COUNT(DISTINCT s.user_id) AS total_students,
    COUNT(s.id) AS total_submissions,
    AVG(s.score) AS avg_score,
    MAX(s.score) AS max_score,
    MIN(s.score) AS min_score
FROM mdl_math_extrema_problems p
LEFT JOIN mdl_math_extrema_submissions s ON p.id = s.problem_id
WHERE p.active = 1
GROUP BY p.id, p.title, p.difficulty;

-- 6. 뷰: 학생별 진행도
CREATE OR REPLACE VIEW v_student_progress AS
SELECT
    pr.user_id,
    COUNT(pr.problem_id) AS total_problems,
    SUM(CASE WHEN pr.status = 'completed' THEN 1 ELSE 0 END) AS completed_problems,
    AVG(pr.best_score) AS avg_score,
    SUM(pr.total_attempts) AS total_attempts
FROM mdl_math_extrema_progress pr
GROUP BY pr.user_id;

-- 7. 트리거: 제출 시 진행도 자동 업데이트
DELIMITER $$

CREATE TRIGGER update_progress_after_submission
AFTER INSERT ON mdl_math_extrema_submissions
FOR EACH ROW
BEGIN
    -- 진행도 레코드가 없으면 생성
    INSERT INTO mdl_math_extrema_progress (user_id, problem_id, status, first_attempt_at)
    VALUES (NEW.user_id, NEW.problem_id, 'in_progress', NEW.submitted_at)
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        last_attempt_at = NEW.submitted_at,
        best_score = GREATEST(best_score, NEW.score),
        status = CASE
            WHEN NEW.score >= 90 THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE
            WHEN NEW.score >= 90 AND completed_at IS NULL THEN NEW.submitted_at
            ELSE completed_at
        END;
END$$

DELIMITER ;

-- 8. 샘플 사용자 및 제출 데이터 (테스트용)
-- 주의: 실제 Moodle 사용자 ID와 연동 필요
INSERT INTO mdl_math_extrema_submissions
    (problem_id, user_id, student_answers, score, attempt_number, time_spent)
VALUES
    (1, 1001, '[{"x": 2, "y": -1, "type": "minimum"}]', 100, 1, 120),
    (2, 1001, '[{"x": -1, "y": 10, "type": "maximum"}, {"x": 3, "y": -22, "type": "minimum"}]', 100, 1, 240),
    (1, 1002, '[{"x": 2.1, "y": -0.99, "type": "minimum"}]', 95, 1, 90),
    (2, 1002, '[{"x": -1, "y": 10, "type": "maximum"}]', 50, 1, 180);

-- 9. 인덱스 최적화 (성능 향상)
CREATE INDEX idx_score ON mdl_math_extrema_submissions(score);
CREATE INDEX idx_best_score ON mdl_math_extrema_progress(best_score);

-- 10. 관리자용 쿼리 예시

-- 문제별 정답률 조회
-- SELECT
--     p.title,
--     p.difficulty,
--     COUNT(s.id) as total_submissions,
--     SUM(CASE WHEN s.score >= 90 THEN 1 ELSE 0 END) as correct_submissions,
--     ROUND(SUM(CASE WHEN s.score >= 90 THEN 1 ELSE 0 END) / COUNT(s.id) * 100, 2) as correct_rate
-- FROM mdl_math_extrema_problems p
-- LEFT JOIN mdl_math_extrema_submissions s ON p.id = s.problem_id
-- GROUP BY p.id
-- ORDER BY correct_rate DESC;

-- 학생별 평균 점수 및 진행도
-- SELECT
--     user_id,
--     COUNT(DISTINCT problem_id) as attempted_problems,
--     AVG(score) as avg_score,
--     MAX(score) as best_score,
--     SUM(time_spent) as total_time_seconds
-- FROM mdl_math_extrema_submissions
-- GROUP BY user_id
-- ORDER BY avg_score DESC;
