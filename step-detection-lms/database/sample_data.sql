-- Sample Data for Step Detection LMS
-- 테스트 및 데모용 샘플 데이터

SET NAMES utf8mb4;

-- ============================================
-- 1. 샘플 교사 데이터
-- ============================================

INSERT INTO `teachers` (`username`, `email`, `full_name`, `moodle_user_id`) VALUES
('teacher_kim', 'kim@kaist.ac.kr', '김선생', 1001),
('teacher_lee', 'lee@kaist.ac.kr', '이선생', 1002);

-- ============================================
-- 2. 샘플 학생 데이터
-- ============================================

INSERT INTO `students` (`username`, `email`, `full_name`, `grade_level`, `moodle_user_id`) VALUES
('student001', 'student001@school.kr', '홍길동', '5학년', 2001),
('student002', 'student002@school.kr', '김철수', '5학년', 2002),
('student003', 'student003@school.kr', '이영희', '5학년', 2003),
('student004', 'student004@school.kr', '박민수', '6학년', 2004),
('student005', 'student005@school.kr', '최지현', '6학년', 2005);

-- ============================================
-- 3. 샘플 문제: 분수 덧셈
-- ============================================

-- 문제 1: 간단한 분수 덧셈
INSERT INTO `problems` (`problem_type_id`, `title`, `description`, `difficulty_level`, `expected_time_seconds`, `correct_answer`, `created_by`) VALUES
(1, '분수 덧셈 기초', '다음 분수의 덧셈을 계산하세요: 1/3 + 1/4', 2, 300, '{"numerator": 7, "denominator": 12}', 1);

SET @problem1_id = LAST_INSERT_ID();

-- 문제 1의 단계 정의
INSERT INTO `problem_steps` (`problem_id`, `step_order`, `step_name`, `display_name`, `description`, `is_required`, `expected_time_seconds`, `hint_text`) VALUES
(@problem1_id, 1, 'identify_denominators', '분모 확인하기', '두 분수의 분모를 확인합니다', 1, 30, '첫 번째 분수의 분모는 3, 두 번째 분수의 분모는 4입니다.'),
(@problem1_id, 2, 'find_lcm', '최소공배수 구하기', '두 분모의 최소공배수를 구합니다', 1, 60, '3과 4의 배수를 나열해보세요: 3, 6, 9, 12... / 4, 8, 12...'),
(@problem1_id, 3, 'convert_to_common_denominator', '통분하기', '두 분수를 공통분모로 변환합니다', 1, 90, '1/3 = (1×4)/(3×4) = 4/12, 1/4 = (1×3)/(4×3) = 3/12'),
(@problem1_id, 4, 'add_numerators', '분자 더하기', '통분된 분수의 분자를 더합니다', 1, 60, '4/12 + 3/12 = (4+3)/12 = ?/12'),
(@problem1_id, 5, 'simplify', '약분하기', '결과를 가장 간단한 형태로 약분합니다', 0, 60, '7과 12의 최대공약수를 구해보세요. 최대공약수가 1이면 더 이상 약분할 수 없습니다.');

-- 문제 2: 중간 난이도 분수 덧셈
INSERT INTO `problems` (`problem_type_id`, `title`, `description`, `difficulty_level`, `expected_time_seconds`, `correct_answer`, `created_by`) VALUES
(1, '분수 덧셈 응용', '다음 분수의 덧셈을 계산하세요: 2/5 + 3/10', 3, 360, '{"numerator": 7, "denominator": 10}', 1);

SET @problem2_id = LAST_INSERT_ID();

