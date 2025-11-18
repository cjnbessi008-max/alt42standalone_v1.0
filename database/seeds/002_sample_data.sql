-- Sample Data for Testing Misconceptions Tracking
-- This creates a realistic scenario with students learning fractions

-- Insert sample students
INSERT INTO students (id, name, grade_level, email) VALUES
    ('11111111-1111-1111-1111-111111111111', '김민준', '3학년', 'minjun.kim@example.com'),
    ('22222222-2222-2222-2222-222222222222', '이서연', '3학년', 'seoyeon.lee@example.com'),
    ('33333333-3333-3333-3333-333333333333', '박지우', '3학년', 'jiwoo.park@example.com');

-- Insert Fractions module
INSERT INTO modules (id, name, description, subject, grade_level, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '분수 학습',
     '3학년을 위한 분수의 개념, 덧셈, 뺄셈 학습 모듈',
     'mathematics',
     '3학년',
     'active');

-- Insert concepts for Fractions module
INSERT INTO concepts (id, module_id, name, description, parent_concept_id) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '분수의 기본 개념', '분자와 분모의 이해', NULL),
    ('c0000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '분수의 시각화', '피자, 케이크 등으로 분수 표현', 'c0000001-0000-0000-0000-000000000001'),
    ('c0000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '분수의 덧셈', '같은 분모를 가진 분수의 덧셈', NULL),
    ('c0000004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '통분', '다른 분모를 가진 분수를 더하기 위한 통분', 'c0000003-0000-0000-0000-000000000003'),
    ('c0000005-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '약분', '분수를 간단히 만들기', NULL);

-- Insert misconceptions
INSERT INTO misconceptions (id, module_id, concept_id, name, description, typical_wrong_pattern, severity, correction_strategy) VALUES
    ('m0000001-0000-0000-0000-000000000001',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'c0000003-0000-0000-0000-000000000003',
     '분자와 분모를 각각 더함',
     '분수 덧셈 시 분자끼리, 분모끼리 각각 더하는 오류 (예: 1/4 + 1/4 = 2/8)',
     '{"pattern": "add_both_parts", "example": "1/4 + 1/4 = 2/8"}',
     'high',
     '분모는 전체를 나눈 조각의 수이므로 변하지 않고, 분자만 더한다는 것을 시각적으로 설명'),

    ('m0000002-0000-0000-0000-000000000002',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'c0000004-0000-0000-0000-000000000004',
     '통분 없이 분자만 더함',
     '다른 분모를 가진 분수 덧셈 시 통분하지 않고 분자만 더하는 오류 (예: 1/2 + 1/4 = 2/4)',
     '{"pattern": "no_common_denominator", "example": "1/2 + 1/4 = 2/4"}',
     'high',
     '피자 조각 크기가 다를 때는 같은 크기로 맞춰야 한다는 것을 시각적으로 설명'),

    ('m0000003-0000-0000-0000-000000000003',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'c0000004-0000-0000-0000-000000000004',
     '통분 시 한쪽만 변환',
     '통분 시 한 분수만 변환하고 다른 분수는 그대로 두는 오류 (예: 1/2 + 1/4 → 2/4 + 1/4 대신 1/2 + 2/8)',
     '{"pattern": "partial_conversion", "example": "1/2 + 1/4 becomes 1/2 + 2/8"}',
     'medium',
     '두 분수 모두 공통분모로 바꿔야 함을 강조'),

    ('m0000004-0000-0000-0000-000000000004',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'c0000005-0000-0000-0000-000000000005',
     '약분 미수행',
     '답을 약분하지 않고 그대로 제출 (예: 2/4를 1/2로 간단히 하지 않음)',
     '{"pattern": "no_simplification", "example": "2/4 instead of 1/2"}',
     'low',
     '가장 간단한 형태로 표현하는 습관 기르기'),

    ('m0000005-0000-0000-0000-000000000005',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'c0000001-0000-0000-0000-000000000001',
     '분자와 분모 위치 혼동',
     '분자와 분모의 위치를 바꿔서 표현 (예: 3/4를 4/3으로)',
     '{"pattern": "reversed_position", "example": "3/4 written as 4/3"}',
     'medium',
     '분자는 위(조각 수), 분모는 아래(전체 조각 수)라는 것을 반복 학습');

-- Insert sample problems
INSERT INTO problems (id, module_id, concept_id, question_text, problem_type, difficulty_level, correct_answer) VALUES
    ('p0000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c0000003-0000-0000-0000-000000000003',
     '1/4 + 1/4 = ?', 'addition_same_denominator', 1, '{"numerator": 2, "denominator": 4, "simplified": {"numerator": 1, "denominator": 2}}'),

    ('p0000002-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c0000003-0000-0000-0000-000000000003',
     '2/5 + 1/5 = ?', 'addition_same_denominator', 1, '{"numerator": 3, "denominator": 5}'),

    ('p0000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c0000004-0000-0000-0000-000000000004',
     '1/2 + 1/4 = ?', 'addition_different_denominator', 3, '{"numerator": 3, "denominator": 4}'),

    ('p0000004-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c0000004-0000-0000-0000-000000000004',
     '1/3 + 1/6 = ?', 'addition_different_denominator', 3, '{"numerator": 3, "denominator": 6, "simplified": {"numerator": 1, "denominator": 2}}'),

    ('p0000005-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c0000005-0000-0000-0000-000000000005',
     '4/8을 약분하면?', 'simplification', 2, '{"numerator": 1, "denominator": 2}');

-- Enroll students in module
INSERT INTO student_enrollments (student_id, module_id, enrolled_at, progress_percentage) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '7 days', 65.00),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '5 days', 45.00),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '10 days', 80.00);

-- Insert student attempts (with various mistakes demonstrating misconceptions)
-- Student 1 (김민준) - struggles with adding numerators and denominators
INSERT INTO student_attempts (student_id, problem_id, student_answer, is_correct, time_spent_seconds, attempted_at) VALUES
    -- Problem 1: 1/4 + 1/4 - Wrong (added both parts: 2/8)
    ('11111111-1111-1111-1111-111111111111', 'p0000001-0000-0000-0000-000000000001',
     '{"numerator": 2, "denominator": 8}', false, 45, NOW() - INTERVAL '6 days'),
    -- Problem 1: 1/4 + 1/4 - Wrong again (still 2/8)
    ('11111111-1111-1111-1111-111111111111', 'p0000001-0000-0000-0000-000000000001',
     '{"numerator": 2, "denominator": 8}', false, 38, NOW() - INTERVAL '5 days'),
    -- Problem 1: 1/4 + 1/4 - Correct (finally understood)
    ('11111111-1111-1111-1111-111111111111', 'p0000001-0000-0000-0000-000000000001',
     '{"numerator": 2, "denominator": 4}', true, 52, NOW() - INTERVAL '4 days'),

    -- Problem 2: 2/5 + 1/5 - Wrong (added both: 3/10)
    ('11111111-1111-1111-1111-111111111111', 'p0000002-0000-0000-0000-000000000002',
     '{"numerator": 3, "denominator": 10}', false, 42, NOW() - INTERVAL '4 days'),
    -- Problem 2: 2/5 + 1/5 - Wrong again
    ('11111111-1111-1111-1111-111111111111', 'p0000002-0000-0000-0000-000000000002',
     '{"numerator": 3, "denominator": 10}', false, 35, NOW() - INTERVAL '3 days'),

    -- Problem 3: 1/2 + 1/4 - Wrong (no common denominator: 2/4)
    ('11111111-1111-1111-1111-111111111111', 'p0000003-0000-0000-0000-000000000003',
     '{"numerator": 2, "denominator": 4}', false, 65, NOW() - INTERVAL '2 days');

-- Student 2 (이서연) - struggles with common denominators
INSERT INTO student_attempts (student_id, problem_id, student_answer, is_correct, time_spent_seconds, attempted_at) VALUES
    -- Problem 1: Correct
    ('22222222-2222-2222-2222-222222222222', 'p0000001-0000-0000-0000-000000000001',
     '{"numerator": 2, "denominator": 4}', true, 32, NOW() - INTERVAL '5 days'),

    -- Problem 3: Wrong (no common denominator: 2/4)
    ('22222222-2222-2222-2222-222222222222', 'p0000003-0000-0000-0000-000000000003',
     '{"numerator": 2, "denominator": 4}', false, 58, NOW() - INTERVAL '4 days'),
    -- Problem 3: Wrong again (same mistake)
    ('22222222-2222-2222-2222-222222222222', 'p0000003-0000-0000-0000-000000000003',
     '{"numerator": 2, "denominator": 4}', false, 72, NOW() - INTERVAL '3 days'),
    -- Problem 3: Wrong third time
    ('22222222-2222-2222-2222-222222222222', 'p0000003-0000-0000-0000-000000000003',
     '{"numerator": 2, "denominator": 4}', false, 88, NOW() - INTERVAL '2 days'),

    -- Problem 4: Wrong (partial conversion: kept 1/3 as is)
    ('22222222-2222-2222-2222-222222222222', 'p0000004-0000-0000-0000-000000000004',
     '{"numerator": 2, "denominator": 6}', false, 95, NOW() - INTERVAL '2 days'),
    -- Problem 4: Wrong again
    ('22222222-2222-2222-2222-222222222222', 'p0000004-0000-0000-0000-000000000004',
     '{"numerator": 2, "denominator": 6}', false, 78, NOW() - INTERVAL '1 day');

-- Student 3 (박지우) - mostly correct, minor simplification issues
INSERT INTO student_attempts (student_id, problem_id, student_answer, is_correct, time_spent_seconds, attempted_at) VALUES
    -- Problem 1: Correct but not simplified
    ('33333333-3333-3333-3333-333333333333', 'p0000001-0000-0000-0000-000000000001',
     '{"numerator": 2, "denominator": 4}', true, 28, NOW() - INTERVAL '9 days'),

    -- Problem 2: Correct
    ('33333333-3333-3333-3333-333333333333', 'p0000002-0000-0000-0000-000000000002',
     '{"numerator": 3, "denominator": 5}', true, 25, NOW() - INTERVAL '8 days'),

    -- Problem 3: Correct
    ('33333333-3333-3333-3333-333333333333', 'p0000003-0000-0000-0000-000000000003',
     '{"numerator": 3, "denominator": 4}', true, 42, NOW() - INTERVAL '7 days'),

    -- Problem 4: Wrong (not simplified: 3/6)
    ('33333333-3333-3333-3333-333333333333', 'p0000004-0000-0000-0000-000000000004',
     '{"numerator": 3, "denominator": 6}', false, 38, NOW() - INTERVAL '6 days'),
    -- Problem 4: Wrong again (still not simplified)
    ('33333333-3333-3333-3333-333333333333', 'p0000004-0000-0000-0000-000000000004',
     '{"numerator": 3, "denominator": 6}', false, 45, NOW() - INTERVAL '5 days'),

    -- Problem 5: Wrong (didn't simplify)
    ('33333333-3333-3333-3333-333333333333', 'p0000005-0000-0000-0000-000000000005',
     '{"numerator": 4, "denominator": 8}', false, 35, NOW() - INTERVAL '3 days');

-- Now populate student_misconceptions based on the attempts above
-- Student 1: Has "분자와 분모를 각각 더함" and "통분 없이 분자만 더함"
INSERT INTO student_misconceptions (student_id, misconception_id, occurrence_count, first_occurred_at, last_occurred_at, is_resolved) VALUES
    ('11111111-1111-1111-1111-111111111111', 'm0000001-0000-0000-0000-000000000001', 4, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', false),
    ('11111111-1111-1111-1111-111111111111', 'm0000002-0000-0000-0000-000000000002', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', false);

-- Student 2: Has "통분 없이 분자만 더함" and "통분 시 한쪽만 변환"
INSERT INTO student_misconceptions (student_id, misconception_id, occurrence_count, first_occurred_at, last_occurred_at, is_resolved) VALUES
    ('22222222-2222-2222-2222-222222222222', 'm0000002-0000-0000-0000-000000000002', 3, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', false),
    ('22222222-2222-2222-2222-222222222222', 'm0000003-0000-0000-0000-000000000003', 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', false);

-- Student 3: Has "약분 미수행"
INSERT INTO student_misconceptions (student_id, misconception_id, occurrence_count, first_occurred_at, last_occurred_at, is_resolved) VALUES
    ('33333333-3333-3333-3333-333333333333', 'm0000004-0000-0000-0000-000000000004', 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', false);
