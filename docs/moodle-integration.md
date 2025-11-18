# Moodle 3.7 Integration Guide

## 데이터베이스 스키마 참조

### 1. 로그 데이터 (mdl_logstore_standard_log)

Moodle 3.7에서는 `mdl_logstore_standard_log` 테이블을 사용합니다.

```sql
-- 사용자별 활동 로그 조회
SELECT
    l.id,
    l.eventname,
    l.component,
    l.action,
    l.target,
    l.timecreated,
    l.userid,
    u.firstname,
    u.lastname,
    c.fullname as coursename
FROM mdl_logstore_standard_log l
LEFT JOIN mdl_user u ON l.userid = u.id
LEFT JOIN mdl_course c ON l.courseid = c.id
WHERE l.userid = ? -- 사용자 ID
ORDER BY l.timecreated DESC
LIMIT 50;
```

**주요 필드:**
- `id`: 로그 고유 ID
- `eventname`: 이벤트 이름 (예: `\core\event\course_viewed`)
- `component`: 컴포넌트 이름 (예: `mod_quiz`)
- `action`: 수행된 액션 (예: `viewed`, `submitted`)
- `target`: 대상 객체 (예: `course`, `quiz`)
- `timecreated`: UNIX 타임스탬프
- `userid`: 사용자 ID
- `courseid`: 코스 ID

### 2. 퀴즈 시도 데이터 (mdl_quiz_attempts)

```sql
-- 사용자별 퀴즈 시도 기록
SELECT
    qa.id,
    qa.quiz,
    qa.userid,
    qa.attempt,
    qa.sumgrades,
    qa.timefinish,
    qa.timestart,
    qa.state,
    q.name as quizname,
    q.grade as maxgrade,
    u.firstname,
    u.lastname
FROM mdl_quiz_attempts qa
JOIN mdl_quiz q ON qa.quiz = q.id
JOIN mdl_user u ON qa.userid = u.id
WHERE qa.userid = ? -- 사용자 ID
  AND qa.state = 'finished' -- 완료된 시도만
ORDER BY qa.timefinish ASC;
```

**주요 필드:**
- `id`: 시도 고유 ID
- `quiz`: 퀴즈 ID
- `userid`: 사용자 ID
- `attempt`: 시도 횟수
- `sumgrades`: 획득 점수
- `timestart`: 시작 시간 (UNIX 타임스탬프)
- `timefinish`: 완료 시간 (UNIX 타임스탬프)
- `state`: 상태 (`inprogress`, `finished`, `abandoned`)

### 3. 코스 정보 (mdl_course)

```sql
-- 코스 목록 조회
SELECT
    c.id,
    c.fullname,
    c.shortname,
    c.category,
    c.visible,
    c.timecreated,
    c.timemodified,
    COUNT(DISTINCT ue.userid) as enrolled_users
FROM mdl_course c
LEFT JOIN mdl_enrol e ON e.courseid = c.id
LEFT JOIN mdl_user_enrolments ue ON ue.enrolid = e.id
WHERE c.visible = 1
GROUP BY c.id
ORDER BY c.fullname;
```

### 4. 사용자 정보 (mdl_user)

```sql
-- 활성 사용자 조회
SELECT
    u.id,
    u.username,
    u.firstname,
    u.lastname,
    u.email,
    u.lastaccess,
    u.timecreated
FROM mdl_user u
WHERE u.deleted = 0
  AND u.suspended = 0
ORDER BY u.lastname, u.firstname;
```

## 연동 예제

### PHP PDO를 사용한 안전한 쿼리

```php
<?php
require_once 'config/database.php';

$db = Database::getInstance()->getConnection();

// 사용자 ID로 퀴즈 시도 조회
$userId = 2;
$sql = "SELECT
            qa.id,
            qa.sumgrades,
            qa.timefinish,
            q.name,
            q.grade as maxgrade
        FROM mdl_quiz_attempts qa
        JOIN mdl_quiz q ON qa.quiz = q.id
        WHERE qa.userid = :userid
          AND qa.state = 'finished'
        ORDER BY qa.timefinish ASC";

$stmt = $db->prepare($sql);
$stmt->bindValue(':userid', $userId, PDO::PARAM_INT);
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($results as $row) {
    $normalizedScore = ($row['sumgrades'] / $row['maxgrade']) * 100;
    echo "Quiz: {$row['name']}, Score: {$normalizedScore}%\n";
}
?>
```

### JavaScript에서 API 호출

