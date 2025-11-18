-- Shape Transformer Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Create database
CREATE DATABASE IF NOT EXISTS shape_transformer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shape_transformer;

-- Shapes table: Store different geometric shapes
CREATE TABLE IF NOT EXISTS shapes (
    shape_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('circle', 'square', 'triangle', 'rectangle', 'pentagon', 'hexagon', 'polygon') NOT NULL,
    svg_path TEXT,
    color VARCHAR(20) DEFAULT '#3498db',
    description TEXT,
    mathematical_properties JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transformations table: Store transformation types
CREATE TABLE IF NOT EXISTS transformations (
    transformation_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('rotate', 'scale', 'translate', 'morph', 'skew', 'reflect') NOT NULL,
    description TEXT,
    animation_duration INT DEFAULT 1000 COMMENT 'Duration in milliseconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User interactions table: Track student interactions with shapes
CREATE TABLE IF NOT EXISTS user_interactions (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100),
    shape_id INT,
    transformation_id INT,
    interaction_type ENUM('touch', 'drag', 'pinch', 'rotate', 'tap') NOT NULL,
    start_x DECIMAL(10,2),
    start_y DECIMAL(10,2),
    end_x DECIMAL(10,2),
    end_y DECIMAL(10,2),
    duration_ms INT,
    properties_viewed JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_id) REFERENCES shapes(shape_id) ON DELETE CASCADE,
    FOREIGN KEY (transformation_id) REFERENCES transformations(transformation_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Learning sessions table: Track student learning progress
CREATE TABLE IF NOT EXISTS learning_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_course_id INT,
    moodle_user_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    total_interactions INT DEFAULT 0,
    shapes_explored INT DEFAULT 0,
    properties_learned JSON,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    INDEX idx_user (user_id),
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shape properties table: Store mathematical properties of shapes
CREATE TABLE IF NOT EXISTS shape_properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    shape_id INT NOT NULL,
    property_name VARCHAR(100) NOT NULL,
    property_value TEXT,
    property_type ENUM('geometric', 'algebraic', 'visual', 'computational') DEFAULT 'geometric',
    display_order INT DEFAULT 0,
    is_visible TINYINT(1) DEFAULT 1,
    FOREIGN KEY (shape_id) REFERENCES shapes(shape_id) ON DELETE CASCADE,
    INDEX idx_shape (shape_id),
    INDEX idx_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default shapes
INSERT INTO shapes (name, type, color, description, mathematical_properties) VALUES
('원', 'circle', '#e74c3c', '모든 점이 중심으로부터 같은 거리에 있는 도형', '{"radius": 50, "diameter": 100, "circumference": 314.16, "area": 7853.98}'),
('정사각형', 'square', '#3498db', '네 변의 길이가 모두 같고 네 각이 모두 직각인 도형', '{"side": 100, "perimeter": 400, "area": 10000, "diagonal": 141.42}'),
('정삼각형', 'triangle', '#2ecc71', '세 변의 길이가 모두 같은 삼각형', '{"side": 100, "perimeter": 300, "area": 4330.13, "height": 86.60}'),
('직사각형', 'rectangle', '#f39c12', '마주보는 변의 길이가 같고 네 각이 모두 직각인 도형', '{"width": 120, "height": 80, "perimeter": 400, "area": 9600, "diagonal": 144.22}'),
('오각형', 'pentagon', '#9b59b6', '다섯 개의 변을 가진 다각형', '{"side": 80, "perimeter": 400, "area": 11018.47, "interior_angle": 108}'),
('육각형', 'hexagon', '#1abc9c', '여섯 개의 변을 가진 다각형', '{"side": 70, "perimeter": 420, "area": 12743.96, "interior_angle": 120}');

-- Insert default transformations
INSERT INTO transformations (name, type, description, animation_duration) VALUES
('회전', 'rotate', '도형을 중심점을 기준으로 회전시킵니다', 1500),
('크기 변경', 'scale', '도형의 크기를 확대하거나 축소합니다', 1000),
('이동', 'translate', '도형을 다른 위치로 이동시킵니다', 800),
('형태 변환', 'morph', '한 도형을 다른 도형으로 변형시킵니다', 2000),
('기울이기', 'skew', '도형을 비스듬하게 기울입니다', 1200),
('반사', 'reflect', '도형을 대칭 이동시킵니다', 1000);

-- Insert sample shape properties for circle
INSERT INTO shape_properties (shape_id, property_name, property_value, property_type, display_order) VALUES
(1, '반지름 (r)', '50', 'geometric', 1),
(1, '지름 (d)', 'd = 2r', 'algebraic', 2),
(1, '둘레', 'C = 2πr', 'algebraic', 3),
(1, '넓이', 'A = πr²', 'algebraic', 4),
(1, '대칭성', '무한대칭', 'geometric', 5);

-- Insert sample shape properties for square
INSERT INTO shape_properties (shape_id, property_name, property_value, property_type, display_order) VALUES
(2, '한 변의 길이 (a)', '100', 'geometric', 1),
(2, '둘레', 'P = 4a', 'algebraic', 2),
(2, '넓이', 'A = a²', 'algebraic', 3),
(2, '대각선', 'd = a√2', 'algebraic', 4),
(2, '내각', '90°', 'geometric', 5),
(2, '대칭축', '4개', 'geometric', 6);
