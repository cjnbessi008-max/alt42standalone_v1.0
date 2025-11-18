-- Sample Data for Rule Patternizer
-- This file contains sample differentiation rules and problems
-- To be inserted after Moodle installation

-- Note: Replace {rulepatternizer_rules} with actual table prefix
-- For example: mdl_rulepatternizer_rules

-- ============================================================================
-- DIFFERENTIATION RULES
-- ============================================================================

-- 1. Constant Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Constant Rule',
    '\\frac{d}{dx}[c] = 0',
    'symbolic',
    1,
    'The derivative of a constant is always zero.',
    'If f(x) = 5, then f\'(x) = 0',
    UNIX_TIMESTAMP()
);

-- 2. Power Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Power Rule',
    '\\frac{d}{dx}[x^n] = nx^{n-1}',
    'symbolic',
    1,
    'Multiply by the exponent, then subtract 1 from the exponent.',
    'If f(x) = x³, then f\'(x) = 3x²',
    UNIX_TIMESTAMP()
);

-- 3. Constant Multiple Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Constant Multiple Rule',
    '\\frac{d}{dx}[cf(x)] = c\\frac{d}{dx}[f(x)]',
    'symbolic',
    2,
    'Constants can be factored out of derivatives.',
    'If f(x) = 5x², then f\'(x) = 5(2x) = 10x',
    UNIX_TIMESTAMP()
);

-- 4. Sum Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Sum Rule',
    '\\frac{d}{dx}[f(x) + g(x)] = f\'(x) + g\'(x)',
    'symbolic',
    2,
    'The derivative of a sum is the sum of the derivatives.',
    'If f(x) = x² + x³, then f\'(x) = 2x + 3x²',
    UNIX_TIMESTAMP()
);

-- 5. Product Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Product Rule',
    '\\frac{d}{dx}[f(x)g(x)] = f\'(x)g(x) + f(x)g\'(x)',
    'symbolic',
    3,
    'Derivative of first times second, plus first times derivative of second.',
    'If f(x) = x²·x³, then f\'(x) = 2x·x³ + x²·3x²',
    UNIX_TIMESTAMP()
);

-- 6. Quotient Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Quotient Rule',
    '\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f\'(x)g(x) - f(x)g\'(x)}{[g(x)]^2}',
    'symbolic',
    4,
    'Low d-high minus high d-low, over the square of what\'s below.',
    'If f(x) = x²/x, then f\'(x) = (2x·x - x²·1)/x²',
    UNIX_TIMESTAMP()
);

-- 7. Chain Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Chain Rule',
    '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)',
    'symbolic',
    4,
    'Derivative of outer function times derivative of inner function.',
    'If f(x) = (x²+1)³, then f\'(x) = 3(x²+1)²·2x',
    UNIX_TIMESTAMP()
);

-- 8. Exponential Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Exponential Rule',
    '\\frac{d}{dx}[e^x] = e^x',
    'symbolic',
    2,
    'The derivative of e^x is itself!',
    'If f(x) = e^x, then f\'(x) = e^x',
    UNIX_TIMESTAMP()
);

-- 9. Logarithm Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Logarithm Rule',
    '\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}',
    'symbolic',
    2,
    'The derivative of natural log is 1/x.',
    'If f(x) = ln(x), then f\'(x) = 1/x',
    UNIX_TIMESTAMP()
);

-- 10. Sine Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Sine Rule',
    '\\frac{d}{dx}[\\sin(x)] = \\cos(x)',
    'symbolic',
    3,
    'The derivative of sine is cosine.',
    'If f(x) = sin(x), then f\'(x) = cos(x)',
    UNIX_TIMESTAMP()
);

-- 11. Cosine Rule
INSERT INTO {rulepatternizer_rules} (rule_name, rule_formula, pattern_type, difficulty_level, description, example, timecreated)
VALUES (
    'Cosine Rule',
    '\\frac{d}{dx}[\\cos(x)] = -\\sin(x)',
    'symbolic',
    3,
    'The derivative of cosine is negative sine.',
    'If f(x) = cos(x), then f\'(x) = -sin(x)',
    UNIX_TIMESTAMP()
);

-- ============================================================================
-- SAMPLE PROBLEMS
-- ============================================================================
-- Note: You need to get the actual rule IDs after insertion
-- Replace {instance_id} with the actual Rule Patternizer activity instance ID

-- Problems for Constant Rule (rule_id = 1)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    1, {instance_id},
    'Find the derivative of f(x) = 7',
    'f(x) = 7',
    '0',
    'Remember: the derivative of any constant is zero.',
    1, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    1, {instance_id},
    'Find the derivative of f(x) = -3',
    'f(x) = -3',
    '0',
    'A constant is a constant, even if it\'s negative!',
    1, UNIX_TIMESTAMP()
);

