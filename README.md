# AI 교육 시스템 - 개념 요약 자동 생성

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템으로, LMS와 연동하여 수학 문제의 핵심 개념을 1줄로 자동 요약하는 기능을 제공합니다.

## 주요 기능

- **AI 기반 개념 요약 생성**: Claude AI를 활용하여 수학 개념을 학생 친화적인 1줄 요약으로 자동 변환
- **학년별 맞춤 요약**: 1-12학년 학생의 이해 수준에 맞춘 언어로 요약 생성
- **품질 검증**: 생성된 요약의 정확성, 명확성, 연령 적합성을 자동 검증
- **선생님 검토 기능**: 자동 생성된 요약을 선생님이 검토하고 수정할 수 있는 UI 제공
- **일괄 처리**: 여러 개념을 한 번에 요약 생성

## 시스템 아키텍처

```
Frontend (React + Vite)
    ↓
API Gateway (Node.js/Express)
    ↓
Pipeline Orchestrator (Python/FastAPI)
    ↓
Claude AI API
    ↓
PostgreSQL Database
```

## 기술 스택

### Backend
- **Python 3.11+**: FastAPI 기반 AI 파이프라인 오케스트레이터
- **Node.js 18+**: Express.js 기반 API Gateway
- **PostgreSQL 15**: 관계형 데이터베이스
- **Redis**: 캐싱 및 세션 관리
- **Claude 3 Sonnet**: Anthropic AI 모델

### Frontend
- **React 18**: UI 프레임워크
- **Vite**: 빌드 도구
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **Axios**: HTTP 클라이언트

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **GitHub Actions**: CI/CD (예정)

## 설치 및 실행

### 사전 요구사항

- Docker & Docker Compose
- Anthropic API Key (Claude 접근용)

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 `ANTHROPIC_API_KEY`를 설정하세요:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. Docker Compose로 실행

```bash
docker-compose up -d
```

서비스가 시작되면:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Orchestrator**: http://localhost:8000
- **Database**: localhost:5432

### 4. 데이터베이스 초기화

```bash
docker exec -i ai_education_db psql -U postgres -d ai_education < database/migrations/001_initial_schema.sql
```

## 로컬 개발 환경 설정 (Docker 없이)

### Backend (Python)

```bash
cd backend/pipeline_orchestrator
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 환경 변수 설정
export ANTHROPIC_API_KEY=your_key_here
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_education

# 서버 실행
uvicorn src.main:app --reload --port 8000
```

### API Gateway (Node.js)

```bash
cd backend/api_gateway
npm install

# 환경 변수 설정
export ORCHESTRATOR_URL=http://localhost:8000
export PORT=3001

# 서버 실행
npm run dev
```

### Frontend (React)

```bash
cd frontend
npm install

# 환경 변수 설정
export VITE_API_URL=http://localhost:3001

# 개발 서버 실행
npm run dev
```

## API 사용법

### 개념 요약 생성

```bash
POST http://localhost:3001/api/concepts/generate-summary
Content-Type: application/json

{
  "concept_name": "분수",
  "grade_level": 3,
  "concept_description": "전체를 똑같이 나눈 것 중 일부분",
  "module_context": "초등 3학년 분수 단원"
}
```

**응답:**
```json
{
  "summary": "분수는 피자를 똑같이 잘라서 그 중 몇 조각인지 나타내는 숫자예요",
  "alternative_summaries": [
    "전체를 똑같은 크기로 나눈 것 중 일부를 숫자로 표현한 것",
    "케이크를 여러 명이 똑같이 나눠 먹을 때 쓰는 숫자"
  ],
  "confidence": 0.95,
  "rationale": "3학년 학생들이 일상에서 경험하는 피자나 케이크를 예시로 사용하여 구체적이고 이해하기 쉽게 설명했습니다."
}
```

### 일괄 요약 생성

```bash
POST http://localhost:3001/api/concepts/generate-batch
Content-Type: application/json

{
  "concepts": ["분수", "소수", "약분"],
  "grade_level": 5,
  "module_context": "초등 5학년 분수와 소수"
}
```

### 요약 검증

```bash
POST http://localhost:3001/api/concepts/validate-summary
Content-Type: application/json

{
  "concept_name": "변수",
  "summary": "아직 모르는 숫자를 대신하는 문자",
  "grade_level": 6
}
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── api_gateway/              # Node.js API Gateway
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── concepts.js   # 개념 요약 엔드포인트
│   │   │   │   └── modules.js
│   │   │   └── server.js
│   │   └── package.json
│   └── pipeline_orchestrator/    # Python FastAPI Orchestrator
│       ├── src/
│       │   ├── api/
│       │   │   └── concepts.py   # 개념 API 라우트
│       │   ├── services/
│       │   │   └── concept_summary_service.py  # 핵심 서비스
│       │   ├── models/
│       │   │   └── concepts.py   # Pydantic 모델
│       │   ├── prompts/
│       │   │   └── concept_summary_prompt.py  # Claude 프롬프트
│       │   ├── llm/
│       │   │   └── claude_client.py  # Claude API 클라이언트
│       │   └── main.py
│       └── requirements.txt
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ConceptSummaryGenerator.jsx  # 메인 UI
│   │   ├── services/
│   │   │   └── api.js            # API 클라이언트
│   │   └── App.jsx
│   └── package.json
├── database/
│   ├── schema.sql                # 데이터베이스 스키마
│   └── migrations/
│       └── 001_initial_schema.sql
├── docker/
│   ├── Dockerfile.orchestrator
│   ├── Dockerfile.api
│   └── Dockerfile.frontend
├── docker-compose.yml
├── .env.example
└── README.md
```

## 데이터베이스 스키마

주요 테이블:
- `problem_concepts`: 문제별 개념 정보
- `concept_summaries`: AI 생성 요약 버전 히스토리
- `modules`: 교육 모듈
- `problems`: 문제 데이터
- `teachers`: 선생님 정보
- `students`: 학생 정보
- `student_progress`: 학습 진도

## 개발 로드맵

### Phase 1: 핵심 기능 (완료)
- [x] 데이터베이스 스키마 설계
- [x] Claude AI 통합
- [x] 개념 요약 생성 API
- [x] React UI 컴포넌트
- [x] Docker 컨테이너화

### Phase 2: LMS 통합 (진행 중)
- [ ] LMS 데이터베이스 연동
- [ ] 문제 자동 개념 추출
- [ ] 실시간 요약 생성
- [ ] 선생님 대시보드

### Phase 3: 고급 기능 (예정)
- [ ] 다국어 지원 (한국어, 영어)
- [ ] 개념 관계 그래프 시각화
- [ ] 학습 분석 및 추천
- [ ] A/B 테스팅 프레임워크

## 테스트

```bash
# Backend 테스트
cd backend/pipeline_orchestrator
pytest

# Frontend 테스트
cd frontend
npm test
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이센스

MIT License

## 문의

- 프로젝트 관리자: KAIST Touch Math Academy
- 이메일: contact@kaist-math.ac.kr

## 참고 문서

- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md)
- [API 명세서](docs/API_SPEC.md)
- [아키텍처 문서](docs/ARCHITECTURE.md)

---

Made with ❤️ for KAIST Touch Math Academy
