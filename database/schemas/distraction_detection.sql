-- Distraction Detection Database Schema
-- AI Education System - LMS Integration
-- Created: 2025-11-18

-- ============================================================================
-- TABLE: distraction_events
-- Purpose: Store raw distraction events detected on the client side
-- ============================================================================
CREATE TABLE distraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id VARCHAR(255),
    session_id UUID NOT NULL,

    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'page_blur',           -- Browser window lost focus
        'tab_switch',          -- User switched to another tab
        'mouse_idle',          -- No mouse movement for threshold duration
        'keyboard_idle',       -- No keyboard input for threshold duration
        'inactivity',          -- Combined idle (mouse + keyboard)
        'window_resize',       -- Window resized (potential multitasking)
        'copy_paste',          -- Copy/paste detected (potential cheating)
        'context_menu',        -- Right-click context menu opened
        'devtools_open'        -- Browser developer tools opened
    )),

    severity_level VARCHAR(20) NOT NULL DEFAULT 'minor' CHECK (severity_level IN (
        'minor',               -- < 10 seconds
        'moderate',            -- 10-30 seconds
        'major',               -- 30-60 seconds
        'critical'             -- > 60 seconds
    )),

    duration_seconds INTEGER NOT NULL DEFAULT 0,

    -- Context information
    metadata JSONB DEFAULT '{}',  -- Additional context (e.g., browser type, screen size, etc.)
    problem_context JSONB DEFAULT '{}',  -- Problem data at the time of event

    -- Timestamps
    event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX idx_distraction_events_student ON distraction_events(student_id);
CREATE INDEX idx_distraction_events_module ON distraction_events(module_id);
CREATE INDEX idx_distraction_events_session ON distraction_events(session_id);
CREATE INDEX idx_distraction_events_timestamp ON distraction_events(event_timestamp);
CREATE INDEX idx_distraction_events_type ON distraction_events(event_type);
CREATE INDEX idx_distraction_events_severity ON distraction_events(severity_level);

-- Composite index for common queries
CREATE INDEX idx_distraction_events_student_module_time ON distraction_events(
    student_id, module_id, event_timestamp DESC
);

COMMENT ON TABLE distraction_events IS 'Raw distraction events detected during student learning sessions';
COMMENT ON COLUMN distraction_events.event_type IS 'Type of distraction detected';
COMMENT ON COLUMN distraction_events.severity_level IS 'Severity based on duration: minor(<10s), moderate(10-30s), major(30-60s), critical(>60s)';
COMMENT ON COLUMN distraction_events.metadata IS 'Additional context data (JSON)';

-- ============================================================================
-- TABLE: distraction_sessions
-- Purpose: Aggregated distraction data per learning session
-- ============================================================================
CREATE TABLE distraction_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID UNIQUE NOT NULL,

    -- Session summary
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER DEFAULT 0,

    -- Distraction metrics
    total_events INTEGER DEFAULT 0,
    total_distraction_duration_seconds INTEGER DEFAULT 0,
    distraction_percentage DECIMAL(5,2) DEFAULT 0.00,  -- Percentage of session time distracted

    -- Event breakdown
    distraction_types JSONB DEFAULT '{}',  -- Count by event type
    event_timeline JSONB DEFAULT '[]',     -- Chronological list of event IDs

    -- Focus metrics
    longest_focus_duration_seconds INTEGER DEFAULT 0,
    average_focus_duration_seconds INTEGER DEFAULT 0,
    focus_sessions_count INTEGER DEFAULT 0,

    -- Flags and status
    flagged_for_intervention BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    intervention_triggered BOOLEAN DEFAULT FALSE,

    -- Academic context
    problems_attempted INTEGER DEFAULT 0,
    problems_completed INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_session_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX idx_distraction_sessions_student ON distraction_sessions(student_id);
CREATE INDEX idx_distraction_sessions_module ON distraction_sessions(module_id);
CREATE INDEX idx_distraction_sessions_flagged ON distraction_sessions(flagged_for_intervention) WHERE flagged_for_intervention = TRUE;
CREATE INDEX idx_distraction_sessions_time ON distraction_sessions(session_start DESC);

COMMENT ON TABLE distraction_sessions IS 'Aggregated distraction metrics per learning session';
COMMENT ON COLUMN distraction_sessions.distraction_percentage IS 'Percentage of total session time spent distracted';
COMMENT ON COLUMN distraction_sessions.flagged_for_intervention IS 'TRUE if session exceeded distraction thresholds';

