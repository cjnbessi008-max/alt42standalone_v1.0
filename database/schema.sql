-- LMS Checkpoint Database Schema
-- SQLite Database for Submission Verification System

-- Problems table - stores problem definitions
CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    problem_type TEXT NOT NULL, -- 'math', 'code', 'text', 'multiple_choice'
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    correct_answer TEXT NOT NULL, -- JSON string for complex answers
    validation_rules TEXT NOT NULL, -- JSON string of validation rules
    hints TEXT, -- JSON array of hints
    max_attempts INTEGER DEFAULT 3,
    time_limit_seconds INTEGER,
    points INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table - stores student information
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    student_number TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table - stores all submission attempts
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    problem_id TEXT NOT NULL,
    answer TEXT NOT NULL, -- JSON string of student answer
    status TEXT CHECK(status IN ('pending', 'validated', 'submitted', 'graded')) DEFAULT 'pending',
    score INTEGER,
    feedback TEXT, -- JSON string of detailed feedback
    attempt_number INTEGER DEFAULT 1,
    time_spent_seconds INTEGER,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Checkpoint validations table - stores validation checkpoints before submission
CREATE TABLE IF NOT EXISTS checkpoint_validations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    validation_type TEXT NOT NULL, -- 'format', 'range', 'logic', 'calculation'
    passed BOOLEAN NOT NULL,
    error_message TEXT,
    warning_message TEXT,
    suggestions TEXT, -- JSON array of suggestions
    validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- LMS sync table - tracks synchronization with external LMS
CREATE TABLE IF NOT EXISTS lms_sync (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    lms_submission_id TEXT,
    sync_status TEXT CHECK(sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt DATETIME,
    error_log TEXT,
    synced_at DATETIME,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Audit log table - tracks all important actions
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'submission', 'validation', 'lms_sync'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'validate', 'submit'
    user_id TEXT,
    metadata TEXT, -- JSON string of additional data
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_checkpoint_submission ON checkpoint_validations(submission_id);
CREATE INDEX IF NOT EXISTS idx_lms_sync_submission ON lms_sync(submission_id);
CREATE INDEX IF NOT EXISTS idx_lms_sync_status ON lms_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Insert sample problems for testing
INSERT INTO problems (id, title, description, problem_type, difficulty, correct_answer, validation_rules, hints, points) VALUES
('prob_001', '이차방정식 풀이', 'x² - 5x + 6 = 0 방정식의 해를 구하세요.', 'math', 'easy',
 '{"solutions": [2, 3], "type": "quadratic"}',
 '{"type": "quadratic", "checks": ["factorization", "quadratic_formula"], "tolerance": 0.01}',
 '["인수분해를 시도해보세요", "근의 공식을 사용할 수 있습니다", "(x-2)(x-3) = 0"]',
 100);

INSERT INTO problems (id, title, description, problem_type, difficulty, correct_answer, validation_rules, hints, points) VALUES
('prob_002', '피타고라스 정리', '직각삼각형의 빗변 길이를 구하세요. 밑변 = 3, 높이 = 4', 'math', 'easy',
 '{"answer": 5, "type": "pythagorean"}',
 '{"type": "pythagorean", "checks": ["positive_number", "calculation"], "tolerance": 0.01}',
 '["a² + b² = c²", "3² + 4² = ?"]',
 100);

INSERT INTO problems (id, title, description, problem_type, difficulty, correct_answer, validation_rules, hints, points) VALUES
('prob_003', '연립방정식 풀이', '2x + y = 10, x - y = 2 연립방정식의 해를 구하세요.', 'math', 'medium',
 '{"x": 4, "y": 2, "type": "system"}',
 '{"type": "system", "checks": ["substitution", "elimination"], "tolerance": 0.01}',
 '["대입법이나 소거법을 사용하세요", "두 식을 더해보세요", "x를 먼저 구해보세요"]',
 150);

-- Insert sample student
INSERT INTO students (id, name, email, student_number) VALUES
('student_001', '테스트 학생', 'test@example.com', 'STU001');
