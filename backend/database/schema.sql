-- =====================================================
-- Tension Curve Database Schema
-- LMS Integration for Answer Accuracy-Based Tension Curves
-- =====================================================

-- Module table (educational modules/courses)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    teacher_id UUID NOT NULL,
    status VARCHAR(50) CHECK (status IN ('generating', 'active', 'archived', 'draft')) DEFAULT 'draft',
    world_model JSONB,
    generated_schema JSONB,
    generated_ui JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('teacher', 'admin', 'system_maintainer')) DEFAULT 'teacher',
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    student_number VARCHAR(100),
    email VARCHAR(255),
    grade_level VARCHAR(50),
    enrolled_modules UUID[],
    lms_user_id VARCHAR(255),  -- External LMS user ID for integration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problem/Question table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    problem_type VARCHAR(100) NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    content JSONB NOT NULL,  -- Problem data (question text, options, etc.)
    correct_answer JSONB NOT NULL,
    tags VARCHAR(100)[],
    estimated_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_problems_module ON problems(module_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty_level);

-- Student Attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,  -- Track multiple attempts on same problem
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_module ON student_attempts(module_id);
CREATE INDEX idx_student_attempts_timestamp ON student_attempts(attempted_at);

-- Student Progress table (aggregated metrics)
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Basic progress metrics
    total_attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00,  -- Percentage: 0-100%

    -- Time metrics
    total_time_spent_seconds INTEGER DEFAULT 0,
    average_time_per_problem INTEGER,

    -- Difficulty trajectory
    current_difficulty_level INTEGER DEFAULT 1,
    max_difficulty_reached INTEGER DEFAULT 1,
    difficulty_trajectory JSONB,  -- Array of {difficulty, accuracy, timestamp}

    -- Tension curve metrics
    tension_score DECIMAL(5,2),  -- Custom tension metric (0-100)
    learning_curve_phase VARCHAR(50),  -- 'early', 'growth', 'plateau', 'mastery', 'struggling'
    tension_history JSONB,  -- Array of {timestamp, tension_score, accuracy, difficulty}

    -- Performance indicators
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_incorrect INTEGER DEFAULT 0,
    problem_completion_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Timestamps
    started_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, module_id)
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);
CREATE INDEX idx_student_progress_accuracy ON student_progress(accuracy_rate);
CREATE INDEX idx_student_progress_tension ON student_progress(tension_score);

-- Tension Curve Snapshots (historical data points for visualization)
CREATE TABLE IF NOT EXISTS tension_curve_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Snapshot metrics
    snapshot_time TIMESTAMP DEFAULT NOW(),
    accuracy_rate DECIMAL(5,2),
    tension_score DECIMAL(5,2),
    difficulty_level INTEGER,
    attempts_count INTEGER,
    correct_count INTEGER,

    -- Trend indicators
    accuracy_trend VARCHAR(20),  -- 'improving', 'declining', 'stable'
    tension_trend VARCHAR(20),   -- 'increasing', 'decreasing', 'stable'

    -- Predictions (AI-generated)
    predicted_next_tension DECIMAL(5,2),
    predicted_completion_time_hours INTEGER,
    recommended_action VARCHAR(100),  -- 'continue', 'provide_hint', 'reduce_difficulty', etc.

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tension_snapshots_student_module ON tension_curve_snapshots(student_id, module_id);
CREATE INDEX idx_tension_snapshots_time ON tension_curve_snapshots(snapshot_time);

-- Class-level Analytics (aggregated for teacher view)
CREATE TABLE IF NOT EXISTS class_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id),

    -- Class-wide metrics
    total_students INTEGER,
    active_students INTEGER,
    average_accuracy DECIMAL(5,2),
    average_tension_score DECIMAL(5,2),

    -- Distribution data
    accuracy_distribution JSONB,  -- Histogram data
    tension_distribution JSONB,   -- Histogram data
    difficulty_distribution JSONB,

    -- Problem-level insights
    hardest_problems UUID[],  -- Array of problem IDs
    easiest_problems UUID[],
    most_time_consuming_problems UUID[],

    -- Temporal data
    snapshot_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(module_id, snapshot_date)
);

CREATE INDEX idx_class_analytics_module ON class_analytics(module_id);
CREATE INDEX idx_class_analytics_date ON class_analytics(snapshot_date);

