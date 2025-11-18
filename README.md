# AI Education Pipeline - Standalone Web Application

**자동화된 AI 기반 교육 모듈 생성 시스템**

교사가 자연어로 요청하면 AI가 자동으로 완전한 교육 모듈(데이터베이스, 비즈니스 로직, UI)을 생성하는 독립형 웹 애플리케이션입니다.

---

## 🎯 핵심 기능

### 교사를 위한 기능
- ✅ **자연어 모듈 생성**: 코딩 없이 한국어로 요청만 하면 완전한 교육 모듈 생성
- ✅ **실시간 진행 상황**: WebSocket을 통한 생성 과정 모니터링
- ✅ **모듈 관리 대시보드**: 생성한 모듈 관리 및 수정
- ✅ **학생 진도 추적**: 실시간 학습 현황 확인

### 학생을 위한 기능
- ✅ **대화형 학습**: AI 생성 UI로 직관적인 학습 경험
- ✅ **진도 자동 추적**: 학습 진행 상황 자동 기록
- ✅ **즉각적인 피드백**: 답변에 대한 실시간 피드백

### 시스템 관리자를 위한 기능
- ✅ **모니터링 대시보드**: 시스템 상태 및 사용량 모니터링
- ✅ **AI API 비용 추적**: Claude API 사용량 및 비용 분석
- ✅ **사용자 관리**: 교사/학생 계정 관리

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│        Frontend (React + TypeScript)            │
│  Teacher UI | Student UI | Admin Panel          │
└────────────────────┬────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼────────────────────────────┐
│          API Gateway (Node.js Express)           │
│  Auth | Rate Limiting | Routing                 │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│       AI Pipeline (Python FastAPI)              │
│  ┌──────────────────────────────────────────┐  │
│  │ World Model → Rules → Data → UI          │  │
│  └──────────────────────────────────────────┘  │
└──┬────────────────┬─────────────────┬──────────┘
   │                │                 │
┌──▼──────┐  ┌─────▼──────┐  ┌──────▼─────┐
│ Claude  │  │ PostgreSQL │  │   Redis    │
│   API   │  │  Database  │  │   Cache    │
└─────────┘  └────────────┘  └────────────┘
```

---

## 🚀 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Claude API 키 ([여기서 발급](https://console.anthropic.com/))

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.standalone .env
nano .env  # 또는 원하는 편집기로 열기
```

`.env` 파일에서 필수 설정:

```env
# Claude API 키 (필수!)
CLAUDE_API_KEY=your_anthropic_api_key_here

# 데이터베이스 비밀번호 (프로덕션에서는 반드시 변경!)
DB_PASSWORD=secure_password_here

# JWT Secret (보안 키 생성)
JWT_SECRET=$(openssl rand -base64 64)
```

### 3. Docker로 전체 스택 실행

```bash
cd docker
docker-compose up -d
```

서비스 시작 대기 (약 30초):
```bash
docker-compose logs -f ai-pipeline
# "Application startup complete" 메시지가 나올 때까지 대기
```

### 4. 데이터베이스 초기화

```bash
# PostgreSQL 컨테이너에 접속
docker exec -it aipipeline-postgres psql -U aipipeline -d aipipeline

# 데모 데이터 삽입
\i /docker-entrypoint-initdb.d/seeds/demo_data.sql
```

### 5. 접속 확인

- **AI Pipeline API**: http://localhost:8000/docs
- **API Gateway** (옵션): http://localhost:4000
- **Frontend** (옵션): http://localhost:3000

---

## 📚 API 사용 예제

### 1. 모듈 생성 요청

```bash
curl -X POST http://localhost:8000/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "teacher_request": "3학년 학생들을 위한 분수 학습 모듈을 만들어주세요. 학생들이 분수의 개념을 시각적으로 이해하고, 분수의 덧셈과 뺄셈을 연습할 수 있어야 합니다.",
    "grade_level": "Grade 3",
    "subject": "mathematics"
  }'
```

