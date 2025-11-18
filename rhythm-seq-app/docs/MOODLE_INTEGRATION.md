# Moodle 3.7 통합 가이드

이 문서는 Rhythm Seq 앱을 Moodle 3.7 LMS와 통합하는 상세한 방법을 설명합니다.

## 목차

1. [Moodle 데이터베이스 구조](#moodle-데이터베이스-구조)
2. [문제 생성 방법](#문제-생성-방법)
3. [API 연동 상세](#api-연동-상세)
4. [사용자 인증 통합](#사용자-인증-통합)
5. [문제 해결](#문제-해결)

## Moodle 데이터베이스 구조

### 주요 테이블

Rhythm Seq는 다음 Moodle 테이블을 사용합니다:

#### 1. mdl_question
문제 정보를 저장하는 메인 테이블

```sql
-- 주요 컬럼
id              -- 문제 고유 ID
category        -- 문제 카테고리 ID
name            -- 문제 제목
questiontext    -- 문제 내용 (HTML)
qtype           -- 문제 유형 (shortanswer, numerical, essay 등)
createdby       -- 생성자 ID
timecreated     -- 생성 시간
timemodified    -- 수정 시간
```

#### 2. mdl_question_categories
문제 카테고리 정보

```sql
-- 주요 컬럼
id              -- 카테고리 ID
name            -- 카테고리 이름
contextid       -- 컨텍스트 ID
info            -- 카테고리 설명
parent          -- 부모 카테고리 ID
```

#### 3. mdl_question_answers
문제 답안 정보

```sql
-- 주요 컬럼
id              -- 답안 ID
question        -- 문제 ID (외래키)
answer          -- 답안 내용
fraction        -- 점수 비율
feedback        -- 피드백
```

### 데이터베이스 조회 예시

```sql
-- 모든 수열 문제 조회
SELECT
    q.id,
    q.name AS title,
    q.questiontext AS content,
    qc.name AS category,
    qa.answer AS correct_answer
FROM mdl_question q
LEFT JOIN mdl_question_categories qc ON q.category = qc.id
LEFT JOIN mdl_question_answers qa ON q.id = qa.question
WHERE q.qtype IN ('shortanswer', 'numerical', 'essay')
    AND (q.questiontext LIKE '%수열%'
         OR q.questiontext LIKE '%sequence%'
         OR q.name LIKE '%수열%')
ORDER BY q.timecreated DESC;
```

## 문제 생성 방법

### Moodle 관리자 패널에서 문제 생성

#### 1. 카테고리 생성

1. Moodle 관리자로 로그인
2. **사이트 관리 → 문제은행 → 카테고리**로 이동
3. "수열 학습" 카테고리 생성

#### 2. 문제 생성

**방법 1: 대괄호 형식 (권장)**

```
제목: 홀수 수열 찾기
내용: 다음 홀수 수열의 패턴을 분석해보세요: [1, 3, 5, 7, 9, 11, 13, 15]
```

**방법 2: 텍스트 형식**

```
제목: 등차수열 연습
내용: 다음 등차수열을 확인하세요.
수열: 2, 4, 6, 8, 10, 12, 14, 16
공차는 얼마입니까?
```

**방법 3: 영문 형식**

```
Title: Arithmetic Sequence
Content: Analyze the following sequence: 5, 10, 15, 20, 25, 30
```

### SQL로 직접 문제 삽입 (개발/테스트용)

```sql
-- 카테고리 생성
INSERT INTO mdl_question_categories (name, contextid, info, parent, sortorder)
VALUES ('수열 학습', 1, '리듬 수열 앱용 문제', 0, 1);

-- 문제 생성
INSERT INTO mdl_question (
    category,
    name,
    questiontext,
    qtype,
    createdby,
    timecreated,
    timemodified
) VALUES (
    (SELECT id FROM mdl_question_categories WHERE name = '수열 학습'),
    '홀수 수열 패턴',
    '<p>다음 수열의 규칙을 찾아보세요: [1, 3, 5, 7, 9, 11, 13, 15]</p>',
    'shortanswer',
    2,  -- 사용자 ID (admin은 보통 2)
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);
```

### 수열 패턴 예시

#### 등차수열
```
[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
[5, 10, 15, 20, 25, 30, 35, 40]
[1, 4, 7, 10, 13, 16, 19, 22]
```

#### 등비수열
```
[2, 4, 8, 16, 32, 64, 128]
[3, 9, 27, 81, 243]
[1, 2, 4, 8, 16, 32]
```

#### 피보나치 수열
```
[1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

#### 제곱수 수열
```
[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

## API 연동 상세

### API 엔드포인트

#### 1. 문제 목록 조회

**요청**
```
GET /rhythm-seq-app/api/get_questions.php?limit=20
```

**응답**
```json
{
  "success": true,
  "count": 5,
  "questions": [
    {
      "id": 1,
      "title": "홀수 수열 패턴",
      "text": "다음 수열의 규칙을 찾아보세요: [1, 3, 5, 7, 9, 11, 13, 15]",
      "category": "수열 학습",
      "sequence": [1, 3, 5, 7, 9, 11, 13, 15]
    }
  ]
}
```

#### 2. 특정 문제 조회

**요청**
```
GET /rhythm-seq-app/api/get_questions.php?id=1
```

**응답**
```json
{
  "success": true,
  "question": {
    "id": 1,
    "title": "홀수 수열 패턴",
    "text": "다음 수열의 규칙을 찾아보세요: [1, 3, 5, 7, 9, 11, 13, 15]",
    "category": "수열 학습",
    "sequence": [1, 3, 5, 7, 9, 11, 13, 15]
  }
}
```

#### 3. 카테고리별 문제 조회

**요청**
```
GET /rhythm-seq-app/api/get_questions.php?category=5&limit=10
```

### 에러 처리

**데이터베이스 오류**
```json
{
  "success": false,
  "error": "Database Connection Failed"
}
```

**문제 없음**
```json
{
  "success": false,
  "error": "Question not found"
}
```

## 사용자 인증 통합

### Moodle 세션 활용

Rhythm Seq를 Moodle 사용자 인증과 통합하려면 다음을 추가하세요:

#### config.php 수정

```php
<?php
// Moodle 설정 파일 로드
require_once('/path/to/moodle/config.php');
require_once($CFG->libdir . '/moodlelib.php');

// 로그인 확인
require_login();

// 현재 사용자 정보
global $USER;
$userid = $USER->id;
$username = $USER->username;
$useremail = $USER->email;

// 권한 확인
if (!has_capability('mod/quiz:attempt', context_system::instance())) {
    print_error('nopermission');
}
?>
```

#### api/get_questions.php 수정

```php
<?php
require_once '../config.php';

// 사용자별 문제 조회 (본인이 생성한 문제만)
$stmt = $pdo->prepare("
    SELECT q.*
    FROM " . DB_PREFIX . "question q
    WHERE q.createdby = :userid
    ORDER BY q.timecreated DESC
");
$stmt->execute(['userid' => $userid]);
```

### 독립 실행형 인증 (간단한 방법)

Moodle과 별도로 간단한 인증을 구현:

```php
<?php
// auth.php
session_start();

function check_moodle_user($username, $password) {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("
        SELECT id, username, email
        FROM " . DB_PREFIX . "user
        WHERE username = :username
        AND auth = 'manual'
    ");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if ($user && validate_internal_user_password($user, $password)) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        return true;
    }

    return false;
}

function validate_internal_user_password($user, $password) {
    // Moodle 비밀번호 검증 로직
    // password_verify() 사용
    return true; // 간소화된 예시
}
?>
```

## 고급 기능

### 1. 학생 진도 저장

```sql
-- 진도 테이블 생성
CREATE TABLE mdl_rhythmseq_progress (
    id BIGINT(10) AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) NOT NULL,
    questionid BIGINT(10) NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    score INT(3) DEFAULT 0,
    timecompleted BIGINT(10),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (questionid) REFERENCES mdl_question(id)
);
```

### 2. 학습 통계 수집

```php
<?php
// api/save_progress.php
require_once '../config.php';

$userid = $_SESSION['user_id'];
$questionid = $_POST['question_id'];
$completed = $_POST['completed'];
$score = $_POST['score'];

$stmt = $pdo->prepare("
    INSERT INTO " . DB_PREFIX . "rhythmseq_progress
    (userid, questionid, completed, score, timecompleted)
    VALUES (:userid, :questionid, :completed, :score, :time)
    ON DUPLICATE KEY UPDATE
    completed = :completed,
    score = :score,
    timecompleted = :time
");

$stmt->execute([
    'userid' => $userid,
    'questionid' => $questionid,
    'completed' => $completed,
    'score' => $score,
    'time' => time()
]);
?>
```

### 3. 선생님 대시보드

```php
<?php
// teacher_dashboard.php
$stmt = $pdo->prepare("
    SELECT
        u.username,
        q.name AS question,
        p.completed,
        p.score,
        FROM_UNIXTIME(p.timecompleted) AS completed_at
    FROM " . DB_PREFIX . "rhythmseq_progress p
    JOIN " . DB_PREFIX . "user u ON p.userid = u.id
    JOIN " . DB_PREFIX . "question q ON p.questionid = q.id
    ORDER BY p.timecompleted DESC
");
$stmt->execute();
$progress_data = $stmt->fetchAll();
?>
```

## 문제 해결

### 1. 연결 오류

**증상**: "Database Connection Failed" 에러

**해결**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# Moodle config.php에서 DB 정보 확인
cat /path/to/moodle/config.php | grep dbhost
cat /path/to/moodle/config.php | grep dbname
cat /path/to/moodle/config.php | grep dbuser

# 연결 테스트
mysql -h localhost -u moodleuser -p moodle
```

### 2. 권한 오류

**증상**: "Access denied" 에러

**해결**:
```sql
-- DB 사용자 권한 확인
SHOW GRANTS FOR 'moodleuser'@'localhost';

-- SELECT 권한 부여
GRANT SELECT ON moodle.* TO 'moodleuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 문제가 표시되지 않음

**해결**:
```sql
-- 문제 데이터 확인
SELECT COUNT(*) FROM mdl_question;

-- 문제 유형 확인
SELECT DISTINCT qtype FROM mdl_question;

-- 테스트 문제 삽입
INSERT INTO mdl_question (category, name, questiontext, qtype, createdby, timecreated, timemodified)
VALUES (1, '테스트 수열', '<p>[1, 2, 3, 4, 5]</p>', 'shortanswer', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### 4. 한글 인코딩 문제

**해결**:
```php
// config.php에 추가
header('Content-Type: text/html; charset=utf-8');

// MySQL 연결 시 charset 설정
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
```

## 성능 최적화

### 1. 인덱스 추가

```sql
-- 문제 조회 성능 향상
CREATE INDEX idx_question_type ON mdl_question(qtype);
CREATE INDEX idx_question_category ON mdl_question(category);
CREATE INDEX idx_question_created ON mdl_question(timecreated);
```

### 2. 쿼리 캐싱

```php
// PHP에서 Redis 캐싱 사용
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

$cache_key = 'questions_list';
$cached = $redis->get($cache_key);

if ($cached) {
    $questions = json_decode($cached, true);
} else {
    // DB에서 조회
    $questions = fetch_questions_from_db();
    $redis->setex($cache_key, 3600, json_encode($questions)); // 1시간 캐시
}
```

## 참고 자료

- [Moodle 3.7 개발 문서](https://docs.moodle.org/dev/Main_Page)
- [Moodle 데이터베이스 스키마](https://docs.moodle.org/dev/Database_Schema)
- [Moodle Question Bank API](https://docs.moodle.org/dev/Question_Bank)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Moodle Version**: 3.7
