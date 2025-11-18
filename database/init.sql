-- 성공 루틴 카드 시스템 데이터베이스 스키마
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 학생 테이블
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(20),
    lms_user_id VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 학습 진행 데이터
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    score DECIMAL(5,2),
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 성공 루틴 카드
CREATE TABLE routine_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    card_date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    learning_goals TEXT[],
    recommended_activities JSONB,
    progress_summary JSONB,
    motivation_message TEXT,
    next_steps TEXT[],
    ai_metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    viewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, card_date)
);

-- 카드 활동 로그
CREATE TABLE card_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES routine_cards(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LMS 연동 데이터
CREATE TABLE lms_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    sync_started_at TIMESTAMP NOT NULL,
    sync_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 설정
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_students_lms_user_id ON students(lms_user_id);
CREATE INDEX idx_students_grade_level ON students(grade_level);

CREATE INDEX idx_learning_progress_student ON learning_progress(student_id);
CREATE INDEX idx_learning_progress_subject ON learning_progress(subject);
CREATE INDEX idx_learning_progress_updated ON learning_progress(updated_at DESC);

CREATE INDEX idx_routine_cards_student ON routine_cards(student_id);
CREATE INDEX idx_routine_cards_date ON routine_cards(card_date DESC);
CREATE INDEX idx_routine_cards_status ON routine_cards(status);
CREATE INDEX idx_routine_cards_student_date ON routine_cards(student_id, card_date DESC);

CREATE INDEX idx_card_activities_card ON card_activities(card_id);
CREATE INDEX idx_card_activities_student ON card_activities(student_id);
CREATE INDEX idx_card_activities_created ON card_activities(created_at DESC);

CREATE INDEX idx_lms_sync_logs_student ON lms_sync_logs(student_id);
CREATE INDEX idx_lms_sync_logs_created ON lms_sync_logs(created_at DESC);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_cards_updated_at BEFORE UPDATE ON routine_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 시스템 설정
INSERT INTO system_settings (key, value, description) VALUES
    ('card_generation_time', '"07:00:00"', '일일 카드 자동 생성 시간'),
    ('card_retention_days', '90', '카드 보관 기간 (일)'),
    ('ai_model', '"claude-3-sonnet-20240229"', '사용할 AI 모델'),
    ('max_activities_per_card', '5', '카드당 최대 활동 수'),
    ('enable_auto_generation', 'true', '자동 생성 활성화 여부');

-- 샘플 데이터 (개발용)
INSERT INTO students (student_number, name, email, grade_level, lms_user_id) VALUES
    ('S001', '김민준', 'minjun.kim@example.com', '3학년', 'lms_001'),
    ('S002', '이서연', 'seoyeon.lee@example.com', '3학년', 'lms_002'),
    ('S003', '박지후', 'jihu.park@example.com', '4학년', 'lms_003');

-- 샘플 학습 진행 데이터
INSERT INTO learning_progress (student_id, subject, topic, completion_rate, score, time_spent_minutes, last_activity_at)
SELECT
    s.id,
    '수학',
    '분수의 덧셈과 뺄셈',
    75.5,
    85.0,
    120,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM students s WHERE s.student_number = 'S001';

INSERT INTO learning_progress (student_id, subject, topic, completion_rate, score, time_spent_minutes, last_activity_at)
SELECT
    s.id,
    '수학',
    '분수의 개념',
    100.0,
    92.0,
    90,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM students s WHERE s.student_number = 'S001';

COMMENT ON TABLE students IS '학생 정보';
COMMENT ON TABLE learning_progress IS '학습 진행 상황 추적';
COMMENT ON TABLE routine_cards IS 'AI 생성 일일 성공 루틴 카드';
COMMENT ON TABLE card_activities IS '카드 사용자 활동 로그';
COMMENT ON TABLE lms_sync_logs IS 'LMS 데이터 동기화 로그';
COMMENT ON TABLE system_settings IS '시스템 설정';
