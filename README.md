# AI 교육 시스템 - "살짝만 더 해보자" 연습 모드

LMS와 연동된 적응형 학습 시스템으로, 학생들이 마스터리에 근접했을 때 추가 연습을 제공하는 기능을 구현합니다.

## 🎯 프로젝트 개요

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템 파이프라인의 일부로, 학생들의 학습 진행 상황을 실시간으로 추적하고 적응형 난이도 조정을 통해 효과적인 학습을 지원합니다.

### 핵심 기능

- **적응형 난이도 조정**: 학생의 정확도에 따라 문제 난이도 자동 조정
- **"살짝만 더 해보자" 모드**: 정확도 75-95% 구간에서 추가 연습 제안
- **실시간 진행 상황 추적**: WebSocket을 통한 실시간 업데이트
- **LMS 연동**: KAIST LMS와 SSO 및 성적 동기화
- **힌트 시스템**: 학습자를 위한 단계별 힌트 제공

## 🏗️ 아키텍처

```
Frontend (React 18)
    ↓ REST API / WebSocket
Backend (Node.js + Express)
    ↓
Services Layer
    ├─ Practice Service
    ├─ Rule Engine (적응형 로직)
    └─ LMS Integration
    ↓
Database (PostgreSQL)
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                      # Node.js 백엔드
│   ├── src/
│   │   ├── config/              # 데이터베이스 설정
│   │   ├── controllers/         # API 컨트롤러
│   │   ├── middleware/          # 인증, 에러 핸들링
│   │   ├── routes/              # API 라우트
│   │   ├── services/            # 비즈니스 로직
│   │   │   ├── practiceService.js
│   │   │   ├── ruleEngine.js
│   │   │   └── lmsIntegration.js
│   │   └── server.js            # 서버 진입점
│   ├── database/
│   │   ├── migrations/          # DB 마이그레이션
│   │   └── seeds/               # 시드 데이터
│   └── package.json
│
├── frontend/                     # React 프론트엔드
│   ├── src/
│   │   ├── components/          # React 컴포넌트
│   │   │   ├── PracticeProgressIndicator.jsx
│   │   │   ├── ProblemDisplay.jsx
│   │   │   ├── AnswerInputForm.jsx
│   │   │   ├── FeedbackDisplay.jsx
│   │   │   └── PracticeMoreModal.jsx
│   │   ├── pages/
│   │   │   └── StudentPracticeView.jsx
│   │   ├── services/            # API 클라이언트
│   │   ├── store/               # Redux 상태 관리
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── tasks/                        # 프로젝트 문서
│   ├── README.md
│   ├── 0001-prd-ai-education-pipeline.md
│   ├── 0002-codebase-structure-analysis.md
│   ├── 0003-prd-key-references.md
│   └── 0004-practice-mode-implementation-checklist.md
│
└── README.md                     # 이 파일
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (WebSocket 세션 관리)
- npm 또는 yarn

### 설치

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **백엔드 설정**
```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 LMS 정보 입력
```

3. **데이터베이스 마이그레이션**
```bash
# PostgreSQL에 데이터베이스 생성
psql -U postgres -c "CREATE DATABASE ai_education;"

# 마이그레이션 실행
psql -U postgres -d ai_education -f database/migrations/002_create_practice_mode_tables.sql
```

4. **프론트엔드 설정**
```bash
cd ../frontend
npm install

# 환경 변수 설정 (선택사항)
# .env 파일 생성하여 API URL 설정
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
echo "REACT_APP_SOCKET_URL=http://localhost:3000" >> .env
```

### 실행

**개발 모드로 실행:**

터미널 1 - 백엔드:
```bash
cd backend
npm run dev
```

터미널 2 - 프론트엔드:
```bash
cd frontend
npm start
```

프론트엔드는 `http://localhost:3001`에서 실행됩니다.
백엔드 API는 `http://localhost:3000`에서 실행됩니다.

