# AI Education System Pipeline with LMS Integration

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템 파이프라인으로, LMS 연동 및 개념 이해도 히트맵 기능을 제공합니다.

## 주요 기능

### 🎯 개념 이해도 히트맵
- 학생별 개념 이해도를 직관적인 히트맵으로 시각화
- 실시간 학습 진도 추적
- 어려움을 겪는 학생 및 개념 자동 식별
- 다양한 색상 테마 지원

### 🔗 LMS 통합
- Canvas, Moodle, Blackboard 등 주요 LMS와 연동
- LTI 1.1/1.3 표준 지원
- 양방향 데이터 동기화 (학생 정보, 성적)
- 자동 성적 업데이트

### 📊 분석 및 리포트
- 개념별 난이도 분석
- 학생별 학습 패턴 분석
- 모듈 성과 대시보드
- 실시간 통계

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 또는 yarn

### 설치

1. **저장소 클론**
```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

2. **데이터베이스 설정**
```bash
# PostgreSQL 데이터베이스 생성
createdb ai_education_system

# 마이그레이션 실행
psql -U postgres -d ai_education_system -f backend/migrations/001_concept_understanding_heatmap.sql
```

3. **환경 변수 설정**
```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env

# .env 파일 편집
DATABASE_URL=postgresql://user:password@localhost:5432/ai_education_system
API_PORT=3000
REACT_APP_API_URL=http://localhost:3000/api
```

4. **백엔드 설치 및 실행**
```bash
cd backend
npm install
npm run build
npm start
```

5. **프론트엔드 설치 및 실행**
```bash
cd frontend
npm install
npm start
```

6. **브라우저에서 접속**
```
http://localhost:3000
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── src/
│   │   ├── api/              # API 라우트
│   │   │   ├── heatmap.routes.ts
│   │   │   └── lms.routes.ts
│   │   ├── models/           # 데이터 모델
│   │   │   └── ConceptUnderstanding.ts
│   │   ├── services/         # 비즈니스 로직
│   │   │   └── LMSIntegrationService.ts
│   │   ├── middleware/       # 미들웨어
│   │   └── config/           # 설정 파일
│   ├── migrations/           # 데이터베이스 마이그레이션
│   │   └── 001_concept_understanding_heatmap.sql
│   └── tests/                # 백엔드 테스트
├── frontend/
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   └── ConceptHeatmap.tsx
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   └── TeacherDashboard.tsx
│   │   ├── services/         # API 서비스
│   │   │   └── api.ts
│   │   ├── styles/           # CSS 스타일
│   │   │   ├── ConceptHeatmap.css
│   │   │   └── TeacherDashboard.css
│   │   ├── types/            # TypeScript 타입
│   │   └── utils/            # 유틸리티 함수
│   └── public/               # 정적 파일
├── docs/                     # 문서
│   └── LMS_HEATMAP_INTEGRATION.md
├── tasks/                    # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 사용 예제

### 히트맵 컴포넌트 사용

```tsx
import ConceptHeatmap from './components/ConceptHeatmap';

function MyDashboard() {
  return (
    <ConceptHeatmap
      moduleId="module-uuid"
      colorScheme="red-green"
      showScores={true}
      onCellClick={(studentId, conceptName, data) => {
        console.log(`${studentId} - ${conceptName}: ${data.score}%`);
      }}
    />
  );
}
```

### 학습 상호작용 기록

```typescript
import apiService from './services/api';

// 학생이 문제를 풀었을 때
await apiService.recordInteraction(moduleId, {
  studentId: 'student-123',
  conceptId: 'concept-456',
  interactionType: 'problem_attempt',
  isCorrect: true,
  score: 100,
  timeSpentSeconds: 45
});
```

### LMS 통합 설정

