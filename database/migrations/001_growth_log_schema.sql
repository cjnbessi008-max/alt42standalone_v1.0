-- Migration: 001 - Growth Log and LMS Integration Schema
-- Description: 오답을 '실패'가 아닌 '성장로그'로 기록하는 시스템 구현
-- Created: 2025-11-18
-- Author: AI Development Team

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- 학생 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    enrolled_modules UUID[],

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 모듈 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID,
    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 2. GROWTH LOG SYSTEM
-- =============================================================================

-- 학습 세션 테이블
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- 세션 정보
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_duration_seconds INTEGER,

    -- 세션 요약
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    growth_moments INTEGER DEFAULT 0,  -- 성장이 관찰된 순간의 수

    -- 세션 성장 지표
    session_growth_score DECIMAL(5,2),
    engagement_level VARCHAR(20) CHECK (
        engagement_level IN ('high', 'medium', 'low')
    ),

    -- 학습 패턴
    learning_pattern VARCHAR(50),
    breakthrough_moments JSONB,

    -- LMS 연동
    synced_to_lms BOOLEAN DEFAULT FALSE,
    lms_session_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 성장로그 테이블 (기존 student_attempts를 대체)
CREATE TABLE growth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,

    -- 학생 답안 정보
    student_answer JSONB NOT NULL,
    expected_answer JSONB NOT NULL,

    -- 성장 지표 (Growth Indicators)
    is_correct BOOLEAN NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    improvement_from_previous JSONB,

    -- 학습 과정 분석
    thinking_process JSONB,
    time_spent_seconds INTEGER NOT NULL,
    interaction_pattern JSONB,
    hints_used INTEGER DEFAULT 0,
    resources_accessed TEXT[],

    -- 성장 카테고리
    growth_category VARCHAR(50) NOT NULL DEFAULT 'concept_exploration' CHECK (
        growth_category IN (
            'first_success',
            'persistent_learning',
            'concept_exploration',
            'partial_understanding',
            'misconception_identified',
            'strategy_refinement'
        )
    ),

    -- 성장 점수 (Growth Score)
    growth_score DECIMAL(5,2) CHECK (growth_score >= 0 AND growth_score <= 100),
    effort_score DECIMAL(5,2) CHECK (effort_score >= 0 AND effort_score <= 100),
    progress_score DECIMAL(5,2) CHECK (progress_score >= 0 AND progress_score <= 100),

    -- 피드백 및 코멘트
    ai_feedback TEXT,
    teacher_comment TEXT,
    self_reflection TEXT,

    -- 다음 학습 추천
    next_steps JSONB,
    recommended_resources JSONB,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced_to_lms BOOLEAN DEFAULT FALSE,
    lms_sync_at TIMESTAMP
);

-- 성장 마일스톤 테이블
CREATE TABLE growth_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- 마일스톤 정보
    milestone_type VARCHAR(50) NOT NULL CHECK (
        milestone_type IN (
            'concept_mastery',
            'persistent_effort',
            'creative_approach',
            'error_learning',
            'helping_others',
            'self_correction'
        )
    ),

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB,

    -- 축하 메시지
    celebration_message TEXT,
    badge_earned VARCHAR(100),

    -- 공유 및 가시성
    is_shared_with_teacher BOOLEAN DEFAULT TRUE,
    is_shared_with_parents BOOLEAN DEFAULT FALSE,
    teacher_acknowledgment TEXT,

    achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    synced_to_lms BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 3. LMS INTEGRATION TABLES
-- =============================================================================

-- LMS 연동 설정 테이블
CREATE TABLE lms_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS 정보
    lms_provider VARCHAR(50) NOT NULL CHECK (
        lms_provider IN ('canvas', 'moodle', 'blackboard', 'google_classroom', 'custom')
    ),
    lms_instance_url VARCHAR(500) NOT NULL,

    -- 인증 정보 (암호화 저장)
    auth_type VARCHAR(50) NOT NULL CHECK (
        auth_type IN ('oauth2', 'api_key', 'lti', 'basic_auth')
    ),
    auth_credentials_encrypted TEXT NOT NULL,

    -- 매핑 설정
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    lms_course_id VARCHAR(255),
    lms_assignment_id VARCHAR(255),

    -- 동기화 설정
    sync_frequency VARCHAR(20) DEFAULT 'real_time' CHECK (
        sync_frequency IN ('real_time', 'hourly', 'daily', 'manual')
    ),
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (
        sync_direction IN ('push', 'pull', 'bidirectional')
    ),

    -- 필드 매핑
    field_mapping JSONB,

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(20) CHECK (
        last_sync_status IN ('success', 'failed', 'partial', 'pending')
    ),
    last_sync_error TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 유니크 제약: 동일 모듈에 대해 동일 LMS 인스턴스는 하나만
    UNIQUE(module_id, lms_provider, lms_instance_url)
);

