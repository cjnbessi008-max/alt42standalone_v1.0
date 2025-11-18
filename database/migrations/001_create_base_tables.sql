-- AI Education System - Misconceptions Tracking Database Schema
-- Migration: 001_create_base_tables.sql
-- Description: Creates core tables for students, modules, problems, attempts, and misconceptions tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table (e.g., Fractions, Geometry, etc.)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Concepts within modules (e.g., "Common Denominator", "Fraction Addition")
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, name)
);

-- Problems/Questions
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    problem_type VARCHAR(100) NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    correct_answer JSONB NOT NULL, -- Flexible storage for different answer formats
    metadata JSONB, -- Additional problem-specific data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts at problems
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    student_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB -- Additional attempt-specific data (e.g., interaction patterns)
);

-- Misconceptions (identified patterns of wrong answers)
CREATE TABLE misconceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    typical_wrong_pattern JSONB, -- Pattern that indicates this misconception
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    correction_strategy TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, concept_id, name)
);

-- Student-specific misconception tracking
CREATE TABLE student_misconceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    misconception_id UUID NOT NULL REFERENCES misconceptions(id) ON DELETE CASCADE,
    occurrence_count INTEGER DEFAULT 1,
    first_occurred_at TIMESTAMP DEFAULT NOW(),
    last_occurred_at TIMESTAMP DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    UNIQUE(student_id, misconception_id)
);

-- Student module enrollment
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    UNIQUE(student_id, module_id)
);

-- Indexes for performance
CREATE INDEX idx_student_attempts_student_id ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem_id ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_attempted_at ON student_attempts(attempted_at DESC);
CREATE INDEX idx_student_misconceptions_student_id ON student_misconceptions(student_id);
CREATE INDEX idx_student_misconceptions_occurrence ON student_misconceptions(occurrence_count DESC);
CREATE INDEX idx_problems_module_id ON problems(module_id);
CREATE INDEX idx_problems_concept_id ON problems(concept_id);
CREATE INDEX idx_concepts_module_id ON concepts(module_id);
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments(student_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE students IS 'Stores student information';
COMMENT ON TABLE modules IS 'Educational modules (e.g., Fractions, Geometry)';
COMMENT ON TABLE concepts IS 'Individual concepts within modules';
COMMENT ON TABLE problems IS 'Problems/questions for students to solve';
COMMENT ON TABLE student_attempts IS 'Records of student attempts at problems';
COMMENT ON TABLE misconceptions IS 'Identified patterns of common mistakes';
COMMENT ON TABLE student_misconceptions IS 'Tracks which misconceptions each student has';
COMMENT ON TABLE student_enrollments IS 'Tracks student enrollment in modules';
