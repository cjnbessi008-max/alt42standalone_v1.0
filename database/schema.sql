-- LMS Hint System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_user_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table (from LMS)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_course_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'mathematics',
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    grade_level VARCHAR(50),
    correct_answer TEXT,
    concepts JSONB DEFAULT '[]'::jsonb,  -- Array of concepts involved
    common_mistakes JSONB DEFAULT '[]'::jsonb,  -- Array of common mistakes
    max_hints INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student attempts table
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    student_work TEXT,
    submitted_answer TEXT,
    is_correct BOOLEAN,
    score DECIMAL(5,2),
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent_seconds INTEGER
);

-- Hints table
CREATE TABLE hints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    hint_level INTEGER CHECK (hint_level BETWEEN 1 AND 5),
    hint_type VARCHAR(50) CHECK (hint_type IN ('conceptual', 'strategic', 'procedural')),
    hint_text TEXT NOT NULL,
    student_work_context TEXT,  -- What student had written when hint was requested
    previous_hints JSONB DEFAULT '[]'::jsonb,  -- Array of previous hint texts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student progress table
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    attempts_count INTEGER DEFAULT 0,
    hints_used_count INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time_seconds INTEGER,
    UNIQUE(student_id, problem_id)
);

-- LMS grade sync table
CREATE TABLE lms_grade_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100,
    synced_to_lms BOOLEAN DEFAULT FALSE,
    sync_attempted_at TIMESTAMP,
    sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_students_lms_user_id ON students(lms_user_id);
CREATE INDEX idx_student_attempts_student_id ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem_id ON student_attempts(problem_id);
CREATE INDEX idx_hints_student_id ON hints(student_id);
CREATE INDEX idx_hints_problem_id ON hints(problem_id);
CREATE INDEX idx_hints_attempt_id ON hints(attempt_id);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_problem_id ON student_progress(problem_id);
CREATE INDEX idx_lms_grade_sync_synced ON lms_grade_sync(synced_to_lms);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO courses (lms_course_id, title, description, subject) VALUES
    ('MATH101', 'Mathematics 101', 'Introduction to Mathematics', 'mathematics');

INSERT INTO problems (course_id, title, description, subject, difficulty, grade_level, concepts, common_mistakes) VALUES
    (
        (SELECT id FROM courses WHERE lms_course_id = 'MATH101'),
        '분수의 덧셈',
        E'다음 분수 덧셈 문제를 풀어보세요:\n\n1/4 + 1/3 = ?\n\n풀이 과정을 단계별로 작성하고, 최종 답을 기약분수로 나타내세요.',
        'mathematics',
        'intermediate',
        '5학년',
        '["fractions", "addition", "common_denominator", "simplification"]'::jsonb,
        '["adding numerators and denominators directly", "forgetting to find common denominator", "not simplifying the final answer"]'::jsonb
    );

-- Create view for hint analytics
CREATE VIEW hint_analytics AS
SELECT
    p.id AS problem_id,
    p.title AS problem_title,
    p.difficulty,
    COUNT(DISTINCT h.student_id) AS students_requesting_hints,
    AVG(h.hint_level) AS avg_hint_level,
    COUNT(h.id) AS total_hints_given,
    COUNT(h.id) FILTER (WHERE h.hint_type = 'conceptual') AS conceptual_hints,
    COUNT(h.id) FILTER (WHERE h.hint_type = 'strategic') AS strategic_hints,
    COUNT(h.id) FILTER (WHERE h.hint_type = 'procedural') AS procedural_hints
FROM problems p
LEFT JOIN hints h ON p.id = h.problem_id
GROUP BY p.id, p.title, p.difficulty;

COMMENT ON TABLE students IS 'Student information synced from LMS';
COMMENT ON TABLE courses IS 'Course information synced from LMS';
COMMENT ON TABLE problems IS 'Learning problems/assignments';
COMMENT ON TABLE student_attempts IS 'Student attempts at solving problems';
COMMENT ON TABLE hints IS 'AI-generated hints provided to students';
COMMENT ON TABLE student_progress IS 'Overall student progress tracking';
COMMENT ON TABLE lms_grade_sync IS 'Tracks grade synchronization with LMS';
