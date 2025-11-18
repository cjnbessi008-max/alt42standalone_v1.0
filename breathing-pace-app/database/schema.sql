-- Breathing Pace Learning Assistant Database Schema
-- MySQL 5.7 Compatible

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS breathing_pace_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE breathing_pace_db;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    moodle_user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle 연결 설정 테이블
CREATE TABLE IF NOT EXISTS moodle_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_url VARCHAR(500) NOT NULL,
    moodle_token VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_connected TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제 정보 캐시 테이블
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    quiz_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'very-hard') NOT NULL DEFAULT 'medium',
    question_type VARCHAR(50) NOT NULL DEFAULT 'multichoice',
    question_text TEXT,
    max_mark DECIMAL(10, 2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_question (moodle_question_id, quiz_id),
    INDEX idx_quiz_difficulty (quiz_id, difficulty),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 호흡 세션 테이블
CREATE TABLE IF NOT EXISTS breathing_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    question_id INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'very-hard') NOT NULL,
    inhale_duration INT NOT NULL COMMENT '들숨 시간 (초)',
    exhale_duration INT NOT NULL COMMENT '날숨 시간 (초)',
    total_cycles INT NOT NULL DEFAULT 3,
    completed_cycles INT NOT NULL DEFAULT 0,
    status ENUM('started', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'started',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0 COMMENT '총 세션 시간 (초)',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_difficulty (difficulty),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 호흡 사이클 상세 기록 테이블
CREATE TABLE IF NOT EXISTS breathing_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    cycle_number INT NOT NULL,
    inhale_completed TINYINT(1) DEFAULT 0,
    exhale_completed TINYINT(1) DEFAULT 0,
    cycle_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cycle_completed_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES breathing_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_cycle (session_id, cycle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 통계 집계 테이블 (성능 최적화)
CREATE TABLE IF NOT EXISTS user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_sessions INT DEFAULT 0,
    total_cycles INT DEFAULT 0,
    total_duration_seconds INT DEFAULT 0,
    easy_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    hard_count INT DEFAULT 0,
    very_hard_count INT DEFAULT 0,
    last_session_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action_date (action, created_at),
    INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 뷰: 사용자별 통계 요약
CREATE OR REPLACE VIEW v_user_session_summary AS
SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT bs.id) AS total_sessions,
    SUM(bs.completed_cycles) AS total_cycles,
    SUM(bs.duration_seconds) AS total_duration_seconds,
    AVG(CASE bs.difficulty
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        WHEN 'very-hard' THEN 4
    END) AS avg_difficulty_score,
    MAX(bs.started_at) AS last_session_at
FROM users u
LEFT JOIN breathing_sessions bs ON u.id = bs.user_id
WHERE bs.status = 'completed'
GROUP BY u.id, u.username;

-- 뷰: 난이도별 호흡 템포 사용 통계
CREATE OR REPLACE VIEW v_difficulty_stats AS
SELECT
    bs.difficulty,
    COUNT(*) AS session_count,
    AVG(bs.completed_cycles) AS avg_cycles,
    AVG(bs.duration_seconds) AS avg_duration_seconds,
    AVG(bs.inhale_duration) AS avg_inhale,
    AVG(bs.exhale_duration) AS avg_exhale
FROM breathing_sessions bs
WHERE bs.status = 'completed'
GROUP BY bs.difficulty;

-- 트리거: 세션 완료 시 통계 업데이트
DELIMITER //

CREATE TRIGGER trg_update_user_stats_after_session
AFTER UPDATE ON breathing_sessions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL THEN
        INSERT INTO user_statistics (
            user_id,
            total_sessions,
            total_cycles,
            total_duration_seconds,
            easy_count,
            medium_count,
            hard_count,
            very_hard_count,
            last_session_at
        )
        VALUES (
            NEW.user_id,
            1,
            NEW.completed_cycles,
            NEW.duration_seconds,
            IF(NEW.difficulty = 'easy', 1, 0),
            IF(NEW.difficulty = 'medium', 1, 0),
            IF(NEW.difficulty = 'hard', 1, 0),
            IF(NEW.difficulty = 'very-hard', 1, 0),
            NEW.completed_at
        )
        ON DUPLICATE KEY UPDATE
            total_sessions = total_sessions + 1,
            total_cycles = total_cycles + NEW.completed_cycles,
            total_duration_seconds = total_duration_seconds + NEW.duration_seconds,
            easy_count = easy_count + IF(NEW.difficulty = 'easy', 1, 0),
            medium_count = medium_count + IF(NEW.difficulty = 'medium', 1, 0),
            hard_count = hard_count + IF(NEW.difficulty = 'hard', 1, 0),
            very_hard_count = very_hard_count + IF(NEW.difficulty = 'very-hard', 1, 0),
            last_session_at = NEW.completed_at;
    END IF;
END//

DELIMITER ;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO users (username, email, moodle_user_id) VALUES
('demo_user', 'demo@example.com', 1001),
('test_student', 'student@example.com', 1002);

INSERT INTO questions (moodle_question_id, quiz_id, title, difficulty, question_type) VALUES
(1, 101, '기본 수학 문제', 'easy', 'multichoice'),
(2, 101, '중급 수학 문제', 'medium', 'shortanswer'),
(3, 102, '고급 수학 문제', 'hard', 'numerical'),
(4, 102, '심화 수학 문제', 'very-hard', 'essay');

-- 인덱스 최적화 확인
SHOW INDEX FROM breathing_sessions;
SHOW INDEX FROM questions;

-- 테이블 정보 확인
SHOW TABLES;
