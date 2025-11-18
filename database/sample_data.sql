-- Sample Data for Incorrect Solutions Comparison System
-- Insert sample problems and solutions for testing

-- Sample Problem 1: Fraction Addition
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data, is_active) VALUES
('분수의 덧셈', '1/2 + 1/3을 계산하세요.', 'mathematics', 'medium', '초등 3학년',
 '{"equation": "1/2 + 1/3 = ?", "type": "fraction_addition"}', 1);

SET @problem1_id = LAST_INSERT_ID();

-- Correct Solution for Problem 1
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(@problem1_id, 'correct', '올바른 풀이',
'[
  {
    "step_number": 1,
    "description": "두 분수의 분모를 같게 만들기 위해 최소공배수를 구합니다",
    "calculation": "2와 3의 최소공배수 = 6",
    "result": "공통분모: 6"
  },
  {
    "step_number": 2,
    "description": "각 분수를 공통분모로 변환합니다",
    "calculation": "1/2 = 3/6, 1/3 = 2/6",
    "result": "3/6 + 2/6"
  },
  {
    "step_number": 3,
    "description": "분자끼리 더합니다",
    "calculation": "3 + 2 = 5",
    "result": "5/6"
  }
]',
'5/6',
'분수의 덧셈은 분모를 같게 만든 후 분자끼리 더하는 것이 올바른 방법입니다.',
'manual');

-- Incorrect Solution for Problem 1
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(@problem1_id, 'incorrect', '틀린 풀이',
'[
  {
    "step_number": 1,
    "description": "분자와 분모를 각각 더합니다",
    "calculation": "분자: 1 + 1 = 2, 분모: 2 + 3 = 5",
    "result": "2/5"
  }
]',
'2/5',
'Fraction Addition',
'분수의 덧셈에서 분자와 분모를 각각 더하는 흔한 실수를 했습니다.',
'이것은 잘못된 방법입니다. 분수를 더할 때는 분모를 같게 만든 후 분자만 더해야 합니다. 분모를 더하면 전혀 다른 값이 나옵니다. 예를 들어, 1/2은 0.5이고 1/3은 약 0.33이므로, 더하면 약 0.83입니다. 하지만 2/5는 0.4로 전혀 다른 값입니다.',
'manual');

-- Sample Problem 2: Order of Operations
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data, is_active) VALUES
('연산 순서', '다음 식을 계산하세요: 2 + 3 × 4', 'mathematics', 'easy', '초등 4학년',
 '{"equation": "2 + 3 × 4 = ?", "type": "order_of_operations"}', 1);

SET @problem2_id = LAST_INSERT_ID();

-- Correct Solution for Problem 2
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(@problem2_id, 'correct', '올바른 풀이',
'[
  {
    "step_number": 1,
    "description": "곱셈을 먼저 계산합니다 (PEMDAS 규칙)",
    "calculation": "3 × 4 = 12",
    "result": "12"
  },
  {
    "step_number": 2,
    "description": "덧셈을 계산합니다",
    "calculation": "2 + 12 = 14",
    "result": "14"
  }
]',
'14',
'연산 순서(PEMDAS)에 따라 곱셈을 먼저 하고 덧셈을 나중에 합니다.',
'manual');

-- Incorrect Solution for Problem 2
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(@problem2_id, 'incorrect', '틀린 풀이',
'[
  {
    "step_number": 1,
    "description": "왼쪽부터 순서대로 계산합니다",
    "calculation": "2 + 3 = 5",
    "result": "5"
  },
  {
    "step_number": 2,
    "description": "결과에 4를 곱합니다",
    "calculation": "5 × 4 = 20",
    "result": "20"
  }
]',
'20',
'Order of Operations',
'연산 순서를 무시하고 왼쪽에서 오른쪽으로만 계산하는 실수를 했습니다.',
'이것은 잘못된 방법입니다. 수학에서는 연산 순서(PEMDAS 또는 BODMAS)를 반드시 따라야 합니다. 괄호 → 지수 → 곱셈/나눗셈 → 덧셈/뺄셈 순서로 계산해야 합니다. 이 문제에서는 곱셈(3 × 4)을 먼저 하고 그 다음 덧셈(2 + 12)을 해야 합니다.',
'manual');

-- Sample Problem 3: Negative Numbers
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data, is_active) VALUES
('음수 계산', '다음 식을 계산하세요: -3 + 5', 'mathematics', 'easy', '초등 5학년',
 '{"equation": "-3 + 5 = ?", "type": "negative_numbers"}', 1);

SET @problem3_id = LAST_INSERT_ID();

-- Correct Solution for Problem 3
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(@problem3_id, 'correct', '올바른 풀이',
'[
  {
    "step_number": 1,
    "description": "음수에 양수를 더하는 것은 빼기와 같습니다",
    "calculation": "5 - 3 = 2",
    "result": "2"
  }
]',
'2',
'-3에서 5를 더하면 양의 방향으로 5만큼 이동하므로 2가 됩니다.',
'manual');

