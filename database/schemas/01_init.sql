-- Alt42 Standalone Database Schema
-- Branch Counting Module

-- 학생 테이블
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200),
    email VARCHAR(200),
    grade_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 모듈 테이블
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    module_type VARCHAR(50) NOT NULL, -- 'branch_counting', 'fractions', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    config JSONB, -- 모듈별 설정 (트리 구조, 난이도 등)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 트리 문제 테이블 (Branch Counting 전용)
CREATE TABLE IF NOT EXISTS tree_problems (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    tree_structure JSONB NOT NULL, -- 전체 트리 구조 (JSON)
    total_branches INTEGER NOT NULL,
    max_depth INTEGER NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 학생 답변 기록
CREATE TABLE IF NOT EXISTS student_answers (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    tree_problem_id INTEGER REFERENCES tree_problems(id) ON DELETE CASCADE,
    answer INTEGER NOT NULL,
    correct_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 학생 진행 상황
CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    average_difficulty DECIMAL(3, 2),
    highest_difficulty INTEGER,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module_id)
);

-- 리더보드용 뷰
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    s.name,
    s.student_id,
    sp.total_attempts,
    sp.correct_attempts,
    ROUND((sp.correct_attempts::DECIMAL / NULLIF(sp.total_attempts, 0)) * 100, 2) AS accuracy_percentage,
    sp.highest_difficulty,
    sp.last_activity
FROM students s
JOIN student_progress sp ON s.id = sp.student_id
WHERE sp.total_attempts > 0
ORDER BY accuracy_percentage DESC, sp.highest_difficulty DESC, sp.total_attempts DESC;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_module_id ON student_answers(module_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_tree_problems_difficulty ON tree_problems(difficulty);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
    BEFORE UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO modules (module_type, title, description, difficulty, config) VALUES
('branch_counting', '나뭇가지 세기 - 초급', '나뭇가지를 세는 교육 모듈 (난이도 1)', 1, '{"maxDepth": 2, "minBranches": 3, "maxBranches": 7}'::jsonb),
('branch_counting', '나뭇가지 세기 - 중급', '나뭇가지를 세는 교육 모듈 (난이도 3)', 3, '{"maxDepth": 4, "minBranches": 10, "maxBranches": 20}'::jsonb),
('branch_counting', '나뭇가지 세기 - 고급', '나뭇가지를 세는 교육 모듈 (난이도 5)', 5, '{"maxDepth": 6, "minBranches": 20, "maxBranches": 40}'::jsonb)
ON CONFLICT DO NOTHING;

-- 테스트 학생 데이터
INSERT INTO students (student_id, name, email, grade_level) VALUES
('student001', '김철수', 'chulsoo@example.com', 3),
('student002', '이영희', 'younghee@example.com', 4),
('student003', '박민수', 'minsoo@example.com', 3)
ON CONFLICT (student_id) DO NOTHING;

COMMENT ON TABLE students IS '학생 정보 테이블';
COMMENT ON TABLE modules IS '교육 모듈 테이블';
COMMENT ON TABLE tree_problems IS '트리 문제 저장 (Branch Counting)';
COMMENT ON TABLE student_answers IS '학생 답변 기록';
COMMENT ON TABLE student_progress IS '학생별 진행 상황 추적';
