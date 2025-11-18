# Triple Light Statistics Display System

웹앱, LMS와 연동해서 문제 정보를 받아 통계 핵심값(평균·중앙값·최빈값)을 3색 조명으로 표시하는 실시간 통계 시각화 시스템입니다.

## 🌟 주요 기능

- **3색 조명 시각화**: 평균(🔴), 중앙값(🟢), 최빈값(🔵)을 색상과 밝기로 표현
- **가상 스마트폰 화면**: 우측 하단에 실제 스마트폰과 같은 UI로 표시
- **Moodle LMS 연동**: MySQL 데이터베이스를 통한 실시간 퀴즈 통계 조회
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 환경 지원
- **실시간 업데이트**: 퀴즈 선택 시 즉시 통계 계산 및 시각화

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Moodle LMS    │────────▶│  Backend API     │────────▶│   Frontend      │
│   (MySQL 5.7)   │         │  (Node.js)       │         │   (React)       │
│                 │         │                  │         │                 │
│ - Quiz data     │         │ - Data fetching  │         │ - Smartphone UI │
│ - Attempts      │         │ - Stats calc     │         │ - Triple Light  │
│ - Grades        │         │ - REST API       │         │ - Animations    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** - 빠른 개발 서버
- **CSS3** - 애니메이션 및 3D 효과
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js 18+**
- **Express.js** - REST API 프레임워크
- **mysql2** - MySQL 클라이언트
- **dotenv** - 환경 변수 관리

### Database
- **MySQL 5.7** (Moodle 데이터베이스)

## 📋 시스템 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- MySQL 5.7 (Moodle 데이터베이스 접근 권한)
- 최소 2GB RAM
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 🚀 설치 및 실행

### 1. 프로젝트 클론

```bash
cd triple-light-stats
```

### 2. 백엔드 설정

```bash
cd backend
npm install
```

환경 변수 설정:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173

# Moodle Configuration
MOODLE_PREFIX=mdl_
```

백엔드 서버 실행:

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 3. 프론트엔드 설정

새 터미널에서:

```bash
cd frontend
npm install
```

환경 변수 설정:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
VITE_API_URL=http://localhost:3001
```

프론트엔드 개발 서버 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

## 📱 사용 방법

1. **퀴즈 선택**: 상단의 드롭다운에서 Moodle 퀴즈를 선택합니다.
2. **통계 확인**: 선택한 퀴즈의 통계가 자동으로 계산됩니다.
3. **조명 확인**: 우측 하단 스마트폰 화면에서 3색 조명을 확인합니다.
   - 🔴 **빨강**: 평균 점수
   - 🟢 **초록**: 중앙값
   - 🔵 **파랑**: 최빈값
4. **밝기 해석**: 조명의 밝기는 점수의 상대적 크기를 나타냅니다.

## 🎨 UI 설명

### 메인 화면
- 퀴즈 선택 드롭다운
- 통계 요약 카드 (평균, 중앙값, 최빈값, 응시자 수)

### 스마트폰 화면 (우측 하단)
- 3D 스마트폰 프레임
- Triple Light 조명판
- 각 조명별 수치 표시
- 추가 통계 정보 (최저/최고 점수)

## 🔌 API 엔드포인트

### GET `/api/health`
서버 상태 확인

### GET `/api/quizzes`
Moodle 퀴즈 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Week 1 Math Quiz",
      "courseName": "Mathematics 101",
      "attemptCount": 45
    }
  ]
}
```

### GET `/api/stats/:quizId`
특정 퀴즈의 통계 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": 1,
    "quizName": "Week 1 Math Quiz",
    "statistics": {
      "mean": 75.4,
      "median": 78.0,
      "mode": 82.0,
      "count": 45,
      "min": 42.0,
      "max": 98.0,
      "normalized": {
        "mean": 59.6,
        "median": 64.3,
        "mode": 71.4
      }
    }
  }
}
```

## 🔧 통계 계산 방식

