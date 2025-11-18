# Unfolding Net Live 🎓

**3D 전개도 학습 시스템** - Moodle LMS 연동 웹 애플리케이션

입체도형의 전개도를 자연스럽게 펼치는 애니메이션을 통해 학생들의 공간 지각 능력을 향상시키는 교육용 웹앱입니다.

## 📱 주요 기능

- **🎨 3D 전개도 시각화**: Three.js 기반 실시간 3D 렌더링
- **▶️ 부드러운 애니메이션**: 입체도형이 자연스럽게 펼쳐지는 애니메이션
- **📱 스마트폰 프레임 UI**: 우측 하단에 표시되는 가상 모바일 화면
- **🎮 인터랙티브 컨트롤**: 회전, 확대/축소, 재생/일시정지, 속도 조절
- **🔗 LMS 연동**: Moodle 3.7과 REST API로 통합
- **📊 학습 추적**: 학생 진행 상황 및 인터랙션 데이터 저장

## 🏗️ 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  • React 18 + TypeScript + Vite                  │   │
│  │  • Three.js + React Three Fiber                  │   │
│  │  • Zustand (State Management)                    │   │
│  │  • Smartphone Frame UI Component                 │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API
         ┌─────────▼────────────┐
         │  Backend (Node.js)   │
         │  • Express.js        │
         │  • MySQL 5.7 Driver  │
         │  • Moodle API Bridge │
         └─────────┬────────────┘
                   │
         ┌─────────▼────────────┐
         │   MySQL 5.7 DB       │
         │  • Problem Data      │
         │  • Student Progress  │
         │  • Interaction Logs  │
         └──────────────────────┘
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- MySQL 5.7
- npm 또는 yarn

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

**Backend:**
```bash
cd backend
cp .env.example .env
# .env 파일을 열어서 MySQL 정보 입력
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# 필요시 API URL 수정
```

### 3. 데이터베이스 초기화

```bash
# MySQL에 로그인
mysql -u root -p

# 스키마 실행
source backend/schema.sql
```

### 4. 의존성 설치 및 실행

**Backend 서버:**
```bash
cd backend
npm install
npm run dev
```

**Frontend 서버:**
```bash
cd frontend
npm install
npm run dev
```

### 5. 브라우저에서 접속

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## 🐳 Docker로 실행

```bash
# 모든 서비스 시작 (MySQL + Backend + Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── UnfoldingNet/   # 3D 전개도 컴포넌트
│   │   │   └── SmartphoneFrame/ # 스마트폰 UI 프레임
│   │   ├── services/            # API 서비스
│   │   ├── store/               # 상태 관리 (Zustand)
│   │   ├── types/               # TypeScript 타입 정의
│   │   └── App.tsx              # 메인 앱
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # Node.js 백엔드
│   ├── src/
│   │   ├── config/              # DB 설정
│   │   ├── controllers/         # API 컨트롤러
│   │   ├── models/              # 데이터 모델
│   │   ├── routes/              # API 라우트
│   │   └── server.js            # 메인 서버
│   ├── schema.sql               # MySQL 스키마
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml           # Docker Compose 설정
└── README.md                    # 이 파일
```

## 🎮 사용 방법

### 1. 3D 모델 조작

- **회전**: 마우스 드래그
- **확대/축소**: 마우스 휠 또는 핀치
- **이동**: 오른쪽 클릭 + 드래그

### 2. 애니메이션 제어

- **▶️ 재생**: 전개 애니메이션 시작
- **⏸️ 일시정지**: 현재 상태 유지
- **⏹️ 정지**: 처음으로 되돌리기
- **🔁 처음부터**: 리셋 후 재생

### 3. 설정

- **속도 조절**: 슬라이더로 0.1x ~ 2.0x 조절
- **자동 정지**: 완료 시 자동으로 정지
- **자동 되감기**: 완료 후 처음으로

## 🔌 API 엔드포인트

### 문제 조회
```http
GET /api/problems?courseId=X&moduleId=Y
```

### 코스의 모든 문제
```http
GET /api/courses/:courseId/problems
```

### 진행 상황 저장
```http
POST /api/progress
Content-Type: application/json

{
  "problemId": "problem-id",
  "progress": 0.75,
  "interactionData": {...}
}
```

### 새 문제 생성
```http
POST /api/problems
Content-Type: application/json

{
  "courseId": "course-1",
  "moduleId": "module-1",
  "type": "cube",
  "difficulty": 1,
  "title": "정육면체 전개도",
  "description": "..."
}
```

## 🔧 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **3D Graphics**: Three.js + React Three Fiber
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: CSS3

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MySQL 5.7
- **ORM**: MySQL2 (Promise-based)
- **Security**: Helmet, CORS

### DevOps
- **Containerization**: Docker + Docker Compose
- **Development**: Nodemon (Backend), Vite HMR (Frontend)

## 🎓 Moodle 연동

### Moodle 3.7 설정

1. **웹 서비스 활성화**
   - 사이트 관리 > 고급 기능 > "웹 서비스 활성화" 체크

2. **토큰 생성**
   - 사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리
   - 새 토큰 생성 후 backend/.env에 추가

3. **코스/모듈 ID 확인**
   - Moodle URL에서 `id=XXX` 파라미터 확인
   - 프론트엔드에서 해당 ID로 문제 요청

## 📊 데이터베이스 스키마

### unfolding_problems
- `id`: 문제 고유 ID (UUID)
- `course_id`: Moodle 코스 ID
- `module_id`: Moodle 모듈 ID
- `type`: 도형 타입 (cube, tetrahedron, etc.)
- `difficulty`: 난이도 (1-5)
- `title`: 문제 제목
- `description`: 설명
- `config`: JSON 설정

### student_progress
- `problem_id`: 문제 ID (FK)
- `user_id`: 학생 ID
- `progress`: 진행률 (0.00 - 1.00)
- `completed`: 완료 여부
- `interaction_data`: 인터랙션 데이터 (JSON)
- `time_spent`: 소요 시간 (초)
- `attempt_count`: 시도 횟수

### interaction_events
- `problem_id`: 문제 ID (FK)
- `user_id`: 학생 ID
- `event_type`: 이벤트 타입 (click, drag, zoom, etc.)
- `event_data`: 이벤트 상세 (JSON)
- `timestamp`: 발생 시각

## 🚧 개발 중인 기능

- [ ] 더 많은 도형 타입 (팔면체, 프리즘 등)
- [ ] 고급 전개 알고리즘
- [ ] 학생 대시보드
- [ ] 교사 관리 패널
- [ ] 실시간 협업 모드
- [ ] VR/AR 지원

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - KAIST Touch Math Academy

## 📧 문의

- 프로젝트 관리자: [contact@example.com](mailto:contact@example.com)
- 이슈 트래커: [GitHub Issues](https://github.com/your-repo/issues)

---

**Made with ❤️ by KAIST Touch Math Academy**
