-- Worry Notes System Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (students, teachers, counselors, admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'counselor', 'admin')),
    lms_user_id VARCHAR(255),  -- External LMS user identifier
    institution_id UUID,
    password_hash VARCHAR(255),  -- For non-SSO users
    preferences JSONB DEFAULT '{
        "language": "ko",
        "notification_email": true,
        "notification_app": true,
        "digest_time": "09:00"
    }'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Institutions table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),  -- e.g., kaist.ac.kr
    lms_type VARCHAR(50),  -- canvas, moodle, google_classroom, etc.
    lms_config JSONB,  -- LMS-specific configuration
    created_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id),
    lms_course_id VARCHAR(255),  -- External LMS course ID
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),  -- Course code (e.g., CS101)
    semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Course enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'ta')),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Worry notes table
CREATE TABLE worry_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

    -- Content
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,  -- Array of {filename, url, size, type}

    -- Privacy
    is_anonymous BOOLEAN DEFAULT false,
    anonymous_id VARCHAR(50),  -- Generated ID for anonymous submissions

    -- Classification
    category VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (category IN (
        'academic',      -- Subject difficulties, homework help
        'emotional',     -- Stress, anxiety, motivation
        'technical',     -- Platform issues, access problems
        'environmental', -- Time management, home environment
        'social',        -- Peer interaction, group work
        'other'          -- Uncategorized
    )),
    subcategories JSONB DEFAULT '[]'::jsonb,  -- Additional fine-grained categories

    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'urgent',   -- Immediate intervention needed
        'high',     -- Important, needs quick response
        'medium',   -- Standard concern
        'low'       -- Informational
    )),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN (
        'new',        -- Just submitted
        'reviewing',  -- Teacher is looking at it
        'responded',  -- Teacher has responded
        'resolved',   -- Marked as resolved
        'escalated'   -- Sent to counselor/admin
    )),

    -- Crisis flag
    is_crisis BOOLEAN DEFAULT false,
    crisis_type VARCHAR(50),  -- e.g., 'self_harm', 'abuse', 'emergency'
    crisis_notified_at TIMESTAMP,

    -- AI Analysis
    ai_analysis JSONB DEFAULT '{}'::jsonb,  -- {
        -- "themes": ["homework", "deadline", "stress"],
        -- "sentiment": -0.4,
        -- "suggested_response": "...",
        -- "confidence": 0.85,
        -- "keywords": ["problem 15", "stuck", "due tomorrow"]
    -- }
    ai_processed_at TIMESTAMP,

    -- Assignment
    assigned_to UUID REFERENCES users(id),  -- Counselor or specific teacher
    assigned_at TIMESTAMP,

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT NOW(),
    first_viewed_at TIMESTAMP,
    first_responded_at TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb  -- Extensible for future needs
);

-- Responses to worry notes
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worry_note_id UUID NOT NULL REFERENCES worry_notes(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id),

    content TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT false,  -- Not visible to student

    -- AI assistance
    used_ai_suggestion BOOLEAN DEFAULT false,
    original_ai_suggestion TEXT,  -- If teacher modified AI suggestion

    created_at TIMESTAMP DEFAULT NOW(),
    edited_at TIMESTAMP,

    CONSTRAINT response_visible_to_student CHECK (
        is_internal_note = false OR
        (SELECT role FROM users WHERE id = responder_id) IN ('teacher', 'counselor', 'admin')
    )
);

-- LMS context cache (student activity from LMS)
CREATE TABLE lms_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Recent activity
    recent_assignments JSONB DEFAULT '[]'::jsonb,  -- [{name, submitted_at, grade, status}]
    recent_grades JSONB DEFAULT '[]'::jsonb,       -- [{assignment, score, date}]
    recent_logins JSONB DEFAULT '[]'::jsonb,       -- [timestamps]

    -- Aggregated metrics
    engagement_score DECIMAL(3,2),  -- 0.00 to 1.00
    average_grade DECIMAL(5,2),
    submission_rate DECIMAL(3,2),   -- % of assignments submitted on time

    -- Upcoming
    upcoming_deadlines JSONB DEFAULT '[]'::jsonb,  -- [{assignment, due_date, status}]

    -- Cache metadata
    cached_at TIMESTAMP DEFAULT NOW(),
    cache_expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '6 hours',

    UNIQUE(student_id, course_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL CHECK (type IN (
        'concern_submitted',      -- For teachers when new concern arrives
        'response_received',      -- For students when teacher responds
        'concern_resolved',       -- For students when marked resolved
        'urgent_alert',           -- For crisis situations
        'daily_digest',           -- Summary of new concerns
        'escalation_reminder',    -- For unresponded urgent concerns
        'assignment_to_counselor' -- When concern assigned to counselor
    )),

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    link_url VARCHAR(500),  -- Deep link to relevant page

    related_worry_note_id UUID REFERENCES worry_notes(id) ON DELETE CASCADE,

    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW(),

    -- Delivery channels
    sent_email BOOLEAN DEFAULT false,
    sent_app BOOLEAN DEFAULT true,
    sent_lms BOOLEAN DEFAULT false
);

