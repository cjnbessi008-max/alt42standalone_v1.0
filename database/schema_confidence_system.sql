-- ============================================
-- 자동 난이도 조정 및 자신감 회복 시스템
-- Database Schema
-- ============================================

-- 학생 신뢰도/자신감 추적 테이블
CREATE TABLE student_confidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- 신뢰도 점수 (0-100)
    confidence_score INTEGER NOT NULL DEFAULT 70 CHECK (confidence_score BETWEEN 0 AND 100),

    -- 현재 난이도
    current_difficulty INTEGER NOT NULL CHECK (current_difficulty BETWEEN 1 AND 5),
    original_difficulty INTEGER NOT NULL CHECK (original_difficulty BETWEEN 1 AND 5),

    -- 통계
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    consecutive_successes INTEGER NOT NULL DEFAULT 0,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,

    -- 최근 성과 (최근 10개 결과를 JSON 배열로 저장)
    recent_attempts JSONB DEFAULT '[]'::jsonb,

    -- 회복 모드 상태
    in_recovery_mode BOOLEAN DEFAULT FALSE,
    recovery_started_at TIMESTAMP,
    recovery_target_difficulty INTEGER,
    recovery_phase VARCHAR(50), -- 'immediate_downward', 'gradual_return', 'completed'
    recovery_problems_completed INTEGER DEFAULT 0,

    -- 타임스탬프
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, module_id)
);

-- 난이도 조정 이력 테이블
CREATE TABLE difficulty_adjustment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- 조정 내용
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('upward', 'downward', 'reset')),
    previous_difficulty INTEGER NOT NULL CHECK (previous_difficulty BETWEEN 1 AND 5),
    new_difficulty INTEGER NOT NULL CHECK (new_difficulty BETWEEN 1 AND 5),

    -- 조정 사유
    trigger_reason VARCHAR(50) NOT NULL, -- 'consecutive_failures', 'low_accuracy', 'low_confidence', 'excessive_time', 'manual'
    trigger_details JSONB,

    -- 당시 학생 상태
    confidence_score_at_adjustment INTEGER CHECK (confidence_score_at_adjustment BETWEEN 0 AND 100),
    accuracy_at_adjustment DECIMAL(5,2),
    consecutive_failures_count INTEGER,

    -- 조정 효과 (사후 측정)
    effectiveness_score DECIMAL(5,2), -- 조정 후 성과 개선도
    problems_until_recovery INTEGER,

    -- 타임스탬프
    adjusted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 외래키
    FOREIGN KEY (student_id, module_id)
        REFERENCES student_confidence(student_id, module_id)
        ON DELETE CASCADE
);

-- 회복 경로 추적 테이블
CREATE TABLE recovery_path (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- 회복 경로 정보
    path_data JSONB NOT NULL, -- 전체 회복 경로 (단계별 정보)
    current_phase_index INTEGER NOT NULL DEFAULT 0,

    -- 현재 단계 상태
    current_phase_difficulty INTEGER NOT NULL,
    current_phase_required_successes INTEGER NOT NULL,
    current_phase_successes INTEGER NOT NULL DEFAULT 0,

    -- 전체 진행 상황
    total_phases INTEGER NOT NULL,
    completed_phases INTEGER NOT NULL DEFAULT 0,
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS
        (CASE WHEN total_phases > 0 THEN (completed_phases::DECIMAL / total_phases * 100) ELSE 0 END) STORED,

    -- 회복 성과
    problems_solved INTEGER DEFAULT 0,
    total_recovery_time_seconds INTEGER DEFAULT 0,
    confidence_gain INTEGER DEFAULT 0, -- 회복 시작 대비 점수 증가

    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

    -- 타임스탬프
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, module_id, started_at)
);

-- 자신감 회복용 문제 테이블
CREATE TABLE confidence_recovery_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_path_id UUID NOT NULL REFERENCES recovery_path(id) ON DELETE CASCADE,

    -- 문제 정보
    problem_id UUID NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    problem_type VARCHAR(50) NOT NULL, -- 'confidence_boost', 'scaffolded', 'review'

    -- 순서 및 상태
    sequence_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),

    -- 학생 응답
    student_answer JSONB,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hint_used BOOLEAN DEFAULT FALSE,

    -- 타임스탬프
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    UNIQUE(recovery_path_id, sequence_order)
);

-- LMS 연동 로그 테이블
CREATE TABLE lms_integration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- LMS 정보
    lms_system VARCHAR(50) NOT NULL, -- 'kaist_lms', 'canvas', 'moodle', etc.
    lms_student_id VARCHAR(255) NOT NULL,
    lms_course_id VARCHAR(255) NOT NULL,

    -- 시스템 매핑
    internal_student_id UUID,
    internal_module_id UUID,

    -- 수신 데이터
    webhook_type VARCHAR(50) NOT NULL, -- 'student_performance', 'assignment_submit', etc.
    payload JSONB NOT NULL,

    -- 분석 결과
    analysis_result JSONB,
    recommendation_generated BOOLEAN DEFAULT FALSE,
    recommendation_data JSONB,

    -- 처리 상태
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,

    -- 타임스탬프
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    INDEX idx_lms_student (lms_student_id),
    INDEX idx_internal_student (internal_student_id),
    INDEX idx_received_at (received_at)
);

