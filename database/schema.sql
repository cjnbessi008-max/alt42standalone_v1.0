-- MySQL 5.7 Compatible Schema
-- Prerequisite Gap Detection System

-- Database creation
CREATE DATABASE IF NOT EXISTS prerequisite_gaps
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE prerequisite_gaps;

-- Table: prerequisite_gaps
-- Stores detected prerequisite knowledge gaps for students
CREATE TABLE IF NOT EXISTS prerequisite_gaps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Moodle user ID',
    course_id INT UNSIGNED NOT NULL COMMENT 'Moodle course ID',
    current_concept VARCHAR(100) NOT NULL COMMENT 'Current concept student is struggling with',
    prerequisite_concept VARCHAR(100) NOT NULL COMMENT 'Prerequisite concept that is missing',
    current_performance DECIMAL(5,2) DEFAULT NULL COMMENT 'Performance on current concept (0-100)',
    prerequisite_performance DECIMAL(5,2) DEFAULT NULL COMMENT 'Performance on prerequisite (0-100)',
    gap_severity ENUM('critical', 'high', 'medium', 'low') NOT NULL COMMENT 'Severity of the gap',
    confidence DECIMAL(3,2) NOT NULL COMMENT 'Confidence score (0-1)',
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When gap was detected',
    metadata JSON DEFAULT NULL COMMENT 'Additional metadata',
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_concept (current_concept, prerequisite_concept),
    INDEX idx_severity (gap_severity, confidence),
    INDEX idx_detected (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores detected prerequisite knowledge gaps';

-- Table: sync_log
-- Tracks synchronization between Moodle and gap detection system
CREATE TABLE IF NOT EXISTS sync_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL COMMENT 'Moodle course ID',
    sync_type ENUM('manual', 'automatic', 'scheduled') NOT NULL COMMENT 'Type of sync',
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Sync start time',
    end_time TIMESTAMP NULL DEFAULT NULL COMMENT 'Sync end time',
    status ENUM('running', 'completed', 'failed') NOT NULL DEFAULT 'running' COMMENT 'Sync status',
    students_analyzed INT UNSIGNED DEFAULT 0 COMMENT 'Number of students analyzed',
    gaps_detected INT UNSIGNED DEFAULT 0 COMMENT 'Number of gaps detected',
    errors INT UNSIGNED DEFAULT 0 COMMENT 'Number of errors encountered',
    error_message TEXT DEFAULT NULL COMMENT 'Error details if failed',
    INDEX idx_course_time (course_id, start_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks Moodle sync operations';

-- Table: concept_map
-- Maps Moodle activities to educational concepts
CREATE TABLE IF NOT EXISTS concept_map (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL COMMENT 'Moodle course ID',
    concept_name VARCHAR(100) NOT NULL COMMENT 'Concept name',
    keywords TEXT NOT NULL COMMENT 'JSON array of keywords to match activities',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_course_concept (course_id, concept_name),
    INDEX idx_concept (concept_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps activities to concepts';

-- Table: prerequisite_rules
-- Defines prerequisite relationships between concepts
CREATE TABLE IF NOT EXISTS prerequisite_rules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED DEFAULT NULL COMMENT 'Course ID (NULL for global rules)',
    current_concept VARCHAR(100) NOT NULL COMMENT 'Current concept',
    prerequisite_concept VARCHAR(100) NOT NULL COMMENT 'Required prerequisite',
    importance ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium' COMMENT 'Importance of this prerequisite',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_concept_prerequisite (course_id, current_concept, prerequisite_concept),
    INDEX idx_current (current_concept),
    INDEX idx_prerequisite (prerequisite_concept)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Defines prerequisite relationships';

-- Table: gap_recommendations
-- Stores recommended interventions for detected gaps
CREATE TABLE IF NOT EXISTS gap_recommendations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gap_id INT UNSIGNED NOT NULL COMMENT 'Reference to prerequisite_gaps.id',
    recommendation_type ENUM('review_material', 'practice_exercises', 'tutorial', 'peer_help', 'teacher_intervention') NOT NULL,
    resource_type ENUM('video', 'article', 'quiz', 'exercise', 'discussion') DEFAULT NULL,
    resource_url VARCHAR(500) DEFAULT NULL COMMENT 'URL to recommended resource',
    resource_title VARCHAR(255) DEFAULT NULL COMMENT 'Title of recommended resource',
    priority INT UNSIGNED DEFAULT 5 COMMENT 'Priority (1=highest, 10=lowest)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gap_id) REFERENCES prerequisite_gaps(id) ON DELETE CASCADE,
    INDEX idx_gap (gap_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Recommended interventions for gaps';

-- Table: student_progress_tracking
-- Tracks student progress on addressing gaps
CREATE TABLE IF NOT EXISTS student_progress_tracking (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gap_id INT UNSIGNED NOT NULL COMMENT 'Reference to prerequisite_gaps.id',
    user_id INT UNSIGNED NOT NULL COMMENT 'Moodle user ID',
    status ENUM('identified', 'acknowledged', 'in_progress', 'resolved', 'persistent') NOT NULL DEFAULT 'identified',
    intervention_started_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When student started working on gap',
    last_activity_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last recorded activity',
    resolved_at TIMESTAMP NULL DEFAULT NULL COMMENT 'When gap was resolved',
    notes TEXT DEFAULT NULL COMMENT 'Teacher or system notes',
    FOREIGN KEY (gap_id) REFERENCES prerequisite_gaps(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_gap (gap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks progress on addressing gaps';

-- Insert sample prerequisite rules for common mathematical concepts
INSERT INTO prerequisite_rules (course_id, current_concept, prerequisite_concept, importance) VALUES
(NULL, 'fractions_multiplication', 'fractions_basic', 'critical'),
(NULL, 'fractions_multiplication', 'multiplication_basic', 'critical'),
(NULL, 'fractions_division', 'fractions_multiplication', 'critical'),
(NULL, 'fractions_division', 'division_basic', 'high'),
(NULL, 'fractions_addition', 'fractions_basic', 'critical'),
(NULL, 'fractions_addition_unlike', 'fractions_addition', 'critical'),
(NULL, 'fractions_addition_unlike', 'lcm_concept', 'high'),
(NULL, 'algebra_equations', 'arithmetic_operations', 'critical'),
(NULL, 'algebra_equations', 'variables_basic', 'critical'),
(NULL, 'algebra_systems', 'algebra_equations', 'critical'),
(NULL, 'geometry_area', 'shapes_basic', 'critical'),
(NULL, 'geometry_area', 'multiplication_basic', 'high'),
(NULL, 'geometry_volume', 'geometry_area', 'critical'),
(NULL, 'geometry_volume', 'multiplication_basic', 'high'),
(NULL, 'calculus_derivatives', 'functions_basic', 'critical'),
(NULL, 'calculus_derivatives', 'limits_concept', 'critical'),
(NULL, 'calculus_integrals', 'calculus_derivatives', 'high');

-- Insert sample concept map keywords
INSERT INTO concept_map (course_id, concept_name, keywords) VALUES
(1, 'fractions_basic', '["fraction", "분수", "numerator", "denominator", "분자", "분모"]'),
(1, 'fractions_multiplication', '["fraction multiply", "분수 곱셈", "multiply fraction"]'),
(1, 'fractions_division', '["fraction divide", "분수 나눗셈", "divide fraction"]'),
(1, 'fractions_addition', '["fraction add", "분수 덧셈", "add fraction"]'),
(1, 'multiplication_basic', '["multiplication", "곱셈", "multiply", "times"]'),
(1, 'division_basic', '["division", "나눗셈", "divide"]'),
(1, 'algebra_equations', '["equation", "방정식", "solve", "풀이"]'),
(1, 'variables_basic', '["variable", "변수", "unknown"]');

-- Create view for gap summary
CREATE OR REPLACE VIEW gap_summary AS
SELECT
    pg.user_id,
    pg.course_id,
    pg.prerequisite_concept,
    pg.gap_severity,
    COUNT(*) as gap_count,
    AVG(pg.confidence) as avg_confidence,
    AVG(pg.prerequisite_performance) as avg_performance,
    MAX(pg.detected_at) as last_detected
FROM prerequisite_gaps pg
GROUP BY pg.user_id, pg.course_id, pg.prerequisite_concept, pg.gap_severity;

-- Create view for course-wide gap analysis
CREATE OR REPLACE VIEW course_gap_analysis AS
SELECT
    pg.course_id,
    pg.prerequisite_concept,
    pg.gap_severity,
    COUNT(DISTINCT pg.user_id) as affected_students,
    COUNT(*) as total_gaps,
    AVG(pg.confidence) as avg_confidence,
    AVG(pg.prerequisite_performance) as avg_performance
FROM prerequisite_gaps pg
GROUP BY pg.course_id, pg.prerequisite_concept, pg.gap_severity
ORDER BY affected_students DESC;

-- Indexes for performance optimization
-- Note: Already defined inline above, but listing here for clarity

-- Additional composite indexes for common queries
CREATE INDEX idx_user_severity_confidence ON prerequisite_gaps(user_id, gap_severity, confidence);
CREATE INDEX idx_course_severity ON prerequisite_gaps(course_id, gap_severity);
CREATE INDEX idx_sync_course_status ON sync_log(course_id, status, start_time);

-- Sample queries for reference

-- Query 1: Get all critical gaps for a student
-- SELECT * FROM prerequisite_gaps
-- WHERE user_id = ? AND gap_severity = 'critical'
-- ORDER BY confidence DESC;

-- Query 2: Get most common gaps in a course
-- SELECT * FROM course_gap_analysis
-- WHERE course_id = ?
-- ORDER BY affected_students DESC;

-- Query 3: Get recent sync history
-- SELECT * FROM sync_log
-- WHERE course_id = ?
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Query 4: Get students with most gaps
-- SELECT user_id, COUNT(*) as gap_count
-- FROM prerequisite_gaps
-- WHERE course_id = ?
-- GROUP BY user_id
-- ORDER BY gap_count DESC;
