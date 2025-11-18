-- Sample Data for Magnitude Wave Visualizer
-- MySQL 5.7 호환

USE magnitude_wave_db;

-- 샘플 사용자 추가
INSERT INTO users (username, email, full_name) VALUES
('demo_student', 'student@example.com', '데모 학생'),
('test_user', 'test@example.com', '테스트 사용자'),
('john_doe', 'john@example.com', 'John Doe');

-- 샘플 문제 추가
INSERT INTO problems (title, description, question_text, vector_data, hints, difficulty, correct_magnitude) VALUES
(
    '기본 2차원 벡터',
    '2차원 평면에서 벡터의 크기를 계산하는 기본 문제입니다.',
    '벡터 v = (3, 4)의 크기를 계산하세요. 벡터의 크기는 원점에서 벡터의 끝점까지의 거리를 의미합니다.',
    '[{"x": 3, "y": 4, "z": 0}]',
    '벡터의 크기는 피타고라스 정리를 사용합니다: √(x² + y²). 이 경우 √(9 + 16) = √25 = 5입니다.',
    'easy',
    5.0000
),
(
    '3차원 벡터 문제',
    '3차원 공간에서 벡터의 크기를 구하는 문제입니다.',
    '3차원 공간의 벡터 w = (2, 3, 6)의 크기를 계산하세요.',
    '[{"x": 2, "y": 3, "z": 6}]',
    '3차원 벡터의 크기는 √(x² + y² + z²)입니다. √(4 + 9 + 36) = √49 = 7',
    'medium',
    7.0000
),
(
    '5-12-13 삼각형',
    '유명한 피타고라스 수를 사용한 문제입니다.',
    '벡터 u = (5, 12)의 크기를 구하세요. 이것은 특별한 피타고라스 수 중 하나입니다.',
    '[{"x": 5, "y": 12, "z": 0}]',
    '5-12-13은 유명한 피타고라스 수입니다. 직접 계산해보세요!',
    'easy',
    13.0000
),
(
    '단위 벡터 근처',
    '크기가 1에 가까운 벡터를 다루는 문제입니다.',
    '벡터 a = (0.6, 0.8)의 크기를 계산하세요. 소수점을 포함한 계산에 주의하세요.',
    '[{"x": 0.6, "y": 0.8, "z": 0}]',
    '이것은 3-4-5 삼각형을 0.2배 축소한 것입니다. 크기는 1입니다.',
    'easy',
    1.0000
),
(
    '복잡한 3차원 벡터',
    '소수점이 포함된 3차원 벡터 문제입니다.',
    '벡터 b = (1.5, 2.5, 3.5)의 크기를 구하세요.',
    '[{"x": 1.5, "y": 2.5, "z": 3.5}]',
    '각 성분을 제곱하고 더한 후 제곱근을 구하세요. √(2.25 + 6.25 + 12.25) = √20.75',
    'medium',
    4.5552
),
(
    '음수 성분이 있는 벡터',
    '음수 성분이 포함된 벡터의 크기를 구합니다.',
    '벡터 c = (-3, 4, -12)의 크기를 계산하세요. 음수도 제곱하면 양수가 됩니다.',
    '[{"x": -3, "y": 4, "z": -12}]',
    '음수를 제곱하면 양수가 됩니다. √(9 + 16 + 144) = √169 = 13',
    'medium',
    13.0000
),
(
    '큰 값을 가진 벡터',
    '큰 값을 가진 벡터의 크기를 계산합니다.',
    '벡터 d = (20, 21, 29)의 크기를 구하세요.',
    '[{"x": 20, "y": 21, "z": 29}]',
    '큰 수의 제곱을 계산할 때 주의하세요. 계산기를 사용해도 좋습니다.',
    'hard',
    39.2938
),
(
    '영벡터 근처',
    '0에 가까운 작은 벡터입니다.',
    '벡터 e = (0.1, 0.1, 0.1)의 크기를 계산하세요.',
    '[{"x": 0.1, "y": 0.1, "z": 0.1}]',
    '작은 값도 정확히 계산하세요. √(0.01 + 0.01 + 0.01) = √0.03',
    'easy',
    0.1732
),
(
    '대각선 벡터',
    '모든 성분이 같은 벡터입니다.',
    '벡터 f = (1, 1, 1)의 크기를 구하세요. 공간 대각선의 길이를 구하는 것과 같습니다.',
    '[{"x": 1, "y": 1, "z": 1}]',
    '√3은 무리수입니다. 약 1.732...',
    'easy',
    1.7321
),
(
    '도전! 복잡한 계산',
    '여러 소수 자리를 가진 복잡한 벡터입니다.',
    '벡터 g = (3.14, 2.71, 1.41)의 크기를 계산하세요.',
    '[{"x": 3.14, "y": 2.71, "z": 1.41}]',
    '각 값을 정확히 제곱하고 계산하세요. 계산기를 사용하는 것을 추천합니다.',
    'hard',
    4.4441
);

