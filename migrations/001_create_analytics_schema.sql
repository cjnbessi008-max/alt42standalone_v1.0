-- Migration: 001_create_analytics_schema.sql
-- Description: Create PostgreSQL schema for impairment detection analytics
-- Created: 2025-11-18
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search if needed

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Student behavior sessions
-- Groups student interactions into logical session windows
CREATE TABLE behavior_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_user_id INTEGER NOT NULL,
    moodle_course_id INTEGER NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    total_interactions INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    accuracy_rate DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_session_times CHECK (session_end IS NULL OR session_end >= session_start)
);

COMMENT ON TABLE behavior_sessions IS 'Groups student activities into session windows for analysis';
COMMENT ON COLUMN behavior_sessions.is_active IS 'True if session is currently ongoing';

-- Individual student interactions
-- Stores granular interaction data for analysis
CREATE TABLE student_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES behavior_sessions(id) ON DELETE CASCADE,
    moodle_user_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- quiz_answer, page_view, click, navigation
    moodle_context_id INTEGER, -- quiz_id, question_id, page_id, etc.
    moodle_context_type VARCHAR(50), -- quiz, question, course, module
    response_time_ms INTEGER,
    is_correct BOOLEAN,
    is_careless_error BOOLEAN DEFAULT false,
    metadata JSONB, -- Flexible storage for interaction-specific details
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_response_time CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

COMMENT ON TABLE student_interactions IS 'Granular log of all student interactions for behavioral analysis';
COMMENT ON COLUMN student_interactions.interaction_type IS 'Type of interaction: quiz_answer, page_view, click, navigation, etc.';
COMMENT ON COLUMN student_interactions.is_careless_error IS 'True if error appears to be careless rather than conceptual';

-- Impairment assessments
-- Stores calculated impairment scores and their triggers
CREATE TABLE impairment_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES behavior_sessions(id) ON DELETE CASCADE,
    moodle_user_id INTEGER NOT NULL,
    impairment_score DECIMAL(5,2) NOT NULL CHECK (impairment_score BETWEEN 0 AND 100),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    status VARCHAR(20) NOT NULL CHECK (status IN ('optimal', 'early_warning', 'moderate', 'severe')),
    triggers JSONB, -- Array of specific triggers that contributed to score
    recommendation TEXT,
    assessment_window_start TIMESTAMP NOT NULL,
    assessment_window_end TIMESTAMP NOT NULL,
    assessed_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_assessment_window CHECK (assessment_window_end >= assessment_window_start)
);

COMMENT ON TABLE impairment_assessments IS 'Calculated impairment assessments with scores and recommendations';
COMMENT ON COLUMN impairment_assessments.triggers IS 'JSON array of trigger descriptions (e.g., ["Accuracy declined by 25%", "Response time 2.1x slower"])';
COMMENT ON COLUMN impairment_assessments.confidence IS 'Confidence level in assessment (0-1), based on data quantity and quality';

-- Alerts sent to teachers
-- Tracks notifications sent when impairment is detected
CREATE TABLE impairment_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES impairment_assessments(id) ON DELETE CASCADE,
    moodle_user_id INTEGER NOT NULL,
    moodle_teacher_id INTEGER NOT NULL,
    moodle_course_id INTEGER NOT NULL,
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER, -- Teacher who acknowledged
    teacher_notes TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_acknowledgment CHECK (
        (is_acknowledged = false AND acknowledged_at IS NULL) OR
        (is_acknowledged = true AND acknowledged_at IS NOT NULL)
    )
);

COMMENT ON TABLE impairment_alerts IS 'Alerts sent to teachers when impairment is detected';
COMMENT ON COLUMN impairment_alerts.alert_level IS 'Severity: info (FYI), warning (suggest action), critical (immediate action needed)';

-- Student performance baselines
-- Stores average performance metrics per student and activity type
CREATE TABLE student_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_user_id INTEGER NOT NULL,
    moodle_course_id INTEGER,
    activity_type VARCHAR(50) NOT NULL, -- quiz, forum, assignment, etc.
    question_type VARCHAR(50), -- For quizzes: multiple_choice, short_answer, etc.
    avg_accuracy DECIMAL(5,4),
    std_accuracy DECIMAL(5,4),
    avg_response_time_ms INTEGER,
    std_response_time_ms INTEGER,
    avg_hesitation_time_ms INTEGER,
    careless_error_rate DECIMAL(5,4),
    sample_size INTEGER NOT NULL,
    first_recorded TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),

    UNIQUE(moodle_user_id, moodle_course_id, activity_type, question_type),
    CONSTRAINT check_sample_size CHECK (sample_size > 0)
);

