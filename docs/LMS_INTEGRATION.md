# LMS 연동 가이드

## 개요

본 시스템은 LTI (Learning Tools Interoperability) 1.3 표준을 사용하여 주요 LMS 플랫폼과 연동됩니다.

## 지원 LMS

- Canvas
- Moodle
- Blackboard
- Brightspace (D2L)
- 기타 LTI 1.3 지원 LMS

## LTI 1.3 연동 설정

### 1. LMS에서 외부 도구 등록

#### Canvas

1. **Admin > Developer Keys > + Developer Key > + LTI Key** 로 이동
2. 다음 정보 입력:
   - **Key Name**: AI Education System
   - **Redirect URIs**: `https://your-domain.com/api/v1/lms/lti/launch`
   - **Method**: Manual Entry
   - **Title**: Student Solution Flowchart
   - **Target Link URI**: `https://your-domain.com/student/dashboard`
   - **OpenID Connect Initiation Url**: `https://your-domain.com/api/v1/lms/lti/login`
   - **JWK Method**: Public JWK URL
   - **Public JWK URL**: `https://your-domain.com/api/v1/lms/lti/jwks`

3. Placements 설정:
   - **Course Navigation** 체크
   - **Assignment Selection** 체크

4. 저장 후 **Client ID** 복사

#### Moodle

1. **Site administration > Plugins > Activity modules > External tool > Manage tools** 로 이동
2. **Configure a tool manually** 선택
3. 다음 정보 입력:
   - **Tool name**: AI Education System
   - **Tool URL**: `https://your-domain.com/api/v1/lms/lti/launch`
   - **LTI version**: LTI 1.3
   - **Public key type**: Keyset URL
   - **Public keyset**: `https://your-domain.com/api/v1/lms/lti/jwks`
   - **Initiate login URL**: `https://your-domain.com/api/v1/lms/lti/login`
   - **Redirection URI(s)**: `https://your-domain.com/api/v1/lms/lti/launch`

4. 저장 후 **Client ID** 복사

### 2. 키 생성

```bash
# 개인 키 생성
openssl genrsa -out keys/private.key 2048

# 공개 키 생성
openssl rsa -in keys/private.key -pubout -out keys/public.key

# JWKS 형식으로 변환 (Python 스크립트 사용)
python scripts/generate_jwks.py
```

### 3. 환경 변수 설정

`.env` 파일에 다음 추가:

```env
# LTI Configuration
LTI_ISSUER=https://canvas.instructure.com  # Canvas의 경우
LTI_CLIENT_ID=your-client-id-from-lms
LTI_DEPLOYMENT_ID=your-deployment-id
LTI_PLATFORM_PUBLIC_KEY=  # LMS의 공개 키 (필요시)
LTI_PRIVATE_KEY_PATH=./keys/private.key
```

## LTI 런치 플로우

### 1. 초기 로그인 (Login Initiation)

```
LMS → POST /api/v1/lms/lti/login
```

**Parameters:**
- `iss`: LMS의 Issuer URL
- `login_hint`: 사용자 식별자
- `target_link_uri`: 리다이렉트될 URL
- `lti_message_hint`: (선택사항) 메시지 힌트

**Response:**
시스템이 LMS의 인증 엔드포인트로 OIDC 인증 요청을 리다이렉트합니다.

### 2. LTI 런치 (Launch)

```
LMS → POST /api/v1/lms/lti/launch
```

**Parameters:**
- `id_token`: JWT ID 토큰 (LMS에서 서명)
- `state`: 상태 파라미터

**Response:**
```json
{
  "message": "LTI launch successful",
  "student_id": "uuid",
  "session_token": "jwt-token",
  "user_name": "학생 이름",
  "redirect_url": "/student/dashboard?token=..."
}
```

### 3. ID 토큰 구조

```json
{
  "iss": "https://canvas.instructure.com",
  "sub": "user-id",
  "aud": "client-id",
  "exp": 1234567890,
  "iat": 1234567890,
  "nonce": "random-nonce",
  "name": "Student Name",
  "email": "student@example.com",
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment-id",
  "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": "https://your-domain.com/student/dashboard",
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    "id": "resource-link-id",
    "title": "Problem Set 1"
  },
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    "id": "course-id",
    "label": "MATH101",
    "title": "Mathematics 101"
  },
  "https://purl.imsglobal.org/spec/lti/claim/roles": [
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
  ]
}
```

## Grade Passback (성적 전송)

### Assignment and Grade Services (AGS) 사용

```javascript
// 성적 전송 예제
POST /api/v1/lms/grade-passback
{
  "solution_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Grade prepared for passback",
  "grade_data": {
    "userId": "student-id",
    "scoreGiven": 1.0,
    "scoreMaximum": 1.0,
    "comment": "Time spent: 120s, Attempts: 5",
    "activityProgress": "Completed",
    "gradingProgress": "FullyGraded",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### LMS로 성적 전송 프로세스

1. 학생이 답안 제출
2. 시스템이 자동으로 채점
3. AGS 엔드포인트로 성적 전송
4. LMS 성적부에 자동 반영

## Deep Linking

교사가 LMS 내에서 특정 문제나 모듈을 선택할 수 있도록 합니다.

```
POST /api/v1/lms/lti/deep-link
```

**Response:**
```json
{
  "available_modules": [
    {
      "id": "fractions-module",
      "title": "Fractions Learning Module",
      "description": "Interactive fractions learning with visual flowcharts"
    }
  ]
}
```

## 보안 고려사항

### 1. ID 토큰 검증

시스템은 다음을 검증합니다:
- 서명 유효성 (LMS 공개 키 사용)
- `iss` (Issuer) 일치
- `aud` (Audience) 일치
- `exp` (만료 시간) 확인
- `nonce` 중복 사용 방지

### 2. State 파라미터

CSRF 공격 방지를 위해 state 파라미터를 사용합니다.

### 3. HTTPS 필수

모든 LTI 통신은 HTTPS를 통해서만 이루어져야 합니다.

## 테스트

### 로컬 테스트

1. **ngrok 등을 사용하여 로컬 서버를 공개:**
```bash
ngrok http 8000
```

2. **ngrok URL을 LMS 설정에 사용**

3. **LMS에서 도구 실행하여 테스트**

### LTI Advantage Test Suite

IMS Global의 공식 테스트 도구 사용:
https://lti-ri.imsglobal.org/

## 문제 해결

### 일반적인 문제

**Q: "Invalid state parameter" 오류**
- State가 세션에 저장되고 검증되는지 확인
- 쿠키가 활성화되어 있는지 확인

**Q: "Invalid signature" 오류**
- LMS의 공개 키가 올바른지 확인
- 시스템 시간이 동기화되어 있는지 확인

**Q: Grade Passback 실패**
- AGS scope가 요청되었는지 확인
- LMS에서 성적 동기화가 활성화되어 있는지 확인

## 참고 자료

- [IMS LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [Canvas LTI 1.3 Guide](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)
- [Moodle LTI Documentation](https://docs.moodle.org/en/LTI_and_Moodle)
