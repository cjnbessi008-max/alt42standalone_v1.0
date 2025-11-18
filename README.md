# 교육 문제 조건 색상 강조 시스템

KAIST Touch Math Academy를 위한 독립형 웹 애플리케이션으로, 교육용 문제의 조건들을 색깔별로 시각화하여 학생들의 이해를 돕습니다.

## 주요 기능

### 색상 코딩 시스템

각 조건 유형은 고유한 색상으로 표시됩니다:

- 🔵 **파란색 (주어진 값)**: 문제에서 주어진 데이터와 값들
- 🟢 **초록색 (제약조건)**: 수학적 제약사항 (예: 분모 ≠ 0)
- 🟡 **주황색 (범위조건)**: 범위와 경계 조건 (예: 1 ≤ x ≤ 5)
- 🔴 **빨간색 (중요조건)**: 중요한 조건 및 에러 케이스
- 🟣 **보라색 (조건부로직)**: if-then 등 조건부 로직

### 인터랙티브 기능

- **조건 클릭**: 각 조건을 클릭하면 상세 설명 확인 가능
- **시각적 피드백**: 마우스 호버 시 하이라이트 효과
- **조건별 그룹화**: 조건 유형별로 자동 분류 및 표시
- **범례 제공**: 색상 의미를 명확히 설명하는 범례

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React TypeScript 앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConditionHighlighter/   # 개별 조건 강조 컴포넌트
│   │   │   │   ├── ConditionHighlighter.tsx
│   │   │   │   └── index.ts
│   │   │   └── ProblemDisplay/         # 전체 문제 표시 컴포넌트
│   │   │       ├── ProblemDisplay.tsx
│   │   │       └── index.ts
│   │   ├── config/
│   │   │   ├── colorScheme.ts          # 색상 설정
│   │   │   └── sampleProblems.ts       # 샘플 문제 데이터
│   │   ├── pages/
│   │   │   └── DemoPage.tsx            # 메인 데모 페이지
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript 타입 정의
│   │   ├── App.tsx                     # 메인 앱 컴포넌트
│   │   └── main.tsx                    # 앱 진입점
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── tasks/                       # 프로젝트 계획 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 기술 스택

### Frontend
- **React 18+**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **Emotion**: CSS-in-JS 스타일링

## 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치

```bash
# 프로젝트 디렉토리로 이동
cd frontend

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 애플리케이션을 확인할 수 있습니다.

### 빌드

```bash
npm run build
```

프로덕션 빌드는 `dist/` 디렉토리에 생성됩니다.

### 프리뷰

```bash
npm run preview
```

## 사용 방법

### 기본 사용

1. 애플리케이션을 실행하면 샘플 문제들이 표시됩니다
2. 상단의 버튼을 클릭하여 다른 문제 유형 확인 가능:
   - 분수 문제
   - 기하 문제
   - 방정식 문제
3. 각 조건을 클릭하면 상세 설명이 표시됩니다

### 커스텀 문제 추가

`frontend/src/config/sampleProblems.ts` 파일에서 새로운 문제를 추가할 수 있습니다:

```typescript
import { Problem, ConditionType } from '@/types';

export const customProblem: Problem = {
  id: 'custom-001',
  title: '문제 제목',
  description: '문제 설명',
  problemType: 'fraction',
  conditions: [
    {
      id: 'c1',
      type: ConditionType.VALUE,
      text: '조건 텍스트',
      description: '조건 설명 (선택사항)',
    },
    // 추가 조건들...
  ],
};
```

### 색상 커스터마이징

`frontend/src/config/colorScheme.ts` 파일에서 색상을 변경할 수 있습니다:

```typescript
export const colorScheme: Record<ConditionType, ColorConfig> = {
  [ConditionType.VALUE]: {
    primary: '#1976d2',      // 메인 색상
    background: '#e3f2fd',   // 배경 색상
    border: '#1976d2',       // 테두리 색상
    hover: '#bbdefb',        // 호버 색상
  },
  // 다른 조건 타입들...
};
```

## 컴포넌트 API

### ConditionHighlighter

개별 조건을 색상으로 강조하여 표시하는 컴포넌트

```typescript
interface ConditionHighlighterProps {
  condition: Condition;           // 표시할 조건
  onClick?: (condition: Condition) => void;  // 클릭 핸들러 (선택)
}
```

### ProblemDisplay

전체 문제와 조건들을 표시하는 컴포넌트

```typescript
interface ProblemDisplayProps {
  problem: Problem;     // 표시할 문제
  showLegend?: boolean; // 범례 표시 여부 (기본값: true)
}
```

## 접근성 (Accessibility)

이 시스템은 WCAG 2.1 AA 기준을 준수합니다:

- **색상 대비**: 모든 텍스트는 4.5:1 이상의 대비율
- **키보드 네비게이션**: 모든 인터랙티브 요소 키보드 접근 가능
- **스크린 리더**: ARIA 레이블 및 설명 제공
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원

## 향후 계획

- [ ] LMS 연동 (Canvas, Moodle, Google Classroom)
- [ ] 사용자 정의 문제 생성 인터페이스
- [ ] 문제 풀이 진행 상황 추적
- [ ] AI 기반 문제 자동 생성
- [ ] 다국어 지원
- [ ] 오프라인 모드
- [ ] 성능 분석 및 리포트 기능

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 기여

문제 보고 및 기능 제안은 GitHub Issues를 통해 제출해 주세요.

## 연락처

KAIST Touch Math Academy
https://github.com/cjnbessi008-max/alt42standalone_v1.0
