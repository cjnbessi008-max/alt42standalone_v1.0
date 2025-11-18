-- Migration: Create Calming Message Tables
-- Description: Database schema for calming message feature
-- Date: 2025-11-18

-- ============================================================
-- Table 1: module_calming_config
-- Purpose: Configuration for calming messages per module
-- ============================================================
CREATE TABLE IF NOT EXISTS module_calming_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    difficulty_threshold INTEGER DEFAULT 4 CHECK (difficulty_threshold BETWEEN 1 AND 5),

    -- JSON structure: { "4": "message_text", "5": "message_text" }
    -- Example: {"4": "이 문제는 어렵지만 당신은 할 수 있어요!", "5": "천천히 생각해보세요. 당신을 응원합니다!"}
    message_templates JSONB DEFAULT '{"4": "You can do this! Take a deep breath and try step by step.", "5": "This is challenging, but you have the skills. Think carefully and persist!"}',

    audio_enabled BOOLEAN DEFAULT TRUE,
    text_enabled BOOLEAN DEFAULT TRUE,
    animation_type VARCHAR(50) DEFAULT 'breathing_circle', -- breathing_circle, pulse, wave, etc.
    timeout_seconds INTEGER DEFAULT 10, -- How long to show before auto-advance

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_calming_config_module_id ON module_calming_config(module_id);

-- ============================================================
-- Table 2: calming_message_interactions
-- Purpose: Audit log of when messages are shown (for analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS calming_message_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    student_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    message_type VARCHAR(50), -- 'audio', 'visual', 'combined'

    shown_at TIMESTAMP DEFAULT NOW(),
    duration_viewed_seconds FLOAT,
    student_continued_immediately BOOLEAN DEFAULT FALSE,

    -- Student feedback (optional): did this help?
    -- true=helpful, false=not helpful, NULL=no feedback
    student_feedback BOOLEAN NULL,
    feedback_at TIMESTAMP NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_calming_interactions_module_student
    ON calming_message_interactions(module_id, student_id);
CREATE INDEX IF NOT EXISTS idx_calming_interactions_shown_at
    ON calming_message_interactions(shown_at);
CREATE INDEX IF NOT EXISTS idx_calming_interactions_difficulty
    ON calming_message_interactions(difficulty_level);

-- ============================================================
-- Table 3: problem_metadata (if not exists)
-- Purpose: Store problem difficulty levels
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL UNIQUE,
    module_id UUID NOT NULL,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    requires_calming_support BOOLEAN DEFAULT FALSE,

    -- Additional metadata
    topic_tags TEXT[] DEFAULT '{}',
    estimated_time_minutes INTEGER,
    prerequisite_concepts TEXT[] DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problem_metadata_module_id ON problem_metadata(module_id);
CREATE INDEX IF NOT EXISTS idx_problem_metadata_difficulty ON problem_metadata(difficulty_level);

-- ============================================================
-- Trigger: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_module_calming_config_updated_at BEFORE UPDATE
    ON module_calming_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_metadata_updated_at BEFORE UPDATE
    ON problem_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed Data: Default configuration for testing
-- ============================================================
-- Insert a sample module configuration (for testing purposes)
-- Note: Replace with actual module_id when deploying
INSERT INTO module_calming_config (
    module_id,
    is_enabled,
    difficulty_threshold,
    message_templates,
    audio_enabled,
    text_enabled,
    animation_type,
    timeout_seconds
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::UUID,
    TRUE,
    4,
    '{"4": "이 문제는 어렵지만 당신은 할 수 있어요! 깊게 숨을 쉬고 한 단계씩 시도해보세요.", "5": "이것은 도전적이지만, 당신에게는 실력이 있습니다. 신중하게 생각하고 계속 노력하세요!"}'::JSONB,
    TRUE,
    TRUE,
    'breathing_circle',
    10
) ON CONFLICT (module_id) DO NOTHING;

-- Sample problem metadata
INSERT INTO problem_metadata (
    problem_id,
    module_id,
    difficulty_level,
    requires_calming_support,
    topic_tags,
    estimated_time_minutes
) VALUES
(
    'b0000000-0000-0000-0000-000000000001'::UUID,
    'a0000000-0000-0000-0000-000000000001'::UUID,
    4,
    TRUE,
    ARRAY['fractions', 'division', 'word-problems'],
    15
),
(
    'b0000000-0000-0000-0000-000000000002'::UUID,
    'a0000000-0000-0000-0000-000000000001'::UUID,
    5,
    TRUE,
    ARRAY['fractions', 'multiplication', 'complex'],
    20
) ON CONFLICT (problem_id) DO NOTHING;

-- ============================================================
-- Verification Queries (for testing)
-- ============================================================
-- Uncomment to verify installation:
-- SELECT * FROM module_calming_config;
-- SELECT * FROM calming_message_interactions;
-- SELECT * FROM problem_metadata;
