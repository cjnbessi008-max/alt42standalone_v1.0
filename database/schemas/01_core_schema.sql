-- LMS Wrong Answer Analysis System - Core Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER MANAGEMENT (Synced from Moodle)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_moodle_id ON users(moodle_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- COURSE MANAGEMENT (Synced from Moodle)
-- ============================================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_course_id INTEGER UNIQUE NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    short_name VARCHAR(255),
    category VARCHAR(255),

    -- Teacher assignment
    teacher_id UUID REFERENCES users(id),

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_moodle_id ON courses(moodle_course_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);

-- Course enrollment tracking
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'student', 'teacher', 'ta'
    enrolled_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(course_id, user_id)
);

CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);

-- ============================================================================
-- QUIZ MANAGEMENT (Synced from Moodle)
-- ============================================================================

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_quiz_id INTEGER UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

    -- Quiz details
    name VARCHAR(500) NOT NULL,
    intro TEXT,
    time_limit INTEGER, -- seconds, NULL = no limit
    attempts_allowed INTEGER, -- NULL = unlimited
    grade_method VARCHAR(50), -- 'highest', 'average', 'first', 'last'

    -- Question details
    questions_count INTEGER DEFAULT 0,
    sum_grades DECIMAL(10, 2),

    -- Timing
    time_open TIMESTAMP,
    time_close TIMESTAMP,

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quizzes_moodle_id ON quizzes(moodle_quiz_id);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);

-- ============================================================================
-- QUESTION BANK (Synced from Moodle)
-- ============================================================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_question_id INTEGER UNIQUE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,

    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'multichoice', 'truefalse', 'shortanswer', 'essay', 'numerical'

    -- Correct answer (stored for analysis)
    correct_answer TEXT,
    answer_options JSONB, -- For multiple choice questions

    -- Educational metadata
    concept_tag VARCHAR(255), -- e.g., 'fractions_addition', 'algebra_linear_equations'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    bloom_taxonomy VARCHAR(50), -- 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'

    -- Grading
    default_mark DECIMAL(10, 2),

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_moodle_id ON questions(moodle_question_id);
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_questions_concept ON questions(concept_tag);
CREATE INDEX idx_questions_type ON questions(question_type);

-- ============================================================================
-- QUIZ ATTEMPTS (Synced from Moodle)
-- ============================================================================

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_attempt_id INTEGER UNIQUE NOT NULL,

    -- References
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Attempt details
    attempt_number INTEGER NOT NULL,
    state VARCHAR(50) NOT NULL, -- 'inprogress', 'finished', 'abandoned', 'overdue'

    -- Timing
    time_start TIMESTAMP NOT NULL,
    time_finish TIMESTAMP,
    time_modified TIMESTAMP,

    -- Grading
    sum_grades DECIMAL(10, 2),
    grade DECIMAL(10, 2), -- Final grade (0-100)

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(quiz_id, user_id, attempt_number)
);

CREATE INDEX idx_attempts_moodle_id ON quiz_attempts(moodle_attempt_id);
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_state ON quiz_attempts(state);

-- ============================================================================
-- QUESTION ATTEMPTS (핵심 데이터 - Confidence 포함)
-- ============================================================================

CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_attempt_id INTEGER, -- Moodle's question attempt ID

    -- References
    quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Answer details
    student_answer TEXT,
    is_correct BOOLEAN NOT NULL,

    -- Grading
    max_mark DECIMAL(10, 2) NOT NULL,
    mark DECIMAL(10, 2) NOT NULL, -- Actual marks received

    -- ⭐ CONFIDENCE LEVEL (핵심 기능)
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    -- 1: 전혀 확신 없음 (Not confident at all)
    -- 2: 조금 확신 없음 (Slightly uncertain)
    -- 3: 중간 (Neutral)
    -- 4: 확신함 (Confident)
    -- 5: 매우 확신함 (Very confident)

    confidence_collected_at TIMESTAMP,
    confidence_collection_method VARCHAR(50), -- 'inline', 'post_quiz', 'retrospective'

    -- Time tracking
    time_spent_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,
    sequence_number INTEGER, -- Order in quiz

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(quiz_attempt_id, question_id)
);

