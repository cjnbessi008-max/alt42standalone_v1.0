-- Condition Morph Database Schema
-- PostgreSQL 15+

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 텍스트 검색용

-- ===== 핵심 테이블 =====

-- 학생 테이블
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_user_id INTEGER UNIQUE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 교사 테이블
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_user_id INTEGER UNIQUE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    institution VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 점화식 문제 정의
CREATE TABLE IF NOT EXISTS recurrence_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_question_id INTEGER,  -- Moodle 연동용
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- 점화식 정의
    expression TEXT NOT NULL,  -- "a_n = 2*a_{n-1} + 1"
    order_num INTEGER NOT NULL CHECK (order_num >= 0),
    initial_conditions JSONB NOT NULL DEFAULT '{}',  -- {"0": 1, "1": 1}
    domain VARCHAR(20) DEFAULT 'natural',

    -- 난이도
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
    concept_tags TEXT[] DEFAULT '{}',  -- {"fibonacci", "linear", "arithmetic"}

    -- 메타데이터
    teacher_id UUID REFERENCES teachers(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_recurrence_problems_difficulty ON recurrence_problems(difficulty_level);
CREATE INDEX idx_recurrence_problems_concept_tags ON recurrence_problems USING GIN(concept_tags);
CREATE INDEX idx_recurrence_problems_moodle ON recurrence_problems(moodle_question_id) WHERE moodle_question_id IS NOT NULL;

-- Morphing 규칙
CREATE TABLE IF NOT EXISTS morph_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,  -- 'consecutive_correct', 'time_threshold', etc.
    description TEXT,

    -- 조건 (Python expression 또는 JSON)
    condition_expression TEXT NOT NULL,
    condition_params JSONB DEFAULT '{}',

    -- 변환 로직
    transformation_type VARCHAR(50) NOT NULL,  -- 'increase_difficulty', 'simplify', etc.
    transformation_params JSONB DEFAULT '{}',

    -- 우선순위
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- 메타데이터
    teacher_id UUID REFERENCES teachers(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_morph_rules_trigger ON morph_rules(trigger_type);
CREATE INDEX idx_morph_rules_active ON morph_rules(is_active, priority);

-- 학습 세션
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),

    -- 세션 정보
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    -- 통계
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    morphing_count INTEGER DEFAULT 0,

    UNIQUE(student_id, problem_id, started_at)
);

CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_active ON learning_sessions(is_active, started_at);

-- 학생 상태 추적
CREATE TABLE IF NOT EXISTS student_morph_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),
    session_id UUID REFERENCES learning_sessions(id),

    -- 현재 상태
    current_difficulty INTEGER CHECK (current_difficulty BETWEEN 1 AND 5),
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_wrong INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,

    -- 시간 지표
    avg_response_time_seconds FLOAT,
    total_time_spent_seconds INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,

    -- 숙련도
    mastery_score FLOAT CHECK (mastery_score BETWEEN 0 AND 1) DEFAULT 0,
    difficulty_progression JSONB DEFAULT '[]',  -- 난이도 변화 히스토리

    -- 메타데이터
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, problem_id, session_id)
);

-- 인덱스
CREATE INDEX idx_student_states_student ON student_morph_states(student_id);
CREATE INDEX idx_student_states_problem ON student_morph_states(problem_id);
CREATE INDEX idx_student_states_session ON student_morph_states(session_id);
CREATE INDEX idx_student_states_updated ON student_morph_states(updated_at DESC);

-- 답안 시도 기록
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),
    state_id UUID REFERENCES student_morph_states(id),
    session_id UUID REFERENCES learning_sessions(id),

    -- 시도 내용
    n_value INTEGER NOT NULL,  -- 계산할 항 번호
    answer_value FLOAT NOT NULL,
    expected_value FLOAT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    -- 시간 추적
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW(),

    -- 컨텍스트 (Morphing 기록용)
    problem_expression TEXT,  -- 시도 당시의 문제
    difficulty_level INTEGER,
    initial_conditions JSONB
);

