# Vector Space Map - AI Education System Frontend

Moodle LMS와 연동하여 학습 개념을 벡터 공간에 시각화하는 웹 애플리케이션

## 개요

이 프로젝트는 **Moodle 3.7 LMS** (PHP 7.1.9, MySQL 5.7)와 연동하여 퀴즈 문제의 개념을 분석하고, AI가 생성한 벡터 공간을 **우측 하단 가상 스마트폰 화면**에 인터랙티브한 미니 맵으로 표시합니다.

### 주요 기능

- ✅ **Vector Space Map**: D3.js 기반 개념 간 관계 시각화
- ✅ **Moodle LMS 연동**: Moodle Web Service API를 통한 퀴즈 데이터 페칭
- ✅ **스마트폰 UI**: 우측 하단 가상 스마트폰 화면에 앱 표시
- ✅ **학습 경로 추적**: 학생의 개념 방문 기록 및 숙달도 표시
- ✅ **인터랙티브**: 노드 클릭, 드래그, 줌/팬 기능
- ✅ **반응형**: 다양한 화면 크기 지원

## 기술 스택

### Frontend
- **React 18+** with TypeScript
- **D3.js 7.x** - Force-directed graph visualization
- **Vite** - Build tool
- **Zustand** - State management
- **Axios** - HTTP client

### Backend Integration
- **Moodle 3.7** Web Service API
- **RESTful API** (Node.js/Python)

## 설치 및 실행

### 1. 사전 요구사항

- Node.js 18+ 및 npm
- Moodle 3.7 인스턴스 (PHP 7.1.9, MySQL 5.7)
- Moodle Web Service Token

### 2. 설치

```bash
cd frontend
npm install
```

### 3. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 설정:

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
VITE_MOODLE_BASE_URL=http://your-moodle-server/moodle
VITE_MOODLE_WS_TOKEN=your_moodle_webservice_token
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 5. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## Moodle LMS 연동 설정

### Moodle에서 Web Service 활성화

1. **관리자로 Moodle 로그인**
2. **사이트 관리 → 고급 기능**
   - "웹 서비스 활성화" 체크
3. **사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스**
   - 새 서비스 생성 (예: "AI Education System")
4. **사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스 함수**
   - 다음 함수들을 서비스에 추가:
     - `mod_quiz_get_quizzes_by_courses`
     - `mod_quiz_get_quiz_questions`
     - `mod_quiz_get_user_attempts`
     - `core_course_get_courses`
5. **사이트 관리 → 사용자 → 권한 → 역할 정의**
   - 새 역할 생성 또는 기존 역할에 권한 추가
6. **사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리**
   - 사용자에게 토큰 생성
   - 생성된 토큰을 `.env` 파일에 복사

### API 엔드포인트 테스트

```bash
curl "http://your-moodle-server/moodle/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── SmartphoneFrame.tsx          # 스마트폰 프레임 컴포넌트
│   │   ├── SmartphoneFrame.css
│   │   └── VectorSpaceMap/              # Vector Space Map 컴포넌트
│   │       ├── VectorSpaceMap.tsx       # 메인 컴포넌트
│   │       ├── VectorSpaceMap.css
│   │       ├── components/
│   │       │   ├── ConceptPanel.tsx     # 개념 상세 패널
│   │       │   └── Legend.tsx           # 범례
│   │       ├── hooks/
│   │       │   ├── useVectorData.ts     # 벡터 데이터 페칭
│   │       │   ├── useLearningPath.ts   # 학습 경로
│   │       │   └── useInteraction.ts    # 사용자 상호작용
│   │       └── utils/
│   │           ├── colorMapping.ts      # 색상 매핑
│   │           └── forceSimulation.ts   # D3 Force Simulation
│   ├── services/
│   │   ├── moodleApi.ts                 # Moodle API 클라이언트
│   │   └── vectorSpaceApi.ts            # Vector Space API 클라이언트
│   ├── types/
│   │   └── index.ts                     # TypeScript 타입 정의
│   ├── App.tsx                          # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx                         # 엔트리 포인트
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 사용 방법

### 기본 사용법

```tsx
import VectorSpaceMap from './components/VectorSpaceMap/VectorSpaceMap';
import SmartphoneFrame from './components/SmartphoneFrame';

function App() {
  return (
    <SmartphoneFrame position="bottom-right" size="medium">
      <VectorSpaceMap
        moduleId="your-module-id"
        interactiveMode="explore"
        dimension="2d"
        colorScheme="by-category"
        onConceptSelect={(concept) => console.log(concept)}
      />
    </SmartphoneFrame>
  );
}
```

### Props

#### VectorSpaceMap

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleId` | string | required | 모듈 ID |
| `interactiveMode` | 'explore' \| 'student-progress' \| 'edit' | 'explore' | 인터랙션 모드 |
| `dimension` | '2d' \| '3d' | '2d' | 시각화 차원 |
| `colorScheme` | 'by-category' \| 'by-difficulty' \| 'by-mastery' | 'by-category' | 색상 스키마 |
| `onConceptSelect` | (concept: Concept) => void | - | 개념 선택 콜백 |
| `studentId` | string | - | 학생 ID (학습 경로 표시용) |
| `className` | string | '' | CSS 클래스 |

#### SmartphoneFrame

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | 'bottom-right' | 화면 위치 |
| `size` | 'small' \| 'medium' \| 'large' | 'medium' | 스마트폰 크기 |
| `children` | ReactNode | required | 자식 컴포넌트 |

## 개발 가이드

### 타입 체크

```bash
npm run type-check
```

### 린팅

```bash
npm run lint
```

### 빌드

```bash
npm run build
```

## 주요 기능 설명

### 1. Vector Space Map

- **Force-Directed Graph**: D3.js를 사용한 물리 기반 레이아웃
- **노드 크기**: 개념의 난이도에 비례
- **노드 색상**: 카테고리, 난이도, 숙달도에 따라 변경 가능
- **연결선**: 개념 간 관계의 강도에 비례하는 두께

### 2. Moodle 연동

- Moodle Web Service API를 통한 퀴즈 데이터 페칭
- 문제 메타데이터에서 개념 추출
- 자동 난이도 추정

### 3. 학습 경로 추적

- 학생이 방문한 개념 표시 (초록색 테두리)
- 각 개념별 숙달도 색상 표시
- 현재 학습 중인 개념 하이라이트

## 문제 해결

### CORS 에러

Moodle 서버에서 CORS 설정 필요:

```php
// config.php 또는 .htaccess
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
```

### 토큰 인증 실패

1. Moodle에서 Web Service가 활성화되어 있는지 확인
2. 토큰이 올바른 서비스에 연결되어 있는지 확인
3. 사용자에게 적절한 권한이 있는지 확인

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트 환영합니다!

## 관련 문서

- [Moodle Web Services](https://docs.moodle.org/dev/Web_services)
- [D3.js Documentation](https://d3js.org/)
- [React Documentation](https://react.dev/)
