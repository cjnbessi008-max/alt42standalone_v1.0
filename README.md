# Balance Machine - 방정식 균형 학습 웹앱

Moodle LMS와 연동 가능한 독립형 방정식 학습 애플리케이션

## 개요

Balance Machine은 학생들이 방정식의 양변에 같은 수를 더하고 빼는 과정을 시각적으로 학습할 수 있는 교육용 웹 애플리케이션입니다. 균형 저울 메타포를 사용하여 대수적 사고를 직관적으로 이해할 수 있도록 돕습니다.

## 주요 기능

- 🎯 **방정식 시각화**: 균형 저울 형태로 방정식 표현
- ⚖️ **인터랙티브 학습**: 양변에 같은 수를 더하고 빼는 과정 체험
- 📱 **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- 📊 **학습 진도 추적**: 학생별 문제 풀이 진행도 기록
- 🔗 **Moodle 연동**: LMS와 통합하여 문제 정보 수신 및 성적 전송
- 🎓 **난이도 조절**: 일차방정식부터 고급 방정식까지 단계별 학습

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Styled Components (스타일링)
- Framer Motion (애니메이션)

### Backend
- Node.js 18+ + Express
- TypeScript
- MySQL 5.7 드라이버

### Database
- MySQL 5.7

### DevOps
- Docker & Docker Compose
- ESLint + Prettier

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── services/     # API 클라이언트
│   │   ├── types/        # TypeScript 타입 정의
│   │   └── App.tsx       # 메인 앱 컴포넌트
│   └── package.json
├── backend/               # Node.js API 서버
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── models/       # 데이터 모델
│   │   ├── services/     # 비즈니스 로직
│   │   └── server.ts     # 서버 진입점
│   └── package.json
├── database/              # 데이터베이스 스키마
│   ├── schema.sql        # 테이블 정의
│   └── seed.sql          # 초기 데이터
├── docker/                # Docker 설정
│   └── docker-compose.yml
└── docs/                  # 문서
```

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- MySQL 5.7
- Docker (선택사항)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 데이터베이스 설정

```bash
# MySQL 접속 후 데이터베이스 생성
mysql -u root -p
CREATE DATABASE balance_machine;

# 스키마 적용
mysql -u root -p balance_machine < database/schema.sql

# 샘플 데이터 삽입
mysql -u root -p balance_machine < database/seed.sql
```

### 환경 변수 설정

**backend/.env**
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=balance_machine
MOODLE_API_URL=http://your-moodle-site.com/webservice/rest/server.php
MOODLE_TOKEN=your_moodle_token
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3001
```

### 실행

```bash
# 백엔드 서버 시작 (개발 모드)
cd backend
npm run dev

# 프론트엔드 개발 서버 시작
cd frontend
npm run dev
```

프론트엔드: http://localhost:5173
백엔드 API: http://localhost:3001

### Docker로 실행

```bash
docker-compose up -d
```

## API 엔드포인트

### 문제 관리
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 문제 생성 (교사용)

### 학습 진도
- `GET /api/progress/:studentId` - 학생 진도 조회
- `POST /api/progress` - 문제 풀이 결과 저장

### Moodle 연동
- `POST /api/moodle/sync` - Moodle에서 문제 정보 가져오기
- `POST /api/moodle/grade` - Moodle 성적부에 점수 전송

## Moodle 연동 방법

1. Moodle 관리자 페이지에서 웹 서비스 활성화
2. 외부 서비스 토큰 생성
3. Balance Machine에서 토큰 설정
4. 문제 정보 동기화 실행

자세한 내용은 [docs/moodle-integration.md](docs/moodle-integration.md) 참조

## 교육학적 설계

### 학습 단계

1. **기초 단계**: 간단한 일차방정식 (x + 3 = 7)
2. **중급 단계**: 계수가 있는 방정식 (2x + 5 = 15)
3. **고급 단계**: 양변에 변수가 있는 방정식 (3x + 2 = x + 10)

### 시각화 원리

- 저울의 균형을 통해 등호(=)의 의미 이해
- 양변에 같은 조작을 하면 균형이 유지됨을 체험
- 단계별 안내로 문제 해결 전략 학습

## 개발

### 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

### 린트

```bash
npm run lint
```

### 빌드

```bash
# 프론트엔드 프로덕션 빌드
cd frontend
npm run build

# 백엔드 빌드
cd backend
npm run build
```

## 라이선스

MIT License

## 기여

이슈와 PR을 환영합니다!

## 문의

프로젝트 관련 문의는 이슈 트래커를 이용해주세요.