-- LMS Integration table (for external LMS connectivity)
CREATE TABLE IF NOT EXISTS lms_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- LMS connection details
    lms_type VARCHAR(50) NOT NULL,  -- 'canvas', 'moodle', 'blackboard', 'google_classroom', etc.
    lms_course_id VARCHAR(255),
    lms_assignment_id VARCHAR(255),

    -- LTI configuration
    lti_consumer_key VARCHAR(255),
    lti_shared_secret VARCHAR(255),
    lti_launch_url TEXT,

    -- Data sync settings
    sync_grades BOOLEAN DEFAULT true,
    sync_tension_curves BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 60,
    last_sync_at TIMESTAMP,

    -- Status
    connection_status VARCHAR(50) DEFAULT 'active',  -- 'active', 'error', 'disabled'
    last_error TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_integration_module ON lms_integration(module_id);

-- LMS Sync Log (track data synchronization with external LMS)
CREATE TABLE IF NOT EXISTS lms_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lms_integration_id UUID NOT NULL REFERENCES lms_integration(id) ON DELETE CASCADE,

    sync_type VARCHAR(50),  -- 'grades', 'tension_curves', 'progress', 'full'
    sync_status VARCHAR(50),  -- 'success', 'partial', 'failed'

    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    error_details TEXT,
    sync_duration_ms INTEGER,

    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lms_sync_log_integration ON lms_sync_log(lms_integration_id);
CREATE INDEX idx_lms_sync_log_time ON lms_sync_log(synced_at);

-- =====================================================
-- Views for common queries
-- =====================================================

-- Student tension curve view (for quick access)
CREATE OR REPLACE VIEW student_tension_curve_view AS
SELECT
    sp.student_id,
    sp.module_id,
    s.name AS student_name,
    m.name AS module_name,
    sp.accuracy_rate,
    sp.tension_score,
    sp.learning_curve_phase,
    sp.current_difficulty_level,
    sp.total_attempts,
    sp.correct_answers,
    sp.last_activity_at,
    CASE
        WHEN sp.tension_score >= 70 THEN 'high_tension'
        WHEN sp.tension_score >= 40 THEN 'moderate_tension'
        ELSE 'low_tension'
    END AS tension_category
FROM student_progress sp
JOIN students s ON sp.student_id = s.id
JOIN modules m ON sp.module_id = m.id;

-- Class performance summary view
CREATE OR REPLACE VIEW class_performance_summary AS
SELECT
    m.id AS module_id,
    m.name AS module_name,
    m.teacher_id,
    COUNT(DISTINCT sp.student_id) AS total_students,
    AVG(sp.accuracy_rate) AS avg_accuracy,
    AVG(sp.tension_score) AS avg_tension,
    MIN(sp.tension_score) AS min_tension,
    MAX(sp.tension_score) AS max_tension,
    COUNT(CASE WHEN sp.learning_curve_phase = 'mastery' THEN 1 END) AS students_at_mastery,
    COUNT(CASE WHEN sp.learning_curve_phase = 'struggling' THEN 1 END) AS students_struggling
FROM modules m
LEFT JOIN student_progress sp ON m.id = sp.module_id
WHERE m.status = 'active'
GROUP BY m.id, m.name, m.teacher_id;

-- =====================================================
-- Functions for tension curve calculations
-- =====================================================

-- Function to calculate tension score
-- Tension score is based on: accuracy rate, difficulty level, and consistency
CREATE OR REPLACE FUNCTION calculate_tension_score(
    p_accuracy_rate DECIMAL,
    p_difficulty_level INTEGER,
    p_consecutive_incorrect INTEGER,
    p_average_time_ratio DECIMAL  -- actual_time / expected_time
) RETURNS DECIMAL AS $$
DECLARE
    accuracy_factor DECIMAL;
    difficulty_factor DECIMAL;
    consistency_factor DECIMAL;
    time_factor DECIMAL;
    tension_score DECIMAL;