```javascript
async function loadQuizData(userId) {
    try {
        const response = await fetch(`api/get_quiz_data.php?user_id=${userId}`);
        const data = await response.json();

        if (data.success) {
            console.log(`Loaded ${data.count} quiz attempts`);
            return data.data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Failed to load quiz data:', error);
        return null;
    }
}

// 사용 예
const quizData = await loadQuizData(2);
curvyLog.setData(quizData);
```

## 주요 이벤트 타입

Moodle 3.7의 주요 이벤트 타입:

| 이벤트 이름 | 설명 |
|------------|------|
| `\core\event\course_viewed` | 코스 조회 |
| `\mod_quiz\event\attempt_started` | 퀴즈 시작 |
| `\mod_quiz\event\attempt_submitted` | 퀴즈 제출 |
| `\mod_assign\event\submission_created` | 과제 제출 생성 |
| `\mod_forum\event\discussion_viewed` | 포럼 토론 조회 |
| `\core\event\user_loggedin` | 사용자 로그인 |
| `\core\event\user_loggedout` | 사용자 로그아웃 |

## 성능 최적화

### 인덱스 확인

```sql
-- 로그 테이블 인덱스 (Moodle 기본 제공)
SHOW INDEX FROM mdl_logstore_standard_log;

-- 필요시 추가 인덱스 생성
CREATE INDEX idx_userid_timecreated
ON mdl_logstore_standard_log(userid, timecreated);
```

### 쿼리 최적화

```sql
-- EXPLAIN으로 쿼리 실행 계획 확인
EXPLAIN SELECT
    l.id,
    l.eventname,
    l.timecreated
FROM mdl_logstore_standard_log l
WHERE l.userid = 2
  AND l.timecreated > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
ORDER BY l.timecreated DESC
LIMIT 50;
```

## 보안 고려사항

### 1. SQL Injection 방지

**나쁜 예:**
```php
$userId = $_GET['user_id'];
$sql = "SELECT * FROM mdl_user WHERE id = $userId"; // 위험!
```

**좋은 예:**
```php
$userId = $_GET['user_id'];
$stmt = $db->prepare("SELECT * FROM mdl_user WHERE id = :userid");
$stmt->bindValue(':userid', $userId, PDO::PARAM_INT);
$stmt->execute();
```

### 2. 권한 확인

```php
// Moodle 권한 시스템과 연동
function checkUserAccess($userId, $courseId) {
    $db = Database::getInstance()->getConnection();

    $sql = "SELECT COUNT(*) as count
            FROM mdl_user_enrolments ue
            JOIN mdl_enrol e ON e.id = ue.enrolid
            WHERE ue.userid = :userid
              AND e.courseid = :courseid
              AND ue.status = 0"; // 0 = active

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':userid' => $userId,
        ':courseid' => $courseId
    ]);

    $result = $stmt->fetch();
    return $result['count'] > 0;
}
```

### 3. 데이터 검증

```php
function validateUserId($userId) {
    if (!is_numeric($userId) || $userId <= 0) {
        throw new InvalidArgumentException('Invalid user ID');
    }
    return intval($userId);
}

// 사용
try {
    $userId = validateUserId($_GET['user_id']);
    // 안전하게 사용
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
```

## 테스트 데이터 생성

개발 환경에서 테스트용 데이터를 생성하는 SQL:

```sql
-- 테스트 사용자 생성 (Moodle 관리자 페이지에서 하는 것이 권장됨)
-- 이 쿼리는 참고용입니다

-- 테스트 퀴즈 시도 데이터 삽입 (개발 환경에서만!)
INSERT INTO mdl_quiz_attempts
(quiz, userid, attempt, sumgrades, timestart, timefinish, state)
VALUES
(1, 2, 1, 85.0, UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)), UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) + 1800, 'finished'),
(1, 2, 2, 92.5, UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 5 DAY)), UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 5 DAY)) + 1500, 'finished'),
(1, 2, 3, 88.0, UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 3 DAY)), UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 3 DAY)) + 1200, 'finished');
```

## 문제 해결

### 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# PHP 에러 로그 확인
sudo tail -f /var/log/apache2/error.log
```

### 권한 문제

```sql
-- 데이터베이스 사용자 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 필요시 권한 부여 (관리자 계정으로)
GRANT SELECT ON moodle.* TO 'curvy_log_user'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

## 참고 자료

- [Moodle 3.7 Developer Documentation](https://docs.moodle.org/dev/Main_Page)
- [Moodle Database Schema](https://docs.moodle.org/dev/Database_Schema)
- [Moodle Events API](https://docs.moodle.org/dev/Events_API)
- [PHP PDO Documentation](https://www.php.net/manual/en/book.pdo.php)
