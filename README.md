# Alt42 Standalone - Moodle LMS 연동 웹앱

Moodle LMS와 연동하여 문제를 가상 스마트폰 화면에 표시하고, AI로 문제 구조를 3줄로 요약하는 웹 애플리케이션입니다.

## 시스템 요구사항

- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Node.js**: 18+
- **AI**: Claude API (Anthropic)

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/          # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── VirtualPhone/     # 가상 스마트폰 화면
│   │   │   ├── ProblemDisplay/   # 문제 표시
│   │   │   └── EquationSummary/  # AI 요약 표시
│   │   └── services/
│   │       └── api.ts            # API 통신
├── backend/           # Node.js + Express 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── moodle.ts         # Moodle 연동
│   │   │   └── summary.ts        # AI 요약 API
│   │   ├── services/
│   │   │   ├── moodleService.ts  # Moodle API 클라이언트
│   │   │   └── aiService.ts      # Claude API 통합
│   │   └── server.ts
│   └── package.json
└── README.md
```

## 주요 기능

### 1. Moodle LMS 연동
- Moodle REST API를 통한 문제 정보 가져오기
- 문제 유형, 본문, 선택지, 수식 등 파싱

### 2. 가상 스마트폰 화면
- 우측 하단에 스마트폰 프레임 표시
- 반응형 디자인 (모바일 크기 시뮬레이션)

### 3. Equation Summary (AI 요약)
- Claude API를 사용하여 문제 구조 분석
- 3줄 요약 생성:
  - Line 1: 문제 유형 및 핵심 개념
  - Line 2: 주요 수식/방정식 구조
  - Line 3: 해결 접근 방법

## 설치 및 실행

### 백엔드 설정
```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
npm run dev
```

### 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

## 환경 변수 설정

### backend/.env
```env
# Moodle 연동
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token

# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# 서버 설정
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### frontend/.env
```env
VITE_API_URL=http://localhost:3001
```

## 개발 로드맵

- [x] 프로젝트 구조 설계
- [ ] 백엔드 API 구현
- [ ] Moodle 연동 서비스
- [ ] Claude AI 요약 서비스
- [ ] 프론트엔드 UI 구현
- [ ] 가상 스마트폰 컴포넌트
- [ ] 통합 테스트

## 라이선스

MIT
