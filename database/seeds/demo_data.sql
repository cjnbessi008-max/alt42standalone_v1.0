-- Demo data for Metacognition Mirror system

-- Insert demo students
INSERT INTO students (id, name, email, grade_level) VALUES
('550e8400-e29b-41d4-a716-446655440001', '김민수', 'minsu.kim@example.com', '3학년'),
('550e8400-e29b-41d4-a716-446655440002', '이지은', 'jieun.lee@example.com', '4학년'),
('550e8400-e29b-41d4-a716-446655440003', '박서연', 'seoyeon.park@example.com', '3학년');

-- Insert demo modules
INSERT INTO modules (id, name, description, subject, grade_level, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', '분수의 이해', '분수의 기본 개념을 학습하고 덧셈, 뺄셈을 연습합니다', '수학', '3학년', 'active'),
('660e8400-e29b-41d4-a716-446655440002', '곱셈과 나눗셈', '곱셈과 나눗셈의 원리를 이해하고 문제를 풉니다', '수학', '4학년', 'active'),
('660e8400-e29b-41d4-a716-446655440003', '도형의 넓이', '다양한 도형의 넓이를 계산하는 방법을 학습합니다', '수학', '5학년', 'active');

-- Insert demo learning activities
INSERT INTO learning_activities (id, student_id, module_id, activity_type, activity_name, started_at, completed_at, duration, metadata) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'problem_solving', '분수 덧셈 연습', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes', 1200, '{"moduleName": "분수의 이해", "progress": 100, "outcome": "completed"}'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'video_watching', '분수 개념 설명 영상', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '30 minutes', 1800, '{"moduleName": "분수의 이해", "progress": 100, "outcome": "completed"}'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'reading', '분수 교재 읽기', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '60 minutes', 1800, '{"moduleName": "분수의 이해", "progress": 100, "outcome": "completed"}');

-- Insert current activity (in progress)
INSERT INTO learning_activities (id, student_id, module_id, activity_type, activity_name, started_at, metadata) VALUES
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'problem_solving', '분수 뺄셈 문제 풀이', NOW() - INTERVAL '15 minutes', '{"moduleName": "분수의 이해", "progress": 60, "interactionCount": 25, "lastInteractionAt": "' || NOW()::TEXT || '"}');

-- Insert student progress
INSERT INTO student_progress (student_id, module_id, started_at, last_accessed_at, progress_percentage, completed_activities, total_activities, time_spent) VALUES
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '3 hours', NOW(), 75, 15, 20, 10800);

-- Insert learning insights
INSERT INTO learning_insights (student_id, insight_type, title, description, severity, actionable, suggested_actions, created_at, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'strength_identified', '학습 강점 발견', '당신의 강점: 문제 해결, 시각적 학습', 'info', false, '[]', NOW(), NOW() + INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440001', 'improvement_opportunity', '개선 기회', '향상시킬 수 있는 영역: 읽기 이해력, 자기 성찰', 'info', true, '["연습 문제 더 풀기", "관련 비디오 시청하기", "선생님께 질문하기"]', NOW(), NOW() + INTERVAL '7 days');
