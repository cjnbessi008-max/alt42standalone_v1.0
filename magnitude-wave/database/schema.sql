-- Magnitude Wave Database Schema
-- MySQL 5.7 호환
-- 독립 실행 모드용 데이터베이스 스키마

CREATE DATABASE IF NOT EXISTS magnitude_wave_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE magnitude_wave_db;

-- Problems 테이블: 문제 정보 저장
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    question_text TEXT COMMENT '문제 본문',
    vector_data JSON COMMENT '벡터 데이터 (JSON 형식)',
    hints TEXT COMMENT '힌트',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    correct_magnitude DECIMAL(10, 4) COMMENT '정답 (벡터 크기)',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users 테이블: 사용자 정보 (독립 모드용)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    moodle_user_id INT COMMENT 'Moodle 사용자 ID (연동 시)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Submissions 테이블: 학습자 답안 제출 기록
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    user_id INT NOT NULL,
    magnitude_answer DECIMAL(10, 4) NOT NULL COMMENT '제출한 벡터 크기',
    vector_data JSON COMMENT '입력한 벡터 데이터',
    is_correct TINYINT(1) COMMENT '정답 여부 (자동 채점)',
    score DECIMAL(5, 2) COMMENT '점수',
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent INT COMMENT '소요 시간 (초)',
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_problem_user (problem_id, user_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning Analytics 테이블: 학습 분석 데이터
CREATE TABLE IF NOT EXISTS learning_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_id VARCHAR(100) COMMENT '세션 ID',
    event_type ENUM('start', 'calculate', 'submit', 'hint_view') NOT NULL,
    event_data JSON COMMENT '이벤트 상세 데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wave Settings 테이블: 사용자별 파동 시각화 설정
CREATE TABLE IF NOT EXISTS wave_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wave_speed INT DEFAULT 5 COMMENT '파동 속도 (1-10)',
    wave_frequency DECIMAL(3, 1) DEFAULT 2.0 COMMENT '주파수 (1-5)',
    color_scheme VARCHAR(50) DEFAULT 'default' COMMENT '색상 테마',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Logs 테이블: 시스템 로그
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_level ENUM('debug', 'info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    context JSON COMMENT '추가 컨텍스트 정보',
    user_id INT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_level (log_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
