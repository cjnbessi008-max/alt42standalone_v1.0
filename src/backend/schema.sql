-- Focus Mode Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Focus Sessions Table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  avg_blink_rate DECIMAL(5,2),
  focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
  total_blinks INTEGER DEFAULT 0,
  max_consecutive_focus_duration INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blink Metrics Table (Time-series data)
CREATE TABLE IF NOT EXISTS blink_metrics (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  blink_count INTEGER NOT NULL,
  blinks_per_minute DECIMAL(5,2) NOT NULL,
  focus_state VARCHAR(20) NOT NULL CHECK (focus_state IN ('focused', 'normal', 'distracted', 'unknown')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB DEFAULT '{}'
);

-- User Focus Statistics (Aggregated data)
CREATE TABLE IF NOT EXISTS user_focus_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  total_focus_time_seconds INTEGER DEFAULT 0,
  total_blinks INTEGER DEFAULT 0,
  avg_focus_score DECIMAL(5,2),
  best_focus_duration_seconds INTEGER DEFAULT 0,
  last_session_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Focus Analytics
CREATE TABLE IF NOT EXISTS course_focus_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  avg_focus_score DECIMAL(5,2),
  avg_session_duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_course_id ON focus_sessions(course_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_blink_metrics_session_id ON blink_metrics(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_blink_metrics_timestamp ON blink_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_focus_stats_user_id ON user_focus_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_course_analytics_course_date ON course_focus_analytics(course_id, date DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_focus_sessions_updated_at
  BEFORE UPDATE ON focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_focus_stats_updated_at
  BEFORE UPDATE ON user_focus_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_analytics_updated_at
  BEFORE UPDATE ON course_focus_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate focus score
-- Score is based on:
-- - Average blink rate (lower is better)
-- - Focus state consistency
-- - Session duration
CREATE OR REPLACE FUNCTION calculate_focus_score(
  p_session_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_avg_blink_rate DECIMAL(5,2);
  v_focus_percentage DECIMAL(3,2);
  v_duration_seconds INTEGER;
  v_score INTEGER;
BEGIN
  -- Get average blink rate
  SELECT AVG(blinks_per_minute)
  INTO v_avg_blink_rate
  FROM blink_metrics
  WHERE session_id = p_session_id;

  -- Get percentage of time in focused state
  SELECT
    COUNT(*) FILTER (WHERE focus_state = 'focused')::DECIMAL / NULLIF(COUNT(*), 0)
  INTO v_focus_percentage
  FROM blink_metrics
  WHERE session_id = p_session_id;

  -- Get session duration
  SELECT EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))::INTEGER
  INTO v_duration_seconds
  FROM focus_sessions
  WHERE id = p_session_id;

  -- Calculate score (0-100)
  -- 40% from blink rate, 40% from focus percentage, 20% from duration
  v_score := LEAST(100, GREATEST(0,
    -- Blink rate component (optimal: 8-12 bpm)
    40 - ABS(v_avg_blink_rate - 10) * 2 +
    -- Focus percentage component
    (COALESCE(v_focus_percentage, 0) * 40) +
    -- Duration component (bonus for longer sessions, max at 30 min)
    LEAST(20, v_duration_seconds / 90)
  ));

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_focus_stats(
  p_user_id VARCHAR(255),
  p_session_id UUID
) RETURNS VOID AS $$
DECLARE
  v_session_duration INTEGER;
  v_session_blinks INTEGER;
  v_session_score INTEGER;
BEGIN
  -- Get session data
  SELECT
    duration_seconds,
    total_blinks,
    focus_score
  INTO v_session_duration, v_session_blinks, v_session_score
  FROM focus_sessions
  WHERE id = p_session_id;

  -- Upsert user stats
  INSERT INTO user_focus_stats (
    user_id,
    total_sessions,
    total_focus_time_seconds,
    total_blinks,
    avg_focus_score,
    best_focus_duration_seconds,
    last_session_at
  ) VALUES (
    p_user_id,
    1,
    COALESCE(v_session_duration, 0),
    COALESCE(v_session_blinks, 0),
    v_session_score,
    COALESCE(v_session_duration, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = user_focus_stats.total_sessions + 1,
    total_focus_time_seconds = user_focus_stats.total_focus_time_seconds + COALESCE(v_session_duration, 0),
    total_blinks = user_focus_stats.total_blinks + COALESCE(v_session_blinks, 0),
    avg_focus_score = (user_focus_stats.avg_focus_score * user_focus_stats.total_sessions + v_session_score) / (user_focus_stats.total_sessions + 1),
    best_focus_duration_seconds = GREATEST(user_focus_stats.best_focus_duration_seconds, COALESCE(v_session_duration, 0)),
    last_session_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Sample queries for analytics

-- Get user's focus history
-- SELECT * FROM focus_sessions WHERE user_id = 'user123' ORDER BY start_time DESC LIMIT 10;

-- Get course engagement metrics
-- SELECT
--   DATE(start_time) as date,
--   COUNT(*) as sessions,
--   AVG(focus_score) as avg_score,
--   AVG(duration_seconds) as avg_duration
-- FROM focus_sessions
-- WHERE course_id = 'course456'
-- GROUP BY DATE(start_time)
-- ORDER BY date DESC;

-- Get top focused users
-- SELECT
--   user_id,
--   avg_focus_score,
--   total_sessions,
--   total_focus_time_seconds / 60 as total_minutes
-- FROM user_focus_stats
-- ORDER BY avg_focus_score DESC
-- LIMIT 10;