### 평균 (Mean)
```
mean = (모든 점수의 합) / (점수 개수)
```

### 중앙값 (Median)
1. 점수를 오름차순 정렬
2. 홀수 개: 중간 값
3. 짝수 개: 중간 두 값의 평균

### 최빈값 (Mode)
1. 각 점수의 빈도 계산 (0.1점 단위로 반올림)
2. 가장 빈도가 높은 값 반환
3. 최빈값이 여러 개면 최댓값 반환
4. 모든 값이 1회씩 나타나면 중앙값 반환

### 정규화 (Normalization)
조명 밝기용 0-100 스케일 변환:
```
normalized = ((값 - 최솟값) / (최댓값 - 최솟값)) * 100
```

## 📂 프로젝트 구조

```
triple-light-stats/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MySQL 연결
│   │   ├── controllers/
│   │   │   └── statsController.js   # API 컨트롤러
│   │   ├── services/
│   │   │   ├── moodleService.js     # Moodle DB 쿼리
│   │   │   └── statsService.js      # 통계 계산
│   │   ├── middleware/
│   │   │   └── errorHandler.js      # 에러 처리
│   │   └── server.js                # Express 서버
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SmartphoneFrame.tsx  # 스마트폰 UI
│   │   │   ├── TripleLight.tsx      # 3색 조명
│   │   │   ├── StatsDisplay.tsx     # 통계 표시
│   │   │   └── QuizSelector.tsx     # 퀴즈 선택
│   │   ├── services/
│   │   │   └── api.ts               # API 클라이언트
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript 타입
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docs/
│   └── triple-light-architecture.md
└── README.md
```

## 🔒 보안 고려사항

- **읽기 전용 DB 계정**: Moodle 데이터베이스에는 읽기 권한만 부여
- **환경 변수**: 민감한 정보는 `.env` 파일에 저장 (Git에서 제외)
- **CORS 설정**: 허용된 도메인만 API 접근 가능
- **입력 검증**: 모든 사용자 입력 검증 및 sanitization
- **에러 처리**: 프로덕션 환경에서 내부 에러 정보 노출 방지

## 🚢 프로덕션 배포

### 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist/` 폴더에 생성됩니다.

### 백엔드 프로덕션 실행

```bash
cd backend
NODE_ENV=production node src/server.js
```

또는 PM2 사용:

```bash
npm install -g pm2
pm2 start src/server.js --name triple-light-api
```

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/triple-light-stats/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 문제 해결

### 백엔드 서버가 시작되지 않음

1. MySQL 연결 정보 확인:
   ```bash
   mysql -h localhost -u moodle_user -p
   ```

2. `.env` 파일 설정 확인

3. 포트 3001이 사용 중인지 확인:
   ```bash
   lsof -i :3001
   ```

### 프론트엔드에서 API 연결 실패

1. 백엔드 서버가 실행 중인지 확인
2. CORS 설정 확인 (backend `.env`의 `ALLOWED_ORIGINS`)
3. 브라우저 콘솔에서 네트워크 에러 확인

### 퀴즈 목록이 비어있음

1. Moodle 데이터베이스에 퀴즈가 있는지 확인:
   ```sql
   SELECT * FROM mdl_quiz WHERE visible = 1;
   ```

2. 데이블 prefix 확인 (`mdl_` 또는 다른 prefix)

### 통계가 표시되지 않음

1. 퀴즈에 완료된 시도가 있는지 확인:
   ```sql
   SELECT * FROM mdl_quiz_grades WHERE quiz = 1;
   ```

2. 브라우저 개발자 도구의 Console 탭에서 에러 확인

## 📝 라이선스

MIT License

## 👥 개발팀

AI Education System Team

## 📧 지원

문제가 발생하면 GitHub Issues에 등록해주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Moodle Compatibility**: 3.7+
**MySQL Version**: 5.7+
**PHP Version**: 7.1.9+ (Moodle용)