CREATE INDEX idx_q_attempts_quiz_attempt ON question_attempts(quiz_attempt_id);
CREATE INDEX idx_q_attempts_question ON question_attempts(question_id);
CREATE INDEX idx_q_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_q_attempts_correctness ON question_attempts(is_correct);
CREATE INDEX idx_q_attempts_confidence ON question_attempts(confidence_level);

-- ⭐ 핵심 쿼리 최적화: 고확신 오답 조회
CREATE INDEX idx_q_attempts_confident_wrong ON question_attempts(user_id, is_correct, confidence_level)
    WHERE is_correct = false AND confidence_level >= 4;

-- ============================================================================
-- CONFIDENCE WRONG ANSWERS (분석 결과 저장)
-- ============================================================================

CREATE TABLE confidence_wrong_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    question_attempt_id UUID REFERENCES question_attempts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

    -- Analysis metadata
    confidence_level INTEGER NOT NULL,
    concept_tag VARCHAR(255),
    misconception_type VARCHAR(255), -- e.g., 'procedural_error', 'conceptual_misunderstanding'

    -- AI Analysis (Claude API)
    ai_analysis JSONB,
    -- Example structure:
    -- {
    --   "misconception": "학생이 분수 덧셈 시 분모를 더하는 오류",
    --   "root_cause": "분수의 개념적 이해 부족",
    --   "suggested_approach": "시각적 모델 사용 권장",
    --   "confidence_score": 0.85
    -- }

    -- Recommendations
    recommended_resources TEXT[], -- URLs, video links, etc.
    similar_questions UUID[], -- Array of question IDs
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5) DEFAULT 3,

    -- Status
    reviewed_by_teacher BOOLEAN DEFAULT false,
    teacher_notes TEXT,

    -- Timestamps
    analyzed_at TIMESTAMP DEFAULT NOW(),
    last_reviewed_at TIMESTAMP,

    UNIQUE(question_attempt_id)
);

CREATE INDEX idx_cwa_user ON confidence_wrong_answers(user_id);
CREATE INDEX idx_cwa_question ON confidence_wrong_answers(question_id);
CREATE INDEX idx_cwa_concept ON confidence_wrong_answers(concept_tag);
CREATE INDEX idx_cwa_priority ON confidence_wrong_answers(priority_level);
CREATE INDEX idx_cwa_reviewed ON confidence_wrong_answers(reviewed_by_teacher);

-- ============================================================================
-- LEARNING RECOMMENDATIONS (학습 추천)
-- ============================================================================

CREATE TABLE learning_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Recommendation details
    concept_tag VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Priority & type
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5) DEFAULT 3,
    recommendation_type VARCHAR(50) NOT NULL, -- 'review', 'practice', 'conceptual_help', 'metacognitive_training'

    -- Resources
    resources JSONB,
    -- Example structure:
    -- {
    --   "videos": ["https://...", "https://..."],
    --   "practice_problems": [quiz_id_1, quiz_id_2],
    --   "reading_materials": ["https://..."],
    --   "interactive_tools": ["https://..."]
    -- }

    -- Based on analysis
    based_on_cwa_ids UUID[], -- Array of confidence_wrong_answer IDs

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
    progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    dismissed_at TIMESTAMP
);

CREATE INDEX idx_recommendations_user ON learning_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON learning_recommendations(status);
CREATE INDEX idx_recommendations_concept ON learning_recommendations(concept_tag);
CREATE INDEX idx_recommendations_priority ON learning_recommendations(priority_level);

-- ============================================================================
-- ANALYSIS CACHE (성능 최적화)
-- ============================================================================

CREATE TABLE analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'student_summary', 'class_summary', 'concept_analysis'

    -- Reference (optional)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

    -- Cached data
    data JSONB NOT NULL,

    -- Cache management
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_cache_key ON analysis_cache(cache_key);
CREATE INDEX idx_cache_expires ON analysis_cache(expires_at);
CREATE INDEX idx_cache_user ON analysis_cache(user_id);
CREATE INDEX idx_cache_course ON analysis_cache(course_id);

