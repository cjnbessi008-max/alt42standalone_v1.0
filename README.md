# LMS 검산 체크포인트 시스템

LMS(Learning Management System)와 연동하여 학생들이 문제를 풀고 제출하기 전에 자동으로 검증하는 독립형 웹 애플리케이션입니다.

## 📋 주요 기능

### 🎯 검산 체크포인트
학생이 답안을 LMS에 제출하기 전에 다층 검증을 수행합니다:

1. **형식 검증 (Format Validation)**
   - 답안이 올바른 형식인지 확인
   - 필수 필드 누락 검사
   - 데이터 타입 검증

2. **범위 검증 (Range Validation)**
   - 숫자 답안의 범위 확인
   - 최소/최대값 검증

3. **로직 검증 (Logic Validation)**
   - 문제 유형별 특화 검증
   - 이차방정식: 해가 실제로 방정식을 만족하는지 확인
   - 피타고라스 정리: a² + b² = c² 검증
   - 연립방정식: 두 식을 모두 만족하는지 확인

4. **계산 검증 (Calculation Validation)**
   - 최종 답안의 정확도 확인
   - 허용 오차 범위 내 검증

### 💡 실시간 피드백
- 검증 결과를 즉시 확인
- 오류가 있을 경우 구체적인 피드백 제공
- 개선을 위한 힌트 제시
- 예상 점수 미리보기

### 📊 LMS 연동
- 검증 통과 후 LMS에 제출
- Mock LMS 또는 실제 LMS API 연동 가능
- 제출 이력 및 동기화 상태 추적

## 🏗️ 기술 스택

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios

