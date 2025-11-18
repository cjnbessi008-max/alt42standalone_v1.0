-- Migration: 001_create_explanation_animations
-- Description: 문제별 미니 해설 애니메이션 시스템 / Problem Explanation Animation System
-- Created: 2025-11-18
-- Author: AI Agent

-- ============================================================================
-- 1. 애니메이션 템플릿 라이브러리 / Animation Template Library
-- ============================================================================

CREATE TABLE animation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fraction', 'geometry', 'algebra', 'number', 'measurement')),

    description TEXT,

    -- 템플릿 설정 JSON 스키마
    config_schema JSONB NOT NULL,
    -- 예시: {"type": "object", "properties": {"visual_type": {...}, ...}}

    -- 사용 예시
    example_usage JSONB,

    -- 기본 애니메이션 지속 시간 (밀리초)
    default_duration_ms INTEGER NOT NULL DEFAULT 3000,

    -- 미리보기 이미지 URL
    preview_image_url TEXT,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- 버전 관리
    version INTEGER DEFAULT 1
);

-- 인덱스
CREATE INDEX idx_animation_templates_category ON animation_templates(category);
CREATE INDEX idx_animation_templates_active ON animation_templates(is_active) WHERE is_active = true;

-- 코멘트
COMMENT ON TABLE animation_templates IS '애니메이션 타입 템플릿 라이브러리';
COMMENT ON COLUMN animation_templates.config_schema IS '애니메이션 설정의 JSON 스키마 (검증용)';
COMMENT ON COLUMN animation_templates.example_usage IS '템플릿 사용 예시 JSON';


-- ============================================================================
-- 2. 문제 해설 메타데이터 / Problem Explanations
-- ============================================================================

CREATE TABLE problem_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 관계
    problem_id UUID NOT NULL,
    -- problem_id는 동적 생성된 테이블 참조 (예: fraction_problems, geometry_problems)
    -- 외래키 제약 조건은 모듈별로 동적 추가 필요

    module_id UUID NOT NULL,
    -- module_id는 modules 테이블 참조 (PRD의 core entity)

    -- 해설 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- 해설 단계 (JSON 배열)
    steps JSONB NOT NULL,
    -- 예시 구조:
    -- [
    --   {
    --     "step_number": 1,
    --     "title": "분수의 개념 이해",
    --     "description": "1/2와 1/4를 시각화합니다",
    --     "animation_type": "fraction_visualizer",
    --     "duration_ms": 3000,
    --     "animation_config": {...},
    --     "narration_text": "먼저 각 분수가 무엇을 의미하는지 봅시다",
    --     "subtitle_text": "Visualizing fractions"
    --   },
    --   ...
    -- ]

    -- 총 애니메이션 길이
    total_duration_ms INTEGER NOT NULL,

    -- 난이도
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),

    -- 생성 정보
    is_ai_generated BOOLEAN DEFAULT true,
    last_edited_by UUID,
    -- last_edited_by는 teachers.id 참조

    -- 버전 관리
    version INTEGER DEFAULT 1,
    parent_explanation_id UUID REFERENCES problem_explanations(id),
    -- 해설을 수정하면 새 버전 생성

    -- 다국어 지원
    language VARCHAR(10) DEFAULT 'ko' CHECK (language IN ('ko', 'en')),

    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 인덱스
CREATE INDEX idx_problem_explanations_problem ON problem_explanations(problem_id);
CREATE INDEX idx_problem_explanations_module ON problem_explanations(module_id);
CREATE INDEX idx_problem_explanations_language ON problem_explanations(language);
CREATE INDEX idx_problem_explanations_active ON problem_explanations(is_active) WHERE is_active = true;

-- GIN 인덱스 (JSONB 검색 최적화)
CREATE INDEX idx_problem_explanations_steps ON problem_explanations USING GIN (steps);

-- 코멘트
COMMENT ON TABLE problem_explanations IS '문제별 해설 애니메이션 메타데이터';
COMMENT ON COLUMN problem_explanations.steps IS '해설 단계 배열 (JSON): step_number, title, animation_type, config, etc.';
COMMENT ON COLUMN problem_explanations.parent_explanation_id IS '버전 관리: 이전 버전의 해설 ID';


-- ============================================================================
-- 3. 학생 해설 시청 이력 / Explanation Views
-- ============================================================================

