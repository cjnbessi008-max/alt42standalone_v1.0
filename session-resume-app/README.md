# LMS Session Resume App
## 학습 세션 자동 이어하기 시스템

독립형 웹앱으로 구현된 LMS 세션 자동 이어하기 기능입니다. 학생이 학습 중 브라우저를 닫거나 디바이스를 변경해도 이전 학습 상태를 자동으로 복원합니다.

## 🌟 주요 기능

### 1. 자동 세션 저장
- **세션 상태**: 30초마다 자동 저장 (debounced)
- **임시 답안**: 5초마다 자동 저장 (debounced)
- **오프라인 지원**: 네트워크 오류 시 localStorage 백업

### 2. 세션 복원
- 재접속 시 자동 감지 및 복원 프롬프트
- 정확한 문제 위치 및 입력 상태 복원
- 진행률 표시 (예: 5/20 문제, 25% 완료)

### 3. 크로스 디바이스 지원
- 다른 디바이스에서도 세션 이어하기 가능
- 동시 접속 시 경고 메시지
- Last-write-wins 충돌 해결

### 4. 세션 관리
- 30일 비활성 시 자동 만료
- 완료된 세션 보관 (분석용)
- 세션 이벤트 로깅

## 🏗️ 기술 스택

### Backend
- **FastAPI** - Python async web framework
- **SQLAlchemy** - ORM with async support
- **PostgreSQL 15** - Database
- **Redis 7** - Caching
- **asyncpg** - PostgreSQL async driver

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Material-UI (MUI)** - UI components
- **Axios** - HTTP client

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Primary database
- **Redis** - Session caching

## 📋 요구사항

- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

## 🚀 빠른 시작

### 1. Docker Compose로 실행 (권장)

```bash
# 프로젝트 클론 및 이동
cd session-resume-app

# 모든 서비스 시작
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

서비스가 시작되면:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 2. 로컬 개발 환경

#### Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 편집 필요

# PostgreSQL 및 Redis 실행 (Docker)
docker-compose up db redis -d

# 서버 실행
python -m app.main
# 또는
uvicorn app.main:app --reload
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일 편집 필요

# 개발 서버 실행
npm run dev
```

## 📂 프로젝트 구조

```
session-resume-app/
├── backend/
│   ├── app/
│   │   ├── api/              # API 엔드포인트
│   │   │   └── sessions.py   # 세션 관리 API
│   │   ├── models/           # SQLAlchemy 모델
│   │   │   ├── session.py    # 세션 모델
│   │   │   └── module.py     # 모듈/학생 모델
│   │   ├── schemas/          # Pydantic 스키마
│   │   │   └── session.py
│   │   ├── services/         # 비즈니스 로직
│   │   │   └── session_service.py
│   │   ├── database.py       # DB 설정
│   │   └── main.py           # FastAPI 앱
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── ResumeSessionPrompt.tsx
│   │   │   └── AutoSaveIndicator.tsx
│   │   ├── hooks/            # Custom hooks
│   │   │   ├── useSessionState.ts
│   │   │   └── useDraftAnswer.ts
│   │   ├── services/         # API 클라이언트
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript 타입
│   │   ├── App.tsx           # 메인 앱
│   │   └── main.tsx          # 엔트리 포인트
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## 🔌 API 엔드포인트

### 세션 관리

```
POST   /api/v1/modules/{module_id}/sessions/start
       - 세션 시작 또는 이어하기

PUT    /api/v1/modules/{module_id}/sessions/{session_id}
       - 세션 상태 업데이트 (auto-save)

POST   /api/v1/modules/{module_id}/sessions/{session_id}/complete
       - 세션 완료

GET    /api/v1/modules/{module_id}/sessions/resume/{student_id}
       - 복원 가능한 세션 조회
```

### 임시 답안

```
POST   /api/v1/modules/{module_id}/problems/{problem_id}/draft
       - 임시 답안 저장

GET    /api/v1/modules/{module_id}/problems/{problem_id}/draft/{student_id}
       - 임시 답안 조회

DELETE /api/v1/modules/{module_id}/problems/{problem_id}/draft/{student_id}
       - 임시 답안 삭제
