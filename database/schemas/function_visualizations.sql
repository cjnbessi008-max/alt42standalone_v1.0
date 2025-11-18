-- Database Schema for Color Partition Feature
-- PostgreSQL 15+

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modules table (educational modules)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50) DEFAULT 'mathematics',
    grade_level VARCHAR(20),
    teacher_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('generating', 'active', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function Visualizations table
CREATE TABLE IF NOT EXISTS function_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    expression TEXT NOT NULL,
    x_min DECIMAL(10, 4) NOT NULL,
    x_max DECIMAL(10, 4) NOT NULL,
    derivative TEXT,
    second_derivative TEXT,
    plot_data JSONB, -- Store plot points as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visualization Intervals table
CREATE TABLE IF NOT EXISTS visualization_intervals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visualization_id UUID REFERENCES function_visualizations(id) ON DELETE CASCADE,
    start_value DECIMAL(10, 4) NOT NULL,
    end_value DECIMAL(10, 4) NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (
        property_type IN ('increasing', 'decreasing', 'concave_up', 'concave_down', 'positive', 'negative')
    ),
    color_hex VARCHAR(7) NOT NULL,
    description VARCHAR(255),
    layer_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    grade_level VARCHAR(20),
    enrolled_modules UUID[], -- Array of module IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    visualization_id UUID REFERENCES function_visualizations(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    interaction_data JSONB, -- Store user interactions
    UNIQUE(student_id, visualization_id)
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'system_maintainer')),
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LMS Integration table (for Moodle compatibility)
CREATE TABLE IF NOT EXISTS lms_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lms_type VARCHAR(50) DEFAULT 'moodle',
    lms_course_id VARCHAR(255),
    lms_activity_id VARCHAR(255),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_function_viz_module ON function_visualizations(module_id);
CREATE INDEX idx_intervals_visualization ON visualization_intervals(visualization_id);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_module ON student_progress(module_id);
CREATE INDEX idx_lms_integrations_module ON lms_integrations(module_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_function_visualizations_updated_at BEFORE UPDATE ON function_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_integrations_updated_at BEFORE UPDATE ON lms_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO teachers (name, email, institution, role) VALUES
    ('김선생', 'kim.teacher@kaist.ac.kr', 'KAIST Touch Math Academy', 'teacher'),
    ('이선생', 'lee.teacher@kaist.ac.kr', 'KAIST Touch Math Academy', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO modules (name, description, subject, grade_level, status) VALUES
    ('함수의 성질 분석', 'Color Partition을 이용한 함수 구간 분석', 'mathematics', '중학교 3학년', 'active')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE function_visualizations IS '함수 시각화 데이터를 저장하는 테이블';
COMMENT ON TABLE visualization_intervals IS '함수의 구간별 성질 정보를 저장하는 테이블';
COMMENT ON TABLE lms_integrations IS 'Moodle 등 LMS와의 연동 정보를 저장하는 테이블';
