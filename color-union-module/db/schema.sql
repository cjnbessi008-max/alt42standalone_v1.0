-- Color Union Module Database Schema
-- MySQL 5.7 Compatible
-- For integration with Moodle 3.7

-- Create database
CREATE DATABASE IF NOT EXISTS color_union_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE color_union_db;

-- Users table (synchronized with Moodle users)
CREATE TABLE IF NOT EXISTS cu_users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_moodle_user_id (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table - tracks user sessions
CREATE TABLE IF NOT EXISTS cu_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    cm_id INT UNSIGNED NOT NULL COMMENT 'Course Module ID in Moodle',
    session_token VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    total_score INT DEFAULT 0,
    max_possible_score INT DEFAULT 100,
    FOREIGN KEY (user_id) REFERENCES cu_users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_token),
    INDEX idx_course (course_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table - stores generated problems
CREATE TABLE IF NOT EXISTS cu_problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    problem_number TINYINT UNSIGNED NOT NULL,
    set_a JSON NOT NULL COMMENT 'Array of elements in Set A',
    set_b JSON NOT NULL COMMENT 'Array of elements in Set B',
    union_set JSON NOT NULL COMMENT 'Array of elements in A ∪ B',
    color_a VARCHAR(7) NOT NULL COMMENT 'Hex color for Set A',
    color_b VARCHAR(7) NOT NULL COMMENT 'Hex color for Set B',
    color_union VARCHAR(7) NOT NULL COMMENT 'Blended hex color for union',
    correct_answer TINYINT UNSIGNED NOT NULL COMMENT 'Number of elements in union',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES cu_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY idx_session_problem (session_id, problem_number),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attempts table - stores user answers
CREATE TABLE IF NOT EXISTS cu_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    user_answer TINYINT UNSIGNED COMMENT 'User provided answer',
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT UNSIGNED NOT NULL COMMENT 'Time spent on problem',
    points_earned INT DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES cu_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES cu_users(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_correctness (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progress table - tracks overall user progress
CREATE TABLE IF NOT EXISTS cu_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    total_sessions INT UNSIGNED DEFAULT 0,
    total_problems_attempted INT UNSIGNED DEFAULT 0,
    total_problems_correct INT UNSIGNED DEFAULT 0,
    best_score INT DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    total_time_spent_seconds INT UNSIGNED DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES cu_users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_course (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_best_score (best_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events log table - tracks all user interactions
CREATE TABLE IF NOT EXISTS cu_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON COMMENT 'Additional event details',
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES cu_users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES cu_sessions(id) ON DELETE SET NULL,
    INDEX idx_user_events (user_id, event_type),
    INDEX idx_session_events (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle grade sync table
CREATE TABLE IF NOT EXISTS cu_grade_sync (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED NOT NULL,
    moodle_grade_item_id INT UNSIGNED NOT NULL,
    grade DECIMAL(10,5) NOT NULL COMMENT 'Grade value',
    grade_max DECIMAL(10,5) NOT NULL DEFAULT 100.00,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES cu_users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES cu_sessions(id) ON DELETE CASCADE,
    INDEX idx_sync_status (sync_status),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for analytics

-- View: User performance summary
CREATE OR REPLACE VIEW v_user_performance AS
SELECT
    u.id AS user_id,
    u.username,
    u.full_name,
    p.course_id,
    p.total_sessions,
    p.total_problems_attempted,
    p.total_problems_correct,
    CASE
        WHEN p.total_problems_attempted > 0
        THEN ROUND((p.total_problems_correct / p.total_problems_attempted) * 100, 2)
        ELSE 0
    END AS accuracy_percentage,
    p.best_score,
    p.average_score,
    p.total_time_spent_seconds,
    CASE
        WHEN p.total_problems_attempted > 0
        THEN ROUND(p.total_time_spent_seconds / p.total_problems_attempted, 0)
        ELSE 0
    END AS avg_time_per_problem,
    p.last_activity_at
FROM cu_users u
LEFT JOIN cu_progress p ON u.id = p.user_id;

-- View: Session summary
CREATE OR REPLACE VIEW v_session_summary AS
SELECT
    s.id AS session_id,
    s.user_id,
    u.username,
    s.course_id,
    s.cm_id,
    s.started_at,
    s.completed_at,
    s.is_completed,
    s.total_score,
    s.max_possible_score,
    CASE
        WHEN s.max_possible_score > 0
        THEN ROUND((s.total_score / s.max_possible_score) * 100, 2)
        ELSE 0
    END AS score_percentage,
    COUNT(p.id) AS total_problems,
    COUNT(a.id) AS problems_attempted,
    SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS problems_correct,
    SUM(a.time_spent_seconds) AS total_time_seconds
FROM cu_sessions s
JOIN cu_users u ON s.user_id = u.id
LEFT JOIN cu_problems p ON s.id = p.session_id
LEFT JOIN cu_attempts a ON p.id = a.problem_id
GROUP BY s.id;

-- View: Problem difficulty analysis
CREATE OR REPLACE VIEW v_problem_difficulty AS
SELECT
    JSON_LENGTH(p.set_a) AS set_a_size,
    JSON_LENGTH(p.set_b) AS set_b_size,
    p.correct_answer AS union_size,
    COUNT(a.id) AS total_attempts,
    SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_attempts,
    CASE
        WHEN COUNT(a.id) > 0
        THEN ROUND((SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2)
        ELSE 0
    END AS success_rate,
    ROUND(AVG(a.time_spent_seconds), 0) AS avg_time_seconds
FROM cu_problems p
LEFT JOIN cu_attempts a ON p.id = a.problem_id
GROUP BY set_a_size, set_b_size, union_size
ORDER BY success_rate ASC;

-- Stored Procedures

DELIMITER //

-- Procedure: Create new session
CREATE PROCEDURE sp_create_session(
    IN p_user_id INT UNSIGNED,
    IN p_course_id INT UNSIGNED,
    IN p_cm_id INT UNSIGNED,
    IN p_session_token VARCHAR(255),
    OUT p_session_id INT UNSIGNED
)
BEGIN
    INSERT INTO cu_sessions (user_id, course_id, cm_id, session_token)
    VALUES (p_user_id, p_course_id, p_cm_id, p_session_token);

    SET p_session_id = LAST_INSERT_ID();
END //

-- Procedure: Save problem attempt
CREATE PROCEDURE sp_save_attempt(
    IN p_problem_id INT UNSIGNED,
    IN p_user_id INT UNSIGNED,
    IN p_user_answer TINYINT UNSIGNED,
    IN p_is_correct BOOLEAN,
    IN p_time_spent INT UNSIGNED,
    IN p_points_earned INT
)
BEGIN
    INSERT INTO cu_attempts (
        problem_id,
        user_id,
        user_answer,
        is_correct,
        time_spent_seconds,
        points_earned
    ) VALUES (
        p_problem_id,
        p_user_id,
        p_user_answer,
        p_is_correct,
        p_time_spent,
        p_points_earned
    );

    -- Update progress
    INSERT INTO cu_progress (
        user_id,
        course_id,
        total_problems_attempted,
        total_problems_correct,
        total_time_spent_seconds
    )
    SELECT
        p_user_id,
        s.course_id,
        1,
        CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        p_time_spent
    FROM cu_problems pr
    JOIN cu_sessions s ON pr.session_id = s.id
    WHERE pr.id = p_problem_id
    ON DUPLICATE KEY UPDATE
        total_problems_attempted = total_problems_attempted + 1,
        total_problems_correct = total_problems_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        total_time_spent_seconds = total_time_spent_seconds + p_time_spent;
END //

-- Procedure: Complete session
CREATE PROCEDURE sp_complete_session(
    IN p_session_id INT UNSIGNED,
    IN p_total_score INT
)
BEGIN
    UPDATE cu_sessions
    SET
        is_completed = TRUE,
        completed_at = CURRENT_TIMESTAMP,
        total_score = p_total_score
    WHERE id = p_session_id;

    -- Update user progress
    UPDATE cu_progress p
    JOIN cu_sessions s ON p.user_id = s.user_id AND p.course_id = s.course_id
    SET
        p.total_sessions = p.total_sessions + 1,
        p.best_score = GREATEST(p.best_score, p_total_score),
        p.average_score = (
            SELECT AVG(total_score)
            FROM cu_sessions
            WHERE user_id = s.user_id AND course_id = s.course_id AND is_completed = TRUE
        )
    WHERE s.id = p_session_id;
END //

DELIMITER ;

-- Insert sample data for testing
INSERT INTO cu_users (moodle_user_id, username, email, full_name) VALUES
(1, 'student1', 'student1@example.com', 'Test Student 1'),
(2, 'student2', 'student2@example.com', 'Test Student 2');

-- Indexes for performance optimization
ALTER TABLE cu_sessions ADD INDEX idx_user_completed (user_id, is_completed);
ALTER TABLE cu_attempts ADD INDEX idx_user_correct (user_id, is_correct);
ALTER TABLE cu_events ADD INDEX idx_event_type (event_type);

-- Comments for documentation
ALTER TABLE cu_users COMMENT = 'Stores user information synchronized with Moodle';
ALTER TABLE cu_sessions COMMENT = 'Tracks individual learning sessions';
ALTER TABLE cu_problems COMMENT = 'Stores generated set union problems';
ALTER TABLE cu_attempts COMMENT = 'Records student attempts and answers';
ALTER TABLE cu_progress COMMENT = 'Aggregated user progress and statistics';
ALTER TABLE cu_events COMMENT = 'Event logging for analytics and debugging';
ALTER TABLE cu_grade_sync COMMENT = 'Synchronizes grades with Moodle gradebook';
