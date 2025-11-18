-- ============================================================================
-- Sample Data - Mathematical Concepts and Prerequisites
-- 수학 개념 및 전제지식 관계 샘플 데이터
-- ============================================================================

-- ============================================================================
-- Knowledge Concepts (지식 개념)
-- ============================================================================

-- Basic Arithmetic (기초 산술)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_NUMBER_BASIC', 'Basic Numbers', '기초 수 개념', 'Understanding natural numbers 1-100', 'mathematics', '1', 1),
('MATH_ADDITION_BASIC', 'Basic Addition', '기초 덧셈', 'Addition of single-digit numbers', 'mathematics', '1', 1),
('MATH_SUBTRACTION_BASIC', 'Basic Subtraction', '기초 뺄셈', 'Subtraction of single-digit numbers', 'mathematics', '1', 1),
('MATH_MULTIPLICATION_BASIC', 'Basic Multiplication', '기초 곱셈', 'Multiplication tables (1-9)', 'mathematics', '2', 2),
('MATH_DIVISION_BASIC', 'Basic Division', '기초 나눗셈', 'Division as inverse of multiplication', 'mathematics', '2', 2);

-- Fractions (분수)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_FRACTION_CONCEPT', 'Fraction Concept', '분수 개념', 'Understanding parts of a whole', 'mathematics', '3', 2),
('MATH_FRACTION_EQUIV', 'Equivalent Fractions', '동치 분수', 'Recognizing equivalent fractions', 'mathematics', '3', 3),
('MATH_FRACTION_ADD', 'Fraction Addition', '분수 덧셈', 'Adding fractions with same/different denominators', 'mathematics', '4', 3),
('MATH_FRACTION_SUB', 'Fraction Subtraction', '분수 뺄셈', 'Subtracting fractions', 'mathematics', '4', 3),
('MATH_FRACTION_MULT', 'Fraction Multiplication', '분수 곱셈', 'Multiplying fractions', 'mathematics', '5', 4),
('MATH_FRACTION_DIV', 'Fraction Division', '분수 나눗셈', 'Dividing fractions', 'mathematics', '5', 4);

-- Decimals (소수)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_DECIMAL_CONCEPT', 'Decimal Concept', '소수 개념', 'Understanding decimal notation', 'mathematics', '4', 2),
('MATH_DECIMAL_ADD', 'Decimal Addition', '소수 덧셈', 'Adding decimal numbers', 'mathematics', '4', 3),
('MATH_DECIMAL_SUB', 'Decimal Subtraction', '소수 뺄셈', 'Subtracting decimal numbers', 'mathematics', '4', 3),
('MATH_DECIMAL_MULT', 'Decimal Multiplication', '소수 곱셈', 'Multiplying decimal numbers', 'mathematics', '5', 4),
('MATH_DECIMAL_DIV', 'Decimal Division', '소수 나눗셈', 'Dividing decimal numbers', 'mathematics', '5', 4);

-- Ratios and Proportions (비율과 비례)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_RATIO_BASIC', 'Basic Ratios', '기초 비율', 'Understanding ratios and comparisons', 'mathematics', '6', 3),
('MATH_PROPORTION', 'Proportions', '비례', 'Solving proportional relationships', 'mathematics', '6', 4),
('MATH_PERCENT', 'Percentages', '백분율', 'Understanding and calculating percentages', 'mathematics', '6', 4);

-- Algebra Basics (기초 대수)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_VARIABLE', 'Variables', '변수', 'Understanding algebraic variables', 'mathematics', '7', 3),
('MATH_LINEAR_EQ', 'Linear Equations', '일차방정식', 'Solving linear equations', 'mathematics', '7', 4),
('MATH_SYSTEM_EQ', 'Systems of Equations', '연립방정식', 'Solving systems of linear equations', 'mathematics', '8', 5);