CREATE TABLE explanation_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 관계
    student_id UUID NOT NULL,
    -- student_id는 students.id 참조

    explanation_id UUID NOT NULL REFERENCES problem_explanations(id) ON DELETE CASCADE,

    problem_attempt_id UUID,
    -- 어떤 문제 시도 후에 해설을 봤는지 (student_attempts 테이블 참조)

    -- 시청 행동 데이터
    viewed_at TIMESTAMP DEFAULT NOW(),
    completed_viewing BOOLEAN DEFAULT false,
    -- 끝까지 다 봤는지

    steps_viewed JSONB,
    -- 어떤 단계를 봤는지: [1, 2, 3, 5] (4번 건너뜀)

    playback_speed DECIMAL(3,2) DEFAULT 1.0,
    -- 재생 속도: 0.5, 1.0, 1.5

    total_watch_time_ms INTEGER,
    -- 실제 시청 시간 (밀리초)

    -- 시청 후 결과
    retried_after_viewing BOOLEAN,
    -- 해설 본 후 문제를 다시 풀었는지

    correct_after_viewing BOOLEAN,
    -- 해설 본 후 다시 풀어서 맞았는지

    -- 사용자 피드백
    was_helpful BOOLEAN,
    -- 도움이 되었는지

    feedback_text TEXT,
    -- 추가 피드백 (선택)

    feedback_submitted_at TIMESTAMP,

    -- 메타데이터
    session_id UUID,
    -- 학습 세션 추적

    device_type VARCHAR(50),
    -- 'desktop', 'tablet', 'mobile'

    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_explanation_views_student ON explanation_views(student_id);
CREATE INDEX idx_explanation_views_explanation ON explanation_views(explanation_id);
CREATE INDEX idx_explanation_views_viewed_at ON explanation_views(viewed_at DESC);
CREATE INDEX idx_explanation_views_student_time ON explanation_views(student_id, viewed_at DESC);

-- 복합 인덱스 (분석 쿼리 최적화)
CREATE INDEX idx_explanation_views_analytics ON explanation_views(
    explanation_id,
    completed_viewing,
    correct_after_viewing
) WHERE completed_viewing = true;

-- 코멘트
COMMENT ON TABLE explanation_views IS '학생의 해설 시청 이력 및 행동 데이터';
COMMENT ON COLUMN explanation_views.steps_viewed IS '시청한 단계 번호 배열 (JSON): [1, 2, 3, 5]';
COMMENT ON COLUMN explanation_views.was_helpful IS '학생 피드백: 해설이 도움이 되었는지';


-- ============================================================================
-- 4. 해설 효과성 분석 (Materialized View)
-- ============================================================================

CREATE MATERIALIZED VIEW explanation_effectiveness AS
SELECT
    e.id AS explanation_id,
    e.problem_id,
    e.module_id,
    e.title,
    e.language,

    -- 시청 통계
    COUNT(ev.id) AS total_views,
    COUNT(DISTINCT ev.student_id) AS unique_viewers,

    -- 완료율
    ROUND(
        AVG(CASE WHEN ev.completed_viewing THEN 1 ELSE 0 END) * 100,
        2
    ) AS completion_rate_percent,

    -- 해설 후 정답률
    ROUND(
        AVG(CASE WHEN ev.correct_after_viewing THEN 1 ELSE 0 END) * 100,
        2
    ) AS success_rate_after_viewing_percent,

    -- 평균 시청 시간
    ROUND(AVG(ev.total_watch_time_ms)) AS avg_watch_time_ms,

    -- 피드백 통계
    COUNT(ev.was_helpful) FILTER (WHERE ev.was_helpful = true) AS helpful_count,
    COUNT(ev.was_helpful) FILTER (WHERE ev.was_helpful = false) AS not_helpful_count,
    ROUND(
        COUNT(ev.was_helpful) FILTER (WHERE ev.was_helpful = true)::DECIMAL /
        NULLIF(COUNT(ev.was_helpful), 0) * 100,
        2
    ) AS helpful_rate_percent,

    -- 재시도율
    ROUND(
        AVG(CASE WHEN ev.retried_after_viewing THEN 1 ELSE 0 END) * 100,
        2
    ) AS retry_rate_percent,

    -- 최근 시청 일시
    MAX(ev.viewed_at) AS last_viewed_at,

    -- 업데이트 시각
    NOW() AS refreshed_at

FROM problem_explanations e
LEFT JOIN explanation_views ev ON e.id = ev.explanation_id
WHERE e.is_active = true
GROUP BY e.id, e.problem_id, e.module_id, e.title, e.language;

-- Unique 인덱스
CREATE UNIQUE INDEX idx_explanation_effectiveness_id ON explanation_effectiveness(explanation_id);

-- 추가 인덱스
CREATE INDEX idx_explanation_effectiveness_module ON explanation_effectiveness(module_id);
CREATE INDEX idx_explanation_effectiveness_helpful_rate ON explanation_effectiveness(helpful_rate_percent DESC);