-- Incorrect Solution for Problem 3
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(@problem3_id, 'incorrect', '틀린 풀이',
'[
  {
    "step_number": 1,
    "description": "음수를 양수로 바꾸고 더합니다",
    "calculation": "3 + 5 = 8",
    "result": "8"
  },
  {
    "step_number": 2,
    "description": "결과를 음수로 만듭니다",
    "calculation": "-8",
    "result": "-8"
  }
]',
'-8',
'Sign Error',
'음수의 부호를 잘못 처리하여 틀린 답을 얻었습니다.',
'이것은 잘못된 방법입니다. -3 + 5는 -3에서 시작해서 양의 방향으로 5만큼 이동하는 것입니다. 수직선으로 생각하면: -3에서 시작 → +5 이동 → -3 + 5 = 2가 됩니다. 음수를 양수로 바꾸고 부호를 임의로 붙이면 안 됩니다.',
'manual');

-- Sample Problem 4: Exponents
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data, is_active) VALUES
('거듭제곱 계산', '다음을 전개하세요: (a + b)²', 'mathematics', 'hard', '중등 2학년',
 '{"equation": "(a + b)² = ?", "type": "exponent_expansion"}', 1);

SET @problem4_id = LAST_INSERT_ID();

-- Correct Solution for Problem 4
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(@problem4_id, 'correct', '올바른 풀이',
'[
  {
    "step_number": 1,
    "description": "(a + b)²를 (a + b)(a + b)로 쓸 수 있습니다",
    "calculation": "(a + b)(a + b)",
    "result": "(a + b)(a + b)"
  },
  {
    "step_number": 2,
    "description": "FOIL 방법으로 전개합니다",
    "calculation": "a·a + a·b + b·a + b·b",
    "result": "a² + ab + ab + b²"
  },
  {
    "step_number": 3,
    "description": "같은 항끼리 정리합니다",
    "calculation": "a² + 2ab + b²",
    "result": "a² + 2ab + b²"
  }
]',
'a² + 2ab + b²',
'(a + b)²는 완전제곱식으로 a² + 2ab + b²가 됩니다.',
'manual');

-- Incorrect Solution for Problem 4
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(@problem4_id, 'incorrect', '틀린 풀이',
'[
  {
    "step_number": 1,
    "description": "각 항에 제곱을 분배합니다",
    "calculation": "a² + b²",
    "result": "a² + b²"
  }
]',
'a² + b²',
'Exponent Distribution',
'지수를 각 항에 분배하는 흔한 실수를 했습니다. 중간 항(2ab)을 빠뜨렸습니다.',
'이것은 잘못된 방법입니다. (a + b)²는 a² + b²가 아닙니다. 올바른 전개식은 a² + 2ab + b²입니다. 예를 들어, a=2, b=3일 때: (2+3)² = 5² = 25이지만, 2² + 3² = 4 + 9 = 13으로 다릅니다. 반드시 중간 항 2ab를 포함해야 합니다.',
'manual');

-- Sample Problem 5: Division by Zero
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data, is_active) VALUES
('0으로 나누기', '다음 식을 간단히 하세요: (x + 2) / (x - 2) (x = 2일 때)', 'mathematics', 'medium', '중등 1학년',
 '{"equation": "(x + 2) / (x - 2), x = 2", "type": "division_by_zero"}', 1);

SET @problem5_id = LAST_INSERT_ID();

-- Correct Solution for Problem 5
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(@problem5_id, 'correct', '올바른 풀이',
'[
  {
    "step_number": 1,
    "description": "x = 2를 대입합니다",
    "calculation": "(2 + 2) / (2 - 2) = 4 / 0",
    "result": "4 / 0"
  },
  {
    "step_number": 2,
    "description": "0으로 나누는 것은 정의되지 않습니다",
    "calculation": "0으로 나눌 수 없음",
    "result": "정의되지 않음 (undefined)"
  }
]',
'정의되지 않음',
'0으로 나누는 것은 수학적으로 정의되지 않습니다.',
'manual');

-- Incorrect Solution for Problem 5
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(@problem5_id, 'incorrect', '틀린 풀이',
'[
  {
    "step_number": 1,
    "description": "x = 2를 대입합니다",
    "calculation": "(2 + 2) / (2 - 2) = 4 / 0",
    "result": "4 / 0"
  },
  {
    "step_number": 2,
    "description": "0으로 나누면 0입니다",
    "calculation": "4 / 0 = 0",
    "result": "0"
  }
]',
'0',
'Division by Zero',
'0으로 나눈 값을 0이라고 잘못 계산했습니다.',
'이것은 잘못된 방법입니다. 0으로 나누는 것은 수학적으로 정의되지 않습니다. 어떤 수를 0으로 나눌 수 없습니다. x = 2일 때 분모가 0이 되므로 이 식은 정의되지 않습니다(undefined). x ≠ 2라는 조건이 필요합니다.',
'manual');

-- Verify insertions
SELECT 'Sample data inserted successfully!' as message;
SELECT COUNT(*) as total_problems FROM problems;
SELECT COUNT(*) as total_solutions FROM solutions;
SELECT COUNT(*) as correct_solutions FROM solutions WHERE solution_type = 'correct';
SELECT COUNT(*) as incorrect_solutions FROM solutions WHERE solution_type = 'incorrect';
