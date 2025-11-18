-- ============================================
-- Relation Lines - Database Setup Script
-- Moodle 3.7 + MySQL 5.7
-- ============================================

-- 사용할 데이터베이스 선택
USE moodle;

-- ============================================
-- 1. Relation Lines 문제 데이터 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS mdl_question_relationlines (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    questionid BIGINT(10) UNSIGNED NOT NULL COMMENT 'Moodle 질문 ID',
    data LONGTEXT NOT NULL COMMENT '문제 데이터 (JSON 형식)',
    timecreated BIGINT(10) UNSIGNED NOT NULL COMMENT '생성 시간',
    timemodified BIGINT(10) UNSIGNED NOT NULL COMMENT '수정 시간',
    UNIQUE KEY mdl_quesrela_que_uix (questionid),
    CONSTRAINT fk_relationlines_question
        FOREIGN KEY (questionid)
        REFERENCES mdl_question(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relation Lines 문제 데이터 저장 테이블';

-- ============================================
-- 2. 샘플 문제 데이터 삽입
-- ============================================

-- 샘플 문제 1: 분수와 소수 매칭
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
    1,
    0,
    '분수와 소수 매칭하기',
    '같은 값을 가진 분수와 소수를 연결하세요.',
    1,
    '분수를 소수로 변환할 때는 분자를 분모로 나누면 됩니다.',
    1,
    'relationlines',
    1,
    CONCAT('localhost+', UNIX_TIMESTAMP()),
    CONCAT('localhost+', UNIX_TIMESTAMP()),
    0,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    2,
    2
);

SET @question1_id = LAST_INSERT_ID();

INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    @question1_id,
    '{
        "leftNumbers": ["1/2", "1/4", "3/4", "1/5", "2/5"],
        "rightNumbers": ["0.5", "0.25", "0.75", "0.2", "0.4"],
        "correctAnswers": {
            "1/2": "0.5",
            "1/4": "0.25",
            "3/4": "0.75",
            "1/5": "0.2",
            "2/5": "0.4"
        }
    }',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 샘플 문제 2: 곱셈구구 연결
INSERT INTO mdl_question (
    category, parent, name, questiontext, questiontextformat,
    generalfeedback, generalfeedbackformat, qtype, length,
    stamp, version, hidden, timecreated, timemodified, createdby, modifiedby
) VALUES (
    1, 0, '곱셈구구 연결하기', '왼쪽 식과 오른쪽 답을 연결하세요.', 1,
    '곱셈은 같은 수를 여러 번 더하는 것과 같습니다.', 1, 'relationlines', 1,
    CONCAT('localhost+', UNIX_TIMESTAMP()), CONCAT('localhost+', UNIX_TIMESTAMP()),
    0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2
);

SET @question2_id = LAST_INSERT_ID();

INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    @question2_id,
    '{
        "leftNumbers": ["2 × 3", "3 × 4", "4 × 5", "5 × 6", "6 × 7"],
        "rightNumbers": ["6", "12", "20", "30", "42"],
        "correctAnswers": {
            "2 × 3": "6",
            "3 × 4": "12",
            "4 × 5": "20",
            "5 × 6": "30",
            "6 × 7": "42"
        }
    }',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 샘플 문제 3: 영어 단어와 뜻 연결
INSERT INTO mdl_question (
    category, parent, name, questiontext, questiontextformat,
    generalfeedback, generalfeedbackformat, qtype, length,
    stamp, version, hidden, timecreated, timemodified, createdby, modifiedby
) VALUES (
    1, 0, '영어 단어와 뜻 연결하기', '영어 단어와 한글 뜻을 연결하세요.', 1,
    '영어 단어의 뜻을 정확히 알아두는 것이 중요합니다.', 1, 'relationlines', 1,
    CONCAT('localhost+', UNIX_TIMESTAMP()), CONCAT('localhost+', UNIX_TIMESTAMP()),
    0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2
);

SET @question3_id = LAST_INSERT_ID();

INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    @question3_id,
    '{
        "leftNumbers": ["Apple", "Book", "Cat", "Dog", "Eye"],
        "rightNumbers": ["사과", "책", "고양이", "개", "눈"],
        "correctAnswers": {
            "Apple": "사과",
            "Book": "책",
            "Cat": "고양이",
            "Dog": "개",
            "Eye": "눈"
        }
    }',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 샘플 문제 4: 도형과 면의 개수
INSERT INTO mdl_question (
    category, parent, name, questiontext, questiontextformat,
    generalfeedback, generalfeedbackformat, qtype, length,
    stamp, version, hidden, timecreated, timemodified, createdby, modifiedby
) VALUES (
    1, 0, '도형과 면의 개수', '도형과 면의 개수를 연결하세요.', 1,
    '도형의 특징을 이해하면 기하학을 더 잘 이해할 수 있습니다.', 1, 'relationlines', 1,
    CONCAT('localhost+', UNIX_TIMESTAMP()), CONCAT('localhost+', UNIX_TIMESTAMP()),
    0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2
);

SET @question4_id = LAST_INSERT_ID();

INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    @question4_id,
    '{
        "leftNumbers": ["삼각형", "사각형", "오각형", "육각형", "원"],
        "rightNumbers": ["3", "4", "5", "6", "무한"],
        "correctAnswers": {
            "삼각형": "3",
            "사각형": "4",
            "오각형": "5",
            "육각형": "6",
            "원": "무한"
        }
    }',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 샘플 문제 5: 국가와 수도 연결
INSERT INTO mdl_question (
    category, parent, name, questiontext, questiontextformat,
    generalfeedback, generalfeedbackformat, qtype, length,
    stamp, version, hidden, timecreated, timemodified, createdby, modifiedby
) VALUES (
    1, 0, '국가와 수도 연결하기', '국가와 수도를 연결하세요.', 1,
    '세계 지리를 배우는 것은 국제 감각을 키우는데 도움이 됩니다.', 1, 'relationlines', 1,
    CONCAT('localhost+', UNIX_TIMESTAMP()), CONCAT('localhost+', UNIX_TIMESTAMP()),
    0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2
);

SET @question5_id = LAST_INSERT_ID();

INSERT INTO mdl_question_relationlines (questionid, data, timecreated, timemodified)
VALUES (
    @question5_id,
    '{
        "leftNumbers": ["한국", "일본", "중국", "미국", "영국"],
        "rightNumbers": ["서울", "도쿄", "베이징", "워싱턴", "런던"],
        "correctAnswers": {
            "한국": "서울",
            "일본": "도쿄",
            "중국": "베이징",
            "미국": "워싱턴",
            "영국": "런던"
        }
    }',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- ============================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================

-- 문제 ID로 빠른 검색을 위한 인덱스 (이미 UNIQUE KEY로 생성됨)
-- ALTER TABLE mdl_question_relationlines ADD INDEX idx_questionid (questionid);

-- 시간 기반 검색을 위한 인덱스
ALTER TABLE mdl_question_relationlines ADD INDEX idx_timecreated (timecreated);
ALTER TABLE mdl_question_relationlines ADD INDEX idx_timemodified (timemodified);

-- ============================================
-- 4. 권한 설정 (선택사항)
-- ============================================

-- 웹 서버에서 사용할 MySQL 사용자 생성 (이미 있다면 생략)
-- CREATE USER IF NOT EXISTS 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';

-- 테이블 접근 권한 부여
-- GRANT SELECT, INSERT, UPDATE ON moodle.mdl_question TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON moodle.mdl_question_relationlines TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- 5. 확인 쿼리
-- ============================================

-- 생성된 테이블 확인
SHOW CREATE TABLE mdl_question_relationlines;

-- 삽입된 샘플 문제 확인
SELECT
    q.id,
    q.name,
    q.questiontext,
    qr.data
FROM mdl_question q
JOIN mdl_question_relationlines qr ON q.id = qr.questionid
WHERE q.qtype = 'relationlines';

-- ============================================
-- 완료 메시지
-- ============================================

SELECT '✅ Relation Lines 테이블 및 샘플 데이터가 성공적으로 생성되었습니다!' AS status;
SELECT CONCAT('총 ', COUNT(*), '개의 샘플 문제가 추가되었습니다.') AS message
FROM mdl_question
WHERE qtype = 'relationlines';