-- 코멘트
COMMENT ON MATERIALIZED VIEW explanation_effectiveness IS '해설 효과성 분석 집계 (주기적 갱신 필요)';

-- 갱신 함수
CREATE OR REPLACE FUNCTION refresh_explanation_effectiveness()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY explanation_effectiveness;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_explanation_effectiveness() IS 'Materialized View 갱신 (CRON 등으로 주기 실행)';


-- ============================================================================
-- 5. 트리거: updated_at 자동 갱신
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 애니메이션 템플릿
CREATE TRIGGER update_animation_templates_updated_at
    BEFORE UPDATE ON animation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 문제 해설
CREATE TRIGGER update_problem_explanations_updated_at
    BEFORE UPDATE ON problem_explanations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 6. 초기 데이터: 기본 애니메이션 템플릿
-- ============================================================================

-- 분수 시각화
INSERT INTO animation_templates (name, category, description, config_schema, example_usage, default_duration_ms, preview_image_url)
VALUES
(
    'fraction_visualizer',
    'fraction',
    '분수를 피자, 케이크, 막대 그래프 등으로 시각화합니다.',
    '{
        "type": "object",
        "properties": {
            "visual_type": {
                "type": "string",
                "enum": ["pizza", "cake", "bar", "circle"]
            },
            "fractions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "numerator": {"type": "integer", "minimum": 0},
                        "denominator": {"type": "integer", "minimum": 1},
                        "color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                        "label": {"type": "string"}
                    },
                    "required": ["numerator", "denominator"]
                }
            },
            "show_labels": {"type": "boolean", "default": true},
            "animate_fill": {"type": "boolean", "default": true}
        },
        "required": ["visual_type", "fractions"]
    }'::jsonb,
    '{
        "visual_type": "pizza",
        "fractions": [
            {"numerator": 1, "denominator": 2, "color": "#FF6B6B", "label": "1/2"}
        ],
        "show_labels": true,
        "animate_fill": true
    }'::jsonb,
    3000,
    '/assets/previews/fraction_visualizer.png'
);

-- 분수 덧셈
INSERT INTO animation_templates (name, category, description, config_schema, example_usage, default_duration_ms)
VALUES
(
    'fraction_addition',
    'fraction',
    '분수 덧셈 과정을 단계별로 시각화합니다.',
    '{
        "type": "object",
        "properties": {
            "fraction1": {
                "type": "object",
                "properties": {
                    "numerator": {"type": "integer"},
                    "denominator": {"type": "integer", "minimum": 1}
                },
                "required": ["numerator", "denominator"]
            },
            "fraction2": {
                "type": "object",
                "properties": {
                    "numerator": {"type": "integer"},
                    "denominator": {"type": "integer", "minimum": 1}
                },
                "required": ["numerator", "denominator"]
            },
            "show_process": {"type": "boolean", "default": true},
            "visual_type": {"type": "string", "enum": ["pizza", "bar"], "default": "pizza"}
        },
        "required": ["fraction1", "fraction2"]
    }'::jsonb,
    '{
        "fraction1": {"numerator": 1, "denominator": 2},
        "fraction2": {"numerator": 1, "denominator": 4},
        "show_process": true,
        "visual_type": "pizza"
    }'::jsonb,
    4000
);

-- 공통분모 찾기
INSERT INTO animation_templates (name, category, description, config_schema, example_usage, default_duration_ms)
VALUES
(
    'common_denominator',
    'fraction',
    '서로 다른 분모를 가진 분수의 공통분모를 찾는 과정을 애니메이션으로 보여줍니다.',
    '{
        "type": "object",
        "properties": {
            "fractions": {
                "type": "array",
                "minItems": 2,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "properties": {
                        "numerator": {"type": "integer"},
                        "denominator": {"type": "integer", "minimum": 1}
                    },
                    "required": ["numerator", "denominator"]
                }
            },
            "show_process": {"type": "boolean", "default": true},
            "highlight_lcm": {"type": "boolean", "default": true}
        },
        "required": ["fractions"]
    }'::jsonb,
    '{
        "fractions": [
            {"numerator": 1, "denominator": 2},
            {"numerator": 1, "denominator": 4}
        ],
        "show_process": true,
        "highlight_lcm": true
    }'::jsonb,
    3500
);

