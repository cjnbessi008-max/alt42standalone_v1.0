-- Area Walk Sample Data
-- 테스트 및 개발용 샘플 데이터

USE area_walk;

-- ============================================================================
-- 1. 함수 라이브러리 샘플 데이터
-- ============================================================================

INSERT INTO area_walk_functions (name, expression, latex_notation, difficulty_level, category, visualization_color, is_active) VALUES
-- 다항 함수 (Polynomial)
('상수함수', '2', 'f(x) = 2', 'easy', 'polynomial', '#27ae60', 1),
('일차함수', 'x', 'f(x) = x', 'easy', 'polynomial', '#3498db', 1),
('일차함수 (기울기 2)', '2*x', 'f(x) = 2x', 'easy', 'polynomial', '#2980b9', 1),
('이차함수', 'x^2', 'f(x) = x^2', 'medium', 'polynomial', '#9b59b6', 1),
('이차함수 (계수)', '0.5*x^2', 'f(x) = \\frac{1}{2}x^2', 'medium', 'polynomial', '#8e44ad', 1),
('삼차함수', 'x^3', 'f(x) = x^3', 'hard', 'polynomial', '#e74c3c', 1),
('역이차함수', '-x^2 + 4', 'f(x) = -x^2 + 4', 'medium', 'polynomial', '#c0392b', 1),

-- 삼각 함수 (Trigonometric)
('사인함수', 'sin(x)', 'f(x) = \\sin(x)', 'medium', 'trigonometric', '#f39c12', 1),
('코사인함수', 'cos(x)', 'f(x) = \\cos(x)', 'medium', 'trigonometric', '#f39c12', 1),
('사인 스케일', '2*sin(x)', 'f(x) = 2\\sin(x)', 'hard', 'trigonometric', '#d68910', 1),

-- 지수 및 로그 함수 (Exponential & Logarithmic)
('지수함수', 'exp(x)', 'f(x) = e^x', 'hard', 'exponential', '#16a085', 1),
('로그함수', 'log(x)', 'f(x) = \\ln(x)', 'hard', 'logarithmic', '#1abc9c', 1),

-- 유리 함수 (Rational)
('역함수', '1/x', 'f(x) = \\frac{1}{x}', 'hard', 'rational', '#34495e', 1),
('역제곱함수', '1/(x^2)', 'f(x) = \\frac{1}{x^2}', 'hard', 'rational', '#2c3e50', 1);

-- ============================================================================
-- 2. 문제 샘플 데이터
-- ============================================================================

INSERT INTO area_walk_problems (
    moodle_question_id, title, description, function_id, function_expr,
    lower_bound, upper_bound, correct_answer, tolerance,
    difficulty_level, character_sprite, background_image,
    graph_color, area_color,
    hint_1, hint_2, hint_3,
    success_message, failure_message,
    max_attempts, time_limit_seconds, is_active, created_by
) VALUES

-- Easy 문제 (상수함수, 일차함수)
(1001, '상수함수의 적분', '상수함수 f(x) = 2의 0부터 3까지의 정적분을 구하세요.',
 1, '2', 0, 3, 6.0000, 0.01, 'easy',
 'character_boy.png', 'bg_green.png', '#27ae60', 'rgba(39, 174, 96, 0.3)',
 '상수함수의 적분은 높이 × 너비입니다.', '적분 = 2 × 3 = ?', '직사각형의 넓이를 구하세요.',
 '정답입니다! 상수함수의 적분은 직사각형 넓이와 같습니다.', '다시 생각해보세요. 직사각형의 넓이는 가로 × 세로입니다.',
 0, 0, 1, 101),

(1002, '일차함수의 적분', '일차함수 f(x) = x의 0부터 2까지의 정적분을 구하세요.',
 2, 'x', 0, 2, 2.0000, 0.01, 'easy',
 'character_boy.png', 'bg_blue.png', '#3498db', 'rgba(52, 152, 219, 0.3)',
 '일차함수의 그래프는 직선입니다.', '삼각형의 넓이 공식을 생각해보세요.', '넓이 = (밑변 × 높이) / 2',
 '정답입니다! 일차함수의 적분은 삼각형 넓이와 같습니다.', '힌트를 참고하여 다시 계산해보세요.',
 0, 0, 1, 101),