-- Categories (for customization and tracking)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    display_name_ko VARCHAR(100) NOT NULL,
    description TEXT,
    keywords TEXT[],  -- Keywords for AI categorization
    color VARCHAR(7),  -- Hex color code
    icon VARCHAR(50),  -- Icon identifier
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for compliance and debugging
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,  -- e.g., 'view_worry_note', 'update_category', 'assign_counselor'
    resource_type VARCHAR(50),     -- e.g., 'worry_note', 'response', 'user'
    resource_id UUID,

    details JSONB DEFAULT '{}'::jsonb,  -- Action-specific details

    ip_address INET,
    user_agent TEXT,

    timestamp TIMESTAMP DEFAULT NOW()
);

-- Analytics snapshots (for performance - pre-aggregated data)
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Counts
    total_concerns INTEGER DEFAULT 0,
    new_concerns INTEGER DEFAULT 0,
    resolved_concerns INTEGER DEFAULT 0,
    urgent_concerns INTEGER DEFAULT 0,

    -- Breakdown by category
    category_breakdown JSONB DEFAULT '{}'::jsonb,  -- {academic: 10, emotional: 5, ...}

    -- Response metrics
    avg_response_time_minutes INTEGER,
    median_response_time_minutes INTEGER,
    response_rate DECIMAL(5,2),  -- % of concerns with at least one response

    -- Trends
    trend_vs_previous_week VARCHAR(20),  -- 'increasing', 'decreasing', 'stable'

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(snapshot_date, course_id, teacher_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_lms_id ON users(lms_user_id);

-- Courses
CREATE INDEX idx_courses_institution ON courses(institution_id);
CREATE INDEX idx_courses_lms_id ON courses(lms_course_id);

-- Enrollments
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_role ON enrollments(role);

-- Worry Notes (critical for performance)
CREATE INDEX idx_worry_notes_student ON worry_notes(student_id, submitted_at DESC);
CREATE INDEX idx_worry_notes_course ON worry_notes(course_id);
CREATE INDEX idx_worry_notes_status ON worry_notes(status, priority);
CREATE INDEX idx_worry_notes_category ON worry_notes(category);
CREATE INDEX idx_worry_notes_priority ON worry_notes(priority);
CREATE INDEX idx_worry_notes_assigned ON worry_notes(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_worry_notes_crisis ON worry_notes(is_crisis) WHERE is_crisis = true;
CREATE INDEX idx_worry_notes_submitted_at ON worry_notes(submitted_at DESC);

-- Full-text search on worry note content
CREATE INDEX idx_worry_notes_content_fts ON worry_notes
    USING gin(to_tsvector('english', content));
CREATE INDEX idx_worry_notes_content_fts_korean ON worry_notes
    USING gin(to_tsvector('simple', content));

-- Responses
CREATE INDEX idx_responses_note ON responses(worry_note_id, created_at DESC);
CREATE INDEX idx_responses_responder ON responses(responder_id);

-- LMS Context
CREATE INDEX idx_lms_context_student ON lms_context(student_id);
CREATE INDEX idx_lms_context_course ON lms_context(course_id);
CREATE INDEX idx_lms_context_expires ON lms_context(cache_expires_at);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Analytics
CREATE INDEX idx_analytics_date ON analytics_snapshots(snapshot_date DESC);
CREATE INDEX idx_analytics_course ON analytics_snapshots(course_id);
CREATE INDEX idx_analytics_teacher ON analytics_snapshots(teacher_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Generate anonymous ID for anonymous submissions
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_anonymous = true AND NEW.anonymous_id IS NULL THEN
        NEW.anonymous_id = 'ANON-' || substring(md5(random()::text) from 1 for 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_anonymous_id_trigger
    BEFORE INSERT ON worry_notes
    FOR EACH ROW
    EXECUTE FUNCTION generate_anonymous_id();

-- Update worry note status when response is added
CREATE OR REPLACE FUNCTION update_worry_note_on_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status to 'responded' if it was 'new' or 'reviewing'
    UPDATE worry_notes
    SET
        status = CASE
            WHEN status IN ('new', 'reviewing') THEN 'responded'
            ELSE status
        END,
        first_responded_at = COALESCE(first_responded_at, NEW.created_at)
    WHERE id = NEW.worry_note_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worry_note_on_response_trigger
    AFTER INSERT ON responses
    FOR EACH ROW
    EXECUTE FUNCTION update_worry_note_on_response();

-- Clean up expired LMS context cache
CREATE OR REPLACE FUNCTION cleanup_expired_lms_context()
RETURNS void AS $$
BEGIN
    DELETE FROM lms_context
    WHERE cache_expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active concerns view (for teacher dashboard)
CREATE VIEW active_concerns AS
SELECT
    wn.id,
    wn.student_id,
    CASE
        WHEN wn.is_anonymous THEN 'Anonymous'
        ELSE u.name
    END as student_name,
    wn.course_id,
    c.name as course_name,
    wn.content,
    wn.category,
    wn.priority,
    wn.status,
    wn.is_crisis,
    wn.submitted_at,
    wn.first_responded_at,
    wn.assigned_to,
    (SELECT COUNT(*) FROM responses WHERE worry_note_id = wn.id AND is_internal_note = false) as response_count,
    EXTRACT(EPOCH FROM (NOW() - wn.submitted_at))/3600 as hours_since_submission
FROM worry_notes wn
JOIN users u ON wn.student_id = u.id
LEFT JOIN courses c ON wn.course_id = c.id
WHERE wn.status NOT IN ('resolved');

-- Teacher workload view
CREATE VIEW teacher_workload AS
SELECT
    e.user_id as teacher_id,
    u.name as teacher_name,
    e.course_id,
    c.name as course_name,
    COUNT(CASE WHEN wn.status = 'new' THEN 1 END) as new_concerns,
    COUNT(CASE WHEN wn.status = 'reviewing' THEN 1 END) as reviewing_concerns,
    COUNT(CASE WHEN wn.priority = 'urgent' THEN 1 END) as urgent_concerns,
    COUNT(*) as total_active_concerns,
    AVG(EXTRACT(EPOCH FROM (wn.first_responded_at - wn.submitted_at))/3600) as avg_response_time_hours
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
LEFT JOIN worry_notes wn ON wn.course_id = e.course_id AND wn.status NOT IN ('resolved')
WHERE e.role = 'teacher'
GROUP BY e.user_id, u.name, e.course_id, c.name;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default categories
INSERT INTO categories (name, display_name_en, display_name_ko, description, keywords, color, sort_order) VALUES
('academic', 'Academic', '학업', 'Subject-specific difficulties, homework help, learning gaps', ARRAY['homework', 'assignment', 'test', 'quiz', 'understand', 'confused', 'problem'], '#3B82F6', 1),
('emotional', 'Emotional', '정서', 'Stress, anxiety, motivation issues, confidence concerns', ARRAY['stress', 'anxious', 'worried', 'scared', 'pressure', 'overwhelmed', 'motivation'], '#EF4444', 2),
('technical', 'Technical', '기술', 'Platform issues, access problems, tool difficulties', ARRAY['login', 'access', 'error', 'broken', 'submit', 'upload', 'browser'], '#10B981', 3),
('environmental', 'Environmental', '환경', 'Time management, home environment, health issues', ARRAY['time', 'schedule', 'home', 'sick', 'sleep', 'environment'], '#F59E0B', 4),
('social', 'Social', '사회', 'Peer interaction, group work concerns', ARRAY['group', 'team', 'partner', 'classmate', 'collaborate'], '#8B5CF6', 5),
('other', 'Other', '기타', 'Uncategorized concerns', ARRAY[], '#6B7280', 6);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'All system users: students, teachers, counselors, and administrators';
COMMENT ON TABLE worry_notes IS 'Student concern submissions with AI analysis and tracking';
COMMENT ON TABLE responses IS 'Teacher/counselor responses to worry notes';
COMMENT ON TABLE lms_context IS 'Cached student activity data from LMS for context';
COMMENT ON TABLE notifications IS 'In-app and email notifications for users';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and debugging';
COMMENT ON TABLE analytics_snapshots IS 'Pre-aggregated analytics data for performance';

COMMENT ON COLUMN worry_notes.ai_analysis IS 'JSON containing AI-generated insights: themes, sentiment, suggested responses';
COMMENT ON COLUMN worry_notes.is_crisis IS 'Flagged by AI if crisis keywords detected (self-harm, abuse, etc.)';
COMMENT ON COLUMN lms_context.engagement_score IS 'Calculated engagement metric (0.00-1.00) based on LMS activity';
