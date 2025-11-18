-- ============================================================================
-- Migration: 001_create_emotion_tables
-- Description: Create tables for emotion refresh routine feature
-- Author: AI Education System Development Team
-- Date: 2025-11-18
-- ============================================================================

-- This migration creates the core tables for the emotion refresh routine feature

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create emotion_check_ins table
CREATE TABLE IF NOT EXISTS emotion_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID,
    emotion_type VARCHAR(50) NOT NULL,
    emotion_score INTEGER NOT NULL CHECK (emotion_score BETWEEN 1 AND 10),
    context_note TEXT,
    session_duration_minutes INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emotion_student_timestamp ON emotion_check_ins(student_id, timestamp DESC);
CREATE INDEX idx_emotion_module_timestamp ON emotion_check_ins(module_id, timestamp DESC);
CREATE INDEX idx_emotion_type ON emotion_check_ins(emotion_type);
CREATE INDEX idx_emotion_score ON emotion_check_ins(emotion_score);

-- Create refresh_activities table
CREATE TABLE IF NOT EXISTS refresh_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(100) NOT NULL,
    target_emotion VARCHAR(50),
    duration_seconds INTEGER DEFAULT 60 CHECK (duration_seconds > 0),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    min_grade_level INTEGER,
    max_grade_level INTEGER,
    ai_generated_content JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    avg_effectiveness_score FLOAT,
    positive_rating_count INTEGER DEFAULT 0,
    negative_rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_activity_type ON refresh_activities(activity_type);
CREATE INDEX idx_activity_target_emotion ON refresh_activities(target_emotion);
CREATE INDEX idx_activity_grade_level ON refresh_activities(min_grade_level, max_grade_level);
CREATE INDEX idx_activity_effectiveness ON refresh_activities(avg_effectiveness_score DESC NULLS LAST);
CREATE INDEX idx_activity_usage ON refresh_activities(usage_count DESC);
CREATE INDEX idx_activity_content ON refresh_activities USING GIN (ai_generated_content);

-- Create student_refresh_sessions table
CREATE TABLE IF NOT EXISTS student_refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    activity_id UUID NOT NULL,
    module_id UUID,
    pre_emotion_type VARCHAR(50) NOT NULL,
    pre_emotion_score INTEGER NOT NULL CHECK (pre_emotion_score BETWEEN 1 AND 10),
    post_emotion_type VARCHAR(50),
    post_emotion_score INTEGER CHECK (post_emotion_score BETWEEN 1 AND 10),
    engagement_level INTEGER CHECK (engagement_level BETWEEN 1 AND 5),
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    actual_duration_seconds INTEGER,
    student_rating INTEGER CHECK (student_rating IN (-1, 0, 1)),
    feedback_note TEXT,
    session_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_student ON student_refresh_sessions(student_id, session_timestamp DESC);
CREATE INDEX idx_session_activity ON student_refresh_sessions(activity_id);
CREATE INDEX idx_session_module ON student_refresh_sessions(module_id, session_timestamp DESC);
CREATE INDEX idx_session_rating ON student_refresh_sessions(activity_id, student_rating) WHERE student_rating IS NOT NULL;
CREATE INDEX idx_session_completed ON student_refresh_sessions(completed, session_timestamp DESC);

-- Create emotion_analytics_cache table
CREATE TABLE IF NOT EXISTS emotion_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    date DATE NOT NULL,
    total_students INTEGER DEFAULT 0,
    total_check_ins INTEGER DEFAULT 0,
    avg_emotion_score FLOAT,
    emotion_distribution JSONB,
    total_refresh_sessions INTEGER DEFAULT 0,
    completed_refresh_sessions INTEGER DEFAULT 0,
    refresh_participation_rate FLOAT,
    avg_improvement_score FLOAT,
    avg_session_duration_seconds INTEGER,
    top_activities JSONB,
    correlation_with_performance FLOAT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, date)
);

CREATE INDEX idx_analytics_module_date ON emotion_analytics_cache(module_id, date DESC);
CREATE INDEX idx_analytics_date ON emotion_analytics_cache(date DESC);
CREATE INDEX idx_analytics_emotion_dist ON emotion_analytics_cache USING GIN (emotion_distribution);
CREATE INDEX idx_analytics_top_activities ON emotion_analytics_cache USING GIN (top_activities);

-- Create student_emotion_preferences table
CREATE TABLE IF NOT EXISTS student_emotion_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE,
    preferred_activity_types JSONB DEFAULT '[]'::JSONB,
    avoid_activity_types JSONB DEFAULT '[]'::JSONB,
    enable_background_music BOOLEAN DEFAULT TRUE,
    enable_auto_suggestions BOOLEAN DEFAULT TRUE,
    auto_suggest_interval_minutes INTEGER DEFAULT 30,
    share_data_with_teacher BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preferences_student ON student_emotion_preferences(student_id);

-- Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_emotion_check_ins_updated_at
    BEFORE UPDATE ON emotion_check_ins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_refresh_activities_updated_at
    BEFORE UPDATE ON refresh_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_student_refresh_sessions_updated_at
    BEFORE UPDATE ON student_refresh_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_student_emotion_preferences_updated_at
    BEFORE UPDATE ON student_emotion_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification
SELECT 'Migration 001 completed successfully' AS status;
