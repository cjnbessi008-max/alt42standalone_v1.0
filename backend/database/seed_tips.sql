-- Sample perspective tips for Korean math problem types
-- 한국 수학 문제 유형별 관점 전환 팁 예제 데이터

-- 이차함수 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Visualize the parabola',
    '포물선을 그려보세요',
    'Graph the quadratic function to see the shape of the parabola. Look for the vertex, axis of symmetry, and y-intercept.',
    '이차함수를 그래프로 그려서 포물선의 모양을 확인해보세요. 꼭짓점, 대칭축, y절편을 찾아보세요.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.78
FROM problem_types WHERE name = 'quadratic_functions';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'algebraic',
    'Complete the square',
    '완전제곱식으로 변형하세요',
    'Transform the quadratic function into vertex form y = a(x-h)² + k by completing the square. This will directly give you the vertex (h, k).',
    '이차함수를 완전제곱식 y = a(x-h)² + k 꼴로 변형하세요. 이렇게 하면 꼭짓점 (h, k)를 바로 알 수 있습니다.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.85
FROM problem_types WHERE name = 'quadratic_functions';

-- 평면도형 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Draw and label the diagram',
    '도형을 그리고 정보를 표시하세요',
    'Draw a clear diagram and mark all known lengths, angles, and relationships. Visual representation often reveals hidden patterns.',
    '명확한 도형을 그리고 알고 있는 모든 길이, 각도, 관계를 표시하세요. 시각적 표현은 종종 숨겨진 패턴을 드러냅니다.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.82
FROM problem_types WHERE name = 'plane_geometry';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'geometric',
    'Look for congruent or similar triangles',
    '합동 또는 닮음 관계를 찾아보세요',
    'Many geometry problems can be solved by identifying congruent or similar triangles. Look for parallel lines, equal angles, or proportional sides.',
    '많은 기하 문제는 합동이나 닮음인 삼각형을 찾아서 풀 수 있습니다. 평행선, 같은 각, 또는 비례하는 변을 찾아보세요.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.79
FROM problem_types WHERE name = 'plane_geometry';

-- 입체도형 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Visualize the 3D shape',
    '입체도형을 머릿속으로 그려보세요',
    'Try to visualize or sketch the 3D shape from different angles. Draw the cross-sections to understand its structure better.',
    '입체도형을 여러 각도에서 머릿속으로 그려보거나 스케치해보세요. 단면도를 그려서 구조를 더 잘 이해하세요.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.75
FROM problem_types WHERE name = 'solid_geometry';

-- 삼각함수 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Use the unit circle',
    '단위원을 활용하세요',
    'Draw the unit circle to visualize sine and cosine values. Remember that sin θ is the y-coordinate and cos θ is the x-coordinate on the unit circle.',
    '단위원을 그려서 사인과 코사인 값을 시각화하세요. sin θ는 y좌표, cos θ는 x좌표라는 것을 기억하세요.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.88
FROM problem_types WHERE name = 'trigonometry';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'algebraic',
    'Apply trigonometric identities',
    '삼각함수 항등식을 적용하세요',
    'Use fundamental identities like sin²θ + cos²θ = 1, or angle addition formulas to simplify expressions.',
    'sin²θ + cos²θ = 1 같은 기본 항등식이나 덧셈정리를 사용하여 식을 간단히 하세요.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.83
FROM problem_types WHERE name = 'trigonometry';

-- 확률 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Draw a tree diagram or table',
    '수형도나 표를 그려보세요',
    'Organize all possible outcomes using a tree diagram or a table. This helps ensure you don''t miss any cases.',
    '모든 가능한 경우를 수형도나 표로 정리하세요. 이렇게 하면 빠뜨리는 경우를 방지할 수 있습니다.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.86
FROM problem_types WHERE name = 'probability';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'algebraic',
    'Use counting principles',
    '경우의 수 공식을 활용하세요',
    'Apply multiplication principle for sequential events, or use combinations/permutations formulas when appropriate.',
    '순차적인 사건에는 곱의 법칙을 적용하고, 필요한 경우 조합/순열 공식을 사용하세요.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.81
FROM problem_types WHERE name = 'probability';

-- 미분 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Think about the slope of tangent line',
    '접선의 기울기로 생각하세요',
    'The derivative at a point is the slope of the tangent line to the curve at that point. Visualize how the function is changing.',
    '미분값은 그 점에서 곡선에 그은 접선의 기울기입니다. 함수가 어떻게 변하는지 시각화해보세요.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.84
FROM problem_types WHERE name = 'differential_calculus';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'algebraic',
    'Apply differentiation rules',
    '미분 공식을 적용하세요',
    'Use power rule, product rule, quotient rule, and chain rule systematically. Break complex functions into simpler parts.',
    '거듭제곱, 곱셈, 나눗셈, 합성함수 미분법을 체계적으로 사용하세요. 복잡한 함수는 간단한 부분으로 나누세요.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.87
FROM problem_types WHERE name = 'differential_calculus';

-- 적분 팁
INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    1,
    'visual',
    'Think of area under the curve',
    '곡선 아래의 넓이로 생각하세요',
    'The definite integral represents the area between the function and the x-axis. Sketch the region to understand better.',
    '정적분은 함수와 x축 사이의 넓이를 나타냅니다. 영역을 그려서 더 잘 이해하세요.',
    '{"min_attempts": 1, "max_attempts": 3}',
    0.80
FROM problem_types WHERE name = 'integral_calculus';

INSERT INTO perspective_tips (problem_type_id, tip_level, perspective_type, title, title_ko, content, content_ko, trigger_conditions, effectiveness_score)
SELECT
    id,
    2,
    'algebraic',
    'Find the antiderivative',
    '역도함수를 구하세요',
    'Integration is the reverse of differentiation. Find the antiderivative F(x) where F''(x) = f(x), then evaluate F(b) - F(a).',
    '적분은 미분의 역과정입니다. F''(x) = f(x)인 역도함수 F(x)를 구한 후 F(b) - F(a)를 계산하세요.',
    '{"min_attempts": 2, "max_attempts": 5}',
    0.82
FROM problem_types WHERE name = 'integral_calculus';

-- 통계 업데이트
UPDATE perspective_tips SET usage_count = FLOOR(RANDOM() * 100 + 20);
