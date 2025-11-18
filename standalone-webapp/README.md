# Confidence Reasoning LMS - 독립형 웹앱

답변 확신도와 이유를 추적하는 독립형 학습 관리 시스템(LMS)

## 🎯 주요 기능

### 학생 기능
- ✅ 퀴즈 응시 및 답변 제출
- ✅ 각 문제마다 **확신도 레벨** 선택 (1-5)
- ✅ **확신한 이유** 작성 (카테고리 + 자유 텍스트)
- ✅ 내 퀴즈 기록 및 통계 조회
- ✅ 메타인지 능력 피드백

### 교사 기능
- ✅ 과목/강좌 생성 및 관리
- ✅ 퀴즈 및 문제 생성 (객관식, OX, 주관식, 서술형)
- ✅ 학생 확신도 데이터 조회
- ✅ 통계 대시보드:
  - 평균 확신도
  - 확신도-정답률 상관관계
  - 과신 편향 / 과소평가 패턴
  - 확신도 보정 점수

### 관리자 기능
- ✅ 사용자 관리
- ✅ 시스템 통계
- ✅ 활동 로그

---

## 🏗️ 기술 스택

### Backend
- **PHP**: 7.4+ (7.1.9 호환 코드)
- **Framework**: Slim 4 (마이크로프레임워크)
- **Database**: MySQL 5.7+
- **Authentication**: JWT (JSON Web Tokens)
- **Dependencies**: Composer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form**: React Hook Form

---

## 📁 프로젝트 구조

```
standalone-webapp/
├── backend/
│   ├── public/
│   │   └── index.php              # 메인 진입점
│   ├── src/
│   │   ├── Controllers/           # API 컨트롤러
│   │   │   ├── AuthController.php
│   │   │   ├── QuizController.php
│   │   │   ├── ConfidenceController.php
│   │   │   └── StatsController.php
│   │   ├── Models/                # 데이터 모델
│   │   │   ├── User.php
│   │   │   ├── Quiz.php
│   │   │   ├── Question.php
│   │   │   └── Confidence.php
│   │   ├── Middleware/            # 미들웨어
│   │   │   └── AuthMiddleware.php
│   │   ├── Services/              # 비즈니스 로직
│   │   ├── Database.php           # DB 싱글톤
│   │   └── routes.php             # 라우팅
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_create_tables.sql
│   │   └── seeds/
│   │       └── 002_seed_demo_data.sql
│   ├── config/
│   │   └── database.php
│   ├── composer.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/            # React 컴포넌트
│   │   │   ├── ConfidenceSlider.jsx
│   │   │   ├── QuizCard.jsx
│   │   │   └── StatsChart.jsx
│   │   ├── pages/                 # 페이지 컴포넌트
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── QuizTake.jsx
│   │   │   └── TeacherStats.jsx
│   │   ├── services/              # API 서비스
│   │   │   └── api.js
│   │   ├── hooks/                 # 커스텀 훅
│   │   ├── utils/                 # 유틸리티
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── docs/
    ├── API.md                     # API 문서
    ├── DATABASE.md                # 데이터베이스 스키마
    └── DEPLOYMENT.md              # 배포 가이드
```

---

## 🚀 빠른 시작

### 사전 요구사항

- PHP 7.4+ (권장: 7.4 또는 8.1)
- MySQL 5.7+
- Composer
- Node.js 18+ & npm
- Git

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd standalone-webapp
```

### 2. Backend 설정

```bash
cd backend

# Composer 의존성 설치
composer install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 데이터베이스 정보 입력
```

#### .env 설정 예시
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=confidence_lms
DB_USERNAME=root
DB_PASSWORD=yourpassword

JWT_SECRET=your-very-secret-key-change-this-in-production
```

### 3. 데이터베이스 생성

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE confidence_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE confidence_lms;

# 테이블 생성
SOURCE database/migrations/001_create_tables.sql;

# 데모 데이터 삽입 (선택사항)
SOURCE database/seeds/002_seed_demo_data.sql;

EXIT;
```

### 4. Backend 서버 실행

```bash
# 개발 서버 시작 (PHP 내장 서버)
composer start

# 또는 수동으로:
php -S localhost:8000 -t public
```

Backend API가 http://localhost:8000에서 실행됩니다.

### 5. Frontend 설정

새 터미널을 열고:

```bash
cd frontend

# npm 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

Frontend가 http://localhost:5173에서 실행됩니다.

---

## 🔐 데모 계정

데모 데이터를 로드했다면 다음 계정으로 로그인할 수 있습니다:

| 이메일 | 비밀번호 | 역할 |
|--------|---------|------|
| admin@example.com | password123 | 관리자 |
| teacher@example.com | password123 | 교사 |
| student1@example.com | password123 | 학생 |
| student2@example.com | password123 | 학생 |
| student3@example.com | password123 | 학생 |

---

## 📊 데이터베이스 스키마

### 주요 테이블

