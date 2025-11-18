-- Stat Art View 테스트용 샘플 데이터
-- Moodle 3.7 데이터베이스에 샘플 데이터 삽입

-- ============================================================
-- 1. 샘플 코스 생성
-- ============================================================

INSERT INTO mdl_course (id, category, fullname, shortname, summary, timecreated, timemodified) VALUES
(10, 1, '초등학교 3학년 수학', 'MATH-G3', '분수와 도형을 배우는 초등학교 3학년 수학 과정', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(11, 1, '초등학교 4학년 과학', 'SCI-G4', '생명과 물질을 탐구하는 초등학교 4학년 과학 과정', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================================
-- 2. 샘플 퀴즈 생성
-- ============================================================

INSERT INTO mdl_quiz (id, course, name, intro, timeopen, timeclose, timelimit, sumgrades, grade) VALUES
(100, 10, '분수의 이해 퀴즈', '분수의 개념과 기본 연산을 테스트합니다',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY)),
  UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 30 DAY)),
  1800, 100, 100),
(101, 10, '도형의 넓이 퀴즈', '삼각형과 사각형의 넓이를 구하는 문제',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 20 DAY)),
  UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 40 DAY)),
  1200, 50, 100);

-- ============================================================
-- 3. 샘플 학생 생성
-- ============================================================

INSERT INTO mdl_user (id, username, firstname, lastname, email, timecreated, timemodified) VALUES
(1001, 'student01', '민수', '김', 'minsu@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1002, 'student02', '지혜', '이', 'jihye@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1003, 'student03', '현우', '박', 'hyunwoo@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1004, 'student04', '서연', '최', 'seoyeon@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1005, 'student05', '도윤', '정', 'doyun@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1006, 'student06', '하은', '강', 'haeun@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1007, 'student07', '시우', '조', 'siwoo@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1008, 'student08', '수아', '윤', 'sua@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1009, 'student09', '예준', '장', 'yejun@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1010, 'student10', '지우', '임', 'jiwoo@example.com', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================================
-- 4. 샘플 문제 생성
-- ============================================================

INSERT INTO mdl_question (id, category, name, questiontext, qtype, defaultmark, timecreated, timemodified) VALUES
-- 분수 퀴즈 문제들
(2001, 1, '분수의 기본', '1/2 + 1/4는 무엇인가요?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2002, 1, '분수 비교', '2/3과 3/4 중 어느 것이 더 큰가요?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2003, 1, '분수 곱셈', '1/2 × 2/3은 무엇인가요?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2004, 1, '분수 나눗셈', '1/2 ÷ 1/4는 무엇인가요?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2005, 1, '대분수', '3 1/2를 가분수로 나타내면?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2006, 1, '분수 단순화', '6/8을 기약분수로 나타내면?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2007, 1, '분수와 소수', '1/4를 소수로 나타내면?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2008, 1, '분수 덧셈 응용', '1/3 + 1/6 + 1/2는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2009, 1, '분수 문제 해결', '피자 1판의 3/4를 먹었습니다. 남은 피자는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2010, 1, '분수의 활용', '2/5 미터 리본을 3개 이으면 몇 미터?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),

-- 도형 퀴즈 문제들
(2011, 1, '삼각형 넓이', '밑변 6cm, 높이 4cm인 삼각형의 넓이는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2012, 1, '사각형 넓이', '가로 8cm, 세로 5cm인 직사각형의 넓이는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2013, 1, '정사각형 넓이', '한 변의 길이가 7cm인 정사각형의 넓이는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2014, 1, '평행사변형 넓이', '밑변 10cm, 높이 6cm인 평행사변형의 넓이는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2015, 1, '사다리꼴 넓이', '윗변 4cm, 아랫변 8cm, 높이 5cm인 사다리꼴의 넓이는?', 'multichoice', 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================================
-- 5. 퀴즈-문제 매핑 (Quiz Slots)
-- ============================================================

INSERT INTO mdl_quiz_slots (id, quizid, slot, questionid, page, maxmark) VALUES
-- 분수 퀴즈 (ID: 100)
(3001, 100, 1, 2001, 1, 10),
(3002, 100, 2, 2002, 1, 10),
(3003, 100, 3, 2003, 2, 10),
(3004, 100, 4, 2004, 2, 10),
(3005, 100, 5, 2005, 3, 10),
(3006, 100, 6, 2006, 3, 10),
(3007, 100, 7, 2007, 4, 10),
(3008, 100, 8, 2008, 4, 10),
(3009, 100, 9, 2009, 5, 10),
(3010, 100, 10, 2010, 5, 10),

-- 도형 퀴즈 (ID: 101)
(3011, 101, 1, 2011, 1, 10),
(3012, 101, 2, 2012, 1, 10),
(3013, 101, 3, 2013, 2, 10),
(3014, 101, 4, 2014, 2, 10),
(3015, 101, 5, 2015, 3, 10);

-- ============================================================
-- 6. 샘플 퀴즈 시도 생성 (Quiz Attempts)
-- ============================================================

-- 학생들의 다양한 시도 기록 생성
-- 시간대를 분산시켜 히트맵 데이터 생성

-- 학생 1001 (민수) - 우수 학생
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4001, 100, 1001, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 25 DAY)) + (9 * 3600),  -- 9시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 25 DAY)) + (9 * 3600) + 1200,
  95),
