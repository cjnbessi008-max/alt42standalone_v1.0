-- Answer Classification System - Database Schema
-- Version: 1.0.0
-- Created: 2025-11-18
-- Description: Schema for classifying student wrong answers into 개념/계산/조건누락

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Tables (Dependencies)
-- ============================================================================

-- Students table (if not exists)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    lms_user_id VARCHAR(255),  -- External LMS user ID
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Teachers table (if not exists)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher',
    lms_user_id VARCHAR(255),  -- External LMS user ID
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Modules table (if not exists)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID REFERENCES teachers(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Problems table (if not exists)
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    problem_text TEXT NOT NULL,
    problem_data JSONB,  -- Structured problem data
    correct_answer TEXT NOT NULL,
    correct_answer_data JSONB,  -- Structured answer data
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    validation_rules JSONB,  -- Rules for answer validation
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Answer Classification Tables
-- ============================================================================

-- Answer submissions table
CREATE TABLE answer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    answer_content TEXT NOT NULL,
    answer_data JSONB,  -- Structured answer data for complex inputs
    work_shown TEXT,  -- Student's work/reasoning (optional)
    work_images TEXT[],  -- URLs to uploaded work images
    is_correct BOOLEAN NOT NULL,
    evaluation_details JSONB,  -- Detailed evaluation results
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    lms_submission_id VARCHAR(255),  -- External LMS reference
    lms_source VARCHAR(50),  -- 'canvas', 'moodle', 'kaist', etc.
    CONSTRAINT valid_time_spent CHECK (time_spent_seconds < 86400)  -- Max 24 hours
);

-- Create indexes for performance
CREATE INDEX idx_student_submissions ON answer_submissions(student_id, submitted_at DESC);
CREATE INDEX idx_problem_submissions ON answer_submissions(problem_id, submitted_at DESC);
CREATE INDEX idx_module_submissions ON answer_submissions(module_id, submitted_at DESC);
CREATE INDEX idx_lms_submissions ON answer_submissions(lms_submission_id) WHERE lms_submission_id IS NOT NULL;
CREATE INDEX idx_incorrect_submissions ON answer_submissions(is_correct, submitted_at DESC) WHERE is_correct = FALSE;

-- Answer classifications table
CREATE TABLE answer_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES answer_submissions(id) ON DELETE CASCADE,
    classification_type VARCHAR(20) NOT NULL CHECK (
        classification_type IN ('개념', '계산', '조건누락')
    ),
    confidence_score DECIMAL(3, 2) NOT NULL CHECK (
        confidence_score >= 0.0 AND confidence_score <= 1.0
    ),
    explanation TEXT NOT NULL,  -- Human-readable explanation in Korean
    explanation_en TEXT,  -- English explanation (optional)
    ai_reasoning TEXT NOT NULL,  -- Detailed AI analysis
    ai_model_version VARCHAR(100),  -- e.g., 'claude-3-sonnet-20240229'
    teacher_verified BOOLEAN DEFAULT FALSE,
    teacher_override VARCHAR(20) CHECK (
        teacher_override IS NULL OR teacher_override IN ('개념', '계산', '조건누락')
    ),
    teacher_id UUID REFERENCES teachers(id),
    teacher_notes TEXT,  -- Teacher's review comments
    verified_at TIMESTAMP,
    classified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    feedback_message TEXT NOT NULL,  -- Personalized feedback for student
    CONSTRAINT one_classification_per_submission UNIQUE (submission_id)
);

-- Create indexes
CREATE INDEX idx_submission_classification ON answer_classifications(submission_id);
CREATE INDEX idx_teacher_review ON answer_classifications(teacher_verified, classified_at DESC);
CREATE INDEX idx_classification_type ON answer_classifications(classification_type, classified_at DESC);
CREATE INDEX idx_low_confidence ON answer_classifications(confidence_score) WHERE confidence_score < 0.6;

