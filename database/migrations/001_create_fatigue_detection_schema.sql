-- Migration: Create Fatigue Detection and Moodle Integration Schema
-- Version: 001
-- Description: Creates tables for student fatigue monitoring, cognitive switching routines,
--              Moodle activity log synchronization, and related metrics tracking

-- ============================================================================
-- 1. CORE STUDENT TABLES
-- ============================================================================

-- Students table (if not exists from main system)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_user_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grade_level VARCHAR(50),
    institution VARCHAR(255),

    -- Preferences
    fatigue_monitoring_enabled BOOLEAN DEFAULT TRUE,
    preferred_break_activities JSONB DEFAULT '[]',
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "push": true,
        "in_app": true
    }',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_with_moodle TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_students_moodle_user_id ON students(moodle_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- ============================================================================
-- 2. LEARNING SESSION TRACKING
-- ============================================================================

CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    moodle_session_id VARCHAR(100),

    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    total_duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN ended_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (ended_at - started_at))/60
            ELSE NULL
        END
    ) STORED,

    -- Course context
    moodle_course_id VARCHAR(100),
    course_name VARCHAR(255),
    course_category VARCHAR(100),

    -- Aggregated metrics
    total_interactions INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    break_count INTEGER DEFAULT 0,
    switching_routine_count INTEGER DEFAULT 0,

    -- Activity breakdown (JSONB)
    activity_summary JSONB DEFAULT '{
        "quiz_attempts": 0,
        "forum_posts": 0,
        "resource_views": 0,
        "assignment_submissions": 0
    }',

    -- Session outcomes
    completion_status VARCHAR(20) DEFAULT 'active' CHECK (
        completion_status IN ('active', 'completed', 'abandoned', 'timed_out')
    ),
    final_fatigue_score INTEGER CHECK (final_fatigue_score >= 0 AND final_fatigue_score <= 100),
    max_fatigue_score_reached INTEGER,

    -- User agent and device
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),
    ip_address INET,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_student ON learning_sessions(student_id, started_at DESC);
CREATE INDEX idx_sessions_course ON learning_sessions(moodle_course_id, started_at DESC);
CREATE INDEX idx_sessions_active ON learning_sessions(student_id) WHERE completion_status = 'active';
CREATE INDEX idx_sessions_ended_at ON learning_sessions(ended_at) WHERE ended_at IS NOT NULL;

-- ============================================================================
-- 3. FATIGUE METRICS TRACKING
-- ============================================================================

