# Term Melody

항의 변화를 음악으로 표현하는 Moodle LMS 연동 웹앱

## 프로젝트 개요

Term Melody는 Moodle LMS에서 수학 문제 정보를 받아와 문제의 항(term) 변화를 실시간으로 음악으로 표현하는 독립형 웹 애플리케이션입니다.

## 주요 기능

- 📱 우측 하단 가상 스마트폰 UI
- 🎵 항 변화의 음악적 표현 (Web Audio API)
- 🔗 Moodle 3.7 LMS 연동
- 📊 실시간 항 변화 시각화
- 🎹 다양한 음악 스타일 지원

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Tone.js (음악 생성)
- Zustand (상태 관리)

### Backend
- Node.js 18 + Express
- TypeScript
- MySQL 5.7 (Moodle DB 연동)
- mysql2

## 프로젝트 구조

```
term-melody/
├── frontend/          # React 프론트엔드
├── backend/           # Node.js API 서버
├── docs/              # 문서
└── docker/            # Docker 설정
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- MySQL 5.7 (Moodle 데이터베이스)
- npm 또는 yarn

### 설치 및 실행

#### 백엔드

```bash
cd backend
npm install
cp .env.example .env
# .env 파일을 수정하여 Moodle DB 정보 입력
npm run dev
```

#### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 환경 변수 설정

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password
PORT=3001
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## API 문서

자세한 API 명세는 [docs/API.md](docs/API.md) 참조

## 개발 가이드

- [아키텍처 설계](../TERM_MELODY_ARCHITECTURE.md)
- [개발 가이드](docs/DEVELOPMENT.md)
- [배포 가이드](docs/DEPLOYMENT.md)

## 라이선스

MIT License

## 기여

이슈 및 PR 환영합니다!
