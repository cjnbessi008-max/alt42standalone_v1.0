# Real Line Panorama

**실수 범위 전체를 시각적으로 압축해 보여주는 독립형 웹앱**

Real Line Panorama는 수학 교육을 위한 인터랙티브 실수 직선 시각화 도구입니다. Moodle LMS와 연동하여 문제를 받아오고, 우측 하단 가상 스마트폰 화면에서 실수 직선을 탐색하며 답을 찾을 수 있습니다.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node](https://img.shields.io/badge/Node.js-18+-339933)
![MySQL](https://img.shields.io/badge/MySQL-5.7-4479a1)

## 🎯 주요 기능

- **실수 직선 파노라마**: 무한대의 실수를 유한한 화면에 압축하여 표시
- **줌/팬 기능**: 마우스 드래그와 휠로 자유롭게 실수 직선 탐색
- **Moodle LMS 연동**: Moodle에서 문제 정보를 받아와 동작
- **가상 스마트폰 화면**: 우측 하단에 실제 스마트폰처럼 보이는 UI
- **실시간 피드백**: 답변 제출 후 즉시 정답 여부 확인

## 📋 시스템 요구사항

- **Node.js**: 18.x 이상
- **MySQL**: 5.7 (Moodle 호환)
- **PHP**: 7.1.9 (Moodle)
- **Moodle**: 3.7

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/real-line-panorama.git
cd real-line-panorama
```

### 2. Frontend 설정

```bash
cd frontend
npm install
cp .env.example .env
# .env 파일 편집하여 API URL 설정
npm run dev
```

Frontend는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 3. Backend 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 편집하여 MySQL 및 Moodle 설정
npm run dev
```

Backend API는 기본적으로 `http://localhost:5000`에서 실행됩니다.

### 4. 환경 변수 설정

**Backend `.env` 파일:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database (Moodle)
DB_HOST=localhost
DB_PORT=3306
DB_USER=moodleuser
DB_PASSWORD=your_password
DB_NAME=moodle

# Moodle Configuration
MOODLE_URL=http://localhost/moodle
MOODLE_TOKEN=your_moodle_webservice_token

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Frontend `.env` 파일:**

```env
VITE_API_URL=http://localhost:5000/api
VITE_MOODLE_URL=http://localhost/moodle
```

## 🏗️ 프로젝트 구조

```
real-line-panorama/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   │   ├── SmartphoneFrame/     # 가상 스마트폰 프레임
│   │   │   ├── RealLinePanorama/    # 실수 직선 시각화
│   │   │   └── MoodleConnector/     # Moodle 연동
│   │   ├── services/         # API 서비스
│   │   ├── utils/            # 유틸리티 함수
│   │   ├── types/            # TypeScript 타입
│   │   ├── App.tsx           # 메인 앱 컴포넌트
│   │   └── main.tsx          # 진입점
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── config/           # 설정 (데이터베이스 등)
│   │   ├── routes/           # API 라우트
│   │   ├── controllers/      # 컨트롤러
│   │   ├── services/         # 비즈니스 로직
│   │   └── index.js          # 진입점
│   └── package.json
│
├── tasks/                    # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md                 # 이 파일
```

## 🎮 사용 방법

### 1. Moodle에서 문제 불러오기

가상 스마트폰 화면의 "Moodle Connection" 섹션에서:

- **Question ID 입력**: 특정 문제 번호를 입력하고 "Load" 클릭
- **랜덤 문제**: "Load Random Question" 버튼 클릭

### 2. 실수 직선 탐색

Real Line Panorama에서:

- **드래그**: 마우스로 드래그하여 실수 직선 이동
- **휠**: 마우스 휠로 줌 인/아웃
- **클릭**: 원하는 값을 클릭하여 선택
- **버튼**: "Zoom In", "Zoom Out", "Reset View" 버튼 사용

### 3. 답안 제출

- 실수 직선에서 값을 선택하면 "Your Answer" 섹션에 표시
- "Submit Answer" 버튼을 클릭하여 답안 제출
- 즉시 정답 여부와 피드백 확인

## 🔧 개발

### Frontend 개발

```bash
cd frontend
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm run lint     # 코드 린팅
```

### Backend 개발

```bash
cd backend
npm run dev      # 개발 서버 시작 (nodemon)
npm start        # 프로덕션 서버 시작
```

## 📊 기술 스택

### Frontend
- **React 18.2** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Canvas API** - 실수 직선 렌더링
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js 18+** - 런타임
- **Express** - 웹 프레임워크
- **MySQL 5.7** - 데이터베이스 (Moodle 호환)
- **mysql2** - MySQL 드라이버
- **CORS** - Cross-Origin Resource Sharing

## 🔌 Moodle 연동

### Moodle Web Services 활성화

1. Moodle 관리자 페이지 접속
2. **Site administration** → **Plugins** → **Web services** → **Manage protocols**
3. **REST protocol** 활성화
4. **Site administration** → **Plugins** → **Web services** → **External services**
5. 새로운 서비스 생성 및 토큰 발급
6. 토큰을 `.env` 파일에 설정

### 지원하는 Question Types

- **numerical**: 수치형 문제 (주요 지원)
- **calculated**: 계산형 문제
- 기타 문제 타입도 부분 지원

## 🧮 수학적 원리

### 실수 직선 압축

무한대의 실수 (-∞, +∞)를 유한한 화면에 표시하기 위해 `atan` 변환 사용:

```
compressed = atan(value)
```

이를 통해 실수 전체를 (-π/2, π/2) 구간으로 압축합니다.

### 역변환

```
value = tan(compressed)
```

## 📝 API 문서

### GET `/api/questions/:id`
특정 ID의 문제 가져오기

**Response:**
```json
{
  "id": 123,
  "name": "Find the number",
  "questiontext": "<p>Find 3.14...</p>",
  "qtype": "numerical",
  "questiondata": {
    "correctAnswer": 3.14,
    "tolerance": 0.01,
    "min": -10,
    "max": 10
  }
}
```

### GET `/api/questions/random`
랜덤 문제 가져오기

**Query Parameters:**
- `categoryId` (optional): 카테고리 ID

### POST `/api/questions/:id/submit`
답안 제출

**Request Body:**
```json
{
  "answer": 3.14
}
```

**Response:**
```json
{
  "correct": true,
  "feedback": "Correct! You answered 3.14..."
}
```

## 🐛 문제 해결

### MySQL 연결 실패
- MySQL 서버가 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- Moodle 데이터베이스 권한 확인

### CORS 오류
- Backend `.env`의 `CORS_ORIGIN` 확인
- Frontend URL이 올바른지 확인

### Moodle 토큰 오류
- Moodle Web Services가 활성화되었는지 확인
- 토큰이 유효한지 확인
- 토큰의 권한 확인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

## 👥 개발자

- **KAIST Touch Math Academy Team**

## 📧 문의

프로젝트 관련 문의사항은 이슈를 등록해 주세요.

---

**Made with ❤️ for Mathematics Education**
