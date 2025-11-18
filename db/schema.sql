-- Alt42 Standalone v1.0 Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS alt42_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alt42_db;

-- Problems table - stores problem information from Moodle LMS
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_type ENUM('substitute', 'multiple_choice', 'coding') DEFAULT 'substitute',
    original_code TEXT,
    substituted_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_problem_id),
    INDEX idx_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    current_problem_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_token (session_token),
    INDEX idx_user (moodle_user_id),
    FOREIGN KEY (current_problem_id) REFERENCES problems(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_problem (problem_id),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO problems (moodle_problem_id, title, description, problem_type, original_code, substituted_code) VALUES
(1, '함수 치환 문제 1', '다음 함수의 변수를 치환하세요', 'substitute',
'function calculateSum(a, b) {\n    return a + b;\n}',
'function calculateSum(x, y) {\n    return x + y;\n}'),
(2, '함수 치환 문제 2', '배열 처리 함수 변수 치환', 'substitute',
'function processArray(arr) {\n    let result = [];\n    for (let i = 0; i < arr.length; i++) {\n        result.push(arr[i] * 2);\n    }\n    return result;\n}',
'function processArray(data) {\n    let output = [];\n    for (let i = 0; i < data.length; i++) {\n        output.push(data[i] * 2);\n    }\n    return output;\n}');
