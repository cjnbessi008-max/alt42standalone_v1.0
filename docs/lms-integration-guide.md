# LMS Integration Guide

LMS 플랫폼에 Focus Mode를 통합하는 방법을 안내합니다.

## 통합 방법 (Integration Methods)

### 1. JavaScript SDK (권장)

가장 간단하고 유연한 통합 방법입니다.

#### 설치

```bash
npm install focus-mode-lms-sdk
```

또는 CDN 사용:

```html
<script src="https://cdn.example.com/focus-mode-sdk.min.js"></script>
```

#### 사용 예제

```javascript
// SDK 초기화
const focusMode = new FocusModeLMSSDK({
  apiUrl: 'https://your-focus-mode-api.com',
  apiKey: 'your-api-key', // Optional
  courseId: 'course-123',
  userId: 'user-456',
  autoStart: false,
  onFocusStart: (sessionId) => {
    console.log('Focus mode started:', sessionId);
    // LMS에 이벤트 전송
    sendEventToLMS('focus_start', { sessionId });
  },
  onFocusEnd: (sessionId, duration, score) => {
    console.log('Focus ended:', { sessionId, duration, score });
    // LMS에 결과 저장
    saveFocusScoreToLMS(sessionId, score);
  },
  onError: (error) => {
    console.error('Focus mode error:', error);
  }
});

// 컨테이너에 마운트
const container = document.getElementById('focus-mode-container');
await focusMode.init(container);

// 세션 시작
await focusMode.start();

// 세션 종료 (학습 완료 시)
await focusMode.end();

// 사용자 통계 가져오기
const stats = await focusMode.getUserStats();
console.log('User focus stats:', stats);

// 정리
focusMode.destroy();
```

### 2. Iframe Embed

간단한 HTML 임베드 방식입니다.

```html
<iframe
  src="https://your-focus-mode-api.com/focus-learning?courseId=course-123&userId=user-456"
  allow="camera"
  width="100%"
  height="600px"
  style="border: none;"
></iframe>
```

### 3. LTI 1.3 Integration (향후 지원)

표준 LTI (Learning Tools Interoperability) 프로토콜을 사용한 통합.

## Canvas LMS 통합 예제

### 1. External Tool 등록

Canvas Admin → Developer Keys → + Developer Key

```json
{
  "title": "Focus Mode Learning",
  "description": "AI-powered focus tracking for learning",
  "target_link_uri": "https://your-focus-mode-api.com/lti/launch",
  "oidc_initiation_url": "https://your-focus-mode-api.com/lti/login",
  "public_jwk_url": "https://your-focus-mode-api.com/.well-known/jwks.json",
  "scopes": [
    "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
    "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly"
  ]
}
```

### 2. 코스에 추가

Course → Settings → Apps → + App

### 3. 커스텀 코드로 통합

Course → Pages → + Page → HTML Editor

```html
<div id="focus-mode-app"></div>

<script src="https://cdn.example.com/focus-mode-sdk.min.js"></script>
<script>
  // Canvas API에서 현재 사용자 및 코스 정보 가져오기
  const courseId = window.ENV.COURSE_ID;
  const userId = window.ENV.current_user_id;

  // Focus Mode 초기화
  const focusMode = new FocusModeLMSSDK({
    apiUrl: 'https://your-focus-mode-api.com',
    courseId: courseId,
    userId: userId,
    onFocusEnd: async (sessionId, duration, score) => {
      // Canvas Gradebook에 점수 전송
      await submitScoreToCanvas(score);
    }
  });

  async function submitScoreToCanvas(score) {
    // Canvas API를 사용하여 성적 제출
    const assignmentId = 'your-assignment-id';
    const response = await fetch(
      `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${canvasAccessToken}`
        },
        body: JSON.stringify({
          submission: {
            submission_type: 'online_text_entry',
            body: `Focus Score: ${score}/100`
          }
        })
      }
    );
  }

  // 앱 초기화
  const container = document.getElementById('focus-mode-app');
  focusMode.init(container);
</script>
```

## Moodle 통합 예제

### 1. 플러그인 설치 (향후 제공 예정)

```bash
# Moodle plugins 디렉토리에 복사
cp -r focus-mode-plugin /var/www/moodle/mod/focusmode
cd /var/www/moodle
php admin/cli/upgrade.php
```

### 2. 액티비티 추가

