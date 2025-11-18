-- Migration: Create Practice Mode Tables
-- Description: Database schema for "Practice a Bit More" mode
-- Author: AI Education System
-- Date: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: student_progress
-- Tracks overall student progress per module
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    mastery_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'mastery')),
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    accuracy_percentage NUMERIC(5,2) DEFAULT 0.00 CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- Table: problem_attempt
-- Records each individual problem attempt
CREATE TABLE IF NOT EXISTS problem_attempt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: mastery_metrics
-- Defines mastery criteria for each module/topic
CREATE TABLE IF NOT EXISTS mastery_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL,
    topic_id VARCHAR(100) NOT NULL,
    required_correct_attempts INTEGER NOT NULL DEFAULT 5,
    min_accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    consecutive_correct INTEGER NOT NULL DEFAULT 3,
    time_window_days INTEGER NOT NULL DEFAULT 7,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(module_id, topic_id)
);

-- Table: practice_trigger_rules
-- Rules that determine when to suggest "practice more"
CREATE TABLE IF NOT EXISTS practice_trigger_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('approaching_mastery', 'partial_mastery', 'needs_review')),
    accuracy_threshold NUMERIC(5,2) NOT NULL CHECK (accuracy_threshold >= 0 AND accuracy_threshold <= 100),
    attempt_count_threshold INTEGER NOT NULL DEFAULT 3,
    suggested_action VARCHAR(50) NOT NULL CHECK (suggested_action IN ('practice_more', 'review_concept', 'next_topic')),
    rule_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: problem_bank
-- Stores problem templates for dynamic generation
CREATE TABLE IF NOT EXISTS problem_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL,
    topic_id VARCHAR(100) NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    problem_template JSONB NOT NULL,
    metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_student_progress_student_module ON student_progress(student_id, module_id);
CREATE INDEX idx_student_progress_mastery ON student_progress(mastery_level);

CREATE INDEX idx_problem_attempt_student_module ON problem_attempt(student_id, module_id, attempted_at DESC);
CREATE INDEX idx_problem_attempt_problem ON problem_attempt(problem_id, is_correct);
CREATE INDEX idx_problem_attempt_attempted_at ON problem_attempt(attempted_at DESC);

CREATE INDEX idx_mastery_metrics_module ON mastery_metrics(module_id);

CREATE INDEX idx_practice_trigger_module_type ON practice_trigger_rules(module_id, trigger_type) WHERE is_active = true;

CREATE INDEX idx_problem_bank_module_topic ON problem_bank(module_id, topic_id) WHERE is_active = true;
CREATE INDEX idx_problem_bank_difficulty ON problem_bank(difficulty_level);

-- Function: Update timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mastery_metrics_updated_at BEFORE UPDATE ON mastery_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_trigger_rules_updated_at BEFORE UPDATE ON practice_trigger_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate accuracy percentage
CREATE OR REPLACE FUNCTION calculate_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE student_progress
    SET
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        accuracy_percentage = CASE
            WHEN (total_attempts + 1) = 0 THEN 0
            ELSE ROUND((correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::NUMERIC / (total_attempts + 1) * 100, 2)
        END,
        last_attempt_at = NEW.attempted_at
    WHERE student_id = NEW.student_id AND module_id = NEW.module_id;

    -- Create student_progress record if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO student_progress (student_id, module_id, total_attempts, correct_attempts, accuracy_percentage, last_attempt_at)
        VALUES (
            NEW.student_id,
            NEW.module_id,
            1,
            CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
            CASE WHEN NEW.is_correct THEN 100 ELSE 0 END,
            NEW.attempted_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate accuracy on problem attempt
CREATE TRIGGER calculate_accuracy_on_attempt AFTER INSERT ON problem_attempt
    FOR EACH ROW EXECUTE FUNCTION calculate_accuracy();

-- Comments for documentation
COMMENT ON TABLE student_progress IS 'Tracks overall student progress and mastery level per module';
COMMENT ON TABLE problem_attempt IS 'Records individual problem attempts with timing and correctness';
COMMENT ON TABLE mastery_metrics IS 'Defines criteria for achieving mastery in each topic';
COMMENT ON TABLE practice_trigger_rules IS 'Rules determining when to suggest additional practice';
COMMENT ON TABLE problem_bank IS 'Repository of problem templates for dynamic generation';
