-- Migration: 001_concept_understanding_heatmap.sql
-- Purpose: Create tables for concept understanding heatmap and LMS integration
-- Created: 2025-11-18

-- ============================================
-- Core Tables
-- ============================================

-- Concepts table: stores all learning concepts in the system
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    parent_concept_id UUID REFERENCES concepts(id),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT concepts_module_name_unique UNIQUE (module_id, name)
);

-- Concept understanding scores: tracks student understanding of each concept
CREATE TABLE IF NOT EXISTS concept_understanding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    module_id UUID NOT NULL,
    understanding_score DECIMAL(5,2) CHECK (understanding_score BETWEEN 0 AND 100),
    attempts_count INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP DEFAULT NOW(),
    mastery_level VARCHAR(20) CHECK (mastery_level IN ('not_started', 'struggling', 'developing', 'proficient', 'mastered')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT concept_understanding_unique UNIQUE (student_id, concept_id, module_id)
);

-- Concept interactions: detailed log of student interactions with concepts
CREATE TABLE IF NOT EXISTS concept_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    module_id UUID NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'problem_attempt', 'video_watch', 'quiz', 'practice'
    is_correct BOOLEAN,
    score DECIMAL(5,2),
    time_spent_seconds INTEGER,
    metadata JSONB, -- stores additional context about the interaction
    interaction_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- LMS integration: stores LMS connection information
CREATE TABLE IF NOT EXISTS lms_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name VARCHAR(255) NOT NULL,
    lms_type VARCHAR(50) NOT NULL, -- 'canvas', 'moodle', 'blackboard', 'custom'
    lms_url VARCHAR(500) NOT NULL,
    consumer_key VARCHAR(255) NOT NULL,
    consumer_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB, -- stores LMS-specific configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LMS sync log: tracks data synchronization with LMS
CREATE TABLE IF NOT EXISTS lms_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_integration_id UUID NOT NULL REFERENCES lms_integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'students', 'grades', 'concepts', 'full'
    status VARCHAR(20) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Heatmap configurations: stores teacher preferences for heatmap display
