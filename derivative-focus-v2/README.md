# Derivative Focus v2.0

AI 기반 미분 문제 핵심 규칙 자동 강조 시스템 - 현대적 기술 스택 재구현

## 🚀 주요 특징

- **Claude AI 통합**: Anthropic의 Claude 3.5 Sonnet으로 지능형 규칙 검출
- **Moodle LMS 연동**: Moodle 3.7 웹 서비스 API 완벽 지원
- **실시간 분석**: 문제 입력 시 즉각적인 AI 분석 및 규칙 강조
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 형태 인터페이스
- **자동 규칙 검출**: Power Rule, Chain Rule, Product Rule 등 핵심 규칙 자동 인식

## 🛠️ 기술 스택

### Backend
- **Python 3.11+** with **FastAPI**
- **PostgreSQL 15+** (SQLAlchemy async ORM)
- **Redis** (캐싱 및 세션 관리)
- **Anthropic Claude API** (AI 분석 엔진)
- **Async/Await** 완전 지원

### Frontend
- **React 18** with **TypeScript**
- **Material-UI (MUI)** 컴포넌트
- **React Query** (서버 상태 관리)
- **Zustand** (클라이언트 상태 관리)
- **KaTeX** (수식 렌더링)
- **Vite** (빌드 도구)

### DevOps
- **Docker & Docker Compose**
- **PostgreSQL** 컨테이너
- **Redis** 컨테이너
- 완전 컨테이너화된 개발 환경

## 📋 시스템 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)
- Moodle 3.7 인스턴스 (선택사항)
- Anthropic API 키

## 🚀 빠른 시작 (Docker)

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 API 키와 설정을 입력하세요:

```env
# Moodle 설정
MOODLE_URL=http://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token

# Claude AI 설정
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Docker Compose로 실행

```bash
docker-compose up -d
```

이 명령어는 다음을 자동으로 설정합니다:
- PostgreSQL 데이터베이스 (포트 5432)
- Redis 캐시 (포트 6379)
- FastAPI 백엔드 (포트 8000)
- React 프론트엔드 (포트 3000)

### 3. 데이터베이스 초기화

```bash
docker-compose exec backend python -m app.db.init_data
```

### 4. 앱 실행

브라우저에서 다음 주소로 접속:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/api/docs
- **Backend ReDoc**: http://localhost:8000/api/redoc

## 💻 로컬 개발 (Docker 없이)

### Backend 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
pip install asyncpg

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# PostgreSQL이 실행 중인지 확인한 후 데이터베이스 생성
createdb derivative_focus

# 규칙 초기화
python -m app.db.init_data

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

## 📖 사용 방법

### 1. Moodle에서 문제 불러오기

1. "Moodle 문제 ID" 입력란에 문제 ID 입력
2. "불러오기" 버튼 클릭
3. AI가 자동으로 문제를 분석하고 규칙을 검출
4. 우측 하단 가상 스마트폰에 결과 표시

### 2. 직접 문제 입력

1. "또는 직접 입력" 텍스트 영역에 미분 문제 입력
2. LaTeX 형식도 지원: `x^3 + sin(2x) + x*ln(x)`
3. "분석하기" 버튼 클릭
4. AI가 실시간으로 분석 및 규칙 검출

### 3. AI 분석 결과

- **검출된 규칙**: 최대 3개의 핵심 규칙 자동 검출
- **신뢰도 점수**: 각 규칙에 대한 AI 신뢰도 (0-100%)
- **AI 설명**: 왜 해당 규칙이 적용되는지 상세 설명
- **적용 위치**: 문제의 어느 부분에 규칙이 적용되는지 표시

## 🎨 검출되는 핵심 규칙 3가지

### 1. Power Rule (거듭제곱 법칙)
- **공식**: `d/dx[x^n] = n·x^(n-1)`
- **검출 예시**: `x^2`, `x^3`, `2x^5`
- **색상**: 🔴 빨강 (#FF6B6B)

### 2. Chain Rule (연쇄 법칙)
- **공식**: `d/dx[f(g(x))] = f'(g(x))·g'(x)`
- **검출 예시**: `sin(2x)`, `(x^2+1)^3`, `e^(3x)`
- **색상**: 🔵 청록 (#4ECDC4)

### 3. Product Rule (곱셈 법칙)
- **공식**: `d/dx[f·g] = f'·g + f·g'`
- **검출 예시**: `x·ln(x)`, `sin(x)·cos(x)`
- **색상**: 🟢 연두 (#95E1D3)

## 🔧 API 엔드포인트

### 문제 분석
```http
POST /api/problems/analyze
Content-Type: application/json

