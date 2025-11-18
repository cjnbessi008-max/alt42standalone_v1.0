# 수학 학습 시각화 앱 (Math Learning Visual App)

AI를 활용한 수학 학습 웹 애플리케이션입니다. 수학 문제나 풀이를 입력하면 AI가 헷갈릴 수 있는 부분을 자동으로 감지하고, 시각적으로 확대하여 반복 학습을 통해 개념을 확실하게 익힐 수 있도록 돕습니다.

## 주요 기능

### 🤖 AI 기반 분석
- 수학 문제 풀이에서 헷갈릴 수 있는 부분 자동 감지
- 분수, 미분, 적분, 이차방정식 등 다양한 수학 개념 지원
- 각 개념에 대한 상세한 설명 제공

### 🎨 시각적 강조 시스템
- 중요한 개념을 색상과 애니메이션으로 강조
- 확대/축소 애니메이션으로 집중력 향상
- 그라디언트와 모션을 활용한 시각적 매력

### 🔄 반복 학습 메커니즘
- 각 개념을 몇 번 확인했는지 자동 추적
- 3회 반복 학습 시 "마스터 완료" 표시
- 학습 진행 상황을 시각적으로 표시
- 축하 애니메이션으로 성취감 제공

### 💡 직관적인 UI/UX
- 한글 중심의 사용자 친화적 인터페이스
- 예시 문제 제공으로 빠른 시작 가능
- 반응형 디자인으로 모바일/데스크톱 모두 지원

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Math Rendering**: KaTeX

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

앱이 http://localhost:3000 에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 4. 프로덕션 미리보기

```bash
npm run preview
```

## 사용 방법

1. **문제 입력**: 메인 화면에서 수학 문제나 풀이 과정을 입력합니다
2. **AI 분석**: "AI로 분석하기" 버튼을 클릭하여 분석을 시작합니다
3. **결과 확인**: AI가 찾은 헷갈릴 수 있는 개념들을 확인합니다
4. **상세 학습**: 각 개념을 클릭하여 자세한 설명과 예제를 확인합니다
5. **반복 학습**: 같은 개념을 여러 번 확인하여 완전히 이해합니다

## 지원하는 수학 개념

- 분수의 사칙연산
- 미분 (도함수, 순간변화율)
- 적분 (정적분, 부정적분)
- 이차방정식 (근의 공식, 판별식)
- 기타 다양한 수학 개념 (계속 추가 중)

## AI 통합 (선택사항)

실제 AI 분석을 사용하려면:

1. `.env.example`을 `.env`로 복사
2. Anthropic API 키를 설정:
   ```
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```
3. `src/App.tsx`의 `analyzeMathProblem` 함수를 실제 API 호출로 교체

## 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── MathInputSection.tsx       # 수학 입력 섹션
│   ├── AnalysisDisplay.tsx        # 분석 결과 표시
│   ├── ConfusingPartCard.tsx      # 개념 카드
│   └── RepetitionTracker.tsx      # 학습 진행 추적
├── types.ts             # TypeScript 타입 정의
├── App.tsx              # 메인 앱 컴포넌트
├── main.tsx            # 앱 엔트리 포인트
└── index.css           # 글로벌 스타일

```

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

## 연락처

문의사항이 있으시면 이슈를 등록해주세요.
