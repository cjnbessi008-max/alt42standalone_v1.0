-- ============================================================================
-- Database Schema for Key Condition Highlighting System
-- ============================================================================
-- Version: 1.0.0
-- Database: PostgreSQL 15+
-- Purpose: Store problem data and key condition highlight metadata
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Problems table: Store mathematical problems
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_text TEXT NOT NULL,
    problem_type VARCHAR(50) NOT NULL CHECK (problem_type IN (
        'probability',
        'combination',
        'permutation',
        'statistics',
        'general_math'
    )),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    grade_level VARCHAR(20),
    language VARCHAR(10) DEFAULT 'ko' CHECK (language IN ('ko', 'en')),

    -- LMS Integration (for future Moodle/LMS connection)
    lms_source VARCHAR(50),  -- 'moodle', 'canvas', 'standalone', etc.
    lms_problem_id VARCHAR(100),  -- External LMS problem ID

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,  -- Reference to teacher/user (future)

    -- Indexing
    CONSTRAINT unique_lms_problem UNIQUE (lms_source, lms_problem_id)
);

-- Key Conditions table: Store extracted key conditions
CREATE TABLE IF NOT EXISTS key_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    -- Condition content
    condition_text TEXT NOT NULL,
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,

    -- Classification
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN (
        'independence',
        'constraint',
        'assumption',
        'requirement',
        'exception',
        'sample_space',
        'event',
        'probability'
    )),
    category VARCHAR(50) NOT NULL,

    -- Importance & Display
    importance_level VARCHAR(20) NOT NULL CHECK (importance_level IN (
        'critical',
        'high',
        'medium',
        'low'
    )),
    display_order INTEGER,

    -- Explanation
    explanation TEXT,

    -- Auto-generated or manually reviewed
    is_auto_generated BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,  -- Reference to teacher who verified
    verified_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure positions are valid
    CONSTRAINT valid_position CHECK (start_position >= 0 AND end_position > start_position)
);

-- Highlight Styles: Define visual styling for different condition types
CREATE TABLE IF NOT EXISTS highlight_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition_type VARCHAR(50) NOT NULL UNIQUE,

    -- Visual styling (for frontend rendering)
    background_color VARCHAR(20),  -- e.g., '#FFF3CD'
    text_color VARCHAR(20),        -- e.g., '#856404'
    border_color VARCHAR(20),
    font_weight VARCHAR(20) DEFAULT 'normal',  -- 'normal', 'bold'
    text_decoration VARCHAR(50),   -- 'underline', 'none'

    -- Icon (optional)
    icon_name VARCHAR(50),  -- e.g., 'alert', 'info', 'star'

    -- Accessibility
    aria_label VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Interactions: Track how students interact with highlights
CREATE TABLE IF NOT EXISTS student_highlight_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,  -- Reference to student (future)
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    condition_id UUID NOT NULL REFERENCES key_conditions(id) ON DELETE CASCADE,

    -- Interaction details
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'hover',
        'click',
        'tap',
        'tooltip_open',
        'tooltip_close'
    )),
    interaction_timestamp TIMESTAMP DEFAULT NOW(),

    -- Context
    time_spent_seconds INTEGER,
    device_type VARCHAR(20),  -- 'desktop', 'tablet', 'mobile'

    -- Metadata
    session_id VARCHAR(100)
);

