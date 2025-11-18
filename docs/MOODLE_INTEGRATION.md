# Moodle 3.7 연동 가이드

Hundred Art와 Moodle LMS를 연동하는 방법을 설명합니다.

---

## 1. Moodle Web Service 설정

### 1.1 Web Service 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 고급 기능** 접속
3. **웹 서비스 활성화** 체크박스 선택
4. 변경사항 저장

### 1.2 REST 프로토콜 활성화

1. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
2. **REST protocol** 활성화

### 1.3 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. **새 서비스 추가** 클릭
3. 다음 정보 입력:
   - **이름**: Hundred Art Integration
   - **간단한 이름**: hundred_art
   - **활성화**: 예
   - **승인된 사용자만**: 예 (권장)

### 1.4 필요한 함수 추가

생성한 "Hundred Art Integration" 서비스에 다음 함수들을 추가합니다:

#### 사용자 관리
- `core_user_get_users_by_field` - 필드로 사용자 조회
- `core_enrol_get_enrolled_users` - 코스 등록 학생 조회

#### 코스 관리
- `core_course_get_courses` - 코스 정보 조회
- `core_course_get_contents` - 코스 콘텐츠 조회

#### 퀴즈 관리
- `mod_quiz_get_quizzes_by_courses` - 코스별 퀴즈 목록
- `mod_quiz_get_quiz_access_information` - 퀴즈 접근 정보
- `mod_quiz_get_attempt_data` - 시도 데이터 조회
- `mod_quiz_save_attempt` - 시도 저장 (선택사항)

### 1.5 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. **토큰 추가** 클릭
3. 다음 정보 입력:
   - **사용자**: 관리자 또는 전용 서비스 계정
   - **서비스**: Hundred Art Integration
4. 토큰 저장 후 **토큰 값 복사**
5. Hundred Art 백엔드 `.env` 파일의 `MOODLE_TOKEN`에 입력

---

## 2. Moodle 사용자 계정 설정

### 전용 서비스 계정 생성 (권장)

보안을 위해 Hundred Art 전용 계정을 만드는 것을 권장합니다.

1. **사이트 관리 > 사용자 > 계정 > 새 사용자 추가**
2. 계정 정보:
   - **사용자 이름**: `hundred_art_service`
   - **비밀번호**: 강력한 비밀번호 설정
   - **이메일**: 관리자 이메일
3. 역할 할당:
   - **사이트 관리 > 사용자 > 권한 > 역할 할당**
   - "Manager" 또는 커스텀 역할 부여

---

## 3. 코스 및 퀴즈 설정

### 3.1 코스 생성

1. **사이트 홈 > 코스 추가**
2. 코스 정보 입력:
   - **코스 이름**: "Hundred Art - 숫자 학습"
   - **코스 ID**: 기억하기 쉬운 ID (예: `HUNDRED_ART_01`)

### 3.2 퀴즈 생성

1. 생성한 코스 접속
2. **활동 또는 리소스 추가 > 퀴즈**
3. 퀴즈 설정:
   - **이름**: "1-100 숫자 학습"
   - **설명**: Hundred Art 앱과 연동된 퀴즈
   - **시간 제한**: 필요에 따라 설정

### 3.3 문제 추가

1. 퀴즈 > **문제 은행 편집**
2. 문제 추가:
   - **문제 유형**: 단답형, 객관식 등
   - **문제 내용**: "다음 아트워크는 어떤 숫자를 나타내나요?"
   - **이미지**: Hundred Art 아트워크 추가 (선택사항)
   - **정답**: 해당 숫자

---

## 4. Hundred Art 연동 설정

### 4.1 백엔드 환경 변수

`backend/.env` 파일에 Moodle 정보 입력:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
```

### 4.2 데이터 동기화

#### 학생 데이터 동기화

```bash
curl -X POST http://your-hundred-art-domain.com/backend/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "students",
    "course_id": 1
  }'
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "synced": 25
  }
}
```

#### 문제 데이터 동기화

```bash
curl -X POST http://your-hundred-art-domain.com/backend/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "problems",
    "course_id": 1,
    "quiz_id": 5
  }'
```

---

## 5. 연동 테스트

### 5.1 Moodle API 연결 테스트

Moodle Web Service가 정상적으로 작동하는지 확인:

```bash
curl "https://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

**예상 응답:**
```json
{
  "sitename": "Your Moodle Site",
  "username": "hundred_art_service",
  "userid": 123,
  "siteurl": "https://your-moodle-site.com"
}
```

