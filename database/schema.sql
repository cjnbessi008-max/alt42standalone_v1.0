-- Reasoning Feedback System Database Schema
-- PostgreSQL 15+
-- Created: 2025-11-18

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE, -- For Moodle integration
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table (Math problems for students to solve)
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    problem_type VARCHAR(100) NOT NULL, -- 'arithmetic', 'fractions', 'algebra', etc.
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    correct_answer TEXT NOT NULL,
    answer_type VARCHAR(50) DEFAULT 'text', -- 'number', 'text', 'multiple_choice'
    metadata JSONB, -- Additional problem data (choices, hints, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student attempts (each time a student submits an answer)
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_problem FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Reasoning explanations (student's explanation of their reasoning)
CREATE TABLE IF NOT EXISTS reasoning_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES student_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    explanation_text TEXT NOT NULL, -- Student's one-sentence explanation
    language VARCHAR(10) DEFAULT 'ko', -- 'ko' or 'en'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attempt FOREIGN KEY (attempt_id) REFERENCES student_attempts(id),
    CONSTRAINT fk_student_explanation FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_problem_explanation FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- AI feedback (AI-generated analysis and guidance)
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reasoning_explanation_id UUID NOT NULL REFERENCES reasoning_explanations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- AI analysis results
    identified_misconception TEXT NOT NULL, -- What went wrong
    reasoning_error_type VARCHAR(100), -- 'calculation_error', 'concept_misunderstanding', etc.
    corrective_feedback TEXT NOT NULL, -- How to fix it
    encouragement TEXT, -- Positive reinforcement

    -- AI metadata
    ai_model VARCHAR(100) DEFAULT 'claude-3-sonnet', -- Which AI model was used
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    processing_time_ms INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reasoning FOREIGN KEY (reasoning_explanation_id) REFERENCES reasoning_explanations(id),
    CONSTRAINT fk_student_feedback FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Learning progress (aggregate student learning data)
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    common_errors JSONB, -- Track patterns of mistakes
    last_attempt_at TIMESTAMP,
    mastery_level DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_progress FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(student_id, problem_type)
);

-- Indexes for performance
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_correct ON student_attempts(is_correct);
CREATE INDEX idx_student_attempts_time ON student_attempts(attempted_at DESC);

CREATE INDEX idx_reasoning_explanations_attempt ON reasoning_explanations(attempt_id);
CREATE INDEX idx_reasoning_explanations_student ON reasoning_explanations(student_id);
CREATE INDEX idx_reasoning_explanations_time ON reasoning_explanations(submitted_at DESC);

CREATE INDEX idx_ai_feedback_reasoning ON ai_feedback(reasoning_explanation_id);
CREATE INDEX idx_ai_feedback_student ON ai_feedback(student_id);
CREATE INDEX idx_ai_feedback_error_type ON ai_feedback(reasoning_error_type);

CREATE INDEX idx_learning_progress_student ON learning_progress(student_id);
CREATE INDEX idx_learning_progress_type ON learning_progress(problem_type);
CREATE INDEX idx_learning_progress_mastery ON learning_progress(mastery_level DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO problems (title, description, problem_type, difficulty_level, correct_answer, answer_type) VALUES
('분수 덧셈', '1/2 + 1/4 = ?', 'fractions', 2, '3/4', 'text'),
('곱셈 문제', '12 × 8 = ?', 'arithmetic', 1, '96', 'number'),
('나눗셈 문제', '144 ÷ 12 = ?', 'arithmetic', 2, '12', 'number'),
('분수 이해', '피자를 8조각으로 나누고 3조각을 먹었습니다. 몇 분의 몇을 먹었나요?', 'fractions', 2, '3/8', 'text'),
('백분율 계산', '200의 25%는?', 'percentage', 3, '50', 'number');

COMMENT ON TABLE students IS 'Student information, can be synced with Moodle via external_id';
COMMENT ON TABLE problems IS 'Math problems for students to solve';
COMMENT ON TABLE student_attempts IS 'Each attempt a student makes at solving a problem';
COMMENT ON TABLE reasoning_explanations IS 'Student explanation of their reasoning (one sentence)';
COMMENT ON TABLE ai_feedback IS 'AI-generated analysis of student reasoning and corrective guidance';
COMMENT ON TABLE learning_progress IS 'Aggregate learning data per student per problem type';