CREATE TABLE IF NOT EXISTS heatmap_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    module_id UUID NOT NULL,
    display_type VARCHAR(50) DEFAULT 'concept_student', -- 'concept_student', 'student_concept', 'timeline'
    color_scheme VARCHAR(50) DEFAULT 'red_green', -- 'red_green', 'blue_yellow', 'grayscale'
    threshold_struggling DECIMAL(5,2) DEFAULT 40.00,
    threshold_developing DECIMAL(5,2) DEFAULT 60.00,
    threshold_proficient DECIMAL(5,2) DEFAULT 80.00,
    show_names BOOLEAN DEFAULT TRUE,
    show_scores BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT heatmap_config_unique UNIQUE (teacher_id, module_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_concepts_module ON concepts(module_id);
CREATE INDEX idx_concepts_parent ON concepts(parent_concept_id);
CREATE INDEX idx_concept_understanding_student ON concept_understanding(student_id);
CREATE INDEX idx_concept_understanding_concept ON concept_understanding(concept_id);
CREATE INDEX idx_concept_understanding_module ON concept_understanding(module_id);
CREATE INDEX idx_concept_understanding_score ON concept_understanding(understanding_score);
CREATE INDEX idx_concept_interactions_student ON concept_interactions(student_id);
CREATE INDEX idx_concept_interactions_concept ON concept_interactions(concept_id);
CREATE INDEX idx_concept_interactions_time ON concept_interactions(interaction_at);
CREATE INDEX idx_lms_sync_log_integration ON lms_sync_log(lms_integration_id);
CREATE INDEX idx_lms_sync_log_status ON lms_sync_log(status);

-- ============================================
-- Triggers for Automatic Timestamp Updates
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_concepts_updated_at BEFORE UPDATE ON concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concept_understanding_updated_at BEFORE UPDATE ON concept_understanding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_integrations_updated_at BEFORE UPDATE ON lms_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heatmap_configurations_updated_at BEFORE UPDATE ON heatmap_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for Analytics
-- ============================================

-- View: Student concept mastery summary
CREATE OR REPLACE VIEW student_concept_mastery AS
SELECT
    cu.student_id,
    cu.module_id,
    c.name as concept_name,
    c.category,
    cu.understanding_score,
    cu.mastery_level,
    cu.attempts_count,
    cu.correct_attempts,
    CASE
        WHEN cu.attempts_count > 0 THEN ROUND((cu.correct_attempts::DECIMAL / cu.attempts_count * 100), 2)
        ELSE 0
    END as success_rate,
    cu.time_spent_seconds,
    cu.last_interaction_at
FROM concept_understanding cu
JOIN concepts c ON cu.concept_id = c.id;

-- View: Module-level heatmap data
CREATE OR REPLACE VIEW module_heatmap_data AS
SELECT
    cu.module_id,
    cu.student_id,
    c.id as concept_id,
    c.name as concept_name,
    c.category,
    cu.understanding_score,
    cu.mastery_level,
    cu.attempts_count,
    cu.last_interaction_at
FROM concept_understanding cu
JOIN concepts c ON cu.concept_id = c.id
ORDER BY c.category, c.name, cu.student_id;

-- View: Concept difficulty analysis (identifies struggling concepts)
CREATE OR REPLACE VIEW concept_difficulty_analysis AS
SELECT
    c.id as concept_id,
    c.name as concept_name,
    c.module_id,
    c.category,
    COUNT(DISTINCT cu.student_id) as students_attempted,
    AVG(cu.understanding_score) as avg_understanding_score,
    STDDEV(cu.understanding_score) as score_std_dev,
    COUNT(CASE WHEN cu.mastery_level IN ('not_started', 'struggling') THEN 1 END) as struggling_students,
    COUNT(CASE WHEN cu.mastery_level = 'mastered' THEN 1 END) as mastered_students,
    AVG(cu.time_spent_seconds) as avg_time_spent
FROM concepts c
LEFT JOIN concept_understanding cu ON c.id = cu.concept_id
GROUP BY c.id, c.name, c.module_id, c.category;

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Insert sample concepts for a math module
INSERT INTO concepts (module_id, name, description, category, difficulty_level) VALUES
('00000000-0000-0000-0000-000000000001', 'Fraction Basics', 'Understanding what fractions represent', 'Fractions', 1),
('00000000-0000-0000-0000-000000000001', 'Numerator and Denominator', 'Identifying parts of a fraction', 'Fractions', 1),
('00000000-0000-0000-0000-000000000001', 'Equivalent Fractions', 'Finding fractions with the same value', 'Fractions', 2),
('00000000-0000-0000-0000-000000000001', 'Adding Fractions', 'Addition with same denominators', 'Fractions', 2),
('00000000-0000-0000-0000-000000000001', 'Subtracting Fractions', 'Subtraction with same denominators', 'Fractions', 2),
('00000000-0000-0000-0000-000000000001', 'Common Denominators', 'Finding LCD for different fractions', 'Fractions', 3),
('00000000-0000-0000-0000-000000000001', 'Mixed Numbers', 'Working with whole numbers and fractions', 'Fractions', 3),
('00000000-0000-0000-0000-000000000001', 'Multiplying Fractions', 'Fraction multiplication', 'Fractions', 4),
('00000000-0000-0000-0000-000000000001', 'Dividing Fractions', 'Fraction division', 'Fractions', 4),
('00000000-0000-0000-0000-000000000001', 'Fraction Word Problems', 'Real-world applications', 'Fractions', 5)
ON CONFLICT (module_id, name) DO NOTHING;

COMMENT ON TABLE concepts IS 'Stores all learning concepts across modules';
COMMENT ON TABLE concept_understanding IS 'Tracks student understanding scores for each concept';
COMMENT ON TABLE concept_interactions IS 'Detailed log of all student-concept interactions';
COMMENT ON TABLE lms_integrations IS 'LMS connection configurations';
COMMENT ON TABLE lms_sync_log IS 'Synchronization history with external LMS systems';
COMMENT ON TABLE heatmap_configurations IS 'Teacher preferences for heatmap visualization';
