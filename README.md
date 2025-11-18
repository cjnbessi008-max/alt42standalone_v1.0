# AI Education System Pipeline - Mind Wandering Detection

LMS와 연동하여 학생들의 학습 중 집중력 저하(Mind Wandering)를 자동으로 감지하는 시스템입니다.

## 🎯 주요 기능

### 1. 실시간 행동 추적 (Behavior Tracking)
- **마우스 움직임 추적**: 학습 콘텐츠 영역에서의 마우스 활동 모니터링
- **클릭 패턴 분석**: 클릭 빈도와 패턴으로 학습 참여도 측정
- **스크롤 추적**: 스크롤 패턴을 통한 콘텐츠 소비 분석
- **페이지 포커스 추적**: 창 전환 및 이탈 감지
- **비활성 시간 측정**: 장시간 활동 없음 탐지

### 2. Mind Wandering 자동 감지
- **다중 요인 분석**:
  - 비활성 시간 (Inactivity Duration)
  - 포커스 손실 빈도 (Focus Losses)
  - 마우스 정지 시간 (Mouse Stillness)
  - 빠른 클릭 패턴 (Rapid Clicks - 좌절감 지표)

- **신뢰도 기반 감지**: 0-1 범위의 confidence score로 감지 정확도 제공
- **실시간 분석**: 배경 작업으로 지속적 모니터링

### 3. 지능형 개입 시스템 (Intervention)
학생의 상태에 맞춘 맞춤형 알림:
- **부드러운 리마인더** (Gentle Reminder): 기본 집중력 환기
- **집중 요청** (Focus Reminder): 반복적인 이탈 시
- **휴식 제안** (Break Suggestion): 장시간 비활성 시
- **도움 제공** (Help Offer): 좌절 패턴 감지 시

### 4. LMS 통합
- **진도 동기화**: 학습 세션 및 집중도 데이터 LMS 전송
- **분석 리포트**: 교사용 대시보드 데이터 제공
- **Webhook 지원**: LMS에서 실시간 업데이트 수신

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  BehaviorTrackingProvider                        │  │
│  │    ↓                                             │  │
│  │  useBehaviorTracking Hook                        │  │
│  │    ↓                                             │  │
│  │  Event Collection (Mouse, Click, Scroll, Focus)  │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API (Batch Events)
┌───────────────────▼─────────────────────────────────────┐
│              Backend (Python FastAPI)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Behavior Tracking API                           │  │
│  │    ↓                                             │  │
│  │  Mind Wandering Detector Service                 │  │
│  │    ↓                                             │  │
│  │  Multi-factor Analysis Engine                    │  │
│  │    ↓                                             │  │
│  │  LMS Integration Service                         │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                PostgreSQL Database                       │
│  - behavior_events (행동 이벤트)                         │
│  - mind_wandering_events (감지 이벤트)                   │
│  - learning_sessions (학습 세션)                         │
│  - behavior_analytics_summary (분석 요약)               │
└─────────────────────────────────────────────────────────┘
```

## 🚀 빠른 시작

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)

### Backend 설정

```bash
cd backend

# 가상 환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 데이터베이스 마이그레이션
# (자동으로 테이블이 생성되지만, alembic을 사용할 수도 있습니다)

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면 http://localhost:8000/docs 에서 API 문서를 확인할 수 있습니다.

### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

Frontend는 http://localhost:3000 에서 실행됩니다.

## 📖 사용 방법

### Frontend 통합

```tsx
import { BehaviorTrackingProvider } from './components/BehaviorTrackingProvider';

function App() {
  const studentId = 'student-uuid';
  const moduleId = 'module-uuid';

  return (
    <BehaviorTrackingProvider
      studentId={studentId}
      moduleId={moduleId}
      apiUrl="http://localhost:8000/api/v1"
      enableAlerts={true}
    >
      <YourEducationalModule />
    </BehaviorTrackingProvider>
  );
}
```

### API 사용 예시

#### 1. 세션 시작
```bash
curl -X POST http://localhost:8000/api/v1/behavior/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "uuid-here",
    "module_id": "uuid-here",
    "device_type": "desktop",
    "browser": "chrome"
  }'
```

#### 2. 행동 이벤트 전송 (배치)
```bash
curl -X POST http://localhost:8000/api/v1/behavior/events/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "student_id": "uuid",
        "module_id": "uuid",
        "session_id": "uuid",
        "event_type": "click",
        "mouse_x": 100,
        "mouse_y": 200
      }
    ]
  }'
```

