# LMS 채점 시스템 - 시각 효과 통합

LMS(Learning Management System)와 연동하여 채점 결과를 시각 효과로 표현하는 웹 애플리케이션입니다.

## 주요 기능

### 🎨 시각 효과

- **성공 펄스 효과**: 정답 제출 시 초록색 펄스 애니메이션과 빛나는 효과
- **오류 크랙 효과**: 오답 제출 시 빨간색 크랙 라인과 흔들림 효과
- **점수 카운터 애니메이션**: 점수가 부드럽게 증가하는 애니메이션
- **접근성 지원**: prefers-reduced-motion 설정 시 애니메이션 비활성화

### 🔗 LMS 연동

- Canvas, Moodle, Blackboard 등 주요 LMS 플랫폼 지원
- 학생 명단 가져오기
- 채점 결과 자동 동기화
- 성적 일괄 내보내기

### 📊 채점 시스템

- 정확한 답안 매칭
- 부분 점수 지원
- 커스텀 채점 규칙
- 실시간 피드백

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── GradingResult.tsx    # 채점 결과 표시 컴포넌트
│   │   │   └── GradingDemo.tsx      # 데모 페이지
│   │   ├── styles/          # CSS 스타일
│   │   │   └── GradingEffects.css   # 시각 효과 애니메이션
│   │   ├── api/             # API 클라이언트
│   │   │   └── lmsApi.ts    # LMS API 통신
│   │   ├── types/           # TypeScript 타입 정의
│   │   │   └── grading.ts
│   │   ├── main.tsx         # 앱 진입점
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                  # Node.js API 서버
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   │   ├── gradingRoutes.ts
│   │   │   └── lmsRoutes.ts
│   │   ├── controllers/     # 컨트롤러
│   │   │   ├── gradingController.ts
│   │   │   └── lmsController.ts
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── gradingService.ts
│   │   │   └── lmsService.ts
│   │   ├── types/           # TypeScript 타입
│   │   │   └── grading.ts
│   │   └── server.ts        # Express 서버
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
├── tasks/                    # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md
```

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- npm or yarn

### 백엔드 설정

```bash
cd backend

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 LMS API 키 등을 설정

# 개발 서버 실행
npm run dev
```

백엔드 서버는 `http://localhost:3001`에서 실행됩니다.

### 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 채점 API

#### POST `/api/grading/submit`
학생 답안 제출 및 채점

**요청 본문:**
```json
{
  "studentId": "student-123",
  "moduleId": "module-fractions",
  "problemId": "problem-001",
  "answer": "3/4",
  "timeSpent": 45.5
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "gradingResult": {
      "id": "result-123",
      "isCorrect": true,
      "score": 10,
      "maxScore": 10,
      "feedback": "정확합니다!",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "moduleProgress": {
      "completedProblems": 5,
      "totalProblems": 10,
      "averageScore": 85
    }
  }
}
```

#### GET `/api/grading/:studentId/module/:moduleId`
학생의 모듈별 채점 결과 조회

#### GET `/api/progress/:studentId/module/:moduleId`
학생의 모듈 진행 상황 조회

### LMS 연동 API

#### POST `/api/lms/sync`
LMS와 학생 진행 상황 동기화

**요청 본문:**
```json
{
  "studentId": "student-123",
  "moduleId": "module-fractions"
}
```

#### POST `/api/lms/export/:moduleId`
모듈의 전체 성적을 LMS로 내보내기

#### POST `/api/lms/import/:moduleId`
LMS에서 학생 명단 가져오기

#### GET `/api/students/:studentId`
학생 정보 조회

## 시각 효과 상세

### 성공 펄스 효과

정답 제출 시:
1. 초록색 배경 그라데이션
2. 확대/축소 펄스 애니메이션 (0.8초)
3. 주변으로 퍼지는 초록색 그림자
4. 체크 아이콘 팝업 애니메이션
5. 점수 카운터 증가 애니메이션

### 오류 크랙 효과

오답 제출 시:
1. 빨간색 배경 그라데이션
2. 좌우 흔들림 애니메이션 (0.6초)
3. 화면에 나타나는 크랙 라인 3개
4. X 아이콘 팝업 애니메이션
5. 점수 표시

### 접근성

- **Reduced Motion**: 사용자가 애니메이션 감소를 선호하는 경우 모든 애니메이션 비활성화
- **High Contrast**: 고대비 모드에서 테두리 굵기 증가
- **Screen Reader**: ARIA 레이블 및 role 속성 지원
- **Keyboard Navigation**: 키보드만으로 모든 기능 사용 가능

## LMS 플랫폼 연동

### Canvas LMS

```env
LMS_TYPE=canvas
LMS_API_ENDPOINT=https://your-canvas.instructure.com/api/v1
LMS_API_KEY=your_canvas_api_key
```

### Moodle

```env
LMS_TYPE=moodle
LMS_API_ENDPOINT=https://your-moodle.com
LMS_API_KEY=your_moodle_token
```

### Blackboard

```env
LMS_TYPE=blackboard
LMS_API_ENDPOINT=https://your-blackboard.com
LMS_API_KEY=your_blackboard_token
```

## 개발

### 타입 체크

```bash
# 프론트엔드
cd frontend
npm run build

# 백엔드
cd backend
npm run build
```

### 린팅

```bash
npm run lint
```

### 코드 포맷팅

```bash
npm run format
```

## 배포

### 프로덕션 빌드

```bash
# 프론트엔드
cd frontend
npm run build
# dist/ 폴더에 빌드 파일 생성

# 백엔드
cd backend
npm run build
# dist/ 폴더에 빌드 파일 생성
```

### 프로덕션 실행

```bash
# 백엔드
cd backend
npm start
```

## 기술 스택

### Frontend
- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **CSS3**: 애니메이션 및 스타일링

### Backend
- **Node.js**: 런타임
- **Express**: 웹 프레임워크
- **TypeScript**: 타입 안전성
- **CORS**: 교차 출처 리소스 공유

## 라이선스

MIT

## 기여

KAIST Touch Math Academy

## 지원

문의사항이 있으시면 이슈를 등록해주세요.
