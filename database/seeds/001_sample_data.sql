-- Sample data for development and testing
-- Password for all users: "password123" (hashed with bcrypt)

-- Insert sample teachers
INSERT INTO users (id, email, name, password_hash, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'teacher@example.com', 'Kim Seonsaeng', '$2b$10$YourHashedPasswordHere', 'teacher'),
    ('22222222-2222-2222-2222-222222222222', 'admin@example.com', 'Park Admin', '$2b$10$YourHashedPasswordHere', 'admin');

-- Insert sample students
INSERT INTO users (id, email, name, password_hash, role) VALUES
    ('33333333-3333-3333-3333-333333333333', 'student1@example.com', 'Lee Minho', '$2b$10$YourHashedPasswordHere', 'student'),
    ('44444444-4444-4444-4444-444444444444', 'student2@example.com', 'Choi Yuna', '$2b$10$YourHashedPasswordHere', 'student'),
    ('55555555-5555-5555-5555-555555555555', 'student3@example.com', 'Jung Seojun', '$2b$10$YourHashedPasswordHere', 'student'),
    ('66666666-6666-6666-6666-666666666666', 'student4@example.com', 'Kang Jiwoo', '$2b$10$YourHashedPasswordHere', 'student'),
    ('77777777-7777-7777-7777-777777777777', 'student5@example.com', 'Han Dohyun', '$2b$10$YourHashedPasswordHere', 'student');

-- Initialize student profiles with varying difficulty levels
INSERT INTO students (id, current_difficulty, total_problems_attempted, total_correct, average_solve_time, performance_score, last_activity_at) VALUES
    ('33333333-3333-3333-3333-333333333333', 2, 25, 20, 45.5, 65.0, NOW() - INTERVAL '2 hours'),
    ('44444444-4444-4444-4444-444444444444', 4, 50, 42, 32.2, 78.5, NOW() - INTERVAL '1 hour'),
    ('55555555-5555-5555-5555-555555555555', 3, 30, 18, 55.8, 55.0, NOW() - INTERVAL '5 hours'),
    ('66666666-6666-6666-6666-666666666666', 1, 15, 8, 72.3, 42.0, NOW() - INTERVAL '1 day'),
    ('77777777-7777-7777-7777-777777777777', 5, 80, 72, 28.1, 88.5, NOW() - INTERVAL '30 minutes');

-- Sample math problems - Difficulty 1 (Very Easy)
INSERT INTO problems (id, title, description, type, difficulty, correct_answer, options, tags) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Simple Addition',
     'What is 5 + 3?',
     'multiple_choice',
     1,
     '8',
     '["6", "7", "8", "9"]'::jsonb,
     '["arithmetic", "addition", "basic"]'::jsonb),

    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
     'Simple Subtraction',
     'What is 10 - 4?',
     'multiple_choice',
     1,
     '6',
     '["5", "6", "7", "8"]'::jsonb,
     '["arithmetic", "subtraction", "basic"]'::jsonb);

-- Sample math problems - Difficulty 2 (Easy)
INSERT INTO problems (id, title, description, type, difficulty, correct_answer, options, tags) VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Two-digit Addition',
     'What is 23 + 17?',
     'multiple_choice',
     2,
     '40',
     '["38", "39", "40", "41"]'::jsonb,
     '["arithmetic", "addition", "two-digit"]'::jsonb),

    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc',
     'Multiplication Basics',
     'What is 7 × 6?',
     'multiple_choice',
     2,
     '42',
     '["36", "40", "42", "48"]'::jsonb,
     '["arithmetic", "multiplication"]'::jsonb);

-- Sample math problems - Difficulty 3 (Medium)
INSERT INTO problems (id, title, description, type, difficulty, correct_answer, options, tags) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc',
     'Order of Operations',
     'What is 5 + 3 × 2?',
     'multiple_choice',
     3,
     '11',
     '["10", "11", "13", "16"]'::jsonb,
     '["arithmetic", "order-of-operations", "PEMDAS"]'::jsonb),

    ('cccccccc-cccc-cccc-cccc-cccccccccccd',
     'Fraction Addition',
     'What is 1/4 + 1/4?',
     'multiple_choice',
     3,
     '1/2',
     '["1/8", "2/8", "1/2", "2/4"]'::jsonb,
     '["fractions", "addition"]'::jsonb);

