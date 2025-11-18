# 성공 루틴 카드 시스템 (Success Routine Cards)

LMS와 연동하여 매일의 학습 성공 루틴 카드를 AI로 자동 생성하는 독립형 웹앱

## 주요 기능

- 🎯 **AI 기반 개인화**: Claude AI를 활용한 학생별 맞춤 루틴 카드 생성
- 📊 **학습 진행 추적**: LMS 데이터 연동으로 실시간 학습 현황 파악
- ⏰ **자동 생성**: 매일 자동으로 새로운 루틴 카드 생성
- 📱 **반응형 웹**: 모바일, 태블릿, 데스크톱 모두 지원
- 🎨 **직관적 UI**: 학생 친화적인 인터페이스

## 기술 스택

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL
- SQLAlchemy
- APScheduler
- Claude API (Anthropic)

### Frontend
- React 18+
- TypeScript
- Vite
- Axios
- React Router
- Material-UI (MUI)

### DevOps
- Docker & Docker Compose
- PostgreSQL 15+
- Redis (캐싱)

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── app/
│   │   ├── api/          # API 엔드포인트
│   │   ├── models/       # 데이터베이스 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   ├── services/     # 비즈니스 로직
│   │   └── core/         # 설정 및 유틸리티
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── services/     # API 클라이언트
│   │   └── types/        # TypeScript 타입
│   ├── package.json
│   └── vite.config.ts
├── database/
│   └── init.sql          # 초기 스키마
├── docker-compose.yml
└── README.md
```

## 시작하기

### 필수 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발)
- Python 3.11+ (로컬 개발)
- Claude API Key

### 환경 설정

1. 환경 변수 파일 생성:
```bash
cp .env.example .env
```

2. `.env` 파일에 필수 값 설정:
```
CLAUDE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/routine_cards
```

### Docker로 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 로컬 개발

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

### 루틴 카드
- `GET /api/v1/cards` - 루틴 카드 목록 조회
- `GET /api/v1/cards/{id}` - 특정 카드 조회
- `POST /api/v1/cards/generate` - 새 카드 생성 (AI)
- `GET /api/v1/cards/today/{student_id}` - 오늘의 카드 조회

### 학생
- `GET /api/v1/students` - 학생 목록
- `GET /api/v1/students/{id}` - 학생 상세 정보
- `GET /api/v1/students/{id}/progress` - 학습 진행 현황

### LMS 연동
- `POST /api/v1/lms/sync` - LMS 데이터 동기화
- `GET /api/v1/lms/progress/{student_id}` - LMS 진행 데이터

## 성공 루틴 카드 구조

각 루틴 카드는 다음 정보를 포함합니다:

- **학습 목표**: 오늘의 주요 학습 목표 (AI 생성)
- **추천 활동**: 개인화된 학습 활동 3-5개
- **진행 상황**: 현재 학습 진행률 및 달성률
- **동기부여 메시지**: AI가 생성한 격려 메시지
- **다음 단계**: 다음에 할 학습 내용 제안

## 개발 로드맵

- [x] 프로젝트 구조 설정
- [ ] 데이터베이스 스키마 설계
- [ ] FastAPI 백엔드 구현
- [ ] Claude AI 연동
- [ ] React 프론트엔드 구현
- [ ] 일일 자동 생성 스케줄러
- [ ] LMS 연동 기능
- [ ] Docker 배포 설정
- [ ] 테스트 및 문서화

## 라이선스

MIT

## 기여

KAIST Touch Math Academy AI Education System Pipeline 프로젝트의 일부입니다.
