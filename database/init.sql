-- Initialize database for Student Timeline application

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS student_attempts CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create students table
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create modules table
CREATE TABLE modules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL DEFAULT 'mathematics',
    grade_level VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create problems table
CREATE TABLE problems (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    problem_data JSONB,
    answer_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_progress table
CREATE TABLE student_progress (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id VARCHAR(36) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    progress_percentage FLOAT DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- Create student_attempts table (core timeline data)
CREATE TABLE student_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id VARCHAR(36) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    answer_data JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_data JSONB,
    feedback_given TEXT,
    hint_used BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_timestamp ON student_attempts(attempted_at);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);
CREATE INDEX idx_problems_module ON problems(module_id);

-- Comments for documentation
COMMENT ON TABLE students IS 'Student information';
COMMENT ON TABLE modules IS 'Educational modules/courses';
COMMENT ON TABLE problems IS 'Problems within modules';
COMMENT ON TABLE student_progress IS 'Student progress tracking for modules';
COMMENT ON TABLE student_attempts IS 'Student attempts at solving problems - core timeline data';
