-- Convergence Glow Database Schema
-- MySQL 5.7

CREATE DATABASE IF NOT EXISTS convergence_glow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE convergence_glow;

-- 수열 문제 테이블
CREATE TABLE IF NOT EXISTS sequence_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    sequence_type VARCHAR(50) NOT NULL COMMENT 'arithmetic, geometric, harmonic, custom',
    sequence_formula TEXT COMMENT '수열 공식 (JSON 형식)',
    initial_term DECIMAL(15,6) COMMENT '초항',
    common_difference DECIMAL(15,6) COMMENT '공차 (등차수열)',
    common_ratio DECIMAL(15,6) COMMENT '공비 (등비수열)',
    convergence_type ENUM('convergent', 'divergent', 'oscillating') NOT NULL,
    limit_value DECIMAL(15,6) COMMENT '수렴값 (수렴하는 경우)',
    visualization_config JSON COMMENT '시각화 설정',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 응답 및 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempt_number INT DEFAULT 1,
    student_answer VARCHAR(20) COMMENT 'convergent, divergent, oscillating',
    is_correct BOOLEAN,
    time_spent_seconds INT,
    interaction_data JSON COMMENT '학생 상호작용 데이터',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES sequence_problems(id) ON DELETE CASCADE,
    INDEX idx_user (moodle_user_id),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle 세션 연동 테이블
CREATE TABLE IF NOT EXISTS moodle_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    moodle_user_id INT NOT NULL,
    moodle_quiz_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (session_token),
    INDEX idx_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO sequence_problems (
    moodle_quiz_id,
    moodle_question_id,
    sequence_type,
    sequence_formula,
    initial_term,
    common_ratio,
    convergence_type,
    limit_value,
    visualization_config
) VALUES
(1, 1, 'geometric', '{"formula": "a_n = 1 * (1/2)^n", "n_start": 0}', 1.0, 0.5, 'convergent', 0.0,
 '{"color_start": "#FF6B6B", "color_end": "#4ECDC4", "animation_speed": 1.0}'),
(1, 2, 'geometric', '{"formula": "a_n = 1 * 2^n", "n_start": 0}', 1.0, 2.0, 'divergent', NULL,
 '{"color_start": "#4ECDC4", "color_end": "#FF6B6B", "animation_speed": 1.5}'),
(1, 3, 'arithmetic', '{"formula": "a_n = 10 - 0.5*n", "n_start": 1}', 10.0, -0.5, 'convergent', 0.0,
 '{"color_start": "#FFE66D", "color_end": "#95E1D3", "animation_speed": 1.0}'),
(1, 4, 'custom', '{"formula": "a_n = (-1)^n / n", "n_start": 1}', NULL, NULL, 'oscillating', 0.0,
 '{"color_start": "#F38181", "color_end": "#AA96DA", "animation_speed": 0.8}');
