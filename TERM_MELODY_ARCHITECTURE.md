# Term Melody - 항의 변화를 음악으로 표현하는 LMS 연동 웹앱

## 프로젝트 개요

**Term Melody**는 Moodle LMS에서 문제 정보를 받아와 수학 문제의 항(term) 변화를 음악으로 표현하는 독립형 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면을 통해 모바일 경험을 시뮬레이션합니다.

## 기술 스택

### 프론트엔드
- **React 18+** + **TypeScript**: UI 컴포넌트 개발
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Tailwind CSS**: 반응형 디자인 및 스타일링
- **Web Audio API**: 브라우저 네이티브 음악 생성
- **Tone.js**: 고급 음악 합성 및 스케줄링
- **Axios**: HTTP 클라이언트
- **Zustand**: 경량 상태 관리

### 백엔드
- **Node.js 18+** + **Express**: API 서버
- **TypeScript**: 타입 안정성
- **MySQL 5.7**: Moodle 데이터베이스 연동
- **mysql2**: MySQL 드라이버
- **cors**: CORS 처리
- **dotenv**: 환경 변수 관리

### 개발 도구
- **ESLint** + **Prettier**: 코드 품질
- **Jest** + **React Testing Library**: 테스트
- **Docker**: 컨테이너화 (선택사항)

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                     Term Melody Web App                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Main Dashboard (좌측)                  │  │
│  │  - 문제 목록                                          │  │
│  │  - 필터 및 검색                                       │  │
│  │  - 설정 패널                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Phone Simulator (우측 하단)                  │  │
│  │  ┌────────────────────────────────────────────┐     │  │
│  │  │  📱 Virtual Smartphone Display              │     │  │
│  │  │                                             │     │  │
│  │  │  - 문제 표시 영역                          │     │  │
│  │  │  - 항 변화 시각화                          │     │  │
│  │  │  - 음악 재생 컨트롤                        │     │  │
│  │  │  - 진행 상태 표시                          │     │  │
│  │  └────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js API Server                         │
│                                                               │
│  /api/moodle/questions     - 문제 목록 조회                 │
│  /api/moodle/question/:id  - 특정 문제 상세                 │
│  /api/melody/generate      - 음악 데이터 생성               │
│  /api/melody/analyze       - 항 변화 분석                   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ MySQL Connection
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Moodle 3.7 (MySQL 5.7)                       │
│                                                               │
│  - mdl_question           - 문제 메타데이터                 │
│  - mdl_question_answers   - 정답 및 선택지                  │
│  - mdl_quiz               - 퀴즈 정보                        │
│  - mdl_quiz_attempts      - 학생 응답 기록                  │
└─────────────────────────────────────────────────────────────┘
```

## 디렉토리 구조

```
term-melody/
├── frontend/                      # React 프론트엔드
│   ├── public/
│   │   └── phone-frame.svg       # 스마트폰 프레임 이미지
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── QuestionList.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── SettingsPanel.tsx
│   │   │   ├── PhoneSimulator/
│   │   │   │   ├── PhoneFrame.tsx       # 스마트폰 외형
│   │   │   │   ├── PhoneScreen.tsx      # 화면 콘텐츠
│   │   │   │   └── PhoneControls.tsx    # 재생 컨트롤
│   │   │   ├── MusicEngine/
│   │   │   │   ├── MelodyPlayer.tsx     # 음악 재생기
│   │   │   │   ├── TermVisualizer.tsx   # 항 변화 시각화
│   │   │   │   └── AudioEngine.ts       # Web Audio API 래퍼
│   │   │   └── MoodleConnector/
│   │   │       ├── QuestionFetcher.tsx
│   │   │       └── DataParser.ts        # Moodle 데이터 파싱
│   │   ├── services/
│   │   │   ├── moodleApi.ts             # Moodle API 클라이언트
│   │   │   ├── melodyGenerator.ts       # 음악 생성 로직
│   │   │   └── termAnalyzer.ts          # 항 분석 알고리즘
│   │   ├── stores/
│   │   │   └── appStore.ts              # Zustand 상태 관리
│   │   ├── types/
│   │   │   ├── moodle.types.ts
│   │   │   ├── melody.types.ts
│   │   │   └── term.types.ts
│   │   ├── utils/
│   │   │   ├── mathParser.ts            # 수학 표현식 파싱
│   │   │   └── noteMapper.ts            # 항 → 음표 매핑
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                       # Node.js API 서버
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts              # MySQL 연결 설정
│   │   ├── routes/
│   │   │   ├── moodle.routes.ts         # Moodle 관련 엔드포인트
│   │   │   └── melody.routes.ts         # 음악 생성 엔드포인트
│   │   ├── controllers/
│   │   │   ├── moodle.controller.ts
│   │   │   └── melody.controller.ts
│   │   ├── services/
│   │   │   ├── moodle.service.ts        # Moodle 데이터 조회
│   │   │   ├── question.parser.ts       # 문제 파싱
│   │   │   └── term.analyzer.ts         # 항 변화 분석
│   │   ├── models/
│   │   │   ├── Question.ts
│   │   │   └── Term.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # 인증 (선택)
│   │   │   └── error.middleware.ts      # 에러 핸들링
│   │   ├── utils/
│   │   │   └── logger.ts                # 로깅
│   │   └── server.ts                    # Express 서버 진입점
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docker/                        # Docker 설정 (선택)
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── docs/                          # 문서
│   ├── API.md                           # API 명세
│   ├── DEPLOYMENT.md                    # 배포 가이드
│   └── DEVELOPMENT.md                   # 개발 가이드
│
├── .gitignore
├── README.md
└── TERM_MELODY_ARCHITECTURE.md          # 이 문서
```

## 핵심 기능

### 1. Moodle LMS 연동
- Moodle 데이터베이스에서 문제 정보 조회 (READ-ONLY)
- 문제 유형별 필터링 (객관식, 주관식, 계산 문제)
- 실시간 데이터 동기화

### 2. 항(Term) 변화 분석
- 수학 표현식 파싱 (예: `3x + 2` → `[3, x, +, 2]`)
- 항의 계수, 변수, 연산자 추출
- 변화 패턴 감지 (증가, 감소, 진동)

### 3. 음악 생성 알고리즘
**기본 매핑 규칙:**
- 계수 크기 → 음높이 (0-10 → C4-C5)
- 계수 부호 → 음색 (양수: 밝은 음, 음수: 어두운 음)
- 변수 존재 → 하모니 추가
- 연산자 → 리듬 패턴
  - `+` → 상승 멜로디
  - `-` → 하강 멜로디
  - `*` → 화음
  - `/` → 분산화음

**예시:**
```
문제: x + 2 = 5, x - 1 = 4, 2x = 6
변화: [x+2] → [x-1] → [2x]