## 🔑 주요 API 엔드포인트

### Practice API

- `GET /api/practice/modules/:moduleId/next-problem` - 다음 문제 가져오기
- `POST /api/practice/modules/:moduleId/submit-answer` - 답안 제출
- `GET /api/practice/modules/:moduleId/practice-suggestion` - 연습 제안 받기
- `POST /api/practice/modules/:moduleId/practice-more` - "살짝만 더" 시작
- `POST /api/practice/modules/:moduleId/request-hint` - 힌트 요청

### Progress API

- `GET /api/progress/modules/:moduleId` - 진행 상황 조회
- `GET /api/progress/modules/:moduleId/history` - 연습 기록 조회
- `GET /api/progress/modules/:moduleId/mastery` - 마스터리 기준 조회

## 🧠 "살짝만 더 해보자" 로직

### 트리거 조건

시스템은 다음 조건에서 "살짝만 더 해보자" 모달을 표시합니다:

- 정확도: **75% ~ 95%** 사이
- 마스터리 레벨: `mastery` 미만
- 최소 시도 횟수: 3회 이상

### 적응형 난이도

```javascript
정확도 >= 95% → 난이도 5 (최고)
정확도 >= 85% → 난이도 4
정확도 >= 70% → 난이도 3
정확도 >= 50% → 난이도 2
정확도 < 50%  → 난이도 1 (기본)
```

### 제안 문제 개수

```javascript
제안 개수 = Math.ceil((100 - 현재정확도) / 10)
최대 5개까지
```

예: 정확도 82% → 2개 문제 제안

## 🔗 LMS 연동

### 지원 기능

1. **SSO 인증**: KAIST LMS OAuth2/SAML 연동
2. **진행 상황 동기화**: 학생 진행 상황 LMS로 전송
3. **성적 내보내기**: 마스터리 달성 시 LMS 성적표에 반영
4. **수강 확인**: 학생의 모듈 등록 상태 확인

### 설정

`.env` 파일에서 LMS 연동 설정:

```env
LMS_API_URL=https://lms.kaist.ac.kr/api
LMS_API_KEY=your_api_key_here
LMS_SSO_ENABLED=true
LMS_SSO_TYPE=oauth2
```

개발 환경에서 LMS 없이 테스트하려면:
```env
LMS_SSO_ENABLED=false
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **student_progress** - 학생별 모듈 진행 상황
2. **problem_attempt** - 개별 문제 시도 기록
3. **mastery_metrics** - 마스터리 달성 기준
4. **practice_trigger_rules** - 연습 제안 규칙
5. **problem_bank** - 문제 템플릿 저장소

상세한 스키마는 `backend/database/migrations/002_create_practice_mode_tables.sql` 참조.

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 📦 배포

### Docker를 사용한 배포

```bash
# Docker 이미지 빌드
docker-compose build

# 컨테이너 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 프로덕션 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 빌드된 파일은 frontend/build에 생성됩니다
```

## 🛠️ 기술 스택

### 백엔드
- **Node.js** 18+
- **Express** 4.x - REST API
- **PostgreSQL** 15+ - 메인 데이터베이스
- **Redis** 7+ - 세션 및 캐싱
- **Socket.io** - 실시간 통신
- **JWT** - 인증

### 프론트엔드
- **React** 18
- **Redux Toolkit** - 상태 관리
- **React Router** 6 - 라우팅
- **Axios** - HTTP 클라이언트
- **Socket.io-client** - WebSocket

## 📚 추가 문서

- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md)
- [코드베이스 구조 분석](tasks/0002-codebase-structure-analysis.md)
- [구현 체크리스트](tasks/0004-practice-mode-implementation-checklist.md)

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 내부 프로젝트입니다.

## 📄 라이선스

MIT License

## 👥 개발팀

- **AI 교육 시스템 팀** - KAIST Touch Math Academy

## 📞 지원

문의사항이 있으시면 개발팀에 연락해주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
