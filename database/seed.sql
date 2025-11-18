-- Balance Machine Sample Data
-- 초기 개발 및 테스트용 샘플 데이터

USE balance_machine;

-- Sample Users
INSERT INTO users (moodle_user_id, username, email, full_name, role) VALUES
(NULL, 'admin', 'admin@balancemachine.com', '관리자', 'admin'),
(101, 'teacher_kim', 'kim@school.com', '김선생', 'teacher'),
(201, 'student_park', 'park@student.com', '박학생', 'student'),
(202, 'student_lee', 'lee@student.com', '이학생', 'student'),
(203, 'student_choi', 'choi@student.com', '최학생', 'student');

-- Sample Problems - Level 1: 기초 일차방정식
INSERT INTO problems (title, equation_left, equation_right, solution, difficulty_level, category, created_by) VALUES
('기초 덧셈 방정식', 'x + 3', '7', 'x = 4', 1, 'linear', 2),
('기초 뺄셈 방정식', 'x - 5', '10', 'x = 15', 1, 'linear', 2),
('양변에 더하기', 'x + 8', '12', 'x = 4', 1, 'linear', 2),
('양변에 빼기', 'x - 3', '9', 'x = 12', 1, 'linear', 2);

-- Sample Problems - Level 2: 계수가 있는 방정식
INSERT INTO problems (title, equation_left, equation_right, solution, difficulty_level, category, created_by) VALUES
('2배 방정식', '2x', '10', 'x = 5', 2, 'linear', 2),
('계수와 상수 1', '2x + 5', '15', 'x = 5', 2, 'linear', 2),
('계수와 상수 2', '3x - 4', '11', 'x = 5', 2, 'linear', 2),
('복합 방정식', '4x + 7', '27', 'x = 5', 2, 'linear', 2);

-- Sample Problems - Level 3: 양변에 변수
INSERT INTO problems (title, equation_left, equation_right, solution, difficulty_level, category, created_by) VALUES
('양변 변수 1', '3x + 2', 'x + 10', 'x = 4', 3, 'linear', 2),
('양변 변수 2', '5x - 3', '2x + 9', 'x = 4', 3, 'linear', 2),
('복잡한 양변', '4x + 6', '2x + 14', 'x = 4', 3, 'linear', 2),
('도전 문제', '7x - 5', '3x + 15', 'x = 5', 3, 'linear', 2);

-- Sample Problems - Level 4: 고급 방정식
INSERT INTO problems (title, equation_left, equation_right, solution, difficulty_level, category, created_by) VALUES
('분수 계수', '(1/2)x + 3', '8', 'x = 10', 4, 'linear', 2),
('큰 수 방정식', '12x + 35', '107', 'x = 6', 4, 'linear', 2),
('복잡한 분배', '2(x + 3)', '14', 'x = 4', 4, 'linear', 2);

-- Hints for first few problems
INSERT INTO hints (problem_id, hint_order, hint_text, penalty_points) VALUES
-- Problem 1: x + 3 = 7
(1, 1, '양변에서 3을 빼면 x를 구할 수 있어요.', 5),
(1, 2, '7 - 3 = 4이므로 x = 4입니다.', 10),

-- Problem 2: x - 5 = 10
(2, 1, '양변에 5를 더하면 x를 구할 수 있어요.', 5),
(2, 2, '10 + 5 = 15이므로 x = 15입니다.', 10),

-- Problem 6: 2x + 5 = 15
(6, 1, '먼저 양변에서 5를 빼보세요.', 5),
(6, 2, '2x = 10이 되었나요? 이제 양변을 2로 나누세요.', 8),
(6, 3, 'x = 5가 정답입니다!', 15),

-- Problem 7: 3x - 4 = 11
(7, 1, '먼저 양변에 4를 더해서 상수를 제거하세요.', 5),
(7, 2, '3x = 15가 되었나요? 이제 양변을 3으로 나누세요.', 8),

-- Problem 9: 3x + 2 = x + 10
(9, 1, '먼저 양변에서 x를 빼서 변수를 한쪽으로 모으세요.', 5),
(9, 2, '2x + 2 = 10이 되었나요? 이제 양변에서 2를 빼세요.', 8),
(9, 3, '2x = 8이므로 x = 4입니다.', 12);

-- Sample Student Progress
INSERT INTO student_progress (student_id, problem_id, status, attempts_count, hints_used, is_correct, final_score, time_spent, started_at, completed_at) VALUES
-- 박학생의 진행상황
(3, 1, 'completed', 1, 0, TRUE, 100.00, 45, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(3, 2, 'completed', 2, 1, TRUE, 85.00, 120, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(3, 3, 'completed', 1, 0, TRUE, 100.00, 38, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(3, 4, 'in_progress', 2, 1, FALSE, 0.00, 95, NOW() - INTERVAL 3 HOUR, NULL),

-- 이학생의 진행상황
(4, 1, 'completed', 1, 0, TRUE, 100.00, 52, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(4, 2, 'completed', 1, 0, TRUE, 100.00, 48, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(4, 3, 'completed', 3, 2, TRUE, 75.00, 180, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 4 HOUR),

-- 최학생의 진행상황
(5, 1, 'completed', 2, 1, TRUE, 90.00, 90, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(5, 2, 'failed', 5, 3, FALSE, 0.00, 300, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY);

-- Sample Problem Attempts (detailed records)
INSERT INTO problem_attempts (progress_id, student_id, problem_id, attempt_number, steps_taken, student_answer, is_correct, score, time_spent, hints_used_in_attempt) VALUES
-- 박학생의 첫 번째 문제 시도
(1, 3, 1, 1,
 '[{"step": 1, "operation": "subtract", "value": 3, "leftSide": "x", "rightSide": "4"}]',
 'x = 4', TRUE, 100.00, 45, 0),

-- 박학생의 두 번째 문제 시도 (2번 시도)
(2, 3, 2, 1,
 '[{"step": 1, "operation": "add", "value": 5, "leftSide": "x", "rightSide": "5"}]',
 'x = 5', FALSE, 0.00, 60, 0),
(2, 3, 2, 2,
 '[{"step": 1, "operation": "add", "value": 5, "leftSide": "x", "rightSide": "15"}]',
 'x = 15', TRUE, 85.00, 60, 1),

-- 이학생의 세 번째 문제 시도 (3번 시도)
(7, 4, 3, 1,
 '[{"step": 1, "operation": "subtract", "value": 10, "leftSide": "x - 2", "rightSide": "2"}]',
 'x = 4', FALSE, 0.00, 45, 0),
(7, 4, 3, 2,
 '[{"step": 1, "operation": "subtract", "value": 8, "leftSide": "x", "rightSide": "0"}]',
 'x = 0', FALSE, 0.00, 85, 1),
(7, 4, 3, 3,
 '[{"step": 1, "operation": "subtract", "value": 8, "leftSide": "x", "rightSide": "4"}]',
 'x = 4', TRUE, 75.00, 50, 2);

-- 통계 확인 쿼리 (주석)
-- SELECT * FROM student_performance;
-- SELECT u.full_name, COUNT(sp.id) as problems_attempted,
--        SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) as problems_solved,
--        AVG(sp.final_score) as avg_score
-- FROM users u
-- LEFT JOIN student_progress sp ON u.id = sp.student_id
-- WHERE u.role = 'student'
-- GROUP BY u.id, u.full_name;
