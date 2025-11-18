-- Migration: Create Thinking Points Tracking Tables
-- Version: 1.0.0
-- Date: 2025-11-18
-- Description: Adds comprehensive thinking points tracking for student learning analytics

-- ============================================================================
-- 1. THINKING POINTS TABLE
-- ============================================================================
-- Stores granular interaction data for each student's problem-solving process

CREATE TABLE IF NOT EXISTS thinking_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL, -- References dynamically generated problem tables
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Section identification
    section_identifier VARCHAR(100) NOT NULL, -- e.g., "numerator_input", "step_2", "visualization_area"
    section_type VARCHAR(50) NOT NULL CHECK (section_type IN (
        'problem_level',      -- Overall problem time
        'step_level',         -- Time per step in multi-step problems
        'concept_level',      -- Time per concept (e.g., numerator vs denominator)
        'interaction_level'   -- Time per UI element interaction
    )),

    -- Time tracking metrics
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    active_time_seconds INTEGER NOT NULL DEFAULT 0, -- Time with actual interactions
    passive_time_seconds INTEGER NOT NULL DEFAULT 0, -- Time without interactions (reading, thinking)

    -- Interaction metrics
    interaction_count INTEGER NOT NULL DEFAULT 0,
    focus_count INTEGER NOT NULL DEFAULT 0,
    blur_count INTEGER NOT NULL DEFAULT 0,

    -- Pause analysis
    pause_count INTEGER NOT NULL DEFAULT 0,
    longest_pause_seconds INTEGER NOT NULL DEFAULT 0,
    avg_pause_seconds FLOAT DEFAULT 0,

    -- Pattern classification
    thinking_pattern VARCHAR(50) CHECK (thinking_pattern IN (
        'productive',  -- Steady progress, normal interaction pace
        'struggle',    -- Long pauses, multiple attempts, slow progress
        'confusion',   -- Rapid switching, help-seeking, erratic behavior
        'mastery'      -- Quick, confident, accurate interactions
    )),

    -- Behavioral indicators
    backtrack_count INTEGER NOT NULL DEFAULT 0, -- Times student went back to previous sections
    help_requested_count INTEGER NOT NULL DEFAULT 0,
    hint_used_count INTEGER NOT NULL DEFAULT 0,

    -- Detailed event log
    events JSONB DEFAULT '[]'::jsonb, -- Array of interaction events with timestamps

    -- Metadata
    first_interaction_at TIMESTAMP,
    last_interaction_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_thinking_points_student ON thinking_points(student_id);
CREATE INDEX idx_thinking_points_problem ON thinking_points(problem_id);
CREATE INDEX idx_thinking_points_module ON thinking_points(module_id);
CREATE INDEX idx_thinking_points_section ON thinking_points(section_identifier);
CREATE INDEX idx_thinking_points_pattern ON thinking_points(thinking_pattern);
CREATE INDEX idx_thinking_points_created_at ON thinking_points(created_at);

-- Composite index for common queries
CREATE INDEX idx_thinking_points_student_problem ON thinking_points(student_id, problem_id);
CREATE INDEX idx_thinking_points_module_section ON thinking_points(module_id, section_identifier);

-- ============================================================================
-- 2. THINKING POINT SUMMARIES TABLE
-- ============================================================================
-- Aggregated analytics across all students for each problem section

CREATE TABLE IF NOT EXISTS thinking_point_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    problem_id UUID NOT NULL,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    section_identifier VARCHAR(100) NOT NULL,

    -- Aggregated metrics
    total_students INTEGER NOT NULL DEFAULT 0,
    total_interactions INTEGER NOT NULL DEFAULT 0,

    -- Time statistics
    avg_time_spent_seconds FLOAT NOT NULL DEFAULT 0,
    median_time_spent_seconds FLOAT NOT NULL DEFAULT 0,
    min_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    max_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    stddev_time_spent_seconds FLOAT DEFAULT 0,

    -- Time distribution percentiles
    p25_time_seconds FLOAT DEFAULT 0, -- 25th percentile
    p75_time_seconds FLOAT DEFAULT 0, -- 75th percentile
    p90_time_seconds FLOAT DEFAULT 0, -- 90th percentile

    -- Pattern distribution
    productive_count INTEGER NOT NULL DEFAULT 0,
    struggle_count INTEGER NOT NULL DEFAULT 0,
    confusion_count INTEGER NOT NULL DEFAULT 0,
    mastery_count INTEGER NOT NULL DEFAULT 0,

    -- Derived rates
    struggle_rate FLOAT NOT NULL DEFAULT 0, -- Percentage showing struggle
    confusion_rate FLOAT NOT NULL DEFAULT 0,
    mastery_rate FLOAT NOT NULL DEFAULT 0,

    -- Common pattern (mode)
    common_pattern VARCHAR(50),

    -- Attention flags
    needs_attention BOOLEAN DEFAULT FALSE, -- Flagged if struggle_rate > 0.5 or avg_time > 2*median
    difficulty_score FLOAT DEFAULT 0, -- Calculated difficulty based on time and struggle rate

    -- Insights
    recommendations TEXT, -- Auto-generated recommendations for teachers

    -- Metadata
    last_calculated_at TIMESTAMP DEFAULT NOW(),
    calculation_version VARCHAR(20) DEFAULT '1.0.0',

    UNIQUE(problem_id, section_identifier)
);

