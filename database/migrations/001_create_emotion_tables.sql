-- Migration: Create Emotional State Tracking Tables
-- Version: 1.0
-- Date: 2025-11-18
-- Description: Database schema for LMS emotion-based color mode system

-- ============================================================================
-- Table: student_emotional_states
-- Purpose: Track detected emotional states and applied color modes
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_emotional_states (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Emotional classification
    detected_emotion VARCHAR(50) NOT NULL
        CHECK (detected_emotion IN ('calm', 'stressed', 'engaged', 'tired')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Applied color mode
    color_mode_applied VARCHAR(50) NOT NULL
        CHECK (color_mode_applied IN ('neutral', 'calming', 'energetic', 'refresh')),

    -- Behavioral indicators (JSONB for flexibility)
    interaction_metrics JSONB NOT NULL,
    /*
    Expected structure:
    {
        "avg_click_interval": 3.2,
        "error_rate": 0.12,
        "task_completion_rate": 0.85,
        "idle_time_seconds": 45,
        "retry_count": 2,
        "session_duration_minutes": 23
    }
    */

    -- User override
    user_override BOOLEAN DEFAULT FALSE,
    manual_mode_selected VARCHAR(50),

    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_emotional_states_student_session
    ON student_emotional_states(student_id, session_id);

CREATE INDEX idx_emotional_states_timestamp
    ON student_emotional_states(timestamp DESC);

CREATE INDEX idx_emotional_states_emotion
    ON student_emotional_states(detected_emotion);

CREATE INDEX idx_emotional_states_color_mode
    ON student_emotional_states(color_mode_applied);

-- ============================================================================
-- Table: behavior_metrics
-- Purpose: Store granular interaction events for emotion detection
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavior_metrics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Interaction details
    event_type VARCHAR(50) NOT NULL
        CHECK (event_type IN ('click', 'scroll', 'input', 'submit', 'error', 'idle', 'focus', 'blur')),
    element_id VARCHAR(255),
    task_id INTEGER,

    -- Timing metrics
    time_since_last_event DECIMAL(10,2), -- seconds
    time_on_element DECIMAL(10,2),

    -- Accuracy metrics
    is_error BOOLEAN DEFAULT FALSE,
    retry_number INTEGER DEFAULT 0,

    -- Context
    page_url TEXT,
    metadata JSONB,

    CONSTRAINT fk_behavior_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_behavior_metrics_student_session_time
    ON behavior_metrics(student_id, session_id, timestamp DESC);

CREATE INDEX idx_behavior_metrics_event_type
    ON behavior_metrics(event_type);

CREATE INDEX idx_behavior_metrics_timestamp
    ON behavior_metrics(timestamp DESC);

-- Partial index for errors only (optimizes error rate queries)
CREATE INDEX idx_behavior_metrics_errors
    ON behavior_metrics(student_id, session_id, timestamp)
    WHERE is_error = TRUE;

-- ============================================================================
-- Table: color_mode_history
-- Purpose: Track color mode changes over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS color_mode_history (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,

    -- Mode change details
    previous_mode VARCHAR(50),
    new_mode VARCHAR(50) NOT NULL
        CHECK (new_mode IN ('neutral', 'calming', 'energetic', 'refresh')),
    change_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Change reason
    trigger_reason VARCHAR(100)
        CHECK (trigger_reason IN (
            'auto_emotion_detection',
            'user_manual',
            'session_start',
            'preference_load',
            'admin_override'
        )),
    emotional_state_at_change VARCHAR(50)
        CHECK (emotional_state_at_change IN ('calm', 'stressed', 'engaged', 'tired')),

    -- Effectiveness tracking
    duration_in_mode INTEGER, -- seconds in previous mode before change
    interactions_during_mode INTEGER,

    CONSTRAINT fk_mode_history_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_color_mode_history_student_session
    ON color_mode_history(student_id, session_id);

CREATE INDEX idx_color_mode_history_timestamp
    ON color_mode_history(change_timestamp DESC);

CREATE INDEX idx_color_mode_history_trigger
    ON color_mode_history(trigger_reason);

-- ============================================================================
-- Table: student_color_preferences
-- Purpose: Store student preferences for color mode system
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_color_preferences (
    student_id INTEGER PRIMARY KEY,

    -- Preference settings
    auto_mode_enabled BOOLEAN DEFAULT TRUE,
    preferred_default_mode VARCHAR(50) DEFAULT 'neutral'
        CHECK (preferred_default_mode IN ('neutral', 'calming', 'energetic', 'refresh')),

    -- Sensitivity settings
    emotion_detection_sensitivity VARCHAR(20) DEFAULT 'medium'
        CHECK (emotion_detection_sensitivity IN ('low', 'medium', 'high')),

    -- Disabled modes (array)
    disabled_modes TEXT[] DEFAULT '{}',

    -- Learning preferences
    allow_data_collection BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_preferences_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Index for preference lookups
CREATE INDEX idx_student_color_preferences_auto_mode
    ON student_color_preferences(auto_mode_enabled);

-- ============================================================================
-- Table: emotion_detection_logs
-- Purpose: Log emotion detection algorithm decisions for debugging/improvement
-- ============================================================================
CREATE TABLE IF NOT EXISTS emotion_detection_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Input metrics
    input_metrics JSONB NOT NULL,

    -- Detection results
    detected_emotion VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2),

    -- Decision details
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    processing_time_ms INTEGER,

    -- All emotion scores (for debugging)
    all_scores JSONB,
    /*
    {
        "calm": 0.45,
        "stressed": 0.82,
        "engaged": 0.30,
        "tired": 0.15
    }
    */

    CONSTRAINT fk_detection_logs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Indexes for analytics and debugging
CREATE INDEX idx_emotion_detection_logs_student_session
    ON emotion_detection_logs(student_id, session_id, timestamp DESC);

CREATE INDEX idx_emotion_detection_logs_timestamp
    ON emotion_detection_logs(timestamp DESC);

-- ============================================================================
-- Views: Aggregated Analytics
-- ============================================================================

-- View: Student emotion summary per session
CREATE OR REPLACE VIEW v_session_emotion_summary AS
SELECT
    student_id,
    session_id,
    COUNT(*) as total_detections,
    MODE() WITHIN GROUP (ORDER BY detected_emotion) as dominant_emotion,
    AVG(confidence_score) as avg_confidence,
    MIN(timestamp) as session_start,
    MAX(timestamp) as session_end,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 60 as session_duration_minutes,
    COUNT(*) FILTER (WHERE detected_emotion = 'stressed') as stressed_count,
    COUNT(*) FILTER (WHERE detected_emotion = 'calm') as calm_count,
    COUNT(*) FILTER (WHERE detected_emotion = 'engaged') as engaged_count,
    COUNT(*) FILTER (WHERE detected_emotion = 'tired') as tired_count
FROM student_emotional_states
GROUP BY student_id, session_id;

-- View: Color mode effectiveness metrics
CREATE OR REPLACE VIEW v_color_mode_effectiveness AS
SELECT
    cmh.student_id,
    cmh.new_mode as color_mode,
    COUNT(*) as times_applied,
    AVG(cmh.duration_in_mode) as avg_duration_seconds,
    AVG(cmh.interactions_during_mode) as avg_interactions,
    COUNT(DISTINCT cmh.session_id) as sessions_used,
    ses.detected_emotion as associated_emotion
FROM color_mode_history cmh
LEFT JOIN student_emotional_states ses
    ON cmh.student_id = ses.student_id
    AND cmh.session_id = ses.session_id
    AND cmh.change_timestamp = ses.timestamp
GROUP BY cmh.student_id, cmh.new_mode, ses.detected_emotion;

-- ============================================================================
-- Functions: Helper functions
-- ============================================================================

-- Function: Get current emotional state for a student
CREATE OR REPLACE FUNCTION get_current_emotional_state(p_student_id INTEGER, p_session_id VARCHAR)
RETURNS TABLE (
    emotion VARCHAR,
    color_mode VARCHAR,
    confidence DECIMAL,
    detected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        detected_emotion,
        color_mode_applied,
        confidence_score,
        timestamp
    FROM student_emotional_states
    WHERE student_id = p_student_id
        AND session_id = p_session_id
    ORDER BY timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate behavior metrics for emotion detection
CREATE OR REPLACE FUNCTION calculate_behavior_metrics(
    p_student_id INTEGER,
    p_session_id VARCHAR,
    p_lookback_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
    avg_click_interval DECIMAL,
    error_rate DECIMAL,
    task_completion_rate DECIMAL,
    idle_time_seconds DECIMAL,
    retry_count INTEGER,
    session_duration_minutes DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_behaviors AS (
        SELECT *
        FROM behavior_metrics
        WHERE student_id = p_student_id
            AND session_id = p_session_id
            AND timestamp > NOW() - (p_lookback_minutes || ' minutes')::INTERVAL
    ),
    click_metrics AS (
        SELECT
            AVG(time_since_last_event) as avg_interval
        FROM recent_behaviors
        WHERE event_type = 'click'
    ),
    error_metrics AS (
        SELECT
            COUNT(*) FILTER (WHERE is_error = TRUE)::DECIMAL /
            NULLIF(COUNT(*)::DECIMAL, 0) as err_rate,
            SUM(retry_number) as total_retries
        FROM recent_behaviors
    ),
    idle_metrics AS (
        SELECT
            SUM(time_since_last_event) FILTER (WHERE event_type = 'idle') as total_idle
        FROM recent_behaviors
    ),
    duration_metrics AS (
        SELECT
            EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 60 as duration_min
        FROM recent_behaviors
    )
    SELECT
        COALESCE((SELECT avg_interval FROM click_metrics), 5.0)::DECIMAL,
        COALESCE((SELECT err_rate FROM error_metrics), 0.0)::DECIMAL,
        0.75::DECIMAL, -- Placeholder: would calculate from task completion data
        COALESCE((SELECT total_idle FROM idle_metrics), 0.0)::DECIMAL,
        COALESCE((SELECT total_retries FROM error_metrics), 0)::INTEGER,
        COALESCE((SELECT duration_min FROM duration_metrics), 0.0)::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- Function: Update timestamp on preferences change
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on student_color_preferences
CREATE TRIGGER trigger_update_preferences_timestamp
    BEFORE UPDATE ON student_color_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp();

-- ============================================================================
-- Seed Data: Default preferences for existing students (if needed)
-- ============================================================================

-- Insert default preferences for students without preferences
-- (Uncomment and adjust based on your students table structure)
/*
INSERT INTO student_color_preferences (student_id, auto_mode_enabled, preferred_default_mode)
SELECT id, TRUE, 'neutral'
FROM students
WHERE id NOT IN (SELECT student_id FROM student_color_preferences)
ON CONFLICT (student_id) DO NOTHING;
*/

-- ============================================================================
-- Data Retention Policy (Optional)
-- ============================================================================

-- Function: Clean old behavior metrics (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_behavior_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM behavior_metrics
    WHERE timestamp < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive old emotional states (keep last 180 days, archive older)
-- Note: Requires archive table creation (not included here)
CREATE OR REPLACE FUNCTION archive_old_emotional_states()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move old records to archive table
    -- (Implementation depends on archive table structure)

    -- For now, just count how many would be archived
    SELECT COUNT(*)
    INTO archived_count
    FROM student_emotional_states
    WHERE timestamp < NOW() - INTERVAL '180 days';

    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE student_emotional_states IS
    'Stores detected emotional states and applied color modes for students during learning sessions';

COMMENT ON TABLE behavior_metrics IS
    'Granular interaction events (clicks, errors, timing) used for emotion detection algorithm';

COMMENT ON TABLE color_mode_history IS
    'Historical log of color mode changes with reasons and effectiveness metrics';

COMMENT ON TABLE student_color_preferences IS
    'Student preferences for emotion-based color mode system (auto-mode, sensitivity, etc.)';

COMMENT ON TABLE emotion_detection_logs IS
    'Detailed logs of emotion detection algorithm decisions for debugging and ML training';

COMMENT ON VIEW v_session_emotion_summary IS
    'Aggregated emotional state summary per student session';

COMMENT ON VIEW v_color_mode_effectiveness IS
    'Color mode effectiveness metrics for analytics and optimization';

-- ============================================================================
-- End of Migration
-- ============================================================================

-- Migration completion log
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_create_emotion_tables completed successfully';
    RAISE NOTICE 'Tables created: student_emotional_states, behavior_metrics, color_mode_history, student_color_preferences, emotion_detection_logs';
    RAISE NOTICE 'Views created: v_session_emotion_summary, v_color_mode_effectiveness';
    RAISE NOTICE 'Functions created: get_current_emotional_state, calculate_behavior_metrics, cleanup_old_behavior_metrics';
END $$;