{
  "problem_text": "f(x) = x^3 + sin(2x)",
  "use_ai": true
}
```

### Moodle에서 가져오기
```http
POST /api/problems/fetch-from-moodle
Content-Type: application/json

{
  "question_id": 12345
}
```

### 핵심 규칙 조회
```http
GET /api/rules/core
```

### API 문서
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 📁 프로젝트 구조

```
derivative-focus-v2/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 엔드포인트
│   │   │   └── endpoints/
│   │   │       ├── problems.py
│   │   │       └── rules.py
│   │   ├── core/              # 설정 및 유틸리티
│   │   │   └── config.py
│   │   ├── db/                # 데이터베이스 모델
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   └── init_data.py
│   │   ├── schemas/           # Pydantic 스키마
│   │   │   └── problem.py
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── claude_analyzer.py
│   │   │   └── moodle_client.py
│   │   └── main.py            # FastAPI 앱
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   └── VirtualSmartphone.tsx
│   │   ├── services/          # API 클라이언트
│   │   │   └── api.ts
│   │   ├── store/             # Zustand 상태 관리
│   │   │   └── problemStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml          # Docker Compose 설정
├── .env.example                # 환경 변수 템플릿
├── .gitignore
└── README.md
```

## 🔍 주요 기능 상세

### Claude AI 분석 엔진

`backend/app/services/claude_analyzer.py`는 다음을 수행합니다:

1. **지능형 규칙 검출**: Claude API를 사용한 컨텍스트 인식 분석
2. **신뢰도 점수**: 각 규칙 검출에 대한 확률적 평가
3. **설명 생성**: 왜 특정 규칙이 적용되는지 자연어 설명
4. **Fallback 메커니즘**: API 실패 시 regex 기반 검출로 전환

### Moodle LMS 통합

`backend/app/services/moodle_client.py`는 다음을 지원합니다:

- Moodle 3.7 웹 서비스 API
- 문제 데이터 자동 추출
- LaTeX 수식 파싱
- 비동기 HTTP 요청 (httpx)

### 가상 스마트폰 UI

`frontend/src/components/VirtualSmartphone.tsx` 특징:

- iPhone 스타일 노치 디자인
- 우측 하단 고정 위치
- 실시간 문제 표시
- 규칙별 색상 코딩
- KaTeX 수식 렌더링
- 반응형 디자인

## 🐛 문제 해결

### Claude API 오류
```bash
# API 키 확인
echo $ANTHROPIC_API_KEY

# .env 파일에 올바른 키가 있는지 확인
cat backend/.env
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL이 실행 중인지 확인
docker-compose ps postgres

# 데이터베이스 로그 확인
docker-compose logs postgres
```

### Moodle 연결 실패
```bash
# Moodle 웹 서비스가 활성화되어 있는지 확인
# Moodle 관리자 > 사이트 관리 > 플러그인 > 웹 서비스
```

### 프론트엔드 빌드 오류
```bash
# 노드 모듈 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest
```

### Frontend 테스트
```bash
cd frontend
npm run test
```

## 📦 프로덕션 배포

### Docker로 배포
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 환경 변수 설정
프로덕션 환경에서는 다음을 변경하세요:
- `DEBUG=False`
- 강력한 `SECRET_KEY` 생성
- HTTPS 활성화
- 프로덕션 데이터베이스 URL

## 🔐 보안

- 모든 API 요청은 CORS 보호
- 환경 변수로 민감한 정보 관리
- SQL Injection 방지 (SQLAlchemy ORM)
- XSS 방지 (React 자동 이스케이핑)

## 📄 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 제출하거나 Issue를 생성해주세요.

## 📞 지원

문제가 발생하면 GitHub Issue를 생성해주세요.

---

**Derivative Focus v2.0** - Powered by Claude AI ⚡