-- Indexes
CREATE INDEX idx_thinking_summaries_problem ON thinking_point_summaries(problem_id);
CREATE INDEX idx_thinking_summaries_module ON thinking_point_summaries(module_id);
CREATE INDEX idx_thinking_summaries_section ON thinking_point_summaries(section_identifier);
CREATE INDEX idx_thinking_summaries_attention ON thinking_point_summaries(needs_attention)
    WHERE needs_attention = TRUE;
CREATE INDEX idx_thinking_summaries_difficulty ON thinking_point_summaries(difficulty_score);

-- ============================================================================
-- 3. STUDENT THINKING INSIGHTS TABLE
-- ============================================================================
-- Personalized insights and patterns for individual students

CREATE TABLE IF NOT EXISTS student_thinking_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Overall patterns
    dominant_pattern VARCHAR(50), -- Most common thinking pattern for this student
    avg_problem_time_seconds FLOAT DEFAULT 0,
    total_problems_attempted INTEGER DEFAULT 0,

    -- Struggle areas
    struggle_sections JSONB DEFAULT '[]'::jsonb, -- Array of section_identifiers where student struggles
    mastery_sections JSONB DEFAULT '[]'::jsonb,  -- Array of sections where student shows mastery

    -- Behavioral traits
    tends_to_seek_help BOOLEAN DEFAULT FALSE,
    uses_hints_frequently BOOLEAN DEFAULT FALSE,
    backtracks_often BOOLEAN DEFAULT FALSE,

    -- Time management
    avg_pause_duration_seconds FLOAT DEFAULT 0,
    works_methodically BOOLEAN DEFAULT FALSE, -- Consistent pace vs. erratic

    -- Recommendations
    suggested_review_topics TEXT[],
    needs_support BOOLEAN DEFAULT FALSE,
    support_priority VARCHAR(20) CHECK (support_priority IN ('low', 'medium', 'high', 'critical')),

    -- Metadata
    last_updated_at TIMESTAMP DEFAULT NOW(),
    insights_version VARCHAR(20) DEFAULT '1.0.0',

    UNIQUE(student_id, module_id)
);

-- Indexes
CREATE INDEX idx_student_insights_student ON student_thinking_insights(student_id);
CREATE INDEX idx_student_insights_module ON student_thinking_insights(module_id);
CREATE INDEX idx_student_insights_support ON student_thinking_insights(needs_support)
    WHERE needs_support = TRUE;
CREATE INDEX idx_student_insights_priority ON student_thinking_insights(support_priority);

-- ============================================================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for thinking_points
CREATE TRIGGER update_thinking_points_updated_at
    BEFORE UPDATE ON thinking_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate thinking pattern based on metrics
CREATE OR REPLACE FUNCTION classify_thinking_pattern(
    p_time_spent INTEGER,
    p_pause_count INTEGER,
    p_longest_pause INTEGER,
    p_backtrack_count INTEGER,
    p_help_count INTEGER,
    p_interaction_count INTEGER
)
RETURNS VARCHAR(50) AS $$
DECLARE
    pattern VARCHAR(50);
    avg_interaction_pace FLOAT;
BEGIN
    -- Calculate interaction pace (interactions per minute)
    IF p_time_spent > 0 THEN
        avg_interaction_pace := (p_interaction_count::FLOAT / p_time_spent::FLOAT) * 60;
    ELSE
        avg_interaction_pace := 0;
    END IF;

    -- Classification logic
    IF p_help_count > 2 OR (p_backtrack_count > 3 AND p_longest_pause > 30) THEN
        pattern := 'confusion';
    ELSIF p_longest_pause > 45 OR p_pause_count > 5 THEN
        pattern := 'struggle';
    ELSIF avg_interaction_pace > 3 AND p_pause_count < 3 AND p_backtrack_count = 0 THEN
        pattern := 'mastery';
    ELSE
        pattern := 'productive';
    END IF;

    RETURN pattern;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to recalculate summary statistics for a problem section