-- LMS 동기화 로그 테이블
CREATE TABLE lms_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lms_integration_id UUID NOT NULL REFERENCES lms_integration(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL CHECK (
        sync_type IN ('growth_log', 'milestone', 'session', 'full')
    ),

    -- 동기화 상세
    records_processed INTEGER DEFAULT 0,
    records_succeeded INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    error_details JSONB,

    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('running', 'completed', 'failed', 'cancelled')
    ),

    -- 동기화된 데이터 참조
    synced_record_ids UUID[]
);

-- =============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Growth Logs Indexes
CREATE INDEX idx_growth_logs_student ON growth_logs(student_id);
CREATE INDEX idx_growth_logs_module ON growth_logs(module_id);
CREATE INDEX idx_growth_logs_session ON growth_logs(session_id);
CREATE INDEX idx_growth_logs_category ON growth_logs(growth_category);
CREATE INDEX idx_growth_logs_sync ON growth_logs(synced_to_lms, lms_sync_at);
CREATE INDEX idx_growth_logs_created ON growth_logs(created_at DESC);
CREATE INDEX idx_growth_logs_correct ON growth_logs(is_correct, student_id);

-- Learning Sessions Indexes
CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_learning_sessions_module ON learning_sessions(module_id);
CREATE INDEX idx_learning_sessions_started ON learning_sessions(started_at DESC);
CREATE INDEX idx_learning_sessions_sync ON learning_sessions(synced_to_lms);

-- Growth Milestones Indexes
CREATE INDEX idx_growth_milestones_student ON growth_milestones(student_id);
CREATE INDEX idx_growth_milestones_module ON growth_milestones(module_id);
CREATE INDEX idx_growth_milestones_type ON growth_milestones(milestone_type);
CREATE INDEX idx_growth_milestones_achieved ON growth_milestones(achieved_at DESC);

-- LMS Integration Indexes
CREATE INDEX idx_lms_integration_module ON lms_integration(module_id);
CREATE INDEX idx_lms_integration_active ON lms_integration(is_active);
CREATE INDEX idx_lms_integration_provider ON lms_integration(lms_provider);

-- LMS Sync Log Indexes
CREATE INDEX idx_lms_sync_log_integration ON lms_sync_log(lms_integration_id);
CREATE INDEX idx_lms_sync_log_status ON lms_sync_log(status, started_at);
CREATE INDEX idx_lms_sync_log_type ON lms_sync_log(sync_type);

-- =============================================================================
-- 5. TRIGGERS FOR AUTO-UPDATE
-- =============================================================================

-- 자동으로 updated_at 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON learning_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_logs_updated_at BEFORE UPDATE ON growth_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_integration_updated_at BEFORE UPDATE ON lms_integration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. VIEWS FOR COMMON QUERIES
-- =============================================================================

