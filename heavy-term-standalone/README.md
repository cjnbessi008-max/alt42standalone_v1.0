# Heavy Term Standalone - 독립형 웹앱

> **Moodle 의존성 없이 독립적으로 실행 가능한 최신 기술 스택 기반 웹 애플리케이션**

항이 커질수록 중력이 강해지는 "Heavy Term" 효과로 수학을 체험하는 인터랙티브 학습 앱입니다.

## 🚀 기술 스택 (추천 방식)

### Frontend
- **React 18** + **TypeScript** - 타입 안전성
- **Vite** - 초고속 빌드 (Webpack 대비 10-100배 빠름)
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Zustand** - 가벼운 상태 관리 (1KB)
- **Framer Motion** - 부드러운 애니메이션

### Backend
- **Node.js 18+** + **Express** + **TypeScript**
- **Prisma** - 차세대 ORM (타입 안전 쿼리)
- **SQLite** - 설치 불필요, 파일 기반 DB
- **Zod** - 런타임 타입 검증

### Development
- **ESLint** + **Prettier** - 코드 품질
- **Concurrently** - 동시 개발 서버 실행
- **tsx** - TypeScript 실행 엔진

## 📦 설치 방법

### 1. 필수 요구사항
```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### 2. 의존성 설치
```bash
# 루트 디렉토리에서
npm run install:all

# 또는 각각
npm install                    # 루트
cd frontend && npm install     # 프론트엔드
cd backend && npm install      # 백엔드
```

### 3. 환경 설정
```bash
# 백엔드 환경 변수 설정
cd backend
cp .env.example .env

# .env 파일 내용:
# PORT=3000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173
# DATABASE_URL="file:./dev.db"
```

### 4. 데이터베이스 초기화
```bash
cd backend

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# (선택사항) Prisma Studio로 데이터베이스 확인
npm run prisma:studio
```

## 🎯 실행 방법

### 개발 모드 (권장)
```bash
# 루트 디렉토리에서 프론트엔드 + 백엔드 동시 실행
npm run dev

# 프론트엔드: http://localhost:5173
# 백엔드: http://localhost:3000
```

### 개별 실행
```bash
# 프론트엔드만
npm run dev:frontend

# 백엔드만
npm run dev:backend
```

### 프로덕션 빌드
```bash
# 빌드
npm run build

# 실행
npm start
```

## 📁 프로젝트 구조

```
heavy-term-standalone/
├── frontend/                    # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── VirtualPhone/   # 가상 스마트폰 UI
│   │   │   ├── PhysicsCanvas/  # 물리 엔진 캔버스
│   │   │   ├── Term/           # 수학 항 컴포넌트
│   │   │   ├── ControlPanel/   # 제어 패널
│   │   │   └── UI/             # 공통 UI 컴포넌트
│   │   ├── hooks/              # Custom React Hooks
│   │   │   ├── usePhysics.ts   # 물리 엔진
│   │   │   ├── useDragDrop.ts  # 드래그 앤 드롭
│   │   │   └── useTerms.ts     # 항 관리
│   │   ├── store/              # Zustand 상태 관리
│   │   ├── types/              # TypeScript 타입
│   │   └── utils/              # 유틸리티
│   ├── package.json
│   ├── vite.config.ts          # Vite 설정
│   ├── tailwind.config.js      # Tailwind 설정
│   └── tsconfig.json           # TypeScript 설정
│
├── backend/                     # Node.js + Express 백엔드
│   ├── src/
│   │   ├── routes/             # API 라우트
│   │   │   ├── problems.ts     # 문제 관리
│   │   │   ├── sessions.ts     # 세션 관리
│   │   │   ├── interactions.ts # 상호작용 로깅
│   │   │   └── settings.ts     # 설정 관리
│   │   └── server.ts           # 서버 진입점
│   ├── prisma/
│   │   └── schema.prisma       # Prisma 스키마
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example            # 환경 변수 템플릿
│
├── shared/                      # 공유 타입 및 유틸리티
│   └── types/
│       └── index.ts            # 공유 TypeScript 타입
│
├── package.json                # 루트 package.json (monorepo)
├── ARCHITECTURE_STANDALONE.md  # 상세 아키텍처 문서
└── README.md                   # 이 파일
```

## 🔌 API 엔드포인트

### Problems (문제)
- `GET /api/problems` - 모든 문제 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `PUT /api/problems/:id` - 문제 수정
- `DELETE /api/problems/:id` - 문제 삭제

### Sessions (세션)
- `POST /api/sessions` - 새 세션 생성
- `GET /api/sessions/:id` - 세션 조회
- `PUT /api/sessions/:id/end` - 세션 종료

### Interactions (상호작용)
- `POST /api/interactions` - 상호작용 기록

### Settings (설정)
- `GET /api/settings` - 모든 설정 조회
- `PUT /api/settings/:key` - 설정 업데이트

### Health Check
- `GET /health` - 서버 상태 확인

## 🎨 주요 기능

### 1. Heavy Term 물리 효과
- 항의 크기(1-10)에 따른 중력 강도 변화
- 뉴턴 만유인력 법칙 시뮬레이션
- 실시간 60 FPS 물리 시뮬레이션
- 충돌 감지 및 반발력

### 2. 인터랙티브 UI
- 드래그 앤 드롭으로 항 이동
- 가상 스마트폰 UI
- 실시간 물리 파라미터 조정
- 부드러운 애니메이션

### 3. 문제 관리
- 문제 생성, 수정, 삭제
- 자동 항 추출 및 크기 계산
- 난이도 및 카테고리 분류
- LaTeX 수식 지원 (예정)

### 4. 데이터 추적
- 사용자 상호작용 로깅
- 세션 기반 진행 상황 추적
- 성능 메트릭 수집

## 🛠️ 개발 가이드

### 타입 안전성
```typescript
// 공유 타입 사용 (frontend/backend 모두)
import type { Problem, Term, Session } from '@shared/types'

