-- Seed data for Student Timeline application
-- This provides demo data for testing the timeline visualization

-- Insert sample students
INSERT INTO students (id, name, email, grade_level, created_at) VALUES
('student-001', '김민수', 'minsu.kim@example.com', '3학년', NOW() - INTERVAL '30 days'),
('student-002', '이지은', 'jieun.lee@example.com', '3학년', NOW() - INTERVAL '25 days'),
('student-003', '박서준', 'seojun.park@example.com', '4학년', NOW() - INTERVAL '20 days');

-- Insert sample modules
INSERT INTO modules (id, name, description, subject, grade_level, status, created_at) VALUES
('module-001', '분수의 이해', '분수의 개념을 시각적으로 이해하고 기본 연산을 학습합니다', 'mathematics', '3학년', 'active', NOW() - INTERVAL '30 days'),
('module-002', '분수의 덧셈과 뺄셈', '분수의 덧셈과 뺄셈 연산을 마스터합니다', 'mathematics', '3-4학년', 'active', NOW() - INTERVAL '25 days'),
('module-003', '분수의 곱셈', '분수의 곱셈 개념과 계산법을 배웁니다', 'mathematics', '4학년', 'active', NOW() - INTERVAL '20 days');

-- Insert sample problems for 분수의 이해 module
INSERT INTO problems (id, module_id, problem_type, title, description, difficulty_level, problem_data, answer_data, created_at) VALUES
('problem-001', 'module-001', 'visualization', '피자 조각 이해하기', '피자 8조각 중 3조각을 먹었어요. 분수로 나타내면?', 1,
    '{"visual_type": "pizza", "total_slices": 8, "highlighted_slices": 3}'::jsonb,
    '{"numerator": 3, "denominator": 8}'::jsonb,
    NOW() - INTERVAL '30 days'),

('problem-002', 'module-001', 'visualization', '케이크 나누기', '케이크를 4등분했어요. 2조각은 얼마일까요?', 1,
    '{"visual_type": "cake", "total_slices": 4, "highlighted_slices": 2}'::jsonb,
    '{"numerator": 2, "denominator": 4}'::jsonb,
    NOW() - INTERVAL '30 days'),

('problem-003', 'module-001', 'simplification', '분수 약분하기', '2/4를 약분하세요', 2,
    '{"numerator": 2, "denominator": 4}'::jsonb,
    '{"numerator": 1, "denominator": 2}'::jsonb,
    NOW() - INTERVAL '29 days'),

('problem-004', 'module-001', 'comparison', '분수 크기 비교', '1/2와 1/4 중 어느 것이 더 클까요?', 2,
    '{"fraction1": {"numerator": 1, "denominator": 2}, "fraction2": {"numerator": 1, "denominator": 4}}'::jsonb,
    '{"larger": "fraction1"}'::jsonb,
    NOW() - INTERVAL '29 days');

-- Insert problems for 분수의 덧셈과 뺄셈 module
INSERT INTO problems (id, module_id, problem_type, title, description, difficulty_level, problem_data, answer_data, created_at) VALUES
('problem-005', 'module-002', 'addition', '같은 분모 덧셈', '1/5 + 2/5 = ?', 2,
    '{"fraction1": {"numerator": 1, "denominator": 5}, "fraction2": {"numerator": 2, "denominator": 5}, "operation": "add"}'::jsonb,
    '{"numerator": 3, "denominator": 5}'::jsonb,
    NOW() - INTERVAL '25 days'),

('problem-006', 'module-002', 'subtraction', '같은 분모 뺄셈', '4/6 - 1/6 = ?', 2,
    '{"fraction1": {"numerator": 4, "denominator": 6}, "fraction2": {"numerator": 1, "denominator": 6}, "operation": "subtract"}'::jsonb,
    '{"numerator": 3, "denominator": 6}'::jsonb,
    NOW() - INTERVAL '24 days'),

('problem-007', 'module-002', 'addition', '다른 분모 덧셈', '1/2 + 1/4 = ?', 3,
    '{"fraction1": {"numerator": 1, "denominator": 2}, "fraction2": {"numerator": 1, "denominator": 4}, "operation": "add"}'::jsonb,
    '{"numerator": 3, "denominator": 4}'::jsonb,
    NOW() - INTERVAL '23 days');

