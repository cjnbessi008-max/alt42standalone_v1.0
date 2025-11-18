# Wave Derivative Explorer 🌊📐

독립형 웹앱으로 구현된 Wave Derivative 시각화 시스템입니다. Moodle LMS와 연동하여 수학 함수의 미분을 직관적인 파형으로 표현합니다.

## ✨ 주요 기능

- **인터랙티브 그래프**: 드래그하여 그래프를 "흔들" 수 있음
- **실시간 미분 시각화**: 미세한 변화율을 파형으로 표시
- **가상 스마트폰 UI**: 우측 하단에 스마트폰 형태로 앱 표시
- **8가지 수학 함수**: sine, cosine, quadratic, cubic, polynomial, exponential, logarithmic, tangent
- **LMS 연동**: Moodle 3.7과 API 연동 지원
- **학습 분석**: 학생 인터랙션 추적 및 분석

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **D3.js** - 그래프 시각화
- **Framer Motion** - 애니메이션
- **Tailwind CSS** - 스타일링
- **Vite** - 빌드 도구

### Backend
- **Node.js** + Express
- **PostgreSQL 15+** - 데이터베이스
- **REST API** - LMS 연동

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 웹앱
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── SmartphoneFrame.tsx
│   │   │   ├── GraphVisualization.tsx
│   │   │   └── WaveDerivativeVisualization.tsx
│   │   ├── utils/          # 유틸리티 함수
│   │   │   └── derivative.ts
│   │   ├── App.tsx         # 메인 앱
│   │   └── index.css       # 전역 스타일
│   └── package.json
│
├── backend/                 # Node.js API 서버
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   │   ├── problems.js
│   │   │   └── lms.js
│   │   ├── config/         # 설정 파일
│   │   │   ├── database.js
│   │   │   ├── schema.sql
│   │   │   └── initDb.js
│   │   └── server.js       # Express 서버
│   └── package.json
│
└── README.md
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 또는 yarn

### 2. PostgreSQL 데이터베이스 설정

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE wave_derivative;

# 종료
\q
```

### 3. Backend 설정

```bash
cd backend

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보 입력

# 의존성 설치
npm install

# 데이터베이스 초기화 (테이블 생성 및 샘플 데이터 삽입)
npm run init-db

# 서버 실행
npm start
# 또는 개발 모드 (자동 재시작)
npm run dev
```

서버가 실행되면: http://localhost:3001

### 4. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 열기: http://localhost:5173

## 🎮 사용 방법

### 웹앱 사용

1. **함수 선택**: 화면 상단에서 8가지 수학 함수 중 하나를 선택
2. **그래프 흔들기**: 우측 하단 스마트폰 화면의 그래프를 마우스로 드래그
3. **미분 관찰**: 흔들기 강도에 따라 미분 파형이 실시간으로 표시됨
4. **학습**: 각 지점에서의 변화율을 직관적으로 이해

### API 엔드포인트

#### 문제 관리
- `GET /api/problems` - 모든 문제 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems/:id/attempt` - 새로운 시도 시작
- `POST /api/problems/:id/interaction` - 인터랙션 기록
- `PUT /api/problems/:id/attempt/:attemptId` - 시도 완료
- `GET /api/problems/:id/analytics` - 문제 분석 데이터

#### LMS 연동
- `POST /api/lms/sync-student` - 학생 정보 동기화
- `GET /api/lms/student/:moodleUserId` - 학생 조회
- `GET /api/lms/student/:moodleUserId/progress` - 학습 진도 조회
- `POST /api/lms/grade-export` - 성적 내보내기
- `POST /api/lms/webhook` - Moodle 웹훅 수신
- `GET /api/lms/modules` - 모듈 목록 조회

## 🔗 Moodle LMS 연동

### Moodle 설정

1. **웹 서비스 활성화**
   - Site administration → Advanced features → Enable web services

2. **토큰 생성**
   - Site administration → Server → Web services → Manage tokens
   - 새 토큰 생성 후 `.env` 파일에 추가

3. **외부 서비스 설정**
   - Wave Derivative API 엔드포인트를 Moodle 외부 서비스로 등록

### API 통신 예시

```javascript
// 학생 정보 동기화
fetch('http://localhost:3001/api/lms/sync-student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    moodle_user_id: 12345,
    name: 'Kim Student',
    email: 'student@kaist.ac.kr',
    grade_level: 10
  })
});

// 학생 진도 조회
fetch('http://localhost:3001/api/lms/student/12345/progress')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **teachers** - 교사 정보
- **students** - 학생 정보 (Moodle 연동)
- **modules** - 학습 모듈
- **problems** - 수학 문제 (함수)
- **student_attempts** - 학생 시도 기록
- **student_interactions** - 상세 인터랙션 로그

### 샘플 데이터

초기화 시 자동으로 삽입되는 데이터:
- 교사 2명
- 모듈 2개 (기초/고급)
- 샘플 문제 4개

## 🎨 주요 컴포넌트

### SmartphoneFrame
우측 하단에 가상 스마트폰 화면을 표시하는 컴포넌트

### GraphVisualization
D3.js를 사용한 인터랙티브 수학 함수 그래프
- 마우스 드래그로 "흔들기" 감지
- 실시간 shake intensity 계산

### WaveDerivativeVisualization
미분값을 파형으로 시각화하는 컴포넌트
- 흔들기 강도에 따른 애니메이션
- 실시간 변화율 표시

## 🧮 지원 함수

| 함수 | 수식 | 미분 |
|------|------|------|
| Sine | sin(x) | cos(x) |
| Cosine | cos(x) | -sin(x) |
| Quadratic | x² | 2x |
| Cubic | x³ | 3x² |
| Polynomial | 0.1x³ - 0.5x² + x + 2 | 0.3x² - x + 1 |
| Exponential | e^(x/2) | 0.5·e^(x/2) |
| Logarithmic | ln(x) | 1/x |
| Tangent | tan(x) | sec²(x) |

## 🔧 환경 변수

### Backend (.env)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=wave_derivative
DB_USER=postgres
DB_PASSWORD=your_password

MOODLE_URL=http://your-moodle-instance.com
MOODLE_TOKEN=your_token

ALLOWED_ORIGINS=http://localhost:5173
```

## 📈 성능 최적화

- D3.js 렌더링 최적화
- PostgreSQL 인덱스 활용
- 실시간 애니메이션 requestAnimationFrame 사용
- React 컴포넌트 메모이제이션

## 🐛 문제 해결

### 데이터베이스 연결 실패
```bash
# PostgreSQL이 실행 중인지 확인
sudo systemctl status postgresql

# 데이터베이스 재생성
npm run init-db
```

### 포트 충돌
```bash
# 다른 포트 사용
PORT=3002 npm start
```

## 📝 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy

## 🙏 감사의 글

- D3.js 커뮤니티
- React 팀
- PostgreSQL 프로젝트
- Moodle 커뮤니티

---

**Note**: 이 프로젝트는 교육 목적의 수학 시각화 도구입니다. Moodle LMS와 연동하여 학생들의 미적분 학습을 돕습니다.
