-- AI Education System: Learning Analytics & Thinking Flow Tracking
-- Database Schema for Student Activity Tracking and Analysis

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules (Learning modules)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems (Questions/Tasks within modules)
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    expected_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning sessions (Each attempt to solve problems)
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_time_seconds INTEGER,
    is_correct BOOLEAN,
    submitted_answer JSONB,
    status VARCHAR(50) DEFAULT 'in_progress',
    CONSTRAINT session_status_check CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Activity events (Fine-grained tracking of student actions)
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_since_start_ms BIGINT NOT NULL,
    CONSTRAINT event_type_check CHECK (event_type IN (
        'problem_start',
        'input_focus',
        'input_blur',
        'input_change',
        'button_click',
        'pause_detected',
        'resume_detected',
        'hint_requested',
        'answer_submitted',
        'problem_completed'
    ))
);

-- Thinking flow analysis (Computed analysis results)
CREATE TABLE IF NOT EXISTS thinking_flow_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    delay_segments JSONB NOT NULL,
    thinking_pattern JSONB NOT NULL,
    struggle_points JSONB,
    cognitive_load_score DECIMAL(5,2),
    persistence_score DECIMAL(5,2),
    efficiency_score DECIMAL(5,2),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analysis_type_check CHECK (analysis_type IN (
        'delay_analysis',
        'thinking_pattern',
        'comprehensive'
    ))
);

-- Delay segments (Periods where student paused/struggled)
CREATE TABLE IF NOT EXISTS delay_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES thinking_flow_analysis(id) ON DELETE CASCADE,
    start_time_ms BIGINT NOT NULL,
    end_time_ms BIGINT NOT NULL,
    duration_ms BIGINT NOT NULL,
    segment_type VARCHAR(50) NOT NULL,
    context JSONB,
    CONSTRAINT segment_type_check CHECK (segment_type IN (
        'pause',
        'struggle',
        'exploration',
        'verification'
    ))
);

-- Create indexes for performance
CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_learning_sessions_module ON learning_sessions(module_id);
CREATE INDEX idx_learning_sessions_problem ON learning_sessions(problem_id);
CREATE INDEX idx_learning_sessions_started ON learning_sessions(started_at);

CREATE INDEX idx_activity_events_session ON activity_events(session_id);
CREATE INDEX idx_activity_events_timestamp ON activity_events(timestamp);
CREATE INDEX idx_activity_events_type ON activity_events(event_type);

CREATE INDEX idx_thinking_flow_session ON thinking_flow_analysis(session_id);
CREATE INDEX idx_delay_segments_analysis ON delay_segments(analysis_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE learning_sessions IS 'Tracks each student attempt to solve a problem';
COMMENT ON TABLE activity_events IS 'Fine-grained tracking of all student interactions during problem solving';
COMMENT ON TABLE thinking_flow_analysis IS 'AI-generated analysis of student thinking patterns and delays';
COMMENT ON TABLE delay_segments IS 'Identified periods where student showed delays, pauses, or struggles';

COMMENT ON COLUMN activity_events.time_since_start_ms IS 'Milliseconds elapsed since session start for accurate timeline reconstruction';
COMMENT ON COLUMN thinking_flow_analysis.cognitive_load_score IS 'Estimated cognitive load (0-100) based on pause patterns and error rates';
COMMENT ON COLUMN thinking_flow_analysis.persistence_score IS 'Measure of student persistence (0-100) when facing difficulties';
COMMENT ON COLUMN thinking_flow_analysis.efficiency_score IS 'Problem-solving efficiency (0-100) relative to expected time';