INSERT INTO `problem_steps` (`problem_id`, `step_order`, `step_name`, `display_name`, `description`, `is_required`, `expected_time_seconds`, `hint_text`) VALUES
(@problem2_id, 1, 'identify_denominators', '분모 확인하기', '두 분수의 분모를 확인합니다', 1, 30, '첫 번째 분수의 분모는 5, 두 번째 분수의 분모는 10입니다.'),
(@problem2_id, 2, 'find_lcm', '최소공배수 구하기', '두 분모의 최소공배수를 구합니다', 1, 60, '5의 배수: 5, 10, 15... / 10의 배수: 10, 20...'),
(@problem2_id, 3, 'convert_to_common_denominator', '통분하기', '두 분수를 공통분모로 변환합니다', 1, 90, '2/5 = (2×2)/(5×2) = 4/10, 3/10은 이미 분모가 10입니다.'),
(@problem2_id, 4, 'add_numerators', '분자 더하기', '통분된 분수의 분자를 더합니다', 1, 60, '4/10 + 3/10 = (4+3)/10 = 7/10'),
(@problem2_id, 5, 'simplify', '약분하기', '결과를 가장 간단한 형태로 약분합니다', 0, 60, '7과 10의 최대공약수는 1이므로 7/10이 최종 답입니다.');

-- ============================================
-- 4. 샘플 문제: 일차방정식
-- ============================================

INSERT INTO `problems` (`problem_type_id`, `title`, `description`, `difficulty_level`, `expected_time_seconds`, `correct_answer`, `created_by`) VALUES
(3, '일차방정식 기초', '다음 방정식을 풀어보세요: 2x + 5 = 13', 2, 240, '{"x": 4}', 1);

SET @problem3_id = LAST_INSERT_ID();

INSERT INTO `problem_steps` (`problem_id`, `step_order`, `step_name`, `display_name`, `description`, `is_required`, `expected_time_seconds`, `hint_text`) VALUES
(@problem3_id, 1, 'isolate_variable_term', '미지수 항 정리', '미지수가 포함된 항을 한쪽으로 모읍니다', 1, 60, '양변에서 5를 빼보세요: 2x + 5 - 5 = 13 - 5'),
(@problem3_id, 2, 'simplify_equation', '식 간단히 하기', '정리된 식을 간단하게 만듭니다', 1, 45, '2x = 8 형태로 만드세요'),
(@problem3_id, 3, 'solve_for_x', 'x 구하기', '미지수의 값을 구합니다', 1, 60, '양변을 2로 나누세요: 2x ÷ 2 = 8 ÷ 2'),
(@problem3_id, 4, 'verify_answer', '검산하기', '구한 값을 원래 식에 대입하여 확인합니다', 0, 75, 'x = 4를 원래 식에 대입: 2(4) + 5 = 8 + 5 = 13 ✓');

-- ============================================
-- 5. 샘플 풀이 데이터
-- ============================================

-- 정상적인 풀이 예시 (학생 1, 문제 1)
INSERT INTO `student_solutions` (`student_id`, `problem_id`, `session_token`, `started_at`, `submitted_at`, `total_time_seconds`, `final_answer`, `is_correct`, `score`, `status`) VALUES
(1, @problem1_id, 'session_001_normal', '2025-11-18 10:00:00', '2025-11-18 10:05:30', 330, '{"numerator": 7, "denominator": 12}', 1, 100.00, 'submitted');

SET @solution1_id = LAST_INSERT_ID();

INSERT INTO `step_submissions` (`solution_id`, `step_id`, `attempt_number`, `student_input`, `is_correct`, `time_spent_seconds`, `hint_used`, `submitted_at`) VALUES
(@solution1_id, 1, 1, '{"denominator1": 3, "denominator2": 4}', 1, 25, 0, '2025-11-18 10:00:25'),
(@solution1_id, 2, 1, '{"lcm": 12}', 1, 65, 0, '2025-11-18 10:01:30'),
(@solution1_id, 3, 1, '{"fraction1": "4/12", "fraction2": "3/12"}', 1, 95, 0, '2025-11-18 10:03:05'),
(@solution1_id, 4, 1, '{"result": "7/12"}', 1, 85, 0, '2025-11-18 10:04:30'),
(@solution1_id, 5, 1, '{"final": "7/12"}', 1, 60, 0, '2025-11-18 10:05:30');