-- 샘플 제출 기록
INSERT INTO submissions (problem_id, user_id, magnitude_answer, vector_data, is_correct, score, attempt_number, time_spent, submitted_at) VALUES
(1, 1, 5.0000, '{"x": 3, "y": 4, "z": 0}', 1, 100.00, 1, 45, '2025-01-15 10:30:00'),
(2, 1, 7.0000, '{"x": 2, "y": 3, "z": 6}', 1, 100.00, 1, 62, '2025-01-15 10:35:00'),
(3, 1, 12.5000, '{"x": 5, "y": 12, "z": 0}', 0, 0.00, 1, 38, '2025-01-15 10:40:00'),
(3, 1, 13.0000, '{"x": 5, "y": 12, "z": 0}', 1, 100.00, 2, 25, '2025-01-15 10:42:00'),
(1, 2, 5.0000, '{"x": 3, "y": 4, "z": 0}', 1, 100.00, 1, 30, '2025-01-15 11:00:00'),
(4, 2, 1.0000, '{"x": 0.6, "y": 0.8, "z": 0}', 1, 100.00, 1, 55, '2025-01-15 11:05:00');

-- 샘플 학습 분석 데이터
INSERT INTO learning_analytics (user_id, problem_id, session_id, event_type, event_data) VALUES
(1, 1, 'session_001', 'start', '{"timestamp": "2025-01-15T10:29:30Z"}'),
(1, 1, 'session_001', 'calculate', '{"magnitude": 5.0, "vector": {"x": 3, "y": 4, "z": 0}}'),
(1, 1, 'session_001', 'submit', '{"magnitude": 5.0, "is_correct": true}'),
(1, 2, 'session_002', 'start', '{"timestamp": "2025-01-15T10:34:00Z"}'),
(1, 2, 'session_002', 'hint_view', '{"hint_number": 1}'),
(1, 2, 'session_002', 'calculate', '{"magnitude": 7.0, "vector": {"x": 2, "y": 3, "z": 6}}'),
(1, 2, 'session_002', 'submit', '{"magnitude": 7.0, "is_correct": true}');

-- 샘플 파동 설정
INSERT INTO wave_settings (user_id, wave_speed, wave_frequency, color_scheme) VALUES
(1, 5, 2.0, 'default'),
(2, 7, 3.0, 'dark'),
(3, 4, 1.5, 'blue');

-- 시스템 로그 샘플
INSERT INTO system_logs (log_level, message, context, user_id, ip_address) VALUES
('info', 'User logged in', '{"action": "login", "method": "demo"}', 1, '127.0.0.1'),
('info', 'Problem loaded', '{"problem_id": 1}', 1, '127.0.0.1'),
('debug', 'Wave visualization rendered', '{"magnitude": 5.0, "fps": 60}', 1, '127.0.0.1'),
('info', 'Answer submitted', '{"problem_id": 1, "is_correct": true}', 1, '127.0.0.1');
