-- Seed Data: Sample Confusion-Prone Concept Pairs
-- Description: Initial set of common concept pairs for Korean math education
-- Created: 2025-11-18

-- Sample 1: Maximum/Minimum vs Absolute Value
INSERT INTO concept_pairs (
  concept_a, concept_a_kr, concept_a_description,
  concept_b, concept_b_kr, concept_b_description,
  category, grade_level_min, grade_level_max,
  confusion_reason, confusion_reason_kr,
  warning_message, warning_message_kr,
  severity,
  example_a, example_b,
  differentiation_tip, differentiation_tip_kr
) VALUES (
  'Maximum/Minimum', '최댓값/최솟값', 'The largest or smallest value in a set of numbers',
  'Absolute Value', '절댓값', 'The distance of a number from zero, always non-negative',
  'operations',
  4, 8,
  'Students often confuse finding max/min with calculating absolute value because both involve comparing number magnitudes',
  '학생들은 최댓값/최솟값 찾기와 절댓값 계산을 혼동하는 경우가 많습니다. 둘 다 숫자의 크기를 비교하기 때문입니다.',
  'Be careful! Maximum/Minimum finds the largest/smallest number in a set, while Absolute Value measures distance from zero.',
  '주의하세요! 최댓값/최솟값은 집합에서 가장 큰/작은 수를 찾는 것이고, 절댓값은 0으로부터의 거리를 측정하는 것입니다.',
  'high',
  'Max of {-5, 3, 7} = 7; Min = -5',
  '|-5| = 5, |3| = 3, |7| = 7',
  'Maximum/Minimum compares numbers; Absolute Value removes the sign',
  '최댓값/최솟값은 수들을 비교하고, 절댓값은 부호를 제거합니다'
);

-- Sample 2: Perimeter vs Area
INSERT INTO concept_pairs (
  concept_a, concept_a_kr, concept_a_description,
  concept_b, concept_b_kr, concept_b_description,
  category, grade_level_min, grade_level_max,
  confusion_reason, confusion_reason_kr,
  warning_message, warning_message_kr,
  severity,
  example_a, example_b,
  differentiation_tip, differentiation_tip_kr
) VALUES (
  'Perimeter', '둘레', 'The total distance around the outside of a shape',
  'Area', '넓이', 'The amount of space inside a shape',
  'properties',
  3, 6,
  'Students mix up perimeter and area because both measure aspects of 2D shapes',
  '학생들은 둘레와 넓이를 혼동합니다. 둘 다 2차원 도형을 측정하기 때문입니다.',
  'Remember: Perimeter is the border length (measured in units), Area is the space inside (measured in square units).',
  '기억하세요: 둘레는 테두리의 길이(단위)이고, 넓이는 안쪽 공간(제곱단위)입니다.',
  'medium',
  'Rectangle 4×3: Perimeter = 2(4+3) = 14 units',
  'Rectangle 4×3: Area = 4×3 = 12 square units',
  'Perimeter adds all sides; Area multiplies dimensions',
  '둘레는 모든 변을 더하고, 넓이는 차원을 곱합니다'
);

-- Sample 3: Mean vs Median
INSERT INTO concept_pairs (
  concept_a, concept_a_kr, concept_a_description,
  concept_b, concept_b_kr, concept_b_description,
  category, grade_level_min, grade_level_max,
  confusion_reason, confusion_reason_kr,
  warning_message, warning_message_kr,
  severity,
  example_a, example_b,
  differentiation_tip, differentiation_tip_kr
) VALUES (
  'Mean (Average)', '평균', 'Sum of all values divided by the count',
  'Median', '중앙값', 'The middle value when numbers are sorted',
  'operations',
  5, 9,
  'Both are measures of central tendency but calculated differently',
  '둘 다 중심 경향의 척도이지만 계산 방법이 다릅니다.',
  'Mean is the average (sum÷count), Median is the middle value when sorted. They can be very different!',
  '평균은 총합을 개수로 나눈 것이고, 중앙값은 정렬했을 때 가운데 값입니다. 둘은 매우 다를 수 있습니다!',
  'medium',
  'Data {1,2,3,4,100}: Mean = 110/5 = 22',
  'Data {1,2,3,4,100}: Median = 3 (middle value)',
  'Mean uses all values; Median is position-based',
  '평균은 모든 값을 사용하고, 중앙값은 위치 기반입니다'
);

