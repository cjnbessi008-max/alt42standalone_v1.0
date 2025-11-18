-- Solution Gap Quantification System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE problem_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE problem_subject AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'PROGRAMMING', 'LOGIC');
CREATE TYPE solution_status AS ENUM ('DRAFT', 'SUBMITTED', 'ANALYZED', 'REVIEWED');
CREATE TYPE gap_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE step_type AS ENUM ('GIVEN', 'ASSUMPTION', 'CALCULATION', 'REASONING', 'CONCLUSION');

-- ============================================
-- CORE TABLES
-- ============================================

-- Problems Table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    subject problem_subject NOT NULL,
    difficulty problem_difficulty NOT NULL,
    expected_steps JSONB NOT NULL DEFAULT '[]', -- Array of expected solution steps
    expected_reasoning TEXT, -- Detailed expected reasoning
    metadata JSONB DEFAULT '{}', -- Additional problem metadata
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students/Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student', -- student, teacher, admin
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Solutions Table (Student submissions)
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status solution_status DEFAULT 'DRAFT',
    submitted_steps JSONB NOT NULL DEFAULT '[]', -- Array of student steps
    raw_input TEXT, -- Original text input from student
    time_spent_seconds INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solution Steps Table (Detailed step tracking)
CREATE TABLE solution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_type step_type NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT,
    metadata JSONB DEFAULT '{}', -- formulas, references, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(solution_id, step_number)
);

-- ============================================
-- GAP ANALYSIS TABLES
-- ============================================

-- Gap Analysis Results
CREATE TABLE gap_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,

    -- Overall Scores (0-100)
    completeness_score NUMERIC(5,2) NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 100),
    logic_continuity_score NUMERIC(5,2) NOT NULL CHECK (logic_continuity_score >= 0 AND logic_continuity_score <= 100),
    correctness_score NUMERIC(5,2) NOT NULL CHECK (correctness_score >= 0 AND correctness_score <= 100),
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Gap Metrics
    total_gaps_detected INTEGER DEFAULT 0,
    critical_gaps_count INTEGER DEFAULT 0,
    missing_steps_count INTEGER DEFAULT 0,
    logical_errors_count INTEGER DEFAULT 0,

    -- AI Analysis
    ai_summary TEXT,
    ai_feedback TEXT,
    ai_model_used VARCHAR(100),

    -- Detailed Results (JSONB for flexibility)
    detailed_analysis JSONB DEFAULT '{}',

    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Gaps Detected
CREATE TABLE detected_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES gap_analyses(id) ON DELETE CASCADE,

    gap_type VARCHAR(100) NOT NULL, -- 'missing_step', 'logic_jump', 'incorrect_reasoning', etc.
    severity gap_severity NOT NULL,

    -- Location
    after_step_number INTEGER, -- Gap occurs after this step
    before_step_number INTEGER, -- Gap occurs before this step

    -- Description
    description TEXT NOT NULL,
    expected_content TEXT, -- What should have been included
    suggestion TEXT, -- How to fix

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step Comparisons (Student step vs Expected step)
CREATE TABLE step_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES gap_analyses(id) ON DELETE CASCADE,

    student_step_number INTEGER,
    expected_step_number INTEGER,

    similarity_score NUMERIC(5,2) CHECK (similarity_score >= 0 AND similarity_score <= 100),
    match_type VARCHAR(50), -- 'exact', 'partial', 'missing', 'extra', 'incorrect'

    student_content TEXT,
    expected_content TEXT,

    comparison_notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEEDBACK & LEARNING TABLES
-- ============================================

-- AI-Generated Feedback
CREATE TABLE feedback_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES gap_analyses(id) ON DELETE CASCADE,

    feedback_type VARCHAR(50) NOT NULL, -- 'hint', 'explanation', 'correction', 'encouragement'
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low

    related_step_number INTEGER,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Progress Tracking
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    attempts_count INTEGER DEFAULT 0,
    best_score NUMERIC(5,2) DEFAULT 0,
    avg_score NUMERIC(5,2) DEFAULT 0,

    improvement_trend JSONB DEFAULT '[]', -- Array of scores over time
    common_gaps JSONB DEFAULT '[]', -- Frequently occurring gaps

    last_attempted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, problem_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Problems indexes
CREATE INDEX idx_problems_subject ON problems(subject);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_created_at ON problems(created_at DESC);

-- Solutions indexes
CREATE INDEX idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX idx_solutions_user_id ON solutions(user_id);
CREATE INDEX idx_solutions_status ON solutions(status);
CREATE INDEX idx_solutions_submitted_at ON solutions(submitted_at DESC);

-- Gap analyses indexes
CREATE INDEX idx_gap_analyses_solution_id ON gap_analyses(solution_id);
CREATE INDEX idx_gap_analyses_overall_score ON gap_analyses(overall_score DESC);
CREATE INDEX idx_gap_analyses_analyzed_at ON gap_analyses(analyzed_at DESC);

-- Detected gaps indexes
CREATE INDEX idx_detected_gaps_analysis_id ON detected_gaps(analysis_id);
CREATE INDEX idx_detected_gaps_severity ON detected_gaps(severity);

-- Learning progress indexes
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_problem_id ON learning_progress(problem_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample user
INSERT INTO users (username, email, full_name, role) VALUES
    ('teacher_kim', 'kim@kaist.ac.kr', 'Kim Teacher', 'teacher'),
    ('student_lee', 'lee@student.kaist.ac.kr', 'Lee Student', 'student'),
    ('student_park', 'park@student.kaist.ac.kr', 'Park Student', 'student');

-- Insert sample problem
INSERT INTO problems (title, description, subject, difficulty, expected_steps, expected_reasoning) VALUES
(
    '일차방정식 풀이',
    '다음 일차방정식을 풀이하시오: 2x + 5 = 13',
    'MATHEMATICS',
    'EASY',
    '[
        {"step": 1, "type": "GIVEN", "content": "2x + 5 = 13"},
        {"step": 2, "type": "CALCULATION", "content": "2x = 13 - 5 (양변에서 5를 뺀다)"},
        {"step": 3, "type": "CALCULATION", "content": "2x = 8"},
        {"step": 4, "type": "CALCULATION", "content": "x = 8 ÷ 2 (양변을 2로 나눈다)"},
        {"step": 5, "type": "CONCLUSION", "content": "x = 4"}
    ]'::jsonb,
    '일차방정식을 풀기 위해서는 먼저 변수가 포함된 항을 한쪽으로, 상수항을 다른 쪽으로 이항해야 합니다. 그 다음 변수의 계수로 양변을 나누어 변수의 값을 구합니다.'
);

-- Comments for documentation
COMMENT ON TABLE problems IS 'Store problem definitions with expected solution paths';
COMMENT ON TABLE solutions IS 'Store student solution submissions';
COMMENT ON TABLE gap_analyses IS 'Store AI-powered gap analysis results';
COMMENT ON TABLE detected_gaps IS 'Store individual logical gaps found in solutions';
COMMENT ON TABLE step_comparisons IS 'Store detailed comparisons between student and expected steps';
COMMENT ON TABLE feedback_items IS 'Store AI-generated feedback for students';
COMMENT ON TABLE learning_progress IS 'Track student learning progress over time';