(1003, '일차함수의 적분 (기울기 2)', '함수 f(x) = 2x의 0부터 3까지의 정적분을 구하세요.',
 3, '2*x', 0, 3, 9.0000, 0.01, 'easy',
 'character_girl.png', 'bg_blue.png', '#2980b9', 'rgba(41, 128, 185, 0.3)',
 '기울기가 2인 직선입니다.', 'x=3일 때 y=6입니다.', '삼각형 넓이 = (3 × 6) / 2',
 '훌륭합니다! 기울기가 다른 일차함수도 이해했습니다.', '밑변과 높이를 확인해보세요.',
 0, 0, 1, 101),

-- Medium 문제 (이차함수)
(1004, '이차함수의 적분 (기본)', '이차함수 f(x) = x²의 0부터 2까지의 정적분을 구하세요.',
 4, 'x^2', 0, 2, 2.6667, 0.01, 'medium',
 'character_boy.png', 'bg_purple.png', '#9b59b6', 'rgba(155, 89, 182, 0.3)',
 '∫x²dx = x³/3 + C', '정적분은 [x³/3] (0부터 2까지)', '2³/3 - 0³/3 = 8/3 ≈ 2.667',
 '완벽합니다! 이차함수의 적분을 정확히 계산했습니다.', '적분 공식을 다시 확인해보세요.',
 3, 300, 1, 101),

(1005, '이차함수의 적분 (계수)', '함수 f(x) = 0.5x²의 0부터 4까지의 정적분을 구하세요.',
 5, '0.5*x^2', 0, 4, 10.6667, 0.01, 'medium',
 'character_girl.png', 'bg_purple.png', '#8e44ad', 'rgba(142, 68, 173, 0.3)',
 '계수를 먼저 빼내세요: 0.5 ∫x²dx', '∫x²dx = x³/3', '0.5 × [4³/3 - 0] = 0.5 × 64/3',
 '정답입니다! 계수가 있는 이차함수도 잘 계산했습니다.', '계수를 고려하여 다시 계산해보세요.',
 3, 300, 1, 101),

(1006, '이차함수의 적분 (음수 계수)', '함수 f(x) = -x² + 4의 0부터 2까지의 정적분을 구하세요.',
 7, '-x^2 + 4', 0, 2, 5.3333, 0.01, 'medium',
 'character_boy.png', 'bg_red.png', '#c0392b', 'rgba(192, 57, 43, 0.3)',
 '두 함수의 적분을 따로 계산하세요.', '∫(-x² + 4)dx = -x³/3 + 4x + C', '[-2³/3 + 4×2] - [0] = -8/3 + 8',
 '훌륭합니다! 음수 계수도 정확히 처리했습니다.', '각 항을 따로 적분해보세요.',
 3, 300, 1, 101),

-- Hard 문제 (삼차함수, 삼각함수)
(1007, '삼차함수의 적분', '삼차함수 f(x) = x³의 0부터 2까지의 정적분을 구하세요.',
 6, 'x^3', 0, 2, 4.0000, 0.01, 'hard',
 'character_boy.png', 'bg_red.png', '#e74c3c', 'rgba(231, 76, 60, 0.3)',
 '∫x³dx = x⁴/4 + C', '정적분: [x⁴/4] (0부터 2까지)', '2⁴/4 - 0 = 16/4 = 4',
 '대단합니다! 삼차함수의 적분을 완벽히 이해했습니다.', '적분 후 거듭제곱이 4가 됩니다.',
 5, 600, 1, 101),

(1008, '사인함수의 적분', '사인함수 f(x) = sin(x)의 0부터 π까지의 정적분을 구하세요.',
 8, 'sin(x)', 0, 3.1416, 2.0000, 0.01, 'hard',
 'character_girl.png', 'bg_orange.png', '#f39c12', 'rgba(243, 156, 18, 0.3)',
 '∫sin(x)dx = -cos(x) + C', '정적분: [-cos(x)] (0부터 π까지)', '-cos(π) - (-cos(0)) = 1 - (-1) = 2',
 '완벽합니다! 삼각함수 적분의 달인이시네요!', '삼각함수의 적분 공식을 확인하세요.',
 5, 600, 1, 101),

