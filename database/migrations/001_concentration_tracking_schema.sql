-- Migration: Concentration Tracking and Easy Problem Bypass Feature
-- Description: Tables for tracking student concentration and implementing easy problem bypass
-- Created: 2025-11-18

-- Core tables for students and problems
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    status VARCHAR(50) CHECK (status IN ('active', 'archived', 'generating')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
    content JSONB NOT NULL, -- Problem data (question, options, etc.)
    correct_answer JSONB NOT NULL,
    metadata JSONB, -- Additional problem metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts table with concentration metrics
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    attempt_number INTEGER NOT NULL DEFAULT 1,
    hint_used BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT NOW(),

    -- Concentration-related metrics
    interaction_count INTEGER DEFAULT 0, -- Number of interactions during attempt
    pause_count INTEGER DEFAULT 0, -- Number of pauses/inactivity periods
    focus_lost_count INTEGER DEFAULT 0 -- Number of times focus was lost (tab switch, etc.)
);

-- Concentration scores table
CREATE TABLE IF NOT EXISTS concentration_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,

    -- Concentration score (0.0 to 1.0)
    score DECIMAL(3, 2) NOT NULL CHECK (score >= 0 AND score <= 1),

    -- Component scores
    time_efficiency_score DECIMAL(3, 2), -- How efficiently time is used
    success_rate_score DECIMAL(3, 2), -- Recent success rate
    engagement_score DECIMAL(3, 2), -- Interaction frequency
    focus_score DECIMAL(3, 2), -- Focus maintenance

    -- Context
    recent_attempts_count INTEGER DEFAULT 0,
    recent_correct_count INTEGER DEFAULT 0,
    avg_time_spent_seconds INTEGER,

    calculated_at TIMESTAMP DEFAULT NOW()
);

-- Easy problem bypass events log
CREATE TABLE IF NOT EXISTS bypass_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    original_problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    bypass_problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,

    -- Trigger information
    trigger_reason VARCHAR(100) NOT NULL, -- 'low_concentration', 'multiple_failures', 'excessive_time'
    concentration_score DECIMAL(3, 2),
    original_difficulty INTEGER,
    bypass_difficulty INTEGER,

    -- Student action
    offered_at TIMESTAMP DEFAULT NOW(),
    accepted BOOLEAN,
    accepted_at TIMESTAMP,

    -- Outcome
    bypass_completed BOOLEAN DEFAULT FALSE,
    bypass_success BOOLEAN,
    returned_to_original BOOLEAN DEFAULT FALSE,

    CONSTRAINT difficulty_check CHECK (
        bypass_difficulty IS NULL OR
        bypass_difficulty < original_difficulty
    )
);

-- Concentration thresholds configuration per module
CREATE TABLE IF NOT EXISTS concentration_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Threshold settings
    bypass_trigger_score DECIMAL(3, 2) DEFAULT 0.40 CHECK (bypass_trigger_score >= 0 AND bypass_trigger_score <= 1),
    max_time_threshold_seconds INTEGER DEFAULT 300, -- 5 minutes
    max_failure_count INTEGER DEFAULT 3,
    min_engagement_score DECIMAL(3, 2) DEFAULT 0.30,

    -- Bypass behavior
    difficulty_reduction INTEGER DEFAULT 1 CHECK (difficulty_reduction >= 1 AND difficulty_reduction <= 4),
    auto_offer_bypass BOOLEAN DEFAULT TRUE,
    require_student_acceptance BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(module_id)
);

-- Insert default threshold for demonstration
INSERT INTO concentration_thresholds (module_id, bypass_trigger_score, max_time_threshold_seconds, max_failure_count)
SELECT id, 0.40, 300, 3 FROM modules
ON CONFLICT (module_id) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id, attempted_at DESC);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_module ON student_attempts(module_id, attempted_at DESC);
CREATE INDEX idx_concentration_scores_student ON concentration_scores(student_id, calculated_at DESC);
CREATE INDEX idx_concentration_scores_module ON concentration_scores(module_id);
CREATE INDEX idx_bypass_events_student ON bypass_events(student_id, offered_at DESC);
CREATE INDEX idx_bypass_events_module ON bypass_events(module_id);
CREATE INDEX idx_problems_module_difficulty ON problems(module_id, difficulty_level);

-- Views for easy querying
CREATE OR REPLACE VIEW student_concentration_status AS
SELECT
    cs.student_id,
    cs.module_id,
    s.name AS student_name,
    m.name AS module_name,
    cs.score AS current_concentration_score,
    cs.time_efficiency_score,
    cs.success_rate_score,
    cs.engagement_score,
    cs.focus_score,
    ct.bypass_trigger_score,
    CASE
        WHEN cs.score < ct.bypass_trigger_score THEN TRUE
        ELSE FALSE
    END AS should_offer_bypass,
    cs.recent_attempts_count,
    cs.recent_correct_count,
    cs.calculated_at
FROM concentration_scores cs
JOIN students s ON cs.student_id = s.id
JOIN modules m ON cs.module_id = m.id
LEFT JOIN concentration_thresholds ct ON cs.module_id = ct.module_id
WHERE cs.calculated_at = (
    SELECT MAX(calculated_at)
    FROM concentration_scores cs2
    WHERE cs2.student_id = cs.student_id
    AND cs2.module_id = cs.module_id
);

CREATE OR REPLACE VIEW bypass_statistics AS
SELECT
    be.module_id,
    m.name AS module_name,
    COUNT(*) AS total_bypass_offers,
    COUNT(*) FILTER (WHERE accepted = TRUE) AS total_accepted,
    COUNT(*) FILTER (WHERE accepted = FALSE) AS total_declined,
    ROUND(AVG(concentration_score), 2) AS avg_trigger_concentration,
    COUNT(*) FILTER (WHERE bypass_success = TRUE) AS successful_bypasses,
    COUNT(*) FILTER (WHERE returned_to_original = TRUE) AS returned_to_original_count
FROM bypass_events be
JOIN modules m ON be.module_id = m.id
GROUP BY be.module_id, m.name;

COMMENT ON TABLE student_attempts IS 'Records all student problem attempts with concentration metrics';
COMMENT ON TABLE concentration_scores IS 'Calculated concentration scores for students in modules';
COMMENT ON TABLE bypass_events IS 'Log of easy problem bypass offers and outcomes';
COMMENT ON TABLE concentration_thresholds IS 'Configuration for concentration bypass behavior per module';
COMMENT ON VIEW student_concentration_status IS 'Real-time view of student concentration status';
COMMENT ON VIEW bypass_statistics IS 'Aggregated statistics on bypass usage';
