-- Visual Quadratic - Sample Data
-- This file contains sample problems and test students

-- Insert sample students
INSERT INTO students (id, name, email, grade_level) VALUES
    ('11111111-1111-1111-1111-111111111111', '김민수', 'minsu@example.com', '중1'),
    ('22222222-2222-2222-2222-222222222222', '이서연', 'seoyeon@example.com', '중2'),
    ('33333333-3333-3333-3333-333333333333', '박지호', 'jiho@example.com', '중1'),
    ('44444444-4444-4444-4444-444444444444', 'Test Student', 'test@example.com', '중1');

-- Insert sample problems

-- Level 1: Basic parabolas (simple coefficients)
INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints) VALUES
    (
        '기본 포물선 1: y = x²',
        'a=1, b=0, c=0인 가장 기본적인 포물선을 만들어보세요.',
        1, 0, 0, 1,
        '["a는 포물선의 모양을 결정합니다", "b와 c를 0으로 설정해보세요"]'::jsonb
    ),
    (
        '위로 이동: y = x² + 2',
        '기본 포물선을 위로 2만큼 이동시켜보세요.',
        1, 0, 2, 1,
        '["c 값이 y축과의 교점입니다", "c를 2로 설정하세요"]'::jsonb
    ),
    (
        '아래로 이동: y = x² - 3',
        '기본 포물선을 아래로 3만큼 이동시켜보세요.',
        1, 0, -3, 1,
        '["c를 음수로 설정하면 아래로 이동합니다", "c를 -3으로 설정하세요"]'::jsonb
    );

-- Level 2: Simple roots
INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints) VALUES
    (
        '두 근 찾기: y = x² - 4',
        'x = -2와 x = 2에서 x축과 만나는 포물선을 만드세요.',
        1, 0, -4, 2,
        '["(x-2)(x+2) = x² - 4입니다", "c = -4로 설정하세요", "근은 ±2입니다"]'::jsonb
    ),
    (
        '인수분해: y = x² - 3x + 2',
        'x = 1과 x = 2에서 x축과 만나는 포물선입니다.',
        1, -3, 2, 2,
        '["(x-1)(x-2)를 전개하세요", "a=1, b=-3, c=2입니다"]'::jsonb
    ),
    (
        'x축에 접하는 포물선: y = x² - 4x + 4',
        'x = 2에서 x축에 접하는 포물선 (중근)을 만드세요.',
        1, -4, 4, 2,
        '["(x-2)² = x² - 4x + 4입니다", "판별식 b²-4ac = 0이어야 합니다"]'::jsonb
    );

-- Level 3: Negative a (upside down)
INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints) VALUES
    (
        '아래로 볼록: y = -x²',
        'a가 음수인 포물선은 아래로 볼록합니다.',
        -1, 0, 0, 3,
        '["a를 음수로 설정하세요", "a = -1로 설정하세요"]'::jsonb
    ),
    (
        '역포물선: y = -x² + 2x + 3',
        '아래로 볼록한 포물선으로 두 근을 만들어보세요.',
        -1, 2, 3, 3,
        '["a = -1입니다", "-(x+1)(x-3)를 전개하세요"]'::jsonb
    );

-- Level 4: Complex coefficients
INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints) VALUES
    (
        '좁은 포물선: y = 2x² - 8',
        'a가 1보다 크면 포물선이 더 좁아집니다.',
        2, 0, -8, 4,
        '["a = 2로 설정하세요", "c = -8로 설정하세요", "근은 ±2입니다"]'::jsonb
    ),
    (
        '넓은 포물선: y = 0.5x² + x - 3',
        'a가 1보다 작으면 포물선이 더 넓어집니다.',
        0.5, 1, -3, 4,
        '["a = 0.5로 설정하세요", "b = 1, c = -3입니다"]'::jsonb
    ),
    (
        '복잡한 계수: y = 1.5x² - 4.5x + 3',
        '소수점이 있는 복잡한 계수를 가진 포물선입니다.',
        1.5, -4.5, 3, 4,
        '["a = 1.5입니다", "b = -4.5, c = 3입니다", "근은 x = 1, x = 2입니다"]'::jsonb
    );

-- Level 5: Advanced challenges
INSERT INTO problems (title, description, target_a, target_b, target_c, difficulty, hints) VALUES
    (
        '허근 포물선: y = x² + x + 1',
        'x축과 만나지 않는 포물선 (판별식 < 0)을 만드세요.',
        1, 1, 1, 5,
        '["판별식 b²-4ac < 0이어야 합니다", "b² = 1, 4ac = 4이므로 판별식 = -3 < 0"]'::jsonb
    ),
    (
        '정확한 근: y = 2x² - 5x + 2',
        '정확한 계수를 맞춰야 하는 어려운 문제입니다.',
        2, -5, 2, 5,
        '["a = 2입니다", "근은 x = 0.5, x = 2입니다", "(2x-1)(x-2)를 전개하세요"]'::jsonb
    ),
    (
        '도전 과제: y = -2.5x² + 7.5x - 4',
        '복잡한 계수와 음의 a를 가진 최고 난이도 문제입니다.',
        -2.5, 7.5, -4, 5,
        '["a = -2.5 (아래로 볼록)", "b = 7.5, c = -4", "꼭짓점을 먼저 찾아보세요"]'::jsonb
    );

-- Insert some sample progress
INSERT INTO student_progress (student_id, problem_id, attempts, completed, time_spent_seconds, best_score)
SELECT
    '11111111-1111-1111-1111-111111111111',
    id,
    5,
    true,
    180,
    98.5
FROM problems
WHERE title = '기본 포물선 1: y = x²';

INSERT INTO student_progress (student_id, problem_id, attempts, completed, time_spent_seconds, best_score)
SELECT
    '11111111-1111-1111-1111-111111111111',
    id,
    3,
    false,
    120,
    75.0
FROM problems
WHERE title = '두 근 찾기: y = x² - 4';

ANALYZE students;
ANALYZE problems;
ANALYZE student_progress;
ANALYZE attempts;
