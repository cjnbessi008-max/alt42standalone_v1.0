-- Trig Flow Integrator - 샘플 데이터
-- 테스트 및 데모용 샘플 데이터

-- 샘플 문제 데이터
INSERT INTO trig_problems (
    moodle_quiz_id, moodle_question_id, problem_type, function_type,
    difficulty_level, coefficient, frequency, phase_shift, vertical_shift, integration_constant
) VALUES
-- 초급 문제
(1, 101, 'integral', 'sin', 1, 1.00, 1.00, 0.00, 0.00, 0.00),
(1, 102, 'integral', 'cos', 1, 1.00, 1.00, 0.00, 0.00, 0.00),
(1, 103, 'integral', 'sin', 1, 2.00, 1.00, 0.00, 0.00, 0.00),

-- 중급 문제
(2, 201, 'integral', 'sin', 2, 1.00, 2.00, 0.00, 0.00, 0.00),
(2, 202, 'integral', 'cos', 2, 1.50, 1.50, 0.50, 0.00, 0.00),
(2, 203, 'integral', 'tan', 2, 1.00, 1.00, 0.00, 0.00, 0.00),

-- 고급 문제
(3, 301, 'integral', 'sin', 3, 2.00, 2.00, 1.00, 1.00, 0.00),
(3, 302, 'integral', 'cos', 3, 1.50, 2.50, 0.75, -0.50, 0.00),
(3, 303, 'integral', 'sin', 3, -1.00, 3.00, 1.57, 0.50, 0.00),

-- 심화 문제
(4, 401, 'integral', 'cos', 4, 3.00, 1.50, 0.00, 1.50, 1.00),
(4, 402, 'integral', 'sin', 4, 2.50, 2.00, 1.57, -1.00, 0.50),
(4, 403, 'integral', 'tan', 4, 1.50, 1.00, 0.50, 0.00, 0.00),

-- 최고급 문제
(5, 501, 'integral', 'sin', 5, -2.00, 3.00, 1.57, 2.00, 1.50),
(5, 502, 'integral', 'cos', 5, 2.50, 2.50, 0.78, -1.50, -1.00),
(5, 503, 'integral', 'mixed', 5, 1.00, 1.00, 0.00, 0.00, 0.00);

-- 샘플 학생 진행 상황 (시연용)
INSERT INTO student_progress (
    moodle_user_id, problem_id, session_id, completed_at,
    time_spent_seconds, attempts, is_correct, student_answer, interaction_data
) VALUES
-- 학생 1번 (우수 학생)
(1, 1, 'session_001', NOW() - INTERVAL 2 DAY, 45, 1, TRUE,
 '{"answer": "correct", "method": "visual"}',
 '{"clicks": 5, "slider_changes": 12, "animation_views": 3}'),

(1, 2, 'session_002', NOW() - INTERVAL 2 DAY, 38, 1, TRUE,
 '{"answer": "correct", "method": "formula"}',
 '{"clicks": 3, "slider_changes": 8, "animation_views": 2}'),

(1, 4, 'session_003', NOW() - INTERVAL 1 DAY, 52, 2, TRUE,
 '{"answer": "correct", "method": "visual"}',
 '{"clicks": 8, "slider_changes": 15, "animation_views": 4}'),

-- 학생 2번 (보통 학생)
(2, 1, 'session_004', NOW() - INTERVAL 3 DAY, 120, 3, TRUE,
 '{"answer": "correct", "method": "trial_error"}',
 '{"clicks": 25, "slider_changes": 40, "animation_views": 10}'),

(2, 2, 'session_005', NOW() - INTERVAL 3 DAY, 95, 2, TRUE,
 '{"answer": "correct", "method": "trial_error"}',
 '{"clicks": 18, "slider_changes": 30, "animation_views": 7}'),

(2, 3, 'session_006', NOW() - INTERVAL 2 DAY, 85, 2, FALSE,
 '{"answer": "incorrect", "method": "guess"}',
 '{"clicks": 12, "slider_changes": 20, "animation_views": 5}'),

-- 학생 3번 (어려움을 겪는 학생)
(3, 1, 'session_007', NOW() - INTERVAL 4 DAY, 180, 5, FALSE,
 '{"answer": "incorrect", "method": "guess"}',
 '{"clicks": 45, "slider_changes": 60, "animation_views": 15}'),

(3, 1, 'session_008', NOW() - INTERVAL 3 DAY, 150, 4, TRUE,
 '{"answer": "correct", "method": "visual"}',
 '{"clicks": 35, "slider_changes": 50, "animation_views": 12}');

-- 샘플 세션 로그
INSERT INTO session_logs (session_id, moodle_user_id, event_type, event_data) VALUES
('session_001', 1, 'start', '{"problem_id": 1, "timestamp": "2025-11-15 10:00:00"}'),
('session_001', 1, 'slider_change', '{"param": "a", "value": 1.5, "timestamp": "2025-11-15 10:01:23"}'),
('session_001', 1, 'animation_start', '{"timestamp": "2025-11-15 10:02:45"}'),
('session_001', 1, 'submit', '{"answer": "correct", "timestamp": "2025-11-15 10:05:30"}'),

('session_004', 2, 'start', '{"problem_id": 1, "timestamp": "2025-11-14 14:00:00"}'),
('session_004', 2, 'slider_change', '{"param": "a", "value": 2.0, "timestamp": "2025-11-14 14:02:15"}'),
('session_004', 2, 'slider_change', '{"param": "b", "value": 1.5, "timestamp": "2025-11-14 14:03:30"}'),
('session_004', 2, 'animation_start', '{"timestamp": "2025-11-14 14:04:00"}'),
('session_004', 2, 'submit', '{"answer": "incorrect", "timestamp": "2025-11-14 14:10:00"}'),
('session_004', 2, 'retry', '{"timestamp": "2025-11-14 14:11:00"}'),
('session_004', 2, 'submit', '{"answer": "correct", "timestamp": "2025-11-14 14:15:00"}');

-- 시각화 설정 업데이트 (커스텀 테마)
UPDATE visualization_settings SET setting_value = '1.5' WHERE setting_name = 'animation_speed';
UPDATE visualization_settings SET setting_value = '150' WHERE setting_name = 'curve_smoothness';