CREATE TABLE student_fatigue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Raw indicators (collected from various sources)
    session_duration_minutes INTEGER, -- Time since session start
    interaction_count_last_5min INTEGER, -- Activity frequency
    error_rate_last_10min DECIMAL(5,2), -- Recent error percentage
    avg_response_time_seconds INTEGER, -- Average time to answer
    minutes_since_last_break INTEGER,
    mouse_movement_velocity DECIMAL(8,2), -- Pixels per second (optional)
    keyboard_typing_speed INTEGER, -- WPM (optional)

    -- Individual component scores (0-100)
    session_duration_score INTEGER CHECK (session_duration_score >= 0 AND session_duration_score <= 100),
    interaction_frequency_score INTEGER CHECK (interaction_frequency_score >= 0 AND interaction_frequency_score <= 100),
    error_rate_score INTEGER CHECK (error_rate_score >= 0 AND error_rate_score <= 100),
    response_time_score INTEGER CHECK (response_time_score >= 0 AND response_time_score <= 100),
    break_pattern_score INTEGER CHECK (break_pattern_score >= 0 AND break_pattern_score <= 100),
    content_difficulty_score INTEGER CHECK (content_difficulty_score >= 0 AND content_difficulty_score <= 100),
    time_of_day_score INTEGER CHECK (time_of_day_score >= 0 AND time_of_day_score <= 100),

    -- Composite fatigue score (weighted average)
    fatigue_score INTEGER NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
    fatigue_level VARCHAR(20) NOT NULL CHECK (
        fatigue_level IN ('low', 'moderate', 'high', 'critical')
    ),

    -- Context
    current_course_id VARCHAR(100),
    current_activity_id VARCHAR(100),
    current_activity_type VARCHAR(50), -- quiz, assignment, forum, resource
    content_difficulty VARCHAR(20), -- remember, understand, apply, analyze, evaluate, create (Bloom's)

    -- Environmental factors
    time_of_day TIME,
    day_of_week INTEGER, -- 1=Monday, 7=Sunday
    is_weekend BOOLEAN,

    -- Student baseline comparison
    deviation_from_personal_baseline DECIMAL(6,2), -- % difference from student's average

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX idx_fatigue_student_timestamp ON student_fatigue_metrics(student_id, timestamp DESC);
CREATE INDEX idx_fatigue_session ON student_fatigue_metrics(session_id, timestamp DESC);
CREATE INDEX idx_fatigue_level ON student_fatigue_metrics(fatigue_level, timestamp DESC);
CREATE INDEX idx_fatigue_score_range ON student_fatigue_metrics(fatigue_score)
    WHERE fatigue_score >= 60; -- Focus on moderate-to-critical fatigue

-- Partial index for recent metrics (last 7 days)
CREATE INDEX idx_fatigue_recent ON student_fatigue_metrics(student_id, timestamp DESC)
    WHERE timestamp > NOW() - INTERVAL '7 days';

-- ============================================================================
-- 4. COGNITIVE SWITCHING ROUTINES
-- ============================================================================

CREATE TABLE cognitive_switching_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ko VARCHAR(100), -- Korean translation
    description TEXT,
    description_ko TEXT,

    -- Routine classification
    routine_type VARCHAR(20) NOT NULL CHECK (routine_type IN ('light', 'medium', 'deep')),
    duration_minutes INTEGER NOT NULL,

    -- Cognitive domain mapping
    source_domain VARCHAR(50), -- verbal, logical, spatial, kinesthetic, musical, interpersonal, intrapersonal
    target_domain VARCHAR(50), -- the domain this routine engages
    is_domain_switch BOOLEAN DEFAULT TRUE, -- whether it switches cognitive domains

    -- Activities (structured as JSONB array)
    activities JSONB NOT NULL,
    /* Example structure:
    [
        {
            "type": "stretching",
            "name": "Upper Body Stretch",
            "duration": 5,
            "instructions": "Stand up and reach arms overhead...",
            "animation_url": "https://...",
            "demonstration_video": "https://..."
        },
        {
            "type": "breathing",
            "name": "Box Breathing",
            "duration": 3,
            "instructions": "Inhale for 4, hold for 4, exhale for 4, hold for 4",
            "guide_audio": "https://..."
        }
    ]
    */

    -- Applicability
    min_fatigue_score INTEGER DEFAULT 0, -- Minimum score to recommend
    max_fatigue_score INTEGER DEFAULT 100,
    recommended_for_activities JSONB DEFAULT '[]', -- ["quiz", "assignment", "reading"]
    time_of_day_suitability JSONB DEFAULT '[]', -- ["morning", "afternoon", "evening"]

    -- Effectiveness tracking
    times_recommended INTEGER DEFAULT 0,
    times_started INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN times_started > 0
            THEN (times_completed::DECIMAL / times_started::DECIMAL * 100)
            ELSE 0
        END
    ) STORED,

    -- Post-routine improvement metrics
    avg_fatigue_reduction DECIMAL(5,2), -- Average decrease in fatigue score
    avg_error_rate_improvement DECIMAL(5,2), -- Average improvement in error rate
    avg_effectiveness_score DECIMAL(3,2), -- Student-reported effectiveness (1-5)

    -- Metadata
    created_by UUID, -- Creator (teacher/admin)
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routines_type ON cognitive_switching_routines(routine_type);
CREATE INDEX idx_routines_active ON cognitive_switching_routines(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_routines_fatigue_range ON cognitive_switching_routines(min_fatigue_score, max_fatigue_score);

-- ============================================================================
-- 5. STUDENT ROUTINE HISTORY
-- ============================================================================

CREATE TABLE student_routine_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,
    routine_id UUID NOT NULL,

    -- Timing
    recommended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (completed_at - started_at))/60
            ELSE NULL
        END
    ) STORED,

    -- Pre-break state (snapshot when routine recommended)
    pre_fatigue_score INTEGER NOT NULL,
    pre_fatigue_level VARCHAR(20),
    pre_error_rate DECIMAL(5,2),
    pre_response_time_seconds INTEGER,
    pre_interaction_frequency DECIMAL(5,2),

    -- Post-break state (measured 10 minutes after return)
    post_fatigue_score INTEGER,
    post_fatigue_level VARCHAR(20),
    post_error_rate DECIMAL(5,2),
    post_response_time_seconds INTEGER,
    post_interaction_frequency DECIMAL(5,2),

    -- Calculated improvements
    fatigue_score_change INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN post_fatigue_score IS NOT NULL
            THEN pre_fatigue_score - post_fatigue_score
            ELSE NULL
        END
    ) STORED, -- Positive = improvement
    error_rate_change DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN post_error_rate IS NOT NULL
            THEN pre_error_rate - post_error_rate
            ELSE NULL
        END
    ) STORED,

    -- Student engagement
    completion_status VARCHAR(20) NOT NULL DEFAULT 'recommended' CHECK (
        completion_status IN ('recommended', 'started', 'completed', 'skipped', 'abandoned', 'partial')
    ),
    skip_reason VARCHAR(100), -- "not_tired", "no_time", "prefer_continue"

    -- Student feedback
    was_helpful BOOLEAN,
    helpfulness_score INTEGER CHECK (helpfulness_score >= 1 AND helpfulness_score <= 5),
    would_do_again BOOLEAN,
    feedback_comment TEXT,
    feedback_submitted_at TIMESTAMPTZ,

    -- Activity completion tracking
    activities_completed JSONB DEFAULT '[]', -- Array of completed activity IDs

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES cognitive_switching_routines(id) ON DELETE CASCADE
);