-- 인덱스
CREATE INDEX idx_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_attempts_session ON student_attempts(session_id);
CREATE INDEX idx_attempts_time ON student_attempts(attempted_at DESC);
CREATE INDEX idx_attempts_correct ON student_attempts(is_correct);

-- Morphing 이벤트 로그
CREATE TABLE IF NOT EXISTS morph_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),
    session_id UUID REFERENCES learning_sessions(id),

    -- Morphing 정보
    trigger_type VARCHAR(50) NOT NULL,
    rule_id UUID REFERENCES morph_rules(id),
    rule_name VARCHAR(255),

    -- 변화 내용
    original_expression TEXT NOT NULL,
    morphed_expression TEXT NOT NULL,
    original_difficulty INTEGER,
    morphed_difficulty INTEGER,
    original_problem_id UUID,
    morphed_problem_id UUID,

    -- 학생 상태 스냅샷
    student_state_snapshot JSONB,

    -- 메타데이터
    occurred_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_morph_events_student ON morph_events(student_id);
CREATE INDEX idx_morph_events_problem ON morph_events(problem_id);
CREATE INDEX idx_morph_events_trigger ON morph_events(trigger_type);
CREATE INDEX idx_morph_events_occurred ON morph_events(occurred_at DESC);

-- Moodle 연동 테이블
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_question_id INTEGER NOT NULL,
    internal_problem_id UUID REFERENCES recurrence_problems(id),
    moodle_course_id INTEGER,

    sync_status VARCHAR(20) NOT NULL,  -- 'success', 'failed', 'pending'
    sync_direction VARCHAR(10) NOT NULL,  -- 'import', 'export'

    moodle_data JSONB,  -- 원본 Moodle 데이터
    error_message TEXT,

    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moodle_sync_question ON moodle_sync_log(moodle_question_id);
CREATE INDEX idx_moodle_sync_internal ON moodle_sync_log(internal_problem_id);
CREATE INDEX idx_moodle_sync_status ON moodle_sync_log(sync_status, synced_at);

-- ===== 뷰 (Views) =====

-- 학생 성과 요약 뷰
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT
    s.id as student_id,
    s.username,
    s.firstname,
    s.lastname,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_count,
    AVG(sa.time_spent_seconds) as avg_time_seconds,
    MAX(sa.attempted_at) as last_attempt,
    AVG(sms.mastery_score) as avg_mastery_score
FROM students s
LEFT JOIN student_attempts sa ON s.id = sa.student_id
LEFT JOIN student_morph_states sms ON s.id = sms.student_id
GROUP BY s.id, s.username, s.firstname, s.lastname;

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    rp.id as problem_id,
    rp.name,
    rp.expression,
    rp.difficulty_level,
    rp.concept_tags,
    COUNT(DISTINCT sa.student_id) as unique_students,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.id), 0), 2) as success_rate,
    AVG(sa.time_spent_seconds) as avg_time_seconds,
    COUNT(me.id) as morph_count
FROM recurrence_problems rp
LEFT JOIN student_attempts sa ON rp.id = sa.problem_id
LEFT JOIN morph_events me ON rp.id = me.problem_id
GROUP BY rp.id, rp.name, rp.expression, rp.difficulty_level, rp.concept_tags;

-- Morphing 트리거별 통계
CREATE OR REPLACE VIEW morph_trigger_statistics AS
SELECT
    trigger_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT student_id) as affected_students,
    AVG(morphed_difficulty - original_difficulty) as avg_difficulty_change,
    MIN(occurred_at) as first_occurrence,
    MAX(occurred_at) as last_occurrence
FROM morph_events
GROUP BY trigger_type
ORDER BY event_count DESC;

-- ===== 함수 (Functions) =====

