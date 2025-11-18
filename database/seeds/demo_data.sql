-- Demo Data for AI Education Pipeline
-- Run after initial schema migration

-- Insert demo users
INSERT INTO users (id, email, password_hash, full_name, role, institution) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'teacher@kaist.ac.kr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kim Teacher', 'teacher', 'KAIST Touch Math Academy'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'student@kaist.ac.kr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lee Student', 'student', 'KAIST Touch Math Academy'),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'admin@kaist.ac.kr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Park Admin', 'admin', 'KAIST Touch Math Academy');

-- Note: All passwords above are hashed version of 'demo123'

-- Insert demo module
INSERT INTO modules (id, name, description, subject, grade_level, teacher_id, status, original_request, world_model, generated_rules) VALUES
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid,
     '분수 학습 모듈',
     '3학년 학생들을 위한 대화형 분수 학습 모듈입니다. 시각적 표현을 통해 분수의 개념을 이해하고, 덧셈과 뺄셈을 연습할 수 있습니다.',
     'mathematics',
     'Grade 3',
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
     'active',
     '3학년 학생들을 위한 분수 학습 모듈을 만들어주세요. 학생들이 분수의 개념을 시각적으로 이해하고, 분수의 덧셈과 뺄셈을 연습할 수 있어야 합니다.',
     '{
       "concepts": [
         {"name": "Fraction", "attributes": ["numerator", "denominator"]},
         {"name": "Pizza", "attributes": ["slices", "total_slices"]},
         {"name": "Operation", "attributes": ["type", "operands"]}
       ],
       "relationships": [
         {"from": "Fraction", "to": "Numerator", "type": "has-a"},
         {"from": "Fraction", "to": "Denominator", "type": "has-a"}
       ],
       "operations": [
         {"name": "add_fractions", "inputs": ["Fraction", "Fraction"], "output": "Fraction"},
         {"name": "visualize_fraction", "inputs": ["Fraction"], "output": "PizzaVisualization"}
       ]
     }'::jsonb,
     '{
       "validation_rules": [
         {
           "name": "denominator_not_zero",
           "condition": "denominator != 0",
           "error_message": "분모는 0이 될 수 없습니다"
         }
       ],
       "calculation_rules": [
         {
           "name": "add_same_denominator",
           "complexity": "simple"
         }
       ],
       "progression_rules": [
         {
           "name": "mastery_before_arithmetic",
           "condition": "visualization_mastery >= 0.8",
           "action": "unlock_arithmetic_operations"
         }
       ]
     }'::jsonb
    );

-- Insert generation job history
INSERT INTO generation_jobs (module_id, stage, status, tokens_used, api_cost, started_at, completed_at, output_data) VALUES
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'world_model', 'completed', 2500, 0.05, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', '{"success": true}'::jsonb),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'rules', 'completed', 3200, 0.064, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '25 minutes', '{"success": true}'::jsonb),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'data', 'completed', 1800, 0.036, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '23 minutes', '{"success": true}'::jsonb),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'input_strategy', 'completed', 2100, 0.042, NOW() - INTERVAL '23 minutes', NOW() - INTERVAL '21 minutes', '{"success": true}'::jsonb),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'ui', 'completed', 4500, 0.09, NOW() - INTERVAL '21 minutes', NOW() - INTERVAL '15 minutes', '{"success": true}'::jsonb),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'deployment', 'completed', 500, 0.01, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes', '{"success": true}'::jsonb);

-- Insert student progress
INSERT INTO student_progress (student_id, module_id, progress_percentage, score, max_score, attempts, time_spent_seconds, progress_data) VALUES
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid,
     'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid,
     65,
     78.5,
     100.0,
     5,
     1800,
     '{
       "visualization_mastery": 0.85,
       "addition_mastery": 0.60,
       "subtraction_mastery": 0.50,
       "last_problem_id": "prob_123",
       "current_difficulty": 2
     }'::jsonb
    );

-- Grant module access
INSERT INTO module_access (module_id, user_id, access_type, granted_by) VALUES
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'view', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- Insert activity log
INSERT INTO activity_log (user_id, action, resource_type, resource_id, details) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'module_created', 'module', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, '{"name": "분수 학습 모듈"}'::jsonb),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'module_started', 'module', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, '{}'::jsonb),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'problem_attempted', 'module', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, '{"problem_id": "prob_123", "correct": true}'::jsonb);

RAISE NOTICE 'Demo data inserted successfully!';
RAISE NOTICE 'Login credentials:';
RAISE NOTICE '  Teacher: teacher@kaist.ac.kr / demo123';
RAISE NOTICE '  Student: student@kaist.ac.kr / demo123';
RAISE NOTICE '  Admin: admin@kaist.ac.kr / demo123';
