-- LMS Bottleneck Detection Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Students Table
-- =====================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_grade_level ON students(grade_level);

-- =====================================================
-- 2. Problem Types Table
-- 문제 유형 (예: 분수, 소수, 방정식, 기하학 등)
-- =====================================================
CREATE TABLE problem_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'arithmetic', 'algebra', 'geometry', etc.
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    expected_solve_time_seconds INTEGER,  -- 예상 해결 시간
    parent_type_id UUID REFERENCES problem_types(id),  -- 상위 유형 (계층 구조)
    metadata JSONB,  -- 추가 메타데이터
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_problem_types_category ON problem_types(category);
CREATE INDEX idx_problem_types_difficulty ON problem_types(difficulty_level);

-- =====================================================
-- 3. Problems Table
-- 개별 문제들
-- =====================================================
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_type_id UUID NOT NULL REFERENCES problem_types(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,  -- 문제 내용 (텍스트, 이미지 URL 등)
    correct_answer JSONB NOT NULL,  -- 정답
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    points INTEGER DEFAULT 10,  -- 배점
    hints JSONB,  -- 힌트 배열
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_problems_type ON problems(problem_type_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty_level);

-- =====================================================
-- 4. Student Attempts Table
-- 학생의 문제 시도 기록
-- =====================================================
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    problem_type_id UUID NOT NULL REFERENCES problem_types(id),

    -- Attempt details
    submitted_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    attempt_number INTEGER DEFAULT 1,  -- 몇 번째 시도인지

    -- Time tracking
    started_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW(),
    time_spent_seconds INTEGER GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (submitted_at - started_at))::INTEGER) STORED,

    -- Additional data
    hints_used INTEGER DEFAULT 0,
    gave_up BOOLEAN DEFAULT FALSE,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),  -- 학생의 자신감 수준

    metadata JSONB  -- 추가 추적 데이터 (클릭 패턴, 입력 순서 등)
);

CREATE INDEX idx_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_attempts_type ON student_attempts(problem_type_id);
CREATE INDEX idx_attempts_submitted_at ON student_attempts(submitted_at DESC);
CREATE INDEX idx_attempts_is_correct ON student_attempts(is_correct);

-- =====================================================
-- 5. Bottleneck Detections Table
-- 감지된 병목 지점 기록
-- =====================================================
CREATE TABLE bottleneck_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_type_id UUID NOT NULL REFERENCES problem_types(id) ON DELETE CASCADE,

    -- Detection metrics
    accuracy_rate DECIMAL(5,2),  -- 정답률 (0-100)
    avg_solve_time_seconds INTEGER,  -- 평균 해결 시간
    avg_attempts DECIMAL(5,2),  -- 평균 시도 횟수
    abandonment_rate DECIMAL(5,2),  -- 포기율 (0-100)
    difficulty_score DECIMAL(5,2),  -- 종합 난이도 점수 (0-100)

    -- Detection details
    total_attempts INTEGER NOT NULL,
    correct_attempts INTEGER NOT NULL,
    detection_reason TEXT,  -- 병목으로 감지된 이유
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Timestamps
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,  -- 병목이 해소된 시간
    is_active BOOLEAN DEFAULT TRUE,

    -- Recommendations
    recommended_actions JSONB  -- 추천 학습 경로, 리소스 등
);

CREATE INDEX idx_bottlenecks_student ON bottleneck_detections(student_id);
CREATE INDEX idx_bottlenecks_type ON bottleneck_detections(problem_type_id);
CREATE INDEX idx_bottlenecks_active ON bottleneck_detections(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_bottlenecks_severity ON bottleneck_detections(severity);
CREATE INDEX idx_bottlenecks_detected_at ON bottleneck_detections(detected_at DESC);

-- =====================================================
-- 6. Performance Metrics Table
-- 학생의 문제 유형별 성과 메트릭 (집계 테이블)
-- =====================================================
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_type_id UUID NOT NULL REFERENCES problem_types(id) ON DELETE CASCADE,

    -- Aggregated metrics
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) GENERATED ALWAYS AS
        (CASE WHEN total_attempts > 0
         THEN (correct_attempts::DECIMAL / total_attempts * 100)
         ELSE 0 END) STORED,

    avg_solve_time_seconds INTEGER,
    min_solve_time_seconds INTEGER,
    max_solve_time_seconds INTEGER,

    total_hints_used INTEGER DEFAULT 0,
    total_gave_up INTEGER DEFAULT 0,

    -- Time windows
    last_attempt_at TIMESTAMP,
    first_attempt_at TIMESTAMP,

    -- Progress tracking
    mastery_level INTEGER CHECK (mastery_level BETWEEN 0 AND 100) DEFAULT 0,
    trend VARCHAR(20) CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')) DEFAULT 'unknown',

    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, problem_type_id)
);

