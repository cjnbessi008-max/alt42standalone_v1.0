-- Migration: Add Motivation Mode Support
-- Version: 001
-- Created: 2025-11-18
-- Description: Add tables and columns to support "Just Do One Problem" motivation mode

-- ============================================================================
-- Table: motivation_mode_sessions
-- Purpose: Track individual motivation mode learning sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS motivation_mode_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Session metadata
    session_start TIMESTAMP NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP,
    duration_seconds INTEGER,

    -- Performance metrics
    problems_completed INTEGER DEFAULT 0 CHECK (problems_completed >= 0),
    problems_correct INTEGER DEFAULT 0 CHECK (problems_correct >= 0),
    problems_incorrect INTEGER DEFAULT 0 CHECK (problems_incorrect >= 0),
    max_streak INTEGER DEFAULT 0 CHECK (max_streak >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),

    -- Behavioral data
    mode_trigger VARCHAR(50) CHECK (mode_trigger IN (
        'student_initiated',
        'system_suggested',
        'auto_detected',
        'teacher_assigned'
    )),
    exit_reason VARCHAR(50) CHECK (exit_reason IN (
        'student_choice',
        'completed_goal',
        'timeout',
        'system_error',
        'session_limit_reached'
    )),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_motivation_sessions_student ON motivation_mode_sessions(student_id);
CREATE INDEX idx_motivation_sessions_module ON motivation_mode_sessions(module_id);
CREATE INDEX idx_motivation_sessions_date ON motivation_mode_sessions(session_start);
CREATE INDEX idx_motivation_sessions_active ON motivation_mode_sessions(student_id, module_id)
    WHERE session_end IS NULL;

-- ============================================================================
-- Table: motivation_mode_config
-- Purpose: Per-module configuration for motivation mode features
-- ============================================================================
CREATE TABLE IF NOT EXISTS motivation_mode_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE UNIQUE,

    -- Feature flags
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    auto_suggest_enabled BOOLEAN DEFAULT true NOT NULL,

    -- Trigger thresholds
    suggest_after_wrong_answers INTEGER DEFAULT 3 CHECK (suggest_after_wrong_answers > 0),
    suggest_after_idle_seconds INTEGER DEFAULT 300 CHECK (suggest_after_idle_seconds > 0),
    low_accuracy_threshold INTEGER DEFAULT 40 CHECK (low_accuracy_threshold BETWEEN 0 AND 100),

    -- UI customization
    positive_messages JSONB DEFAULT '["잘했어요!", "훌륭해요!", "완벽해요!"]'::jsonb,
    completion_messages JSONB DEFAULT '["오늘도 열심히 했어요!", "정말 잘했어요!"]'::jsonb,
    streak_messages JSONB DEFAULT '["🔥 연속 3문제!", "🔥 5문제 연속!"]'::jsonb,

    -- Session settings
    max_problems_per_session INTEGER CHECK (max_problems_per_session IS NULL OR max_problems_per_session > 0),
    recommended_problems_per_session INTEGER DEFAULT 5 CHECK (recommended_problems_per_session > 0),

    -- Problem difficulty adjustment
    difficulty_adjustment INTEGER DEFAULT -1 CHECK (difficulty_adjustment BETWEEN -2 AND 1),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Table: student_motivation_preferences
