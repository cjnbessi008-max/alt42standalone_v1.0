-- ============================================================================
-- KAIST Touch Math Academy - Emotion Refresh Routine Schema
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-18
-- Description: Database schema for emotion tracking and refresh routine system
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: emotion_check_ins
-- Description: Records student emotion check-ins during learning sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS emotion_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID,
    emotion_type VARCHAR(50) NOT NULL,
    emotion_score INTEGER NOT NULL CHECK (emotion_score BETWEEN 1 AND 10),
    context_note TEXT,
    session_duration_minutes INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_emotion_student_timestamp ON emotion_check_ins(student_id, timestamp DESC);
CREATE INDEX idx_emotion_module_timestamp ON emotion_check_ins(module_id, timestamp DESC);
CREATE INDEX idx_emotion_type ON emotion_check_ins(emotion_type);
CREATE INDEX idx_emotion_score ON emotion_check_ins(emotion_score);

-- Comments
COMMENT ON TABLE emotion_check_ins IS 'Stores student emotion check-ins during learning sessions';
COMMENT ON COLUMN emotion_check_ins.emotion_type IS 'Type of emotion: happy, stressed, tired, bored, frustrated, focused, anxious';
COMMENT ON COLUMN emotion_check_ins.emotion_score IS 'Intensity of emotion on scale 1-10';
COMMENT ON COLUMN emotion_check_ins.context_note IS 'Optional student note about their emotional state';
COMMENT ON COLUMN emotion_check_ins.session_duration_minutes IS 'How long student has been learning when check-in occurred';

-- ============================================================================
-- TABLE: refresh_activities
-- Description: AI-generated refresh activities catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(100) NOT NULL,
    target_emotion VARCHAR(50),
    duration_seconds INTEGER DEFAULT 60 CHECK (duration_seconds > 0),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    min_grade_level INTEGER,
    max_grade_level INTEGER,
    ai_generated_content JSONB NOT NULL,
    -- JSONB structure:
    -- {
    --   "title": "차분한 호흡",
    --   "description": "4-7-8 호흡법으로 마음을 안정시켜요",
    --   "steps": [
    --     {
    --       "time_seconds": 0,
    --       "instruction": "편안하게 앉으세요",
    --       "duration_seconds": 4,
    --       "visual_cue": "sitting|inhale|exhale|hold|stretch|relax|focus"
    --     }
    --   ],
    --   "background_music": "calm-ambient.mp3",
    --   "visual_guide": "breathing-animation.json",
    --   "expected_outcome": "마음이 차분해지고 집중력이 높아질 거예요",
    --   "encouragement": "잘했어요! 언제든지 필요할 때 다시 해보세요"
    -- }

    -- Statistics
    usage_count INTEGER DEFAULT 0,
    avg_effectiveness_score FLOAT,
    positive_rating_count INTEGER DEFAULT 0,
    negative_rating_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_activity_type ON refresh_activities(activity_type);
