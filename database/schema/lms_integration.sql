-- ============================================================================
-- LMS Integration Database Schema
-- Moodle 3.7 Integration with Daily Quality Score Evaluation
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-18
-- Database: PostgreSQL 15+
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Moodle Configuration Table
-- ============================================================================

CREATE TABLE moodle_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Connection details
    moodle_url VARCHAR(255) NOT NULL,
    api_token_encrypted TEXT NOT NULL,
    api_endpoint VARCHAR(100) DEFAULT '/webservice/rest/server.php',

    -- Course configuration
    course_id INTEGER,
    course_name VARCHAR(255),

    -- Status and sync
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    sync_frequency_hours INTEGER DEFAULT 24,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',

    -- Constraints
    CONSTRAINT valid_url CHECK (moodle_url ~ '^https?://'),
    CONSTRAINT positive_sync_freq CHECK (sync_frequency_hours > 0)
);

-- Index for active configurations
CREATE INDEX idx_moodle_config_active ON moodle_config(is_active);

COMMENT ON TABLE moodle_config IS 'Configuration for Moodle LMS integration';
COMMENT ON COLUMN moodle_config.api_token_encrypted IS 'Encrypted Moodle Web Service token (Fernet encryption)';

-- ============================================================================
-- 2. Moodle Students Table
-- ============================================================================

CREATE TABLE moodle_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Moodle identifiers
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(100),

    -- Student information
    email VARCHAR(255),
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Academic info
    grade_level VARCHAR(20),
    enrolled_courses JSONB DEFAULT '[]'::jsonb,

    -- Sync metadata
    synced_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_moodle_user_id CHECK (moodle_user_id > 0)
);

-- Indexes for student queries
CREATE INDEX idx_moodle_students_user_id ON moodle_students(moodle_user_id);
CREATE INDEX idx_moodle_students_username ON moodle_students(username);
CREATE INDEX idx_moodle_students_email ON moodle_students(email);
CREATE INDEX idx_moodle_students_active ON moodle_students(is_active);

COMMENT ON TABLE moodle_students IS 'Student roster synced from Moodle LMS';

-- ============================================================================
-- 3. Student Responses Table
-- ============================================================================

CREATE TABLE student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Student reference
    moodle_student_id UUID REFERENCES moodle_students(id) ON DELETE CASCADE,
    moodle_user_id INTEGER NOT NULL,

    -- Response source
    response_type VARCHAR(50) NOT NULL,  -- 'assignment', 'quiz', 'forum', 'workshop'
    activity_id INTEGER NOT NULL,
    activity_name VARCHAR(255),
    course_id INTEGER,

    -- Response content
    response_text TEXT,
    response_html TEXT,
    response_metadata JSONB DEFAULT '{}'::jsonb,  -- attachments, formatting, etc.

    -- Grading context
    question_text TEXT,
    expected_answer TEXT,
    max_points DECIMAL(10,2),

    -- Timing
    submitted_at TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW(),

    -- Evaluation tracking
    evaluation_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'failed'
    evaluation_attempts INTEGER DEFAULT 0,
    last_evaluation_error TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_response_type CHECK (response_type IN ('assignment', 'quiz', 'forum', 'workshop', 'other')),
    CONSTRAINT valid_evaluation_status CHECK (evaluation_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
    CONSTRAINT unique_response UNIQUE(moodle_user_id, activity_id, response_type, submitted_at)
);

-- Indexes for performance
CREATE INDEX idx_student_responses_student ON student_responses(moodle_student_id);
CREATE INDEX idx_student_responses_user_id ON student_responses(moodle_user_id);
CREATE INDEX idx_student_responses_status ON student_responses(evaluation_status);
CREATE INDEX idx_student_responses_submitted ON student_responses(submitted_at DESC);
CREATE INDEX idx_student_responses_type ON student_responses(response_type);
CREATE INDEX idx_student_responses_activity ON student_responses(activity_id);

COMMENT ON TABLE student_responses IS 'Student responses fetched from Moodle for evaluation';
COMMENT ON COLUMN student_responses.response_metadata IS 'JSON containing attachments, timestamps, submission count, etc.';

-- ============================================================================
-- 4. Quality Scores Table
-- ============================================================================

