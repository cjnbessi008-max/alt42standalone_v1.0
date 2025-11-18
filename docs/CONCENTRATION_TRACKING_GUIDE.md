# 집중력 추적 및 쉬운 문제 우회 기능 가이드

## 개요

이 문서는 AI 교육 시스템의 **집중력 추적 및 쉬운 문제 우회 기능**에 대한 상세한 기술 가이드입니다.

## 목차

1. [핵심 개념](#핵심-개념)
2. [집중력 점수 계산](#집중력-점수-계산)
3. [우회 트리거 메커니즘](#우회-트리거-메커니즘)
4. [구현 가이드](#구현-가이드)
5. [최적화 전략](#최적화-전략)
6. [문제 해결](#문제-해결)

---

## 핵심 개념

### 집중력이란?

교육 맥락에서 **집중력(Concentration)**은 학생이 학습 과제에 얼마나 효과적으로 몰입하고 있는지를 나타내는 지표입니다.

우리 시스템은 다음 4가지 차원에서 집중력을 측정합니다:

1. **시간 효율성 (Time Efficiency)**: 문제를 푸는 데 걸리는 시간이 적절한가?
2. **정답률 (Success Rate)**: 최근 문제들을 얼마나 정확하게 풀고 있는가?
3. **참여도 (Engagement)**: 문제와 얼마나 활발하게 상호작용하는가?
4. **집중 유지 (Focus)**: 주의가 산만해지지 않고 과제에 집중하는가?

### 집중력 점수 (Concentration Score)

- **범위**: 0.0 ~ 1.0
- **0.0**: 완전히 집중하지 못함
- **0.5**: 보통 수준의 집중력
- **1.0**: 완벽한 집중 상태

### 우회(Bypass)란?

학생의 집중력이 떨어지거나 문제가 너무 어려울 때, 시스템이 자동으로 **더 쉬운 난이도의 문제**를 제안하는 기능입니다.

**목적**:
- 학생의 자신감 회복
- 기초 개념 복습
- 학습 동기 유지
- 점진적 난이도 상승

---

## 집중력 점수 계산

### 알고리즘

집중력 점수는 4가지 하위 점수의 가중 평균으로 계산됩니다:

```
concentrationScore =
  timeEfficiencyScore  × 0.25 +
  successRateScore     × 0.35 +
  engagementScore      × 0.20 +
  focusScore           × 0.20
```

### 1. 시간 효율성 점수 (25%)

문제를 푸는 데 걸리는 시간을 평가합니다.

**계산 로직**:

| 평균 시간 | 점수 | 해석 |
|----------|------|------|
| < 30초 | 0.60 | 너무 빠름 (추측 가능성) |
| 30 ~ 120초 | 1.00 | 이상적인 시간 |
| 120 ~ 180초 | 0.75 | 약간 느림 |
| 180 ~ 300초 | 0.50 | 집중력 저하 가능 |
| > 300초 | 0.25 | 매우 느림 (집중력 문제) |

**코드**:

```javascript
function calculateTimeEfficiency(attempts) {
  const avgTime = attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / attempts.length;

  if (avgTime < 30) return 0.60;
  if (avgTime >= 30 && avgTime <= 120) return 1.0;
  if (avgTime > 120 && avgTime <= 180) return 0.75;
  if (avgTime > 180 && avgTime <= 300) return 0.50;
  return 0.25;
}
```

### 2. 정답률 점수 (35%)

최근 문제들의 정답률을 평가합니다. **가장 중요한 지표**입니다.

**계산 로직**:

```javascript
successRateScore = correctCount / totalAttempts
```

| 정답률 | 점수 | 해석 |
|--------|------|------|
| 100% | 1.00 | 완벽 |
| 80% | 0.80 | 우수 |
| 60% | 0.60 | 보통 |
| 40% | 0.40 | 어려움 겪는 중 |
| 20% | 0.20 | 심각한 어려움 |
| 0% | 0.00 | 이해하지 못함 |

### 3. 참여도 점수 (20%)

문제와 얼마나 활발하게 상호작용하는지 평가합니다.

**측정 항목**:
- 클릭 횟수
- 입력 횟수
- 드래그 앤 드롭 횟수
- 힌트 요청 횟수

**계산 로직**:

| 평균 상호작용 | 점수 | 해석 |
|--------------|------|------|
| < 3 | 0.40 | 참여 부족 |
| 3 ~ 20 | 1.00 | 적극적 참여 |
| > 20 | 0.60 | 혼란 가능성 |

### 4. 집중 유지 점수 (20%)

주의가 산만해지지 않고 과제에 집중하는지 평가합니다.

**측정 항목**:
- **pauseCount**: 일시정지/비활동 횟수
- **focusLostCount**: 탭 전환, 창 최소화 등

**계산 로직**:

```javascript
function calculateFocus(attempts) {
  const avgPauses = attempts.reduce((sum, a) => sum + (a.pause_count || 0), 0) / attempts.length;
  const avgFocusLoss = attempts.reduce((sum, a) => sum + (a.focus_lost_count || 0), 0) / attempts.length;

  let score = 1.0;

  // 일시정지 페널티 (최대 -0.30)
  score -= Math.min(0.30, avgPauses * 0.10);

  // 포커스 상실 페널티 (최대 -0.40)
  score -= Math.min(0.40, avgFocusLoss * 0.15);

  return Math.max(0.20, score); // 최소 0.20 보장
}
```

---

## 우회 트리거 메커니즘

### 트리거 조건

우회는 다음 조건 중 **하나라도** 만족하면 제안됩니다:

#### 1. 집중력 저하 (Low Concentration)

```javascript
concentrationScore < 0.40
```

**의미**: 전반적인 집중력이 임계값 이하로 떨어짐

**메시지**:
> "집중력이 조금 떨어진 것 같아요. 레벨 2의 쉬운 문제로 다시 자신감을 찾아볼까요?"

#### 2. 반복적인 오답 (Multiple Failures)

```javascript
failureCount >= 3
```

**의미**: 같은 문제에서 3번 이상 틀림

**메시지**:
> "이 문제가 어려운 것 같네요. 레벨 2의 더 쉬운 문제로 연습한 후 다시 도전해볼까요?"

#### 3. 과도한 시간 소요 (Excessive Time)

```javascript
avgTimeSpent > 300 seconds (5분)
```

**의미**: 평균 문제 풀이 시간이 5분을 초과

**메시지**:
> "이 문제에 시간이 많이 걸리고 있어요. 레벨 2의 쉬운 문제로 기초를 다져볼까요?"

### 우회 흐름도

```
학생이 문제 풀이
      ↓
답안 제출
      ↓
집중력 점수 계산
      ↓
우회 필요 여부 확인
      ↓
      ├─ 우회 필요 ─→ 쉬운 문제 제안
      │                    ↓
      │              학생이 선택
      │                    ↓
      │         ├─ 수락 ─→ 쉬운 문제로 이동
      │         └─ 거부 ─→ 현재 문제 계속
      │
      └─ 우회 불필요 ─→ 다음 문제로 진행
```

### 난이도 조정

우회 시 난이도는 **현재 난이도 - 1**로 설정됩니다.

**예시**:
- 현재 난이도: 레벨 3
- 우회 난이도: 레벨 2

**설정 가능한 값** (concentration_thresholds 테이블):
```sql
difficulty_reduction INTEGER DEFAULT 1
```

---

## 구현 가이드

### 백엔드 통합

#### 1. 학생 시도 기록

```javascript
import pg from 'pg';
const pool = new pg.Pool({ /* config */ });

async function recordAttempt(attemptData) {
  const query = `
    INSERT INTO student_attempts (
      student_id, problem_id, module_id,
      answer, is_correct,
      time_spent_seconds, interaction_count,
      pause_count, focus_lost_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    attemptData.studentId,
    attemptData.problemId,
    attemptData.moduleId,
    attemptData.answer,
    attemptData.isCorrect,
    attemptData.timeSpent,
    attemptData.interactionCount,
    attemptData.pauseCount,
    attemptData.focusLostCount
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}
```

#### 2. 집중력 점수 계산 트리거

```javascript
import { calculateConcentrationScore, checkBypassNeeded } from './services/concentration-service.js';

async function handleProblemSubmission(req, res) {
  const { studentId, moduleId, problemId, answer } = req.body;

  // 1. 답안 기록
  const attempt = await recordAttempt({ /* ... */ });

  // 2. 집중력 점수 계산
  const concentrationScore = await calculateConcentrationScore(studentId, moduleId);

  // 3. 우회 필요 여부 확인
  const bypassCheck = await checkBypassNeeded(studentId, moduleId, problemId);

  res.json({
    attempt,
    concentrationScore,
    bypassCheck
  });
}
```

### 프론트엔드 통합

#### 1. Hook 사용

```tsx
import { useConcentrationTracking } from './hooks/useConcentrationTracking';

function ProblemPage() {
  const {
    concentrationScore,
    bypassOffer,
    showBypassPrompt,
    startProblem,
    trackInteraction,
    acceptBypass,
    declineBypass,
    checkAndOfferBypass
  } = useConcentrationTracking(studentId, moduleId);

  // 문제 시작 시
  useEffect(() => {
    startProblem(problem.id);
  }, [problem.id]);

  // 답안 제출 시
  const handleSubmit = async (answer) => {
    await submitAnswer(answer);
    await checkAndOfferBypass(problem.id, problem.difficulty);
  };

  return (
    <div onClick={trackInteraction}>
      {/* UI */}
    </div>
  );
}
```

#### 2. 컴포넌트 배치

```tsx
<div className="learning-interface">
  {/* 집중력 표시기 */}
  {concentrationScore && (
    <ConcentrationIndicator
      score={concentrationScore.score}
      showDetails
    />
  )}

  {/* 문제 영역 */}
  <ProblemDisplay problem={currentProblem} />

  {/* 우회 프롬프트 */}
  {showBypassPrompt && bypassOffer && (
    <BypassPrompt
      open={showBypassPrompt}
      triggerReason={bypassOffer.bypassEvent.trigger_reason}
      originalDifficulty={bypassOffer.bypassEvent.original_difficulty}
      bypassDifficulty={bypassOffer.easierProblem.difficulty_level}
      onAccept={acceptBypass}
      onDecline={declineBypass}
    />
  )}
</div>
```

---

## 최적화 전략

### 1. 데이터베이스 최적화

#### 인덱스 활용

```sql
-- 최근 시도 조회 최적화
CREATE INDEX idx_student_attempts_recent
ON student_attempts(student_id, module_id, attempted_at DESC);

-- 집중력 점수 조회 최적화
CREATE INDEX idx_concentration_scores_latest
ON concentration_scores(student_id, module_id, calculated_at DESC);
```

#### 쿼리 최적화

```javascript
// ❌ 나쁜 예: 모든 시도를 가져옴
const attempts = await pool.query(
  'SELECT * FROM student_attempts WHERE student_id = $1',
  [studentId]
);

// ✅ 좋은 예: 최근 N개만 가져옴
const attempts = await pool.query(
  'SELECT * FROM student_attempts WHERE student_id = $1 AND module_id = $2 ORDER BY attempted_at DESC LIMIT $3',
  [studentId, moduleId, 5]
);
```

### 2. 캐싱 전략

#### Redis 활용

```javascript
import Redis from 'ioredis';
const redis = new Redis();

async function getCachedConcentrationScore(studentId, moduleId) {
  const cacheKey = `concentration:${studentId}:${moduleId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // 계산
  const score = await calculateConcentrationScore(studentId, moduleId);

  // 캐시 (1분 TTL)
  await redis.setex(cacheKey, 60, JSON.stringify(score));

  return score;
}
```

### 3. 프론트엔드 최적화

#### Debounce 적용

```typescript
import { debounce } from 'lodash';

const trackInteractionDebounced = debounce(() => {
  trackInteraction();
}, 500);

// 사용
<div onClick={trackInteractionDebounced}>
```

#### 메모이제이션

```tsx
const concentrationDisplay = useMemo(() => (
  <ConcentrationIndicator score={concentrationScore.score} />
), [concentrationScore.score]);
```

---

## 문제 해결

### 문제 1: 집중력 점수가 계산되지 않음

**증상**: `concentrationScore`가 `null`

**원인**:
- 학생의 시도 기록이 없음
- 데이터베이스 연결 오류

**해결**:

```javascript
// 시도 기록 확인
SELECT COUNT(*) FROM student_attempts
WHERE student_id = 'uuid' AND module_id = 'uuid';

// 로그 확인
console.log('Attempts:', attempts.length);
if (attempts.length === 0) {
  return defaultScore; // 기본값 반환
}
```

### 문제 2: 우회가 너무 자주 제안됨

**증상**: 학생이 조금만 어려워해도 우회 제안

**원인**:
- 임계값이 너무 높게 설정됨 (예: 0.70)

**해결**:

```sql
-- 임계값 조정
UPDATE concentration_thresholds
SET bypass_trigger_score = 0.40
WHERE module_id = 'uuid';
```

### 문제 3: 성능 저하

**증상**: API 응답이 느림 (> 2초)

**원인**:
- 인덱스 누락
- 불필요한 데이터 조회

**해결**:

```sql
-- 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM student_attempts
WHERE student_id = 'uuid' ORDER BY attempted_at DESC LIMIT 5;

-- 인덱스 생성
CREATE INDEX idx_student_attempts_performance
ON student_attempts(student_id, attempted_at DESC)
INCLUDE (is_correct, time_spent_seconds);
```

---

## 참고 자료

- [PRD: AI Education System Pipeline](../tasks/0001-prd-ai-education-pipeline.md)
- [Database Schema](../database/migrations/001_concentration_tracking_schema.sql)
- [API Documentation](../README.md#api-endpoints)

---

**작성일**: 2025-11-18
**버전**: 1.0.0
