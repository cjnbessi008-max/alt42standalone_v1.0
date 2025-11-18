-- Pattern Loop Animation System Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS pattern_loop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pattern_loop_db;

-- Moodle 문제 정보 테이블
CREATE TABLE IF NOT EXISTS moodle_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    question_data JSON,
    pattern_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_qid (moodle_question_id),
    INDEX idx_question_type (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pattern Loop 설정 테이블
CREATE TABLE IF NOT EXISTS pattern_loops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    function_type ENUM('sine', 'cosine', 'tangent', 'square', 'sawtooth', 'triangle', 'custom') NOT NULL,
    amplitude DECIMAL(10,4) DEFAULT 1.0,
    frequency DECIMAL(10,4) DEFAULT 1.0,
    phase DECIMAL(10,4) DEFAULT 0.0,
    color VARCHAR(20) DEFAULT '#3498db',
    animation_speed DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_function_type (function_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제와 패턴 연결 테이블
CREATE TABLE IF NOT EXISTS question_pattern_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    pattern_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES moodle_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES pattern_loops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mapping (question_id, pattern_id),
    INDEX idx_question (question_id),
    INDEX idx_pattern (pattern_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 진행 상황 추적
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    is_correct BOOLEAN,
    attempt_count INT DEFAULT 0,
    time_spent INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES moodle_questions(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_question (question_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 패턴 데이터 삽입
INSERT INTO pattern_loops (name, function_type, amplitude, frequency, phase, color, animation_speed) VALUES
('Sine Wave', 'sine', 1.0, 1.0, 0.0, '#3498db', 1.0),
('Cosine Wave', 'cosine', 1.0, 1.0, 0.0, '#e74c3c', 1.0),
('Fast Sine', 'sine', 1.0, 2.0, 0.0, '#2ecc71', 1.5),
('Square Wave', 'square', 1.0, 1.0, 0.0, '#f39c12', 1.0),
('Triangle Wave', 'triangle', 1.0, 1.0, 0.0, '#9b59b6', 1.0);
