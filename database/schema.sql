-- Power Candle Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS student_attempts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS students;

-- ============================================
-- Students Table
-- ============================================
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Problems Table
-- Stores logarithm problems (cached from Moodle)
-- ============================================
CREATE TABLE problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_question_id INT NOT NULL,
    moodle_quiz_id INT,
    problem_type ENUM('calculate', 'verify', 'multiple_choice', 'visual') NOT NULL DEFAULT 'calculate',
    base INT NOT NULL CHECK (base > 1),
    result INT NOT NULL CHECK (result > 0),
    correct_answer INT NOT NULL,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    question_text TEXT,
    hint_text TEXT,
    explanation TEXT,
    max_attempts INT DEFAULT 3,
    time_limit INT, -- seconds, NULL = no limit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_type (problem_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Student Attempts Table
-- Tracks all student answer submissions
-- ============================================
CREATE TABLE student_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_id VARCHAR(64),
    answer INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INT, -- seconds
    hint_used BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    feedback_text TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id),
    INDEX idx_correct (is_correct),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sessions Table
-- Tracks learning sessions
-- ============================================
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    student_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    problems_attempted INT DEFAULT 0,
    problems_correct INT DEFAULT 0,
    total_time_spent INT DEFAULT 0, -- seconds
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_active (is_active),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Insert sample students
INSERT INTO students (moodle_user_id, username, email, full_name, grade_level) VALUES
(1001, 'student1', 'student1@example.com', 'Kim Minho', 'Grade 5'),
(1002, 'student2', 'student2@example.com', 'Lee Jisoo', 'Grade 6'),
(1003, 'student3', 'student3@example.com', 'Park Sooyoung', 'Grade 5');

-- Insert sample problems
-- Easy problems (base 2)
INSERT INTO problems (moodle_question_id, moodle_quiz_id, problem_type, base, result, correct_answer, difficulty, question_text, hint_text, explanation) VALUES
(1, 100, 'calculate', 2, 2, 1, 1,
 'Calculate: log₂ 2 = ?',
 'How many times do you multiply 2 to get 2? Just once!',
 '2¹ = 2, so log₂ 2 = 1. You need 1 candle!'),

(2, 100, 'calculate', 2, 4, 2, 1,
 'Calculate: log₂ 4 = ?',
 'Think: 2 × 2 = 4',
 '2² = 4, so log₂ 4 = 2. You need 2 candles!'),

(3, 100, 'calculate', 2, 8, 3, 1,
 'Calculate: log₂ 8 = ?',
 'Think: 2 × 2 × 2 = 8',
 '2³ = 8, so log₂ 8 = 3. You need 3 candles!'),

(4, 100, 'calculate', 2, 16, 4, 2,
 'Calculate: log₂ 16 = ?',
 'Keep multiplying 2 until you get 16',
 '2⁴ = 16, so log₂ 16 = 4. You need 4 candles!'),

(5, 100, 'calculate', 2, 32, 5, 2,
 'Calculate: log₂ 32 = ?',
 'Count: 2, 4, 8, 16, 32',
 '2⁵ = 32, so log₂ 32 = 5. You need 5 candles!');

-- Medium problems (base 3)
INSERT INTO problems (moodle_question_id, moodle_quiz_id, problem_type, base, result, correct_answer, difficulty, question_text, hint_text, explanation) VALUES
(6, 100, 'calculate', 3, 3, 1, 2,
 'Calculate: log₃ 3 = ?',
 'How many times do you multiply 3 to get 3?',
 '3¹ = 3, so log₃ 3 = 1. You need 1 candle!'),

(7, 100, 'calculate', 3, 9, 2, 2,
 'Calculate: log₃ 9 = ?',
 'Think: 3 × 3 = 9',
 '3² = 9, so log₃ 9 = 2. You need 2 candles!'),

(8, 100, 'calculate', 3, 27, 3, 2,
 'Calculate: log₃ 27 = ?',
 'Think: 3 × 3 × 3 = 27',
 '3³ = 27, so log₃ 27 = 3. You need 3 candles!'),

(9, 100, 'calculate', 3, 81, 4, 3,
 'Calculate: log₃ 81 = ?',
 'Keep multiplying 3 until you get 81',
 '3⁴ = 81, so log₃ 81 = 4. You need 4 candles!');

-- Hard problems (base 10)
INSERT INTO problems (moodle_question_id, moodle_quiz_id, problem_type, base, result, correct_answer, difficulty, question_text, hint_text, explanation) VALUES
(10, 100, 'calculate', 10, 10, 1, 3,
 'Calculate: log₁₀ 10 = ?',
 'How many times do you multiply 10 to get 10?',
 '10¹ = 10, so log₁₀ 10 = 1. You need 1 candle!'),

(11, 100, 'calculate', 10, 100, 2, 3,
 'Calculate: log₁₀ 100 = ?',
 'Think: 10 × 10 = 100',
 '10² = 100, so log₁₀ 100 = 2. You need 2 candles!'),

(12, 100, 'calculate', 10, 1000, 3, 3,
 'Calculate: log₁₀ 1000 = ?',
 'Think: 10 × 10 × 10 = 1000',
 '10³ = 1000, so log₁₀ 1000 = 3. You need 3 candles!'),