-- 학생 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_student_state()
RETURNS TRIGGER AS $$
BEGIN
    -- student_morph_states 업데이트
    UPDATE student_morph_states
    SET
        total_attempts = total_attempts + 1,
        total_correct = total_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        consecutive_correct = CASE
            WHEN NEW.is_correct THEN consecutive_correct + 1
            ELSE 0
        END,
        consecutive_wrong = CASE
            WHEN NOT NEW.is_correct THEN consecutive_wrong + 1
            ELSE 0
        END,
        mastery_score = (total_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::FLOAT /
                       (total_attempts + 1)::FLOAT,
        last_attempt_at = NEW.attempted_at,
        updated_at = NOW()
    WHERE student_id = NEW.student_id
      AND problem_id = NEW.problem_id
      AND session_id = NEW.session_id;

    -- learning_sessions 업데이트
    UPDATE learning_sessions
    SET
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_student_state ON student_attempts;
CREATE TRIGGER trigger_update_student_state
AFTER INSERT ON student_attempts
FOR EACH ROW
EXECUTE FUNCTION update_student_state();

-- 평균 응답 시간 계산 함수
CREATE OR REPLACE FUNCTION calculate_avg_response_time(
    p_student_id UUID,
    p_problem_id UUID,
    p_session_id UUID
) RETURNS FLOAT AS $$
DECLARE
    avg_time FLOAT;
BEGIN
    SELECT AVG(time_spent_seconds)::FLOAT INTO avg_time
    FROM (
        SELECT time_spent_seconds
        FROM student_attempts
        WHERE student_id = p_student_id
          AND problem_id = p_problem_id
          AND session_id = p_session_id
        ORDER BY attempted_at DESC
        LIMIT 10
    ) recent_attempts;

    RETURN COALESCE(avg_time, 0);
END;
$$ LANGUAGE plpgsql;

-- ===== 초기 데이터 =====

-- 기본 Morphing 규칙 삽입
INSERT INTO morph_rules (name, trigger_type, condition_expression, transformation_type, priority, is_active)
VALUES
    ('Increase Difficulty on Consecutive Correct',
     'consecutive_correct',
     'consecutive_correct >= 3',
     'increase_difficulty',
     1,
     true),

    ('Decrease Difficulty on Consecutive Wrong',
     'consecutive_wrong',
     'consecutive_wrong >= 3',
     'decrease_difficulty',
     2,
     true),

    ('Simplify on Time Threshold',
     'time_threshold',
     'avg_response_time > 120',
     'simplify_problem',
     3,
     true),

    ('Increase on High Mastery',
     'pattern_mastery',
     'mastery_score >= 0.8 AND total_attempts >= 5',
     'increase_difficulty',
     4,
     true)
ON CONFLICT DO NOTHING;

-- 샘플 문제 삽입
INSERT INTO recurrence_problems (name, description, expression, order_num, initial_conditions, difficulty_level, concept_tags)
VALUES
    ('Simple Arithmetic Sequence',
     '단순 등차수열: 공차 2',
     'a_n = a_{n-1} + 2',
     1,
     '{"0": 1}'::jsonb,
     1,
     ARRAY['arithmetic', 'linear', 'first-order']),

    ('Geometric Sequence',
     '등비수열: 공비 2',
     'a_n = a_{n-1} * 2',
     1,
     '{"0": 1}'::jsonb,
     2,
     ARRAY['geometric', 'exponential', 'first-order']),

    ('Fibonacci Sequence',
     '피보나치 수열',
     'a_n = a_{n-1} + a_{n-2}',
     2,
     '{"0": 0, "1": 1}'::jsonb,
     3,
     ARRAY['fibonacci', 'recursive', 'classic', 'second-order'])
ON CONFLICT DO NOTHING;

-- ===== 권한 설정 =====

-- 읽기 전용 사용자 생성 (옵션)
-- CREATE USER condition_morph_readonly WITH PASSWORD 'readonly_password';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO condition_morph_readonly;

-- 코멘트
COMMENT ON TABLE recurrence_problems IS '점화식 문제 정의';
COMMENT ON TABLE student_morph_states IS '학생별 학습 상태 추적';
COMMENT ON TABLE student_attempts IS '학생의 답안 시도 기록';
COMMENT ON TABLE morph_events IS 'Condition Morphing 이벤트 로그';
COMMENT ON TABLE morph_rules IS 'Morphing 규칙 정의';
COMMENT ON TABLE moodle_sync_log IS 'Moodle LMS 동기화 로그';

-- 스키마 버전
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_version (version, description)
VALUES (1, 'Initial Condition Morph schema')
ON CONFLICT (version) DO NOTHING;
