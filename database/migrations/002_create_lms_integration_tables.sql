-- Migration: Create LMS integration tables
-- Version: 002
-- Created: 2025-11-18

-- Create lms_configurations table for storing LMS connection details
CREATE TABLE IF NOT EXISTS lms_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    lms_type VARCHAR(50) NOT NULL, -- 'canvas', 'moodle', 'blackboard', 'custom'
    base_url VARCHAR(500) NOT NULL,
    api_key_encrypted TEXT,
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    configuration JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create lms_sync_logs table for tracking synchronization
CREATE TABLE IF NOT EXISTS lms_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_config_id UUID NOT NULL REFERENCES lms_configurations(id),
    sync_type VARCHAR(50) NOT NULL, -- 'timeline', 'analytics', 'gradebook'
    entity_type VARCHAR(50) NOT NULL, -- 'student', 'module', 'session'
    entity_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_sync_logs_config ON lms_sync_logs(lms_config_id);
CREATE INDEX idx_lms_sync_logs_entity ON lms_sync_logs(entity_type, entity_id);
CREATE INDEX idx_lms_sync_logs_status ON lms_sync_logs(status);
CREATE INDEX idx_lms_sync_logs_started_at ON lms_sync_logs(started_at DESC);

-- Create lms_exports table for tracking data exports to LMS
CREATE TABLE IF NOT EXISTS lms_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_config_id UUID NOT NULL REFERENCES lms_configurations(id),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- 'timeline', 'summary', 'analytics', 'gradebook'
    export_format VARCHAR(20) NOT NULL, -- 'json', 'csv', 'xapi', 'lti'
    file_path TEXT,
    file_size_bytes INTEGER,
    export_data JSONB,
    is_synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_exports_config ON lms_exports(lms_config_id);
CREATE INDEX idx_lms_exports_student ON lms_exports(student_id);
CREATE INDEX idx_lms_exports_module ON lms_exports(module_id);
CREATE INDEX idx_lms_exports_synced ON lms_exports(is_synced, created_at DESC);

-- Create xapi_statements table for xAPI (Experience API) support
CREATE TABLE IF NOT EXISTS xapi_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    statement_id UUID NOT NULL UNIQUE,
    actor JSONB NOT NULL, -- Student information
    verb JSONB NOT NULL, -- Action performed
    object JSONB NOT NULL, -- What was acted upon
    result JSONB, -- Outcome of the action
    context JSONB, -- Additional context
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    stored TIMESTAMP DEFAULT NOW(),
    authority JSONB,
    version VARCHAR(20) DEFAULT '1.0.3',
    session_id UUID REFERENCES session_summaries(session_id),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_xapi_statements_statement_id ON xapi_statements(statement_id);
CREATE INDEX idx_xapi_statements_session ON xapi_statements(session_id);
CREATE INDEX idx_xapi_statements_student ON xapi_statements(student_id);
CREATE INDEX idx_xapi_statements_module ON xapi_statements(module_id);
CREATE INDEX idx_xapi_statements_timestamp ON xapi_statements(timestamp DESC);

COMMENT ON TABLE xapi_statements IS 'xAPI (Experience API / Tin Can API) statements for LMS integration';
COMMENT ON COLUMN xapi_statements.statement_id IS 'Unique identifier for the xAPI statement';
COMMENT ON COLUMN xapi_statements.actor IS 'JSON representation of the actor (student)';
COMMENT ON COLUMN xapi_statements.verb IS 'JSON representation of the verb (action)';
COMMENT ON COLUMN xapi_statements.object IS 'JSON representation of the object (activity)';

-- Create function to generate xAPI statements from timeline events
CREATE OR REPLACE FUNCTION generate_xapi_statement(
    p_session_id UUID,
    p_event_type VARCHAR,
    p_event_data JSONB,
    p_student_id UUID,
    p_module_id UUID,
    p_timestamp TIMESTAMP
)
RETURNS UUID AS $$
DECLARE
    v_statement_id UUID;
    v_verb JSONB;
    v_result JSONB;
