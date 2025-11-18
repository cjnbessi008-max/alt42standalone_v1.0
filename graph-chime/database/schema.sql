-- Graph Chime Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- 그래프 문제 테이블 (Moodle에서 연동)
CREATE TABLE IF NOT EXISTS graph_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE,
    problem_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (linear, quadratic 등)',
    equation VARCHAR(255) NOT NULL COMMENT '방정식 (예: y = 2x + 3)',
    slope DECIMAL(10, 4) COMMENT '기울기 (일차함수)',
    y_intercept DECIMAL(10, 4) COMMENT 'y절편',
    x_intercept DECIMAL(10, 4) COMMENT 'x절편',
    difficulty_level INT DEFAULT 1 COMMENT '난이도 (1-5)',
    title VARCHAR(255) COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='그래프 문제 정보';

-- 학생 응답 테이블
CREATE TABLE IF NOT EXISTS student_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL COMMENT 'Moodle 학생 ID',
    session_id VARCHAR(100) COMMENT '세션 ID',
    response_type VARCHAR(50) NOT NULL COMMENT '응답 유형 (graph_draw, intercept_find 등)',
    response_data JSON COMMENT '응답 데이터 (좌표, 값 등)',
    is_correct BOOLEAN DEFAULT FALSE,
    score DECIMAL(5, 2) COMMENT '점수',
    time_spent INT COMMENT '소요 시간 (초)',
    sound_played BOOLEAN DEFAULT FALSE COMMENT '음향 재생 여부',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES graph_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 응답 기록';

-- 음향 설정 테이블
CREATE TABLE IF NOT EXISTS audio_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intercept_type VARCHAR(20) NOT NULL COMMENT 'y_intercept 또는 x_intercept',
    value_min DECIMAL(10, 4) NOT NULL COMMENT '최소값',
    value_max DECIMAL(10, 4) NOT NULL COMMENT '최대값',
    frequency_hz INT NOT NULL COMMENT '주파수 (Hz)',
    note_name VARCHAR(10) COMMENT '음계 이름 (C4, D4 등)',
    duration_ms INT DEFAULT 500 COMMENT '지속 시간 (밀리초)',
    wave_type VARCHAR(20) DEFAULT 'sine' COMMENT '파형 타입 (sine, square, triangle 등)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_intercept_type (intercept_type),
    INDEX idx_value_range (value_min, value_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='절편-음향 매핑 설정';

-- 세션 로그 테이블
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    problem_id INT,
    action_type VARCHAR(50) NOT NULL COMMENT '액션 타입 (view, interact, submit 등)',
    action_data JSON COMMENT '액션 상세 데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_student (student_id),
    INDEX idx_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 세션 로그';

-- 기본 음향 설정 데이터 삽입
INSERT INTO audio_settings (intercept_type, value_min, value_max, frequency_hz, note_name, duration_ms, wave_type) VALUES
-- y절편 음계 매핑 (C4-C5)
('y_intercept', -5.0, -4.0, 261.63, 'C4', 500, 'sine'),
('y_intercept', -4.0, -3.0, 277.18, 'C#4', 500, 'sine'),
('y_intercept', -3.0, -2.0, 293.66, 'D4', 500, 'sine'),
('y_intercept', -2.0, -1.0, 311.13, 'D#4', 500, 'sine'),
('y_intercept', -1.0, 0.0, 329.63, 'E4', 500, 'sine'),
('y_intercept', 0.0, 1.0, 349.23, 'F4', 500, 'sine'),
('y_intercept', 1.0, 2.0, 369.99, 'F#4', 500, 'sine'),
('y_intercept', 2.0, 3.0, 392.00, 'G4', 500, 'sine'),
('y_intercept', 3.0, 4.0, 415.30, 'G#4', 500, 'sine'),
('y_intercept', 4.0, 5.0, 440.00, 'A4', 500, 'sine'),

-- x절편 음계 매핑 (다른 옥타브 또는 다른 파형)
('x_intercept', -5.0, -4.0, 523.25, 'C5', 500, 'triangle'),
('x_intercept', -4.0, -3.0, 554.37, 'C#5', 500, 'triangle'),
('x_intercept', -3.0, -2.0, 587.33, 'D5', 500, 'triangle'),
('x_intercept', -2.0, -1.0, 622.25, 'D#5', 500, 'triangle'),
('x_intercept', -1.0, 0.0, 659.25, 'E5', 500, 'triangle'),
('x_intercept', 0.0, 1.0, 698.46, 'F5', 500, 'triangle'),
('x_intercept', 1.0, 2.0, 739.99, 'F#5', 500, 'triangle'),
('x_intercept', 2.0, 3.0, 783.99, 'G5', 500, 'triangle'),
('x_intercept', 3.0, 4.0, 830.61, 'G#5', 500, 'triangle'),
('x_intercept', 4.0, 5.0, 880.00, 'A5', 500, 'triangle');
