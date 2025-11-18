-- ============================================================================
-- Database Migration: LMS Integration & Focus Intensity Feature
-- ============================================================================
-- Related Spec: 0002-lms-focus-intensity-feature-spec.md
-- Version: 1.0.0
-- Created: 2025-11-18
-- ============================================================================

-- ============================================================================
-- SECTION 1: 집중 강도 (Focus Intensity) 테이블
-- ============================================================================

-- 1.1 집중 강도 레벨 설정 테이블
CREATE TABLE IF NOT EXISTS focus_intensity_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL, -- REFERENCES modules(id) - 향후 modules 테이블 생성 시 FK 추가
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),

    -- 시간 설정
    time_limit_seconds INTEGER,
    show_timer BOOLEAN DEFAULT TRUE,
    timer_urgency_threshold INTEGER DEFAULT 30, -- 남은 시간이 이 비율 이하일 때 긴박감 표시 (%)

    -- 힌트 설정
    hints_available INTEGER DEFAULT 0,
    hint_delay_seconds INTEGER DEFAULT 0,
    show_solution BOOLEAN DEFAULT FALSE,

    -- UI 설정
    ui_complexity VARCHAR(20) DEFAULT 'standard' CHECK (ui_complexity IN ('minimal', 'standard', 'rich')),
    distraction_level VARCHAR(20) DEFAULT 'low' CHECK (distraction_level IN ('none', 'low', 'medium')),
    background_color VARCHAR(7) DEFAULT '#F5F5F5',
    animation_speed DECIMAL(3,2) DEFAULT 1.0 CHECK (animation_speed BETWEEN 0 AND 2),

    -- 피드백 설정
    immediate_feedback BOOLEAN DEFAULT TRUE,
    feedback_detail VARCHAR(20) DEFAULT 'detailed' CHECK (feedback_detail IN ('minimal', 'detailed', 'comprehensive')),
    encouragement_frequency INTEGER DEFAULT 3, -- N개 문제마다 격려 메시지

    -- 음향 설정 (선택적)
    sound_enabled BOOLEAN DEFAULT FALSE,
    background_music VARCHAR(20) DEFAULT 'none' CHECK (background_music IN ('none', 'ambient', 'focus')),
    sound_effects BOOLEAN DEFAULT FALSE,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID, -- teacher_id

    UNIQUE(module_id, level)
);

-- 인덱스
CREATE INDEX idx_focus_levels_module ON focus_intensity_levels(module_id);
CREATE INDEX idx_focus_levels_level ON focus_intensity_levels(level);

-- 코멘트
COMMENT ON TABLE focus_intensity_levels IS '모듈별 집중 강도 레벨 설정 (1-5단계)';
COMMENT ON COLUMN focus_intensity_levels.level IS '집중 강도 레벨: 1=Relaxed, 2=Comfortable, 3=Engaged, 4=Challenged, 5=Peak Focus';
COMMENT ON COLUMN focus_intensity_levels.time_limit_seconds IS '문제당 제한 시간 (초), NULL이면 무제한';
COMMENT ON COLUMN focus_intensity_levels.hints_available IS '사용 가능한 힌트 개수';
COMMENT ON COLUMN focus_intensity_levels.ui_complexity IS 'UI 복잡도: minimal(최소), standard(표준), rich(풍부)';

-- ============================================================================

-- 1.2 학생별 집중 강도 세션 추적 테이블
CREATE TABLE IF NOT EXISTS student_focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL, -- REFERENCES students(id)
    module_id UUID NOT NULL, -- REFERENCES modules(id)
    problem_id UUID NOT NULL, -- 동적 테이블의 문제 ID (module별로 테이블이 다름)

    -- 집중 강도 정보
    focus_intensity_level INTEGER NOT NULL CHECK (focus_intensity_level BETWEEN 1 AND 5),
    previous_level INTEGER CHECK (previous_level BETWEEN 1 AND 5), -- 이전 레벨 (변화 추적용)
    auto_adjusted BOOLEAN DEFAULT TRUE, -- 자동 조절 여부
    adjustment_reason VARCHAR(100), -- 조절 이유: 'high_accuracy', 'consecutive_correct', 'slow_response', 'manual_override' 등

    -- 문제 정보
    problem_difficulty INTEGER CHECK (problem_difficulty BETWEEN 1 AND 5), -- 문제 난이도
    problem_type VARCHAR(50), -- 문제 유형 (module에 따라 다름)

    -- 문제 풀이 결과
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    solution_viewed BOOLEAN DEFAULT FALSE,

    -- 성과 지표
    response_time_ratio DECIMAL(4,2), -- 실제 시간 / 예상 시간
    recent_accuracy_rate DECIMAL(3,2), -- 최근 5개 문제 정답률 (조정 시점의 값)
    consecutive_correct INTEGER DEFAULT 0, -- 연속 정답 수
    consecutive_incorrect INTEGER DEFAULT 0, -- 연속 오답 수

    -- UI 설정 스냅샷 (분석용)
    ui_settings JSONB, -- 해당 세션의 UI 설정 전체 저장

    -- 타임스탬프
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    session_duration_seconds INTEGER GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER) STORED
);