CREATE OR REPLACE FUNCTION recalculate_thinking_point_summary(
    p_problem_id UUID,
    p_section_identifier VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
    v_module_id UUID;
    v_stats RECORD;
BEGIN
    -- Get module_id from first thinking point
    SELECT module_id INTO v_module_id
    FROM thinking_points
    WHERE problem_id = p_problem_id AND section_identifier = p_section_identifier
    LIMIT 1;

    -- Calculate statistics
    SELECT
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_interactions,
        AVG(time_spent_seconds) as avg_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent_seconds) as median_time,
        MIN(time_spent_seconds) as min_time,
        MAX(time_spent_seconds) as max_time,
        STDDEV(time_spent_seconds) as stddev_time,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY time_spent_seconds) as p25_time,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY time_spent_seconds) as p75_time,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY time_spent_seconds) as p90_time,
        SUM(CASE WHEN thinking_pattern = 'productive' THEN 1 ELSE 0 END) as productive_cnt,
        SUM(CASE WHEN thinking_pattern = 'struggle' THEN 1 ELSE 0 END) as struggle_cnt,
        SUM(CASE WHEN thinking_pattern = 'confusion' THEN 1 ELSE 0 END) as confusion_cnt,
        SUM(CASE WHEN thinking_pattern = 'mastery' THEN 1 ELSE 0 END) as mastery_cnt
    INTO v_stats
    FROM thinking_points
    WHERE problem_id = p_problem_id AND section_identifier = p_section_identifier;

    -- Insert or update summary
    INSERT INTO thinking_point_summaries (
        problem_id,
        module_id,
        section_identifier,
        total_students,
        total_interactions,
        avg_time_spent_seconds,
        median_time_spent_seconds,
        min_time_spent_seconds,
        max_time_spent_seconds,
        stddev_time_spent_seconds,
        p25_time_seconds,
        p75_time_seconds,
        p90_time_seconds,
        productive_count,
        struggle_count,
        confusion_count,
        mastery_count,
        struggle_rate,
        confusion_rate,
        mastery_rate,
        needs_attention,
        difficulty_score,
        last_calculated_at
    )
    VALUES (
        p_problem_id,
        v_module_id,
        p_section_identifier,
        v_stats.total_students,
        v_stats.total_interactions,
        v_stats.avg_time,
        v_stats.median_time,
        v_stats.min_time,
        v_stats.max_time,
        v_stats.stddev_time,
        v_stats.p25_time,
        v_stats.p75_time,
        v_stats.p90_time,
        v_stats.productive_cnt,
        v_stats.struggle_cnt,
        v_stats.confusion_cnt,
        v_stats.mastery_cnt,
        CASE WHEN v_stats.total_students > 0 THEN v_stats.struggle_cnt::FLOAT / v_stats.total_students ELSE 0 END,
        CASE WHEN v_stats.total_students > 0 THEN v_stats.confusion_cnt::FLOAT / v_stats.total_students ELSE 0 END,
        CASE WHEN v_stats.total_students > 0 THEN v_stats.mastery_cnt::FLOAT / v_stats.total_students ELSE 0 END,
        (v_stats.struggle_cnt::FLOAT / NULLIF(v_stats.total_students, 0)) > 0.5 OR
        v_stats.avg_time > (2 * v_stats.median_time),
        -- Difficulty score: weighted combination of time and struggle rate
        (v_stats.avg_time / 60.0 * 0.6) + ((v_stats.struggle_cnt::FLOAT / NULLIF(v_stats.total_students, 0)) * 40),
        NOW()
    )
    ON CONFLICT (problem_id, section_identifier)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        total_interactions = EXCLUDED.total_interactions,
        avg_time_spent_seconds = EXCLUDED.avg_time_spent_seconds,
        median_time_spent_seconds = EXCLUDED.median_time_spent_seconds,
        min_time_spent_seconds = EXCLUDED.min_time_spent_seconds,
        max_time_spent_seconds = EXCLUDED.max_time_spent_seconds,
        stddev_time_spent_seconds = EXCLUDED.stddev_time_spent_seconds,
        p25_time_seconds = EXCLUDED.p25_time_seconds,
        p75_time_seconds = EXCLUDED.p75_time_seconds,
        p90_time_seconds = EXCLUDED.p90_time_seconds,
        productive_count = EXCLUDED.productive_count,
        struggle_count = EXCLUDED.struggle_count,
        confusion_count = EXCLUDED.confusion_count,
        mastery_count = EXCLUDED.mastery_count,
        struggle_rate = EXCLUDED.struggle_rate,
        confusion_rate = EXCLUDED.confusion_rate,
        mastery_rate = EXCLUDED.mastery_rate,
        needs_attention = EXCLUDED.needs_attention,
        difficulty_score = EXCLUDED.difficulty_score,
        last_calculated_at = EXCLUDED.last_calculated_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. INITIAL DATA / COMMENTS
-- ============================================================================

COMMENT ON TABLE thinking_points IS 'Tracks granular student interaction data for learning analytics';
COMMENT ON TABLE thinking_point_summaries IS 'Aggregated thinking point statistics across all students';
COMMENT ON TABLE student_thinking_insights IS 'Personalized learning insights for individual students';

COMMENT ON COLUMN thinking_points.section_identifier IS 'Unique identifier for problem section (e.g., "numerator_input", "step_2")';
COMMENT ON COLUMN thinking_points.thinking_pattern IS 'Classified pattern: productive, struggle, confusion, or mastery';
COMMENT ON COLUMN thinking_points.events IS 'JSONB array of detailed interaction events with timestamps';

COMMENT ON COLUMN thinking_point_summaries.difficulty_score IS 'Calculated difficulty: (avg_time/60 * 0.6) + (struggle_rate * 40)';
COMMENT ON COLUMN thinking_point_summaries.needs_attention IS 'Auto-flagged when struggle_rate > 0.5 or avg_time > 2*median';
