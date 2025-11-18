# Similarity Warm - 닮음 학습 시스템

Moodle 3.7 LMS와 연동하여 닮음 조건을 학습할 수 있는 교육용 웹 애플리케이션입니다. 닮음 조건이 성립하면 화면이 따뜻하게 밝아지는 'Similarity Warm' 효과가 적용됩니다.

## 주요 기능

- **가상 스마트폰 UI**: 우측 하단에 표시되는 스마트폰 시뮬레이터
- **Moodle 연동**: Moodle 3.7 LMS에서 문제 정보를 받아 동작
- **닮음 조건 검증**: SSS, SAS, AA 닮음 조건 자동 판정
- **Similarity Warm 효과**: 정답 시 따뜻한 빛과 애니메이션 효과
- **실시간 피드백**: 즉각적인 정답/오답 피드백

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Framer Motion (애니메이션)
- Axios (HTTP 클라이언트)
- Zustand (상태 관리)

### Backend
- Node.js + Express
- TypeScript
- MySQL 5.7 (Moodle DB 연동)
- Axios (Moodle API 연동)

## 시스템 요구사항

- Node.js 18 이상
- MySQL 5.7
- PHP 7.1.9
- Moodle 3.7

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Frontend 설정

```bash
cd frontend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 API URL 설정

# 개발 서버 실행
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.

### 3. Backend 설정

```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 Moodle 설정 및 DB 정보 입력

# 개발 서버 실행
npm run dev
```

Backend는 `http://localhost:5000`에서 실행됩니다.

### 4. 환경 변수 설정

**Backend (.env)**:
```env
PORT=5000
NODE_ENV=development

# Moodle Configuration
MOODLE_URL=http://localhost/moodle
MOODLE_TOKEN=your_moodle_webservice_token_here

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password_here

CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── VirtualSmartphone/  # 가상 스마트폰 UI
│   │   │   ├── SimilarityWarm/     # Warm 애니메이션 효과
│   │   │   └── ProblemDisplay/     # 문제 표시 컴포넌트
│   │   ├── services/        # API 서비스
│   │   │   └── moodleApi.ts        # Moodle API 연동
│   │   ├── utils/           # 유틸리티 함수
│   │   │   └── similarityChecker.ts # 닮음 조건 검증
│   │   ├── types/           # TypeScript 타입 정의
│   │   ├── App.tsx          # 메인 앱 컴포넌트
│   │   └── main.tsx         # 앱 진입점
│   └── package.json
│
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   │   ├── moodle.ts    # Moodle 연동 라우트
│   │   │   ├── problems.ts  # 문제 관리 라우트
│   │   │   └── progress.ts  # 학습 진행 라우트
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── moodleService.ts    # Moodle API 서비스
│   │   │   └── problemService.ts   # 문제 관리 서비스
│   │   └── server.ts        # Express 서버
│   └── package.json
│
├── shared/                   # 공유 타입 정의
│   └── types/
│       └── index.ts
│
└── README.md
```

## 닮음 조건

시스템은 다음 세 가지 닮음 조건을 검증합니다:

### SSS (변-변-변)
대응하는 세 변의 길이의 비가 모두 같을 때 닮음

### SAS (변-각-변)
두 변의 비가 같고 그 끼인각이 같을 때 닮음

### AA (각-각)
두 각이 각각 같을 때 닮음 (삼각형의 경우)

## API 엔드포인트

### Moodle 연동
- `GET /api/moodle/questions` - 문제 목록 조회
- `GET /api/moodle/questions/:id` - 특정 문제 조회
- `GET /api/moodle/categories` - 카테고리 목록 조회

### 문제 관리
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems/:id/submit` - 답안 제출

### 진행 상황
- `POST /api/progress` - 학습 진행 상황 저장
- `GET /api/progress/:userId` - 사용자 진행 상황 조회

## Moodle 연동 설정

1. Moodle 관리자 페이지에서 Web Services 활성화
2. Web Service Token 생성
3. Backend `.env` 파일에 토큰 설정
4. 필요한 Web Service 함수 활성화:
   - `core_question_get_questions`
   - `core_question_get_question`
   - `core_question_get_categories`

## 개발

### Frontend 개발
```bash
cd frontend
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

### Backend 개발
```bash
cd backend
npm run dev      # 개발 서버 실행 (hot reload)
npm run build    # TypeScript 컴파일
npm start        # 프로덕션 서버 실행
```

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트는 환영합니다!
