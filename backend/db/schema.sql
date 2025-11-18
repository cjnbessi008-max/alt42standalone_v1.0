-- LMS Dropout Analysis Database Schema
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tables from main system (references)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Learning Sessions (학습 세션 추적)
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    dropout_point TEXT, -- 중단된 지점 (문제 ID, 섹션 등)
    total_duration_seconds INTEGER,
    active_duration_seconds INTEGER, -- 실제 활동 시간
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_module ON learning_sessions(module_id);
CREATE INDEX idx_sessions_started ON learning_sessions(started_at);

-- Learning Events (학습 활동 이벤트)
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- problem_view, answer_submit, hint_request, pause, navigation, etc.
    event_data JSONB, -- 이벤트 관련 추가 데이터
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    time_since_last_event_ms INTEGER
);

CREATE INDEX idx_events_session ON learning_events(session_id);
CREATE INDEX idx_events_timestamp ON learning_events(timestamp);
CREATE INDEX idx_events_type ON learning_events(event_type);

-- Problem Attempts (문제 시도 기록)
CREATE TABLE problem_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    problem_id VARCHAR(255) NOT NULL,
    problem_type VARCHAR(100), -- 문제 유형 (multiple_choice, short_answer, etc.)
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    attempt_number INTEGER NOT NULL DEFAULT 1, -- 동일 문제에 대한 시도 횟수
    answer_data JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attempts_session ON problem_attempts(session_id);
CREATE INDEX idx_attempts_problem ON problem_attempts(problem_id);

-- Dropout Analysis Results (분석 결과 캐시)
CREATE TABLE dropout_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE UNIQUE,
    primary_reason VARCHAR(100) NOT NULL,
    contributing_factors JSONB, -- [{reason: string, confidence: float, evidence: object}]
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recommendations JSONB, -- 교사를 위한 권장사항
    metrics JSONB, -- 세션의 주요 지표
    analyzed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dropout_session ON dropout_analysis(session_id);
CREATE INDEX idx_dropout_reason ON dropout_analysis(primary_reason);

-- Student Learning Profiles (학습자 프로필)
CREATE TABLE student_learning_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    dropout_sessions INTEGER DEFAULT 0,
    avg_session_duration_minutes FLOAT,
    preferred_time_of_day VARCHAR(20), -- morning, afternoon, evening, night
    avg_problems_per_session FLOAT,
    avg_accuracy_rate FLOAT,
    dropout_frequency FLOAT, -- 0-1 (중단 비율)
    strong_topics JSONB, -- [topic_ids]
    weak_topics JSONB, -- [topic_ids]
    common_dropout_reasons JSONB, -- [{reason: string, count: int}]
    engagement_trend VARCHAR(20), -- increasing, stable, decreasing
    last_session_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_student ON student_learning_profiles(student_id);
CREATE INDEX idx_profiles_engagement ON student_learning_profiles(engagement_trend);

-- Module Analytics (모듈별 집계 데이터)
CREATE TABLE module_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_sessions INTEGER DEFAULT 0,
    dropout_sessions INTEGER DEFAULT 0,
    dropout_rate FLOAT,
    avg_session_duration_minutes FLOAT,
    avg_completion_rate FLOAT,
    dropout_hotspots JSONB, -- [{location: string, count: int, reason: string}]
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, date)
);

CREATE INDEX idx_module_analytics_module ON module_analytics(module_id);
CREATE INDEX idx_module_analytics_date ON module_analytics(date);

-- Dropout Hotspots (중단 지점 핫스팟)
CREATE TABLE dropout_hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    location_identifier VARCHAR(255) NOT NULL, -- problem_id, section_id, etc.
    location_type VARCHAR(50), -- problem, section, concept
    dropout_count INTEGER DEFAULT 0,
    common_reason VARCHAR(100),
    avg_time_before_dropout_seconds INTEGER,
    severity_score FLOAT, -- 0-1 (심각도)
    last_occurred_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, location_identifier)
);

CREATE INDEX idx_hotspots_module ON dropout_hotspots(module_id);
CREATE INDEX idx_hotspots_severity ON dropout_hotspots(severity_score DESC);

-- Functions

-- 세션 종료 시 자동으로 프로필 업데이트
CREATE OR REPLACE FUNCTION update_student_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Student profile 업데이트
    INSERT INTO student_learning_profiles (student_id, total_sessions, last_session_at)
    VALUES (NEW.student_id, 1, NEW.ended_at)
    ON CONFLICT (student_id)
    DO UPDATE SET
        total_sessions = student_learning_profiles.total_sessions + 1,
        completed_sessions = CASE WHEN NEW.is_completed THEN student_learning_profiles.completed_sessions + 1 ELSE student_learning_profiles.completed_sessions END,
        dropout_sessions = CASE WHEN NOT NEW.is_completed AND NEW.ended_at IS NOT NULL THEN student_learning_profiles.dropout_sessions + 1 ELSE student_learning_profiles.dropout_sessions END,
        dropout_frequency = CASE WHEN student_learning_profiles.total_sessions + 1 > 0
                              THEN (CASE WHEN NOT NEW.is_completed AND NEW.ended_at IS NOT NULL THEN student_learning_profiles.dropout_sessions + 1 ELSE student_learning_profiles.dropout_sessions END)::FLOAT / (student_learning_profiles.total_sessions + 1)
                              ELSE 0 END,
        last_session_at = NEW.ended_at,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_profile
AFTER UPDATE OF ended_at ON learning_sessions
FOR EACH ROW
WHEN (NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL)
EXECUTE FUNCTION update_student_profile();

-- Sample data for testing
INSERT INTO students (id, name, email, grade_level) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Kim Min-soo', 'minso@example.com', 'Grade 3'),
    ('22222222-2222-2222-2222-222222222222', 'Lee Soo-jin', 'soojin@example.com', 'Grade 4'),
    ('33333333-3333-3333-3333-333333333333', 'Park Ji-hoon', 'jihoon@example.com', 'Grade 3');

INSERT INTO modules (id, name, description, subject, grade_level) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fractions Basics', 'Learn fraction concepts', 'mathematics', 'Grade 3'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Multiplication Master', 'Master multiplication tables', 'mathematics', 'Grade 3');

-- Comments
COMMENT ON TABLE learning_sessions IS '학습 세션 추적 - 학생의 각 학습 활동을 기록';
COMMENT ON TABLE learning_events IS '학습 이벤트 - 세션 내 모든 상호작용 추적';
COMMENT ON TABLE problem_attempts IS '문제 시도 - 각 문제에 대한 학생의 답변 기록';
COMMENT ON TABLE dropout_analysis IS 'Dropout 분석 결과 - 세션별 중단 이유 분석';
COMMENT ON TABLE student_learning_profiles IS '학습자 프로필 - 학생별 학습 패턴 및 성향';
COMMENT ON TABLE module_analytics IS '모듈 분석 - 모듈별 일일 집계 데이터';
COMMENT ON TABLE dropout_hotspots IS 'Dropout 핫스팟 - 중단이 자주 발생하는 지점';
