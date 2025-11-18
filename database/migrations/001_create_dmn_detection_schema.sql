-- Migration: Create DMN Detection and Rest Recommendation Schema
-- Version: 001
-- Description: Database schema for monitoring student engagement, detecting DMN activation,
--              and providing personalized break recommendations
-- Date: 2025-11-18

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: student_engagement_sessions
-- Description: Tracks individual learning sessions with engagement metrics
-- =============================================================================
CREATE TABLE student_engagement_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    total_interactions INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    dmn_score_max DECIMAL(5,2),
    dmn_score_avg DECIMAL(5,2),
    breaks_taken INTEGER DEFAULT 0,
    session_quality_score DECIMAL(5,2),
    lms_source VARCHAR(50),
    lms_session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_duration CHECK (duration_minutes >= 0),
    CONSTRAINT check_error_rate CHECK (error_rate BETWEEN 0 AND 1),
    CONSTRAINT check_dmn_scores CHECK (
        (dmn_score_max IS NULL OR dmn_score_max BETWEEN 0 AND 1) AND
        (dmn_score_avg IS NULL OR dmn_score_avg BETWEEN 0 AND 1)
    ),
    CONSTRAINT check_quality_score CHECK (
        session_quality_score IS NULL OR session_quality_score BETWEEN 0 AND 1
    )
);

-- Indexes for efficient querying
CREATE INDEX idx_sessions_student ON student_engagement_sessions(student_id);
CREATE INDEX idx_sessions_module ON student_engagement_sessions(module_id);
CREATE INDEX idx_sessions_started_at ON student_engagement_sessions(started_at DESC);
CREATE INDEX idx_sessions_active ON student_engagement_sessions(student_id, ended_at)
    WHERE ended_at IS NULL;

COMMENT ON TABLE student_engagement_sessions IS 'Tracks student learning sessions with cognitive engagement metrics';
COMMENT ON COLUMN student_engagement_sessions.dmn_score_max IS 'Maximum DMN activation score during session (0-1, higher = more fatigued)';
COMMENT ON COLUMN student_engagement_sessions.session_quality_score IS 'Overall session quality metric (0-1, higher = better)';

-- =============================================================================
-- Table: cognitive_activity_logs
-- Description: Detailed log of student interactions and cognitive state indicators
-- =============================================================================
CREATE TABLE cognitive_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    is_correct BOOLEAN,
    idle_duration_seconds INTEGER,
    content_position DECIMAL(5,2),
    interaction_quality DECIMAL(5,2),
    window_focus_status BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_content_position CHECK (
        content_position IS NULL OR content_position BETWEEN 0 AND 1
    ),
    CONSTRAINT check_interaction_quality CHECK (
        interaction_quality IS NULL OR interaction_quality BETWEEN 0 AND 1
    ),
    CONSTRAINT check_idle_duration CHECK (
        idle_duration_seconds IS NULL OR idle_duration_seconds >= 0
    )
);

-- Indexes for time-series queries
CREATE INDEX idx_activity_logs_session ON cognitive_activity_logs(session_id);
CREATE INDEX idx_activity_logs_timestamp ON cognitive_activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_student_time ON cognitive_activity_logs(student_id, timestamp DESC);
CREATE INDEX idx_activity_logs_event_type ON cognitive_activity_logs(event_type);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_activity_logs_metadata ON cognitive_activity_logs USING GIN (metadata);

COMMENT ON TABLE cognitive_activity_logs IS 'Detailed log of student interactions for DMN detection analysis';
COMMENT ON COLUMN cognitive_activity_logs.event_type IS 'Event types: click, submit, scroll, focus_loss, idle, navigation, error';
COMMENT ON COLUMN cognitive_activity_logs.interaction_quality IS 'Calculated quality of interaction (0-1, based on speed, accuracy, pattern)';

