-- AI Education System Database Schema
-- Core schema for LMS integration and concept summary feature

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level INTEGER NOT NULL,
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table (Generated educational systems)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES teachers(id),
    grade_level INTEGER NOT NULL,
    subject VARCHAR(100),
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems table (Dynamically generated per module)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    problem_type VARCHAR(100),
    problem_data JSONB,
    correct_answer JSONB,
    explanation TEXT,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problem Concepts table (Core feature for concept summaries)
CREATE TABLE problem_concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    one_line_summary TEXT NOT NULL,
    concept_description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    prerequisite_concepts TEXT[],
    generated_by_ai BOOLEAN DEFAULT true,
    auto_generated_summary TEXT,
    teacher_verified BOOLEAN DEFAULT false,
    teacher_notes TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, concept_name)
);

-- Concept Summaries table (Version history of AI-generated summaries)
CREATE TABLE concept_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID NOT NULL REFERENCES problem_concepts(id) ON DELETE CASCADE,
    summary_version INTEGER DEFAULT 1,
    summary_text TEXT NOT NULL,
    generation_prompt TEXT,
    llm_model VARCHAR(50) DEFAULT 'claude-3-sonnet',
    confidence_score FLOAT,
    approved_by_teacher BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES teachers(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Progress table
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started',
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    score FLOAT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, problem_id)
);

-- Generation Jobs table (Track AI pipeline execution)
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL,
    stage VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_problems_module_id ON problems(module_id);
CREATE INDEX idx_problem_concepts_module_id ON problem_concepts(module_id);
CREATE INDEX idx_problem_concepts_problem_id ON problem_concepts(problem_id);
CREATE INDEX idx_concept_summaries_concept_id ON concept_summaries(concept_id);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_module_id ON student_progress(module_id);
CREATE INDEX idx_generation_jobs_module_id ON generation_jobs(module_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_concepts_updated_at BEFORE UPDATE ON problem_concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
