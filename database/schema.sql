-- Graph Blend LMS Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

CREATE DATABASE IF NOT EXISTS graph_blend_lms
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE graph_blend_lms;

-- Problems table (stores math problems from Moodle)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_quiz_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_type ENUM('inequality', 'range', 'function', 'linear', 'quadratic') DEFAULT 'inequality',
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    graph_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_problem_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    student_name VARCHAR(255),
    answer TEXT,
    is_correct TINYINT(1) DEFAULT 0,
    time_spent INT DEFAULT 0 COMMENT 'Time in seconds',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (moodle_user_id),
    INDEX idx_problem_attempt (problem_id, moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Graph blend ranges table (stores graph range data)
CREATE TABLE IF NOT EXISTS graph_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    range_start DECIMAL(10, 4) NOT NULL,
    range_end DECIMAL(10, 4) NOT NULL,
    range_type ENUM('open', 'closed', 'half_open_left', 'half_open_right') DEFAULT 'closed',
    color VARCHAR(7) DEFAULT '#4CAF50',
    opacity DECIMAL(3, 2) DEFAULT 0.5,
    display_order INT DEFAULT 0,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_range (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for tracking user sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    moodle_user_id INT,
    session_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_user_session (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (moodle_question_id, moodle_quiz_id, title, description, problem_type, min_value, max_value, graph_data) VALUES
(1, 101, '부등식 풀이', 'x > 3 을 수직선에 나타내시오', 'inequality', 3, 10, '{"type": "inequality", "operator": ">", "value": 3}'),
(2, 101, '범위 표현', '2 ≤ x < 7 을 그래프로 나타내시오', 'range', 2, 7, '{"type": "range", "min": 2, "max": 7, "minInclusive": true, "maxInclusive": false}'),
(3, 102, '함수의 정의역', 'f(x) = √x의 정의역을 표현하시오', 'function', 0, 20, '{"type": "function", "expression": "sqrt(x)", "domain": [0, null]}');

INSERT INTO graph_ranges (problem_id, range_start, range_end, range_type, color, opacity, display_order) VALUES
(1, 3, 10, 'open', '#2196F3', 0.6, 1),
(2, 2, 7, 'half_open_right', '#4CAF50', 0.5, 1),
(3, 0, 20, 'closed', '#FF9800', 0.5, 1);
