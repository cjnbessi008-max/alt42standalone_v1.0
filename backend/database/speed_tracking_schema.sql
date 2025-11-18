-- =====================================================
-- Student Speed Tracking & Comparison Schema
-- =====================================================
-- Purpose: Track student learning speed and enable
-- comparison with cohort averages for LMS integration
-- =====================================================

-- Core student attempts table (already planned in PRD)
-- Extended with additional speed tracking fields
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    answer_data JSONB NOT NULL, -- Flexible storage for any answer format
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW(),

    -- Additional tracking fields
    hints_used INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 1,
    interaction_count INTEGER DEFAULT 0, -- Mouse clicks, keystrokes, etc.

    CONSTRAINT positive_time_spent CHECK (time_spent_seconds >= 0),
    CONSTRAINT positive_hints CHECK (hints_used >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_attempts_student
    ON student_attempts(student_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_attempts_module
    ON student_attempts(module_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_attempts_problem
    ON student_attempts(problem_id);


-- =====================================================
-- Aggregated Performance Metrics Table
-- =====================================================
-- Pre-calculated metrics for faster dashboard loading
CREATE TABLE IF NOT EXISTS student_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- Problem-solving metrics
    total_problems_attempted INTEGER DEFAULT 0,
    total_problems_correct INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2),

    -- Speed metrics
    average_time_per_problem_seconds DECIMAL(10,2),
    median_time_per_problem_seconds DECIMAL(10,2),
    fastest_problem_time_seconds INTEGER,
    slowest_problem_time_seconds INTEGER,

    -- Comparison metrics
    percentile_rank DECIMAL(5,2), -- 0-100, where student ranks in cohort
    speed_vs_average_ratio DECIMAL(5,2), -- 1.0 = average, <1 = faster, >1 = slower

    -- Efficiency metrics
    average_hints_per_problem DECIMAL(5,2),
    first_attempt_success_rate DECIMAL(5,2),

    -- Time tracking
    total_time_spent_seconds INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    last_calculated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id),
    CONSTRAINT positive_accuracy CHECK (accuracy_percentage BETWEEN 0 AND 100),
    CONSTRAINT valid_percentile CHECK (percentile_rank BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_performance_student
    ON student_performance_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_module
    ON student_performance_metrics(module_id);


-- =====================================================
-- Comparison Cohorts Table
-- =====================================================
-- Define groups of students for comparison
CREATE TABLE IF NOT EXISTS comparison_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_id UUID NOT NULL,

    -- Cohort criteria
    grade_level VARCHAR(50),
    academic_year VARCHAR(20),
    institution VARCHAR(255),

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_update BOOLEAN DEFAULT TRUE, -- Auto-calculate stats

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_module
    ON comparison_cohorts(module_id);


-- =====================================================
-- Cohort Memberships Table
-- =====================================================
-- Link students to cohorts
CREATE TABLE IF NOT EXISTS cohort_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    cohort_id UUID NOT NULL,

    joined_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(student_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_student
    ON cohort_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_membership_cohort
    ON cohort_memberships(cohort_id);


-- =====================================================
-- Cohort Statistics Table
-- =====================================================
-- Cached aggregate statistics for each cohort
CREATE TABLE IF NOT EXISTS cohort_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- Cohort size
    active_student_count INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,

    -- Average metrics
    avg_time_per_problem_seconds DECIMAL(10,2),
    median_time_per_problem_seconds DECIMAL(10,2),
    avg_accuracy_percentage DECIMAL(5,2),

    -- Distribution data (for percentile calculation)
    time_distribution JSONB, -- Array of time values for percentile calc
    accuracy_distribution JSONB,

    -- Speed ranges
    fastest_time_seconds INTEGER,
    slowest_time_seconds INTEGER,

    -- Update tracking
    last_calculated_at TIMESTAMP DEFAULT NOW(),
    calculation_version INTEGER DEFAULT 1,

    UNIQUE(cohort_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_stats_cohort
    ON cohort_statistics(cohort_id);


-- =====================================================
-- Speed Comparison History Table
-- =====================================================
-- Track student speed improvement over time
CREATE TABLE IF NOT EXISTS speed_comparison_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    cohort_id UUID,

    -- Snapshot data
    snapshot_date DATE NOT NULL,
    avg_speed_seconds DECIMAL(10,2),
    cohort_avg_speed_seconds DECIMAL(10,2),
    percentile_rank DECIMAL(5,2),
    speed_vs_average_ratio DECIMAL(5,2),

    -- Problems solved in this period
    problems_attempted_count INTEGER,
    accuracy_percentage DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_speed_history_student
    ON speed_comparison_history(student_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_speed_history_module
    ON speed_comparison_history(module_id, snapshot_date DESC);


-- =====================================================
-- LMS Integration Sync Log
-- =====================================================
-- Track data synchronization with external LMS
CREATE TABLE IF NOT EXISTS lms_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL, -- 'student_roster', 'grades', 'progress'
    lms_provider VARCHAR(100), -- 'canvas', 'moodle', 'kaist_lms', etc.

    -- Sync details
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    sync_status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- Error tracking
    error_message TEXT,
    error_details JSONB
);

CREATE INDEX IF NOT EXISTS idx_sync_log_type
    ON lms_sync_log(sync_type, started_at DESC);


-- =====================================================
-- Helper Functions
-- =====================================================

-- Calculate percentile rank for a student
CREATE OR REPLACE FUNCTION calculate_percentile_rank(
    p_student_id UUID,
    p_module_id UUID,
    p_cohort_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    student_avg_time DECIMAL;
    total_students INTEGER;
    faster_students INTEGER;
    percentile DECIMAL;
BEGIN
    -- Get student's average time
    SELECT average_time_per_problem_seconds INTO student_avg_time
    FROM student_performance_metrics
    WHERE student_id = p_student_id AND module_id = p_module_id;

    IF student_avg_time IS NULL THEN
        RETURN NULL;
    END IF;

    -- Count total students in cohort
    SELECT COUNT(DISTINCT spm.student_id) INTO total_students
    FROM student_performance_metrics spm
    JOIN cohort_memberships cm ON cm.student_id = spm.student_id
    WHERE cm.cohort_id = p_cohort_id
        AND spm.module_id = p_module_id
        AND cm.is_active = TRUE;

    IF total_students = 0 THEN
        RETURN NULL;
    END IF;

    -- Count students faster than current student
    SELECT COUNT(DISTINCT spm.student_id) INTO faster_students
    FROM student_performance_metrics spm
    JOIN cohort_memberships cm ON cm.student_id = spm.student_id
    WHERE cm.cohort_id = p_cohort_id
        AND spm.module_id = p_module_id
        AND spm.average_time_per_problem_seconds < student_avg_time
        AND cm.is_active = TRUE;

    -- Calculate percentile (lower time = higher percentile)
    percentile := 100.0 * (total_students - faster_students)::DECIMAL / total_students;

    RETURN ROUND(percentile, 2);
END;
$$ LANGUAGE plpgsql;


-- Update student performance metrics
CREATE OR REPLACE FUNCTION update_student_performance_metrics(
    p_student_id UUID,
    p_module_id UUID
) RETURNS VOID AS $$
DECLARE
    v_metrics RECORD;
BEGIN
    -- Calculate all metrics from attempts
    SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
        ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*), 2) as accuracy,
        ROUND(AVG(time_spent_seconds)::NUMERIC, 2) as avg_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent_seconds) as median_time,
        MIN(time_spent_seconds) as min_time,
        MAX(time_spent_seconds) as max_time,
        SUM(time_spent_seconds) as total_time,
        ROUND(AVG(hints_used)::NUMERIC, 2) as avg_hints,
        ROUND(100.0 * SUM(CASE WHEN attempts_count = 1 AND is_correct THEN 1 ELSE 0 END)::DECIMAL /
              COUNT(*), 2) as first_attempt_rate,
        MAX(attempted_at) as last_activity
    INTO v_metrics
    FROM student_attempts
    WHERE student_id = p_student_id AND module_id = p_module_id;

    -- Upsert metrics
    INSERT INTO student_performance_metrics (
        student_id, module_id,
        total_problems_attempted, total_problems_correct, accuracy_percentage,
        average_time_per_problem_seconds, median_time_per_problem_seconds,
        fastest_problem_time_seconds, slowest_problem_time_seconds,
        total_time_spent_seconds,
        average_hints_per_problem, first_attempt_success_rate,
        last_activity_at, last_calculated_at
    ) VALUES (
        p_student_id, p_module_id,
        v_metrics.total_attempts, v_metrics.correct_count, v_metrics.accuracy,
        v_metrics.avg_time, v_metrics.median_time,
        v_metrics.min_time, v_metrics.max_time,
        v_metrics.total_time,
        v_metrics.avg_hints, v_metrics.first_attempt_rate,
        v_metrics.last_activity, NOW()
    )
    ON CONFLICT (student_id, module_id) DO UPDATE SET
        total_problems_attempted = EXCLUDED.total_problems_attempted,
        total_problems_correct = EXCLUDED.total_problems_correct,
        accuracy_percentage = EXCLUDED.accuracy_percentage,
        average_time_per_problem_seconds = EXCLUDED.average_time_per_problem_seconds,
        median_time_per_problem_seconds = EXCLUDED.median_time_per_problem_seconds,
        fastest_problem_time_seconds = EXCLUDED.fastest_problem_time_seconds,
        slowest_problem_time_seconds = EXCLUDED.slowest_problem_time_seconds,
        total_time_spent_seconds = EXCLUDED.total_time_spent_seconds,
        average_hints_per_problem = EXCLUDED.average_hints_per_problem,
        first_attempt_success_rate = EXCLUDED.first_attempt_success_rate,
        last_activity_at = EXCLUDED.last_activity_at,
        last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Create sample cohort
INSERT INTO comparison_cohorts (id, name, description, module_id, grade_level, academic_year)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '3rd Grade Math 2024',
    'Third grade mathematics cohort for 2024 academic year',
    '00000000-0000-0000-0000-000000000100', -- sample module_id
    '3rd Grade',
    '2024'
) ON CONFLICT DO NOTHING;


-- =====================================================
-- Maintenance Queries
-- =====================================================

-- Recalculate all metrics for a module
COMMENT ON FUNCTION update_student_performance_metrics IS
'Call this function after student attempts are recorded to update performance metrics';

-- Example usage:
-- SELECT update_student_performance_metrics('student-uuid', 'module-uuid');
-- SELECT calculate_percentile_rank('student-uuid', 'module-uuid', 'cohort-uuid');
