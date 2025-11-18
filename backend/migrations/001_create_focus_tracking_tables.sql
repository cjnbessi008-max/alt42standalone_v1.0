-- Migration: Focus Tracking and Mental Alignment Routine Tables
-- Created: 2025-11-18
-- Description: Database schema for tracking student focus and mental alignment breaks

-- Table: focus_sessions
-- Tracks individual focus sessions for students
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(255) NOT NULL,
    session_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER,
    active_duration_seconds INTEGER DEFAULT 0,
    idle_duration_seconds INTEGER DEFAULT 0,
    focus_score DECIMAL(5,2), -- 0.00 to 100.00
    interaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: focus_breaks
-- Records when focus is broken and mental alignment routines are triggered
CREATE TABLE IF NOT EXISTS focus_breaks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    break_triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    break_reason VARCHAR(50) NOT NULL, -- 'idle_timeout', 'wrong_answers', 'no_interaction', 'manual'
    idle_duration_seconds INTEGER,
    routine_started_at TIMESTAMP,
    routine_completed_at TIMESTAMP,
    routine_skipped BOOLEAN DEFAULT FALSE,
    routine_type VARCHAR(50) DEFAULT 'breathing', -- 'breathing', 'stretching', 'eye_exercise'
    effectiveness_rating INTEGER, -- 1-5 rating from student (optional)
    notes JSONB, -- Additional metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: mental_alignment_routines
-- Defines different types of 10-second mental alignment routines
CREATE TABLE IF NOT EXISTS mental_alignment_routines (
    id SERIAL PRIMARY KEY,
    routine_type VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 10,
    instructions JSONB NOT NULL, -- Array of step-by-step instructions
    animation_config JSONB, -- Configuration for visual animations
    audio_cues JSONB, -- Audio guidance configuration
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    avg_effectiveness_rating DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: student_focus_preferences
-- Stores student preferences for focus tracking and break routines
CREATE TABLE IF NOT EXISTS student_focus_preferences (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) UNIQUE NOT NULL,
    idle_timeout_seconds INTEGER DEFAULT 120, -- 2 minutes default
    enable_focus_tracking BOOLEAN DEFAULT TRUE,
    enable_auto_breaks BOOLEAN DEFAULT TRUE,
    preferred_routine_type VARCHAR(50) DEFAULT 'breathing',
    break_frequency_minutes INTEGER DEFAULT 30,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    preferences JSONB, -- Additional custom preferences
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: moodle_integration_log
-- Logs for future Moodle LMS integration
CREATE TABLE IF NOT EXISTS moodle_integration_log (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    moodle_user_id VARCHAR(255),
    moodle_course_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- 'session_start', 'focus_break', 'routine_complete'
    event_data JSONB,
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    sync_attempted_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_focus_sessions_student ON focus_sessions(student_id);
CREATE INDEX idx_focus_sessions_module ON focus_sessions(module_id);
CREATE INDEX idx_focus_sessions_start ON focus_sessions(session_start);
CREATE INDEX idx_focus_breaks_session ON focus_breaks(session_id);
CREATE INDEX idx_focus_breaks_student ON focus_breaks(student_id);
CREATE INDEX idx_focus_breaks_triggered ON focus_breaks(break_triggered_at);
CREATE INDEX idx_moodle_log_student ON moodle_integration_log(student_id);
CREATE INDEX idx_moodle_log_sync ON moodle_integration_log(sync_status);

-- Insert default mental alignment routines
INSERT INTO mental_alignment_routines (routine_type, title, description, duration_seconds, instructions, animation_config) VALUES
(
    'breathing',
    '10초 호흡 정렬',
    '심호흡을 통한 집중력 회복',
    10,
    '["눈을 감으세요", "코로 깊게 숨을 들이마시세요 (3초)", "잠시 멈추세요 (2초)", "입으로 천천히 숨을 내쉬세요 (5초)", "다시 집중할 준비가 되었습니다"]'::jsonb,
    '{"type": "breathing_circle", "colors": ["#4A90E2", "#7ED321"], "animation_duration": 10}'::jsonb
),
(
    'stretching',
    '10초 스트레칭',
    '간단한 스트레칭으로 긴장 해소',
    10,
    '["자리에서 일어나세요", "양팔을 위로 쭉 펴세요 (3초)", "좌우로 천천히 몸을 기울이세요 (4초)", "어깨를 돌려주세요 (3초)", "준비 완료!"]'::jsonb,
    '{"type": "stretch_guide", "positions": ["arms_up", "side_bend", "shoulder_roll"]}'::jsonb
),
(
    'eye_exercise',
    '10초 눈 운동',
    '눈의 피로를 풀어주는 간단한 운동',
    10,
    '["화면에서 눈을 떼세요", "먼 곳을 3초간 바라보세요", "눈을 감고 3초간 휴식하세요", "눈을 크게 떴다 감았다 반복하세요 (4초)", "다시 화면을 봐도 좋습니다"]'::jsonb,
    '{"type": "eye_focus", "distance_indicator": true, "blink_counter": true}'::jsonb
);

-- Comments for documentation
COMMENT ON TABLE focus_sessions IS '학생의 학습 세션 집중도 추적';
COMMENT ON TABLE focus_breaks IS '집중력이 깨진 시점과 정신정렬 루틴 기록';
COMMENT ON TABLE mental_alignment_routines IS '10초 정신정렬 루틴 정의';
COMMENT ON TABLE student_focus_preferences IS '학생별 집중도 추적 설정';
COMMENT ON TABLE moodle_integration_log IS 'Moodle LMS 연동 로그';
