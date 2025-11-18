-- Reflection Pair Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Problems table: stores mathematical problems from LMS
CREATE TABLE IF NOT EXISTS rp_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    problem_type ENUM('exponential', 'logarithmic', 'both') DEFAULT 'both',
    difficulty_level TINYINT DEFAULT 1,
    base_number DECIMAL(10, 4) DEFAULT 2.71828,  -- e by default
    x_range_min DECIMAL(10, 4) DEFAULT -5.0,
    x_range_max DECIMAL(10, 4) DEFAULT 5.0,
    show_reflection_line BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User interactions table: tracks student interactions with visualizations
CREATE TABLE IF NOT EXISTS rp_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    interaction_type ENUM('view', 'zoom', 'toggle', 'point_select') NOT NULL,
    interaction_data JSON,  -- MySQL 5.7 supports JSON
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES rp_problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_user_time (moodle_user_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progress tracking table
CREATE TABLE IF NOT EXISTS rp_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    problems_completed INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    mastery_score DECIMAL(5, 2) DEFAULT 0.00,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course (moodle_user_id, moodle_course_id),
    INDEX idx_course_mastery (moodle_course_id, mastery_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO rp_problems (moodle_course_id, moodle_user_id, problem_type, base_number, difficulty_level) VALUES
(1, 1, 'both', 2.71828, 1),  -- Natural exponential/log (e)
(1, 1, 'both', 2.0, 1),       -- Binary exponential/log
(1, 2, 'both', 10.0, 2);      -- Common exponential/log