COMMENT ON TABLE student_baselines IS 'Baseline performance metrics for each student, used for deviation detection';
COMMENT ON COLUMN student_baselines.sample_size IS 'Number of interactions used to calculate baseline';
COMMENT ON COLUMN student_baselines.careless_error_rate IS 'Historical rate of careless vs. conceptual errors';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Behavior sessions indexes
CREATE INDEX idx_behavior_sessions_user ON behavior_sessions(moodle_user_id);
CREATE INDEX idx_behavior_sessions_course ON behavior_sessions(moodle_course_id);
CREATE INDEX idx_behavior_sessions_active ON behavior_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_behavior_sessions_start ON behavior_sessions(session_start DESC);
CREATE INDEX idx_behavior_sessions_user_active ON behavior_sessions(moodle_user_id, is_active);

-- Student interactions indexes
CREATE INDEX idx_interactions_session ON student_interactions(session_id);
CREATE INDEX idx_interactions_user ON student_interactions(moodle_user_id);
CREATE INDEX idx_interactions_timestamp ON student_interactions(timestamp DESC);
CREATE INDEX idx_interactions_type ON student_interactions(interaction_type);
CREATE INDEX idx_interactions_user_time ON student_interactions(moodle_user_id, timestamp DESC);
CREATE INDEX idx_interactions_session_time ON student_interactions(session_id, timestamp ASC);

-- Impairment assessments indexes
CREATE INDEX idx_assessments_session ON impairment_assessments(session_id);
CREATE INDEX idx_assessments_user ON impairment_assessments(moodle_user_id);
CREATE INDEX idx_assessments_status ON impairment_assessments(status);
CREATE INDEX idx_assessments_time ON impairment_assessments(assessed_at DESC);
CREATE INDEX idx_assessments_user_recent ON impairment_assessments(moodle_user_id, assessed_at DESC);

