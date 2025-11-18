# 🎓 Smooth Interval - 미분 가능한 구간 시각화 시스템

LMS(Moodle)와 연동하여 수학 함수의 미분 가능한 구간만 부드럽게 흐르는 애니메이션으로 시각화하는 교육용 웹 애플리케이션입니다.

## 📱 주요 기능

### ✨ 핵심 기능
- **LMS 연동**: Moodle 3.7 웹서비스 API를 통한 문제 정보 동기화
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- **Smooth Interval**: 미분 가능한 구간을 부드러운 그라데이션 애니메이션으로 시각화
- **실시간 그래프**: Canvas 기반 수학 함수 그래프 렌더링
- **구간 감지**: 미분 불가능한 점(corner, cusp, discontinuity) 자동 표시

### 🎯 시각화 특징
1. **미분 가능 구간**: 흐르는 색상 그라데이션 애니메이션
2. **미분 불가능 점**: 빨간색 원으로 명확하게 표시
3. **대화형 컨트롤**: 애니메이션 시작/일시정지
4. **상세 정보**: 각 구간의 미분 가능성 표시

## 🏗️ 기술 스택

### Backend
- **Node.js** 16+ with Express
- **MySQL** 5.7
- **PHP** 7.1.9 (Moodle 호환)
- **Moodle** 3.7 Web Service API

### Frontend
- **React** 18
- **Vite** 5 (빌드 도구)
- **Canvas API** (그래프 렌더링)
- **Math.js** (수식 평가)

### Infrastructure
- **Docker Compose** (전체 스택 오케스트레이션)
- **MySQL 5.7** 컨테이너
- **PHP 7.1.9-Apache** 컨테이너

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                 # Node.js API 서버
│   ├── src/
│   │   ├── config/         # DB 설정
│   │   ├── controllers/    # 요청 핸들러
│   │   ├── models/         # 데이터 모델
│   │   ├── routes/         # API 라우트
│   │   ├── services/       # Moodle 통합
│   │   └── index.js        # 서버 진입점
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # React 웹 앱
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   │   ├── SmartphoneFrame.jsx        # 스마트폰 프레임
│   │   │   └── SmoothIntervalVisualization.jsx  # 시각화 엔진
│   │   ├── services/       # API 클라이언트
│   │   ├── App.jsx         # 메인 앱
│   │   └── main.jsx        # 진입점
│   ├── Dockerfile
│   └── package.json
│
├── docker/
│   ├── mysql-init/         # DB 초기화 SQL
│   └── php/                # PHP 스크립트
│
├── docker-compose.yml       # 전체 스택 정의
├── .env.example            # 환경 변수 템플릿
└── README.md

```

## 🚀 빠른 시작

### 1. 사전 요구사항
- Docker & Docker Compose
- Node.js 16+ (로컬 개발 시)
- Moodle 3.7 인스턴스 (웹서비스 활성화)

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경 변수 설정
# MOODLE_URL과 MOODLE_TOKEN을 실제 값으로 변경
nano .env
```

### 3. Docker로 실행 (권장)

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 4. 로컬 개발 모드

```bash
# 의존성 설치
npm run install:all

# 개발 서버 시작 (백엔드 + 프론트엔드 동시)
npm run dev
```

## 🌐 접속 주소

| 서비스 | URL | 설명 |
|--------|-----|------|
| **Frontend** | http://localhost:5173 | React 웹 앱 |
| **Backend API** | http://localhost:3000 | Node.js REST API |
| **MySQL** | localhost:3306 | 데이터베이스 |
| **PHP/Apache** | http://localhost:8080 | PHP 서버 |

## 📡 API 엔드포인트

### Problems API

```
GET    /api/problems              # 모든 문제 조회
GET    /api/problems/:id          # ID로 문제 조회
GET    /api/problems/moodle/:id   # Moodle ID로 조회
GET    /api/problems/:id/smooth-intervals  # 미분가능 구간 조회
POST   /api/problems              # 새 문제 생성
PUT    /api/problems/:id          # 문제 수정
DELETE /api/problems/:id          # 문제 삭제
```

