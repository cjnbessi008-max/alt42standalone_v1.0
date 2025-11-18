-- Root Glow Database Schema
-- MySQL 5.7
-- Created for Moodle 3.7 LMS Integration

-- Database creation
CREATE DATABASE IF NOT EXISTS root_glow_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE root_glow_db;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    fullname VARCHAR(200),
    email VARCHAR(200),
    moodle_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Problems Table - 수학 문제 정보
-- ============================================
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    function VARCHAR(500) NOT NULL COMMENT '함수 표현식 (예: x^2 - 4)',
    description TEXT COMMENT '문제 설명',
    difficulty ENUM('쉬움', '보통', '어려움', '매우 어려움') DEFAULT '보통',
    expected_roots JSON COMMENT '예상 근 (JSON 배열)',
    min_x DECIMAL(10, 4) DEFAULT -10 COMMENT '검색 범위 최소값',
    max_x DECIMAL(10, 4) DEFAULT 10 COMMENT '검색 범위 최대값',
    tolerance DECIMAL(10, 6) DEFAULT 0.01 COMMENT '허용 오차',
    category VARCHAR(100) COMMENT '카테고리 (이차함수, 삼차함수, 삼각함수 등)',
    moodle_quiz_id INT COMMENT 'Moodle 퀴즈 ID',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_active (active),
    INDEX idx_moodle_quiz (moodle_quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Answers Table - 제출된 답안
-- ============================================
CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    roots JSON COMMENT '찾은 근 (JSON 배열)',
    score INT DEFAULT 0 COMMENT '점수 (0-100)',
    correct BOOLEAN DEFAULT FALSE COMMENT '정답 여부',
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_taken INT COMMENT '소요 시간 (초)',
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Progress Table - 학습 진행 상황
-- ============================================
CREATE TABLE IF NOT EXISTS progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    roots JSON COMMENT '현재까지 찾은 근',
    status ENUM('started', 'in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    attempts INT DEFAULT 1,
    updated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_status (status),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sessions Table - 세션 관리
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50),
    data TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Logs Table - 활동 로그
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL COMMENT '액션 타입 (solve, submit, view 등)',
    problem_id VARCHAR(50),
    details JSON COMMENT '추가 정보',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data - 테스트용 문제 데이터
-- ============================================
INSERT INTO problems (id, title, function, description, difficulty, expected_roots, category) VALUES
('PROB001', '이차함수의 근 찾기', 'x^2 - 4', '이차함수 f(x) = x² - 4의 근을 모두 찾으세요.', '쉬움', '[-2, 2]', '이차함수'),
('PROB002', '삼차함수의 근 찾기', 'x^3 - 6*x^2 + 11*x - 6', '삼차함수 f(x) = x³ - 6x² + 11x - 6의 근을 찾으세요.', '보통', '[1, 2, 3]', '삼차함수'),
('PROB003', '이차함수 근의 공식', 'x^2 - 2*x - 3', '이차함수 f(x) = x² - 2x - 3의 근을 찾으세요.', '쉬움', '[-1, 3]', '이차함수'),
('PROB004', '완전제곱식', 'x^2 - 6*x + 9', '완전제곱식 f(x) = x² - 6x + 9의 근을 찾으세요.', '쉬움', '[3]', '이차함수'),
('PROB005', '삼차함수 (중근)', 'x^3 - 3*x^2 + 3*x - 1', '삼차함수 f(x) = (x-1)³의 근을 찾으세요.', '보통', '[1]', '삼차함수'),
('PROB006', '사차함수', 'x^4 - 5*x^2 + 4', '사차함수 f(x) = x⁴ - 5x² + 4의 근을 찾으세요.', '보통', '[-2, -1, 1, 2]', '사차함수'),
('PROB007', '이차함수 (판별식 < 0)', 'x^2 + 4', '이차함수 f(x) = x² + 4의 실근을 찾으세요.', '보통', '[]', '이차함수'),
('PROB008', '인수분해', 'x^2 - 5*x + 6', '이차함수 f(x) = x² - 5x + 6을 인수분해하고 근을 찾으세요.', '쉬움', '[2, 3]', '이차함수'),
('PROB009', '삼차함수 응용', 'x^3 - x', '삼차함수 f(x) = x³ - x의 근을 찾으세요.', '보통', '[-1, 0, 1]', '삼차함수'),
('PROB010', '고차 다항식', 'x^3 - 7*x + 6', '삼차함수 f(x) = x³ - 7x + 6의 근을 찾으세요.', '어려움', '[-3, 1, 2]', '삼차함수');

-- ============================================
-- Sample User (for testing)
-- ============================================
INSERT INTO users (id, username, fullname, email) VALUES
('guest_user', 'guest', 'Guest User', 'guest@example.com'),
('test_user_1', 'student1', '김철수', 'student1@example.com'),
('test_user_2', 'student2', '이영희', 'student2@example.com');

-- ============================================
-- Views for Statistics
-- ============================================
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id AS user_id,
    u.username,
    u.fullname,
    COUNT(DISTINCT a.problem_id) AS problems_attempted,
    COUNT(a.id) AS total_submissions,
    AVG(a.score) AS average_score,
    MAX(a.score) AS best_score,
    SUM(CASE WHEN a.correct = TRUE THEN 1 ELSE 0 END) AS correct_answers,
    MAX(a.submitted_at) AS last_submission
FROM users u
LEFT JOIN answers a ON u.id = a.user_id
GROUP BY u.id, u.username, u.fullname;

CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty,
    p.category,
    COUNT(DISTINCT a.user_id) AS total_attempts,
    AVG(a.score) AS average_score,
    SUM(CASE WHEN a.correct = TRUE THEN 1 ELSE 0 END) AS correct_count,
    COUNT(a.id) AS total_submissions
FROM problems p
LEFT JOIN answers a ON p.id = a.problem_id
WHERE p.active = TRUE
GROUP BY p.id, p.title, p.difficulty, p.category;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- 사용자의 최근 활동 가져오기
CREATE PROCEDURE GetUserRecentActivity(IN userId VARCHAR(50), IN limitCount INT)
BEGIN
    SELECT
        al.*,
        p.title AS problem_title
    FROM activity_logs al
    LEFT JOIN problems p ON al.problem_id = p.id
    WHERE al.user_id = userId
    ORDER BY al.created_at DESC
    LIMIT limitCount;
END //

-- 문제 난이도별 통계
CREATE PROCEDURE GetDifficultyStatistics()
BEGIN
    SELECT
        difficulty,
        COUNT(*) AS total_problems,
        AVG(average_score) AS avg_score,
        COUNT(DISTINCT problem_id) AS attempted_problems
    FROM problem_statistics
    GROUP BY difficulty
    ORDER BY FIELD(difficulty, '쉬움', '보통', '어려움', '매우 어려움');
END //

DELIMITER ;

-- ============================================
-- Indexes for Performance
-- ============================================
-- Already created inline with table definitions

-- ============================================
-- Grants (adjust as needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON root_glow_db.* TO 'root_glow_user'@'localhost';
