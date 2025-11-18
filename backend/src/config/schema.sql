-- Wave Derivative Database Schema
-- PostgreSQL 15+

-- Drop existing tables if they exist
DROP TABLE IF EXISTS student_interactions CASCADE;
DROP TABLE IF EXISTS student_attempts CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level INTEGER,
    moodle_user_id INTEGER UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules table (representing different mathematical topics)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    subject VARCHAR(100),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table (mathematical functions for wave derivative exploration)
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_type VARCHAR(50) NOT NULL, -- 'sine', 'cosine', 'quadratic', 'cubic', etc.
    function_expression TEXT NOT NULL, -- Mathematical expression
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    expected_derivative TEXT, -- Expected derivative expression
    hints JSONB, -- Array of hints for students
    metadata JSONB, -- Additional problem metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student attempts table (tracking student interactions with problems)
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER,
    shake_count INTEGER DEFAULT 0, -- Number of times student shook the graph
    correct_derivative_identified BOOLEAN,
    score DECIMAL(5, 2), -- Score out of 100
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student interactions table (detailed gesture tracking)
CREATE TABLE student_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'shake', 'drag', 'click', etc.
    shake_intensity DECIMAL(5, 2),
    position_x DECIMAL(10, 4),
    position_y DECIMAL(10, 4),
    derivative_value DECIMAL(10, 4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_problems_module_id ON problems(module_id);
CREATE INDEX idx_problems_function_type ON problems(function_type);
CREATE INDEX idx_student_attempts_student_id ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_problem_id ON student_attempts(problem_id);
CREATE INDEX idx_student_interactions_attempt_id ON student_interactions(attempt_id);
CREATE INDEX idx_students_moodle_user_id ON students(moodle_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO teachers (name, email, institution) VALUES
    ('Dr. Sarah Kim', 'sarah.kim@kaist.ac.kr', 'KAIST Touch Math Academy'),
    ('Prof. John Lee', 'john.lee@kaist.ac.kr', 'KAIST Touch Math Academy');

INSERT INTO modules (name, description, teacher_id, subject, difficulty_level) VALUES
    (
        'Introduction to Derivatives',
        'Learn about derivatives through interactive wave visualizations',
        (SELECT id FROM teachers WHERE email = 'sarah.kim@kaist.ac.kr'),
        'Calculus',
        3
    ),
    (
        'Advanced Derivative Concepts',
        'Explore complex functions and their derivatives',
        (SELECT id FROM teachers WHERE email = 'john.lee@kaist.ac.kr'),
        'Calculus',
        7
    );

INSERT INTO problems (module_id, title, description, function_type, function_expression, difficulty_level, expected_derivative, hints, metadata) VALUES
    (
        (SELECT id FROM modules WHERE name = 'Introduction to Derivatives'),
        'Understanding Sine Wave Derivatives',
        'Explore how the derivative of sin(x) relates to cos(x) by shaking the graph',
        'sine',
        'sin(x)',
        2,
        'cos(x)',
        '["The derivative of sine is cosine", "Notice how the wave shifts by 90 degrees", "Try shaking at different points to see the pattern"]'::jsonb,
        '{"visualization_type": "wave", "color": "#667eea"}'::jsonb
    ),
    (
        (SELECT id FROM modules WHERE name = 'Introduction to Derivatives'),
        'Quadratic Function Analysis',
        'Discover how the derivative of x² changes across the graph',
        'quadratic',
        'x²',
        3,
        '2x',
        '["The derivative is linear", "Notice the derivative is zero at x=0", "The slope increases as x increases"]'::jsonb,
        '{"visualization_type": "wave", "color": "#764ba2"}'::jsonb
    ),
    (
        (SELECT id FROM modules WHERE name = 'Advanced Derivative Concepts'),
        'Polynomial Derivative Challenge',
        'Analyze the complex behavior of a cubic polynomial',
        'polynomial',
        '0.1x³ - 0.5x² + x + 2',
        6,
        '0.3x² - x + 1',
        '["This is a cubic function with three terms", "Look for local maxima and minima", "The derivative shows where the slope changes sign"]'::jsonb,
        '{"visualization_type": "wave", "color": "#f093fb"}'::jsonb
    ),
    (
        (SELECT id FROM modules WHERE name = 'Advanced Derivative Concepts'),
        'Exponential Growth Analysis',
        'Explore the self-similar derivative of exponential functions',
        'exponential',
        'e^(x/2)',
        7,
        '0.5 * e^(x/2)',
        '["Exponential functions are special", "The derivative is proportional to the function itself", "Notice the constant rate of change ratio"]'::jsonb,
        '{"visualization_type": "wave", "color": "#667eea"}'::jsonb
    );

COMMENT ON TABLE problems IS 'Mathematical problems for wave derivative exploration';
COMMENT ON TABLE student_attempts IS 'Records of student attempts at solving problems';
COMMENT ON TABLE student_interactions IS 'Detailed tracking of student gestures and interactions';
COMMENT ON COLUMN student_interactions.shake_intensity IS 'Intensity of shake gesture from 0 to 10';
