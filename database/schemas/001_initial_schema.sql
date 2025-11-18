-- AI Education Pipeline - Initial Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE SYSTEM TABLES
-- ============================================================================

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'teacher'
        CHECK (role IN ('teacher', 'admin', 'system_maintainer')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(20),
    enrolled_modules UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL DEFAULT 'mathematics',
    grade_level VARCHAR(20),
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'generating'
        CHECK (status IN ('generating', 'active', 'archived')),
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generation jobs tracking
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL
        CHECK (stage IN ('world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rules table
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL
        CHECK (type IN ('validation', 'calculation', 'progression', 'feedback')),
    complexity_score INTEGER,
    is_ontology BOOLEAN DEFAULT FALSE,
    code TEXT,
    ontology_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dynamic schemas metadata
CREATE TABLE dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ONE-FRAME CASE TABLES
-- ============================================================================

-- Case visualizations metadata
CREATE TABLE case_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    problem_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    layout_type VARCHAR(50) NOT NULL
        CHECK (layout_type IN ('tree', 'grid', 'radial', 'flow')),
    case_data JSONB NOT NULL,
    animation_config JSONB,
    viewport_config JSONB DEFAULT '{
        "position": "bottom-right",
        "width": 375,
        "height": 667,
        "scale": 0.6,
        "showFrame": true
    }',
    created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student interactions with cases
CREATE TABLE case_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES case_visualizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    case_node_id VARCHAR(255) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL
        CHECK (interaction_type IN ('view', 'click', 'hover', 'select')),
    interaction_data JSONB,
    time_spent_ms INTEGER,
    interacted_at TIMESTAMP DEFAULT NOW()
);

-- Student progress on case explorations
CREATE TABLE case_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES case_visualizations(id) ON DELETE CASCADE,
    completed_cases TEXT[],
    current_case VARCHAR(255),
    total_time_spent_ms BIGINT DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    last_interaction_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(student_id, case_id)
);

-- ============================================================================
-- LMS INTEGRATION TABLES
-- ============================================================================

-- LMS problems (from Moodle or mock)
CREATE TABLE lms_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255),
    lms_type VARCHAR(50) NOT NULL DEFAULT 'mock'
        CHECK (lms_type IN ('mock', 'moodle', 'canvas')),
    problem_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_data JSONB NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LMS sync log
CREATE TABLE lms_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_type VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL
        CHECK (sync_type IN ('problem_fetch', 'progress_update', 'grade_sync')),
    external_id VARCHAR(255),
    status VARCHAR(50) NOT NULL
        CHECK (status IN ('success', 'failed', 'partial')),
    details JSONB,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core tables
CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_generation_jobs_module ON generation_jobs(module_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_rules_module ON rules(module_id);

-- Case tables
CREATE INDEX idx_case_visualizations_module ON case_visualizations(module_id);
CREATE INDEX idx_case_interactions_student ON case_interactions(student_id);
CREATE INDEX idx_case_interactions_case ON case_interactions(case_id);
CREATE INDEX idx_case_interactions_time ON case_interactions(interacted_at);
CREATE INDEX idx_case_progress_student ON case_progress(student_id);
CREATE INDEX idx_case_progress_case ON case_progress(case_id);

-- LMS tables
CREATE INDEX idx_lms_problems_type ON lms_problems(lms_type, problem_type);
CREATE INDEX idx_lms_sync_log_type ON lms_sync_log(lms_type, sync_type);
CREATE INDEX idx_lms_sync_log_time ON lms_sync_log(synced_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_visualizations_updated_at BEFORE UPDATE ON case_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_problems_updated_at BEFORE UPDATE ON lms_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default system teacher
INSERT INTO teachers (name, email, role) VALUES
    ('System', 'system@kaist.edu', 'system_maintainer');

-- Sample students for testing
INSERT INTO students (name, grade_level) VALUES
    ('김민수', '3학년'),
    ('이지은', '3학년'),
    ('박준호', '4학년');

-- Done!
COMMENT ON DATABASE CURRENT_DATABASE() IS 'AI Education Pipeline Database';
