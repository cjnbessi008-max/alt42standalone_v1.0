-- Condition Verification System Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS condition_checks;
DROP TABLE IF EXISTS student_reading_sessions;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS conditions;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

-- Teachers table
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_grade_level (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    problem_text TEXT NOT NULL,
    subject VARCHAR(50) DEFAULT 'mathematics',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    grade_level VARCHAR(20),
    require_all_conditions TINYINT(1) DEFAULT 1 COMMENT 'If 1, student must check all conditions before submitting',
    min_reading_time INT DEFAULT 30 COMMENT 'Minimum reading time in seconds before submission is allowed',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject (subject),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conditions table (important conditions within problems)
CREATE TABLE conditions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    condition_text TEXT NOT NULL,
    condition_order INT DEFAULT 0 COMMENT 'Display order of conditions',
    is_critical TINYINT(1) DEFAULT 1 COMMENT 'If 1, must be acknowledged before submission',
    highlight_color VARCHAR(20) DEFAULT '#ffeb3b' COMMENT 'Color for highlighting in problem text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_order (condition_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress on problems
CREATE TABLE student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    status ENUM('not_started', 'reading', 'conditions_checked', 'submitted', 'completed') DEFAULT 'not_started',
    started_at TIMESTAMP NULL,
    first_submission_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    total_reading_time INT DEFAULT 0 COMMENT 'Total time spent reading in seconds',
    submission_attempts INT DEFAULT 0,
    score DECIMAL(5,2) NULL COMMENT 'Score if applicable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_problem (student_id, problem_id),
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Condition checks (tracking which conditions students have acknowledged)
CREATE TABLE condition_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    condition_id INT NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_to_check INT NULL COMMENT 'Seconds from problem start to checking this condition',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_condition (student_id, condition_id),
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_condition (condition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reading sessions (detailed tracking of reading behavior)
CREATE TABLE student_reading_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    duration_seconds INT NULL,
    scroll_events INT DEFAULT 0 COMMENT 'Number of scroll events',
    mouse_movements INT DEFAULT 0 COMMENT 'Number of mouse movements tracked',
    focus_lost_count INT DEFAULT 0 COMMENT 'Number of times window lost focus',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_session_start (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO teachers (username, password_hash, name, email) VALUES
('teacher1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kim Teacher', 'teacher@example.com');
-- Password is 'password' (hashed with bcrypt)

INSERT INTO students (username, password_hash, name, email, grade_level) VALUES
('student1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lee Student', 'student1@example.com', '3'),
('student2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Park Student', 'student2@example.com', '3'),
('student3', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Choi Student', 'student3@example.com', '4');
-- Password is 'password' (hashed with bcrypt)

-- Sample problem
INSERT INTO problems (teacher_id, title, description, problem_text, subject, difficulty_level, grade_level, require_all_conditions, min_reading_time) VALUES
(1, '분수의 덧셈', '분수의 덧셈 문제입니다. 조건을 주의깊게 읽으세요.',
'민수는 피자 한 판을 가지고 있습니다. 첫 번째로 전체의 1/4을 먹었고, 두 번째로 전체의 1/3을 먹었습니다.\n\n조건:\n1. 피자는 처음에 한 판 전체였습니다.\n2. 첫 번째는 1/4을 먹었습니다.\n3. 두 번째는 1/3을 먹었습니다.\n4. 분수를 더할 때는 분모를 같게 만들어야 합니다.\n\n질문: 민수가 총 먹은 피자의 양은 전체의 몇 분의 몇입니까?',
'mathematics', 'medium', '3', 1, 45);

-- Sample conditions for the problem
INSERT INTO conditions (problem_id, condition_text, condition_order, is_critical, highlight_color) VALUES
(1, '피자는 처음에 한 판 전체였습니다.', 1, 1, '#ffeb3b'),
(1, '첫 번째는 1/4을 먹었습니다.', 2, 1, '#ffeb3b'),
(1, '두 번째는 1/3을 먹었습니다.', 3, 1, '#ffeb3b'),
(1, '분수를 더할 때는 분모를 같게 만들어야 합니다.', 4, 1, '#ff9800');

-- Create views for analytics
CREATE OR REPLACE VIEW v_problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.subject,
    p.difficulty_level,
    COUNT(DISTINCT sp.student_id) AS total_students_attempted,
    AVG(sp.total_reading_time) AS avg_reading_time,
    AVG(sp.submission_attempts) AS avg_submission_attempts,
    SUM(CASE WHEN sp.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
    AVG(CASE WHEN sp.status = 'completed' THEN sp.score ELSE NULL END) AS avg_score
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.title, p.subject, p.difficulty_level;

CREATE OR REPLACE VIEW v_student_condition_compliance AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    p.id AS problem_id,
    p.title AS problem_title,
    COUNT(DISTINCT c.id) AS total_conditions,
    COUNT(DISTINCT cc.condition_id) AS checked_conditions,
    (COUNT(DISTINCT cc.condition_id) / COUNT(DISTINCT c.id) * 100) AS compliance_percentage
FROM students s
CROSS JOIN problems p
LEFT JOIN conditions c ON p.id = c.problem_id
LEFT JOIN condition_checks cc ON s.id = cc.student_id AND c.id = cc.condition_id
WHERE c.is_critical = 1
GROUP BY s.id, s.name, p.id, p.title;
