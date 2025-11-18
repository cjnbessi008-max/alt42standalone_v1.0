# LMS 연동 일일 학습 감정 기록 시스템

KAIST Touch Math Academy를 위한 LMS 통합 학습 감정 추적 시스템입니다. 학생들의 학습 중 감정 상태를 실시간으로 기록하고, 자동으로 일일 요약을 생성하여 학습 경험을 개선합니다.

## 📋 주요 기능

### 1. 실시간 감정 기록
- 5가지 감정 유형 지원 (행복, 자신감, 보통, 혼란, 좌절)
- 감정 강도 측정 (1-5 레벨)
- 학습 세션과 연동된 감정 추적
- 추가 메모 및 컨텍스트 정보 저장

### 2. 자동 일일 요약 생성
- 매일 자정 자동 실행되는 Cron Job
- 감정 분포 분석
- 학습 시간 통계
- 감정 트렌드 분석 (개선 중/안정적/주의 필요)

### 3. LMS 연동
- Canvas, Moodle, Google Classroom, KAIST LMS 지원
- OAuth 2.0 인증
- 학생 데이터 자동 동기화
- 학습 활동 추적

### 4. 시각화 및 대시보드
- 감정 타임라인
- 일일 요약 카드
- 감정 분포 차트
- 학습 통계

## 🏗️ 기술 스택

### Backend
- **언어**: TypeScript
- **런타임**: Node.js 20
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL 15
- **캐시**: Redis 7
- **작업 큐**: node-cron
- **보안**: Helmet, CORS, 암호화(AES-256)

### Frontend
- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **UI 라이브러리**: Material-UI (MUI)
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios
- **차트**: Recharts
- **라우팅**: React Router v6

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm 또는 yarn

### 1. Docker Compose 사용 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 데이터베이스 마이그레이션
docker-compose exec backend npm run migrate

# 샘플 데이터 시드 (선택사항)
docker-compose exec backend npm run seed
```

서비스 접속:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Health Check: http://localhost:4000/api/v1/health

### 2. 로컬 개발 환경

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 Redis 설정

# 데이터베이스 마이그레이션
npm run migrate

# 샘플 데이터 시드 (선택사항)
npm run seed

# 개발 서버 실행
npm run dev
```

Backend 서버가 http://localhost:4000 에서 실행됩니다.

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev
```

Frontend 앱이 http://localhost:3000 에서 실행됩니다.

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # 설정 파일 (DB, Redis)
│   │   ├── controllers/       # API 컨트롤러
│   │   ├── database/          # 데이터베이스 스키마 및 마이그레이션
│   │   ├── jobs/              # Cron 작업 (자동 요약 생성)
│   │   ├── middleware/        # Express 미들웨어
│   │   ├── models/            # 타입 정의
│   │   ├── routes/            # API 라우트
│   │   ├── services/          # 비즈니스 로직
│   │   ├── utils/             # 유틸리티 함수
│   │   └── server.ts          # 서버 진입점
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Frontend 웹앱
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── services/          # API 클라이언트
│   │   ├── store/             # 상태 관리
│   │   ├── types/             # 타입 정의
│   │   ├── utils/             # 유틸리티
│   │   ├── App.tsx            # 메인 앱 컴포넌트
│   │   └── main.tsx           # 앱 진입점
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── database/                   # 데이터베이스 관련 파일
├── docs/                       # 문서
├── docker-compose.yml          # Docker Compose 설정
├── EMOTION_TRACKING_DESIGN.md  # 시스템 설계 문서
└── README.md                   # 이 파일
```

## 🔌 API 엔드포인트

### Emotion API
```
POST   /api/v1/emotions                      # 감정 기록 생성
GET    /api/v1/emotions/student/:studentId   # 학생 감정 기록 조회
GET    /api/v1/emotions/session/:sessionId   # 세션별 감정 조회
GET    /api/v1/emotions/student/:studentId/distribution  # 감정 분포
PUT    /api/v1/emotions/:id                  # 감정 기록 수정
DELETE /api/v1/emotions/:id                  # 감정 기록 삭제
```

### Session API
```
POST   /api/v1/sessions/start                # 학습 세션 시작
PUT    /api/v1/sessions/:id/end              # 학습 세션 종료
GET    /api/v1/sessions/:id                  # 세션 조회
GET    /api/v1/sessions/student/:studentId   # 학생 세션 목록
GET    /api/v1/sessions/student/:studentId/active  # 활성 세션
GET    /api/v1/sessions/student/:studentId/stats   # 세션 통계
```

