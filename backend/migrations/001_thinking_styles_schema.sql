-- Migration: Thinking Style Classification System
-- Version: 001
-- Created: 2025-11-18
-- Description: Initial schema for thinking style classification and LMS integration

-- ============================================================
-- Core Tables
-- ============================================================

-- Student thinking style profiles
CREATE TABLE student_thinking_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,

    -- Current classification
    primary_style VARCHAR(20) NOT NULL CHECK (primary_style IN ('computational', 'intuitive', 'visual')),
    secondary_style VARCHAR(20) CHECK (secondary_style IN ('computational', 'intuitive', 'visual', 'none')),
    is_hybrid BOOLEAN DEFAULT false,

    -- Scores (0-100)
    computational_score DECIMAL(5,2) NOT NULL CHECK (computational_score BETWEEN 0 AND 100),
    intuitive_score DECIMAL(5,2) NOT NULL CHECK (intuitive_score BETWEEN 0 AND 100),
    visual_score DECIMAL(5,2) NOT NULL CHECK (visual_score BETWEEN 0 AND 100),

    -- Metadata
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
    data_points_count INTEGER DEFAULT 0,
    first_assessed_at TIMESTAMP,
    last_assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id)
);

-- Indexes for student_thinking_styles
CREATE INDEX idx_student_thinking_styles_student ON student_thinking_styles(student_id);
CREATE INDEX idx_student_thinking_styles_primary ON student_thinking_styles(primary_style);
CREATE INDEX idx_student_thinking_styles_confidence ON student_thinking_styles(confidence_level);

-- ============================================================
-- Behavioral Tracking
-- ============================================================

-- Behavioral tracking data
CREATE TABLE thinking_style_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID,

    -- Interaction type
    interaction_type VARCHAR(50) NOT NULL,
    interaction_category VARCHAR(20) NOT NULL CHECK (interaction_category IN ('computational', 'intuitive', 'visual', 'neutral')),

    -- Metrics
    duration_seconds INTEGER,
    success BOOLEAN,
    metadata JSONB,  -- Flexible storage for interaction-specific data

    -- Timestamp
    occurred_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- Indexes for thinking_style_interactions
CREATE INDEX idx_thinking_style_interactions_student ON thinking_style_interactions(student_id);
CREATE INDEX idx_thinking_style_interactions_module ON thinking_style_interactions(module_id);
CREATE INDEX idx_thinking_style_interactions_occurred ON thinking_style_interactions(occurred_at);
CREATE INDEX idx_thinking_style_interactions_category ON thinking_style_interactions(interaction_category);
CREATE INDEX idx_thinking_style_interactions_type ON thinking_style_interactions(interaction_type);

-- Composite index for common queries
CREATE INDEX idx_thinking_style_interactions_student_module ON thinking_style_interactions(student_id, module_id, occurred_at DESC);

-- ============================================================
-- Assessment Sessions
-- ============================================================

-- Assessment sessions
CREATE TABLE thinking_style_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,

    -- Assessment details
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('initial', 'periodic', 'on_demand')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

    -- Results
    computational_raw_score DECIMAL(5,2),
    intuitive_raw_score DECIMAL(5,2),
    visual_raw_score DECIMAL(5,2),

    recommended_style VARCHAR(20),
    confidence DECIMAL(5,2),

    -- Additional metadata
    assessment_data JSONB,  -- Store detailed assessment results

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_assessment_scores CHECK (
        (computational_raw_score IS NULL OR computational_raw_score BETWEEN 0 AND 100) AND
        (intuitive_raw_score IS NULL OR intuitive_raw_score BETWEEN 0 AND 100) AND
        (visual_raw_score IS NULL OR visual_raw_score BETWEEN 0 AND 100)
    )
);

-- Indexes for thinking_style_assessments
CREATE INDEX idx_thinking_style_assessments_student ON thinking_style_assessments(student_id);
CREATE INDEX idx_thinking_style_assessments_status ON thinking_style_assessments(status);
CREATE INDEX idx_thinking_style_assessments_type ON thinking_style_assessments(assessment_type);