### 5.2 Hundred Art API 테스트

```bash
# Moodle 상태 확인
curl http://your-hundred-art-domain.com/backend/api/moodle/status

# 학생 목록 조회
curl http://your-hundred-art-domain.com/backend/api/students
```

---

## 6. 데이터 흐름

### 6.1 학생 등록 흐름

```
Moodle LMS
    ↓ (학생 등록)
    ↓
Hundred Art API: POST /moodle/sync (type=students)
    ↓
students 테이블에 저장
    ↓
Hundred Art 프론트엔드에서 조회 가능
```

### 6.2 문제 동기화 흐름

```
Moodle 퀴즈 생성
    ↓
Hundred Art API: POST /moodle/sync (type=problems)
    ↓
problems 테이블에 저장
    ↓ (artwork_number 자동 할당)
artworks 테이블과 연결
    ↓
학생이 앱에서 문제 풀이
```

### 6.3 학습 진행 흐름

```
학생이 Hundred Art 앱에서 문제 풀이
    ↓
POST /progress (답안 제출)
    ↓
student_progress 테이블에 저장
    ↓ (선택사항)
Moodle LMS로 결과 전송
    ↓
Moodle 성적부에 반영
```

---

## 7. 자동 동기화 설정 (선택사항)

주기적으로 Moodle 데이터를 자동 동기화하려면 Cron 작업을 설정합니다.

### 7.1 동기화 스크립트 생성

`backend/scripts/moodle_sync.php`:

```php
<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../services/MoodleService.php';

$moodle = new MoodleService();

// 모든 활성 코스의 학생 동기화
$courseIds = [1, 2, 3]; // 실제 코스 ID로 변경

foreach ($courseIds as $courseId) {
    echo "Syncing students for course {$courseId}...\n";
    $result = $moodle->syncStudents($courseId);
    echo "Result: " . json_encode($result) . "\n\n";
}
```

### 7.2 Cron 작업 설정

```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 동기화 실행
0 2 * * * /usr/bin/php /var/www/hundred-art/backend/scripts/moodle_sync.php >> /var/www/hundred-art/logs/sync.log 2>&1
```

---

## 8. 문제 해결

### 토큰 오류

**증상**: "Invalid token" 에러

**해결책**:
1. Moodle 토큰이 올바른지 확인
2. 토큰이 만료되지 않았는지 확인
3. 서비스가 활성화되어 있는지 확인

### 권한 오류

**증상**: "Access denied" 또는 "Permission error"

**해결책**:
1. 서비스 계정에 충분한 권한이 있는지 확인
2. 필요한 함수가 서비스에 추가되어 있는지 확인
3. "승인된 사용자만" 설정 확인

### 연결 오류

**증상**: "Connection timeout" 또는 "Connection refused"

**해결책**:
1. Moodle URL이 정확한지 확인 (http/https, trailing slash)
2. 방화벽 설정 확인
3. Moodle 서버가 실행 중인지 확인
4. SSL 인증서 문제 (개발 환경에서 `CURLOPT_SSL_VERIFYPEER` 비활성화)

### 디버깅

Moodle API 호출 로그 확인:

```bash
# Hundred Art 로그
tail -f /var/www/hundred-art/logs/moodle.log

# Moodle 로그
# Moodle 관리 > 서버 > 로그
```

---

## 9. 보안 고려사항

### 9.1 토큰 보안

- `.env` 파일을 절대 버전 관리에 포함하지 마세요
- 토큰은 정기적으로 갱신하세요
- HTTPS를 사용하여 토큰을 안전하게 전송하세요

### 9.2 IP 제한

Moodle에서 특정 IP만 Web Service에 접근하도록 제한:

1. **사이트 관리 > 보안 > IP 차단**
2. Hundred Art 서버 IP만 허용

### 9.3 최소 권한 원칙

서비스 계정에 필요한 최소한의 권한만 부여하세요.

---

## 10. 참고 자료

- [Moodle Web Services 공식 문서](https://docs.moodle.org/37/en/Web_services)
- [Moodle API 함수 목록](https://docs.moodle.org/dev/Web_service_API_functions)
- [REST 프로토콜 가이드](https://docs.moodle.org/37/en/Using_web_services)

---

**지원**: 연동 관련 문의사항은 프로젝트 이슈 트래커에 등록해주세요.