-- Sample 4: Prime vs Composite Numbers
INSERT INTO concept_pairs (
  concept_a, concept_a_kr, concept_a_description,
  concept_b, concept_b_kr, concept_b_description,
  category, grade_level_min, grade_level_max,
  confusion_reason, confusion_reason_kr,
  warning_message, warning_message_kr,
  severity,
  example_a, example_b,
  differentiation_tip, differentiation_tip_kr
) VALUES (
  'Prime Number', '소수', 'A number greater than 1 with exactly two factors: 1 and itself',
  'Composite Number', '합성수', 'A number with more than two factors',
  'properties',
  4, 7,
  'Students confuse which numbers belong to each category',
  '학생들은 어떤 수가 어느 범주에 속하는지 혼동합니다.',
  'Check the factors! Prime has only 2 factors (1 and itself), Composite has 3 or more.',
  '약수를 확인하세요! 소수는 2개만(1과 자기자신), 합성수는 3개 이상입니다.',
  'low',
  'Prime: 2, 3, 5, 7, 11, 13...',
  'Composite: 4, 6, 8, 9, 10, 12...',
  'Count the factors - that tells you which it is',
  '약수의 개수를 세면 어느 것인지 알 수 있습니다'
);

-- Sample 5: Fraction Multiplication vs Addition
INSERT INTO concept_pairs (
  concept_a, concept_a_kr, concept_a_description,
  concept_b, concept_b_kr, concept_b_description,
  category, grade_level_min, grade_level_max,
  confusion_reason, confusion_reason_kr,
  warning_message, warning_message_kr,
  severity,
  example_a, example_b,
  differentiation_tip, differentiation_tip_kr
) VALUES (
  'Multiplying Fractions', '분수 곱셈', 'Multiply numerators and denominators directly',
  'Adding Fractions', '분수 덧셈', 'Requires common denominator first',
  'operations',
  4, 7,
  'Students often multiply when they should add, or vice versa, especially when fractions look similar',
  '학생들은 분수가 비슷해 보일 때 곱해야 할 때 더하거나 그 반대로 하는 경우가 많습니다.',
  'Different operations! Multiply = numerator×numerator, denominator×denominator. Add = find common denominator first!',
  '다른 연산입니다! 곱셈 = 분자×분자, 분모×분모. 덧셈 = 먼저 공통분모를 찾으세요!',
  'high',
  '1/2 × 2/3 = (1×2)/(2×3) = 2/6 = 1/3',
  '1/2 + 2/3 = 3/6 + 4/6 = 7/6',
  'Multiplication is direct; Addition needs common denominator',
  '곱셈은 바로 하고, 덧셈은 공통분모가 필요합니다'
);

-- Create triggers for these concept pairs

-- Trigger 1: Detect max/min keywords appearing with absolute value keywords
INSERT INTO concept_pair_triggers (
  concept_pair_id,
  trigger_type,
  trigger_pattern,
  trigger_context,
  min_occurrences,
  time_window_minutes
) VALUES (
  (SELECT id FROM concept_pairs WHERE concept_a = 'Maximum/Minimum'),
  'keyword',
  '(최댓값|최솟값|maximum|minimum|max|min).*(절댓값|absolute|abs)',
  '{"keywords": ["최댓값", "최솟값", "절댓값", "maximum", "minimum", "absolute"]}',
  1,
  30
);

-- Trigger 2: Detect perimeter/area confusion
INSERT INTO concept_pair_triggers (
  concept_pair_id,
  trigger_type,
  trigger_pattern,
  trigger_context,
  min_occurrences,
  time_window_minutes
) VALUES (
  (SELECT id FROM concept_pairs WHERE concept_a = 'Perimeter'),
  'keyword',
  '(둘레|perimeter).*(넓이|면적|area)',
  '{"keywords": ["둘레", "넓이", "면적", "perimeter", "area"]}',
  1,
  30
);

-- Trigger 3: Detect mean/median confusion
INSERT INTO concept_pair_triggers (
  concept_pair_id,
  trigger_type,
  trigger_pattern,
  trigger_context,
  min_occurrences,
  time_window_minutes
) VALUES (
  (SELECT id FROM concept_pairs WHERE concept_a = 'Mean (Average)'),
  'keyword',
  '(평균|mean|average).*(중앙값|중간값|median)',
  '{"keywords": ["평균", "중앙값", "mean", "median", "average"]}',
  1,
  30
);

-- Add more sophisticated pattern-based triggers
INSERT INTO concept_pair_triggers (
  concept_pair_id,
  trigger_type,
  trigger_pattern,
  trigger_context,
  min_occurrences,
  time_window_minutes
) VALUES (
  (SELECT id FROM concept_pairs WHERE concept_a = 'Multiplying Fractions'),
  'pattern',
  'fraction_operation_confusion',
  '{"detect": "student_adds_numerators_and_denominators_in_multiplication"}',
  2,
  20
);

COMMIT;