-- 학생별 성장 요약 뷰
CREATE OR REPLACE VIEW student_growth_summary AS
SELECT
    s.id AS student_id,
    s.name AS student_name,
    m.id AS module_id,
    m.name AS module_name,
    COUNT(gl.id) AS total_attempts,
    SUM(CASE WHEN gl.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
    ROUND(AVG(gl.growth_score)::numeric, 2) AS avg_growth_score,
    ROUND(AVG(gl.effort_score)::numeric, 2) AS avg_effort_score,
    COUNT(DISTINCT gl.session_id) AS total_sessions,
    SUM(gl.time_spent_seconds) AS total_time_spent,
    COUNT(gm.id) AS milestones_achieved,
    MAX(gl.created_at) AS last_activity
FROM students s
LEFT JOIN growth_logs gl ON s.id = gl.student_id
LEFT JOIN modules m ON gl.module_id = m.id
LEFT JOIN growth_milestones gm ON s.id = gm.student_id AND m.id = gm.module_id
GROUP BY s.id, s.name, m.id, m.name;

-- 모듈별 성장 통계 뷰
CREATE OR REPLACE VIEW module_growth_stats AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    COUNT(DISTINCT gl.student_id) AS unique_students,
    COUNT(gl.id) AS total_attempts,
    ROUND(AVG(gl.growth_score)::numeric, 2) AS avg_growth_score,
    ROUND(AVG(gl.time_spent_seconds)::numeric, 0) AS avg_time_per_attempt,
    COUNT(gm.id) AS total_milestones,
    MAX(gl.created_at) AS last_activity
FROM modules m
LEFT JOIN growth_logs gl ON m.id = gl.module_id
LEFT JOIN growth_milestones gm ON m.id = gm.module_id
GROUP BY m.id, m.name;

-- LMS 동기화 상태 뷰
CREATE OR REPLACE VIEW lms_sync_status AS
SELECT
    li.id AS integration_id,
    li.lms_provider,
    m.name AS module_name,
    li.is_active,
    li.last_sync_at,
    li.last_sync_status,
    COUNT(gl.id) FILTER (WHERE gl.synced_to_lms = FALSE) AS pending_growth_logs,
    COUNT(gm.id) FILTER (WHERE gm.synced_to_lms = FALSE) AS pending_milestones,
    (SELECT COUNT(*) FROM lms_sync_log WHERE lms_integration_id = li.id AND status = 'failed') AS failed_syncs_count
FROM lms_integration li
LEFT JOIN modules m ON li.module_id = m.id
LEFT JOIN growth_logs gl ON m.id = gl.module_id AND li.is_active = TRUE
LEFT JOIN growth_milestones gm ON m.id = gm.module_id AND li.is_active = TRUE
GROUP BY li.id, li.lms_provider, m.name, li.is_active, li.last_sync_at, li.last_sync_status;

-- =============================================================================
-- 7. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =============================================================================

-- 샘플 학생 데이터
INSERT INTO students (name, email, grade_level) VALUES
('김민준', 'minjun@example.com', '3학년'),
('이서윤', 'seoyun@example.com', '3학년'),
('박지호', 'jiho@example.com', '4학년')
ON CONFLICT DO NOTHING;

-- 샘플 모듈 데이터
INSERT INTO modules (name, description, subject, grade_level) VALUES
('분수 학습', '3학년 학생들을 위한 분수 덧셈과 뺄셈 학습 모듈', 'mathematics', '3학년'),
('곱셈구구', '2-4학년을 위한 곱셈구구 연습 모듈', 'mathematics', '2-4학년')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE growth_logs IS '학생의 학습 과정을 성장 중심으로 기록하는 테이블. 오답을 실패가 아닌 학습 기회로 추적';
COMMENT ON COLUMN growth_logs.growth_category IS '성장 카테고리: 학생의 시도가 어떤 유형의 학습인지 분류';
COMMENT ON COLUMN growth_logs.growth_score IS '성장 점수: 정답 여부와 무관하게 학습 과정에서 보여준 성장 정도';
COMMENT ON COLUMN growth_logs.ai_feedback IS 'AI가 생성한 성장 중심 피드백 메시지';

COMMENT ON TABLE learning_sessions IS '학생의 학습 세션을 그룹화하여 추적. 한 번의 학습 시간 동안의 전체적인 성장 패턴 분석';
COMMENT ON TABLE growth_milestones IS '학생이 달성한 주요 성장 마일스톤 기록. 축하와 동기부여 목적';
COMMENT ON TABLE lms_integration IS 'LMS(Canvas, Moodle 등)와의 연동 설정 및 상태 관리';
COMMENT ON TABLE lms_sync_log IS 'LMS 동기화 작업의 이력 및 결과 추적';

-- =============================================================================
-- 9. COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Migration 001: Growth Log Schema - 완료';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '  - students (학생)';
    RAISE NOTICE '  - modules (모듈)';
    RAISE NOTICE '  - learning_sessions (학습 세션)';
    RAISE NOTICE '  - growth_logs (성장로그)';
    RAISE NOTICE '  - growth_milestones (성장 마일스톤)';
    RAISE NOTICE '  - lms_integration (LMS 연동)';
    RAISE NOTICE '  - lms_sync_log (LMS 동기화 로그)';
    RAISE NOTICE '';
    RAISE NOTICE '생성된 뷰:';
    RAISE NOTICE '  - student_growth_summary (학생별 성장 요약)';
    RAISE NOTICE '  - module_growth_stats (모듈별 성장 통계)';
    RAISE NOTICE '  - lms_sync_status (LMS 동기화 상태)';
    RAISE NOTICE '=================================================================';
END $$;