-- ============================================================
-- LMS Integration
-- ============================================================

-- LMS student mapping
CREATE TABLE lms_student_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lms_platform VARCHAR(50) NOT NULL,
    lms_student_id VARCHAR(255) NOT NULL,
    lms_email VARCHAR(255),
    mapping_verified BOOLEAN DEFAULT false,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(lms_platform, lms_student_id)
);

-- Indexes for lms_student_mappings
CREATE INDEX idx_lms_student_mappings_student ON lms_student_mappings(student_id);
CREATE INDEX idx_lms_student_mappings_platform ON lms_student_mappings(lms_platform);

-- LMS integration logs
CREATE TABLE lms_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    lms_platform VARCHAR(50) NOT NULL,

    -- Sync details
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('export', 'import')),
    data_type VARCHAR(50) NOT NULL,  -- 'thinking_style', 'progress', etc.

    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,

    -- Data
    request_payload JSONB,
    response_payload JSONB,

    -- Timing
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for lms_sync_logs
CREATE INDEX idx_lms_sync_logs_student ON lms_sync_logs(student_id);
CREATE INDEX idx_lms_sync_logs_platform ON lms_sync_logs(lms_platform);
CREATE INDEX idx_lms_sync_logs_status ON lms_sync_logs(status);
CREATE INDEX idx_lms_sync_logs_synced ON lms_sync_logs(synced_at DESC);

-- ============================================================
-- Historical Tracking
-- ============================================================

-- Thinking style history (for trend analysis)
CREATE TABLE thinking_style_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,

    -- Snapshot of scores at this point in time
    computational_score DECIMAL(5,2) NOT NULL,
    intuitive_score DECIMAL(5,2) NOT NULL,
    visual_score DECIMAL(5,2) NOT NULL,

    primary_style VARCHAR(20) NOT NULL,
    confidence_level VARCHAR(20) NOT NULL,
    data_points_count INTEGER DEFAULT 0,

    -- Timestamp
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id, snapshot_date)
);

-- Indexes for thinking_style_history
CREATE INDEX idx_thinking_style_history_student ON thinking_style_history(student_id);
CREATE INDEX idx_thinking_style_history_date ON thinking_style_history(snapshot_date DESC);

-- ============================================================
-- Triggers for Automatic Updates
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student_thinking_styles
CREATE TRIGGER update_student_thinking_styles_updated_at
    BEFORE UPDATE ON student_thinking_styles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create historical snapshot
CREATE OR REPLACE FUNCTION create_thinking_style_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a daily snapshot (only once per day)
    INSERT INTO thinking_style_history (
        student_id,
        module_id,
        computational_score,
        intuitive_score,
        visual_score,
        primary_style,
        confidence_level,
        data_points_count,
        snapshot_date
    ) VALUES (
        NEW.student_id,
        NEW.module_id,
        NEW.computational_score,
        NEW.intuitive_score,
        NEW.visual_score,
        NEW.primary_style,
        NEW.confidence_level,
        NEW.data_points_count,
        CURRENT_DATE
    )
    ON CONFLICT (student_id, module_id, snapshot_date)
    DO UPDATE SET
        computational_score = EXCLUDED.computational_score,
        intuitive_score = EXCLUDED.intuitive_score,
        visual_score = EXCLUDED.visual_score,
        primary_style = EXCLUDED.primary_style,
        confidence_level = EXCLUDED.confidence_level,
        data_points_count = EXCLUDED.data_points_count;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create snapshot on update
CREATE TRIGGER create_snapshot_on_update
    AFTER INSERT OR UPDATE ON student_thinking_styles
    FOR EACH ROW
    EXECUTE FUNCTION create_thinking_style_snapshot();

-- ============================================================
-- Views for Common Queries
-- ============================================================

