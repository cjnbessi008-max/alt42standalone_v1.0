-- Truth Light LMS App Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS truth_light_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE truth_light_db;

-- 사용자 테이블 (Moodle 사용자 정보 캐싱)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 문제 테이블 (Moodle에서 가져온 문제)
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    question_type VARCHAR(50) NOT NULL COMMENT 'truefalse, multichoice, etc',
    question_text TEXT NOT NULL,
    correct_answer BOOLEAN NOT NULL COMMENT '참=1, 거짓=0',
    difficulty_level TINYINT DEFAULT 1 COMMENT '1-5 난이도',
    category VARCHAR(100),
    moodle_course_id INT,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_question_id (moodle_question_id),
    INDEX idx_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 세션 테이블
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 답변 기록 테이블
CREATE TABLE IF NOT EXISTS answer_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer BOOLEAN NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence_level TINYINT COMMENT '0-100 사용자 확신도',
    time_spent_seconds INT DEFAULT 0,
    light_brightness TINYINT COMMENT '0-100 조명 밝기',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 진도 테이블
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_sessions INT DEFAULT 0,
    total_questions_answered INT DEFAULT 0,
    total_correct_answers INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '정답률 (%)',
    average_time_per_question DECIMAL(8,2) DEFAULT 0.00 COMMENT '평균 소요 시간 (초)',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_progress (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle 연동 로그
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('users', 'questions', 'courses') NOT NULL,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    records_synced INT DEFAULT 0,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type_time (sync_type, synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 샘플 데이터 삽입 (개발/테스트용)
INSERT INTO users (moodle_user_id, username, full_name, email) VALUES
(1, 'student1', '김철수', 'student1@kaist.ac.kr'),
(2, 'student2', '이영희', 'student2@kaist.ac.kr');

INSERT INTO questions (moodle_question_id, question_type, question_text, correct_answer, difficulty_level, category) VALUES
(1, 'truefalse', '2 + 2 = 4이다.', 1, 1, 'Mathematics'),
(2, 'truefalse', '모든 소수는 홀수이다.', 0, 2, 'Mathematics'),
(3, 'truefalse', '삼각형의 내각의 합은 180도이다.', 1, 1, 'Geometry'),
(4, 'truefalse', '0은 자연수이다.', 0, 3, 'Mathematics'),
(5, 'truefalse', '원의 둘레는 2πr이다.', 1, 2, 'Geometry'),
(6, 'truefalse', '음수끼리 곱하면 항상 양수이다.', 1, 2, 'Mathematics'),
(7, 'truefalse', '평행사변형의 대각선은 항상 수직이다.', 0, 3, 'Geometry'),
(8, 'truefalse', '√2는 유리수이다.', 0, 4, 'Mathematics'),
(9, 'truefalse', '정사각형은 마름모이다.', 1, 3, 'Geometry'),
(10, 'truefalse', '1은 소수이다.', 0, 2, 'Mathematics');
