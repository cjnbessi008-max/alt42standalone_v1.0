-- Symmetry Discovery Database Schema
-- Compatible with MySQL 5.7
-- For Moodle 3.7 Integration

-- Database creation (if needed)
-- CREATE DATABASE IF NOT EXISTS symmetry_discovery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE symmetry_discovery;

-- ============================================
-- Table: sym_users
-- Stores user information (links to Moodle users)
-- ============================================
CREATE TABLE IF NOT EXISTS sym_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_user (moodle_user_id),
    INDEX idx_username (username),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_sessions
-- Tracks user sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sym_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    moodle_session_id VARCHAR(255),
    course_id INT,
    activity_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    UNIQUE KEY unique_session (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_progress
-- Stores student progress for each shape
-- ============================================
CREATE TABLE IF NOT EXISTS sym_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    activity_id INT,
    shape_id INT NOT NULL,
    shape_name VARCHAR(100),
    level INT DEFAULT 1,
    discovered_symmetries INT DEFAULT 0,
    total_symmetries INT,
    score INT DEFAULT 0,
    accuracy DECIMAL(5,2),
    completion_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_course_activity (course_id, activity_id),
    INDEX idx_completion (completion_status),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_scores
-- Overall scores and achievements
-- ============================================
CREATE TABLE IF NOT EXISTS sym_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT,
    activity_id INT,
    total_score INT DEFAULT 0,
    high_score INT DEFAULT 0,
    current_level INT DEFAULT 1,
    shapes_completed INT DEFAULT 0,
    total_symmetries_found INT DEFAULT 0,
    average_accuracy DECIMAL(5,2),
    total_time_spent INT DEFAULT 0, -- in seconds
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course_activity (user_id, course_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_high_score (high_score),
    INDEX idx_last_played (last_played),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_events
-- Activity log for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS sym_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(255),
    course_id INT,
    activity_id INT,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_session_id (session_id),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_leaderboard
-- Cached leaderboard data for performance
-- ============================================
CREATE TABLE IF NOT EXISTS sym_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100),
    course_id INT,
    activity_id INT,
    high_score INT NOT NULL,
    shapes_completed INT DEFAULT 0,
    rank_position INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course_activity (user_id, course_id, activity_id),
    INDEX idx_course_activity (course_id, activity_id),
    INDEX idx_high_score (high_score DESC),
    INDEX idx_rank_position (rank_position),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_achievements
-- Student achievements and badges
-- ============================================
CREATE TABLE IF NOT EXISTS sym_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    badge_icon VARCHAR(255),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_type (achievement_type),
    FOREIGN KEY (user_id) REFERENCES sym_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: sym_settings
-- Configuration settings
-- ============================================
CREATE TABLE IF NOT EXISTS sym_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Initial Settings Data
-- ============================================
INSERT INTO sym_settings (setting_key, setting_value, description) VALUES
('app_version', '1.0.0', 'Current application version'),
('max_session_duration', '3600', 'Maximum session duration in seconds'),
('enable_leaderboard', '1', 'Enable/disable leaderboard feature'),
('enable_achievements', '1', 'Enable/disable achievements feature'),
('points_per_symmetry', '100', 'Base points awarded per symmetry discovered'),
('completion_bonus', '500', 'Bonus points for completing all symmetries'),
('hint_penalty', '0', 'Points deducted for using hints'),
('max_hints_per_shape', '3', 'Maximum hints allowed per shape')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Update leaderboard rankings
CREATE PROCEDURE IF NOT EXISTS update_leaderboard_rankings(IN p_course_id INT, IN p_activity_id INT)
BEGIN
    SET @rank := 0;
    UPDATE sym_leaderboard
    SET rank_position = (@rank := @rank + 1)
    WHERE course_id = p_course_id AND activity_id = p_activity_id
    ORDER BY high_score DESC, shapes_completed DESC, last_updated ASC;
END//

-- Get user statistics
CREATE PROCEDURE IF NOT EXISTS get_user_stats(IN p_user_id INT, IN p_course_id INT, IN p_activity_id INT)
BEGIN
    SELECT
        u.id as user_id,
        u.username,
        s.total_score,
        s.high_score,
        s.current_level,
        s.shapes_completed,
        s.total_symmetries_found,
        s.average_accuracy,
        s.total_time_spent,
        s.last_played,
        l.rank_position
    FROM sym_users u
    LEFT JOIN sym_scores s ON u.id = s.user_id AND s.course_id = p_course_id AND s.activity_id = p_activity_id
    LEFT JOIN sym_leaderboard l ON u.id = l.user_id AND l.course_id = p_course_id AND l.activity_id = p_activity_id
    WHERE u.id = p_user_id;
END//

-- Clean expired sessions
CREATE PROCEDURE IF NOT EXISTS clean_expired_sessions()
BEGIN
    UPDATE sym_sessions
    SET is_active = 0
    WHERE expires_at < NOW() AND is_active = 1;
END//

DELIMITER ;

-- ============================================
-- Triggers
-- ============================================

DELIMITER //

-- Update leaderboard when score is updated
CREATE TRIGGER IF NOT EXISTS after_score_update
AFTER UPDATE ON sym_scores
FOR EACH ROW
BEGIN
    IF NEW.high_score != OLD.high_score THEN
        INSERT INTO sym_leaderboard (user_id, username, course_id, activity_id, high_score, shapes_completed)
        SELECT NEW.user_id, u.username, NEW.course_id, NEW.activity_id, NEW.high_score, NEW.shapes_completed
        FROM sym_users u WHERE u.id = NEW.user_id
        ON DUPLICATE KEY UPDATE
            high_score = NEW.high_score,
            shapes_completed = NEW.shapes_completed,
            last_updated = CURRENT_TIMESTAMP;
    END IF;
END//

-- Award achievements based on milestones
CREATE TRIGGER IF NOT EXISTS after_progress_complete
AFTER UPDATE ON sym_progress
FOR EACH ROW
BEGIN
    -- First symmetry discovered
    IF NEW.discovered_symmetries = 1 AND OLD.discovered_symmetries = 0 THEN
        INSERT IGNORE INTO sym_achievements (user_id, achievement_type, achievement_name, achievement_description)
        VALUES (NEW.user_id, 'first_discovery', '첫 발견', '첫 대칭선을 발견했습니다!');
    END IF;

    -- Shape completed
    IF NEW.completion_status = 'completed' AND OLD.completion_status != 'completed' THEN
        INSERT INTO sym_achievements (user_id, achievement_type, achievement_name, achievement_description)
        VALUES (NEW.user_id, 'shape_complete', '도형 완성', NEW.shape_name || '의 모든 대칭선을 발견했습니다!');
    END IF;
END//

DELIMITER ;

-- ============================================
-- Views for Easy Data Access
-- ============================================

-- View: User progress summary
CREATE OR REPLACE VIEW v_user_progress_summary AS
SELECT
    u.id as user_id,
    u.username,
    u.email,
    s.course_id,
    s.activity_id,
    s.total_score,
    s.high_score,
    s.current_level,
    s.shapes_completed,
    s.total_symmetries_found,
    s.average_accuracy,
    COUNT(DISTINCT p.shape_id) as unique_shapes_attempted,
    SUM(CASE WHEN p.completion_status = 'completed' THEN 1 ELSE 0 END) as completed_shapes,
    l.rank_position
FROM sym_users u
LEFT JOIN sym_scores s ON u.id = s.user_id
LEFT JOIN sym_progress p ON u.id = p.user_id AND s.course_id = p.course_id AND s.activity_id = p.activity_id
LEFT JOIN sym_leaderboard l ON u.id = l.user_id AND s.course_id = l.course_id AND s.activity_id = l.activity_id
GROUP BY u.id, u.username, u.email, s.course_id, s.activity_id, s.total_score, s.high_score,
         s.current_level, s.shapes_completed, s.total_symmetries_found, s.average_accuracy, l.rank_position;

-- View: Top performers
CREATE OR REPLACE VIEW v_top_performers AS
SELECT
    l.rank_position,
    u.username,
    l.high_score,
    l.shapes_completed,
    l.course_id,
    l.activity_id,
    l.last_updated
FROM sym_leaderboard l
JOIN sym_users u ON l.user_id = u.id
ORDER BY l.course_id, l.activity_id, l.rank_position
LIMIT 100;

-- ============================================
-- Indexes for Performance Optimization
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_progress_user_course ON sym_progress(user_id, course_id, activity_id);
CREATE INDEX idx_scores_course_activity ON sym_scores(course_id, activity_id);
CREATE INDEX idx_events_user_type ON sym_events(user_id, event_type, timestamp);

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Insert sample user (for testing only)
-- INSERT INTO sym_users (moodle_user_id, username, email)
-- VALUES (1, 'testuser', 'test@example.com');

-- ============================================
-- Database Maintenance
-- ============================================

-- Event to clean expired sessions (runs daily)
-- Requires EVENT scheduler to be enabled: SET GLOBAL event_scheduler = ON;
/*
CREATE EVENT IF NOT EXISTS clean_sessions_daily
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL clean_expired_sessions();
*/

-- ============================================
-- Grants (adjust as needed for security)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON symmetry_discovery.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- Completion Message
-- ============================================
SELECT 'Database schema created successfully!' as message;
