-- Initial Schema for AI Education System Pipeline
-- Focus: Confidence-building easy problems feature

-- ============================================
-- Core User Tables
-- ============================================

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,  -- KAIST SSO ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,  -- KAIST SSO ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Module and Content Tables
-- ============================================

-- Modules (generated educational systems)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL,
    grade_level VARCHAR(50),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    status VARCHAR(50) CHECK (status IN ('generating', 'active', 'archived')) DEFAULT 'generating',
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rules (business logic)
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('validation', 'calculation', 'progression', 'feedback')),
    complexity_score INTEGER,
    is_ontology BOOLEAN DEFAULT FALSE,
    code TEXT,
    ontology_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Example: Fraction problems table (template for module-specific tables)
CREATE TABLE IF NOT EXISTS fraction_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_type VARCHAR(50) NOT NULL,  -- 'visualization', 'addition', 'subtraction'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    visual_representation VARCHAR(20) DEFAULT 'pizza',
    numerator_1 INTEGER,
    denominator_1 INTEGER,
    numerator_2 INTEGER,
    denominator_2 INTEGER,
    operation VARCHAR(10),  -- 'add', 'subtract', 'none' for visualization
    correct_answer_numerator INTEGER NOT NULL,
    correct_answer_denominator INTEGER NOT NULL,
    problem_text TEXT,
    hint_text TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONFIDENCE-BUILDING SYSTEM TABLES
-- ============================================

-- Confidence tracking per student-module
CREATE TABLE IF NOT EXISTS confidence_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    current_confidence_score DECIMAL(5,2) DEFAULT 50.0,  -- 0.0 to 100.0
    mastery_count INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0,
    last_problem_difficulty INTEGER DEFAULT 1,
    last_updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- Easy problem tags (marks problems suitable for confidence building)
CREATE TABLE IF NOT EXISTS easy_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_table_name VARCHAR(100) NOT NULL,  -- e.g., 'fraction_problems'
    problem_id UUID NOT NULL,  -- FK to the actual problem table
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 3) DEFAULT 1,
    is_confidence_builder BOOLEAN DEFAULT TRUE,
    confidence_boost_amount DECIMAL(3,2) DEFAULT 0.10,  -- 10% boost per correct answer
    success_rate DECIMAL(5,2),  -- Track how often students get it right
    average_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts tracking
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    problem_table_name VARCHAR(100) NOT NULL,
    problem_id UUID NOT NULL,
    answer_data JSONB NOT NULL,  -- Flexible to store different answer types
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hint_used BOOLEAN DEFAULT FALSE,
    difficulty_level INTEGER,
    confidence_before DECIMAL(5,2),
    confidence_after DECIMAL(5,2),
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Session tracking for confidence
CREATE TABLE IF NOT EXISTS student_session_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    session_date DATE NOT NULL,
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    easy_problems_attempted INTEGER DEFAULT 0,
    easy_problems_correct INTEGER DEFAULT 0,
    average_time_per_problem DECIMAL(8,2),
    session_confidence_delta DECIMAL(5,2),  -- Change in confidence during session
    session_start_time TIMESTAMP,
    session_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id, session_date)
);

-- ============================================
-- Progress Tracking
-- ============================================

-- Student progress per module
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_problems_attempted INTEGER DEFAULT 0,
    total_problems_correct INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- ============================================
-- System Tables
-- ============================================

-- Generation jobs (audit trail)
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    stage VARCHAR(50),  -- 'world_model', 'rules', 'schema', 'ui', 'deployment'
    status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dynamic schemas metadata
CREATE TABLE IF NOT EXISTS dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_confidence_student_module ON confidence_levels(student_id, module_id);
CREATE INDEX idx_easy_problems_module ON easy_problems(module_id, difficulty_level);
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id, attempted_at DESC);
CREATE INDEX idx_student_attempts_module ON student_attempts(module_id, problem_id);
CREATE INDEX idx_session_stats_student ON student_session_stats(student_id, session_date DESC);
CREATE INDEX idx_student_progress_student ON student_progress(student_id, module_id);
CREATE INDEX idx_fraction_problems_module ON fraction_problems(module_id, difficulty_level);

-- ============================================
-- Initial Seed Data (for testing)
-- ============================================

