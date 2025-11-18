# Place Stair - 자리값 학습 앱

<div align="center">

![Place Stair](https://img.shields.io/badge/Place_Stair-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)

**자리값의 의미를 빛 계단으로 시각화하여 학습하는 교육용 웹앱**

[English](#english-version) | [한국어](#korean-version)

</div>

---

## 📱 프로젝트 개요

Place Stair는 수학 교육에서 자리값(Place Value) 개념을 시각적으로 학습할 수 있도록 설계된 독립형 웹 애플리케이션입니다.
각 자리수를 빛으로 표현되는 "계단"으로 시각화하여, 학생들이 직관적으로 자리값의 크기와 의미를 이해할 수 있습니다.

### ✨ 주요 기능

- 🎨 **빛 계단 시각화**: 일의 자리, 십의 자리, 백의 자리를 LED 효과가 있는 계단으로 표현
- 📱 **스마트폰 UI**: 우측 하단에 표시되는 가상 스마트폰 화면
- 🎯 **다양한 문제 유형**:
  - 자리값 식별 (Identification)
  - 자리값 합성 (Composition)
  - 자리값 분해 (Decomposition)
  - 숫자 크기 비교 (Comparison)
- 💡 **힌트 시스템**: 단계별 힌트 제공
- 🏆 **실시간 피드백**: 즉각적인 정답/오답 피드백과 설명
- 📊 **진행도 추적**: 문제 해결 진행도 및 점수 표시
- 🔗 **Moodle LMS 연동**: Moodle 3.7과 API 통신 지원

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  - Smartphone Frame UI                              │
│  - Place Stair Visualization (Canvas)               │
│  - Problem Display & Interaction                    │
└────────────────┬────────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────────┐
│              Backend (Node.js/Express)              │
│  - Problem Generator                                │
│  - Answer Validation                                │
│  - Moodle API Integration                           │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│          Moodle LMS (MySQL 5.7, PHP 7.1.9)         │
│  - Student Management                               │
│  - Progress Tracking                                │
│  - Grade Recording                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 시작하기

### 📋 필수 조건

- **Node.js**: 16.x 이상
- **npm** 또는 **yarn**
- **MySQL**: 5.7 (Moodle 연동 시)
- **Moodle**: 3.7 (선택사항)

### 📦 설치

1. **저장소 클론**

```bash
git clone <repository-url>
cd place-stair-app
```

2. **Backend 설정**

```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 Moodle 연결 정보 입력
```

3. **Frontend 설정**

```bash
cd ../frontend
npm install
```

### ⚙️ 환경 설정

Backend `.env` 파일 설정:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MySQL Database (Moodle)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=your_password

# Moodle Configuration
MOODLE_URL=http://localhost/moodle
MOODLE_API_TOKEN=your_webservice_token

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 🏃 실행

**개발 모드 실행:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.
Backend API는 `http://localhost:3001`에서 실행됩니다.

### 🏗️ 프로덕션 빌드

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📂 프로젝트 구조

```
place-stair-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express 서버 진입점
│   │   ├── routes/
│   │   │   └── problemRoutes.ts  # API 라우트
│   │   ├── services/
│   │   │   ├── moodleService.ts  # Moodle API 통신
│   │   │   └── problemGenerator.ts # 문제 생성 로직
│   │   └── types/
│   │       └── index.ts          # TypeScript 타입 정의
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlaceStair.tsx    # 빛 계단 시각화
│   │   │   ├── SmartphoneFrame.tsx # 스마트폰 프레임
│   │   │   ├── ProblemDisplay.tsx  # 문제 표시
│   │   │   └── FeedbackModal.tsx   # 피드백 모달
│   │   ├── services/
│   │   │   └── api.ts            # API 클라이언트
│   │   ├── types/
│   │   │   └── index.ts          # 타입 정의
│   │   ├── styles/
│   │   │   └── global.css        # 전역 스타일
│   │   ├── App.tsx               # 메인 앱 컴포넌트
│   │   └── main.tsx              # React 진입점
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🎮 사용 방법

### 학생 사용자

1. 웹 브라우저에서 앱에 접속
2. 우측 하단의 스마트폰 화면에 표시되는 문제 확인
3. 빛 계단 시각화를 보며 자리값 이해
4. 문제 유형에 따라 답 입력:
   - **자리값 식별**: 각 자리의 값을 입력
   - **자리값 합성**: 최종 숫자 입력
   - **자리값 분해**: 각 자리수로 분해하여 입력
   - **크기 비교**: 더 큰 숫자 선택
5. 💡 힌트가 필요하면 "힌트 보기" 버튼 클릭
6. "정답 확인" 버튼으로 답 제출
7. 피드백 확인 후 다음 문제로 진행

### 교사/관리자

- Moodle LMS에서 학생 진행도 및 성적 확인
- 문제 난이도 및 범위 설정 (API 파라미터 조정)

---

## 🔌 API 엔드포인트

### 문제 생성

```http
GET /api/problems/generate?minValue=1&maxValue=999&difficulty=1&count=10
```

### Moodle에서 문제 가져오기

```http
GET /api/problems/moodle/:studentId/:courseId
```

### 답안 검증

```http
POST /api/problems/validate
Content-Type: application/json

{
  "problem": { ... },
  "answer": { "ones": 5, "tens": 40, "hundreds": 300 }
}
```

### Moodle에 답안 제출

```http
POST /api/problems/submit
Content-Type: application/json

{
  "studentId": 123,
  "problemId": 1,
  "answer": { ... },
  "isCorrect": true,
  "timeSpent": 45
}
```

### 학생 진행도 조회

```http
GET /api/problems/progress/:studentId/:courseId
```

---

## 🎨 기술 스택

### Frontend
- **React 18.2** - UI 라이브러리
- **TypeScript 5.1** - 타입 안정성
- **Vite 4.4** - 빌드 도구
- **HTML5 Canvas** - 빛 계단 시각화
- **CSS3** - 스타일링 및 애니메이션
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js** - 런타임
- **Express 4.18** - 웹 프레임워크
- **TypeScript 5.1** - 타입 안정성
- **MySQL2** - MySQL 데이터베이스 연결
- **Axios** - Moodle API 통신

### 외부 연동
- **Moodle 3.7** - LMS 플랫폼
- **MySQL 5.7** - 데이터베이스
- **PHP 7.1.9** - Moodle 서버

---

## 🎓 교육학적 접근

### 자리값(Place Value) 학습

Place Stair는 다음과 같은 교육학적 원리를 기반으로 설계되었습니다:

1. **시각화 (Visualization)**: 추상적인 자리값 개념을 구체적인 계단과 빛으로 표현
2. **단계적 학습 (Scaffolding)**: 식별 → 합성 → 분해 → 비교 순으로 난이도 증가
3. **즉각적 피드백 (Immediate Feedback)**: 학습 효과 극대화
4. **힌트 시스템**: 학생이 스스로 문제를 해결할 수 있도록 지원
5. **게이미피케이션**: 진행도, 점수, 애니메이션으로 동기 부여

### 대상 학년

- 초등학교 1~3학년 (자리값 개념 도입)
- 초등학교 4~6학년 (자리값 개념 강화)

---

## 🔧 커스터마이징

### 문제 난이도 조정

`backend/src/services/problemGenerator.ts`에서 문제 생성 로직 수정:

```typescript
// 난이도별 숫자 범위 조정
const config = {
  minValue: 1,      // 최소값
  maxValue: 999,    // 최대값 (1~999: 3자리, 1~9999: 4자리)
  difficulty: 1,    // 1~5 (낮음~높음)
  count: 10         // 문제 수
};
```

### 시각화 색상 변경

`frontend/src/components/PlaceStair.tsx`의 `StairConfig`:

```typescript
const places: StairConfig[] = [
  { place: 'thousands', color: '#9333ea', label: '천' },
  { place: 'hundreds',  color: '#3b82f6', label: '백' },
  { place: 'tens',      color: '#10b981', label: '십' },
  { place: 'ones',      color: '#f59e0b', label: '일' }
];
```

---

## 🐛 문제 해결

### 백엔드가 시작되지 않는 경우

```bash
# 포트가 이미 사용 중인지 확인
lsof -ti:3001

# .env 파일이 올바르게 설정되었는지 확인
cat backend/.env
```

### Moodle 연동 오류

1. Moodle Web Service가 활성화되어 있는지 확인
2. API 토큰이 올바른지 확인
3. 필요한 웹 서비스 함수가 등록되어 있는지 확인:
   - `local_placeStair_get_problems`
   - `local_placeStair_submit_answer`
   - `local_placeStair_get_progress`

### 프론트엔드 빌드 오류

```bash
# 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👥 개발팀

**KAIST Touch Math Academy**

- 프로젝트 관리: AI Education System Pipeline
- 기술 지원: Claude AI Agent

---

## 📞 연락처

문의사항이나 버그 리포트는 이슈 트래커를 이용해주세요.

---

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일환으로 개발되었습니다.

---

<div align="center">

Made with ❤️ for better education

**[⬆ 맨 위로](#place-stair---자리값-학습-앱)**

</div>
