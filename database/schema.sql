-- MySQL 5.7 Schema for Shape Guide Lines Generator
-- Database for storing shapes and their guide lines

CREATE DATABASE IF NOT EXISTS shape_guide_lines
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shape_guide_lines;

-- Table for storing shape definitions
CREATE TABLE shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_course_id INT DEFAULT NULL,
    moodle_activity_id INT DEFAULT NULL,
    shape_name VARCHAR(100) NOT NULL,
    shape_type ENUM('triangle', 'quadrilateral', 'polygon', 'circle', 'line', 'custom') NOT NULL,
    vertices JSON NOT NULL COMMENT 'Array of {x, y} coordinates',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_activity (moodle_activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for storing guide lines (parallel and perpendicular lines)
CREATE TABLE guide_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shape_id INT NOT NULL,
    line_type ENUM('parallel', 'perpendicular') NOT NULL,
    reference_line_index INT NOT NULL COMMENT 'Index of the reference edge/line in the shape',
    reference_point_index INT DEFAULT NULL COMMENT 'Index of point for perpendicular lines',
    start_point JSON NOT NULL COMMENT '{x, y} coordinates',
    end_point JSON NOT NULL COMMENT '{x, y} coordinates',
    is_visible BOOLEAN DEFAULT TRUE,
    color VARCHAR(20) DEFAULT '#FF6B6B',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE,
    INDEX idx_shape_id (shape_id),
    INDEX idx_line_type (line_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for storing user preferences
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    auto_generate_parallel BOOLEAN DEFAULT TRUE,
    auto_generate_perpendicular BOOLEAN DEFAULT TRUE,
    parallel_line_color VARCHAR(20) DEFAULT '#4ECDC4',
    perpendicular_line_color VARCHAR(20) DEFAULT '#FF6B6B',
    line_thickness INT DEFAULT 2,
    show_labels BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for activity logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shape_id INT DEFAULT NULL,
    action ENUM('create_shape', 'edit_shape', 'delete_shape', 'generate_guides', 'view_shape') NOT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_shape_id (shape_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default preferences for testing
INSERT INTO user_preferences (user_id) VALUES (1);
