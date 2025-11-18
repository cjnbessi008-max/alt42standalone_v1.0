-- Fatigue Monitoring System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: fatigue_sessions
-- Tracks individual learning sessions with fatigue metrics
-- ============================================================================
CREATE TABLE fatigue_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    active_learning_minutes INTEGER DEFAULT 0,
    idle_minutes INTEGER DEFAULT 0,
    fatigue_score DECIMAL(5,2) DEFAULT 0 CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
    peak_fatigue_score DECIMAL(5,2) DEFAULT 0 CHECK (peak_fatigue_score >= 0 AND peak_fatigue_score <= 100),
    fatigue_level SMALLINT DEFAULT 1 CHECK (fatigue_level BETWEEN 1 AND 5),
    break_count INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_fatigue_sessions_student ON fatigue_sessions(student_id);
CREATE INDEX idx_fatigue_sessions_module ON fatigue_sessions(module_id);
CREATE INDEX idx_fatigue_sessions_start ON fatigue_sessions(session_start DESC);
CREATE INDEX idx_fatigue_sessions_active ON fatigue_sessions(student_id, session_end) WHERE session_end IS NULL;

-- ============================================================================
-- Table: fatigue_metrics
-- Detailed fatigue measurements at regular intervals
-- ============================================================================
CREATE TABLE fatigue_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    student_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fatigue_score DECIMAL(5,2) NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
    session_duration_minutes INTEGER NOT NULL,
    complexity_level SMALLINT CHECK (complexity_level BETWEEN 1 AND 5),
    error_rate DECIMAL(4,3) CHECK (error_rate >= 0 AND error_rate <= 1),
    problems_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    response_time_avg_seconds DECIMAL(8,2),
    interaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES fatigue_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_metric FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Indexes for time-series queries
CREATE INDEX idx_fatigue_metrics_session ON fatigue_metrics(session_id, timestamp DESC);
CREATE INDEX idx_fatigue_metrics_student_time ON fatigue_metrics(student_id, timestamp DESC);
CREATE INDEX idx_fatigue_metrics_timestamp ON fatigue_metrics(timestamp DESC);

-- ============================================================================
-- Table: break_recommendations
-- Break suggestions and tracking
-- ============================================================================
CREATE TABLE break_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    student_id UUID NOT NULL,
    recommended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fatigue_score_at_recommendation DECIMAL(5,2) NOT NULL,
    break_type VARCHAR(20) NOT NULL CHECK (break_type IN ('micro', 'short', 'medium', 'long')),
    duration_minutes INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'deferred', 'expired')),
    actual_break_start TIMESTAMP WITH TIME ZONE,
    actual_break_end TIMESTAMP WITH TIME ZONE,
    actual_duration_minutes INTEGER,
    activities_during_break JSONB DEFAULT '[]'::jsonb,
    fatigue_score_after_break DECIMAL(5,2),
    dismissal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_session_break FOREIGN KEY (session_id) REFERENCES fatigue_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_break FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT check_break_duration CHECK (actual_break_end IS NULL OR actual_break_end > actual_break_start)
);

-- Indexes for break tracking
CREATE INDEX idx_break_recommendations_session ON break_recommendations(session_id);
CREATE INDEX idx_break_recommendations_student ON break_recommendations(student_id);
CREATE INDEX idx_break_recommendations_status ON break_recommendations(status, recommended_at DESC);
CREATE INDEX idx_break_recommendations_pending ON break_recommendations(student_id, status) WHERE status = 'pending';

-- ============================================================================
-- Table: student_fatigue_profiles
-- Personalized fatigue patterns for each student
-- ============================================================================
CREATE TABLE student_fatigue_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL,
    optimal_session_duration INTEGER DEFAULT 45, -- minutes
    average_fatigue_rate DECIMAL(6,3) DEFAULT 1.0, -- points per hour
    recovery_rate DECIMAL(6,3) DEFAULT 1.5, -- points per minute
    preferred_break_duration INTEGER DEFAULT 10, -- minutes
    peak_performance_hours INTEGER[] DEFAULT ARRAY[9,10,11,14,15,16], -- hours of day
    fatigue_threshold_level DECIMAL(5,2) DEFAULT 70.0,
    total_sessions INTEGER DEFAULT 0,
    total_learning_minutes INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    compliance_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    last_calibration_date TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_student_profile FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT check_compliance_rate CHECK (compliance_rate >= 0 AND compliance_rate <= 100)
);

-- Index for quick profile lookups
CREATE UNIQUE INDEX idx_student_fatigue_profile ON student_fatigue_profiles(student_id);

-- ============================================================================
-- Table: fatigue_analytics_snapshots
-- Daily/weekly aggregated analytics for performance
-- ============================================================================
CREATE TABLE fatigue_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(10) CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    sessions_count INTEGER DEFAULT 0,
    total_learning_minutes INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    average_fatigue_score DECIMAL(5,2),
    peak_fatigue_score DECIMAL(5,2),
    breaks_recommended INTEGER DEFAULT 0,
    breaks_taken INTEGER DEFAULT 0,
    compliance_rate DECIMAL(5,2),
    fatigue_by_hour JSONB DEFAULT '{}'::jsonb, -- { "9": 45.2, "10": 52.1, ... }
    most_fatiguing_module_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_student_analytics FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT unique_student_snapshot UNIQUE (student_id, snapshot_date, period_type)
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_student_date ON fatigue_analytics_snapshots(student_id, snapshot_date DESC);
CREATE INDEX idx_analytics_date ON fatigue_analytics_snapshots(snapshot_date DESC);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update fatigue_sessions updated_at
CREATE TRIGGER trigger_fatigue_sessions_updated_at
    BEFORE UPDATE ON fatigue_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update break_recommendations updated_at
