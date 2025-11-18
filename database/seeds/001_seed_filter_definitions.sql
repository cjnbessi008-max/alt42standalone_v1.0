-- Filter Shrink 필터 정의 시드 데이터

-- 1. 학년 필터
INSERT INTO filter_definitions (filter_name, filter_key, filter_order, filter_type, description)
VALUES ('학년', 'grade_level', 1, 'select', '학생 학년 필터');

INSERT INTO filter_options (filter_id, option_value, option_label, option_order) VALUES
(1, '1', '1학년', 1),
(1, '2', '2학년', 2),
(1, '3', '3학년', 3),
(1, '4', '4학년', 4),
(1, '5', '5학년', 5),
(1, '6', '6학년', 6),
(1, '7', '중학교 1학년', 7),
(1, '8', '중학교 2학년', 8),
(1, '9', '중학교 3학년', 9);

-- 2. 과목 필터
INSERT INTO filter_definitions (filter_name, filter_key, filter_order, filter_type, description)
VALUES ('과목', 'subject', 2, 'select', '교과목 필터');

INSERT INTO filter_options (filter_id, option_value, option_label, option_order) VALUES
(2, 'math', '수학', 1),
(2, 'korean', '국어', 2),
(2, 'english', '영어', 3),
(2, 'science', '과학', 4),
(2, 'social', '사회', 5);

-- 3. 난이도 필터
INSERT INTO filter_definitions (filter_name, filter_key, filter_order, filter_type, description)
VALUES ('난이도', 'difficulty_level', 3, 'select', '문제 난이도 필터');

INSERT INTO filter_options (filter_id, option_value, option_label, option_order) VALUES
(3, 'easy', '쉬움', 1),
(3, 'medium', '보통', 2),
(3, 'hard', '어려움', 3),
(3, 'expert', '최상급', 4);

-- 4. 주제 필터 (수학)
INSERT INTO filter_definitions (filter_name, filter_key, filter_order, filter_type, description)
VALUES ('주제', 'topic', 4, 'select', '학습 주제 필터');

INSERT INTO filter_options (filter_id, option_value, option_label, option_order) VALUES
(4, 'numbers', '수와 연산', 1),
(4, 'fractions', '분수', 2),
(4, 'decimals', '소수', 3),
(4, 'geometry', '도형', 4),
(4, 'measurement', '측정', 5),
(4, 'patterns', '규칙성', 6),
(4, 'probability', '확률과 통계', 7);

-- 5. 문제 유형 필터
INSERT INTO filter_definitions (filter_name, filter_key, filter_order, filter_type, description)
VALUES ('문제 유형', 'question_type', 5, 'select', '문제 형식 필터');

INSERT INTO filter_options (filter_id, option_value, option_label, option_order) VALUES
(5, 'multiple_choice', '객관식', 1),
(5, 'true_false', 'O/X', 2),
(5, 'short_answer', '단답형', 3),
(5, 'essay', '서술형', 4),
(5, 'matching', '연결형', 5);

-- 시스템 설정
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('moodle_url', 'http://localhost/moodle', 'string', 'Moodle LMS URL'),
('moodle_token', '', 'string', 'Moodle Web Service Token'),
('session_timeout', '3600', 'number', 'Filter session timeout (seconds)'),
('max_problems_per_session', '10', 'number', 'Maximum problems in one session'),
('enable_filter_shrink', 'true', 'boolean', 'Enable Filter Shrink feature');