### Database
- **SQLite**: 경량 임베디드 데이터베이스
- **Schema**: 문제, 학생, 제출, 검증, LMS 동기화

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                # 백엔드 API 서버
│   ├── src/
│   │   ├── config/        # 설정 (데이터베이스, 로거)
│   │   ├── controllers/   # API 컨트롤러
│   │   ├── middleware/    # 미들웨어 (에러 핸들링, 로깅)
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직 (검증 서비스)
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── server.ts      # 서버 진입점
│   ├── package.json
│   ├── tsconfig.json
│   └── .env               # 환경 변수
│
├── frontend/              # 프론트엔드 웹앱
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입
│   │   ├── utils/         # 유틸리티 함수
│   │   ├── App.tsx        # 메인 앱
│   │   └── main.tsx       # 진입점
│   ├── package.json
│   ├── vite.config.ts
│   └── .env               # 환경 변수
│
├── database/              # 데이터베이스
│   ├── schema.sql         # 스키마 정의
│   └── lms_checkpoint.db  # SQLite DB (자동 생성)
│
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md             # 이 파일
```

## 🚀 시작하기

### 사전 요구사항
- Node.js 20.x 이상
- npm 또는 yarn

### 설치

1. **저장소 클론 및 이동**
```bash
cd alt42standalone_v1.0
```

2. **백엔드 설정**
```bash
cd backend
npm install
cp .env.example .env
```

3. **프론트엔드 설정**
```bash
cd ../frontend
npm install
cp .env.example .env
```

### 실행

**터미널 1 - 백엔드 서버**
```bash
cd backend
npm run dev
```
서버가 http://localhost:3001 에서 실행됩니다.

**터미널 2 - 프론트엔드 앱**
```bash
cd frontend
npm run dev
```
앱이 http://localhost:3000 에서 실행됩니다.

### 빌드

**백엔드 프로덕션 빌드**
```bash
cd backend
npm run build
npm start
```

**프론트엔드 프로덕션 빌드**
```bash
cd frontend
npm run build
npm run preview
```

## 📖 사용 방법

### 1. 문제 목록 보기
- 홈 화면에서 사용 가능한 모든 문제를 확인
- 난이도별 필터링 (쉬움, 보통, 어려움)
- 문제 유형, 점수, 최대 시도 횟수 확인

### 2. 문제 풀기
- "문제 풀기" 버튼 클릭
- 문제 설명 및 힌트 확인
- 답안 입력:
  - **이차방정식**: 쉼표로 구분하여 입력 (예: 2, 3)
  - **연립방정식**: x와 y 값을 각각 입력
  - **피타고라스**: 단일 숫자 입력

### 3. 검산 체크포인트 실행
- "검산 체크포인트 실행" 버튼 클릭
- 자동으로 4가지 검증 수행:
  1. 형식 검증
  2. 범위 검증
  3. 로직 검증
  4. 계산 검증
- 각 검증의 통과/실패 상태 확인
- 실패한 경우 상세 피드백 및 힌트 확인
- 예상 점수 미리보기

### 4. LMS에 제출
- 검증을 모두 통과하면 "LMS에 제출" 버튼 활성화
- 제출 확인 대화상자에서 최종 확인
- 제출 완료 후 결과 확인

### 5. 다시 풀기
- 검증 실패 시 "다시 풀기" 버튼으로 재시도
- 최대 시도 횟수 제한 확인

## 🔌 API 엔드포인트

### 문제 API
```
GET  /api/problems              # 모든 문제 조회
GET  /api/problems/:id          # 특정 문제 조회
GET  /api/problems?difficulty=easy  # 난이도별 조회
```

### 제출 API
```
POST /api/submissions           # 제출 생성
GET  /api/submissions/:id       # 제출 조회
GET  /api/students/:id/submissions  # 학생별 제출 내역
```

### 검증 API
```
POST /api/checkpoint/validate   # 체크포인트 검증
```

### LMS API
```
POST /api/lms/submit            # LMS에 제출
GET  /api/lms/sync/:submissionId  # 동기화 상태 조회
POST /api/lms/sync/:syncId/retry  # 동기화 재시도
```

## 🛠️ 설정

### 백엔드 환경 변수 (.env)
```env
PORT=3001                          # 서버 포트
NODE_ENV=development               # 환경 (development/production)
CORS_ORIGIN=http://localhost:3000  # CORS 허용 도메인
DB_PATH=../database/lms_checkpoint.db  # 데이터베이스 경로
RATE_LIMIT_WINDOW_MS=900000        # Rate limit 시간 (15분)
RATE_LIMIT_MAX_REQUESTS=100        # Rate limit 최대 요청 수
LMS_ENABLED=false                  # 실제 LMS 연동 여부
LMS_API_URL=http://localhost:3002/api  # LMS API URL
LMS_API_KEY=test_api_key          # LMS API 키
LOG_LEVEL=info                     # 로그 레벨
```

### 프론트엔드 환경 변수 (.env)
```env
VITE_API_URL=http://localhost:3001/api  # 백엔드 API URL
VITE_APP_NAME=LMS Checkpoint System     # 앱 이름
```

## 📊 데이터베이스 스키마

### 주요 테이블

**problems** - 문제 정의
- id, title, description, problem_type, difficulty
- correct_answer, validation_rules, hints
- max_attempts, time_limit_seconds, points

**students** - 학생 정보
- id, name, email, student_number

**submissions** - 제출 내역
- id, student_id, problem_id, answer
- status (pending/validated/submitted/graded)
- score, feedback, attempt_number, time_spent_seconds

**checkpoint_validations** - 검증 결과
- id, submission_id, validation_type
- passed, error_message, warning_message, suggestions

**lms_sync** - LMS 동기화
- id, submission_id, lms_submission_id
- sync_status (pending/synced/failed)
- sync_attempts, error_log

## 🎓 샘플 문제

시스템에는 기본적으로 3개의 샘플 문제가 포함되어 있습니다:

1. **이차방정식 풀이** (쉬움, 100점)
   - x² - 5x + 6 = 0
   - 정답: [2, 3]

2. **피타고라스 정리** (쉬움, 100점)
   - 밑변 = 3, 높이 = 4, 빗변 = ?
   - 정답: 5

3. **연립방정식 풀이** (보통, 150점)
   - 2x + y = 10, x - y = 2
   - 정답: x = 4, y = 2

## 🔐 보안

- **Helmet**: HTTP 헤더 보안 강화
- **CORS**: Cross-Origin Resource Sharing 설정
- **Rate Limiting**: API 요청 속도 제한
- **Input Validation**: Joi를 사용한 입력 검증
- **SQL Injection 방지**: Prepared statements 사용

## 🚧 향후 개선 사항

- [ ] 실제 LMS API 연동 (Moodle, Canvas 등)
- [ ] 사용자 인증 및 권한 관리
- [ ] 교사용 대시보드 (문제 생성, 학생 진도 관리)
- [ ] 코드 문제 타입 지원 (코드 실행 및 테스트)
- [ ] 실시간 협업 기능
- [ ] 모바일 앱 지원
- [ ] 고급 분석 및 리포팅
- [ ] AI 기반 힌트 생성
- [ ] 다국어 지원

## 📝 라이선스

MIT License

## 👥 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 📞 지원

문제가 발생하면 GitHub Issues를 통해 문의해주세요.

---

**Made with ❤️ for better education**
