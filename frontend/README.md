# LMS 연동 이해도 추적 시스템

학습자의 이해도를 3단계 막대로 시각화하고 LMS와 연동하여 학습 진도를 추적하는 시스템입니다.

## 주요 기능

### 1. 3단계 이해도 표시
- **기초 (Novice)**: 개념을 이해하고 있는 단계 (빨강/주황)
- **중급 (Intermediate)**: 개념을 적용할 수 있는 단계 (노랑)
- **숙달 (Mastery)**: 개념을 완전히 숙달한 단계 (초록)

### 2. LMS 연동
- RESTful API를 통한 학습 데이터 동기화
- 실시간 이해도 업데이트
- 학습 히스토리 추적

### 3. 학생 대시보드
- 모듈별 이해도 시각화
- 학습 진도 추적
- 맞춤형 학습 추천

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── UnderstandingBar.tsx        # 이해도 막대 컴포넌트
│   │   └── UnderstandingBar.css        # 컴포넌트 스타일
│   ├── types/
│   │   └── understanding.ts            # 이해도 타입 정의
│   ├── services/
│   │   ├── apiClient.ts                # API 클라이언트
│   │   └── understandingService.ts     # 이해도 서비스
│   ├── pages/
│   │   ├── StudentDashboard.tsx        # 학생 대시보드
│   │   └── StudentDashboard.css        # 대시보드 스타일
│   └── styles/                         # 전역 스타일
└── README.md
```

## 컴포넌트 사용법

### UnderstandingBar

기본 이해도 막대 컴포넌트:

```tsx
import { UnderstandingBar } from './components/UnderstandingBar';

<UnderstandingBar
  level={2}                    // 1, 2, or 3
  showLabel={true}             // 라벨 표시 여부
  showDescription={true}       // 설명 표시 여부
  animate={true}               // 애니메이션 여부
  size="medium"                // 크기: small, medium, large
/>
```

### UnderstandingBarCompact

컴팩트 버전 (작은 공간용):

```tsx
import { UnderstandingBarCompact } from './components/UnderstandingBar';

<UnderstandingBarCompact level={2} />
```

## API 엔드포인트

### 이해도 조회
```
GET /api/modules/{moduleId}/progress/{studentId}/understanding-level
```

응답:
```json
{
  "level": 2,
  "studentId": "student-001",
  "moduleId": "module-001",
  "updatedAt": "2025-01-15T10:30:00Z",
  "history": [
    {
      "level": 1,
      "achievedAt": "2025-01-08T10:30:00Z",
      "trigger": "initial_assessment"
    },
    {
      "level": 2,
      "achievedAt": "2025-01-15T10:30:00Z",
      "trigger": "progress_milestone"
    }
  ]
}
```

### 이해도 업데이트
```
POST /api/modules/{moduleId}/progress/{studentId}/update-understanding
```

요청:
```json
{
  "metrics": {
    "accuracy": 75,
    "problemsAttempted": 12,
    "consistencyScore": 68
  }
}
```

### 이해도 분석
```
GET /api/modules/{moduleId}/analytics/understanding?studentId={studentId}
```

## 이해도 계산 로직

이해도 레벨은 다음 메트릭을 기반으로 계산됩니다:

### Level 1 (기초)
- 정확도: 0-40%
- 문제 시도: 0개 이상
- 일관성: 0-40%

### Level 2 (중급)
- 정확도: 40-80%
- 문제 시도: 5개 이상
- 일관성: 40-70%

### Level 3 (숙달)
- 정확도: 80-100%
- 문제 시도: 15개 이상
- 일관성: 70-100%

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

### 3. 개발 서버 실행
```bash
npm start
```

### 4. 빌드
```bash
npm run build
```

## 기술 스택

- **React 18+** with TypeScript
- **CSS Modules** for component styling
- **Fetch API** for HTTP requests
- **React Hooks** for state management

## 향후 개발 계획

### Phase 1 (현재)
- ✅ 3단계 이해도 막대 UI 구현
- ✅ LMS 연동 API 클라이언트
- ✅ 학생 대시보드

### Phase 2 (예정)
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 교사 대시보드
- [ ] 이해도 분석 차트
- [ ] 학습 추천 알고리즘 고도화

### Phase 3 (예정)
- [ ] 다중 LMS 지원 (Canvas, Moodle, Blackboard)
- [ ] 모바일 앱
- [ ] 오프라인 모드
- [ ] 데이터 내보내기/가져오기

## 접근성

- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환
- 색상 외 추가 시각적 표시 (라벨, 아이콘)

## 브라우저 지원

- Chrome/Edge (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- 모바일 브라우저 (iOS Safari, Chrome for Android)

## 라이센스

MIT License

## 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 문의

KAIST Touch Math Academy