```typescript
// Canvas LMS 통합 추가
await apiService.createLMSIntegration({
  institutionName: 'KAIST',
  lmsType: 'canvas',
  lmsUrl: 'https://canvas.kaist.ac.kr',
  consumerKey: 'your-key',
  consumerSecret: 'your-secret'
});

// 성적 동기화
await apiService.syncGradesToLMS({
  integrationId: 'integration-uuid',
  moduleId: 'module-uuid',
  studentGrades: [
    { studentId: 'student-1', score: 85, maxScore: 100 },
    { studentId: 'student-2', score: 92, maxScore: 100 }
  ]
});
```

## API 엔드포인트

### Heatmap API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/heatmap/:moduleId` | 모듈 히트맵 데이터 조회 |
| GET | `/api/heatmap/:moduleId/concepts` | 모듈 개념 목록 조회 |
| GET | `/api/heatmap/:moduleId/student/:studentId` | 학생 이해도 조회 |
| POST | `/api/heatmap/:moduleId/interaction` | 학습 상호작용 기록 |
| GET | `/api/heatmap/:moduleId/analysis` | 개념별 분석 데이터 조회 |

### LMS Integration API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lms/integration` | LMS 통합 생성 |
| GET | `/api/lms/integration` | 모든 LMS 통합 조회 |
| GET | `/api/lms/integration/:id` | 특정 LMS 통합 조회 |
| PUT | `/api/lms/integration/:id` | LMS 통합 업데이트 |
| DELETE | `/api/lms/integration/:id` | LMS 통합 삭제 |
| POST | `/api/lms/sync/:integrationId` | 데이터 동기화 시작 |
| GET | `/api/lms/sync/:integrationId/status` | 동기화 상태 조회 |
| POST | `/api/lms/grades/sync` | 성적 동기화 |

자세한 API 문서는 [LMS_HEATMAP_INTEGRATION.md](./docs/LMS_HEATMAP_INTEGRATION.md)를 참조하세요.

## 데이터베이스 스키마

주요 테이블:
- `concepts`: 학습 개념 정보
- `concept_understanding`: 학생별 개념 이해도
- `concept_interactions`: 학습 상호작용 로그
- `lms_integrations`: LMS 연결 정보
- `lms_sync_log`: 동기화 이력
- `heatmap_configurations`: 히트맵 설정

상세 스키마는 [마이그레이션 파일](./backend/migrations/001_concept_understanding_heatmap.sql)을 참조하세요.

## 기술 스택

### 백엔드
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Authentication**: OAuth 1.0a (for LTI)

### 프론트엔드
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: CSS3
- **State Management**: React Hooks

### 인프라
- **Database**: PostgreSQL with JSONB support
- **Caching**: Redis (optional)
- **Containerization**: Docker (planned)

## 개발 로드맵

### Phase 1: MVP (완료)
- ✅ 데이터베이스 스키마 설계
- ✅ 백엔드 API 구현
- ✅ 히트맵 시각화 컴포넌트
- ✅ LMS 통합 인터페이스
- ✅ 교사 대시보드

### Phase 2: 고급 기능 (계획 중)
- ⏳ 실시간 데이터 업데이트 (WebSocket)
- ⏳ AI 기반 학습 추천
- ⏳ 모바일 반응형 개선
- ⏳ 다국어 지원 (영어, 한국어)

### Phase 3: 확장 (미래)
- 📋 LTI 1.3 지원
- 📋 고급 분석 대시보드
- 📋 학부모 포털
- 📋 머신러닝 기반 예측 분석

## 테스팅

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test

# E2E 테스트
npm run test:e2e
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 지원

- **문서**: [docs/LMS_HEATMAP_INTEGRATION.md](./docs/LMS_HEATMAP_INTEGRATION.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/alt42standalone_v1.0/issues)
- **Email**: support@example.com

## 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 요구사항을 기반으로 개발되었습니다.

## 작성자

- **AI Agent (Claude)** - 초기 개발 및 문서화
- **Development Team** - 기능 확장 및 유지보수

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
**상태**: MVP 완료
