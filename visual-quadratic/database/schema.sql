-- Visual Quadratic Database Schema
-- PostgreSQL 12+

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(20),
    moodle_user_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_a DECIMAL(10, 4) NOT NULL,
    target_b DECIMAL(10, 4) NOT NULL,
    target_c DECIMAL(10, 4) NOT NULL,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
    hints JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress table
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    best_score DECIMAL(5, 2) DEFAULT 0.00 CHECK (best_score >= 0 AND best_score <= 100),
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, problem_id)
);

-- Attempts table (detailed history of each attempt)
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    progress_id UUID NOT NULL REFERENCES student_progress(id) ON DELETE CASCADE,
    submitted_a DECIMAL(10, 4) NOT NULL,
    submitted_b DECIMAL(10, 4) NOT NULL,
    submitted_c DECIMAL(10, 4) NOT NULL,
    accuracy_score DECIMAL(5, 2) NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    time_taken_seconds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_students_moodle_id ON students(moodle_user_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_problem ON student_progress(problem_id);
CREATE INDEX idx_progress_completed ON student_progress(completed);
CREATE INDEX idx_attempts_progress ON attempts(progress_id);
CREATE INDEX idx_attempts_created ON attempts(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE students IS '학생 정보 테이블';
COMMENT ON TABLE problems IS '이차방정식 문제 테이블';
COMMENT ON TABLE student_progress IS '학생별 문제 진행 상황';
COMMENT ON TABLE attempts IS '학생의 각 시도 기록';

COMMENT ON COLUMN problems.target_a IS '목표 이차방정식의 a 계수';
COMMENT ON COLUMN problems.target_b IS '목표 이차방정식의 b 계수';
COMMENT ON COLUMN problems.target_c IS '목표 이차방정식의 c 계수';
COMMENT ON COLUMN problems.difficulty IS '난이도 (1=쉬움, 5=어려움)';
COMMENT ON COLUMN problems.hints IS '힌트 배열 (JSON)';

COMMENT ON COLUMN student_progress.best_score IS '최고 정확도 점수 (0-100)';
COMMENT ON COLUMN attempts.accuracy_score IS '해당 시도의 정확도 점수 (0-100)';
