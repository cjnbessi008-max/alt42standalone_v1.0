-- Sample Data for Log Focus App
-- Use this to test the application without Moodle connection

USE log_focus_app;

-- Insert sample activity logs
INSERT INTO activity_logs (moodle_user_id, user_name, activity_type, problem_id, problem_name, action, result, score, log_message) VALUES
(1, 'Kim Minho', 'QUIZ', 101, 'Algebra Quiz 1', 'SUBMITTED', 'PASS', 85.50, '[QUIZ] Kim Minho SUBMITTED ''Algebra Quiz 1'' - SCORE: 85.50 - RESULT: PASS'),
(2, 'Lee Jieun', 'QUIZ', 101, 'Algebra Quiz 1', 'SUBMITTED', 'FAIL', 45.00, '[QUIZ] Lee Jieun SUBMITTED ''Algebra Quiz 1'' - SCORE: 45.00 - RESULT: FAIL'),
(3, 'Park Seojun', 'QUIZ', 102, 'Geometry Quiz 2', 'STARTED', NULL, NULL, '[QUIZ] Park Seojun STARTED ''Geometry Quiz 2'''),
(1, 'Kim Minho', 'QUIZ', 102, 'Geometry Quiz 2', 'SUBMITTED', 'PASS', 92.00, '[QUIZ] Kim Minho SUBMITTED ''Geometry Quiz 2'' - SCORE: 92.00 - RESULT: PASS - CORRECT answers'),
(4, 'Choi Yuna', 'QUIZ', 101, 'Algebra Quiz 1', 'TIMEOUT', 'FAIL', 0.00, '[QUIZ] Choi Yuna TIMEOUT ''Algebra Quiz 1'' - WARNING: Session expired - RESULT: FAIL'),
(5, 'Jung Hoseok', 'ASSIGNMENT', 201, 'Calculus Homework', 'SUBMITTED', 'PASS', 88.00, '[ASSIGNMENT] Jung Hoseok SUBMITTED ''Calculus Homework'' - SCORE: 88.00 - GRADED'),
(2, 'Lee Jieun', 'QUIZ', 103, 'Trigonometry Quiz', 'SUBMITTED', 'PASS', 78.50, '[QUIZ] Lee Jieun SUBMITTED ''Trigonometry Quiz'' - SCORE: 78.50 - RESULT: PASS'),
(6, 'Han Jisung', 'QUIZ', 101, 'Algebra Quiz 1', 'VIEWED', NULL, NULL, '[QUIZ] Han Jisung VIEWED ''Algebra Quiz 1'' - QUESTION preview'),
(3, 'Park Seojun', 'ASSIGNMENT', 202, 'Statistics Problem Set', 'SUBMITTED', 'FAIL', 55.00, '[ASSIGNMENT] Park Seojun SUBMITTED ''Statistics Problem Set'' - SCORE: 55.00 - INCORRECT solutions found'),
(7, 'Kang Daniel', 'QUIZ', 104, 'Linear Algebra Quiz', 'STARTED', NULL, NULL, '[QUIZ] Kang Daniel STARTED ''Linear Algebra Quiz'' - ATTEMPT 1'),
(1, 'Kim Minho', 'QUIZ', 104, 'Linear Algebra Quiz', 'SUBMITTED', 'PASS', 95.00, '[QUIZ] Kim Minho SUBMITTED ''Linear Algebra Quiz'' - SCORE: 95.00 - RESULT: SUCCESS - EXCELLENT performance'),
(8, 'Son Naeun', 'QUIZ', 102, 'Geometry Quiz 2', 'SUBMITTED', 'FAIL', 40.00, '[QUIZ] Son Naeun SUBMITTED ''Geometry Quiz 2'' - SCORE: 40.00 - ERROR: Multiple WRONG answers'),
(4, 'Choi Yuna', 'QUIZ', 105, 'Probability Quiz', 'SUBMITTED', 'PASS', 82.00, '[QUIZ] Choi Yuna SUBMITTED ''Probability Quiz'' - SCORE: 82.00 - RESULT: PASS'),
(9, 'Bae Suzy', 'ASSIGNMENT', 203, 'Differential Equations', 'VIEWED', NULL, NULL, '[ASSIGNMENT] Bae Suzy VIEWED ''Differential Equations'' - DEADLINE: 3 days'),
(10, 'Yoo Jaeseok', 'QUIZ', 101, 'Algebra Quiz 1', 'SUBMITTED', 'PASS', 90.00, '[QUIZ] Yoo Jaeseok SUBMITTED ''Algebra Quiz 1'' - SCORE: 90.00 - SUCCESS - All CORRECT'),
(5, 'Jung Hoseok', 'QUIZ', 106, 'Calculus Final', 'STARTED', NULL, NULL, '[QUIZ] Jung Hoseok STARTED ''Calculus Final'' - ATTEMPT 1 - WARNING: Single ATTEMPT only'),
(2, 'Lee Jieun', 'ASSIGNMENT', 204, 'Vector Calculus', 'SUBMITTED', 'PASS', 87.50, '[ASSIGNMENT] Lee Jieun SUBMITTED ''Vector Calculus'' - SCORE: 87.50 - GRADED by instructor'),
(11, 'Im Yoona', 'QUIZ', 103, 'Trigonometry Quiz', 'TIMEOUT', 'FAIL', 25.00, '[QUIZ] Im Yoona TIMEOUT ''Trigonometry Quiz'' - ERROR: Time limit exceeded - INCOMPLETE'),
(6, 'Han Jisung', 'QUIZ', 107, 'Number Theory Quiz', 'SUBMITTED', 'PASS', 76.00, '[QUIZ] Han Jisung SUBMITTED ''Number Theory Quiz'' - SCORE: 76.00 - RESULT: PASS'),
(12, 'Hwang Minhyun', 'ASSIGNMENT', 201, 'Calculus Homework', 'SUBMITTED', 'FAIL', 52.00, '[ASSIGNMENT] Hwang Minhyun SUBMITTED ''Calculus Homework'' - SCORE: 52.00 - INCORRECT approach - FAIL');

-- Insert sync status records
INSERT INTO sync_status (sync_type, records_synced, status) VALUES
('quiz_sync', 15, 'success'),
('assignment_sync', 5, 'success'),
('initial_load', 20, 'success');

-- Insert user preferences samples
INSERT INTO user_preferences (user_id, setting_key, setting_value) VALUES
(1, 'auto_refresh', 'true'),
(1, 'refresh_interval', '5000'),
(2, 'highlight_enabled', 'true'),
(3, 'theme', 'dark');

-- Verify insertion
SELECT 'Sample data inserted successfully!' AS status;
SELECT COUNT(*) AS total_logs FROM activity_logs;
SELECT activity_type, COUNT(*) AS count FROM activity_logs GROUP BY activity_type;
SELECT result, COUNT(*) AS count FROM activity_logs WHERE result IS NOT NULL GROUP BY result;