### Moodle API

```
GET    /api/moodle/test           # Moodle 연결 테스트
GET    /api/moodle/course/:id     # 코스 정보 조회
POST   /api/moodle/sync/:id       # Moodle 문제 동기화
```

## 🗄️ 데이터베이스 스키마

### problems 테이블
```sql
id                   INT (PK)
moodle_problem_id    VARCHAR(100) UNIQUE
title                VARCHAR(255)
description          TEXT
function_expression  VARCHAR(500)  -- 수식 (예: abs(x), sin(x))
domain_start         DECIMAL(10,4)
domain_end           DECIMAL(10,4)
difficulty_level     ENUM('easy','medium','hard')
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

### function_intervals 테이블
```sql
id                   INT (PK)
problem_id           INT (FK -> problems)
interval_start       DECIMAL(10,4)
interval_end         DECIMAL(10,4)
is_differentiable    BOOLEAN
interval_type        ENUM('smooth','corner','cusp','discontinuity')
notes                TEXT
created_at           TIMESTAMP
```

## 🎨 화면 구성

### 메인 대시보드
- 좌측: 문제 목록 및 상세 정보
- 우측 하단: **스마트폰 프레임** (375×667px)

### 스마트폰 화면 내부
1. **문제 헤더**: 제목, 설명, 함수식
2. **Canvas 그래프**: 실시간 함수 시각화
3. **애니메이션 버튼**: ▶ 재생 / ⏸ 일시정지
4. **구간 정보**: 미분가능/불가능 구간 목록

## 🔧 Moodle 연동 설정

### 1. Moodle 웹서비스 활성화

```
관리 → 고급 기능 → 웹 서비스 활성화
```

### 2. 토큰 생성

```
관리 → 플러그인 → 웹 서비스 → 토큰 관리
→ 토큰 추가
```

### 3. 필요한 함수 활성화

```
- core_webservice_get_site_info
- core_course_get_courses
- mod_quiz_get_quizzes_by_courses
- mod_quiz_get_quiz_questions
- core_question_get_question_data
```

### 4. .env 파일 설정

```env
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_webservice_token_here
MOODLE_VERSION=3.7
```

## 📊 샘플 데이터

초기 데이터베이스에는 3개의 샘플 문제가 포함되어 있습니다:

1. **절댓값 함수** (쉬움): f(x) = |x|
   - x=0에서 미분 불가능

2. **구간별 정의 함수** (보통): f(x) = x² (x<0), x (x≥0)
   - x=0에서 미분 불가능

3. **삼각함수 합성** (어려움): f(x) = |sin(x)|
   - x=nπ에서 미분 불가능

## 🧪 테스트

### Backend 테스트

```bash
cd backend
npm test
```

### API 테스트 (curl)

```bash
# Health check
curl http://localhost:3000/health

# Get all problems
curl http://localhost:3000/api/problems

# Test Moodle connection
curl http://localhost:3000/api/moodle/test
```

## 🐛 문제 해결

### MySQL 연결 실패

```bash
# 컨테이너 상태 확인
docker-compose ps

# MySQL 로그 확인
docker-compose logs mysql

# 재시작
docker-compose restart mysql
```

### Frontend가 Backend에 연결 안 됨

```env
# .env에서 확인
VITE_API_URL=http://localhost:3000
```

### Moodle 연동 실패

```bash
# 토큰 테스트
curl "https://your-moodle.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

## 📈 향후 개선 계획

- [ ] 더 많은 함수 타입 지원 (로그, 지수 등)
- [ ] 3D 함수 시각화
- [ ] 학생 진도 추적
- [ ] AI 기반 문제 추천
- [ ] 모바일 네이티브 앱
- [ ] 다국어 지원 (영어, 일본어)

## 👥 기여

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 📄 라이선스

MIT License

## 🙏 감사의 말

- Moodle 커뮤니티
- Math.js 개발팀
- React 및 Node.js 커뮤니티

---

**개발**: Claude AI
**버전**: 1.0.0
**날짜**: 2025-11-18
