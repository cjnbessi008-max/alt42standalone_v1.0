-- ============================================================================
-- Cognitive Pause Tracking Schema for Moodle LMS Integration
-- MySQL 5.7 compatible schema
-- ============================================================================

-- ============================================================================
-- 1. Main Cognitive Pause Events Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS cognitive_pause_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Student & Problem Context
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle user ID',
    course_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle course ID',
    quiz_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle quiz ID',
    question_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle question ID',
    attempt_id BIGINT UNSIGNED NOT NULL COMMENT 'Moodle quiz attempt ID',

    -- Pause Timing
    pause_start_time DATETIME(3) NOT NULL COMMENT 'When pause started (millisecond precision)',
    pause_end_time DATETIME(3) NULL COMMENT 'When pause ended (NULL if ongoing)',
    pause_duration_ms INT UNSIGNED NULL COMMENT 'Duration in milliseconds',

    -- Pause Classification
    pause_type ENUM('thinking', 'confusion', 'distraction', 're_reading', 'unknown')
        DEFAULT 'unknown' COMMENT 'Type of cognitive pause',
    confidence_score DECIMAL(3,2) NULL COMMENT 'Classification confidence (0.00-1.00)',

    -- Context Information
    question_progress INT UNSIGNED NULL COMMENT 'Percentage of question completed (0-100)',
    input_field_id VARCHAR(255) NULL COMMENT 'Which input field was active',
    cursor_position INT UNSIGNED NULL COMMENT 'Cursor position in text field',
    previous_input_length INT UNSIGNED DEFAULT 0 COMMENT 'Characters typed before pause',

    -- Behavior Metadata
    mouse_movements JSON NULL COMMENT 'Mouse movement data during pause',
    scroll_events JSON NULL COMMENT 'Scroll events during pause',
    tab_switches INT UNSIGNED DEFAULT 0 COMMENT 'Number of tab switches during pause',

    -- Problem Difficulty Context
    question_difficulty TINYINT UNSIGNED NULL COMMENT 'Question difficulty level (1-5)',
    student_ability_level DECIMAL(5,2) NULL COMMENT 'Student ability estimate',

    -- Session Information
    session_id VARCHAR(64) NOT NULL COMMENT 'Browser session ID',
    device_type ENUM('desktop', 'tablet', 'mobile') NULL,
    browser VARCHAR(100) NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_user_question (user_id, question_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_pause_start (pause_start_time),
    INDEX idx_pause_type (pause_type),
    INDEX idx_course_quiz (course_id, quiz_id),
    INDEX idx_session (session_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks cognitive pause events during problem-solving';


-- ============================================================================
-- 2. Aggregated Pause Analytics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS cognitive_pause_analytics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Aggregation Context
    user_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    attempt_id BIGINT UNSIGNED NOT NULL,

    -- Pause Statistics
    total_pauses INT UNSIGNED DEFAULT 0 COMMENT 'Total number of pauses',
    total_pause_time_ms BIGINT UNSIGNED DEFAULT 0 COMMENT 'Total time paused',
    avg_pause_duration_ms INT UNSIGNED NULL COMMENT 'Average pause duration',
    max_pause_duration_ms INT UNSIGNED NULL COMMENT 'Longest pause duration',
    min_pause_duration_ms INT UNSIGNED NULL COMMENT 'Shortest pause duration',

    -- Pause Type Distribution
    thinking_pauses INT UNSIGNED DEFAULT 0,
    confusion_pauses INT UNSIGNED DEFAULT 0,
    distraction_pauses INT UNSIGNED DEFAULT 0,
    rereading_pauses INT UNSIGNED DEFAULT 0,

    -- Performance Correlation
    final_answer_correct BOOLEAN NULL,
    time_to_first_pause_ms INT UNSIGNED NULL,
    pauses_before_submission INT UNSIGNED DEFAULT 0,

    -- Cognitive Load Indicators
    cognitive_load_score DECIMAL(5,2) NULL COMMENT 'Estimated cognitive load (0-100)',
    struggle_indicator BOOLEAN DEFAULT FALSE COMMENT 'Flag if student shows signs of struggle',

    -- Timestamps
    first_pause_at DATETIME(3) NULL,
    last_pause_at DATETIME(3) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_unique_attempt_question (user_id, question_id, attempt_id),
    INDEX idx_user (user_id),
    INDEX idx_question (question_id),
    INDEX idx_cognitive_load (cognitive_load_score),
    INDEX idx_struggle (struggle_indicator)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aggregated analytics for cognitive pauses per question attempt';


-- ============================================================================
-- 3. Question-level Pause Patterns (for identifying difficult question areas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_pause_patterns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Question Identification
    question_id BIGINT UNSIGNED NOT NULL,
    quiz_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,

    -- Question Metadata
    question_type VARCHAR(50) NULL COMMENT 'e.g., multichoice, numerical, essay',
    question_text_hash VARCHAR(64) NULL COMMENT 'Hash of question text for change detection',

    -- Aggregated Pause Data (across all students)
    total_attempts INT UNSIGNED DEFAULT 0,
    total_students INT UNSIGNED DEFAULT 0,
    avg_pauses_per_attempt DECIMAL(5,2) NULL,
    avg_total_pause_time_ms BIGINT UNSIGNED NULL,

    -- Difficulty Indicators
    pause_difficulty_score DECIMAL(5,2) NULL COMMENT 'Higher = more pauses = harder question',
    correlation_pause_to_correctness DECIMAL(5,2) NULL COMMENT 'Correlation coefficient',

    -- Common Pause Points (JSON array of input field IDs or text positions)
    common_pause_locations JSON NULL COMMENT 'Where students commonly pause',

    -- Recommendations
    needs_revision BOOLEAN DEFAULT FALSE COMMENT 'Flag if question causes excessive confusion',
    revision_notes TEXT NULL,

    -- Timestamps
    last_analyzed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_unique_question (question_id),
    INDEX idx_quiz (quiz_id),
    INDEX idx_course (course_id),
    INDEX idx_difficulty (pause_difficulty_score),
    INDEX idx_needs_revision (needs_revision)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Question-level pause pattern analysis for identifying difficult questions';


-- ============================================================================
-- 4. Student Cognitive Profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_cognitive_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Student Identification
    user_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,

    -- Overall Pause Behavior
    total_questions_attempted INT UNSIGNED DEFAULT 0,
    avg_pauses_per_question DECIMAL(5,2) NULL,
    avg_pause_duration_ms INT UNSIGNED NULL,

    -- Learning Style Indicators
    quick_thinker BOOLEAN NULL COMMENT 'Few short pauses',
    deep_thinker BOOLEAN NULL COMMENT 'Fewer but longer pauses',
    struggling_learner BOOLEAN NULL COMMENT 'Many confusion pauses',
    distracted_learner BOOLEAN NULL COMMENT 'Many distraction pauses',

    -- Performance Metrics
    avg_cognitive_load DECIMAL(5,2) NULL,
    questions_with_struggle INT UNSIGNED DEFAULT 0,
    improvement_trend ENUM('improving', 'stable', 'declining', 'insufficient_data')
        DEFAULT 'insufficient_data',

    -- Time-based Analysis
    optimal_study_time VARCHAR(20) NULL COMMENT 'e.g., "morning", "afternoon", "evening"',
    avg_session_length_minutes INT UNSIGNED NULL,

    -- Recommendations
    recommended_interventions JSON NULL COMMENT 'Suggested teaching interventions',
    at_risk_flag BOOLEAN DEFAULT FALSE,

    -- Timestamps
    profile_last_updated DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_unique_student_course (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id),
    INDEX idx_at_risk (at_risk_flag),
    INDEX idx_learning_style (quick_thinker, deep_thinker, struggling_learner)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual student cognitive profiles based on pause patterns';


-- ============================================================================
-- 5. Real-time Pause Detection Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS pause_detection_config (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Configuration Scope
    config_name VARCHAR(100) NOT NULL,
    course_id BIGINT UNSIGNED NULL COMMENT 'NULL = global default',
    quiz_id BIGINT UNSIGNED NULL COMMENT 'NULL = course-level or global',

    -- Detection Thresholds
    pause_threshold_ms INT UNSIGNED DEFAULT 3000 COMMENT 'Inactivity time to trigger pause (default 3s)',
    max_pause_duration_ms INT UNSIGNED DEFAULT 300000 COMMENT 'Max pause to track (default 5min)',

    -- Classification Parameters
    thinking_threshold_ms INT UNSIGNED DEFAULT 5000 COMMENT 'Short pause = thinking',
    confusion_threshold_ms INT UNSIGNED DEFAULT 15000 COMMENT 'Long pause = confusion',
    distraction_threshold_ms INT UNSIGNED DEFAULT 30000 COMMENT 'Very long pause = distraction',

    -- Behavior Tracking
    track_mouse_movements BOOLEAN DEFAULT TRUE,
    track_scroll_events BOOLEAN DEFAULT TRUE,
    track_tab_switches BOOLEAN DEFAULT TRUE,

    -- Sampling Rate
    mouse_sample_rate_ms INT UNSIGNED DEFAULT 100 COMMENT 'How often to sample mouse position',

    -- Active Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_config_scope (config_name, course_id, quiz_id),
    INDEX idx_course (course_id),
    INDEX idx_quiz (quiz_id),
    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration for pause detection behavior';


-- ============================================================================
-- 6. Visualization Cache Table (for performance optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pause_visualization_cache (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Cache Key
    cache_key VARCHAR(255) NOT NULL,
    visualization_type ENUM('heatmap', 'timeline', 'distribution', 'comparison') NOT NULL,

    -- Scope
    course_id BIGINT UNSIGNED NULL,
    quiz_id BIGINT UNSIGNED NULL,
    question_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,

    -- Cached Data
    visualization_data JSON NOT NULL COMMENT 'Pre-computed visualization data',
    data_summary TEXT NULL COMMENT 'Human-readable summary',

    -- Cache Metadata
    data_start_date DATE NULL,
    data_end_date DATE NULL,
    record_count INT UNSIGNED NULL,

    -- Cache Management
    expires_at DATETIME NOT NULL,
    is_stale BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE KEY idx_cache_key (cache_key),
    INDEX idx_visualization_type (visualization_type),
    INDEX idx_expires (expires_at),
    INDEX idx_scope (course_id, quiz_id, question_id, user_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cached visualization data for performance';


-- ============================================================================
-- Insert Default Configuration
-- ============================================================================
INSERT INTO pause_detection_config (
    config_name,
    course_id,
    quiz_id,
    pause_threshold_ms,
    thinking_threshold_ms,
    confusion_threshold_ms,
    distraction_threshold_ms
) VALUES (
    'global_default',
    NULL,
    NULL,
    3000,  -- 3 seconds of inactivity triggers pause
    5000,  -- < 5s = thinking
    15000, -- 5-15s = confusion
    30000  -- > 30s = distraction
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Recent pauses with student and question context
CREATE OR REPLACE VIEW v_recent_pause_events AS
SELECT
    cpe.id,
    cpe.user_id,
    cpe.question_id,
    cpe.pause_start_time,
    cpe.pause_duration_ms,
    cpe.pause_type,
    cpe.confidence_score,
    cpe.question_difficulty,
    cpa.total_pauses,
    cpa.cognitive_load_score,
    cpa.struggle_indicator
FROM cognitive_pause_events cpe
LEFT JOIN cognitive_pause_analytics cpa
    ON cpe.user_id = cpa.user_id
    AND cpe.question_id = cpa.question_id
    AND cpe.attempt_id = cpa.attempt_id
WHERE cpe.pause_end_time IS NOT NULL
ORDER BY cpe.pause_start_time DESC
LIMIT 1000;


-- View: Question difficulty ranking based on pauses
CREATE OR REPLACE VIEW v_difficult_questions AS
SELECT
    qpp.question_id,
    qpp.quiz_id,
    qpp.course_id,
    qpp.total_students,
    qpp.avg_pauses_per_attempt,
    qpp.avg_total_pause_time_ms,
    qpp.pause_difficulty_score,
    qpp.needs_revision,
    COUNT(cpe.id) as total_pause_events
FROM question_pause_patterns qpp
LEFT JOIN cognitive_pause_events cpe ON qpp.question_id = cpe.question_id
GROUP BY qpp.question_id
ORDER BY qpp.pause_difficulty_score DESC;


-- View: At-risk students
CREATE OR REPLACE VIEW v_at_risk_students AS
SELECT
    scp.user_id,
    scp.course_id,
    scp.avg_cognitive_load,
    scp.questions_with_struggle,
    scp.improvement_trend,
    scp.at_risk_flag,
    COUNT(cpa.id) as total_attempts,
    AVG(cpa.cognitive_load_score) as recent_avg_cognitive_load
FROM student_cognitive_profiles scp
LEFT JOIN cognitive_pause_analytics cpa ON scp.user_id = cpa.user_id
WHERE scp.at_risk_flag = TRUE
GROUP BY scp.user_id, scp.course_id
ORDER BY scp.avg_cognitive_load DESC;


-- ============================================================================
-- Performance Optimization Indexes
-- ============================================================================

-- Composite index for dashboard queries
ALTER TABLE cognitive_pause_events
ADD INDEX idx_dashboard_query (course_id, quiz_id, pause_start_time);

-- Index for real-time monitoring
ALTER TABLE cognitive_pause_events
ADD INDEX idx_realtime_monitor (session_id, pause_end_time);

-- Index for analytics computation
ALTER TABLE cognitive_pause_analytics
ADD INDEX idx_analytics_compute (user_id, cognitive_load_score, updated_at);