-- 인덱스
CREATE INDEX idx_student_focus_student_module ON student_focus_sessions(student_id, module_id);
CREATE INDEX idx_student_focus_level ON student_focus_sessions(focus_intensity_level);
CREATE INDEX idx_student_focus_completed ON student_focus_sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_student_focus_adjustment ON student_focus_sessions(auto_adjusted, adjustment_reason);

-- 코멘트
COMMENT ON TABLE student_focus_sessions IS '학생별 문제 풀이 시 집중 강도 추적';
COMMENT ON COLUMN student_focus_sessions.adjustment_reason IS '조절 이유: high_accuracy, low_accuracy, consecutive_correct, consecutive_incorrect, slow_response, fast_response, manual_override';
COMMENT ON COLUMN student_focus_sessions.response_time_ratio IS '1.0 = 예상 시간, 0.5 = 예상보다 2배 빠름, 2.0 = 예상보다 2배 느림';

-- ============================================================================
-- SECTION 2: LMS 통합 테이블
-- ============================================================================

-- 2.1 LMS 연동 설정 테이블
CREATE TABLE IF NOT EXISTS lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS 정보
    lms_platform VARCHAR(50) NOT NULL CHECK (lms_platform IN ('canvas', 'moodle', 'google_classroom', 'blackboard', 'other')),
    lms_instance_url VARCHAR(255) NOT NULL, -- LMS 인스턴스 URL (예: https://kaist.instructure.com)
    lms_course_id VARCHAR(100), -- LMS의 코스 ID
    lms_course_name VARCHAR(255), -- LMS 코스 이름 (캐시)

    -- LTI 1.3 설정
    client_id VARCHAR(255) NOT NULL,
    deployment_id VARCHAR(255),
    auth_token_url VARCHAR(255) NOT NULL,
    auth_login_url VARCHAR(255) NOT NULL,
    keyset_url VARCHAR(255) NOT NULL, -- JWKS URL

    -- 연동 모듈
    module_id UUID NOT NULL, -- REFERENCES modules(id)

    -- 동기화 설정
    sync_grades BOOLEAN DEFAULT TRUE,
    sync_roster BOOLEAN DEFAULT TRUE, -- 학생 명단 동기화
    grade_sync_mode VARCHAR(20) DEFAULT 'realtime' CHECK (grade_sync_mode IN ('realtime', 'batch')),
    batch_sync_interval_minutes INTEGER DEFAULT 60, -- 배치 모드일 때 동기화 주기 (분)

    -- 보안
    public_key TEXT, -- LMS의 공개 키
    private_key_encrypted TEXT, -- 우리 시스템의 비밀 키 (AES-256 암호화)
    shared_secret_encrypted TEXT, -- LTI 1.1 호환용 (선택적)

    -- 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'testing')),
    last_sync_at TIMESTAMP,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID, -- teacher_id

    UNIQUE(lms_platform, lms_instance_url, lms_course_id, module_id)
);

-- 인덱스
CREATE INDEX idx_lms_integrations_module ON lms_integrations(module_id);
CREATE INDEX idx_lms_integrations_platform ON lms_integrations(lms_platform);
CREATE INDEX idx_lms_integrations_status ON lms_integrations(status);
CREATE INDEX idx_lms_integrations_sync ON lms_integrations(last_sync_at) WHERE sync_grades = TRUE;