-- Create a test teacher
INSERT INTO teachers (external_id, name, email, department) VALUES
('teacher001', 'Dr. Kim', 'kim@kaist.ac.kr', 'Mathematics')
ON CONFLICT (external_id) DO NOTHING;

-- Create test students
INSERT INTO students (external_id, name, email, grade_level) VALUES
('student001', 'Park Minho', 'minho@kaist.ac.kr', 'Grade 3'),
('student002', 'Lee Jiwon', 'jiwon@kaist.ac.kr', 'Grade 3'),
('student003', 'Choi Yuna', 'yuna@kaist.ac.kr', 'Grade 3')
ON CONFLICT (external_id) DO NOTHING;

-- Create a test module (Fractions)
INSERT INTO modules (id, name, description, subject, grade_level, teacher_id, status) VALUES
('00000000-0000-0000-0000-000000000001',
 'Fractions Basics',
 'Understanding fractions through visual representations',
 'Mathematics',
 'Grade 3',
 (SELECT id FROM teachers WHERE external_id = 'teacher001'),
 'active')
ON CONFLICT (id) DO NOTHING;

-- Create easy fraction problems
INSERT INTO fraction_problems (id, module_id, problem_type, difficulty_level, visual_representation, numerator_1, denominator_1, operation, correct_answer_numerator, correct_answer_denominator, problem_text, hint_text, explanation) VALUES
-- Level 1: Very easy visualization
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'visualization', 1, 'pizza', 1, 2, 'none', 1, 2,
 'What fraction of the pizza is colored?',
 'Count the colored slices and total slices',
 'Half of the pizza is colored, so the answer is 1/2'),

('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'visualization', 1, 'circle', 1, 4, 'none', 1, 4,
 'What fraction of the circle is shaded?',
 'The circle is divided into 4 equal parts',
 'One out of four parts is shaded, so the answer is 1/4'),

-- Level 2: Simple addition with same denominator
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'addition', 2, 'pizza', 1, 4, 1, 4, 'add', 2, 4,
 'You have 1/4 of a pizza and your friend gives you another 1/4. How much pizza do you have now?',
 'When adding fractions with the same denominator, just add the numerators',
 '1/4 + 1/4 = 2/4'),

('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'addition', 2, 'rectangle', 1, 3, 1, 3, 'add', 2, 3,
 'Add these fractions: 1/3 + 1/3',
 'Same denominators mean we just add the top numbers',
 '1/3 + 1/3 = 2/3'),

-- Level 3: Easy subtraction
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'subtraction', 3, 'pizza', 3, 4, 1, 4, 'subtract', 2, 4,
 'You have 3/4 of a pizza and eat 1/4. How much is left?',
 'Subtract the numerators when denominators are the same',
 '3/4 - 1/4 = 2/4')
ON CONFLICT (id) DO NOTHING;

-- Mark these as easy/confidence-building problems
INSERT INTO easy_problems (module_id, problem_table_name, problem_id, difficulty_level, is_confidence_builder, confidence_boost_amount) VALUES
('00000000-0000-0000-0000-000000000001', 'fraction_problems', '10000000-0000-0000-0000-000000000001', 1, TRUE, 0.15),
('00000000-0000-0000-0000-000000000001', 'fraction_problems', '10000000-0000-0000-0000-000000000002', 1, TRUE, 0.15),
('00000000-0000-0000-0000-000000000001', 'fraction_problems', '10000000-0000-0000-0000-000000000003', 2, TRUE, 0.12),
('00000000-0000-0000-0000-000000000001', 'fraction_problems', '10000000-0000-0000-0000-000000000004', 2, TRUE, 0.12),
('00000000-0000-0000-0000-000000000001', 'fraction_problems', '10000000-0000-0000-0000-000000000005', 3, TRUE, 0.10)
ON CONFLICT DO NOTHING;

-- Initialize confidence levels for test students
INSERT INTO confidence_levels (student_id, module_id, current_confidence_score) VALUES
((SELECT id FROM students WHERE external_id = 'student001'), '00000000-0000-0000-0000-000000000001', 30.0),
((SELECT id FROM students WHERE external_id = 'student002'), '00000000-0000-0000-0000-000000000001', 45.0),
((SELECT id FROM students WHERE external_id = 'student003'), '00000000-0000-0000-0000-000000000001', 25.0)
ON CONFLICT (student_id, module_id) DO NOTHING;
