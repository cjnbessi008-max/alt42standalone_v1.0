# Heavy Term Standalone - 독립형 웹앱 아키텍처

## 🎯 개요
Moodle 의존성 없이 독립적으로 실행 가능한 모던 웹 애플리케이션

## 🏗️ 기술 스택 (추천 방식)

### Frontend
- **React 18** + **TypeScript** - 타입 안전성과 최신 기능
- **Vite** - 초고속 빌드 도구 (Webpack 대비 10-100배 빠름)
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Zustand** - 가벼운 상태 관리 (Redux보다 간단)
- **React Hook Form** - 성능 최적화된 폼 관리
- **Framer Motion** - 부드러운 애니메이션

### Backend
- **Node.js 18+** + **Express**
- **TypeScript** - 전체 풀스택 타입 안전성
- **Prisma** - 차세대 ORM (타입 안전 쿼리)
- **SQLite** - 설치 불필요, 파일 기반 DB
- **Zod** - 런타임 타입 검증

### Development Tools
- **ESLint** + **Prettier** - 코드 품질 및 포맷팅
- **Husky** - Git hooks
- **Vitest** - 빠른 단위 테스트
- **Docker** - 컨테이너화 배포

## 📁 프로젝트 구조

```
heavy-term-standalone/
├── frontend/                    # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── VirtualPhone/   # 가상 스마트폰
│   │   │   ├── PhysicsCanvas/  # 물리 엔진 캔버스
│   │   │   ├── Term/           # 수학 항 컴포넌트
│   │   │   └── ControlPanel/   # 제어 패널
│   │   ├── hooks/              # Custom React Hooks
│   │   │   ├── usePhysics.ts   # 물리 엔진 hook
│   │   │   ├── useDragDrop.ts  # 드래그 앤 드롭 hook
│   │   │   └── useTerms.ts     # 항 관리 hook
│   │   ├── store/              # Zustand 상태 관리
│   │   ├── types/              # TypeScript 타입
│   │   ├── utils/              # 유틸리티 함수
│   │   └── App.tsx             # 메인 앱
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # Node.js + Express 백엔드
│   ├── src/
│   │   ├── routes/             # API 라우트
│   │   ├── controllers/        # 비즈니스 로직
│   │   ├── services/           # 서비스 계층
│   │   ├── models/             # 데이터 모델
│   │   ├── middleware/         # Express 미들웨어
│   │   └── server.ts           # 서버 진입점
│   ├── prisma/
│   │   └── schema.prisma       # Prisma 스키마
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # 공유 타입 및 유틸리티
│   └── types/
│
├── docker-compose.yml          # Docker 설정
├── Dockerfile                  # 컨테이너 이미지
├── README.md                   # 문서
└── package.json               # 루트 package.json (monorepo)
```

## 🎨 주요 기능 개선

### 1. 독립형 문제 생성기
```typescript
// LMS 없이 자체적으로 문제 생성
- 문제 편집기 (WYSIWYG)
- 수식 입력기 (LaTeX 지원)
- 항 자동 추출 및 크기 계산
- 난이도 자동 분석
```

### 2. 사용자 관리
```typescript
// 간단한 로컬 사용자 시스템
- 게스트 모드 (즉시 시작)
- 로컬 스토리지 기반 프로필
- 진행 상황 저장
```

### 3. 향상된 물리 엔진
```typescript
// React와 통합된 물리 시뮬레이션
- usePhysics hook으로 상태 관리
- 60 FPS 보장
- Web Workers로 성능 향상
- 물리 파라미터 실시간 조정
```

### 4. PWA 지원
```typescript
// Progressive Web App
- 오프라인 사용 가능
- 설치 가능 (홈 화면 추가)
- 서비스 워커 캐싱
```

## 🚀 개발 워크플로우

### 1. 초기 설정
```bash
# 루트 디렉토리 생성
npm init -y

# 프론트엔드 (Vite + React + TypeScript)
npm create vite@latest frontend -- --template react-ts

# 백엔드 (Express + TypeScript)
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/express @types/node tsx
```

### 2. 개발 실행
```bash
# 전체 개발 서버 실행 (동시 실행)
npm run dev

# 프론트엔드만: http://localhost:5173
# 백엔드만: http://localhost:3000
```

### 3. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# Docker 컨테이너 실행
docker-compose up

# 단일 명령으로 실행
./run.sh
```

## 🎯 핵심 구현 우선순위

### Phase 1: 기본 인프라 (현재)
1. ✅ 프로젝트 구조 생성
2. ✅ Vite + React 설정
3. ✅ Express + TypeScript 설정
4. ✅ Prisma + SQLite 설정

### Phase 2: 코어 기능
5. 물리 엔진 React 통합
6. 가상 스마트폰 UI
7. 드래그 앤 드롭 인터랙션
8. 문제 생성 시스템

### Phase 3: 고급 기능
9. 문제 편집기
10. 사용자 프로필
11. 진행 상황 추적
12. PWA 기능

## 💡 추천 방식 적용 이유

### Vite vs Webpack
- **빌드 속도**: 10-100배 빠름
- **HMR**: 즉각적인 업데이트
- **설정**: 제로 컨피그

### TypeScript
- **타입 안전성**: 런타임 에러 사전 방지
- **IDE 지원**: 자동완성, 리팩토링
- **문서화**: 코드가 곧 문서

### Zustand vs Redux
- **번들 크기**: 1KB vs 10KB
- **보일러플레이트**: 최소화
- **학습 곡선**: 낮음

### Prisma vs 기존 ORM
- **타입 안전**: 자동 타입 생성
- **마이그레이션**: 자동화
- **쿼리**: 직관적인 API

### SQLite vs MySQL/PostgreSQL
- **설치**: 불필요
- **배포**: 파일 복사만으로 가능
- **성능**: 단일 사용자에 충분
- **이식성**: 크로스 플랫폼

## 🔒 보안 고려사항

```typescript
// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 입력 검증 (Zod)
const ProblemSchema = z.object({
  text: z.string().min(1).max(1000),
  difficulty: z.enum(['easy', 'medium', 'hard'])
});

// SQL Injection 방지 (Prisma 자동)
await prisma.problem.create({ data: validated });
```

## 📊 성능 목표

- **초기 로딩**: < 2초
- **FPS**: 60 (항상)
- **번들 크기**: < 500KB (gzip)
- **Time to Interactive**: < 3초
- **Lighthouse 점수**: > 90

## 🎓 학습 리소스

- [Vite 공식 문서](https://vitejs.dev/)
- [React 18 새 기능](https://react.dev/)
- [Prisma 가이드](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/)

---

**다음 단계**: 프로젝트 스캐폴딩 시작!
