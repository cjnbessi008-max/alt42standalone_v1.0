-- Function Tree Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Problems table (수학 문제 정보)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_expression TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function Trees table (파싱된 함수 트리 구조)
CREATE TABLE function_trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    expression TEXT NOT NULL,
    tree_data JSONB NOT NULL, -- 트리 구조를 JSON으로 저장
    node_count INTEGER,
    depth INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tree Nodes table (개별 노드 정보)
CREATE TABLE tree_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id UUID REFERENCES function_trees(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    node_type VARCHAR(50) NOT NULL, -- operator, function, variable, constant
    value TEXT NOT NULL,
    position INTEGER NOT NULL, -- 형제 노드 간 순서
    depth INTEGER NOT NULL,
    metadata JSONB, -- 추가 정보 (LaTeX 표현, 설명 등)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (학생 정보)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress table (학생 학습 진행 상황)
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, problem_id)
);

-- Student Interactions table (학생의 트리 노드 클릭 등 인터랙션)
CREATE TABLE student_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- click, hover, expand, collapse
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_function_trees_problem ON function_trees(problem_id);
CREATE INDEX idx_tree_nodes_tree ON tree_nodes(tree_id);
CREATE INDEX idx_tree_nodes_parent ON tree_nodes(parent_id);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_problem ON student_progress(problem_id);
CREATE INDEX idx_student_interactions_student ON student_interactions(student_id);
CREATE INDEX idx_student_interactions_problem ON student_interactions(problem_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty_level);
CREATE INDEX idx_problems_category ON problems(category);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO problems (title, description, function_expression, difficulty_level, category) VALUES
('기본 삼각함수', 'sin 함수의 기본 구조를 이해합니다', 'sin(x)', 1, 'trigonometry'),
('합성 삼각함수', '삼각함수의 합성을 학습합니다', 'sin(2*x + 3)', 2, 'trigonometry'),
('복합 함수', '여러 함수의 조합을 분석합니다', 'sin(x) * cos(x)', 3, 'trigonometry'),
('복잡한 합성함수', '복잡한 함수의 구조를 파악합니다', 'sqrt(x^2 + 1) + log(2*x)', 4, 'composite'),
('고급 함수', '고급 수준의 함수 분석을 수행합니다', 'sin(2*x + 3) * sqrt(x^2 + 1) / (x + 1)', 5, 'advanced');

COMMENT ON TABLE problems IS '수학 문제 정보를 저장하는 테이블';
COMMENT ON TABLE function_trees IS '파싱된 함수의 트리 구조를 저장';
COMMENT ON TABLE tree_nodes IS '트리의 개별 노드 정보';
COMMENT ON TABLE students IS '학생 정보';
COMMENT ON TABLE student_progress IS '학생별 문제 진행 상황';
COMMENT ON TABLE student_interactions IS '학생의 UI 인터랙션 로그';
