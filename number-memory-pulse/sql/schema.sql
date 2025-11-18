-- Number Memory Pulse Database Schema
-- Compatible with MySQL 5.7 and Moodle 3.7
-- Created: 2025-11-18

-- ================================================
-- Table: mdl_nmp_problems
-- Purpose: Store number memory pattern problems
-- ================================================
CREATE TABLE IF NOT EXISTS mdl_nmp_problems (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pattern VARCHAR(50) NOT NULL COMMENT 'Number pattern to memorize',
    pattern_length INT(11) NOT NULL DEFAULT 3 COMMENT 'Length of the number pattern',
    difficulty_level INT(11) NOT NULL DEFAULT 1 COMMENT '1=Easy, 2=Medium, 3=Hard, 4=Expert, 5=Master',
    display_duration INT(11) NOT NULL DEFAULT 1000 COMMENT 'Time to show each number in milliseconds',
    max_attempts INT(11) DEFAULT NULL COMMENT 'Max attempts allowed (NULL = unlimited)',
    points INT(11) NOT NULL DEFAULT 10 COMMENT 'Points awarded for correct answer',
    time_limit INT(11) DEFAULT NULL COMMENT 'Time limit in seconds (NULL = no limit)',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by BIGINT(10) UNSIGNED NOT NULL,
    created_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    updated_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    PRIMARY KEY (id),
    KEY idx_course (course_id),
    KEY idx_difficulty (difficulty_level),
    KEY idx_active (is_active),
    KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Number Memory Pulse problems';

-- ================================================
-- Table: mdl_nmp_user_attempts
-- Purpose: Track user attempts and progress
-- ================================================
CREATE TABLE IF NOT EXISTS mdl_nmp_user_attempts (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    user_answer VARCHAR(50) NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    attempt_number INT(11) NOT NULL DEFAULT 1,
    time_spent INT(11) NOT NULL DEFAULT 0 COMMENT 'Time spent in seconds',
    points_earned INT(11) NOT NULL DEFAULT 0,
    attempted_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_problem (problem_id),
    KEY idx_user_problem (user_id, problem_id),
    KEY idx_correct (is_correct),
    KEY idx_attempted (attempted_at),
    CONSTRAINT fk_nmp_attempts_problem FOREIGN KEY (problem_id)
        REFERENCES mdl_nmp_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User attempts for Number Memory Pulse';

-- ================================================
-- Table: mdl_nmp_user_progress
-- Purpose: Track overall user progress and statistics
-- ================================================
CREATE TABLE IF NOT EXISTS mdl_nmp_user_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    current_level INT(11) NOT NULL DEFAULT 1,
    total_score BIGINT(20) NOT NULL DEFAULT 0,
    total_attempts INT(11) NOT NULL DEFAULT 0,
    correct_attempts INT(11) NOT NULL DEFAULT 0,
    current_streak INT(11) NOT NULL DEFAULT 0 COMMENT 'Current consecutive correct answers',
    best_streak INT(11) NOT NULL DEFAULT 0 COMMENT 'Best streak ever achieved',
    total_time_spent BIGINT(20) NOT NULL DEFAULT 0 COMMENT 'Total time in seconds',
    last_played_at BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'Unix timestamp',
    created_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    updated_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_course (user_id, course_id),
    KEY idx_user (user_id),
    KEY idx_course (course_id),
    KEY idx_level (current_level),
    KEY idx_score (total_score),
    KEY idx_last_played (last_played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User progress tracking';

-- ================================================
-- Table: mdl_nmp_leaderboard
-- Purpose: Store leaderboard entries (materialized view for performance)
-- ================================================
CREATE TABLE IF NOT EXISTS mdl_nmp_leaderboard (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    rank_position INT(11) NOT NULL,
    total_score BIGINT(20) NOT NULL,
    current_level INT(11) NOT NULL,
    best_streak INT(11) NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL COMMENT 'Unix timestamp',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_course (user_id, course_id),
    KEY idx_course_rank (course_id, rank_position),
    KEY idx_score (total_score DESC),
    KEY idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Leaderboard rankings';

-- ================================================
-- Table: mdl_nmp_settings
-- Purpose: Store module settings and configuration
-- ================================================
CREATE TABLE IF NOT EXISTS mdl_nmp_settings (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT 'string, int, boolean, json',
    created_at BIGINT(10) UNSIGNED NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_course_setting (course_id, setting_name),
    KEY idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Module settings';

-- ================================================
-- Insert default settings
-- ================================================
INSERT INTO mdl_nmp_settings (course_id, setting_name, setting_value, setting_type, created_at, updated_at) VALUES
(1, 'default_display_duration', '1000', 'int', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'default_difficulty', '1', 'int', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'enable_leaderboard', 'true', 'boolean', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'enable_sound', 'true', 'boolean', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'points_multiplier', '1.0', 'string', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE updated_at = UNIX_TIMESTAMP();

-- ================================================
-- Insert sample problems for testing
-- ================================================
INSERT INTO mdl_nmp_problems (course_id, name, description, pattern, pattern_length, difficulty_level, display_duration, points, created_by, created_at, updated_at) VALUES
-- Level 1: Easy (3 digits)
(1, 'Level 1 - Pattern 1', '3자리 숫자 기억하기', '123', 3, 1, 1500, 10, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 1 - Pattern 2', '3자리 숫자 기억하기', '456', 3, 1, 1500, 10, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 1 - Pattern 3', '3자리 숫자 기억하기', '789', 3, 1, 1500, 10, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),

-- Level 2: Easy-Medium (4 digits)
(1, 'Level 2 - Pattern 1', '4자리 숫자 기억하기', '1234', 4, 2, 1200, 15, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 2 - Pattern 2', '4자리 숫자 기억하기', '5678', 4, 2, 1200, 15, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 2 - Pattern 3', '4자리 숫자 기억하기', '9876', 4, 2, 1200, 15, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),

-- Level 3: Medium (5 digits)
(1, 'Level 3 - Pattern 1', '5자리 숫자 기억하기', '12345', 5, 3, 1000, 20, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 3 - Pattern 2', '5자리 숫자 기억하기', '67890', 5, 3, 1000, 20, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 3 - Pattern 3', '5자리 숫자 기억하기', '24680', 5, 3, 1000, 20, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),

-- Level 4: Hard (6 digits)
(1, 'Level 4 - Pattern 1', '6자리 숫자 기억하기', '123456', 6, 4, 800, 30, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 4 - Pattern 2', '6자리 숫자 기억하기', '987654', 6, 4, 800, 30, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),

-- Level 5: Expert (7+ digits)
(1, 'Level 5 - Pattern 1', '7자리 숫자 기억하기', '1234567', 7, 5, 600, 50, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'Level 5 - Pattern 2', '8자리 숫자 기억하기', '12345678', 8, 5, 500, 75, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE updated_at = UNIX_TIMESTAMP();

-- ================================================
-- Stored Procedures and Functions
-- ================================================

-- Procedure to update leaderboard
DELIMITER //
CREATE PROCEDURE update_leaderboard(IN p_course_id BIGINT)
BEGIN
    -- Clear existing leaderboard for this course
    DELETE FROM mdl_nmp_leaderboard WHERE course_id = p_course_id;

    -- Insert updated rankings
    INSERT INTO mdl_nmp_leaderboard (user_id, course_id, rank_position, total_score, current_level, best_streak, updated_at)
    SELECT
        user_id,
        course_id,
        @rank := @rank + 1 as rank_position,
        total_score,
        current_level,
        best_streak,
        UNIX_TIMESTAMP()
    FROM mdl_nmp_user_progress
    CROSS JOIN (SELECT @rank := 0) r
    WHERE course_id = p_course_id
    ORDER BY total_score DESC, best_streak DESC, current_level DESC
    LIMIT 100;
END //
DELIMITER ;

-- Function to calculate accuracy rate
DELIMITER //
CREATE FUNCTION get_accuracy_rate(p_user_id BIGINT, p_course_id BIGINT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE v_accuracy DECIMAL(5,2);

    SELECT
        CASE
            WHEN total_attempts > 0 THEN (correct_attempts / total_attempts) * 100
            ELSE 0
        END INTO v_accuracy
    FROM mdl_nmp_user_progress
    WHERE user_id = p_user_id AND course_id = p_course_id;

    RETURN IFNULL(v_accuracy, 0);
END //
DELIMITER ;

-- ================================================
-- Indexes for optimization
-- ================================================
-- Additional composite indexes for common queries
CREATE INDEX idx_attempts_user_date ON mdl_nmp_user_attempts(user_id, attempted_at);
CREATE INDEX idx_progress_score_level ON mdl_nmp_user_progress(total_score DESC, current_level DESC);

-- ================================================
-- Views for analytics
-- ================================================
CREATE OR REPLACE VIEW v_nmp_user_stats AS
SELECT
    up.user_id,
    up.course_id,
    up.current_level,
    up.total_score,
    up.total_attempts,
    up.correct_attempts,
    CASE
        WHEN up.total_attempts > 0 THEN ROUND((up.correct_attempts / up.total_attempts) * 100, 2)
        ELSE 0
    END as accuracy_percentage,
    up.current_streak,
    up.best_streak,
    up.total_time_spent,
    CASE
        WHEN up.total_attempts > 0 THEN ROUND(up.total_time_spent / up.total_attempts, 2)
        ELSE 0
    END as avg_time_per_attempt,
    up.last_played_at,
    up.created_at
FROM mdl_nmp_user_progress up;

-- ================================================
-- Triggers for automatic updates
-- ================================================
DELIMITER //

-- Trigger to update user progress after each attempt
CREATE TRIGGER trg_after_attempt_insert
AFTER INSERT ON mdl_nmp_user_attempts
FOR EACH ROW
BEGIN
    DECLARE v_course_id BIGINT;
    DECLARE v_current_streak INT;
    DECLARE v_best_streak INT;

    -- Get course_id from problem
    SELECT course_id INTO v_course_id FROM mdl_nmp_problems WHERE id = NEW.problem_id;

    -- Update or insert user progress
    INSERT INTO mdl_nmp_user_progress (
        user_id, course_id, total_attempts, correct_attempts,
        total_score, total_time_spent, current_streak, best_streak,
        last_played_at, created_at, updated_at
    ) VALUES (
        NEW.user_id, v_course_id, 1,
        IF(NEW.is_correct = 1, 1, 0),
        NEW.points_earned, NEW.time_spent,
        IF(NEW.is_correct = 1, 1, 0),
        IF(NEW.is_correct = 1, 1, 0),
        NEW.attempted_at, NEW.attempted_at, NEW.attempted_at
    )
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + IF(NEW.is_correct = 1, 1, 0),
        total_score = total_score + NEW.points_earned,
        total_time_spent = total_time_spent + NEW.time_spent,
        current_streak = IF(NEW.is_correct = 1, current_streak + 1, 0),
        best_streak = GREATEST(best_streak, IF(NEW.is_correct = 1, current_streak + 1, 0)),
        last_played_at = NEW.attempted_at,
        updated_at = NEW.attempted_at;
END //

DELIMITER ;
