# AI 교육 시스템 - 질문 자동 제안 기능

LMS와 연동하여 문제 풀이 중 학습자가 스스로 던질 질문 3개를 AI가 자동으로 제안하는 시스템

## 🎯 주요 기능

- **AI 기반 질문 생성**: Claude AI를 활용하여 학생의 학습 상황에 맞는 자기성찰 질문 3개 제안
- **개인화된 추천**: 학생의 이전 시도 기록, 개념 숙달도, 학습 패턴을 분석하여 맞춤형 질문 제공
- **3가지 질문 카테고리**:
  - 🔵 **이해 확인** (Clarification): 문제의 핵심을 이해했는지 확인
  - 🟢 **전략** (Strategy): 문제 해결 방법과 전략 탐색
  - 🟣 **성찰** (Reflection): 풀이 과정을 점검하고 반성
- **피드백 시스템**: 질문의 유용성을 평가하여 AI 개선에 활용

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│               Frontend (React + TypeScript)              │
│     Problem Display | Question Suggestions UI           │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│              Backend (Python FastAPI)                    │
│  Question Service | Claude Integration | Analytics      │
└────────────┬───────────────────┬────────────────────────┘
             │                   │
┌────────────▼──────┐    ┌──────▼─────────────┐
│   PostgreSQL      │    │   Claude API       │
│  (Student Data)   │    │  (AI Generation)   │
└───────────────────┘    └────────────────────┘
```

## 📋 기술 스택

### Backend
- **Python 3.11+**
- **FastAPI**: 고성능 비동기 API 프레임워크
- **asyncpg**: PostgreSQL 비동기 드라이버
- **Anthropic Claude API**: AI 질문 생성

### Frontend
- **React 18** + **TypeScript**
- **Vite**: 빠른 개발 환경
- **Lucide React**: 아이콘 라이브러리
- **Axios**: HTTP 클라이언트

### Database
- **PostgreSQL 15+**: 관계형 데이터베이스
- **pgcrypto**: UUID 생성

### DevOps
- **Docker** + **Docker Compose**: 컨테이너화
- **Git**: 버전 관리

## 🚀 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Anthropic API Key ([여기서 발급](https://console.anthropic.com/))

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 Anthropic API Key를 설정:

```env
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. Docker로 실행

```bash
docker-compose up -d
```

이 명령어는 다음을 실행합니다:
- PostgreSQL 데이터베이스 시작 및 스키마 초기화
- Backend API 서버 시작 (포트 8000)
- Frontend 개발 서버 시작 (포트 3000)

### 4. 애플리케이션 접속

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                  # Python FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── question_suggestions.py  # API 엔드포인트
│   │   ├── models/
│   │   │   ├── database.py   # DB 연결 관리
│   │   │   └── schemas.py    # Pydantic 스키마
│   │   ├── services/
│   │   │   ├── claude_service.py    # Claude API 연동
│   │   │   └── question_service.py  # 비즈니스 로직
│   │   └── main.py           # FastAPI 앱
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                 # React TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── QuestionSuggestions.tsx  # 질문 표시 컴포넌트
│   │   │   └── ProblemSolver.tsx        # 문제 풀이 통합 컴포넌트
│   │   ├── services/
│   │   │   └── api.ts        # API 클라이언트
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── schema.sql            # PostgreSQL 스키마
│
├── docker-compose.yml        # Docker 구성
└── README.md
```

## 🔌 API 엔드포인트

### 1. 질문 생성
```http
POST /api/v1/question-suggestions/generate
Content-Type: application/json

{
  "student_id": "uuid",
  "problem_id": "uuid",
  "current_attempt_data": {},
  "include_context": true
}
```

**응답:**
```json
{
  "suggestion_id": "uuid",
  "student_id": "uuid",
  "problem_id": "uuid",
  "suggestions": [
    {
      "question": "이 문제에서 무엇을 구하려고 하는가?",
      "rationale": "문제의 목표를 명확히 이해하는 것이 중요합니다.",
      "category": "clarification"
    },
    // ... 2개 더
  ],
  "context_used": {
    "total_attempts": 3,
    "struggling_concepts": ["분수", "통분"]
  }
}
```

### 2. 피드백 제출
```http
POST /api/v1/question-suggestions/feedback
Content-Type: application/json

{
  "suggestion_id": "uuid",
  "student_id": "uuid",
  "accepted_suggestion": 2,
  "helpfulness_rating": 5,
  "comment": "도움이 되었습니다"
}
```

### 3. 제안 기록 조회
```http
GET /api/v1/question-suggestions/history/{student_id}?limit=10
```

## 💾 데이터베이스 스키마

### 주요 테이블

#### students
학생 정보 저장

#### problems
문제 정보 및 메타데이터

#### student_attempts
학생의 문제 풀이 시도 기록

#### student_concepts
개념별 숙달도 추적

#### question_suggestions
생성된 질문 제안 저장

#### suggestion_feedback
질문 유용성 피드백

## 🧪 개발 가이드

### Backend 로컬 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env 파일 설정 후
python -m uvicorn app.main:app --reload
```

### Frontend 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

### 데이터베이스 직접 접근

```bash
docker exec -it ai_education_db psql -U aiuser -d ai_education_db
```

## 🎨 UI 컴포넌트

### QuestionSuggestions
- 3개의 질문 카드 표시
- 카테고리별 색상 구분
- 질문 선택 및 피드백 제출 기능

### ProblemSolver
- 문제 정보 표시
- 질문 제안 요청 버튼
- QuestionSuggestions 컴포넌트 통합

## 🔐 보안 고려사항

- API 키는 환경 변수로 관리 (`.env` 파일은 Git에서 제외)
- 데이터베이스 연결은 내부 네트워크로 제한
- CORS 설정으로 허용된 도메인만 접근 가능
- SQL Injection 방지 (파라미터화된 쿼리 사용)

## 📊 모니터링

### Health Check
```bash
curl http://localhost:8000/health
```

### 로그 확인
```bash
# Backend 로그
docker logs ai_education_backend -f

# Frontend 로그
docker logs ai_education_frontend -f

# Database 로그
docker logs ai_education_db -f
```

## 🚧 향후 개발 계획

- [ ] LMS(Canvas, Moodle) LTI 연동
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 음성 질문 읽기 기능
- [ ] 교사 대시보드 (질문 효과성 분석)
- [ ] A/B 테스팅 프레임워크
- [ ] 모바일 앱 개발

## 📝 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 👥 기여자

- AI Agent (Claude) - 초기 개발

## 🙋 지원

문제가 발생하면 GitHub Issues에 등록해주세요.

---

**Powered by Claude AI | KAIST Touch Math Academy**
