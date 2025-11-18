# Alt42 Standalone v1.0 - Branch Counting Module

나뭇가지가 뻗어나가는 트리 애니메이션 교육 모듈

## 프로젝트 개요

Alt42는 KAIST Touch Math Academy를 위한 AI 기반 교육 시스템 파이프라인입니다. 이 저장소는 **Branch Counting** 모듈의 독립 실행형 버전으로, 학생들이 애니메이션으로 뻗어나가는 나뭇가지를 세면서 수학적 사고력을 기르는 인터랙티브 학습 도구입니다.

## 주요 기능

- **인터랙티브 트리 애니메이션**: 나뭇가지가 순차적으로 성장하는 SVG 기반 애니메이션
- **난이도 조절**: 5단계 난이도 (3~40개 가지)
- **실시간 피드백**: 학생 답변에 대한 즉각적인 피드백과 힌트
- **모바일 프리뷰**: 우측 하단에 가상 스마트폰 화면으로 앱 표시
- **진행 상황 추적**: 학생별 학습 기록 및 리더보드
- **LMS 연동 준비**: Moodle 3.7+ 연동 가능한 아키텍처

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Framer Motion** - 부드러운 애니메이션
- **Zustand** - 상태 관리
- **Vite** - 빌드 도구

### Backend
- **Node.js** + **Express**
- **PostgreSQL 15** - 데이터베이스

### LMS 연동 (향후)
- **Moodle 3.7+**
- **PHP 7.1.9**
- **MySQL 5.7**

## 빠른 시작

### 방법 1: Docker Compose (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 접속
# Frontend: http://localhost:3000
# API: http://localhost:8000
```

### 방법 2: 로컬 개발

#### 필수 요구사항
- Node.js 20+
- PostgreSQL 15+
- npm 또는 yarn

#### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb alt42_db

# 스키마 적용
psql -d alt42_db -f database/schemas/01_init.sql
```

#### 2. 백엔드 실행

```bash
cd backend/api-gateway

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 등)

# 서버 시작
npm run dev
```

#### 3. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

#### 4. 브라우저 접속

```
http://localhost:3000
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   │   └── MobilePreview/ # 가상 스마트폰 프리뷰
│   │   ├── features/
│   │   │   └── TreeAnimations/
│   │   │       ├── BranchCountingModule.tsx  # 메인 모듈
│   │   │       ├── TreeVisualization.tsx     # SVG 트리 렌더링
│   │   │       └── store/                    # Zustand 상태 관리
│   │   ├── utils/
│   │   │   ├── types.ts                      # TypeScript 타입
│   │   │   └── treeGenerator.ts              # 트리 생성 로직
│   │   └── styles/                           # CSS 스타일
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   └── api-gateway/           # Node.js API 서버
│       ├── server.js          # Express 서버
│       ├── package.json
│       └── .env.example
│
├── database/
│   ├── schemas/
│   │   └── 01_init.sql        # PostgreSQL 스키마
│   └── migrations/
│       └── README.md          # DB 설정 가이드
│
├── docker-compose.yml         # Docker Compose 설정
└── README.md                  # 프로젝트 문서 (이 파일)
```

## 사용 방법

### 1. 난이도 선택
화면 상단에서 1~5 난이도를 선택합니다.

### 2. 애니메이션 시작
"가지 보여주기" 버튼을 클릭하면 나뭇가지가 순차적으로 뻗어나갑니다.

### 3. 가지 세기
애니메이션이 끝나면 총 가지 개수를 입력합니다.

### 4. 피드백 확인
- **정답**: 축하 메시지와 함께 "다음 문제" 버튼 표시
- **오답**: 힌트 제공 (더 세어야 할 개수 또는 경고)

### 5. 다음 문제
"다시 시작" 또는 "다음 문제" 버튼으로 새로운 트리 생성

## API 엔드포인트

### 헬스체크
```
GET /api/health
```

### 트리 생성
```
POST /api/tree/generate
Body: { "difficulty": 1-5 }
```

### 답변 제출
```
POST /api/answer/submit
Body: {
  "studentId": "student001",
  "moduleId": 1,
  "answer": 15,
  "correctAnswer": 15,
  "difficulty": 3
}
```

### 진행 상황 조회
```
GET /api/progress/:studentId
```

### 리더보드
```
GET /api/leaderboard
```

## 데이터베이스 스키마

### 주요 테이블
- **students**: 학생 정보
- **modules**: 교육 모듈 메타데이터
- **tree_problems**: 생성된 트리 문제
- **student_answers**: 학생 답변 기록
- **student_progress**: 학생별 진행 상황

자세한 스키마는 `database/schemas/01_init.sql` 참조

## Moodle LMS 연동 (향후 계획)

### 연동 방식
1. **REST API**: Moodle Web Services API 사용
2. **LTI**: Learning Tools Interoperability 프로토콜
3. **SSO**: KAIST SSO 통합 인증

### 데이터 동기화
- 학생 정보 자동 동기화
- 성적 및 진행 상황 Moodle에 업데이트
- 과제 및 모듈 설정 연동

## 개발 가이드

### 새로운 난이도 추가

`frontend/src/utils/treeGenerator.ts` 수정:
```typescript
export function generateTree(difficulty: 1 | 2 | 3 | 4 | 5 | 6) {
  const maxDepth = difficulty + 1
  // ...
}
```

### 애니메이션 속도 조절

`frontend/src/features/TreeAnimations/BranchCountingModule.tsx`:
```typescript
await new Promise((resolve) =>
  setTimeout(resolve, 300 - difficulty * 30) // 밀리초
)
```

### 새로운 피드백 추가

`frontend/src/features/TreeAnimations/store/useBranchStore.ts`:
```typescript
submitAnswer: (answer) => {
  // 커스텀 피드백 로직
}
```

## 테스트

```bash
# Frontend 테스트
cd frontend
npm run test

# Backend 테스트 (향후 추가)
cd backend/api-gateway
npm run test
```

## 배포

### 프로덕션 빌드

```bash
# Frontend
cd frontend
npm run build
# 결과: frontend/dist/

# Backend는 Node.js로 직접 실행
cd backend/api-gateway
npm start
```

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name alt42.example.com;

    location / {
        root /var/www/alt42/frontend/dist;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트 환영합니다!

## 연락처

KAIST Touch Math Academy
- 이메일: contact@touchmath.kaist.ac.kr
- 웹사이트: https://touchmath.kaist.ac.kr

---

**Alt42 Standalone v1.0** - 나뭇가지 세기로 시작하는 수학 학습의 즐거움