-- ============================================================================
-- TABLE: distraction_marks
-- Purpose: Teacher annotations and classifications of distraction events
-- This is the CORE FEATURE for manual marking of distraction points
-- ============================================================================
CREATE TABLE distraction_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distraction_event_id UUID UNIQUE NOT NULL,  -- One mark per event

    -- Context
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id VARCHAR(255),

    -- Mark details
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'legitimate_break',    -- Student took a needed break
        'off_task',           -- Student was distracted/procrastinating
        'technical_issue',    -- Browser crash, network issue, etc.
        'external_interruption', -- Phone call, someone talking to them, etc.
        'confusion',          -- Student confused, looking for help elsewhere
        'cheating_attempt',   -- Potential academic dishonesty
        'false_positive',     -- Not actually a distraction
        'other'               -- Other category with notes
    )),

    severity VARCHAR(20) NOT NULL CHECK (severity IN (
        'critical',           -- Requires immediate intervention
        'major',             -- Significant concern
        'moderate',          -- Noteworthy but not urgent
        'minor'              -- Minimal concern
    )),

    -- Analysis
    context_notes TEXT,                    -- Teacher's observations
    root_cause_analysis TEXT,              -- Why did this happen?
    action_taken VARCHAR(255),             -- What did teacher do?
    intervention_recommended BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(100),        -- Type of intervention suggested

    -- Student outcome (if intervention was applied)
    student_notified BOOLEAN DEFAULT FALSE,
    student_response TEXT,
    outcome_successful BOOLEAN,

    -- Timestamps and audit
    marked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    marked_by_user_id UUID NOT NULL,  -- Teacher who marked this
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID,

    CONSTRAINT fk_mark_event FOREIGN KEY (distraction_event_id) REFERENCES distraction_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_mark_teacher FOREIGN KEY (marked_by_user_id) REFERENCES teachers(id)
);

CREATE INDEX idx_distraction_marks_student ON distraction_marks(student_id);
CREATE INDEX idx_distraction_marks_module ON distraction_marks(module_id);
CREATE INDEX idx_distraction_marks_category ON distraction_marks(category);
CREATE INDEX idx_distraction_marks_severity ON distraction_marks(severity);
CREATE INDEX idx_distraction_marks_teacher ON distraction_marks(marked_by_user_id);
CREATE INDEX idx_distraction_marks_time ON distraction_marks(marked_at DESC);
CREATE INDEX idx_distraction_marks_intervention ON distraction_marks(intervention_recommended) WHERE intervention_recommended = TRUE;

COMMENT ON TABLE distraction_marks IS 'Teacher annotations and classifications of distraction events';
COMMENT ON COLUMN distraction_marks.category IS 'Classification of the distraction type';
COMMENT ON COLUMN distraction_marks.severity IS 'Teacher-assessed severity level';
COMMENT ON COLUMN distraction_marks.root_cause_analysis IS 'Teacher analysis of why distraction occurred';

-- ============================================================================
-- TABLE: daily_distraction_analytics
-- Purpose: Pre-aggregated daily statistics for performance
-- ============================================================================
CREATE TABLE daily_distraction_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID,  -- NULL for student-wide analytics
    date DATE NOT NULL,

    -- Session metrics
    sessions_count INTEGER DEFAULT 0,
    total_session_duration_seconds INTEGER DEFAULT 0,

    -- Distraction metrics
    total_distraction_events INTEGER DEFAULT 0,
    total_distraction_duration_seconds INTEGER DEFAULT 0,
    average_distraction_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Event breakdown
    event_type_breakdown JSONB DEFAULT '{}',  -- Count by type
    severity_breakdown JSONB DEFAULT '{}',    -- Count by severity

    -- Trends (compared to previous period)
    trend_week_over_week DECIMAL(6,2),  -- % change from 7 days ago
    trend_month_over_month DECIMAL(6,2), -- % change from 30 days ago

    -- Academic correlation
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_analytics_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_analytics_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT unique_student_module_date UNIQUE (student_id, module_id, date)
);

CREATE INDEX idx_daily_analytics_student ON daily_distraction_analytics(student_id);
CREATE INDEX idx_daily_analytics_module ON daily_distraction_analytics(module_id);
CREATE INDEX idx_daily_analytics_date ON daily_distraction_analytics(date DESC);
CREATE INDEX idx_daily_analytics_student_date ON daily_distraction_analytics(student_id, date DESC);

COMMENT ON TABLE daily_distraction_analytics IS 'Daily aggregated distraction statistics for performance';
COMMENT ON COLUMN daily_distraction_analytics.trend_week_over_week IS 'Percentage change in distraction from 7 days ago';

