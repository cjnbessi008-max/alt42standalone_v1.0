# LMS Focus Mode - 집중력 향상 학습 플랫폼

독립형 웹 기반 학습 관리 시스템으로, 문제 풀이 시 집중력을 높이기 위한 시각 효과 조절 기능을 제공합니다.

## 🎯 주요 기능

### 📚 퀴즈 시스템
- 객관식 문제 풀이
- 실시간 타이머
- 진행률 표시
- 즉시 채점 및 결과 확인

### 🎨 집중 모드
- **블러 효과**: 주변 요소 흐림 처리 (0-10 단계 조절)
- **디밍 효과**: 화면 어둡기 조절 (0-100% 조절)
- **요소 숨김**: 타이머, 점수, 네비게이션 선택적 숨김
- **전체화면 모드**: 몰입도 극대화
- **테마 선택**: 라이트/다크/자동 모드

### ⚙️ 개인화 설정
- 사용자별 집중 모드 설정 저장
- 실시간 설정 변경 및 적용
- 설정 초기화 기능

## 🛠️ 기술 스택

### Backend
- **Node.js 18** + Express
- **MySQL 5.7** - 관계형 데이터베이스
- **RESTful API** 아키텍처

### Frontend
- **React 18** + TypeScript
- **Styled Components** - CSS-in-JS
- **Axios** - HTTP 클라이언트

### DevOps
- **Docker** + Docker Compose
- 개발 환경 자동화

## 📋 시스템 요구사항

- **Node.js**: 18.x 이상
- **Docker**: 20.x 이상
- **Docker Compose**: 2.x 이상
- **브라우저**: Chrome, Firefox, Safari 최신 버전

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Docker로 실행 (권장)

```bash
# 환경 변수 파일 생성
cp .env.example .env

# Docker Compose로 모든 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스가 시작되면:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306

### 3. 로컬 개발 환경 (선택사항)

#### Backend 실행

```bash
cd backend

# 의존성 설치
npm install

# MySQL 5.7이 localhost:3306에서 실행 중이어야 함
# 데이터베이스 초기화는 init.sql 참고

# 개발 서버 실행
npm run dev
```

#### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 정보 (학생, 교사, 관리자)
- **quizzes**: 퀴즈 메타데이터
- **questions**: 문제 정보
- **answer_options**: 선택지
- **quiz_attempts**: 퀴즈 시도 기록
- **user_answers**: 사용자 답안
- **focus_settings**: 집중 모드 개인 설정

초기 데이터가 자동으로 생성됩니다:
- 테스트 사용자 3명 (교사 1명, 학생 2명)
- 샘플 퀴즈 2개
- 샘플 문제 5개

## 🎮 사용 방법

### 1. 퀴즈 선택
- 메인 화면에서 원하는 퀴즈 카드 클릭
- 퀴즈 정보 확인 (문제 수, 제한 시간, 합격 점수)

### 2. 퀴즈 풀기
- **집중 모드 ON/OFF**: 상단 버튼으로 토글
- **답안 선택**: 선택지를 클릭하여 답 선택
- **네비게이션**: 이전/다음 버튼으로 문제 이동
- **제출**: 모든 문제를 풀고 제출 버튼 클릭

### 3. 집중 모드 설정
- 우측 상단 **⚙️ 설정** 버튼 클릭
- 원하는 옵션 조절:
  - 블러 강도 조절
  - 화면 어둡기 조절
  - UI 요소 표시/숨김
  - 테마 선택
- **저장** 버튼으로 설정 저장

### 4. 결과 확인
- 총점, 획득 점수, 정답률 확인
- 문제별 정답/오답 상세 보기
- 틀린 문제의 정답 확인

## 🎨 집중 모드 효과

### 블러 효과 (Blur)
```typescript
blur_intensity: 0-10
// 주변 요소에 블러 필터 적용
// 높을수록 강한 블러 효과
```

### 디밍 효과 (Dim)
```typescript
dim_opacity: 0-100
// 화면에 어두운 오버레이 적용
// 높을수록 화면이 어두워짐
```

### 전체화면 모드
```typescript
fullscreen_mode: true/false
// 집중 모드 활성화 시 자동으로 전체화면 진입
// ESC 키로 전체화면 종료 가능
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.js      # MySQL 연결 풀
│   │   │   └── init.sql           # 스키마 & 샘플 데이터
│   │   ├── routes/
│   │   │   ├── quiz.js            # 퀴즈 API
│   │   │   ├── focus.js           # 집중 모드 API
│   │   │   └── user.js            # 사용자 API
│   │   └── server.js              # Express 서버
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FocusMode/
│   │   │   │   └── FocusMode.tsx  # 집중 모드 래퍼
│   │   │   ├── Quiz/
│   │   │   │   ├── QuizList.tsx   # 퀴즈 목록
│   │   │   │   ├── QuizTaking.tsx # 퀴즈 풀이
│   │   │   │   └── QuizResults.tsx# 결과 화면
│   │   │   └── Settings/
│   │   │       └── FocusSettings.tsx # 설정 모달
│   │   ├── services/
│   │   │   └── api.ts             # API 클라이언트
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript 타입
│   │   ├── App.tsx                # 메인 앱
│   │   └── index.tsx              # 엔트리 포인트
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔌 API 엔드포인트

