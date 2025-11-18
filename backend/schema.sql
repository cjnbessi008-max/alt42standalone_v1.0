-- Learning Stress Indicator Database Schema
-- 학습 스트레스 지표 데이터베이스 스키마 (PostgreSQL)

-- 학생 테이블
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 모듈 테이블
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 학습 활동 테이블
CREATE TABLE IF NOT EXISTS learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(200) NOT NULL,
    time_spent_minutes DECIMAL(10, 2) NOT NULL CHECK (time_spent_minutes >= 0),
    problems_attempted INTEGER NOT NULL CHECK (problems_attempted >= 0),
    problems_correct INTEGER NOT NULL CHECK (problems_correct >= 0),
    retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
    average_response_time DECIMAL(10, 2) NOT NULL CHECK (average_response_time >= 0),
    response_time_trend DECIMAL(3, 2) NOT NULL CHECK (response_time_trend >= -1 AND response_time_trend <= 1),
    timestamp TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

-- 스트레스 지표 테이블
CREATE TABLE IF NOT EXISTS stress_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(200) NOT NULL,
    stress_level VARCHAR(20) NOT NULL CHECK (stress_level IN ('LOW', 'MEDIUM', 'HIGH')),
    stress_score DECIMAL(5, 2) NOT NULL CHECK (stress_score >= 0 AND stress_score <= 100),
    factors JSONB NOT NULL,
    recommendations TEXT[],
    timestamp TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_student_indicator FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_module_indicator FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_learning_activities_student ON learning_activities(student_id);
CREATE INDEX idx_learning_activities_module ON learning_activities(module_id);
CREATE INDEX idx_learning_activities_session ON learning_activities(session_id);
CREATE INDEX idx_learning_activities_timestamp ON learning_activities(timestamp);

CREATE INDEX idx_stress_indicators_student ON stress_indicators(student_id);
CREATE INDEX idx_stress_indicators_module ON stress_indicators(module_id);
CREATE INDEX idx_stress_indicators_session ON stress_indicators(session_id);
CREATE INDEX idx_stress_indicators_level ON stress_indicators(stress_level);
CREATE INDEX idx_stress_indicators_timestamp ON stress_indicators(timestamp);

-- 스트레스 메트릭 뷰 (통계 조회용)
CREATE OR REPLACE VIEW stress_metrics_by_module AS
SELECT
    module_id,
    COUNT(DISTINCT student_id) as total_students,
    COUNT(CASE WHEN stress_level = 'LOW' THEN 1 END) as low_stress_count,
    COUNT(CASE WHEN stress_level = 'MEDIUM' THEN 1 END) as medium_stress_count,
    COUNT(CASE WHEN stress_level = 'HIGH' THEN 1 END) as high_stress_count,
    AVG(stress_score) as average_stress_score,
    MAX(timestamp) as last_updated
FROM stress_indicators
GROUP BY module_id;

-- 학생별 스트레스 추세 뷰
CREATE OR REPLACE VIEW stress_trend_by_student AS
SELECT
    student_id,
    module_id,
    stress_level,
    stress_score,
    timestamp,
    LAG(stress_score) OVER (PARTITION BY student_id, module_id ORDER BY timestamp) as previous_score,
    LEAD(stress_score) OVER (PARTITION BY student_id, module_id ORDER BY timestamp) as next_score
FROM stress_indicators
ORDER BY student_id, module_id, timestamp DESC;

-- 샘플 데이터 삽입
INSERT INTO students (student_id, name, grade_level) VALUES
    ('student001', '김철수', '3학년'),
    ('student002', '이영희', '3학년'),
    ('student003', '박민수', '4학년')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO modules (module_id, name, subject, grade_level, description) VALUES
    ('module001', '분수 학습', 'mathematics', '3학년', '분수의 개념과 연산을 학습하는 모듈'),
    ('module002', '곱셈 구구단', 'mathematics', '2-3학년', '구구단을 학습하는 모듈')
ON CONFLICT (module_id) DO NOTHING;

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE students IS '학생 정보';
COMMENT ON TABLE modules IS '학습 모듈 정보';
COMMENT ON TABLE learning_activities IS '학습 활동 기록';
COMMENT ON TABLE stress_indicators IS '학습 스트레스 지표';
COMMENT ON VIEW stress_metrics_by_module IS '모듈별 스트레스 통계';
COMMENT ON VIEW stress_trend_by_student IS '학생별 스트레스 추세';