CREATE TABLE quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    student_response_id UUID UNIQUE REFERENCES student_responses(id) ON DELETE CASCADE,
    moodle_student_id UUID REFERENCES moodle_students(id) ON DELETE CASCADE,

    -- Overall score
    total_score DECIMAL(5,2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    grade_letter VARCHAR(2) NOT NULL CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    percentile DECIMAL(5,2),  -- Compared to peers

    -- Detailed component scores (based on Bloom's Taxonomy)
    comprehension_score DECIMAL(5,2) CHECK (comprehension_score BETWEEN 0 AND 20),
    analysis_score DECIMAL(5,2) CHECK (analysis_score BETWEEN 0 AND 25),
    synthesis_score DECIMAL(5,2) CHECK (synthesis_score BETWEEN 0 AND 25),
    logical_reasoning_score DECIMAL(5,2) CHECK (logical_reasoning_score BETWEEN 0 AND 15),
    creativity_score DECIMAL(5,2) CHECK (creativity_score BETWEEN 0 AND 10),
    clarity_score DECIMAL(5,2) CHECK (clarity_score BETWEEN 0 AND 5),

    -- AI evaluation details
    ai_model_used VARCHAR(50) DEFAULT 'claude-3-sonnet-20240229',
    ai_analysis TEXT,  -- Detailed feedback from AI
    ai_strengths JSONB DEFAULT '[]'::jsonb,  -- Array of strengths identified
    ai_improvements JSONB DEFAULT '[]'::jsonb,  -- Array of areas for improvement
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),  -- 0.00 to 1.00

    -- Evaluation metadata
    evaluated_at TIMESTAMP DEFAULT NOW(),
    evaluation_duration_ms INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,

    -- Audit and versioning
    created_by VARCHAR(50) DEFAULT 'system',
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics and queries
CREATE INDEX idx_quality_scores_response ON quality_scores(student_response_id);
CREATE INDEX idx_quality_scores_student ON quality_scores(moodle_student_id);
CREATE INDEX idx_quality_scores_total ON quality_scores(total_score DESC);
CREATE INDEX idx_quality_scores_grade ON quality_scores(grade_letter);
CREATE INDEX idx_quality_scores_evaluated ON quality_scores(evaluated_at DESC);
CREATE INDEX idx_quality_scores_latest ON quality_scores(is_latest) WHERE is_latest = TRUE;

COMMENT ON TABLE quality_scores IS 'AI-evaluated thinking quality scores for student responses';
COMMENT ON COLUMN quality_scores.comprehension_score IS 'Understanding of core concepts (max 20 points)';
COMMENT ON COLUMN quality_scores.analysis_score IS 'Breaking down problems into components (max 25 points)';
COMMENT ON COLUMN quality_scores.synthesis_score IS 'Combining ideas to form new understanding (max 25 points)';
COMMENT ON COLUMN quality_scores.logical_reasoning_score IS 'Coherent argumentation (max 15 points)';
COMMENT ON COLUMN quality_scores.creativity_score IS 'Novel approaches and insights (max 10 points)';
COMMENT ON COLUMN quality_scores.clarity_score IS 'Clear expression of ideas (max 5 points)';

-- ============================================================================
-- 5. Evaluation Jobs Table
-- ============================================================================

CREATE TABLE evaluation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Job details
    job_type VARCHAR(50) DEFAULT 'daily_evaluation',
    job_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Metrics
    total_responses INTEGER DEFAULT 0,
    evaluated_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,

    -- Score statistics
    avg_score DECIMAL(5,2),
    median_score DECIMAL(5,2),
    min_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    std_dev DECIMAL(5,2),

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Error tracking
    error_log TEXT,
    error_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Configuration
    batch_size INTEGER DEFAULT 50,
    date_range_start TIMESTAMP,
    date_range_end TIMESTAMP,

    -- Metadata
    triggered_by VARCHAR(100) DEFAULT 'scheduler',  -- 'scheduler', 'manual', 'api'
    celery_task_id VARCHAR(255),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_job_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_counts CHECK (total_responses >= 0 AND evaluated_count >= 0 AND failed_count >= 0)
);

-- Indexes for job monitoring
CREATE INDEX idx_evaluation_jobs_status ON evaluation_jobs(status);
CREATE INDEX idx_evaluation_jobs_started ON evaluation_jobs(started_at DESC);
CREATE INDEX idx_evaluation_jobs_type ON evaluation_jobs(job_type);
CREATE INDEX idx_evaluation_jobs_triggered ON evaluation_jobs(triggered_by);

COMMENT ON TABLE evaluation_jobs IS 'Tracking for daily evaluation batch jobs';