Course → Add an activity → Focus Mode Learning

### 3. 설정

- API URL: https://your-focus-mode-api.com
- API Key: your-api-key
- 자동 시작: Yes/No
- 성적 반영: Yes/No

## Google Classroom 통합

### 1. Add-on 생성 (향후 제공 예정)

Google Workspace Marketplace에서 "Focus Mode Learning" 검색 후 설치

### 2. 과제에 추가

Create Assignment → Add-ons → Focus Mode Learning

## API 엔드포인트

### 세션 관리

```
POST   /api/focus-sessions              # 세션 생성
GET    /api/focus-sessions/:sessionId   # 세션 조회
PUT    /api/focus-sessions/:sessionId/metrics  # 메트릭 업데이트
PUT    /api/focus-sessions/:sessionId/end      # 세션 종료
```

### 사용자 데이터

```
GET    /api/focus-sessions/user/:userId           # 사용자 세션 목록
GET    /api/focus-sessions/user/:userId/stats    # 사용자 통계
```

### 코스 분석

```
GET    /api/focus-sessions/course/:courseId/analytics  # 코스 분석
```

### 리더보드

```
GET    /api/focus-sessions/leaderboard?metric=avg_focus_score&limit=10
```

## 인증 (Authentication)

### API Key 방식

```javascript
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}
```

### OAuth 2.0 (향후 지원)

표준 OAuth 2.0 플로우 지원 예정

## 웹훅 (Webhooks)

LMS로 이벤트를 실시간 전송할 수 있습니다.

### 웹훅 등록

```bash
POST /api/webhooks
{
  "url": "https://your-lms.com/webhooks/focus-mode",
  "events": ["focus.start", "focus.end", "session.complete"],
  "secret": "your-webhook-secret"
}
```

### 이벤트 페이로드 예제

```json
{
  "event": "focus.end",
  "timestamp": "2025-11-18T10:30:00Z",
  "data": {
    "sessionId": "uuid",
    "userId": "user-123",
    "courseId": "course-456",
    "duration": 1800,
    "focusScore": 85,
    "avgBlinkRate": 11.2
  },
  "signature": "sha256_hmac_signature"
}
```

## 프라이버시 및 보안

### GDPR 준수

- ✅ 모든 비디오 처리는 클라이언트 측에서 수행
- ✅ 서버에 전송되는 데이터는 익명화된 메트릭만
- ✅ 사용자는 언제든지 데이터 삭제 요청 가능
- ✅ 데이터 보존 기간 설정 가능

### 데이터 삭제 API

```bash
DELETE /api/focus-sessions/user/:userId
```

### 카메라 권한

- 사용자 명시적 동의 필요
- 브라우저 표준 권한 API 사용
- 거부 시에도 학습 콘텐츠 접근 가능

## 성능 최적화

### 클라이언트 측

- MediaPipe 모델 지연 로딩
- 비디오 프레임 레이트 조절 (15-30 FPS)
- 웹 워커 사용하여 메인 스레드 부하 감소

### 서버 측

- PostgreSQL 연결 풀링
- Redis 캐싱 (선택사항)
- 배치 메트릭 전송 (10초마다)

## 문제 해결 (Troubleshooting)

### 카메라 접근 안 됨

```javascript
// HTTPS 필수 (localhost 제외)
// Chrome: chrome://flags/#unsafely-treat-insecure-origin-as-secure

// 권한 확인
navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('Camera permission:', result.state);
});
```

### 낮은 감지 정확도

- 조명 개선
- 카메라 위치 조정 (정면)
- 안경 반사 줄이기

### 성능 이슈

```javascript
// 프레임 레이트 낮추기
const config = {
  frameRate: 15, // 기본값: 30
  videoWidth: 320, // 기본값: 640
  videoHeight: 240 // 기본값: 480
};
```

## 예제 프로젝트

GitHub에서 전체 예제 프로젝트를 확인하세요:

- [Canvas LMS Example](https://github.com/example/focus-mode-canvas)
- [Moodle Plugin](https://github.com/example/focus-mode-moodle)
- [Standalone Demo](https://github.com/example/focus-mode-demo)

## 지원 및 문의

- 📧 Email: support@focusmode.com
- 💬 Discord: https://discord.gg/focusmode
- 📚 Docs: https://docs.focusmode.com
- 🐛 Issues: https://github.com/example/focus-mode/issues
