-- Twin Shape Glow Database Schema
-- Compatible with MySQL 5.7

CREATE DATABASE IF NOT EXISTS twin_shape_glow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE twin_shape_glow;

-- Problems/Questions Table
CREATE TABLE IF NOT EXISTS tsg_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    problem_type ENUM('shape_matching', 'color_sync', 'twin_find') NOT NULL,
    difficulty TINYINT NOT NULL DEFAULT 1,
    shape_config JSON NOT NULL COMMENT 'Shape configurations and positions',
    correct_answer JSON NOT NULL COMMENT 'Correct shape pairs/matches',
    time_limit INT DEFAULT 60 COMMENT 'Time limit in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Progress Table
CREATE TABLE IF NOT EXISTS tsg_user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    attempts INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES tsg_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    INDEX idx_completed (completed),
    UNIQUE KEY unique_user_problem (moodle_user_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS tsg_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    game_data JSON COMMENT 'Session state and interactions',
    FOREIGN KEY (problem_id) REFERENCES tsg_problems(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_active (moodle_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shape Library Table
CREATE TABLE IF NOT EXISTS tsg_shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shape_name VARCHAR(50) NOT NULL,
    shape_type ENUM('circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star') NOT NULL,
    svg_path TEXT NOT NULL COMMENT 'SVG path data',
    default_color VARCHAR(7) DEFAULT '#3498db',
    similarity_group INT COMMENT 'Shapes in same group are similar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_shape_type (shape_type),
    INDEX idx_similarity_group (similarity_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default shapes
INSERT INTO tsg_shapes (shape_name, shape_type, svg_path, default_color, similarity_group) VALUES
('Circle Small', 'circle', 'M 50 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0', '#3498db', 1),
('Circle Large', 'circle', 'M 50 50 m -45, 0 a 45,45 0 1,0 90,0 a 45,45 0 1,0 -90,0', '#3498db', 1),
('Square Small', 'square', 'M 20 20 L 80 20 L 80 80 L 20 80 Z', '#e74c3c', 2),
('Square Large', 'square', 'M 15 15 L 85 15 L 85 85 L 15 85 Z', '#e74c3c', 2),
('Triangle Up', 'triangle', 'M 50 15 L 85 75 L 15 75 Z', '#2ecc71', 3),
('Triangle Down', 'triangle', 'M 50 85 L 85 25 L 15 25 Z', '#2ecc71', 3),
('Pentagon', 'pentagon', 'M 50 10 L 80 40 L 65 75 L 35 75 L 20 40 Z', '#f39c12', 4),
('Hexagon', 'hexagon', 'M 50 15 L 75 30 L 75 60 L 50 75 L 25 60 L 25 30 Z', '#9b59b6', 5),
('Star 5', 'star', 'M 50 15 L 58 40 L 85 40 L 65 55 L 72 80 L 50 65 L 28 80 L 35 55 L 15 40 L 42 40 Z', '#e67e22', 6);