-- Insert student progress
INSERT INTO student_progress (id, student_id, module_id, progress_percentage, started_at, completed_at, last_accessed_at) VALUES
('progress-001', 'student-001', 'module-001', 75.0, NOW() - INTERVAL '28 days', NULL, NOW() - INTERVAL '1 day'),
('progress-002', 'student-001', 'module-002', 33.3, NOW() - INTERVAL '15 days', NULL, NOW() - INTERVAL '2 days'),
('progress-003', 'student-002', 'module-001', 100.0, NOW() - INTERVAL '22 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('progress-004', 'student-002', 'module-002', 66.7, NOW() - INTERVAL '10 days', NULL, NOW() - INTERVAL '3 days');

-- Insert student attempts for 김민수 (student-001) - Learning journey over time
-- Day 1-2: Starting with visualizations
INSERT INTO student_attempts (id, student_id, problem_id, answer_data, is_correct, time_spent_seconds, attempted_at, hint_used, feedback_given) VALUES
('attempt-001', 'student-001', 'problem-001', '{"numerator": 2, "denominator": 8}'::jsonb, FALSE, 45, NOW() - INTERVAL '28 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-002', 'student-001', 'problem-001', '{"numerator": 3, "denominator": 8}'::jsonb, TRUE, 62, NOW() - INTERVAL '28 days' + INTERVAL '5 minutes', FALSE, '정답입니다! 잘했어요!'),
('attempt-003', 'student-001', 'problem-002', '{"numerator": 2, "denominator": 4}'::jsonb, TRUE, 38, NOW() - INTERVAL '27 days', FALSE, '정답입니다! 잘했어요!'),

-- Day 3-5: Moving to simplification
('attempt-004', 'student-001', 'problem-003', '{"numerator": 2, "denominator": 4}'::jsonb, FALSE, 89, NOW() - INTERVAL '26 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-005', 'student-001', 'problem-003', '{"numerator": 1, "denominator": 3}'::jsonb, FALSE, 72, NOW() - INTERVAL '26 days' + INTERVAL '10 minutes', TRUE, '다시 한번 시도해보세요.'),
('attempt-006', 'student-001', 'problem-003', '{"numerator": 1, "denominator": 2}'::jsonb, TRUE, 95, NOW() - INTERVAL '25 days', TRUE, '정답입니다! 잘했어요!'),

-- Day 6-8: Comparison problems
('attempt-007', 'student-001', 'problem-004', '{"larger": "fraction2"}'::jsonb, FALSE, 103, NOW() - INTERVAL '24 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-008', 'student-001', 'problem-004', '{"larger": "fraction1"}'::jsonb, TRUE, 78, NOW() - INTERVAL '23 days', TRUE, '정답입니다! 잘했어요!'),

-- Day 15: Starting module 2 - addition
('attempt-009', 'student-001', 'problem-005', '{"numerator": 3, "denominator": 10}'::jsonb, FALSE, 125, NOW() - INTERVAL '15 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-010', 'student-001', 'problem-005', '{"numerator": 3, "denominator": 5}'::jsonb, TRUE, 87, NOW() - INTERVAL '15 days' + INTERVAL '8 minutes', FALSE, '정답입니다! 잘했어요!'),

-- Day 17: Subtraction
('attempt-011', 'student-001', 'problem-006', '{"numerator": 3, "denominator": 6}'::jsonb, TRUE, 64, NOW() - INTERVAL '13 days', FALSE, '정답입니다! 잘했어요!');

-- Insert student attempts for 이지은 (student-002) - Faster learner
INSERT INTO student_attempts (id, student_id, problem_id, answer_data, is_correct, time_spent_seconds, attempted_at, hint_used, feedback_given) VALUES
-- Quick progression through module 1
('attempt-012', 'student-002', 'problem-001', '{"numerator": 3, "denominator": 8}'::jsonb, TRUE, 32, NOW() - INTERVAL '22 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-013', 'student-002', 'problem-002', '{"numerator": 2, "denominator": 4}'::jsonb, TRUE, 28, NOW() - INTERVAL '21 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-014', 'student-002', 'problem-003', '{"numerator": 1, "denominator": 2}'::jsonb, TRUE, 45, NOW() - INTERVAL '20 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-015', 'student-002', 'problem-004', '{"larger": "fraction1"}'::jsonb, TRUE, 51, NOW() - INTERVAL '19 days', FALSE, '정답입니다! 잘했어요!'),

-- Module 2 attempts
('attempt-016', 'student-002', 'problem-005', '{"numerator": 3, "denominator": 5}'::jsonb, TRUE, 42, NOW() - INTERVAL '10 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-017', 'student-002', 'problem-006', '{"numerator": 3, "denominator": 6}'::jsonb, TRUE, 38, NOW() - INTERVAL '9 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-018', 'student-002', 'problem-007', '{"numerator": 2, "denominator": 4}'::jsonb, FALSE, 98, NOW() - INTERVAL '8 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-019', 'student-002', 'problem-007', '{"numerator": 3, "denominator": 4}'::jsonb, TRUE, 115, NOW() - INTERVAL '7 days', TRUE, '정답입니다! 잘했어요!');

-- Insert attempts for 박서준 (student-003) - Just started
INSERT INTO student_attempts (id, student_id, problem_id, answer_data, is_correct, time_spent_seconds, attempted_at, hint_used, feedback_given) VALUES
('attempt-020', 'student-003', 'problem-001', '{"numerator": 3, "denominator": 8}'::jsonb, TRUE, 55, NOW() - INTERVAL '5 days', FALSE, '정답입니다! 잘했어요!'),
('attempt-021', 'student-003', 'problem-002', '{"numerator": 1, "denominator": 2}'::jsonb, FALSE, 72, NOW() - INTERVAL '4 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-022', 'student-003', 'problem-002', '{"numerator": 2, "denominator": 4}'::jsonb, TRUE, 68, NOW() - INTERVAL '3 days', TRUE, '정답입니다! 잘했어요!');

-- Add some recent activity
INSERT INTO student_attempts (id, student_id, problem_id, answer_data, is_correct, time_spent_seconds, attempted_at, hint_used, feedback_given) VALUES
('attempt-023', 'student-001', 'problem-007', '{"numerator": 2, "denominator": 6}'::jsonb, FALSE, 142, NOW() - INTERVAL '2 days', FALSE, '다시 한번 시도해보세요.'),
('attempt-024', 'student-001', 'problem-007', '{"numerator": 3, "denominator": 4}'::jsonb, TRUE, 156, NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', TRUE, '정답입니다! 잘했어요!');
