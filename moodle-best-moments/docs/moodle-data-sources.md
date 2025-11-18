# Moodle 데이터 소스 분석

## 개요
이 문서는 Moodle 3.7 데이터베이스에서 학습 활동 데이터를 추출하는 방법을 설명합니다.

## 주요 Moodle 테이블

### 1. 로그 시스템 (mdl_logstore_standard_log)
모든 학습 활동의 상세 로그를 저장합니다.

```sql
-- 오늘 특정 사용자의 모든 활동 조회
SELECT
    l.id,
    l.eventname,
    l.component,
    l.action,
    l.target,
    l.objecttable,
    l.objectid,
    l.contextid,
    l.userid,
    l.timecreated,
    l.other
FROM mdl_logstore_standard_log l
WHERE l.userid = ?
  AND l.timecreated >= ?  -- 오늘 00:00:00
  AND l.timecreated < ?   -- 내일 00:00:00
ORDER BY l.timecreated DESC;
```

**주요 이벤트:**
- `\mod_quiz\event\attempt_submitted` - 퀴즈 제출
- `\mod_assign\event\submission_created` - 과제 제출
- `\mod_forum\event\post_created` - 포럼 게시
- `\mod_lesson\event\lesson_ended` - 레슨 완료

### 2. 퀴즈 시도 (mdl_quiz_attempts)
퀴즈 시도 및 결과 정보

```sql
-- 사용자의 퀴즈 시도 분석
SELECT
    qa.id,
    qa.quiz,
    qa.userid,
    qa.attempt,
    qa.sumgrades,
    qa.timestart,
    qa.timefinish,
    qa.timemodified,
    (qa.timefinish - qa.timestart) as time_spent,
    q.name as quiz_name,
    q.grade as max_grade
FROM mdl_quiz_attempts qa
JOIN mdl_quiz q ON q.id = qa.quiz
WHERE qa.userid = ?
  AND qa.state = 'finished'
  AND qa.timefinish >= ?
  AND qa.timefinish < ?
ORDER BY qa.attempt;
```

**분석 포인트:**
- 시도 횟수별 점수 향상도
- 문제당 소요 시간
- 정답률 변화

### 3. 퀴즈 응답 상세 (mdl_question_attempts)
개별 문제에 대한 응답

```sql
-- 퀴즈 시도의 각 문제 응답 분석
SELECT
    qas.id,
    qas.questionattemptid,
    qas.sequencenumber,
    qas.state,
    qas.fraction,
    qas.timecreated,
    q.questiontext,
    q.qtype
FROM mdl_question_attempt_steps qas
JOIN mdl_question_attempts qa ON qa.id = qas.questionattemptid
JOIN mdl_question q ON g.id = qa.questionid
WHERE qa.questionusageid IN (
    SELECT uniqueid FROM mdl_quiz_attempts WHERE userid = ? AND timefinish >= ?
)
ORDER BY qas.timecreated;
```

**창의성 지표:**
- 여러 접근 방법 시도
- 부분 점수 획득 패턴
- 오답 후 정답까지의 과정

### 4. 과제 제출 (mdl_assign_submission)
과제 제출 정보

```sql
-- 사용자의 과제 제출 분석
SELECT
    asub.id,
    asub.assignment,
    asub.userid,
    asub.status,
    asub.attemptnumber,
    asub.timemodified,
    asub.timecreated,
    a.name as assignment_name,
    a.duedate,
    (a.duedate - asub.timemodified) as submitted_before_due
FROM mdl_assign_submission asub
JOIN mdl_assign a ON a.id = asub.assignment
WHERE asub.userid = ?
  AND asub.status = 'submitted'
  AND asub.timemodified >= ?
  AND asub.timemodified < ?;
```

**분석 포인트:**
- 제출 시도 횟수
- 마감일 대비 제출 시간
- 수정/개선 횟수

### 5. 포럼 활동 (mdl_forum_posts)
포럼 게시글 및 토론

```sql
-- 사용자의 포럼 활동 분석
SELECT
    fp.id,
    fp.discussion,
    fp.parent,
    fp.userid,
    fp.created,
    fp.modified,
    fp.subject,
    fp.message,
    LENGTH(fp.message) as message_length,
    fd.name as discussion_name,
    f.name as forum_name
FROM mdl_forum_posts fp
JOIN mdl_forum_discussions fd ON fd.id = fp.discussion
JOIN mdl_forum f ON f.id = fd.forum
WHERE fp.userid = ?
  AND fp.created >= ?
  AND fp.created < ?
ORDER BY fp.created;
```