CREATE INDEX idx_routine_history_student ON student_routine_history(student_id, recommended_at DESC);
CREATE INDEX idx_routine_history_session ON student_routine_history(session_id, recommended_at DESC);
CREATE INDEX idx_routine_history_routine ON student_routine_history(routine_id, recommended_at DESC);
CREATE INDEX idx_routine_history_completion ON student_routine_history(completion_status, recommended_at DESC);
CREATE INDEX idx_routine_history_effectiveness ON student_routine_history(fatigue_score_change)
    WHERE completion_status = 'completed';

-- ============================================================================
-- 6. MOODLE ACTIVITY LOG SYNCHRONIZATION
-- ============================================================================

CREATE TABLE moodle_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_log_id BIGINT UNIQUE NOT NULL, -- Original Moodle log ID

    student_id UUID NOT NULL,
    session_id UUID, -- Linked to our learning_sessions

    -- Event details
    event_time TIMESTAMPTZ NOT NULL,
    event_name VARCHAR(100) NOT NULL, -- quiz_attempt_submitted, forum_post_created, etc.
    component VARCHAR(50), -- mod_quiz, mod_assign, mod_forum
    action VARCHAR(50), -- view, submit, update, delete, create
    target VARCHAR(50), -- course, module, question, post

    -- Moodle context
    moodle_course_id VARCHAR(100),
    moodle_context_id BIGINT,
    moodle_module_id VARCHAR(100),
    moodle_user_id BIGINT,

    -- Event-specific data (flexible JSONB)
    event_data JSONB,
    /* Example structures:
    -- Quiz attempt:
    {
        "quiz_id": 123,
        "attempt_number": 2,
        "score": 85,
        "max_score": 100,
        "time_spent_seconds": 1200,
        "questions_answered": 10,
        "correct_answers": 8
    }

    -- Forum post:
    {
        "forum_id": 45,
        "discussion_id": 678,
        "post_id": 1234,
        "word_count": 150,
        "has_attachment": false
    }

    -- Resource view:
    {
        "resource_id": 789,
        "resource_type": "pdf",
        "time_on_page_seconds": 180
    }
    */

    -- Sync metadata
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_batch_id UUID, -- For tracking batch syncs

    -- User agent (from Moodle)
    user_agent TEXT,
    ip_address INET,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_moodle_logs_student_time ON moodle_activity_logs(student_id, event_time DESC);
CREATE INDEX idx_moodle_logs_session ON moodle_activity_logs(session_id, event_time DESC);
CREATE INDEX idx_moodle_logs_course ON moodle_activity_logs(moodle_course_id, event_time DESC);
CREATE INDEX idx_moodle_logs_event_name ON moodle_activity_logs(event_name, event_time DESC);
CREATE INDEX idx_moodle_logs_synced ON moodle_activity_logs(synced_at DESC);

-- GIN index for JSONB event_data searching
CREATE INDEX idx_moodle_logs_event_data ON moodle_activity_logs USING GIN (event_data);

-- ============================================================================
-- 7. FATIGUE ALERTS
-- ============================================================================

