-- Demo Data for Reverse Bloom Testing
-- Moodle이 없어도 테스트할 수 있는 데모 데이터

-- 데모용 데이터베이스 생성 (선택사항)
-- CREATE DATABASE IF NOT EXISTS moodle_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE moodle_demo;

-- Question Categories Table
CREATE TABLE IF NOT EXISTS mdl_question_categories (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contextid BIGINT(10) UNSIGNED NOT NULL,
    info TEXT,
    parent BIGINT(10) UNSIGNED DEFAULT 0,
    stamp VARCHAR(255),
    sortorder INT(10) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question Table
CREATE TABLE IF NOT EXISTS mdl_question (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category BIGINT(10) UNSIGNED NOT NULL,
    parent BIGINT(10) UNSIGNED DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    questiontext TEXT NOT NULL,
    questiontextformat TINYINT(2) DEFAULT 1,
    generalfeedback TEXT,
    generalfeedbackformat TINYINT(2) DEFAULT 1,
    defaultmark DECIMAL(12,7) DEFAULT 1.0000000,
    penalty DECIMAL(12,7) DEFAULT 0.3333333,
    qtype VARCHAR(20) NOT NULL,
    length BIGINT(10) DEFAULT 1,
    stamp VARCHAR(255),
    version VARCHAR(255),
    hidden TINYINT(1) DEFAULT 0,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    createdby BIGINT(10) UNSIGNED,
    modifiedby BIGINT(10) UNSIGNED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question Answers Table
CREATE TABLE IF NOT EXISTS mdl_question_answers (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question BIGINT(10) UNSIGNED NOT NULL,
    answer TEXT NOT NULL,
    answerformat TINYINT(2) DEFAULT 1,
    fraction DECIMAL(12,7) NOT NULL,
    feedback TEXT,
    feedbackformat TINYINT(2) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Demo Categories
INSERT INTO mdl_question_categories (id, name, contextid, info, parent) VALUES
(1, '수학 - 분수', 1, '분수 관련 문제', 0),
(2, '수학 - 기하학', 1, '도형과 기하학 문제', 0),
(3, '수학 - 대수', 1, '대수 관련 문제', 0);

-- Insert Demo Questions
INSERT INTO mdl_question (id, category, name, questiontext, qtype, defaultmark, generalfeedback, timecreated, timemodified, createdby, modifiedby) VALUES
(1, 1, '분수의 덧셈 기초', '<p>1/2 + 1/4 = ?</p>', 'multichoice', 1.0, '<p>분모가 다른 분수를 더할 때는 통분이 필요합니다.</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1),
(2, 1, '분수의 곱셈', '<p>2/3 × 3/4 = ?</p>', 'multichoice', 1.0, '<p>분수의 곱셈은 분자끼리, 분모끼리 곱합니다.</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1),
(3, 2, '삼각형의 넓이', '<p>밑변이 6cm, 높이가 4cm인 삼각형의 넓이는?</p>', 'multichoice', 1.0, '<p>삼각형의 넓이 = (밑변 × 높이) ÷ 2</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1),
(4, 2, '원의 둘레', '<p>반지름이 5cm인 원의 둘레는? (π = 3.14)</p>', 'multichoice', 1.0, '<p>원의 둘레 = 2 × π × 반지름</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1),
(5, 3, '일차방정식', '<p>2x + 5 = 13일 때, x의 값은?</p>', 'multichoice', 1.0, '<p>양변에서 5를 빼고, 2로 나눕니다.</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1);

-- Insert Answers for Question 1 (분수의 덧셈)
INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(1, '<p>3/4</p>', 1.0, '<p>정답입니다! 1/2 = 2/4이므로, 2/4 + 1/4 = 3/4입니다.</p>'),
(1, '<p>2/6</p>', 0.0, '<p>통분을 다시 확인해보세요.</p>'),
(1, '<p>1/2</p>', 0.0, '<p>분수를 더하면 값이 커집니다.</p>'),
(1, '<p>2/4</p>', 0.0, '<p>계산을 다시 해보세요.</p>');

-- Insert Answers for Question 2 (분수의 곱셈)
INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(2, '<p>1/2</p>', 1.0, '<p>정답입니다! (2×3)/(3×4) = 6/12 = 1/2입니다.</p>'),
(2, '<p>5/7</p>', 0.0, '<p>분수의 곱셈은 더하기가 아닙니다.</p>'),
(2, '<p>2/3</p>', 0.0, '<p>분모도 곱해야 합니다.</p>'),
(2, '<p>6/12</p>', 0.5, '<p>맞지만 약분할 수 있습니다!</p>');

-- Insert Answers for Question 3 (삼각형의 넓이)
INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(3, '<p>12 cm²</p>', 1.0, '<p>정답입니다! (6 × 4) ÷ 2 = 12 cm²입니다.</p>'),
(3, '<p>24 cm²</p>', 0.0, '<p>삼각형은 사각형의 절반입니다.</p>'),
(3, '<p>10 cm²</p>', 0.0, '<p>넓이 공식을 다시 확인해보세요.</p>'),
(3, '<p>6 cm²</p>', 0.0, '<p>밑변과 높이를 곱한 후 2로 나누어야 합니다.</p>');

-- Insert Answers for Question 4 (원의 둘레)
INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(4, '<p>31.4 cm</p>', 1.0, '<p>정답입니다! 2 × 3.14 × 5 = 31.4 cm입니다.</p>'),
(4, '<p>15.7 cm</p>', 0.0, '<p>2를 곱하는 것을 잊으셨네요.</p>'),
(4, '<p>78.5 cm</p>', 0.0, '<p>그것은 원의 넓이 공식입니다.</p>'),
(4, '<p>10 cm</p>', 0.0, '<p>π를 사용해야 합니다.</p>');

-- Insert Answers for Question 5 (일차방정식)
INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(5, '<p>x = 4</p>', 1.0, '<p>정답입니다! 2x = 13 - 5 = 8, x = 4입니다.</p>'),
(5, '<p>x = 8</p>', 0.0, '<p>2로 나누는 것을 잊으셨네요.</p>'),
(5, '<p>x = 9</p>', 0.0, '<p>13에서 5를 빼야 합니다.</p>'),
(5, '<p>x = 6</p>', 0.0, '<p>계산을 다시 확인해보세요.</p>');

-- Add more complex questions for better Reverse Bloom demonstration
INSERT INTO mdl_question (id, category, name, questiontext, qtype, defaultmark, generalfeedback, timecreated, timemodified, createdby, modifiedby) VALUES
(6, 1, '복잡한 분수 문제 (종합)', '<p>철수는 피자를 2/5 먹고, 영희는 1/3을 먹었습니다. 남은 피자는 전체의 몇 분의 몇입니까?</p>', 'multichoice', 2.0, '<p>전체를 1로 보고, 먹은 양을 빼면 됩니다.</p>', UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 1, 1);

INSERT INTO mdl_question_answers (question, answer, fraction, feedback) VALUES
(6, '<p>4/15</p>', 1.0, '<p>완벽합니다! 1 - (2/5 + 1/3) = 1 - (6/15 + 5/15) = 1 - 11/15 = 4/15</p>'),
(6, '<p>11/15</p>', 0.0, '<p>그것은 먹은 양입니다. 남은 양을 구해야 합니다.</p>'),
(6, '<p>3/8</p>', 0.0, '<p>통분을 올바르게 했는지 확인하세요.</p>'),
(6, '<p>1/2</p>', 0.0, '<p>계산을 다시 해보세요.</p>');

-- Create indexes for better performance
CREATE INDEX idx_question_category ON mdl_question(category);
CREATE INDEX idx_answer_question ON mdl_question_answers(question);

-- Success message
SELECT 'Demo data inserted successfully! You now have 6 questions with answers.' AS message;
