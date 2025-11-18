-- DMN Math Game Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_user_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_problems INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 3),
    is_completed BOOLEAN DEFAULT FALSE,
    lms_launch_id VARCHAR(255),
    CONSTRAINT valid_answers CHECK (correct_answers <= total_problems)
);

-- Problem types
CREATE TYPE problem_type AS ENUM ('addition', 'subtraction', 'multiplication');

-- Problems table (generated problems)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    problem_type problem_type NOT NULL,
    operand_1 INTEGER NOT NULL,
    operand_2 INTEGER NOT NULL,
    correct_answer INTEGER NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 3),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student answers table
CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submitted_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Student progress tracking
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    current_difficulty_level INTEGER DEFAULT 1 CHECK (current_difficulty_level BETWEEN 1 AND 3),
    total_sessions INTEGER DEFAULT 0,
    total_problems_solved INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.00,
    last_session_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id)
);

-- LTI launch data (for LMS integration)
CREATE TABLE lti_launches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
    lms_user_id VARCHAR(255) NOT NULL,
    lms_context_id VARCHAR(255),
    lms_resource_link_id VARCHAR(255),
    launch_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_game_sessions_student ON game_sessions(student_id);
CREATE INDEX idx_game_sessions_started ON game_sessions(started_at);
CREATE INDEX idx_problems_session ON problems(session_id);
CREATE INDEX idx_student_answers_student ON student_answers(student_id);
CREATE INDEX idx_student_answers_session ON student_answers(session_id);
CREATE INDEX idx_lti_launches_lms_user ON lti_launches(lms_user_id);

-- Function to update student progress
CREATE OR REPLACE FUNCTION update_student_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_progress (student_id, total_sessions, total_problems_solved, total_correct_answers, average_accuracy, last_session_at)
    VALUES (
        NEW.student_id,
        1,
        NEW.total_problems,
        NEW.correct_answers,
        CASE
            WHEN NEW.total_problems > 0 THEN (NEW.correct_answers::DECIMAL / NEW.total_problems * 100)
            ELSE 0
        END,
        NEW.ended_at
    )
    ON CONFLICT (student_id)
    DO UPDATE SET
        total_sessions = student_progress.total_sessions + 1,
        total_problems_solved = student_progress.total_problems_solved + NEW.total_problems,
        total_correct_answers = student_progress.total_correct_answers + NEW.correct_answers,
        average_accuracy = CASE
            WHEN (student_progress.total_problems_solved + NEW.total_problems) > 0
            THEN ((student_progress.total_correct_answers + NEW.correct_answers)::DECIMAL /
                  (student_progress.total_problems_solved + NEW.total_problems) * 100)
            ELSE 0
        END,
        last_session_at = NEW.ended_at,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when session ends
CREATE TRIGGER trigger_update_student_progress
AFTER UPDATE OF is_completed ON game_sessions
FOR EACH ROW
WHEN (NEW.is_completed = TRUE AND OLD.is_completed = FALSE)
EXECUTE FUNCTION update_student_progress();

-- Function to automatically adjust difficulty
CREATE OR REPLACE FUNCTION adjust_difficulty_level()
RETURNS TRIGGER AS $$
DECLARE
    recent_accuracy DECIMAL;
    current_level INTEGER;
BEGIN
    -- Get current difficulty level
    SELECT current_difficulty_level INTO current_level
    FROM student_progress
    WHERE student_id = NEW.student_id;

    -- Calculate accuracy from last 10 problems
    SELECT
        CASE
            WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0
        END INTO recent_accuracy
    FROM (
        SELECT is_correct
        FROM student_answers
        WHERE student_id = NEW.student_id
        ORDER BY submitted_at DESC
        LIMIT 10
    ) recent_answers;

    -- Adjust difficulty based on performance
    IF recent_accuracy >= 80 AND current_level < 3 THEN
        UPDATE student_progress
        SET current_difficulty_level = current_level + 1
        WHERE student_id = NEW.student_id;
    ELSIF recent_accuracy < 50 AND current_level > 1 THEN
        UPDATE student_progress
        SET current_difficulty_level = current_level - 1
        WHERE student_id = NEW.student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to adjust difficulty after every 10 answers
CREATE TRIGGER trigger_adjust_difficulty
AFTER INSERT ON student_answers
FOR EACH ROW
EXECUTE FUNCTION adjust_difficulty_level();

-- View for student analytics
CREATE OR REPLACE VIEW student_analytics AS
SELECT
    s.id as student_id,
    s.name,
    sp.total_sessions,
    sp.total_problems_solved,
    sp.total_correct_answers,
    sp.average_accuracy,
    sp.current_difficulty_level,
    sp.last_session_at,
    COUNT(DISTINCT gs.id) FILTER (WHERE gs.created_at >= NOW() - INTERVAL '7 days') as sessions_last_week,
    AVG(gs.duration_seconds) FILTER (WHERE gs.is_completed = TRUE) as avg_session_duration
FROM students s
LEFT JOIN student_progress sp ON s.id = sp.student_id
LEFT JOIN game_sessions gs ON s.id = gs.student_id
GROUP BY s.id, s.name, sp.total_sessions, sp.total_problems_solved,
         sp.total_correct_answers, sp.average_accuracy, sp.current_difficulty_level,
         sp.last_session_at;

-- Seed some initial data for testing
INSERT INTO students (name, email, grade_level) VALUES
    ('Test Student', 'test@example.com', '3'),
    ('Demo Student', 'demo@example.com', '4')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dmn_game_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dmn_game_user;
