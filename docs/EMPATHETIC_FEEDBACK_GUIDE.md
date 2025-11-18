# 공감형 피드백 시스템 가이드

## 개요

이 시스템은 **오답 시 압박하는 메시지 대신 공감하고 응원하는 메시지**를 제공하여 학생들의 학습 동기를 높이고 성장 마인드셋(Growth Mindset)을 키우도록 설계되었습니다.

## 🎯 주요 특징

### 1. **공감형 언어 사용**
- ❌ "틀렸습니다. 다시 시도하세요."
- ✅ "괜찮아요! 실수는 배움의 과정이에요 🌱"

### 2. **긍정적 강화**
- 정답: 성취를 축하하고 자신감 향상
- 오답: 노력을 인정하고 재시도 격려
- 부분 정답: 진전을 인정하고 다음 단계 안내

### 3. **개인화된 피드백**
- 학생 이름 사용
- 시도 횟수 고려
- 하루 학습 진도 반영
- 최근 성공률 기반 격려

### 4. **시각적 친근함**
- 따뜻한 색상 (부드러운 녹색, 노란색, 주황색)
- 격려하는 이모지 사용
- 부드러운 애니메이션

## 📦 설치 및 설정

### 파일 구조
```
src/
├── lib/
│   └── empathetic-feedback.ts      # 메시지 라이브러리
├── components/
│   ├── EmpatheticFeedback.tsx      # 메인 컴포넌트
│   └── FeedbackDemo.tsx            # 사용 예시
└── docs/
    └── EMPATHETIC_FEEDBACK_GUIDE.md # 이 가이드
```

### 의존성
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  }
}
```

## 🚀 사용 방법

### 기본 사용법

```tsx
import EmpatheticFeedback from './components/EmpatheticFeedback';

function Quiz() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswer = (answer: string) => {
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  return (
    <div>
      {/* 퀴즈 UI */}

      {showFeedback && (
        <EmpatheticFeedback
          isCorrect={isCorrect}
          language="ko"
          attemptNumber={1}
        />
      )}
    </div>
  );
}
```

### 개인화된 피드백

```tsx
<EmpatheticFeedback
  isCorrect={false}
  attemptNumber={3}
  language="ko"
  context={{
    studentName: "지민",
    totalProblemsToday: 15,
    recentSuccessRate: 0.8,
    timeOfDay: "afternoon"
  }}
/>
```

### 자동 숨김 기능

```tsx
<EmpatheticFeedback
  isCorrect={true}
  language="ko"
  autoHideDuration={5000}  // 5초 후 자동 숨김
  onHide={() => console.log("피드백이 숨겨졌습니다")}
/>
```

### Toast 스타일 (화면 상단/하단)

```tsx
import { ToastFeedback } from './components/EmpatheticFeedback';

<ToastFeedback
  isCorrect={true}
  position="top"  // 또는 "bottom"
  language="ko"
  autoHideDuration={4000}
/>
```

### Compact 버전 (인라인 표시)

```tsx
import { CompactFeedback } from './components/EmpatheticFeedback';

<CompactFeedback
  type="encouragement"
  language="ko"
/>
```

## 🎨 커스터마이징

### CSS 클래스 추가

```tsx
<EmpatheticFeedback
  isCorrect={true}
  className="my-custom-class shadow-xl"
/>
```

### 스타일 오버라이드

```css
.empathetic-feedback {
  /* 기본 스타일 오버라이드 */
  font-size: 1.2rem;
  padding: 1.5rem;
}
```

## 🌐 다국어 지원

### 한국어 (기본)
```tsx
<EmpatheticFeedback language="ko" isCorrect={false} />
// "괜찮아요! 실수는 배움의 과정이에요 🌱"
```

### 영어
```tsx
<EmpatheticFeedback language="en" isCorrect={false} />
// "That's okay! Mistakes are part of learning 🌱"
```

### 새로운 언어 추가

`empathetic-feedback.ts`에서 메시지 추가:

```typescript
const JAPANESE_MESSAGES = {
  wrong: [
    "大丈夫です！間違いは学習の一部です 🌱",
    // ... 더 많은 메시지
  ],
  correct: [
    "素晴らしい！完璧です！ 👏",
    // ... 더 많은 메시지
  ],
  // ...
};
```

## 📊 API Reference

### EmpatheticFeedback Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'correct' \| 'wrong' \| 'partial' \| 'encouragement'` | - | 피드백 타입 직접 지정 |
| `isCorrect` | `boolean` | - | 정답 여부 (type 대신 사용 가능) |
| `attemptNumber` | `number` | `1` | 시도 횟수 |
| `language` | `'ko' \| 'en'` | `'ko'` | 언어 설정 |
| `context` | `FeedbackContext` | `{}` | 개인화 컨텍스트 |
| `visible` | `boolean` | `true` | 표시/숨김 |
| `autoHideDuration` | `number` | `0` | 자동 숨김 시간(ms), 0이면 수동 |
| `onShow` | `() => void` | - | 표시 시 콜백 |
| `onHide` | `() => void` | - | 숨김 시 콜백 |
| `className` | `string` | `''` | 추가 CSS 클래스 |

### FeedbackContext Interface

```typescript
interface FeedbackContext {
  studentName?: string;           // 학생 이름
  attemptNumber?: number;          // 시도 횟수
  totalProblemsToday?: number;     // 오늘 푼 문제 수
  recentSuccessRate?: number;      // 최근 성공률 (0-1)
  timeOfDay?: 'morning' | 'afternoon' | 'evening';  // 시간대
}
```

## 🔌 LMS 통합 예시