-- 의심스러운 풀이 예시 1: 시간 이상 (너무 빠름)
INSERT INTO `student_solutions` (`student_id`, `problem_id`, `session_token`, `started_at`, `submitted_at`, `total_time_seconds`, `final_answer`, `is_correct`, `score`, `status`) VALUES
(2, @problem1_id, 'session_002_suspicious', '2025-11-18 11:00:00', '2025-11-18 11:01:30', 90, '{"numerator": 7, "denominator": 12}', 1, 75.00, 'submitted');

SET @solution2_id = LAST_INSERT_ID();

INSERT INTO `step_submissions` (`solution_id`, `step_id`, `attempt_number`, `student_input`, `is_correct`, `time_spent_seconds`, `hint_used`, `submitted_at`) VALUES
(@solution2_id, 1, 1, '{"denominator1": 3, "denominator2": 4}', 1, 10, 0, '2025-11-18 11:00:10'),
(@solution2_id, 2, 1, '{"lcm": 12}', 1, 15, 0, '2025-11-18 11:00:25'),
(@solution2_id, 3, 1, '{"fraction1": "4/12", "fraction2": "3/12"}', 1, 20, 0, '2025-11-18 11:00:45'),
(@solution2_id, 4, 1, '{"result": "7/12"}', 1, 25, 0, '2025-11-18 11:01:10'),
(@solution2_id, 5, 1, '{"final": "7/12"}', 1, 20, 0, '2025-11-18 11:01:30');

-- 이 풀이에 대한 건너뛰기 탐지
INSERT INTO `skip_detections` (`solution_id`, `detection_type`, `severity`, `confidence_score`, `description`, `affected_steps`, `evidence_data`) VALUES
(@solution2_id, 'time_anomaly', 'high', 85.50, '평균 소요 시간 대비 73% 빠른 완료. 모든 단계를 균일한 속도로 완료하여 의심됨.', '[2, 3, 4]', '{"avg_time_expected": 330, "actual_time": 90, "speed_ratio": 0.27, "uniform_timing": true}');

-- 의심스러운 풀이 예시 2: 힌트 의존도
INSERT INTO `student_solutions` (`student_id`, `problem_id`, `session_token`, `started_at`, `submitted_at`, `total_time_seconds`, `final_answer`, `is_correct`, `score`, `status`) VALUES
(3, @problem1_id, 'session_003_hint_dependent', '2025-11-18 12:00:00', '2025-11-18 12:07:00', 420, '{"numerator": 7, "denominator": 12}', 1, 60.00, 'submitted');

SET @solution3_id = LAST_INSERT_ID();

INSERT INTO `step_submissions` (`solution_id`, `step_id`, `attempt_number`, `student_input`, `is_correct`, `time_spent_seconds`, `hint_used`, `hint_viewed_at`, `submitted_at`) VALUES
(@solution3_id, 1, 1, '{"denominator1": 3, "denominator2": 4}', 1, 80, 1, '2025-11-18 12:01:00', '2025-11-18 12:01:20'),
(@solution3_id, 2, 1, '{"lcm": 12}', 1, 100, 1, '2025-11-18 12:02:30', '2025-11-18 12:03:00'),
(@solution3_id, 3, 1, '{"fraction1": "4/12", "fraction2": "3/12"}', 1, 90, 1, '2025-11-18 12:04:00', '2025-11-18 12:04:30'),
(@solution3_id, 4, 1, '{"result": "7/12"}', 1, 80, 1, '2025-11-18 12:05:30', '2025-11-18 12:06:00'),
(@solution3_id, 5, 1, '{"final": "7/12"}', 1, 70, 1, '2025-11-18 12:06:20', '2025-11-18 12:07:00');

