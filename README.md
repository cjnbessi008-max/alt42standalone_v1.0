# 🌸 Mathematical Garden

숫자 간 관계를 오브제로 시각화하는 인터랙티브 수학 학습 웹 애플리케이션

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 프로젝트 개요

**Mathematical Garden**은 수학 문제의 숫자들을 정원의 오브제(꽃, 나무, 관목 등)로 시각화하여, 학생들이 시각적으로 숫자 간의 관계를 이해하고 학습할 수 있도록 돕는 교육용 웹 애플리케이션입니다.

### 주요 특징

- 🌺 **시각적 학습**: 숫자를 꽃, 나무 등 정원 오브제로 표현
- 📱 **가상 스마트폰**: 우측 하단에 실제 스마트폰처럼 표시되는 앱 인터페이스
- 🎓 **Moodle 연동**: Moodle LMS와 통합하여 문제 가져오기 및 결과 동기화
- 🎨 **다양한 시각화**: Grid, Circular, Linear 등 다양한 배치 옵션
- 🎭 **인터랙티브**: 클릭, 드래그, 애니메이션 등 상호작용
- 📊 **학습 추적**: 실시간 학습 통계 및 진행 상황 모니터링

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Spring** - 애니메이션
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js** + Express + TypeScript
- **MySQL 5.7** - 데이터베이스
- **Joi** - 데이터 검증
- **Helmet** + CORS - 보안

### DevOps
- **Docker** + Docker Compose
- **Nginx** - 프로덕션 웹 서버

## 📦 설치 및 실행

### 필수 요구사항

- Node.js 18+
- MySQL 5.7+
- Docker & Docker Compose (선택사항)

### 방법 1: Docker Compose 사용 (권장)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Docker Compose로 실행
docker-compose up -d

# 4. 브라우저에서 접속
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

### 방법 2: 로컬 개발 환경

#### Backend 실행

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (DB 정보 등)

# MySQL 데이터베이스 및 테이블 생성
mysql -u root -p < ../database/schema.sql

# 개발 서버 실행
npm run dev

# 또는 프로덕션 빌드
npm run build
npm start
```

#### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 VITE_API_URL 확인

# 개발 서버 실행
npm run dev

# 또는 프로덕션 빌드
npm run build
npm run preview
```

## 🗄️ 데이터베이스 설정

### MySQL 데이터베이스 생성

```sql
CREATE DATABASE mathematical_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 스키마 적용

```bash
mysql -u root -p mathematical_garden < database/schema.sql
```

### 기본 데이터

스키마 파일에는 다음과 같은 기본 데이터가 포함되어 있습니다:
- 정원 오브제 정의 (꽃, 나무, 관목 등)
- 앱 기본 설정

## 🔧 환경 변수 설정

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=mathgarden
DB_PASSWORD=your_password
DB_NAME=mathematical_garden

MOODLE_URL=http://your-moodle-instance.com
MOODLE_API_TOKEN=your_token_here
MOODLE_SERVICE=moodle_mobile_app

CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## 📡 API 엔드포인트

### 문제 (Problems)

- `GET /api/v1/problems` - 모든 문제 조회
- `GET /api/v1/problems/:id` - 특정 문제 조회
- `GET /api/v1/problems/random` - 랜덤 문제 조회
- `POST /api/v1/problems` - 문제 생성
- `PUT /api/v1/problems/:id` - 문제 수정
- `DELETE /api/v1/problems/:id` - 문제 삭제

### 세션 (Sessions)

- `POST /api/v1/sessions` - 새 세션 생성
- `GET /api/v1/sessions/:session_id` - 세션 조회
- `GET /api/v1/sessions/:session_id/stats` - 세션 통계
- `POST /api/v1/sessions/:session_id/attempts` - 답안 제출
- `GET /api/v1/sessions/:session_id/attempts` - 답안 내역

### Moodle 연동

- `GET /api/v1/moodle/test` - Moodle 연결 테스트
- `POST /api/v1/moodle/import-quiz/:quizId` - Moodle 퀴즈 가져오기

## 🎨 시각화 오브제

### 지원하는 오브제 타입

1. **Flower (꽃)** 🌺
   - 작은 숫자에 적합
   - 6개 꽃잎, 중앙 레이블
   - 다양한 색상 지원

2. **Tree (나무)** 🌳
   - 큰 숫자에 적합
   - 3단 나뭇잎, 열매 표시
   - 값에 따라 크기 조절

3. **Bush (관목)** 🌿
   - 중간 크기 숫자
   - 여러 원으로 구성
   - 베리 장식 포함

### 레이아웃 옵션

- **Grid**: 격자 형태 배치
- **Circular**: 원형 배치
- **Linear**: 일렬 배치
- **Random**: 랜덤 배치

### 애니메이션 타입

- **Fade**: 페이드 인
- **Grow**: 확대 효과
- **Bounce**: 바운스 효과
- **Slide**: 슬라이드 인

## 🔌 Moodle 연동

### Moodle Web Service 설정

1. Moodle 관리자 페이지에서 Web Services 활성화
2. 새 서비스 생성 (예: `moodle_mobile_app`)
3. 필요한 함수 권한 부여:
   - `core_webservice_get_site_info`
   - `mod_quiz_get_quiz_access_information`
4. 토큰 생성 및 .env에 설정

### 퀴즈 가져오기

```bash
# API 호출 예시
POST http://localhost:3001/api/v1/moodle/import-quiz/123
```

## 📱 사용 방법

### 학생 사용자

1. 앱 접속 시 자동으로 세션 생성
2. 우측 가상 스마트폰 화면에서 문제 확인
3. 정원의 오브제를 관찰하여 숫자 관계 파악
4. 오브제 클릭으로 선택 및 상호작용
5. 답 입력 후 제출
6. 즉각적인 피드백 확인
7. 다음 문제로 자동 진행

### 교사/관리자

1. 좌측 대시보드에서 학습 통계 확인
2. 문제 유형, 난이도 필터링
3. Moodle에서 문제 가져오기
4. 학생 진행 상황 모니터링

## 🧪 개발 및 테스트

### 백엔드 테스트

```bash
cd backend
npm test
```

### 프론트엔드 린팅

```bash
cd frontend
npm run lint
```

### 빌드 검증

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # Node.js + Express 백엔드
│   ├── src/
│   │   ├── config/         # 설정 파일
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── models/         # 데이터 모델
│   │   ├── routes/         # 라우트 정의
│   │   ├── services/       # 비즈니스 로직
│   │   └── types/          # TypeScript 타입
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── VirtualPhone/
│   │   │   ├── MathematicalGarden/
│   │   │   └── ProblemView/
│   │   ├── services/       # API 서비스
│   │   ├── stores/         # 상태 관리
│   │   ├── types/          # TypeScript 타입
│   │   └── utils/          # 유틸리티
│   ├── package.json
│   └── vite.config.ts
├── database/                # 데이터베이스 스키마
│   └── schema.sql
├── docker-compose.yml       # Docker Compose 설정
└── README.md
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

This project is licensed under the MIT License.

## 👥 제작

**KAIST Touch Math Academy**

## 📞 문의

문제나 제안사항이 있으시면 Issues를 통해 알려주세요.

---

**Made with 🌸 for better math education**
