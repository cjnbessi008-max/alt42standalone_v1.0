# Moodle Integration Setup Guide
**AI Education System Pipeline ↔ Moodle 3.7**

## 빠른 시작 (Quick Start)

### 1. 환경 설정

```bash
# 1. 환경 변수 파일 생성
cp .env.example .env

# 2. .env 파일 편집
nano .env
```

필수 설정 항목:
```env
# Moodle URL
MOODLE_URL=https://lms.kaist.ac.kr

# Moodle Web Services Token (아래에서 생성 방법 참조)
MOODLE_WS_TOKEN=your_token_here

# LTI Credentials (Moodle와 동일하게 설정)
LTI_CONSUMER_KEY=kaist_aipipeline
LTI_SHARED_SECRET=your_secret_here

# JWT Secret (보안 키 생성)
JWT_SECRET=$(openssl rand -base64 64)
```

### 2. Moodle 설정

#### A. Web Services 활성화

1. Moodle 관리자로 로그인
2. **Site administration** → **Advanced features**
3. **Enable web services** 체크 ✓
4. 저장

#### B. Web Services Token 생성

1. **Site administration** → **Plugins** → **Web services** → **Manage tokens**
2. **Create token** 클릭
3. 설정:
   - User: 관리자 또는 서비스 계정 선택
   - Service: External service 선택 또는 생성
   - Save changes
4. 생성된 토큰을 `.env` 파일의 `MOODLE_WS_TOKEN`에 복사

#### C. External Service 구성

1. **Site administration** → **Plugins** → **Web services** → **External services**
2. **Add** 클릭
3. 설정:
   - Name: `AI Pipeline Service`
   - Short name: `aipipeline`
   - Enabled: ✓
4. **Add functions** 클릭하고 다음 함수들 추가:
   ```
   core_course_create_modules
   core_course_get_contents
   core_completion_update_activity_completion_status_manually
   core_grades_update_grades
   core_grades_get_grades
   core_enrol_get_enrolled_users
   core_user_get_users
   core_webservice_get_site_info
   ```

#### D. LTI Provider 설정 (External Tool)

1. **Site administration** → **Plugins** → **Activity modules** → **External tool** → **Manage tools**
2. **Configure a tool manually** 클릭
3. 설정:
   - Tool name: `AI Education Pipeline`
   - Tool URL: `https://ai-pipeline.kaist.ac.kr/api/lti/launch.php`
   - Consumer key: `kaist_aipipeline` (`.env`의 `LTI_CONSUMER_KEY`와 동일)
   - Shared secret: (`.env`의 `LTI_SHARED_SECRET`와 동일)
   - Default launch container: New window
4. Privacy 설정:
   - Share launcher's name with tool: Always ✓
   - Share launcher's email with tool: Always ✓
   - Accept grades from the tool: Always ✓
5. 저장

### 3. 데이터베이스 설정

#### MySQL 사용자 생성 (읽기 전용)

```sql
-- Moodle DB 읽기 전용 사용자
CREATE USER 'moodle_readonly'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'%';

-- AI Pipeline 뷰 생성
CREATE VIEW moodle.ai_pipeline_students AS
SELECT
    u.id,
    u.username,
    u.firstname,
    u.lastname,
    u.email,
    ue.courseid
FROM mdl_user u
JOIN mdl_user_enrolments uen ON u.id = uen.userid
JOIN mdl_enrol ue ON uen.enrolid = ue.id
WHERE u.deleted = 0;

GRANT SELECT ON moodle.ai_pipeline_students TO 'moodle_readonly'@'%';
FLUSH PRIVILEGES;
```

### 4. 테스트

```bash
# 통합 테스트 실행
php tests/LTIIntegrationTest.php

# Moodle 연결 테스트 (별도 스크립트 필요)
php tests/moodle_connection_test.php
```

### 5. 사용 방법

#### A. 교사가 Moodle 코스에 AI 모듈 추가하기

1. Moodle 코스 편집 모드 활성화
2. **Add an activity or resource** 클릭
3. **External tool** 선택
4. 설정:
   - Activity name: 모듈 이름 (예: "분수 학습 모듈")
   - Preconfigured tool: `AI Education Pipeline` 선택
   - Custom parameters: `module_id=<AI에서 생성한 모듈 ID>`
5. 저장

#### B. 학생 접근

1. 학생이 Moodle 코스에서 모듈 클릭
2. 자동으로 LTI를 통해 AI Pipeline으로 리다이렉트
3. 학생은 AI 생성 모듈과 상호작용
4. 완료 상태 및 성적이 자동으로 Moodle에 동기화

## 고급 설정

### 자동 성적 동기화

`config/moodle_config.php`에서 설정:

```php
'sync' => [
    'auto_grade_sync' => true,
    'grade_sync_interval' => 300, // 5분마다
    'sync_direction' => 'bidirectional'
]
```

### Webhook 설정 (Moodle → AI Pipeline)

Moodle에서 이벤트 발생시 AI Pipeline으로 알림:

