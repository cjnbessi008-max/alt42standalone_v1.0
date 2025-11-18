-- Initial Schema for Math Error Detection System
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (teachers and students)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    grade_level VARCHAR(50),
    institution VARCHAR(255) DEFAULT 'KAIST Touch Math Academy',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problem types enum
CREATE TYPE problem_type AS ENUM (
    'fraction_addition',
    'fraction_subtraction',
    'fraction_multiplication',
    'fraction_division',
    'fraction_simplification',
    'fraction_visualization',
    'arithmetic_addition',
    'arithmetic_subtraction',
    'arithmetic_multiplication',
    'arithmetic_division'
);

-- Difficulty levels enum
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id),
    type problem_type NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',

    -- Problem data (JSONB for flexibility)
    problem_data JSONB NOT NULL,
    -- Example for fractions: {"numerator1": 1, "denominator1": 2, "numerator2": 1, "denominator2": 4, "operation": "add"}

    -- Correct answer (JSONB)
    correct_answer JSONB NOT NULL,
    -- Example: {"numerator": 3, "denominator": 4}

    -- Visual representation preference
    visual_type VARCHAR(50),

    -- Tags for categorization
    tags TEXT[],

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    problem_id UUID NOT NULL REFERENCES problems(id),

    -- Student's answer
    student_answer JSONB NOT NULL,

    -- Validation results
    is_correct BOOLEAN NOT NULL,
    is_equivalent BOOLEAN DEFAULT false, -- e.g., 2/4 = 1/2

    -- Error detection results
    error_type VARCHAR(100),
    -- Types: 'arithmetic_error', 'conceptual_error', 'simplification_error', 'format_error', null if correct

    -- Detailed error analysis (from AI)
    error_analysis JSONB,
    -- Example: {"identified_mistake": "...", "explanation": "...", "hint": "..."}

    -- Performance metrics
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Error patterns tracking (for analytics)
CREATE TABLE error_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    problem_type problem_type NOT NULL,
    error_type VARCHAR(100) NOT NULL,

    -- Pattern details
    pattern_description TEXT,
    occurrences INTEGER DEFAULT 1,

    -- First and last occurrence
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),

    -- Has this been addressed?
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP
);

-- Student progress tracking
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    problem_type problem_type NOT NULL,

    -- Progress metrics
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,

    -- Accuracy percentage (computed)
    accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_attempts > 0 THEN (correct_attempts::DECIMAL / total_attempts * 100)
            ELSE 0
        END
    ) STORED,

    -- Time metrics
    average_time_seconds INTEGER,
    total_time_seconds INTEGER DEFAULT 0,

    -- Difficulty progression
    current_difficulty difficulty_level DEFAULT 'easy',

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),

    -- Unique constraint: one progress record per student per problem type
    UNIQUE(student_id, problem_type)
);

-- AI feedback cache (to reduce API costs)
CREATE TABLE ai_feedback_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Cache key (hash of problem + error type)
    cache_key VARCHAR(255) UNIQUE NOT NULL,

    -- Problem context
    problem_type problem_type NOT NULL,
    error_type VARCHAR(100) NOT NULL,

    -- AI-generated feedback
    feedback JSONB NOT NULL,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT NOW(),

    -- Cache metadata
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_problems_type ON problems(type);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_created_by ON problems(created_by);
CREATE INDEX idx_problems_active ON problems(is_active);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_correct ON submissions(is_correct);
CREATE INDEX idx_submissions_date ON submissions(submitted_at);

CREATE INDEX idx_error_patterns_student ON error_patterns(student_id);
CREATE INDEX idx_error_patterns_type ON error_patterns(problem_type);
CREATE INDEX idx_error_patterns_resolved ON error_patterns(is_resolved);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_type ON student_progress(problem_type);

