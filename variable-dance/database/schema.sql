-- Variable Dance Database Schema for MySQL 5.7
-- Moodle 3.7 Integration

CREATE DATABASE IF NOT EXISTS variable_dance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE variable_dance;

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL,
    problem_type VARCHAR(50) NOT NULL COMMENT 'linear, quadratic, system, inequality 등',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    equation TEXT NOT NULL COMMENT 'JSON 형식의 방정식 데이터',
    variables JSON NOT NULL COMMENT '변수 정의 및 초기값',
    constraints JSON COMMENT '변수 제약조건',
    solution_set JSON COMMENT '해집합 데이터',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_problem_id),
    INDEX idx_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 학습 세션 테이블
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    score DECIMAL(5,2) NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 변수 이동 이벤트 로그
CREATE TABLE IF NOT EXISTS variable_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    variable_name VARCHAR(50) NOT NULL,
    old_value DECIMAL(10,4),
    new_value DECIMAL(10,4),
    solution_set_before JSON,
    solution_set_after JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle 연동 설정
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 초기 설정 데이터
INSERT INTO moodle_config (config_key, config_value, description) VALUES
('moodle_url', 'http://localhost/moodle', 'Moodle 기본 URL'),
('api_token', '', 'Moodle Web Services API Token'),
('sync_interval', '300', 'Moodle 동기화 간격(초)'),
('enable_logging', 'true', '이벤트 로깅 활성화 여부');

-- 샘플 문제 데이터 (일차방정식)
INSERT INTO problems (moodle_problem_id, problem_type, title, description, equation, variables, constraints, solution_set, difficulty_level) VALUES
(1001, 'linear', '일차방정식: 변수 a의 이동', '변수 a를 이동시켜 방정식 ax + b = 0의 해집합이 어떻게 변하는지 관찰하세요.',
 '{"equation": "ax + b = 0", "standard_form": "ax + b = 0"}',
 '{"a": {"min": -10, "max": 10, "initial": 2, "step": 0.5}, "b": {"min": -10, "max": 10, "initial": 4, "step": 0.5}}',
 '{"a": "a != 0"}',
 '{"type": "single", "formula": "x = -b/a"}',
 'easy');

-- 샘플 문제 데이터 (이차방정식)
INSERT INTO problems (moodle_problem_id, problem_type, title, description, equation, variables, constraints, solution_set, difficulty_level) VALUES
(1002, 'quadratic', '이차방정식: 계수의 변화', '계수 a, b, c를 조정하여 이차방정식의 근이 어떻게 변하는지 탐구하세요.',
 '{"equation": "ax^2 + bx + c = 0", "standard_form": "ax^2 + bx + c = 0"}',
 '{"a": {"min": -5, "max": 5, "initial": 1, "step": 0.1}, "b": {"min": -10, "max": 10, "initial": 0, "step": 0.5}, "c": {"min": -10, "max": 10, "initial": -4, "step": 0.5}}',
 '{"a": "a != 0"}',
 '{"type": "quadratic", "discriminant": "b^2 - 4ac", "formula": "x = (-b ± sqrt(b^2-4ac)) / (2a)"}',
 'medium');

-- 샘플 문제 데이터 (연립방정식)
INSERT INTO problems (moodle_problem_id, problem_type, title, description, equation, variables, constraints, solution_set, difficulty_level) VALUES
(1003, 'system', '연립방정식: 교점의 이동', '연립방정식의 계수를 변경하여 두 직선의 교점이 어떻게 이동하는지 관찰하세요.',
 '{"equation1": "a1*x + b1*y = c1", "equation2": "a2*x + b2*y = c2"}',
 '{"a1": {"min": -5, "max": 5, "initial": 2, "step": 0.5}, "b1": {"min": -5, "max": 5, "initial": 3, "step": 0.5}, "c1": {"min": -10, "max": 10, "initial": 6, "step": 0.5}, "a2": {"min": -5, "max": 5, "initial": 1, "step": 0.5}, "b2": {"min": -5, "max": 5, "initial": -1, "step": 0.5}, "c2": {"min": -10, "max": 10, "initial": 2, "step": 0.5}}',
 '{"determinant": "a1*b2 - a2*b1 != 0"}',
 '{"type": "system", "x": "(c1*b2 - c2*b1)/(a1*b2 - a2*b1)", "y": "(a1*c2 - a2*c1)/(a1*b2 - a2*b1)"}',
 'hard');
