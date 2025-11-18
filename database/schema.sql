-- Wrong Move Alert Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'input', 'drag_drop', 'step_by_step')),
    correct_answer TEXT NOT NULL,
    steps JSONB,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Moodle integration fields
    moodle_course_id VARCHAR(255),
    moodle_activity_id VARCHAR(255),
    moodle_question_id VARCHAR(255),

    -- Metadata
    tags TEXT[],
    estimated_time_minutes INTEGER,
    learning_objectives TEXT[]
);

-- Indexes for problems
CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_grade_level ON problems(grade_level);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_moodle_course ON problems(moodle_course_id);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),

    -- Moodle integration
    moodle_user_id VARCHAR(255) UNIQUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP
);

-- Indexes for students
CREATE INDEX idx_students_moodle_user ON students(moodle_user_id);
CREATE INDEX idx_students_grade_level ON students(grade_level);

-- Student interactions table
CREATE TABLE IF NOT EXISTS student_interactions (
    id VARCHAR(255) PRIMARY KEY,
    problem_id VARCHAR(255) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    step_id VARCHAR(255),

    -- Performance metrics
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,

    -- Context
    session_id VARCHAR(255),
    device_type VARCHAR(50)
);

-- Indexes for student_interactions
CREATE INDEX idx_interactions_problem ON student_interactions(problem_id);
CREATE INDEX idx_interactions_student ON student_interactions(student_id);
CREATE INDEX idx_interactions_timestamp ON student_interactions(timestamp DESC);
CREATE INDEX idx_interactions_session ON student_interactions(session_id);

-- Wrong move events table
CREATE TABLE IF NOT EXISTS wrong_move_events (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    problem_id VARCHAR(255) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    step_id VARCHAR(255),
    student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
    incorrect_action TEXT NOT NULL,
    expected_action TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),

    -- Additional context
    misconception_type VARCHAR(100),
    feedback_provided TEXT,

    -- Tracking
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP
);

-- Indexes for wrong_move_events
CREATE INDEX idx_wrong_moves_problem ON wrong_move_events(problem_id);
CREATE INDEX idx_wrong_moves_student ON wrong_move_events(student_id);
CREATE INDEX idx_wrong_moves_timestamp ON wrong_move_events(timestamp DESC);
CREATE INDEX idx_wrong_moves_severity ON wrong_move_events(severity);

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,

    -- Session metrics
    problems_attempted INTEGER DEFAULT 0,
    problems_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_moves_count INTEGER DEFAULT 0,

    -- Context
    device_info JSONB,
    ip_address INET
);

-- Indexes for learning_sessions
CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_started ON learning_sessions(started_at DESC);

-- Moodle integration log table
CREATE TABLE IF NOT EXISTS moodle_integration_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operation VARCHAR(100) NOT NULL,
    moodle_endpoint VARCHAR(500),
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT
);

-- Indexes for moodle_integration_log
CREATE INDEX idx_moodle_log_timestamp ON moodle_integration_log(timestamp DESC);
CREATE INDEX idx_moodle_log_operation ON moodle_integration_log(operation);
CREATE INDEX idx_moodle_log_success ON moodle_integration_log(success);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO system_config (key, value, description) VALUES
    ('moodle_base_url', '"https://moodle.example.com"', 'Moodle LMS base URL'),
    ('moodle_api_token', '""', 'Moodle Web Services API token'),
    ('wrong_move_severity_threshold', '{"low": 1, "medium": 3, "high": 5}', 'Thresholds for wrong move severity'),
    ('crack_effect_duration_ms', '2000', 'Duration of crack effect animation in milliseconds')
ON CONFLICT (key) DO NOTHING;

-- Views for analytics

-- Student performance view
CREATE OR REPLACE VIEW student_performance AS
SELECT
    s.id as student_id,
    s.name as student_name,
    s.grade_level,
    COUNT(DISTINCT si.problem_id) as problems_attempted,
    COUNT(CASE WHEN si.is_correct THEN 1 END) as correct_answers,
    COUNT(CASE WHEN NOT si.is_correct THEN 1 END) as wrong_answers,
    ROUND(AVG(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END), 2) as accuracy_percentage,
    COUNT(wme.id) as total_wrong_moves,
    MAX(si.timestamp) as last_activity
FROM students s
LEFT JOIN student_interactions si ON s.id = si.student_id
LEFT JOIN wrong_move_events wme ON s.id = wme.student_id
GROUP BY s.id, s.name, s.grade_level;

-- Problem difficulty analysis view
CREATE OR REPLACE VIEW problem_difficulty_analysis AS
SELECT
    p.id as problem_id,
    p.title,
    p.difficulty as declared_difficulty,
    p.subject,
    COUNT(DISTINCT si.student_id) as students_attempted,
    COUNT(CASE WHEN si.is_correct THEN 1 END) as correct_attempts,
    COUNT(CASE WHEN NOT si.is_correct THEN 1 END) as wrong_attempts,
    ROUND(AVG(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END), 2) as success_rate,
    COUNT(wme.id) as wrong_moves_triggered,
    CASE
        WHEN AVG(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END) >= 80 THEN 'easy'
        WHEN AVG(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END) >= 50 THEN 'medium'
        ELSE 'hard'
    END as calculated_difficulty
FROM problems p
LEFT JOIN student_interactions si ON p.id = si.problem_id
LEFT JOIN wrong_move_events wme ON p.id = wme.problem_id
GROUP BY p.id, p.title, p.difficulty, p.subject;

-- Functions

-- Function to calculate student accuracy
CREATE OR REPLACE FUNCTION calculate_student_accuracy(student_id_param VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
    accuracy NUMERIC;
BEGIN
    SELECT ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 2)
    INTO accuracy
    FROM student_interactions
    WHERE student_id = student_id_param;

    RETURN COALESCE(accuracy, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get problem statistics
CREATE OR REPLACE FUNCTION get_problem_stats(problem_id_param VARCHAR)
RETURNS TABLE(
    total_attempts BIGINT,
    unique_students BIGINT,
    success_rate NUMERIC,
    avg_wrong_moves NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_attempts,
        COUNT(DISTINCT si.student_id)::BIGINT as unique_students,
        ROUND(AVG(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END), 2) as success_rate,
        (SELECT COUNT(*)::NUMERIC FROM wrong_move_events WHERE problem_id = problem_id_param) as avg_wrong_moves
    FROM student_interactions si
    WHERE si.problem_id = problem_id_param;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to problems table
CREATE TRIGGER update_problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply update trigger to system_config table
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE problems IS 'Educational problems/questions with support for Moodle integration';
COMMENT ON TABLE students IS 'Student profiles with Moodle user mapping';
COMMENT ON TABLE student_interactions IS 'Records of all student interactions with problems';
COMMENT ON TABLE wrong_move_events IS 'Log of incorrect actions that trigger the wrong move alert';
COMMENT ON TABLE learning_sessions IS 'Student learning sessions with performance metrics';
COMMENT ON TABLE moodle_integration_log IS 'Audit log for Moodle API interactions';
COMMENT ON VIEW student_performance IS 'Aggregated student performance metrics';
COMMENT ON VIEW problem_difficulty_analysis IS 'Analysis of problem difficulty based on actual performance';