-- View: Student thinking styles with recent activity
CREATE VIEW v_student_thinking_styles_enriched AS
SELECT
    sts.*,
    s.name AS student_name,
    s.grade_level,
    m.name AS module_name,
    (
        SELECT COUNT(*)
        FROM thinking_style_interactions tsi
        WHERE tsi.student_id = sts.student_id
          AND tsi.module_id = sts.module_id
          AND tsi.occurred_at > NOW() - INTERVAL '7 days'
    ) AS interactions_last_7_days,
    (
        SELECT MAX(occurred_at)
        FROM thinking_style_interactions tsi
        WHERE tsi.student_id = sts.student_id
          AND tsi.module_id = sts.module_id
    ) AS last_interaction_at
FROM student_thinking_styles sts
JOIN students s ON sts.student_id = s.id
LEFT JOIN modules m ON sts.module_id = m.id;

-- View: Class thinking style distribution
CREATE OR REPLACE VIEW v_class_thinking_style_distribution AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    COUNT(*) AS total_students,
    COUNT(*) FILTER (WHERE sts.primary_style = 'computational') AS computational_count,
    COUNT(*) FILTER (WHERE sts.primary_style = 'intuitive') AS intuitive_count,
    COUNT(*) FILTER (WHERE sts.primary_style = 'visual') AS visual_count,
    COUNT(*) FILTER (WHERE sts.is_hybrid = true) AS hybrid_count,
    ROUND(AVG(sts.computational_score), 2) AS avg_computational_score,
    ROUND(AVG(sts.intuitive_score), 2) AS avg_intuitive_score,
    ROUND(AVG(sts.visual_score), 2) AS avg_visual_score
FROM student_thinking_styles sts
JOIN modules m ON sts.module_id = m.id
GROUP BY m.id, m.name;

-- ============================================================
-- Initial Data / Reference Tables
-- ============================================================

-- Interaction type definitions
CREATE TABLE thinking_style_interaction_types (
    interaction_type VARCHAR(50) PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK (category IN ('computational', 'intuitive', 'visual', 'neutral')),
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true
);

-- Insert common interaction types
INSERT INTO thinking_style_interaction_types (interaction_type, category, description, weight) VALUES
    ('calculator_usage', 'computational', 'Student used calculator tool', 0.8),
    ('formula_reference', 'computational', 'Student referenced formula sheet', 0.7),
    ('step_by_step_solution', 'computational', 'Student showed step-by-step work', 0.9),
    ('quick_answer', 'intuitive', 'Student submitted answer quickly without showing work', 0.8),
    ('pattern_recognition', 'intuitive', 'Student identified pattern without explicit steps', 0.9),
    ('estimation_usage', 'intuitive', 'Student used estimation strategy', 0.7),
    ('diagram_interaction', 'visual', 'Student interacted with diagram or graph', 0.9),
    ('drawing_tool_usage', 'visual', 'Student used drawing or sketching tool', 0.8),
    ('visual_aid_preference', 'visual', 'Student selected visual representation when offered choice', 0.7),
    ('time_on_problem', 'neutral', 'General time spent on problem', 0.5),
    ('answer_revision', 'neutral', 'Student revised their answer', 0.5);

-- ============================================================
-- Comments for Documentation
-- ============================================================

COMMENT ON TABLE student_thinking_styles IS 'Stores the current thinking style classification for each student';
COMMENT ON TABLE thinking_style_interactions IS 'Tracks individual interactions for classification analysis';
COMMENT ON TABLE thinking_style_assessments IS 'Records formal assessment sessions for thinking styles';
COMMENT ON TABLE lms_student_mappings IS 'Maps internal student IDs to external LMS student IDs';
COMMENT ON TABLE lms_sync_logs IS 'Logs all LMS synchronization activities';
COMMENT ON TABLE thinking_style_history IS 'Historical snapshots of thinking style scores for trend analysis';
COMMENT ON TABLE thinking_style_interaction_types IS 'Reference table defining interaction types and their categories';

-- ============================================================
-- Grants (adjust based on your user roles)
-- ============================================================

-- Grant permissions to application user (replace 'app_user' with actual user)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
