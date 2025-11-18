-- Database Schema for Equation Animation Feature
-- KAIST Touch Math Academy AI Education System
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MODULES TABLE
-- Stores educational module information
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(20) NOT NULL,
    teacher_id UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('generating', 'active', 'archived')),
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_grade ON modules(grade_level);


-- ============================================================================
-- EQUATION PROBLEMS TABLE
-- Stores equation problems for simplification and solving
-- ============================================================================
CREATE TABLE IF NOT EXISTS equation_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,

    -- Equation content
    original_equation TEXT NOT NULL,
    simplified_equation TEXT NOT NULL,
    latex_original TEXT NOT NULL,
    latex_simplified TEXT NOT NULL,

    -- Metadata
    topic VARCHAR(100) NOT NULL,
    problem_type VARCHAR(50) CHECK (problem_type IN ('simplification', 'solving', 'factoring', 'expanding')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    grade_level VARCHAR(20) NOT NULL,

    -- Configuration
    simplification_strategy VARCHAR(50) DEFAULT 'auto',
    animation_config JSONB DEFAULT '{"transitionDuration": 800, "stepDelay": 1500, "autoPlay": false}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equation_problems_module ON equation_problems(module_id);
CREATE INDEX idx_equation_problems_topic ON equation_problems(topic);
CREATE INDEX idx_equation_problems_difficulty ON equation_problems(difficulty_level);
CREATE INDEX idx_equation_problems_type ON equation_problems(problem_type);


-- ============================================================================
-- EQUATION STEPS TABLE
-- Stores step-by-step simplification process
-- ============================================================================
CREATE TABLE IF NOT EXISTS equation_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES equation_problems(id) ON DELETE CASCADE,

    -- Step content
    step_number INTEGER NOT NULL,
    equation_latex TEXT NOT NULL,
    description TEXT NOT NULL,
    rule_applied VARCHAR(255) NOT NULL,

    -- Animation properties
    delay_ms INTEGER DEFAULT 1500,
    changed_elements JSONB DEFAULT '[]',
    highlight_color VARCHAR(20) DEFAULT '#FFA726',

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(problem_id, step_number)
);

CREATE INDEX idx_equation_steps_problem ON equation_steps(problem_id);
CREATE INDEX idx_equation_steps_number ON equation_steps(problem_id, step_number);


-- ============================================================================
-- STUDENTS TABLE
-- Stores student information
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(20),
    enrolled_modules UUID[] DEFAULT '{}',

    -- Preferences
    preferences JSONB DEFAULT '{"animationSpeed": 1.0, "showHints": true}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_grade ON students(grade_level);
CREATE INDEX idx_students_email ON students(email);


-- ============================================================================
-- STUDENT ATTEMPTS TABLE
-- Tracks student attempts at solving equation problems
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES equation_problems(id) ON DELETE CASCADE,

    -- Attempt data
    student_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hints_requested INTEGER DEFAULT 0,

    -- Interaction tracking
    interactions JSONB DEFAULT '[]',
    steps_viewed INTEGER[] DEFAULT '{}',
    playback_speed DECIMAL(3,1) DEFAULT 1.0,

    -- Timestamps
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_correct ON student_attempts(is_correct);
CREATE INDEX idx_student_attempts_date ON student_attempts(attempted_at);


-- ============================================================================
-- STUDENT PROGRESS TABLE
-- Aggregated progress tracking per module
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Progress metrics
    total_problems INTEGER DEFAULT 0,
    problems_completed INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    average_time_seconds INTEGER,
    total_hints_used INTEGER DEFAULT 0,

    -- Progress percentage (0-100)
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

    -- Mastery level (1-5)
    mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    UNIQUE(student_id, module_id)
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);
CREATE INDEX idx_student_progress_percentage ON student_progress(progress_percentage);


-- ============================================================================
-- TEACHERS TABLE
-- Stores teacher/instructor information
-- ============================================================================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255) DEFAULT 'KAIST Touch Math Academy',
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'system_maintainer')),

    -- Preferences
    preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_role ON teachers(role);


