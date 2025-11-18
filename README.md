# Core Integral Highlighting System

웹앱으로, Moodle LMS와 연동하여 적분 문제 정보를 받아서 동작하는 교육 시스템입니다. 우측 하단 가상 스마트폰 화면에 적분 문제가 표시되며, 적분 과정에서 핵심 규칙만 자동으로 강조합니다.

## 시스템 요구사항

- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Node.js**: 18+ (개발 환경)

## 주요 기능

### 1. Moodle LMS 연동
- Moodle Web Service API를 통한 문제 데이터 가져오기
- MySQL 직접 연결을 통한 문제 조회 (mdl_question 테이블)
- 적분 문제 자동 필터링 및 분류

### 2. 적분 핵심 규칙 자동 강조
- **거듭제곱 법칙**: `∫ x^n dx = x^(n+1)/(n+1) + C`
- **지수함수**: `∫ e^x dx = e^x + C`
- **로그함수**: `∫ (1/x) dx = ln|x| + C`
- **삼각함수**: `∫ sin(x) dx`, `∫ cos(x) dx`
- **치환적분**: `u = g(x)` 치환
- **부분적분**: `∫ u dv = uv - ∫ v du`

### 3. 가상 스마트폰 UI
- 우측 하단에 실제 스마트폰처럼 표시
- 반응형 디자인 (모바일 최적화)
- 실시간 수학 수식 렌더링 (MathJax 3)

### 4. 단계별 풀이 및 하이라이팅
- 색상 기반 하이라이팅으로 핵심 부분 강조
- 단계별 설명과 적용된 규칙 표시
- 인터랙티브 학습 경험 제공

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   │   ├── VirtualPhone.tsx      # 가상 스마트폰 UI
│   │   │   ├── IntegralDisplay.tsx   # 적분 문제 표시
│   │   │   └── *.css
│   │   ├── services/      # API 서비스
│   │   │   └── api.ts
│   │   ├── types/         # TypeScript 타입
│   │   ├── App.tsx        # 메인 앱
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # Node.js + Express 백엔드
│   ├── src/
│   │   ├── services/      # 비즈니스 로직
│   │   │   ├── MoodleService.ts      # Moodle 연동
│   │   │   └── IntegralAnalyzer.ts   # 적분 분석 엔진
│   │   ├── routes/        # API 라우트
│   │   │   └── problems.ts
│   │   ├── types/         # TypeScript 타입
│   │   └── index.ts       # 서버 진입점
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
# 루트 디렉토리에서
npm install

# 프론트엔드 의존성
cd frontend
npm install

# 백엔드 의존성
cd ../backend
npm install
```

### 2. 환경 변수 설정

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

`.env` 파일을 편집하여 Moodle 연결 정보 입력:

```env
PORT=3001
NODE_ENV=development

# Moodle Database
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=your_moodle_user
MOODLE_DB_PASSWORD=your_password

# Moodle API
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token

CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3001
```

### 3. 개발 서버 실행

#### 방법 1: 개별 실행
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 방법 2: 동시 실행 (루트에서)
```bash
npm run dev
```

### 4. 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## API 엔드포인트

### 문제 관련

#### `GET /api/problems`
Moodle에서 적분 문제 목록 가져오기

**Query Parameters:**
- `limit` (optional): 가져올 문제 수 (기본: 10)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### `GET /api/problems/:id`
특정 문제 상세 정보 가져오기

#### `POST /api/problems/analyze`
LaTeX 수식 분석 및 하이라이팅 정보 생성

**Request Body:**
```json
{
  "latex": "\\int x^2 \\, dx",
  "problemText": "x^2를 적분하시오."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "integral_...",
    "problemText": "x^2를 적분하시오.",
    "latex": "\\int x^2 \\, dx",
    "difficulty": "easy",
    "integralType": "power_rule",
    "coreRules": [...],
    "steps": [...]
  }
}
```

#### `GET /api/problems/sample/list`
샘플 적분 문제 목록

#### `GET /api/problems/rules/all`
모든 핵심 적분 규칙 가져오기

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
3. "웹 서비스 활성화" 체크

### 2. 외부 서비스 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
2. "외부 서비스 추가" 클릭
3. 이름: "Core Integral API"
4. 활성화됨: 체크

### 3. 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. 사용자 선택 및 서비스 선택
3. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 4. 데이터베이스 직접 연결 (옵션)

MySQL 사용자 권한 부여:
```sql
GRANT SELECT ON moodle.mdl_question TO 'your_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **MathJax 3** - 수학 수식 렌더링
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **MySQL2** - MySQL 드라이버
- **Axios** - Moodle API 통신

## 개발 가이드

### 새로운 적분 규칙 추가

`backend/src/services/IntegralAnalyzer.ts`의 `initializeCoreRules()` 메서드에 규칙 추가:

```typescript
{
  ruleId: 'new_rule',
  ruleName: '규칙 이름',
  ruleFormula: '수식',
  ruleLatex: '\\int ...',
  description: '설명',
  category: 'integral_type',
}
```

### 하이라이팅 색상 커스터마이징

`backend/src/types/IntegralProblem.ts`의 `HighlightConfig` 인터페이스 수정

### UI 스타일 변경

- `frontend/src/components/VirtualPhone.css` - 스마트폰 UI
- `frontend/src/components/IntegralDisplay.css` - 문제 표시
- `frontend/src/App.css` - 메인 앱

## 배포

### Production 빌드

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### 환경 변수 (Production)

```env
NODE_ENV=production
MOODLE_URL=https://your-production-moodle.com
CORS_ORIGIN=https://your-production-domain.com
```

## 라이선스

MIT License

## 기여

KAIST Touch Math Academy

## 문의

문제가 발생하거나 기능 제안이 있으시면 이슈를 생성해 주세요.