```

## 💾 데이터베이스 스키마

### student_session_state
학생의 세션 상태를 추적합니다.

```sql
- id (UUID)
- student_id (UUID) - 학생 ID
- module_id (UUID) - 모듈 ID
- current_problem_id (UUID) - 현재 문제 ID
- problem_index (INTEGER) - 문제 순서
- total_problems (INTEGER) - 전체 문제 수
- session_data (JSONB) - 세션 데이터 (완료한 문제, 힌트 사용 등)
- is_completed (BOOLEAN) - 완료 여부
- started_at (TIMESTAMP) - 시작 시간
- last_active_at (TIMESTAMP) - 마지막 활동 시간
- completed_at (TIMESTAMP) - 완료 시간
- last_device_info (JSONB) - 디바이스 정보
```

### problem_drafts
임시 답안을 저장합니다.

```sql
- id (UUID)
- student_id (UUID)
- problem_id (UUID)
- module_id (UUID)
- draft_answer (JSONB) - 임시 답안 (flexible)
- time_spent_seconds (INTEGER) - 소요 시간
- hints_viewed (INTEGER) - 힌트 확인 횟수
- saved_at (TIMESTAMP) - 저장 시간
```

### session_events
세션 이벤트를 로깅합니다.

```sql
- id (UUID)
- session_id (UUID)
- event_type (VARCHAR) - 이벤트 타입
- event_data (JSONB) - 이벤트 데이터
- device_info (JSONB) - 디바이스 정보
- created_at (TIMESTAMP)
```

## 🎯 사용 예제

### React 컴포넌트에서 사용

```typescript
import { useSessionState } from './hooks/useSessionState';
import { useDraftAnswer } from './hooks/useDraftAnswer';
import { ResumeSessionPrompt, AutoSaveIndicator } from './components';

function MyLearningPage() {
  const {
    sessionState,
    isRestored,
    isSaving,
    updateSessionState,
    completeSession,
  } = useSessionState({
    moduleId: 'module-uuid',
    studentId: 'student-uuid',
  });

  const {
    draftAnswer,
    updateDraftAnswer,
    clearDraft,
  } = useDraftAnswer({
    moduleId: 'module-uuid',
    problemId: 'problem-uuid',
    studentId: 'student-uuid',
  });

  // 답안 변경 시 자동 저장
  const handleAnswerChange = (answer) => {
    updateDraftAnswer({ answer });
  };

  // 답안 제출
  const handleSubmit = async () => {
    await clearDraft();
    updateSessionState({
      problem_index: sessionState.problem_index + 1,
    });
  };

  return (
    <div>
      <ResumeSessionPrompt
        moduleId="module-uuid"
        studentId="student-uuid"
        onResume={(sessionId) => console.log('Resume:', sessionId)}
        onStartNew={() => console.log('Start new')}
      />

      <AutoSaveIndicator
        isSaving={isSaving}
        lastSaved={new Date()}
        error={false}
      />

      {/* Your UI components */}
    </div>
  );
}
```

## 🧪 테스트

### Backend 테스트

```bash
cd backend

# 테스트 실행
pytest

# 커버리지 확인
pytest --cov=app
```

### Frontend 테스트

```bash
cd frontend

# 테스트 실행
npm test

# E2E 테스트
npm run test:e2e
```

## 📊 모니터링

### 로그 확인

```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend

# 실시간 로그
docker-compose logs -f
```

### 데이터베이스 접속

```bash
# PostgreSQL 접속
docker-compose exec db psql -U postgres -d session_resume

# 세션 확인
SELECT * FROM student_session_state;

# 임시 답안 확인
SELECT * FROM problem_drafts;
```

### Redis 접속

```bash
# Redis CLI
docker-compose exec redis redis-cli

# 캐시 확인
KEYS session:*
GET session:student-uuid:module-uuid
```

## 🔧 환경 변수

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/session_resume
REDIS_URL=redis://redis:6379/0
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
SESSION_TIMEOUT_DAYS=30
SESSION_CACHE_TTL=3600
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## 🛠️ 배포

### Production 빌드

```bash
# Frontend 빌드
cd frontend
npm run build

# Docker 이미지 빌드
docker build -t session-resume-frontend .
docker build -t session-resume-backend ./backend
```

### Production 환경변수

Production 환경에서는 다음을 변경해야 합니다:

- `DATABASE_URL`: Production DB URL
- `REDIS_URL`: Production Redis URL
- `CORS_ORIGINS`: Production domain
- `API_URL`: Production API URL

## 📝 추가 문서

- [세션 이어하기 기능 명세](/tasks/0002-session-resume-feature-spec.md)
- [PRD 문서](/tasks/0001-prd-ai-education-pipeline.md)
- [API 문서](http://localhost:8000/docs)

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 작성자

- AI Agent (Claude) - Initial implementation
- KAIST Touch Math Academy - Product requirements

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부로 개발되었습니다.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