#### 3. Mind Wandering 확인
```bash
curl http://localhost:8000/api/v1/mind-wandering/detect/{student_id}/{session_id}
```

#### 4. LMS 리포트 생성
```bash
curl http://localhost:8000/api/v1/lms/report/{student_id}/{module_id}?days=7
```

## 🔧 설정 옵션

### Backend 환경 변수 (.env)

```env
# 감지 파라미터
INACTIVITY_THRESHOLD_SECONDS=30        # 비활성 임계값
MOUSE_STILLNESS_THRESHOLD_SECONDS=20   # 마우스 정지 임계값
RAPID_CLICK_THRESHOLD=10                # 빠른 클릭 임계값
MIND_WANDERING_CONFIDENCE_THRESHOLD=0.65  # 감지 신뢰도 임계값

# 가중치 (0-1)
FOCUS_LOSS_WEIGHT=0.8
INACTIVITY_WEIGHT=0.6
MOUSE_STILLNESS_WEIGHT=0.5
RAPID_CLICK_WEIGHT=0.7
```

### Frontend 옵션

```tsx
useBehaviorTracking({
  studentId: string,
  moduleId: string,
  apiUrl?: string,
  batchSize?: number,           // 이벤트 배치 크기 (기본: 50)
  flushInterval?: number,       // 전송 주기 (기본: 10000ms)
  trackMouseMove?: boolean,     // 마우스 추적 (기본: true)
  trackClicks?: boolean,        // 클릭 추적 (기본: true)
  trackScroll?: boolean,        // 스크롤 추적 (기본: true)
  trackFocus?: boolean,         // 포커스 추적 (기본: true)
  onMindWanderingDetected?: (data) => void
})
```

## 📊 데이터베이스 스키마

### behavior_events
개별 행동 이벤트 저장
- event_type: mouse_move, click, scroll, focus, blur 등
- 마우스 좌표, 스크롤 위치, 타임스탬프

### mind_wandering_events
감지된 mind wandering 이벤트
- confidence_score: 감지 신뢰도 (0-1)
- behavior_pattern: 감지 근거가 된 패턴
- intervention_type: 표시된 개입 유형
- student_response: 학생 응답

### learning_sessions
학습 세션 정보
- duration_seconds: 세션 길이
- engagement_score: 참여도 점수 (0-100)
- mind_wandering_count: mind wandering 발생 횟수

## 🎨 UI 커스터마이징

`MindWanderingAlert.css`를 수정하여 알림창 디자인을 변경할 수 있습니다.

```css
.mw-alert-container.gentle_reminder {
  border-left: 4px solid #6366f1;  /* 색상 변경 */
}
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest
```

### Frontend 테스트
```bash
cd frontend
npm run test
```

## 📈 성능 고려사항

1. **이벤트 배치 처리**: 개별 이벤트가 아닌 배치로 전송하여 네트워크 부하 감소
2. **마우스 이동 쓰로틀링**: 500ms 간격으로 제한하여 과도한 이벤트 방지
3. **백그라운드 분석**: Mind wandering 분석을 비동기로 처리
4. **데이터베이스 인덱싱**: student_id, session_id, timestamp에 인덱스 설정

## 🔒 보안 고려사항

- **데이터 익명화**: 행동 데이터에서 개인 식별 정보 제거
- **HTTPS 사용**: 프로덕션 환경에서 필수
- **CORS 설정**: 허용된 도메인만 API 접근 가능
- **Rate Limiting**: API 남용 방지

## 🌐 LMS 통합 가이드

### Webhook 설정
LMS에서 이 시스템으로 이벤트를 전송하려면:

```bash
POST http://your-domain/api/v1/lms/webhook/student-progress
{
  "event_type": "student_enrolled",
  "student_id": "uuid",
  "module_id": "uuid"
}
```

### 데이터 동기화
학생 진도를 LMS로 전송:

```bash
POST http://localhost:8000/api/v1/lms/sync
{
  "student_id": "uuid",
  "module_id": "uuid",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-01-07T23:59:59Z"
}
```

## 🤝 기여하기

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 📝 라이선스

이 프로젝트는 교육 목적으로 사용됩니다.

## 📧 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

Made with ❤️ for better education