### Quiz API

```
GET    /api/quizzes              # 모든 퀴즈 조회
GET    /api/quizzes/:id          # 퀴즈 상세 조회
POST   /api/quizzes/:id/start    # 퀴즈 시작
POST   /api/quizzes/attempts/:attemptId/answer    # 답안 제출
POST   /api/quizzes/attempts/:attemptId/complete  # 퀴즈 완료
GET    /api/quizzes/attempts/:attemptId/results   # 결과 조회
```

### Focus API

```
GET    /api/focus/:userId        # 집중 모드 설정 조회
PUT    /api/focus/:userId        # 집중 모드 설정 업데이트
DELETE /api/focus/:userId        # 설정 초기화
```

### User API

```
GET    /api/users                # 모든 사용자 조회
GET    /api/users/:id            # 사용자 조회
GET    /api/users/:id/history    # 퀴즈 히스토리 조회
```

## 🧪 테스트

### 샘플 데이터

초기 데이터베이스에 포함된 샘플:

**사용자**:
- 교사: teacher@example.com (ID: 1)
- 학생1: student1@example.com (ID: 2)
- 학생2: student2@example.com (ID: 3)

**퀴즈**:
1. 수학 기초 테스트 (3문제, 20분)
2. 영어 어휘 퀴즈 (2문제, 10분)

## 🎯 집중 모드 사용 시나리오

### 시나리오 1: 최대 집중
- 블러: 10
- 디밍: 80%
- 타이머 숨김: ON
- 점수 숨김: ON
- 네비게이션 숨김: ON
- 전체화면: ON

**효과**: 문제와 답만 보이는 극도의 집중 환경

### 시나리오 2: 균형 모드
- 블러: 5
- 디밍: 50%
- 타이머 숨김: OFF
- 점수 숨김: OFF
- 네비게이션 숨김: OFF
- 전체화면: ON

**효과**: 진행 상황을 확인하면서 집중

### 시나리오 3: 최소 효과
- 블러: 2
- 디밍: 30%
- 모든 UI 표시
- 전체화면: OFF

**효과**: 약간의 시각적 강조만 적용

## 🔧 환경 변수

### Backend (.env)

```env
DB_HOST=localhost          # MySQL 호스트
DB_USER=lmsuser           # MySQL 사용자
DB_PASSWORD=lmspassword   # MySQL 비밀번호
DB_NAME=lms_focus         # 데이터베이스 이름
DB_PORT=3306              # MySQL 포트
PORT=3001                 # 백엔드 서버 포트
NODE_ENV=development      # 환경 (development/production)
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001  # 백엔드 API URL
```

## 🐛 문제 해결

### Docker 컨테이너가 시작되지 않을 때

```bash
# 모든 컨테이너 중지 및 제거
docker-compose down

# 볼륨까지 제거
docker-compose down -v

# 다시 시작
docker-compose up -d
```

### MySQL 연결 오류

```bash
# MySQL 컨테이너 로그 확인
docker-compose logs mysql

# MySQL 컨테이너 재시작
docker-compose restart mysql
```

### 프론트엔드 빌드 오류

```bash
# node_modules 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🚀 배포

### 프로덕션 빌드

```bash
# Frontend 빌드
cd frontend
npm run build

# Backend는 별도 설정 없이 실행 가능
```

### 환경 변수 설정

프로덕션 환경에서는:
- `NODE_ENV=production`
- 강력한 데이터베이스 비밀번호 사용
- HTTPS 설정
- CORS 설정 검토

## 📝 향후 개발 계획

- [ ] 사용자 인증 시스템 (로그인/회원가입)
- [ ] 교사용 퀴즈 생성 인터페이스
- [ ] 학습 통계 및 분석 대시보드
- [ ] Moodle/Canvas LTI 연동
- [ ] 다양한 문제 유형 (서술형, 코딩 문제 등)
- [ ] 실시간 멀티플레이어 퀴즈
- [ ] 모바일 앱 개발

## 📄 라이선스

MIT License

## 👥 기여

기여는 언제나 환영합니다! Pull Request를 보내주세요.

## 📧 문의

문제가 있거나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for better learning experience**
