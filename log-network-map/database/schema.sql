-- Log Network Map Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database Creation
CREATE DATABASE IF NOT EXISTS log_network_map CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE log_network_map;

-- Concepts Table: Educational concepts/nodes
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    color VARCHAR(7) DEFAULT '#3498db',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relationships Table: Connections between concepts
CREATE TABLE IF NOT EXISTS concept_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_concept_id INT NOT NULL,
    target_concept_id INT NOT NULL,
    relationship_type ENUM('prerequisite', 'related', 'extends', 'applies') DEFAULT 'related',
    strength DECIMAL(3,2) DEFAULT 1.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    INDEX idx_source (source_concept_id),
    INDEX idx_target (target_concept_id),
    UNIQUE KEY unique_relationship (source_concept_id, target_concept_id, relationship_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table: Student information
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    grade_level VARCHAR(50),
    moodle_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_moodle_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning Logs Table: Student interaction logs
CREATE TABLE IF NOT EXISTS learning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    concept_id INT NOT NULL,
    activity_type ENUM('view', 'practice', 'assessment', 'mastery') NOT NULL,
    duration_seconds INT DEFAULT 0,
    score DECIMAL(5,2),
    is_correct BOOLEAN,
    interaction_data JSON,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_concept (concept_id),
    INDEX idx_activity (activity_type),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning Paths Table: Student progression paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    from_concept_id INT NOT NULL,
    to_concept_id INT NOT NULL,
    transition_count INT DEFAULT 1,
    avg_duration_seconds INT,
    success_rate DECIMAL(5,2),
    last_transition_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (from_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (to_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    INDEX idx_student_path (student_id),
    INDEX idx_from_concept (from_concept_id),
    INDEX idx_to_concept (to_concept_id),
    UNIQUE KEY unique_path (student_id, from_concept_id, to_concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle Integration Table: Sync status with Moodle
CREATE TABLE IF NOT EXISTS moodle_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('student', 'concept', 'log') NOT NULL,
    entity_id INT NOT NULL,
    moodle_id INT,
    sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    last_sync_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Network Analytics Table: Aggregated network statistics
CREATE TABLE IF NOT EXISTS network_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_id INT NOT NULL,
    total_views INT DEFAULT 0,
    total_practices INT DEFAULT 0,
    avg_score DECIMAL(5,2),
    mastery_count INT DEFAULT 0,
    centrality_score DECIMAL(5,4),
    popularity_rank INT,
    difficulty_rating DECIMAL(3,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    INDEX idx_concept (concept_id),
    INDEX idx_popularity (popularity_rank),
    INDEX idx_calculated (calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data for Testing
INSERT INTO concepts (name, description, category, difficulty_level, color) VALUES
('분수 기초', '분수의 기본 개념과 표현', 'mathematics', 'beginner', '#3498db'),
('분자와 분모', '분수의 구성 요소 이해', 'mathematics', 'beginner', '#2ecc71'),
('분수 덧셈', '같은 분모를 가진 분수의 덧셈', 'mathematics', 'intermediate', '#e74c3c'),
('분수 뺄셈', '같은 분모를 가진 분수의 뺄셈', 'mathematics', 'intermediate', '#f39c12'),
('통분', '서로 다른 분모를 같게 만들기', 'mathematics', 'advanced', '#9b59b6'),
('약분', '분수를 가장 간단한 형태로 만들기', 'mathematics', 'intermediate', '#1abc9c');

INSERT INTO concept_relationships (source_concept_id, target_concept_id, relationship_type, strength) VALUES
(1, 2, 'prerequisite', 1.00),
(2, 3, 'prerequisite', 0.90),
(2, 4, 'prerequisite', 0.90),
(3, 5, 'prerequisite', 0.80),
(4, 5, 'prerequisite', 0.80),
(1, 6, 'related', 0.70),
(3, 6, 'related', 0.85),
(4, 6, 'related', 0.85);

INSERT INTO students (student_id, name, email, grade_level) VALUES
('STU001', '김철수', 'chulsoo@example.com', '3학년'),
('STU002', '이영희', 'younghee@example.com', '3학년'),
('STU003', '박민수', 'minsoo@example.com', '4학년');