-- Impairment alerts indexes
CREATE INDEX idx_alerts_assessment ON impairment_alerts(assessment_id);
CREATE INDEX idx_alerts_user ON impairment_alerts(moodle_user_id);
CREATE INDEX idx_alerts_teacher ON impairment_alerts(moodle_teacher_id);
CREATE INDEX idx_alerts_course ON impairment_alerts(moodle_course_id);
CREATE INDEX idx_alerts_acknowledged ON impairment_alerts(is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_alerts_teacher_unack ON impairment_alerts(moodle_teacher_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_alerts_sent ON impairment_alerts(sent_at DESC);

-- Student baselines indexes
CREATE INDEX idx_baselines_user ON student_baselines(moodle_user_id);
CREATE INDEX idx_baselines_course ON student_baselines(moodle_course_id);
CREATE INDEX idx_baselines_user_course ON student_baselines(moodle_user_id, moodle_course_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active sessions with latest assessment
CREATE VIEW v_active_sessions_with_status AS
SELECT
    bs.id AS session_id,
    bs.moodle_user_id,
    bs.moodle_course_id,
    bs.session_start,
    bs.total_interactions,
    bs.accuracy_rate,
    ia.impairment_score,
    ia.status AS impairment_status,
    ia.confidence,
    ia.assessed_at AS last_assessment_time,
    EXTRACT(EPOCH FROM (NOW() - bs.session_start)) AS session_duration_seconds
FROM behavior_sessions bs
LEFT JOIN LATERAL (
    SELECT *
    FROM impairment_assessments
    WHERE session_id = bs.id
    ORDER BY assessed_at DESC
    LIMIT 1
) ia ON true
WHERE bs.is_active = true;

COMMENT ON VIEW v_active_sessions_with_status IS 'Active sessions with their most recent impairment assessment';

-- Teacher alert dashboard view
CREATE VIEW v_teacher_alerts_dashboard AS
SELECT
    ia.id AS alert_id,
    ia.moodle_user_id AS student_id,
    ia.moodle_teacher_id AS teacher_id,
    ia.moodle_course_id AS course_id,
    ia.alert_level,
    ia.message,
    ia.is_acknowledged,
    ia.sent_at,
    ia.acknowledged_at,
    imp.impairment_score,
    imp.status AS impairment_status,
    imp.triggers,
    imp.recommendation,
    bs.session_start,
    EXTRACT(EPOCH FROM (NOW() - bs.session_start)) AS session_duration_seconds
FROM impairment_alerts ia
JOIN impairment_assessments imp ON imp.id = ia.assessment_id
JOIN behavior_sessions bs ON bs.id = imp.session_id
ORDER BY ia.sent_at DESC;

COMMENT ON VIEW v_teacher_alerts_dashboard IS 'Comprehensive alert view for teacher dashboard';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on behavior_sessions
CREATE TRIGGER update_behavior_sessions_updated_at
    BEFORE UPDATE ON behavior_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment interaction count on session
CREATE OR REPLACE FUNCTION increment_session_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE behavior_sessions
    SET total_interactions = total_interactions + 1,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment interaction count
CREATE TRIGGER increment_interaction_count
    AFTER INSERT ON student_interactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_session_interaction_count();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current active session for a user
CREATE OR REPLACE FUNCTION get_active_session(
    p_user_id INTEGER,
    p_course_id INTEGER,
    p_timeout_minutes INTEGER DEFAULT 15
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_session_timeout INTERVAL;
BEGIN
    v_session_timeout := (p_timeout_minutes || ' minutes')::INTERVAL;

    SELECT id INTO v_session_id
    FROM behavior_sessions
    WHERE moodle_user_id = p_user_id
      AND moodle_course_id = p_course_id
      AND is_active = true
      AND (NOW() - updated_at) < v_session_timeout
    ORDER BY session_start DESC
    LIMIT 1;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_session IS 'Get current active session for user, or NULL if no recent session';

-- Function to close inactive sessions
CREATE OR REPLACE FUNCTION close_inactive_sessions(
    p_timeout_minutes INTEGER DEFAULT 15
) RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
    v_session_timeout INTERVAL;
BEGIN
    v_session_timeout := (p_timeout_minutes || ' minutes')::INTERVAL;

    UPDATE behavior_sessions
    SET is_active = false,
        session_end = updated_at
    WHERE is_active = true
      AND (NOW() - updated_at) > v_session_timeout;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION close_inactive_sessions IS 'Close sessions that have been inactive for specified duration';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your environment)
-- ============================================================================

-- Create application user (if needed)
-- CREATE USER impairment_detector WITH PASSWORD 'your_secure_password';

-- Grant permissions to application user
-- GRANT CONNECT ON DATABASE your_database TO impairment_detector;
-- GRANT USAGE ON SCHEMA public TO impairment_detector;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO impairment_detector;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO impairment_detector;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO impairment_detector;

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Uncomment to insert sample data for testing

/*
-- Sample session
INSERT INTO behavior_sessions (moodle_user_id, moodle_course_id, session_start, is_active)
VALUES (12345, 101, NOW() - INTERVAL '30 minutes', true);

-- Sample interactions
INSERT INTO student_interactions (
    session_id, moodle_user_id, interaction_type, moodle_context_id,
    moodle_context_type, response_time_ms, is_correct, timestamp
)
SELECT
    (SELECT id FROM behavior_sessions WHERE moodle_user_id = 12345 ORDER BY session_start DESC LIMIT 1),
    12345,
    'quiz_answer',
    FLOOR(RANDOM() * 100 + 1)::INTEGER,
    'question',
    FLOOR(RANDOM() * 30000 + 5000)::INTEGER,
    RANDOM() > 0.3,
    NOW() - (n || ' minutes')::INTERVAL
FROM generate_series(1, 20) n;

-- Sample baseline
INSERT INTO student_baselines (
    moodle_user_id, moodle_course_id, activity_type,
    avg_accuracy, avg_response_time_ms, sample_size
)
VALUES (12345, 101, 'quiz', 0.8500, 12000, 50);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_create_analytics_schema.sql completed successfully';
    RAISE NOTICE 'Created tables: behavior_sessions, student_interactions, impairment_assessments, impairment_alerts, student_baselines';
    RAISE NOTICE 'Created views: v_active_sessions_with_status, v_teacher_alerts_dashboard';
    RAISE NOTICE 'Created functions: update_updated_at_column, increment_session_interaction_count, get_active_session, close_inactive_sessions';
END $$;