-- Problem Analytics: Aggregate statistics for problems
CREATE TABLE IF NOT EXISTS problem_analytics (
    problem_id UUID PRIMARY KEY REFERENCES problems(id) ON DELETE CASCADE,

    -- Usage statistics
    total_views INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,

    -- Highlight effectiveness
    avg_highlight_interactions DECIMAL(5, 2),
    most_clicked_condition_id UUID REFERENCES key_conditions(id),

    -- Performance
    avg_time_to_solve_seconds INTEGER,
    success_rate DECIMAL(5, 2),

    -- Metadata
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Problems
CREATE INDEX idx_problems_type ON problems(problem_type);
CREATE INDEX idx_problems_difficulty ON problems(difficulty_level);
CREATE INDEX idx_problems_lms_source ON problems(lms_source);
CREATE INDEX idx_problems_created_at ON problems(created_at DESC);

-- Key Conditions
CREATE INDEX idx_conditions_problem ON key_conditions(problem_id);
CREATE INDEX idx_conditions_type ON key_conditions(condition_type);
CREATE INDEX idx_conditions_importance ON key_conditions(importance_level);
CREATE INDEX idx_conditions_display_order ON key_conditions(problem_id, display_order);

-- Student Interactions
CREATE INDEX idx_interactions_student ON student_highlight_interactions(student_id);
CREATE INDEX idx_interactions_problem ON student_highlight_interactions(problem_id);
CREATE INDEX idx_interactions_condition ON student_highlight_interactions(condition_id);
CREATE INDEX idx_interactions_timestamp ON student_highlight_interactions(interaction_timestamp DESC);

-- ============================================================================
-- Triggers for Automatic Updates
-- ============================================================================

-- Update updated_at timestamp on problems
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlight_styles_updated_at
    BEFORE UPDATE ON highlight_styles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Default Highlight Styles
-- ============================================================================

INSERT INTO highlight_styles (condition_type, background_color, text_color, border_color, font_weight, icon_name, aria_label)
VALUES
    ('independence', '#E3F2FD', '#0D47A1', '#1976D2', 'bold', 'link-off', 'Independent events condition'),
    ('constraint', '#FFF3CD', '#856404', '#FFC107', 'bold', 'alert-triangle', 'Constraint condition'),
    ('assumption', '#E8F5E9', '#2E7D32', '#4CAF50', 'normal', 'info', 'Assumption or given condition'),
    ('requirement', '#F3E5F5', '#6A1B9A', '#9C27B0', 'bold', 'check-circle', 'Requirement condition'),
    ('exception', '#FFEBEE', '#C62828', '#EF5350', 'bold', 'alert-circle', 'Exception condition'),
    ('sample_space', '#FFF8E1', '#F57F17', '#FFEB3B', 'normal', 'grid', 'Sample space definition'),
    ('event', '#E0F2F1', '#00695C', '#26A69A', 'normal', 'target', 'Event definition'),
    ('probability', '#FCE4EC', '#AD1457', '#EC407A', 'bold', 'percent', 'Probability value or calculation')
ON CONFLICT (condition_type) DO NOTHING;

-- ============================================================================
-- Useful Views
-- ============================================================================

-- View: Problems with condition count
CREATE OR REPLACE VIEW problems_with_conditions AS
SELECT
    p.*,
    COUNT(kc.id) AS condition_count,
    COUNT(CASE WHEN kc.importance_level = 'critical' THEN 1 END) AS critical_conditions,
    COUNT(CASE WHEN kc.importance_level = 'high' THEN 1 END) AS high_conditions
FROM problems p
LEFT JOIN key_conditions kc ON p.id = kc.problem_id
GROUP BY p.id;

-- View: Most interacted conditions
CREATE OR REPLACE VIEW top_interacted_conditions AS
SELECT
    kc.id,
    kc.problem_id,
    kc.condition_text,
    kc.condition_type,
    COUNT(shi.id) AS interaction_count,
    COUNT(DISTINCT shi.student_id) AS unique_students
FROM key_conditions kc
LEFT JOIN student_highlight_interactions shi ON kc.id = shi.condition_id
GROUP BY kc.id
ORDER BY interaction_count DESC;

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert sample problem
INSERT INTO problems (problem_text, problem_type, difficulty_level, grade_level, language)
VALUES (
    '주머니에 빨간 공 3개와 파란 공 5개가 들어있다. 이 주머니에서 임의로 2개의 공을 동시에 꺼낼 때, 두 공이 모두 같은 색일 확률을 구하시오. 단, 각 공을 선택할 확률은 모두 같다.',
    'probability',
    3,
    'middle_school',
    'ko'
) RETURNING id;

-- Note: Use the returned ID to insert corresponding key_conditions

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE problems IS 'Stores mathematical problems from various sources';
COMMENT ON TABLE key_conditions IS 'Stores extracted key conditions with highlight metadata';
COMMENT ON TABLE highlight_styles IS 'Defines visual styling for different condition types';
COMMENT ON TABLE student_highlight_interactions IS 'Tracks student interactions with highlights for analytics';
COMMENT ON TABLE problem_analytics IS 'Aggregate statistics and analytics for problems';

COMMENT ON COLUMN problems.lms_source IS 'External LMS source (moodle, canvas, etc.) for integration';
COMMENT ON COLUMN key_conditions.is_auto_generated IS 'True if extracted automatically, false if manually created';
COMMENT ON COLUMN key_conditions.is_verified IS 'True if reviewed and approved by a teacher';
