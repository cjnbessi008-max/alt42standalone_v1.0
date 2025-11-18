# LMS Problem Tracker with Reasoning Structure

오늘 푼 문제들을 AI 추론 구조와 함께 정리하는 독립형 웹 애플리케이션

## 시스템 개요

Moodle LMS와 연동하여 학생들이 오늘 해결한 문제를 수집하고, Claude AI를 활용해 각 문제의 추론 구조를 분석하여 시각화하는 시스템입니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js 18+ + Express
- **Database**: MySQL 5.7
- **AI**: Anthropic Claude API
- **LMS**: Moodle 3.7 (PHP 7.1.9)
- **Deployment**: Docker + Docker Compose

## 주요 기능

### 1. Moodle 연동
- Moodle Web Services API를 통한 퀴즈/문제 데이터 조회
- 학생별 오늘 푼 문제 목록 수집
- 문제 상세 정보 및 답안 분석

### 2. AI 추론 구조 생성
- Claude API를 활용한 문제 분석
- 문제 해결에 필요한 개념 추출
- 단계별 추론 과정 재구성
- 오답 패턴 분석 및 피드백 생성

### 3. 시각화 대시보드
- 오늘 푼 문제 타임라인
- 개념별 문제 분류
- 추론 구조 트리 다이어그램
- 학습 진도 및 강약점 분석

## 프로젝트 구조

```
.
├── backend/              # Node.js API 서버
│   ├── src/
│   │   ├── config/       # 설정 파일
│   │   ├── services/     # 비즈니스 로직
│   │   ├── models/       # 데이터 모델
│   │   ├── routes/       # API 라우트
│   │   └── utils/        # 유틸리티
│   └── package.json
├── frontend/             # React 웹 앱
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지
│   │   ├── services/     # API 클라이언트
│   │   └── types/        # TypeScript 타입
│   └── package.json
├── database/             # 데이터베이스 스키마
│   └── schema.sql
├── docker-compose.yml    # Docker 설정
└── docs/                 # 문서

```

## 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발시)
- Moodle 3.7+ 인스턴스 (Web Services 활성화)
- Anthropic API Key

### 설치 및 실행

1. **환경 변수 설정**
```bash
cp backend/.env.example backend/.env
# .env 파일을 편집하여 Moodle 및 Claude API 정보 입력
```

2. **Docker로 실행**
```bash
docker-compose up -d
```

3. **브라우저에서 접속**
```
http://localhost:3000
```

## 환경 변수

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=lms_tracker
DB_USER=root
DB_PASSWORD=your_password

# Moodle API
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token

# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# CORS
CORS_ORIGIN=http://localhost:3000
```

## API 엔드포인트

### 문제 조회
```http
GET /api/problems/today?studentId={id}
```

### 추론 구조 생성
```http
POST /api/reasoning/analyze
Content-Type: application/json

{
  "problemId": "123",
  "studentAnswer": "...",
  "correctAnswer": "..."
}
```

### 학습 패턴 분석
```http
GET /api/analytics/patterns?studentId={id}&date={YYYY-MM-DD}
```

## 추론 구조 예시

```json
{
  "problemId": "123",
  "question": "2/3 + 1/4 = ?",
  "concepts": [
    "분수의 덧셈",
    "통분",
    "최소공배수"
  ],
  "reasoningSteps": [
    {
      "step": 1,
      "description": "분모를 통일하기 위해 최소공배수 찾기",
      "concept": "최소공배수",
      "formula": "LCM(3, 4) = 12"
    },
    {
      "step": 2,
      "description": "각 분수를 통분",
      "concept": "통분",
      "calculation": "2/3 = 8/12, 1/4 = 3/12"
    },
    {
      "step": 3,
      "description": "분자끼리 더하기",
      "concept": "분수의 덧셈",
      "calculation": "8/12 + 3/12 = 11/12"
    }
  ],
  "studentApproach": {
    "correct": true,
    "steps": [...],
    "insights": "학생이 올바른 순서로 문제를 해결했습니다."
  },
  "relatedConcepts": [
    "기약분수",
    "분수의 뺄셈",
    "분수와 소수의 관계"
  ]
}
```

## 개발

### 로컬 개발 환경

**백엔드**:
```bash
cd backend
npm install
npm run dev
```

**프론트엔드**:
```bash
cd frontend
npm install
npm run dev
```

### 데이터베이스 마이그레이션

```bash
docker-compose exec mysql mysql -u root -p lms_tracker < database/schema.sql
```

## Moodle 설정

### Web Services 활성화

1. **관리 > 사이트 관리 > 고급 기능**
   - "웹 서비스 사용" 체크

2. **외부 서비스 생성**
   - 관리 > 사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스
   - 새 서비스 추가: "LMS Problem Tracker"

3. **필요한 함수 추가**
   - `core_course_get_courses`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`
   - `core_question_get_question_data`
   - `core_user_get_users`

4. **토큰 생성**
   - 관리 > 사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
   - 사용자 및 서비스 선택하여 토큰 생성

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트 환영합니다.