-- Error patterns tracking
CREATE TABLE error_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    error_type VARCHAR(20) NOT NULL CHECK (
        error_type IN ('개념', '계산', '조건누락')
    ),
    occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
    first_occurrence TIMESTAMP NOT NULL DEFAULT NOW(),
    last_occurrence TIMESTAMP NOT NULL DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolution_criteria TEXT,  -- How resolution was determined
    CONSTRAINT unique_student_module_error UNIQUE (student_id, module_id, error_type),
    CONSTRAINT resolved_has_date CHECK (
        (is_resolved = FALSE AND resolved_at IS NULL) OR
        (is_resolved = TRUE AND resolved_at IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX idx_student_patterns ON error_patterns(student_id, module_id);
CREATE INDEX idx_active_patterns ON error_patterns(is_resolved, last_occurrence DESC) WHERE is_resolved = FALSE;
CREATE INDEX idx_error_type_patterns ON error_patterns(error_type, occurrence_count DESC);

-- Classification feedback resources
CREATE TABLE classification_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_id UUID NOT NULL REFERENCES answer_classifications(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (
        feedback_type IN ('concept', 'hint', 'example', 'resource', 'video', 'practice')
    ),
    title VARCHAR(255),
    content TEXT NOT NULL,
    content_en TEXT,  -- English content (optional)
    resource_url TEXT,
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_classification_feedback ON classification_feedback(classification_id, display_order);
CREATE INDEX idx_active_feedback ON classification_feedback(is_active, feedback_type) WHERE is_active = TRUE;

-- ============================================================================
-- LMS Integration Tables
-- ============================================================================

-- LMS integration configurations
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_type VARCHAR(50) NOT NULL,  -- 'canvas', 'moodle', 'kaist', 'generic_lti'
    lms_course_id VARCHAR(255) NOT NULL,
    lms_course_name VARCHAR(255),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    consumer_key VARCHAR(255) NOT NULL,
    shared_secret_hash VARCHAR(255) NOT NULL,  -- Hashed, never store plaintext
    deployment_id VARCHAR(255),  -- LTI 1.3 deployment ID
    platform_id TEXT,  -- LTI 1.3 platform (issuer) URL
    client_id VARCHAR(255),  -- LTI 1.3 client ID
    auth_token_url TEXT,  -- LTI 1.3 OAuth2 token endpoint
    jwks_url TEXT,  -- LTI 1.3 public keyset URL
    is_active BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),  -- 'success', 'failed', 'partial'
    sync_error_message TEXT,
    config_metadata JSONB,  -- Additional LMS-specific config
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_lms_course_module UNIQUE (lms_type, lms_course_id, module_id)
);

-- Create indexes
CREATE INDEX idx_lms_course ON lms_integrations(lms_type, lms_course_id);
CREATE INDEX idx_active_integrations ON lms_integrations(is_active, lms_type) WHERE is_active = TRUE;
CREATE INDEX idx_sync_status ON lms_integrations(last_sync_status, last_sync_at);

-- LMS grade passback log
CREATE TABLE lms_grade_passback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES answer_submissions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    grade_value DECIMAL(5, 2) NOT NULL CHECK (grade_value >= 0 AND grade_value <= 100),
    lms_lineitem_id VARCHAR(255),  -- LTI 1.3 line item ID
    passback_status VARCHAR(50) NOT NULL,  -- 'pending', 'success', 'failed', 'retry'
    passback_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    lms_response JSONB,  -- Full response from LMS
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_grade_passback_status ON lms_grade_passback(passback_status, last_attempt_at);
CREATE INDEX idx_submission_passback ON lms_grade_passback(submission_id);
CREATE INDEX idx_failed_passbacks ON lms_grade_passback(passback_status, passback_attempts)
    WHERE passback_status = 'failed' AND passback_attempts < 3;

-- ============================================================================
-- Analytics & Aggregation Tables
-- ============================================================================

-- Daily error statistics (materialized view for performance)
CREATE TABLE error_statistics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_submissions INTEGER NOT NULL DEFAULT 0,
    incorrect_submissions INTEGER NOT NULL DEFAULT 0,
    concept_errors INTEGER NOT NULL DEFAULT 0,
    calculation_errors INTEGER NOT NULL DEFAULT 0,
    condition_errors INTEGER NOT NULL DEFAULT 0,
    avg_confidence_score DECIMAL(3, 2),
    unique_students INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT unique_module_date UNIQUE (module_id, date)
);

-- Create indexes
CREATE INDEX idx_module_stats_date ON error_statistics_daily(module_id, date DESC);
CREATE INDEX idx_error_type_distribution ON error_statistics_daily(
    date DESC,
    concept_errors + calculation_errors + condition_errors
);

