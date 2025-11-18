-- Migration: Create Concept Pairs Tables
-- Description: Tables for storing confusion-prone concept pairs and warnings
-- Created: 2025-11-18

-- Create enum for concept pair types
CREATE TYPE concept_pair_category AS ENUM (
  'operations',      -- 연산 관련 (예: 최대/최소)
  'values',          -- 값 관련 (예: 절댓값)
  'properties',      -- 속성 관련
  'theorems',        -- 정리/공식 관련
  'representations'  -- 표현 방식 관련
);

-- Create enum for warning severity levels
CREATE TYPE warning_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Table: concept_pairs
-- Stores pairs of mathematical concepts that students commonly confuse
CREATE TABLE concept_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Concept information
  concept_a VARCHAR(255) NOT NULL,
  concept_a_kr VARCHAR(255) NOT NULL,  -- Korean name
  concept_a_description TEXT,

  concept_b VARCHAR(255) NOT NULL,
  concept_b_kr VARCHAR(255) NOT NULL,  -- Korean name
  concept_b_description TEXT,

  -- Classification
  category concept_pair_category NOT NULL,
  grade_level_min INTEGER CHECK (grade_level_min >= 1 AND grade_level_min <= 12),
  grade_level_max INTEGER CHECK (grade_level_max >= 1 AND grade_level_max <= 12),

  -- Confusion information
  confusion_reason TEXT NOT NULL,  -- Why students confuse these
  confusion_reason_kr TEXT NOT NULL,  -- Korean explanation

  -- Warning configuration
  warning_message TEXT NOT NULL,
  warning_message_kr TEXT NOT NULL,
  severity warning_severity DEFAULT 'medium',

  -- Examples to help differentiate
  example_a TEXT,
  example_b TEXT,
  differentiation_tip TEXT,
  differentiation_tip_kr TEXT,

  -- Usage tracking
  times_warned INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: concept_pair_triggers
-- Defines conditions that trigger warnings for specific concept pairs
CREATE TABLE concept_pair_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_pair_id UUID NOT NULL REFERENCES concept_pairs(id) ON DELETE CASCADE,

  -- Trigger conditions
  trigger_type VARCHAR(50) NOT NULL,  -- 'keyword', 'pattern', 'context', 'sequence'
  trigger_pattern TEXT NOT NULL,      -- The pattern to match
  trigger_context TEXT,                -- Additional context (JSON)

  -- Timing
  min_occurrences INTEGER DEFAULT 1,  -- How many times pattern must occur
  time_window_minutes INTEGER,        -- Window to count occurrences

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: student_concept_warnings
-- Tracks warnings shown to students
CREATE TABLE student_concept_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Student and context
  student_id UUID NOT NULL,  -- References students table (to be created)
  module_id UUID,            -- References modules table (to be created)
  session_id VARCHAR(255),   -- Learning session identifier

  -- Warning details
  concept_pair_id UUID NOT NULL REFERENCES concept_pairs(id),
  trigger_id UUID REFERENCES concept_pair_triggers(id),

  -- Student interaction context
  activity_type VARCHAR(100),  -- What student was doing when warning triggered
  problem_data JSONB,          -- Problem/exercise data (if applicable)

  -- Warning response
  warning_shown_at TIMESTAMP DEFAULT NOW(),
  student_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  student_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP,

  -- Effectiveness tracking
  student_corrected_mistake BOOLEAN,
  time_to_correction_seconds INTEGER,
  follow_up_performance_improved BOOLEAN,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: concept_pair_analytics
-- Aggregated analytics for concept pairs
CREATE TABLE concept_pair_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_pair_id UUID NOT NULL REFERENCES concept_pairs(id) ON DELETE CASCADE,

  -- Time period
  analysis_period VARCHAR(20) NOT NULL,  -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  total_warnings_shown INTEGER DEFAULT 0,
  total_students_warned INTEGER DEFAULT 0,
  acknowledgment_rate DECIMAL(5,2),
  correction_rate DECIMAL(5,2),
  avg_time_to_correction_seconds DECIMAL(10,2),

  -- Improvement tracking
  pre_warning_error_rate DECIMAL(5,2),
  post_warning_error_rate DECIMAL(5,2),
  effectiveness_improvement DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(concept_pair_id, analysis_period, period_start)
);

-- Indexes for performance
CREATE INDEX idx_concept_pairs_category ON concept_pairs(category);
CREATE INDEX idx_concept_pairs_grade ON concept_pairs(grade_level_min, grade_level_max);
CREATE INDEX idx_concept_pairs_active ON concept_pairs(is_active) WHERE is_active = true;

CREATE INDEX idx_triggers_concept_pair ON concept_pair_triggers(concept_pair_id);
CREATE INDEX idx_triggers_active ON concept_pair_triggers(is_active) WHERE is_active = true;

CREATE INDEX idx_warnings_student ON student_concept_warnings(student_id);
CREATE INDEX idx_warnings_concept_pair ON student_concept_warnings(concept_pair_id);
CREATE INDEX idx_warnings_session ON student_concept_warnings(session_id);
CREATE INDEX idx_warnings_shown_at ON student_concept_warnings(warning_shown_at);

CREATE INDEX idx_analytics_concept_pair ON concept_pair_analytics(concept_pair_id);
CREATE INDEX idx_analytics_period ON concept_pair_analytics(period_start, period_end);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_concept_pairs_updated_at
  BEFORE UPDATE ON concept_pairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE concept_pairs IS 'Stores pairs of mathematical concepts that students commonly confuse';
COMMENT ON TABLE concept_pair_triggers IS 'Defines conditions that trigger warnings for specific concept pairs';
COMMENT ON TABLE student_concept_warnings IS 'Tracks warnings shown to students and their responses';
COMMENT ON TABLE concept_pair_analytics IS 'Aggregated analytics for measuring warning effectiveness';
