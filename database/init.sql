-- Transform Vector Module Database Schema
-- PostgreSQL 15+

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Vector transformation problems
CREATE TABLE IF NOT EXISTS vector_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(50) NOT NULL, -- 'rotation', 'scaling', 'combined'

    -- Initial vector
    initial_x DECIMAL(10, 2) NOT NULL,
    initial_y DECIMAL(10, 2) NOT NULL,

    -- Transformation parameters
    rotation_angle DECIMAL(10, 2), -- degrees
    scale_x DECIMAL(10, 2), -- x-axis scaling factor
    scale_y DECIMAL(10, 2), -- y-axis scaling factor

    -- Expected result vector
    expected_x DECIMAL(10, 2) NOT NULL,
    expected_y DECIMAL(10, 2) NOT NULL,

    -- Metadata
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    animation_duration INTEGER DEFAULT 2000, -- milliseconds

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_transformation CHECK (
        (problem_type = 'rotation' AND rotation_angle IS NOT NULL) OR
        (problem_type = 'scaling' AND scale_x IS NOT NULL AND scale_y IS NOT NULL) OR
        (problem_type = 'combined' AND rotation_angle IS NOT NULL AND scale_x IS NOT NULL AND scale_y IS NOT NULL)
    )
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    problem_id UUID NOT NULL REFERENCES vector_problems(id) ON DELETE CASCADE,

    -- Student's answer
    answer_x DECIMAL(10, 2),
    answer_y DECIMAL(10, 2),

    -- Attempt metadata
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 1,
    hint_used BOOLEAN DEFAULT false,

    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    grade_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample module
INSERT INTO modules (name, description, module_type)
VALUES (
    'Transform Vector',
    '벡터 변환(회전/신장) 애니메이션 학습 모듈',
    'vector_transformation'
) ON CONFLICT DO NOTHING;

-- Insert sample vector problems
INSERT INTO vector_problems (
    module_id,
    problem_type,
    initial_x,
    initial_y,
    rotation_angle,
    scale_x,
    scale_y,
    expected_x,
    expected_y,
    difficulty_level,
    animation_duration
)
SELECT
    m.id,
    'rotation',
    3.0,
    0.0,
    90.0,
    NULL,
    NULL,
    0.0,
    3.0,
    1,
    2000
FROM modules m
WHERE m.module_type = 'vector_transformation'
ON CONFLICT DO NOTHING;

INSERT INTO vector_problems (
    module_id,
    problem_type,
    initial_x,
    initial_y,
    rotation_angle,
    scale_x,
    scale_y,
    expected_x,
    expected_y,
    difficulty_level,
    animation_duration
)
SELECT
    m.id,
    'scaling',
    2.0,
    1.0,
    NULL,
    2.0,
    3.0,
    4.0,
    3.0,
    2,
    2500
FROM modules m
WHERE m.module_type = 'vector_transformation'
ON CONFLICT DO NOTHING;

INSERT INTO vector_problems (
    module_id,
    problem_type,
    initial_x,
    initial_y,
    rotation_angle,
    scale_x,
    scale_y,
    expected_x,
    expected_y,
    difficulty_level,
    animation_duration
)
SELECT
    m.id,
    'combined',
    1.0,
    1.0,
    45.0,
    2.0,
    2.0,
    0.0,
    2.83,
    4,
    3000
FROM modules m
WHERE m.module_type = 'vector_transformation'
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_vector_problems_module ON vector_problems(module_id);
CREATE INDEX idx_vector_problems_type ON vector_problems(problem_type);
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for modules table
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
