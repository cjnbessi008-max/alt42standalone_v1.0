# LMS Dropout Analysis System

학습자가 "여기서 멈춘 이유"를 데이터 기반으로 추정하는 LMS 분석 시스템입니다.

## 🎯 주요 기능

### 1. Dropout 이유 자동 분석
- **난이도 기반**: 높은 오답률, 급격한 성적 하락
- **참여도 기반**: 상호작용 감소, 빠른 이탈
- **시간 기반**: 학습 피로, 긴 휴식 후 이탈
- **콘텐츠 기반**: 특정 주제 회피

### 2. 실시간 학습 추적
- 학습 세션 추적
- 이벤트 로깅 (클릭, 답변 제출, 힌트 요청 등)
- 문제 시도 기록

### 3. 시각화 대시보드
- 전체 dropout 현황 (총 세션, dropout 비율, 추세)
- Dropout 핫스팟 (중단이 자주 발생하는 지점)
- 위험 학생 목록
- 학생별 상세 분석

### 4. 데이터 기반 권장사항
- 각 dropout 이유별 맞춤 권장사항
- 난이도 조정, 힌트 제공, 휴식 시간 등

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Material-UI)       │
│  - Dashboard, Student Detail, Module Analysis      │
└───────────────┬─────────────────────────────────────┘
                │ REST API
┌───────────────▼─────────────────────────────────────┐
│  Backend API (FastAPI + Python)                     │
│  - Dropout Analysis API                             │
│  - Learning Tracking API                            │
└───────────────┬─────────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼────┐  ┌──▼───┐  ┌───▼──────┐
│PostGres│  │Redis │  │ Dropout  │
│   DB   │  │Cache │  │ Analyzer │
└────────┘  └──────┘  └──────────┘
```

## 🚀 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발용)
- Python 3.11+ (로컬 개발용)

### Docker로 실행 (권장)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 모든 서비스 시작
docker-compose up -d

# 3. 접속
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### 로컬 개발 환경

#### Backend

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# PostgreSQL 실행 필요
# 환경변수 설정
export DATABASE_URL="postgresql://user:password@localhost:5432/lms_dropout_analysis"

# 데이터베이스 스키마 생성
psql -U user -d lms_dropout_analysis -f db/schema.sql

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

## 📊 데이터베이스 스키마

주요 테이블:
- `learning_sessions`: 학습 세션 추적
- `learning_events`: 학습 이벤트 로그
- `problem_attempts`: 문제 시도 기록
- `dropout_analysis`: Dropout 분석 결과
- `student_learning_profiles`: 학습자 프로필
- `dropout_hotspots`: Dropout 핫스팟

자세한 내용은 [`backend/db/schema.sql`](backend/db/schema.sql)을 참조하세요.

## 🔌 API 엔드포인트

### Dropout 분석 API

```
POST   /api/analytics/dropout/sessions/{session_id}/analyze
GET    /api/analytics/dropout/sessions/{session_id}
GET    /api/analytics/dropout/students/{student_id}/pattern
GET    /api/analytics/dropout/modules/{module_id}/summary
GET    /api/analytics/dropout/dashboard
```

### 학습 추적 API

```
POST   /api/tracking/sessions
PATCH  /api/tracking/sessions/{session_id}
POST   /api/tracking/events
POST   /api/tracking/attempts
GET    /api/tracking/students/{student_id}/sessions
```

전체 API 문서: http://localhost:8000/docs

## 🧪 테스트

```bash
# Backend 테스트
cd backend
pytest tests/ -v

# Frontend 테스트 (예정)
cd frontend
npm test
```

## 📖 문서

- [설계 문서](docs/dropout-analysis-design.md)
- [PRD](tasks/0001-prd-ai-education-pipeline.md)

## 🔧 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Analysis**: NumPy, Pandas, SciPy

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **State**: Redux Toolkit
- **Build Tool**: Vite

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (예정)

## 🎨 주요 화면

### 1. Dashboard
- 전체 dropout 현황
- Dropout 추세 그래프
- 위험 학생 목록
- Dropout 핫스팟

### 2. Student Detail
- 학생별 dropout 패턴
- 주요 중단 이유
- 맞춤 권장사항
- 최근 dropout 상세 내역

### 3. Module Analysis
- 모듈별 dropout 통계
- 핫스팟 분석
- 개선 권장사항

## 🔐 보안 및 개인정보

- 학생 데이터 암호화 (AES-256)
- RBAC (역할 기반 접근 제어)
- 감사 로깅
- FERPA/GDPR 준수

## 📈 향후 계획

- [ ] ML 기반 dropout 예측 (사전 감지)
- [ ] 자동 intervention 시스템
- [ ] A/B 테스트 프레임워크
- [ ] 모바일 앱
- [ ] 실시간 알림 시스템

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy를 위한 AI Education System Pipeline의 일부입니다.

## 📄 라이선스

[MIT License](LICENSE)

## 📞 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.
