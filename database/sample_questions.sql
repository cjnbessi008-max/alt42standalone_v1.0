-- Sample Assessment Questions
-- Insert sample questions for testing

-- Basic Cognitive Assessment Questions (기본 인지 평가)
INSERT INTO assessment_questions (assessment_type_id, question_text, question_type, options, correct_answer, difficulty_level, cognitive_domain, time_limit, points) VALUES
(1, '다음 중 가장 큰 숫자는?', 'multiple_choice', '["42", "57", "38", "61"]', '61', 'easy', 'processing_speed', 10, 1.0),
(1, '12 + 18 = ?', 'numeric', NULL, '30', 'easy', 'calculation', 15, 1.0),
(1, '다음 패턴에서 다음에 올 숫자는? 2, 4, 8, 16, __', 'numeric', NULL, '32', 'medium', 'pattern_recognition', 20, 1.5),
(1, '사과는 과일이다.', 'true_false', '["참", "거짓"]', '참', 'easy', 'reasoning', 10, 1.0),
(1, '다음 단어 중 나머지와 다른 것은?', 'multiple_choice', '["개", "고양이", "의자", "토끼"]', '의자', 'medium', 'categorization', 15, 1.5),
(1, '25 × 4 = ?', 'numeric', NULL, '100', 'medium', 'calculation', 20, 1.5),
(1, '다음 중 가장 작은 숫자는?', 'multiple_choice', '["0.5", "0.25", "0.75", "0.1"]', '0.1', 'medium', 'comparison', 15, 1.5),
(1, '서울은 대한민국의 수도이다.', 'true_false', '["참", "거짓"]', '참', 'easy', 'knowledge', 10, 1.0),
(1, '100 - 37 = ?', 'numeric', NULL, '63', 'medium', 'calculation', 20, 1.5),
(1, '다음 문장에서 틀린 부분은? "나는 어제 학교에 갔습니다"', 'multiple_choice', '["문법 오류 없음", "시제 오류", "주어 오류", "목적어 오류"]', '문법 오류 없음', 'medium', 'language', 20, 1.5),
(1, '5의 제곱은?', 'numeric', NULL, '25', 'easy', 'calculation', 15, 1.0),
(1, '다음 중 짝수는?', 'multiple_choice', '["13", "17", "22", "19"]', '22', 'easy', 'number_sense', 10, 1.0),
(1, '물은 100도에서 끓는다.', 'true_false', '["참", "거짓"]', '참', 'easy', 'knowledge', 10, 1.0),
(1, '다음 패턴의 다음 문자는? A, C, E, G, __', 'multiple_choice', '["H", "I", "J", "K"]', 'I', 'medium', 'pattern_recognition', 20, 1.5),
(1, '72 ÷ 8 = ?', 'numeric', NULL, '9', 'medium', 'calculation', 15, 1.5),
(1, '다음 중 가장 빠른 동물은?', 'multiple_choice', '["치타", "사자", "코끼리", "기린"]', '치타', 'easy', 'knowledge', 15, 1.0),
(1, '삼각형의 내각의 합은 180도이다.', 'true_false', '["참", "거짓"]', '참', 'medium', 'geometry', 15, 1.5),
(1, '다음 중 소수는?', 'multiple_choice', '["4", "6", "7", "9"]', '7', 'medium', 'number_theory', 20, 1.5),
(1, '15의 20%는?', 'numeric', NULL, '3', 'medium', 'calculation', 25, 2.0),
(1, '다음 단어를 반대 순서로 배열하면? CAT', 'multiple_choice', '["TAC", "ACT", "CTA", "ATC"]', 'TAC', 'medium', 'memory', 15, 1.5);

-- Reaction Time Test Questions (반응 속도 테스트)
INSERT INTO assessment_questions (assessment_type_id, question_text, question_type, options, correct_answer, difficulty_level, cognitive_domain, time_limit, points) VALUES
(2, '화면에 ●가 나타나면 클릭하세요', 'reaction_time', NULL, 'click', 'easy', 'reaction_speed', 5, 1.0),
(2, '빨간색 원이 나타나면 클릭하세요', 'reaction_time', NULL, 'click', 'easy', 'selective_attention', 5, 1.0),
(2, '숫자가 나타나면 즉시 반응하세요', 'reaction_time', NULL, 'click', 'easy', 'reaction_speed', 5, 1.0),
(2, '별 모양이 나타나면 클릭하세요', 'reaction_time', NULL, 'click', 'easy', 'pattern_recognition', 5, 1.0),
(2, '파란색 사각형이 나타나면 클릭하세요', 'reaction_time', NULL, 'click', 'medium', 'selective_attention', 5, 1.0);

-- Working Memory Test Questions (작업 기억 평가)
INSERT INTO assessment_questions (assessment_type_id, question_text, question_type, options, correct_answer, difficulty_level, cognitive_domain, time_limit, points) VALUES
(3, '다음 숫자를 기억하세요: 3, 7, 2', 'memory', NULL, '3, 7, 2', 'easy', 'working_memory', 30, 1.0),
(3, '다음 단어를 기억하세요: 사과, 책, 의자', 'memory', NULL, '사과, 책, 의자', 'easy', 'working_memory', 30, 1.0),
(3, '다음 숫자를 역순으로 기억하세요: 5, 2, 8, 1', 'memory', NULL, '1, 8, 2, 5', 'medium', 'working_memory', 40, 1.5),
(3, '다음 숫자 중 두 번째 것은? 9, 4, 6, 3, 7', 'memory', '["9", "4", "6", "3"]', '4', 'easy', 'working_memory', 20, 1.0),
(3, '다음 단어를 알파벳 순서로 정렬하세요: Dog, Apple, Cat', 'memory', NULL, 'Apple, Cat, Dog', 'medium', 'working_memory', 40, 1.5);

-- Attention Test Questions (주의력 테스트)
INSERT INTO assessment_questions (assessment_type_id, question_text, question_type, options, correct_answer, difficulty_level, cognitive_domain, time_limit, points) VALUES
(4, '다음 중 "A"의 개수는? AABACADAA', 'numeric', NULL, '6', 'medium', 'sustained_attention', 20, 1.5),
(4, '다음 단어에서 모음의 개수는? COGNITIVE', 'numeric', NULL, '4', 'medium', 'attention', 20, 1.5),
(4, '다음 숫자 중 홀수의 개수는? 2,4,5,7,8,9,10', 'numeric', NULL, '3', 'medium', 'selective_attention', 20, 1.5),
(4, '다음 문장에서 "the"의 개수는? The cat sat on the mat by the door', 'numeric', NULL, '3', 'medium', 'sustained_attention', 25, 2.0),
(4, '다음 패턴에서 다른 것은?', 'multiple_choice', '["■ ■ ■ ■", "● ● ● ●", "▲ ▲ ▲ ▲", "■ ■ ● ■"]', '■ ■ ● ■', 'medium', 'attention', 20, 1.5);

-- Update assessment type configurations to match question counts
UPDATE assessment_types SET configuration = '{"duration": 600, "question_count": 20, "difficulty": "medium"}' WHERE type_code = 'basic_cognitive';
UPDATE assessment_types SET configuration = '{"trials": 5, "stimulus_type": "visual"}' WHERE type_code = 'reaction_time';
UPDATE assessment_types SET configuration = '{"n_level": 2, "trials": 5}' WHERE type_code = 'working_memory';
UPDATE assessment_types SET configuration = '{"duration": 300, "distractors": true, "questions": 5}' WHERE type_code = 'attention';