-- =============================================================================
-- Table: dmn_detection_scores
-- Description: Calculated DMN activation scores and fatigue levels
-- =============================================================================
CREATE TABLE dmn_detection_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    dmn_score DECIMAL(5,2) NOT NULL,
    interaction_slowdown_score DECIMAL(5,2),
    error_rate_score DECIMAL(5,2),
    study_duration_score DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    idle_time_score DECIMAL(5,2),
    fatigue_level VARCHAR(20) NOT NULL,
    recommendation_triggered BOOLEAN DEFAULT FALSE,
    algorithm_version VARCHAR(10) DEFAULT '1.0',
    component_weights JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_dmn_score CHECK (dmn_score BETWEEN 0 AND 1),
    CONSTRAINT check_component_scores CHECK (
        (interaction_slowdown_score IS NULL OR interaction_slowdown_score BETWEEN 0 AND 1) AND
        (error_rate_score IS NULL OR error_rate_score BETWEEN 0 AND 1) AND
        (study_duration_score IS NULL OR study_duration_score BETWEEN 0 AND 1) AND
        (engagement_score IS NULL OR engagement_score BETWEEN 0 AND 1) AND
        (idle_time_score IS NULL OR idle_time_score BETWEEN 0 AND 1)
    ),
    CONSTRAINT check_fatigue_level CHECK (
        fatigue_level IN ('active', 'mild', 'moderate', 'high', 'critical')
    )
);

-- Indexes for DMN score analysis
CREATE INDEX idx_dmn_scores_session ON dmn_detection_scores(session_id);
CREATE INDEX idx_dmn_scores_student ON dmn_detection_scores(student_id);
CREATE INDEX idx_dmn_scores_calculated_at ON dmn_detection_scores(calculated_at DESC);
CREATE INDEX idx_dmn_scores_fatigue ON dmn_detection_scores(fatigue_level);
CREATE INDEX idx_dmn_scores_high_fatigue ON dmn_detection_scores(student_id, dmn_score DESC)
    WHERE dmn_score >= 0.65;

COMMENT ON TABLE dmn_detection_scores IS 'DMN activation scores calculated from cognitive activity patterns';
COMMENT ON COLUMN dmn_detection_scores.dmn_score IS 'Composite DMN activation score (0-1, higher = more fatigued)';
COMMENT ON COLUMN dmn_detection_scores.algorithm_version IS 'Version of DMN detection algorithm used';

-- =============================================================================
-- Table: break_recommendations
-- Description: Break recommendations generated and student responses
-- =============================================================================
CREATE TABLE break_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_engagement_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    dmn_score_id UUID REFERENCES dmn_detection_scores(id) ON DELETE SET NULL,
    recommended_at TIMESTAMP NOT NULL DEFAULT NOW(),
    break_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    urgency_level VARCHAR(20) NOT NULL,
    activities JSONB,
    motivational_message TEXT,
    student_response VARCHAR(20) DEFAULT 'pending',
    responded_at TIMESTAMP,
    break_started_at TIMESTAMP,
    break_ended_at TIMESTAMP,
    actual_duration_minutes INTEGER,
    effectiveness_rating INTEGER,
    effectiveness_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_duration CHECK (duration_minutes > 0 AND duration_minutes <= 60),
    CONSTRAINT check_actual_duration CHECK (
        actual_duration_minutes IS NULL OR actual_duration_minutes >= 0
    ),
    CONSTRAINT check_urgency CHECK (
        urgency_level IN ('low', 'moderate', 'high', 'critical')
    ),
    CONSTRAINT check_student_response CHECK (
        student_response IN ('pending', 'accepted', 'deferred', 'dismissed', 'expired')
    ),
    CONSTRAINT check_effectiveness_rating CHECK (
        effectiveness_rating IS NULL OR effectiveness_rating BETWEEN 1 AND 5
    ),
    CONSTRAINT check_break_times CHECK (
        break_started_at IS NULL OR break_started_at >= recommended_at
    )
);

-- Indexes for recommendation analysis
CREATE INDEX idx_recommendations_student ON break_recommendations(student_id);
CREATE INDEX idx_recommendations_session ON break_recommendations(session_id);
CREATE INDEX idx_recommendations_recommended_at ON break_recommendations(recommended_at DESC);
CREATE INDEX idx_recommendations_response ON break_recommendations(student_response);
CREATE INDEX idx_recommendations_pending ON break_recommendations(student_id, student_response)
    WHERE student_response = 'pending';

-- GIN index for activity suggestions
CREATE INDEX idx_recommendations_activities ON break_recommendations USING GIN (activities);

