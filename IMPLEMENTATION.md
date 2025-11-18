# LMS 채점 시각 효과 구현 문서

## 개요

이 문서는 LMS와 연동된 채점 결과 시각 효과 구현에 대한 기술적 세부사항을 설명합니다.

## 구현된 기능

### 1. 시각 효과 컴포넌트

#### GradingResult 컴포넌트 (`frontend/src/components/GradingResult.tsx`)

**주요 기능:**
- 채점 결과 표시
- 성공/실패에 따른 시각 효과 자동 적용
- 점수 카운터 애니메이션
- 피드백 메시지 표시
- 접근성 지원

**Props:**
```typescript
interface GradingResultProps {
  result: GradingResultType;
  config?: Partial<GradingDisplayConfig>;
  onAnimationComplete?: () => void;
}
```

**사용 예제:**
```tsx
<GradingResultComponent
  result={{
    id: 'result-1',
    studentId: 'student-123',
    moduleId: 'module-1',
    problemId: 'problem-1',
    answer: '3/4',
    isCorrect: true,
    score: 10,
    maxScore: 10,
    feedback: '정확합니다!',
    timestamp: new Date(),
    timeSpent: 45.5
  }}
  config={{
    showAnimation: true,
    animationDuration: 800,
    soundEnabled: false
  }}
  onAnimationComplete={() => console.log('Done!')}
/>
```

### 2. CSS 애니메이션

#### 성공 펄스 효과

**애니메이션 타임라인:**
```
0ms   : 초기 상태 (scale: 1)
400ms : 최대 확대 (scale: 1.05) + 그림자 최대
800ms : 원래 크기로 복귀
```

**주요 CSS:**
```css
@keyframes success-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}
```

#### 오류 크랙 효과

**애니메이션 타임라인:**
```
0ms   : 초기 상태
100ms : 왼쪽으로 이동 + 약간 회전
200ms : 오른쪽으로 이동 + 반대 회전
...
600ms : 원래 위치로 복귀
```

**크랙 라인 애니메이션:**
- 3개의 크랙 라인이 순차적으로 나타남
- 각 라인은 0.1초 간격으로 지연
- opacity: 0 → 0.8 → 0

### 3. LMS API 클라이언트

#### lmsApi (`frontend/src/api/lmsApi.ts`)

**주요 메서드:**

```typescript
// 답안 제출
await lmsApi.submitAnswer({
  studentId: 'student-123',
  moduleId: 'module-1',
  problemId: 'problem-1',
  answer: '3/4',
  timeSpent: 45.5
});

// 진행 상황 조회
const progress = await lmsApi.getModuleProgress('student-123', 'module-1');

// LMS 동기화
await lmsApi.syncWithLMS('student-123', 'module-1');

// 성적 내보내기
await lmsApi.exportGradesToLMS('module-1');
```

### 4. 백엔드 채점 서비스

#### GradingService (`backend/src/services/gradingService.ts`)

**채점 규칙 타입:**

1. **Exact Match**: 정확한 문자열 일치
   ```typescript
   {
     ruleType: 'exact_match',
     feedbackOnSuccess: '정확합니다!',
     feedbackOnFailure: '다시 시도해보세요'
   }
   ```

2. **Partial Match**: 유사도 기반 부분 점수
   ```typescript
   {
     ruleType: 'partial_match',
     ruleConfig: { threshold: 0.8 },
     feedbackOnSuccess: '거의 정답입니다!',
     feedbackOnFailure: '조금 더 생각해보세요'
   }
   ```

3. **Custom Function**: 사용자 정의 채점 함수
   ```typescript
   {
     ruleType: 'custom_function',
     ruleConfig: {
       functionBody: `
         return {
           isCorrect: answer === correctAnswer,
           score: answer === correctAnswer ? maxScore : 0
         };
       `
     }
   }
   ```

**채점 프로세스:**
```
1. 문제 정보 조회
2. 채점 규칙 조회
3. 규칙 적용
4. 점수 계산
5. 피드백 생성
6. 결과 저장
7. 결과 반환
```

### 5. LMS 연동 서비스

#### LMSService (`backend/src/services/lmsService.ts`)

**지원 LMS 플랫폼:**

1. **Canvas LMS**
   - API: `/courses/{courseId}/assignments/grades`
   - 인증: Bearer Token

2. **Moodle**
   - API: `/webservice/rest/server.php`
   - 함수: `mod_assign_save_grade`, `core_enrol_get_enrolled_users`
   - 인증: Web Service Token

3. **Blackboard**
   - API: `/learn/api/public/v1/courses/{courseId}/gradebook`
   - 인증: OAuth 2.0

4. **Custom LMS**
   - 커스텀 웹훅/API 엔드포인트

**동기화 프로세스:**
```
1. LMS 통합 설정 확인
2. 학생 진행 상황 조회
3. LMS 타입에 따라 적절한 API 호출
4. 성적 데이터 전송
5. 마지막 동기화 시간 업데이트
```

## 코드 구조 설명

### 타입 시스템

모든 데이터는 TypeScript로 타입 정의되어 있습니다:

```typescript
// 채점 결과
interface GradingResult {
  id: string;
  studentId: string;
  moduleId: string;
  problemId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback?: string;
  timestamp: Date;
  timeSpent?: number;
}

// 모듈 진행 상황
interface ModuleProgress {
  moduleId: string;
  studentId: string;
  completedProblems: number;
  totalProblems: number;
  averageScore: number;
  startedAt: Date;
  completedAt?: Date;
}

// 시각 효과 설정
interface GradingDisplayConfig {
  showAnimation: boolean;
  animationDuration: number;
  soundEnabled: boolean;
  accessibilityMode: boolean;
}
```

