# 메타인지 미러 시스템 (Metacognition Mirror System)

> **"지금 뭘 하고 있지?"** - 학습자의 메타인지를 실시간으로 비춰주는 AI 교육 시스템

LMS와 연동하여 학습자의 현재 활동을 추적하고, 실시간으로 메타인지 상태를 시각화하여 보여주는 웹 애플리케이션입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 📋 목차

- [주요 기능](#-주요-기능)
- [시스템 아키텍처](#-시스템-아키텍처)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [사용법](#-사용법)
- [API 문서](#-api-문서)
- [LMS 연동](#-lms-연동)
- [개발 가이드](#-개발-가이드)
- [배포](#-배포)
- [라이선스](#-라이선스)

## ✨ 주요 기능

### 1. 실시간 메타인지 미러링
- **"지금 뭘 하고 있지?"** 질문에 대한 실시간 답변 제공
- 현재 학습 활동, 경과 시간, 진행도 실시간 표시
- 학습 패턴 및 집중도 자동 분석

### 2. 학습 활동 추적
- 읽기, 문제 풀이, 비디오 시청 등 다양한 활동 타입 지원
- 활동별 시간 분포 및 통계 자동 수집
- 학습 이력 타임라인 시각화

### 3. 집중도 모니터링
- 실시간 집중도 레벨 측정 (5단계)
- 산만함 감지 시 자동 알림
- 맞춤형 집중력 향상 제안

### 4. 메타인지 촉진 프롬프트
- 상황별 성찰 질문 자동 생성
- "이해하고 있니?", "집중하고 있니?" 등의 자기 점검 유도
- 우선순위 기반 프롬프트 표시

### 5. 학습 인사이트
- AI 기반 학습 패턴 분석
- 강점 및 개선 영역 자동 식별
- 실행 가능한 개선 제안 제공

### 6. LMS 연동
- 외부 학습 관리 시스템과 양방향 통신
- 학습 진행도 자동 동기화
- 웹훅 기반 실시간 이벤트 처리

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Metacognition│  │   Activity   │  │  Learning    │      │
│  │    Mirror    │  │   Tracking   │  │  Insights    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ WebSocket + REST API
┌─────────────────────────────▼───────────────────────────────┐
│              Backend (Node.js + Express + Socket.io)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Metacognition│  │   Behavior   │  │     LMS      │      │
│  │   Service    │  │   Service    │  │ Integration  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────┬───────────────┬───────────────┬───────────────┘
              │               │               │
┌─────────────▼───┐  ┌────────▼────────┐  ┌──▼──────────┐
│   PostgreSQL    │  │      Redis      │  │  External   │
│   (Data Store)  │  │     (Cache)     │  │     LMS     │
└─────────────────┘  └─────────────────┘  └─────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **Zustand** - 상태 관리
- **Socket.io-client** - 실시간 통신
- **Recharts** - 데이터 시각화
- **Vite** - 빌드 도구

### Backend
- **Node.js 20+** - 런타임
- **Express** - 웹 프레임워크
- **Socket.io** - WebSocket 서버
- **TypeScript** - 타입 안전성
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐시 및 세션 관리
- **Winston** - 로깅

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **PostgreSQL 15** - 데이터 지속성
- **Redis 7** - 인메모리 데이터 스토어

## 🚀 시작하기

### 사전 요구사항

- Node.js 20 이상
- Docker & Docker Compose
- Git

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone https://github.com/your-org/metacognition-mirror.git
cd metacognition-mirror
```

#### 2. Docker Compose로 전체 시스템 실행

```bash
# 모든 서비스 시작 (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

#### 3. 개별 실행 (로컬 개발)

```bash
# 의존성 설치
npm install

# 공통 타입 빌드
cd shared && npm install && npm run build

# 백엔드 실행
cd ../backend
npm install
cp .env.example .env
npm run dev

# 프론트엔드 실행 (새 터미널)
cd ../frontend
npm install
npm run dev
```

### 4. 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 📖 사용법

### 학생 학습 시작

1. 웹 애플리케이션 접속
2. 메타인지 미러 대시보드 확인
3. 학습 활동 시작 시 자동으로 추적 시작
4. 실시간으로 업데이트되는 메타인지 상태 확인

### 메타인지 미러 읽기

- **현재 활동**: 지금 무엇을 하고 있는지 확인
- **집중도 지표**: 현재 집중 수준 체크
- **성찰 프롬프트**: 제안된 질문에 답하며 자기 점검
- **학습 패턴**: 나의 학습 강점과 개선 영역 파악
- **시간 분포**: 활동별 시간 배분 확인

### 교사/관리자 기능

- 학생 메타인지 상태 모니터링
- 학습 인사이트 확인
- LMS와 진행도 동기화

## 📚 API 문서

### REST API Endpoints

#### Metacognition

```http
GET /api/v1/metacognition/:studentId
# 학생의 메타인지 상태 조회

GET /api/v1/metacognition/:studentId/insights
# 학습 인사이트 조회

GET /api/v1/metacognition/:studentId/focus-analysis
# 집중도 분석 조회
```

#### Activity

```http
POST /api/v1/activity/start
# 새 학습 활동 시작

POST /api/v1/activity/complete
# 활동 완료

GET /api/v1/activity/:studentId/current
# 현재 활동 조회

GET /api/v1/activity/:studentId/history
# 활동 이력 조회
```

#### Behavior

```http
POST /api/v1/behavior/track
# 행동 이벤트 추적

GET /api/v1/behavior/:studentId/analysis
# 행동 분석 조회
```

### WebSocket Events

#### Client -> Server

```javascript
// 학생 식별
socket.emit('identify', studentId);

// 활동 시작
socket.emit('activity:start', {
  studentId,
  moduleId,
  activityType,
  activityName
});

// 행동 추적
socket.emit('behavior:track', {
  studentId,
  activityId,
  events: [...]
});
```

#### Server -> Client

```javascript
// 메타인지 업데이트
socket.on('metacognition:update', (state) => {
  // 메타인지 상태 업데이트
});

// 집중도 알림
socket.on('focus:alert', (alert) => {
  // 집중도 경고 표시
});

// 성찰 프롬프트
socket.on('reflection:prompt', (prompt) => {
  // 성찰 질문 표시
});
```

## 🔗 LMS 연동

### 환경 변수 설정

```bash
# backend/.env
LMS_API_URL=https://your-lms.com
LMS_API_KEY=your-api-key
```

### LMS API 요구사항

메타인지 미러 시스템은 다음 엔드포인트를 통해 LMS와 통신합니다:

```http
GET /api/students/:studentId
# 학생 정보 조회

GET /api/students/:studentId/enrollments
# 학생 등록 과목 조회

POST /api/progress
# 진행도 업데이트

POST /api/analytics/metacognition
# 메타인지 데이터 전송
```

### Webhook 설정

LMS에서 다음 이벤트 발생 시 웹훅 전송:

```javascript
POST /api/v1/lms/webhook
{
  "type": "student.enrolled",
  "data": {
    "studentId": "...",
    "moduleId": "..."
  }
}
```

## 👩‍💻 개발 가이드

### 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── services/      # API 서비스
│   │   └── pages/         # 페이지 컴포넌트
│   └── package.json
├── backend/               # Node.js 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # 데이터 모델
│   │   └── utils/         # 유틸리티
│   └── package.json
├── shared/                # 공통 타입 정의
│   └── types/
├── database/              # 데이터베이스 스키마
│   ├── schema.sql
│   └── seeds/
├── docker/                # Docker 설정
└── docker-compose.yml
```

### 로컬 개발

```bash
# 백엔드 개발
cd backend
npm run dev  # tsx watch로 자동 재시작

# 프론트엔드 개발
cd frontend
npm run dev  # Vite HMR 활성화

# 타입 공유 모듈 변경 시
cd shared
npm run build
```

### 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 🚢 배포

### Docker를 이용한 프로덕션 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d

# 환경 변수 설정
# .env.production 파일 생성 필요
```

### 환경 변수

**Backend (.env)**

```bash
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=metacognition_mirror
DB_USER=postgres
DB_PASSWORD=secure_password
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=change-this-in-production
CORS_ORIGIN=https://your-domain.com
LMS_API_URL=https://your-lms.com
LMS_API_KEY=your-api-key
```

**Frontend (.env.production)**

```bash
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_WS_URL=https://api.your-domain.com
```

## 🧪 데모 데이터

시스템에는 테스트를 위한 데모 데이터가 포함되어 있습니다:

- **학생**: 김민수, 이지은, 박서연
- **모듈**: 분수의 이해, 곱셈과 나눗셈, 도형의 넓이
- **활동**: 문제 풀이, 비디오 시청, 읽기 등

데모 데이터는 `database/seeds/demo_data.sql`에서 확인할 수 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 문의

프로젝트 관련 문의: [your-email@example.com](mailto:your-email@example.com)

프로젝트 링크: [https://github.com/your-org/metacognition-mirror](https://github.com/your-org/metacognition-mirror)

---

**Made with ❤️ for KAIST Touch Math Academy**
