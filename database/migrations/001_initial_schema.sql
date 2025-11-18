-- AI Education System with Highlight Clips
-- Initial Database Schema
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Teachers Table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255) DEFAULT 'KAIST Touch Math Academy',
    role VARCHAR(50) NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'system_maintainer')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(50) NOT NULL,
    enrolled_modules UUID[] DEFAULT ARRAY[]::UUID[],
    learning_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules Table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL DEFAULT 'mathematics',
    grade_level VARCHAR(50) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'active', 'archived', 'failed')),
    world_model JSONB DEFAULT '{}',
    generated_schema JSONB DEFAULT '{}',
    generated_ui JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generation Jobs Table
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment', 'highlight_extraction')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_log TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rules Table
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('validation', 'calculation', 'progression', 'feedback')),
    complexity_score INTEGER DEFAULT 0,
    is_ontology BOOLEAN DEFAULT FALSE,
    code TEXT NOT NULL,
    ontology_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- HIGHLIGHT CLIPS TABLES (NEW FEATURE)
-- ============================================================================

-- Highlight Clips Table
CREATE TABLE highlight_clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    clip_type VARCHAR(50) NOT NULL CHECK (clip_type IN ('concept', 'activity', 'example', 'assessment', 'summary')),
    content JSONB NOT NULL, -- Stores the actual clip content (text, interactive elements, etc.)
    key_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration_minutes INTEGER, -- How long to complete this clip
    order_index INTEGER DEFAULT 0, -- Order within the module
    is_featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Highlight Recommendations
CREATE TABLE daily_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clip_id UUID NOT NULL REFERENCES highlight_clips(id) ON DELETE CASCADE,
    target_grade_level VARCHAR(50),
    recommendation_reason TEXT,
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
    view_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, clip_id)
);

-- Student Progress on Highlight Clips
CREATE TABLE student_clip_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    clip_id UUID NOT NULL REFERENCES highlight_clips(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    time_spent_seconds INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    last_interaction_data JSONB DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, clip_id)
);

-- Clip Analytics
CREATE TABLE clip_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clip_id UUID NOT NULL REFERENCES highlight_clips(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_views INTEGER DEFAULT 0,
    unique_students INTEGER DEFAULT 0,
    avg_completion_rate DECIMAL(5,2) DEFAULT 0,
    avg_time_spent_seconds INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(clip_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Module indexes
CREATE INDEX idx_modules_teacher ON modules(teacher_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_subject_grade ON modules(subject, grade_level);

-- Highlight clips indexes
CREATE INDEX idx_clips_module ON highlight_clips(module_id);
CREATE INDEX idx_clips_type ON highlight_clips(clip_type);
CREATE INDEX idx_clips_featured ON highlight_clips(is_featured);
CREATE INDEX idx_clips_difficulty ON highlight_clips(difficulty_level);
CREATE INDEX idx_clips_concepts ON highlight_clips USING GIN(key_concepts);

-- Daily highlights indexes
CREATE INDEX idx_daily_highlights_date ON daily_highlights(date DESC);
CREATE INDEX idx_daily_highlights_grade ON daily_highlights(target_grade_level);

-- Student progress indexes
CREATE INDEX idx_student_progress_student ON student_clip_progress(student_id);
CREATE INDEX idx_student_progress_clip ON student_clip_progress(clip_id);
CREATE INDEX idx_student_progress_status ON student_clip_progress(status);

-- Analytics indexes
CREATE INDEX idx_analytics_clip_date ON clip_analytics(clip_id, date DESC);

-- Generation jobs indexes
CREATE INDEX idx_jobs_module ON generation_jobs(module_id);
CREATE INDEX idx_jobs_status ON generation_jobs(status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlight_clips_updated_at BEFORE UPDATE ON highlight_clips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_clip_progress_updated_at BEFORE UPDATE ON student_clip_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update daily highlight view count
CREATE OR REPLACE FUNCTION increment_daily_highlight_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE daily_highlights
    SET view_count = view_count + 1
    WHERE clip_id = NEW.clip_id
    AND date = CURRENT_DATE;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SEED DATA (Development)
-- ============================================================================

-- Insert sample teacher
INSERT INTO teachers (name, email, role) VALUES
('김수학', 'kim.math@kaist.ac.kr', 'teacher'),
('박교육', 'park.edu@kaist.ac.kr', 'admin');

-- Insert sample students
INSERT INTO students (name, email, grade_level) VALUES
('이학생', 'student1@example.com', 'grade_3'),
('박학생', 'student2@example.com', 'grade_3'),
('최학생', 'student3@example.com', 'grade_4');

-- Note: Modules and clips will be generated by the AI pipeline
