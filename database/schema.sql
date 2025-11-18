-- DMN Monitoring System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table (synced from Moodle)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP
);

-- Courses table (synced from Moodle)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodle_course_id INTEGER UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollment
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- Learning sessions
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    session_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DMN status tracking (real-time snapshots)
CREATE TABLE dmn_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- DMN Status
    status VARCHAR(50) NOT NULL CHECK (status IN ('deep_focus', 'active_learning', 'wandering', 'disengaged')),
    color_code VARCHAR(7) NOT NULL,
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Behavioral metrics
    interaction_count INTEGER DEFAULT 0,
    mouse_movement_intensity FLOAT,
    keyboard_activity_rate FLOAT,
    page_focus_duration INTEGER,
    idle_time_seconds INTEGER,

    -- Analysis metadata
    analysis_window_seconds INTEGER DEFAULT 30,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Interaction events (raw behavioral data)
CREATE TABLE interaction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,

    -- Event details
    event_type VARCHAR(50) NOT NULL,  -- 'click', 'keypress', 'mouse_move', 'scroll', 'focus', 'blur'
    event_data JSONB,
    page_url VARCHAR(500),
    element_target VARCHAR(255),

    -- Timing
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_since_session_start INTEGER
);

-- Student performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,

    -- Performance data
    activity_type VARCHAR(100),  -- 'quiz', 'assignment', 'reading', 'video'
    score FLOAT,
    max_score FLOAT,
    completion_percentage FLOAT,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 1,

    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DMN analytics (aggregated insights)
CREATE TABLE dmn_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Time period
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),

    -- Aggregated DMN metrics
    deep_focus_percentage FLOAT,
    active_learning_percentage FLOAT,
    wandering_percentage FLOAT,
    disengaged_percentage FLOAT,

    -- Session statistics
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration INTEGER,
    total_interactions INTEGER,
    avg_confidence_score FLOAT,

    -- Insights
    optimal_learning_time VARCHAR(50),
    attention_pattern VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id, date, hour)
);

-- Alerts and notifications
CREATE TABLE dmn_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    alert_type VARCHAR(50) NOT NULL,  -- 'prolonged_disengagement', 'focus_drop', 'improvement'
    severity VARCHAR(20) NOT NULL,  -- 'info', 'warning', 'critical'
    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_dmn_status_student ON dmn_status(student_id, recorded_at DESC);
CREATE INDEX idx_dmn_status_session ON dmn_status(session_id, recorded_at DESC);
CREATE INDEX idx_dmn_status_course ON dmn_status(course_id, recorded_at DESC);
CREATE INDEX idx_dmn_status_timestamp ON dmn_status(recorded_at DESC);

CREATE INDEX idx_interaction_events_student ON interaction_events(student_id, timestamp DESC);
CREATE INDEX idx_interaction_events_session ON interaction_events(session_id, timestamp DESC);
CREATE INDEX idx_interaction_events_type ON interaction_events(event_type, timestamp DESC);

CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id, started_at DESC);
CREATE INDEX idx_learning_sessions_course ON learning_sessions(course_id, started_at DESC);
CREATE INDEX idx_learning_sessions_status ON learning_sessions(session_status, started_at DESC);

CREATE INDEX idx_performance_metrics_student ON performance_metrics(student_id, recorded_at DESC);
CREATE INDEX idx_performance_metrics_course ON performance_metrics(course_id, recorded_at DESC);

CREATE INDEX idx_dmn_analytics_student ON dmn_analytics(student_id, date DESC);
CREATE INDEX idx_dmn_analytics_course ON dmn_analytics(course_id, date DESC);

CREATE INDEX idx_dmn_alerts_student ON dmn_alerts(student_id, created_at DESC);
CREATE INDEX idx_dmn_alerts_unread ON dmn_alerts(is_read, created_at DESC) WHERE is_read = FALSE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE dmn_status IS 'Real-time DMN (Default Mode Network) status snapshots captured every 5 seconds';
COMMENT ON TABLE interaction_events IS 'Raw behavioral interaction data for DMN analysis';
COMMENT ON TABLE dmn_analytics IS 'Aggregated DMN insights by student, course, date, and hour';
COMMENT ON TABLE dmn_alerts IS 'Automated alerts for attention issues and improvements';

COMMENT ON COLUMN dmn_status.status IS 'DMN state: deep_focus (green), active_learning (blue), wandering (yellow), disengaged (red)';
COMMENT ON COLUMN dmn_status.confidence_score IS 'ML confidence in status classification (0.0 to 1.0)';
COMMENT ON COLUMN dmn_status.analysis_window_seconds IS 'Time window used for calculating this status (default 30s)';
