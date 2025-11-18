-- Log Gear App Database Schema
-- MySQL 5.7 Compatible

-- Problems table: Stores math problems from Moodle LMS
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_text VARCHAR(255) NOT NULL,
    operand1 DECIMAL(10,2) NOT NULL,
    operand2 DECIMAL(10,2) NOT NULL,
    operation ENUM('multiply', 'divide') NOT NULL DEFAULT 'multiply',
    answer DECIMAL(10,4) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    moodle_question_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_moodle_question_id (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student sessions table: Track student interactions
CREATE TABLE IF NOT EXISTS student_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    student_id INT DEFAULT NULL,
    moodle_user_id INT DEFAULT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Problem attempts table: Track student answers
CREATE TABLE IF NOT EXISTS problem_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    problem_id INT NOT NULL,
    student_answer DECIMAL(10,4) DEFAULT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INT DEFAULT 0, -- seconds
    gear_animation_completed BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_problem_id (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample problems
INSERT INTO problems (problem_text, operand1, operand2, operation, answer, difficulty) VALUES
('2 × 3을 로그 기어로 계산하세요', 2, 3, 'multiply', 6, 'easy'),
('5 × 4를 로그 기어로 계산하세요', 5, 4, 'multiply', 20, 'easy'),
('3 × 7을 로그 기어로 계산하세요', 3, 7, 'multiply', 21, 'medium'),
('6 × 8을 로그 기어로 계산하세요', 6, 8, 'multiply', 48, 'medium'),
('12 × 15를 로그 기어로 계산하세요', 12, 15, 'multiply', 180, 'hard'),
('8 ÷ 2를 로그 기어로 계산하세요', 8, 2, 'divide', 4, 'easy'),
('20 ÷ 4를 로그 기어로 계산하세요', 20, 4, 'divide', 5, 'medium');
