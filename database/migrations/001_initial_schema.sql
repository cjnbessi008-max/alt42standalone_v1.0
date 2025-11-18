-- Adaptive Learning System - Initial Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (teachers and students)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students extended profile
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_difficulty INTEGER NOT NULL DEFAULT 3 CHECK (current_difficulty BETWEEN 1 AND 5),
    total_problems_attempted INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    average_solve_time FLOAT DEFAULT 0, -- in seconds
    performance_score FLOAT DEFAULT 50 CHECK (performance_score BETWEEN 0 AND 100),
    last_activity_at TIMESTAMP
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'short_answer', 'coding', 'math')),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    time_limit INTEGER, -- in seconds, nullable
    correct_answer TEXT NOT NULL,
    options JSONB, -- for multiple choice questions
    hints JSONB, -- array of hints
    tags JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL, -- in seconds
    difficulty_at_attempt INTEGER NOT NULL CHECK (difficulty_at_attempt BETWEEN 1 AND 5),
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Difficulty adjustment history
CREATE TABLE difficulty_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    previous_difficulty INTEGER NOT NULL CHECK (previous_difficulty BETWEEN 1 AND 5),
    new_difficulty INTEGER NOT NULL CHECK (new_difficulty BETWEEN 1 AND 5),
    reason TEXT NOT NULL,
    metrics JSONB NOT NULL, -- stores calculation details
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance metrics cache (for faster dashboard queries)
CREATE TABLE performance_metrics (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    accuracy_rate FLOAT DEFAULT 0 CHECK (accuracy_rate BETWEEN 0 AND 1),
    accuracy_by_difficulty JSONB DEFAULT '{}'::jsonb,
    average_solve_time_by_difficulty JSONB DEFAULT '{}'::jsonb,
    recent_performance_trend VARCHAR(20) CHECK (recent_performance_trend IN ('improving', 'stable', 'declining')),
    total_problems INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attempts_student ON attempts(student_id, attempted_at DESC);
CREATE INDEX idx_attempts_problem ON attempts(problem_id);
CREATE INDEX idx_attempts_student_recent ON attempts(student_id, attempted_at DESC)
    WHERE attempted_at > NOW() - INTERVAL '7 days';
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_type ON problems(type);
CREATE INDEX idx_students_difficulty ON students(current_difficulty);
CREATE INDEX idx_difficulty_adjustments_student ON difficulty_adjustments(student_id, created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for student progress summary
CREATE VIEW student_progress_summary AS
SELECT
    s.id,
    u.name,
    u.email,
    s.current_difficulty,
    s.total_problems_attempted,
    s.total_correct,
    CASE
        WHEN s.total_problems_attempted > 0
        THEN ROUND((s.total_correct::FLOAT / s.total_problems_attempted::FLOAT * 100)::NUMERIC, 2)
        ELSE 0
    END AS accuracy_percentage,
    s.average_solve_time,
    s.performance_score,
    s.last_activity_at,
    pm.recent_performance_trend
FROM students s
JOIN users u ON s.id = u.id
LEFT JOIN performance_metrics pm ON s.id = pm.student_id;

-- Comments for documentation
COMMENT ON TABLE users IS 'All system users (students, teachers, admins)';
COMMENT ON TABLE students IS 'Extended profile for student users with performance metrics';
COMMENT ON TABLE problems IS 'Problem bank with various types and difficulty levels';
COMMENT ON TABLE attempts IS 'Student attempts at problems with timing and correctness';
COMMENT ON TABLE difficulty_adjustments IS 'History of difficulty level changes with reasoning';
COMMENT ON TABLE performance_metrics IS 'Cached performance calculations for dashboard efficiency';
