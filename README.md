# 산만함 감지 LMS - 독립형 웹앱

학습자의 집중도를 실시간으로 모니터링하고 산만해진 지점을 자동으로 표시하는 독립형 LMS 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- PostgreSQL 14 이상
- npm 9 이상

### 1. 저장소 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd alt42standalone_v1.0

# 모든 의존성 설치 (루트, 백엔드, 프론트엔드)
npm run install:all
```

### 2. 데이터베이스 설정

```bash
# PostgreSQL 설치 및 실행 확인
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# macOS
brew install postgresql@14
brew services start postgresql@14

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE distraction_detection;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE distraction_detection TO postgres;
\q
```

### 3. 환경 변수 설정

```bash
# 백엔드 환경 변수
cp backend/.env.example backend/.env

# 프론트엔드 환경 변수
cp frontend/.env.example frontend/.env

# 필요시 backend/.env 파일을 열어서 데이터베이스 정보 수정
```

### 4. 데이터베이스 마이그레이션 및 시드

```bash
# 데이터베이스 스키마 생성
npm run db:migrate

# 테스트 데이터 생성
npm run db:seed
```

### 5. 애플리케이션 실행

```bash
# 개발 모드 (프론트엔드 + 백엔드 동시 실행)
npm run dev
```

애플리케이션이 실행되면:
- 🎨 **프론트엔드**: http://localhost:3000
- 🔧 **백엔드 API**: http://localhost:5000
- 💚 **Health Check**: http://localhost:5000/health

## 📋 테스트 계정

시드 스크립트 실행 후 다음 계정으로 로그인할 수 있습니다:

### 교사 계정
- **이메일**: teacher@example.com
- **비밀번호**: teacher123

### 학생 계정
- **이메일**: student1@example.com
- **비밀번호**: student123

추가 학생 계정:
- student2@example.com / student123
- student3@example.com / student123

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Express.js 백엔드
│   ├── src/
│   │   ├── api/               # API 라우트
│   │   │   ├── auth.routes.ts
│   │   │   └── distraction.routes.ts
│   │   ├── config/            # 설정
│   │   │   └── database.ts
│   │   ├── database/          # 마이그레이션 및 시드
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   ├── middleware/        # 미들웨어
│   │   │   └── auth.middleware.ts
│   │   ├── services/          # 비즈니스 로직
│   │   │   └── distraction.service.ts
│   │   ├── jobs/              # 백그라운드 작업
│   │   │   └── distraction-analytics-aggregation.ts
│   │   └── server.ts          # 서버 엔트리 포인트
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── api/               # API 클라이언트
│   │   │   ├── client.ts
│   │   │   └── auth.ts
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── student/
│   │   │   │   └── DistractionIndicator.tsx
│   │   │   └── teacher/
│   │   │       └── DistractionMarkingDashboard.tsx
│   │   ├── lib/               # 유틸리티 라이브러리
│   │   │   └── DistractionTracker.ts
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   └── StudentDashboard.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── database/
│   └── schemas/
│       └── distraction_detection.sql
├── docs/
│   └── DISTRACTION_DETECTION_GUIDE.md
├── package.json               # 루트 package.json
└── README.md
```

## 🛠️ 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 개발 서버
- **TailwindCSS** - 스타일링
- **Axios** - HTTP 클라이언트
- **React Router** - 라우팅

### 백엔드
- **Node.js 18+** - 런타임
- **Express.js** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증
- **bcrypt** - 비밀번호 해싱

## 📖 주요 기능

### 1. 실시간 산만함 감지
- 9가지 산만함 유형 감지 (페이지 블러, 탭 전환, 비활성 등)
- 자동 심각도 분류 (minor, moderate, major, critical)
- 이벤트 배칭 및 효율적인 전송

### 2. 교사 마킹 대시보드
- 미표시 이벤트 필터링 및 검색
- 이벤트 카테고리 분류 및 메모 추가
- 근본 원인 분석 및 개입 권장
- 통계 및 트렌드 분석

### 3. 학생 인터페이스
- 실시간 집중 상태 표시
- 산만함 타임라인 시각화
- 알림 및 휴식 권장

### 4. 분석 시스템
- 일일 자동 집계
- 주별/월별 트렌드 계산
- 학업 성과와의 상관관계 분석

## 🔧 개발 명령어

```bash
# 전체 애플리케이션 개발 모드
npm run dev

# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend

# 빌드
npm run build

# 프로덕션 시작 (빌드 후)
npm start

# 데이터베이스 마이그레이션
npm run db:migrate

# 데이터베이스 시드
npm run db:seed

# 테스트
npm test
```

## 🗄️ 데이터베이스 스키마

주요 테이블:

- **teachers** - 교사 정보
- **students** - 학생 정보
- **modules** - 학습 모듈
- **student_enrollments** - 수강 등록
- **distraction_events** - 원시 산만함 이벤트
- **distraction_sessions** - 세션별 집계
- **distraction_marks** - 교사 마킹 (핵심 기능)
- **daily_distraction_analytics** - 일일 분석
- **distraction_interventions** - 개입 로그
- **distraction_thresholds** - 임계값 설정

자세한 스키마는 `database/schemas/distraction_detection.sql` 참조

## 🔐 인증 흐름

1. 사용자가 이메일/비밀번호로 로그인
2. 서버가 JWT 토큰 생성 및 반환
3. 클라이언트가 localStorage에 토큰 저장
4. 이후 모든 API 요청에 토큰 포함
5. 서버가 토큰 검증 및 사용자 권한 확인

## 🚢 프로덕션 배포

### 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수를 반드시 변경하세요:

```env
# backend/.env
JWT_SECRET=your-super-secret-production-key-here
DB_PASSWORD=strong-production-password
NODE_ENV=production
```

### 빌드 및 실행

```bash
# 빌드
npm run build

# 프로덕션 시작
NODE_ENV=production npm start
```

## 🐳 Docker (선택사항)

Docker Compose를 사용한 배포는 추후 추가 예정입니다.

## 📚 추가 문서

- **사용자 가이드**: `docs/DISTRACTION_DETECTION_GUIDE.md`
- **PRD 문서**: `tasks/0002-prd-distraction-detection-extension.md`
- **아키텍처 분석**: `ARCHITECTURE_ANALYSIS.md`

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 백엔드 포트 변경 (backend/.env)
PORT=5001

# 프론트엔드 포트 변경 (frontend/vite.config.ts)
# server.port를 원하는 포트로 변경
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL이 실행 중인지 확인
sudo systemctl status postgresql

# 데이터베이스가 존재하는지 확인
sudo -u postgres psql -l

# 연결 테스트
psql -U postgres -d distraction_detection -h localhost -p 5432
```

### 마이그레이션 실패

```bash
# 기존 테이블 삭제 후 재실행
sudo -u postgres psql distraction_detection
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# 마이그레이션 재실행
npm run db:migrate
```

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy를 위한 독립형 LMS 시스템입니다.

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues: [프로젝트 저장소]/issues
- 이메일: support@kaist.ac.kr

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
