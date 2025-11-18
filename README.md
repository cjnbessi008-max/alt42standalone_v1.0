# AI Education System Pipeline

AI 기반 교육 모듈 자동 생성 시스템 - KAIST

## 📋 프로젝트 개요

선생님이 자연어로 교육 모듈을 요청하면, AI가 자동으로 학습 콘텐츠, 비즈니스 규칙, 데이터 스키마, UI를 생성하여 완전한 교육 모듈을 제공하는 시스템입니다.

### 주요 기능

- 🤖 **AI 기반 자동 생성**: 자연어 요청으로 교육 모듈 생성
- 📚 **LMS 통합**: 완전한 학습 관리 시스템
- 🎯 **집중 이탈 감지**: 실시간 학생 집중도 추적
- 🧘 **15초 멍때리기 가이드**: 집중력 회복을 위한 짧은 휴식 가이드
- 📊 **실시간 분석**: 학생 학습 패턴 및 집중도 통계
- 🎨 **동적 UI 생성**: 모듈별 맞춤형 인터페이스

## 🆕 최신 기능: 집중 이탈 감지 및 휴식 가이드

학습 중 학생의 집중 이탈을 자동으로 감지하고, 15초간의 짧은 멍때리기 가이드를 제공합니다.

### 특징

- ✅ **자동 감지**: Page Visibility API + 마우스/키보드 활동 추적
- ✅ **다양한 휴식 활동**: 호흡, 스트레칭, 눈 휴식, 마음챙김
- ✅ **LMS 연동**: 집중도 데이터 자동 수집 및 분석
- ✅ **실시간 통계**: 학생별/모듈별 집중도 리포트
- ✅ **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- ✅ **접근성**: WCAG 2.1 AA 준수

### 빠른 시작

```tsx
import { StudentLearningContainer } from './components/StudentLearningContainer';

function LearningPage() {
  return (
    <StudentLearningContainer
      studentId="student123"
      moduleId="module456"
      idleThreshold={30000}    // 30초
      breakDuration={15}        // 15초
    >
      <YourLearningContent />
    </StudentLearningContainer>
  );
}
```

자세한 내용은 [집중 이탈 감지 가이드](./docs/FOCUS_DETECTION_GUIDE.md)를 참조하세요.

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── IdleBreakGuide.tsx        # 15초 휴식 가이드
│   │   │   └── StudentLearningContainer.tsx  # 학습 컨테이너
│   │   ├── hooks/            # Custom React Hooks
│   │   │   └── useFocusDetection.ts      # 집중 감지 훅
│   │   ├── services/         # API 서비스
│   │   │   └── focusTrackingService.ts   # 집중 추적 서비스
│   │   └── examples/         # 사용 예시
│   │       └── FractionLearningExample.tsx
│   └── package.json
├── backend/                   # Node.js 백엔드
│   ├── src/
│   │   ├── routes/           # API 라우트
│   │   │   └── focusTracking.ts
│   │   ├── controllers/      # 컨트롤러
│   │   │   └── focusTrackingController.ts
│   │   ├── services/         # 비즈니스 로직
│   │   │   └── focusTrackingService.ts
│   │   ├── types/            # TypeScript 타입
│   │   │   └── focusTracking.ts
│   │   └── database/         # 데이터베이스
│   │       └── migrations/
│   │           └── 001_create_focus_tracking_tables.sql
│   └── package.json
├── docs/                      # 문서
│   └── FOCUS_DETECTION_GUIDE.md
├── tasks/                     # 프로젝트 태스크
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🚀 설치 및 실행

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 또는 yarn

### 1. 데이터베이스 설정

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ai_education;

# 마이그레이션 실행
\c ai_education
\i backend/src/database/migrations/001_create_focus_tracking_tables.sql
```

### 2. 백엔드 설정

```bash
cd backend

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

## 📖 문서

- [집중 이탈 감지 시스템 가이드](./docs/FOCUS_DETECTION_GUIDE.md) - 상세 문서
- [PRD: AI Education Pipeline](./tasks/0001-prd-ai-education-pipeline.md) - 전체 시스템 설계

## 🔌 API 엔드포인트