CREATE INDEX idx_cache_key ON ai_feedback_cache(cache_key);
CREATE INDEX idx_cache_problem_type ON ai_feedback_cache(problem_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update error pattern occurrences
CREATE OR REPLACE FUNCTION update_error_pattern()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO error_patterns (student_id, problem_type, error_type, pattern_description, occurrences)
    VALUES (NEW.student_id, (SELECT type FROM problems WHERE id = NEW.problem_id), NEW.error_type, '', 1)
    ON CONFLICT (student_id, problem_type, error_type)
    DO UPDATE SET
        occurrences = error_patterns.occurrences + 1,
        last_seen = NOW();

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: We need a unique constraint for the ON CONFLICT to work
ALTER TABLE error_patterns ADD CONSTRAINT unique_student_problem_error
    UNIQUE (student_id, problem_type, error_type);

-- Trigger to track error patterns when submission has error
CREATE TRIGGER track_error_pattern AFTER INSERT ON submissions
    FOR EACH ROW
    WHEN (NEW.is_correct = false AND NEW.error_type IS NOT NULL)
    EXECUTE FUNCTION update_error_pattern();

-- Function to update student progress
CREATE OR REPLACE FUNCTION update_student_progress()
RETURNS TRIGGER AS $$
DECLARE
    p_type problem_type;
BEGIN
    -- Get problem type
    SELECT type INTO p_type FROM problems WHERE id = NEW.problem_id;

    -- Update or insert progress
    INSERT INTO student_progress (student_id, problem_type, total_attempts, correct_attempts, total_time_seconds, average_time_seconds, last_activity_at)
    VALUES (
        NEW.student_id,
        p_type,
        1,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        COALESCE(NEW.time_spent_seconds, 0),
        COALESCE(NEW.time_spent_seconds, 0),
        NOW()
    )
    ON CONFLICT (student_id, problem_type)
    DO UPDATE SET
        total_attempts = student_progress.total_attempts + 1,
        correct_attempts = student_progress.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        total_time_seconds = student_progress.total_time_seconds + COALESCE(NEW.time_spent_seconds, 0),
        average_time_seconds = (student_progress.total_time_seconds + COALESCE(NEW.time_spent_seconds, 0)) / (student_progress.total_attempts + 1),
        last_activity_at = NOW();

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update student progress on submission
CREATE TRIGGER update_progress_on_submission AFTER INSERT ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_student_progress();

-- Insert demo data for testing
-- Demo teacher
INSERT INTO users (email, password_hash, name, role, institution) VALUES
    ('teacher@kaist.ac.kr', '$2b$10$XdQXXdXdXdXdXdXdXdXdXeXdXdXdXdXdXdXdXdXdXdXdXdXdXdX', 'Demo Teacher', 'teacher', 'KAIST Touch Math Academy');

-- Demo students
INSERT INTO users (email, password_hash, name, role, grade_level, institution) VALUES
    ('student1@kaist.ac.kr', '$2b$10$XdQXXdXdXdXdXdXdXdXdXeXdXdXdXdXdXdXdXdXdXdXdXdXdX', 'Student One', 'student', 'Grade 3', 'KAIST Touch Math Academy'),
    ('student2@kaist.ac.kr', '$2b$10$XdQXXdXdXdXdXdXdXdXdXeXdXdXdXdXdXdXdXdXdXdXdXdXdX', 'Student Two', 'student', 'Grade 3', 'KAIST Touch Math Academy');

-- Demo problems (fractions)
INSERT INTO problems (type, difficulty, problem_data, correct_answer, visual_type, tags) VALUES
    -- Easy fraction addition
    (
        'fraction_addition',
        'easy',
        '{"numerator1": 1, "denominator1": 4, "numerator2": 1, "denominator2": 4, "operation": "add"}',
        '{"numerator": 2, "denominator": 4, "simplified": {"numerator": 1, "denominator": 2}}',
        'pizza',
        ARRAY['fractions', 'addition', 'like-denominators']
    ),
    -- Medium fraction addition
    (
        'fraction_addition',
        'medium',
        '{"numerator1": 1, "denominator1": 2, "numerator2": 1, "denominator2": 3, "operation": "add"}',
        '{"numerator": 5, "denominator": 6}',
        'bar',
        ARRAY['fractions', 'addition', 'unlike-denominators']
    ),
    -- Fraction visualization
    (
        'fraction_visualization',
        'easy',
        '{"numerator": 3, "denominator": 4, "task": "identify"}',
        '{"numerator": 3, "denominator": 4}',
        'pizza',
        ARRAY['fractions', 'visualization', 'basic']
    );

COMMENT ON TABLE users IS 'Stores all system users (teachers, students, admins)';
COMMENT ON TABLE problems IS 'Mathematical problems with flexible JSONB structure';
COMMENT ON TABLE submissions IS 'Student answer submissions with error detection results';
COMMENT ON TABLE error_patterns IS 'Tracks recurring error patterns for each student';
COMMENT ON TABLE student_progress IS 'Aggregated progress metrics per student per problem type';
COMMENT ON TABLE ai_feedback_cache IS 'Caches AI-generated feedback to reduce API costs';
