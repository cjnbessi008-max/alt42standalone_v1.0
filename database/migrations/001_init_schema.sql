-- AI Education System Pipeline Database Schema
-- Version: 1.0.0
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('teacher', 'admin', 'system_maintainer')) DEFAULT 'teacher',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    student_number VARCHAR(50) UNIQUE,
    grade_level VARCHAR(20),
    enrolled_modules UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) CHECK (subject IN ('mathematics')) DEFAULT 'mathematics',
    grade_level VARCHAR(20),
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    teacher_request TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'generating', 'active', 'archived', 'failed')) DEFAULT 'pending',
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_subject ON modules(subject);

-- Generation Jobs table (tracks pipeline progress)
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    stage VARCHAR(50) CHECK (stage IN (
        'world_model',
        'rule_engine',
        'data_manager',
        'input_strategy',
        'ui_generator',
        'deployer'
    )) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_log TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE(module_id, stage)
);

CREATE INDEX idx_generation_jobs_module ON generation_jobs(module_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_stage ON generation_jobs(stage);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('validation', 'calculation', 'progression', 'feedback')) NOT NULL,
    complexity_score INTEGER DEFAULT 0,
    is_ontology BOOLEAN DEFAULT FALSE,
    code TEXT NOT NULL,
    ontology_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rules_module ON rules(module_id);
CREATE INDEX idx_rules_type ON rules(type);

-- Dynamic Schemas table (metadata about generated schemas)
CREATE TABLE IF NOT EXISTS dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    applied_at TIMESTAMP
);

CREATE INDEX idx_dynamic_schemas_module ON dynamic_schemas(module_id);

-- Student Progress table (generic progress tracking)
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    module_specific_data JSONB DEFAULT '{}'
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);

-- Module Analytics table
CREATE TABLE IF NOT EXISTS module_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_module_analytics_module ON module_analytics(module_id);
CREATE INDEX idx_module_analytics_metric ON module_analytics(metric_name);

-- Moodle Integration table (for future LMS integration)
CREATE TABLE IF NOT EXISTS moodle_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    moodle_instance_url VARCHAR(500) NOT NULL,
    moodle_course_id INTEGER,
    moodle_activity_id INTEGER,
    lti_consumer_key VARCHAR(255),
    sync_status VARCHAR(50) CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moodle_integration_module ON moodle_integration(module_id);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type VARCHAR(50) CHECK (user_type IN ('teacher', 'student', 'admin', 'system')),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Functions and Triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data for testing
INSERT INTO teachers (name, email, institution, role) VALUES
    ('김교사', 'kim.teacher@kaist.ac.kr', 'KAIST Touch Math Academy', 'teacher'),
    ('박관리자', 'park.admin@kaist.ac.kr', 'KAIST Touch Math Academy', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (name, student_number, grade_level) VALUES
    ('이학생', 'S001', '3학년'),
    ('최학생', 'S002', '3학년'),
    ('정학생', 'S003', '4학년')
ON CONFLICT (student_number) DO NOTHING;
