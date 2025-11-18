# ALT42 LMS Hint System

AI 기반 3단계 힌트 시스템 - LMS 연동 지원

## 개요

ALT42 LMS Hint System은 KAIST Touch Math Academy를 위한 AI 기반 교육 힌트 시스템입니다. Claude API를 활용하여 학생들에게 3단계 강도의 맞춤형 힌트를 제공하며, LTI(Learning Tools Interoperability) 표준을 통해 다양한 LMS 플랫폼과 연동 가능합니다.

## 주요 기능

### 🎯 3단계 힌트 시스템
- **Level 1 (가벼운 힌트)**: 문제 해결의 방향을 제시
- **Level 2 (중간 힌트)**: 구체적인 단계와 접근 방법 안내
- **Level 3 (자세한 힌트)**: 상세한 설명과 예시를 포함한 완전한 가이드

### 🤖 AI 기반 힌트 생성
- Anthropic의 Claude API를 사용한 지능형 힌트 생성
- 학생의 현재 시도와 이전 힌트를 고려한 맥락 기반 응답
- 한국어 우선 지원

### 🔗 LMS 연동
- LTI 1.3 표준 지원
- Canvas, Moodle, Blackboard 등 주요 LMS 플랫폼 연동 가능
- 성적 연동(Outcome Service) 지원

### 📊 학습 분석
- 학생의 힌트 사용 패턴 추적
- 문제별 힌트 효과성 분석
- 교사용 대시보드 (향후 추가 예정)

## 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **AI/LLM**: Anthropic Claude API
- **ORM**: SQLAlchemy (async)
- **Migration**: Alembic

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State Management**: Zustand (향후)
- **Styling**: CSS Modules

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend and backend

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── routers/        # API 라우터
│   │   ├── services/       # 비즈니스 로직
│   │   ├── utils/          # 유틸리티
│   │   ├── config.py       # 설정
│   │   ├── database.py     # DB 연결
│   │   └── main.py         # FastAPI 앱
│   ├── alembic/            # 데이터베이스 마이그레이션
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── services/      # API 클라이언트
│   │   ├── types/         # TypeScript 타입
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── shared/                # 공통 타입 정의
│   └── types.ts
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
├── docker-compose.yml
└── README.md
```

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- Anthropic API Key (Claude API 접근용)

### 환경 설정

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**

백엔드 환경 변수:
```bash
cd backend
cp .env.example .env
# .env 파일을 편집하여 ANTHROPIC_API_KEY 설정
```

프론트엔드 환경 변수:
```bash
cd frontend
cp .env.example .env
```

3. **Docker Compose로 실행**

```bash
# 루트 디렉토리에서
docker-compose up --build
```

서비스 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 로컬 개발 (Docker 없이)

#### 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

#### 프론트엔드

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## API 사용법

### 힌트 요청

**Endpoint**: `POST /api/hints/generate`

**Request Body**:
```json
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "level": 1,
  "context": {
    "current_attempt": "학생의 현재 풀이...",
    "previous_hints": [],
    "time_spent": 300
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "problem_id": "uuid",
  "student_id": "uuid",
  "level": 1,
  "content": "생성된 힌트 내용...",
  "created_at": "2025-11-18T...",
  "metadata": {
    "generation_time": 2.5,
    "model_used": "claude-3-sonnet-20240229"
  }
}
```

### 힌트 히스토리 조회

**Endpoint**: `GET /api/hints/history/{student_id}/{problem_id}`

**Response**:
```json
{
  "hints": [...],
  "total_count": 3
}
```

### LTI Launch

**Endpoint**: `POST /api/lti/launch`

LMS로부터의 LTI launch 요청을 처리합니다.

자세한 API 문서는 http://localhost:8000/api/docs 에서 확인하세요.

## 데이터베이스 스키마

### 주요 테이블

- **modules**: 교육 모듈 정보
- **problems**: 문제 정보
- **hints**: 생성된 힌트
- **student_progress**: 학생 진행 상황

### 마이그레이션

```bash
# 새 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

## LMS 연동 가이드

### LTI 설정

1. LMS 관리자 페이지에서 외부 도구 추가
2. LTI 설정 정보:
   - **Launch URL**: `https://your-domain.com/api/lti/launch`
   - **Consumer Key**: `.env` 파일의 `LTI_CONSUMER_KEY`
   - **Shared Secret**: `.env` 파일의 `LTI_SHARED_SECRET`

3. 커스텀 필드 설정:
   ```
   problem_id=$ResourceLink.id
   user_id=$User.id
   ```

### 지원 LMS 플랫폼

- Canvas
- Moodle
- Blackboard Learn
- D2L Brightspace
- 기타 LTI 1.3 표준 지원 플랫폼

## 개발 가이드

### 코드 스타일

- **Python**: PEP 8
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional Commits

### 테스트

```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 테스트
cd frontend
npm test
```

### 새 기능 추가

1. 새 브랜치 생성: `git checkout -b feature/your-feature`
2. 코드 작성 및 테스트
3. 커밋: `git commit -m "feat: add your feature"`
4. PR 생성

## 배포

### Production 환경

1. 환경 변수 설정 (`.env` 파일 또는 시스템 환경 변수)
2. `DEBUG=false` 설정
3. 강력한 `SECRET_KEY` 생성
4. PostgreSQL 및 Redis 설정
5. HTTPS 설정 (nginx, Caddy 등)

```bash
# Production 빌드
docker-compose -f docker-compose.prod.yml up -d
```

## 문제 해결

### 일반적인 문제

**1. Database connection error**
- PostgreSQL이 실행 중인지 확인
- `DATABASE_URL` 환경 변수가 올바른지 확인

**2. Claude API error**
- `ANTHROPIC_API_KEY`가 설정되어 있는지 확인
- API 사용량 한도를 확인

**3. CORS error**
- `CORS_ORIGINS`에 프론트엔드 URL이 포함되어 있는지 확인

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 기여

기여는 환영합니다! 이슈를 먼저 생성하여 논의해주세요.

## 연락처

- **프로젝트 리드**: [Contact Info]
- **기술 문의**: [Tech Support]
- **이슈 리포팅**: GitHub Issues

## 로드맵

### v1.0 (현재)
- ✅ 3단계 힌트 시스템
- ✅ Claude API 연동
- ✅ 기본 LTI 지원
- ✅ Docker 환경 구성

### v1.1 (예정)
- [ ] 힌트 효과성 분석 대시보드
- [ ] 다국어 지원 (영어)
- [ ] 힌트 캐싱 최적화
- [ ] 단위 테스트 및 E2E 테스트

### v2.0 (계획)
- [ ] 완전한 LTI 1.3 구현
- [ ] 교사용 힌트 커스터마이징 도구
- [ ] 실시간 협업 학습 지원
- [ ] 모바일 앱 지원

---

**Built with ❤️ for KAIST Touch Math Academy**
