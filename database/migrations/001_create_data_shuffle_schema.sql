-- ============================================================================
-- Data Shuffle Feature - Database Schema Migration
-- Version: 1.0
-- Date: 2025-11-18
-- Description: 문제와 답안을 고르게 섞는 Data Shuffle 기능을 위한 스키마
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE shuffle_strategy_enum AS ENUM ('random', 'seeded', 'group_preserve');
CREATE TYPE question_type_enum AS ENUM ('mcq', 'true_false', 'short_answer', 'essay');
CREATE TYPE question_set_status_enum AS ENUM ('draft', 'active', 'archived');

-- ============================================================================
-- Core Tables
-- ============================================================================

-- 문제 세트 설정
CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID,  -- Future: REFERENCES modules(id)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_answers BOOLEAN DEFAULT FALSE,
    shuffle_strategy shuffle_strategy_enum DEFAULT 'seeded',
    preserve_groups BOOLEAN DEFAULT FALSE,
    preserve_difficulty_order BOOLEAN DEFAULT FALSE,
    section_based_shuffle BOOLEAN DEFAULT FALSE,
    status question_set_status_enum DEFAULT 'draft',
    created_by UUID,  -- Future: REFERENCES teachers(id)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE question_sets IS '문제 세트 및 셔플 설정';
COMMENT ON COLUMN question_sets.shuffle_questions IS '문제 순서 셔플 활성화';
COMMENT ON COLUMN question_sets.shuffle_answers IS '답안 선택지 셔플 활성화';
COMMENT ON COLUMN question_sets.shuffle_strategy IS '셔플 전략: random(완전랜덤), seeded(재현가능), group_preserve(그룹유지)';

-- ============================================================================
-- Questions Table
-- ============================================================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type_enum NOT NULL DEFAULT 'mcq',
    original_order INT NOT NULL,
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),
    section VARCHAR(50),
    group_id UUID,  -- 함께 유지할 문제 그룹
    points DECIMAL(5, 2) DEFAULT 1.0,
    time_limit_seconds INT,
    explanation TEXT,  -- 정답 해설
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE questions IS '문제 정보';
COMMENT ON COLUMN questions.original_order IS '원본 문제 순서 (셔플 전)';
COMMENT ON COLUMN questions.group_id IS '함께 유지할 문제 그룹 ID (같은 ID는 순서만 바뀌고 함께 이동)';
COMMENT ON COLUMN questions.section IS '섹션 구분 (A, B, C 등)';

-- ============================================================================
-- Answer Choices Table
-- ============================================================================

CREATE TABLE answer_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    original_order INT NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE,  -- 셔플 제외 여부
    explanation TEXT,  -- 선택지별 설명
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE answer_choices IS '문제 답안 선택지';
COMMENT ON COLUMN answer_choices.original_order IS '원본 선택지 순서 (0=A, 1=B, 2=C, 3=D)';
COMMENT ON COLUMN answer_choices.is_fixed IS 'true면 셔플에서 제외 (예: "없음", "모두 맞음")';

-- ============================================================================
-- Student Shuffle Maps Table
-- ============================================================================

CREATE TABLE student_shuffle_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,  -- Future: REFERENCES students(id)
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    shuffle_seed BIGINT NOT NULL,
    question_order JSONB NOT NULL,  -- 예: ["q3-uuid", "q1-uuid", "q5-uuid", ...]
    answer_order_map JSONB NOT NULL,  -- 예: {"q1-uuid": [2,0,3,1], "q2-uuid": [1,3,0,2]}
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- 시험 종료 시간
    UNIQUE(student_id, question_set_id)
);

COMMENT ON TABLE student_shuffle_maps IS '학생별 셔플 매핑 (재현성 보장)';
COMMENT ON COLUMN student_shuffle_maps.shuffle_seed IS '셔플에 사용된 시드 값';
COMMENT ON COLUMN student_shuffle_maps.question_order IS '셔플된 문제 순서 (UUID 배열)';
COMMENT ON COLUMN student_shuffle_maps.answer_order_map IS '문제별 답안 순서 매핑 (question_id -> [shuffled_indices])';

-- ============================================================================
-- Student Answers Table
-- ============================================================================

CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id),
    shuffle_map_id UUID NOT NULL REFERENCES student_shuffle_maps(id),
    selected_choice_id UUID REFERENCES answer_choices(id),  -- 객관식
    displayed_position INT,  -- 학생에게 표시된 선택지 위치 (0=A, 1=B, ...)
    answer_text TEXT,  -- 주관식 답안
    is_correct BOOLEAN,
    auto_graded BOOLEAN DEFAULT FALSE,
    manual_score DECIMAL(5, 2),
    grader_comments TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    graded_at TIMESTAMP
);

COMMENT ON TABLE student_answers IS '학생 답안 제출 내역';
COMMENT ON COLUMN student_answers.displayed_position IS '셔플 후 학생에게 표시된 위치';
COMMENT ON COLUMN student_answers.selected_choice_id IS '실제 선택한 답안의 ID (내부 ID)';

-- ============================================================================
-- Indexes
-- ============================================================================

-- Question Sets
CREATE INDEX idx_question_sets_module ON question_sets(module_id);
CREATE INDEX idx_question_sets_status ON question_sets(status);
CREATE INDEX idx_question_sets_created_by ON question_sets(created_by);

-- Questions
CREATE INDEX idx_questions_set_order ON questions(question_set_id, original_order);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_section ON questions(section);
CREATE INDEX idx_questions_group ON questions(group_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);

-- Answer Choices
CREATE INDEX idx_answer_choices_question ON answer_choices(question_id, original_order);
CREATE INDEX idx_answer_choices_correct ON answer_choices(is_correct);

