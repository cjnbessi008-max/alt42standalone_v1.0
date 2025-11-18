# MathFlow - 수포자 중독형 수학 웹앱

> 게임처럼 재미있는 수학 학습 플랫폼

## 🎯 프로젝트 개요

MathFlow는 수학을 포기한 중·고등학교 학생들을 위한 혁신적인 웹 애플리케이션입니다. 게임의 중독성 메커니즘을 수학 교육에 접목하여, 학생들이 자발적으로 수학 학습에 참여하도록 설계되었습니다.

### 핵심 특징

- ⚡ **실시간 시각적 애니메이션**: 풀이 과정마다 즉각적인 시각 효과
- 🎮 **즉각 보상 루프**: 한 단계 성공 → 미니 쾌감 → 콤보 게이지 → 폭발 효과
- 🌱 **개념 시각화**: 추상적 수학 개념을 애니메이션으로 표현
- 🧠 **AI 기반 맞춤 학습**: 학습 성향 분석으로 최적 난이도 제공
- 🏆 **게임화 시스템**: 스테이지, 레벨업, 업적, 일일 퀘스트

## 📋 문서

- **[PRD (Product Requirements Document)](./tasks/0002-prd-mathflow-app.md)**: 상세한 제품 요구사항
- **[AI Education System Pipeline PRD](./tasks/0001-prd-ai-education-pipeline.md)**: 연동 예정 시스템

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Math Rendering**: KaTeX
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT
- **Validation**: Pydantic V2

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (planned)

## 🚀 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### Docker로 실행 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/cjnbessi008-max/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 2. 환경 변수 설정
cp backend/.env.example backend/.env

# 3. Docker Compose로 전체 스택 실행
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f
```

서비스 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 로컬 개발 (Docker 없이)

#### Backend

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# PostgreSQL 및 Redis 실행 (별도 터미널)
# 또는 docker-compose up postgres redis

# 환경 변수 설정
cp .env.example .env

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # Next.js 프론트엔드
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   ├── page.tsx         # 홈페이지
│   │   └── globals.css      # 전역 스타일
│   ├── components/          # React 컴포넌트
│   ├── lib/                 # 유틸리티 함수
│   ├── public/              # 정적 파일
│   └── package.json
│
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py          # FastAPI 앱
│   │   ├── api/             # API 라우터
│   │   ├── core/            # 핵심 설정
│   │   ├── models/          # 데이터베이스 모델
│   │   └── schemas/         # Pydantic 스키마
│   ├── tests/               # 테스트
│   └── requirements.txt
│
├── tasks/                   # 프로젝트 문서
│   ├── 0001-prd-ai-education-pipeline.md
│   └── 0002-prd-mathflow-app.md
│
├── docker-compose.yml       # Docker Compose 설정
└── README.md               # 이 파일
```

## 🗃️ 데이터베이스

### 주요 테이블

- **users**: 사용자 정보 (학생, 선생님, 학부모)
- **student_profiles**: 학생 프로필 (레벨, XP, 통계)
- **problems**: 문제 은행
- **problem_attempts**: 문제 풀이 기록
- **stages**: 게임 스테이지
- **achievements**: 업적 시스템
- **daily_quests**: 일일 퀘스트

자세한 스키마는 [PRD 문서](./tasks/0002-prd-mathflow-app.md#63-data-models)를 참조하세요.

## 🧪 테스트

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

## 📊 개발 로드맵

### Phase 1: Core MVP (Week 3-8) ✅ 진행 중
- [x] 프로젝트 초기 설정
- [x] Frontend/Backend 기본 구조
- [x] Docker 개발 환경
- [ ] 인증 시스템
- [ ] 문제 풀이 UI
- [ ] 기본 애니메이션

### Phase 2: Gamification (Week 9-14)
- [ ] XP & 레벨 시스템
- [ ] 업적 시스템
- [ ] 콤보 시스템
- [ ] 개념 애니메이션 4종

### Phase 3: Adaptive Learning (Week 15-18)
- [ ] 학습 분석 엔진
- [ ] 맞춤형 문제 추천
- [ ] 난이도 자동 조절

### Phase 4: Polish & Launch (Week 19-28)
- [ ] 스테이지 시스템
- [ ] 대시보드
- [ ] 600+ 문제 제작
- [ ] 베타 테스트 & 출시

자세한 일정은 [PRD 문서](./tasks/0002-prd-mathflow-app.md#10-development-phases--timeline)를 참조하세요.

## 🤝 기여

이 프로젝트는 현재 개발 초기 단계입니다. 기여에 관심이 있으시면 이슈를 열어주세요.

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for students who struggle with math**
