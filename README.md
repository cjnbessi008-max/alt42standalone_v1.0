# Alt42 Standalone - Equation Solver with Solve Timeline

웹앱 기반 방정식 풀이 시스템으로, Moodle LMS와 연동되어 학습자의 문제 풀이 과정을 타임라인으로 기록합니다.

## 시스템 요구사항

- **MySQL**: 5.7
- **PHP**: 7.1.9 (Moodle 연동용)
- **Moodle**: 3.7
- **Node.js**: 14.x 이상
- **npm**: 6.x 이상

## 주요 기능

### 1. Solve Timeline (방정식 풀이 타임라인)
- 학습자의 방정식 풀이 과정을 단계별로 기록
- 각 단계의 수식 변환, 적용된 규칙, 소요 시간 추적
- 타임라인 시각화 및 재생 기능

### 2. Virtual Smartphone Display
- 우측 하단에 가상 스마트폰 화면 표시
- 반응형 디자인으로 모바일 환경 시뮬레이션

### 3. Moodle LMS 연동
- Moodle에서 문제 정보 수신
- 학습 결과를 Moodle로 전송
- LTI(Learning Tools Interoperability) 지원

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── models/         # 데이터 모델
│   │   ├── services/       # 비즈니스 로직
│   │   ├── routes/         # API 라우트
│   │   └── utils/          # 유틸리티 함수
│   ├── database/           # DB 마이그레이션 및 시드
│   └── package.json
│
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입
│   │   └── styles/        # 스타일 파일
│   └── package.json
│
├── moodle-plugin/         # Moodle 연동 플러그인
│   └── mod_alt42/         # Moodle 모듈
│
└── docs/                  # 문서
    └── api.md            # API 문서
```

## 설치 및 실행

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE alt42_standalone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alt42_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON alt42_standalone.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 백엔드 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 등)
npm run migrate
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
npm start
```

### 4. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 복사
cp -r moodle-plugin/mod_alt42 /path/to/moodle/mod/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

## API 엔드포인트

### Timeline API

- `POST /api/timelines` - 새 타임라인 생성
- `GET /api/timelines/:id` - 타임라인 조회
- `POST /api/timelines/:id/steps` - 풀이 단계 추가
- `GET /api/timelines/student/:studentId` - 학생별 타임라인 목록

### Moodle Integration API

- `POST /api/moodle/problem` - Moodle에서 문제 수신
- `POST /api/moodle/submit` - 풀이 결과 Moodle로 전송

## 개발

```bash
# 백엔드 개발 서버 (포트 3001)
cd backend && npm run dev

# 프론트엔드 개발 서버 (포트 3000)
cd frontend && npm start
```

## 라이선스

MIT License
