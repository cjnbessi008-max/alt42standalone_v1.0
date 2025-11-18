# Alt42 Standalone - Moodle LMS Integration

Moodle 3.7 LMS와의 통합을 위한 PHP 라이브러리입니다. AI 교육 시스템 파이프라인의 일부로 KAIST Touch Math Academy를 위해 개발되었습니다.

## 특징

✅ **Moodle 3.7 완벽 지원** (MySQL 5.7, PHP 7.1.9)
✅ **세 가지 연동 모드**: 직접 DB 접근, Web Services API, 하이브리드
✅ **사용자 인증 및 세션 관리**
✅ **코스 및 모듈 데이터 접근**
✅ **학생 진도 추적 및 성적 관리**
✅ **완전한 문서화 및 예제**

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Moodle 3.7
- PHP 확장: PDO, PDO_MySQL, JSON, cURL

## 빠른 시작

### 1. 설치

```bash
# Composer를 통한 설치
composer require kaist/alt42standalone

# 또는 저장소 클론
git clone https://github.com/kaist/alt42standalone_v1.0.git
cd alt42standalone_v1.0
composer install
```

### 2. 환경 설정

`.env.example` 파일을 `.env`로 복사하고 설정을 입력합니다:

```bash
cp .env.example .env
nano .env
```

필수 설정:
```env
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password
```

### 3. 기본 사용법

```php
<?php
require_once 'vendor/autoload.php';

use Alt42Standalone\MoodleAuth;
use Alt42Standalone\MoodleCourseManager;

// 사용자 인증
$auth = new MoodleAuth();
$user = $auth->authenticate('username', 'password');

if ($user) {
    // 사용자의 코스 조회
    $courseManager = new MoodleCourseManager();
    $courses = $courseManager->getUserCourses($user['id']);

    foreach ($courses as $course) {
        echo $course['fullname'] . "\n";
    }
}
```

## 핵심 구성 요소

### 1. 데이터베이스 연결 (MoodleConnection)

```php
use Alt42Standalone\MoodleConnection;

$db = MoodleConnection::getInstance();
$users = $db->select("SELECT * FROM {$db->table('user')} WHERE id = :id", ['id' => 1]);
```

### 2. 사용자 인증 (MoodleAuth)

```php
use Alt42Standalone\MoodleAuth;

$auth = new MoodleAuth();

// 사용자명/비밀번호로 인증
$user = $auth->authenticate('student', 'password');

// 토큰으로 인증
$user = $auth->authenticateByToken('api_token');

// 역할 확인
$isTeacher = $auth->isTeacher($userId, $courseId);
```

### 3. 코스 관리 (MoodleCourseManager)

```php
use Alt42Standalone\MoodleCourseManager;

$courseManager = new MoodleCourseManager();

// 코스 조회
$course = $courseManager->getCourse($courseId);

// 사용자의 코스 목록
$courses = $courseManager->getUserCourses($userId);

// 코스의 모듈 조회
$modules = $courseManager->getCourseModules($courseId);
```

### 4. 진도 추적 (MoodleProgressTracker)

```php
use Alt42Standalone\MoodleProgressTracker;

$tracker = new MoodleProgressTracker();

// 코스 진행률
$progress = $tracker->getCourseProgress($userId, $courseId);
echo "진행률: {$progress['progress_percentage']}%";

// 최종 성적
$grade = $tracker->getCourseFinalGrade($userId, $courseId);
```

### 5. Web Services API (MoodleApiClient)

```php
use Alt42Standalone\MoodleApiClient;

$api = new MoodleApiClient();

// 코스 목록
$courses = $api->getCourses();

// 사용자 정보
$user = $api->getUser($userId);
```

## 연동 모드

### DIRECT (직접 DB 접근)
- 빠른 성능
- 복잡한 쿼리 가능
- Moodle DB에 직접 접근

### API (Web Services)
- Moodle 공식 인터페이스
- 버전 호환성 우수
- 보안성 높음

### HYBRID (권장) ⭐
- 두 방식의 장점 결합
- 읽기는 DB, 쓰기는 API
- 성능과 안정성 균형

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/              # 설정 파일
│   └── moodle_config.php
├── src/                 # 소스 코드
│   ├── MoodleConnection.php
│   ├── MoodleAuth.php
│   ├── MoodleCourseManager.php
│   ├── MoodleProgressTracker.php
│   └── MoodleApiClient.php
├── examples/            # 사용 예제
│   └── integration_example.php
├── docs/                # 문서
│   └── MOODLE_INTEGRATION.md
├── tests/               # 테스트
├── tasks/               # 작업 문서
│   └── 0001-prd-ai-education-pipeline.md
├── .env.example         # 환경 변수 예제
├── composer.json        # Composer 설정
└── README.md           # 이 파일
```

## 문서

상세한 문서는 다음을 참조하세요:

- [Moodle 연동 가이드](docs/MOODLE_INTEGRATION.md) - 완전한 통합 가이드
- [예제 코드](examples/integration_example.php) - 실제 사용 예제
- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md) - 프로젝트 요구사항

## 예제 실행

```bash
# 기본 예제 실행
php examples/integration_example.php
```

## 개발 및 테스트

```bash
# 의존성 설치
composer install

# 테스트 실행
composer test

# 코드 스타일 검사
composer check-style
```

## 보안 고려사항

⚠️ **중요**: 프로덕션 환경에서는 다음을 확인하세요:

1. `.env` 파일을 버전 관리에 포함하지 마세요
2. 데이터베이스 사용자에게 최소 권한만 부여
3. HTTPS를 사용하여 통신 암호화
4. API 토큰을 안전하게 보관
5. `DEBUG_MODE`를 `false`로 설정

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 기여

이 프로젝트는 내부 프로젝트입니다. 기여는 KAIST Touch Math Academy 팀원으로 제한됩니다.

## 지원

문제가 발생하거나 질문이 있는 경우:

- **문서**: [docs/MOODLE_INTEGRATION.md](docs/MOODLE_INTEGRATION.md)
- **이메일**: support@kaist-touchmath.edu
- **이슈 트래커**: GitHub Issues

## 로드맵

### 현재 (v1.0)
- ✅ Moodle 3.7 연동
- ✅ 사용자 인증
- ✅ 코스 및 모듈 관리
- ✅ 진도 추적

### 향후 계획
- 🔄 Moodle 4.x 지원
- 🔄 Redis 캐싱 지원
- 🔄 성능 최적화
- 🔄 추가 Web Services 함수
- 🔄 자동화된 테스트 suite

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 릴리스
- Moodle 3.7 완전 지원
- 핵심 클래스 5개 구현
- 완전한 문서화

## 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템 파이프라인 프로젝트의 일부입니다.

---

**Made with ❤️ by KAIST Touch Math Academy**