CREATE INDEX idx_activity_target_emotion ON refresh_activities(target_emotion);
CREATE INDEX idx_activity_grade_level ON refresh_activities(min_grade_level, max_grade_level);
CREATE INDEX idx_activity_effectiveness ON refresh_activities(avg_effectiveness_score DESC NULLS LAST);
CREATE INDEX idx_activity_usage ON refresh_activities(usage_count DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_activity_content ON refresh_activities USING GIN (ai_generated_content);

-- Comments
COMMENT ON TABLE refresh_activities IS 'Catalog of AI-generated refresh activities';
COMMENT ON COLUMN refresh_activities.activity_type IS 'breathing, stretch, mindfulness, energy, etc.';
COMMENT ON COLUMN refresh_activities.ai_generated_content IS 'Full activity content in JSON format including steps and metadata';
COMMENT ON COLUMN refresh_activities.avg_effectiveness_score IS 'Average improvement score from student sessions';

-- ============================================================================
-- TABLE: student_refresh_sessions
-- Description: Individual student refresh routine sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    activity_id UUID NOT NULL,
    module_id UUID,

    -- Pre-activity emotion state
    pre_emotion_type VARCHAR(50) NOT NULL,
    pre_emotion_score INTEGER NOT NULL CHECK (pre_emotion_score BETWEEN 1 AND 10),

    -- Post-activity emotion state
    post_emotion_type VARCHAR(50),
    post_emotion_score INTEGER CHECK (post_emotion_score BETWEEN 1 AND 10),

    -- Session metrics
    engagement_level INTEGER CHECK (engagement_level BETWEEN 1 AND 5),
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    actual_duration_seconds INTEGER,

    -- Student feedback
    student_rating INTEGER CHECK (student_rating IN (-1, 0, 1)), -- 👎 (-1), neutral (0), 👍 (1)
    feedback_note TEXT,

    -- Timestamps
    session_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_session_student ON student_refresh_sessions(student_id, session_timestamp DESC);
CREATE INDEX idx_session_activity ON student_refresh_sessions(activity_id);
CREATE INDEX idx_session_module ON student_refresh_sessions(module_id, session_timestamp DESC);
CREATE INDEX idx_session_rating ON student_refresh_sessions(activity_id, student_rating) WHERE student_rating IS NOT NULL;
CREATE INDEX idx_session_completed ON student_refresh_sessions(completed, session_timestamp DESC);

-- Comments
COMMENT ON TABLE student_refresh_sessions IS 'Individual student refresh routine sessions with pre/post emotional state';
COMMENT ON COLUMN student_refresh_sessions.engagement_level IS 'How engaged the student was during the activity (1-5)';
COMMENT ON COLUMN student_refresh_sessions.completion_percentage IS 'Percentage of activity completed (0-100)';
COMMENT ON COLUMN student_refresh_sessions.student_rating IS 'Thumbs up (+1), neutral (0), or thumbs down (-1)';

-- ============================================================================
-- TABLE: emotion_analytics_cache
-- Description: Pre-computed analytics for teacher dashboard (updated daily)
-- ============================================================================
CREATE TABLE IF NOT EXISTS emotion_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    date DATE NOT NULL,

    -- Aggregated metrics
    total_students INTEGER DEFAULT 0,
    total_check_ins INTEGER DEFAULT 0,
    avg_emotion_score FLOAT,
    emotion_distribution JSONB,
    -- {"happy": 15, "stressed": 8, "tired": 5, "bored": 3, "frustrated": 2, "focused": 10, "anxious": 4}

    -- Refresh routine metrics
    total_refresh_sessions INTEGER DEFAULT 0,
    completed_refresh_sessions INTEGER DEFAULT 0,
    refresh_participation_rate FLOAT,
    avg_improvement_score FLOAT,
    avg_session_duration_seconds INTEGER,

    -- Activity effectiveness
    top_activities JSONB,
    -- [{"activity_id": "uuid", "title": "차분한 호흡", "usage_count": 12, "avg_improvement": 3.2}]

    -- Correlation data
    correlation_with_performance FLOAT,

    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(module_id, date)
);

-- Indexes
CREATE INDEX idx_analytics_module_date ON emotion_analytics_cache(module_id, date DESC);
CREATE INDEX idx_analytics_date ON emotion_analytics_cache(date DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_analytics_emotion_dist ON emotion_analytics_cache USING GIN (emotion_distribution);
CREATE INDEX idx_analytics_top_activities ON emotion_analytics_cache USING GIN (top_activities);

-- Comments
COMMENT ON TABLE emotion_analytics_cache IS 'Pre-computed daily analytics for teacher dashboard performance';
COMMENT ON COLUMN emotion_analytics_cache.emotion_distribution IS 'Count of each emotion type for the day';
COMMENT ON COLUMN emotion_analytics_cache.refresh_participation_rate IS 'Percentage of students who used refresh routines';
COMMENT ON COLUMN emotion_analytics_cache.correlation_with_performance IS 'Correlation coefficient between emotion score and learning performance';

-- ============================================================================
-- TABLE: student_emotion_preferences
-- Description: Student preferences for personalized activity recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_emotion_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE,

    -- Preferred activity types
    preferred_activity_types JSONB DEFAULT '[]'::JSONB,
    -- ["breathing", "mindfulness"]

    -- Activity types to avoid
    avoid_activity_types JSONB DEFAULT '[]'::JSONB,
    -- ["physical"]

    -- Settings
    enable_background_music BOOLEAN DEFAULT TRUE,
    enable_auto_suggestions BOOLEAN DEFAULT TRUE,
    auto_suggest_interval_minutes INTEGER DEFAULT 30,

    -- Privacy settings
    share_data_with_teacher BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_preferences_student ON student_emotion_preferences(student_id);

-- Comments
COMMENT ON TABLE student_emotion_preferences IS 'Student preferences for personalized emotion refresh experiences';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Student emotion summary (last 7 days)
CREATE OR REPLACE VIEW v_student_emotion_summary AS
SELECT
    student_id,
    COUNT(*) as total_check_ins,
    ROUND(AVG(emotion_score)::numeric, 2) as avg_emotion_score,
    MODE() WITHIN GROUP (ORDER BY emotion_type) as most_common_emotion,
    MIN(timestamp) as first_check_in,
    MAX(timestamp) as last_check_in
FROM emotion_check_ins
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY student_id;

COMMENT ON VIEW v_student_emotion_summary IS 'Summary of student emotions over the last 7 days';

-- View: Activity effectiveness ranking
CREATE OR REPLACE VIEW v_activity_effectiveness AS
SELECT
    ra.id,
    ra.activity_type,
    ra.ai_generated_content->>'title' as title,
    ra.usage_count,
    ra.avg_effectiveness_score,
    ROUND(
        (ra.positive_rating_count::float / NULLIF(ra.positive_rating_count + ra.negative_rating_count, 0) * 100)::numeric,
        2
    ) as positive_rating_percentage,
    ra.target_emotion
FROM refresh_activities ra
WHERE ra.is_active = TRUE
ORDER BY ra.avg_effectiveness_score DESC NULLS LAST, ra.usage_count DESC;

COMMENT ON VIEW v_activity_effectiveness IS 'Ranked list of most effective refresh activities';

-- View: Daily emotion trends
CREATE OR REPLACE VIEW v_daily_emotion_trends AS
SELECT
    DATE(timestamp) as date,
    emotion_type,
    COUNT(*) as count,
    ROUND(AVG(emotion_score)::numeric, 2) as avg_score
FROM emotion_check_ins
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), emotion_type
ORDER BY date DESC, count DESC;

