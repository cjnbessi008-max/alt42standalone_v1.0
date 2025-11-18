-- Sample Data for Integration Arms
-- MySQL 5.7

USE integration_arms;

-- Sample Problems
INSERT INTO `integration_problems` (`moodle_question_id`, `problem_latex`, `correct_u`, `correct_dv`, `difficulty`, `hints`) VALUES
(1001, '\\int x \\cdot e^x \\, dx', 'x', 'e^x dx', 'easy', '["u는 미분하기 쉬운 항을 선택하세요", "dv는 적분 가능한 항을 선택하세요", "x를 미분하면 상수가 됩니다"]'),
(1002, '\\int x \\cdot \\sin(x) \\, dx', 'x', '\\sin(x) dx', 'easy', '["삼각함수는 적분해도 복잡도가 유사합니다", "x를 u로 선택하면 미분 시 간단해집니다"]'),
(1003, '\\int x \\cdot \\cos(x) \\, dx', 'x', '\\cos(x) dx', 'easy', '["cos(x)를 적분하면 sin(x)가 됩니다", "x는 미분하면 1이 됩니다"]'),
(1004, '\\int x^2 \\cdot \\sin(x) \\, dx', 'x^2', '\\sin(x) dx', 'medium', '["x^2를 두 번 미분해야 합니다", "부분적분을 두 번 사용해야 할 수 있습니다"]'),
(1005, '\\int \\ln(x) \\, dx', '\\ln(x)', 'dx', 'medium', '["ln(x)는 적분이 어렵지만 미분은 쉽습니다", "dv = dx로 놓으세요"]'),
(1006, '\\int x \\cdot \\ln(x) \\, dx', '\\ln(x)', 'x dx', 'medium', '["ln(x)는 u로 선택하는 것이 좋습니다", "x는 적분하기 쉽습니다"]'),
(1007, '\\int e^x \\cdot \\cos(x) \\, dx', 'e^x', '\\cos(x) dx', 'hard', '["부분적분을 두 번 사용하세요", "원래 적분이 다시 나타납니다", "양변을 정리하세요"]'),
(1008, '\\int e^x \\cdot \\sin(x) \\, dx', 'e^x', '\\sin(x) dx', 'hard', '["cos의 경우와 유사합니다", "순환 관계를 이용하세요"]'),
(1009, '\\int x^2 \\cdot e^{-x} \\, dx', 'x^2', 'e^{-x} dx', 'hard', '["x^2를 두 번 미분하세요", "부분적분을 반복 적용하세요"]'),
(1010, '\\int \\arctan(x) \\, dx', '\\arctan(x)', 'dx', 'medium', '["역삼각함수는 미분은 쉽지만 적분은 어렵습니다", "dv = dx로 설정하세요"]');

-- Sample Animation Settings
INSERT INTO `animation_settings` (`user_id`, `animation_speed`, `auto_play`, `show_hints`, `sound_enabled`) VALUES
(1, 1.0, 1, 1, 1),
(2, 1.5, 1, 0, 1),
(3, 0.8, 0, 1, 0);

-- Sample Learning Progress
INSERT INTO `learning_progress` (`moodle_user_id`, `total_attempts`, `correct_attempts`, `average_time`, `mastery_level`) VALUES
(1, 15, 12, 45.3, 'intermediate'),
(2, 8, 6, 62.1, 'beginner'),
(3, 25, 22, 38.7, 'advanced');

-- Sample Student Attempts
INSERT INTO `student_attempts` (`moodle_user_id`, `problem_id`, `selected_u`, `selected_dv`, `is_correct`, `attempt_time`, `hint_used`, `feedback`) VALUES
(1, 1, 'x', 'e^x dx', 1, 42.5, 0, '정답입니다! x를 u로 선택하면 미분 시 상수가 되어 간단합니다.'),
(1, 2, 'x', '\\sin(x) dx', 1, 38.2, 1, '정답입니다! 힌트를 1개 사용했습니다.'),
(1, 5, 'dx', '\\ln(x)', 0, 65.8, 2, 'ln(x)는 적분이 어렵습니다. u = ln(x)로 선택해보세요.'),
(2, 1, 'e^x dx', 'x', 0, 55.3, 0, 'e^x는 미분해도 e^x입니다. x를 u로 선택하세요.'),
(2, 1, 'x', 'e^x dx', 1, 48.7, 1, '정답입니다! 두 번째 시도에 성공했습니다.'),
(3, 4, 'x^2', '\\sin(x) dx', 1, 35.2, 0, '정답입니다! x^2를 두 번 미분하여 부분적분을 반복하세요.');

-- Sample Session Logs (최근 활동)
INSERT INTO `session_logs` (`moodle_user_id`, `session_token`, `ip_address`, `user_agent`, `activity_type`, `activity_data`) VALUES
(1, 'token_abc123', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'problem_view', '{"problem_id": 1, "timestamp": "2025-11-18T10:30:00Z"}'),
(1, 'token_abc123', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'answer_submit', '{"problem_id": 1, "is_correct": true, "time_taken": 42.5}'),
(2, 'token_def456', '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'problem_view', '{"problem_id": 1, "timestamp": "2025-11-18T11:15:00Z"}'),
(3, 'token_ghi789', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'animation_replay', '{"problem_id": 4, "speed": 1.0}');
