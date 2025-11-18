-- Hidden Length Application Database Schema
-- MySQL 5.7 Compatible

-- Users table (synchronized with Moodle)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shape categories
CREATE TABLE IF NOT EXISTS shape_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty_level TINYINT DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shapes/Problems table
CREATE TABLE IF NOT EXISTS shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    shape_type ENUM('triangle', 'rectangle', 'square', 'circle', 'polygon', 'composite') NOT NULL,
    shape_data JSON NOT NULL COMMENT 'Stores vertices, dimensions, and properties',
    hidden_length_data JSON NOT NULL COMMENT 'Stores hidden lengths and light beam hints',
    difficulty_level TINYINT DEFAULT 1,
    correct_answer DECIMAL(10, 2) NOT NULL,
    hint_text TEXT,
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES shape_categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shape_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
    attempts_count INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    best_time_seconds INT,
    last_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    mastery_score DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage score 0-100',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_shape (user_id, shape_id),
    INDEX idx_user (user_id),
    INDEX idx_shape (shape_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student attempts/submissions
CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shape_id INT NOT NULL,
    submitted_answer DECIMAL(10, 2) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    hint_used BOOLEAN DEFAULT FALSE,
    light_beam_activated BOOLEAN DEFAULT FALSE,
    interaction_data JSON COMMENT 'Stores user interactions, clicks, path',
    feedback TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_shape (shape_id),
    INDEX idx_correct (is_correct),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle integration logs
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    moodle_course_id INT,
    moodle_activity_id INT,
    sync_type ENUM('grade', 'progress', 'completion') NOT NULL,
    sync_data JSON,
    sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default shape categories
INSERT INTO shape_categories (name, description, difficulty_level, display_order) VALUES
('Basic Triangles', 'Finding hidden sides in right triangles using Pythagorean theorem', 1, 1),
('Rectangles and Squares', 'Finding missing dimensions in rectangles and squares', 1, 2),
('Advanced Triangles', 'Complex triangles with multiple hidden lengths', 2, 3),
('Composite Shapes', 'Shapes made up of multiple basic shapes', 3, 4),
('Circle Elements', 'Finding radii, diameters, and chord lengths', 2, 5);

-- Insert sample shapes
INSERT INTO shapes (category_id, title, description, shape_type, shape_data, hidden_length_data, difficulty_level, correct_answer, hint_text, explanation) VALUES
(1, 'Right Triangle - Find Hypotenuse', 'A right triangle with legs 3 and 4. Find the hypotenuse.', 'triangle',
 '{"vertices": [{"x": 100, "y": 300}, {"x": 100, "y": 100}, {"x": 300, "y": 300}], "sides": {"a": 3, "b": 4, "c": null}, "rightAngle": {"x": 100, "y": 300}}',
 '{"hiddenSide": "c", "lightBeam": {"start": {"x": 100, "y": 100}, "end": {"x": 300, "y": 300}, "color": "#FFD700", "animated": true}, "hints": ["Use Pythagorean theorem: a² + b² = c²", "3² + 4² = ?", "9 + 16 = 25, so c = √25"]}',
 1, 5.00, 'Remember: a² + b² = c² for right triangles', 'Using the Pythagorean theorem: 3² + 4² = 9 + 16 = 25, therefore c = √25 = 5'),

(1, 'Right Triangle - Find Leg', 'A right triangle with hypotenuse 10 and one leg 6. Find the other leg.', 'triangle',
 '{"vertices": [{"x": 100, "y": 300}, {"x": 100, "y": 100}, {"x": 260, "y": 300}], "sides": {"a": 6, "b": null, "c": 10}, "rightAngle": {"x": 100, "y": 300}}',
 '{"hiddenSide": "b", "lightBeam": {"start": {"x": 100, "y": 300}, "end": {"x": 260, "y": 300}, "color": "#00BFFF", "animated": true}, "hints": ["Use a² + b² = c²", "6² + b² = 10²", "36 + b² = 100, so b² = 64"]}',
 1, 8.00, 'Rearrange the Pythagorean theorem: b² = c² - a²', 'Using the Pythagorean theorem: 6² + b² = 10², so 36 + b² = 100, therefore b² = 64 and b = 8');