-- 자동 추천 이벤트 테이블
CREATE TABLE auto_recommendation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    -- 추천 내용
    recommendation_type VARCHAR(50) NOT NULL, -- 'difficulty_downward', 'confidence_recovery', 'take_break', etc.
    trigger_reason VARCHAR(50) NOT NULL,
    trigger_details JSONB,

    -- 추천 데이터
    recommendation_data JSONB NOT NULL,

    -- 학생 반응
    shown_to_student BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP,
    student_response VARCHAR(20), -- 'accepted', 'declined', 'ignored', 'dismissed'
    responded_at TIMESTAMP,

    -- 효과 측정
    pre_confidence_score INTEGER,
    post_confidence_score INTEGER,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),

    -- 타임스탬프
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_module (student_id, module_id),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX idx_student_confidence_student ON student_confidence(student_id);
CREATE INDEX idx_student_confidence_module ON student_confidence(module_id);
CREATE INDEX idx_student_confidence_recovery ON student_confidence(in_recovery_mode, recovery_started_at);

CREATE INDEX idx_difficulty_history_student ON difficulty_adjustment_history(student_id);
CREATE INDEX idx_difficulty_history_adjusted_at ON difficulty_adjustment_history(adjusted_at);

CREATE INDEX idx_recovery_path_student ON recovery_path(student_id);
CREATE INDEX idx_recovery_path_status ON recovery_path(status);

-- ============================================
-- 트리거 생성 (자동 업데이트)
-- ============================================

-- student_confidence 테이블 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_confidence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_confidence_timestamp
    BEFORE UPDATE ON student_confidence
    FOR EACH ROW
    EXECUTE FUNCTION update_confidence_timestamp();

-- recovery_path 테이블 last_updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_recovery_path_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recovery_path_timestamp
    BEFORE UPDATE ON recovery_path
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_path_timestamp();

-- ============================================
-- 뷰 생성 (분석 및 리포팅용)
-- ============================================

-- 학생별 회복 성과 요약 뷰
CREATE VIEW v_student_recovery_summary AS
SELECT
    sc.student_id,
    sc.module_id,
    sc.confidence_score,
    sc.current_difficulty,
    sc.original_difficulty,
    sc.in_recovery_mode,
    rp.progress_percentage as recovery_progress,
    rp.problems_solved as recovery_problems_solved,
    rp.confidence_gain,
    COUNT(dah.id) as total_adjustments,
    COUNT(CASE WHEN dah.adjustment_type = 'downward' THEN 1 END) as downward_adjustments,
    COUNT(CASE WHEN dah.adjustment_type = 'upward' THEN 1 END) as upward_adjustments,
    AVG(dah.effectiveness_score) as avg_adjustment_effectiveness
FROM student_confidence sc
LEFT JOIN recovery_path rp ON sc.student_id = rp.student_id
    AND sc.module_id = rp.module_id
    AND rp.status = 'active'
LEFT JOIN difficulty_adjustment_history dah ON sc.student_id = dah.student_id
    AND sc.module_id = dah.module_id
GROUP BY sc.student_id, sc.module_id, sc.confidence_score, sc.current_difficulty,
         sc.original_difficulty, sc.in_recovery_mode, rp.progress_percentage,
         rp.problems_solved, rp.confidence_gain;

-- 추천 수용률 분석 뷰
CREATE VIEW v_recommendation_acceptance_rate AS
SELECT
    recommendation_type,
    trigger_reason,
    COUNT(*) as total_recommendations,
    COUNT(CASE WHEN shown_to_student THEN 1 END) as shown_count,
    COUNT(CASE WHEN student_response = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN student_response = 'declined' THEN 1 END) as declined_count,
    ROUND(
        COUNT(CASE WHEN student_response = 'accepted' THEN 1 END)::NUMERIC /
        NULLIF(COUNT(CASE WHEN shown_to_student THEN 1 END), 0) * 100,
        2
    ) as acceptance_rate_pct,
    AVG(CASE WHEN post_confidence_score IS NOT NULL
        THEN post_confidence_score - pre_confidence_score END) as avg_confidence_change,
    AVG(effectiveness_rating) as avg_effectiveness
FROM auto_recommendation_events
GROUP BY recommendation_type, trigger_reason;

-- ============================================
-- 샘플 데이터 삽입 함수
-- ============================================

CREATE OR REPLACE FUNCTION insert_sample_confidence_data()
RETURNS void AS $$
DECLARE
    sample_student_id UUID := gen_random_uuid();
    sample_module_id UUID := gen_random_uuid();
BEGIN
    -- 샘플 학생 신뢰도 데이터
    INSERT INTO student_confidence (
        student_id, module_id, confidence_score,
        current_difficulty, original_difficulty,
        consecutive_failures, total_attempts, correct_attempts,
        recent_attempts
    ) VALUES (
        sample_student_id,
        sample_module_id,
        45, -- 낮은 신뢰도 점수
        4,  -- 현재 난이도
        4,  -- 원래 난이도
        4,  -- 연속 실패
        10, -- 총 시도
        3,  -- 정답 수
        '[
            {"is_correct": false, "time_spent": 180},
            {"is_correct": false, "time_spent": 210},
            {"is_correct": true, "time_spent": 150},
            {"is_correct": false, "time_spent": 240},
            {"is_correct": false, "time_spent": 200}
        ]'::jsonb
    );

    RAISE NOTICE 'Sample confidence data inserted for student %', sample_student_id;
END;
$$ LANGUAGE plpgsql;

-- 실행: SELECT insert_sample_confidence_data();