CREATE TABLE fatigue_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    session_id UUID NOT NULL,

    -- Alert details
    alert_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fatigue_score INTEGER NOT NULL,
    alert_level VARCHAR(20) NOT NULL CHECK (
        alert_level IN ('info', 'warning', 'urgent', 'critical')
    ),

    -- Alert message
    message TEXT NOT NULL,
    message_ko TEXT, -- Korean translation
    recommended_routine_id UUID,

    -- Alert delivery channels
    sent_to_student BOOLEAN DEFAULT FALSE,
    sent_to_teacher BOOLEAN DEFAULT FALSE,
    sent_to_moodle BOOLEAN DEFAULT FALSE,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,

    delivery_attempted_at TIMESTAMPTZ,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'sent', 'failed', 'dismissed')
    ),

    -- Student response
    acknowledged_at TIMESTAMPTZ,
    action_taken VARCHAR(50), -- accepted_break, ignored, postponed, completed_routine
    postponed_until TIMESTAMPTZ,
    dismissal_reason VARCHAR(100),

    -- Outcome tracking
    resulted_in_break BOOLEAN DEFAULT FALSE,
    resulted_in_routine BOOLEAN DEFAULT FALSE,
    routine_history_id UUID, -- Link to student_routine_history if action taken

    -- Alert effectiveness
    fatigue_score_after_30min INTEGER, -- Did fatigue improve?
    alert_was_effective BOOLEAN,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (recommended_routine_id) REFERENCES cognitive_switching_routines(id) ON DELETE SET NULL,
    FOREIGN KEY (routine_history_id) REFERENCES student_routine_history(id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_student ON fatigue_alerts(student_id, alert_time DESC);
CREATE INDEX idx_alerts_session ON fatigue_alerts(session_id, alert_time DESC);
CREATE INDEX idx_alerts_level ON fatigue_alerts(alert_level, alert_time DESC);
CREATE INDEX idx_alerts_pending ON fatigue_alerts(delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX idx_alerts_acknowledged ON fatigue_alerts(acknowledged_at) WHERE acknowledged_at IS NOT NULL;

-- ============================================================================
-- 8. STUDENT BASELINE PROFILES
-- ============================================================================

-- Tracks individual student's normal behavior patterns for personalized thresholds
CREATE TABLE student_baseline_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL,

    -- Learning patterns (calculated from historical data)
    avg_session_duration_minutes INTEGER,
    avg_interactions_per_hour DECIMAL(6,2),
    avg_error_rate DECIMAL(5,2),
    avg_response_time_seconds INTEGER,
    typical_break_frequency_minutes INTEGER,

    -- Performance baselines
    best_performance_time_of_day TIME,
    worst_performance_time_of_day TIME,
    preferred_session_length_minutes INTEGER,

    -- Fatigue thresholds (personalized)
    personalized_fatigue_threshold_moderate INTEGER DEFAULT 45,
    personalized_fatigue_threshold_high INTEGER DEFAULT 65,
    personalized_fatigue_threshold_critical INTEGER DEFAULT 85,

    -- Routine preferences
    most_effective_routine_type VARCHAR(20), -- light, medium, deep
    favorite_routine_ids JSONB DEFAULT '[]',
    least_favorite_routine_ids JSONB DEFAULT '[]',

    -- Metadata
    baseline_calculation_date TIMESTAMPTZ DEFAULT NOW(),
    data_points_used INTEGER, -- Number of sessions used for baseline
    confidence_score DECIMAL(3,2), -- 0.0-1.0, how reliable is this baseline

    last_updated TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_baselines_student ON student_baseline_profiles(student_id);

-- ============================================================================
-- 9. MOODLE SYNC TRACKING
-- ============================================================================

CREATE TABLE moodle_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_batch_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

    -- Sync details
    sync_type VARCHAR(50) NOT NULL, -- activity_logs, student_progress, course_roster
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (completed_at - started_at))
            ELSE NULL
        END
    ) STORED,

    -- Statistics
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Moodle API details
    moodle_api_endpoint VARCHAR(255),
    request_params JSONB,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'failed', 'partial')
    ),
    error_message TEXT,
    error_details JSONB,

    -- Performance
    api_response_time_ms INTEGER,
    database_write_time_ms INTEGER
);

CREATE INDEX idx_sync_logs_batch ON moodle_sync_logs(sync_batch_id);
CREATE INDEX idx_sync_logs_started ON moodle_sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON moodle_sync_logs(status, started_at DESC);

-- ============================================================================
-- 10. VIEWS FOR ANALYTICS
-- ============================================================================

