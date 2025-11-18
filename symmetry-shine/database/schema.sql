-- Symmetry Shine Database Schema
-- MySQL 5.7 compatible
-- Moodle 3.7 연동용

CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodle;

-- 대칭성 문제 테이블
CREATE TABLE IF NOT EXISTS symmetry_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT NOT NULL COMMENT '문제 설명',
    function_expression VARCHAR(500) NOT NULL COMMENT '함수 표현식 (JavaScript 평가 가능)',
    symmetry_axis DECIMAL(10, 2) NOT NULL COMMENT '대칭축 값',
    problem_type ENUM('quadratic', 'cubic', 'absolute', 'trigonometric', 'custom') DEFAULT 'quadratic' COMMENT '문제 유형',
    difficulty_level TINYINT(1) DEFAULT 1 COMMENT '난이도 (1-5)',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 상태',
    course_id INT NULL COMMENT 'Moodle 코스 ID',
    created_by INT NULL COMMENT '생성자 (Moodle user ID)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (problem_type),
    INDEX idx_course (course_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='함수 대칭성 문제';

-- 사용자 답안 테이블
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'Moodle user ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    course_id INT NULL COMMENT 'Moodle 코스 ID',
    answer DECIMAL(10, 2) NOT NULL COMMENT '제출한 답안',
    is_correct TINYINT(1) NOT NULL COMMENT '정답 여부',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL COMMENT '제출 IP',
    user_agent TEXT NULL COMMENT '사용자 브라우저 정보',
    FOREIGN KEY (problem_id) REFERENCES symmetry_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_course (course_id),
    INDEX idx_correct (is_correct),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 답안 기록';

-- 사용자 문제 시도 테이블
CREATE TABLE IF NOT EXISTS user_problem_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'Moodle user ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시간',
    completed_at TIMESTAMP NULL COMMENT '완료 시간',
    status ENUM('started', 'completed', 'failed', 'abandoned') DEFAULT 'started',
    is_correct TINYINT(1) NULL COMMENT '최종 정답 여부',
    time_spent INT NULL COMMENT '소요 시간 (초)',
    FOREIGN KEY (problem_id) REFERENCES symmetry_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 문제 시도 기록';

-- 문제 통계 테이블
CREATE TABLE IF NOT EXISTS problem_statistics (
    problem_id INT PRIMARY KEY,
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',
    correct_attempts INT DEFAULT 0 COMMENT '정답 횟수',
    avg_time_spent DECIMAL(10, 2) NULL COMMENT '평균 소요 시간 (초)',
    last_attempted_at TIMESTAMP NULL COMMENT '마지막 시도 시간',
    FOREIGN KEY (problem_id) REFERENCES symmetry_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문제별 통계';

-- 샘플 데이터 삽입
INSERT INTO symmetry_problems (title, description, function_expression, symmetry_axis, problem_type, difficulty_level) VALUES
('이차함수의 대칭성 1', 'f(x) = x² - 4x + 3의 대칭축을 찾으세요', 'x*x - 4*x + 3', 2.00, 'quadratic', 1),
('이차함수의 대칭성 2', 'f(x) = 2x² + 8x + 5의 대칭축을 찾으세요', '2*x*x + 8*x + 5', -2.00, 'quadratic', 2),
('이차함수의 대칭성 3', 'f(x) = -x² + 6x - 8의 대칭축을 찾으세요', '-x*x + 6*x - 8', 3.00, 'quadratic', 2),
('절댓값 함수의 대칭성', 'f(x) = |x - 1|의 대칭축을 찾으세요', 'Math.abs(x - 1)', 1.00, 'absolute', 3),
('이차함수의 대칭성 4', 'f(x) = 3x² - 12x + 7의 대칭축을 찾으세요', '3*x*x - 12*x + 7', 2.00, 'quadratic', 3),
('절댓값 함수의 대칭성 2', 'f(x) = |2x + 4|의 대칭축을 찾으세요', 'Math.abs(2*x + 4)', -2.00, 'absolute', 4),
('이차함수의 대칭성 5', 'f(x) = -2x² + 4x + 1의 대칭축을 찾으세요', '-2*x*x + 4*x + 1', 1.00, 'quadratic', 4),
('복잡한 이차함수', 'f(x) = 0.5x² + 3x - 2의 대칭축을 찾으세요', '0.5*x*x + 3*x - 2', -3.00, 'quadratic', 5);

-- View: 문제별 정답률
CREATE OR REPLACE VIEW problem_accuracy AS
SELECT
    p.id,
    p.title,
    p.problem_type,
    p.difficulty_level,
    COALESCE(s.total_attempts, 0) AS total_attempts,
    COALESCE(s.correct_attempts, 0) AS correct_attempts,
    CASE
        WHEN s.total_attempts > 0 THEN ROUND((s.correct_attempts / s.total_attempts) * 100, 2)
        ELSE 0
    END AS accuracy_percentage
FROM symmetry_problems p
LEFT JOIN problem_statistics s ON p.id = s.problem_id
WHERE p.is_active = 1;

-- View: 사용자별 성적
CREATE OR REPLACE VIEW user_performance AS
SELECT
    user_id,
    COUNT(DISTINCT problem_id) AS problems_attempted,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
    COUNT(*) AS total_submissions,
    ROUND((SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS accuracy_percentage,
    MIN(submitted_at) AS first_submission,
    MAX(submitted_at) AS last_submission
FROM user_answers
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- 트리거: 답안 제출 시 통계 업데이트
DELIMITER $$

CREATE TRIGGER after_answer_insert
AFTER INSERT ON user_answers
FOR EACH ROW
BEGIN
    -- 문제 통계 업데이트
    INSERT INTO problem_statistics (problem_id, total_attempts, correct_attempts, last_attempted_at)
    VALUES (NEW.problem_id, 1, IF(NEW.is_correct = 1, 1, 0), NEW.submitted_at)
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + IF(NEW.is_correct = 1, 1, 0),
        last_attempted_at = NEW.submitted_at;
END$$

DELIMITER ;

-- 인덱스 최적화
OPTIMIZE TABLE symmetry_problems;
OPTIMIZE TABLE user_answers;
OPTIMIZE TABLE user_problem_attempts;
OPTIMIZE TABLE problem_statistics;

-- 권한 설정 (예시)
-- CREATE USER IF NOT EXISTS 'moodle_user'@'localhost' IDENTIFIED BY 'moodle_password';
-- GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
