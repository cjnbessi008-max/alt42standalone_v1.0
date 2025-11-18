-- Initial schema migration
-- Run with: psql -U postgres -d ai_education -f 001_initial_schema.sql

\i ../schema.sql

-- Insert sample data for development
INSERT INTO teachers (name, email, institution, role) VALUES
    ('Dr. Kim', 'kim@kaist.ac.kr', 'KAIST Touch Math Academy', 'Senior Teacher'),
    ('Prof. Lee', 'lee@kaist.ac.kr', 'KAIST Touch Math Academy', 'Mathematics Professor');

INSERT INTO students (name, email, grade_level, institution) VALUES
    ('Alice Park', 'alice@student.kaist.ac.kr', 5, 'KAIST Touch Math Academy'),
    ('Bob Choi', 'bob@student.kaist.ac.kr', 5, 'KAIST Touch Math Academy'),
    ('Charlie Kim', 'charlie@student.kaist.ac.kr', 6, 'KAIST Touch Math Academy');