-- Current fatigue status for all active students
CREATE VIEW v_current_student_fatigue AS
SELECT DISTINCT ON (s.id)
    s.id AS student_id,
    s.name AS student_name,
    s.moodle_user_id,
    ls.id AS session_id,
    ls.moodle_course_id,
    ls.course_name,
    sfm.fatigue_score,
    sfm.fatigue_level,
    sfm.timestamp AS last_measured_at,
    EXTRACT(EPOCH FROM (NOW() - sfm.timestamp))/60 AS minutes_since_last_measurement,
    ls.total_interactions,
    sfm.minutes_since_last_break,
    sfm.session_duration_minutes
FROM students s
JOIN learning_sessions ls ON s.id = ls.student_id
JOIN student_fatigue_metrics sfm ON ls.id = sfm.session_id
WHERE ls.completion_status = 'active'
ORDER BY s.id, sfm.timestamp DESC;

-- Routine effectiveness summary
CREATE VIEW v_routine_effectiveness AS
SELECT
    r.id AS routine_id,
    r.name,
    r.routine_type,
    r.duration_minutes,
    r.times_recommended,
    r.times_completed,
    r.completion_rate,
    COUNT(rh.id) AS total_uses,
    COUNT(rh.id) FILTER (WHERE rh.completion_status = 'completed') AS completed_uses,
    AVG(rh.fatigue_score_change) FILTER (WHERE rh.completion_status = 'completed') AS avg_fatigue_improvement,
    AVG(rh.helpfulness_score) AS avg_student_rating,
    STDDEV(rh.fatigue_score_change) AS fatigue_improvement_stddev
FROM cognitive_switching_routines r
LEFT JOIN student_routine_history rh ON r.id = rh.routine_id
WHERE r.is_active = TRUE
GROUP BY r.id, r.name, r.routine_type, r.duration_minutes,
         r.times_recommended, r.times_completed, r.completion_rate;

-- Student fatigue trends (last 7 days)
CREATE VIEW v_student_fatigue_trends AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    DATE(sfm.timestamp) AS date,
    COUNT(DISTINCT sfm.session_id) AS sessions_count,
    AVG(sfm.fatigue_score) AS avg_fatigue_score,
    MAX(sfm.fatigue_score) AS max_fatigue_score,
    COUNT(*) FILTER (WHERE sfm.fatigue_level IN ('high', 'critical')) AS high_fatigue_measurements,
    COUNT(DISTINCT fa.id) AS alerts_triggered,
    COUNT(DISTINCT rh.id) AS routines_recommended,
    COUNT(DISTINCT rh.id) FILTER (WHERE rh.completion_status = 'completed') AS routines_completed
FROM students s
JOIN student_fatigue_metrics sfm ON s.id = sfm.student_id
LEFT JOIN fatigue_alerts fa ON s.id = fa.student_id AND DATE(fa.alert_time) = DATE(sfm.timestamp)
LEFT JOIN student_routine_history rh ON s.id = rh.student_id AND DATE(rh.recommended_at) = DATE(sfm.timestamp)
WHERE sfm.timestamp > NOW() - INTERVAL '7 days'
GROUP BY s.id, s.name, DATE(sfm.timestamp)
ORDER BY s.id, DATE(sfm.timestamp) DESC;

-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON cognitive_switching_routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update session last_activity_at on new fatigue metric
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE learning_sessions
    SET last_activity_at = NEW.timestamp
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_activity AFTER INSERT ON student_fatigue_metrics
    FOR EACH ROW EXECUTE FUNCTION update_session_last_activity();

-- ============================================================================
-- 12. INITIAL DATA - DEFAULT COGNITIVE SWITCHING ROUTINES
-- ============================================================================

-- Light switching routines (5-10 minutes)
INSERT INTO cognitive_switching_routines (name, name_ko, description, description_ko, routine_type, duration_minutes, source_domain, target_domain, activities, min_fatigue_score, max_fatigue_score) VALUES
(
    'Quick Refresh Break',
    '빠른 재충전 휴식',
    'A short break with stretching, eye rest, and breathing exercises',
    '스트레칭, 눈 휴식, 호흡 운동을 포함한 짧은 휴식',
    'light',
    8,
    'logical',
    'kinesthetic',
    '[
        {"type": "stretching", "name": "Neck Roll", "duration": 2, "instructions": "Slowly roll your head in circles, 5 times each direction"},
        {"type": "eye_rest", "name": "20-20-20 Rule", "duration": 3, "instructions": "Look at something 20 feet away for 20 seconds every 20 minutes"},
        {"type": "breathing", "name": "Deep Breathing", "duration": 3, "instructions": "Inhale deeply for 4 seconds, hold for 4, exhale for 4"}
    ]'::jsonb,
    30,
    60
),
(
    'Movement Break',
    '움직임 휴식',
    'Get your body moving with light exercises',
    '가벼운 운동으로 몸을 움직이세요',
    'light',
    10,
    'logical',
    'kinesthetic',
    '[
        {"type": "walking", "name": "Quick Walk", "duration": 5, "instructions": "Walk around your space or outside if possible"},
        {"type": "stretching", "name": "Full Body Stretch", "duration": 3, "instructions": "Reach up, bend down, twist side to side"},
        {"type": "water", "name": "Hydration", "duration": 2, "instructions": "Drink a full glass of water"}
    ]'::jsonb,
    35,
    65
);

