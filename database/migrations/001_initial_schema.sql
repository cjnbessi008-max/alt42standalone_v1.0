-- Migration: Initial Schema
-- Description: Create tables for triangle similarity scaling system
-- Date: 2025-01-18

BEGIN;

-- Problems table
CREATE TABLE problems (
    id VARCHAR(36) PRIMARY KEY,
    moodle_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_triangle JSON NOT NULL,
    target_triangle JSON NOT NULL,
    required_scale_factor DECIMAL(10, 4) NOT NULL,
    tolerance DECIMAL(10, 4) DEFAULT 0.05,
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_problems_moodle_id ON problems(moodle_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_created_at ON problems(created_at);

-- Student attempts table
CREATE TABLE student_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    submitted_triangle JSON NOT NULL,
    submitted_scale_factor DECIMAL(10, 4) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    accuracy DECIMAL(5, 4) NOT NULL,
    time_spent_seconds INT NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE INDEX idx_attempts_student_id ON student_attempts(student_id);
CREATE INDEX idx_attempts_problem_id ON student_attempts(problem_id);
CREATE INDEX idx_attempts_attempted_at ON student_attempts(attempted_at);
CREATE INDEX idx_attempts_is_correct ON student_attempts(is_correct);

-- Student progress table
CREATE TABLE student_progress (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    best_accuracy DECIMAL(5, 4) DEFAULT 0,
    average_time_seconds INT DEFAULT 0,
    first_attempt_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    mastered BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE (student_id, problem_id)
);

CREATE INDEX idx_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_progress_mastered ON student_progress(mastered);

-- Moodle sessions table
CREATE TABLE moodle_sessions (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    moodle_user_id INT NOT NULL,
    course_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_student_id ON moodle_sessions(student_id);
CREATE INDEX idx_sessions_moodle_user_id ON moodle_sessions(moodle_user_id);
CREATE INDEX idx_sessions_expires_at ON moodle_sessions(expires_at);

COMMIT;