-- Student progress tracking
CREATE TABLE student_error_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    concept_error_count INTEGER NOT NULL DEFAULT 0,
    calculation_error_count INTEGER NOT NULL DEFAULT 0,
    condition_error_count INTEGER NOT NULL DEFAULT 0,
    improvement_score DECIMAL(5, 2),  -- Calculated metric: trend over time
    last_activity_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_module_summary UNIQUE (student_id, module_id)
);

-- Create indexes
CREATE INDEX idx_student_summary ON student_error_summary(student_id, module_id);
CREATE INDEX idx_module_summary ON student_error_summary(module_id, improvement_score DESC NULLS LAST);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_integrations_updated_at BEFORE UPDATE ON lms_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update error patterns
CREATE OR REPLACE FUNCTION update_error_pattern()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process incorrect answers
    IF NEW.is_correct = FALSE THEN
        -- Get the classification (might not exist yet if trigger runs before classification)
        -- This will be called again after classification is inserted
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update error patterns when classification is added
CREATE OR REPLACE FUNCTION increment_error_pattern()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_module_id UUID;
BEGIN
    -- Get student and module from submission
    SELECT student_id, module_id INTO v_student_id, v_module_id
    FROM answer_submissions
    WHERE id = NEW.submission_id;

    -- Use final classification (teacher override if exists, otherwise AI classification)
    INSERT INTO error_patterns (student_id, module_id, error_type, occurrence_count, first_occurrence, last_occurrence)
    VALUES (
        v_student_id,
        v_module_id,
        COALESCE(NEW.teacher_override, NEW.classification_type),
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (student_id, module_id, error_type)
    DO UPDATE SET
        occurrence_count = error_patterns.occurrence_count + 1,
        last_occurrence = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_error_pattern_on_classification
    AFTER INSERT ON answer_classifications
    FOR EACH ROW
    EXECUTE FUNCTION increment_error_pattern();

-- Function to update daily statistics
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS TRIGGER AS $$
DECLARE
    v_submission_date DATE;
    v_is_correct BOOLEAN;
    v_classification_type VARCHAR(20);
    v_confidence DECIMAL(3, 2);
BEGIN
    -- Get submission details
    SELECT
        DATE(submitted_at),
        is_correct
    INTO v_submission_date, v_is_correct
    FROM answer_submissions
    WHERE id = NEW.submission_id;

    v_classification_type := COALESCE(NEW.teacher_override, NEW.classification_type);
    v_confidence := NEW.confidence_score;

    -- Update daily stats
    INSERT INTO error_statistics_daily (
        module_id,
        date,
        total_submissions,
        incorrect_submissions,
        concept_errors,
        calculation_errors,
        condition_errors,
        avg_confidence_score,
        unique_students
    )
    SELECT
        (SELECT module_id FROM answer_submissions WHERE id = NEW.submission_id),
        v_submission_date,
        1,
        CASE WHEN v_is_correct = FALSE THEN 1 ELSE 0 END,
        CASE WHEN v_classification_type = '개념' THEN 1 ELSE 0 END,
        CASE WHEN v_classification_type = '계산' THEN 1 ELSE 0 END,
        CASE WHEN v_classification_type = '조건누락' THEN 1 ELSE 0 END,
        v_confidence,
        1
    ON CONFLICT (module_id, date)
    DO UPDATE SET
        total_submissions = error_statistics_daily.total_submissions + 1,
        incorrect_submissions = error_statistics_daily.incorrect_submissions +
            CASE WHEN v_is_correct = FALSE THEN 1 ELSE 0 END,
        concept_errors = error_statistics_daily.concept_errors +
            CASE WHEN v_classification_type = '개념' THEN 1 ELSE 0 END,
        calculation_errors = error_statistics_daily.calculation_errors +
            CASE WHEN v_classification_type = '계산' THEN 1 ELSE 0 END,
        condition_errors = error_statistics_daily.condition_errors +
            CASE WHEN v_classification_type = '조건누락' THEN 1 ELSE 0 END,
        avg_confidence_score = (
            COALESCE(error_statistics_daily.avg_confidence_score, 0) * error_statistics_daily.total_submissions + v_confidence
        ) / (error_statistics_daily.total_submissions + 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_stats_on_classification
    AFTER INSERT ON answer_classifications
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_statistics();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Student error overview
CREATE OR REPLACE VIEW v_student_error_overview AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    m.id AS module_id,
    m.name AS module_name,
    COUNT(DISTINCT asub.id) AS total_submissions,
    COUNT(DISTINCT CASE WHEN asub.is_correct = FALSE THEN asub.id END) AS incorrect_count,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '개념' THEN ac.id END) AS concept_errors,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '계산' THEN ac.id END) AS calculation_errors,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '조건누락' THEN ac.id END) AS condition_errors,
    ROUND(AVG(CASE WHEN asub.is_correct = FALSE THEN ac.confidence_score END), 2) AS avg_confidence,
    MAX(asub.submitted_at) AS last_activity