(13, 100, 'calculate', 10, 10000, 4, 4,
 'Calculate: log₁₀ 10000 = ?',
 'Count the zeros!',
 '10⁴ = 10000, so log₁₀ 10000 = 4. You need 4 candles!');

-- Verification problems
INSERT INTO problems (moodle_question_id, moodle_quiz_id, problem_type, base, result, correct_answer, difficulty, question_text, hint_text, explanation) VALUES
(14, 100, 'verify', 2, 16, 4, 2,
 'Is this correct? log₂ 16 = 4',
 'Check: Does 2⁴ = 16?',
 'Yes! 2⁴ = 16, so log₂ 16 = 4 is correct.'),

(15, 100, 'verify', 3, 27, 3, 2,
 'Is this correct? log₃ 27 = 3',
 'Check: Does 3³ = 27?',
 'Yes! 3³ = 27, so log₃ 27 = 3 is correct.');

-- ============================================
-- Views for Analytics
-- ============================================

-- Student performance summary
CREATE VIEW student_performance AS
SELECT
    s.id,
    s.username,
    s.full_name,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(sa.id), 2) as accuracy_percentage,
    AVG(sa.time_spent) as avg_time_per_problem,
    MAX(sa.attempted_at) as last_attempt
FROM students s
LEFT JOIN student_attempts sa ON s.id = sa.student_id
GROUP BY s.id, s.username, s.full_name;

-- Problem difficulty analysis
CREATE VIEW problem_difficulty_analysis AS
SELECT
    p.id,
    p.question_text,
    p.base,
    p.result,
    p.difficulty,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(sa.id), 2) as success_rate,
    AVG(sa.time_spent) as avg_time_spent
FROM problems p
LEFT JOIN student_attempts sa ON p.id = sa.problem_id
GROUP BY p.id, p.question_text, p.base, p.result, p.difficulty;

-- Recent activity feed
CREATE VIEW recent_activity AS
SELECT
    sa.id,
    s.username,
    p.question_text,
    sa.answer,
    sa.is_correct,
    sa.time_spent,
    sa.attempted_at
FROM student_attempts sa
JOIN students s ON sa.student_id = s.id
JOIN problems p ON sa.problem_id = p.id
ORDER BY sa.attempted_at DESC
LIMIT 100;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Procedure to record a new attempt
CREATE PROCEDURE record_attempt(
    IN p_student_id INT,
    IN p_problem_id INT,
    IN p_session_id VARCHAR(64),
    IN p_answer INT,
    IN p_time_spent INT,
    IN p_hint_used BOOLEAN
)
BEGIN
    DECLARE v_correct_answer INT;
    DECLARE v_is_correct BOOLEAN;
    DECLARE v_attempt_number INT;

    -- Get correct answer
    SELECT correct_answer INTO v_correct_answer
    FROM problems
    WHERE id = p_problem_id;

    -- Check if answer is correct
    SET v_is_correct = (p_answer = v_correct_answer);

    -- Get attempt number for this student/problem combination
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_number
    FROM student_attempts
    WHERE student_id = p_student_id AND problem_id = p_problem_id;

    -- Insert attempt
    INSERT INTO student_attempts (
        student_id, problem_id, session_id, answer,
        is_correct, time_spent, hint_used, attempt_number
    ) VALUES (
        p_student_id, p_problem_id, p_session_id, p_answer,
        v_is_correct, p_time_spent, p_hint_used, v_attempt_number
    );

    -- Update session statistics
    IF p_session_id IS NOT NULL THEN
        UPDATE sessions
        SET problems_attempted = problems_attempted + 1,
            problems_correct = problems_correct + IF(v_is_correct, 1, 0),
            total_time_spent = total_time_spent + COALESCE(p_time_spent, 0),
            last_activity = CURRENT_TIMESTAMP
        WHERE id = p_session_id;
    END IF;

    -- Return the result
    SELECT v_is_correct as is_correct, v_correct_answer as correct_answer;
END //

-- Procedure to start a new session
CREATE PROCEDURE start_session(
    IN p_student_id INT,
    OUT p_session_id VARCHAR(64)
)
BEGIN
    SET p_session_id = UUID();

    INSERT INTO sessions (id, student_id, is_active)
    VALUES (p_session_id, p_student_id, TRUE);

    SELECT p_session_id;
END //

-- Procedure to end a session
CREATE PROCEDURE end_session(
    IN p_session_id VARCHAR(64)
)
BEGIN
    UPDATE sessions
    SET is_active = FALSE,
        ended_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END //

DELIMITER ;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_student_problem ON student_attempts(student_id, problem_id);
CREATE INDEX idx_session_student ON sessions(student_id, is_active);
CREATE INDEX idx_problem_difficulty_active ON problems(difficulty, is_active);

-- ============================================
-- Comments
-- ============================================

-- This schema is optimized for MySQL 5.7
-- Compatible with Moodle 3.7 integration
-- All timestamps use MySQL TIMESTAMP type
-- Character set: utf8mb4 for full Unicode support (including emojis)
-- Engine: InnoDB for transaction support and foreign keys
