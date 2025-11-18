# Focus Analysis & Time Recommendation System

LMS와 연동 가능한 집중도 분석 및 최적 학습 시간대 추천 시스템

## 📋 프로젝트 개요

이 프로젝트는 학습자의 집중도를 실시간으로 분석하고, 개인별 최적의 학습 시간대를 추천하는 웹 애플리케이션입니다. 웹앱을 통해 학습 세션 중 사용자의 상호작용 패턴을 추적하고, 수집된 데이터를 기반으로 집중도 점수를 계산하며, AI 기반 추천 엔진을 통해 개인화된 학습 시간을 제안합니다.

## ✨ 주요 기능

### 1. 실시간 집중도 추적
- 클릭, 입력, 스크롤 등 사용자 상호작용 자동 추적
- 활성 시간 vs 유휴 시간 분석
- 컨텍스트 스위치 (탭 전환) 감지
- 실시간 집중도 점수 계산 (0-100)

### 2. 집중도 분석 알고리즘
- **활동 비율 (40%)**: 전체 세션 대비 활성 시간 비율
- **상호작용 일관성 (30%)**: 상호작용 간격의 일관성
- **유휴 패널티 (20%)**: 유휴 시간에 따른 감점
- **컨텍스트 스위치 패널티 (10%)**: 집중력 저하 요인

### 3. 최적 시간대 추천 엔진
- 시간대별, 요일별 집중도 패턴 분석
- 개인화된 학습 시간 추천 (Top 5)
- 신뢰도 점수 기반 추천 품질 평가
- 최소 5개 세션 이상 데이터 필요

### 4. 시각화 대시보드
- 집중도 트렌드 차트
- 추천 시간대 표시
- 최적 학습 요일 및 시간대 하이라이트
- 세션 통계 및 분석 결과

### 5. LMS 통합 준비
- 독립 실행형 시스템 (현재)
- LMS API 연동 인터페이스 준비
- 학습자 데이터 동기화 지원 예정
- OAuth/SAML 인증 구조 설계

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│   Frontend (React + TypeScript)            │
│   - Focus Tracking Utility                 │
│   - Dashboard Components                   │
│   - Real-time Score Display                │
└────────────────┬────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────┐
│   Backend (FastAPI)                        │
│   - Focus Analyzer Service                 │
│   - Recommendation Engine                  │
│   - Authentication & Authorization         │
└────────┬──────────────┬─────────────────────┘
         │              │
    ┌────▼────┐   ┌────▼──────┐
    │PostgreSQL│   │Redis Cache│
    │(데이터베이스)│   │(세션관리)   │
    └─────────┘   └───────────┘
```

## 🛠️ 기술 스택

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (python-jose)
- **Data Analysis**: NumPy, Pandas, scikit-learn

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **HTTP Client**: Axios
- **Charts**: Recharts
- **State Management**: Zustand (optional)
- **Date Handling**: date-fns

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Migration**: SQL scripts + Python
- **Testing**: Pytest
- **API Documentation**: OpenAPI (Swagger)

## 📦 설치 및 실행

### 전제 조건
- Docker & Docker Compose
- Git
- (선택) Python 3.11+
- (선택) Node.js 20+

### 1. 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정
```bash
cp backend/.env.example backend/.env
# .env 파일 편집하여 SECRET_KEY 등 설정
```

### 3. Docker Compose로 실행
```bash
docker-compose up -d
```

서비스 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. 데이터베이스 초기화
```bash
# Docker 컨테이너 내부에서 실행
docker exec -it focus_analysis_backend python database/init_db.py
```

### 5. 개발 모드로 실행 (선택)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 API 문서

### 주요 엔드포인트

#### Authentication
- `POST /api/v1/auth/register` - 사용자 등록
- `POST /api/v1/auth/login` - 로그인
- `GET /api/v1/auth/me` - 현재 사용자 정보

#### Focus Sessions
- `POST /api/v1/sessions` - 세션 시작
- `GET /api/v1/sessions` - 세션 목록 조회
- `PATCH /api/v1/sessions/{id}` - 세션 업데이트
- `POST /api/v1/sessions/{id}/metrics` - 메트릭 추가
- `POST /api/v1/sessions/{id}/analyze` - 세션 분석

#### Analytics
- `GET /api/v1/analytics/trends` - 집중도 트렌드
- `GET /api/v1/analytics/time-patterns` - 시간대 패턴

#### Recommendations
- `POST /api/v1/recommendations/generate` - 추천 생성
- `GET /api/v1/recommendations` - 추천 조회
- `GET /api/v1/recommendations/summary` - 추천 요약
- `GET /api/v1/recommendations/optimal-days` - 최적 요일
- `GET /api/v1/recommendations/optimal-hours` - 최적 시간대

전체 API 문서: http://localhost:8000/docs

## 🧪 테스트

```bash
# Backend 테스트
cd backend
pytest tests/

