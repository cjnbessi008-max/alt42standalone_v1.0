-- DMN Rest Routine System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: dmn_routines
-- Stores available rest routine activities
CREATE TABLE IF NOT EXISTS dmn_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('breathing', 'visualization', 'physical', 'mindfulness', 'cognitive_break')),
    complexity_level INTEGER CHECK (complexity_level BETWEEN 1 AND 5),
    instructions JSONB NOT NULL,
    media_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: dmn_sessions
-- Tracks student problem-solving sessions
CREATE TABLE IF NOT EXISTS dmn_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(255),
    problem_type VARCHAR(100),
    problem_complexity INTEGER CHECK (problem_complexity BETWEEN 1 AND 5),
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    total_active_time_seconds INTEGER DEFAULT 0,
    fatigue_score FLOAT DEFAULT 0.0 CHECK (fatigue_score >= 0 AND fatigue_score <= 1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: dmn_events
-- Records when rest routines are suggested and completed
CREATE TABLE IF NOT EXISTS dmn_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES dmn_sessions(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES dmn_routines(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('suggested_before', 'suggested_after', 'completed', 'skipped')),
    trigger_reason VARCHAR(100),
    problem_id VARCHAR(255),
    suggested_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    actual_duration_seconds INTEGER,
    student_feedback INTEGER CHECK (student_feedback BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: dmn_analytics
-- Aggregated analytics on rest routine effectiveness
CREATE TABLE IF NOT EXISTS dmn_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES dmn_routines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    times_suggested INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    times_skipped INTEGER DEFAULT 0,
    avg_completion_duration_seconds FLOAT,
    avg_student_feedback FLOAT,
    problems_after_rest_correct_rate FLOAT,
    problems_without_rest_correct_rate FLOAT,
    effectiveness_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(routine_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dmn_sessions_student ON dmn_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_dmn_sessions_module ON dmn_sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_dmn_sessions_start ON dmn_sessions(session_start);

CREATE INDEX IF NOT EXISTS idx_dmn_events_session ON dmn_events(session_id);
CREATE INDEX IF NOT EXISTS idx_dmn_events_routine ON dmn_events(routine_id);
CREATE INDEX IF NOT EXISTS idx_dmn_events_type ON dmn_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dmn_events_suggested ON dmn_events(suggested_at);

CREATE INDEX IF NOT EXISTS idx_dmn_analytics_date ON dmn_analytics(date);
CREATE INDEX IF NOT EXISTS idx_dmn_analytics_routine ON dmn_analytics(routine_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_dmn_routines_updated_at BEFORE UPDATE ON dmn_routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dmn_analytics_updated_at BEFORE UPDATE ON dmn_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE dmn_routines IS 'Available rest routine activities for students';
COMMENT ON TABLE dmn_sessions IS 'Student problem-solving session tracking';
COMMENT ON TABLE dmn_events IS 'Rest routine suggestion and completion events';
COMMENT ON TABLE dmn_analytics IS 'Aggregated effectiveness analytics for routines';
