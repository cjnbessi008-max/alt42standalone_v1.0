-- ============================================================================
-- Migration: 001 - Create Error Tracking Tables
-- Description: Create tables for tracking student errors and recurring patterns
-- Author: AI Education System Pipeline
-- Created: 2025-11-18
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: student_errors
-- Purpose: Track individual student errors during learning activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID,
    error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('conceptual', 'procedural', 'calculation', 'input', 'logical')),
    error_description TEXT NOT NULL,
    incorrect_answer TEXT,
    correct_answer TEXT,
    concept_id VARCHAR(100),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    context JSONB DEFAULT '{}',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID,
    attempt_number INTEGER DEFAULT 1,

    -- Indexes for efficient querying
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_student_errors_student ON student_errors(student_id);
CREATE INDEX idx_student_errors_module ON student_errors(module_id);
CREATE INDEX idx_student_errors_occurred_at ON student_errors(occurred_at DESC);
CREATE INDEX idx_student_errors_error_type ON student_errors(error_type);
CREATE INDEX idx_student_errors_concept ON student_errors(concept_id) WHERE concept_id IS NOT NULL;
CREATE INDEX idx_student_errors_session ON student_errors(session_id) WHERE session_id IS NOT NULL;

-- ============================================================================
-- Table: error_patterns
-- Purpose: Identify and track recurring error patterns across students
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT,
    error_category VARCHAR(50) NOT NULL CHECK (error_category IN ('conceptual', 'procedural', 'calculation', 'input', 'logical')),
    concept_ids TEXT[], -- Array of concept IDs related to this pattern
    module_id UUID NOT NULL,
    occurrence_count INTEGER DEFAULT 0,
    affected_student_count INTEGER DEFAULT 0,
    recurrence_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (recurrence_rate BETWEEN 0 AND 100),
    average_severity DECIMAL(3, 2) DEFAULT 0.00 CHECK (average_severity BETWEEN 0 AND 4),
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    resolution_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_error_pattern_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_error_patterns_module ON error_patterns(module_id);
CREATE INDEX idx_error_patterns_recurrence ON error_patterns(recurrence_rate DESC);
CREATE INDEX idx_error_patterns_active ON error_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_error_patterns_category ON error_patterns(error_category);

-- ============================================================================
-- Table: recurring_error_points
-- Purpose: Highlight high-recurrence error points for intervention
-- ============================================================================
CREATE TABLE IF NOT EXISTS recurring_error_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID NOT NULL,
    module_id UUID NOT NULL,
    concept_id VARCHAR(100) NOT NULL,
    error_title VARCHAR(255) NOT NULL,
    error_summary TEXT,
    recurrence_rate DECIMAL(5, 2) NOT NULL CHECK (recurrence_rate BETWEEN 0 AND 100),
    total_occurrences INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    severity_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (severity_score BETWEEN 0 AND 100),
    priority_rank INTEGER DEFAULT 0,
    recommended_action TEXT,
    visualization_data JSONB DEFAULT '{}',
    is_highlighted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_recurring_pattern FOREIGN KEY (pattern_id) REFERENCES error_patterns(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_recurring_points_module ON recurring_error_points(module_id);
CREATE INDEX idx_recurring_points_pattern ON recurring_error_points(pattern_id);
CREATE INDEX idx_recurring_points_priority ON recurring_error_points(priority_rank ASC);
CREATE INDEX idx_recurring_points_recurrence ON recurring_error_points(recurrence_rate DESC);
CREATE INDEX idx_recurring_points_highlighted ON recurring_error_points(is_highlighted) WHERE is_highlighted = TRUE;
CREATE INDEX idx_recurring_points_concept ON recurring_error_points(concept_id);

-- ============================================================================
-- Table: error_analytics
-- Purpose: Store aggregated analytics and metrics for error tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_errors INTEGER DEFAULT 0,
    unique_error_patterns INTEGER DEFAULT 0,
    students_affected INTEGER DEFAULT 0,
    average_recurrence_rate DECIMAL(5, 2) DEFAULT 0.00,
    top_error_categories JSONB DEFAULT '{}',
    improvement_trends JSONB DEFAULT '{}',
    intervention_effectiveness JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_analytics_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT check_period CHECK (analysis_period_end >= analysis_period_start)
);

-- Create indexes
CREATE INDEX idx_analytics_module ON error_analytics(module_id);
CREATE INDEX idx_analytics_period ON error_analytics(analysis_period_start, analysis_period_end);
CREATE INDEX idx_analytics_created ON error_analytics(created_at DESC);

-- ============================================================================
-- Table: lms_integration_logs
-- Purpose: Log LMS integration activities and data synchronization
-- ============================================================================
CREATE TABLE IF NOT EXISTS lms_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_system VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('sync', 'import', 'export', 'webhook', 'api_call')),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
    records_synced INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    error_details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    CONSTRAINT check_sync_time CHECK (sync_completed_at IS NULL OR sync_completed_at >= sync_started_at)
);

