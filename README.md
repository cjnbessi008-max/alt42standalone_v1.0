# Triangle Mirror

**Triangle Mirror**는 Moodle LMS와 연동하여 기하학 문제의 유사 삼각형 구조를 자동으로 감지하고 강조 표시하는 교육용 웹 애플리케이션입니다.

## 🎯 주요 기능

- **Moodle LMS 연동**: Moodle 3.7과 MySQL 5.7 데이터베이스 통합
- **유사 삼각형 자동 감지**: SSS, SAS, AA 기준을 사용한 삼각형 유사성 분석
- **인터랙티브 시각화**: SVG 기반의 반응형 삼각형 시각화
- **가상 스마트폰 UI**: 우측 하단에 모바일 앱 화면 시뮬레이션
- **실시간 강조**: 클릭 시 유사한 삼각형 자동 강조

## 🏗️ 기술 스택

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - REST API
- **PostgreSQL 15+** - 메인 데이터베이스
- **MySQL 5.7** - Moodle 데이터베이스 연동 (읽기 전용)
- **WebSocket** - 실시간 업데이트

### Frontend
- **React 18** + **TypeScript**
- **Material-UI (MUI)** - UI 컴포넌트
- **Zustand** - 상태 관리
- **Framer Motion** - 애니메이션
- **D3.js** - 데이터 시각화
- **Vite** - 빌드 도구

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 설정:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
# Server
NODE_ENV=development
PORT=3001

# PostgreSQL (메인 데이터베이스)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triangle_mirror
DB_USER=postgres
DB_PASSWORD=your_password

# MySQL (Moodle 데이터베이스)
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle
MOODLE_DB_PASSWORD=your_mysql_password

# Moodle API
MOODLE_URL=http://your-moodle-instance.com
MOODLE_API_TOKEN=your_webservice_token

# Security
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. 의존성 설치

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 4. 데이터베이스 설정

#### PostgreSQL 데이터베이스 생성

```bash
createdb triangle_mirror
```

서버를 처음 실행하면 자동으로 테이블이 생성됩니다.

#### Moodle MySQL 데이터베이스

기존 Moodle 3.7 데이터베이스에 읽기 전용 액세스 권한 설정:

```sql
GRANT SELECT ON moodle.* TO 'triangle_app'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

### 5. 애플리케이션 실행

```bash
# Root 디렉토리에서 (서버와 클라이언트 동시 실행)
npm run dev
```

또는 개별 실행:

```bash
# 서버만 실행
cd server
npm run dev

# 클라이언트만 실행
cd client
npm run dev
```

## 🚀 사용 방법

### 1. Moodle에서 임베드

Moodle 활동 또는 리소스에 iframe으로 임베드:

```html
<iframe
  src="http://localhost:3000?questionId=123"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

### 2. 독립 실행

브라우저에서 직접 접속:

```
http://localhost:3000
```

데모 문제가 자동으로 로드됩니다.

## 📡 API 엔드포인트

### Moodle 통합

```
GET  /api/moodle/questions/:courseId     - 코스의 문제 목록
GET  /api/moodle/question/:questionId    - 특정 문제 상세
POST /api/moodle/auth                    - Moodle 인증
GET  /api/moodle/user/:userId            - 사용자 정보
```

### 문제 관리

```
POST   /api/problems                      - 새 문제 생성
GET    /api/problems/:id                  - 문제 조회
GET    /api/problems/moodle/:moodleId     - Moodle ID로 문제 조회
PUT    /api/problems/:id                  - 문제 수정
DELETE /api/problems/:id                  - 문제 삭제
```

### 삼각형 분석

```
POST /api/triangles/detect               - 삼각형 감지 및 분석
GET  /api/triangles/problem/:problemId   - 문제의 삼각형 목록
GET  /api/triangles/similar/:problemId   - 유사 삼각형 그룹
POST /api/triangles/analyze              - 두 삼각형 비교
```

## 🔍 유사 삼각형 감지 알고리즘

Triangle Mirror는 3가지 기준으로 유사 삼각형을 감지합니다:

### 1. SSS (Side-Side-Side)
세 변의 비율이 모두 같은 경우

```typescript
ratio1 = side1_A / side1_B
ratio2 = side2_A / side2_B
ratio3 = side3_A / side3_B

if (ratio1 ≈ ratio2 ≈ ratio3) → Similar
```

### 2. SAS (Side-Angle-Side)
두 변의 비율과 그 사이 각이 같은 경우

```typescript
ratio1 = side1_A / side1_B
ratio2 = side2_A / side2_B
angle_A ≈ angle_B

if (ratio1 ≈ ratio2 && angle_A ≈ angle_B) → Similar
```

### 3. AA (Angle-Angle)
두 각이 같은 경우 (세 번째 각은 자동으로 같음)

```typescript
if (angle1_A ≈ angle1_B && angle2_A ≈ angle2_B) → Similar
```

## 🎨 UI 컴포넌트

### 주요 컴포넌트

- **TriangleMirror**: 메인 문제 표시 및 분석 결과
- **TriangleVisualization**: SVG 기반 삼각형 시각화
- **SmartphoneFrame**: 우측 하단 가상 스마트폰 화면
- **triangleStore**: Zustand 상태 관리

## 🔧 개발

### 프로젝트 구조

```
alt42standalone_v1.0/
├── client/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── store/           # Zustand 상태 관리
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                  # Node.js 백엔드
│   ├── src/
│   │   ├── config/          # 설정 파일
│   │   ├── middleware/      # Express 미들웨어
│   │   ├── routes/          # API 라우트
│   │   ├── services/        # 비즈니스 로직
│   │   └── index.ts
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

### 테스트

```bash
# 서버 테스트
cd server
npm test

# 클라이언트 테스트
cd client
npm test
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🔌 Moodle Web Service 설정

### 1. Moodle 웹 서비스 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **관리**
2. "웹 서비스 활성화" 체크
3. 프로토콜로 **REST** 선택

### 2. 외부 서비스 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. "추가" 클릭
3. 이름: `triangle_mirror_service`
4. 필요한 기능 추가:
   - `core_question_get_questions`
   - `core_webservice_get_site_info`
   - `core_user_get_users`

### 3. 토큰 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
2. 사용자 선택 및 서비스 선택
3. 생성된 토큰을 `.env`의 `MOODLE_API_TOKEN`에 복사

## 📱 스마트폰 UI 기능

우측 하단 가상 스마트폰 화면은:

- 실제 모바일 앱 경험 시뮬레이션
- 메인 화면과 동기화된 삼각형 시각화
- 터치 인터랙션 시뮬레이션
- 반응형 디자인

## 🤝 기여

기여를 환영합니다! Pull Request를 제출하거나 Issue를 열어주세요.

## 📄 라이선스

MIT License

## 👥 개발자

KAIST Touch Math Academy

## 📞 지원

문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.