-- Sample math problems - Difficulty 4 (Hard)
INSERT INTO problems (id, title, description, type, difficulty, correct_answer, options, tags) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd',
     'Algebraic Expression',
     'If x = 5, what is 3x + 7?',
     'multiple_choice',
     4,
     '22',
     '["15", "18", "22", "25"]'::jsonb,
     '["algebra", "variables", "substitution"]'::jsonb),

    ('dddddddd-dddd-dddd-dddd-ddddddddddde',
     'Complex Fraction',
     'What is (2/3) × (3/4)?',
     'multiple_choice',
     4,
     '1/2',
     '["1/3", "1/2", "2/3", "5/7"]'::jsonb,
     '["fractions", "multiplication"]'::jsonb);

-- Sample math problems - Difficulty 5 (Very Hard)
INSERT INTO problems (id, title, description, type, difficulty, correct_answer, options, tags) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
     'Quadratic Equation',
     'What are the solutions to x² - 5x + 6 = 0?',
     'multiple_choice',
     5,
     'x = 2 or x = 3',
     '["x = 1 or x = 6", "x = 2 or x = 3", "x = -2 or x = -3", "x = 1 or x = 5"]'::jsonb,
     '["algebra", "quadratic", "equations"]'::jsonb),

    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef',
     'System of Equations',
     'Solve: 2x + y = 10 and x - y = 2. What is x?',
     'multiple_choice',
     5,
     '4',
     '["2", "3", "4", "5"]'::jsonb,
     '["algebra", "systems", "linear-equations"]'::jsonb);

-- Sample attempts for students
INSERT INTO attempts (student_id, problem_id, answer, is_correct, time_spent, difficulty_at_attempt, attempted_at) VALUES
    -- Student 1 (Lee Minho) - performing well at difficulty 2
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '8', true, 35, 1, NOW() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '6', true, 28, 1, NOW() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '40', true, 45, 2, NOW() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '42', true, 52, 2, NOW() - INTERVAL '2 days'),

    -- Student 2 (Choi Yuna) - advanced, performing well at difficulty 4
    ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11', true, 25, 3, NOW() - INTERVAL '2 days'),
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22', true, 38, 4, NOW() - INTERVAL '1 day'),
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-ddddddddddde', '1/2', true, 42, 4, NOW() - INTERVAL '1 day'),

    -- Student 3 (Jung Seojun) - struggling a bit at difficulty 3
    ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '40', true, 65, 2, NOW() - INTERVAL '4 days'),
    ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '16', false, 88, 3, NOW() - INTERVAL '3 days'),
    ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccd', '2/8', false, 95, 3, NOW() - INTERVAL '2 days');

-- Initialize performance metrics
INSERT INTO performance_metrics (student_id, accuracy_rate, total_problems, recent_performance_trend) VALUES
    ('33333333-3333-3333-3333-333333333333', 0.80, 25, 'improving'),
    ('44444444-4444-4444-4444-444444444444', 0.84, 50, 'stable'),
    ('55555555-5555-5555-5555-555555555555', 0.60, 30, 'declining'),
    ('66666666-6666-6666-6666-666666666666', 0.53, 15, 'stable'),
    ('77777777-7777-7777-7777-777777777777', 0.90, 80, 'improving');

-- Sample difficulty adjustments
INSERT INTO difficulty_adjustments (student_id, previous_difficulty, new_difficulty, reason, metrics) VALUES
    ('33333333-3333-3333-3333-333333333333', 1, 2, 'High accuracy (90%) and fast solve time at difficulty 1',
     '{"recentAccuracy": 0.90, "averageSpeed": 31.5, "speedPercentile": 75}'::jsonb),

    ('44444444-4444-4444-4444-444444444444', 3, 4, 'Consistently fast and accurate at difficulty 3',
     '{"recentAccuracy": 0.88, "averageSpeed": 28.2, "speedPercentile": 85}'::jsonb),

    ('55555555-5555-5555-5555-555555555555', 3, 3, 'Maintaining current difficulty due to inconsistent performance',
     '{"recentAccuracy": 0.60, "averageSpeed": 75.5, "speedPercentile": 45}'::jsonb);