음악 변환:
1. x+2: E4(변수) + G4(+연산) + F4(계수2)
2. x-1: E4(변수) + D4(-연산) + C4(계수1)
3. 2x:  F4(계수2) + E4(변수) [옥타브↑]
```

### 4. 가상 스마트폰 UI
- CSS로 스마트폰 프레임 구현 (아이폰 스타일)
- 반응형 화면 크기: 375×812px (iPhone X 기준)
- 터치 인터랙션 시뮬레이션
- 스크롤 및 제스처 애니메이션

## API 엔드포인트 명세

### Moodle 관련

#### `GET /api/moodle/questions`
문제 목록 조회

**Query Parameters:**
- `category` (optional): 문제 카테고리 ID
- `type` (optional): 문제 유형 (multichoice, shortanswer, numerical)
- `limit` (optional): 결과 개수 (기본: 20)
- `offset` (optional): 페이지네이션 오프셋

**Response:**
```json
{
  "questions": [
    {
      "id": 123,
      "name": "일차방정식 풀이",
      "questiontext": "x + 3 = 7을 만족하는 x의 값은?",
      "qtype": "numerical",
      "category": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1
}
```

#### `GET /api/moodle/question/:id`
특정 문제 상세 조회

**Response:**
```json
{
  "id": 123,
  "name": "일차방정식 풀이",
  "questiontext": "다음 방정식을 푸시오: x + 3 = 7",
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
    { "coefficient": 1, "variable": "x", "operator": "+", "constant": 3 }
  ]
}
```

### 음악 생성 관련

#### `POST /api/melody/generate`
항 변화를 음악 데이터로 변환

**Request Body:**
```json
{
  "questionId": 123,
  "terms": [
    { "coefficient": 1, "variable": "x", "constant": 3 },
    { "coefficient": 1, "variable": "x", "constant": 5 },
    { "coefficient": 2, "variable": "x", "constant": 1 }
  ],
  "options": {
    "tempo": 120,
    "scale": "major",
    "baseNote": "C4"
  }
}
```

**Response:**
```json
{
  "melody": {
    "notes": [
      { "note": "E4", "duration": "4n", "time": 0 },
      { "note": "G4", "duration": "4n", "time": 0.5 },
      { "note": "F4", "duration": "4n", "time": 1.0 }
    ],
    "tempo": 120,
    "timeSignature": "4/4"
  },
  "visualization": {
    "termChanges": [
      { "from": "x+3", "to": "x+5", "direction": "up" },
      { "from": "x+5", "to": "2x+1", "direction": "transform" }
    ]
  }
}
```

#### `POST /api/melody/analyze`
항 변화 패턴 분석

**Request Body:**
```json
{
  "expressions": ["x+2", "x-1", "2x", "2x+3"]
}
```

**Response:**
```json
{
  "patterns": [
    {
      "type": "constant_change",
      "description": "상수항이 +2 → -1로 변화 (감소 패턴)",
      "musicalMapping": "하강 멜로디"
    },
    {
      "type": "coefficient_change",
      "description": "계수가 1 → 2로 증가",
      "musicalMapping": "옥타브 상승"
    }
  ],
  "complexity": "medium",
  "suggestedTempo": 110
}
```

## Moodle 데이터베이스 스키마 (참고)

### 주요 테이블

```sql
-- 문제 정보
mdl_question (
  id BIGINT PRIMARY KEY,
  category BIGINT,
  name VARCHAR(255),
  questiontext LONGTEXT,
  qtype VARCHAR(20),
  createdby BIGINT,
  timecreated BIGINT,
  timemodified BIGINT
)

-- 문제 답안
mdl_question_answers (
  id BIGINT PRIMARY KEY,
  question BIGINT,
  answer TEXT,
  answerformat TINYINT,
  fraction DECIMAL(12,7),
  feedback TEXT
)

-- 퀴즈 정보
mdl_quiz (
  id BIGINT PRIMARY KEY,
  course BIGINT,
  name VARCHAR(255),
  timeopen BIGINT,
  timeclose BIGINT
)

-- 학생 응답
mdl_quiz_attempts (
  id BIGINT PRIMARY KEY,
  quiz BIGINT,
  userid BIGINT,
  attempt MEDIUMINT,
  timestart BIGINT,
  timefinish BIGINT,
  state VARCHAR(16)
)
```

## 개발 단계별 계획

### Phase 1: 기본 구조 설정 (1-2일)
- [x] 프로젝트 디렉토리 생성
- [ ] React + Vite 프론트엔드 초기화
- [ ] Node.js + Express 백엔드 초기화
- [ ] TypeScript 설정
- [ ] ESLint + Prettier 설정

### Phase 2: Moodle 연동 (2-3일)
- [ ] MySQL 연결 설정
- [ ] Moodle 문제 조회 API 구현
- [ ] 데이터 파싱 로직
- [ ] API 테스트

### Phase 3: 가상 스마트폰 UI (2-3일)
- [ ] PhoneFrame 컴포넌트 (CSS)
- [ ] PhoneScreen 컴포넌트
- [ ] 반응형 레이아웃
- [ ] 우측 하단 고정 위치

### Phase 4: 음악 생성 엔진 (3-4일)
- [ ] Web Audio API 기본 설정
- [ ] Tone.js 통합
- [ ] 항 → 음표 매핑 알고리즘
- [ ] 멜로디 재생 기능

### Phase 5: 항 변화 분석 (2-3일)
- [ ] 수학 표현식 파서
- [ ] 항 추출 알고리즘
- [ ] 변화 패턴 감지
- [ ] 시각화 컴포넌트

### Phase 6: 통합 및 테스트 (2-3일)
- [ ] 전체 플로우 통합
- [ ] 단위 테스트 작성
- [ ] E2E 테스트
- [ ] 성능 최적화

### Phase 7: 배포 및 문서화 (1-2일)
- [ ] Docker 설정
- [ ] 배포 스크립트
- [ ] API 문서 작성
- [ ] 사용자 가이드

## 환경 설정

### 백엔드 (.env)
```env
# MySQL (Moodle Database)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

### 프론트엔드 (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

## 보안 고려사항

1. **데이터베이스 접근**: READ-ONLY 권한만 사용
2. **SQL Injection 방지**: Prepared Statements 사용
3. **CORS 설정**: 허용된 도메인만 접근
4. **환경 변수**: 민감 정보는 .env에 저장 (Git 제외)
5. **입력 검증**: 모든 사용자 입력 검증 및 샌타이징

## 성능 최적화

1. **데이터베이스 쿼리**: 인덱스 활용 및 쿼리 최적화
2. **캐싱**: 자주 조회되는 문제는 메모리 캐싱 (Redis 선택사항)
3. **번들 크기**: Code Splitting 및 Lazy Loading
4. **오디오 로딩**: 필요 시에만 오디오 컨텍스트 초기화
5. **웹소켓**: 실시간 업데이트가 필요한 경우에만 사용

## 향후 확장 계획

- **Phase 2**: 모바일 네이티브 앱 (React Native)
- **Phase 3**: AI 기반 항 변화 예측 및 추천
- **Phase 4**: 다양한 음악 스타일 지원 (클래식, 재즈, 전자음악)
- **Phase 5**: 학생 학습 패턴 분석 및 개인화
- **Phase 6**: Moodle 플러그인으로 통합

## 참고 자료

- [Moodle Database Schema](https://docs.moodle.org/dev/Database_Schema)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js Documentation](https://tonejs.github.io/)
- [React + TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)

---

**작성일**: 2025-11-18
**버전**: 1.0.0
**상태**: 설계 완료, 구현 시작 준비