// Prisma 자동 생성 타입
import type { Problem } from '@prisma/client'

// Zod 스키마로 런타임 검증
const createProblemSchema = z.object({
  title: z.string().min(1),
  questionText: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
})
```

### 새로운 API 추가
```typescript
// backend/src/routes/myroute.ts
import { Router } from 'express'
import { prisma } from '../server.js'

const router = Router()

router.get('/', async (req, res) => {
  // 구현
})

export default router

// backend/src/server.ts에 등록
import myRoute from './routes/myroute.js'
app.use('/api/myroute', myRoute)
```

### 새로운 React 컴포넌트 추가
```typescript
// frontend/src/components/MyComponent/MyComponent.tsx
import { FC } from 'react'

interface MyComponentProps {
  title: string
}

export const MyComponent: FC<MyComponentProps> = ({ title }) => {
  return (
    <div className="p-4 bg-white rounded-lg">
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  )
}
```

## 📊 데이터베이스 스키마

### 주요 모델
- **Problem**: 수학 문제
- **Term**: 수학 항 (물리 속성 포함)
- **Session**: 사용자 세션
- **Interaction**: 상호작용 로그
- **Answer**: 제출된 답안
- **Setting**: 앱 설정
- **User**: 사용자 (선택사항)

자세한 스키마는 `backend/prisma/schema.prisma` 참조

## 🐳 Docker 배포 (예정)

```bash
# Docker 컨테이너 빌드
npm run docker:build

# 실행
npm run docker:up

# 중지
npm run docker:down
```

## 🧪 테스트 (예정)

```bash
# 프론트엔드 테스트 (Vitest)
cd frontend && npm run test

# 백엔드 테스트
cd backend && npm run test
```

## 📝 환경 변수

### Backend (.env)
```bash
PORT=3000                           # 서버 포트
NODE_ENV=development                # 환경 (development/production)
FRONTEND_URL=http://localhost:5173  # CORS용 프론트엔드 URL
DATABASE_URL="file:./dev.db"        # SQLite 데이터베이스 파일
```

## 🔧 문제 해결

### Prisma 오류
```bash
# Prisma 클라이언트 재생성
cd backend && npm run prisma:generate

# 데이터베이스 리셋
npm run prisma:migrate
```

### 포트 충돌
```bash
# .env 파일에서 포트 변경
PORT=3001

# 프론트엔드 Vite 포트도 변경 (vite.config.ts)
server: { port: 5174 }
```

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
npm run clean
npm run install:all
```

## 🎯 로드맵

### Phase 1: 기본 인프라 ✅
- [x] 프로젝트 구조
- [x] Vite + React 설정
- [x] Express + TypeScript 설정
- [x] Prisma + SQLite 설정
- [x] 기본 API 라우트

### Phase 2: 코어 기능 🚧
- [ ] 물리 엔진 React 통합
- [ ] 가상 스마트폰 UI
- [ ] 드래그 앤 드롭
- [ ] 문제 생성 시스템

### Phase 3: 고급 기능
- [ ] 문제 편집기 (WYSIWYG)
- [ ] LaTeX 수식 렌더링
- [ ] 사용자 프로필
- [ ] 진행 상황 추적
- [ ] PWA 기능

### Phase 4: 배포
- [ ] Docker 설정
- [ ] CI/CD 파이프라인
- [ ] 프로덕션 최적화
- [ ] 문서화 완성

## 📚 추가 문서

- [ARCHITECTURE_STANDALONE.md](./ARCHITECTURE_STANDALONE.md) - 상세 아키텍처 설명
- [backend/prisma/schema.prisma](./backend/prisma/schema.prisma) - 데이터베이스 스키마
- [shared/types/index.ts](./shared/types/index.ts) - 타입 정의

## 🤝 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 📄 라이선스

MIT

---

**Heavy Term Standalone** - 수학을 중력으로 체험하다 🚀📱

## 🚀 빠른 시작 (요약)

```bash
# 1. 설치
npm run install:all

# 2. 백엔드 설정
cd backend
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate

# 3. 실행
cd ..
npm run dev

# ✅ 완료!
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```