COMMENT ON VIEW v_daily_emotion_trends IS 'Daily emotion trends over the last 30 days';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Calculate improvement score after refresh session
CREATE OR REPLACE FUNCTION calculate_improvement_score(
    p_pre_score INTEGER,
    p_post_score INTEGER
) RETURNS FLOAT AS $$
BEGIN
    IF p_post_score IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN p_post_score - p_pre_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_improvement_score IS 'Calculate emotion improvement score (post - pre)';

-- Function: Update activity statistics
CREATE OR REPLACE FUNCTION update_activity_statistics(
    p_activity_id UUID,
    p_improvement_score FLOAT,
    p_student_rating INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE refresh_activities
    SET
        usage_count = usage_count + 1,
        avg_effectiveness_score = COALESCE(
            (avg_effectiveness_score * usage_count + COALESCE(p_improvement_score, 0)) / (usage_count + 1),
            p_improvement_score
        ),
        positive_rating_count = positive_rating_count + CASE WHEN p_student_rating = 1 THEN 1 ELSE 0 END,
        negative_rating_count = negative_rating_count + CASE WHEN p_student_rating = -1 THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_activity_statistics IS 'Update activity usage count and effectiveness statistics';

-- Function: Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at on emotion_check_ins
CREATE TRIGGER trigger_emotion_check_ins_updated_at
    BEFORE UPDATE ON emotion_check_ins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on refresh_activities
CREATE TRIGGER trigger_refresh_activities_updated_at
    BEFORE UPDATE ON refresh_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on student_refresh_sessions
CREATE TRIGGER trigger_student_refresh_sessions_updated_at
    BEFORE UPDATE ON student_refresh_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on student_emotion_preferences
CREATE TRIGGER trigger_student_emotion_preferences_updated_at
    BEFORE UPDATE ON student_emotion_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Example activities
-- ============================================================================

-- Insert sample breathing exercise
INSERT INTO refresh_activities (
    activity_type,
    target_emotion,
    duration_seconds,
    difficulty_level,
    min_grade_level,
    max_grade_level,
    ai_generated_content
) VALUES (
    'breathing',
    'stressed',
    60,
    1,
    1,
    12,
    '{
        "title": "차분한 호흡",
        "description": "4-7-8 호흡법으로 마음을 안정시켜요",
        "steps": [
            {"time_seconds": 0, "instruction": "편안하게 앉아 눈을 감으세요", "duration_seconds": 5, "visual_cue": "relax"},
            {"time_seconds": 5, "instruction": "4초 동안 코로 천천히 숨을 들이마세요", "duration_seconds": 4, "visual_cue": "inhale"},
            {"time_seconds": 9, "instruction": "7초 동안 숨을 참으세요", "duration_seconds": 7, "visual_cue": "hold"},
            {"time_seconds": 16, "instruction": "8초 동안 입으로 천천히 숨을 내쉬세요", "duration_seconds": 8, "visual_cue": "exhale"},
            {"time_seconds": 24, "instruction": "다시 4초 동안 숨을 들이마세요", "duration_seconds": 4, "visual_cue": "inhale"},
            {"time_seconds": 28, "instruction": "7초 동안 숨을 참으세요", "duration_seconds": 7, "visual_cue": "hold"},
            {"time_seconds": 35, "instruction": "8초 동안 숨을 내쉬세요", "duration_seconds": 8, "visual_cue": "exhale"},
            {"time_seconds": 43, "instruction": "마지막으로 4초 동안 숨을 들이마세요", "duration_seconds": 4, "visual_cue": "inhale"},
            {"time_seconds": 47, "instruction": "7초 동안 숨을 참으세요", "duration_seconds": 7, "visual_cue": "hold"},
            {"time_seconds": 54, "instruction": "8초 동안 숨을 내쉬고, 눈을 뜨세요", "duration_seconds": 6, "visual_cue": "exhale"}
        ],
        "background_music": "calm-ambient.mp3",
        "visual_guide": "breathing-animation.json",
        "expected_outcome": "마음이 차분해지고 집중력이 높아질 거예요",
        "encouragement": "잘했어요! 언제든지 필요할 때 다시 해보세요 🌟"
    }'::JSONB
) ON CONFLICT DO NOTHING;

