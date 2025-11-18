# Moodle Web Services 설정 가이드

Deviation Breeze와 Moodle LMS를 연동하기 위한 상세 설정 가이드입니다.

## 목차
1. [웹 서비스 활성화](#1-웹-서비스-활성화)
2. [외부 서비스 생성](#2-외부-서비스-생성)
3. [필요한 함수 추가](#3-필요한-함수-추가)
4. [사용자 및 역할 설정](#4-사용자-및-역할-설정)
5. [토큰 생성](#5-토큰-생성)
6. [CORS 설정](#6-cors-설정)
7. [연동 테스트](#7-연동-테스트)
8. [문제 해결](#8-문제-해결)

---

## 1. 웹 서비스 활성화

### 단계 1: 웹 서비스 활성화

1. Moodle에 **관리자**로 로그인
2. **사이트 관리 → 고급 기능**으로 이동
3. **웹 서비스 활성화** 체크박스 선택
4. **변경 사항 저장** 클릭

### 단계 2: 프로토콜 활성화

1. **사이트 관리 → 플러그인 → 웹 서비스 → 프로토콜 관리**로 이동
2. **REST 프로토콜** 옆의 눈 아이콘 클릭하여 활성화
3. 필요시 **JSON** 또는 **XML** 형식도 활성화

---

## 2. 외부 서비스 생성

### 단계 1: 새 서비스 추가

1. **사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스**로 이동
2. **사용자 정의 서비스** 탭 선택
3. **서비스 추가** 클릭

### 단계 2: 서비스 설정

다음 정보를 입력:
- **이름**: `Deviation Breeze Service`
- **짧은 이름**: `deviation_breeze`
- **활성화**: ✅ 체크
- **권한 있는 사용자**: ✅ 체크
- **다운로드 파일**: ✅ 체크 (선택사항)
- **업로드 파일**: ❌ 체크 해제 (보안)

**저장** 클릭

---

## 3. 필요한 함수 추가

생성한 서비스 옆의 **함수** 링크 클릭 후, 다음 함수들을 추가:

### 필수 함수 목록

#### 코스 관련
- `core_course_get_courses` - 코스 목록 조회
- `core_course_get_contents` - 코스 내용 조회
- `core_course_get_categories` - 카테고리 조회

#### 퀴즈 관련
- `mod_quiz_get_quizzes_by_courses` - 코스별 퀴즈 조회
- `mod_quiz_get_quiz_access_information` - 퀴즈 접근 정보
- `mod_quiz_get_user_attempts` - 사용자 응시 기록
- `mod_quiz_get_attempt_data` - 응시 상세 데이터
- `mod_quiz_get_attempt_review` - 응시 검토
- `mod_quiz_get_user_best_grade` - 최고 점수 조회

#### 사용자 관련
- `core_user_get_users` - 사용자 정보 조회
- `core_user_get_users_by_field` - 필드별 사용자 검색
- `core_enrol_get_enrolled_users` - 등록된 사용자 목록

#### 시스템 정보
- `core_webservice_get_site_info` - 사이트 정보 (연결 테스트용)

### 함수 추가 방법

1. **함수 추가** 클릭
2. 검색창에 함수명 입력
3. 함수 선택 후 **추가** 클릭
4. 모든 필수 함수에 대해 반복

---

## 4. 사용자 및 역할 설정

### 웹 서비스 전용 사용자 생성 (권장)

보안을 위해 전용 사용자를 만드는 것을 권장합니다.

#### 단계 1: 사용자 생성

1. **사이트 관리 → 사용자 → 계정 → 사용자 추가**
2. 다음 정보 입력:
   - **사용자명**: `deviation_breeze_api`
   - **비밀번호**: 강력한 비밀번호 생성
   - **이름**: `Deviation Breeze`
   - **성**: `API User`
   - **이메일**: `api@your-domain.com`

#### 단계 2: 역할 할당

1. **사이트 관리 → 사용자 → 권한 → 역할 정의**
2. **새 역할 추가** 클릭
3. **역할 이름**: `Web Service - Deviation Breeze`
4. 다음 권한 허용:
   - `webservice/rest:use` - REST 프로토콜 사용
   - `moodle/course:view` - 코스 보기
   - `moodle/course:viewhiddencourses` - 숨겨진 코스 보기
   - `mod/quiz:view` - 퀴즈 보기
   - `mod/quiz:viewreports` - 퀴즈 리포트 보기
   - `moodle/user:viewdetails` - 사용자 상세 보기

#### 단계 3: 사용자에 역할 할당

1. **사이트 관리 → 사용자 → 권한 → 시스템 권한 할당**
2. 생성한 역할 선택
3. `deviation_breeze_api` 사용자 추가

---

## 5. 토큰 생성

### 방법 1: 수동 토큰 생성 (권장)

1. **사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리**
2. **토큰 추가** 클릭
3. 설정:
   - **사용자**: `deviation_breeze_api` 선택
   - **서비스**: `Deviation Breeze Service` 선택
   - **IP 제한**: 서버 IP 입력 (보안 강화)
   - **유효 기간**: 설정 또는 비워두기 (무제한)
4. **변경 사항 저장** 클릭
5. 생성된 **토큰**을 안전하게 복사

### 방법 2: 자동 토큰 생성

서비스 설정에서 **권한 있는 사용자가 토큰 생성 가능** 옵션 활성화

---

## 6. CORS 설정

Deviation Breeze가 다른 도메인에서 실행되는 경우 CORS 설정이 필요합니다.

### PHP 설정 방법

Moodle의 `config.php` 파일에 추가:

```php
// CORS 설정
$CFG->webservice_restformat_enable = true;

// 허용할 도메인 (Deviation Breeze 서버)
header('Access-Control-Allow-Origin: https://deviation-breeze-domain.com');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
```

### Apache .htaccess 방법

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://deviation-breeze-domain.com"
    Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

---

## 7. 연동 테스트

### cURL 테스트

터미널에서 다음 명령 실행:

```bash
curl -X POST "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN_HERE" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json"
```

**성공 응답 예시**:
```json
{
  "sitename": "My Moodle Site",
  "username": "deviation_breeze_api",
  "userid": 123,
  "userpictureurl": "https://...",
  "functions": [...]
}
```

### Deviation Breeze에서 테스트

1. `.env` 파일 설정:
```bash
MOODLE_URL=https://your-moodle-site.com
MOODLE_WS_TOKEN=YOUR_TOKEN_HERE
```

2. 브라우저에서 접속:
```
http://localhost:8080/backend/public/api/v1/test/moodle
```

3. 성공 메시지 확인:
```json
{
  "success": true,
  "message": "Moodle connection successful",
  "data": {
    "sitename": "My Moodle Site",
    ...
  }
}
```

---

## 8. 문제 해결

### 오류: "Access control exception"

**원인**: 사용자 권한 부족

**해결**:
1. 사용자에 올바른 역할이 할당되었는지 확인
2. 서비스에 필요한 함수가 모두 추가되었는지 확인
3. 시스템 컨텍스트에 역할이 할당되었는지 확인

### 오류: "Invalid token"

**원인**: 토큰이 잘못되었거나 만료됨

**해결**:
1. 토큰 관리 페이지에서 토큰이 활성화되어 있는지 확인
2. 토큰 유효 기간 확인
3. 필요시 새 토큰 생성

### 오류: "IP address is not allowed"

**원인**: IP 제한 설정

**해결**:
1. 토큰 설정에서 IP 제한 확인
2. 서버 IP를 허용 목록에 추가
3. 또는 IP 제한 제거 (개발 환경)

### 오류: "Function xxx() not available"

**원인**: 함수가 서비스에 추가되지 않음

**해결**:
1. 외부 서비스 설정으로 이동
2. 해당 함수 추가
3. 서비스 재시작 (필요시)

### 오류: "CORS policy error"

**원인**: CORS 헤더 누락

**해결**:
1. 위의 [CORS 설정](#6-cors-설정) 참조
2. 브라우저 개발자 도구에서 헤더 확인
3. Apache/Nginx 설정 확인

### 웹 서비스가 전혀 작동하지 않음

**체크리스트**:
- [ ] 웹 서비스 활성화됨
- [ ] REST 프로토콜 활성화됨
- [ ] 외부 서비스 생성됨
- [ ] 필요한 함수 모두 추가됨
- [ ] 사용자에 올바른 역할 할당됨
- [ ] 토큰 생성되고 활성화됨
- [ ] 방화벽이 웹 서비스 차단하지 않음

---

## 보안 권장 사항

### 1. IP 화이트리스트

토큰에 Deviation Breeze 서버 IP만 허용:
```
192.168.1.100
10.0.0.50
```

### 2. HTTPS 필수

프로덕션 환경에서는 반드시 HTTPS 사용

### 3. 토큰 관리

- 토큰을 코드에 하드코딩하지 말 것
- 환경 변수 (`.env`) 사용
- 정기적으로 토큰 갱신

### 4. 최소 권한 원칙

필요한 함수와 권한만 허용

### 5. 로깅 활성화

```php
// config.php
$CFG->debug = DEBUG_NORMAL;
$CFG->debugdisplay = 0; // 화면에 표시 안 함
$CFG->debugwebservice = 1; // 웹 서비스 디버그
```

---

## 참고 자료

- [Moodle 공식 웹 서비스 문서](https://docs.moodle.org/en/Web_services)
- [Web Services API 레퍼런스](https://docs.moodle.org/dev/Web_services)
- [Web Services 보안](https://docs.moodle.org/en/Web_services_security)

---

## 지원

문제가 계속되면:
- **Moodle 포럼**: https://moodle.org/mod/forum/
- **Deviation Breeze 이슈**: https://github.com/your-org/deviation-breeze/issues
- **이메일**: support@kaist.edu

---

**최종 수정일**: 2025-11-18
**Moodle 버전**: 3.7+
**Deviation Breeze 버전**: 1.0.0
