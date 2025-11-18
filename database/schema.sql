-- Triangle Similarity Scaling Database Schema
-- Compatible with PostgreSQL 12+ and MySQL 5.7+

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_moodle_id (moodle_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_at (created_at)
);

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    submitted_triangle JSON NOT NULL,
    submitted_scale_factor DECIMAL(10, 4) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    accuracy DECIMAL(5, 4) NOT NULL,
    time_spent_seconds INT NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_is_correct (is_correct)
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
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
    UNIQUE KEY unique_student_problem (student_id, problem_id),
    INDEX idx_student_id (student_id),
    INDEX idx_mastered (mastered)
);

-- Moodle integration tracking
CREATE TABLE IF NOT EXISTS moodle_sessions (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    moodle_user_id INT NOT NULL,
    course_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_id (student_id),
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_expires_at (expires_at)
);

-- Insert demo problem
INSERT INTO problems (
    id,
    title,
    description,
    source_triangle,
    target_triangle,
    required_scale_factor,
    tolerance,
    difficulty
) VALUES (
    'demo-problem-1',
    '삼각형 닮음 기초',
    '파란색 삼각형을 확대하여 보라색 삼각형과 완전히 겹치도록 만드세요.',
    '{"id":"source-1","vertices":[{"x":200,"y":200},{"x":300,"y":200},{"x":250,"y":300}],"color":"#3b82f6","isTarget":false,"scaleFactor":1}',
    '{"id":"target-1","vertices":[{"x":400,"y":200},{"x":600,"y":200},{"x":500,"y":400}],"color":"#8b5cf6","isTarget":true,"scaleFactor":2}',
    2.0,
    0.05,
    'easy'
);