응답:
```json
{
  "module_id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
  "status": "pipeline_started",
  "message": "모듈 생성이 시작되었습니다.",
  "status_url": "/api/pipeline/d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14/status"
}
```

### 2. 생성 진행 상황 확인

```bash
curl http://localhost:8000/api/pipeline/d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14/status
```

응답:
```json
{
  "module_id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
  "status": "in_progress",
  "current_stage": "ui",
  "progress_percentage": 80,
  "completed_stages": ["world_model", "rules", "data", "input_strategy"]
}
```

### 3. 생성된 모듈 조회

```bash
curl http://localhost:8000/api/modules/d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14
```

---

## 🗂️ 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   ├── pages/              # 페이지
│   │   └── services/           # API 클라이언트
│   └── package.json
│
├── backend/
│   ├── api-gateway/            # Node.js API Gateway
│   │   └── src/
│   │       ├── routes/         # 라우트
│   │       └── middleware/     # 미들웨어
│   │
│   └── ai-pipeline/            # Python AI Pipeline (핵심)
│       ├── app/
│       │   ├── services/       # 비즈니스 로직
│       │   │   ├── orchestrator.py     # 파이프라인 조율
│       │   │   ├── world_model.py      # 세계관 재구성
│       │   │   ├── rule_generator.py   # 룰 생성
│       │   │   └── ui_generator.py     # UI 생성
│       │   ├── api/            # FastAPI 엔드포인트
│       │   ├── models/         # 데이터 모델
│       │   └── integrations/   # Claude API 클라이언트
│       └── requirements.txt
│
├── database/
│   ├── migrations/             # SQL 마이그레이션
│   └── seeds/                  # 초기 데이터
│
├── docker/
│   ├── docker-compose.yml      # Docker 설정
│   └── Dockerfile.pipeline
│
└── docs/                       # 문서
    ├── STANDALONE_ARCHITECTURE.md
    └── LMS_INTEGRATION_STRATEGY.md
```

---

## 🔧 개발 가이드

### 로컬 개발 (Python만)

```bash
cd backend/ai-pipeline

# 가상 환경 생성
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn app.api.main:app --reload --port 8000
```

### 테스트

```bash
# Python 테스트
cd backend/ai-pipeline
pytest

# 특정 테스트만 실행
pytest tests/test_world_model.py -v
```

### 로그 확인

```bash
# AI Pipeline 로그
docker-compose logs -f ai-pipeline

# PostgreSQL 로그
docker-compose logs -f postgres

