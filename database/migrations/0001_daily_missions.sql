-- Daily Mission Database Schema
-- Migration: 0001_daily_missions

-- Create ENUM types
CREATE TYPE mission_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE notification_type AS ENUM ('problem_available', 'reminder', 'achievement');
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Users table (for LMS integration)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    lms_user_id VARCHAR(255), -- For LMS integration
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily missions table
CREATE TABLE daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    problem_pool_size INTEGER DEFAULT 30,
    difficulty_adaptive BOOLEAN DEFAULT false,
    status mission_status DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    lms_course_id VARCHAR(255), -- For LMS integration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mission problems table
CREATE TABLE mission_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    problem_content JSONB NOT NULL, -- Flexible structure for different problem types
    problem_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'short_answer', 'essay', 'code'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    topic VARCHAR(100),
    correct_answer JSONB,
    explanation TEXT,
    hints JSONB, -- Array of hints
    metadata JSONB, -- Additional problem metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mission_problems_mission_id ON mission_problems(mission_id);
CREATE INDEX idx_mission_problems_difficulty ON mission_problems(difficulty_level);

-- Student enrollment in missions
CREATE TABLE mission_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, mission_id)
);

CREATE INDEX idx_mission_enrollments_student ON mission_enrollments(student_id);
CREATE INDEX idx_mission_enrollments_mission ON mission_enrollments(mission_id);

-- Student daily mission progress
CREATE TABLE student_mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES mission_problems(id) ON DELETE CASCADE,
    today_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    is_correct BOOLEAN,
    student_answer JSONB,
    time_spent_seconds INTEGER,
    attempts_count INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, mission_id, today_date)
);

CREATE INDEX idx_student_progress_student ON student_mission_progress(student_id);
CREATE INDEX idx_student_progress_date ON student_mission_progress(today_date);
CREATE INDEX idx_student_progress_mission ON student_mission_progress(mission_id);

-- Student mission streaks
CREATE TABLE student_mission_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    total_completed INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, mission_id)
);

CREATE INDEX idx_streaks_student ON student_mission_streaks(student_id);

-- Mission notifications
CREATE TABLE mission_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_notifications_student ON mission_notifications(student_id);
CREATE INDEX idx_notifications_read ON mission_notifications(read_at);

-- Daily problem assignments (for tracking which problem is assigned each day)
CREATE TABLE daily_problem_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES daily_missions(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES mission_problems(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mission_id, assigned_date)
);

CREATE INDEX idx_daily_assignments_date ON daily_problem_assignments(assigned_date);
CREATE INDEX idx_daily_assignments_mission ON daily_problem_assignments(mission_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_missions_updated_at BEFORE UPDATE ON daily_missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON student_mission_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