-- 도형 변환 (기하학)
INSERT INTO animation_templates (name, category, description, config_schema, example_usage, default_duration_ms)
VALUES
(
    'shape_transformation',
    'geometry',
    '도형의 회전, 이동, 확대/축소 과정을 애니메이션으로 표현합니다.',
    '{
        "type": "object",
        "properties": {
            "shape_type": {
                "type": "string",
                "enum": ["triangle", "rectangle", "circle", "polygon"]
            },
            "transformation_type": {
                "type": "string",
                "enum": ["rotate", "translate", "scale", "reflect"]
            },
            "from_position": {"type": "object"},
            "to_position": {"type": "object"},
            "show_grid": {"type": "boolean", "default": true}
        },
        "required": ["shape_type", "transformation_type"]
    }'::jsonb,
    '{
        "shape_type": "triangle",
        "transformation_type": "rotate",
        "show_grid": true
    }'::jsonb,
    3000
);

-- 수직선 (대수)
INSERT INTO animation_templates (name, category, description, config_schema, example_usage, default_duration_ms)
VALUES
(
    'number_line',
    'algebra',
    '수직선 위에서 덧셈, 뺄셈 등의 연산을 시각화합니다.',
    '{
        "type": "object",
        "properties": {
            "min_value": {"type": "number"},
            "max_value": {"type": "number"},
            "operation": {
                "type": "string",
                "enum": ["addition", "subtraction", "multiplication"]
            },
            "operand1": {"type": "number"},
            "operand2": {"type": "number"},
            "show_steps": {"type": "boolean", "default": true}
        },
        "required": ["min_value", "max_value", "operation", "operand1", "operand2"]
    }'::jsonb,
    '{
        "min_value": 0,
        "max_value": 10,
        "operation": "addition",
        "operand1": 3,
        "operand2": 5,
        "show_steps": true
    }'::jsonb,
    3000
);


-- ============================================================================
-- 7. 권한 설정 (Role-Based Access Control)
-- ============================================================================

-- 교사 역할: 모든 해설 읽기/쓰기
-- GRANT SELECT, INSERT, UPDATE, DELETE ON problem_explanations TO teacher_role;
-- GRANT SELECT ON explanation_effectiveness TO teacher_role;

-- 학생 역할: 해설 읽기만, 시청 이력 쓰기
-- GRANT SELECT ON problem_explanations TO student_role;
-- GRANT SELECT, INSERT ON explanation_views TO student_role;

-- 관리자 역할: 모든 권한
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_role;

-- 주의: 실제 역할(role)은 애플리케이션 환경에 맞게 생성 필요


-- ============================================================================
-- 8. 유용한 쿼리 함수
-- ============================================================================

-- 특정 문제의 최신 해설 조회
CREATE OR REPLACE FUNCTION get_latest_explanation(
    p_problem_id UUID,
    p_language VARCHAR(10) DEFAULT 'ko'
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    steps JSONB,
    total_duration_ms INTEGER,
    difficulty_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.steps,
        e.total_duration_ms,
        e.difficulty_level
    FROM problem_explanations e
    WHERE e.problem_id = p_problem_id
      AND e.language = p_language
      AND e.is_active = true
    ORDER BY e.version DESC, e.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_explanation IS '특정 문제의 최신 버전 해설 조회';


-- 학생의 해설 시청 통계
CREATE OR REPLACE FUNCTION get_student_explanation_stats(
    p_student_id UUID
)
RETURNS TABLE (
    total_views BIGINT,
    completed_views BIGINT,
    avg_completion_rate NUMERIC,
    total_watch_time_hours NUMERIC,
    helpful_feedback_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_views,
        COUNT(*) FILTER (WHERE completed_viewing = true)::BIGINT AS completed_views,
        ROUND(AVG(CASE WHEN completed_viewing THEN 1 ELSE 0 END) * 100, 2) AS avg_completion_rate,
        ROUND(SUM(total_watch_time_ms)::NUMERIC / 3600000, 2) AS total_watch_time_hours,
        COUNT(*) FILTER (WHERE was_helpful = true)::BIGINT AS helpful_feedback_count
    FROM explanation_views
    WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_explanation_stats IS '특정 학생의 해설 시청 통계';


-- ============================================================================
-- 9. 마이그레이션 완료 로그
-- ============================================================================

-- 마이그레이션 이력 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Create explanation animations system');


-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================

-- 확인 쿼리
DO $$
BEGIN
    RAISE NOTICE '✓ Migration 001 completed successfully';
    RAISE NOTICE '✓ Created tables: animation_templates, problem_explanations, explanation_views';
    RAISE NOTICE '✓ Created materialized view: explanation_effectiveness';
    RAISE NOTICE '✓ Inserted % animation templates', (SELECT COUNT(*) FROM animation_templates);
END $$;
