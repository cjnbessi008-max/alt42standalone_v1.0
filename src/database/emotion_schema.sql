-- Emotion Tracking Database Schema
-- 학생 감정 데이터 추적을 위한 데이터베이스 스키마

-- 학생 감정 로그 테이블
CREATE TABLE IF NOT EXISTS emotion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID NOT NULL,
    emotion_type VARCHAR(50) NOT NULL CHECK (emotion_type IN (
        'happy', 'excited', 'neutral', 'confused',
        'frustrated', 'anxious', 'bored', 'engaged'
    )),
    emotion_intensity INTEGER NOT NULL CHECK (emotion_intensity BETWEEN 1 AND 10),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    context JSONB, -- 학습 컨텍스트 (문제 유형, 난이도 등)
    created_at TIMESTAMP DEFAULT NOW()
);

-- 시간대별 감정 집계 테이블 (성능 최적화를 위한 materialized view)
CREATE TABLE IF NOT EXISTS emotion_hourly_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    module_id UUID,
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    avg_emotion_intensity DECIMAL(3,2),
    emotion_volatility DECIMAL(5,2), -- 감정 기복 지표 (표준편차)
    emotion_distribution JSONB, -- 감정 유형별 분포
    sample_count INTEGER,
    date_range_start DATE,
    date_range_end DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 감정 변화 이벤트 테이블 (급격한 감정 변화 추적)
CREATE TABLE IF NOT EXISTS emotion_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    session_id UUID NOT NULL,
    from_emotion VARCHAR(50) NOT NULL,
    to_emotion VARCHAR(50) NOT NULL,
    intensity_delta INTEGER, -- 감정 강도 변화량
    timestamp TIMESTAMP NOT NULL,
    trigger_context JSONB, -- 감정 변화 유발 요인
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX idx_emotion_logs_student_time ON emotion_logs(student_id, timestamp DESC);
CREATE INDEX idx_emotion_logs_module_time ON emotion_logs(module_id, timestamp DESC);
CREATE INDEX idx_emotion_logs_timestamp ON emotion_logs(timestamp);
CREATE INDEX idx_emotion_hourly_student ON emotion_hourly_aggregates(student_id);
CREATE INDEX idx_emotion_hourly_hour ON emotion_hourly_aggregates(hour_of_day);
CREATE INDEX idx_emotion_change_student ON emotion_change_events(student_id, timestamp DESC);

-- 감정 기복 계산 함수
CREATE OR REPLACE FUNCTION calculate_emotion_volatility(
    p_student_id UUID,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
) RETURNS DECIMAL AS $$
DECLARE
    volatility DECIMAL;
BEGIN
    -- 표준편차를 사용하여 감정 기복 계산
    SELECT STDDEV(emotion_intensity)
    INTO volatility
    FROM emotion_logs
    WHERE student_id = p_student_id
    AND timestamp BETWEEN p_start_time AND p_end_time;

    RETURN COALESCE(volatility, 0);
END;
$$ LANGUAGE plpgsql;

-- 시간대별 감정 기복 집계 뷰
CREATE OR REPLACE VIEW emotion_volatility_by_hour AS
SELECT
    student_id,
    EXTRACT(HOUR FROM timestamp) AS hour_of_day,
    EXTRACT(DOW FROM timestamp) AS day_of_week,
    STDDEV(emotion_intensity) AS volatility,
    AVG(emotion_intensity) AS avg_intensity,
    COUNT(*) AS sample_count,
    MIN(timestamp) AS period_start,
    MAX(timestamp) AS period_end
FROM emotion_logs
GROUP BY student_id, EXTRACT(HOUR FROM timestamp), EXTRACT(DOW FROM timestamp);

-- 코멘트 추가
COMMENT ON TABLE emotion_logs IS '학생들의 학습 중 감정 상태를 실시간으로 기록하는 테이블';
COMMENT ON TABLE emotion_hourly_aggregates IS '시간대별 감정 데이터 집계 테이블 (분석 성능 최적화)';
COMMENT ON TABLE emotion_change_events IS '급격한 감정 변화 이벤트를 추적하는 테이블';
COMMENT ON FUNCTION calculate_emotion_volatility IS '특정 기간 동안의 학생 감정 기복을 계산하는 함수';
