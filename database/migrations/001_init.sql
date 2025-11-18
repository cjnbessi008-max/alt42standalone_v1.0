-- Condition Doors Database Schema

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    premise TEXT NOT NULL,
    conclusion TEXT NOT NULL,
    necessary_statement TEXT NOT NULL,
    necessary_is_correct BOOLEAN NOT NULL,
    sufficient_statement TEXT NOT NULL,
    sufficient_is_correct BOOLEAN NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 답안 기록 테이블
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    problem_id VARCHAR(50) REFERENCES problems(id),
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('necessary', 'sufficient')),
    is_correct BOOLEAN NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_answers_problem_id ON answers(problem_id);
CREATE INDEX IF NOT EXISTS idx_answers_timestamp ON answers(timestamp);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
