-- LMS Emotion Tracking Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lms_id VARCHAR(255) NOT NULL,
  lms_type VARCHAR(50) NOT NULL CHECK (lms_type IN ('canvas', 'moodle', 'google_classroom', 'kaist')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  grade_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lms_id, lms_type)
);

CREATE INDEX idx_students_lms_id ON students(lms_id);
CREATE INDEX idx_students_lms_type ON students(lms_type);

-- Learning Sessions Table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  activity_type VARCHAR(100) CHECK (activity_type IN ('lecture', 'assignment', 'quiz', 'reading', 'discussion', 'video')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX idx_sessions_started_at ON learning_sessions(started_at);
CREATE INDEX idx_sessions_course_id ON learning_sessions(course_id);

-- Emotion Records Table
CREATE TABLE IF NOT EXISTS emotion_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
  emotion_type VARCHAR(50) NOT NULL CHECK (emotion_type IN ('happy', 'neutral', 'confused', 'frustrated', 'confident')),
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  note TEXT,
  context JSONB,
  recorded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emotions_student_id ON emotion_records(student_id);
CREATE INDEX idx_emotions_session_id ON emotion_records(session_id);
CREATE INDEX idx_emotions_recorded_at ON emotion_records(recorded_at);
CREATE INDEX idx_emotions_type ON emotion_records(emotion_type);

-- Daily Emotion Summaries Table
CREATE TABLE IF NOT EXISTS daily_emotion_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_learning_minutes INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  emotion_distribution JSONB NOT NULL DEFAULT '{}',
  dominant_emotion VARCHAR(50) CHECK (dominant_emotion IN ('happy', 'neutral', 'confused', 'frustrated', 'confident')),
  average_intensity DECIMAL(3,2),
  emotion_trend VARCHAR(50) CHECK (emotion_trend IN ('improving', 'stable', 'declining')),
  notes TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, summary_date)
);

CREATE INDEX idx_summaries_student_id ON daily_emotion_summaries(student_id);
CREATE INDEX idx_summaries_date ON daily_emotion_summaries(summary_date);
CREATE INDEX idx_summaries_trend ON daily_emotion_summaries(emotion_trend);

-- LMS Integrations Table
CREATE TABLE IF NOT EXISTS lms_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_name VARCHAR(255) NOT NULL,
  lms_type VARCHAR(50) NOT NULL CHECK (lms_type IN ('canvas', 'moodle', 'google_classroom', 'kaist')),
  lms_url VARCHAR(500) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_type ON lms_integrations(lms_type);
CREATE INDEX idx_lms_active ON lms_integrations(is_active);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for students table
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lms_integrations table
CREATE TRIGGER update_lms_integrations_updated_at BEFORE UPDATE ON lms_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate duration
CREATE TRIGGER calculate_learning_session_duration
  BEFORE INSERT OR UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();

-- View for student analytics
CREATE OR REPLACE VIEW student_emotion_analytics AS
SELECT
  s.id as student_id,
  s.name as student_name,
  s.lms_type,
  COUNT(DISTINCT er.id) as total_emotion_records,
  COUNT(DISTINCT ls.id) as total_sessions,
  AVG(er.intensity) as average_emotion_intensity,
  MODE() WITHIN GROUP (ORDER BY er.emotion_type) as most_common_emotion,
  SUM(ls.duration_minutes) as total_learning_minutes,
  MAX(er.recorded_at) as last_emotion_recorded
FROM students s
LEFT JOIN emotion_records er ON s.id = er.student_id
LEFT JOIN learning_sessions ls ON s.id = ls.student_id
GROUP BY s.id, s.name, s.lms_type;

-- View for daily summary statistics
CREATE OR REPLACE VIEW daily_summary_stats AS
SELECT
  summary_date,
  COUNT(DISTINCT student_id) as total_students,
  AVG(total_learning_minutes) as avg_learning_minutes,
  AVG(session_count) as avg_sessions,
  MODE() WITHIN GROUP (ORDER BY dominant_emotion) as most_common_emotion,
  AVG(average_intensity) as avg_intensity
FROM daily_emotion_summaries
GROUP BY summary_date
ORDER BY summary_date DESC;

-- Comments for documentation
COMMENT ON TABLE students IS '학생 정보 테이블';
COMMENT ON TABLE learning_sessions IS '학습 세션 기록 테이블';
COMMENT ON TABLE emotion_records IS '감정 기록 테이블';
COMMENT ON TABLE daily_emotion_summaries IS '일일 감정 요약 테이블';
COMMENT ON TABLE lms_integrations IS 'LMS 연동 설정 테이블';
