# Mini Celebration Component

쉬운 문제를 성공했을 때 표시되는 가볍고 귀여운 축하 효과 컴포넌트입니다.

## 특징

- 🎉 **가볍고 미니멀한 디자인**: 쉬운 문제에 적합한 작은 축하 효과
- ⭐ **별과 파티클 애니메이션**: 중앙의 별과 8개의 컬러풀한 파티클
- ⚡ **순수 CSS 애니메이션**: 높은 성능
- ♿ **접근성 지원**: `prefers-reduced-motion` 존중
- 📱 **반응형 디자인**: 모바일 친화적
- 🌙 **다크모드 지원**: 시스템 설정에 따라 자동 조정

## 사용법

### 기본 사용

```tsx
import { MiniCelebration } from '@/components/celebrations';

function MyComponent() {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSuccess = () => {
    setShowCelebration(true);
  };

  return (
    <>
      <MiniCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
      <button onClick={handleSuccess}>정답!</button>
    </>
  );
}
```

### 문제 난이도와 함께 사용

```tsx
import { MiniCelebration } from '@/components/celebrations';
import { isEasyProblem, DifficultyLevel } from '@/types';

function ProblemComponent() {
  const [showCelebration, setShowCelebration] = useState(false);
  const difficulty: DifficultyLevel = 2; // 쉬운 문제

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect && isEasyProblem(difficulty)) {
      setShowCelebration(true);
    }
  };

  return (
    <MiniCelebration
      show={showCelebration}
      onComplete={() => setShowCelebration(false)}
      duration={1500}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `show` | `boolean` | ✅ | - | 축하 효과 표시 여부 |
| `onComplete` | `() => void` | ❌ | - | 애니메이션 완료 시 콜백 |
| `duration` | `number` | ❌ | `1500` | 애니메이션 지속 시간 (ms) |

## 애니메이션 상세

### 1. 중앙 별 (⭐)
- **크기**: 3rem (모바일: 2.5rem)
- **애니메이션**: 회전하면서 커졌다 작아짐
- **지속 시간**: 1.5초

### 2. 텍스트 ("잘했어요!")
- **색상**: 초록색 (#4CAF50)
- **애니메이션**: 팝업 효과
- **지속 시간**: 1.5초

### 3. 파티클 (8개)
- **색상**: 랜덤 (금색, 핑크, 하늘색, 연두색, 보라색)
- **애니메이션**: 중앙에서 사방으로 퍼짐
- **지속 시간**: 1.2초 (각각 다른 딜레이)

## 접근성

### Reduced Motion
사용자가 `prefers-reduced-motion`을 설정한 경우, 모든 애니메이션이 즉시 완료됩니다.

```css
@media (prefers-reduced-motion: reduce) {
  .mini-celebration * {
    animation-duration: 0.01ms !important;
  }
}
```

### ARIA 속성
- `role="img"`: 이미지로 인식
- `aria-label="축하합니다!"`: 스크린 리더 지원

## 커스터마이징

### 색상 변경

CSS 변수를 사용하여 파티클 색상을 변경할 수 있습니다:

```tsx
<div
  className="particle"
  style={{
    '--particle-color': '#FF0000', // 빨간색으로 변경
  } as React.CSSProperties}
/>
```

### 지속 시간 조정

```tsx
<MiniCelebration
  show={true}
  duration={2000} // 2초로 연장
/>
```

## 성능 고려사항

- **CSS 애니메이션 사용**: JavaScript 애니메이션보다 효율적
- **GPU 가속**: `transform`과 `opacity` 속성 사용
- **자동 정리**: 애니메이션 완료 후 자동으로 DOM에서 제거

## 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 테스트

```tsx
import { render, screen } from '@testing-library/react';
import { MiniCelebration } from './MiniCelebration';

test('displays celebration when show is true', () => {
  render(<MiniCelebration show={true} />);
  expect(screen.getByTestId('mini-celebration')).toBeInTheDocument();
});
```

## 관련 컴포넌트

- [`ProblemFeedback`](../feedback/README.md) - 문제 피드백과 자동 통합
- [`isEasyProblem`](../../types/problem.ts) - 쉬운 문제 판별 유틸리티
