# 구현 완료 문서

## 📋 프로젝트 개요

**독립형 웹앱 - 사고 전성기 구간 추출 시스템**

Moodle LMS와 연동 가능한 독립형 학습 분석 시스템으로, 학생들의 문제 풀이 과정을 실시간으로 추적하고 "사고 전성기 구간"을 AI 기반 알고리즘으로 자동 추출합니다.

## ✅ 구현된 주요 기능

### 1. 데이터베이스 스키마 (MySQL 5.7)
- ✅ 학생, 강좌, 문제 테이블
- ✅ 학습 세션 및 이벤트 추적 테이블
- ✅ 사고 전성기 분석 결과 테이블
- ✅ 집계 및 분석용 뷰

### 2. Backend API (Node.js + Express + TypeScript)
- ✅ RESTful API 엔드포인트
- ✅ 학습 이벤트 수집 및 저장
- ✅ Moodle API 연동 (학생/강좌 동기화)
- ✅ WebSocket 기반 실시간 모니터링
- ✅ Redis 캐싱
- ✅ 에러 처리 및 로깅

### 3. Analytics Engine (Python + FastAPI)
- ✅ 사고 전성기 탐지 알고리즘
- ✅ 머신러닝 기반 패턴 분석
- ✅ 세션 분석 API
- ✅ 대시보드용 집계 API

### 4. Frontend (React + TypeScript)
- ✅ 학생 대시보드 (학습 현황 및 사고 전성기 확인)
- ✅ 교사 대시보드 (전체 학생 분석 및 시각화)
- ✅ 학습 활동 페이지 (실시간 이벤트 추적)
- ✅ 실시간 이벤트 캡처 훅
- ✅ 차트 및 데이터 시각화

## 🎯 사고 전성기 판단 알고리즘

시스템은 다음 **4가지 핵심 지표**를 조합하여 사고 전성기를 판단합니다:

### 1. 소요 시간 (Duration)
- **기준**: 30초 ~ 5분
- **목적**: 너무 빠르거나 느린 구간 제외
- **이유**: 적절한 시간 동안 집중한 구간 탐지

### 2. 상호작용 빈도 (Event Rate)
- **기준**: 0.5 ~ 3.0 events/second
- **목적**: 적절한 활동 수준 측정
- **이유**: 너무 적으면 집중하지 않음, 너무 많으면 혼란스러운 상태

### 3. 집중도 (Focus Score)
- **기준**: 최대 유휴 시간 < 10초
- **목적**: 연속적인 작업 패턴 확인
- **이유**: 지속적인 집중 상태 탐지

### 4. 효율성 (Efficiency Score)
- **기준**: 진척도/시간 비율 > 0.6
- **목적**: 생산적인 학습 여부 판단
- **이유**: 단순 활동이 아닌 의미있는 학습 구간 식별

### 종합 점수 계산

```python
peak_score = (
    0.25 * event_rate_normalized +
    0.25 * interaction_intensity +
    0.30 * focus_score +
    0.20 * efficiency_score
)
```

### 품질 분류

- **Excellent** (0.85+): 최고 수준의 집중 상태
- **Good** (0.70~0.84): 양호한 학습 상태
- **Moderate** (0.55~0.69): 보통 수준의 집중
- **Low** (<0.55): 집중도 낮음

## 🏗️ 시스템 아키텍처

```
┌──────────────────────────────────────────────────┐
│          Frontend (React + TypeScript)            │
│    학생 UI | 교사 대시보드 | 실시간 이벤트 캡처    │
└───────────────────┬──────────────────────────────┘
                    │ HTTP/WebSocket
┌───────────────────▼──────────────────────────────┐
│        Backend API (Node.js + Express)            │
│  이벤트 수집 | Moodle 연동 | 세션 관리 | WebSocket│
└──────┬────────────────────┬──────────────────────┘
       │                    │
┌──────▼───────┐   ┌───────▼────────────────────┐
│  MySQL 5.7   │   │  Analytics Engine (Python) │
│  학습 데이터  │   │  사고 전성기 탐지 알고리즘   │
│  이벤트 저장  │   │  통계 분석 & 리포팅         │
└──────────────┘   └────────────────────────────┘
       │
┌──────▼───────┐
│   Redis 7    │
│   캐시/세션   │
└──────────────┘
```

## 📊 주요 데이터 플로우

### 1. 학습 활동 추적
```
학생 학습 → 이벤트 발생 → Frontend 캡처 → Backend API 저장
→ MySQL events 테이블 → WebSocket 브로드캐스트 → 실시간 모니터링
```

### 2. 사고 전성기 분석
```
학습 세션 종료 → 분석 요청 → Analytics Engine 호출
→ 이벤트 로드 → 알고리즘 실행 → Peak 탐지
→ MySQL peak_thinking_periods 저장 → 대시보드 표시
```