-- ============================================================================
-- 6. Quality Score History (for tracking improvements over time)
-- ============================================================================

CREATE TABLE quality_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Student tracking
    moodle_student_id UUID REFERENCES moodle_students(id) ON DELETE CASCADE,

    -- Aggregated metrics (monthly)
    month_year VARCHAR(7) NOT NULL,  -- Format: 'YYYY-MM'

    -- Score averages
    avg_total_score DECIMAL(5,2),
    avg_comprehension DECIMAL(5,2),
    avg_analysis DECIMAL(5,2),
    avg_synthesis DECIMAL(5,2),
    avg_logical_reasoning DECIMAL(5,2),
    avg_creativity DECIMAL(5,2),
    avg_clarity DECIMAL(5,2),

    -- Activity counts
    total_responses INTEGER DEFAULT 0,
    response_breakdown JSONB DEFAULT '{}'::jsonb,  -- Count by response type

    -- Performance trends
    improvement_rate DECIMAL(5,2),  -- Compared to previous month
    grade_distribution JSONB DEFAULT '{}'::jsonb,  -- Count of A, B, C, D, F

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_student_month UNIQUE(moodle_student_id, month_year)
);

CREATE INDEX idx_quality_history_student ON quality_score_history(moodle_student_id);
CREATE INDEX idx_quality_history_month ON quality_score_history(month_year DESC);

COMMENT ON TABLE quality_score_history IS 'Monthly aggregated quality scores for trend analysis';

-- ============================================================================
-- 7. System Logs Table
-- ============================================================================

CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Log details
    log_level VARCHAR(20) NOT NULL,  -- 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    component VARCHAR(50) NOT NULL,  -- 'moodle_connector', 'evaluator', 'scheduler', etc.
    message TEXT NOT NULL,

    -- Context
    related_job_id UUID REFERENCES evaluation_jobs(id),
    related_student_id UUID REFERENCES moodle_students(id),
    related_response_id UUID REFERENCES student_responses(id),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    stack_trace TEXT,

    -- Timestamp
    logged_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_log_level CHECK (log_level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_component ON system_logs(component);
CREATE INDEX idx_system_logs_logged ON system_logs(logged_at DESC);
CREATE INDEX idx_system_logs_job ON system_logs(related_job_id);

COMMENT ON TABLE system_logs IS 'System-wide logging for debugging and monitoring';

-- ============================================================================
-- 8. Views for Common Queries
-- ============================================================================

-- View: Latest quality scores per student
CREATE VIEW v_latest_student_scores AS
SELECT
    ms.id AS student_id,
    ms.moodle_user_id,
    ms.full_name,
    ms.grade_level,
    AVG(qs.total_score) AS avg_score,
    COUNT(qs.id) AS total_evaluations,
    MAX(qs.evaluated_at) AS last_evaluated_at
FROM moodle_students ms
LEFT JOIN quality_scores qs ON ms.id = qs.moodle_student_id
WHERE qs.is_latest = TRUE
GROUP BY ms.id, ms.moodle_user_id, ms.full_name, ms.grade_level;

COMMENT ON VIEW v_latest_student_scores IS 'Latest quality score averages per student';

-- View: Daily evaluation summary
CREATE VIEW v_daily_evaluation_summary AS
SELECT
    DATE(ej.started_at) AS evaluation_date,
    COUNT(ej.id) AS total_jobs,
    SUM(ej.evaluated_count) AS total_evaluated,
    SUM(ej.failed_count) AS total_failed,
    AVG(ej.avg_score) AS avg_score,
    AVG(ej.duration_seconds) AS avg_duration_seconds
FROM evaluation_jobs ej
WHERE ej.status = 'completed'
GROUP BY DATE(ej.started_at)
ORDER BY evaluation_date DESC;

COMMENT ON VIEW v_daily_evaluation_summary IS 'Daily summary of evaluation job performance';

-- View: Student response queue (pending evaluations)
CREATE VIEW v_response_queue AS
SELECT
    sr.id,
    sr.moodle_user_id,
    ms.full_name AS student_name,
    sr.response_type,
    sr.activity_name,
    sr.submitted_at,
    sr.evaluation_attempts,
    EXTRACT(EPOCH FROM (NOW() - sr.submitted_at))/3600 AS hours_pending
FROM student_responses sr
JOIN moodle_students ms ON sr.moodle_student_id = ms.id
WHERE sr.evaluation_status = 'pending'
ORDER BY sr.submitted_at ASC;

COMMENT ON VIEW v_response_queue IS 'Queue of responses pending evaluation';

-- ============================================================================
-- 9. Functions and Triggers
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_moodle_config_updated_at BEFORE UPDATE ON moodle_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moodle_students_updated_at BEFORE UPDATE ON moodle_students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_responses_updated_at BEFORE UPDATE ON student_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_scores_updated_at BEFORE UPDATE ON quality_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_jobs_updated_at BEFORE UPDATE ON evaluation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate grade letter from score
CREATE OR REPLACE FUNCTION calculate_grade_letter(score DECIMAL)
RETURNS VARCHAR(2) AS $$
BEGIN
    RETURN CASE
        WHEN score >= 90 THEN 'A'
        WHEN score >= 80 THEN 'B'
        WHEN score >= 70 THEN 'C'
        WHEN score >= 60 THEN 'D'
        ELSE 'F'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_grade_letter IS 'Convert numeric score to letter grade';

-- Function: Validate component scores sum to total
CREATE OR REPLACE FUNCTION validate_quality_score_components()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total DECIMAL(5,2);
BEGIN
    calculated_total := COALESCE(NEW.comprehension_score, 0) +
                        COALESCE(NEW.analysis_score, 0) +
                        COALESCE(NEW.synthesis_score, 0) +
                        COALESCE(NEW.logical_reasoning_score, 0) +
                        COALESCE(NEW.creativity_score, 0) +
                        COALESCE(NEW.clarity_score, 0);

    -- Allow small rounding differences (0.5 points)
    IF ABS(calculated_total - NEW.total_score) > 0.5 THEN
        RAISE EXCEPTION 'Component scores (%) do not sum to total score (%)',
            calculated_total, NEW.total_score;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_quality_scores BEFORE INSERT OR UPDATE ON quality_scores
    FOR EACH ROW EXECUTE FUNCTION validate_quality_score_components();

-- ============================================================================
-- 10. Initial Data / Seed
-- ============================================================================

-- Insert default Moodle configuration (placeholder)
INSERT INTO moodle_config (moodle_url, api_token_encrypted, course_id, is_active)
VALUES (
    'https://lms.kaist.ac.kr',
    'ENCRYPTED_TOKEN_PLACEHOLDER',  -- Replace with actual encrypted token
    NULL,  -- Set course_id after configuration
    FALSE  -- Set to TRUE after proper configuration
);

-- ============================================================================
-- 11. Permissions and Security
-- ============================================================================

-- Create roles
CREATE ROLE lms_admin;
CREATE ROLE lms_evaluator;
CREATE ROLE lms_readonly;

-- Grant permissions to admin (full access)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lms_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lms_admin;

-- Grant permissions to evaluator (read/write for evaluation)
GRANT SELECT, INSERT, UPDATE ON student_responses, quality_scores, evaluation_jobs, system_logs TO lms_evaluator;
GRANT SELECT ON moodle_students, moodle_config TO lms_evaluator;

-- Grant permissions to readonly (read-only access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lms_readonly;

-- ============================================================================
-- 12. Maintenance Queries
-- ============================================================================

-- Query: Find responses pending evaluation for more than 24 hours
-- SELECT * FROM student_responses
-- WHERE evaluation_status = 'pending'
--   AND submitted_at < NOW() - INTERVAL '24 hours'
-- ORDER BY submitted_at ASC;

-- Query: Get average scores by response type
-- SELECT
--     sr.response_type,
--     COUNT(*) AS total_responses,
--     AVG(qs.total_score) AS avg_score,
--     AVG(qs.confidence_level) AS avg_confidence
-- FROM student_responses sr
-- JOIN quality_scores qs ON sr.id = qs.student_response_id
-- GROUP BY sr.response_type;

-- Query: Identify students needing intervention (low scores)
-- SELECT
--     ms.full_name,
--     ms.email,
--     AVG(qs.total_score) AS avg_score,
--     COUNT(qs.id) AS response_count
-- FROM moodle_students ms
-- JOIN quality_scores qs ON ms.id = qs.moodle_student_id
-- WHERE qs.evaluated_at > NOW() - INTERVAL '30 days'
-- GROUP BY ms.id, ms.full_name, ms.email
-- HAVING AVG(qs.total_score) < 70
-- ORDER BY avg_score ASC;

-- ============================================================================
-- End of Schema
-- ============================================================================

COMMENT ON SCHEMA public IS 'LMS Integration Schema v1.0.0 - Moodle Quality Score Evaluation';
