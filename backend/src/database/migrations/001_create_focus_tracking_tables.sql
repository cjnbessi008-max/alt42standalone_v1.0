-- 집중 추적 이벤트 테이블
CREATE TABLE IF NOT EXISTS focus_tracking_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'focus_lost',
            'focus_regained',
            'idle_detected',
            'break_started',
            'break_completed',
            'break_skipped'
        )
    ),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    student_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_focus_events_student_module ON focus_tracking_events(student_id, module_id);
CREATE INDEX idx_focus_events_session ON focus_tracking_events(session_id);
CREATE INDEX idx_focus_events_timestamp ON focus_tracking_events(timestamp DESC);
CREATE INDEX idx_focus_events_event_type ON focus_tracking_events(event_type);
CREATE INDEX idx_focus_events_metadata ON focus_tracking_events USING gin(metadata);

-- 학생별 집중도 요약 테이블 (실시간 업데이트용)
CREATE TABLE IF NOT EXISTS student_focus_summary (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(255) NOT NULL,
    total_focus_time_seconds NUMERIC DEFAULT 0,
    total_idle_time_seconds NUMERIC DEFAULT 0,
    focus_lost_count INTEGER DEFAULT 0,
    breaks_completed INTEGER DEFAULT 0,
    breaks_skipped INTEGER DEFAULT 0,
    average_break_duration_seconds NUMERIC DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

CREATE INDEX idx_student_focus_summary_student ON student_focus_summary(student_id);
CREATE INDEX idx_student_focus_summary_module ON student_focus_summary(module_id);
CREATE INDEX idx_student_focus_summary_updated ON student_focus_summary(updated_at DESC);

-- 세션 요약 테이블
CREATE TABLE IF NOT EXISTS focus_tracking_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    total_duration_seconds NUMERIC,
    focus_lost_count INTEGER DEFAULT 0,
    breaks_completed INTEGER DEFAULT 0,
    breaks_skipped INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_focus_sessions_session_id ON focus_tracking_sessions(session_id);
CREATE INDEX idx_focus_sessions_student ON focus_tracking_sessions(student_id);
CREATE INDEX idx_focus_sessions_module ON focus_tracking_sessions(module_id);
CREATE INDEX idx_focus_sessions_started ON focus_tracking_sessions(started_at DESC);

-- 트리거: 이벤트 삽입 시 요약 테이블 자동 업데이트
CREATE OR REPLACE FUNCTION update_focus_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- student_focus_summary 업데이트
    INSERT INTO student_focus_summary (
        student_id,
        module_id,
        focus_lost_count,
        breaks_completed,
        breaks_skipped,
        last_activity_at,
        updated_at
    )
    VALUES (
        NEW.student_id,
        NEW.module_id,
        CASE WHEN NEW.event_type = 'focus_lost' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'break_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'break_skipped' THEN 1 ELSE 0 END,
        NEW.timestamp,
        NOW()
    )
    ON CONFLICT (student_id, module_id)
    DO UPDATE SET
        focus_lost_count = student_focus_summary.focus_lost_count +
            CASE WHEN NEW.event_type = 'focus_lost' THEN 1 ELSE 0 END,
        breaks_completed = student_focus_summary.breaks_completed +
            CASE WHEN NEW.event_type = 'break_completed' THEN 1 ELSE 0 END,
        breaks_skipped = student_focus_summary.breaks_skipped +
            CASE WHEN NEW.event_type = 'break_skipped' THEN 1 ELSE 0 END,
        total_idle_time_seconds = student_focus_summary.total_idle_time_seconds +
            COALESCE((NEW.metadata->>'idleTime')::numeric / 1000, 0),
        last_activity_at = GREATEST(student_focus_summary.last_activity_at, NEW.timestamp),
        updated_at = NOW();

    -- focus_tracking_sessions 업데이트
    INSERT INTO focus_tracking_sessions (
        session_id,
        student_id,
        module_id,
        started_at,
        focus_lost_count,
        breaks_completed,
        breaks_skipped,
        updated_at
    )
    VALUES (
        NEW.session_id,
        NEW.student_id,
        NEW.module_id,
        NEW.timestamp,
        CASE WHEN NEW.event_type = 'focus_lost' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'break_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'break_skipped' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (session_id)
    DO UPDATE SET
        focus_lost_count = focus_tracking_sessions.focus_lost_count +
            CASE WHEN NEW.event_type = 'focus_lost' THEN 1 ELSE 0 END,
        breaks_completed = focus_tracking_sessions.breaks_completed +
            CASE WHEN NEW.event_type = 'break_completed' THEN 1 ELSE 0 END,
        breaks_skipped = focus_tracking_sessions.breaks_skipped +
            CASE WHEN NEW.event_type = 'break_skipped' THEN 1 ELSE 0 END,
        ended_at = NEW.timestamp,
        total_duration_seconds = EXTRACT(EPOCH FROM (NEW.timestamp - focus_tracking_sessions.started_at)),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_focus_summary
    AFTER INSERT ON focus_tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION update_focus_summary();

-- 데이터 정리를 위한 함수 (30일 이상 오래된 이벤트 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_focus_events()
RETURNS void AS $$
BEGIN
    DELETE FROM focus_tracking_events
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 주석 추가
COMMENT ON TABLE focus_tracking_events IS '학생의 집중 추적 이벤트를 저장하는 테이블';
COMMENT ON TABLE student_focus_summary IS '학생별 집중도 요약 정보 (실시간 업데이트)';
COMMENT ON TABLE focus_tracking_sessions IS '학습 세션별 요약 정보';

COMMENT ON COLUMN focus_tracking_events.event_type IS '이벤트 타입 (focus_lost, focus_regained, idle_detected, break_started, break_completed, break_skipped)';
COMMENT ON COLUMN focus_tracking_events.metadata IS '추가 메타데이터 (JSON 형식): idleTime, breakDuration, breakActivityType, pageUrl, completed';
COMMENT ON COLUMN student_focus_summary.total_focus_time_seconds IS '총 집중 시간 (초)';
COMMENT ON COLUMN student_focus_summary.total_idle_time_seconds IS '총 비활동 시간 (초)';
COMMENT ON COLUMN student_focus_summary.average_break_duration_seconds IS '평균 휴식 시간 (초)';
