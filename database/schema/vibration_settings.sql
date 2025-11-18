-- Vibration Settings Schema for LMS Wrong Answer Alerts
-- This schema supports haptic feedback for students when high-risk wrong answers are detected

-- Main vibration configuration table per module
CREATE TABLE vibration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    trigger_on_wrong_answer BOOLEAN DEFAULT true,
    trigger_on_correct_answer BOOLEAN DEFAULT false,
    intensity_level INT CHECK (intensity_level BETWEEN 1 AND 10) DEFAULT 5,
    duration_ms INT DEFAULT 200,
    pattern VARCHAR(50) DEFAULT 'short_pulse',
    risk_threshold VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vibration patterns library
CREATE TABLE vibration_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    pulses INT[] NOT NULL, -- Array of milliseconds for each pulse
    use_case VARCHAR(100), -- wrong_answer, correct_answer, warning, critical
    intensity_default INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempt tracking with vibration support
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    answer_numerator INTEGER,
    answer_denominator INTEGER,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempt_number INT DEFAULT 1, -- Track multiple attempts on same problem
    vibration_triggered BOOLEAN DEFAULT false,
    vibration_pattern VARCHAR(50),
    risk_level VARCHAR(20), -- low, medium, high
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Vibration event log for analytics
CREATE TABLE vibration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    module_id UUID NOT NULL,
    is_correct BOOLEAN NOT NULL,
    pattern VARCHAR(50),
    intensity INT,
    duration_ms INT,
    device_supported BOOLEAN,
    user_agent TEXT,
    risk_level VARCHAR(20),
    attempt_number INT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Problem metadata for risk assessment
CREATE TABLE problem_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE,
    module_id UUID NOT NULL,
    concept_importance DECIMAL(3,2) CHECK (concept_importance BETWEEN 0 AND 1), -- 0.0 to 1.0
    difficulty_level VARCHAR(20), -- easy, medium, hard
    prerequisite_concepts TEXT[],
    typical_error_patterns JSONB,
    vibration_recommended BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vibration_settings_module ON vibration_settings(module_id);
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_module ON student_attempts(module_id);
CREATE INDEX idx_vibration_events_student ON vibration_events(student_id);
CREATE INDEX idx_vibration_events_module ON vibration_events(module_id);
CREATE INDEX idx_vibration_events_recorded ON vibration_events(recorded_at DESC);
CREATE INDEX idx_problem_metadata_module ON problem_metadata(module_id);

-- Insert default vibration patterns
INSERT INTO vibration_patterns (name, description, pulses, use_case, intensity_default) VALUES
('short_pulse', 'Single short vibration for minor errors', ARRAY[200], 'wrong_answer', 3),
('double_pulse', 'Double pulse for medium-risk wrong answers', ARRAY[100, 50, 100], 'wrong_answer', 5),
('warning_pattern', 'Triple pulse for high-risk situations', ARRAY[150, 75, 150, 75, 150], 'warning', 7),
('critical_alert', 'Strong pattern for critical errors', ARRAY[200, 100, 200, 100, 200, 100, 200], 'critical', 9),
('success_pulse', 'Positive feedback for correct answers', ARRAY[200], 'correct_answer', 4),
('encouragement', 'Light triple tap for encouragement', ARRAY[50, 50, 50, 50, 50], 'encouragement', 3);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_vibration_settings_timestamp
    BEFORE UPDATE ON vibration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_metadata_timestamp
    BEFORE UPDATE ON problem_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for analytics: Vibration effectiveness by module
CREATE VIEW vibration_effectiveness AS
SELECT
    ve.module_id,
    ve.pattern,
    COUNT(*) as total_vibrations,
    SUM(CASE WHEN ve.is_correct = false THEN 1 ELSE 0 END) as wrong_answer_vibrations,
    AVG(sa.attempt_number) as avg_attempts,
    ve.risk_level,
    DATE_TRUNC('day', ve.recorded_at) as date
FROM vibration_events ve
LEFT JOIN student_attempts sa ON ve.problem_id = sa.problem_id AND ve.student_id = sa.student_id
GROUP BY ve.module_id, ve.pattern, ve.risk_level, DATE_TRUNC('day', ve.recorded_at);

-- View for student progress with vibration data
CREATE VIEW student_vibration_summary AS
SELECT
    sa.student_id,
    sa.module_id,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    SUM(CASE WHEN sa.vibration_triggered THEN 1 ELSE 0 END) as vibrations_received,
    AVG(sa.time_spent_seconds) as avg_time_spent,
    MAX(sa.attempted_at) as last_attempt
FROM student_attempts sa
GROUP BY sa.student_id, sa.module_id;

COMMENT ON TABLE vibration_settings IS 'Configuration for haptic feedback per module';
COMMENT ON TABLE vibration_patterns IS 'Library of predefined vibration patterns for different educational contexts';
COMMENT ON TABLE student_attempts IS 'Student answer attempts with vibration trigger tracking';
COMMENT ON TABLE vibration_events IS 'Log of all vibration events for analytics';
COMMENT ON TABLE problem_metadata IS 'Additional metadata for problems to support risk assessment';
