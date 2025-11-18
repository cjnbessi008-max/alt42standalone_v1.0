-- Function Mood Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database Creation
CREATE DATABASE IF NOT EXISTS function_mood
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE function_mood;

-- Table: problems
-- Stores problem information received from Moodle LMS
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    function_expression TEXT NOT NULL,
    domain_min DECIMAL(10, 4) DEFAULT -10.0,
    domain_max DECIMAL(10, 4) DEFAULT 10.0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_problem (moodle_problem_id),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: function_analysis
-- Stores analyzed function characteristics (mood data)
CREATE TABLE IF NOT EXISTS function_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    mood_type VARCHAR(50) NOT NULL, -- 'calm', 'energetic', 'chaotic', 'steady', 'explosive'
    smoothness_score DECIMAL(5, 2) NOT NULL, -- 0-100 scale
    steepness_score DECIMAL(5, 2) NOT NULL, -- 0-100 scale
    variation_score DECIMAL(5, 2) NOT NULL, -- 0-100 scale
    color_code VARCHAR(7) NOT NULL, -- Hex color code
    emotion_label VARCHAR(100), -- Human-readable emotion
    analysis_data JSON, -- Detailed analysis results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_mood_type (mood_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_interactions
-- Tracks student interactions with function mood visualizations
CREATE TABLE IF NOT EXISTS student_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    interaction_type VARCHAR(50), -- 'view', 'zoom', 'analyze', 'compare'
    duration_seconds INT DEFAULT 0,
    interaction_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: mood_configurations
-- Stores configuration for mood-to-color mappings
CREATE TABLE IF NOT EXISTS mood_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mood_type VARCHAR(50) NOT NULL UNIQUE,
    color_code VARCHAR(7) NOT NULL,
    emotion_label VARCHAR(100),
    description TEXT,
    smoothness_min DECIMAL(5, 2),
    smoothness_max DECIMAL(5, 2),
    steepness_min DECIMAL(5, 2),
    steepness_max DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default mood configurations
INSERT INTO mood_configurations
(mood_type, color_code, emotion_label, description, smoothness_min, smoothness_max, steepness_min, steepness_max)
VALUES
    ('calm', '#87CEEB', '평온함 (Calm)', '완만하고 부드러운 변화를 보이는 함수', 70.0, 100.0, 0.0, 30.0),
    ('steady', '#90EE90', '안정적 (Steady)', '일정한 기울기를 유지하는 함수', 50.0, 80.0, 30.0, 60.0),
    ('energetic', '#FFD700', '활발함 (Energetic)', '중간 정도의 변화율을 보이는 함수', 40.0, 70.0, 40.0, 70.0),
    ('dynamic', '#FFA500', '역동적 (Dynamic)', '빠른 변화를 보이는 함수', 30.0, 60.0, 60.0, 85.0),
    ('explosive', '#FF6347', '폭발적 (Explosive)', '급격한 변화를 보이는 함수', 0.0, 40.0, 75.0, 100.0),
    ('chaotic', '#FF1493', '혼돈적 (Chaotic)', '불규칙하고 예측 불가능한 변화', 0.0, 30.0, 80.0, 100.0);

-- Table: lms_sync_log
-- Tracks synchronization with Moodle LMS
CREATE TABLE IF NOT EXISTS lms_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'problem_fetch', 'student_sync', 'grade_export'
    moodle_endpoint VARCHAR(255),
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    records_processed INT DEFAULT 0,
    error_message TEXT,
    sync_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
