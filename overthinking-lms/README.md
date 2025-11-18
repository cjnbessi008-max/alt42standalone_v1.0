# 과도한 고민 감지 LMS (Overthinking Detection LMS)

학습자가 문제를 과도하게 고민하는 상황을 실시간으로 감지하고 적절한 개입을 제공하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 학생 인터페이스
- 📚 문제 풀이 인터페이스
- 🔍 실시간 행동 추적 (클릭, 입력, 시간 등)
- 💡 과도한 고민 감지 시 힌트 제공
- ✅ 즉각적인 피드백

### 교사 대시보드
- 📊 실시간 학생 모니터링
- 🚨 과도한 고민 알림 (브라우저 알림 포함)
- 📈 학습 분석 및 통계
- 👥 학생별 성과 추적

### 핵심 감지 알고리즘
- **시간 기반 감지**: 평균 대비 2.5배 이상 소요
- **비활동 감지**: 5분 이상 무응답
- **답변 수정 패턴**: 3회 이상 수정
- **반복 클릭 패턴**: 혼란 신호 감지
- **점수 기반 개입**: 40점 이상 힌트, 70점 이상 교사 알림

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- Socket.io (실시간 통신)
- Prisma ORM
- PostgreSQL
- JWT 인증

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.io-client
- Recharts (데이터 시각화)

### DevOps
- Docker + Docker Compose
- PostgreSQL 15

## 빠른 시작

### 필수 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)

### 1. 프로젝트 클론 및 설정

```bash
cd overthinking-lms
cp .env.example .env
```

### 2. Docker로 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 데이터베이스 마이그레이션
docker-compose exec backend npx prisma migrate dev

# 로그 확인
docker-compose logs -f
```

### 3. 접속

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. 초기 데이터 설정

```bash
# Backend 컨테이너 접속
docker-compose exec backend sh

# Prisma Studio로 데이터 관리
npx prisma studio
```

또는 프론트엔드에서 회원가입으로 교사/학생 계정 생성

## 로컬 개발 (Docker 없이)

### Backend

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# DATABASE_URL 등 수정

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 시작
npm run dev
```

### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 시작
npm run dev
```

## 프로젝트 구조

```
overthinking-lms/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── routes/            # API 라우트
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── overthinkingDetector.ts  # 감지 알고리즘
│   │   │   └── socketHandler.ts         # WebSocket 처리
│   │   ├── types/             # TypeScript 타입
│   │   └── index.ts           # 서버 진입점
│   ├── prisma/
│   │   └── schema.prisma      # 데이터베이스 스키마
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── student/       # 학생 컴포넌트
│   │   │   ├── teacher/       # 교사 컴포넌트
│   │   │   └── shared/        # 공통 컴포넌트
│   │   ├── hooks/             # Custom React Hooks
│   │   ├── services/          # API & Socket 서비스
│   │   └── types/             # TypeScript 타입
│   └── package.json
│
├── docs/                       # 문서
│   └── overthinking-detection-system-design.md
├── docker-compose.yml
└── README.md
```

## API 엔드포인트

### 인증
- `POST /api/auth/student/login` - 학생 로그인
- `POST /api/auth/student/register` - 학생 회원가입
- `POST /api/auth/teacher/login` - 교사 로그인
- `POST /api/auth/teacher/register` - 교사 회원가입

### 문제
- `GET /api/problems` - 문제 목록
- `GET /api/problems/:id` - 문제 상세
- `POST /api/problems` - 문제 생성

### 시도
- `POST /api/attempts/start` - 문제 풀이 시작
- `POST /api/attempts/:id/submit` - 답안 제출
- `PATCH /api/attempts/:id` - 답안 수정

### 추적
- `POST /api/tracking/event` - 행동 이벤트 추적
- `POST /api/tracking/events/batch` - 배치 추적
- `GET /api/tracking/overthinking/student/:id` - 과도한 고민 이벤트 조회

### 교사
- `GET /api/teachers/:id/students` - 담당 학생 목록
- `GET /api/teachers/:id/alerts` - 실시간 알림
- `GET /api/teachers/:id/analytics` - 분석 데이터

## WebSocket 이벤트

### Client → Server
- `student:join` - 학생 입장
- `teacher:join` - 교사 입장
- `behavior:track` - 행동 추적
- `hint:request` - 힌트 요청
- `overthinking:dismiss` - 알림 해제

### Server → Client (학생)
- `overthinking:hint_suggest` - 힌트 제안
- `overthinking:alert` - 과도한 고민 알림
- `hint:response` - 힌트 응답

### Server → Client (교사)
- `alert:student_struggling` - 학생 어려움 알림

## 데이터베이스 스키마

주요 테이블:
- `students` - 학생 정보
- `teachers` - 교사 정보
- `problems` - 문제
- `student_attempts` - 문제 풀이 시도
- `behavior_events` - 행동 이벤트
- `overthinking_events` - 과도한 고민 감지 이벤트

전체 스키마는 `backend/prisma/schema.prisma` 참조

## 감지 알고리즘 상세

### 점수 계산 (0-100점)

```typescript
점수 = 시간기반(최대 40점)
     + 비활동(최대 25점)
     + 답변수정(최대 20점)
     + 반복클릭(최대 10점)
     + 연속오답(최대 5점)
```

### 개입 수준

- **0-39점**: 관찰 (아무 행동 안 함)
- **40-69점**: 힌트 제안 (학생에게 선택권)
- **70-100점**: 교사 알림 + 힌트 제공

## 환경 변수

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/overthinking_lms
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 테스트 시나리오

### 1. 학생 계정으로 문제 풀기
1. 학생으로 회원가입/로그인
2. 문제 선택
3. 의도적으로 오랜 시간 대기 (5분 이상)
4. 힌트 제안 알림 확인
5. 답변 여러 번 수정
6. 최종 제출

### 2. 교사 대시보드 모니터링
1. 교사로 회원가입/로그인
2. 학생을 담당으로 추가
3. 실시간 모니터링 탭에서 학생 활동 확인
4. 과도한 고민 알림 수신 확인
5. 분석 탭에서 통계 확인

## 개발 도구

### Prisma Studio (데이터베이스 GUI)
```bash
cd backend
npx prisma studio
# http://localhost:5555 접속
```

### 로그 모니터링
```bash
# 전체 로그
docker-compose logs -f

# Backend만
docker-compose logs -f backend

# Frontend만
docker-compose logs -f frontend
```

## 배포

### Production 빌드

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### 환경 변수 주의사항
- `JWT_SECRET`: 반드시 강력한 시크릿 사용
- `POSTGRES_PASSWORD`: 기본값 변경
- `NODE_ENV=production` 설정
- CORS 설정 검토

## 문제 해결

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 컨테이너 재시작
docker-compose restart postgres
```

### Prisma 마이그레이션 오류
```bash
# 마이그레이션 리셋 (개발 환경)
docker-compose exec backend npx prisma migrate reset

# 강제 재생성
docker-compose exec backend npx prisma generate
```

### WebSocket 연결 안됨
- Backend가 실행 중인지 확인
- CORS 설정 확인
- 방화벽 설정 확인

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License

## 참고 문서

- [시스템 설계 문서](./docs/overthinking-detection-system-design.md)
- [Prisma 공식 문서](https://www.prisma.io/docs/)
- [Socket.io 공식 문서](https://socket.io/docs/)
- [React 공식 문서](https://react.dev/)

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요.
