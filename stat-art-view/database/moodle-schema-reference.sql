-- Moodle 3.7 데이터베이스 스키마 참조
-- Stat Art View에서 사용하는 주요 테이블들

-- ============================================================
-- 1. 코스 관련 테이블
-- ============================================================

-- 코스 정보
-- mdl_course
-- - id: 코스 ID
-- - fullname: 코스 전체 이름
-- - shortname: 코스 약칭
-- - category: 카테고리 ID
-- - timecreated: 생성 시간
-- - timemodified: 수정 시간

-- ============================================================
-- 2. 퀴즈 관련 테이블
-- ============================================================

-- 퀴즈 메인 테이블
-- mdl_quiz
-- - id: 퀴즈 ID
-- - course: 코스 ID (FK)
-- - name: 퀴즈 이름
-- - intro: 퀴즈 설명
-- - timeopen: 시작 시간
-- - timeclose: 종료 시간
-- - timelimit: 제한 시간 (초)
-- - sumgrades: 총점
-- - grade: 최종 성적 (0-100 스케일)

-- 퀴즈 시도 기록
-- mdl_quiz_attempts
-- - id: 시도 ID
-- - quiz: 퀴즈 ID (FK)
-- - userid: 사용자 ID (FK)
-- - attempt: 시도 번호
-- - uniqueid: 고유 ID
-- - state: 상태 (inprogress, finished, abandoned)
-- - timestart: 시작 시간
-- - timefinish: 완료 시간
-- - timemodified: 수정 시간
-- - sumgrades: 획득 점수

-- 퀴즈 문제 배치
-- mdl_quiz_slots
-- - id: 슬롯 ID
-- - quizid: 퀴즈 ID (FK)
-- - slot: 순서 번호
-- - questionid: 문제 ID (FK)
-- - page: 페이지 번호
-- - maxmark: 최대 점수

-- ============================================================
-- 3. 문제 관련 테이블
-- ============================================================

-- 문제 정보
-- mdl_question
-- - id: 문제 ID
-- - category: 문제 카테고리 ID
-- - name: 문제 이름
-- - questiontext: 문제 내용
-- - qtype: 문제 유형 (multichoice, truefalse, shortanswer, essay 등)
-- - defaultmark: 기본 점수
-- - penalty: 오답 페널티
-- - timecreated: 생성 시간
-- - timemodified: 수정 시간

-- 문제 시도
-- mdl_question_attempts
-- - id: 시도 ID
-- - questionusageid: 사용 ID
-- - questionid: 문제 ID (FK)
-- - slot: 슬롯 번호
-- - behaviour: 행동 방식
-- - questionsummary: 문제 요약
-- - rightanswer: 정답
-- - responsesummary: 응답 요약
-- - timemodified: 수정 시간
-- - maxmark: 최대 점수
-- - minfraction: 최소 비율
-- - maxfraction: 최대 비율
-- - flagged: 플래그 여부

-- ============================================================
-- 4. 사용자 관련 테이블
-- ============================================================

-- 사용자 정보
-- mdl_user
-- - id: 사용자 ID
-- - username: 사용자명
-- - firstname: 이름
-- - lastname: 성
-- - email: 이메일
-- - timecreated: 생성 시간
-- - timemodified: 수정 시간

-- 코스 등록
-- mdl_user_enrolments
-- - id: 등록 ID
-- - enrolid: 등록 방법 ID
-- - userid: 사용자 ID (FK)
-- - timestart: 시작 시간
-- - timeend: 종료 시간
-- - timecreated: 생성 시간
-- - timemodified: 수정 시간

-- ============================================================
-- 5. 성적 관련 테이블
-- ============================================================

-- 성적 항목
-- mdl_grade_items
-- - id: 항목 ID
-- - courseid: 코스 ID (FK)
-- - itemtype: 항목 유형
-- - itemmodule: 모듈 이름
-- - iteminstance: 인스턴스 ID
-- - itemname: 항목 이름
-- - grademax: 최대 점수
-- - grademin: 최소 점수

-- 성적 기록
-- mdl_grade_grades
-- - id: 성적 ID
-- - itemid: 항목 ID (FK)
-- - userid: 사용자 ID (FK)
-- - rawgrade: 원점수
-- - finalgrade: 최종 점수
-- - timemodified: 수정 시간

-- ============================================================
-- Stat Art View를 위한 커스텀 쿼리 예시
-- ============================================================

-- 예시 1: 퀴즈별 전체 통계
/*
SELECT
  q.id as quiz_id,
  q.name as quiz_name,
  COUNT(DISTINCT qa.userid) as total_students,
  COUNT(qa.id) as total_attempts,
  AVG(qa.sumgrades) as average_score,
  MAX(qa.sumgrades) as max_score,
  MIN(qa.sumgrades) as min_score,
  STDDEV(qa.sumgrades) as score_stddev
FROM mdl_quiz q
LEFT JOIN mdl_quiz_attempts qa ON q.id = qa.quiz
WHERE q.id = ? AND qa.state = 'finished'
GROUP BY q.id;
*/

-- 예시 2: 문제별 정답률
/*
SELECT
  q.id as question_id,
  q.name as question_name,
  q.qtype,
  COUNT(qa.id) as total_attempts,
  SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) as correct_count,
  ROUND(
    SUM(CASE WHEN qa.rightanswer = qa.responsesummary THEN 1 ELSE 0 END) / COUNT(qa.id) * 100,
    2
  ) as correct_rate
FROM mdl_question q
LEFT JOIN mdl_question_attempts qa ON q.id = qa.questionid
WHERE q.id IN (
  SELECT questionid FROM mdl_quiz_slots WHERE quizid = ?
)
GROUP BY q.id;
*/

-- 예시 3: 시간대별 활동 분포 (히트맵용)
/*
SELECT
  DATE(FROM_UNIXTIME(qa.timefinish)) as date,
  HOUR(FROM_UNIXTIME(qa.timefinish)) as hour,
  COUNT(*) as activity_count,
  AVG(qa.sumgrades) as avg_score
FROM mdl_quiz_attempts qa
JOIN mdl_quiz q ON qa.quiz = q.id
WHERE q.course = ?
  AND qa.state = 'finished'
  AND FROM_UNIXTIME(qa.timefinish) BETWEEN ? AND ?
GROUP BY date, hour
ORDER BY date, hour;
*/
