-- Chaos Harmony Standalone - SQLite Database Schema
-- This schema is for a standalone quiz application with learning pattern visualization

-- Users table (teachers and students)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('teacher', 'student', 'admin')) DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active INTEGER DEFAULT 1
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    time_limit INTEGER, -- in seconds, NULL for no limit
    passing_score REAL DEFAULT 60.0,
    max_attempts INTEGER DEFAULT 3,
    is_published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer')) DEFAULT 'multiple_choice',
    points REAL DEFAULT 1.0,
    difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    order_num INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Answer options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS answer_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    order_num INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    score REAL,
    total_points REAL,
    time_spent INTEGER, -- in seconds
    is_completed INTEGER DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student answers table
CREATE TABLE IF NOT EXISTS student_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_text TEXT,
    selected_option_id INTEGER,
    is_correct INTEGER,
    points_earned REAL DEFAULT 0,
    response_time INTEGER, -- in seconds
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES answer_options(id) ON DELETE SET NULL
);

-- Chaos Harmony patterns table
CREATE TABLE IF NOT EXISTS chaos_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    quiz_id INTEGER,
    pattern_type TEXT CHECK(pattern_type IN ('success_rhythm', 'struggle_wave', 'speed_pattern', 'breakthrough_burst')) NOT NULL,
    intensity REAL NOT NULL CHECK(intensity >= 0 AND intensity <= 1),
    frequency REAL NOT NULL CHECK(frequency >= 0 AND frequency <= 1),
    metadata TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
);

-- Visualization state table
CREATE TABLE IF NOT EXISTS visualization_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL,
    current_emotion TEXT CHECK(current_emotion IN ('neutral', 'joy', 'flow', 'struggle', 'breakthrough')) DEFAULT 'neutral',
    color_palette TEXT, -- JSON string
    animation_speed REAL DEFAULT 1.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analytics aggregates table (for performance optimization)
CREATE TABLE IF NOT EXISTS analytics_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    quiz_id INTEGER,
    total_attempts INTEGER DEFAULT 0,
    avg_score REAL DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    UNIQUE(student_id, quiz_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question ON student_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_chaos_patterns_student ON chaos_patterns(student_id);
CREATE INDEX IF NOT EXISTS idx_chaos_patterns_quiz ON chaos_patterns(quiz_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_analytics_student ON analytics_summary(student_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_quizzes_timestamp
AFTER UPDATE ON quizzes
BEGIN
    UPDATE quizzes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_visualization_state_timestamp
AFTER UPDATE ON visualization_state
BEGIN
    UPDATE visualization_state SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update analytics on new answer
CREATE TRIGGER IF NOT EXISTS update_analytics_on_answer
AFTER INSERT ON student_answers
BEGIN
    INSERT INTO analytics_summary (student_id, quiz_id, total_answers, correct_answers)
    SELECT
        qa.student_id,
        qa.quiz_id,
        1,
        CASE WHEN NEW.is_correct = 1 THEN 1 ELSE 0 END
    FROM quiz_attempts qa
    WHERE qa.id = NEW.attempt_id
    ON CONFLICT(student_id, quiz_id) DO UPDATE SET
        total_answers = total_answers + 1,
        correct_answers = correct_answers + CASE WHEN NEW.is_correct = 1 THEN 1 ELSE 0 END,
        last_updated = CURRENT_TIMESTAMP;
END;

-- Trigger to update analytics on completed attempt
CREATE TRIGGER IF NOT EXISTS update_analytics_on_completion
AFTER UPDATE OF is_completed ON quiz_attempts
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
    UPDATE analytics_summary
    SET
        total_attempts = total_attempts + 1,
        avg_score = (avg_score * (total_attempts - 1) + NEW.score) / total_attempts,
        total_time_spent = total_time_spent + NEW.time_spent,
        last_updated = CURRENT_TIMESTAMP
    WHERE student_id = NEW.student_id AND quiz_id = NEW.quiz_id;
END;
