-- AI Education System Database Schema
-- Auto Question Suggestion Feature

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('generating', 'active', 'archived')),
    world_model JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    problem_type VARCHAR(100),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    content JSONB, -- Flexible structure for different problem types
    correct_answer JSONB,
    hints JSONB, -- Array of hints
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    interaction_data JSONB, -- Track clicks, patterns, behaviors
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Concept mastery tracking
CREATE TABLE IF NOT EXISTS student_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    mastery_level FLOAT CHECK (mastery_level BETWEEN 0 AND 1) DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    last_attempted TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id, concept_name)
);

-- Question suggestions table
CREATE TABLE IF NOT EXISTS question_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    suggestions JSONB NOT NULL, -- Array of 3 suggested questions
    context JSONB, -- Problem context and student history used for generation
    accepted_suggestion INTEGER, -- Which suggestion (1-3) was selected, NULL if none
    feedback TEXT, -- Student feedback on suggestions
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suggestion feedback tracking
CREATE TABLE IF NOT EXISTS suggestion_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES question_suggestions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_time ON student_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_concepts_student_module ON student_concepts(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_question_suggestions_student ON question_suggestions(student_id);
CREATE INDEX IF NOT EXISTS idx_question_suggestions_problem ON question_suggestions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_module ON problems(module_id);

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

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_concepts_updated_at BEFORE UPDATE ON student_concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO modules (name, description, subject, grade_level) VALUES
('분수 학습', '3학년 학생들을 위한 분수의 기본 개념과 연산 학습', 'mathematics', '3학년');

INSERT INTO students (name, email, grade_level) VALUES
('김철수', 'kim@example.com', '3학년'),
('이영희', 'lee@example.com', '3학년');