INSERT INTO `skip_detections` (`solution_id`, `detection_type`, `severity`, `confidence_score`, `description`, `affected_steps`, `evidence_data`) VALUES
(@solution3_id, 'hint_dependency', 'medium', 78.00, '모든 단계에서 힌트를 먼저 확인한 후 즉시 정답 입력. 독립적 문제 해결 능력 부족 의심.', '[1, 2, 3, 4, 5]', '{"total_steps": 5, "hint_used_count": 5, "avg_time_after_hint": 12}');

-- 의심스러운 풀이 예시 3: 논리적 불일치
INSERT INTO `student_solutions` (`student_id`, `problem_id`, `session_token`, `started_at`, `submitted_at`, `total_time_seconds`, `final_answer`, `is_correct`, `score`, `status`) VALUES
(4, @problem2_id, 'session_004_inconsistent', '2025-11-18 13:00:00', '2025-11-18 13:05:00', 300, '{"numerator": 7, "denominator": 10}', 1, 70.00, 'submitted');

SET @solution4_id = LAST_INSERT_ID();

INSERT INTO `step_submissions` (`solution_id`, `step_id`, `attempt_number`, `student_input`, `is_correct`, `time_spent_seconds`, `hint_used`, `submitted_at`) VALUES
(@solution4_id, 6, 1, '{"denominator1": 5, "denominator2": 10}', 1, 40, 0, '2025-11-18 13:00:40'),
(@solution4_id, 7, 1, '{"lcm": 15}', 0, 70, 0, '2025-11-18 13:01:50'),  -- 잘못된 최소공배수
(@solution4_id, 8, 1, '{"fraction1": "4/10", "fraction2": "3/10"}', 1, 80, 0, '2025-11-18 13:03:10'),  -- 그런데 통분은 정확함 (불일치)
(@solution4_id, 9, 1, '{"result": "7/10"}', 1, 60, 0, '2025-11-18 13:04:10'),
(@solution4_id, 10, 1, '{"final": "7/10"}', 1, 50, 0, '2025-11-18 13:05:00');

INSERT INTO `skip_detections` (`solution_id`, `detection_type`, `severity`, `confidence_score`, `description`, `affected_steps`, `evidence_data`) VALUES
(@solution4_id, 'logical_inconsistency', 'high', 88.00, '2단계에서 잘못된 최소공배수(15)를 입력했으나, 3단계 통분에서는 올바른 공배수(10)를 사용. 논리적 연결 불일치.', '[7, 8]', '{"step_2_output": 15, "step_3_expected_input": 15, "step_3_actual_input": 10, "inconsistency": true}');

-- ============================================
-- 6. 신뢰도 프로필 초기화
-- ============================================

INSERT INTO `student_trust_profiles` (`student_id`, `overall_trust_score`, `total_solutions`, `suspicious_solutions`, `time_anomaly_count`, `logical_inconsistency_count`, `hint_dependency_count`) VALUES
(1, 100.00, 1, 0, 0, 0, 0),
(2, 85.00, 1, 1, 1, 0, 0),
(3, 78.00, 1, 1, 0, 0, 1),
(4, 75.00, 1, 1, 0, 1, 0),
(5, 100.00, 0, 0, 0, 0, 0);

-- ============================================
-- 7. 문제별 통계 초기화
-- ============================================

INSERT INTO `problem_statistics` (`problem_id`, `total_attempts`, `correct_attempts`, `avg_time_seconds`, `avg_score`, `skip_detection_rate`) VALUES
(@problem1_id, 3, 3, 280.00, 78.33, 66.67),
(@problem2_id, 1, 1, 300.00, 70.00, 100.00),
(@problem3_id, 0, 0, NULL, NULL, NULL);

SELECT 'Sample data inserted successfully!' AS message;
SELECT CONCAT('Total students: ', COUNT(*)) AS info FROM students;
SELECT CONCAT('Total problems: ', COUNT(*)) AS info FROM problems;
SELECT CONCAT('Total solutions: ', COUNT(*)) AS info FROM student_solutions;
SELECT CONCAT('Total detections: ', COUNT(*)) AS info FROM skip_detections;