COMMENT ON TABLE break_recommendations IS 'Break recommendations generated based on DMN detection';
COMMENT ON COLUMN break_recommendations.break_type IS 'Types: micro_break, active_rest, scheduled_break, extended_rest';
COMMENT ON COLUMN break_recommendations.effectiveness_rating IS 'Student-reported effectiveness (1-5 scale)';

-- =============================================================================
-- Table: lms_integration_logs
-- Description: Logs of activity events received from LMS platforms
-- =============================================================================
CREATE TABLE lms_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_source VARCHAR(50) NOT NULL,
    lms_user_id VARCHAR(255) NOT NULL,
    student_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    processing_error TEXT,
    mapped_activity_log_id UUID REFERENCES cognitive_activity_logs(id),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_processed_at CHECK (
        (processed = FALSE AND processed_at IS NULL) OR
        (processed = TRUE AND processed_at IS NOT NULL)
    )
);

-- Indexes for LMS integration
CREATE INDEX idx_lms_logs_student ON lms_integration_logs(student_id);
CREATE INDEX idx_lms_logs_lms_user ON lms_integration_logs(lms_source, lms_user_id);
CREATE INDEX idx_lms_logs_processed ON lms_integration_logs(processed, created_at);
CREATE INDEX idx_lms_logs_event_timestamp ON lms_integration_logs(event_timestamp DESC);

-- GIN index for payload queries
CREATE INDEX idx_lms_logs_payload ON lms_integration_logs USING GIN (payload);

COMMENT ON TABLE lms_integration_logs IS 'Activity events received from LMS platforms (Canvas, Moodle, etc.)';
COMMENT ON COLUMN lms_integration_logs.lms_source IS 'Source LMS: canvas, moodle, blackboard, custom';

-- =============================================================================
-- Table: student_rest_preferences
-- Description: Student-specific preferences for break recommendations
-- =============================================================================
CREATE TABLE student_rest_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE,
    preferred_break_duration INTEGER DEFAULT 5,
    break_notification_enabled BOOLEAN DEFAULT TRUE,
    preferred_break_activities JSONB,
    dmn_detection_sensitivity DECIMAL(3,1) DEFAULT 1.0,
    study_session_target_minutes INTEGER DEFAULT 25,
    break_interval_minutes INTEGER DEFAULT 25,
    quiet_hours JSONB,
    notification_sound_enabled BOOLEAN DEFAULT TRUE,
    auto_accept_urgent_breaks BOOLEAN DEFAULT FALSE,
    share_data_for_research BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_break_duration CHECK (
        preferred_break_duration BETWEEN 1 AND 30
    ),
    CONSTRAINT check_sensitivity CHECK (
        dmn_detection_sensitivity BETWEEN 0.5 AND 2.0
    ),
    CONSTRAINT check_targets CHECK (
        study_session_target_minutes BETWEEN 10 AND 120 AND
        break_interval_minutes BETWEEN 10 AND 60
    )
);

-- Index for quick preference lookups
CREATE INDEX idx_preferences_student ON student_rest_preferences(student_id);

COMMENT ON TABLE student_rest_preferences IS 'Student-specific preferences for DMN detection and break recommendations';
COMMENT ON COLUMN student_rest_preferences.dmn_detection_sensitivity IS 'Sensitivity multiplier (0.5-2.0, 1.0=default)';
COMMENT ON COLUMN student_rest_preferences.quiet_hours IS 'JSON array of time ranges when breaks should not be suggested';

