# LMS Focus Mode Architecture - Eye Blink Detection

## 개요 (Overview)

학습자의 눈 깜빡임 빈도를 실시간으로 감지하여 집중 상태를 파악하고, 집중도가 높을 때 자동으로 Focus Mode를 활성화하는 시스템입니다.

## 핵심 개념 (Core Concept)

- **정상 깜빡임**: 분당 15-20회 (Normal: 15-20 blinks/minute)
- **집중 상태**: 분당 10회 이하 (Focused: ≤10 blinks/minute)
- **산만한 상태**: 분당 25회 이상 (Distracted: ≥25 blinks/minute)

## 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                         LMS Web App                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │  Camera Module   │───────▶│  Eye Tracking Engine     │  │
│  │  (MediaPipe)     │        │  (Face & Eye Detection)  │  │
│  └──────────────────┘        └───────────┬──────────────┘  │
│                                           │                  │
│                                           ▼                  │
│                              ┌──────────────────────────┐   │
│                              │  Blink Detection Logic   │   │
│                              │  - Blink counter         │   │
│                              │  - Rate calculator       │   │
│                              │  - Moving average        │   │
│                              └───────────┬──────────────┘   │
│                                           │                  │
│                                           ▼                  │
│                              ┌──────────────────────────┐   │
│                              │  Focus Mode Controller   │   │
│                              │  - Threshold detection   │   │
│                              │  - State management      │   │
│                              │  - Event emissions       │   │
│                              └───────────┬──────────────┘   │
│                                           │                  │
│  ┌────────────────────────────────────────┼──────────────┐  │
│  │                                        ▼              │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │  Focus Mode UI  │      │  Analytics Dashboard │  │  │
│  │  │  - Visual cues  │      │  - Focus metrics     │  │  │
│  │  │  - Notification │      │  - Session history   │  │  │
│  │  └─────────────────┘      └──────────────────────┘  │  │
│  │                           Learning Content Area      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Focus Session API                                    │  │
│  │  - POST /api/focus-sessions (start session)          │  │
│  │  - PUT /api/focus-sessions/:id (update metrics)      │  │
│  │  - GET /api/focus-sessions/user/:userId (history)    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Analytics Service                                    │  │
│  │  - Focus duration tracking                           │  │
│  │  - Engagement scoring                                │  │
│  │  - Insights generation                               │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  - focus_sessions                                            │
│  - blink_metrics                                             │
│  - engagement_scores                                         │
└─────────────────────────────────────────────────────────────┘
```

## 기술 스택 (Tech Stack)

### Frontend
- **MediaPipe Face Mesh**: Google의 얼굴 랜드마크 감지 라이브러리
- **TensorFlow.js**: 브라우저 기반 ML 추론
- **React + TypeScript**: UI 프레임워크
- **WebRTC**: 카메라 접근

### Backend
- **Node.js + Express**: API 서버
- **PostgreSQL**: 세션 데이터 저장
- **Redis**: 실시간 메트릭 캐싱

## 구현 상세 (Implementation Details)

### 1. 눈 깜빡임 감지 알고리즘 (Blink Detection Algorithm)

```typescript
// Eye Aspect Ratio (EAR) 계산
// EAR < 0.2 일 때 눈이 감긴 것으로 판단

function calculateEAR(eyeLandmarks: Point[]): number {
  // p2-p6, p3-p5 (vertical distances)
  const vertical1 = distance(eyeLandmarks[1], eyeLandmarks[5]);
  const vertical2 = distance(eyeLandmarks[2], eyeLandmarks[4]);

  // p1-p4 (horizontal distance)
  const horizontal = distance(eyeLandmarks[0], eyeLandmarks[3]);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// 깜빡임 감지
let eyeClosedFrames = 0;
const EAR_THRESHOLD = 0.2;
const CONSECUTIVE_FRAMES = 2;

if (ear < EAR_THRESHOLD) {
  eyeClosedFrames++;
} else {
  if (eyeClosedFrames >= CONSECUTIVE_FRAMES) {
    blinkCount++;
  }
  eyeClosedFrames = 0;
}
```

### 2. 집중모드 트리거 로직 (Focus Mode Trigger Logic)

```typescript
// 60초 이동 평균 윈도우
const WINDOW_SIZE = 60; // seconds
const FOCUS_THRESHOLD = 10; // blinks per minute
const UNFOCUS_THRESHOLD = 20; // blinks per minute

class FocusModeController {
  private blinkHistory: Array<{timestamp: number, count: number}> = [];
  private focusModeActive = false;

  updateBlinkRate(currentBlinkCount: number) {
    const now = Date.now();
    this.blinkHistory.push({timestamp: now, count: currentBlinkCount});

    // 60초 이전 데이터 제거
    this.blinkHistory = this.blinkHistory.filter(
      item => now - item.timestamp < WINDOW_SIZE * 1000
    );

    // 분당 깜빡임 수 계산
    const totalBlinks = this.blinkHistory.reduce((sum, item) => sum + item.count, 0);
    const timeWindowSeconds = (now - this.blinkHistory[0].timestamp) / 1000;
    const blinksPerMinute = (totalBlinks / timeWindowSeconds) * 60;

    // 집중모드 토글
    if (!this.focusModeActive && blinksPerMinute <= FOCUS_THRESHOLD) {
      this.activateFocusMode();
    } else if (this.focusModeActive && blinksPerMinute >= UNFOCUS_THRESHOLD) {
      this.deactivateFocusMode();
    }

    return {blinksPerMinute, focusModeActive: this.focusModeActive};
  }
}
```

### 3. Focus Mode UI Features

집중모드 활성화 시:
- ✅ 알림 최소화 (Minimize notifications)
- ✅ 타이머 표시 (Show focus timer)
- ✅ 배경 색상 변경 (Subtle background change)
- ✅ 사이드바 자동 숨김 (Auto-hide sidebar)
- ✅ 전체화면 권장 (Suggest fullscreen)
- ✅ 집중 세션 기록 (Record focus session)

### 4. 프라이버시 및 보안 (Privacy & Security)

- ✅ 모든 처리는 **브라우저 로컬**에서 수행
- ✅ 카메라 영상은 **서버로 전송하지 않음**
- ✅ 사용자 명시적 동의 필요 (Camera permission required)
- ✅ 카메라 OFF 옵션 제공
- ✅ 익명화된 메트릭만 서버 전송 (Only anonymized metrics sent to server)

### 5. LMS 통합 포인트 (LMS Integration Points)

#### Iframe Embed
```html
<iframe
  src="https://your-app.com/focus-learning?courseId=123"
  allow="camera"
  width="100%"
  height="600px"
></iframe>
```

#### JavaScript SDK
```javascript
// LMS에서 사용할 수 있는 SDK
const focusMode = new FocusModeLearning({
  courseId: '123',
  userId: 'user456',
  onFocusStart: (session) => { /* ... */ },
  onFocusEnd: (session) => { /* ... */ },
  apiKey: 'your-api-key'
});

focusMode.init();
```

#### LTI 1.3 Integration (Future)
- LTI Advantage 표준 준수
- Canvas, Moodle, Blackboard 지원

### 6. 데이터 스키마 (Database Schema)

```sql
-- 집중 세션 테이블
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  avg_blink_rate DECIMAL(5,2),
  focus_score INTEGER, -- 0-100
  created_at TIMESTAMP DEFAULT NOW()
);

