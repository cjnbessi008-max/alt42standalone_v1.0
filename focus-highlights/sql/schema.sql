-- Focus Highlights Database Schema
-- Compatible with MySQL 5.7

-- Users table (synced from Moodle)
CREATE TABLE IF NOT EXISTS fh_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Focus sessions table
CREATE TABLE IF NOT EXISTS fh_focus_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    moodle_activity_id INT,
    session_start DATETIME NOT NULL,
    session_end DATETIME,
    duration_seconds INT DEFAULT 0,
    focus_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score from 0 to 100',
    interaction_count INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_answers INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time DECIMAL(10,2) DEFAULT 0.00 COMMENT 'in seconds',
    is_highlight BOOLEAN DEFAULT FALSE,
    highlight_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES fh_users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, session_start),
    INDEX idx_course (moodle_course_id),
    INDEX idx_highlight (is_highlight),
    INDEX idx_focus_score (focus_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity tracking table (detailed interaction logs)
CREATE TABLE IF NOT EXISTS fh_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'click, keypress, submit, page_view, etc',
    activity_data JSON,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES fh_focus_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES fh_users(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_user_time (user_id, timestamp),
    INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course information cache (from Moodle)
CREATE TABLE IF NOT EXISTS fh_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE,
    course_name VARCHAR(255),
    course_shortname VARCHAR(100),
    category_id INT,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Highlight annotations (comments by teachers or students)
CREATE TABLE IF NOT EXISTS fh_annotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    annotation_text TEXT,
    created_by_role ENUM('student', 'teacher', 'admin'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES fh_focus_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES fh_users(id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- System configuration
CREATE TABLE IF NOT EXISTS fh_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default configuration
INSERT INTO fh_config (config_key, config_value, description) VALUES
('min_focus_duration', '300', 'Minimum duration in seconds to qualify as focused session'),
('min_focus_score', '70', 'Minimum focus score (0-100) to mark as highlight'),
('min_accuracy_rate', '80', 'Minimum accuracy rate (0-100) for highlight'),
('max_response_time', '60', 'Maximum average response time in seconds for highlight'),
('tracking_interval', '5', 'Activity tracking interval in seconds'),
('moodle_url', '', 'Moodle site URL'),
('moodle_token', '', 'Moodle web service token');