FROM students s
JOIN answer_submissions asub ON s.id = asub.student_id
JOIN modules m ON asub.module_id = m.id
LEFT JOIN answer_classifications ac ON asub.id = ac.submission_id
GROUP BY s.id, s.name, m.id, m.name;

-- View: Teacher review queue
CREATE OR REPLACE VIEW v_teacher_review_queue AS
SELECT
    ac.id AS classification_id,
    ac.classified_at,
    ac.classification_type,
    ac.confidence_score,
    s.name AS student_name,
    m.name AS module_name,
    p.problem_text,
    asub.answer_content,
    asub.work_shown,
    ac.explanation,
    ac.feedback_message
FROM answer_classifications ac
JOIN answer_submissions asub ON ac.submission_id = asub.id
JOIN students s ON asub.student_id = s.id
JOIN modules m ON asub.module_id = m.id
JOIN problems p ON asub.problem_id = p.id
WHERE ac.teacher_verified = FALSE
  AND ac.confidence_score < 0.85  -- Only show medium/low confidence for review
ORDER BY ac.classified_at ASC;

-- View: Module error distribution
CREATE OR REPLACE VIEW v_module_error_distribution AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    COUNT(DISTINCT asub.id) AS total_submissions,
    COUNT(DISTINCT CASE WHEN asub.is_correct = FALSE THEN asub.id END) AS incorrect_count,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '개념' THEN ac.id END) AS concept_errors,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '계산' THEN ac.id END) AS calculation_errors,
    COUNT(DISTINCT CASE WHEN ac.classification_type = '조건누락' THEN ac.id END) AS condition_errors,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN asub.is_correct = FALSE THEN asub.id END) /
        NULLIF(COUNT(DISTINCT asub.id), 0),
        2
    ) AS error_rate_percent
FROM modules m
LEFT JOIN answer_submissions asub ON m.id = asub.module_id
LEFT JOIN answer_classifications ac ON asub.id = ac.submission_id
GROUP BY m.id, m.name;

-- ============================================================================
-- Sample Data (for development/testing)
-- ============================================================================

-- Insert sample teacher
INSERT INTO teachers (id, name, email, institution) VALUES
    ('00000000-0000-0000-0000-000000000001', '김선생', 'kim.teacher@kaist.ac.kr', 'KAIST')
ON CONFLICT (email) DO NOTHING;

-- Insert sample students
INSERT INTO students (id, name, email, grade_level) VALUES
    ('00000000-0000-0000-0000-000000000011', '학생1', 'student1@kaist.ac.kr', '3학년'),
    ('00000000-0000-0000-0000-000000000012', '학생2', 'student2@kaist.ac.kr', '3학년'),
    ('00000000-0000-0000-0000-000000000013', '학생3', 'student3@kaist.ac.kr', '3학년')
ON CONFLICT (email) DO NOTHING;

-- Insert sample module
INSERT INTO modules (id, name, description, subject, grade_level, teacher_id) VALUES
    ('00000000-0000-0000-0000-000000000021', '분수 학습', '분수의 기본 개념과 덧셈/뺄셈 학습', 'mathematics', '3학년', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample problem
INSERT INTO problems (id, module_id, problem_type, problem_text, correct_answer, difficulty_level) VALUES
    ('00000000-0000-0000-0000-000000000031',
     '00000000-0000-0000-0000-000000000021',
     'fraction_addition',
     '1/4 + 1/4 = ?',
     '1/2',
     2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Permissions (adjust based on your roles)
-- ============================================================================

-- Grant appropriate permissions to application user
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Uncomment to verify schema creation:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT table_name, column_name, data_type FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'answer_classifications';
