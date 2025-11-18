-- Sample Problems for Mathematical Garden
-- These are example problems to get started

USE mathematical_garden;

-- Sample Problem 1: Number Comparison (Easy)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '가장 큰 숫자 찾기',
  '정원에 있는 꽃들을 보고 가장 큰 숫자를 찾아보세요!',
  'number_comparison',
  'easy',
  1,
  '[3, 7, 5, 2, 9]',
  '9',
  '{"object_type": "flower", "layout": "grid", "animation_type": "grow", "show_labels": true}'
);

-- Sample Problem 2: Addition (Easy)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '꽃 더하기',
  '왼쪽 꽃과 오른쪽 꽃을 더하면 얼마일까요?',
  'addition',
  'easy',
  1,
  '[4, 5]',
  '9',
  '{"object_type": "flower", "layout": "linear", "animation_type": "bounce", "show_labels": true}'
);

-- Sample Problem 3: Subtraction (Easy)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '나무에서 빼기',
  '큰 나무에서 작은 나무를 빼면 얼마일까요?',
  'subtraction',
  'easy',
  2,
  '[8, 3]',
  '5',
  '{"object_type": "tree", "layout": "linear", "animation_type": "slide", "show_labels": true}'
);

-- Sample Problem 4: Addition (Medium)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '여러 꽃 더하기',
  '정원의 모든 꽃을 세어보세요!',
  'addition',
  'medium',
  2,
  '[3, 4, 2, 5]',
  '14',
  '{"object_type": "flower", "layout": "circular", "animation_type": "grow", "show_labels": true}'
);

-- Sample Problem 5: Number Comparison (Medium)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '가장 작은 숫자 찾기',
  '관목들 중에서 가장 작은 숫자를 찾아보세요.',
  'number_comparison',
  'medium',
  2,
  '[12, 7, 15, 9, 11]',
  '7',
  '{"object_type": "bush", "layout": "grid", "animation_type": "fade", "show_labels": true}'
);

-- Sample Problem 6: Multiplication (Hard)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '나무 곱하기',
  '나무 한 그룹의 개수와 그룹 수를 곱해보세요.',
  'multiplication',
  'hard',
  3,
  '[4, 3]',
  '12',
  '{"object_type": "tree", "layout": "grid", "animation_type": "grow", "show_labels": true}'
);

-- Sample Problem 7: Pattern (Medium)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '수 패턴 찾기',
  '다음 패턴에서 빈 칸에 들어갈 숫자는?',
  'pattern',
  'medium',
  3,
  '[2, 4, 6, 8]',
  '10',
  '{"object_type": "flower", "layout": "linear", "animation_type": "slide", "show_labels": true}'
);

-- Sample Problem 8: Addition (Hard)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '복잡한 덧셈',
  '정원의 모든 나무를 더해보세요!',
  'addition',
  'hard',
  3,
  '[12, 15, 8, 23, 11]',
  '69',
  '{"object_type": "tree", "layout": "random", "animation_type": "bounce", "show_labels": true}'
);

-- Sample Problem 9: Subtraction (Medium)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '두 자리 수 빼기',
  '큰 수에서 작은 수를 빼보세요.',
  'subtraction',
  'medium',
  2,
  '[25, 13]',
  '12',
  '{"object_type": "bush", "layout": "linear", "animation_type": "grow", "show_labels": true}'
);

-- Sample Problem 10: Division (Hard)
INSERT INTO problems (
  title,
  description,
  problem_type,
  difficulty_level,
  target_grade,
  numbers,
  correct_answer,
  visualization_config
) VALUES (
  '나누어 떨어지기',
  '전체를 같은 그룹으로 나누면 한 그룹에 몇 개씩일까요?',
  'division',
  'hard',
  4,
  '[20, 4]',
  '5',
  '{"object_type": "flower", "layout": "grid", "animation_type": "fade", "show_labels": true}'
);
