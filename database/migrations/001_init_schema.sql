-- AI Education System - LMS Integration with Mistake Pattern Warning
-- Database Schema for Mistake Pattern Analysis

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_lms_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grade_level INTEGER,
    institution VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules (educational units)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level INTEGER,
    teacher_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems (questions/exercises)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    content JSONB NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    correct_answer JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts (answers submitted)
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    submitted_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,
    attempted_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Mistake patterns (analyzed common errors)
CREATE TABLE mistake_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_category VARCHAR(100),
    description TEXT,
    frequency INTEGER DEFAULT 1,
    severity VARCHAR(50) DEFAULT 'medium',
    problem_types TEXT[] DEFAULT '{}',
    example_attempts UUID[] DEFAULT '{}',
    pattern_data JSONB DEFAULT '{}',
    first_occurrence TIMESTAMP DEFAULT NOW(),
    last_occurrence TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Mistake warnings (triggered alerts)
CREATE TABLE mistake_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES mistake_patterns(id) ON DELETE CASCADE,
    warning_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    is_dismissed BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP DEFAULT NOW(),
    dismissed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- LMS Integration logs
CREATE TABLE lms_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    sync_data JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_student_attempts_student_id ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem_id ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_module_id ON student_attempts(module_id);
CREATE INDEX idx_student_attempts_attempted_at ON student_attempts(attempted_at DESC);
CREATE INDEX idx_student_attempts_is_correct ON student_attempts(is_correct);

CREATE INDEX idx_mistake_patterns_student_id ON mistake_patterns(student_id);
CREATE INDEX idx_mistake_patterns_module_id ON mistake_patterns(module_id);
CREATE INDEX idx_mistake_patterns_pattern_type ON mistake_patterns(pattern_type);
CREATE INDEX idx_mistake_patterns_is_active ON mistake_patterns(is_active);

CREATE INDEX idx_mistake_warnings_student_id ON mistake_warnings(student_id);
CREATE INDEX idx_mistake_warnings_problem_id ON mistake_warnings(problem_id);
CREATE INDEX idx_mistake_warnings_is_dismissed ON mistake_warnings(is_dismissed);

CREATE INDEX idx_problems_module_id ON problems(module_id);
CREATE INDEX idx_problems_problem_type ON problems(problem_type);

CREATE INDEX idx_students_external_lms_id ON students(external_lms_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mistake_patterns_updated_at BEFORE UPDATE ON mistake_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