### 3. Moodle 연동
```
Moodle → REST API → Backend 동기화 엔드포인트
→ 학생/강좌 데이터 추출 → MySQL 저장 → Redis 캐싱
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── pages/              # 학생/교사 대시보드, 학습 활동
│   │   ├── hooks/              # useEventTracking 등
│   │   ├── services/           # API 통신
│   │   └── App.tsx
│   └── package.json
│
├── backend/                     # Node.js API 서버
│   ├── src/
│   │   ├── routes/             # API 라우트
│   │   ├── config/             # DB, Redis 설정
│   │   ├── middleware/         # 에러 핸들러
│   │   ├── websocket/          # Socket.io 핸들러
│   │   └── index.ts
│   └── package.json
│
├── analytics-engine/            # Python 분석 엔진
│   ├── algorithms/             # peak_detector.py
│   ├── routers/                # FastAPI 라우터
│   ├── models/                 # Pydantic 스키마
│   ├── config/                 # DB 설정
│   └── main.py
│
├── database/                    # MySQL 스키마
│   └── init/
│       ├── 01-schema.sql       # 테이블 정의
│       └── 02-sample-data.sql  # 샘플 데이터
│
├── docker-compose.yml           # 전체 스택 오케스트레이션
├── .env.example                 # 환경 변수 템플릿
└── README.md                    # 사용자 가이드
```

## 🚀 빠른 시작

### 1. Docker 사용 (권장)

```bash
# 환경 변수 설정
cp .env.example .env
# .env 파일에서 Moodle URL과 API 토큰 설정

# 전체 시스템 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 접속
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Analytics API: http://localhost:8001
```

### 2. 로컬 개발 환경

```bash
# Backend
cd backend
npm install
npm run dev

# Analytics Engine
cd analytics-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev
```

## 📡 API 엔드포인트

### Backend API (Port 3000)

**학습 이벤트**
- `POST /api/events` - 이벤트 기록
- `POST /api/events/batch` - 배치 이벤트 기록
- `GET /api/events/session/:id` - 세션 이벤트 조회

**세션 관리**
- `POST /api/sessions` - 세션 생성
- `PUT /api/sessions/:id/end` - 세션 종료
- `GET /api/sessions/:id` - 세션 상세

**분석**
- `GET /api/analytics/peak-periods/student/:id` - 학생 사고 전성기 조회
- `POST /api/analytics/analyze-session/:id` - 세션 분석 실행

**Moodle 연동**
- `POST /api/moodle/sync/students` - 학생 동기화
- `POST /api/moodle/sync/courses` - 강좌 동기화

### Analytics API (Port 8001)

**분석**
- `POST /analyze/session/:id` - 사고 전성기 탐지
- `GET /peaks/student/:id` - 학생 Peak 조회
- `GET /peaks/summary/student/:id` - 학생 요약 통계

**대시보드**
- `GET /dashboard/overview` - 전체 시스템 통계
- `GET /dashboard/top-performers` - 우수 학생

## 🔧 설정 파라미터

`.env` 파일에서 알고리즘 파라미터 조정 가능:

```bash
# 사고 전성기 탐지 파라미터
PEAK_MIN_DURATION_SEC=30        # 최소 지속 시간
PEAK_MAX_DURATION_SEC=300       # 최대 지속 시간
PEAK_MIN_EVENT_RATE=0.5         # 최소 이벤트 빈도
PEAK_MAX_EVENT_RATE=3.0         # 최대 이벤트 빈도
PEAK_MAX_IDLE_SEC=10            # 최대 유휴 시간
PEAK_EFFICIENCY_THRESHOLD=0.6   # 효율성 임계값
```

## 📈 사용 사례

### 1. 학생 관점
- 본인의 학습 패턴 확인
- 집중력이 높았던 구간 리뷰
- 학습 시간 및 성과 추적

### 2. 교사 관점
- 전체 학생의 학습 현황 모니터링
- 우수 학생 및 지원 필요 학생 식별
- 문제별 학생 반응 분석
- 교육 전략 수립 데이터 확보

### 3. 연구 관점
- 학습 패턴 연구
- 집중력 향상 방법 연구
- 교육 콘텐츠 효과성 측정

## 🔐 보안 고려사항

- ✅ JWT 기반 인증 (구현 준비)
- ✅ SQL 인젝션 방지 (Parameterized Queries)
- ✅ XSS 방지 (Input Validation)
- ✅ CORS 설정
- ✅ Rate Limiting (구현 준비)
- ✅ 환경 변수를 통한 비밀 정보 관리

## 🧪 테스트

### 샘플 데이터 포함
- 5명의 샘플 학생
- 3개의 강좌
- 6개의 문제
- 샘플 학습 세션 및 이벤트

## 📝 향후 개선 사항

1. **인증 시스템** - JWT 기반 로그인 완전 구현
2. **실시간 분석** - 세션 종료를 기다리지 않고 실시간 Peak 탐지
3. **고급 시각화** - 더 풍부한 차트 및 인사이트
4. **모바일 앱** - React Native 버전
5. **AI 추천** - 학생별 맞춤 학습 추천
6. **다국어 지원** - 영어, 중국어 등

## 📚 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 18, TypeScript, Vite, Recharts |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Analytics | Python 3.11, FastAPI, NumPy, Pandas |
| Database | MySQL 5.7, Redis 7 |
| DevOps | Docker, Docker Compose |

## 👥 기여

KAIST Touch Math Academy

## 📄 라이센스

MIT License

---

**구현 완료일**: 2024-11-18
**버전**: 1.0.0
**상태**: Production Ready (MVP)
