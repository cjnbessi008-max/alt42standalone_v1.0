-- Vector Star Map Database Schema
-- MySQL 5.7 Compatible
-- Character Set: UTF-8

CREATE DATABASE IF NOT EXISTS vector_star_map
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE vector_star_map;

-- Table: problems
-- Stores problem/concept data from Moodle LMS
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_type ENUM('concept', 'exercise', 'quiz', 'assessment') DEFAULT 'concept',
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    vector_x DECIMAL(10, 6) DEFAULT 0,
    vector_y DECIMAL(10, 6) DEFAULT 0,
    vector_z DECIMAL(10, 6) DEFAULT 0,
    category VARCHAR(100),
    tags JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_id),
    INDEX idx_course_id (course_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: constellations
-- Stores relationships between problems (star connections)
CREATE TABLE IF NOT EXISTS constellations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_problem_id INT NOT NULL,
    to_problem_id INT NOT NULL,
    relationship_type ENUM('prerequisite', 'related', 'advanced', 'similar') DEFAULT 'related',
    strength DECIMAL(3, 2) DEFAULT 0.50 CHECK (strength BETWEEN 0 AND 1),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (to_problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_from_problem (from_problem_id),
    INDEX idx_to_problem (to_problem_id),
    UNIQUE KEY unique_connection (from_problem_id, to_problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_progress
-- Tracks student learning progress
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
    score DECIMAL(5, 2) DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    attempts INT DEFAULT 0,
    time_spent INT DEFAULT 0, -- seconds
    first_attempt_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    metadata JSON,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sessions
-- Stores user session data
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    student_id INT,
    data TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moodle_sync_log
-- Logs Moodle synchronization activities
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('problems', 'progress', 'full') DEFAULT 'problems',
    status ENUM('success', 'failed', 'partial') DEFAULT 'success',
    records_synced INT DEFAULT 0,
    error_message TEXT,
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data: Vector Star Map Example (Math Fractions)
INSERT INTO problems (moodle_id, course_id, title, description, problem_type, difficulty, vector_x, vector_y, vector_z, category, tags) VALUES
(1001, 101, '분수의 기본 개념', '분수란 무엇인가? 분자와 분모의 이해', 'concept', 1, 0.0, 0.0, 0.0, 'mathematics', '["fractions", "basics"]'),
(1002, 101, '분수의 시각화', '피자와 케이크로 분수 이해하기', 'exercise', 1, 0.3, 0.2, 0.0, 'mathematics', '["fractions", "visualization"]'),
(1003, 101, '분수의 덧셈', '같은 분모를 가진 분수 더하기', 'exercise', 2, 0.5, 0.4, 0.0, 'mathematics', '["fractions", "addition"]'),
(1004, 101, '분수의 뺄셈', '같은 분모를 가진 분수 빼기', 'exercise', 2, 0.7, 0.3, 0.0, 'mathematics', '["fractions", "subtraction"]'),
(1005, 101, '분수의 곱셈', '분수 곱하기 분수', 'exercise', 3, 0.4, 0.7, 0.0, 'mathematics', '["fractions", "multiplication"]'),
(1006, 101, '분수의 나눗셈', '분수 나누기 분수', 'exercise', 3, 0.8, 0.8, 0.0, 'mathematics', '["fractions", "division"]'),
(1007, 101, '통분하기', '서로 다른 분모를 같게 만들기', 'concept', 2, 0.6, 0.5, 0.0, 'mathematics', '["fractions", "common_denominator"]'),
(1008, 101, '약분하기', '분자와 분모를 간단하게 만들기', 'concept', 2, 0.2, 0.6, 0.0, 'mathematics', '["fractions", "simplification"]');

-- Sample Constellation Connections (Star Map)
INSERT INTO constellations (from_problem_id, to_problem_id, relationship_type, strength) VALUES
(1, 2, 'prerequisite', 0.95),
(2, 3, 'prerequisite', 0.85),
(2, 4, 'prerequisite', 0.85),
(3, 5, 'prerequisite', 0.70),
(4, 5, 'related', 0.65),
(1, 7, 'prerequisite', 0.75),
(1, 8, 'prerequisite', 0.75),
(7, 3, 'prerequisite', 0.80),
(7, 4, 'prerequisite', 0.80),
(5, 6, 'prerequisite', 0.90),
(8, 5, 'related', 0.60),
(8, 6, 'related', 0.60);

-- Sample Student Progress
INSERT INTO student_progress (student_id, problem_id, status, score, attempts, time_spent) VALUES
(1, 1, 'completed', 100.00, 1, 120),
(1, 2, 'completed', 95.00, 2, 180),
(1, 3, 'in_progress', 70.00, 3, 240),
(1, 7, 'completed', 85.00, 2, 150);