-- Problems for Power Rule (rule_id = 2)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    2, {instance_id},
    'Find the derivative of f(x) = x²',
    'f(x) = x^2',
    '2x',
    'Multiply by the exponent (2), then subtract 1 from the exponent.',
    1, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    2, {instance_id},
    'Find the derivative of f(x) = x³',
    'f(x) = x^3',
    '3x^2',
    'Bring down the 3, then subtract 1 from the exponent.',
    1, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    2, {instance_id},
    'Find the derivative of f(x) = x⁵',
    'f(x) = x^5',
    '5x^4',
    'Power rule: multiply by exponent, subtract 1.',
    1, UNIX_TIMESTAMP()
);

-- Problems for Constant Multiple Rule (rule_id = 3)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    3, {instance_id},
    'Find the derivative of f(x) = 5x²',
    'f(x) = 5x^2',
    '10x',
    'Factor out the 5, then use the power rule on x².',
    2, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    3, {instance_id},
    'Find the derivative of f(x) = 3x⁴',
    'f(x) = 3x^4',
    '12x^3',
    '3 times 4x³ = 12x³',
    2, UNIX_TIMESTAMP()
);

-- Problems for Sum Rule (rule_id = 4)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    4, {instance_id},
    'Find the derivative of f(x) = x² + x³',
    'f(x) = x^2 + x^3',
    '2x+3x^2',
    'Take the derivative of each term separately.',
    2, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    4, {instance_id},
    'Find the derivative of f(x) = 2x³ + 5x',
    'f(x) = 2x^3 + 5x',
    '6x^2+5',
    'Derivative of 2x³ is 6x², derivative of 5x is 5.',
    2, UNIX_TIMESTAMP()
);

-- Problems for Product Rule (rule_id = 5)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    5, {instance_id},
    'Find the derivative of f(x) = x²·x³',
    'f(x) = x^2 \\cdot x^3',
    '2x\\cdotx^3+x^2\\cdot3x^2',
    'First times derivative of second, plus derivative of first times second.',
    3, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    5, {instance_id},
    'Find the derivative of f(x) = x·sin(x)',
    'f(x) = x \\cdot \\sin(x)',
    '\\sin(x)+x\\cos(x)',
    'f\'g + fg\': derivative of x is 1, derivative of sin(x) is cos(x).',
    3, UNIX_TIMESTAMP()
);

-- Problems for Chain Rule (rule_id = 7)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    7, {instance_id},
    'Find the derivative of f(x) = (x²+1)³',
    'f(x) = (x^2+1)^3',
    '3(x^2+1)^2\\cdot2x',
    'Outer function is u³, inner is x²+1. Derivative: 3u²·2x.',
    4, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    7, {instance_id},
    'Find the derivative of f(x) = (2x+5)²',
    'f(x) = (2x+5)^2',
    '2(2x+5)\\cdot2',
    'Outer: 2u, Inner derivative: 2. Result: 2(2x+5)·2.',
    4, UNIX_TIMESTAMP()
);

-- Problems for Exponential Rule (rule_id = 8)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    8, {instance_id},
    'Find the derivative of f(x) = e^x',
    'f(x) = e^x',
    'e^x',
    'The derivative of e^x is itself!',
    2, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    8, {instance_id},
    'Find the derivative of f(x) = 3e^x',
    'f(x) = 3e^x',
    '3e^x',
    'Constant multiple rule: 3 times e^x.',
    2, UNIX_TIMESTAMP()
);

-- Problems for Logarithm Rule (rule_id = 9)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    9, {instance_id},
    'Find the derivative of f(x) = ln(x)',
    'f(x) = \\ln(x)',
    '1/x',
    'The derivative of natural log is 1/x.',
    2, UNIX_TIMESTAMP()
);

-- Problems for Sine Rule (rule_id = 10)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    10, {instance_id},
    'Find the derivative of f(x) = sin(x)',
    'f(x) = \\sin(x)',
    '\\cos(x)',
    'The derivative of sine is cosine.',
    3, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    10, {instance_id},
    'Find the derivative of f(x) = 2sin(x)',
    'f(x) = 2\\sin(x)',
    '2\\cos(x)',
    'Use constant multiple rule: 2 times cos(x).',
    3, UNIX_TIMESTAMP()
);

-- Problems for Cosine Rule (rule_id = 11)
INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    11, {instance_id},
    'Find the derivative of f(x) = cos(x)',
    'f(x) = \\cos(x)',
    '-\\sin(x)',
    'The derivative of cosine is negative sine.',
    3, UNIX_TIMESTAMP()
);

INSERT INTO {rulepatternizer_problems} (rule_id, rulepatternizer_id, problem_text, problem_latex, correct_answer, hint, difficulty_level, timecreated)
VALUES (
    11, {instance_id},
    'Find the derivative of f(x) = 3cos(x)',
    'f(x) = 3\\cos(x)',
    '-3\\sin(x)',
    'Use constant multiple rule: 3 times (-sin(x)).',
    3, UNIX_TIMESTAMP()
);
