-- Wavy Integral Database Schema
-- MySQL 5.7+
-- Moodle 3.7 연동용

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS moodle_wavy
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE moodle_wavy;

-- 문제 테이블
CREATE TABLE IF NOT EXISTS wavy_problems (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSON,
    correct_answer JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    course_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 테이블
CREATE TABLE IF NOT EXISTS wavy_students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    course_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 답안 제출 테이블
CREATE TABLE IF NOT EXISTS wavy_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    answer JSON NOT NULL,
    score DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES wavy_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES wavy_students(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_student (student_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 진행 상황 테이블
CREATE TABLE IF NOT EXISTS wavy_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    problem_id VARCHAR(50) NOT NULL,
    attempts INT DEFAULT 0,
    best_score DECIMAL(5,2),
    completed BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES wavy_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES wavy_students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_problem (student_id, problem_id),
    INDEX idx_student (student_id),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO wavy_problems (id, title, description, parameters, correct_answer, difficulty) VALUES
('PROB_001', '기본 적분 계산', 'f(x) = sin(x) + 2 함수의 구간 [0, 2]에서의 정적분을 구하세요.',
 JSON_OBJECT('lowerBound', 0, 'upperBound', 2, 'functionType', 'sine'),
 JSON_OBJECT('value', 3.416), 'easy'),

('PROB_002', '확장 구간 적분', 'f(x) = sin(x) + 2 함수의 구간 [0, 4]에서의 정적분을 구하세요.',
 JSON_OBJECT('lowerBound', 0, 'upperBound', 4, 'functionType', 'sine'),
 JSON_OBJECT('value', 7.347), 'medium'),

('PROB_003', '넓은 구간 적분', 'f(x) = sin(x) + 2 함수의 구간 [-1, 5]에서의 정적분을 구하세요.',
 JSON_OBJECT('lowerBound', -1, 'upperBound', 5, 'functionType', 'sine'),
 JSON_OBJECT('value', 11.717), 'hard');

-- 샘플 학생 데이터
INSERT INTO wavy_students (id, name, email, course_id) VALUES
('STU_001', '김철수', 'chulsoo@example.com', 'MATH_101'),
('STU_002', '이영희', 'younghee@example.com', 'MATH_101'),
('STU_003', '박민수', 'minsoo@example.com', 'MATH_102');

-- 뷰: 학생별 성적 통계
CREATE OR REPLACE VIEW wavy_student_stats AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.course_id,
    COUNT(DISTINCT sub.problem_id) AS problems_attempted,
    COUNT(DISTINCT CASE WHEN sub.score >= 60 THEN sub.problem_id END) AS problems_passed,
    AVG(sub.score) AS average_score,
    MAX(sub.score) AS best_score,
    COUNT(sub.id) AS total_submissions,
    MAX(sub.submitted_at) AS last_submission
FROM
    wavy_students s
    LEFT JOIN wavy_submissions sub ON s.id = sub.student_id
GROUP BY
    s.id, s.name, s.course_id;

-- 뷰: 문제별 통계
CREATE OR REPLACE VIEW wavy_problem_stats AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty,
    COUNT(DISTINCT sub.student_id) AS students_attempted,
    COUNT(sub.id) AS total_submissions,
    AVG(sub.score) AS average_score,
    COUNT(CASE WHEN sub.score >= 60 THEN 1 END) AS pass_count,
    COUNT(CASE WHEN sub.score < 60 THEN 1 END) AS fail_count,
    (COUNT(CASE WHEN sub.score >= 60 THEN 1 END) / COUNT(sub.id) * 100) AS pass_rate
FROM
    wavy_problems p
    LEFT JOIN wavy_submissions sub ON p.id = sub.problem_id
GROUP BY
    p.id, p.title, p.difficulty;

-- 트리거: 답안 제출 시 진행 상황 업데이트
DELIMITER //

CREATE TRIGGER after_submission_insert
AFTER INSERT ON wavy_submissions
FOR EACH ROW
BEGIN
    -- 진행 상황 레코드가 없으면 생성
    INSERT INTO wavy_progress (student_id, problem_id, attempts, best_score, last_attempt_at)
    VALUES (NEW.student_id, NEW.problem_id, 1, NEW.score, NEW.submitted_at)
    ON DUPLICATE KEY UPDATE
        attempts = attempts + 1,
        best_score = GREATEST(IFNULL(best_score, 0), IFNULL(NEW.score, 0)),
        last_attempt_at = NEW.submitted_at,
        completed = IF(NEW.score >= 60, TRUE, completed),
        completed_at = IF(NEW.score >= 60 AND completed = FALSE, NEW.submitted_at, completed_at);
END//

DELIMITER ;

-- 인덱스 최적화
OPTIMIZE TABLE wavy_problems;
OPTIMIZE TABLE wavy_students;
OPTIMIZE TABLE wavy_submissions;
OPTIMIZE TABLE wavy_progress;

-- 권한 설정 (필요시 조정)
-- CREATE USER IF NOT EXISTS 'moodle_user'@'localhost' IDENTIFIED BY 'your_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_wavy.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
