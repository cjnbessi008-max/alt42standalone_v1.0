-- Metacognitive Mirroring System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Core Tables
-- ==========================================

-- Learning Sessions
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_steps INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
    lms_context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_module ON learning_sessions(module_id);
CREATE INDEX idx_sessions_status ON learning_sessions(status);
CREATE INDEX idx_sessions_started ON learning_sessions(started_at);

-- Learning Steps
CREATE TABLE learning_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    action_count INTEGER DEFAULT 0,
    metacognitive_summary TEXT,
    cognitive_strategies JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_steps_session ON learning_steps(session_id);
CREATE INDEX idx_steps_type ON learning_steps(step_type);
CREATE INDEX idx_steps_number ON learning_steps(step_number);

-- Learning Actions
CREATE TABLE learning_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID REFERENCES learning_steps(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    sequence_number INTEGER NOT NULL
);

CREATE INDEX idx_actions_step ON learning_actions(step_id);
CREATE INDEX idx_actions_session ON learning_actions(session_id);
CREATE INDEX idx_actions_timestamp ON learning_actions(timestamp);
CREATE INDEX idx_actions_sequence ON learning_actions(session_id, sequence_number);

-- Metacognitive Summaries
CREATE TABLE metacognitive_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES learning_steps(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    summary_type VARCHAR(50) DEFAULT 'ai-generated',
    language VARCHAR(10) DEFAULT 'ko',
    generated_at TIMESTAMP DEFAULT NOW(),
    ai_model VARCHAR(50),
    generation_time_ms INTEGER,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_summaries_step ON metacognitive_summaries(step_id);
CREATE INDEX idx_summaries_type ON metacognitive_summaries(summary_type);

-- LMS Integration Log
CREATE TABLE lms_integration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
    integration_type VARCHAR(50),
    event_type VARCHAR(50),
    payload JSONB NOT NULL,
    response JSONB,
    status VARCHAR(20),
    sent_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX idx_lms_log_session ON lms_integration_log(session_id);
CREATE INDEX idx_lms_log_type ON lms_integration_log(integration_type);
CREATE INDEX idx_lms_log_status ON lms_integration_log(status);

-- ==========================================
-- Triggers for automatic updates
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_sessions_updated_at
    BEFORE UPDATE ON learning_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update action count when actions are added
CREATE OR REPLACE FUNCTION update_step_action_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE learning_steps
    SET action_count = action_count + 1
    WHERE id = NEW.step_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_action_count
    AFTER INSERT ON learning_actions
    FOR EACH ROW EXECUTE FUNCTION update_step_action_count();

-- ==========================================
-- Utility Views
-- ==========================================

-- Session Summary View
CREATE OR REPLACE VIEW session_summaries AS
SELECT
    ls.id as session_id,
    ls.student_id,
    ls.module_id,
    ls.problem_id,
    ls.started_at,
    ls.ended_at,
    ls.total_steps,
    ls.status,
    COUNT(DISTINCT lst.id) as actual_steps,
    COUNT(DISTINCT la.id) as total_actions,
    EXTRACT(EPOCH FROM (COALESCE(ls.ended_at, NOW()) - ls.started_at)) as duration_seconds,
    ARRAY_AGG(DISTINCT lst.step_type ORDER BY lst.step_type) as step_types_used,
    AVG(ms.confidence_score) as avg_confidence
FROM learning_sessions ls
LEFT JOIN learning_steps lst ON lst.session_id = ls.id
LEFT JOIN learning_actions la ON la.session_id = ls.id
LEFT JOIN metacognitive_summaries ms ON ms.step_id = lst.id
GROUP BY ls.id;

-- Step Details View
CREATE OR REPLACE VIEW step_details AS
SELECT
    ls.id as step_id,
    ls.session_id,
    ls.step_number,
    ls.step_type,
    ls.started_at,
    ls.ended_at,
    ls.duration_seconds,
    ls.action_count,
    ls.metacognitive_summary,
    ls.cognitive_strategies,
    ms.summary_text as ai_summary,
    ms.confidence_score,
    ms.ai_model,
    COUNT(la.id) as actual_action_count
FROM learning_steps ls
LEFT JOIN metacognitive_summaries ms ON ms.step_id = ls.id
LEFT JOIN learning_actions la ON la.step_id = ls.id
GROUP BY ls.id, ms.summary_text, ms.confidence_score, ms.ai_model;

-- ==========================================
-- Sample Data (for development/testing)
-- ==========================================

-- Insert sample students (for testing)
-- In production, this would come from the main KAIST system
INSERT INTO learning_sessions (student_id, module_id, problem_id, status) VALUES
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'active')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Performance Optimization
-- ==========================================

-- Analyze tables for query optimization
ANALYZE learning_sessions;
ANALYZE learning_steps;
ANALYZE learning_actions;
ANALYZE metacognitive_summaries;

-- ==========================================
-- Comments for documentation
-- ==========================================

COMMENT ON TABLE learning_sessions IS 'Records each student learning session for a specific problem';
COMMENT ON TABLE learning_steps IS 'Individual steps within a learning session, representing cognitive phases';
COMMENT ON TABLE learning_actions IS 'Granular user actions tracked during learning';
COMMENT ON TABLE metacognitive_summaries IS 'AI-generated summaries of what students are doing cognitively';
COMMENT ON TABLE lms_integration_log IS 'Log of all LMS integration events (LTI, xAPI, etc.)';

COMMENT ON COLUMN learning_sessions.lms_context IS 'JSON containing LTI/LMS context data';
COMMENT ON COLUMN learning_steps.cognitive_strategies IS 'Array of cognitive strategies identified in this step';
COMMENT ON COLUMN metacognitive_summaries.summary_type IS 'Source of summary: ai-generated, template, or cached';