-- Insert sample stretching exercise
INSERT INTO refresh_activities (
    activity_type,
    target_emotion,
    duration_seconds,
    difficulty_level,
    min_grade_level,
    max_grade_level,
    ai_generated_content
) VALUES (
    'stretch',
    'tired',
    60,
    2,
    1,
    12,
    '{
        "title": "상쾌한 스트레칭",
        "description": "목과 어깨를 풀어 피로를 날려요",
        "steps": [
            {"time_seconds": 0, "instruction": "바르게 앉아 어깨를 편안하게 내려요", "duration_seconds": 5, "visual_cue": "relax"},
            {"time_seconds": 5, "instruction": "천천히 고개를 오른쪽으로 기울여요", "duration_seconds": 10, "visual_cue": "stretch"},
            {"time_seconds": 15, "instruction": "고개를 가운데로 돌려요", "duration_seconds": 5, "visual_cue": "relax"},
            {"time_seconds": 20, "instruction": "천천히 고개를 왼쪽으로 기울여요", "duration_seconds": 10, "visual_cue": "stretch"},
            {"time_seconds": 30, "instruction": "고개를 가운데로 돌려요", "duration_seconds": 5, "visual_cue": "relax"},
            {"time_seconds": 35, "instruction": "어깨를 천천히 뒤로 돌려요", "duration_seconds": 10, "visual_cue": "stretch"},
            {"time_seconds": 45, "instruction": "어깨를 천천히 앞으로 돌려요", "duration_seconds": 10, "visual_cue": "stretch"},
            {"time_seconds": 55, "instruction": "크게 숨을 쉬고 편안하게 쉬어요", "duration_seconds": 5, "visual_cue": "relax"}
        ],
        "background_music": "energetic-light.mp3",
        "visual_guide": "stretch-animation.json",
        "expected_outcome": "목과 어깨가 가벼워지고 머리가 맑아질 거예요",
        "encouragement": "멋져요! 몸과 마음이 한결 가벼워졌어요 💪"
    }'::JSONB
) ON CONFLICT DO NOTHING;

-- Insert sample mindfulness exercise
INSERT INTO refresh_activities (
    activity_type,
    target_emotion,
    duration_seconds,
    difficulty_level,
    min_grade_level,
    max_grade_level,
    ai_generated_content
) VALUES (
    'mindfulness',
    'anxious',
    60,
    1,
    3,
    12,
    '{
        "title": "1분 마음챙김",
        "description": "5-4-3-2-1 기법으로 지금 이 순간에 집중해요",
        "steps": [
            {"time_seconds": 0, "instruction": "편안하게 앉아 주변을 둘러보세요", "duration_seconds": 5, "visual_cue": "focus"},
            {"time_seconds": 5, "instruction": "눈에 보이는 5가지를 찾아보세요", "duration_seconds": 12, "visual_cue": "focus"},
            {"time_seconds": 17, "instruction": "만질 수 있는 4가지를 느껴보세요", "duration_seconds": 12, "visual_cue": "focus"},
            {"time_seconds": 29, "instruction": "들리는 소리 3가지를 찾아보세요", "duration_seconds": 10, "visual_cue": "focus"},
            {"time_seconds": 39, "instruction": "냄새나는 2가지를 떠올려보세요", "duration_seconds": 10, "visual_cue": "focus"},
            {"time_seconds": 49, "instruction": "맛볼 수 있는 1가지를 생각해보세요", "duration_seconds": 11, "visual_cue": "focus"}
        ],
        "background_music": "nature-sounds.mp3",
        "visual_guide": "mindfulness-animation.json",
        "expected_outcome": "마음이 안정되고 불안감이 줄어들 거예요",
        "encouragement": "훌륭해요! 지금 이 순간에 집중하는 연습을 했어요 🧘"
    }'::JSONB
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS (Adjust based on your user roles)
-- ============================================================================

-- Grant permissions to application user (replace 'app_user' with actual user)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