-- 코멘트
COMMENT ON TABLE lms_integrations IS 'LMS와의 연동 설정 (LTI 1.3)';
COMMENT ON COLUMN lms_integrations.grade_sync_mode IS 'realtime: 문제 풀 때마다 즉시 동기화, batch: 주기적으로 일괄 동기화';

-- ============================================================================

-- 2.2 LMS 성적 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS lms_grade_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL, -- REFERENCES lms_integrations(id)
    student_id UUID NOT NULL, -- REFERENCES students(id)

    -- 동기화 데이터
    score DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100), -- 0-100 점수
    completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
    max_score DECIMAL(5,2) DEFAULT 100, -- 만점

    -- LMS 응답 데이터
    lms_lineitem_id VARCHAR(255), -- LMS의 Grade Book Item ID
    lms_response_status INTEGER, -- HTTP 상태 코드
    lms_response_body TEXT, -- LMS API 응답 (디버깅용)

    -- 동기화 결과
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('success', 'failed', 'pending', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- 타임스탬프
    synced_at TIMESTAMP DEFAULT NOW(),
    next_retry_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_grade_sync_integration_student ON lms_grade_sync_log(integration_id, student_id);
CREATE INDEX idx_grade_sync_status ON lms_grade_sync_log(sync_status, synced_at);
CREATE INDEX idx_grade_sync_retry ON lms_grade_sync_log(next_retry_at) WHERE sync_status = 'retrying';

-- 코멘트
COMMENT ON TABLE lms_grade_sync_log IS 'LMS 성적 동기화 이력 로그';
COMMENT ON COLUMN lms_grade_sync_log.score IS '0-100 점수 (LMS로 전송된 값)';

-- ============================================================================

-- 2.3 LMS 사용자 매핑 테이블
CREATE TABLE IF NOT EXISTS lms_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 우리 시스템 사용자
    user_id UUID NOT NULL, -- students 또는 teachers 테이블의 id
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'teacher')),

    -- LMS 사용자
    lms_platform VARCHAR(50) NOT NULL,
    lms_instance_url VARCHAR(255) NOT NULL,
    lms_user_id VARCHAR(255) NOT NULL, -- LMS의 사용자 ID
    lms_user_email VARCHAR(255),
    lms_user_name VARCHAR(255),
    lms_user_roles TEXT[], -- LMS에서의 역할 (배열)

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,

    UNIQUE(lms_platform, lms_instance_url, lms_user_id)
);

-- 인덱스
CREATE INDEX idx_lms_user_mapping_user ON lms_user_mappings(user_id, user_type);
CREATE INDEX idx_lms_user_mapping_lms ON lms_user_mappings(lms_platform, lms_user_id);

-- 코멘트
COMMENT ON TABLE lms_user_mappings IS 'LMS 사용자와 우리 시스템 사용자 간 매핑';

-- ============================================================================
-- SECTION 3: 기존 테이블 확장 (Migration)
-- ============================================================================

-- 3.1 student_attempts 테이블 확장
-- Note: student_attempts 테이블이 아직 없으면 이 부분은 주석 처리하고 나중에 실행

-- ALTER TABLE student_attempts
--     ADD COLUMN IF NOT EXISTS focus_intensity_level INTEGER CHECK (focus_intensity_level BETWEEN 1 AND 5),
--     ADD COLUMN IF NOT EXISTS ui_settings JSONB;

-- COMMENT ON COLUMN student_attempts.focus_intensity_level IS '문제 풀이 시 적용된 집중 강도 레벨';
-- COMMENT ON COLUMN student_attempts.ui_settings IS '문제 풀이 시 UI 설정 스냅샷';

-- ============================================================================

-- 3.2 students 테이블 확장
-- Note: students 테이블이 아직 없으면 이 부분은 주석 처리하고 나중에 실행

-- ALTER TABLE students
--     ADD COLUMN IF NOT EXISTS lms_user_id VARCHAR(255),
--     ADD COLUMN IF NOT EXISTS lms_platform VARCHAR(50),
--     ADD COLUMN IF NOT EXISTS optimal_focus_level INTEGER DEFAULT 3 CHECK (optimal_focus_level BETWEEN 1 AND 5),
--     ADD COLUMN IF NOT EXISTS focus_auto_adjust BOOLEAN DEFAULT TRUE,
--     ADD COLUMN IF NOT EXISTS focus_preferences JSONB;

