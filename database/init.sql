-- Concept Tool Bias Analysis System - Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200),
    grade_level VARCHAR(50),
    performance_level VARCHAR(50) CHECK (performance_level IN ('low', 'medium', 'high')),
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200),
    subject VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Concept tools/resources
CREATE TABLE concept_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_name VARCHAR(200) UNIQUE NOT NULL,
    tool_category VARCHAR(100),
    description TEXT,
    difficulty_level VARCHAR(50),
    target_grade_levels VARCHAR(200),
    learning_objectives TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage sessions
CREATE TABLE usage_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES concept_tools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    duration_seconds INTEGER,
    interactions_count INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    success_rate DECIMAL(5,2),
    context VARCHAR(100), -- 'classroom', 'homework', 'self_study'
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student performance on specific tools
CREATE TABLE tool_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES concept_tools(id) ON DELETE CASCADE,
    attempts_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    total_time_spent_seconds INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    mastery_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, tool_id)
);

-- Bias analysis results (cached)
CREATE TABLE bias_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_type VARCHAR(100) NOT NULL, -- 'frequency', 'demographic', 'temporal', 'effectiveness'
    analysis_date TIMESTAMP DEFAULT NOW(),
    time_period_start TIMESTAMP,
    time_period_end TIMESTAMP,
    filters JSONB, -- Store filter criteria
    results JSONB NOT NULL, -- Store analysis results
    statistical_significance JSONB, -- p-values, chi-square, etc.
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tool recommendations (for bias mitigation)
CREATE TABLE tool_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES concept_tools(id) ON DELETE CASCADE,
    recommendation_reason VARCHAR(200),
    priority INTEGER DEFAULT 0,
    is_diversity_boost BOOLEAN DEFAULT FALSE, -- Recommended to increase diversity
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Import logs (track data imports)
CREATE TABLE import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50), -- 'csv', 'api', 'manual'
    source VARCHAR(200),
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_log TEXT,
    import_started TIMESTAMP DEFAULT NOW(),
    import_completed TIMESTAMP,
    status VARCHAR(50) DEFAULT 'in_progress'
);

-- Indexes for performance
CREATE INDEX idx_usage_sessions_student ON usage_sessions(student_id);
CREATE INDEX idx_usage_sessions_tool ON usage_sessions(tool_id);
CREATE INDEX idx_usage_sessions_timestamp ON usage_sessions(session_start);
CREATE INDEX idx_usage_sessions_teacher ON usage_sessions(teacher_id);
CREATE INDEX idx_tool_performance_student ON tool_performance(student_id);
CREATE INDEX idx_tool_performance_tool ON tool_performance(tool_id);
CREATE INDEX idx_bias_analysis_type ON bias_analysis_results(analysis_type);
CREATE INDEX idx_students_grade ON students(grade_level);
CREATE INDEX idx_students_performance ON students(performance_level);

-- Views for common queries

-- Tool usage summary
CREATE VIEW v_tool_usage_summary AS
SELECT
    ct.tool_name,
    ct.tool_category,
    COUNT(DISTINCT us.student_id) as unique_students,
    COUNT(us.id) as total_sessions,
    AVG(us.duration_seconds) as avg_duration_seconds,
    AVG(us.success_rate) as avg_success_rate,
    SUM(us.duration_seconds) as total_time_spent
FROM concept_tools ct
LEFT JOIN usage_sessions us ON ct.id = us.tool_id
GROUP BY ct.id, ct.tool_name, ct.tool_category;

-- Student usage patterns
CREATE VIEW v_student_usage_patterns AS
SELECT
    s.student_id,
    s.grade_level,
    s.performance_level,
    COUNT(DISTINCT us.tool_id) as tools_used_count,
    COUNT(us.id) as total_sessions,
    SUM(us.duration_seconds) as total_time_spent,
    AVG(us.success_rate) as avg_success_rate
FROM students s
LEFT JOIN usage_sessions us ON s.id = us.student_id
GROUP BY s.id, s.student_id, s.grade_level, s.performance_level;

-- Bias indicators view
CREATE VIEW v_bias_indicators AS
SELECT
    ct.tool_name,
    s.grade_level,
    s.performance_level,
    COUNT(us.id) as usage_count,
    AVG(us.success_rate) as avg_success_rate,
    AVG(us.duration_seconds) as avg_duration,
    STDDEV(us.success_rate) as success_rate_stddev
FROM usage_sessions us
JOIN concept_tools ct ON us.tool_id = ct.id
JOIN students s ON us.student_id = s.id
GROUP BY ct.tool_name, s.grade_level, s.performance_level;

-- Insert sample data

-- Sample concept tools
INSERT INTO concept_tools (tool_name, tool_category, description, difficulty_level, target_grade_levels, learning_objectives) VALUES
('FractionVisualizer', 'Visual Learning', 'Interactive visual representation of fractions using pizza and bar models', 'easy', '3,4,5', ARRAY['Understand fraction concepts', 'Visual fraction comparison']),
('NumberLine', 'Visual Learning', 'Interactive number line for understanding number relationships', 'medium', '2,3,4', ARRAY['Number ordering', 'Addition and subtraction visualization']),
('EquationSolver', 'Problem Solving', 'Step-by-step algebraic equation solver', 'hard', '6,7,8', ARRAY['Algebraic thinking', 'Problem-solving strategies']),
('GeometryBuilder', 'Interactive', 'Build and manipulate geometric shapes', 'medium', '4,5,6', ARRAY['Spatial reasoning', 'Geometric properties']),
('MathQuiz', 'Assessment', 'Adaptive mathematics quiz system', 'medium', '1,2,3,4,5,6,7,8', ARRAY['Skill assessment', 'Adaptive learning']),
('MultiplicationTable', 'Drill & Practice', 'Interactive multiplication table practice', 'easy', '2,3,4', ARRAY['Multiplication facts', 'Automaticity']),
('WordProblemHelper', 'Problem Solving', 'Guided word problem solving assistant', 'hard', '5,6,7,8', ARRAY['Reading comprehension', 'Problem representation']),
('PatternRecognition', 'Conceptual', 'Pattern identification and continuation', 'medium', '1,2,3,4,5', ARRAY['Pattern recognition', 'Logical thinking']);

-- Sample teachers
INSERT INTO teachers (teacher_id, name, subject) VALUES
('T001', 'Kim Minji', 'Mathematics'),
('T002', 'Lee Junho', 'Mathematics'),
('T003', 'Park Sujin', 'Mathematics');

-- Sample students (will be populated via data import)
INSERT INTO students (student_id, name, grade_level, performance_level, gender) VALUES
('S001', 'Student A', '3', 'high', 'F'),
('S002', 'Student B', '3', 'medium', 'M'),
('S003', 'Student C', '4', 'high', 'F'),
('S004', 'Student D', '4', 'low', 'M'),
('S005', 'Student E', '5', 'medium', 'F');

COMMENT ON TABLE students IS 'Student demographic and profile information';
COMMENT ON TABLE concept_tools IS 'Educational concept tools and learning resources';
COMMENT ON TABLE usage_sessions IS 'Individual tool usage sessions with performance metrics';
COMMENT ON TABLE bias_analysis_results IS 'Cached results of bias analyses';
COMMENT ON TABLE tool_performance IS 'Aggregated student performance per tool';