CREATE TRIGGER trigger_break_recommendations_updated_at
    BEFORE UPDATE ON break_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update student_fatigue_profiles updated_at
CREATE TRIGGER trigger_student_fatigue_profiles_updated_at
    BEFORE UPDATE ON student_fatigue_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate session duration on update
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate session duration
CREATE TRIGGER trigger_calculate_session_duration
    BEFORE UPDATE ON fatigue_sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_duration();

-- Function: Update peak fatigue score
CREATE OR REPLACE FUNCTION update_peak_fatigue_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fatigue_score > OLD.peak_fatigue_score THEN
        NEW.peak_fatigue_score = NEW.fatigue_score;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Track peak fatigue
CREATE TRIGGER trigger_update_peak_fatigue
    BEFORE UPDATE ON fatigue_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_peak_fatigue_score();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Active sessions with current fatigue
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT
    fs.id,
    fs.student_id,
    fs.module_id,
    fs.session_start,
    fs.fatigue_score,
    fs.fatigue_level,
    fs.break_count,
    EXTRACT(EPOCH FROM (NOW() - fs.session_start)) / 60 AS current_duration_minutes,
    s.name AS student_name,
    m.name AS module_name
FROM fatigue_sessions fs
JOIN students s ON fs.student_id = s.id
JOIN modules m ON fs.module_id = m.id
WHERE fs.session_end IS NULL;

-- View: Break compliance by student
CREATE OR REPLACE VIEW v_student_break_compliance AS
SELECT
    sfp.student_id,
    s.name AS student_name,
    sfp.total_sessions,
    sfp.compliance_rate,
    COUNT(br.id) AS total_recommendations,
    COUNT(br.id) FILTER (WHERE br.status = 'accepted') AS breaks_taken,
    COUNT(br.id) FILTER (WHERE br.status = 'dismissed') AS breaks_dismissed,
    AVG(br.actual_duration_minutes) AS avg_break_duration
FROM student_fatigue_profiles sfp
JOIN students s ON sfp.student_id = s.id
LEFT JOIN break_recommendations br ON br.student_id = sfp.student_id
GROUP BY sfp.student_id, s.name, sfp.total_sessions, sfp.compliance_rate;

-- View: Recent fatigue trends
CREATE OR REPLACE VIEW v_recent_fatigue_trends AS
SELECT
    fm.student_id,
    fm.session_id,
    fm.timestamp,
    fm.fatigue_score,
    LAG(fm.fatigue_score) OVER (PARTITION BY fm.session_id ORDER BY fm.timestamp) AS previous_score,
    fm.fatigue_score - LAG(fm.fatigue_score) OVER (PARTITION BY fm.session_id ORDER BY fm.timestamp) AS score_change,
    CASE
        WHEN fm.fatigue_score - LAG(fm.fatigue_score) OVER (PARTITION BY fm.session_id ORDER BY fm.timestamp) > 5 THEN 'increasing'
        WHEN fm.fatigue_score - LAG(fm.fatigue_score) OVER (PARTITION BY fm.session_id ORDER BY fm.timestamp) < -5 THEN 'decreasing'
        ELSE 'stable'
    END AS trend
FROM fatigue_metrics fm;

-- ============================================================================
-- Seed Data: Create default fatigue profiles for existing students
-- ============================================================================

-- This will be run after students table is populated
-- INSERT INTO student_fatigue_profiles (student_id)
-- SELECT id FROM students
-- ON CONFLICT (student_id) DO NOTHING;

-- ============================================================================
-- Comments & Documentation
-- ============================================================================

COMMENT ON TABLE fatigue_sessions IS 'Tracks individual learning sessions with cumulative fatigue metrics';
COMMENT ON TABLE fatigue_metrics IS 'Time-series data of fatigue measurements taken every 2-3 minutes';
COMMENT ON TABLE break_recommendations IS 'Break suggestions generated by the fatigue prediction algorithm';
COMMENT ON TABLE student_fatigue_profiles IS 'Personalized fatigue patterns learned over time for each student';
COMMENT ON TABLE fatigue_analytics_snapshots IS 'Pre-aggregated analytics for dashboard performance';

COMMENT ON COLUMN fatigue_sessions.fatigue_score IS 'Current fatigue score (0-100) based on weighted algorithm';
COMMENT ON COLUMN fatigue_sessions.fatigue_level IS 'Categorical fatigue level: 1=Fresh, 2=Mild, 3=Moderate, 4=High, 5=Exhaustion';
COMMENT ON COLUMN break_recommendations.break_type IS 'Type of break: micro(2-3min), short(5-10min), medium(15-20min), long(30+min)';
COMMENT ON COLUMN student_fatigue_profiles.compliance_rate IS 'Percentage of break recommendations actually followed';
COMMENT ON COLUMN student_fatigue_profiles.peak_performance_hours IS 'Array of hours (0-23) when student performs best';