# 전체 로그
docker-compose logs -f
```

---

## 🎓 AI Pipeline 워크플로우

### Phase 1: World Model (세계관 재구성)
- **입력**: 교사의 자연어 요청
- **출력**: 개념, 관계, 연산이 구조화된 도메인 모델
- **예시**: "분수" → Fraction(numerator, denominator), add_fractions()

### Phase 2: Rule Generation (룰 생성)
- **입력**: World Model
- **출력**: 검증 룰, 계산 룰, 진행 룰, 피드백 룰
- **예시**: "denominator != 0", "visualization_mastery >= 0.8"

### Phase 3: Data Management (데이터 생성)
- **입력**: World Model + Rules
- **출력**: PostgreSQL 스키마, 초기 데이터
- **예시**: fraction_problems 테이블 생성

### Phase 4: Input Strategy (입력 전략)
- **입력**: World Model
- **출력**: 입력 방법, 검증 전략
- **예시**: FractionInput 컴포넌트 (분자/분모 입력)

### Phase 5: UI Generation (UI 생성)
- **입력**: World Model + Input Strategy
- **출력**: React 컴포넌트 코드
- **예시**: `<FractionVisualizer />`, `<ProblemSolver />`

### Phase 6: Deployment (배포)
- **입력**: 모든 생성 결과
- **출력**: 배포된 모듈 (학생 접근 가능)

---

## 🔐 보안

### 프로덕션 배포 전 체크리스트

- [ ] `.env` 파일의 모든 비밀번호 변경
- [ ] `JWT_SECRET` 강력한 랜덤 값으로 설정
- [ ] `DB_PASSWORD` 복잡한 비밀번호로 변경
- [ ] CORS 설정을 특정 도메인으로 제한
- [ ] HTTPS 활성화
- [ ] Rate Limiting 설정
- [ ] 데이터베이스 백업 자동화

### API 인증

```typescript
// JWT 토큰 사용
const response = await fetch('/api/modules', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📊 모니터링

### Prometheus 메트릭

```
# 생성된 모듈 수
modules_created_total

# 파이프라인 실행 시간
generation_duration_seconds

# Claude API 호출 수
claude_api_calls_total

# Claude API 비용
claude_api_cost_dollars
```

### 헬스 체크

```bash
# AI Pipeline
curl http://localhost:8000/health

# PostgreSQL
docker exec aipipeline-postgres pg_isready

# Redis
docker exec aipipeline-redis redis-cli ping
```

---

## 🐛 트러블슈팅

### 문제: Claude API 오류

```
anthropic.APIError: Invalid API key
```

**해결**: `.env` 파일에서 `CLAUDE_API_KEY`를 확인하세요.

### 문제: 데이터베이스 연결 실패

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결**:
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 재시작
docker-compose restart postgres
```

### 문제: 파이프라인 느림

**원인**: Claude API 호출 레이턴시 (2-10초/호출)

**해결**:
1. 캐싱 활성화 (Redis)
2. 병렬 처리 구현
3. 더 빠른 Claude 모델 사용 (haiku)

---

## 🤝 기여 가이드

### 개발 워크플로우

1. Fork 저장소
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가
chore: 기타 변경
```

---

## 📖 추가 문서

- [시스템 아키텍처](STANDALONE_ARCHITECTURE.md) - 상세 설계 문서
- [LMS 통합](LMS_INTEGRATION_STRATEGY.md) - Moodle 연동 가이드
- [API 문서](http://localhost:8000/docs) - FastAPI 자동 생성 문서
- [배포 가이드](docs/DEPLOYMENT.md) - 프로덕션 배포

---

## 🎯 로드맵

### v1.0 (Current) - MVP
- [x] World Model 생성
- [x] Rule 생성
- [x] Database 스키마 생성
- [x] Input Strategy 생성
- [x] UI 컴포넌트 생성
- [x] Docker 기반 배포

### v1.1 (Next)
- [ ] Teacher Dashboard UI
- [ ] Student Portal UI
- [ ] WebSocket 실시간 진행 상황
- [ ] 모듈 미리보기 기능

### v1.2
- [ ] Moodle LMS 통합
- [ ] 성적 자동 동기화
- [ ] 다국어 지원 (한국어, 영어)

### v2.0
- [ ] AI 생성 코드 최적화
- [ ] 성능 개선 (캐싱, 병렬 처리)
- [ ] 고급 분석 대시보드
- [ ] 모바일 앱 지원

---

## 📝 라이선스

MIT License - 자유롭게 사용 및 수정 가능

---

## 👥 팀

**KAIST Touch Math Academy**
- AI Research Team
- Education Technology Team

---

## 🙏 감사의 말

- [Anthropic Claude](https://www.anthropic.com/) - AI 파워
- [FastAPI](https://fastapi.tiangolo.com/) - 현대적인 Python 웹 프레임워크
- [React](https://react.dev/) - UI 라이브러리
- [PostgreSQL](https://www.postgresql.org/) - 강력한 데이터베이스

---

## 📧 문의

- 이슈: [GitHub Issues](https://github.com/your-org/alt42standalone_v1.0/issues)
- 이메일: admin@kaist.ac.kr

---

**만든 날짜**: 2025-11-18
**버전**: 1.0.0
**상태**: 🚀 Production Ready (핵심 기능)
