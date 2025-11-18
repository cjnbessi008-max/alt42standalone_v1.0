# Alt42 설치 및 실행 가이드

## 필수 요구사항

### 시스템 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Moodle 3.7 (PHP 7.1.9, MySQL 5.7)
- Claude API 키 (Anthropic)

### Moodle 설정

#### 1. Moodle Web Services 활성화

1. **관리자로 로그인** → `사이트 관리` → `고급 기능`
2. **"웹 서비스 사용"** 체크박스 활성화
3. 저장

#### 2. Web Service 프로토콜 활성화

1. `사이트 관리` → `플러그인` → `웹 서비스` → `프로토콜 관리`
2. **REST 프로토콜** 활성화

#### 3. 외부 서비스 생성

1. `사이트 관리` → `플러그인` → `웹 서비스` → `외부 서비스`
2. "새 외부 서비스 추가" 클릭
3. 서비스 설정:
   - 이름: `Alt42 Integration`
   - 짧은 이름: `alt42`
   - 활성화됨: 체크
   - 승인된 사용자만: 체크 해제

#### 4. 함수 추가

서비스에 다음 함수들을 추가:
- `core_webservice_get_site_info`
- `core_question_get_questions`
- `mod_quiz_get_quiz_questions`
- `mod_quiz_get_quizzes_by_courses`

#### 5. 토큰 생성

1. `사이트 관리` → `플러그인` → `웹 서비스` → `토큰 관리`
2. "토큰 추가" 클릭
3. 설정:
   - 사용자: 관리자 또는 적절한 권한을 가진 사용자
   - 서비스: `Alt42 Integration`
4. 생성된 토큰 복사 (나중에 사용)

## 백엔드 설정

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Moodle Configuration
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here

# MySQL Configuration (선택사항 - 직접 DB 접근 시)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password

# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. 백엔드 실행

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 4. 연결 테스트

브라우저 또는 curl로 테스트:

```bash
# 서버 헬스 체크
curl http://localhost:3001/health

# Moodle 연결 테스트
curl http://localhost:3001/api/moodle/test

# AI 서비스 테스트
curl http://localhost:3001/api/summary/test
```

## 프론트엔드 설정

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
VITE_API_URL=http://localhost:3001
```

### 3. 프론트엔드 실행

```bash
npm run dev
```

앱이 `http://localhost:5173`에서 실행됩니다.

## 사용 방법

### 1. Moodle 문제 ID로 불러오기

1. 웹 브라우저에서 `http://localhost:5173` 접속
2. "문제 ID 입력" 필드에 Moodle 문제 ID 입력 (예: 123)
3. "문제 불러오기" 클릭
4. 우측 하단 가상 스마트폰에 문제와 AI 요약이 표시됨

### 2. 직접 입력한 문제 요약

1. "직접 입력한 문제 요약하기" 섹션으로 이동
2. 텍스트 영역에 문제 내용 입력
   - LaTeX 수식 사용 가능: `$x^2 + y^2 = r^2$`
3. "AI 요약 생성" 클릭
4. 3줄 요약이 생성되어 표시됨

## API 엔드포인트

### Moodle 연동

- `GET /api/moodle/test` - Moodle 연결 테스트
- `GET /api/moodle/question/:id` - 문제 가져오기
- `GET /api/moodle/quiz/:id/questions` - 퀴즈의 모든 문제 가져오기

### AI 요약

- `GET /api/summary/test` - AI 서비스 테스트
- `GET /api/summary/question/:id` - 문제 + AI 요약 함께 가져오기
- `POST /api/summary/generate` - 사용자 정의 텍스트 요약 생성

## 문제 해결

### Moodle 연결 실패

1. Moodle URL이 올바른지 확인 (https:// 포함)
2. 토큰이 정확한지 확인
3. Moodle Web Services가 활성화되었는지 확인
4. 방화벽/CORS 설정 확인

### AI 요약 생성 실패

1. Anthropic API 키가 유효한지 확인
2. API 사용 한도 확인
3. 네트워크 연결 확인

### 가상 스마트폰 화면이 보이지 않음

1. 브라우저 확대/축소 비율 확인 (100% 권장)
2. 화면 해상도 확인 (최소 1280x800)
3. 브라우저 콘솔에서 에러 확인

## 프로덕션 배포

### 백엔드 빌드

```bash
cd backend
npm run build
npm start
```

### 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist` 폴더에 생성됩니다.

## 라이선스

MIT