-- =============================================================================
-- Table: break_effectiveness_analytics
-- Description: Aggregated analytics on break effectiveness
-- =============================================================================
CREATE TABLE break_effectiveness_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    total_breaks_recommended INTEGER DEFAULT 0,
    total_breaks_accepted INTEGER DEFAULT 0,
    total_breaks_dismissed INTEGER DEFAULT 0,
    avg_dmn_score_before_break DECIMAL(5,2),
    avg_dmn_score_after_break DECIMAL(5,2),
    avg_break_duration_minutes DECIMAL(5,1),
    avg_effectiveness_rating DECIMAL(3,1),
    most_effective_break_type VARCHAR(50),
    preferred_break_time VARCHAR(20),
    break_adherence_score DECIMAL(5,2),
    cognitive_improvement_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_period CHECK (analysis_period_end >= analysis_period_start),
    CONSTRAINT check_break_counts CHECK (
        total_breaks_recommended >= 0 AND
        total_breaks_accepted >= 0 AND
        total_breaks_dismissed >= 0 AND
        total_breaks_accepted + total_breaks_dismissed <= total_breaks_recommended
    ),
    CONSTRAINT check_dmn_scores_analytics CHECK (
        (avg_dmn_score_before_break IS NULL OR avg_dmn_score_before_break BETWEEN 0 AND 1) AND
        (avg_dmn_score_after_break IS NULL OR avg_dmn_score_after_break BETWEEN 0 AND 1)
    ),
    CONSTRAINT check_effectiveness CHECK (
        avg_effectiveness_rating IS NULL OR avg_effectiveness_rating BETWEEN 1 AND 5
    ),
    CONSTRAINT unique_student_period UNIQUE (student_id, analysis_period_start, analysis_period_end)
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_student ON break_effectiveness_analytics(student_id);
CREATE INDEX idx_analytics_period ON break_effectiveness_analytics(analysis_period_end DESC);

COMMENT ON TABLE break_effectiveness_analytics IS 'Aggregated analytics on break recommendation effectiveness per student';

-- =============================================================================
-- Views
-- =============================================================================

-- View: Active sessions with current DMN status
CREATE VIEW active_sessions_with_dmn AS
SELECT
    s.id AS session_id,
    s.student_id,
    s.module_id,
    s.started_at,
    EXTRACT(EPOCH FROM (NOW() - s.started_at))/60 AS session_duration_minutes,
    s.total_interactions,
    s.avg_response_time_ms,
    s.error_rate,
    d.dmn_score AS current_dmn_score,
    d.fatigue_level AS current_fatigue_level,
    d.calculated_at AS dmn_last_calculated,
    (
        SELECT COUNT(*)
        FROM break_recommendations br
        WHERE br.session_id = s.id AND br.student_response = 'accepted'
    ) AS breaks_taken
FROM student_engagement_sessions s
LEFT JOIN LATERAL (
    SELECT *
    FROM dmn_detection_scores
    WHERE session_id = s.id
    ORDER BY calculated_at DESC
    LIMIT 1
) d ON TRUE
WHERE s.ended_at IS NULL;

COMMENT ON VIEW active_sessions_with_dmn IS 'Real-time view of active learning sessions with current DMN status';

-- View: Break recommendation summary
CREATE VIEW break_recommendation_summary AS
SELECT
    br.student_id,
    br.session_id,
    COUNT(*) AS total_recommendations,
    SUM(CASE WHEN br.student_response = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
    SUM(CASE WHEN br.student_response = 'dismissed' THEN 1 ELSE 0 END) AS dismissed_count,
    SUM(CASE WHEN br.student_response = 'deferred' THEN 1 ELSE 0 END) AS deferred_count,
    AVG(CASE WHEN br.effectiveness_rating IS NOT NULL THEN br.effectiveness_rating END) AS avg_effectiveness,
    AVG(br.duration_minutes) AS avg_recommended_duration,
    AVG(CASE WHEN br.actual_duration_minutes IS NOT NULL THEN br.actual_duration_minutes END) AS avg_actual_duration
FROM break_recommendations br
GROUP BY br.student_id, br.session_id;

COMMENT ON VIEW break_recommendation_summary IS 'Summary statistics of break recommendations per session';

-- =============================================================================
-- Functions
-- =============================================================================

-- Function: Calculate acceptance rate for a student
CREATE OR REPLACE FUNCTION calculate_break_acceptance_rate(p_student_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_acceptance_rate DECIMAL(5,2);
BEGIN
    SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE student_response = 'accepted')::DECIMAL / COUNT(*)) * 100
        END
    INTO v_acceptance_rate
    FROM break_recommendations
    WHERE student_id = p_student_id
        AND student_response != 'pending';

    RETURN COALESCE(v_acceptance_rate, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_break_acceptance_rate IS 'Calculate percentage of break recommendations accepted by student';

-- Function: Update session statistics
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session statistics when activity log is inserted
    UPDATE student_engagement_sessions
    SET
        total_interactions = total_interactions + 1,
        updated_at = NOW()
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update session on activity log insert
CREATE TRIGGER trigger_update_session_stats
AFTER INSERT ON cognitive_activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_statistics();

-- Function: Update preference timestamp
CREATE OR REPLACE FUNCTION update_preference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update preference updated_at
CREATE TRIGGER trigger_update_preference_timestamp
BEFORE UPDATE ON student_rest_preferences
FOR EACH ROW
EXECUTE FUNCTION update_preference_timestamp();

-- =============================================================================
-- Initial Data / Configuration
-- =============================================================================

-- Insert default break activity templates
CREATE TABLE break_activity_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(50) NOT NULL,
    activity_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    instructions JSONB,
    difficulty_level VARCHAR(20) DEFAULT 'easy',
    benefits TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_activity_duration CHECK (duration_minutes BETWEEN 1 AND 30),
    CONSTRAINT check_difficulty CHECK (difficulty_level IN ('easy', 'moderate', 'challenging'))
);

