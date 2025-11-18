# Moodle LMS 연동 가이드

## 개요

이 문서는 Alt42Standalone 시스템과 Moodle 3.7 LMS의 연동 방법을 설명합니다.

### 지원 환경

- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **연동 방식**: 직접 DB 접근 (DIRECT), Web Services API (API), 하이브리드 (HYBRID)

## 목차

1. [설치 및 설정](#설치-및-설정)
2. [핵심 클래스](#핵심-클래스)
3. [사용 예제](#사용-예제)
4. [모범 사례](#모범-사례)
5. [문제 해결](#문제-해결)

---

## 설치 및 설정

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
# Moodle 데이터베이스 설정
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password_here
MOODLE_TABLE_PREFIX=mdl_

# Moodle Web Services 설정
MOODLE_WS_URL=http://your-moodle-site.com/webservice/rest/server.php
MOODLE_WS_TOKEN=your_api_token_here

# Moodle 경로 설정
MOODLE_DIR_ROOT=/var/www/moodle
MOODLE_DATA_ROOT=/var/moodledata

# 연동 모드 (DIRECT, API, HYBRID)
INTEGRATION_MODE=HYBRID

# 디버그 설정
DEBUG_MODE=true
LOG_LEVEL=INFO

# 타임존
TIMEZONE=Asia/Seoul
```

### 2. Web Services 토큰 생성 (API 사용 시)

Moodle 관리자로 로그인한 후:

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. **웹 서비스 활성화** 체크
3. **사이트 관리** → **서버** → **웹 서비스** → **프로토콜 관리**
   - REST 프로토콜 활성화
4. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
   - 새 서비스 생성 또는 기존 서비스 선택
   - 필요한 함수 추가 (예: `core_user_get_users_by_field`, `core_course_get_courses` 등)
5. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
   - 새 토큰 생성
   - 생성된 토큰을 `.env`의 `MOODLE_WS_TOKEN`에 설정

### 3. 데이터베이스 사용자 권한 설정

Moodle 데이터베이스에 대한 읽기/쓰기 권한이 필요합니다:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

**주의**: 프로덕션 환경에서는 최소 권한 원칙을 따라 필요한 테이블에만 권한을 부여하세요.

---

## 핵심 클래스

### 1. MoodleConnection

데이터베이스 연결을 관리하는 싱글톤 클래스입니다.

**주요 메서드:**

```php
// 인스턴스 획득
$db = MoodleConnection::getInstance();

// 데이터 조회
$users = $db->select("SELECT * FROM {$db->table('user')} WHERE id = :id", ['id' => 1]);

// 단일 행 조회
$user = $db->selectOne("SELECT * FROM {$db->table('user')} WHERE id = :id", ['id' => 1]);

// 데이터 삽입
$insertId = $db->insert("INSERT INTO {$db->table('user')} (username, email) VALUES (:username, :email)",
    ['username' => 'test', 'email' => 'test@example.com']);

// 데이터 업데이트
$affectedRows = $db->update("UPDATE {$db->table('user')} SET email = :email WHERE id = :id",
    ['email' => 'new@example.com', 'id' => 1]);

// 트랜잭션
$db->beginTransaction();
try {
    // 여러 작업 수행
    $db->commit();
} catch (Exception $e) {
    $db->rollback();
}
```

### 2. MoodleAuth

사용자 인증 및 세션 관리를 담당합니다.

**주요 메서드:**

```php
$auth = new MoodleAuth();

// 사용자명/비밀번호로 인증
$user = $auth->authenticate('username', 'password');

// 토큰으로 인증
$user = $auth->authenticateByToken('api_token');

// 현재 사용자 조회
$currentUser = $auth->getCurrentUser();

// 역할 확인
$isTeacher = $auth->isTeacher($userId, $courseId);
$isStudent = $auth->isStudent($userId, $courseId);

// 로그아웃
$auth->logout();
```

### 3. MoodleCourseManager

코스 및 모듈 데이터를 관리합니다.

**주요 메서드:**

```php
$courseManager = new MoodleCourseManager();

// 코스 조회
$course = $courseManager->getCourse($courseId);

// 사용자의 코스 목록
$courses = $courseManager->getUserCourses($userId);

// 코스의 모듈 목록
$modules = $courseManager->getCourseModules($courseId);

// 퀴즈만 필터링
$quizzes = $courseManager->getCourseModules($courseId, 'quiz');

// 코스의 학생 목록
$students = $courseManager->getCourseStudents($courseId);

// 사용자를 코스에 등록
$courseManager->enrollUser($userId, $courseId, 'student');
```

### 4. MoodleProgressTracker

학생의 진도 및 성적을 추적합니다.

**주요 메서드:**

```php
$tracker = new MoodleProgressTracker();

// 코스 진행률
$progress = $tracker->getCourseProgress($userId, $courseId);
echo "진행률: {$progress['progress_percentage']}%";

// 모듈 완료 상태
$completion = $tracker->getModuleCompletion($userId, $moduleId);

// 모듈 완료 처리
$tracker->markModuleCompleted($userId, $moduleId);

// 코스 최종 성적
$finalGrade = $tracker->getCourseFinalGrade($userId, $courseId);

// 학습 시간
$studyTime = $tracker->getStudyTime($userId, $courseId);
echo "학습 시간: {$studyTime['duration_hours']} 시간";
```

### 5. MoodleApiClient

Moodle Web Services API를 통한 데이터 접근을 제공합니다.

**주요 메서드:**

```php
$api = new MoodleApiClient();

// 사이트 정보
$siteInfo = $api->getSiteInfo();

// 사용자 조회
$user = $api->getUser($userId);
$user = $api->getUserByUsername('username');

// 코스 조회
$courses = $api->getCourses();
$course = $api->getCourse($courseId);

// 사용자의 코스
$userCourses = $api->getUserCourses($userId);

// 코스 내용
$contents = $api->getCourseContents($courseId);

// 성적 조회
$grades = $api->getGrades($courseId, $userId);

// 완료 상태
$completionStatus = $api->getCompletionStatus($courseId, $userId);
```

---

## 사용 예제

### 예제 1: 사용자 인증 및 코스 목록 조회

```php
<?php
require_once 'src/MoodleAuth.php';
require_once 'src/MoodleCourseManager.php';

use Alt42Standalone\MoodleAuth;
use Alt42Standalone\MoodleCourseManager;

// 사용자 인증
$auth = new MoodleAuth();
$user = $auth->authenticate('student1', 'password123');

if ($user) {
    echo "로그인 성공: {$user['firstname']} {$user['lastname']}\n";

    // 사용자의 코스 목록 조회
    $courseManager = new MoodleCourseManager();
    $courses = $courseManager->getUserCourses($user['id']);

    echo "등록된 코스:\n";
    foreach ($courses as $course) {
        echo "- {$course['fullname']}\n";
    }
} else {
    echo "로그인 실패\n";
}
```

### 예제 2: 학생 진도 추적

```php
<?php
require_once 'src/MoodleProgressTracker.php';

use Alt42Standalone\MoodleProgressTracker;

$tracker = new MoodleProgressTracker();
$userId = 10;
$courseId = 2;

// 코스 진행률
$progress = $tracker->getCourseProgress($userId, $courseId);

echo "진행률 정보:\n";
echo "- 완료한 활동: {$progress['completed_activities']} / {$progress['total_activities']}\n";
echo "- 진행률: {$progress['progress_percentage']}%\n";
echo "- 완료 여부: " . ($progress['is_completed'] ? '완료' : '진행 중') . "\n";

// 최종 성적
$finalGrade = $tracker->getCourseFinalGrade($userId, $courseId);

if ($finalGrade) {
    echo "\n최종 성적:\n";
    echo "- 점수: {$finalGrade['final_grade']} / {$finalGrade['max_grade']}\n";
    echo "- 백분율: {$finalGrade['percentage']}%\n";
}
```

### 예제 3: API를 통한 코스 관리

```php
<?php
require_once 'src/MoodleApiClient.php';

use Alt42Standalone\MoodleApiClient;

$api = new MoodleApiClient();

// 모든 코스 조회
$courses = $api->getCourses();

foreach ($courses as $course) {
    echo "코스: {$course['fullname']}\n";

    // 코스 내용 조회
    $contents = $api->getCourseContents($course['id']);

    echo "  섹션 수: " . count($contents) . "\n";
}
```

### 예제 4: 하이브리드 접근 (DB + API)

```php
<?php
require_once 'src/MoodleConnection.php';
require_once 'src/MoodleCourseManager.php';
require_once 'src/MoodleApiClient.php';

use Alt42Standalone\MoodleConnection;
use Alt42Standalone\MoodleCourseManager;
use Alt42Standalone\MoodleApiClient;

// DB를 통한 빠른 조회
$db = MoodleConnection::getInstance();
$courseManager = new MoodleCourseManager($db);
$courses = $courseManager->getUserCourses($userId);

// API를 통한 상세 정보
$api = new MoodleApiClient();

foreach ($courses as $course) {
    // DB에서 기본 정보 (빠름)
    echo "코스: {$course['fullname']}\n";

    // API에서 완료 정보 (기능이 풍부함)
    $completionStatus = $api->getCourseCompletionStatus($course['id'], $userId);
    echo "  완료 상태: " . ($completionStatus['completed'] ? '완료' : '진행 중') . "\n";
}
```

---

## 모범 사례

### 1. 연동 모드 선택

**DIRECT (직접 DB 접근)**
- 장점: 빠른 성능, 복잡한 쿼리 가능
- 단점: Moodle 버전 업그레이드 시 호환성 문제 가능
- 사용 시기: 읽기 작업이 많고, 성능이 중요한 경우

**API (Web Services)**
- 장점: Moodle 공식 인터페이스, 버전 호환성 좋음
- 단점: API 제한, 느린 성능
- 사용 시기: 외부 시스템 연동, 보안이 중요한 경우

**HYBRID (하이브리드)**
- 장점: 두 방식의 장점 결합
- 단점: 복잡성 증가
- 사용 시기: 대부분의 경우 권장 ✅

### 2. 트랜잭션 사용

데이터 무결성을 위해 여러 작업을 하나의 트랜잭션으로 묶으세요:

```php
$db->beginTransaction();
try {
    $userId = $db->insert(/* ... */);
    $courseManager->enrollUser($userId, $courseId);
    $db->commit();
} catch (Exception $e) {
    $db->rollback();
    throw $e;
}
```

### 3. 에러 처리

항상 예외를 처리하세요:

```php
try {
    $user = $auth->authenticate($username, $password);
    if (!$user) {
        // 인증 실패 처리
    }
} catch (Exception $e) {
    error_log("인증 오류: " . $e->getMessage());
    // 사용자에게 친절한 오류 메시지 표시
}
```

### 4. 캐싱

자주 사용되는 데이터는 캐싱하세요:

```php
// 예: Redis를 사용한 코스 목록 캐싱
$cacheKey = "user_courses_{$userId}";
$courses = $redis->get($cacheKey);

if (!$courses) {
    $courses = $courseManager->getUserCourses($userId);
    $redis->setex($cacheKey, 3600, json_encode($courses)); // 1시간 캐시
} else {
    $courses = json_decode($courses, true);
}
```

### 5. 보안

- SQL Injection 방지: 항상 준비된 문 사용
- 비밀번호: 평문으로 저장하지 않음 (Moodle의 bcrypt 사용)
- API 토큰: 안전하게 보관 (환경 변수 사용)
- 권한 확인: 모든 작업 전에 권한 검증

```php
// 좋은 예
$user = $db->selectOne("SELECT * FROM users WHERE id = :id", ['id' => $userId]);

// 나쁜 예 (절대 금지!)
$user = $db->selectOne("SELECT * FROM users WHERE id = $userId");
```

---

## 문제 해결

### 연결 문제

**증상**: "Moodle 데이터베이스 연결 실패"

**해결 방법**:
1. `.env` 파일의 데이터베이스 설정 확인
2. MySQL 서버 실행 여부 확인: `mysql -u moodle_user -p`
3. 네트워크 연결 확인
4. 방화벽 설정 확인

### API 토큰 오류

**증상**: "유효하지 않은 토큰" 또는 "권한 없음"

**해결 방법**:
1. Moodle에서 Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 서비스에 필요한 함수가 추가되어 있는지 확인
4. 토큰이 만료되지 않았는지 확인

### 성능 문제

**증상**: 느린 응답 시간

**해결 방법**:
1. 적절한 인덱스 확인:
   ```sql
   SHOW INDEX FROM mdl_user;
   ```
2. 쿼리 최적화 (EXPLAIN 사용)
3. 캐싱 구현
4. 연결 풀링 사용
5. DB와 API의 적절한 조합 (하이브리드 모드)

### 세션 문제

**증상**: 세션이 유지되지 않음

**해결 방법**:
1. PHP 세션 설정 확인
2. `session.save_path` 디렉토리 권한 확인
3. `SESSION_TIMEOUT` 설정 조정

### 호환성 문제

**증상**: Moodle 버전 업그레이드 후 오류 발생

**해결 방법**:
1. Moodle 데이터베이스 스키마 변경 확인
2. 테이블명이나 컬럼명 변경 여부 확인
3. 가능하면 API 사용 (더 안정적)

---

## 추가 리소스

- [Moodle 공식 문서](https://docs.moodle.org/)
- [Moodle Web Services API](https://docs.moodle.org/dev/Web_services)
- [Moodle 데이터베이스 스키마](https://docs.moodle.org/dev/Database_Schema_Introduction)
- [PHP PDO 문서](https://www.php.net/manual/en/book.pdo.php)

---

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 지원

문제가 발생하거나 질문이 있는 경우:
- 이슈 트래커: [GitHub Issues]
- 이메일: support@kaist-touchmath.edu

---

**버전**: 1.0
**최종 수정일**: 2025-11-18
**작성자**: KAIST Touch Math Academy