BEGIN
    -- Accuracy factor: Lower accuracy = higher tension (inverted)
    accuracy_factor := 100 - p_accuracy_rate;

    -- Difficulty factor: Higher difficulty = higher potential tension
    difficulty_factor := (p_difficulty_level::DECIMAL / 10) * 30;

    -- Consistency factor: More consecutive incorrect = higher tension
    consistency_factor := LEAST(p_consecutive_incorrect * 5, 30);

    -- Time factor: Taking much longer than expected = higher tension
    time_factor := CASE
        WHEN p_average_time_ratio > 1.5 THEN 20
        WHEN p_average_time_ratio > 1.2 THEN 10
        ELSE 0
    END;

    -- Combine factors (weighted average)
    tension_score := (accuracy_factor * 0.4) + (difficulty_factor * 0.3) +
                     (consistency_factor * 0.2) + (time_factor * 0.1);

    -- Clamp to 0-100 range
    tension_score := LEAST(GREATEST(tension_score, 0), 100);

    RETURN ROUND(tension_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to determine learning curve phase
CREATE OR REPLACE FUNCTION determine_learning_phase(
    p_accuracy_rate DECIMAL,
    p_total_attempts INTEGER,
    p_tension_score DECIMAL
) RETURNS VARCHAR AS $$
BEGIN
    IF p_total_attempts < 5 THEN
        RETURN 'early';
    ELSIF p_accuracy_rate >= 85 AND p_tension_score < 30 THEN
        RETURN 'mastery';
    ELSIF p_accuracy_rate < 50 AND p_tension_score > 60 THEN
        RETURN 'struggling';
    ELSIF p_accuracy_rate BETWEEN 50 AND 70 AND p_total_attempts > 20 THEN
        RETURN 'plateau';
    ELSE
        RETURN 'growth';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers for automatic updates
-- =====================================================

-- Trigger to update student_progress when new attempt is recorded
CREATE OR REPLACE FUNCTION update_student_progress_on_attempt()
RETURNS TRIGGER AS $$
DECLARE
    v_progress_record RECORD;
    v_tension_score DECIMAL;
    v_learning_phase VARCHAR;
    v_avg_time_ratio DECIMAL;
BEGIN
    -- Get or create progress record
    SELECT * INTO v_progress_record
    FROM student_progress
    WHERE student_id = NEW.student_id AND module_id = NEW.module_id;

    IF NOT FOUND THEN
        INSERT INTO student_progress (student_id, module_id, started_at, last_activity_at)
        VALUES (NEW.student_id, NEW.module_id, NEW.attempted_at, NEW.attempted_at);

        SELECT * INTO v_progress_record
        FROM student_progress
        WHERE student_id = NEW.student_id AND module_id = NEW.module_id;
    END IF;

    -- Calculate average time ratio (simplified - would need problem expected time)
    v_avg_time_ratio := 1.0;  -- Placeholder

    -- Update progress metrics
    UPDATE student_progress SET
        total_attempts = total_attempts + 1,
        correct_answers = correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        accuracy_rate = ROUND(((correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL /
                              (total_attempts + 1)::DECIMAL) * 100, 2),
        total_time_spent_seconds = total_time_spent_seconds + COALESCE(NEW.time_spent_seconds, 0),
        consecutive_correct = CASE WHEN NEW.is_correct THEN consecutive_correct + 1 ELSE 0 END,
        consecutive_incorrect = CASE WHEN NOT NEW.is_correct THEN consecutive_incorrect + 1 ELSE 0 END,
        last_activity_at = NEW.attempted_at,
        updated_at = NOW()
    WHERE student_id = NEW.student_id AND module_id = NEW.module_id
    RETURNING * INTO v_progress_record;

    -- Calculate tension score
    v_tension_score := calculate_tension_score(
        v_progress_record.accuracy_rate,
        v_progress_record.current_difficulty_level,
        v_progress_record.consecutive_incorrect,
        v_avg_time_ratio
    );

    -- Determine learning phase
    v_learning_phase := determine_learning_phase(
        v_progress_record.accuracy_rate,
        v_progress_record.total_attempts,
        v_tension_score
    );

    -- Update tension score and learning phase
    UPDATE student_progress SET
        tension_score = v_tension_score,
        learning_curve_phase = v_learning_phase,
        updated_at = NOW()
    WHERE student_id = NEW.student_id AND module_id = NEW.module_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_progress
AFTER INSERT ON student_attempts
FOR EACH ROW
EXECUTE FUNCTION update_student_progress_on_attempt();

-- =====================================================
-- Sample data insertion (for testing)
-- =====================================================

-- Note: Uncomment the following to insert sample data

/*
-- Insert sample teacher
INSERT INTO teachers (name, email, institution, role) VALUES
('Dr. Kim', 'kim@kaist.ac.kr', 'KAIST Touch Math Academy', 'teacher');

-- Insert sample module
INSERT INTO modules (name, description, subject, grade_level, teacher_id, status) VALUES
('Fractions Mastery', 'Learn fraction operations with visual aids', 'Mathematics', '4th Grade',
 (SELECT id FROM teachers WHERE email = 'kim@kaist.ac.kr'), 'active');

-- Insert sample students
INSERT INTO students (name, student_number, grade_level) VALUES
('Student A', 'S001', '4th Grade'),
('Student B', 'S002', '4th Grade'),
('Student C', 'S003', '4th Grade');
*/

-- =====================================================
-- End of schema
-- =====================================================