CREATE INDEX idx_metrics_student ON performance_metrics(student_id);
CREATE INDEX idx_metrics_type ON performance_metrics(problem_type_id);
CREATE INDEX idx_metrics_accuracy ON performance_metrics(accuracy_rate);
CREATE INDEX idx_metrics_mastery ON performance_metrics(mastery_level);

-- =====================================================
-- 7. Notifications Table
-- 학생/선생님에게 보낼 알림
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    bottleneck_id UUID REFERENCES bottleneck_detections(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL,  -- 'bottleneck_detected', 'improvement_noted', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    metadata JSONB  -- 추가 알림 데이터
);

CREATE INDEX idx_notifications_student ON notifications(student_id);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- Views
-- =====================================================

-- 학생별 현재 활성 병목 지점 뷰
CREATE VIEW active_bottlenecks AS
SELECT
    bd.id,
    bd.student_id,
    s.name as student_name,
    bd.problem_type_id,
    pt.name as problem_type_name,
    pt.category,
    bd.accuracy_rate,
    bd.difficulty_score,
    bd.severity,
    bd.detected_at,
    bd.recommended_actions
FROM bottleneck_detections bd
JOIN students s ON bd.student_id = s.id
JOIN problem_types pt ON bd.problem_type_id = pt.id
WHERE bd.is_active = TRUE
ORDER BY bd.severity DESC, bd.difficulty_score DESC;

-- 학생별 성과 대시보드 뷰
CREATE VIEW student_performance_dashboard AS
SELECT
    s.id as student_id,
    s.name as student_name,
    s.grade_level,
    COUNT(DISTINCT sa.problem_type_id) as types_attempted,
    COUNT(sa.id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::DECIMAL /
        NULLIF(COUNT(sa.id), 0) * 100, 2
    ) as overall_accuracy,
    AVG(sa.time_spent_seconds)::INTEGER as avg_solve_time,
    COUNT(DISTINCT CASE WHEN bd.is_active THEN bd.problem_type_id END) as active_bottlenecks
FROM students s
LEFT JOIN student_attempts sa ON s.id = sa.student_id
LEFT JOIN bottleneck_detections bd ON s.id = bd.student_id AND bd.is_active = TRUE
GROUP BY s.id, s.name, s.grade_level;

-- =====================================================
-- Functions
-- =====================================================

-- 업데이트 타임스탬프 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample Data (for development)
-- =====================================================

-- Sample problem types
INSERT INTO problem_types (name, category, description, difficulty_level, expected_solve_time_seconds) VALUES
    ('분수의 덧셈', 'arithmetic', '분수의 덧셈 문제', 2, 120),
    ('분수의 뺄셈', 'arithmetic', '분수의 뺄셈 문제', 2, 120),
    ('분수의 곱셈', 'arithmetic', '분수의 곱셈 문제', 3, 150),
    ('분수의 나눗셈', 'arithmetic', '분수의 나눗셈 문제', 3, 150),
    ('소수의 덧셈', 'arithmetic', '소수의 덧셈 문제', 2, 100),
    ('소수의 뺄셈', 'arithmetic', '소수의 뺄셈 문제', 2, 100),
    ('일차방정식', 'algebra', '일차방정식 풀이', 3, 180),
    ('이차방정식', 'algebra', '이차방정식 풀이', 4, 240),
    ('피타고라스 정리', 'geometry', '피타고라스 정리 응용', 3, 200),
    ('도형의 넓이', 'geometry', '다양한 도형의 넓이 계산', 2, 150);

-- Sample students
INSERT INTO students (student_number, name, grade_level, email) VALUES
    ('2024001', '김철수', '5학년', 'kim.cs@example.com'),
    ('2024002', '이영희', '5학년', 'lee.yh@example.com'),
    ('2024003', '박민수', '6학년', 'park.ms@example.com');

COMMENT ON TABLE students IS '학생 정보';
COMMENT ON TABLE problem_types IS '문제 유형 (분수, 방정식 등)';
COMMENT ON TABLE problems IS '개별 문제';
COMMENT ON TABLE student_attempts IS '학생의 문제 시도 기록';
COMMENT ON TABLE bottleneck_detections IS '감지된 병목 지점 (학생이 어려워하는 유형)';
COMMENT ON TABLE performance_metrics IS '학생별 문제 유형별 성과 집계';
COMMENT ON TABLE notifications IS '학생/선생님 알림';
