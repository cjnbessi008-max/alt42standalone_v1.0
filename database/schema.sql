-- ALT42 Logical Reasoning Refutation System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if exists (for development)
DROP TABLE IF EXISTS progress_stats CASCADE;
DROP TABLE IF EXISTS fallacy_instances CASCADE;
DROP TABLE IF EXISTS fallacies CASCADE;
DROP TABLE IF EXISTS refutations CASCADE;
DROP TABLE IF EXISTS arguments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    grade_level VARCHAR(50),
    institution VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Arguments submitted by students
CREATE TABLE arguments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    topic VARCHAR(100),
    subject VARCHAR(50) DEFAULT 'general' CHECK (subject IN ('mathematics', 'logic', 'science', 'philosophy', 'general')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    analysis_started_at TIMESTAMP WITH TIME ZONE,
    analysis_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_arguments_user_id ON arguments(user_id);
CREATE INDEX idx_arguments_status ON arguments(status);
CREATE INDEX idx_arguments_subject ON arguments(subject);
CREATE INDEX idx_arguments_created_at ON arguments(created_at DESC);

-- AI-generated refutations
CREATE TABLE refutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    argument_id UUID NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
    analysis_summary TEXT,
    logical_structure JSONB,
    premise_analysis JSONB,
    conclusion_analysis JSONB,
    refutation_text TEXT NOT NULL,
    correct_reasoning TEXT,
    guided_questions JSONB,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
    ai_model VARCHAR(100) DEFAULT 'claude-3-sonnet-20240229',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_refutations_argument_id ON refutations(argument_id);
CREATE INDEX idx_refutations_created_at ON refutations(created_at DESC);

-- Fallacy types library
CREATE TABLE fallacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('formal', 'informal', 'statistical', 'causal')),
    description TEXT NOT NULL,
    examples JSONB,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    educational_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fallacies_category ON fallacies(category);
CREATE INDEX idx_fallacies_name ON fallacies(name);

-- Detected fallacies in arguments
CREATE TABLE fallacy_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refutation_id UUID NOT NULL REFERENCES refutations(id) ON DELETE CASCADE,
    fallacy_id UUID NOT NULL REFERENCES fallacies(id) ON DELETE CASCADE,
    excerpt TEXT NOT NULL,
    explanation TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    position_start INTEGER,
    position_end INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fallacy_instances_refutation_id ON fallacy_instances(refutation_id);
CREATE INDEX idx_fallacy_instances_fallacy_id ON fallacy_instances(fallacy_id);

-- Student progress and learning statistics
CREATE TABLE progress_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_arguments INTEGER DEFAULT 0,
    arguments_with_fallacies INTEGER DEFAULT 0,
    most_common_fallacy_id UUID REFERENCES fallacies(id),
    average_confidence_score DECIMAL(3, 2),
    improvement_rate DECIMAL(5, 2),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_submission_date DATE,
    mastery_level VARCHAR(50) DEFAULT 'beginner' CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    statistics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_progress_stats_user_id ON progress_stats(user_id);
CREATE INDEX idx_progress_stats_mastery_level ON progress_stats(mastery_level);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arguments_updated_at BEFORE UPDATE ON arguments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fallacies_updated_at BEFORE UPDATE ON fallacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_stats_updated_at BEFORE UPDATE ON progress_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- User statistics view
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.username,
    u.full_name,
    u.role,
    COUNT(DISTINCT a.id) as total_arguments,
    COUNT(DISTINCT r.id) as total_refutations,
    COUNT(DISTINCT fi.id) as total_fallacies_detected,
    AVG(r.confidence_score) as avg_confidence_score,
    ps.mastery_level,
    ps.current_streak,
    u.created_at as member_since
FROM users u
LEFT JOIN arguments a ON u.id = a.user_id
LEFT JOIN refutations r ON a.id = r.argument_id
LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
LEFT JOIN progress_stats ps ON u.id = ps.user_id
GROUP BY u.id, u.username, u.full_name, u.role, ps.mastery_level, ps.current_streak, u.created_at;

-- Recent activity view
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT
    a.id as argument_id,
    a.title,
    a.content,
    a.subject,
    u.username,
    u.full_name,
    a.status,
    r.id as refutation_id,
    COUNT(fi.id) as fallacies_count,
    a.created_at,
    a.updated_at
FROM arguments a
JOIN users u ON a.user_id = u.id
LEFT JOIN refutations r ON a.id = r.argument_id
LEFT JOIN fallacy_instances fi ON r.id = fi.refutation_id
GROUP BY a.id, a.title, a.content, a.subject, u.username, u.full_name, a.status, r.id, a.created_at, a.updated_at
ORDER BY a.created_at DESC;

-- Fallacy frequency view
CREATE OR REPLACE VIEW v_fallacy_frequency AS
SELECT
    f.id,
    f.name,
    f.category,
    f.severity,
    COUNT(fi.id) as occurrence_count,
    COUNT(DISTINCT fi.refutation_id) as affected_arguments
FROM fallacies f
LEFT JOIN fallacy_instances fi ON f.id = fi.fallacy_id
GROUP BY f.id, f.name, f.category, f.severity
ORDER BY occurrence_count DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO alt42_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO alt42_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO alt42_app;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'ALT42 database schema created successfully!';
END $$;
