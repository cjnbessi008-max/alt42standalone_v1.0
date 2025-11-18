# Moodle LMS Integration Guide

## 개요

이 문서는 Logic Flow Visualization System을 Moodle 3.7 LMS와 통합하는 방법을 설명합니다.

## 사전 요구사항

- Moodle 3.7 설치 (PHP 7.1.9, MySQL 5.7)
- Moodle 관리자 권한
- Web Services 활성화 권한

## 1. Moodle Web Services 설정

### 1.1 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** 이동
3. "웹 서비스 활성화" 체크박스 선택
4. 변경사항 저장

### 1.2 프로토콜 활성화

1. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
2. **REST 프로토콜** 활성화
3. 저장

### 1.3 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "추가" 클릭
3. 서비스 정보 입력:
   - 이름: `Logic Flow Visualization Service`
   - 약칭: `logicflow`
   - 활성화: 체크

### 1.4 함수 추가

다음 함수들을 서비스에 추가:

#### 필수 함수
- `core_webservice_get_site_info` - 연결 테스트
- `core_question_get_questions` - 문제 조회
- `core_question_get_questions_by_category` - 카테고리별 문제 조회
- `mod_quiz_get_quiz_questions` - 퀴즈 문제 조회
- `mod_quiz_get_user_attempts` - 학생 시도 조회

#### 선택 함수
- `mod_quiz_save_attempt` - 시도 저장
- `core_user_get_users_by_field` - 사용자 조회
- `core_course_get_courses` - 강좌 조회

## 2. 사용자 및 토큰 설정

### 2.1 웹 서비스 역할 생성

1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. "새 역할 추가" 클릭
3. 역할 정보:
   - 약칭: `webservice_logicflow`
   - 이름: `Logic Flow Web Service`
   - 권한:
     - `webservice/rest:use`
     - `moodle/question:viewall`
     - `mod/quiz:view`
     - `mod/quiz:attempt`

### 2.2 사용자에게 역할 할당

1. **사이트 관리 > 사용자 > 권한 > 시스템 역할 할당**
2. 생성한 역할 선택
3. 웹 서비스를 사용할 사용자 추가

### 2.3 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "추가" 클릭
3. 토큰 정보:
   - 사용자: 웹 서비스 사용자 선택
   - 서비스: `Logic Flow Visualization Service` 선택
   - 유효 기간: 선택 사항
4. 저장
5. **생성된 토큰을 복사하여 안전하게 보관**

## 3. 애플리케이션 설정

### 3.1 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

다음 값 설정:

```env
VITE_MOODLE_URL=https://your-moodle-site.com
VITE_MOODLE_TOKEN=your-generated-token-here
```

### 3.2 연결 테스트

애플리케이션 실행 후:

1. Moodle 연결 설정 패널에서 URL과 토큰 입력
2. "연결" 버튼 클릭
3. 성공 메시지 확인

## 4. API 엔드포인트 테스트

### 4.1 cURL로 테스트

```bash
# 사이트 정보 조회
curl "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json"

# 문제 조회 (questionid=123)
curl "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_question_get_questions" \
  -d "questionids[0]=123" \
  -d "moodlewsrestformat=json"
```

### 4.2 JavaScript로 테스트

```javascript
import { createMoodleApi } from '@services/moodleApi';

const api = createMoodleApi({
  wstoken: 'your-token',
  domainname: 'https://your-moodle-site.com'
});

// 연결 테스트
const connected = await api.testConnection();
console.log('Connected:', connected);

// 문제 가져오기
const response = await api.getQuestion(123);
if (response.data) {
  console.log('Question:', response.data);
}
```

## 5. 보안 고려사항

### 5.1 토큰 보안

- 토큰을 소스 코드에 하드코딩하지 마세요
- 환경 변수 또는 보안 저장소 사용
- 프로덕션에서는 토큰 만료 설정
- HTTPS 필수 사용

### 5.2 CORS 설정

Moodle에서 CORS 허용이 필요한 경우:

```php
// config.php에 추가
$CFG->moodlelib_extra = [
    'Access-Control-Allow-Origin' => 'https://your-app-domain.com',
    'Access-Control-Allow-Methods' => 'GET, POST',
    'Access-Control-Allow-Headers' => 'Content-Type',
];
```

### 5.3 IP 화이트리스트

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. 토큰 편집
3. "허용된 IP 주소" 필드에 애플리케이션 서버 IP 추가

## 6. 문제 해결

### 6.1 "접근이 거부되었습니다" 오류

**원인**: 사용자에게 적절한 권한이 없음

**해결**:
- 웹 서비스 역할 확인
- 함수 권한 확인
- 토큰이 올바른 서비스와 연결되어 있는지 확인

### 6.2 "잘못된 토큰" 오류

**원인**: 토큰이 유효하지 않거나 만료됨

**해결**:
- 토큰 재생성
- 토큰 문자열 복사 시 공백 확인
- 토큰 만료 날짜 확인

### 6.3 CORS 오류

**원인**: 브라우저가 Cross-Origin 요청을 차단

**해결**:
- Moodle에서 CORS 설정
- 또는 프록시 서버 사용 (vite.config.ts 참조)

### 6.4 연결 타임아웃

**원인**: 네트워크 문제 또는 Moodle 서버 응답 지연

**해결**:
- 네트워크 연결 확인
- Moodle 서버 상태 확인
- 타임아웃 값 증가 (moodleApi.ts에서 설정)

## 7. 성능 최적화

### 7.1 캐싱 전략

- 자주 조회되는 문제는 로컬 캐시 사용
- Redis 또는 localStorage 활용
- 캐시 무효화 정책 설정

### 7.2 배치 요청

- 여러 문제를 한 번에 조회
- `questionids` 배열 파라미터 사용

```javascript
const response = await api.callWebService('core_question_get_questions', {
  'questionids[0]': 1,
  'questionids[1]': 2,
  'questionids[2]': 3,
});
```

## 8. 추가 리소스

- [Moodle Web Services 공식 문서](https://docs.moodle.org/dev/Web_services)
- [Moodle API Reference](https://docs.moodle.org/dev/Web_service_API_functions)
- [REST Protocol](https://docs.moodle.org/dev/Creating_a_web_service_client#REST)

## 9. 지원

문제가 발생하면:

1. 로그 확인: `src/services/moodleApi.ts`의 콘솔 로그
2. Moodle 로그: **사이트 관리 > 보고서 > 로그**
3. 네트워크 탭에서 요청/응답 확인
4. GitHub Issues에 문의