-- ============================================================================
-- TABLE: distraction_interventions
-- Purpose: Log of interventions triggered and their outcomes
-- ============================================================================
CREATE TABLE distraction_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID,
    distraction_event_id UUID,  -- Optional: link to specific event

    -- Intervention details
    intervention_type VARCHAR(100) NOT NULL CHECK (intervention_type IN (
        'auto_pause',          -- System automatically paused session
        'alert_notification',  -- Real-time alert shown to student
        'teacher_notification', -- Teacher was notified
        'suggested_break',     -- System suggested a break
        'focus_reminder',      -- Gentle reminder to refocus
        'session_timeout',     -- Session auto-ended due to inactivity
        'manual_intervention'  -- Teacher manually intervened
    )),

    trigger_reason VARCHAR(255) NOT NULL,
    intervention_message TEXT,

    -- Response tracking
    student_acknowledged BOOLEAN DEFAULT FALSE,
    student_response TEXT,
    response_timestamp TIMESTAMP,

    -- Effectiveness
    distraction_reduced BOOLEAN,  -- Did distraction decrease after intervention?
    effectiveness_score DECIMAL(3,2),  -- 0.00 to 1.00

    -- Timestamps
    triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_intervention_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_intervention_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_intervention_event FOREIGN KEY (distraction_event_id) REFERENCES distraction_events(id) ON DELETE SET NULL
);

CREATE INDEX idx_interventions_student ON distraction_interventions(student_id);
CREATE INDEX idx_interventions_module ON distraction_interventions(module_id);
CREATE INDEX idx_interventions_session ON distraction_interventions(session_id);
CREATE INDEX idx_interventions_type ON distraction_interventions(intervention_type);
CREATE INDEX idx_interventions_time ON distraction_interventions(triggered_at DESC);

COMMENT ON TABLE distraction_interventions IS 'Log of interventions triggered and student responses';
COMMENT ON COLUMN distraction_interventions.effectiveness_score IS 'Measure of intervention effectiveness (0-1)';

-- ============================================================================
-- TABLE: distraction_thresholds
-- Purpose: Teacher-configurable thresholds for automatic interventions
-- ============================================================================
CREATE TABLE distraction_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    teacher_id UUID NOT NULL,

    -- Threshold configuration
    critical_percentage DECIMAL(5,2) DEFAULT 50.00,   -- > 50% of session
    warning_percentage DECIMAL(5,2) DEFAULT 30.00,    -- > 30% of session
    minor_percentage DECIMAL(5,2) DEFAULT 10.00,      -- > 10% of session

    -- Event count thresholds
    max_events_per_10min INTEGER DEFAULT 5,
    max_consecutive_events INTEGER DEFAULT 3,

    -- Duration thresholds (seconds)
    critical_duration_threshold INTEGER DEFAULT 300,   -- 5 minutes
    warning_duration_threshold INTEGER DEFAULT 120,    -- 2 minutes

    -- Intervention settings
    auto_pause_on_critical BOOLEAN DEFAULT FALSE,
    send_teacher_alerts BOOLEAN DEFAULT TRUE,
    send_student_reminders BOOLEAN DEFAULT TRUE,

    alert_settings JSONB DEFAULT '{}',  -- Custom alert configuration

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_thresholds_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_thresholds_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    CONSTRAINT unique_module_thresholds UNIQUE (module_id)
);

CREATE INDEX idx_thresholds_module ON distraction_thresholds(module_id);
CREATE INDEX idx_thresholds_teacher ON distraction_thresholds(teacher_id);

COMMENT ON TABLE distraction_thresholds IS 'Teacher-configurable thresholds for distraction interventions';
COMMENT ON COLUMN distraction_thresholds.critical_percentage IS 'Percentage of session that triggers critical alert';

-- ============================================================================
-- VIEWS: Useful pre-joined views for common queries
-- ============================================================================

-- View: Unmarked distraction events (for teacher dashboard)
CREATE VIEW unmarked_distraction_events AS
SELECT
    de.id,
    de.student_id,
    de.module_id,
    de.problem_id,
    de.event_type,
    de.severity_level,
    de.duration_seconds,
    de.event_timestamp,
    s.email as student_email,
    s.grade_level,
    m.name as module_name
FROM distraction_events de
LEFT JOIN distraction_marks dm ON de.id = dm.distraction_event_id
JOIN students s ON de.student_id = s.id
JOIN modules m ON de.module_id = m.id
WHERE dm.id IS NULL
ORDER BY de.event_timestamp DESC;

COMMENT ON VIEW unmarked_distraction_events IS 'All distraction events that have not been marked by teachers';

-- View: Student distraction summary
CREATE VIEW student_distraction_summary AS
SELECT
    ds.student_id,
    ds.module_id,
    s.email as student_email,
    m.name as module_name,
    COUNT(DISTINCT ds.session_id) as total_sessions,
    ROUND(AVG(ds.distraction_percentage), 2) as avg_distraction_percentage,
    SUM(ds.total_events) as total_distraction_events,
    SUM(ds.total_distraction_duration_seconds) as total_distraction_duration,
    MAX(ds.session_start) as last_session_date
FROM distraction_sessions ds
JOIN students s ON ds.student_id = s.id
JOIN modules m ON ds.module_id = m.id
GROUP BY ds.student_id, ds.module_id, s.email, m.name;