-- Purpose: Per-student preferences and statistics for motivation mode
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_motivation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,

    -- Preferences
    prefer_motivation_mode BOOLEAN DEFAULT false NOT NULL,
    auto_accept_suggestions BOOLEAN DEFAULT false NOT NULL,
    show_streak_counter BOOLEAN DEFAULT true NOT NULL,
    enable_sound_effects BOOLEAN DEFAULT false NOT NULL,
    enable_animations BOOLEAN DEFAULT true NOT NULL,

    -- Statistics
    total_motivation_sessions INTEGER DEFAULT 0 CHECK (total_motivation_sessions >= 0),
    total_problems_in_motivation_mode INTEGER DEFAULT 0 CHECK (total_problems_in_motivation_mode >= 0),
    last_motivation_session TIMESTAMP,
    highest_streak_achieved INTEGER DEFAULT 0 CHECK (highest_streak_achieved >= 0),

    -- Behavioral patterns
    avg_problems_per_session DECIMAL(5,2) DEFAULT 0.0,
    suggestion_acceptance_rate DECIMAL(5,2) DEFAULT 0.0 CHECK (suggestion_acceptance_rate BETWEEN 0 AND 100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Table: motivation_mode_problem_attempts
-- Purpose: Track individual problem attempts within motivation mode sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS motivation_mode_problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES motivation_mode_sessions(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL,  -- References dynamically generated problem tables
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Attempt data
    answer_data JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER CHECK (time_spent_seconds >= 0),

    -- Context
    streak_at_attempt INTEGER DEFAULT 0,
    problem_sequence_number INTEGER NOT NULL CHECK (problem_sequence_number > 0),

    -- Feedback provided
    feedback_message TEXT,
    encouragement_message TEXT,

    -- Timestamp
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_motivation_attempts_session ON motivation_mode_problem_attempts(session_id);
CREATE INDEX idx_motivation_attempts_problem ON motivation_mode_problem_attempts(problem_id);
CREATE INDEX idx_motivation_attempts_module ON motivation_mode_problem_attempts(module_id);

-- ============================================================================
-- Table: motivation_mode_suggestions
-- Purpose: Track system suggestions for motivation mode
-- ============================================================================
CREATE TABLE IF NOT EXISTS motivation_mode_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Suggestion metadata
    suggestion_reason VARCHAR(100) NOT NULL,
    trigger_data JSONB,  -- Store context that triggered suggestion

    -- Student response
    was_accepted BOOLEAN,
    response_time_seconds INTEGER,

    -- Timestamps
    suggested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_motivation_suggestions_student ON motivation_mode_suggestions(student_id);
CREATE INDEX idx_motivation_suggestions_module ON motivation_mode_suggestions(module_id);
CREATE INDEX idx_motivation_suggestions_date ON motivation_mode_suggestions(suggested_at);

-- ============================================================================
-- Alter existing tables to support motivation mode
-- ============================================================================

-- Add motivation mode flag to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS motivation_mode_enabled BOOLEAN DEFAULT true NOT NULL;

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_motivation_sessions_updated_at
    BEFORE UPDATE ON motivation_mode_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motivation_config_updated_at
    BEFORE UPDATE ON motivation_mode_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motivation_preferences_updated_at
    BEFORE UPDATE ON student_motivation_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create motivation config when module is created
CREATE OR REPLACE FUNCTION create_default_motivation_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO motivation_mode_config (module_id)
    VALUES (NEW.id)
    ON CONFLICT (module_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_motivation_config
    AFTER INSERT ON modules
    FOR EACH ROW
    WHEN (NEW.motivation_mode_enabled = true)
    EXECUTE FUNCTION create_default_motivation_config();

-- Function to calculate session duration on session end
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_motivation_session_duration
    BEFORE UPDATE ON motivation_mode_sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_duration();

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- View: Student motivation mode summary
CREATE OR REPLACE VIEW v_student_motivation_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    COUNT(DISTINCT mms.id) AS total_sessions,
    COALESCE(SUM(mms.problems_completed), 0) AS total_problems_completed,
    COALESCE(SUM(mms.problems_correct), 0) AS total_problems_correct,
    CASE
        WHEN SUM(mms.problems_completed) > 0
        THEN ROUND((SUM(mms.problems_correct)::DECIMAL / SUM(mms.problems_completed)) * 100, 2)
        ELSE 0
    END AS overall_accuracy,
    COALESCE(AVG(mms.problems_completed), 0)::DECIMAL(5,2) AS avg_problems_per_session,
    MAX(mms.max_streak) AS highest_streak,
    MAX(mms.session_start) AS last_session_date
FROM students s
LEFT JOIN motivation_mode_sessions mms ON s.id = mms.student_id
GROUP BY s.id, s.name;

-- View: Module motivation mode usage
CREATE OR REPLACE VIEW v_module_motivation_usage AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    COUNT(DISTINCT mms.student_id) AS unique_students,
    COUNT(mms.id) AS total_sessions,
    COALESCE(SUM(mms.problems_completed), 0) AS total_problems,
    COALESCE(AVG(mms.problems_completed), 0)::DECIMAL(5,2) AS avg_problems_per_session,
    CASE
        WHEN SUM(mms.problems_completed) > 0
        THEN ROUND((SUM(mms.problems_correct)::DECIMAL / SUM(mms.problems_completed)) * 100, 2)
        ELSE 0
    END AS overall_accuracy
FROM modules m
LEFT JOIN motivation_mode_sessions mms ON m.id = mms.module_id
WHERE m.motivation_mode_enabled = true
GROUP BY m.id, m.name;

-- ============================================================================
-- Sample Data / Default Configuration
-- ============================================================================

-- Insert default preferences for existing students
-- (This would typically be done via application logic, but shown here for completeness)
-- INSERT INTO student_motivation_preferences (student_id)
-- SELECT id FROM students
-- ON CONFLICT (student_id) DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE motivation_mode_sessions IS 'Tracks individual motivation mode learning sessions with performance metrics';
COMMENT ON TABLE motivation_mode_config IS 'Per-module configuration for motivation mode behavior and triggers';
COMMENT ON TABLE student_motivation_preferences IS 'Student-specific preferences and statistics for motivation mode';
COMMENT ON TABLE motivation_mode_problem_attempts IS 'Individual problem attempts within motivation mode sessions';
COMMENT ON TABLE motivation_mode_suggestions IS 'System suggestions for entering motivation mode and student responses';

COMMENT ON COLUMN motivation_mode_sessions.mode_trigger IS 'How the session was initiated: student_initiated, system_suggested, auto_detected, teacher_assigned';
COMMENT ON COLUMN motivation_mode_sessions.exit_reason IS 'Why the session ended: student_choice, completed_goal, timeout, system_error, session_limit_reached';
COMMENT ON COLUMN motivation_mode_config.difficulty_adjustment IS 'Difficulty level adjustment for problems in motivation mode (-2 to +1, default -1 for slightly easier)';

-- ============================================================================
-- Rollback Script (stored as comment for reference)
-- ============================================================================

/*
-- To rollback this migration:

DROP VIEW IF EXISTS v_module_motivation_usage;
DROP VIEW IF EXISTS v_student_motivation_summary;

DROP TRIGGER IF EXISTS calculate_motivation_session_duration ON motivation_mode_sessions;
DROP TRIGGER IF EXISTS auto_create_motivation_config ON modules;
DROP TRIGGER IF EXISTS update_motivation_preferences_updated_at ON student_motivation_preferences;
DROP TRIGGER IF EXISTS update_motivation_config_updated_at ON motivation_mode_config;
DROP TRIGGER IF EXISTS update_motivation_sessions_updated_at ON motivation_mode_sessions;

DROP FUNCTION IF EXISTS calculate_session_duration();
DROP FUNCTION IF EXISTS create_default_motivation_config();
DROP FUNCTION IF EXISTS update_updated_at_column();

ALTER TABLE modules DROP COLUMN IF EXISTS motivation_mode_enabled;

DROP TABLE IF EXISTS motivation_mode_suggestions CASCADE;
DROP TABLE IF EXISTS motivation_mode_problem_attempts CASCADE;
DROP TABLE IF EXISTS student_motivation_preferences CASCADE;
DROP TABLE IF EXISTS motivation_mode_config CASCADE;
DROP TABLE IF EXISTS motivation_mode_sessions CASCADE;
*/