### 애니메이션 제어

애니메이션은 React의 `useEffect`와 `useState`를 사용하여 제어됩니다:

```typescript
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (config.showAnimation) {
    setIsAnimating(true);

    const timer = setTimeout(() => {
      setIsAnimating(false);
      onAnimationComplete?.();
    }, config.animationDuration);

    return () => clearTimeout(timer);
  }
}, [result]);
```

### 점수 카운터 애니메이션

`requestAnimationFrame`을 사용한 부드러운 카운터 애니메이션:

```typescript
const animateScore = (start: number, end: number, duration: number) => {
  const startTime = Date.now();

  const updateScore = () => {
    const now = Date.now();
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.floor(start + (end - start) * progress);
    setDisplayScore(current);

    if (progress < 1) {
      requestAnimationFrame(updateScore);
    }
  };

  requestAnimationFrame(updateScore);
};
```

## 접근성 고려사항

### 1. Reduced Motion 지원

```css
@media (prefers-reduced-motion: reduce) {
  .grading-result.animate,
  .grading-result.animate::before,
  .grading-result.animate .crack-line,
  .grading-result.animate .result-icon {
    animation: none !important;
    transition: none !important;
  }
}
```

### 2. 스크린 리더 지원

```tsx
<div
  className="grading-result"
  role="alert"
  aria-live="polite"
  aria-atomic="true"
>
  <div
    className="result-icon"
    role="img"
    aria-label={result.isCorrect ? '정답' : '오답'}
  >
    {getResultIcon()}
  </div>
</div>
```

### 3. 키보드 내비게이션

모든 인터랙티브 요소는 키보드로 접근 가능합니다.

## 성능 최적화

### 1. CSS 애니메이션 사용

JavaScript 대신 CSS 애니메이션을 사용하여 GPU 가속 활용:
- `transform` 속성 사용 (reflow 방지)
- `opacity` 속성 사용
- `will-change` 최소화

### 2. React 최적화

- 불필요한 리렌더링 방지
- `useEffect` 의존성 배열 최적화
- 애니메이션 타이머 cleanup

### 3. API 호출 최적화

- 요청 중복 방지
- 에러 핸들링
- 재시도 로직 (향후 구현 예정)

## 확장 가능성

### 1. 추가 시각 효과

새로운 효과를 쉽게 추가할 수 있는 구조:

```css
/* 새로운 효과 예: 별 터뜨리기 */
@keyframes star-burst {
  /* ... */
}

.grading-result.perfect.animate {
  animation: star-burst 1s ease-out;
}
```

### 2. 추가 LMS 플랫폼

새 LMS 플랫폼 지원 추가:

```typescript
// lmsService.ts
private async syncToNewLMS(
  integration: LMSIntegration,
  progress: ModuleProgress
): Promise<void> {
  // 새 LMS API 구현
}
```

### 3. 커스텀 채점 규칙

새로운 채점 규칙 타입 추가:

```typescript
// gradingService.ts
private async mathematicalExpressionRule(
  answer: string,
  problem: Problem,
  rule: GradingRule
): Promise<GradingResult> {
  // 수식 평가 로직
}
```

## 테스트 전략

### 단위 테스트 (향후 구현)

```typescript
describe('GradingService', () => {
  it('should grade correct answer as 100%', async () => {
    const result = await gradingService.gradeAnswer(
      'student-1',
      'module-1',
      'problem-1',
      '3/4'
    );
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(10);
  });
});
```

### 통합 테스트 (향후 구현)

```typescript
describe('LMS Integration', () => {
  it('should sync grades to Canvas', async () => {
    await lmsService.syncStudentProgress('student-1', 'module-1');
    // Verify API call was made
  });
});
```

### E2E 테스트 (향후 구현)

- 답안 제출 플로우
- 시각 효과 렌더링
- LMS 동기화

## 배포 고려사항

### 환경 변수

```env
# 프론트엔드
REACT_APP_API_URL=https://api.example.com

# 백엔드
PORT=3001
NODE_ENV=production
LMS_TYPE=canvas
LMS_API_ENDPOINT=https://canvas.instructure.com/api/v1
LMS_API_KEY=<secure-key>
```

### 보안

- API 키는 환경 변수로 관리
- CORS 설정
- 입력 검증
- SQL 인젝션 방지 (DB 구현 시)

### 모니터링

- API 응답 시간
- 에러 로그
- LMS 동기화 성공/실패율

## 향후 개선사항

1. **데이터베이스 연동**
   - PostgreSQL 스키마 구현
   - ORM (Sequelize/TypeORM) 도입

2. **인증/권한**
   - JWT 기반 인증
   - 역할 기반 접근 제어 (RBAC)

3. **실시간 기능**
   - WebSocket을 통한 실시간 채점 결과 푸시
   - 선생님 대시보드 실시간 업데이트

4. **고급 시각 효과**
   - 파티클 효과
   - 사운드 효과
   - 햅틱 피드백 (모바일)

5. **분석 기능**
   - 학생 성과 대시보드
   - 문제별 정답률 통계
   - 학습 패턴 분석

## 결론

이 구현은 LMS와 연동된 채점 시스템에 매력적인 시각 효과를 추가하면서도 접근성, 성능, 확장성을 고려한 견고한 아키텍처를 제공합니다.
