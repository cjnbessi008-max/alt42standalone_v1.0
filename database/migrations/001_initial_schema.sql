-- PostgreSQL 15+ Schema for AI Education System
-- Inverse Reflection Module

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for organization
CREATE SCHEMA IF NOT EXISTS ai_education;
SET search_path TO ai_education, public;

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (integrated with Moodle or standalone)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE, -- Moodle user ID
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- MODULE TABLES
-- =============================================

-- Educational modules (e.g., Inverse Reflection, Fractions, etc.)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(100) NOT NULL, -- 'inverse_reflection', 'fractions', etc.
    configuration JSONB DEFAULT '{}', -- Module-specific config
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_modules_type ON modules(module_type);
CREATE INDEX idx_modules_created_by ON modules(created_by);

-- =============================================
-- INVERSE REFLECTION SPECIFIC TABLES
-- =============================================

-- Problems for inverse reflection
CREATE TABLE inverse_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    external_question_id VARCHAR(255), -- Moodle question ID

    -- Function definitions
    function_type VARCHAR(50) NOT NULL, -- 'linear', 'quadratic', 'exponential', etc.
    original_function TEXT NOT NULL, -- e.g., '2*x + 3'
    inverse_function TEXT NOT NULL, -- e.g., '(x - 3) / 2'

    -- Domain and range
    domain_min DECIMAL(10, 4) DEFAULT -10,
    domain_max DECIMAL(10, 4) DEFAULT 10,
    range_min DECIMAL(10, 4),
    range_max DECIMAL(10, 4),

    -- Difficulty and metadata
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    tags TEXT[], -- Array of tags for categorization
    hints JSONB DEFAULT '[]', -- Array of hint objects

    -- Visualization settings
    visualization_config JSONB DEFAULT '{
        "show_grid": true,
        "show_reflection_line": true,
        "animation_speed": "medium",
        "color_original": "#2196F3",
        "color_inverse": "#F44336",
        "color_reflection_line": "#4CAF50",
        "enable_interactive_points": true
    }',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inverse_problems_module ON inverse_problems(module_id);
CREATE INDEX idx_inverse_problems_external ON inverse_problems(external_question_id);
CREATE INDEX idx_inverse_problems_difficulty ON inverse_problems(difficulty_level);
CREATE INDEX idx_inverse_problems_type ON inverse_problems(function_type);

-- Student attempts
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES inverse_problems(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Attempt data
    attempted_inverse TEXT,
    is_correct BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    max_points INTEGER DEFAULT 100,

    -- Interaction tracking
    time_spent_seconds INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    points_reflected INTEGER DEFAULT 0, -- Number of points student reflected
    interaction_log JSONB DEFAULT '[]', -- Detailed interaction events

    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_attempts_time ON student_attempts(attempted_at);

-- =============================================
-- AI PIPELINE TABLES
-- =============================================

-- Generation requests (teacher requests to AI pipeline)
CREATE TABLE generation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id),

    -- Request details
    request_text TEXT NOT NULL, -- Natural language request
    request_type VARCHAR(50) NOT NULL, -- 'new_module', 'modify_module', etc.
    module_type VARCHAR(100), -- Target module type

    -- Pipeline status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    current_stage VARCHAR(100), -- Current pipeline stage
    progress_percentage INTEGER DEFAULT 0,

    -- AI interaction
    claude_conversations JSONB DEFAULT '[]', -- Array of conversation turns
    generated_artifacts JSONB DEFAULT '{}', -- Generated code, schemas, etc.

    -- Result
    generated_module_id UUID REFERENCES modules(id),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gen_requests_teacher ON generation_requests(teacher_id);
CREATE INDEX idx_gen_requests_status ON generation_requests(status);
CREATE INDEX idx_gen_requests_created ON generation_requests(created_at);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Student progress tracking
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,

    -- Progress metrics
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    average_score DECIMAL(5, 2) DEFAULT 0,

    -- Learning analytics
    strengths JSONB DEFAULT '[]', -- Topics student excels at
    weaknesses JSONB DEFAULT '[]', -- Topics needing improvement
    learning_velocity DECIMAL(5, 2), -- Rate of improvement

    -- Timestamps
    first_attempt TIMESTAMP WITH TIME ZONE,
    last_attempt TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_progress_student_module ON student_progress(student_id, module_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inverse_problems_updated_at BEFORE UPDATE ON inverse_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_requests_updated_at BEFORE UPDATE ON generation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default admin user
INSERT INTO users (username, email, full_name, role) VALUES
    ('admin', 'admin@ai-education.local', 'System Administrator', 'admin'),
    ('demo_teacher', 'teacher@ai-education.local', 'Demo Teacher', 'teacher'),
    ('demo_student', 'student@ai-education.local', 'Demo Student', 'student')
ON CONFLICT (username) DO NOTHING;

-- Insert Inverse Reflection module
INSERT INTO modules (name, description, module_type, created_by) VALUES
    ('Inverse Reflection', 'Interactive visualization of inverse functions using mirror reflection across y=x line', 'inverse_reflection',
     (SELECT id FROM users WHERE username = 'demo_teacher'))
ON CONFLICT DO NOTHING;

-- Insert sample problems
INSERT INTO inverse_problems (
    module_id,
    external_question_id,
    function_type,
    original_function,
    inverse_function,
    domain_min,
    domain_max,
    difficulty_level,
    tags,
    hints
) VALUES
    (
        (SELECT id FROM modules WHERE module_type = 'inverse_reflection' LIMIT 1),
        'moodle_q_001',
        'linear',
        '2*x + 3',
        '(x - 3) / 2',
        -5, 5,
        'easy',
        ARRAY['linear_functions', 'basic_algebra'],
        '[
            {"step": 1, "text": "Step 1: Replace f(x) with y"},
            {"step": 2, "text": "Step 2: Swap x and y variables"},
            {"step": 3, "text": "Step 3: Solve for y to find the inverse"}
        ]'::jsonb
    ),
    (
        (SELECT id FROM modules WHERE module_type = 'inverse_reflection' LIMIT 1),
        'moodle_q_002',
        'quadratic',
        'x^2',
        'sqrt(x)',
        0, 10,
        'medium',
        ARRAY['quadratic_functions', 'square_roots', 'domain_restrictions'],
        '[
            {"step": 1, "text": "Remember: Domain must be restricted to x >= 0"},
            {"step": 2, "text": "The inverse of y = x² is x = y²"},
            {"step": 3, "text": "Solve: y = √x (taking only positive root)"}
        ]'::jsonb
    ),
    (
        (SELECT id FROM modules WHERE module_type = 'inverse_reflection' LIMIT 1),
        'moodle_q_003',
        'exponential',
        '2^x',
        'log(x) / log(2)',
        -3, 3,
        'hard',
        ARRAY['exponential_functions', 'logarithms'],
        '[
            {"step": 1, "text": "Use logarithms to find the inverse"},
            {"step": 2, "text": "If y = 2^x, then x = 2^y"},
            {"step": 3, "text": "Apply log₂ to both sides: y = log₂(x)"}
        ]'::jsonb
    );

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_education TO ai_edu_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai_education TO ai_edu_user;
GRANT USAGE ON SCHEMA ai_education TO ai_edu_user;
