-- Sample Data for Jump Thinking Detection System

USE jump_thinking_db;

-- LTI Consumer (Moodle)
INSERT INTO lti_consumers (consumer_key, consumer_secret, consumer_name, lms_type, lms_version, enabled) VALUES
('moodle_demo_key', 'moodle_demo_secret_12345', 'KAIST Moodle', 'moodle', '3.7', 1);

-- Sample Teacher
INSERT INTO users (lti_user_id, consumer_id, username, email, full_name, role) VALUES
('teacher_001', 1, 'kim.teacher', 'kim@kaist.ac.kr', '김선생', 'teacher');

-- Sample Students
INSERT INTO users (lti_user_id, consumer_id, username, email, full_name, role) VALUES
('student_001', 1, 'park.student', 'park@kaist.ac.kr', '박학생', 'student'),
('student_002', 1, 'lee.student', 'lee@kaist.ac.kr', '이학생', 'student'),
('student_003', 1, 'choi.student', 'choi@kaist.ac.kr', '최학생', 'student');

-- Sample Problem Set: 분수 계산 (3단계)
INSERT INTO problem_sets (title, description, subject, grade_level, teacher_id, difficulty) VALUES
('분수의 덧셈과 뺄셈', '분수의 기본 연산을 단계별로 학습합니다', 'mathematics', 5, 1, 'medium');

-- 단계 1: 기초 - 분모가 같은 분수 덧셈
INSERT INTO problems (set_id, problem_order, step_level, parent_problem_id, title, content, problem_type, correct_answer, max_time_seconds, points, is_required) VALUES
(1, 1, 1, NULL, '같은 분모 분수 덧셈', '1/4 + 2/4 = ?', 'short_answer', '3/4', 120, 10.00, 1);

-- 단계 2: 중간 - 분모가 다른 분수 통분
INSERT INTO problems (set_id, problem_order, step_level, parent_problem_id, title, content, problem_type, correct_answer, max_time_seconds, points, is_required) VALUES
(1, 2, 2, 1, '분수 통분하기', '1/3과 1/4를 통분하면? (쉼표로 구분하여 입력)', 'short_answer', '4/12,3/12', 180, 15.00, 1);

-- 단계 3: 최종 - 분모가 다른 분수 덧셈
INSERT INTO problems (set_id, problem_order, step_level, parent_problem_id, title, content, problem_type, correct_answer, max_time_seconds, points, is_required) VALUES
(1, 3, 3, 2, '분모가 다른 분수 덧셈', '1/3 + 1/4 = ?', 'short_answer', '7/12', 240, 20.00, 1);

-- 추가 문제: 복잡한 분수 계산
INSERT INTO problems (set_id, problem_order, step_level, parent_problem_id, title, content, problem_type, correct_answer, max_time_seconds, points, is_required) VALUES
(1, 4, 1, NULL, '기본 분수 뺄셈', '5/8 - 2/8 = ?', 'short_answer', '3/8', 120, 10.00, 0),
(1, 5, 2, 4, '다른 분모 분수 통분 2', '2/5와 1/3을 통분하면?', 'short_answer', '6/15,5/15', 180, 15.00, 0),
(1, 6, 3, 5, '분모가 다른 분수 뺄셈', '2/5 - 1/3 = ?', 'short_answer', '1/15', 240, 20.00, 0);

-- Sample Problem Set 2: 방정식 풀이
INSERT INTO problem_sets (title, description, subject, grade_level, teacher_id, difficulty) VALUES
('일차방정식 풀이', '일차방정식을 단계별로 풀어봅니다', 'mathematics', 7, 1, 'medium');

-- 방정식 문제들
INSERT INTO problems (set_id, problem_order, step_level, parent_problem_id, title, content, problem_type, correct_answer, max_time_seconds, points, is_required) VALUES
(2, 1, 1, NULL, '항 이동하기', '2x + 5 = 13에서 5를 우변으로 이동하면?', 'short_answer', '2x=8', 90, 10.00, 1),
(2, 2, 2, 7, '계수로 나누기', '2x = 8에서 x의 값은?', 'short_answer', '4', 90, 15.00, 1),
(2, 3, 3, 8, '방정식 완전 풀이', '2x + 5 = 13, x = ?', 'short_answer', '4', 150, 20.00, 1);

-- Sample Session: 학생 1의 정상적인 풀이
INSERT INTO student_sessions (student_id, set_id, lti_resource_link_id, session_token, started_at, completed_at, total_time_seconds, status) VALUES
(2, 1, 'resource_link_001', 'session_token_001', '2024-01-15 10:00:00', '2024-01-15 10:15:00', 900, 'completed');

-- 정상 풀이 시도들
INSERT INTO attempts (session_id, problem_id, attempt_number, student_answer, is_correct, time_spent_seconds, hints_used, skipped) VALUES
(1, 1, 1, '3/4', 1, 100, 0, 0),
(1, 2, 1, '4/12,3/12', 1, 150, 1, 0),
(1, 3, 1, '7/12', 1, 200, 0, 0);

-- Sample Session 2: 학생 2의 비약 사고 풀이 (단계 건너뛰기)
INSERT INTO student_sessions (student_id, set_id, lti_resource_link_id, session_token, started_at, completed_at, total_time_seconds, status) VALUES
(3, 1, 'resource_link_002', 'session_token_002', '2024-01-15 11:00:00', '2024-01-15 11:05:00', 300, 'completed');

-- 비약 풀이: 1단계만 풀고 바로 3단계로
INSERT INTO attempts (session_id, problem_id, attempt_number, student_answer, is_correct, time_spent_seconds, hints_used, skipped) VALUES
(2, 1, 1, '3/4', 1, 60, 0, 0),
(2, 2, 1, NULL, 0, 5, 0, 1),  -- 2단계 건너뜀
(2, 3, 1, '7/12', 1, 90, 0, 0);  -- 바로 3단계 정답

-- Jump Thinking Event 기록
INSERT INTO jump_thinking_events (session_id, event_type, from_problem_id, to_problem_id, expected_step_level, actual_step_level, time_difference_seconds, severity, description) VALUES
(2, 'step_skip', 1, 3, 2, 3, -85, 'high', '2단계(통분)를 건너뛰고 바로 최종 단계 정답 도출'),
(2, 'fast_solve', 1, 3, 2, 3, -150, 'medium', '예상 시간(240초)보다 훨씬 빠르게(90초) 최종 문제 해결');

-- Jump Score 계산
INSERT INTO jump_thinking_scores (session_id, student_id, set_id, jump_score, total_events, step_skips, fast_solves, sequence_violations, direct_answers, avg_time_ratio, analysis_completed_at) VALUES
(1, 2, 1, 15.00, 0, 0, 0, 0, 0, 1.08, '2024-01-15 10:15:30'),  -- 정상 학생 (낮은 점수)
(2, 3, 1, 85.00, 2, 1, 1, 0, 0, 0.42, '2024-01-15 11:05:30');  -- 비약 사고 학생 (높은 점수)

-- Learning Pattern 분석
INSERT INTO learning_patterns (student_id, total_sessions, avg_jump_score, tendency, last_analyzed_at) VALUES
(2, 1, 15.00, 'sequential', '2024-01-15 10:15:30'),
(3, 1, 85.00, 'jumper', '2024-01-15 11:05:30');
