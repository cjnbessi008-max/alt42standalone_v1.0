# LMS Focus Mode - 눈 깜빡임 기반 집중도 추적 시스템

LMS(Learning Management System)와 연동하여 눈 깜빡임을 감지하고, 학습자의 집중도를 실시간으로 추적하는 AI 기반 시스템입니다.

## 🎯 주요 기능

- **실시간 눈 깜빡임 감지**: MediaPipe Face Mesh를 사용한 정확한 눈 추적
- **자동 집중 모드**: 깜빡임이 줄어들면 자동으로 집중 모드 활성화
- **학습 세션 추적**: 집중 시간, 집중 점수 등 상세 메트릭 기록
- **LMS 통합**: Canvas, Moodle 등 주요 LMS 플랫폼 통합 지원
- **프라이버시 보호**: 모든 비디오 처리는 브라우저 로컬에서 수행

## 📊 집중 상태 기준

- 🎯 **집중**: 분당 10회 이하의 깜빡임
- 😊 **정상**: 분당 15-20회의 깜빡임
- 😵 **산만**: 분당 25회 이상의 깜빡임

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│         LMS Web Application              │
│  ┌─────────────────────────────────┐    │
│  │  Camera → MediaPipe Face Mesh   │    │
│  │     ↓                            │    │
│  │  Eye Aspect Ratio (EAR)          │    │
│  │     ↓                            │    │
│  │  Blink Detection                 │    │
│  │     ↓                            │    │
│  │  Focus Mode Controller           │    │
│  └─────────────────────────────────┘    │
└───────────────┬─────────────────────────┘
                │ REST API
                ↓
┌─────────────────────────────────────────┐
│      Backend API (Node.js + Express)     │
│  ┌─────────────────────────────────┐    │
│  │  Session Management              │    │
│  │  Analytics Service               │    │
│  │  User Statistics                 │    │
│  └─────────────────────────────────┘    │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│         PostgreSQL Database              │
│  - focus_sessions                        │
│  - blink_metrics                         │
│  - user_focus_stats                      │
└─────────────────────────────────────────┘
```

## 🚀 빠른 시작

### 데모 실행

가장 빠르게 시스템을 체험하려면 데모 페이지를 열어보세요:

```bash
# 브라우저에서 직접 열기
open demo/index.html

# 또는 간단한 HTTP 서버 실행
cd demo
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### 전체 개발 환경 설정

#### 1. 필수 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 또는 yarn

#### 2. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb focus_mode_db

# 스키마 적용
psql focus_mode_db < src/backend/schema.sql
```

#### 3. 의존성 설치

```bash
# 루트 및 모든 워크스페이스 설치
npm run install:all
```

#### 4. 환경 변수 설정

```bash
# 백엔드 환경 변수
cp src/backend/.env.example src/backend/.env

# .env 파일 수정
# DATABASE_URL=postgresql://localhost:5432/focus_mode_db
# PORT=3001
```

#### 5. 개발 서버 실행

```bash
# 프론트엔드와 백엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:backend  # Backend: http://localhost:3001
npm run dev:frontend # Frontend: http://localhost:3000
```

## 📦 프로젝트 구조

```
alt42standalone_v1.0/
├── docs/                          # 문서
│   ├── lms-focus-mode-architecture.md
│   └── lms-integration-guide.md
├── src/
│   ├── frontend/                  # React 프론트엔드
│   │   ├── components/            # UI 컴포넌트
│   │   │   ├── FocusModeLearning.tsx
│   │   │   ├── FocusModeIndicator.tsx
│   │   │   ├── BlinkMetricsDisplay.tsx
│   │   │   └── FocusTimer.tsx
│   │   ├── hooks/                 # React Hooks
│   │   │   ├── useEyeTracking.ts
│   │   │   └── useFocusMode.ts
│   │   ├── services/              # 비즈니스 로직
│   │   │   ├── BlinkDetector.ts
│   │   │   └── FocusModeController.ts
│   │   └── types/                 # TypeScript 타입
│   │       └── focus-mode.types.ts
│   ├── backend/                   # Node.js 백엔드
│   │   ├── server.ts
│   │   ├── schema.sql             # 데이터베이스 스키마
│   │   ├── controllers/
│   │   │   └── focusSessionController.ts
│   │   └── routes/
│   │       └── focusSessionRoutes.ts
│   └── lms-integration/           # LMS 통합 SDK
│       └── FocusModeLMSSDK.ts
├── demo/                          # 독립 실행형 데모
│   └── index.html
├── tasks/                         # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── package.json
```

## 🔌 LMS 통합

### JavaScript SDK 사용

```javascript
import { FocusModeLMSSDK } from 'focus-mode-lms-sdk';

const focusMode = new FocusModeLMSSDK({
  apiUrl: 'https://your-api.com',
  courseId: 'course-123',
  userId: 'user-456',
  onFocusStart: (sessionId) => {
    console.log('Focus started:', sessionId);
  },
  onFocusEnd: (sessionId, duration, score) => {
    console.log('Focus ended:', { duration, score });
    // LMS에 점수 저장
    saveFocusScoreToLMS(score);
  }
});

