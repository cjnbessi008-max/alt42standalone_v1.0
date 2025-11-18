# 🧘 LMS Relaxation Routine System

Moodle LMS와 연동하여 학생들이 정답을 맞춘 후 자동으로 정신 완화 루틴을 제공하는 독립형 웹 애플리케이션입니다.

## 📋 주요 기능

- **자동 정답 감지**: Moodle 퀴즈 시스템과 연동하여 실시간 정답 감지
- **다양한 완화 루틴**:
  - 🫁 호흡 운동 (4-7-8 호흡법, Box Breathing)
  - 🧘 가이드 명상 (1-5분)
  - 💪 간단한 스트레칭 가이드
  - ⏰ 휴식 타이머
  - 💬 긍정 메시지
- **맞춤 추천**: AI 기반 사용자별 최적 루틴 추천
- **진행 추적**: 루틴 완료율 및 효과 분석
- **관리자 대시보드**: 학생별 사용 통계 및 관리

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Material-UI (MUI)
- Redux Toolkit (상태 관리)
- Axios (API 통신)
- Framer Motion (애니메이션)

### Backend
- Node.js 18+ + Express
- TypeScript
- Prisma ORM
- MySQL 5.7 (Moodle 연동)
- PostgreSQL 15 (자체 데이터)
- JWT 인증

### DevOps
- Docker + Docker Compose
- Nginx (리버스 프록시)

## 🏗 시스템 아키텍처

```
┌─────────────────┐
│  Moodle LMS     │
│  (MySQL 5.7)    │
└────────┬────────┘
         │ (읽기 전용)
         ↓
┌─────────────────┐
│  Backend API    │
│  (Node.js)      │
├─────────────────┤
│  PostgreSQL     │ ← 사용자 데이터, 루틴 기록
└────────┬────────┘
         │ REST API
         ↓
┌─────────────────┐
│  Frontend App   │
│  (React)        │
└─────────────────┘
```

## 📦 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # Node.js 백엔드
│   ├── src/
│   │   ├── config/         # 설정 파일
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── services/       # 비즈니스 로직
│   │   ├── models/         # 데이터 모델
│   │   ├── middleware/     # 미들웨어
│   │   ├── routes/         # API 라우트
│   │   └── utils/          # 유틸리티
│   ├── prisma/             # Prisma 스키마
│   └── package.json
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지
│   │   ├── store/         # Redux store
│   │   ├── services/      # API 서비스
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # 유틸리티
│   └── package.json
├── docker-compose.yml      # Docker 설정
└── README.md
```

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+
- Docker & Docker Compose
- MySQL 5.7 (Moodle 데이터베이스)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
cp backend/.env.example backend/.env
# .env 파일 수정 (Moodle DB 연결 정보 입력)
```

3. **Docker로 실행**
```bash
docker-compose up -d
```

4. **접속**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Admin Dashboard: http://localhost:3000/admin

## 🔧 개발 모드

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📊 Moodle 연동 설정

### 1. Moodle 데이터베이스 접근 권한 설정

Moodle MySQL에 읽기 전용 사용자 생성:

```sql
CREATE USER 'relaxation_ro'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON moodle.* TO 'relaxation_ro'@'%';
FLUSH PRIVILEGES;
```

### 2. 환경 변수 설정

`backend/.env` 파일:
```env
MOODLE_DB_HOST=your_moodle_db_host
MOODLE_DB_PORT=3306
MOODLE_DB_USER=relaxation_ro
MOODLE_DB_PASSWORD=your_password
MOODLE_DB_NAME=moodle
```

## 📖 API 문서

API 문서는 서버 실행 후 다음에서 확인:
- Swagger UI: http://localhost:4000/api-docs

## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

## 📝 라이선스

MIT License

## 👥 기여자

KAIST Touch Math Academy

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
