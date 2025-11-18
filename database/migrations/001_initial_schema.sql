-- Initial database schema for Focus Analysis System
-- Created: 2025-01-18

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    lms_user_id VARCHAR(255) UNIQUE,
    institution VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on email and username for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_lms_user_id ON users(lms_user_id);

-- Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_name VARCHAR(255),
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_end TIMESTAMP,
    total_duration_seconds INTEGER,
    active_time_seconds INTEGER DEFAULT 0,
    idle_time_seconds INTEGER DEFAULT 0,
    interaction_count INTEGER DEFAULT 0,
    context_switches INTEGER DEFAULT 0,
    average_focus_score REAL,
    engagement_score REAL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for focus_sessions
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_day_of_week ON focus_sessions(day_of_week);
CREATE INDEX idx_focus_sessions_hour_of_day ON focus_sessions(hour_of_day);
CREATE INDEX idx_focus_sessions_created_at ON focus_sessions(created_at);

-- Create focus_metrics table
CREATE TABLE IF NOT EXISTS focus_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    time_since_last_event_seconds REAL,
    focus_score REAL CHECK (focus_score >= 0 AND focus_score <= 100),
    page_url VARCHAR(500),
    component_name VARCHAR(255)
);

-- Create indexes for focus_metrics
CREATE INDEX idx_focus_metrics_session_id ON focus_metrics(session_id);
CREATE INDEX idx_focus_metrics_recorded_at ON focus_metrics(recorded_at);
CREATE INDEX idx_focus_metrics_event_type ON focus_metrics(event_type);

-- Create time_recommendations table
CREATE TABLE IF NOT EXISTS time_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommended_day_of_week INTEGER NOT NULL CHECK (recommended_day_of_week >= 0 AND recommended_day_of_week <= 6),
    recommended_hour INTEGER NOT NULL CHECK (recommended_hour >= 0 AND recommended_hour <= 23),
    recommended_duration_minutes INTEGER DEFAULT 45,
    confidence_score REAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    average_focus_score REAL NOT NULL CHECK (average_focus_score >= 0 AND average_focus_score <= 100),
    sample_size INTEGER NOT NULL,
    analysis_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valid_until TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for time_recommendations
CREATE INDEX idx_time_recommendations_user_id ON time_recommendations(user_id);
CREATE INDEX idx_time_recommendations_is_active ON time_recommendations(is_active);
CREATE INDEX idx_time_recommendations_confidence_score ON time_recommendations(confidence_score);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_sessions_updated_at BEFORE UPDATE ON focus_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_recommendations_updated_at BEFORE UPDATE ON time_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO users (email, username, hashed_password, full_name, role)
-- VALUES ('test@example.com', 'testuser', '$2b$12$example_hash', 'Test User', 'student');