(4002, 101, 1001, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 15 DAY)) + (10 * 3600), -- 10시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 15 DAY)) + (10 * 3600) + 900,
  48);

-- 학생 1002 (지혜) - 우수 학생
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4003, 100, 1002, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 DAY)) + (14 * 3600), -- 14시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 DAY)) + (14 * 3600) + 1100,
  92),
(4004, 101, 1002, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 14 DAY)) + (15 * 3600), -- 15시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 14 DAY)) + (15 * 3600) + 850,
  46);

-- 학생 1003 (현우) - 중간 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4005, 100, 1003, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 23 DAY)) + (16 * 3600), -- 16시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 23 DAY)) + (16 * 3600) + 1400,
  78),
(4006, 101, 1003, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 13 DAY)) + (17 * 3600), -- 17시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 13 DAY)) + (17 * 3600) + 1000,
  38);

-- 학생 1004 (서연) - 우수 학생
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4007, 100, 1004, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 22 DAY)) + (19 * 3600), -- 19시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 22 DAY)) + (19 * 3600) + 1050,
  88),
(4008, 101, 1004, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 12 DAY)) + (20 * 3600), -- 20시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 12 DAY)) + (20 * 3600) + 920,
  45);

-- 학생 1005 (도윤) - 보통 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4009, 100, 1005, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 21 DAY)) + (11 * 3600), -- 11시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 21 DAY)) + (11 * 3600) + 1500,
  72),
(4010, 101, 1005, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 11 DAY)) + (13 * 3600), -- 13시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 11 DAY)) + (13 * 3600) + 1100,
  35);

-- 학생 1006 (하은) - 중상 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4011, 100, 1006, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 20 DAY)) + (10 * 3600), -- 10시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 20 DAY)) + (10 * 3600) + 1250,
  85),
(4012, 101, 1006, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 10 DAY)) + (14 * 3600), -- 14시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 10 DAY)) + (14 * 3600) + 950,
  42);

-- 학생 1007 (시우) - 보통 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4013, 100, 1007, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 19 DAY)) + (15 * 3600), -- 15시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 19 DAY)) + (15 * 3600) + 1350,
  70),
(4014, 101, 1007, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 9 DAY)) + (16 * 3600),  -- 16시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 9 DAY)) + (16 * 3600) + 1050,
  33);

-- 학생 1008 (수아) - 우수 학생
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4015, 100, 1008, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 18 DAY)) + (9 * 3600),  -- 9시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 18 DAY)) + (9 * 3600) + 1150,
  90),
(4016, 101, 1008, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 8 DAY)) + (11 * 3600),  -- 11시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 8 DAY)) + (11 * 3600) + 880,
  47);

-- 학생 1009 (예준) - 중하 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4017, 100, 1009, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 17 DAY)) + (13 * 3600), -- 13시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 17 DAY)) + (13 * 3600) + 1450,
  65),
(4018, 101, 1009, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) + (15 * 3600),  -- 15시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) + (15 * 3600) + 1150,
  30);

-- 학생 1010 (지우) - 중간 수준
INSERT INTO mdl_quiz_attempts (id, quiz, userid, attempt, state, timestart, timefinish, sumgrades) VALUES
(4019, 100, 1010, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 16 DAY)) + (17 * 3600), -- 17시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 16 DAY)) + (17 * 3600) + 1300,
  75),
(4020, 101, 1010, 1, 'finished',
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 DAY)) + (19 * 3600),  -- 19시
  UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 DAY)) + (19 * 3600) + 1020,
  40);

-- ============================================================
-- 7. 문제별 시도 기록 샘플 (간소화)
-- ============================================================

-- 각 문제에 대한 정답/오답 패턴 생성
-- 실제로는 mdl_question_attempts, mdl_question_attempt_steps 등
-- 더 복잡한 테이블 구조가 있지만, 여기서는 통계를 위한 핵심만 포함

-- 참고: 실제 Moodle에서는 question_attempts가 훨씬 복잡하므로
-- 이 샘플 데이터는 통계 조회 테스트용으로만 사용

-- ============================================================
-- 데이터 확인 쿼리
-- ============================================================

/*
-- 퀴즈별 통계 확인
SELECT
  q.id,
  q.name,
  COUNT(DISTINCT qa.userid) as students,
  COUNT(qa.id) as attempts,
  ROUND(AVG(qa.sumgrades), 2) as avg_score
FROM mdl_quiz q
LEFT JOIN mdl_quiz_attempts qa ON q.id = qa.quiz
WHERE qa.state = 'finished'
GROUP BY q.id;

-- 학생별 성적 확인
SELECT
  u.username,
  CONCAT(u.firstname, ' ', u.lastname) as name,
  q.name as quiz,
  qa.sumgrades as score,
  FROM_UNIXTIME(qa.timefinish) as finished_at
FROM mdl_quiz_attempts qa
JOIN mdl_user u ON qa.userid = u.id
JOIN mdl_quiz q ON qa.quiz = q.id
WHERE qa.state = 'finished'
ORDER BY qa.timefinish DESC;
*/
