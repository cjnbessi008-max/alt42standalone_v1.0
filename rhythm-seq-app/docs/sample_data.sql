-- =====================================================
-- Rhythm Seq - Sample Data for Moodle 3.7
-- =====================================================
-- This file contains sample sequence questions for testing
-- Execute this in your Moodle database

-- =====================================================
-- 1. Create Question Category
-- =====================================================

INSERT INTO mdl_question_categories (name, contextid, info, parent, sortorder, stamp)
VALUES (
    '수열 학습 - Rhythm Seq',
    1,
    'Rhythm Seq 앱을 위한 수열 문제 카테고리',
    0,
    999,
    CONCAT('rhythmseq_', UNIX_TIMESTAMP())
);

SET @category_id = LAST_INSERT_ID();

-- =====================================================
-- 2. Sample Questions
-- =====================================================

-- Question 1: 홀수 수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '홀수 수열 패턴 찾기',
    '<div class="qtext"><p>다음 홀수 수열의 패턴을 분석해보세요:</p><p><strong>[1, 3, 5, 7, 9, 11, 13, 15]</strong></p><p>다음에 올 숫자는 무엇일까요?</p></div>',
    1,
    '<p>이것은 공차가 2인 등차수열입니다. 각 항은 이전 항에 2를 더한 값입니다.</p>',
    1,
    'shortanswer',
    1,
    CONCAT('seq_odd_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '1'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 2: 짝수 수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '짝수 수열 연습',
    '<div class="qtext"><p>짝수로 이루어진 수열입니다:</p><p>수열: <strong>2, 4, 6, 8, 10, 12, 14, 16</strong></p><p>이 수열의 10번째 항은?</p></div>',
    1,
    '<p>공차가 2인 등차수열이며, 10번째 항은 20입니다.</p>',
    1,
    'numerical',
    1,
    CONCAT('seq_even_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '2'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 3: 5의 배수 수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '5의 배수 수열',
    '<div class="qtext"><p>다음은 5의 배수로 이루어진 수열입니다:</p><p>sequence: <strong>5, 10, 15, 20, 25, 30, 35, 40</strong></p><p>이 패턴에서 50은 몇 번째 항일까요?</p></div>',
    1,
    '<p>이것은 첫째항이 5, 공차가 5인 등차수열입니다. 50은 10번째 항입니다.</p>',
    1,
    'shortanswer',
    1,
    CONCAT('seq_five_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '3'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 4: 등차수열 심화
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '등차수열 공차 찾기',
    '<div class="qtext"><p>다음 등차수열의 공차를 구하세요:</p><p>[3, 7, 11, 15, 19, 23, 27, 31]</p></div>',
    1,
    '<p>공차는 4입니다. 각 항은 이전 항에 4를 더한 값입니다.</p>',
    1,
    'numerical',
    1,
    CONCAT('seq_diff_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '4'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 5: 등비수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '등비수열 기초',
    '<div class="qtext"><p>2의 거듭제곱으로 이루어진 수열입니다:</p><p>[2, 4, 8, 16, 32, 64, 128]</p><p>다음 항은 무엇일까요?</p></div>',
    1,
    '<p>이것은 공비가 2인 등비수열입니다. 다음 항은 256입니다.</p>',
    1,
    'shortanswer',
    1,
    CONCAT('seq_geo_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '5'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 6: 피보나치 수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '피보나치 수열',
    '<div class="qtext"><p>피보나치 수열: 각 항은 앞의 두 항의 합입니다</p><p>수열: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]</p><p>다음 항을 구하세요.</p></div>',
    1,
    '<p>피보나치 수열에서 다음 항은 34 + 55 = 89입니다.</p>',
    1,
    'numerical',
    1,
    CONCAT('seq_fib_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '6'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 7: 제곱수 수열
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '완전제곱수 수열',
    '<div class="qtext"><p>완전제곱수로 이루어진 수열입니다:</p><p>[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]</p><p>11번째 항은?</p></div>',
    1,
    '<p>이것은 자연수의 제곱으로 이루어진 수열입니다. 11² = 121입니다.</p>',
    1,
    'shortanswer',
    1,
    CONCAT('seq_square_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '7'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- Question 8: 복잡한 패턴
INSERT INTO mdl_question (
    category,
    parent,
    name,
    questiontext,
    questiontextformat,
    generalfeedback,
    generalfeedbackformat,
    qtype,
    length,
    stamp,
    version,
    hidden,
    timecreated,
    timemodified,
    createdby,
    modifiedby
) VALUES (
    @category_id,
    0,
    '복합 수열 패턴',
    '<div class="qtext"><p>다음 수열의 패턴을 찾아보세요:</p><p>[1, 4, 7, 10, 13, 16, 19, 22, 25, 28]</p><p>첫째항과 공차를 각각 구하세요.</p></div>',
    1,
    '<p>첫째항: 1, 공차: 3인 등차수열입니다.</p>',
    1,
    'essay',
    1,
    CONCAT('seq_complex_', UNIX_TIMESTAMP()),
    CONCAT(UNIX_TIMESTAMP(), '8'),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

-- =====================================================
-- 3. Verification Query
-- =====================================================

-- Use this to verify the questions were inserted
SELECT
    q.id,
    q.name,
    LEFT(q.questiontext, 100) AS preview,
    qc.name AS category
FROM mdl_question q
JOIN mdl_question_categories qc ON q.category = qc.id
WHERE qc.name LIKE '%Rhythm Seq%'
ORDER BY q.id;

-- =====================================================
-- Notes:
-- =====================================================
-- 1. Replace 'mdl_' with your actual Moodle table prefix if different
-- 2. Make sure you have appropriate permissions to insert data
-- 3. The createdby and modifiedby fields use user ID 2 (typically admin)
--    Update this to match your actual admin user ID
-- 4. After running this script, the questions should appear in
--    the Rhythm Seq app's question dropdown
