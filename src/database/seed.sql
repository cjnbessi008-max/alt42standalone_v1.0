-- ============================================
-- Sample Data for Testing
-- ============================================

-- Insert sample problems
INSERT INTO problems (moodle_question_id, question_text, question_type, difficulty_level, subject, grade_level) VALUES
(1001, '두 삼각형 ABC와 DEF에서 AB=6cm, BC=8cm, AC=10cm이고, DE=3cm, EF=4cm, DF=5cm일 때, 두 삼각형이 닮았는지 판단하시오.', 'similarity', 'medium', 'mathematics', '중학교 2학년'),
(1002, '직사각형 ABCD와 직사각형 EFGH에서 AB:EF = BC:FG = 2:3일 때, 두 직사각형의 닮음비를 구하시오.', 'similarity', 'easy', 'mathematics', '중학교 2학년'),
(1003, '반지름이 각각 4cm, 6cm인 두 원이 있다. 이 두 원이 닮았는지 판단하고, 닮음비를 구하시오.', 'similarity', 'easy', 'mathematics', '중학교 2학년');

-- Insert sample geometric shapes
INSERT INTO geometric_shapes (problem_id, shape_type, properties, vertices, dimensions) VALUES
(1, 'triangle', '{"sides": [6, 8, 10], "angles": [90, 53.13, 36.87]}', '{"A": [0,0], "B": [6,0], "C": [0,8]}', '{"area": 24, "perimeter": 24}'),
(1, 'triangle', '{"sides": [3, 4, 5], "angles": [90, 53.13, 36.87]}', '{"D": [0,0], "E": [3,0], "F": [0,4]}', '{"area": 6, "perimeter": 12}'),
(2, 'rectangle', '{"width": 4, "height": 6}', '{"A": [0,0], "B": [4,0], "C": [4,6], "D": [0,6]}', '{"area": 24, "perimeter": 20}'),
(2, 'rectangle', '{"width": 6, "height": 9}', '{"E": [0,0], "F": [6,0], "G": [6,9], "H": [0,9]}', '{"area": 54, "perimeter": 30}'),
(3, 'circle', '{"radius": 4}', '{"center": [0,0]}', '{"area": 50.27, "circumference": 25.13}'),
(3, 'circle', '{"radius": 6}', '{"center": [0,0]}', '{"area": 113.10, "circumference": 37.70}');

-- Insert sample similarity hints
INSERT INTO similarity_hints (problem_id, hint_type, hint_text, hint_data, confidence_score) VALUES
(1, 'ratio', '두 삼각형의 대응하는 변의 길이의 비를 확인해보세요. AB:DE = 6:3 = 2:1', '{"ratio": 2, "corresponding_sides": ["AB-DE", "BC-EF", "AC-DF"]}', 0.95),
(1, 'angle', '두 삼각형 모두 직각삼각형입니다. 대응하는 각의 크기를 비교해보세요.', '{"angles": [90, 53.13, 36.87]}', 0.90),
(2, 'proportion', '대응하는 변의 비가 같으면 닮은 도형입니다. AB:EF = BC:FG = 2:3', '{"ratio": "2:3", "type": "rectangle"}', 0.92),
(3, 'shape', '모든 원은 서로 닮은 도형입니다. 반지름의 비가 닮음비입니다.', '{"ratio": "2:3", "type": "circle"}', 0.98);
