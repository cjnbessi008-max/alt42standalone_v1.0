-- LMS Integration and Perspective Shift Tips Database Schema

-- Problem Types (이차함수, 도형 등)
CREATE TABLE problem_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ko VARCHAR(100) NOT NULL,  -- 한국어 이름
    category VARCHAR(50) NOT NULL,  -- algebra, geometry, calculus, etc.
    description TEXT,
    description_ko TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Perspective Shift Tips (관점 전환 팁)
CREATE TABLE perspective_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_type_id UUID REFERENCES problem_types(id) ON DELETE CASCADE,
    tip_level INTEGER NOT NULL,  -- 1: basic, 2: intermediate, 3: advanced
    perspective_type VARCHAR(50) NOT NULL,  -- visual, algebraic, geometric, conceptual
    title VARCHAR(200) NOT NULL,
    title_ko VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    content_ko TEXT NOT NULL,
    example_problem JSONB,  -- 예제 문제
    trigger_conditions JSONB,  -- 언제 이 팁을 보여줄지
    effectiveness_score DECIMAL(3,2) DEFAULT 0.0,  -- 0.0-1.0
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LMS Integration Settings
CREATE TABLE lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_type VARCHAR(50) NOT NULL,  -- canvas, moodle, blackboard, custom
    institution_name VARCHAR(200),
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students (from LMS)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_integration_id UUID REFERENCES lms_integrations(id),
    external_student_id VARCHAR(200),  -- LMS의 학생 ID
    name VARCHAR(200),
    grade_level VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lms_integration_id, external_student_id)
);

-- Problems assigned to students
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_type_id UUID REFERENCES problem_types(id),
    lms_integration_id UUID REFERENCES lms_integrations(id),
    external_problem_id VARCHAR(200),  -- LMS의 문제 ID
    title VARCHAR(500),
    content JSONB NOT NULL,  -- 문제 내용
    difficulty_level INTEGER DEFAULT 1,  -- 1-5
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student problem attempts and tip usage tracking
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    problem_id UUID REFERENCES problems(id),
    attempt_number INTEGER NOT NULL,
    answer_submitted JSONB,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    tips_viewed UUID[],  -- Array of perspective_tips.id
    tip_helped BOOLEAN,  -- 학생 피드백: 팁이 도움되었는지
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, problem_id, attempt_number)
);

-- Student learning profiles (어떤 관점이 효과적인지 추적)
CREATE TABLE student_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    problem_type_id UUID REFERENCES problem_types(id),
    preferred_perspective_type VARCHAR(50),  -- visual, algebraic, etc.
    weak_areas JSONB DEFAULT '[]',
    strong_areas JSONB DEFAULT '[]',
    tip_effectiveness JSONB DEFAULT '{}',  -- tip_id -> effectiveness score
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, problem_type_id)
);

-- Tip recommendation log
CREATE TABLE tip_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    problem_id UUID REFERENCES problems(id),
    tip_id UUID REFERENCES perspective_tips(id),
    reason TEXT,  -- 왜 이 팁을 추천했는지
    was_shown BOOLEAN DEFAULT false,
    was_helpful BOOLEAN,
    student_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_perspective_tips_problem_type ON perspective_tips(problem_type_id);
CREATE INDEX idx_perspective_tips_level ON perspective_tips(tip_level);
CREATE INDEX idx_problems_type ON problems(problem_type_id);
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_tip_recommendations_student ON tip_recommendations(student_id);
CREATE INDEX idx_learning_profiles_student ON student_learning_profiles(student_id);

-- Insert default problem types (Korean math curriculum)
INSERT INTO problem_types (name, name_ko, category, description, description_ko) VALUES
('quadratic_functions', '이차함수', 'algebra', 'Quadratic functions and equations', '이차함수와 이차방정식'),
('plane_geometry', '평면도형', 'geometry', 'Plane geometry including triangles, circles, polygons', '삼각형, 원, 다각형 등 평면도형'),
('solid_geometry', '입체도형', 'geometry', 'Solid geometry including prisms, pyramids, spheres', '각기둥, 각뿔, 구 등 입체도형'),
('trigonometry', '삼각함수', 'algebra', 'Trigonometric functions and identities', '삼각함수와 삼각 항등식'),
('exponential_logarithm', '지수와 로그', 'algebra', 'Exponential and logarithmic functions', '지수함수와 로그함수'),
('sequences_series', '수열', 'algebra', 'Sequences and series', '등차수열, 등비수열'),
('probability', '확률', 'statistics', 'Probability and combinatorics', '확률과 경우의 수'),
('statistics', '통계', 'statistics', 'Statistics and data analysis', '통계와 자료 분석'),
('vectors', '벡터', 'geometry', 'Vectors in 2D and 3D', '평면벡터와 공간벡터'),
('differential_calculus', '미분', 'calculus', 'Differential calculus', '미분법'),
('integral_calculus', '적분', 'calculus', 'Integral calculus', '적분법');