-- CREATE INDEX IF NOT EXISTS idx_students_lms_user ON students(lms_platform, lms_user_id);

-- COMMENT ON COLUMN students.lms_user_id IS 'LMS의 사용자 ID (통합 시)';
-- COMMENT ON COLUMN students.lms_platform IS 'LMS 플랫폼 (canvas, moodle 등)';
-- COMMENT ON COLUMN students.optimal_focus_level IS 'AI가 추천한 최적 집중 강도 (1-5)';
-- COMMENT ON COLUMN students.focus_auto_adjust IS '집중 강도 자동 조절 활성화 여부';

-- ============================================================================
-- SECTION 4: 트리거 및 함수
-- ============================================================================

-- 4.1 모듈 생성 시 기본 집중 강도 레벨 자동 생성
CREATE OR REPLACE FUNCTION create_default_focus_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- 레벨 1: Relaxed (편안함)
    INSERT INTO focus_intensity_levels (
        module_id, level, time_limit_seconds, hints_available,
        show_timer, background_color, ui_complexity, feedback_detail
    ) VALUES (
        NEW.id, 1, 300, 3,
        FALSE, '#E3F2FD', 'rich', 'comprehensive'
    );

    -- 레벨 2: Comfortable (여유)
    INSERT INTO focus_intensity_levels (
        module_id, level, time_limit_seconds, hints_available,
        show_timer, background_color, ui_complexity, feedback_detail
    ) VALUES (
        NEW.id, 2, 240, 2,
        FALSE, '#FFF3E0', 'standard', 'detailed'
    );

    -- 레벨 3: Engaged (집중)
    INSERT INTO focus_intensity_levels (
        module_id, level, time_limit_seconds, hints_available,
        show_timer, background_color, ui_complexity, feedback_detail
    ) VALUES (
        NEW.id, 3, 180, 1,
        TRUE, '#F5F5F5', 'standard', 'detailed'
    );

    -- 레벨 4: Challenged (도전)
    INSERT INTO focus_intensity_levels (
        module_id, level, time_limit_seconds, hints_available,
        show_timer, background_color, ui_complexity, feedback_detail
    ) VALUES (
        NEW.id, 4, 120, 0,
        TRUE, '#E0E0E0', 'minimal', 'minimal'
    );

    -- 레벨 5: Peak Focus (최고 집중)
    INSERT INTO focus_intensity_levels (
        module_id, level, time_limit_seconds, hints_available,
        show_timer, background_color, ui_complexity, feedback_detail
    ) VALUES (
        NEW.id, 5, 90, 0,
        TRUE, '#FAFAFA', 'minimal', 'minimal'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: modules 테이블에 새 모듈 생성 시 자동으로 집중 강도 레벨 생성
-- Note: modules 테이블이 생성되면 주석 해제
-- CREATE TRIGGER create_module_focus_levels
--     AFTER INSERT ON modules
--     FOR EACH ROW
--     EXECUTE FUNCTION create_default_focus_levels();

COMMENT ON FUNCTION create_default_focus_levels() IS '새 모듈 생성 시 기본 집중 강도 레벨 5단계를 자동으로 생성';

-- ============================================================================

-- 4.2 updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- focus_intensity_levels 테이블에 트리거 적용
CREATE TRIGGER update_focus_intensity_levels_updated_at
    BEFORE UPDATE ON focus_intensity_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- lms_integrations 테이블에 트리거 적용
CREATE TRIGGER update_lms_integrations_updated_at
    BEFORE UPDATE ON lms_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: 뷰 (Views)
-- ============================================================================

-- 5.1 학생별 집중 강도 성과 분석 뷰
CREATE OR REPLACE VIEW v_student_focus_performance AS
SELECT
    sfs.student_id,
    sfs.module_id,
    sfs.focus_intensity_level,
    COUNT(*) AS total_attempts,
    AVG(CASE WHEN sfs.is_correct THEN 1.0 ELSE 0.0 END) AS accuracy_rate,
    AVG(sfs.time_spent_seconds) AS avg_time_spent,
    AVG(sfs.response_time_ratio) AS avg_response_ratio,
    AVG(sfs.hints_used) AS avg_hints_used,
    COUNT(CASE WHEN sfs.is_correct THEN 1 END) AS correct_count,
    COUNT(CASE WHEN NOT sfs.is_correct THEN 1 END) AS incorrect_count
FROM student_focus_sessions sfs
WHERE sfs.completed_at IS NOT NULL
GROUP BY sfs.student_id, sfs.module_id, sfs.focus_intensity_level;

COMMENT ON VIEW v_student_focus_performance IS '학생별, 모듈별, 집중 강도 레벨별 성과 분석';

-- ============================================================================

-- 5.2 LMS 동기화 상태 대시보드 뷰
CREATE OR REPLACE VIEW v_lms_sync_dashboard AS
SELECT
    li.id AS integration_id,
    li.lms_platform,
    li.lms_course_name,
    li.module_id,
    li.status AS integration_status,
    li.last_sync_at,
    COUNT(DISTINCT gsl.student_id) AS total_students_synced,
    COUNT(CASE WHEN gsl.sync_status = 'success' THEN 1 END) AS successful_syncs,
    COUNT(CASE WHEN gsl.sync_status = 'failed' THEN 1 END) AS failed_syncs,
    COUNT(CASE WHEN gsl.sync_status = 'pending' THEN 1 END) AS pending_syncs,
    MAX(gsl.synced_at) AS last_grade_sync_at
FROM lms_integrations li
LEFT JOIN lms_grade_sync_log gsl ON li.id = gsl.integration_id
GROUP BY li.id, li.lms_platform, li.lms_course_name, li.module_id, li.status, li.last_sync_at;

COMMENT ON VIEW v_lms_sync_dashboard IS 'LMS 통합 및 동기화 상태 대시보드';

-- ============================================================================

-- 5.3 실시간 집중 강도 모니터링 뷰 (교사용)
CREATE OR REPLACE VIEW v_realtime_focus_monitoring AS
SELECT
    sfs.student_id,
    sfs.module_id,
    sfs.focus_intensity_level,
    sfs.problem_id,
    sfs.started_at,
    EXTRACT(EPOCH FROM (NOW() - sfs.started_at))::INTEGER AS elapsed_seconds,
    sfs.recent_accuracy_rate,
    sfs.consecutive_correct,
    sfs.consecutive_incorrect,
    fil.time_limit_seconds,
    CASE
        WHEN sfs.completed_at IS NULL THEN 'active'
        ELSE 'completed'
    END AS session_status
FROM student_focus_sessions sfs
JOIN focus_intensity_levels fil
    ON sfs.module_id = fil.module_id
    AND sfs.focus_intensity_level = fil.level
WHERE sfs.started_at >= NOW() - INTERVAL '1 hour' -- 최근 1시간
ORDER BY sfs.started_at DESC;

COMMENT ON VIEW v_realtime_focus_monitoring IS '교사용 실시간 학생 집중 강도 모니터링';

-- ============================================================================
-- SECTION 6: 초기 데이터 (Seed Data)
-- ============================================================================

-- 6.1 기본 LMS 플랫폼 설정 (참고용 - 실제 연동 시 교사가 입력)
-- Note: 실제 프로덕션에서는 이 데이터를 입력하지 않고, 교사가 UI를 통해 설정

-- ============================================================================
-- SECTION 7: 권한 설정 (Grants)
-- ============================================================================

-- Note: 실제 사용자 역할에 맞게 조정 필요

-- 교사 역할: 집중 강도 레벨 읽기/쓰기, LMS 통합 설정
-- GRANT SELECT, INSERT, UPDATE ON focus_intensity_levels TO role_teacher;
-- GRANT SELECT, INSERT, UPDATE ON lms_integrations TO role_teacher;
-- GRANT SELECT ON v_student_focus_performance TO role_teacher;
-- GRANT SELECT ON v_lms_sync_dashboard TO role_teacher;
-- GRANT SELECT ON v_realtime_focus_monitoring TO role_teacher;

-- 학생 역할: 집중 강도 레벨 읽기, 자신의 세션 읽기
-- GRANT SELECT ON focus_intensity_levels TO role_student;
-- GRANT SELECT ON student_focus_sessions TO role_student; -- Row-level security 적용 필요
-- GRANT SELECT ON v_student_focus_performance TO role_student; -- Row-level security 적용 필요

-- 시스템/API 역할: 모든 테이블 읽기/쓰기
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO role_api_service;

-- ============================================================================
-- SECTION 8: Row-Level Security (RLS)
-- ============================================================================

-- 8.1 학생은 자신의 데이터만 볼 수 있도록
-- Note: PostgreSQL Row-Level Security 활성화 시 사용

-- ALTER TABLE student_focus_sessions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY student_focus_sessions_student_policy ON student_focus_sessions
--     FOR SELECT
--     TO role_student
--     USING (student_id = current_setting('app.current_user_id')::UUID);

-- ============================================================================
-- SECTION 9: 인덱스 최적화 (추가)
-- ============================================================================

-- 9.1 복합 인덱스 (쿼리 성능 최적화)
CREATE INDEX idx_focus_sessions_student_module_completed
    ON student_focus_sessions(student_id, module_id, completed_at DESC);

CREATE INDEX idx_focus_sessions_level_accuracy
    ON student_focus_sessions(focus_intensity_level, is_correct);

CREATE INDEX idx_grade_sync_integration_status_time
    ON lms_grade_sync_log(integration_id, sync_status, synced_at DESC);

-- 9.2 부분 인덱스 (Partial Indexes)
CREATE INDEX idx_focus_sessions_active
    ON student_focus_sessions(student_id, module_id)
    WHERE completed_at IS NULL;

CREATE INDEX idx_lms_integrations_active
    ON lms_integrations(module_id)
    WHERE status = 'active';

-- ============================================================================
-- SECTION 10: 분석용 함수
-- ============================================================================

-- 10.1 학생별 최적 집중 강도 계산 함수
CREATE OR REPLACE FUNCTION calculate_optimal_focus_level(p_student_id UUID, p_module_id UUID)
RETURNS INTEGER AS $$
DECLARE
    optimal_level INTEGER;
BEGIN
    -- 각 레벨별 정답률과 효율성(정답률/시간)을 계산하여 최적 레벨 선택
    SELECT focus_intensity_level INTO optimal_level
    FROM (
        SELECT
            focus_intensity_level,
            AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) AS accuracy,
            AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) / NULLIF(AVG(time_spent_seconds), 0) AS efficiency,
            COUNT(*) AS sample_size
        FROM student_focus_sessions
        WHERE student_id = p_student_id
          AND module_id = p_module_id
          AND completed_at IS NOT NULL
        GROUP BY focus_intensity_level
        HAVING COUNT(*) >= 3 -- 최소 3회 이상 시도한 레벨만
    ) level_stats
    ORDER BY
        -- 정답률 70% 이상인 레벨 중 가장 높은 레벨 선택
        CASE WHEN accuracy >= 0.70 THEN focus_intensity_level ELSE 0 END DESC,
        efficiency DESC
    LIMIT 1;

    -- 데이터가 부족하면 기본값 3 반환
    RETURN COALESCE(optimal_level, 3);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_optimal_focus_level IS '학생의 성과 데이터를 분석하여 최적 집중 강도 레벨 추천';

