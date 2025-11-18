-- ================================================
-- Moodle 데이터베이스 스키마 (접선 경사도 문제용)
-- MySQL 5.7 / Moodle 3.7
-- ================================================

-- 1. 접선 경사도 문제 설정 테이블
CREATE TABLE IF NOT EXISTS `mdl_question_tangent_config` (
  `id` bigint(10) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(10) NOT NULL,
  `function_type` varchar(50) NOT NULL COMMENT '함수 타입 (quadratic, cubic, sine, exponential, custom)',
  `custom_function` text DEFAULT NULL COMMENT '사용자 정의 함수 (function_type이 custom인 경우)',
  `x_point` decimal(10,4) DEFAULT NULL COMMENT '접선 위치 (x좌표)',
  `show_tangent` tinyint(1) DEFAULT 1 COMMENT '접선 표시 여부',
  `difficulty` varchar(20) DEFAULT 'medium' COMMENT '난이도 (easy, medium, hard)',
  `color_scheme` varchar(20) DEFAULT 'smooth' COMMENT '색상 스킴 (smooth, discrete, rainbow)',
  `timecreated` bigint(10) NOT NULL,
  `timemodified` bigint(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_questangconf_que_ix` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='접선 경사도 문제 설정';

-- 2. 기존 Moodle 테이블과의 연동
-- mdl_question 테이블에 새로운 문제 유형 추가

-- 샘플 데이터 삽입
INSERT INTO `mdl_question` (
  `category`,
  `name`,
  `questiontext`,
  `questiontextformat`,
  `qtype`,
  `length`,
  `stamp`,
  `version`,
  `hidden`,
  `timecreated`,
  `timemodified`,
  `createdby`,
  `modifiedby`
) VALUES
(1, '이차함수의 접선 1',
 '<p>함수 y = x²에서 x = 2일 때 접선의 기울기를 구하시오.</p>',
 1, 'tangent_slope', 1, 'kaist.edu', 'version_1.0', 0,
 UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2),

(1, '삼차함수의 접선 1',
 '<p>함수 y = x³ - 2x에서 x = 1일 때 접선의 기울기를 구하시오.</p>',
 1, 'tangent_slope', 1, 'kaist.edu', 'version_1.0', 0,
 UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2),

(1, '사인함수의 접선 1',
 '<p>함수 y = sin(x)에서 x = 0일 때 접선의 기울기를 구하시오.</p>',
 1, 'tangent_slope', 1, 'kaist.edu', 'version_1.0', 0,
 UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 2, 2);

-- 샘플 문제 설정 삽입
INSERT INTO `mdl_question_tangent_config` (
  `question_id`,
  `function_type`,
  `x_point`,
  `show_tangent`,
  `difficulty`,
  `color_scheme`,
  `timecreated`,
  `timemodified`
) VALUES
(LAST_INSERT_ID(), 'quadratic', 2.0, 1, 'easy', 'smooth', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(LAST_INSERT_ID()-1, 'cubic', 1.0, 1, 'medium', 'smooth', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(LAST_INSERT_ID()-2, 'sine', 0.0, 1, 'medium', 'smooth', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 샘플 정답 삽입
INSERT INTO `mdl_question_answers` (
  `question`,
  `answer`,
  `answerformat`,
  `fraction`,
  `feedback`,
  `feedbackformat`
) VALUES
-- 이차함수 (y = x², x = 2일 때 기울기 = 2*2 = 4)
((SELECT id FROM mdl_question WHERE name = '이차함수의 접선 1' LIMIT 1),
 '4', 1, 1.0, '<p>정답입니다! 미분하면 y\' = 2x이고, x=2를 대입하면 4입니다.</p>', 1),

-- 삼차함수 (y = x³ - 2x, x = 1일 때 기울기 = 3*1² - 2 = 1)
((SELECT id FROM mdl_question WHERE name = '삼차함수의 접선 1' LIMIT 1),
 '1', 1, 1.0, '<p>정답입니다! 미분하면 y\' = 3x² - 2이고, x=1을 대입하면 1입니다.</p>', 1),

-- 사인함수 (y = sin(x), x = 0일 때 기울기 = cos(0) = 1)
((SELECT id FROM mdl_question WHERE name = '사인함수의 접선 1' LIMIT 1),
 '1', 1, 1.0, '<p>정답입니다! 미분하면 y\' = cos(x)이고, x=0을 대입하면 1입니다.</p>', 1);

-- ================================================
-- 3. 학생 답안 기록 테이블 (선택사항)
-- ================================================

CREATE TABLE IF NOT EXISTS `mdl_question_tangent_attempts` (
  `id` bigint(10) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(10) NOT NULL,
  `user_id` bigint(10) NOT NULL,
  `user_answer` decimal(10,4) NOT NULL COMMENT '학생이 제출한 답',
  `correct_answer` decimal(10,4) NOT NULL COMMENT '정답',
  `is_correct` tinyint(1) NOT NULL COMMENT '정답 여부',
  `slope_color` varchar(50) DEFAULT NULL COMMENT '경사도 색상 (기록용)',
  `time_spent` int(11) DEFAULT NULL COMMENT '소요 시간 (초)',
  `attempt_count` int(11) DEFAULT 1 COMMENT '시도 횟수',
  `timecreated` bigint(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_questangattem_que_ix` (`question_id`),
  KEY `mdl_questangattem_use_ix` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='접선 경사도 문제 시도 기록';

-- ================================================
-- 4. 유용한 쿼리 예제
-- ================================================

-- 모든 접선 경사도 문제 조회
-- SELECT
--   q.id,
--   q.name,
--   q.questiontext,
--   tc.function_type,
--   tc.x_point,
--   tc.difficulty,
--   qa.answer
-- FROM mdl_question q
-- JOIN mdl_question_tangent_config tc ON q.id = tc.question_id
-- LEFT JOIN mdl_question_answers qa ON q.id = qa.question
-- WHERE q.qtype = 'tangent_slope'
-- ORDER BY tc.difficulty, q.id;

-- 특정 난이도의 문제 랜덤 선택
-- SELECT
--   q.id,
--   q.name,
--   tc.function_type,
--   tc.x_point
-- FROM mdl_question q
-- JOIN mdl_question_tangent_config tc ON q.id = tc.question_id
-- WHERE q.qtype = 'tangent_slope' AND tc.difficulty = 'medium'
-- ORDER BY RAND()
-- LIMIT 1;

-- 학생별 정답률 통계
-- SELECT
--   u.id,
--   u.username,
--   COUNT(*) as total_attempts,
--   SUM(ta.is_correct) as correct_count,
--   ROUND(SUM(ta.is_correct) / COUNT(*) * 100, 2) as accuracy_rate
-- FROM mdl_user u
-- JOIN mdl_question_tangent_attempts ta ON u.id = ta.user_id
-- GROUP BY u.id
-- ORDER BY accuracy_rate DESC;
