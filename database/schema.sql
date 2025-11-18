-- Solution Paint Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS solution_paint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE solution_paint;

-- 부등식 문제 테이블
CREATE TABLE IF NOT EXISTS inequality_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NULL,
    problem_text VARCHAR(500) NOT NULL COMMENT '문제 텍스트 (예: 2x + 3 > 7)',
    inequality_type ENUM('linear', 'quadratic', 'compound') DEFAULT 'linear',
    coefficient_a DECIMAL(10,2) NOT NULL COMMENT '계수 a (ax + b [op] c)',
    coefficient_b DECIMAL(10,2) NOT NULL COMMENT '계수 b',
    constant_c DECIMAL(10,2) NOT NULL COMMENT '상수 c',
    operator ENUM('>', '<', '>=', '<=') NOT NULL COMMENT '부등호',
    solution_start DECIMAL(10,2) NULL COMMENT '해의 시작점',
    solution_end DECIMAL(10,2) NULL COMMENT '해의 끝점',
    include_start BOOLEAN DEFAULT FALSE COMMENT '시작점 포함 여부',
    include_end BOOLEAN DEFAULT FALSE COMMENT '끝점 포함 여부',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle (moodle_question_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='부등식 문제 정보';

-- 학생 답안 테이블
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id VARCHAR(100) NOT NULL COMMENT 'Moodle 학생 ID',
    student_name VARCHAR(200) NULL,
    painted_data TEXT NOT NULL COMMENT '학생이 칠한 영역 JSON 데이터',
    answer_start DECIMAL(10,2) NULL COMMENT '학생 답안 시작점',
    answer_end DECIMAL(10,2) NULL COMMENT '학생 답안 끝점',
    is_correct BOOLEAN DEFAULT FALSE COMMENT '정답 여부',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수 (0-100)',
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent INT NULL COMMENT '소요 시간(초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES inequality_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem_student (problem_id, student_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 답안 기록';

-- Moodle 연동 설정 테이블
CREATE TABLE IF NOT EXISTS moodle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(500) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 연동 설정';

-- 학습 분석 로그 테이블
CREATE TABLE IF NOT EXISTS learning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    problem_id INT NOT NULL,
    action_type ENUM('start', 'paint', 'erase', 'submit', 'hint') NOT NULL,
    action_data JSON NULL COMMENT '행동 상세 데이터',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES inequality_problems(id) ON DELETE CASCADE,
    INDEX idx_student_time (student_id, timestamp),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 행동 분석 로그';

-- 샘플 데이터 삽입
INSERT INTO inequality_problems
    (problem_text, inequality_type, coefficient_a, coefficient_b, constant_c, operator,
     solution_start, solution_end, include_start, include_end, difficulty)
VALUES
    ('x > 3', 'linear', 1, 0, 3, '>', 3, NULL, FALSE, FALSE, 'easy'),
    ('2x + 1 <= 7', 'linear', 2, 1, 7, '<=', NULL, 3, FALSE, TRUE, 'easy'),
    ('-3x < 6', 'linear', -3, 0, 6, '<', -2, NULL, FALSE, FALSE, 'medium'),
    ('x + 5 >= 2', 'linear', 1, 5, 2, '>=', -3, NULL, TRUE, FALSE, 'easy'),
    ('-2 < x <= 5', 'compound', 1, 0, 0, '<=', -2, 5, FALSE, TRUE, 'medium');

-- Moodle 기본 설정
INSERT INTO moodle_config (config_key, config_value, description) VALUES
    ('moodle_url', 'http://localhost/moodle', 'Moodle 서버 URL'),
    ('api_token', '', 'Moodle REST API 토큰'),
    ('course_id', '1', '기본 코스 ID'),
    ('enabled', '0', 'Moodle 연동 활성화 여부');
