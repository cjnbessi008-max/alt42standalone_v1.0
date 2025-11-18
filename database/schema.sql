-- ALT42 Length Assist Database Schema
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Teachers Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('student', 'teacher', 'admin')),
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules Table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Length Assist Problems Table
CREATE TABLE IF NOT EXISTS length_assist_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    geometry_data JSONB NOT NULL, -- Stores shapes and lines
    target_ratio DECIMAL(10, 4) NOT NULL,
    tolerance DECIMAL(5, 4) DEFAULT 0.05,
    hints JSONB, -- Array of hint strings
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    unit VARCHAR(50) DEFAULT 'px',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Attempts Table
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES length_assist_problems(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    measured_ratio DECIMAL(10, 4) NOT NULL,
    line1_length DECIMAL(10, 2) NOT NULL,
    line2_length DECIMAL(10, 2) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER, -- seconds
    interactions JSONB, -- Array of interaction events
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress Table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    problems_completed INTEGER DEFAULT 0,
    total_problems INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5, 2) DEFAULT 0.0,
    average_time_per_problem INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module_id)
);

-- Moodle LTI Sessions (for future Moodle integration)
CREATE TABLE IF NOT EXISTS moodle_lti_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(255),
    context_id VARCHAR(255),
    resource_link_id VARCHAR(255),
    lti_user_id VARCHAR(255),
    roles JSONB,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_problems_module ON length_assist_problems(module_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON length_assist_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_attempts_problem ON student_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON student_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON student_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_module ON student_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_teacher ON modules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_lti_sessions_user ON moodle_lti_sessions(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON length_assist_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