-- 도전 문제
(1009, '지수함수의 적분', '지수함수 f(x) = eˣ의 0부터 1까지의 정적분을 구하세요.',
 11, 'exp(x)', 0, 1, 1.7183, 0.01, 'hard',
 'character_boy.png', 'bg_teal.png', '#16a085', 'rgba(22, 160, 133, 0.3)',
 '∫eˣdx = eˣ + C', '정적분: [eˣ] (0부터 1까지)', 'e¹ - e⁰ = e - 1 ≈ 1.718',
 '놀랍습니다! 지수함수의 특별한 성질을 이해했습니다.', 'e ≈ 2.718입니다.',
 5, 600, 1, 101),

(1010, '복합 문제: 이차+일차', '함수 f(x) = x² + 2x의 0부터 3까지의 정적분을 구하세요.',
 NULL, 'x^2 + 2*x', 0, 3, 18.0000, 0.01, 'hard',
 'character_girl.png', 'bg_mixed.png', '#34495e', 'rgba(52, 73, 94, 0.3)',
 '각 항을 따로 적분하세요.', '∫(x² + 2x)dx = x³/3 + x² + C', '[3³/3 + 3²] - 0 = 9 + 9 = 18',
 '천재입니다! 복합 함수의 적분도 완벽합니다!', '선형성을 활용하세요: ∫(f+g) = ∫f + ∫g',
 5, 600, 1, 101);

-- ============================================================================
-- 3. 학생 시도 샘플 데이터 (테스트용)
-- ============================================================================

-- 학생 ID는 Moodle의 실제 사용자 ID를 사용해야 하지만, 여기서는 예시로 201, 202, 203 사용

-- 학생 201: 우수 학생 (대부분 정답)
INSERT INTO area_walk_attempts (problem_id, user_id, user_answer, is_correct, error_percentage, score, attempt_number, time_spent_seconds, hint_used, hints_viewed, session_data, attempted_at) VALUES
(1, 201, 6.0000, 1, 0.00, 100.00, 1, 45, 0, NULL, '{"interactions": 3, "replays": 1, "calculation_method": "mental"}', '2024-11-01 10:15:00'),
(2, 201, 2.0000, 1, 0.00, 100.00, 1, 60, 0, NULL, '{"interactions": 5, "replays": 2, "calculation_method": "formula"}', '2024-11-01 10:20:00'),
(3, 201, 9.0000, 1, 0.00, 100.00, 1, 70, 0, NULL, '{"interactions": 4, "replays": 1, "calculation_method": "formula"}', '2024-11-01 10:30:00'),
(4, 201, 2.6667, 1, 0.00, 100.00, 1, 120, 1, '["hint_1"]', '{"interactions": 8, "replays": 3, "calculation_method": "numerical"}', '2024-11-01 10:45:00'),
(5, 201, 10.6667, 1, 0.00, 100.00, 1, 150, 0, NULL, '{"interactions": 6, "replays": 2, "calculation_method": "formula"}', '2024-11-01 11:00:00');

-- 학생 202: 평균 학생 (일부 오답)
INSERT INTO area_walk_attempts (problem_id, user_id, user_answer, is_correct, error_percentage, score, attempt_number, time_spent_seconds, hint_used, hints_viewed, session_data, attempted_at) VALUES
(1, 202, 5.5000, 0, 8.33, 50.00, 1, 90, 1, '["hint_1", "hint_2"]', '{"interactions": 7, "replays": 4, "calculation_method": "guess"}', '2024-11-02 09:00:00'),
(1, 202, 6.0000, 1, 0.00, 100.00, 2, 60, 1, '["hint_1", "hint_2", "hint_3"]', '{"interactions": 5, "replays": 2, "calculation_method": "formula"}', '2024-11-02 09:10:00'),
(2, 202, 1.8000, 0, 10.00, 40.00, 1, 120, 1, '["hint_1"]', '{"interactions": 8, "replays": 3, "calculation_method": "guess"}', '2024-11-02 09:30:00'),
(2, 202, 2.0000, 1, 0.00, 100.00, 2, 80, 1, '["hint_1", "hint_2"]', '{"interactions": 6, "replays": 2, "calculation_method": "formula"}', '2024-11-02 09:45:00'),
(4, 202, 2.5000, 0, 6.25, 60.00, 1, 180, 1, '["hint_1", "hint_2"]', '{"interactions": 12, "replays": 5, "calculation_method": "numerical"}', '2024-11-02 10:00:00'),
(4, 202, 2.6667, 1, 0.00, 100.00, 2, 150, 1, '["hint_1", "hint_2", "hint_3"]', '{"interactions": 10, "replays": 4, "calculation_method": "numerical"}', '2024-11-02 10:30:00');

