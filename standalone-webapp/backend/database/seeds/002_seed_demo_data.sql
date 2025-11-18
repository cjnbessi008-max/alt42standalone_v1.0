-- =====================================================
-- Demo Data for Testing
-- Password for all users: password123
-- Hashed with PASSWORD_DEFAULT (bcrypt)
-- =====================================================

-- Insert Demo Users
INSERT INTO users (email, password, name, role, grade_level, institution, is_active) VALUES
('admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin', NULL, 'KAIST', 1),
('teacher@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김선생', 'teacher', NULL, 'KAIST Touch Math Academy', 1),
('student1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이학생', 'student', '3학년', 'KAIST Touch Math Academy', 1),
('student2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박학생', 'student', '3학년', 'KAIST Touch Math Academy', 1),
('student3@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '최학생', 'student', '4학년', 'KAIST Touch Math Academy', 1);

-- Insert Demo Course
INSERT INTO courses (title, description, teacher_id, subject, grade_level, is_active, start_date) VALUES
('3학년 분수 학습', '분수의 기본 개념부터 덧셈, 뺄셈까지 배우는 과정입니다.', 2, 'mathematics', '3학년', 1, CURDATE());

-- Enroll Students
INSERT INTO course_enrollments (course_id, student_id) VALUES
(1, 3),
(1, 4),
(1, 5);

-- Insert Demo Quiz
INSERT INTO quizzes (course_id, title, description, instructions, time_limit, max_attempts, passing_score, is_published, available_from) VALUES
(1, '분수 기초 개념 퀴즈', '분수의 기본 개념을 이해했는지 확인하는 퀴즈입니다.',
'각 문제를 풀고 나서 자신의 확신도와 이유를 반드시 입력해주세요.', 30, 3, 70.00, 1, NOW());

-- Insert Demo Questions
INSERT INTO questions (quiz_id, question_type, question_text, explanation, points, order_num) VALUES
(1, 'multiple_choice', '1/2은 전체를 몇 개로 나눈 것 중 몇 개를 의미하나요?', '1/2는 전체를 2개로 나눈 것 중 1개를 의미합니다.', 10.00, 1),
(1, 'multiple_choice', '피자를 4조각으로 나누었습니다. 이 중 1조각은 전체의 얼마인가요?', '4조각 중 1조각이므로 1/4입니다.', 10.00, 2),
(1, 'multiple_choice', '1/3 + 1/3은 얼마인가요?', '같은 분모끼리의 덧셈은 분자만 더합니다. 1+1=2이므로 2/3입니다.', 15.00, 3),
(1, 'true_false', '1/2은 0.5와 같다.', '1을 2로 나누면 0.5이므로 맞습니다.', 10.00, 4),
(1, 'multiple_choice', '다음 중 가장 큰 분수는?', '분모가 같을 때는 분자가 클수록 큰 분수입니다.', 15.00, 5);

-- Insert Question Options for Question 1
INSERT INTO question_options (question_id, option_text, is_correct, order_num) VALUES
(1, '2개로 나눈 것 중 1개', 1, 1),
(1, '1개로 나눈 것 중 2개', 0, 2),
(1, '3개로 나눈 것 중 1개', 0, 3),
(1, '2개로 나눈 것 중 2개', 0, 4);

-- Insert Question Options for Question 2
INSERT INTO question_options (question_id, option_text, is_correct, order_num) VALUES
(2, '1/4', 1, 1),
(2, '1/3', 0, 2),
(2, '1/2', 0, 3),
(2, '4/1', 0, 4);

-- Insert Question Options for Question 3
INSERT INTO question_options (question_id, option_text, is_correct, order_num) VALUES
(3, '2/3', 1, 1),
(3, '2/6', 0, 2),
(3, '1/3', 0, 3),
(3, '3/3', 0, 4);

-- Insert Question Options for Question 5
INSERT INTO question_options (question_id, option_text, is_correct, order_num) VALUES
(5, '3/5', 1, 1),
(5, '2/5', 0, 2),
(5, '1/5', 0, 3),
(5, '4/5', 0, 4);

-- Note: Question 4 is true/false, so no options needed
-- The answer is stored directly in question_attempts as "true" or "false"
