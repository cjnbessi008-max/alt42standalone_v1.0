# 혼란도 시각화 시스템 (Confusion Level Visualization)

LMS와 연동하여 학습자의 머릿속 혼란도를 색상으로 실시간 시각화하는 웹 애플리케이션입니다.

## 📋 프로젝트 개요

이 시스템은 학습자의 행동 데이터(소요 시간, 시도 횟수, 정답률, 망설임 등)를 분석하여 혼란도를 0-100 점수로 계산하고, 이를 5단계 색상으로 시각화합니다.

### 주요 기능

- ✅ **실시간 혼란도 추적**: WebSocket을 통한 실시간 업데이트
- ✅ **색상 기반 시각화**: 5단계 색상으로 직관적 표현 (초록→노랑→빨강)
- ✅ **개념별 분석**: 개념별 혼란도 히트맵
- ✅ **시계열 차트**: 시간대별 혼란도 변화 추적
- ✅ **LMS 연동**: Canvas, Moodle 등 주요 LMS와 연동
- ✅ **개입 알림**: 높은 혼란도 감지 시 교사에게 알림

## 🎨 혼란도 색상 체계

| 혼란도 범위 | 색상 | 설명 |
|------------|------|------|
| 0-20% | 🟢 초록색 | 매우 잘 이해하고 있습니다 |
| 21-40% | 🟢 연두색 | 대체로 이해하고 있습니다 |
| 41-60% | 🟡 노란색 | 약간의 어려움을 겪고 있습니다 |
| 61-80% | 🟠 주황색 | 많은 어려움을 겪고 있습니다 |
| 81-100% | 🔴 빨간색 | 즉각적인 도움이 필요합니다 |

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Student Dashboard                               │   │
│  │  - ConfusionIndicator (Circle/Bar)              │   │
│  │  - ConfusionHeatMap (Concept Grid)              │   │
│  │  - ConfusionChart (Time Series)                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────▼───────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  API Routes                                      │   │
│  │  - /api/confusion/* (Confusion tracking)        │   │
│  │  - /api/lms/* (LMS integration)                 │   │
│  │  - /api/modules/* (Content)                     │   │
│  │  WebSocket: /ws/confusion/:studentId            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2. 백엔드 설정 및 실행

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

백엔드 서버가 `http://localhost:5000`에서 실행됩니다.

#### 3. 프론트엔드 설정 및 실행

새 터미널에서:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

#### 4. 브라우저에서 확인

브라우저에서 `http://localhost:3000`으로 접속하면 학생 대시보드를 확인할 수 있습니다.

## 📊 혼란도 계산 알고리즘

혼란도는 다음 행동 지표들의 가중 평균으로 계산됩니다:

```typescript
혼란도 =
  소요시간(25%) +
  시도횟수(20%) +
  오답여부(20%) +
  망설임시간(15%) +
  도움요청(10%) +
  마우스움직임(5%) +
  입력변경(5%)
```

각 지표는 0-1 사이로 정규화되어 최종 0-100 점수로 변환됩니다.

## 🔌 API 엔드포인트

### 혼란도 추적 API

#### POST `/api/confusion/metrics`
행동 데이터를 제출하여 혼란도 업데이트

**요청 본문:**
```json
{
  "studentId": "student-001",
  "conceptId": "concept-001",
  "metrics": {
    "timeSpent": 120,
    "attemptCount": 3,
    "isCorrect": false,
    "hesitationTime": 15,
    "helpRequestCount": 1,
    "mouseMovementScore": 45,
    "inputChangeCount": 7,
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

#### GET `/api/confusion/student/:studentId`
학생의 현재 혼란도 상태 조회

**쿼리 파라미터:** `moduleId`

#### GET `/api/confusion/concept/:conceptId`
특정 개념의 혼란도 조회

**쿼리 파라미터:** `studentId`

#### GET `/api/confusion/classroom/:classId`
교실 전체 혼란도 분석

**쿼리 파라미터:** `moduleId`

### LMS 연동 API

#### POST `/api/lms/initialize`
LMS 세션 초기화

#### POST `/api/lms/sync`
LMS에서 학생 데이터 동기화

#### POST `/api/lms/progress`
학습 진도를 LMS로 전송

### WebSocket 연결

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/confusion/student-001');

ws.onmessage = (event) => {
  const confusionEvent = JSON.parse(event.data);
  console.log('Confusion event:', confusionEvent);
};
```

## 🎯 사용 예시

### React 컴포넌트에서 혼란도 추적

```typescript
import { useConfusionTracking } from '@/hooks/useConfusionTracking';
import { ConfusionIndicator } from '@/components/ConfusionLevelVisualization';

function MyComponent() {
  const { confusionState, submitMetrics } = useConfusionTracking({
    studentId: 'student-001',
    moduleId: 'module-fractions-01',
    enableRealtime: true,
  });

  const handleAnswerSubmit = (answer: string) => {
    const metrics = {
      timeSpent: 60,
      attemptCount: 1,
      isCorrect: answer === correctAnswer,
      hesitationTime: 5,
      helpRequestCount: 0,
      mouseMovementScore: 20,
      inputChangeCount: 2,
      timestamp: new Date(),
    };

    submitMetrics('concept-001', metrics);
  };

  return (
    <ConfusionIndicator
      level={confusionState?.overallConfusion || 0}
      size="large"
      variant="circle"
    />
  );
}
```

### LMS 연동

```typescript
import { useLMSIntegration, useLTILaunch } from '@/hooks/useLMSIntegration';

function LMSIntegratedApp() {
  const ltiData = useLTILaunch(); // URL에서 LTI 데이터 자동 파싱

  const { connected, sendProgress } = useLMSIntegration({
    lmsData: ltiData,
    autoSync: true,
  });

  // 학습 완료 시 성적을 LMS로 전송
  const handleComplete = (score: number) => {
    if (connected) {
      sendProgress(studentId, activityId, score, true);
    }
  };
}
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── ConfusionLevelVisualization/
│   │   │       ├── ConfusionIndicator.tsx    # 원형/바 인디케이터
│   │   │       ├── ConfusionHeatMap.tsx      # 개념별 히트맵
│   │   │       └── ConfusionChart.tsx        # 시계열 차트
│   │   ├── hooks/
│   │   │   ├── useConfusionTracking.ts       # 혼란도 추적 훅
│   │   │   └── useLMSIntegration.ts          # LMS 연동 훅
│   │   ├── services/
│   │   │   ├── api.ts                        # API 클라이언트
│   │   │   └── confusionCalculator.ts        # 혼란도 계산 로직
│   │   ├── types/
│   │   │   └── confusion.ts                  # TypeScript 타입 정의
│   │   ├── pages/
│   │   │   └── StudentDashboard.tsx          # 학생 대시보드
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── confusion.ts                  # 혼란도 API
│   │   │   ├── lms.ts                        # LMS 연동 API
│   │   │   └── modules.ts                    # 콘텐츠 API
│   │   ├── models/
│   │   │   └── confusionStore.ts             # 데이터 저장소
│   │   ├── types/
│   │   │   └── confusion.ts
│   │   └── index.ts                          # 메인 서버
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # 문서
│   └── API.md                   # API 상세 문서
│
├── tasks/                       # 프로젝트 요구사항
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md
```

## 🔧 개발 가이드

### TypeScript 타입 체크

```bash
# 프론트엔드
cd frontend
npm run build

# 백엔드
cd backend
npm run build
```

### 코드 린팅

```bash
# 프론트엔드
cd frontend
npm run lint

# 백엔드
cd backend
npm run lint
```

## 🌐 LMS 연동 가이드

### Canvas LMS

Canvas LMS와 연동하려면 다음 파라미터를 포함하여 앱을 실행하세요:

```
http://localhost:3000?lms_platform=Canvas&context_id=course_123&resource_link_id=activity_456&user_id=student_789
```

### Moodle

```
http://localhost:3000?lms_platform=Moodle&course_id=123&activity_id=456&user_id=789
```

### LTI 1.3 표준

LTI 1.3 표준을 사용하는 경우, `useLTILaunch` 훅이 자동으로 launch 데이터를 파싱합니다.

## 📈 향후 개선 계획

- [ ] PostgreSQL 데이터베이스 연동
- [ ] 교사 대시보드 추가
- [ ] 머신러닝 기반 혼란도 예측
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 (영어, 중국어, 일본어)
- [ ] 상세 리포트 생성 기능
- [ ] A/B 테스트 프레임워크

## 🤝 기여하기

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템 파이프라인의 일부입니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Built with ❤️ for better learning experiences**
