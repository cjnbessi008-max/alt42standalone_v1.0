# AI Education System with Focus Intensity Adjustment

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템 파이프라인과 집중 강도 조절 기능을 갖춘 독립형 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 적응형 집중 강도 조절
- **5단계 집중 레벨**: 학생의 실시간 수행 능력에 따라 UI/UX 자동 조절
- **지능형 알고리즘**: 정답률, 응답 속도, 연속 정답/오답 패턴 분석
- **개인화 학습**: 학생별 최적 집중 강도 추천

### 2. LMS 통합 (Phase 2)
- LTI 1.3 표준 지원
- Canvas, Moodle, Google Classroom 연동
- 실시간 성적 동기화

## 🏗 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT
- **Real-time**: WebSocket

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Animation**: Framer Motion

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL with pgvector
- **Caching**: Redis (optional)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                  # FastAPI 백엔드
│   ├── app/
│   │   ├── api/             # API 엔드포인트
│   │   ├── core/            # 설정, 보안
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── schemas/         # Pydantic 스키마
│   │   ├── services/        # 비즈니스 로직
│   │   └── algorithms/      # 집중 강도 알고리즘
│   ├── migrations/          # Alembic 마이그레이션
│   ├── tests/               # 백엔드 테스트
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── pages/           # 페이지
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 클라이언트
│   │   ├── store/           # Zustand 스토어
│   │   └── utils/           # 유틸리티
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── tasks/                   # 명세서 및 문서
│   ├── 0001-prd-ai-education-pipeline.md
│   ├── 0002-lms-focus-intensity-feature-spec.md
│   ├── 0003-database-migration-schema.sql
│   ├── 0004-api-endpoints-implementation.md
│   └── 0005-focus-intensity-algorithm.py
│
├── docker-compose.yml       # Docker Compose 설정
└── README.md
```

## 🚀 빠른 시작

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (로컬 개발용)
- Python 3.11+ (로컬 개발용)

### 1. 전체 시스템 실행 (Docker Compose)

```bash
# 모든 서비스 시작 (PostgreSQL, Backend, Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

애플리케이션 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 2. 로컬 개발 환경

#### Backend 개발

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 편집 (DATABASE_URL 등)

# 데이터베이스 마이그레이션
alembic upgrade head

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 개발

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# VITE_API_URL=http://localhost:8000

# 개발 서버 실행
npm run dev
```

### 3. 데이터베이스 초기화

```bash
# PostgreSQL 접속
docker exec -it alt42_postgres psql -U postgres -d alt42_db

# 스키마 적용
\i /tasks/0003-database-migration-schema.sql

# 확인
\dt
```

## 📊 API 문서

FastAPI는 자동으로 API 문서를 생성합니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

주요 엔드포인트:
- `GET /api/v1/modules/{module_id}/focus-intensity/levels` - 집중 강도 레벨 조회
- `POST /api/v1/students/{student_id}/focus-intensity/adjust` - 집중 강도 조절
- `GET /api/v1/students/{student_id}/focus-intensity/analytics` - 성과 분석

자세한 내용은 `tasks/0004-api-endpoints-implementation.md` 참고

## 🧪 테스트

### Backend 테스트

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend 테스트

```bash
cd frontend
npm test
npm run test:coverage
```

### E2E 테스트

```bash
npm run test:e2e
```

## 📈 집중 강도 알고리즘

집중 강도는 5단계로 구성됩니다:

| 레벨 | 이름 | 특징 | 적용 상황 |
|------|------|------|----------|
| 1 | Relaxed | 힌트 3개, 시간 여유 | 새로운 개념, 쉬운 문제 |
| 2 | Comfortable | 힌트 2개, 적당한 시간 | 복습 단계 |
| 3 | Engaged | 힌트 1개, 표준 시간 | 일반 연습 |
| 4 | Challenged | 힌트 없음, 짧은 시간 | 숙련도 향상 |
| 5 | Peak Focus | 힌트 없음, 최소 시간 | 평가/시험 |

**자동 조절 규칙**:
- 정답률 90% + 3개 연속 정답 → 레벨 +1
- 정답률 50% 미만 + 2개 연속 오답 → 레벨 -1
- 빠른 응답 + 높은 정확도 → 레벨 +1
- 느린 응답 + 낮은 정확도 → 레벨 -1

알고리즘 상세: `tasks/0005-focus-intensity-algorithm.py`

## 🔧 환경변수

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/alt42_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## 📚 문서

- [프로젝트 PRD](tasks/0001-prd-ai-education-pipeline.md) - 전체 시스템 요구사항
- [기능 명세서](tasks/0002-lms-focus-intensity-feature-spec.md) - 집중 강도 & LMS 통합
- [데이터베이스 스키마](tasks/0003-database-migration-schema.sql) - DB 구조
- [API 명세서](tasks/0004-api-endpoints-implementation.md) - REST API 문서
- [알고리즘](tasks/0005-focus-intensity-algorithm.py) - 집중 강도 조절 알고리즘

## 🗓 개발 로드맵

### Phase 1: 집중 강도 조절 기능 (4주) ✅ 진행 중
- [x] 명세서 작성
- [x] 데이터베이스 스키마 설계
- [x] 알고리즘 구현
- [ ] Backend API 구현
- [ ] Frontend UI 구현
- [ ] 통합 테스트

### Phase 2: LMS 통합 (6주)
- [ ] LTI 1.3 프로토콜 구현
- [ ] Canvas 통합
- [ ] Moodle 통합
- [ ] 성적 동기화

### Phase 3: 고급 분석 (4주)
- [ ] ML 기반 최적화
- [ ] 리포팅 대시보드
- [ ] AI 인사이트

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 교육 목적으로 개발되었습니다.

## 👥 팀

- **Project Lead**: KAIST Touch Math Academy
- **Development**: AI Agent (Claude)
- **Branch**: `claude/lms-focus-intensity-feature-01Fk7bkT5vfK1Ej62xVszE65`

## 📞 문의

질문이나 피드백이 있으시면 이슈를 생성해주세요.

---

**Built with ❤️ for better education**
