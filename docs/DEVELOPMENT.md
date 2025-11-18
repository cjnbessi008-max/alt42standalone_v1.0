# Development Guide

## 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+ (또는 Docker)
- Git

### 로컬 개발 시작하기

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2. 데이터베이스 설정

**Option A: Docker 사용 (권장)**

```bash
# PostgreSQL만 실행
docker run -d \
  --name counterexample-db \
  -e POSTGRES_DB=counterexample_shadow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine

# 스키마 적용
docker exec -i counterexample-db psql -U postgres -d counterexample_shadow < database/schema.sql
```

**Option B: 로컬 PostgreSQL 사용**

```bash
# 데이터베이스 생성
createdb counterexample_shadow

# 스키마 적용
psql -d counterexample_shadow -f database/schema.sql
```

#### 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# 개발 서버 실행
npm run dev
```

백엔드가 http://localhost:3000 에서 실행됩니다.

#### 4. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

### Docker Compose로 전체 스택 실행

가장 쉬운 방법:

```bash
# 전체 스택 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

접속:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/              # Node.js + Express 백엔드
│   ├── src/
│   │   ├── config/      # 데이터베이스 설정
│   │   ├── controllers/ # API 컨트롤러
│   │   ├── models/      # 데이터 모델
│   │   ├── routes/      # API 라우트
│   │   ├── types/       # TypeScript 타입
│   │   └── server.ts    # 서버 엔트리
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   │   ├── CounterexampleShadow/  # 시각화 컴포넌트
│   │   │   ├── VirtualPhone/          # 가상 스마트폰
│   │   │   └── PropositionEditor/     # 명제 편집기
│   │   ├── pages/       # 페이지
│   │   ├── services/    # API 서비스
│   │   ├── types/       # TypeScript 타입
│   │   ├── App.tsx      # 메인 앱
│   │   └── main.tsx     # 엔트리
│   ├── package.json
│   └── vite.config.ts
│
├── database/
│   └── schema.sql       # PostgreSQL 스키마
│
├── docs/
│   ├── ARCHITECTURE.md  # 아키텍처 문서
│   └── DEVELOPMENT.md   # 개발 가이드
│
├── docker-compose.yml
└── README.md
```

## 주요 기능 개발

### 1. 새로운 시각화 모드 추가

`frontend/src/components/CounterexampleShadow/CounterexampleShadow.tsx` 파일을 수정:

```typescript
// 새로운 draw 함수 추가
function drawCustomMode(
  ctx: CanvasRenderingContext2D,
  counterexamples: Counterexample[],
  config: VisualizationConfig,
  width: number,
  height: number,
  progress: number
) {
  // 커스텀 시각화 로직
}

// animate 함수의 switch 문에 추가
case 'custom':
  drawCustomMode(ctx, counterexamples, config, width, height, animationProgress);
  break;
```

### 2. 새로운 API 엔드포인트 추가

#### Backend

1. 컨트롤러 작성 (`backend/src/controllers/`)
2. 라우트 등록 (`backend/src/routes/`)
3. 모델 업데이트 (필요시)

#### Frontend

1. API 서비스 추가 (`frontend/src/services/api.ts`)
2. 컴포넌트에서 사용

### 3. 데이터베이스 스키마 변경

```bash
# 1. database/schema.sql 수정
# 2. 마이그레이션 적용

# Docker 사용시
docker-compose down
docker-compose up -d db
docker exec -i counterexample-db psql -U postgres -d counterexample_shadow < database/schema.sql

# 로컬 PostgreSQL 사용시
psql -d counterexample_shadow -f database/schema.sql
```

## 테스트

### 백엔드 테스트

```bash
cd backend
npm test
```

### 프론트엔드 테스트

```bash
cd frontend
npm test
```

### API 테스트 (수동)

```bash
# Health check
curl http://localhost:3000/health

# 명제 목록 조회
curl http://localhost:3000/api/propositions

# 명제 생성
curl -X POST http://localhost:3000/api/propositions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 명제",
    "statement": "∀x ∈ N, x > 0",
    "domain": "Natural numbers",
    "type": "universal"
  }'
```

## 코드 품질

### Linting

```bash
# 백엔드
cd backend
npm run lint

# 프론트엔드
cd frontend
npm run lint
```

### TypeScript 타입 체크

```bash
# 백엔드
cd backend
npm run build

# 프론트엔드
cd frontend
npm run build
```

## 배포

### Production 빌드

```bash
# 백엔드
cd backend
npm run build

# 프론트엔드
cd frontend
npm run build
```

### Docker 배포

```bash
# Production 모드로 실행
NODE_ENV=production docker-compose up -d

# 환경 변수 설정은 docker-compose.yml에서 수정
```

## 트러블슈팅

### 데이터베이스 연결 오류

```bash
# PostgreSQL 실행 확인
docker ps | grep counterexample-db

# 로그 확인
docker logs counterexample-db

# 연결 테스트
psql -h localhost -U postgres -d counterexample_shadow
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000  # 백엔드
lsof -i :5173  # 프론트엔드
lsof -i :5432  # 데이터베이스

# docker-compose.yml에서 포트 변경 가능
```

### 캐시 문제

```bash
# Node modules 재설치
rm -rf node_modules package-lock.json
npm install

# Docker 이미지 재빌드
docker-compose build --no-cache
```

## 유용한 명령어

### 데이터베이스

```bash
# 데이터베이스 백업
docker exec counterexample-db pg_dump -U postgres counterexample_shadow > backup.sql

# 데이터베이스 복원
docker exec -i counterexample-db psql -U postgres -d counterexample_shadow < backup.sql

# 테이블 확인
docker exec -it counterexample-db psql -U postgres -d counterexample_shadow -c "\dt"

# 데이터 확인
docker exec -it counterexample-db psql -U postgres -d counterexample_shadow -c "SELECT * FROM propositions;"
```

### Docker

```bash
# 컨테이너 셸 접속
docker exec -it counterexample-backend sh
docker exec -it counterexample-frontend sh

# 특정 서비스만 재시작
docker-compose restart backend

# 로그 필터링
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 기여 가이드

1. Feature 브랜치 생성
2. 변경사항 커밋
3. 테스트 실행
4. Pull Request 생성

## 라이선스

MIT License
