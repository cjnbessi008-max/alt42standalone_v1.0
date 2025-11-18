-- Sample data for testing Logical Collapse system
-- MySQL 5.7 compatible

USE logical_collapse;

-- Insert sample students
INSERT INTO students (id, moodle_user_id, name, email, grade_level) VALUES
(1, 1001, '김지훈', 'jihoon.kim@example.com', '중학교 3학년'),
(2, 1002, '이서연', 'seoyeon.lee@example.com', '고등학교 1학년'),
(3, 1003, '박민준', 'minjun.park@example.com', '중학교 3학년'),
(4, 1004, '최수아', 'sua.choi@example.com', '고등학교 2학년'),
(5, 1005, '정다은', 'daeun.jung@example.com', '중학교 3학년');

-- Insert sample problems
INSERT INTO problems (id, title, description, reasoning_steps, moodle_id, status) VALUES
(1, '삼단논법: 소크라테스의 죽음',
   '고전적인 삼단논법 예제를 통해 논리적 추론을 학습합니다.',
   '[
     {
       "type": "전제",
       "text": "모든 사람은 죽는다.",
       "formula": "∀x (Person(x) → Mortal(x))",
       "explanation": "보편적 진리에 대한 전제",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "전제",
       "text": "소크라테스는 사람이다.",
       "formula": "Person(Socrates)",
       "explanation": "특정 개체에 대한 전제",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "추론",
       "text": "따라서 소크라테스는 죽는다.",
       "formula": "Mortal(Socrates)",
       "explanation": "Modus Ponens 적용",
       "is_correct": true,
       "requires_validation": true,
       "collapsed": false,
       "incorrect": false
     }
   ]',
   101,
   'active'),

(2, '수학적 귀납법: 합 공식',
   '1부터 n까지의 합 공식을 수학적 귀납법으로 증명합니다.',
   '[
     {
       "type": "기본 단계",
       "text": "n=1일 때, 1 = 1(1+1)/2 = 1이므로 성립한다.",
       "formula": "P(1): 1 = 1(2)/2",
       "explanation": "기본 사례 검증",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "귀납 가정",
       "text": "n=k일 때 성립한다고 가정: 1+2+...+k = k(k+1)/2",
       "formula": "P(k): Σᵢ₌₁ᵏ i = k(k+1)/2",
       "explanation": "귀납 가정 설정",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "귀납 단계",
       "text": "n=k+1일 때: 1+2+...+k+(k+1) = k(k+1)/2 + (k+1)",
       "formula": "P(k+1): Σᵢ₌₁ᵏ⁺¹ i = k(k+1)/2 + (k+1)",
       "explanation": "귀납 가정을 k+1에 적용",
       "is_correct": true,
       "requires_validation": true,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "계산",
       "text": "= (k(k+1) + 2(k+1))/2 = (k+1)(k+2)/2",
       "formula": "(k+1)(k+2)/2",
       "explanation": "대수적 정리",
       "is_correct": true,
       "requires_validation": true,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "결론",
       "text": "따라서 모든 자연수 n에 대해 공식이 성립한다.",
       "formula": "∀n ∈ ℕ, Σᵢ₌₁ⁿ i = n(n+1)/2",
       "explanation": "귀납법 완성",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     }
   ]',
   102,
   'active'),

(3, '오류가 있는 추론',
   '잘못된 논리적 추론을 찾아내고 collapse 효과를 확인합니다.',
   '[
     {
       "type": "전제",
       "text": "모든 고양이는 포유류이다.",
       "formula": "∀x (Cat(x) → Mammal(x))",
       "explanation": "참인 전제",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "전제",
       "text": "강아지는 포유류이다.",
       "formula": "Mammal(Dog)",
       "explanation": "참인 전제",
       "is_correct": true,
       "requires_validation": false,
       "collapsed": false,
       "incorrect": false
     },
     {
       "type": "잘못된 추론",
       "text": "따라서 강아지는 고양이이다.",
       "formula": "Cat(Dog)",
       "explanation": "후건 긍정의 오류 (Affirming the Consequent)",
       "is_correct": false,
       "requires_validation": true,
       "collapsed": false,
       "incorrect": false
     }
   ]',
   103,
   'active');

-- Insert sample validations
INSERT INTO step_validations (problem_id, step_index, is_correct, student_id, time_spent) VALUES
(1, 0, 1, 1, 30),
(1, 1, 1, 1, 25),
(1, 2, 1, 1, 45),
(2, 0, 1, 2, 60),
(2, 1, 1, 2, 50),
(2, 2, 0, 2, 120),
(3, 0, 1, 3, 40),
(3, 1, 1, 3, 35),
(3, 2, 0, 3, 90);

-- Insert sample progress
INSERT INTO student_progress (student_id, problem_id, total_steps, completed_steps, correct_steps, progress_percentage) VALUES
(1, 1, 3, 3, 3, 100.00),
(2, 2, 5, 3, 2, 60.00),
(3, 3, 3, 3, 2, 66.67),
(4, 1, 3, 0, 0, 0.00),
(5, 2, 5, 1, 1, 20.00);

-- Insert sample collapse events
INSERT INTO collapse_events (problem_id, step_index, student_id, collapse_triggered, error_type) VALUES
(2, 2, 2, 1, 'calculation_error'),
(3, 2, 3, 1, 'affirming_consequent');

-- Insert sample sync log
INSERT INTO moodle_sync_log (entity_type, entity_id, action, status) VALUES
('problem', 1, 'fetch', 'success'),
('problem', 2, 'fetch', 'success'),
('problem', 3, 'fetch', 'success'),
('student', 1, 'fetch', 'success'),
('validation', 1, 'push', 'success');