-- ============================================================================
-- Migration 완료
-- ============================================================================

-- 스키마 버전 추적 테이블 (선택적)
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('001-lms-focus-intensity', 'LMS Integration and Focus Intensity Feature - Initial Schema')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- 사용 예시 및 테스트 쿼리
-- ============================================================================

/*
-- 예시 1: 특정 모듈의 집중 강도 레벨 조회
SELECT * FROM focus_intensity_levels WHERE module_id = 'your-module-id';

-- 예시 2: 학생의 집중 강도 성과 분석
SELECT * FROM v_student_focus_performance
WHERE student_id = 'your-student-id' AND module_id = 'your-module-id'
ORDER BY focus_intensity_level;

-- 예시 3: 최적 집중 강도 계산
SELECT calculate_optimal_focus_level('your-student-id', 'your-module-id');

-- 예시 4: LMS 동기화 상태 확인
SELECT * FROM v_lms_sync_dashboard;

-- 예시 5: 현재 활성 세션 모니터링
SELECT * FROM v_realtime_focus_monitoring WHERE session_status = 'active';

-- 예시 6: 성적 동기화 실패 건 조회
SELECT * FROM lms_grade_sync_log
WHERE sync_status = 'failed'
ORDER BY synced_at DESC
LIMIT 10;
*/
