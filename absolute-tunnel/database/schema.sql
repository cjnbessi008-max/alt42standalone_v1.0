-- Absolute Tunnel Database Schema
-- MySQL 5.7 Compatible
-- 절댓값 부등식 학습 앱을 위한 데이터베이스

CREATE DATABASE IF NOT EXISTS absolute_tunnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE absolute_tunnel;

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_quiz_id INT DEFAULT NULL,
    problem_type VARCHAR(50) NOT NULL COMMENT 'linear, quadratic, compound',
    equation TEXT NOT NULL COMMENT '절댓값 부등식 방정식 (예: |x-2| < 3)',
    solution_range TEXT NOT NULL COMMENT '해의 범위 JSON 형식',
    difficulty_level TINYINT DEFAULT 1 COMMENT '난이도 (1-5)',
    metadata JSON COMMENT '추가 메타데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_count INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0,
    visualization_interactions INT DEFAULT 0 COMMENT '시각화 상호작용 횟수',
    student_answer TEXT COMMENT '학생 답안',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 세션 테이블
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_session_token (session_token),
    INDEX idx_user_session (moodle_user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 시각화 설정 테이블
CREATE TABLE IF NOT EXISTS visualization_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    theme VARCHAR(50) DEFAULT 'default' COMMENT 'dark, light, colorblind',
    tunnel_speed DECIMAL(3,2) DEFAULT 1.00 COMMENT '터널 속도',
    show_grid BOOLEAN DEFAULT TRUE,
    show_labels BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT FALSE,
    preferences JSON COMMENT '기타 사용자 설정',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 문제 데이터 삽입
INSERT INTO problems (moodle_question_id, problem_type, equation, solution_range, difficulty_level, metadata) VALUES
(1001, 'linear', '|x - 2| < 3', '{"min": -1, "max": 5, "type": "open"}', 1, '{"description": "기본 절댓값 부등식"}'),
(1002, 'linear', '|x + 1| ≤ 4', '{"min": -5, "max": 3, "type": "closed"}', 1, '{"description": "등호 포함 부등식"}'),
(1003, 'linear', '|2x - 4| > 6', '{"ranges": [{"min": -Infinity, "max": -1, "type": "open"}, {"min": 5, "max": Infinity, "type": "open"}]}', 2, '{"description": "계수가 있는 부등식"}'),
(1004, 'linear', '|x| ≥ 5', '{"ranges": [{"min": -Infinity, "max": -5, "type": "closed"}, {"min": 5, "max": Infinity, "type": "closed"}]}', 2, '{"description": "기본형 큰 범위"}'),
(1005, 'compound', '2 < |x - 1| < 5', '{"ranges": [{"min": -4, "max": -1, "type": "open"}, {"min": 3, "max": 6, "type": "open"}]}', 3, '{"description": "복합 부등식"}');

-- 인덱스 추가 최적화
CREATE INDEX idx_problem_type ON problems(problem_type);
CREATE INDEX idx_session_active ON learning_sessions(is_active, last_activity);
CREATE INDEX idx_progress_completed ON student_progress(completed_at);
