# AI 교육 시스템 - 하이라이트 클립 자동 생성

LMS와 연동 가능한 독립형 웹앱으로, AI를 활용하여 교육 모듈에서 핵심 학습 포인트를 자동으로 추출하고 일일 추천 하이라이트를 생성합니다.

## 🌟 주요 기능

- **AI 기반 하이라이트 생성**: Claude AI를 사용하여 교육 모듈에서 핵심 개념과 학습 활동을 자동 추출
- **일일 추천 시스템**: 매일 최적화된 학습 하이라이트를 AI가 선별하여 제공
- **모듈 관리**: 교사가 자연어로 교육 모듈을 요청하면 AI가 자동으로 생성
- **진도 추적**: 학생의 학습 진행 상황과 성과를 실시간으로 추적
- **분석 대시보드**: 하이라이트 클립의 성과와 참여도 분석

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                     │
│              Tailwind CSS, React Query, Zustand              │
└───────────────────┬─────────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────────┐
│              API Gateway (Node.js + Express)                 │
│         Authentication, Rate Limiting, Routing               │
└───────────┬─────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│           AI Pipeline (Python + FastAPI)                     │
│  World Model → Rules → Data → Input → UI → Highlights       │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
┌──────▼──────┐    ┌────────▼─────────┐   ┌─────▼──────────┐
│   Claude    │    │   PostgreSQL     │   │  Redis Cache   │
│  API (LLM)  │    │ (Data + Schema)  │   │  (Sessions)    │
└─────────────┘    └──────────────────┘   └────────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Query** - 서버 상태 관리
- **React Router** - 라우팅

### Backend
- **Node.js + Express** - API Gateway
- **Python 3.11 + FastAPI** - AI Pipeline
- **PostgreSQL 15** - 데이터베이스
- **Redis 7** - 캐싱
- **Claude API** - AI 추론 엔진

### DevOps
- **Docker** - 컨테이너화
- **Docker Compose** - 로컬 개발 환경

## 🚀 시작하기

### 사전 요구사항

- Docker Desktop 설치
- Claude API Key (Anthropic)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
cp .env.example .env
```

`.env` 파일을 열고 다음 값을 설정하세요:
```env
CLAUDE_API_KEY=your_claude_api_key_here
JWT_SECRET=your_secret_key_here
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **데이터베이스 초기화**
```bash
# PostgreSQL 컨테이너가 시작되면 자동으로 마이그레이션 실행됨
```

5. **애플리케이션 접속**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- AI Pipeline: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 클라이언트
│   │   └── App.jsx        # 메인 앱
│   └── package.json
├── api-gateway/           # Node.js API Gateway
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── middleware/    # 미들웨어
│   │   └── server.js      # Express 서버
│   └── package.json
├── pipeline/              # Python AI Pipeline
│   ├── src/
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # 데이터 모델
│   │   └── main.py        # FastAPI 앱
│   └── requirements.txt
├── database/              # 데이터베이스
│   └── migrations/        # SQL 마이그레이션
├── docker/                # Docker 설정
│   ├── Dockerfile.frontend
│   ├── Dockerfile.api-gateway
│   └── Dockerfile.pipeline
└── docker-compose.yml     # Docker Compose 설정
```

## 🎯 핵심 기능 사용법

### 1. 모듈 생성

교사가 자연어로 모듈을 요청:
```
POST /api/modules
{
  "name": "분수 학습",
  "description": "3학년을 위한 분수 개념 학습",
  "grade_level": "grade_3",
  "teacher_id": "uuid"
}
```

### 2. 하이라이트 자동 생성

모듈이 생성되면 자동으로 하이라이트가 생성되거나, 수동으로 트리거:
```
POST /api/modules/{moduleId}/highlights/generate
```

### 3. 일일 하이라이트 조회

```
GET /api/highlights/daily?date=2025-11-18&grade_level=grade_3
```

### 4. 학생 진도 업데이트

```
POST /api/students/{studentId}/progress
{
  "clip_id": "uuid",
  "status": "completed",
  "progress_percentage": 100,
  "time_spent_seconds": 450
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **modules** - 교육 모듈
- **highlight_clips** - 하이라이트 클립
- **daily_highlights** - 일일 추천 하이라이트
- **student_clip_progress** - 학생 진도
- **clip_analytics** - 클립 분석 데이터
- **teachers** - 교사 정보
- **students** - 학생 정보

## 🔧 개발

### 로컬 개발 환경

각 서비스를 개별적으로 실행할 수도 있습니다:

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**API Gateway:**
```bash
cd api-gateway
npm install
npm run dev
```

**Pipeline:**
```bash
cd pipeline
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### 코드 스타일

- Frontend: ESLint + Prettier
- Backend: Black + isort (Python), ESLint (Node.js)

## 🧪 테스트

```bash
# Frontend 테스트
cd frontend
npm test

# API Gateway 테스트
cd api-gateway
npm test

# Pipeline 테스트
cd pipeline
pytest
```

## 📝 API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 팀

KAIST Touch Math Academy

## 📞 문의

이슈나 질문이 있으시면 GitHub Issues를 사용해주세요.

---

**Built with ❤️ using Claude AI**