INSERT INTO break_activity_templates (activity_type, activity_name, description, duration_minutes, instructions, difficulty_level, benefits) VALUES
('physical', 'Desk Stretches', 'Simple stretching routine at your desk', 3,
 '["Stand up and reach arms overhead", "Rotate shoulders backward 10 times", "Tilt head side to side gently", "Stretch arms across chest"]'::jsonb,
 'easy', ARRAY['Reduces muscle tension', 'Improves blood circulation', 'Prevents stiffness']),

('cognitive', 'Mindful Breathing', 'Deep breathing exercise for mental clarity', 2,
 '["Sit comfortably with back straight", "Close eyes gently", "Breathe in slowly for 4 counts", "Hold for 2 counts", "Exhale slowly for 6 counts", "Repeat 5 times"]'::jsonb,
 'easy', ARRAY['Reduces stress', 'Improves focus', 'Calms nervous system']),

('physical', 'Quick Walk', 'Short walking break', 5,
 '["Walk around your room or hallway", "Maintain comfortable pace", "Swing arms naturally", "Take deep breaths while walking"]'::jsonb,
 'easy', ARRAY['Boosts energy', 'Improves mood', 'Enhances creativity']),

('visual', 'Eye Rest Exercise', '20-20-20 rule for eye strain', 2,
 '["Look away from screen", "Focus on object 20 feet away", "Maintain focus for 20 seconds", "Blink several times", "Repeat if needed"]'::jsonb,
 'easy', ARRAY['Reduces eye strain', 'Prevents dry eyes', 'Maintains eye health']),

('cognitive', 'Progressive Relaxation', 'Brief muscle relaxation technique', 4,
 '["Sit or lie comfortably", "Tense feet muscles for 5 seconds, then release", "Move up to calves, tense and release", "Continue with thighs, abdomen, arms", "Notice the relaxation in each muscle group"]'::jsonb,
 'moderate', ARRAY['Reduces physical tension', 'Promotes relaxation', 'Improves body awareness']),

('social', 'Hydration Break', 'Get water and brief social interaction', 3,
 '["Get up and walk to water source", "Drink at least one glass of water", "Optional: brief chat with others (1-2 minutes)", "Return feeling refreshed"]'::jsonb,
 'easy', ARRAY['Maintains hydration', 'Social connection', 'Mental reset']);

COMMENT ON TABLE break_activity_templates IS 'Predefined break activities that can be recommended to students';

-- =============================================================================
-- Permissions (to be customized based on deployment)
-- =============================================================================

-- Note: Adjust permissions based on actual user roles in deployment
-- Example roles: app_user (application), teacher_role, student_role, analyst_role

-- GRANT SELECT, INSERT, UPDATE ON student_engagement_sessions TO app_user;
-- GRANT SELECT, INSERT ON cognitive_activity_logs TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON break_recommendations TO app_user;
-- GRANT SELECT ON active_sessions_with_dmn TO teacher_role;
-- GRANT SELECT ON break_recommendation_summary TO teacher_role, analyst_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Create DMN Detection and Rest Recommendation Schema');
