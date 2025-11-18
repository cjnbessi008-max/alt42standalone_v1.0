-- ============================================
-- Similarity Detector Database Schema
-- For Moodle 3.7 Integration
-- MySQL 5.7 Compatible
-- ============================================

-- Problems table: stores math problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_question_type (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Similarity hints table: stores extracted similarity hints
CREATE TABLE IF NOT EXISTS similarity_hints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    hint_type ENUM('shape', 'ratio', 'proportion', 'transformation', 'angle') NOT NULL,
    hint_text TEXT NOT NULL,
    hint_data JSON,
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_hint_type (hint_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Geometric shapes table: stores shape information for similarity detection
CREATE TABLE IF NOT EXISTS geometric_shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    shape_type VARCHAR(50) NOT NULL,
    properties JSON NOT NULL,
    vertices JSON,
    dimensions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_shapes (problem_id),
    INDEX idx_shape_type (shape_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Similarity pairs table: stores detected similar shape pairs
CREATE TABLE IF NOT EXISTS similarity_pairs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    shape1_id INT NOT NULL,
    shape2_id INT NOT NULL,
    similarity_ratio DECIMAL(10,4),
    similarity_type ENUM('congruent', 'similar', 'proportional') NOT NULL,
    transformation_type VARCHAR(50),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (shape1_id) REFERENCES geometric_shapes(id) ON DELETE CASCADE,
    FOREIGN KEY (shape2_id) REFERENCES geometric_shapes(id) ON DELETE CASCADE,
    INDEX idx_problem_pairs (problem_id),
    UNIQUE KEY unique_pair (shape1_id, shape2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table: tracks mobile app sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    problem_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    device_info JSON,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_user_sessions (moodle_user_id),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hint views table: tracks when hints are viewed
CREATE TABLE IF NOT EXISTS hint_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    hint_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT DEFAULT 0,
    was_helpful BOOLEAN DEFAULT NULL,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (hint_id) REFERENCES similarity_hints(id) ON DELETE CASCADE,
    INDEX idx_session_views (session_id),
    INDEX idx_hint_views (hint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detection logs table: stores detection algorithm runs
CREATE TABLE IF NOT EXISTS detection_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    algorithm_version VARCHAR(20) NOT NULL,
    execution_time_ms INT,
    shapes_detected INT DEFAULT 0,
    hints_generated INT DEFAULT 0,
    status ENUM('success', 'partial', 'failed') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_detection_problem (problem_id),
    INDEX idx_detection_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