-- Geometry (기하)
INSERT INTO knowledge_concepts (concept_code, concept_name, concept_name_ko, description, subject, grade_level, difficulty_level) VALUES
('MATH_SHAPE_BASIC', 'Basic Shapes', '기초 도형', 'Identifying basic geometric shapes', 'mathematics', '2', 1),
('MATH_PERIMETER', 'Perimeter', '둘레', 'Calculating perimeter of shapes', 'mathematics', '3', 2),
('MATH_AREA', 'Area', '넓이', 'Calculating area of basic shapes', 'mathematics', '4', 3),
('MATH_VOLUME', 'Volume', '부피', 'Calculating volume of 3D shapes', 'mathematics', '5', 4);

-- ============================================================================
-- Concept Prerequisites (전제지식 관계)
-- ============================================================================

-- Basic Arithmetic Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Addition requires number understanding
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_NUMBER_BASIC'), 'required', 0.80),

-- Subtraction requires number understanding
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_SUBTRACTION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_NUMBER_BASIC'), 'required', 0.80),

-- Subtraction recommended to know addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_SUBTRACTION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'recommended', 0.70),

-- Multiplication requires addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'required', 0.80),

-- Division requires multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DIVISION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Division recommended to know subtraction
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DIVISION_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_SUBTRACTION_BASIC'), 'recommended', 0.70);

-- Fraction Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Fraction concept requires division
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DIVISION_BASIC'), 'required', 0.75),

-- Equivalent fractions require fraction concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_EQUIV'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'required', 0.80),

-- Equivalent fractions require multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_EQUIV'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.75),

-- Fraction addition requires fraction concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_ADD'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'required', 0.80),

-- Fraction addition requires equivalent fractions
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_ADD'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_EQUIV'), 'required', 0.75),

-- Fraction addition requires basic addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_ADD'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'required', 0.80),

-- Fraction subtraction requires fraction addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_SUB'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_ADD'), 'required', 0.75),

-- Fraction multiplication requires fraction concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_MULT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'required', 0.80),

-- Fraction multiplication requires basic multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_MULT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Fraction division requires fraction multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_DIV'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_MULT'), 'required', 0.75);

-- Decimal Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Decimal concept requires fraction concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_CONCEPT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'recommended', 0.70),

-- Decimal addition requires decimal concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_ADD'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_CONCEPT'), 'required', 0.80),

-- Decimal addition requires basic addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_ADD'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'required', 0.80),

-- Decimal subtraction requires decimal addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_SUB'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_ADD'), 'required', 0.75),

-- Decimal multiplication requires decimal concept
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_MULT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_CONCEPT'), 'required', 0.80),

-- Decimal multiplication requires basic multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_MULT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Decimal division requires decimal multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_DIV'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_MULT'), 'required', 0.75);

-- Ratios and Proportions Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Ratios require fractions
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_RATIO_BASIC'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'required', 0.75),

-- Proportions require ratios
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PROPORTION'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_RATIO_BASIC'), 'required', 0.80),

-- Proportions require multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PROPORTION'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Percentages require fractions
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PERCENT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'required', 0.75),

-- Percentages require decimals
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PERCENT'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_DECIMAL_CONCEPT'), 'required', 0.75);

-- Algebra Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Variables require basic arithmetic
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_VARIABLE'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'required', 0.80),

((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_VARIABLE'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Linear equations require variables
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_LINEAR_EQ'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_VARIABLE'), 'required', 0.80),

-- Linear equations require fractions
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_LINEAR_EQ'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_FRACTION_CONCEPT'), 'recommended', 0.70),

-- Systems require linear equations
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_SYSTEM_EQ'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_LINEAR_EQ'), 'required', 0.80);

-- Geometry Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance, minimum_mastery_level) VALUES
-- Perimeter requires shapes
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PERIMETER'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_SHAPE_BASIC'), 'required', 0.80),

-- Perimeter requires addition
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PERIMETER'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_ADDITION_BASIC'), 'required', 0.80),

-- Area requires perimeter
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_AREA'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_PERIMETER'), 'recommended', 0.70),

-- Area requires multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_AREA'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80),

-- Volume requires area
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_VOLUME'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_AREA'), 'required', 0.75),

-- Volume requires multiplication
((SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_VOLUME'),
 (SELECT id FROM knowledge_concepts WHERE concept_code = 'MATH_MULTIPLICATION_BASIC'), 'required', 0.80);