```php
// Moodle local plugin: local_aipipeline_webhook
public static function course_module_viewed(\core\event\course_module_viewed $event) {
    $url = 'https://ai-pipeline.kaist.ac.kr/api/webhooks/moodle_events.php';
    $data = [
        'event_type' => 'module_viewed',
        'user_id' => $event->userid,
        'course_id' => $event->courseid,
        'module_id' => $event->objectid
    ];

    // Send async HTTP request
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
    curl_close($ch);
}
```

## 트러블슈팅

### 문제: LTI 서명 검증 실패

**증상**: "OAuth signature verification failed"

**해결**:
1. 서버 시간 동기화:
   ```bash
   sudo ntpdate pool.ntp.org
   ```

2. Consumer Key/Secret 확인:
   - `.env` 파일과 Moodle External Tool 설정이 정확히 일치하는지 확인

3. 로그 확인:
   ```bash
   tail -f logs/moodle_integration.log
   ```

### 문제: Web Services 403 Forbidden

**증상**: "Access control exception"

**해결**:
1. Web Services 함수 권한 확인:
   - Moodle: **Site administration** → **Users** → **Permissions** → **Define roles**
   - 서비스 계정에 필요한 권한 부여

2. IP 제한 확인:
   - Moodle: **Site administration** → **Security** → **IP blocker**

### 문제: 성적이 Moodle에 반영 안됨

**증상**: AI Pipeline에서 성적 전송했으나 Moodle gradebook에 없음

**해결**:
1. LTI 설정에서 **Accept grades from the tool** 확인
2. Grade item 생성 확인:
   ```php
   $client = new MoodleAPIClient($moodle_url, $token);
   $result = $client->createGradeItem($course_id, [
       'itemname' => 'AI Module Score',
       'grademax' => 100
   ]);
   ```

## API 사용 예제

### 1. 프로그래밍 방식으로 모듈 추가

```php
<?php
require_once 'lib/MoodleAPIClient.php';

use AIPipeline\Moodle\MoodleAPIClient;

$client = new MoodleAPIClient(
    'https://lms.kaist.ac.kr',
    'your_token_here'
);

// 코스 모듈 생성
$result = $client->createCourseModule(123, [
    'name' => '분수 학습 모듈',
    'url' => 'https://ai-pipeline.kaist.ac.kr/lti/launch?module_id=fraction_001',
    'intro' => 'AI가 생성한 대화형 분수 학습 모듈입니다.',
    'section' => 1
]);

echo "Module created with ID: " . $result[0]['cmid'];
```

### 2. 성적 업데이트

```php
<?php
// 학생 성적 업데이트
$client->updateGrade(
    $course_id = 123,
    $item_id = 456,
    $user_id = 789,
    $grade = 85.5
);

echo "Grade updated successfully";
```

### 3. 완료 상태 추적

```php
<?php
// 학생이 모듈 완료함
$client->updateCompletion(
    $cm_id = 456,
    $user_id = 789,
    $completed = true
);

echo "Completion status updated";
```

## 보안 고려사항

### 1. HTTPS 필수
- 모든 통신은 HTTPS를 통해서만 이루어져야 함
- Let's Encrypt 무료 인증서 사용 권장

### 2. Secret 관리
```bash
# 강력한 LTI Shared Secret 생성
openssl rand -base64 32

# JWT Secret 생성
openssl rand -base64 64
```

### 3. IP 화이트리스트
`.env` 파일에서:
```env
IP_WHITELIST_ENABLED=true
ALLOWED_IPS=192.168.1.100,10.0.0.50  # Moodle 서버 IP만
```

### 4. 감사 로깅
모든 LTI 요청 및 성적 변경을 로깅:
```php
'logging' => [
    'log_lti_requests' => true,
    'log_grade_operations' => true
]
```

## 성능 최적화

### Redis 캐싱 활성화

```bash
# Redis 설치
sudo apt install redis-server

# .env 설정
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 배치 작업

여러 성적을 한 번에 업데이트:
```php
$grades_batch = [
    ['studentid' => 101, 'grade' => 85],
    ['studentid' => 102, 'grade' => 90],
    ['studentid' => 103, 'grade' => 78]
];

foreach ($grades_batch as $grade_data) {
    $client->updateGrade($course_id, $item_id, $grade_data['studentid'], $grade_data['grade']);
}
```

## 모니터링

### 로그 확인
```bash
# 실시간 로그 모니터링
tail -f logs/moodle_integration.log

# 오류만 필터링
grep "ERROR" logs/moodle_integration.log
```

### 헬스 체크 엔드포인트
```bash
# Moodle 연결 테스트
curl https://ai-pipeline.kaist.ac.kr/api/health/moodle

# 예상 응답
{
  "status": "healthy",
  "moodle_connection": "ok",
  "site_name": "KAIST LMS",
  "version": "Moodle 3.7"
}
```

## 추가 리소스

- [Moodle LTI Provider 문서](https://docs.moodle.org/37/en/LTI_Provider)
- [Moodle Web Services API](https://docs.moodle.org/dev/Web_services_API)
- [IMS LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)

## 지원

문제가 발생하면:
1. 로그 파일 확인: `logs/moodle_integration.log`
2. 테스트 실행: `php tests/LTIIntegrationTest.php`
3. 이슈 제출: [GitHub Issues](https://github.com/kaist/ai-pipeline/issues)
4. 관리자 연락: admin@kaist.ac.kr