COMMENT ON VIEW student_distraction_summary IS 'Aggregated distraction metrics per student per module';

-- View: Recent marked events with teacher info
CREATE VIEW recent_distraction_marks AS
SELECT
    dm.id,
    dm.distraction_event_id,
    dm.student_id,
    dm.module_id,
    dm.category,
    dm.severity,
    dm.context_notes,
    dm.intervention_recommended,
    dm.marked_at,
    de.event_type,
    de.duration_seconds,
    de.event_timestamp,
    s.email as student_email,
    m.name as module_name,
    t.email as teacher_email
FROM distraction_marks dm
JOIN distraction_events de ON dm.distraction_event_id = de.id
JOIN students s ON dm.student_id = s.id
JOIN modules m ON dm.module_id = m.id
JOIN teachers t ON dm.marked_by_user_id = t.id
ORDER BY dm.marked_at DESC;

COMMENT ON VIEW recent_distraction_marks IS 'Recently marked events with full context';

-- ============================================================================
-- FUNCTIONS: Utility functions for common operations
-- ============================================================================

-- Function: Calculate distraction percentage
CREATE OR REPLACE FUNCTION calculate_distraction_percentage(
    p_total_duration INTEGER,
    p_distraction_duration INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF p_total_duration = 0 THEN
        RETURN 0.00;
    END IF;
    RETURN ROUND((p_distraction_duration::DECIMAL / p_total_duration::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Determine severity level based on duration
CREATE OR REPLACE FUNCTION determine_severity_level(
    p_duration_seconds INTEGER
) RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_duration_seconds < 10 THEN
        RETURN 'minor';
    ELSIF p_duration_seconds < 30 THEN
        RETURN 'moderate';
    ELSIF p_duration_seconds < 60 THEN
        RETURN 'major';
    ELSE
        RETURN 'critical';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update session aggregates (called after new event)
CREATE OR REPLACE FUNCTION update_session_aggregates(
    p_session_id UUID
) RETURNS VOID AS $$
DECLARE
    v_total_events INTEGER;
    v_total_duration INTEGER;
    v_session_start TIMESTAMP;
    v_session_end TIMESTAMP;
    v_total_session_duration INTEGER;
    v_distraction_percentage DECIMAL(5,2);
BEGIN
    -- Get event counts and durations
    SELECT
        COUNT(*),
        COALESCE(SUM(duration_seconds), 0),
        MIN(event_timestamp),
        MAX(event_timestamp)
    INTO v_total_events, v_total_duration, v_session_start, v_session_end
    FROM distraction_events
    WHERE session_id = p_session_id;

    -- Calculate total session duration
    v_total_session_duration := EXTRACT(EPOCH FROM (v_session_end - v_session_start))::INTEGER;

    -- Calculate distraction percentage
    v_distraction_percentage := calculate_distraction_percentage(
        v_total_session_duration,
        v_total_duration
    );

    -- Update session record
    UPDATE distraction_sessions
    SET
        total_events = v_total_events,
        total_distraction_duration_seconds = v_total_duration,
        session_end = v_session_end,
        total_duration_seconds = v_total_session_duration,
        distraction_percentage = v_distraction_percentage,
        updated_at = NOW()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Automatic updates
-- ============================================================================

-- Trigger: Auto-update session aggregates when event is inserted
CREATE OR REPLACE FUNCTION trigger_update_session_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_session_aggregates(NEW.session_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_distraction_event_insert
AFTER INSERT ON distraction_events
FOR EACH ROW
EXECUTE FUNCTION trigger_update_session_aggregates();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_distraction_sessions_timestamp
BEFORE UPDATE ON distraction_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_distraction_marks_timestamp
BEFORE UPDATE ON distraction_marks
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_daily_analytics_timestamp
BEFORE UPDATE ON daily_distraction_analytics
FOR EACH ROW
EXECUTE FUNCTION trigger_update_timestamp();

-- ============================================================================
-- SAMPLE DATA: Example records for testing
-- ============================================================================

-- Note: Uncomment below to insert sample data
/*
-- Sample teacher
INSERT INTO teachers (id, email, role) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'teacher@kaist.ac.kr', 'teacher');

-- Sample student
INSERT INTO students (id, email, grade_level) VALUES
('223e4567-e89b-12d3-a456-426614174000', 'student@kaist.ac.kr', 5);

-- Sample module
INSERT INTO modules (id, name, status) VALUES
('323e4567-e89b-12d3-a456-426614174000', 'Fractions Module', 'active');

-- Sample distraction event
INSERT INTO distraction_events (
    student_id, module_id, session_id, event_type, severity_level, duration_seconds
) VALUES (
    '223e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174000',
    gen_random_uuid(),
    'page_blur',
    'moderate',
    25
);
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