### 집중 추적 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/focus-tracking/events` | 이벤트 기록 |
| GET | `/api/focus-tracking/statistics` | 학생 통계 조회 |
| GET | `/api/focus-tracking/sessions/:sessionId` | 세션 상세 조회 |
| GET | `/api/focus-tracking/reports/daily` | 일별 리포트 |
| GET | `/api/focus-tracking/reports/module` | 모듈별 리포트 |

자세한 API 문서는 [여기](./docs/FOCUS_DETECTION_GUIDE.md#api-문서)를 참조하세요.

## 💡 사용 예시

### 기본 사용법

```tsx
import { StudentLearningContainer } from './components/StudentLearningContainer';
import { FractionLearningExample } from './examples/FractionLearningExample';

function App() {
  return (
    <StudentLearningContainer
      studentId="student123"
      moduleId="fractions_basic"
      idleThreshold={30000}
      breakDuration={15}
      enableBreakGuide={true}
      allowSkipBreak={true}
    >
      <FractionLearningExample />
    </StudentLearningContainer>
  );
}
```

### 커스텀 감지 로직

```tsx
import { useFocusDetection } from './hooks/useFocusDetection';

function CustomComponent() {
  const { isFocusLost, idleTime } = useFocusDetection({
    idleThreshold: 60000,
    onFocusLost: () => console.log('Focus lost!'),
    onIdleDetected: (time) => console.log('Idle:', time),
  });

  return (
    <div>
      {isFocusLost && <Alert>집중해주세요!</Alert>}
    </div>
  );
}
```

## 📊 데이터베이스 스키마

### focus_tracking_events

학생의 집중 추적 이벤트 저장

```sql
CREATE TABLE focus_tracking_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  module_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}'
);
```

### student_focus_summary

학생별 집중도 요약 (실시간 업데이트)

```sql
CREATE TABLE student_focus_summary (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  module_id VARCHAR(255) NOT NULL,
  total_focus_time_seconds NUMERIC DEFAULT 0,
  total_idle_time_seconds NUMERIC DEFAULT 0,
  focus_lost_count INTEGER DEFAULT 0,
  breaks_completed INTEGER DEFAULT 0,
  breaks_skipped INTEGER DEFAULT 0,
  UNIQUE(student_id, module_id)
);
```

전체 스키마는 [마이그레이션 파일](./backend/src/database/migrations/001_create_focus_tracking_tables.sql)을 참조하세요.

## 🎨 커스터마이징

### 휴식 활동 추가

`frontend/src/components/IdleBreakGuide.tsx`에서 활동 추가:

```typescript
const BREAK_ACTIVITIES: BreakActivity[] = [
  // ... 기존 활동들
  {
    type: 'my_activity',
    title: '나만의 활동',
    description: '설명',
    instructions: ['단계 1', '단계 2', '단계 3', '단계 4'],
    icon: '🎯',
  },
];
```

### 감지 임계값 조정

```tsx
<StudentLearningContainer
  idleThreshold={60000}  // 60초로 변경
  breakDuration={30}      // 30초로 변경
/>
```

## 🧪 테스트

```bash
# 프론트엔드 테스트
cd frontend
npm test

# 백엔드 테스트
cd backend
npm test

# E2E 테스트
npm run test:e2e
```

## 🌟 주요 기술 스택

### 프론트엔드
- React 18+
- TypeScript
- CSS3 (애니메이션, Grid, Flexbox)

### 백엔드
- Node.js
- Express
- PostgreSQL
- TypeScript

### AI/ML
- Anthropic Claude API
- 자연어 처리
- 코드 생성

## 📈 로드맵

- [x] Phase 0: PRD 작성 및 기술 설계
- [x] Phase 1: 집중 이탈 감지 시스템
- [x] Phase 2: 15초 휴식 가이드
- [x] Phase 3: LMS 연동 및 통계
- [ ] Phase 4: AI 파이프라인 구현
- [ ] Phase 5: UI 자동 생성
- [ ] Phase 6: 배포 및 테스트

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

KAIST AI Education Team

## 📧 문의

프로젝트 관련 문의: GitHub Issues

---

**Made with ❤️ by KAIST**
