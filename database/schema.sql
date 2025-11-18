-- LMS Time Tracking Database Schema
-- 문제당 소비시간 기록을 위한 데이터베이스 스키마

-- Students table (학생 정보)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) UNIQUE NOT NULL,  -- LMS student ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems table (문제 정보)
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id VARCHAR(255) UNIQUE NOT NULL,  -- LMS problem ID
    module_id VARCHAR(255) NOT NULL,           -- LMS module/course ID
    title VARCHAR(500) NOT NULL,
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    problem_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problem attempts table (문제 시도 및 시간 추적)
CREATE TABLE IF NOT EXISTS problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,

    -- Time tracking fields (시간 추적 필드)
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER,  -- 총 소비 시간 (초)
    active_time_seconds INTEGER, -- 실제 활동 시간 (초)

    -- Attempt details (시도 상세 정보)
    attempt_number INTEGER NOT NULL DEFAULT 1,
    is_correct BOOLEAN,
    answer_data JSONB,  -- 학생의 답안

    -- Interaction tracking (상호작용 추적)
    interaction_count INTEGER DEFAULT 0,
    hint_requests INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) CHECK (status IN ('in_progress', 'submitted', 'abandoned')) DEFAULT 'in_progress',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, problem_id, attempt_number)
);

-- Time tracking events (상세 시간 추적 이벤트)
CREATE TABLE IF NOT EXISTS time_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES problem_attempts(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,  -- 'focus', 'blur', 'interaction', 'pause', 'resume'
    event_timestamp TIMESTAMP NOT NULL,
    event_data JSONB,  -- 추가 이벤트 데이터

    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics aggregation table (분석용 집계 테이블)
CREATE TABLE IF NOT EXISTS problem_time_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,

    -- Aggregated statistics (집계 통계)
    total_attempts INTEGER DEFAULT 0,
    avg_time_seconds INTEGER,
    median_time_seconds INTEGER,
    min_time_seconds INTEGER,
    max_time_seconds INTEGER,
    success_rate DECIMAL(5,2),  -- 정답률 (%)

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(problem_id, period_start, period_end)
);

-- Indexes for performance
CREATE INDEX idx_attempts_student ON problem_attempts(student_id);
CREATE INDEX idx_attempts_problem ON problem_attempts(problem_id);
CREATE INDEX idx_attempts_started ON problem_attempts(started_at);
CREATE INDEX idx_attempts_status ON problem_attempts(status);
CREATE INDEX idx_events_attempt ON time_tracking_events(attempt_id);
CREATE INDEX idx_events_timestamp ON time_tracking_events(event_timestamp);
CREATE INDEX idx_analytics_problem ON problem_time_analytics(problem_id);
CREATE INDEX idx_analytics_period ON problem_time_analytics(period_start, period_end);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attempts_updated_at BEFORE UPDATE ON problem_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
