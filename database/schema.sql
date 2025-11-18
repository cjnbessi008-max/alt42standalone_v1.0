-- Mental Stamina LMS Database Schema
-- PostgreSQL 5.7+ compatible (Note: PostgreSQL versions start at 9.x, assuming MySQL 5.7 target)
-- Compatible with MySQL 5.7 syntax

-- Users table (Students and Teachers from Moodle)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    lti_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student', -- 'student' or 'teacher'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table (Learning sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id VARCHAR(255),
    context_id VARCHAR(255), -- Moodle context
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    mental_stamina_score DECIMAL(5,2), -- Overall score 0-100
    fatigue_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions (user_id),
    INDEX idx_started_at (started_at)
);

-- Questions table (Problems presented to students)
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- 'multiple_choice', 'fill_in', 'true_false'
    correct_answer VARCHAR(255),
    difficulty_level INTEGER DEFAULT 1, -- 1-5
    presented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session_questions (session_id)
);

-- Responses table (Student answers and mental stamina metrics)
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    user_answer VARCHAR(255),
    is_correct BOOLEAN DEFAULT FALSE,
    response_time_ms INTEGER NOT NULL, -- Time taken to answer in milliseconds
    hesitation_count INTEGER DEFAULT 0, -- Number of answer changes
    click_count INTEGER DEFAULT 0, -- Total interactions
    keystroke_count INTEGER DEFAULT 0, -- For text inputs
    focus_lost_count INTEGER DEFAULT 0, -- Times user lost focus
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5,2), -- 0-100 based on behavior
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_responses (question_id),
    INDEX idx_submitted_at (submitted_at)
);

-- Mental Stamina Metrics (Calculated per session segment)
CREATE TABLE IF NOT EXISTS stamina_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    metric_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sequence_number INTEGER NOT NULL, -- Order in session
    avg_response_time_ms INTEGER,
    accuracy_rate DECIMAL(5,2), -- Percentage
    fatigue_index DECIMAL(5,2), -- 0-100, higher = more fatigued
    consistency_score DECIMAL(5,2), -- 0-100, variance in performance
    attention_score DECIMAL(5,2), -- 0-100, based on focus metrics
    recommended_break BOOLEAN DEFAULT FALSE,
    break_urgency VARCHAR(50), -- 'none', 'suggested', 'recommended', 'required'
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session_metrics (session_id),
    INDEX idx_metric_timestamp (metric_timestamp)
);

-- LTI Context (Moodle course/activity context)
CREATE TABLE IF NOT EXISTS lti_contexts (
    id SERIAL PRIMARY KEY,
    context_id VARCHAR(255) UNIQUE NOT NULL,
    course_name VARCHAR(255),
    moodle_course_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_context_id (context_id)
);

-- Grade Passback (Send scores back to Moodle)
CREATE TABLE IF NOT EXISTS grade_passbacks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    context_id VARCHAR(255),
    score DECIMAL(5,2) NOT NULL, -- 0-100
    max_score DECIMAL(5,2) DEFAULT 100,
    passback_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    succeeded_at TIMESTAMP NULL,
    error_message TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_passback_status (passback_status),
    INDEX idx_user_passbacks (user_id)
);

-- Teacher Dashboard Access Log
CREATE TABLE IF NOT EXISTS dashboard_access (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_id VARCHAR(255),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_access (teacher_id)
);

-- Create views for analytics

-- Student Performance Summary
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT s.id) AS total_sessions,
    AVG(s.mental_stamina_score) AS avg_stamina_score,
    SUM(s.total_questions) AS total_questions_answered,
    SUM(s.correct_answers) AS total_correct_answers,
    CASE
        WHEN SUM(s.total_questions) > 0
        THEN (SUM(s.correct_answers) * 100.0 / SUM(s.total_questions))
        ELSE 0
    END AS overall_accuracy,
    MAX(s.started_at) AS last_session_date
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email;

-- Recent Stamina Trends (Last 10 sessions per user)
CREATE OR REPLACE VIEW recent_stamina_trends AS
SELECT
    s.user_id,
    s.id AS session_id,
    s.started_at,
    s.mental_stamina_score,
    s.fatigue_level,
    s.total_questions,
    s.correct_answers,
    ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.started_at DESC) AS session_rank
FROM sessions s
WHERE s.mental_stamina_score IS NOT NULL;
