# Mindfulness Routine Components

LMS 웹앱에서 문제 전환 시 마인드풀니스 루틴을 제공하는 React 컴포넌트 라이브러리입니다.

## 기능

- 🫁 **호흡 운동**: 시각적 가이드와 함께하는 호흡 운동
- 🧘 **스트레칭**: 간단한 스트레칭 가이드
- ☕ **휴식**: 짧은 휴식 타임
- ⚙️ **설정 가능**: 지속 시간, 빈도, 루틴 유형 등 커스터마이즈
- 💾 **영구 저장**: LocalStorage를 통한 사용자 설정 저장
- 📱 **반응형**: 모바일 및 데스크톱 지원
- ♿ **접근성**: ARIA 라벨 및 키보드 내비게이션 지원

## 설치

```bash
npm install
```

필요한 의존성:
- React 18+
- TypeScript (권장)

## 빠른 시작

### 1. 기본 사용법

```tsx
import React, { useState } from 'react';
import { ProblemNavigator, Problem } from './components/mindfulness';

const problems: Problem[] = [
  { id: '1', type: 'math', content: { question: '2 + 2 = ?' } },
  { id: '2', type: 'math', content: { question: '5 × 3 = ?' } },
  { id: '3', type: 'math', content: { question: '10 ÷ 2 = ?' } },
];

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <ProblemNavigator
      problems={problems}
      currentIndex={currentIndex}
      onNext={setCurrentIndex}
      renderProblem={(problem) => (
        <div>
          <h2>{problem.content.question}</h2>
          {/* 문제 UI */}
        </div>
      )}
      mindfulnessSettings={{
        enabled: true,
        routineType: 'breathing',
        duration: 30,
        frequency: 1, // 매 문제마다
      }}
    />
  );
}
```

### 2. 설정 UI 사용

```tsx
import React from 'react';
import { MindfulnessSettings, useMindfulness } from './components/mindfulness';

function SettingsPage() {
  const { config, updateConfig, resetToDefaults } = useMindfulness({
    persistConfig: true, // LocalStorage에 저장
  });

  return (
    <MindfulnessSettings
      config={config}
      onConfigChange={updateConfig}
      onReset={resetToDefaults}
    />
  );
}
```

### 3. 독립적인 마인드풀니스 루틴 사용

```tsx
import React, { useState } from 'react';
import { MindfulnessRoutine } from './components/mindfulness';

function MyComponent() {
  const [showRoutine, setShowRoutine] = useState(false);

  return (
    <>
      <button onClick={() => setShowRoutine(true)}>
        마인드풀니스 시작
      </button>

      {showRoutine && (
        <MindfulnessRoutine
          onComplete={() => setShowRoutine(false)}
          routineType="breathing"
          duration={30}
          allowSkip={true}
        />
      )}
    </>
  );
}
```

## 컴포넌트 API

### ProblemNavigator

문제 전환과 마인드풀니스 루틴을 통합한 네비게이터 컴포넌트

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `problems` | `Problem[]` | required | 문제 목록 |
| `currentIndex` | `number` | required | 현재 문제 인덱스 |
| `onNext` | `(index: number) => void` | required | 다음 문제로 이동 시 콜백 |
| `onPrevious` | `(index: number) => void` | optional | 이전 문제로 이동 시 콜백 |
| `renderProblem` | `(problem, index) => ReactNode` | required | 문제 렌더링 함수 |
| `mindfulnessSettings` | `MindfulnessSettings` | see below | 마인드풀니스 설정 |
| `onComplete` | `() => void` | optional | 모든 문제 완료 시 콜백 |

**MindfulnessSettings:**

```typescript
{
  enabled: boolean;           // 활성화 여부
  routineType?: 'breathing' | 'stretch' | 'pause';  // 루틴 유형
  duration?: number;          // 지속 시간(초)
  allowSkip?: boolean;        // 건너뛰기 허용
  frequency?: number;         // 표시 빈도 (N문제마다)
  showTimer?: boolean;        // 타이머 표시
}
```

### MindfulnessRoutine

독립적인 마인드풀니스 루틴 컴포넌트

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onComplete` | `() => void` | required | 완료 시 콜백 |
| `duration` | `number` | 30 | 지속 시간(초) |
| `routineType` | `'breathing' \| 'stretch' \| 'pause'` | 'breathing' | 루틴 유형 |
| `allowSkip` | `boolean` | true | 건너뛰기 허용 |
| `showTimer` | `boolean` | true | 타이머 표시 |

### MindfulnessSettings

설정 UI 컴포넌트

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `config` | `MindfulnessConfig` | 현재 설정 |
| `onConfigChange` | `(config: Partial<MindfulnessConfig>) => void` | 설정 변경 콜백 |
| `onReset` | `() => void` | 기본값 재설정 콜백 |

### useMindfulness

설정 관리를 위한 커스텀 훅

```typescript
const {
  config,           // 현재 설정
  updateConfig,     // 설정 업데이트
  toggleEnabled,    // 활성화/비활성화 토글
  setRoutineType,   // 루틴 유형 설정
  setDuration,      // 지속 시간 설정
  setFrequency,     // 빈도 설정
  resetToDefaults,  // 기본값으로 재설정
} = useMindfulness({
  initialConfig: {},      // 초기 설정
  persistConfig: true,    // LocalStorage 저장
  storageKey: 'custom-key', // 커스텀 저장 키
});
```

## 루틴 유형

### 1. 호흡 운동 (breathing)
- 4초 들이쉬기
- 4초 멈추기
- 4초 내쉬기
- 시각적 애니메이션 가이드

### 2. 스트레칭 (stretch)
- 목 운동
- 어깨 운동
- 손목 운동
- 간단한 지침 제공

### 3. 휴식 (pause)
- 짧은 휴식 메시지
- 눈 감고 쉬기
- 격려 메시지

## 고급 사용 예제

### 조건부 마인드풀니스 표시

```tsx
const mindfulnessSettings = {
  enabled: true,
  routineType: 'breathing',
  duration: 30,
  frequency: 3, // 3문제마다 한 번
  allowSkip: true,
};
```

### 커스텀 스타일링

CSS 변수를 사용하여 스타일을 커스터마이즈할 수 있습니다:

```css
.mindfulness-overlay {
  --primary-gradient: linear-gradient(135deg, #your-color-1, #your-color-2);
  --text-color: #your-text-color;
}
```

### 이벤트 추적

```tsx
<ProblemNavigator
  problems={problems}
  currentIndex={currentIndex}
  onNext={(index) => {
    setCurrentIndex(index);
    analytics.track('problem_completed', { problemId: problems[index - 1].id });
  }}
  mindfulnessSettings={{
    enabled: true,
    routineType: 'breathing',
  }}
/>
```

## 브라우저 지원

- Chrome/Edge: 최신 2개 버전
- Firefox: 최신 2개 버전
- Safari: 최신 2개 버전
- 모바일 브라우저: iOS Safari 12+, Chrome Mobile

## 접근성

- ARIA 라벨 지원
- 키보드 내비게이션
- 스크린 리더 호환
- `prefers-reduced-motion` 미디어 쿼리 지원

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 문의

문제가 발생하거나 질문이 있으시면 이슈를 열어주세요.
