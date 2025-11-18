-- Migration: Create solution_timelines table for recording student problem-solving process
-- Version: 001
-- Created: 2025-11-18

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create solution_timelines table
CREATE TABLE IF NOT EXISTS solution_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    sequence_number INTEGER NOT NULL,
    client_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_solution_timelines_student ON solution_timelines(student_id);
CREATE INDEX idx_solution_timelines_module ON solution_timelines(module_id);
CREATE INDEX idx_solution_timelines_problem ON solution_timelines(problem_id);
CREATE INDEX idx_solution_timelines_session ON solution_timelines(session_id);
CREATE INDEX idx_solution_timelines_timestamp ON solution_timelines(timestamp);
CREATE INDEX idx_solution_timelines_event_type ON solution_timelines(event_type);
CREATE INDEX idx_solution_timelines_session_sequence ON solution_timelines(session_id, sequence_number);

-- Create composite index for common queries
CREATE INDEX idx_solution_timelines_student_module_timestamp
ON solution_timelines(student_id, module_id, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE solution_timelines IS 'Records every interaction and event during a student''s problem-solving session';
COMMENT ON COLUMN solution_timelines.student_id IS 'Reference to the student';
COMMENT ON COLUMN solution_timelines.module_id IS 'Reference to the module being used';
COMMENT ON COLUMN solution_timelines.problem_id IS 'Reference to the specific problem';
COMMENT ON COLUMN solution_timelines.session_id IS 'Unique identifier for the problem-solving session';
COMMENT ON COLUMN solution_timelines.event_type IS 'Type of event: problem_started, input_changed, interaction, hint_requested, answer_submitted, answer_validated, problem_completed, session_paused, session_resumed';
COMMENT ON COLUMN solution_timelines.event_data IS 'JSON data containing event-specific information';
COMMENT ON COLUMN solution_timelines.timestamp IS 'Server timestamp when event was recorded';
COMMENT ON COLUMN solution_timelines.sequence_number IS 'Sequential number of the event within the session';
COMMENT ON COLUMN solution_timelines.client_timestamp IS 'Client-side timestamp when event occurred (for latency analysis)';

-- Create session_summaries table for aggregated session data
CREATE TABLE IF NOT EXISTS session_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE,
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    total_events INTEGER DEFAULT 0,
    answer_attempts INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_correct BOOLEAN,
    final_answer JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for session_summaries
CREATE INDEX idx_session_summaries_student ON session_summaries(student_id);
CREATE INDEX idx_session_summaries_module ON session_summaries(module_id);
CREATE INDEX idx_session_summaries_problem ON session_summaries(problem_id);
CREATE INDEX idx_session_summaries_started_at ON session_summaries(started_at DESC);

-- Add comments for session_summaries
COMMENT ON TABLE session_summaries IS 'Aggregated summary data for each problem-solving session';
COMMENT ON COLUMN session_summaries.duration_seconds IS 'Total time spent on the problem in seconds';
COMMENT ON COLUMN session_summaries.total_events IS 'Total number of events recorded in this session';
COMMENT ON COLUMN session_summaries.answer_attempts IS 'Number of times student submitted an answer';
COMMENT ON COLUMN session_summaries.hints_used IS 'Number of hints requested by student';

-- Create function to update session_summaries automatically
CREATE OR REPLACE FUNCTION update_session_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update session summary
    INSERT INTO session_summaries (
        session_id,
        student_id,
        module_id,
        problem_id,
        started_at,
        total_events
    ) VALUES (
        NEW.session_id,
        NEW.student_id,
        NEW.module_id,
        NEW.problem_id,
        NEW.timestamp,
        1
    )
    ON CONFLICT (session_id) DO UPDATE SET
        total_events = session_summaries.total_events + 1,
        updated_at = NOW(),
        completed_at = CASE
            WHEN NEW.event_type = 'problem_completed' THEN NEW.timestamp
            ELSE session_summaries.completed_at
        END,
        duration_seconds = CASE
            WHEN NEW.event_type = 'problem_completed' THEN
                EXTRACT(EPOCH FROM (NEW.timestamp - session_summaries.started_at))::INTEGER
            ELSE session_summaries.duration_seconds
        END,
        answer_attempts = session_summaries.answer_attempts +
            CASE WHEN NEW.event_type = 'answer_submitted' THEN 1 ELSE 0 END,
        hints_used = session_summaries.hints_used +
            CASE WHEN NEW.event_type = 'hint_requested' THEN 1 ELSE 0 END,
        is_completed = CASE
            WHEN NEW.event_type = 'problem_completed' THEN TRUE
            ELSE session_summaries.is_completed
        END,
        is_correct = CASE
            WHEN NEW.event_type = 'answer_validated' THEN (NEW.event_data->>'is_correct')::BOOLEAN
            ELSE session_summaries.is_correct
        END,
        final_answer = CASE
            WHEN NEW.event_type = 'answer_validated' THEN NEW.event_data->'answer'
            ELSE session_summaries.final_answer
        END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session summaries
CREATE TRIGGER trigger_update_session_summary
AFTER INSERT ON solution_timelines
FOR EACH ROW
EXECUTE FUNCTION update_session_summary();

-- Create view for easy access to session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT
    ss.session_id,
    ss.student_id,
    ss.module_id,
    ss.problem_id,
    ss.started_at,
    ss.completed_at,
    ss.duration_seconds,
    ss.total_events,
    ss.answer_attempts,
    ss.hints_used,
    ss.is_completed,
    ss.is_correct,
    ss.final_answer,
    COUNT(DISTINCT CASE WHEN st.event_type = 'input_changed' THEN st.id END) as input_changes,
    COUNT(DISTINCT CASE WHEN st.event_type = 'interaction' THEN st.id END) as ui_interactions,
    COUNT(DISTINCT CASE WHEN st.event_type = 'session_paused' THEN st.id END) as pause_count,
    COALESCE(
        EXTRACT(EPOCH FROM (ss.completed_at - ss.started_at))::INTEGER -
        COALESCE(SUM(
            CASE
                WHEN st.event_type = 'session_resumed' AND prev.event_type = 'session_paused'
                THEN EXTRACT(EPOCH FROM (st.timestamp - prev.timestamp))::INTEGER
                ELSE 0
            END
        ), 0),
        ss.duration_seconds
    ) as active_duration_seconds
FROM session_summaries ss
LEFT JOIN solution_timelines st ON st.session_id = ss.session_id
LEFT JOIN LATERAL (
    SELECT event_type, timestamp
    FROM solution_timelines
    WHERE session_id = st.session_id AND sequence_number = st.sequence_number - 1
    LIMIT 1
) prev ON st.event_type = 'session_resumed'
GROUP BY ss.session_id, ss.student_id, ss.module_id, ss.problem_id,
         ss.started_at, ss.completed_at, ss.duration_seconds, ss.total_events,
         ss.answer_attempts, ss.hints_used, ss.is_completed, ss.is_correct, ss.final_answer;

COMMENT ON VIEW session_analytics IS 'Aggregated analytics view combining session summaries with detailed event counts';