// 초기화
await focusMode.init(document.getElementById('container'));

// 세션 시작
await focusMode.start();

// 세션 종료
await focusMode.end();
```

### Iframe 임베드

```html
<iframe
  src="https://your-api.com/focus-learning?courseId=123&userId=456"
  allow="camera"
  width="100%"
  height="600px"
></iframe>
```

자세한 통합 가이드는 [LMS 통합 문서](./docs/lms-integration-guide.md)를 참조하세요.

## 🔧 API 엔드포인트

### 세션 관리

```
POST   /api/focus-sessions              # 세션 생성
GET    /api/focus-sessions/:sessionId   # 세션 조회
PUT    /api/focus-sessions/:sessionId/metrics  # 메트릭 업데이트
PUT    /api/focus-sessions/:sessionId/end      # 세션 종료
```

### 사용자 통계

```
GET    /api/focus-sessions/user/:userId        # 세션 목록
GET    /api/focus-sessions/user/:userId/stats  # 사용자 통계
```

### 코스 분석

```
GET    /api/focus-sessions/course/:courseId/analytics  # 코스 분석
GET    /api/focus-sessions/leaderboard                 # 리더보드
```

## 📊 데이터베이스 스키마

주요 테이블:

- `focus_sessions`: 집중 세션 기록
- `blink_metrics`: 시계열 깜빡임 데이터
- `user_focus_stats`: 사용자 집중도 통계
- `course_focus_analytics`: 코스별 분석 데이터

자세한 스키마는 [schema.sql](./src/backend/schema.sql)을 참조하세요.

## 🧪 기술 스택

### Frontend
- React 18+ with TypeScript
- MediaPipe Face Mesh (얼굴 랜드마크 감지)
- TensorFlow.js (브라우저 ML 추론)
- WebRTC (카메라 접근)

### Backend
- Node.js + Express
- PostgreSQL 15+
- TypeScript

### AI/ML
- MediaPipe Face Mesh
- Eye Aspect Ratio (EAR) 알고리즘

## 🔒 프라이버시 및 보안

- ✅ 모든 비디오 처리는 **브라우저 로컬**에서 수행
- ✅ 카메라 영상은 **서버로 전송되지 않음**
- ✅ 익명화된 메트릭만 선택적으로 서버 전송
- ✅ 사용자 명시적 동의 필요
- ✅ GDPR 준수

## 📈 성능 최적화

- 프레임 레이트: 15-30 FPS (조절 가능)
- CPU 사용률: 30% 이하 유지
- 메모리 사용: 최대 50MB
- 서버 전송 빈도: 10초마다 배치 전송

## 🧩 알고리즘

### Eye Aspect Ratio (EAR)

눈 깜빡임을 감지하기 위해 Eye Aspect Ratio 알고리즘을 사용합니다:

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

눈을 뜨고 있을 때: EAR ≈ 0.3
눈을 감았을 때: EAR ≈ 0.1-0.2
```

EAR < 0.2가 2프레임 이상 연속되면 깜빡임으로 판단합니다.

### 집중도 점수 계산

```
Focus Score = 40% (깜빡임 빈도) + 40% (집중 상태 비율) + 20% (세션 지속시간)
```

## 🐛 문제 해결

### 카메라 접근 안 됨

- HTTPS 필수 (localhost는 예외)
- 브라우저 권한 설정 확인
- `chrome://settings/content/camera`에서 권한 확인

### 낮은 감지 정확도

- 충분한 조명 확보
- 카메라를 정면으로 배치
- 안경 반사 최소화

### 성능 이슈

```javascript
// 설정에서 프레임 레이트 조절
const config = {
  frameRate: 15,      // 30 → 15로 낮춤
  videoWidth: 320,    // 640 → 320으로 낮춤
  videoHeight: 240    // 480 → 240으로 낮춤
};
```

## 🛣️ 로드맵

- [x] 눈 깜빡임 감지 엔진
- [x] 집중모드 자동 활성화
- [x] Backend API 구현
- [x] LMS SDK 개발
- [ ] LTI 1.3 통합
- [ ] Canvas LMS 플러그인
- [ ] Moodle 플러그인
- [ ] 머리 자세 분석 추가
- [ ] 휴식 권장 알림
- [ ] 게이미피케이션 (배지, 스트릭)

## 📚 참고 자료

- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [Eye Aspect Ratio Paper](https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf) - Soukupová and Čech (2016)
- [Blink Rate Research](https://pubmed.ncbi.nlm.nih.gov/9100089/) - Bentivoglio et al. (1997)

## 🤝 기여하기

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 📄 라이센스

MIT License

## 💬 지원

- 이슈 리포트: GitHub Issues
- 문서: [docs/](./docs/)
- 데모: [demo/index.html](./demo/index.html)

---

**Made with ❤️ for better learning experiences**
