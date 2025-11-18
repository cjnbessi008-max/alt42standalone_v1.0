-- Heavy Term Database Schema for MySQL 5.7
-- Integrates with Moodle 3.7 for LMS functionality

-- Database creation
CREATE DATABASE IF NOT EXISTS heavy_term CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE heavy_term;

-- Table: heavy_term_problems
-- Stores problem information received from Moodle LMS
CREATE TABLE IF NOT EXISTS heavy_term_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    moodle_quiz_id INT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: heavy_term_terms
-- Stores individual terms with their weight/size for gravity calculation
CREATE TABLE IF NOT EXISTS heavy_term_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    term_text VARCHAR(255) NOT NULL,
    term_value DECIMAL(15,4) NULL,
    term_size INT NOT NULL DEFAULT 1 COMMENT 'Size of term (1-10), affects gravity strength',
    term_weight DECIMAL(10,2) NOT NULL DEFAULT 1.0 COMMENT 'Weight for gravity calculation',
    position_x INT NULL,
    position_y INT NULL,
    velocity_x DECIMAL(8,2) DEFAULT 0,
    velocity_y DECIMAL(8,2) DEFAULT 0,
    is_answer TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES heavy_term_problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_term_size (term_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: heavy_term_user_sessions
-- Tracks user interaction sessions
CREATE TABLE IF NOT EXISTS heavy_term_user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    device_type ENUM('smartphone', 'tablet', 'desktop') DEFAULT 'smartphone',
    FOREIGN KEY (problem_id) REFERENCES heavy_term_problems(id) ON DELETE CASCADE,
    INDEX idx_user_id (moodle_user_id),
    INDEX idx_active_sessions (is_active, session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: heavy_term_interactions
-- Logs user interactions with terms (drag, tap, etc.)
CREATE TABLE IF NOT EXISTS heavy_term_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    term_id INT NOT NULL,
    interaction_type ENUM('tap', 'drag', 'drop', 'release', 'collision') NOT NULL,
    position_x INT NULL,
    position_y INT NULL,
    interaction_data JSON NULL COMMENT 'Additional interaction metadata',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES heavy_term_user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES heavy_term_terms(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: heavy_term_answers
-- Stores submitted answers
CREATE TABLE IF NOT EXISTS heavy_term_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    answer_data JSON NOT NULL COMMENT 'Submitted answer details',
    is_correct TINYINT(1) NULL,
    score DECIMAL(5,2) NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES heavy_term_user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES heavy_term_problems(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: heavy_term_settings
-- Global settings for gravity and physics parameters
CREATE TABLE IF NOT EXISTS heavy_term_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default physics settings
INSERT INTO heavy_term_settings (setting_key, setting_value, setting_type, description) VALUES
('gravity_strength', '9.8', 'number', 'Base gravity acceleration (pixels per second squared)'),
('gravity_multiplier', '2.0', 'number', 'Multiplier for term size effect on gravity'),
('bounce_damping', '0.7', 'number', 'Energy loss on collision (0-1)'),
('friction_coefficient', '0.98', 'number', 'Friction factor for movement (0-1)'),
('max_velocity', '500', 'number', 'Maximum velocity for terms (pixels per second)'),
('smartphone_width', '375', 'number', 'Virtual smartphone screen width (pixels)'),
('smartphone_height', '667', 'number', 'Virtual smartphone screen height (pixels)'),
('enable_collisions', 'true', 'boolean', 'Enable term-to-term collision detection'),
('enable_gravity', 'true', 'boolean', 'Enable gravity effect')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- View: active_problems_with_terms
-- Convenient view for fetching active problems with their terms
CREATE OR REPLACE VIEW v_active_problems_with_terms AS
SELECT
    p.id as problem_id,
    p.moodle_question_id,
    p.question_text,
    p.question_type,
    p.difficulty_level,
    t.id as term_id,
    t.term_text,
    t.term_size,
    t.term_weight,
    t.position_x,
    t.position_y
FROM heavy_term_problems p
LEFT JOIN heavy_term_terms t ON p.id = t.problem_id
ORDER BY p.id, t.term_size DESC;

-- View: user_session_summary
-- Summary of user sessions and performance
CREATE OR REPLACE VIEW v_user_session_summary AS
SELECT
    s.id as session_id,
    s.moodle_user_id,
    p.question_text,
    s.session_start,
    s.session_end,
    TIMESTAMPDIFF(SECOND, s.session_start, COALESCE(s.session_end, NOW())) as duration_seconds,
    COUNT(DISTINCT i.id) as interaction_count,
    a.is_correct,
    a.score
FROM heavy_term_user_sessions s
JOIN heavy_term_problems p ON s.problem_id = p.id
LEFT JOIN heavy_term_interactions i ON s.id = i.session_id
LEFT JOIN heavy_term_answers a ON s.id = a.session_id
GROUP BY s.id, s.moodle_user_id, p.question_text, s.session_start, s.session_end, a.is_correct, a.score;