### Summary API
```
GET    /api/v1/summaries/student/:studentId        # 일일 요약 조회
GET    /api/v1/summaries/student/:studentId/range  # 기간별 요약
POST   /api/v1/summaries/student/:studentId/generate  # 요약 생성
POST   /api/v1/summaries/generate-all              # 전체 요약 생성
POST   /api/v1/summaries/trigger-yesterday         # 어제 요약 생성
```

### LMS API
```
POST   /api/v1/lms/integrations              # LMS 연동 생성
GET    /api/v1/lms/integrations/:id          # 연동 정보 조회
GET    /api/v1/lms/integrations              # 활성 연동 목록
POST   /api/v1/lms/integrations/:id/sync     # 학생 데이터 동기화
POST   /api/v1/lms/integrations/:id/tokens   # OAuth 토큰 저장
```

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### students
학생 정보를 저장합니다.
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  lms_id VARCHAR(255) NOT NULL,
  lms_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  grade_level INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### emotion_records
감정 기록을 저장합니다.
```sql
CREATE TABLE emotion_records (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  session_id UUID REFERENCES learning_sessions(id),
  emotion_type VARCHAR(50) NOT NULL,
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  note TEXT,
  context JSONB,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP
);
```

#### daily_emotion_summaries
일일 감정 요약을 저장합니다.
```sql
CREATE TABLE daily_emotion_summaries (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  summary_date DATE NOT NULL,
  total_learning_minutes INTEGER,
  session_count INTEGER,
  emotion_distribution JSONB,
  dominant_emotion VARCHAR(50),
  average_intensity DECIMAL(3,2),
  emotion_trend VARCHAR(50),
  generated_at TIMESTAMP
);
```

전체 스키마는 `backend/src/database/schema.sql`을 참조하세요.

## ⚙️ 자동화 작업

### 일일 요약 생성 (Cron Job)
- **스케줄**: 매일 00:00 KST
- **작업**: 전날의 모든 감정 데이터를 집계하여 요약 생성
- **설정**: `.env` 파일의 `DAILY_SUMMARY_CRON` 변수로 조정 가능

### LMS 데이터 동기화
- **스케줄**: 매시간 정각
- **작업**: LMS에서 학생 정보 및 학습 활동 동기화
- **설정**: `.env` 파일의 `LMS_SYNC_CRON` 변수로 조정 가능

## 🔐 보안

- **데이터 암호화**: LMS 인증 정보는 AES-256으로 암호화
- **HTTPS**: 프로덕션 환경에서 TLS 1.3 사용
- **CORS**: 허용된 출처만 API 접근 가능
- **Helmet**: 보안 HTTP 헤더 설정
- **환경 변수**: 민감한 정보는 환경 변수로 관리

## 📊 감정 유형

| 유형 | 한글 | 이모지 | 색상 |
|------|------|--------|------|
| happy | 행복해요 | 😊 | 초록색 |
| confident | 자신있어요 | 😎 | 파란색 |
| neutral | 보통이에요 | 😐 | 회색 |
| confused | 헷갈려요 | 😕 | 주황색 |
| frustrated | 답답해요 | 😣 | 빨간색 |

## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

## 📝 개발 가이드

### 새로운 감정 유형 추가

1. `backend/src/models/types.ts`에서 `EmotionType` 타입 수정
2. `frontend/src/utils/emotionConfig.ts`에 새 감정 설정 추가
3. 데이터베이스 스키마 업데이트 (CHECK 제약 조건)

### 새로운 LMS 연동 추가

1. `backend/src/services/lmsService.ts`에 새 LMS fetch 메서드 추가
2. `backend/src/models/types.ts`에서 `LMSType` 타입 수정
3. OAuth 설정 및 콜백 라우트 구현

## 🐛 문제 해결

### 데이터베이스 연결 실패
```bash
# PostgreSQL이 실행 중인지 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres
```

### Redis 연결 실패
```bash
# Redis가 실행 중인지 확인
docker-compose ps redis

# Redis CLI 접속 테스트
docker-compose exec redis redis-cli ping
```

### 포트 충돌
`.env` 파일에서 포트 번호를 변경하세요:
```
PORT=4001  # Backend 포트 변경
```

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 👥 개발팀

KAIST Touch Math Academy - AI Education System Team

## 📧 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.

---

**Built with ❤️ for KAIST Touch Math Academy**