-- 깜빡임 메트릭 (시계열 데이터)
CREATE TABLE blink_metrics (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES focus_sessions(id),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  blink_count INTEGER NOT NULL,
  blinks_per_minute DECIMAL(5,2),
  focus_state VARCHAR(20) -- 'focused', 'normal', 'distracted'
);

-- 인덱스
CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id, start_time DESC);
CREATE INDEX idx_blink_metrics_session ON blink_metrics(session_id, timestamp);
```

## API 명세 (API Specification)

### Start Focus Session
```http
POST /api/focus-sessions
Content-Type: application/json

{
  "userId": "user123",
  "courseId": "course456"
}

Response:
{
  "sessionId": "uuid",
  "startTime": "2025-11-18T10:00:00Z"
}
```

### Update Session Metrics
```http
PUT /api/focus-sessions/:sessionId/metrics
Content-Type: application/json

{
  "blinkCount": 5,
  "blinksPerMinute": 12.5,
  "focusState": "focused"
}

Response:
{
  "success": true
}
```

### End Focus Session
```http
PUT /api/focus-sessions/:sessionId/end
Content-Type: application/json

{
  "endTime": "2025-11-18T11:00:00Z"
}

Response:
{
  "sessionId": "uuid",
  "duration": 3600,
  "avgBlinkRate": 11.2,
  "focusScore": 85
}
```

### Get User Focus History
```http
GET /api/focus-sessions/user/:userId?limit=10&offset=0

Response:
{
  "sessions": [
    {
      "sessionId": "uuid",
      "courseId": "course456",
      "startTime": "2025-11-18T10:00:00Z",
      "duration": 3600,
      "focusScore": 85
    }
  ],
  "total": 42
}
```

## 성능 고려사항 (Performance Considerations)

1. **카메라 프레임 레이트**: 15-30 FPS 권장
2. **얼굴 감지 빈도**: 매 프레임마다 (실시간 필요)
3. **서버 전송 빈도**: 10초마다 배치 전송
4. **브라우저 메모리**: 최대 50MB 제한
5. **CPU 사용률**: 30% 이하 유지

## 테스트 시나리오 (Test Scenarios)

- [ ] 정상적인 학습 중 자동 집중모드 활성화
- [ ] 사용자가 산만해질 때 집중모드 해제
- [ ] 카메라 권한 거부 시 graceful fallback
- [ ] 저사양 디바이스에서 성능 테스트
- [ ] 다양한 조명 환경에서 감지 정확도
- [ ] 안경 착용 시 감지 정확도
- [ ] 여러 얼굴이 화면에 있을 때 처리

## 향후 개선사항 (Future Enhancements)

1. **AI 기반 집중도 예측**: 깜빡임 외 추가 신호 활용
2. **머리 자세 분석**: 화면 주시 여부 판단
3. **휴식 권장**: 장시간 집중 시 알림
4. **게이미피케이션**: 집중 스트릭, 배지 시스템
5. **팀 학습 지원**: 그룹 학습 시 전체 집중도 시각화
6. **다국어 지원**: UI 및 알림 다국어화

## 참고 자료 (References)

- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh.html
- Eye Aspect Ratio (EAR) Paper: Soukupová and Čech (2016)
- Blink Rate Research: Bentivoglio et al. (1997) - Normal: 17 blinks/min
- LTI 1.3 Specification: https://www.imsglobal.org/spec/lti/v1p3
