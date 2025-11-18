# LMS 문제 요약기 (LMS Problem Summarizer)

AI 기반 교육 문제 자동 요약 시스템 - Claude API를 활용하여 교육용 문제를 핵심 3줄로 압축합니다.

## 📋 프로젝트 개요

LMS(Learning Management System)와 연동하여 복잡한 교육 문제를 AI가 자동으로 분석하고, 학생들이 이해하기 쉬운 핵심 3줄로 요약하는 웹 애플리케이션입니다.

### 주요 기능

- ✅ **AI 기반 자동 요약**: Claude API를 사용하여 문제의 핵심 조건을 정확히 3줄로 압축
- 🔗 **LMS 연동**: 기존 LMS 시스템에서 문제 ID로 직접 조회 및 요약
- 🌐 **다국어 지원**: 한국어/영어 요약 지원
- 💾 **요약 저장**: LMS에 요약 결과 자동 저장 옵션
- 📊 **배치 처리**: 여러 문제를 한 번에 요약
- 🎨 **직관적 UI**: Material-UI 기반의 사용자 친화적 인터페이스

## 🏗️ 기술 스택

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI**: Anthropic Claude API (Sonnet 4.5)
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **HTTP Client**: Axios

### DevOps
- **Container**: Docker + Docker Compose
- **Development**: Nodemon, Hot Reload

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # 백엔드 API 서버
│   ├── src/
│   │   ├── controllers/    # 요청 처리 로직
│   │   ├── services/       # 비즈니스 로직 (Claude API, LMS 연동)
│   │   ├── routes/         # API 라우팅
│   │   └── app.js          # Express 애플리케이션
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/               # 프론트엔드 웹앱
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── services/      # API 클라이언트
│   │   ├── types/         # TypeScript 타입 정의
│   │   ├── App.tsx        # 메인 애플리케이션
│   │   └── main.tsx       # 엔트리 포인트
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Anthropic API Key ([발급받기](https://console.anthropic.com/))

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

백엔드 디렉토리에 `.env` 파일 생성:

```bash
cd backend
cp .env.example .env
```

`.env` 파일 수정:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# LMS 연동 (선택사항)
LMS_API_URL=
LMS_API_KEY=
```

### 3. 의존성 설치 및 실행

#### Option A: 로컬 개발 환경

**백엔드 실행:**
```bash
cd backend
npm install
npm run dev
```

**프론트엔드 실행** (새 터미널):
```bash
cd frontend
npm install
npm run dev
```

#### Option B: Docker Compose

```bash
# 프로젝트 루트에서
docker-compose up --build
```

### 4. 애플리케이션 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:3001
- **API 문서**: http://localhost:3001/api/health

## 📡 API 엔드포인트

### 1. 헬스 체크
```http
GET /api/health
```

### 2. 직접 텍스트 요약
```http
POST /api/summarize
Content-Type: application/json

{
  "problemText": "문제 내용...",
  "language": "ko"
}
```

### 3. LMS 문제 ID로 요약
```http
POST /api/summarize/lms
Content-Type: application/json

{
  "problemId": "prob_001",
  "language": "ko",
  "saveSummary": false
}
```

### 4. 배치 요약
```http
POST /api/summarize/batch
Content-Type: application/json

{
  "problems": [
    {"id": "1", "text": "문제1..."},
    {"id": "2", "text": "문제2..."}
  ],
  "language": "ko"
}
```

### 5. 모듈 전체 요약
```http
POST /api/summarize/module
Content-Type: application/json

{
  "moduleId": "module_001",
  "language": "ko"
}
```

## 💡 사용 예시

### 1. 직접 입력 모드

1. 웹 애플리케이션 접속
2. "직접 입력" 탭 선택
3. 요약할 문제 텍스트 입력
4. 언어 선택 (한국어/영어)
5. "요약하기" 버튼 클릭
6. AI가 생성한 핵심 3줄 확인

### 2. LMS 연동 모드

1. "LMS 연동" 탭 선택
2. 문제 ID 입력 (예: `prob_001`)
3. 샘플 버튼으로 테스트 가능
4. "LMS에 요약 저장" 옵션 선택 (선택사항)
5. "LMS에서 검색" 버튼 클릭
6. 문제 정보와 함께 핵심 3줄 확인

## 🔧 개발 가이드

### 백엔드 개발

```bash
cd backend
npm run dev  # nodemon으로 자동 재시작
```

### 프론트엔드 개발

```bash
cd frontend
npm run dev  # Vite HMR 활성화
```

### 빌드

**프론트엔드 프로덕션 빌드:**
```bash
cd frontend
npm run build
npm run preview  # 빌드 결과 미리보기
```

## 🧪 테스트

### 샘플 문제 데이터

LMS API가 설정되지 않은 경우, 시스템은 자동으로 모의(mock) 데이터를 사용합니다:

- `prob_001`: 분수의 덧셈 문제
- `prob_002`: 도형의 넓이 문제

### API 테스트 (curl)

```bash
# 헬스 체크
curl http://localhost:3001/api/health

# 문제 요약
curl -X POST http://localhost:3001/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "problemText": "철수는 사과 3개를 가지고 있습니다. 영희에게 1개를 주었습니다. 철수는 몇 개의 사과를 가지고 있을까요?",
    "language": "ko"
  }'
```

## 🔐 보안

- **Rate Limiting**: IP당 15분에 100 요청 제한
- **Helmet**: 보안 HTTP 헤더 설정
- **CORS**: 지정된 오리진만 허용
- **환경 변수**: API 키 등 민감 정보 보호

## 📊 모니터링

애플리케이션은 다음 정보를 로깅합니다:

- API 요청 시간 및 경로
- Claude API 토큰 사용량
- 에러 및 예외 상황

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 📄 라이선스

MIT License

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Powered by Claude AI (Anthropic)** | Built for KAIST Touch Math Academy