**협업 지표:**
- 응답 수 (parent IS NOT NULL)
- 토론 시작 수 (parent IS NULL)
- 메시지 품질 (길이, 인용, 질문)

### 6. 성적 정보 (mdl_grade_grades)
전반적인 성적 데이터

```sql
-- 사용자의 성적 추이 분석
SELECT
    gg.id,
    gg.itemid,
    gg.userid,
    gg.rawgrade,
    gg.finalgrade,
    gg.timemodified,
    gi.itemname,
    gi.itemtype,
    gi.itemmodule,
    gi.grademax
FROM mdl_grade_grades gg
JOIN mdl_grade_items gi ON gi.id = gg.itemid
WHERE gg.userid = ?
  AND gg.timemodified >= ?
  AND gg.timemodified < ?
ORDER BY gg.timemodified;
```

**개선도 측정:**
- 이전 성적 대비 향상
- 과목별 성적 추이
- 목표 달성률

### 7. 레슨 활동 (mdl_lesson_attempts)
레슨 모듈 학습 기록

```sql
-- 레슨 시도 분석
SELECT
    la.id,
    la.lessonid,
    la.userid,
    la.pageid,
    la.correct,
    la.timeseen,
    la.retry,
    l.name as lesson_name,
    lp.title as page_title
FROM mdl_lesson_attempts la
JOIN mdl_lesson l ON l.id = la.lessonid
JOIN mdl_lesson_pages lp ON lp.id = la.pageid
WHERE la.userid = ?
  AND la.timeseen >= ?
  AND la.timeseen < ?
ORDER BY la.timeseen;
```

**지속성 지표:**
- 재시도 횟수 (retry)
- 어려운 페이지에서의 시간
- 완료율

## 데이터 추출 전략

### 단계 1: 활동 수집
1. 로그 테이블에서 오늘의 모든 활동 이벤트 추출
2. 활동 유형별로 그룹화
3. 중복 제거 및 유효성 검증

### 단계 2: 상세 데이터 조회
각 활동 유형별로 상세 테이블 조인:
- Quiz → quiz_attempts + question_attempts
- Assignment → assign_submission
- Forum → forum_posts
- Lesson → lesson_attempts

### 단계 3: 점수 계산
5가지 평가 기준별 점수 산출:
1. **효율성**: 시도 횟수 / 성공률
2. **창의성**: 독특한 접근 방법 수
3. **개선도**: 현재 성적 - 이전 평균
4. **지속성**: 어려운 과제에 대한 재시도
5. **협업**: 포럼/그룹 활동 참여도

### 단계 4: 순위 결정
- 가중 평균 점수 계산
- 임계값 이상인 활동만 선택
- 상위 N개 추출

## 성능 최적화

### 인덱스 활용
```sql
-- 자주 사용하는 쿼리에 대한 복합 인덱스
CREATE INDEX idx_log_user_time ON mdl_logstore_standard_log(userid, timecreated);
CREATE INDEX idx_quiz_user_time ON mdl_quiz_attempts(userid, timefinish);
CREATE INDEX idx_assign_user_time ON mdl_assign_submission(userid, timemodified);
CREATE INDEX idx_forum_user_time ON mdl_forum_posts(userid, created);
```

### 배치 처리
- 한 번에 여러 사용자 데이터 조회
- JOIN을 통해 쿼리 횟수 최소화
- 결과 캐싱

### 시간 범위 제한
- 항상 시간 범위 조건 포함
- UNIX timestamp 사용
- 파티션 활용 (가능한 경우)

## 데이터 무결성

### 검증 규칙
1. userid는 mdl_user에 존재해야 함
2. courseid는 mdl_course에 존재해야 함
3. timecreated/timemodified는 유효한 범위 내
4. 점수는 0-100 사이

### 예외 처리
- 삭제된 사용자/코스 처리
- NULL 값 처리
- 비정상적인 시간 값 필터링

## 보안 고려사항

1. **권한 확인**: 조회 전 사용자 권한 검증
2. **SQL Injection 방지**: 항상 파라미터 바인딩 사용
3. **개인정보 보호**: 최소 필요 데이터만 수집
4. **감사 로그**: 모든 데이터 접근 기록
