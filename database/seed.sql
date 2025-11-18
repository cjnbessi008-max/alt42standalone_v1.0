-- Scale Sound 샘플 데이터
-- MySQL 5.7

USE scale_sound;

-- 샘플 문제 데이터
INSERT INTO problems (title, description, original_shape, scale_range_min, scale_range_max) VALUES
(
  '직사각형 닮음비 문제 1',
  '직사각형의 닮음 배율을 조정하면서 음높이 변화를 들어보세요.',
  '{"type":"rectangle","points":[{"x":75,"y":150},{"x":275,"y":150},{"x":275,"y":450},{"x":75,"y":450}],"color":"#3498db"}',
  0.5,
  3.0
),
(
  '삼각형 닮음비 문제 1',
  '정삼각형의 닮음 배율에 따른 소리를 경험해보세요.',
  '{"type":"triangle","points":[{"x":175,"y":137},{"x":75,"y":397},{"x":275,"y":397}],"color":"#e74c3c"}',
  0.5,
  3.0
),
(
  '원 닮음비 문제 1',
  '원의 반지름 변화와 음높이의 관계를 탐구해보세요.',
  '{"type":"circle","points":[{"x":175,"y":310},{"x":275,"y":310}],"color":"#2ecc71"}',
  0.5,
  3.0
),
(
  '정사각형 닮음비 문제 1',
  '정사각형의 크기와 음정 간의 관계를 학습하세요.',
  '{"type":"rectangle","points":[{"x":100,"y":185},{"x":250,"y":185},{"x":250,"y":435},{"x":100,"y":435}],"color":"#9b59b6"}',
  0.5,
  2.5
),
(
  '복합 도형 문제 1',
  '여러 배율 범위에서 소리의 변화를 비교해보세요.',
  '{"type":"rectangle","points":[{"x":100,"y":200},{"x":250,"y":200},{"x":250,"y":400},{"x":100,"y":400}],"color":"#f39c12"}',
  0.8,
  2.0
);

-- 샘플 사용자 데이터 (Moodle 사용자 ID 가정)
INSERT INTO users (moodle_user_id, username, email, full_name) VALUES
(1, 'student1', 'student1@example.com', '김철수'),
(2, 'student2', 'student2@example.com', '이영희'),
(3, 'teacher1', 'teacher1@example.com', '박선생'),
(100, 'admin', 'admin@example.com', '관리자');

-- 샘플 진행도 데이터
INSERT INTO user_progress (user_id, problem_id, scale_value, completed, score) VALUES
(1, 1, 1.50, TRUE, 85),
(1, 2, 1.20, TRUE, 90),
(1, 3, 2.00, FALSE, 60),
(2, 1, 1.00, TRUE, 95),
(2, 2, 1.75, TRUE, 88),
(2, 4, 1.35, FALSE, 70);

-- 시스템 설정
INSERT INTO settings (setting_key, setting_value, description) VALUES
('default_scale_min', '0.5', '기본 최소 배율'),
('default_scale_max', '3.0', '기본 최대 배율'),
('sound_enabled', 'true', 'Scale Sound 기능 활성화'),
('base_frequency', '440', '기본 주파수 (A4)'),
('wave_type', 'sine', '파형 타입 (sine, square, triangle, sawtooth)');

-- 데이터 확인
SELECT '✅ 문제 데이터' AS '테이블';
SELECT id, title, scale_range_min, scale_range_max FROM problems;

SELECT '✅ 사용자 데이터' AS '테이블';
SELECT id, username, full_name FROM users;

SELECT '✅ 진행도 데이터' AS '테이블';
SELECT id, user_id, problem_id, scale_value, completed, score FROM user_progress;

SELECT '✅ 시스템 설정' AS '테이블';
SELECT setting_key, setting_value FROM settings;
