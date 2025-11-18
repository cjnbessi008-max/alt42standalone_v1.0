-- Student Progress Tracking Schema
-- For monitoring learning speed and detecting slowdowns

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table (educational modules)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('generating', 'active', 'archived')),
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    total_problems_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- Student attempts (detailed problem-level tracking)
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID,
    problem_type VARCHAR(100),
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    hints_used INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 1,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    attempted_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Learning speed metrics (aggregated per time window)
CREATE TABLE IF NOT EXISTS learning_speed_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    time_window_start TIMESTAMP NOT NULL,
    time_window_end TIMESTAMP NOT NULL,
    problems_completed INTEGER DEFAULT 0,
    average_time_per_problem DECIMAL(10,2),
    accuracy_rate DECIMAL(5,2),
    speed_score DECIMAL(10,2), -- Problems per hour
    speed_trend VARCHAR(20) CHECK (speed_trend IN ('increasing', 'stable', 'decreasing', 'unknown')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id, time_window_start)
);

-- Mental care messages sent to students
CREATE TABLE IF NOT EXISTS mental_care_messages_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('encouragement', 'break_suggestion', 'strategy_tip', 'celebration')),
    trigger_reason VARCHAR(100) NOT NULL,
    message_text_ko TEXT NOT NULL,
    message_text_en TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    student_reaction VARCHAR(50), -- helpful, not_helpful, neutral
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);
CREATE INDEX idx_student_progress_last_activity ON student_progress(last_activity_at);

CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_module ON student_attempts(module_id);
CREATE INDEX idx_student_attempts_attempted_at ON student_attempts(attempted_at);

CREATE INDEX idx_learning_speed_metrics_student ON learning_speed_metrics(student_id);
CREATE INDEX idx_learning_speed_metrics_module ON learning_speed_metrics(module_id);
CREATE INDEX idx_learning_speed_metrics_time_window ON learning_speed_metrics(time_window_start, time_window_end);

CREATE INDEX idx_mental_care_messages_student ON mental_care_messages_sent(student_id);
CREATE INDEX idx_mental_care_messages_sent_at ON mental_care_messages_sent(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE students IS 'Students enrolled in the educational system';
COMMENT ON TABLE modules IS 'Educational modules/lessons created by teachers';
COMMENT ON TABLE student_progress IS 'Overall progress tracking for each student-module combination';
COMMENT ON TABLE student_attempts IS 'Detailed tracking of individual problem attempts';
COMMENT ON TABLE learning_speed_metrics IS 'Aggregated metrics to track learning speed over time windows';
COMMENT ON TABLE mental_care_messages_sent IS 'Log of mental care messages sent to students';

COMMENT ON COLUMN learning_speed_metrics.speed_score IS 'Calculated as problems_completed / hours_in_window';
COMMENT ON COLUMN mental_care_messages_sent.trigger_reason IS 'Why the message was sent (e.g., speed_decrease_20%, consecutive_errors, long_session)';