# Frontend 테스트
cd frontend
npm test
```

## 📊 데이터 모델

### Users (사용자)
- 이메일, 사용자명, 역할 (학생/교사/관리자)
- LMS 통합을 위한 외부 ID 필드
- 기관 및 학년 정보

### Focus Sessions (집중 세션)
- 세션 시작/종료 시간
- 활성 시간, 유휴 시간
- 상호작용 횟수, 컨텍스트 스위치
- 집중도 점수, 참여도 점수
- 요일 및 시간대 정보

### Focus Metrics (집중도 메트릭)
- 이벤트 타입 (클릭, 입력, 스크롤 등)
- 이벤트 데이터 (JSONB)
- 이전 이벤트 이후 경과 시간
- 즉시 집중도 점수

### Time Recommendations (시간 추천)
- 추천 요일 및 시간
- 권장 학습 시간 (분)
- 신뢰도 점수
- 평균 집중도 점수
- 샘플 크기 (분석된 세션 수)

## 🎯 사용 방법

### 1. 학습 세션 시작
```javascript
// Frontend에서 useFocusSession 훅 사용
const { startSession, endSession, currentFocusScore } = useFocusSession('Math Module');

// 세션 시작
await startSession();

// 현재 집중도 점수 확인
console.log(currentFocusScore); // 0-100

// 세션 종료
await endSession();
```

### 2. 추천 생성 및 조회
```python
# Backend에서 추천 생성
from backend.services.recommendation_engine import RecommendationEngine

recommendations = RecommendationEngine.generate_recommendations(
    user_id=1,
    db=db,
    top_n=5,
    min_focus_score=60
)
```

### 3. 대시보드 조회
웹 브라우저에서 http://localhost:3000 접속
- 학습 세션 시작/종료
- 실시간 집중도 점수 확인
- 집중도 트렌드 그래프 조회
- 개인화된 시간 추천 확인

## 🔐 보안

- JWT 기반 인증 (30분 만료)
- 비밀번호 bcrypt 해싱
- CORS 설정
- SQL Injection 방지 (SQLAlchemy ORM)
- 입력 유효성 검사 (Pydantic)

## 🚀 향후 계획

### Phase 1: LMS 통합
- [ ] LTI (Learning Tools Interoperability) 표준 지원
- [ ] Canvas, Moodle, Blackboard 연동
- [ ] SSO (Single Sign-On) 통합
- [ ] 성적 자동 동기화

### Phase 2: AI 고도화
- [ ] 머신러닝 기반 예측 모델
- [ ] 개인화된 학습 경로 추천
- [ ] 집중도 패턴 클러스터링
- [ ] 이상 패턴 감지 및 알림

### Phase 3: 고급 기능
- [ ] 모바일 앱 지원
- [ ] 협업 학습 세션
- [ ] 게임화 요소 (배지, 리더보드)
- [ ] 부모/교사 대시보드

## 📄 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📞 문의

프로젝트 관련 문의: [담당자 이메일]

---

**Focus Analysis & Time Recommendation System** - 최적의 학습 경험을 위한 데이터 기반 솔루션
