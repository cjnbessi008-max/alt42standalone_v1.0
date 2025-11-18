# Term Melody - 개발 가이드

## 개발 환경 설정

### 사전 요구사항

- Node.js 18 이상
- MySQL 5.7 (Moodle 데이터베이스)
- npm 또는 yarn

### 1. 저장소 클론 및 설치

```bash
cd term-melody

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 2. 환경 변수 설정

#### 백엔드 (.env)

```bash
cd backend
cp .env.example .env
```

`.env` 파일 수정:

```env
# MySQL Configuration (Moodle Database)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

#### 프론트엔드 (.env)

```bash
cd frontend
cp .env.example .env
```

`.env` 파일 내용:

```env
VITE_API_URL=http://localhost:3001/api
```

### 3. 개발 서버 실행

#### 터미널 1 - 백엔드

```bash
cd backend
npm run dev
```

출력 예시:
```
🎵 Term Melody API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on: http://localhost:3001
✅ Environment: development
✅ CORS enabled for: http://localhost:5173
✅ Database connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 터미널 2 - 프론트엔드

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 프로젝트 구조

```
term-melody/
├── frontend/                      # React 프론트엔드
│   ├── src/
│   │   ├── components/           # UI 컴포넌트
│   │   │   ├── Dashboard/        # 대시보드 관련
│   │   │   ├── PhoneSimulator/   # 가상 스마트폰
│   │   │   ├── MusicEngine/      # 음악 재생
│   │   │   └── MoodleConnector/  # Moodle 연동
│   │   ├── services/             # API 클라이언트
│   │   ├── stores/               # Zustand 상태 관리
│   │   ├── types/                # TypeScript 타입
│   │   └── utils/                # 유틸리티 함수
│   └── package.json
│
├── backend/                       # Node.js API 서버
│   ├── src/
│   │   ├── config/               # 설정 (DB 등)
│   │   ├── routes/               # API 라우터
│   │   ├── controllers/          # 컨트롤러
│   │   ├── services/             # 비즈니스 로직
│   │   └── server.ts             # 서버 진입점
│   └── package.json
│
└── docs/                          # 문서
```

## API 엔드포인트

### Moodle 관련

#### GET `/api/moodle/questions`

문제 목록 조회

**Query Parameters:**
- `category` (optional): 카테고리 ID
- `type` (optional): 문제 유형
- `limit` (optional): 페이지 크기 (기본: 20)
- `offset` (optional): 오프셋 (기본: 0)

**응답 예시:**
```json
{
  "questions": [
    {
      "id": 123,
      "name": "일차방정식",
      "questiontext": "x + 3 = 7",
      "qtype": "numerical",
      "category": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

#### GET `/api/moodle/question/:id`

특정 문제 상세 조회

**응답 예시:**
```json
{
  "id": 123,
  "name": "일차방정식",
  "questiontext": "x + 3 = 7",
  "qtype": "numerical",
  "answers": [
    {
      "id": 456,
      "answer": "4",
      "fraction": 1.0,
      "feedback": "정답입니다!"
    }
  ],
  "terms": [
    {
      "coefficient": 1,
      "variable": "x",
      "constant": 3,
      "position": 0
    }
  ]
}
```

### 음악 생성 관련

#### POST `/api/melody/generate`

항 변화를 멜로디로 변환

**요청 예시:**
```json
{
  "questionId": 123,
  "terms": [
    { "coefficient": 1, "variable": "x", "constant": 3, "position": 0 },
    { "coefficient": 1, "variable": "x", "constant": 5, "position": 1 }
  ],
  "options": {
    "tempo": 120,
    "scale": "major",
    "baseNote": "C4"
  }
}
```

**응답 예시:**
```json
{
  "melody": {
    "notes": [
      { "note": "E4", "duration": "4n", "time": 0, "velocity": 0.8 },
      { "note": "G4", "duration": "4n", "time": 0.5, "velocity": 0.8 }
    ],
    "tempo": 120,
    "timeSignature": "4/4"
  },
  "visualization": {
    "termChanges": [
      {
        "from": "x+3",
        "to": "x+5",
        "direction": "up",
        "musicalInterpretation": "상승 멜로디"
      }
    ]
  }
}
```

## 코딩 규칙

### TypeScript

- 모든 타입은 명시적으로 정의
- `any` 타입 사용 지양
- 함수는 JSDoc 주석 작성

### React 컴포넌트

- 함수형 컴포넌트 사용
- Hooks 규칙 준수
- Props는 인터페이스로 정의

### 네이밍

- 컴포넌트: PascalCase (예: `PhoneFrame`)
- 함수/변수: camelCase (예: `generateMelody`)
- 상수: UPPER_SNAKE_CASE (예: `API_URL`)
- 파일: kebab-case 또는 PascalCase

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

## 빌드

### 프로덕션 빌드

```bash
# 백엔드
cd backend
npm run build

# 프론트엔드
cd frontend
npm run build
```

## 문제 해결

### 데이터베이스 연결 실패

1. MySQL이 실행 중인지 확인
2. `.env` 파일의 DB 설정 확인
3. Moodle 데이터베이스 접근 권한 확인

```sql
-- READ-ONLY 사용자 생성
CREATE USER 'term_melody'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON moodle.* TO 'term_melody'@'localhost';
FLUSH PRIVILEGES;
```

### CORS 오류

- 백엔드 `.env`의 `FRONTEND_URL` 확인
- 프론트엔드가 올바른 포트에서 실행 중인지 확인

### TypeScript 오류

```bash
# 타입 체크
npm run lint

# 자동 포맷팅
npm run format
```

## 기여 가이드

1. 기능 브랜치 생성
2. 코드 작성 및 테스트
3. Lint 및 포맷 체크
4. Pull Request 생성

## 참고 자료

- [Moodle Database Schema](https://docs.moodle.org/dev/Database_Schema)
- [Tone.js Documentation](https://tonejs.github.io/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