-- Auto-delete expired cache entries
CREATE OR REPLACE FUNCTION delete_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM analysis_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MOODLE SYNC LOG (동기화 추적)
-- ============================================================================

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    entity_type VARCHAR(50) NOT NULL, -- 'courses', 'quizzes', 'attempts', 'users'

    -- Sync details
    moodle_course_id INTEGER,
    moodle_quiz_id INTEGER,

    -- Status
    status VARCHAR(50) NOT NULL, -- 'started', 'in_progress', 'completed', 'failed'
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,
    error_details JSONB,

    -- Timing
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER
);

CREATE INDEX idx_sync_logs_type ON sync_logs(entity_type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at);

-- ============================================================================
-- SYSTEM SETTINGS (시스템 설정)
-- ============================================================================

CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    value_type VARCHAR(50) NOT NULL, -- 'string', 'integer', 'boolean', 'json'
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO system_settings (key, value, value_type, description) VALUES
('moodle_url', '', 'string', 'Moodle instance URL'),
('moodle_token_encrypted', '', 'string', 'Encrypted Moodle API token'),
('confidence_threshold', '4', 'integer', 'Minimum confidence level to flag as "confident wrong answer"'),
('sync_interval_hours', '6', 'integer', 'How often to sync with Moodle (hours)'),
('ai_analysis_enabled', 'true', 'boolean', 'Enable AI-powered misconception analysis'),
('claude_api_key_encrypted', '', 'string', 'Encrypted Claude API key');

-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_attempts_updated_at BEFORE UPDATE ON question_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: 자주 사용하는 쿼리
-- ============================================================================

-- View: 고확신 오답 (Confident Wrong Answers)
CREATE OR REPLACE VIEW v_confident_wrong_answers AS
SELECT
    qa.id,
    qa.user_id,
    u.username,
    u.first_name,
    u.last_name,
    qa.question_id,
    q.question_text,
    q.concept_tag,
    qa.confidence_level,
    qa.student_answer,
    q.correct_answer,
    qz.name as quiz_name,
    c.full_name as course_name,
    qa.created_at
FROM question_attempts qa
JOIN users u ON qa.user_id = u.id
JOIN questions q ON qa.question_id = q.id
JOIN quizzes qz ON q.quiz_id = qz.id
JOIN courses c ON qz.course_id = c.id
WHERE qa.is_correct = false
  AND qa.confidence_level >= 4;

-- View: 학생별 확신도 정확도 (Confidence Accuracy)
CREATE OR REPLACE VIEW v_student_confidence_accuracy AS
SELECT
    qa.user_id,
    u.username,
    u.first_name,
    u.last_name,
    qa.confidence_level,
    COUNT(*) as total_answers,
    SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(
        100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) as accuracy_percentage
FROM question_attempts qa
JOIN users u ON qa.user_id = u.id
WHERE qa.confidence_level IS NOT NULL
GROUP BY qa.user_id, u.username, u.first_name, u.last_name, qa.confidence_level
ORDER BY qa.user_id, qa.confidence_level;

-- View: 개념별 확신 오답률
CREATE OR REPLACE VIEW v_concept_confidence_wrong_rate AS
SELECT
    q.concept_tag,
    COUNT(*) as total_high_confidence_attempts,
    SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) as confident_wrong_count,
    ROUND(
        100.0 * SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) as confident_wrong_rate_percentage
FROM question_attempts qa
JOIN questions q ON qa.question_id = q.id
WHERE qa.confidence_level >= 4
  AND q.concept_tag IS NOT NULL
GROUP BY q.concept_tag
ORDER BY confident_wrong_rate_percentage DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE question_attempts IS '학생의 각 문제 시도 기록 - 확신도 포함';
COMMENT ON COLUMN question_attempts.confidence_level IS '확신도 (1-5): 학생이 답안에 대해 얼마나 확신하는지';
COMMENT ON TABLE confidence_wrong_answers IS '확신했지만 틀린 답안 - AI 분석 결과 포함';
COMMENT ON TABLE learning_recommendations IS '학생별 맞춤 학습 추천';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