-- 학생 203: 초보 학생 (여러 번 시도)
INSERT INTO area_walk_attempts (problem_id, user_id, user_answer, is_correct, error_percentage, score, attempt_number, time_spent_seconds, hint_used, hints_viewed, session_data, attempted_at) VALUES
(1, 203, 5.0000, 0, 16.67, 30.00, 1, 150, 1, '["hint_1"]', '{"interactions": 10, "replays": 6, "calculation_method": "guess"}', '2024-11-03 14:00:00'),
(1, 203, 7.0000, 0, 16.67, 30.00, 2, 120, 1, '["hint_1", "hint_2"]', '{"interactions": 9, "replays": 5, "calculation_method": "guess"}', '2024-11-03 14:15:00'),
(1, 203, 6.0000, 1, 0.00, 100.00, 3, 90, 1, '["hint_1", "hint_2", "hint_3"]', '{"interactions": 8, "replays": 4, "calculation_method": "formula"}', '2024-11-03 14:30:00'),
(2, 203, 1.5000, 0, 25.00, 20.00, 1, 200, 1, '["hint_1", "hint_2"]', '{"interactions": 15, "replays": 8, "calculation_method": "guess"}', '2024-11-03 15:00:00'),
(2, 203, 2.0000, 1, 0.00, 100.00, 2, 180, 1, '["hint_1", "hint_2", "hint_3"]', '{"interactions": 12, "replays": 6, "calculation_method": "formula"}', '2024-11-03 15:30:00');

-- ============================================================================
-- 4. 진도 샘플 데이터 (자동으로 트리거에 의해 생성되지만, 초기 데이터로 일부 추가)
-- ============================================================================

-- 진도는 트리거에 의해 자동 생성되므로, 여기서는 추가 샘플만 입력
INSERT INTO area_walk_progress (user_id, problem_id, status, completion_percentage, best_score, total_attempts, first_accessed_at, last_accessed_at) VALUES
(201, 6, 'in_progress', 50.00, 80.00, 2, '2024-11-01 12:00:00', '2024-11-01 12:30:00'),
(201, 7, 'not_started', 0.00, 0.00, 0, NULL, NULL),
(202, 3, 'in_progress', 30.00, 50.00, 3, '2024-11-02 11:00:00', '2024-11-02 11:45:00'),
(203, 3, 'not_started', 0.00, 0.00, 0, NULL, NULL);

-- ============================================================================
-- 5. 샘플 데이터 검증 쿼리 (실행하여 확인)
-- ============================================================================

-- 확인 1: 함수 개수
SELECT COUNT(*) AS total_functions FROM area_walk_functions;

-- 확인 2: 문제 개수 (난이도별)
SELECT difficulty_level, COUNT(*) AS count
FROM area_walk_problems
GROUP BY difficulty_level;

-- 확인 3: 학생별 시도 횟수
SELECT user_id, COUNT(*) AS total_attempts, SUM(is_correct) AS correct_attempts
FROM area_walk_attempts
GROUP BY user_id;

-- 확인 4: 문제별 통계 뷰
SELECT * FROM area_walk_problem_stats ORDER BY problem_id;

-- 확인 5: 학생별 통계 뷰
SELECT * FROM area_walk_student_stats ORDER BY user_id;

-- ============================================================================
-- END OF SAMPLE DATA
-- ============================================================================
