-- AI Education Pipeline - Initial Database Schema
-- PostgreSQL 15+
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    institution VARCHAR(255),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Modules Table (AI-generated modules)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'mathematics',
    grade_level VARCHAR(50),
    teacher_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'generating'
        CHECK (status IN ('generating', 'active', 'archived', 'failed')),

    -- AI-generated data stored as JSONB
    world_model JSONB,
    generated_rules JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    input_strategy JSONB,

    -- Teacher's original request
    original_request TEXT,

    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_modules_teacher FOREIGN KEY (teacher_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for modules
CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_subject ON modules(subject);
CREATE INDEX idx_modules_created ON modules(created_at DESC);

-- Full-text search on module names and descriptions
CREATE INDEX idx_modules_search ON modules
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Generation Jobs Table
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    stage VARCHAR(100) NOT NULL CHECK (stage IN (
        'world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),

    input_data JSONB,
    output_data JSONB,
    error_log TEXT,

    -- AI API usage tracking
    tokens_used INTEGER DEFAULT 0,
    api_cost DECIMAL(10, 4) DEFAULT 0,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_jobs_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
);

-- Create indexes for generation jobs
CREATE INDEX idx_jobs_module ON generation_jobs(module_id);
CREATE INDEX idx_jobs_status ON generation_jobs(status);
CREATE INDEX idx_jobs_stage ON generation_jobs(stage);
CREATE INDEX idx_jobs_created ON generation_jobs(created_at DESC);

-- Student Progress Table
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,

    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100),

    -- Dynamic progress data (module-specific)
    progress_data JSONB DEFAULT '{}'::jsonb,

    -- Grades
    score DECIMAL(5, 2),
    max_score DECIMAL(5, 2),

    -- Attempts and time
    attempts INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_progress_student FOREIGN KEY (student_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(student_id, module_id)
);

-- Create indexes for student progress
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_module ON student_progress(module_id);
CREATE INDEX idx_progress_completed ON student_progress(completed_at);

-- Dynamic Schemas Table (metadata for generated tables)
CREATE TABLE dynamic_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    migration_script TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_schemas_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(module_id, table_name)
);

CREATE INDEX idx_schemas_module ON dynamic_schemas(module_id);
CREATE INDEX idx_schemas_applied ON dynamic_schemas(is_applied);

-- AI Prompts Log (for debugging and optimization)
CREATE TABLE ai_prompts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    stage VARCHAR(100),
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    latency_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_prompts_job FOREIGN KEY (job_id)
        REFERENCES generation_jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_prompts_job ON ai_prompts_log(job_id);
CREATE INDEX idx_prompts_stage ON ai_prompts_log(stage);
CREATE INDEX idx_prompts_created ON ai_prompts_log(created_at DESC);

-- Sessions Table (for JWT blacklist and session management)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Module Access Control (who can access which module)
CREATE TABLE module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    user_id UUID NOT NULL,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('view', 'edit', 'admin')),
    granted_by UUID,
    granted_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_access_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_granted_by FOREIGN KEY (granted_by)
        REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(module_id, user_id, access_type)
);

CREATE INDEX idx_access_module ON module_access(module_id);
CREATE INDEX idx_access_user ON module_access(user_id);

-- Activity Log (audit trail)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_log_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_log_user ON activity_log(user_id);
CREATE INDEX idx_log_action ON activity_log(action);
CREATE INDEX idx_log_created ON activity_log(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Active modules with teacher info
CREATE VIEW v_active_modules AS
SELECT
    m.*,
    u.full_name as teacher_name,
    u.email as teacher_email,
    (SELECT COUNT(*) FROM student_progress sp WHERE sp.module_id = m.id) as student_count,
    (SELECT AVG(progress_percentage) FROM student_progress sp WHERE sp.module_id = m.id) as avg_progress
FROM modules m
JOIN users u ON m.teacher_id = u.id
WHERE m.status = 'active';

-- Student progress with module details
CREATE VIEW v_student_progress_detailed AS
SELECT
    sp.*,
    u.full_name as student_name,
    u.email as student_email,
    m.name as module_name,
    m.subject,
    m.grade_level
FROM student_progress sp
JOIN users u ON sp.student_id = u.id
JOIN modules m ON sp.module_id = m.id;

-- Generation job statistics
CREATE VIEW v_job_statistics AS
SELECT
    DATE(created_at) as date,
    stage,
    status,
    COUNT(*) as count,
    AVG(tokens_used) as avg_tokens,
    SUM(api_cost) as total_cost,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM generation_jobs
WHERE started_at IS NOT NULL
GROUP BY DATE(created_at), stage, status;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aipipeline_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aipipeline_user;

-- Insert migration record
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES (1);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Initial schema created successfully!';
    RAISE NOTICE 'Tables: users, modules, generation_jobs, student_progress, dynamic_schemas, ai_prompts_log, sessions, module_access, activity_log';
    RAISE NOTICE 'Views: v_active_modules, v_student_progress_detailed, v_job_statistics';
END $$;
