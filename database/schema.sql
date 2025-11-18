-- Dot Product Heat Visualization Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS dot_product_heat
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dot_product_heat;

-- Problems table (stores vector problems from Moodle)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vector1_x DECIMAL(10, 4) NOT NULL,
    vector1_y DECIMAL(10, 4) NOT NULL,
    vector2_x DECIMAL(10, 4) NOT NULL,
    vector2_y DECIMAL(10, 4) NOT NULL,
    correct_answer DECIMAL(10, 4) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    student_answer DECIMAL(10, 4),
    dot_product_value DECIMAL(10, 4) NOT NULL,
    heat_color VARCHAR(7) NOT NULL, -- Hex color code
    is_correct TINYINT(1) DEFAULT 0,
    time_taken INT, -- seconds
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Heat visualization history
CREATE TABLE IF NOT EXISTS heat_visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    vector1_x DECIMAL(10, 4) NOT NULL,
    vector1_y DECIMAL(10, 4) NOT NULL,
    vector2_x DECIMAL(10, 4) NOT NULL,
    vector2_y DECIMAL(10, 4) NOT NULL,
    dot_product DECIMAL(10, 4) NOT NULL,
    normalized_value DECIMAL(5, 4) NOT NULL, -- -1.0 to 1.0
    heat_color VARCHAR(7) NOT NULL,
    temperature INT NOT NULL, -- 0-100 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE,
    INDEX idx_attempt (attempt_id),
    INDEX idx_temperature (temperature)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    moodle_user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (
    moodle_quiz_id,
    moodle_question_id,
    title,
    description,
    vector1_x,
    vector1_y,
    vector2_x,
    vector2_y,
    correct_answer,
    difficulty
) VALUES
(1, 1, '기본 내적 계산', '두 벡터의 내적을 계산하세요', 3.0, 4.0, 1.0, 2.0, 11.0, 'easy'),
(1, 2, '수직 벡터 찾기', '내적이 0이 되는 벡터를 찾으세요', 1.0, 0.0, 0.0, 1.0, 0.0, 'medium'),
(1, 3, '반대 방향 벡터', '음수 내적을 가지는 벡터', -2.0, 3.0, 4.0, -5.0, -23.0, 'hard'),
(1, 4, '같은 방향 벡터', '양수 내적을 가지는 벡터', 5.0, 5.0, 3.0, 3.0, 30.0, 'easy');
