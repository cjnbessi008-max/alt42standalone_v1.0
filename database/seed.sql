-- Seed data for Wrong Move Alert System

-- Insert demo students
INSERT INTO students (id, name, email, grade_level, moodle_user_id) VALUES
('student_001', '김지민', 'jimin.kim@example.com', '초등 3학년', 'moodle_user_123'),
('student_002', '이서준', 'seojun.lee@example.com', '초등 3학년', 'moodle_user_124'),
('student_003', '박민서', 'minseo.park@example.com', '초등 4학년', 'moodle_user_125'),
('demo_student', '데모 학생', 'demo@example.com', '초등 3학년', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert demo problems
INSERT INTO problems (id, title, description, type, correct_answer, steps, difficulty, subject, grade_level, moodle_course_id, tags, estimated_time_minutes) VALUES
(
    'problem_001',
    '분수의 덧셈',
    '다음 분수의 덧셈을 계산하세요: 1/2 + 1/4 = ?',
    'step_by_step',
    '3/4',
    '[
        {
            "id": "step_1",
            "order": 1,
            "description": "먼저 공통 분모를 찾으세요. (힌트: 2와 4의 최소공배수)",
            "expectedAction": "4",
            "validationRule": "equals:4"
        },
        {
            "id": "step_2",
            "order": 2,
            "description": "1/2를 분모가 4인 분수로 변환하세요.",
            "expectedAction": "2/4",
            "validationRule": "equals:2/4"
        },
        {
            "id": "step_3",
            "order": 3,
            "description": "이제 2/4 + 1/4를 계산하세요.",
            "expectedAction": "3/4",
            "validationRule": "equals:3/4"
        }
    ]'::jsonb,
    'easy',
    '수학',
    '초등 3학년',
    'course_math_grade3',
    ARRAY['분수', '덧셈', '통분'],
    5
),
(
    'problem_002',
    '분수의 뺄셈',
    '다음 분수의 뺄셈을 계산하세요: 3/4 - 1/2 = ?',
    'step_by_step',
    '1/4',
    '[
        {
            "id": "step_1",
            "order": 1,
            "description": "공통 분모를 찾으세요.",
            "expectedAction": "4",
            "validationRule": "equals:4"
        },
        {
            "id": "step_2",
            "order": 2,
            "description": "1/2를 분모가 4인 분수로 변환하세요.",
            "expectedAction": "2/4",
            "validationRule": "equals:2/4"
        },
        {
            "id": "step_3",
            "order": 3,
            "description": "3/4 - 2/4를 계산하세요.",
            "expectedAction": "1/4",
            "validationRule": "equals:1/4"
        }
    ]'::jsonb,
    'medium',
    '수학',
    '초등 3학년',
    'course_math_grade3',
    ARRAY['분수', '뺄셈', '통분'],
    5
),
(
    'problem_003',
    '곱셈 구구단',
    '7 × 8 = ?',
    'input',
    '56',
    NULL,
    'easy',
    '수학',
    '초등 2학년',
    'course_math_grade2',
    ARRAY['곱셈', '구구단'],
    2
),
(
    'problem_004',
    '두 자리 수 덧셈',
    '45 + 67 = ?',
    'input',
    '112',
    NULL,
    'easy',
    '수학',
    '초등 2학년',
    'course_math_grade2',
    ARRAY['덧셈', '두자리수'],
    3
),
(
    'problem_005',
    '도형의 넓이',
    '가로 5cm, 세로 8cm인 직사각형의 넓이는?',
    'step_by_step',
    '40',
    '[
        {
            "id": "step_1",
            "order": 1,
            "description": "직사각형의 넓이 공식은 무엇인가요? (가로 × 세로)",
            "expectedAction": "가로×세로",
            "validationRule": "contains:×|*"
        },
        {
            "id": "step_2",
            "order": 2,
            "description": "5 × 8을 계산하세요.",
            "expectedAction": "40",
            "validationRule": "equals:40"
        }
    ]'::jsonb,
    'medium',
    '수학',
    '초등 4학년',
    'course_math_grade4',
    ARRAY['도형', '넓이', '직사각형'],
    7
)
ON CONFLICT (id) DO NOTHING;

-- Insert some sample interactions
INSERT INTO student_interactions (id, problem_id, student_id, timestamp, action, is_correct, step_id, time_spent_seconds, attempt_number) VALUES
('int_001', 'problem_001', 'student_001', NOW() - INTERVAL '2 days', '4', true, 'step_1', 45, 1),
('int_002', 'problem_001', 'student_001', NOW() - INTERVAL '2 days', '2/4', true, 'step_2', 30, 1),
('int_003', 'problem_001', 'student_001', NOW() - INTERVAL '2 days', '3/4', true, 'step_3', 25, 1),
('int_004', 'problem_002', 'student_002', NOW() - INTERVAL '1 day', '3', false, 'step_1', 60, 1),
('int_005', 'problem_002', 'student_002', NOW() - INTERVAL '1 day', '4', true, 'step_1', 30, 2),
('int_006', 'problem_003', 'student_003', NOW() - INTERVAL '3 hours', '54', false, NULL, 15, 1),
('int_007', 'problem_003', 'student_003', NOW() - INTERVAL '3 hours', '56', true, NULL, 10, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample wrong move events
INSERT INTO wrong_move_events (id, timestamp, problem_id, step_id, student_id, incorrect_action, expected_action, severity, misconception_type) VALUES
('wrong_001', NOW() - INTERVAL '1 day', 'problem_002', 'step_1', 'student_002', '3', '4', 'medium', 'computational_error'),
('wrong_002', NOW() - INTERVAL '3 hours', 'problem_003', NULL, 'student_003', '54', '56', 'low', 'recall_error')
ON CONFLICT (id) DO NOTHING;

-- Insert sample learning sessions
INSERT INTO learning_sessions (id, student_id, started_at, ended_at, problems_attempted, problems_completed, correct_answers, wrong_moves_count) VALUES
('session_001', 'student_001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 1, 1, 3, 0),
('session_002', 'student_002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', 1, 1, 2, 1),
('session_003', 'student_003', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes', 1, 1, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Update system configuration with sample Moodle settings
UPDATE system_config
SET value = '"https://moodle.kaist.ac.kr"'
WHERE key = 'moodle_base_url';

-- Insert sample Moodle integration log
INSERT INTO moodle_integration_log (operation, moodle_endpoint, request_data, response_data, status_code, success) VALUES
(
    'fetch_course_modules',
    '/webservice/rest/server.php',
    '{"wsfunction": "core_course_get_contents", "courseid": "course_math_grade3"}'::jsonb,
    '{"modules": [{"id": 123, "name": "분수 연습"}]}'::jsonb,
    200,
    true
);

ANALYZE;
