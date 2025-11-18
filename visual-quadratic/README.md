# Visual Quadratic 📊

> 이차방정식의 포물선을 움직이며 근의 의미를 체감하는 인터랙티브 학습 웹앱

**Interactive parabola visualization for understanding quadratic equations**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 주요 기능 (Key Features)

### 📱 스마트폰 화면 UI (Smartphone Display)
- 우측 하단에 가상 스마트폰 화면 표시
- 모바일 환경 시뮬레이션

### 📈 실시간 포물선 시각화 (Real-time Parabola Visualization)
- Canvas 기반 고성능 그래프 렌더링
- 이차방정식 y = ax² + bx + c 실시간 표시
- 근(root), 꼭짓점(vertex) 자동 계산 및 표시

### 🎮 인터랙티브 조작 (Interactive Controls)
- a, b, c 계수 슬라이더로 조정
- 드래그로 포물선 이동
- 실시간 판별식(discriminant) 계산 및 설명

### 📚 문제 풀이 시스템 (Problem Solving System)
- 5단계 난이도별 15+ 문제
- 힌트 시스템
- 정확도 기반 자동 채점 (0-100점)
- 학생별 진도 추적

### 🔗 Moodle LMS 연동 (Moodle Integration)
- Moodle Web Services API 연동
- 학생 정보 자동 동기화
- 성적 리포트 (선택사항)

---

## 🏗️ 프로젝트 구조 (Project Structure)

```
visual-quadratic/
├── frontend/                 # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/      # UI 컴포넌트
│   │   │   ├── ParabolaCanvas.tsx   # 포물선 Canvas
│   │   │   ├── ControlPanel.tsx     # 조작 패널
│   │   │   └── SmartphoneFrame.tsx  # 스마트폰 프레임
│   │   ├── store/           # Zustand 상태 관리
│   │   ├── types/           # TypeScript 타입
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   │   ├── problems.ts      # 문제 관리
│   │   │   ├── progress.ts      # 진도 추적
│   │   │   ├── students.ts      # 학생 관리
│   │   │   └── moodle.ts        # Moodle 연동
│   │   ├── services/        # 비즈니스 로직
│   │   │   └── moodleService.ts
│   │   ├── config/          # 설정
│   │   │   └── database.ts
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/                 # PostgreSQL 스키마
│   ├── schema.sql           # 데이터베이스 스키마
│   ├── seed.sql             # 샘플 데이터
│   └── README.md
│
├── docker-compose.yml        # Docker Compose 설정
└── README.md                 # 이 파일
```

---

## 🚀 빠른 시작 (Quick Start)

### 방법 1: Docker Compose (추천)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd visual-quadratic

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 브라우저에서 열기
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# API Docs: http://localhost:4000/
```

### 방법 2: 수동 설치

#### Prerequisites
- Node.js 20+
- PostgreSQL 12+
- npm or yarn

#### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb visual_quadratic

# 스키마 적용
psql -d visual_quadratic -f database/schema.sql

# 샘플 데이터 로드 (선택사항)
psql -d visual_quadratic -f database/seed.sql
```

#### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 DB 연결 정보 입력

# 개발 서버 실행
npm run dev
```

#### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 📖 사용법 (Usage)

### 학생 사용법

1. **문제 선택**: 난이도별 문제 목록에서 선택
2. **포물선 조작**:
   - 슬라이더로 a, b, c 계수 조정
   - 드래그로 포물선 이동
3. **근 관찰**:
   - 빨간 점: 실근 (x축과의 교점)
   - 주황 점: 꼭짓점
   - 판별식 값 확인
4. **제출**: 목표 방정식에 맞추면 자동 채점

### 선생님 사용법

1. **문제 생성**:
```bash
POST /api/problems
{
  "title": "문제 제목",
  "description": "설명",
  "target_a": 1,
  "target_b": -3,
  "target_c": 2,
  "difficulty": 2,
  "hints": ["힌트 1", "힌트 2"]
}
```

2. **학생 진도 확인**:
```bash
GET /api/progress/student/{studentId}
```

---

## 🔌 API 엔드포인트 (API Endpoints)

### 문제 관리 (Problems)

- `GET /api/problems` - 모든 문제 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `GET /api/problems/difficulty/:level` - 난이도별 문제 조회

### 진도 추적 (Progress)

- `GET /api/progress/student/:studentId` - 학생 진도 조회
- `POST /api/progress/submit` - 답안 제출
- `GET /api/progress/problem/:problemId/leaderboard` - 리더보드

### 학생 관리 (Students)

- `GET /api/students` - 모든 학생 조회
- `POST /api/students` - 새 학생 생성
- `GET /api/students/moodle/:moodleId` - Moodle ID로 학생 조회

### Moodle 연동 (Moodle Integration)

- `GET /api/moodle/status` - Moodle 연동 상태 확인
- `POST /api/moodle/sync-student` - Moodle에서 학생 동기화
- `GET /api/moodle/user/:moodleId` - Moodle 사용자 정보
- `POST /api/moodle/report-grade` - Moodle에 성적 보고

---

## 🔧 환경 변수 (Environment Variables)

### Backend (.env)

```env
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visual_quadratic
DB_USER=postgres
DB_PASSWORD=postgres

# Moodle Integration (Optional)
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your-moodle-webservice-token
MOODLE_SERVICE=moodle_mobile_app

# Security
CORS_ORIGIN=http://localhost:3000
```

---

## 🧪 테스트 (Testing)

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

---

## 📦 배포 (Deployment)

### Docker로 프로덕션 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 또는 개별 빌드
docker build -t visual-quadratic-frontend ./frontend
docker build -t visual-quadratic-backend ./backend
```

### 전통적인 방식

```bash
# Frontend 빌드
cd frontend
npm run build
# dist/ 폴더를 웹 서버에 배포

# Backend 빌드
cd backend
npm run build
# 빌드된 파일로 Node.js 서버 실행
npm start
```

---

## 🎓 교육적 가치 (Educational Value)

### 학습 목표
- 이차방정식 계수와 그래프 모양의 관계 이해
- 근(root)의 개념과 판별식 체감
- 꼭짓점, y절편 등 주요 특성 파악

### 교육 원리
- **시각화**: 추상적 수식을 직관적 그래프로
- **인터랙션**: 능동적 조작으로 깊은 이해
- **즉각 피드백**: 실시간 결과로 학습 강화

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Zustand** - 상태 관리
- **HTML5 Canvas** - 그래프 렌더링

### Backend
- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **PostgreSQL** - 데이터베이스
- **Zod** - 스키마 검증

### DevOps
- **Docker** - 컨테이너화
- **Docker Compose** - 오케스트레이션
- **Nginx** - 프론트엔드 서빙

---

## 🤝 기여하기 (Contributing)

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 문의 (Contact)

프로젝트 관련 문의나 버그 리포트는 Issue를 생성해주세요.

---

## 🙏 감사의 말 (Acknowledgments)

- KAIST Touch Math Academy
- Moodle Community
- React & TypeScript Communities

---

## 📚 추가 문서 (Additional Documentation)

- [Database Schema](database/README.md)
- [API Documentation](http://localhost:4000) (실행 후 접속)
- [Moodle Integration Guide](#moodle-integration)

---

## 🔮 로드맵 (Roadmap)

- [ ] 모바일 네이티브 앱 (React Native)
- [ ] 실시간 협업 기능
- [ ] AI 기반 힌트 생성
- [ ] 게임화 요소 (리더보드, 배지)
- [ ] 다국어 지원 (영어, 일본어 등)
- [ ] LTI 표준 Moodle 연동

---

Made with ❤️ for better math education
