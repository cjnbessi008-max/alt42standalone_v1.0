# 🎯 ALT42 Vector Story Mode

벡터의 직관을 스토리 영상처럼 배우는 AI 교육 시스템

## 📱 프로젝트 소개

ALT42 Vector Story Mode는 수학 교육에서 벡터 개념을 직관적으로 이해할 수 있도록 도와주는 인터랙티브 웹 애플리케이션입니다. 학생들은 스마트폰 UI를 통해 벡터의 기본 개념부터 덧셈, 스칼라 곱, 내적까지 스토리 형식으로 배울 수 있습니다.

### 주요 기능

- 📚 **스토리 기반 학습**: 벡터 개념을 영화처럼 장면별로 구성
- 🎨 **인터랙티브 시각화**: Canvas API를 활용한 실시간 벡터 애니메이션
- 📱 **스마트폰 UI**: 우측 하단에 표시되는 가상 스마트폰 인터페이스
- 🎬 **애니메이션 컨트롤**: 재생, 일시정지, 장면 이동 기능
- 🔄 **LMS 연동 준비**: Moodle/MySQL 통합을 위한 REST API 구조

## 🛠 기술 스택

### Frontend
- **React 18+**: 컴포넌트 기반 UI 개발
- **Vite**: 빠른 개발 환경 및 빌드 도구
- **Canvas API**: 벡터 시각화 및 애니메이션
- **CSS3**: 스마트폰 UI 디자인

### Backend
- **Node.js + Express**: REST API 서버
- **CORS**: 크로스 오리진 요청 처리

### 향후 연동 예정
- **Moodle 3.7**: LMS 통합
- **MySQL 5.7**: 학생 진행도 및 문제 데이터 저장
- **PHP 7.1.9**: Moodle 플러그인 개발

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18.0 이상
- npm 9.0 이상

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치
```bash
# 루트 디렉토리에서 실행 (workspace 전체 설치)
npm install

# 또는 개별 설치
cd backend && npm install
cd ../frontend && npm install
```

### 3. 환경 변수 설정
```bash
# backend 디렉토리에서
cp .env.example .env
# 필요시 .env 파일 수정
```

### 4. 개발 서버 실행

#### 방법 1: 동시 실행 (권장)
```bash
# 루트 디렉토리에서
npm run dev
```

#### 방법 2: 개별 실행
```bash
# 터미널 1 - Backend
cd backend
npm run dev

# 터미널 2 - Frontend
cd frontend
npm run dev
```

### 5. 브라우저 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎮 사용 방법

1. **문제 선택**: 메인 화면에서 학습하고 싶은 벡터 주제 선택
2. **스토리 시청**: "▶ 재생" 버튼을 클릭하여 애니메이션 시작
3. **장면 탐색**: 하단의 점(dots)을 클릭하여 원하는 장면으로 이동
4. **반복 학습**: "처음부터 다시보기" 버튼으로 복습

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   │   ├── SmartphoneFrame.jsx    # 스마트폰 UI 프레임
│   │   │   ├── ProblemList.jsx        # 문제 목록
│   │   │   ├── VectorStoryMode.jsx    # 스토리 모드 메인
│   │   │   └── VectorCanvas.jsx       # 벡터 시각화 캔버스
│   │   ├── App.jsx         # 메인 앱 컴포넌트
│   │   ├── main.jsx        # 진입점
│   │   └── index.css       # 글로벌 스타일
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                # Express 백엔드
│   ├── api/               # API 엔드포인트 (향후 확장)
│   ├── index.js           # 서버 진입점
│   ├── .env.example       # 환경 변수 템플릿
│   └── package.json
│
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
│
├── package.json           # 루트 package.json (workspaces)
└── README.md             # 프로젝트 문서
```

## 🔌 API 엔드포인트

### GET /api/health
서버 상태 확인

**Response:**
```json
{
  "status": "ok",
  "message": "Vector Story Mode API is running"
}
```

### GET /api/problems
모든 문제 목록 조회

**Query Parameters:**
- `difficulty` (optional): 난이도 필터 (1, 2, 3)
- `type` (optional): 문제 유형 (introduction, addition, scalar, dot_product)
- `gradeLevel` (optional): 학년 필터

**Response:**
```json
{
  "success": true,
  "count": 4,
  "problems": [...]
}
```

### GET /api/problems/:id
특정 문제 상세 조회

**Response:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "벡터의 탄생",
    "description": "...",
    "storyMode": {
      "scenes": [...]
    }
  }
}
```

### POST /api/progress
학생 진행도 저장 (Mock)

**Request Body:**
```json
{
  "studentId": "student123",
  "problemId": 1,
  "completed": true,
  "score": 100
}
```

## 🎨 스토리 데이터 구조

각 문제는 다음과 같은 구조로 정의됩니다:

```javascript
{
  id: 1,
  title: "벡터의 탄생",
  description: "벡터가 무엇인지 스토리로 배워봅시다",
  type: "introduction",
  storyMode: {
    scenes: [
      {
        id: 1,
        narration: "어느 날, 작은 마을에 화살이 날아들었습니다.",
        vectors: [
          {
            id: 'v1',
            x: 0,           // 시작점 X
            y: 0,           // 시작점 Y
            toX: 3,         // 끝점 X
            toY: 4,         // 끝점 Y
            color: '#ff6b6b',
            label: 'a',
            thickness: 2,
            opacity: 1
          }
        ],
        highlight: 'v1',  // 강조할 벡터 ID
        duration: 3000    // 장면 지속 시간 (ms)
      }
    ]
  },
  difficulty: 1,
  gradeLevel: "중학교 1학년"
}
```

## 🔮 향후 개발 계획

### Phase 1: Moodle 연동 (예정)
- [ ] Moodle 3.7 플러그인 개발
- [ ] MySQL 데이터베이스 스키마 설계
- [ ] 학생 인증 및 세션 관리
- [ ] 진행도 실시간 저장

### Phase 2: 기능 확장
- [ ] 더 많은 벡터 문제 추가
- [ ] 3D 벡터 시각화
- [ ] 퀴즈 및 평가 기능
- [ ] 학생 대시보드

### Phase 3: 성능 최적화
- [ ] 애니메이션 성능 개선
- [ ] 모바일 반응형 강화
- [ ] 오프라인 모드 지원

## 🐛 문제 해결

### 백엔드 서버 연결 실패
```bash
# 백엔드가 실행 중인지 확인
cd backend && npm run dev
```

### 포트 충돌
`.env` 파일에서 포트 변경:
```
PORT=3002  # 원하는 포트로 변경
```

### 의존성 설치 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📄 라이센스

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템 파이프라인의 일부입니다.

## 👥 기여자

- AI Agent (Claude) - 초기 개발 및 설계

## 📧 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

**Made with ❤️ for better math education**