### Next.js / React 앱

```tsx
// pages/quiz/[id].tsx
import { useState } from 'react';
import EmpatheticFeedback from '@/components/EmpatheticFeedback';

export default function QuizPage() {
  const [feedback, setFeedback] = useState(null);

  const submitAnswer = async (answer: string) => {
    // LMS API 호출
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });

    const result = await response.json();

    // 피드백 표시
    setFeedback({
      isCorrect: result.isCorrect,
      attemptNumber: result.attemptNumber,
    });
  };

  return (
    <div>
      {/* 퀴즈 UI */}

      {feedback && (
        <EmpatheticFeedback
          isCorrect={feedback.isCorrect}
          attemptNumber={feedback.attemptNumber}
          language="ko"
          context={{
            totalProblemsToday: 12,
            recentSuccessRate: 0.85,
          }}
        />
      )}
    </div>
  );
}
```

### Express.js API 엔드포인트

```javascript
// server/routes/quiz.js
app.post('/api/quiz/submit', async (req, res) => {
  const { studentId, quizId, answer } = req.body;

  // 답안 검증
  const isCorrect = await checkAnswer(quizId, answer);

  // DB에 기록
  const attempt = await saveAttempt({
    studentId,
    quizId,
    answer,
    isCorrect,
  });

  // 학습 분석 데이터
  const stats = await getStudentStats(studentId);

  res.json({
    isCorrect,
    attemptNumber: attempt.attemptNumber,
    totalProblemsToday: stats.problemsToday,
    recentSuccessRate: stats.successRate,
  });
});
```

## 🧪 테스트

### 단위 테스트 (Jest + React Testing Library)

```tsx
import { render, screen } from '@testing-library/react';
import EmpatheticFeedback from './EmpatheticFeedback';

describe('EmpatheticFeedback', () => {
  it('정답 시 긍정적 메시지 표시', () => {
    render(<EmpatheticFeedback isCorrect={true} language="ko" />);

    // 긍정적 단어 확인
    expect(screen.getByRole('alert')).toHaveTextContent(/잘했어요|대단해요|완벽해요/);
  });

  it('오답 시 공감형 메시지 표시', () => {
    render(<EmpatheticFeedback isCorrect={false} language="ko" />);

    // 부정적 단어가 없는지 확인
    expect(screen.getByRole('alert')).not.toHaveTextContent(/틀렸|실패|잘못/);

    // 공감형 단어 확인
    expect(screen.getByRole('alert')).toHaveTextContent(/괜찮|노력|계속/);
  });

  it('자동 숨김 동작', async () => {
    jest.useFakeTimers();
    const onHide = jest.fn();

    render(
      <EmpatheticFeedback
        isCorrect={true}
        autoHideDuration={3000}
        onHide={onHide}
      />
    );

    jest.advanceTimersByTime(3000);
    expect(onHide).toHaveBeenCalled();
  });
});
```

## 📈 성과 측정

### 추적할 메트릭

1. **학생 참여도**
   - 문제 풀이 완료율
   - 재시도율
   - 세션 시간

2. **정서적 반응**
   - 피드백 이후 행동 (포기 vs 재시도)
   - 학습 지속 시간
   - 선택 피드백 (학생이 좋아요/싫어요 표시)

3. **학습 성과**
   - 개념 이해도 향상
   - 실수 후 학습 곡선
   - 장기 기억 보유율

### 분석 코드 예시

```typescript
// 피드백 효과 추적
const trackFeedback = (feedback: FeedbackData) => {
  analytics.track('empathetic_feedback_shown', {
    type: feedback.type,
    isCorrect: feedback.isCorrect,
    attemptNumber: feedback.attemptNumber,
    timestamp: new Date(),
  });
};

// 학생 반응 추적
const trackStudentReaction = (action: string) => {
  analytics.track('student_reaction', {
    action, // 'retry', 'continue', 'quit'
    previousFeedbackType: lastFeedback.type,
    timestamp: new Date(),
  });
};
```

## 🎓 교육학적 근거

### 성장 마인드셋 (Growth Mindset)
- 실수를 학습 기회로 프레이밍
- 노력과 과정 강조
- 지능은 고정되지 않고 발전 가능함을 전달

### 자기결정이론 (Self-Determination Theory)
- **자율성**: 학생이 스스로 재시도 결정
- **유능감**: 작은 진전도 인정
- **관계성**: 공감적 언어로 연결감 형성

### 정서적 안전 (Emotional Safety)
- 실패에 대한 두려움 감소
- 위험 감수 장려 (더 어려운 문제 시도)
- 학습 불안 완화

## 🔄 업데이트 및 개선

### 버전 히스토리
- **v1.0.0** (2025-11-18): 초기 릴리스
  - 한국어/영어 지원
  - 4가지 피드백 타입
  - React 컴포넌트 및 TypeScript 라이브러리

### 로드맵
- [ ] 더 많은 언어 지원 (일본어, 중국어)
- [ ] AI 기반 개인화 메시지 생성
- [ ] 음성 피드백 옵션
- [ ] 애니메이션 캐릭터 통합
- [ ] A/B 테스트 기능 내장

## 📞 지원 및 기여

### 문의
- 이슈: [GitHub Issues](https://github.com/your-repo/issues)
- 이메일: support@example.com

### 기여하기
1. Fork 저장소
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**만든 사람**: AI Education System Team
**최종 업데이트**: 2025-11-18

💡 **Tip**: 이 시스템은 학생들에게 긍정적인 학습 경험을 제공하여 장기적인 학습 동기와 성과를 향상시킵니다.
