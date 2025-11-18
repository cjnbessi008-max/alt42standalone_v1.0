# Peak Thinking Period Tracker

독립형 웹앱 - 학습 활동 추적 및 사고 전성기 구간 추출 시스템

## 개요

이 시스템은 학생들의 문제 풀이 과정을 실시간으로 추적하고, "사고 전성기 구간"을 자동으로 추출하는 LMS 분석 도구입니다.

### 주요 기능

1. **실시간 학습 활동 추적**: 클릭, 입력, 수정 등 모든 학습 이벤트 기록
2. **사고 전성기 분석**: AI 기반 알고리즘으로 최적 학습 구간 탐지
3. **Moodle 연동**: Moodle 3.7 LMS와 API 연동
4. **교사 대시보드**: 학생별 학습 패턴 및 집중도 시각화
5. **실시간 모니터링**: Socket.io 기반 실시간 학습 현황

## 사고 전성기 판단 기준

시스템은 다음 4가지 지표를 조합하여 사고 전성기를 판단합니다:

| 지표 | 기준 | 설명 |
|------|------|------|
| **소요 시간** | 30초 ~ 5분 | 너무 빠르거나 느린 구간 제외 |
| **상호작용 빈도** | 0.5 ~ 3 events/sec | 적절한 활동 수준 |
| **집중도** | 10초 이상 이탈 없음 | 연속적인 작업 패턴 |
| **효율성** | 진척도/시간 > 0.6 | 생산적인 학습 여부 |

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.io
- **Analytics**: Python 3.11 + FastAPI + NumPy/Pandas
- **Database**: MySQL 5.7 (Moodle 호환)
- **Cache**: Redis 7
- **Deployment**: Docker + Docker Compose

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  학생 학습 인터페이스 (React)              │
│              실시간 이벤트 캡처 + WebSocket               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/WebSocket
┌───────────────────────▼─────────────────────────────────┐
│              Backend API (Node.js + Express)             │
│  이벤트 수집 | Moodle 연동 | 인증 | WebSocket Server     │
└──────┬─────────────────────┬────────────────────────────┘
       │                     │
┌──────▼──────┐    ┌────────▼──────────┐
│   MySQL 5.7  │    │  Analytics Engine │
│ 학습 이벤트   │    │  (Python FastAPI) │
│  로그 저장   │    │  사고 전성기 분석  │
└─────────────┘    └───────────────────┘
```

## 빠른 시작

### 1. 사전 요구사항

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- MySQL 5.7 (or Docker)

### 2. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 Moodle URL 및 API 토큰 설정

# Docker로 전체 시스템 시작
docker-compose up -d

# 또는 로컬 개발 환경
npm run install:all
npm run dev
```

### 3. 접속

- **학생 인터페이스**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Analytics API**: http://localhost:8001
- **API 문서**: http://localhost:3000/api-docs

## 프로젝트 구조

```
.
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 (학생/교사)
│   │   ├── hooks/         # 커스텀 훅 (이벤트 추적)
│   │   └── services/      # API 통신
│
├── backend/               # Node.js 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── controllers/   # 비즈니스 로직
│   │   ├── models/        # DB 모델
│   │   ├── services/      # Moodle 연동 등
│   │   └── websocket/     # Socket.io 핸들러
│
├── analytics-engine/      # Python 분석 엔진
│   ├── algorithms/        # 사고 전성기 알고리즘
│   ├── models/            # 데이터 모델
│   └── routers/           # FastAPI 라우터
│
└── database/              # DB 스키마 및 마이그레이션
    └── init/              # 초기 스키마
```

## Moodle 연동 설정

### 1. Moodle API 토큰 생성

1. Moodle 관리자로 로그인
2. **Site administration** → **Server** → **Web services** → **Manage tokens**
3. 새 토큰 생성 및 `.env` 파일에 추가

### 2. 필요한 Web Service Functions

시스템이 사용하는 Moodle API 함수:
- `core_user_get_users`
- `core_course_get_contents`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`

## API 문서

### 주요 엔드포인트

#### 학습 이벤트 기록
```http
POST /api/events
Content-Type: application/json

{
  "student_id": "string",
  "problem_id": "string",
  "event_type": "click|input|submit|focus|blur",
  "event_data": {},
  "timestamp": "ISO8601"
}
```

#### 사고 전성기 분석 요청
```http
GET /api/analytics/peak-periods/:student_id/:session_id
```

#### 교사 대시보드 데이터
```http
GET /api/dashboard/students/:course_id
```

## 개발

### Frontend 개발

```bash
cd frontend
npm run dev
```

### Backend 개발

```bash
cd backend
npm run dev
```

### Analytics Engine 개발

```bash
cd analytics-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## 배포

```bash
# Production 빌드
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 라이센스

MIT License

## 문의

프로젝트 관련 문의: KAIST Touch Math Academy
