-- Reading Analytics and Comprehension Summary Schema
-- For tracking student reading behavior and generating AI-powered comprehension summaries

-- ============================================================================
-- TABLE: reading_analytics
-- Purpose: Store raw reading event data for each student-problem interaction
-- ============================================================================
CREATE TABLE IF NOT EXISTS reading_analytics (
    id BIGSERIAL PRIMARY KEY,

    -- Identifiers
    student_id VARCHAR(100) NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),

    -- Reading Metrics
    reading_start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    reading_end_time TIMESTAMP,
    reading_time_seconds INTEGER, -- Total time spent reading
    active_reading_time_seconds INTEGER, -- Time actually focused on content

    -- Reading Speed
    problem_word_count INTEGER NOT NULL,
    reading_speed_wpm DECIMAL(6,2), -- Words per minute
    baseline_wpm DECIMAL(6,2), -- Expected WPM for this grade/difficulty
    speed_efficiency_pct DECIMAL(5,2), -- Actual vs baseline (%)

    -- Comprehension Indicators
    first_attempt_correct BOOLEAN,
    total_attempts INTEGER DEFAULT 1,
    final_answer_correct BOOLEAN,
    time_to_first_attempt INTEGER, -- Seconds from start to first submission

    -- Behavioral Metrics
    re_reading_count INTEGER DEFAULT 0, -- Number of times scrolled back up
    problem_abandoned BOOLEAN DEFAULT FALSE,
    hints_used INTEGER DEFAULT 0,

    -- Calculated Scores
    comprehension_score DECIMAL(5,2), -- 0-100 score
    reading_difficulty_match VARCHAR(20), -- 'too_easy', 'appropriate', 'too_hard'
    intervention_flag VARCHAR(20), -- 'none', 'monitor', 'immediate'

    -- Context
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    language VARCHAR(10) DEFAULT 'ko', -- 'ko', 'en'
    problem_difficulty INTEGER, -- 1-5
    grade_level INTEGER,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reading_analytics_student ON reading_analytics(student_id, created_at DESC);
CREATE INDEX idx_reading_analytics_module ON reading_analytics(module_id, created_at DESC);
CREATE INDEX idx_reading_analytics_problem ON reading_analytics(problem_id);
CREATE INDEX idx_reading_analytics_intervention ON reading_analytics(intervention_flag, created_at DESC)
    WHERE intervention_flag IN ('monitor', 'immediate');

-- ============================================================================
-- TABLE: comprehension_summaries
-- Purpose: Store AI-generated comprehension summaries and insights
-- ============================================================================
CREATE TABLE IF NOT EXISTS comprehension_summaries (
    id BIGSERIAL PRIMARY KEY,

    -- Identifiers
    student_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    summary_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'on_demand'
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Aggregated Metrics
    total_problems_attempted INTEGER,
    avg_reading_time_seconds INTEGER,
    avg_reading_speed_wpm DECIMAL(6,2),
    avg_comprehension_score DECIMAL(5,2),
    first_attempt_success_rate DECIMAL(5,2), -- % correct on first try

    -- Trends
    reading_speed_trend VARCHAR(20), -- 'improving', 'declining', 'stable'
    comprehension_trend VARCHAR(20), -- 'improving', 'declining', 'stable'
    difficulty_progression VARCHAR(20), -- 'advancing', 'stagnant', 'regressing'

    -- AI-Generated Summary (using Claude API)
    ai_summary TEXT, -- Natural language summary
    ai_recommendations TEXT, -- Specific recommendations
    ai_strengths TEXT, -- Identified strengths
    ai_challenges TEXT, -- Identified challenges

    -- Teacher Insights
    teacher_action_needed BOOLEAN DEFAULT FALSE,
    suggested_interventions JSONB, -- Array of suggested actions

    -- Student Feedback (age-appropriate)
    student_message TEXT, -- Simplified, encouraging message for student
    student_tips TEXT, -- Actionable tips for student

    -- Generation Metadata
    generated_by VARCHAR(50) DEFAULT 'claude-api', -- AI model used
    generation_cost_usd DECIMAL(8,4), -- API cost tracking
    generation_time_ms INTEGER, -- Time to generate

    -- Status
    summary_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    published_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_comprehension_summaries_student ON comprehension_summaries(student_id, period_start DESC);
CREATE INDEX idx_comprehension_summaries_module ON comprehension_summaries(module_id, period_start DESC);
CREATE INDEX idx_comprehension_summaries_period ON comprehension_summaries(summary_period, period_start DESC);
CREATE INDEX idx_comprehension_summaries_action ON comprehension_summaries(teacher_action_needed, created_at DESC)
    WHERE teacher_action_needed = TRUE;

-- ============================================================================
-- TABLE: lms_integration_log
-- Purpose: Track LMS data synchronization and events
-- ============================================================================
CREATE TABLE IF NOT EXISTS lms_integration_log (
    id BIGSERIAL PRIMARY KEY,

    -- Integration Details
    lms_type VARCHAR(50) NOT NULL, -- 'moodle', 'canvas', 'blackboard', 'kaist_custom'
    integration_event VARCHAR(50) NOT NULL, -- 'sync_students', 'sync_problems', 'export_analytics'

    -- Sync Details
    records_processed INTEGER,
    records_succeeded INTEGER,
    records_failed INTEGER,
    error_messages TEXT,

    -- Performance
    sync_start_time TIMESTAMP NOT NULL,
    sync_end_time TIMESTAMP,
    sync_duration_ms INTEGER,

    -- Metadata
    triggered_by VARCHAR(100), -- User ID or 'system'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lms_integration_log_type ON lms_integration_log(lms_type, created_at DESC);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_analytics_updated_at
    BEFORE UPDATE ON reading_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comprehension_summaries_updated_at
    BEFORE UPDATE ON comprehension_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Useful aggregations
-- ============================================================================

-- View: Recent interventions needed
CREATE OR REPLACE VIEW recent_interventions AS
SELECT
    ra.student_id,
    ra.module_id,
    ra.problem_id,
    ra.comprehension_score,
    ra.reading_speed_wpm,
    ra.intervention_flag,
    ra.created_at
FROM reading_analytics ra
WHERE ra.intervention_flag IN ('monitor', 'immediate')
    AND ra.created_at > NOW() - INTERVAL '7 days'
ORDER BY ra.created_at DESC;

-- View: Class comprehension overview
CREATE OR REPLACE VIEW class_comprehension_overview AS
SELECT
    module_id,
    COUNT(DISTINCT student_id) as total_students,
    AVG(comprehension_score) as avg_comprehension,
    AVG(reading_speed_wpm) as avg_reading_speed,
    SUM(CASE WHEN intervention_flag = 'immediate' THEN 1 ELSE 0 END) as students_needing_help,
    SUM(CASE WHEN first_attempt_correct THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as first_attempt_success_rate
FROM reading_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY module_id;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================
COMMENT ON TABLE reading_analytics IS 'Tracks individual reading events and comprehension metrics for each student-problem interaction';
COMMENT ON TABLE comprehension_summaries IS 'AI-generated comprehension summaries and insights for students and teachers';
COMMENT ON TABLE lms_integration_log IS 'Logs all LMS integration events and synchronization status';

COMMENT ON COLUMN reading_analytics.comprehension_score IS 'Calculated score (0-100) based on reading speed, accuracy, and behavioral metrics';
COMMENT ON COLUMN comprehension_summaries.ai_summary IS 'Natural language summary generated by Claude API';
COMMENT ON COLUMN comprehension_summaries.student_message IS 'Age-appropriate, encouraging feedback for the student';
