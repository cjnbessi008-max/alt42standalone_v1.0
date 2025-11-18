# Relation Thermo - Standalone Web Application

집합의 관계를 온도계처럼 시각화하는 독립형 교육용 웹 애플리케이션

## 🎯 개요

Relation Thermo는 학생들이 집합 간의 관계를 직관적으로 학습할 수 있도록 온도계 시각화를 제공하는 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 표시되며, 실시간 피드백과 진행 상황 추적 기능을 제공합니다.

## 🚀 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **TailwindCSS** - 스타일링
- **Zustand** - 상태 관리
- **React Query** - 서버 상태 관리

### Backend
- **Node.js 18+** - 런타임
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안전성
- **Prisma** - ORM
- **MySQL 5.7+** - 데이터베이스
- **JWT** - 인증

### DevOps
- **Docker** - 컨테이너화
- **Docker Compose** - 오케스트레이션
- **ESLint** - 코드 품질
- **Prettier** - 코드 포맷팅

## 📁 프로젝트 구조

```
relation-thermo-webapp/
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # Zustand 스토어
│   │   ├── services/     # API 서비스
│   │   ├── types/        # TypeScript 타입
│   │   └── utils/        # 유틸리티
│   ├── public/           # 정적 파일
│   └── package.json
│
├── backend/              # Node.js 백엔드
│   ├── src/
│   │   ├── routes/      # API 라우트
│   │   ├── controllers/ # 컨트롤러
│   │   ├── services/    # 비즈니스 로직
│   │   ├── models/      # 데이터 모델
│   │   ├── middleware/  # 미들웨어
│   │   └── utils/       # 유틸리티
│   ├── prisma/          # Prisma 스키마
│   └── package.json
│
├── docker-compose.yml   # Docker 설정
├── .env.example        # 환경 변수 예제
└── README.md           # 문서
```

## 🎨 주요 기능

### 1. 가상 스마트폰 인터페이스
- 우측 하단 360x640px 스마트폰 프레임
- 드래그 가능한 위치 조정
- 반응형 디자인

### 2. 온도계 시각화
- 0-100% 확신도 표시
- 실시간 애니메이션
- 인터랙티브 슬라이더

### 3. 집합 관계 학습
- 부분집합 (A ⊆ B)
- 초집합 (A ⊇ B)
- 같음 (A = B)
- 서로소 (A ∩ B = ∅)
- 교집합 존재 (A ∩ B ≠ ∅)

### 4. 학습 관리
- 사용자 인증 및 세션
- 진행 상황 추적
- 성적 통계 및 분석
- 학습 이력 저장

## 🛠️ 설치 및 실행

### 사전 요구사항
- Node.js 18+
- MySQL 5.7+
- Docker (선택사항)

### 1. 환경 설정
```bash
# 저장소 클론
git clone <repository-url>
cd relation-thermo-webapp

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집
```

### 2. Docker로 실행 (추천)
```bash
docker-compose up -d
```

애플리케이션이 다음 주소에서 실행됩니다:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 3. 로컬 개발 환경

#### 백엔드
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## 📖 API 문서

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 문제
- `GET /api/problems` - 문제 목록
- `GET /api/problems/:id` - 문제 상세
- `POST /api/problems` - 문제 생성 (관리자)

### 응답
- `POST /api/responses` - 답안 제출
- `GET /api/responses/user/:userId` - 사용자 응답 이력

### 통계
- `GET /api/stats/user/:userId` - 사용자 통계
- `GET /api/stats/overall` - 전체 통계

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 📦 배포

### Docker 이미지 빌드
```bash
docker-compose build
docker-compose push
```

### 프로덕션 배포
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 빌드
cd backend
npm run build

# PM2로 실행
pm2 start ecosystem.config.js
```

## 🔐 보안

- JWT 기반 인증
- bcrypt 비밀번호 해싱
- CORS 설정
- Rate limiting
- SQL Injection 방지 (Prisma ORM)
- XSS 방지

## 📊 데이터베이스 스키마

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
}

model Problem {
  id           Int      @id @default(autoincrement())
  title        String
  description  String?
  setA         Json
  setB         Json
  relationType String
  difficulty   Int
}

model Response {
  id               Int      @id @default(autoincrement())
  userId           Int
  problemId        Int
  selectedRelation String
  confidenceLevel  Int
  isCorrect        Boolean
  timeSpent        Int
  submittedAt      DateTime @default(now())
}
```

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy

---

**Version**: 2.0.0 (Standalone)
**Last Updated**: 2025-01-18