#### users
사용자 정보 (학생, 교사, 관리자)

#### courses
과목/강좌 정보

#### quizzes
퀴즈 정보

#### questions
문제 정보

#### question_options
객관식 선택지

#### quiz_attempts
퀴즈 응시 기록

#### question_attempts
문제 답변 기록

#### confidence_reasoning ⭐
**확신도 및 이유 데이터** (핵심 테이블)
- confidence_level (1-5)
- reasoning_text
- reasoning_category

#### confidence_stats ⭐
**확신도 통계 요약**
- avg_confidence
- overconfidence_bias
- calibration_score

자세한 스키마는 `backend/database/migrations/001_create_tables.sql` 참조

---

## 🌐 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 퀴즈
- `GET /api/quizzes` - 퀴즈 목록
- `GET /api/quizzes/{id}` - 퀴즈 상세
- `POST /api/quizzes` - 퀴즈 생성 (교사)
- `POST /api/quizzes/{id}/start` - 퀴즈 시작
- `POST /api/quizzes/{id}/submit` - 퀴즈 제출

### 확신도
- `POST /api/confidence` - 확신도 저장
- `GET /api/confidence/question/{id}` - 문제별 확신도 조회
- `GET /api/confidence/quiz/{quizId}/student/{studentId}` - 퀴즈별 확신도 조회

### 통계
- `GET /api/stats/student/{studentId}/quiz/{quizId}` - 학생-퀴즈 통계
- `GET /api/stats/quiz/{quizId}` - 퀴즈 전체 통계 (교사)
- `GET /api/stats/student/{studentId}` - 학생 전체 통계 (교사)

자세한 API 문서는 `docs/API.md` 참조

---

## 🧪 테스트

### Backend 테스트
```bash
cd backend
composer test
```

### Frontend 테스트
```bash
cd frontend
npm run test
```

---

## 📦 프로덕션 빌드

### Backend
```bash
cd backend

# .env 파일에서 APP_ENV=production 설정
# JWT_SECRET을 강력한 키로 변경

# Composer 최적화
composer install --no-dev --optimize-autoloader
```

### Frontend
```bash
cd frontend

# 프로덕션 빌드
npm run build

# dist/ 폴더가 생성됨
```

빌드된 파일을 Apache/Nginx에 배포하세요.

---

## 🔧 환경별 설정

### 개발 환경
- PHP 내장 서버 사용
- CORS 모든 origin 허용
- 디버그 모드 활성화

### 프로덕션 환경
- Apache/Nginx + PHP-FPM
- HTTPS 필수
- CORS 특정 domain만 허용
- 에러 로깅

---

## 📝 주요 특징

### 1. 확신도 추적 시스템
학생이 각 문제에 답변할 때:
1. **확신도 선택**: 1-5 슬라이더
2. **이유 카테고리**: 공부함, 계산함, 기억함, 추측함, 제거법, 기타
3. **자유 텍스트**: 상세한 이유 작성

### 2. 메타인지 분석
- **Calibration Score**: 확신도와 정답률의 일치도
- **Overconfidence Bias**: 높은 확신도로 틀린 비율
- **Underconfidence Pattern**: 낮은 확신도로 맞춘 비율

### 3. 적응형 피드백
- 과신 패턴 감지 시 → 도전적 문제 추천
- 과소평가 패턴 감지 시 → 자신감 회복 문제 추천
- 잘 보정된 학생 → 점진적 난이도 상승

---

## 🛠️ 문제 해결

### Backend 서버 시작 실패
```bash
# 포트 8000이 이미 사용 중인 경우
php -S localhost:8001 -t public
```

### Database 연결 실패
- MySQL 서비스가 실행 중인지 확인
- `.env` 파일의 DB 정보 확인
- 데이터베이스가 생성되었는지 확인

### Frontend CORS 오류
- Backend `.env`의 `CORS_ALLOWED_ORIGINS`에 Frontend URL 추가
- 예: `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`

---

## 📚 추가 문서

- [API 문서](docs/API.md)
- [데이터베이스 스키마](docs/DATABASE.md)
- [배포 가이드](docs/DEPLOYMENT.md)
- [개발 가이드](docs/DEVELOPMENT.md)

---

## 🤝 기여

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 라이선스

MIT License

---

## 👥 개발팀

- **KAIST Touch Math Academy**
- **AI Education System Pipeline Project**

---

## 📞 지원

- 이슈 리포트: GitHub Issues
- 이메일: support@example.com
- 문서: [프로젝트 위키](link-to-wiki)

---

## 🔄 버전 히스토리

### v1.0.0 (2025-11-18)
- ✅ 초기 독립형 웹앱 구현
- ✅ 확신도 추적 기능
- ✅ JWT 인증 시스템
- ✅ 퀴즈 관리 기능
- ✅ 통계 대시보드
- ✅ 반응형 React UI

---

**Happy Learning with Confidence! 🎓**
