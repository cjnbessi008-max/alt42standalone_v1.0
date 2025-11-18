-- Slope Sense Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7

-- Drop tables if they exist
DROP TABLE IF EXISTS slope_user_attempts;
DROP TABLE IF EXISTS slope_problems;
DROP TABLE IF EXISTS slope_sessions;

-- Slope problems table
CREATE TABLE slope_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_activity_id INT NOT NULL,
    problem_type ENUM('two_points', 'line_graph', 'real_world', 'equation') NOT NULL,
    point1_x DECIMAL(10, 2),
    point1_y DECIMAL(10, 2),
    point2_x DECIMAL(10, 2),
    point2_y DECIMAL(10, 2),
    correct_slope DECIMAL(10, 4) NOT NULL,
    difficulty_level TINYINT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    problem_text TEXT,
    hint_text TEXT,
    animation_type ENUM('ball_roll', 'skier', 'car_drive', 'water_flow') DEFAULT 'ball_roll',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_activity (moodle_activity_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table
CREATE TABLE slope_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_active (is_active, last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User attempts table
CREATE TABLE slope_user_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    user_answer DECIMAL(10, 4),
    is_correct BOOLEAN,
    time_spent_seconds INT,
    hints_used INT DEFAULT 0,
    interaction_data JSON,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES slope_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES slope_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    INDEX idx_session (session_id),
    INDEX idx_attempted (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO slope_problems
    (moodle_course_id, moodle_activity_id, problem_type, point1_x, point1_y, point2_x, point2_y, correct_slope, difficulty_level, problem_text, hint_text, animation_type)
VALUES
    (1, 1, 'two_points', 0, 0, 4, 2, 0.5, 1, 'Find the slope between points (0,0) and (4,2)', 'Remember: slope = rise/run = (y2-y1)/(x2-x1)', 'ball_roll'),
    (1, 1, 'two_points', 2, 3, 6, 7, 1.0, 1, 'Find the slope between points (2,3) and (6,7)', 'The rise is 4 and the run is 4', 'skier'),
    (1, 1, 'two_points', 1, 5, 5, 1, -1.0, 2, 'Find the slope between points (1,5) and (5,1)', 'Negative slope means the line goes down', 'ball_roll'),
    (1, 1, 'two_points', 0, 0, 3, 9, 3.0, 2, 'Find the slope between points (0,0) and (3,9)', 'A slope of 3 is quite steep!', 'car_drive'),
    (1, 1, 'two_points', -2, -3, 4, 3, 1.0, 3, 'Find the slope between points (-2,-3) and (4,3)', 'Work with negative coordinates carefully', 'water_flow');