BEGIN
    v_statement_id := uuid_generate_v4();

    -- Map event types to xAPI verbs
    v_verb := CASE p_event_type
        WHEN 'problem_started' THEN '{"id": "http://adlnet.gov/expapi/verbs/attempted", "display": {"en-US": "attempted"}}'::jsonb
        WHEN 'answer_submitted' THEN '{"id": "http://adlnet.gov/expapi/verbs/answered", "display": {"en-US": "answered"}}'::jsonb
        WHEN 'problem_completed' THEN '{"id": "http://adlnet.gov/expapi/verbs/completed", "display": {"en-US": "completed"}}'::jsonb
        WHEN 'hint_requested' THEN '{"id": "http://adlnet.gov/expapi/verbs/asked", "display": {"en-US": "asked"}}'::jsonb
        ELSE '{"id": "http://adlnet.gov/expapi/verbs/interacted", "display": {"en-US": "interacted"}}'::jsonb
    END;

    -- Build result object for answer submissions
    v_result := CASE
        WHEN p_event_type = 'answer_validated' THEN
            jsonb_build_object(
                'success', (p_event_data->>'is_correct')::boolean,
                'response', p_event_data->'answer',
                'duration', p_event_data->>'duration'
            )
        ELSE NULL
    END;

    INSERT INTO xapi_statements (
        statement_id,
        actor,
        verb,
        object,
        result,
        context,
        timestamp,
        session_id,
        student_id,
        module_id
    ) VALUES (
        v_statement_id,
        jsonb_build_object(
            'objectType', 'Agent',
            'account', jsonb_build_object(
                'homePage', 'https://kaist-touch-math.edu',
                'name', p_student_id::text
            )
        ),
        v_verb,
        jsonb_build_object(
            'id', format('https://kaist-touch-math.edu/modules/%s/problems/%s',
                        p_module_id::text, p_event_data->>'problem_id'),
            'objectType', 'Activity',
            'definition', jsonb_build_object(
                'name', jsonb_build_object('en-US', p_event_data->>'problem_name'),
                'type', 'http://adlnet.gov/expapi/activities/assessment'
            )
        ),
        v_result,
        jsonb_build_object(
            'contextActivities', jsonb_build_object(
                'parent', jsonb_build_array(
                    jsonb_build_object(
                        'id', format('https://kaist-touch-math.edu/modules/%s', p_module_id::text),
                        'objectType', 'Activity'
                    )
                )
            ),
            'extensions', jsonb_build_object(
                'https://kaist-touch-math.edu/extensions/session-id', p_session_id::text,
                'https://kaist-touch-math.edu/extensions/event-type', p_event_type,
                'https://kaist-touch-math.edu/extensions/event-data', p_event_data
            )
        ),
        p_timestamp,
        p_session_id,
        p_student_id,
        p_module_id
    );

    RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate xAPI statements for key events
CREATE OR REPLACE FUNCTION auto_generate_xapi_statement()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate xAPI statements for key events
    IF NEW.event_type IN ('problem_started', 'answer_submitted', 'answer_validated', 'problem_completed', 'hint_requested') THEN
        PERFORM generate_xapi_statement(
            NEW.session_id,
            NEW.event_type,
            NEW.event_data,
            NEW.student_id,
            NEW.module_id,
            NEW.timestamp
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_xapi_statement
AFTER INSERT ON solution_timelines
FOR EACH ROW
EXECUTE FUNCTION auto_generate_xapi_statement();

-- Create view for LMS export data
CREATE OR REPLACE VIEW lms_student_progress AS
SELECT
    s.student_id,
    s.module_id,
    COUNT(DISTINCT s.session_id) as total_sessions,
    SUM(s.duration_seconds) as total_time_seconds,
    AVG(s.duration_seconds) as avg_session_duration,
    SUM(CASE WHEN s.is_completed THEN 1 ELSE 0 END) as completed_sessions,
    SUM(CASE WHEN s.is_correct THEN 1 ELSE 0 END) as correct_sessions,
    ROUND(
        (SUM(CASE WHEN s.is_completed THEN 1 ELSE 0 END)::NUMERIC /
         NULLIF(COUNT(DISTINCT s.session_id), 0)) * 100,
        2
    ) as completion_rate,
    ROUND(
        (SUM(CASE WHEN s.is_correct THEN 1 ELSE 0 END)::NUMERIC /
         NULLIF(SUM(CASE WHEN s.is_completed THEN 1 ELSE 0 END), 0)) * 100,
        2
    ) as accuracy_rate,
    AVG(s.answer_attempts) as avg_attempts_per_problem,
    AVG(s.hints_used) as avg_hints_per_problem,
    MIN(s.started_at) as first_session_at,
    MAX(s.started_at) as last_session_at
FROM session_summaries s
GROUP BY s.student_id, s.module_id;

COMMENT ON VIEW lms_student_progress IS 'Aggregated student progress data for LMS export';

-- Add table comments
COMMENT ON TABLE lms_configurations IS 'Configuration for external LMS integrations';
COMMENT ON TABLE lms_sync_logs IS 'Log of all synchronization attempts with external LMS';
COMMENT ON TABLE lms_exports IS 'Tracking table for data exports to LMS systems';
