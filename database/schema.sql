-- Correspondence Lines Database Schema
-- Compatible with MySQL 5.7

-- Drop tables if exist (for development)
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS correspondence_pairs;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS students;

-- Students table (can sync from Moodle)
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    moodle_user_id INT UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table (correspondence line questions)
CREATE TABLE problems (
    id VARCHAR(36) PRIMARY KEY,
    moodle_question_id INT UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    difficulty_level TINYINT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    time_limit_seconds INT DEFAULT 300,
    max_attempts INT DEFAULT 3,
    randomize_order BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question_id (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Correspondence pairs (correct answers)
CREATE TABLE correspondence_pairs (
    id VARCHAR(36) PRIMARY KEY,
    problem_id VARCHAR(36) NOT NULL,
    left_item_id VARCHAR(50) NOT NULL,
    left_item_text TEXT NOT NULL,
    left_item_image_url VARCHAR(512),
    right_item_id VARCHAR(50) NOT NULL,
    right_item_text TEXT NOT NULL,
    right_item_image_url VARCHAR(512),
    is_correct_match BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student answers (interaction tracking)
CREATE TABLE student_answers (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(100),

    -- Answer data
    drawn_connections JSON NOT NULL COMMENT 'Array of {leftId, rightId} pairs',
    is_correct BOOLEAN,
    score DECIMAL(5,2) DEFAULT 0.00,

    -- Behavior tracking
    time_spent_seconds INT,
    attempt_number INT DEFAULT 1,
    interaction_sequence JSON COMMENT 'Timeline of user interactions',

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for analytics
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty_level,
    COUNT(DISTINCT sa.student_id) AS total_students,
    COUNT(sa.id) AS total_attempts,
    AVG(sa.score) AS average_score,
    AVG(sa.time_spent_seconds) AS average_time_seconds,
    SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_attempts,
    (SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(sa.id) * 100) AS success_rate
FROM problems p
LEFT JOIN student_answers sa ON p.id = sa.problem_id
WHERE sa.submitted_at IS NOT NULL
GROUP BY p.id, p.title, p.difficulty_level;

-- Create view for student progress
CREATE OR REPLACE VIEW student_progress AS
SELECT
    s.id AS student_id,
    s.username,
    COUNT(DISTINCT sa.problem_id) AS problems_attempted,
    SUM(CASE WHEN sa.is_correct = TRUE THEN 1 ELSE 0 END) AS problems_correct,
    AVG(sa.score) AS average_score,
    SUM(sa.time_spent_seconds) AS total_time_seconds,
    MAX(sa.submitted_at) AS last_activity
FROM students s
LEFT JOIN student_answers sa ON s.id = sa.student_id
WHERE sa.submitted_at IS NOT NULL
GROUP BY s.id, s.username;