-- Medium switching routines (15-20 minutes)
INSERT INTO cognitive_switching_routines (name, name_ko, description, description_ko, routine_type, duration_minutes, source_domain, target_domain, activities, min_fatigue_score, max_fatigue_score) VALUES
(
    'Creative Switch',
    '창의적 전환',
    'Switch from analytical to creative thinking',
    '분석적 사고에서 창의적 사고로 전환',
    'medium',
    15,
    'logical',
    'creative',
    '[
        {"type": "doodling", "name": "Free Drawing", "duration": 8, "instructions": "Draw whatever comes to mind on paper"},
        {"type": "music", "name": "Listen to Music", "duration": 5, "instructions": "Listen to your favorite relaxing music"},
        {"type": "stretching", "name": "Light Stretch", "duration": 2, "instructions": "Gentle full-body stretching"}
    ]'::jsonb,
    45,
    75
),
(
    'Social Interaction Break',
    '사회적 상호작용 휴식',
    'Engage with others to refresh your mind',
    '다른 사람들과 교류하여 마음을 재충전',
    'medium',
    20,
    'intrapersonal',
    'interpersonal',
    '[
        {"type": "conversation", "name": "Chat with Friend", "duration": 10, "instructions": "Have a brief chat with a friend or classmate"},
        {"type": "forum", "name": "Discussion Forum", "duration": 8, "instructions": "Participate in a course discussion forum"},
        {"type": "reflection", "name": "Quick Reflection", "duration": 2, "instructions": "Think about what you just learned"}
    ]'::jsonb,
    50,
    80
);

-- Deep switching routines (30+ minutes)
INSERT INTO cognitive_switching_routines (name, name_ko, description, description_ko, routine_type, duration_minutes, source_domain, target_domain, activities, min_fatigue_score, max_fatigue_score) VALUES
(
    'Complete Mental Reset',
    '완전한 정신 재설정',
    'A comprehensive break to fully recharge',
    '완전히 재충전하기 위한 종합적인 휴식',
    'deep',
    45,
    'logical',
    'physical',
    '[
        {"type": "exercise", "name": "Outdoor Walk", "duration": 20, "instructions": "Take a walk outside, preferably in nature"},
        {"type": "meal", "name": "Healthy Snack", "duration": 15, "instructions": "Eat a nutritious snack or light meal"},
        {"type": "power_nap", "name": "Power Nap", "duration": 10, "instructions": "Optional: Take a 10-minute power nap"}
    ]'::jsonb,
    75,
    100
),
(
    'Extended Subject Switch',
    '확장 과목 전환',
    'Switch to a completely different subject area',
    '완전히 다른 과목 영역으로 전환',
    'deep',
    60,
    'mathematical',
    'creative',
    '[
        {"type": "break", "name": "Complete Break", "duration": 20, "instructions": "Step away from all screens and study materials"},
        {"type": "different_subject", "name": "New Subject", "duration": 30, "instructions": "Work on a completely different subject (e.g., from math to literature)"},
        {"type": "reflection", "name": "Learning Review", "duration": 10, "instructions": "Review what you learned before the break"}
    ]'::jsonb,
    70,
    100
);

-- ============================================================================
-- GRANT PERMISSIONS (adjust based on your user setup)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO alt42_backend;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO alt42_backend;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO alt42_readonly;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to migration
COMMENT ON TABLE student_fatigue_metrics IS 'Stores real-time fatigue monitoring data for students';
COMMENT ON TABLE cognitive_switching_routines IS 'Predefined break activities and cognitive switching routines';
COMMENT ON TABLE student_routine_history IS 'Tracks student engagement with recommended routines and their effectiveness';
COMMENT ON TABLE moodle_activity_logs IS 'Synchronized activity logs from Moodle LMS';
COMMENT ON TABLE fatigue_alerts IS 'Alert history for student fatigue notifications';