-- ============================================================================
-- ANIMATION EVENTS TABLE
-- Logs animation interaction events for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS animation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    problem_id UUID REFERENCES equation_problems(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,

    -- Event data
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN
        ('step_forward', 'step_backward', 'play', 'pause', 'reset', 'speed_change')),
    current_step INTEGER,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    event_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_animation_events_student ON animation_events(student_id);
CREATE INDEX idx_animation_events_problem ON animation_events(problem_id);
CREATE INDEX idx_animation_events_type ON animation_events(event_type);
CREATE INDEX idx_animation_events_timestamp ON animation_events(event_timestamp);


-- ============================================================================
-- TRIGGERS
-- Automatically update timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equation_problems_updated_at BEFORE UPDATE ON equation_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- VIEWS
-- Useful aggregated data views
-- ============================================================================

-- Student Performance Summary View
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    s.grade_level,
    COUNT(DISTINCT sa.problem_id) AS total_attempts,
    COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.problem_id END) AS correct_attempts,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN sa.is_correct THEN sa.problem_id END) /
        NULLIF(COUNT(DISTINCT sa.problem_id), 0),
        2
    ) AS success_rate,
    AVG(sa.time_spent_seconds) AS avg_time_seconds,
    SUM(sa.hints_requested) AS total_hints
FROM students s
LEFT JOIN student_attempts sa ON s.id = sa.student_id
GROUP BY s.id, s.name, s.grade_level;


-- Problem Difficulty Analysis View
CREATE OR REPLACE VIEW problem_difficulty_analysis AS
SELECT
    ep.id AS problem_id,
    ep.topic,
    ep.difficulty_level,
    COUNT(sa.id) AS total_attempts,
    COUNT(CASE WHEN sa.is_correct THEN 1 END) AS correct_attempts,
    ROUND(
        100.0 * COUNT(CASE WHEN sa.is_correct THEN 1 END) /
        NULLIF(COUNT(sa.id), 0),
        2
    ) AS success_rate,
    AVG(sa.time_spent_seconds) AS avg_solve_time
FROM equation_problems ep
LEFT JOIN student_attempts sa ON ep.id = sa.problem_id
GROUP BY ep.id, ep.topic, ep.difficulty_level;


-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- Insert sample teacher
INSERT INTO teachers (name, email, role) VALUES
    ('Professor Kim', 'kim@kaist.ac.kr', 'teacher'),
    ('Dr. Lee', 'lee@kaist.ac.kr', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample module
INSERT INTO modules (name, description, grade_level, status) VALUES
    ('Algebra Basics', 'Introduction to algebraic expressions and equations', '7', 'active'),
    ('Advanced Polynomials', 'Polynomial operations and factoring', '8', 'active')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- COMMENTS
-- Add helpful comments to tables
-- ============================================================================

COMMENT ON TABLE modules IS 'Educational modules created by teachers';
COMMENT ON TABLE equation_problems IS 'Mathematical equation problems for students';
COMMENT ON TABLE equation_steps IS 'Step-by-step simplification process for animations';
COMMENT ON TABLE students IS 'Student accounts and basic information';
COMMENT ON TABLE student_attempts IS 'Individual problem-solving attempts by students';
COMMENT ON TABLE student_progress IS 'Aggregated progress metrics per student per module';
COMMENT ON TABLE teachers IS 'Teacher/instructor accounts';
COMMENT ON TABLE animation_events IS 'Detailed interaction tracking for animations';

COMMENT ON COLUMN equation_problems.animation_config IS 'JSON configuration for animation behavior';
COMMENT ON COLUMN equation_steps.changed_elements IS 'Array of equation elements that changed in this step';
COMMENT ON COLUMN student_attempts.interactions IS 'Array of interaction events during this attempt';


-- ============================================================================
-- GRANTS (adjust based on your user roles)
-- ============================================================================

-- Grant permissions to application user (replace 'app_user' with actual username)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