-- Shuffle Maps
CREATE INDEX idx_shuffle_maps_student_set ON student_shuffle_maps(student_id, question_set_id);
CREATE INDEX idx_shuffle_maps_expires ON student_shuffle_maps(expires_at);

-- Student Answers
CREATE INDEX idx_student_answers_student ON student_answers(student_id);
CREATE INDEX idx_student_answers_question ON student_answers(question_id);
CREATE INDEX idx_student_answers_shuffle_map ON student_answers(shuffle_map_id);
CREATE INDEX idx_student_answers_submitted ON student_answers(submitted_at);

-- JSONB Indexes (GIN)
CREATE INDEX idx_questions_metadata ON questions USING GIN(metadata);
CREATE INDEX idx_shuffle_question_order ON student_shuffle_maps USING GIN(question_order);
CREATE INDEX idx_shuffle_answer_map ON student_shuffle_maps USING GIN(answer_order_map);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_sets_updated_at
    BEFORE UPDATE ON question_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Statistics Views
-- ============================================================================

-- 문제 세트별 통계
CREATE VIEW question_set_statistics AS
SELECT
    qs.id AS question_set_id,
    qs.name AS question_set_name,
    COUNT(DISTINCT q.id) AS total_questions,
    COUNT(DISTINCT ssm.student_id) AS total_students,
    AVG(CASE WHEN sa.is_correct THEN 1.0 ELSE 0.0 END) * 100 AS avg_score_percentage,
    COUNT(DISTINCT sa.id) AS total_submissions
FROM question_sets qs
LEFT JOIN questions q ON q.question_set_id = qs.id
LEFT JOIN student_shuffle_maps ssm ON ssm.question_set_id = qs.id
LEFT JOIN student_answers sa ON sa.shuffle_map_id = ssm.id
GROUP BY qs.id, qs.name;

COMMENT ON VIEW question_set_statistics IS '문제 세트별 통계 (문제 수, 학생 수, 평균 점수)';

-- 문제별 난이도 분석
CREATE VIEW question_difficulty_analysis AS
SELECT
    q.id AS question_id,
    q.question_text,
    q.difficulty_level AS intended_difficulty,
    COUNT(sa.id) AS total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS correct_count,
    ROUND(
        CAST(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS DECIMAL) /
        NULLIF(COUNT(sa.id), 0) * 100,
        2
    ) AS actual_correct_percentage,
    CASE
        WHEN ROUND(CAST(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS DECIMAL) / NULLIF(COUNT(sa.id), 0) * 100, 2) > 80 THEN '쉬움'
        WHEN ROUND(CAST(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS DECIMAL) / NULLIF(COUNT(sa.id), 0) * 100, 2) > 50 THEN '보통'
        ELSE '어려움'
    END AS actual_difficulty
FROM questions q
LEFT JOIN student_answers sa ON sa.question_id = q.id
GROUP BY q.id, q.question_text, q.difficulty_level;

COMMENT ON VIEW question_difficulty_analysis IS '문제별 의도된 난이도 vs 실제 정답률';

-- ============================================================================
-- Sample Data Functions
-- ============================================================================

-- 샘플 문제 세트 생성 함수
CREATE OR REPLACE FUNCTION create_sample_question_set()
RETURNS UUID AS $$
DECLARE
    set_id UUID;
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
BEGIN
    -- 문제 세트 생성
    INSERT INTO question_sets (name, description, shuffle_questions, shuffle_answers, shuffle_strategy)
    VALUES (
        '샘플 중간고사',
        'Data Shuffle 기능 테스트용 샘플 문제',
        true,
        true,
        'seeded'
    )
    RETURNING id INTO set_id;

    -- 문제 1: Python 특징
    INSERT INTO questions (question_set_id, question_text, question_type, original_order, difficulty_level)
    VALUES (
        set_id,
        '다음 중 Python의 특징이 아닌 것은?',
        'mcq',
        1,
        2
    )
    RETURNING id INTO q1_id;

    INSERT INTO answer_choices (question_id, choice_text, is_correct, original_order)
    VALUES
        (q1_id, '인터프리터 언어', false, 0),
        (q1_id, '정적 타입 언어', true, 1),
        (q1_id, '동적 타입 언어', false, 2),
        (q1_id, '고수준 언어', false, 3);

    -- 문제 2: 알고리즘 복잡도
    INSERT INTO questions (question_set_id, question_text, question_type, original_order, difficulty_level)
    VALUES (
        set_id,
        'Fisher-Yates Shuffle의 시간 복잡도는?',
        'mcq',
        2,
        3
    )
    RETURNING id INTO q2_id;

    INSERT INTO answer_choices (question_id, choice_text, is_correct, original_order)
    VALUES
        (q2_id, 'O(n²)', false, 0),
        (q2_id, 'O(n log n)', false, 1),
        (q2_id, 'O(n)', true, 2),
        (q2_id, 'O(1)', false, 3);

    -- 문제 3: True/False
    INSERT INTO questions (question_set_id, question_text, question_type, original_order, difficulty_level)
    VALUES (
        set_id,
        'Seeded Random Number Generator를 사용하면 같은 시드로 항상 같은 결과를 얻을 수 있다.',
        'true_false',
        3,
        1
    )
    RETURNING id INTO q3_id;

    INSERT INTO answer_choices (question_id, choice_text, is_correct, original_order)
    VALUES
        (q3_id, 'True', true, 0),
        (q3_id, 'False', false, 1);

    RETURN set_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_sample_question_set IS '테스트용 샘플 문제 세트 생성';

-- ============================================================================
-- Grant Permissions (Future)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;
