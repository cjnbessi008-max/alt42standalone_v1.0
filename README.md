# AI Education System - LMS Integration with Mistake Pattern Warning

AI 기반 학습 관리 시스템(LMS) 연동 플랫폼으로, 학생들의 과거 오답 패턴을 분석하여 실시간으로 실수 가능 지점을 경고합니다.

## 주요 기능

### 🤖 AI 기반 오답 패턴 분석
- **Claude AI** 를 활용한 지능형 패턴 인식
- 학생별 맞춤형 실수 패턴 분석
- 실수 유형 자동 분류 (계산 오류, 개념 오류, 부주의 등)

### ⚠️ 실시간 실수 경고 시스템
- 문제 풀이 전 과거 패턴 기반 예방적 경고
- 심각도별 경고 표시 (높음/중간/낮음)
- 집중 학습 영역 추천

### 🔄 LMS 연동
- 외부 LMS 시스템과 학생 데이터 동기화
- RESTful API를 통한 유연한 통합
- 백그라운드 자동 동기화 지원

### 📊 학습 패턴 대시보드
- 학생별 실수 패턴 시각화
- 카테고리별 패턴 분포
- 우선순위별 패턴 분류

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                Frontend (React + TypeScript)             │
│  - Mistake Warning Alert                                │
│  - Pattern Dashboard                                    │
│  - Problem Page with Real-time Warnings                 │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│              Backend (FastAPI + Python)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Pattern Analyzer Service (Claude AI)            │  │
│  │ - Mistake Pattern Detection                      │  │
│  │ - Warning Generation                             │  │
│  │ - Student Analysis                               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Endpoints                                    │  │
│  │ - /students - Student management                 │  │
│  │ - /patterns - Pattern analysis                   │  │
│  │ - /lms - LMS integration                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────┬────────────────────┬──────────────────────┘
             │                    │
┌────────────▼──────┐   ┌────────▼─────────┐
│   PostgreSQL      │   │   Claude API     │
│   (with pgvector) │   │   (Anthropic)    │
└───────────────────┘   └──────────────────┘
```

## 기술 스택

### Backend
- **FastAPI** - 고성능 비동기 웹 프레임워크
- **SQLAlchemy** - ORM 및 데이터베이스 관리
- **PostgreSQL** - 관계형 데이터베이스
- **Anthropic Claude API** - AI 패턴 분석 엔진
- **Pydantic** - 데이터 검증 및 스키마

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

### DevOps
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션
- **pytest** - 백엔드 테스트

## 빠른 시작

### 필수 요구사항
- Docker & Docker Compose
- Anthropic API Key

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
# 백엔드 환경 변수
cp backend/.env.example backend/.env

# Anthropic API 키 설정
echo "ANTHROPIC_API_KEY=your_api_key_here" >> backend/.env

# 프론트엔드 환경 변수
cp frontend/.env.example frontend/.env
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **데이터베이스 마이그레이션**
```bash
docker-compose exec backend alembic upgrade head
```

5. **애플리케이션 접속**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/api/docs

## API 엔드포인트

### 학생 관리
```http
POST   /api/v1/students/              # 학생 생성
GET    /api/v1/students/{id}          # 학생 조회
PUT    /api/v1/students/{id}          # 학생 업데이트
POST   /api/v1/students/attempts/     # 답안 제출
```

### 오답 패턴 분석
```http
POST   /api/v1/patterns/analyze/{student_id}     # AI 패턴 분석 실행
GET    /api/v1/patterns/student/{student_id}     # 학생 패턴 조회
GET    /api/v1/patterns/summary/{student_id}     # 패턴 요약
POST   /api/v1/patterns/check-warnings           # 문제별 경고 확인
POST   /api/v1/patterns/warnings/{id}/dismiss    # 경고 닫기
```

### LMS 연동
```http
POST   /api/v1/lms/sync                    # LMS 동기화 시작
GET    /api/v1/lms/sync/{sync_id}          # 동기화 상태 확인
GET    /api/v1/lms/student/lms/{lms_id}    # LMS ID로 학생 조회
```

## 사용 예시

### 1. 학생의 오답 패턴 분석
```bash
curl -X POST "http://localhost:8000/api/v1/patterns/analyze/{student_id}" \
  -H "Content-Type: application/json" \
  -d '{"module_id": "...", "days_back": 30, "min_frequency": 2}'
```

### 2. 문제 풀이 전 경고 확인
```bash
curl -X POST "http://localhost:8000/api/v1/patterns/check-warnings" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "...",
    "problem_id": "...",
    "problem_content": {...}
  }'
```

### 3. LMS 데이터 동기화
```bash
curl -X POST "http://localhost:8000/api/v1/lms/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "sync_type": "students",
    "lms_endpoint": "https://your-lms.com/api/students"
  }'
```

## 프론트엔드 컴포넌트

### MistakeWarningAlert
과거 오답 패턴 기반 경고 표시

```tsx
<MistakeWarningAlert
  warnings={warnings}
  onDismiss={handleDismiss}
  recommendedFocusAreas={focusAreas}
/>
```

### PatternDashboard
학생의 학습 패턴 분석 대시보드

```tsx
<PatternDashboard
  studentId={studentId}
  moduleId={moduleId}
/>
```

### ProblemPage
문제 풀이 페이지 (실시간 경고 포함)

```tsx
<ProblemPage
  studentId={studentId}
  problem={problem}
  onSubmit={handleSubmit}
/>
```

## 데이터베이스 스키마

주요 테이블:
- `students` - 학생 정보
- `problems` - 문제 데이터
- `student_attempts` - 학생 답안 제출 기록
- `mistake_patterns` - AI가 분석한 실수 패턴
- `mistake_warnings` - 생성된 경고 기록
- `lms_sync_logs` - LMS 동기화 로그

## 개발

### 백엔드 개발
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 프론트엔드 개발
```bash
cd frontend
npm install
npm run dev
```

### 테스트 실행
```bash
# 백엔드 테스트
cd backend
pytest

# 커버리지 포함
pytest --cov=app
```

## 환경 변수

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
ANTHROPIC_API_KEY=your_anthropic_api_key
LMS_API_ENDPOINT=https://your-lms.com/api
LMS_API_KEY=your_lms_api_key
PATTERN_MIN_FREQUENCY=2
PATTERN_ANALYSIS_DAYS_BACK=30
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 주요 특징

### AI 기반 분석
- Claude API를 사용한 고급 자연어 처리
- 맥락을 이해하는 지능형 패턴 인식
- 학생별 맞춤형 경고 메시지 생성

### 실시간 경고
- 문제 로딩 시 자동 경고 확인
- 비침습적 UI 디자인
- 학생이 직접 경고 관리 가능

### 확장 가능한 아키텍처
- RESTful API 설계
- 마이크로서비스 지향 구조
- Docker를 통한 쉬운 배포

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
