# Counterexample Shadow

명제의 반례를 어두운 그림자로 시각화하여 학습하는 독립형 웹 애플리케이션

## 개요

Counterexample Shadow는 논리적 명제와 그 반례를 시각적으로 표현하여 학습자가 명제의 참/거짓을 직관적으로 이해할 수 있도록 돕는 교육용 웹앱입니다.

### 주요 기능

- **반례 시각화**: 명제의 반례를 어두운 그림자로 표현
- **가상 스마트폰**: 우측 하단에 모바일 화면 시뮬레이션
- **LMS 연동**: Moodle 등 LMS에서 문제 정보 수신
- **실시간 피드백**: 학습자의 답변에 즉각적인 시각적 피드백

## 기술 스택

### Frontend
- React 18+ with TypeScript
- Vite (빌드 도구)
- Canvas API (시각화)
- CSS3 Animations (그림자 효과)

### Backend
- Node.js 20+
- Express.js with TypeScript
- PostgreSQL 15+
- JWT 인증

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 프로젝트 구조

```
.
├── backend/              # Node.js + Express 백엔드
│   ├── src/
│   │   ├── controllers/  # API 컨트롤러
│   │   ├── models/       # 데이터 모델
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── middleware/   # 미들웨어
│   │   └── server.ts     # 서버 엔트리
│   └── package.json
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지
│   │   ├── hooks/        # 커스텀 훅
│   │   └── services/     # API 서비스
│   └── package.json
├── database/             # DB 스키마
└── docker-compose.yml    # Docker 설정
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (선택사항)

### 설치

```bash
# 백엔드 설치
cd backend
npm install

# 프론트엔드 설치
cd frontend
npm install
```

### 개발 서버 실행

```bash
# Docker Compose로 전체 스택 실행
docker-compose up

# 또는 개별 실행
# 백엔드
cd backend
npm run dev

# 프론트엔드
cd frontend
npm run dev
```

## API 문서

### Propositions (명제)

- `GET /api/propositions` - 모든 명제 목록
- `GET /api/propositions/:id` - 특정 명제 조회
- `POST /api/propositions` - 새 명제 생성
- `PUT /api/propositions/:id` - 명제 수정
- `DELETE /api/propositions/:id` - 명제 삭제

### Counterexamples (반례)

- `GET /api/propositions/:id/counterexamples` - 명제의 반례 목록
- `POST /api/propositions/:id/counterexamples` - 반례 추가

### LMS Integration

- `POST /api/lms/import` - LMS에서 문제 가져오기
- `POST /api/lms/export-result` - 학습 결과 내보내기

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트를 환영합니다!