-- Create indexes
CREATE INDEX idx_lms_logs_system ON lms_integration_logs(lms_system);
CREATE INDEX idx_lms_logs_status ON lms_integration_logs(sync_status);
CREATE INDEX idx_lms_logs_started ON lms_integration_logs(sync_started_at DESC);

-- ============================================================================
-- Table: student_error_patterns (Junction table)
-- Purpose: Link students to error patterns they've exhibited
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_error_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    pattern_id UUID NOT NULL,
    first_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_date TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_sep_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sep_pattern FOREIGN KEY (pattern_id) REFERENCES error_patterns(id) ON DELETE CASCADE,
    CONSTRAINT unique_student_pattern UNIQUE (student_id, pattern_id)
);

-- Create indexes
CREATE INDEX idx_sep_student ON student_error_patterns(student_id);
CREATE INDEX idx_sep_pattern ON student_error_patterns(pattern_id);
CREATE INDEX idx_sep_unresolved ON student_error_patterns(is_resolved) WHERE is_resolved = FALSE;

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- View: Top recurring error points by module
CREATE OR REPLACE VIEW v_top_recurring_errors AS
SELECT
    rep.id,
    rep.module_id,
    rep.error_title,
    rep.error_summary,
    rep.recurrence_rate,
    rep.total_occurrences,
    rep.unique_students,
    rep.severity_score,
    rep.priority_rank,
    rep.recommended_action,
    m.name AS module_name,
    rep.created_at,
    rep.updated_at
FROM recurring_error_points rep
JOIN modules m ON rep.module_id = m.id
WHERE rep.is_highlighted = TRUE
ORDER BY rep.priority_rank ASC, rep.recurrence_rate DESC;

-- View: Student error summary
CREATE OR REPLACE VIEW v_student_error_summary AS
SELECT
    se.student_id,
    s.name AS student_name,
    se.module_id,
    m.name AS module_name,
    COUNT(*) AS total_errors,
    COUNT(DISTINCT se.error_type) AS unique_error_types,
    COUNT(DISTINCT se.concept_id) AS concepts_with_errors,
    AVG(CASE
        WHEN se.severity = 'low' THEN 1
        WHEN se.severity = 'medium' THEN 2
        WHEN se.severity = 'high' THEN 3
        WHEN se.severity = 'critical' THEN 4
    END) AS avg_severity,
    MIN(se.occurred_at) AS first_error,
    MAX(se.occurred_at) AS last_error
FROM student_errors se
JOIN students s ON se.student_id = s.id
JOIN modules m ON se.module_id = m.id
GROUP BY se.student_id, s.name, se.module_id, m.name;

-- View: Error pattern trends
CREATE OR REPLACE VIEW v_error_pattern_trends AS
SELECT
    ep.id,
    ep.pattern_name,
    ep.error_category,
    ep.module_id,
    m.name AS module_name,
    ep.occurrence_count,
    ep.affected_student_count,
    ep.recurrence_rate,
    ep.average_severity,
    ep.first_detected,
    ep.last_detected,
    EXTRACT(DAY FROM (ep.last_detected - ep.first_detected)) AS days_active,
    ep.is_active
FROM error_patterns ep
JOIN modules m ON ep.module_id = m.id
ORDER BY ep.recurrence_rate DESC, ep.occurrence_count DESC;

-- ============================================================================
-- Triggers for automatic updates
-- ============================================================================

-- Function: Update timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_error_patterns_updated_at
    BEFORE UPDATE ON error_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_error_points_updated_at
    BEFORE UPDATE ON recurring_error_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-calculate recurrence rate when error pattern is updated
CREATE OR REPLACE FUNCTION calculate_recurrence_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate recurrence rate based on affected students and total errors
    IF NEW.affected_student_count > 0 AND NEW.occurrence_count > 0 THEN
        NEW.recurrence_rate = LEAST(
            (NEW.occurrence_count::DECIMAL / NULLIF(NEW.affected_student_count, 0)) * 10,
            100.00
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to error_patterns table
CREATE TRIGGER auto_calculate_recurrence_rate
    BEFORE INSERT OR UPDATE ON error_patterns
    FOR EACH ROW
    EXECUTE FUNCTION calculate_recurrence_rate();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE student_errors IS 'Tracks individual student errors during learning activities';
COMMENT ON TABLE error_patterns IS 'Identifies and tracks recurring error patterns across students';
COMMENT ON TABLE recurring_error_points IS 'Highlights high-recurrence error points for teacher intervention';
COMMENT ON TABLE error_analytics IS 'Stores aggregated analytics and metrics for error tracking';
COMMENT ON TABLE lms_integration_logs IS 'Logs LMS integration activities and data synchronization';
COMMENT ON TABLE student_error_patterns IS 'Junction table linking students to error patterns';

COMMENT ON VIEW v_top_recurring_errors IS 'Shows top recurring error points ordered by priority and recurrence rate';
COMMENT ON VIEW v_student_error_summary IS 'Provides summary statistics of errors per student per module';
COMMENT ON VIEW v_error_pattern_trends IS 'Analyzes trends in error patterns over time';

-- ============================================================================
-- Grant permissions (adjust as needed for your environment)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- End of migration
-- ============================================================================
