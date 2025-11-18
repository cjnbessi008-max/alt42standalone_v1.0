# 메타인지 미러 시스템 - 구현 가이드

## 📐 시스템 개요

이 문서는 "지금 뭘 하고 있지?" 메타인지 미러링 시스템의 구현 세부 사항을 설명합니다.

## 🎯 핵심 개념

### 메타인지 (Metacognition)
학습자가 자신의 학습 과정을 인식하고 모니터링하며 조절하는 능력입니다.

### 메타인지 미러링
학습자의 현재 학습 상태를 실시간으로 시각화하여 보여줌으로써, 스스로 학습 과정을 인식할 수 있도록 돕는 시스템입니다.

## 🏛️ 아키텍처 상세

### 1. 프론트엔드 구조

```
frontend/src/
├── components/              # UI 컴포넌트
│   ├── MetacognitionMirror.tsx         # 메인 미러 컴포넌트
│   ├── CurrentActivityCard.tsx         # 현재 활동 카드
│   ├── FocusLevelIndicator.tsx         # 집중도 표시기
│   ├── ReflectionPromptsPanel.tsx      # 성찰 프롬프트
│   ├── RecentActivitiesTimeline.tsx    # 활동 타임라인
│   ├── TimeDistributionChart.tsx       # 시간 분포 차트
│   └── LearningInsightsPanel.tsx       # 학습 인사이트
├── hooks/                   # Custom Hooks
│   ├── useMetacognitionStore.ts        # Zustand 스토어
│   └── useBehaviorTracking.ts          # 행동 추적 훅
├── services/                # 서비스 레이어
│   ├── socketService.ts                # WebSocket 통신
│   └── apiService.ts                   # REST API 통신
└── types/                   # 타입 정의 (from shared)
```

### 2. 백엔드 구조

```
backend/src/
├── routes/                  # API 라우트
│   ├── index.ts                        # 라우트 설정
│   ├── metacognition.ts                # 메타인지 API
│   ├── activity.ts                     # 활동 추적 API
│   ├── behavior.ts                     # 행동 추적 API
│   └── lms.ts                          # LMS 연동 API
├── services/                # 비즈니스 로직
│   ├── metacognitionService.ts         # 메타인지 분석
│   ├── activityService.ts              # 활동 관리
│   ├── behaviorService.ts              # 행동 분석
│   ├── socketService.ts                # WebSocket 핸들러
│   └── lmsIntegrationService.ts        # LMS 연동
└── utils/                   # 유틸리티
    └── logger.ts                       # 로깅
```

## 🔄 데이터 흐름

### 1. 학습 활동 시작

```
Student (Browser)
    ↓ [WebSocket] activity:start
Backend Socket Handler
    ↓
ActivityService.startActivity()
    ↓
[Store in Memory/DB]
    ↓
MetacognitionService.getMetacognitionState()
    ↓
[WebSocket] metacognition:update
    ↓
Frontend Store Update
    ↓
UI Re-render
```

### 2. 행동 추적 및 분석

```
Student Interaction (click, scroll, etc.)
    ↓
useBehaviorTracking Hook
    ↓
[Buffer Events]
    ↓ [Every 5 seconds or 10 events]
[WebSocket] behavior:track
    ↓
BehaviorService.trackBehaviorEvents()
    ↓
BehaviorService.analyzeBehavior()
    ↓
[Calculate Focus Level]
    ↓ [If focus is low]
[WebSocket] focus:alert
    ↓
Frontend Alert Display
```

### 3. 메타인지 상태 업데이트

```
[Every 30 seconds - Automatic]
    ↓
MetacognitionService.getMetacognitionState()
    ↓
├─ Get Current Activity
├─ Get Recent Activities
├─ Analyze Behavior → Determine Focus Level
├─ Calculate Time Distribution
├─ Identify Learning Pattern
└─ Generate Reflection Prompts
    ↓
Construct MetacognitionState Object
    ↓
[WebSocket] metacognition:update
    ↓
Frontend Store Update
```

## 📊 데이터 모델

### MetacognitionState

```typescript
interface MetacognitionState {
  studentId: string;
  currentActivity: CurrentActivity | null;
  recentActivities: ActivitySummary[];
  focusLevel: FocusLevel;
  timeDistribution: TimeDistribution;
  learningPattern: LearningPattern;
  reflectionPrompts: ReflectionPrompt[];
  timestamp: Date;
}
```

### FocusLevel 결정 로직

```typescript
// 집중도 계산 알고리즘
if (interactionFrequency > 10 && tabSwitchCount < 2) {
  return FocusLevel.HIGHLY_FOCUSED;  // 매우 집중
}
if (interactionFrequency > 5 && tabSwitchCount < 5) {
  return FocusLevel.FOCUSED;  // 집중
}
if (interactionFrequency > 2 || tabSwitchCount < 8) {
  return FocusLevel.MODERATELY_FOCUSED;  // 보통 집중
}
if (tabSwitchCount > 8 || interactionFrequency < 2) {
  return FocusLevel.DISTRACTED;  // 산만함
}
return FocusLevel.HIGHLY_DISTRACTED;  // 매우 산만함
```

## 🎨 UI/UX 설계 원칙

### 1. 비침습적 (Non-intrusive)
- 학습을 방해하지 않는 자연스러운 피드백
- 필요한 정보만 적절한 타이밍에 표시

### 2. 실시간성 (Real-time)
- 최대 5초 이내 상태 반영
- WebSocket을 통한 즉각적 업데이트

### 3. 시각적 명확성 (Visual Clarity)
- 색상 코드: 집중도에 따른 직관적 색상
  - 매우 집중: 초록색 (#4caf50)
  - 집중: 연두색 (#8bc34a)
  - 보통: 주황색 (#ff9800)
  - 산만함: 빨강-주황 (#ff5722)
  - 매우 산만함: 빨강 (#f44336)

### 4. 행동 유도 (Actionable)
- 모든 인사이트에 구체적인 행동 제안
- "무엇을 해야 하는가"에 대한 명확한 가이드

## 🔧 주요 알고리즘

### 1. 성찰 프롬프트 생성

```typescript
function generateReflectionPrompts(
  currentActivity,
  focusLevel,
  behaviorAnalysis
): ReflectionPrompt[] {
  const prompts = [];

  // 항상 인식 프롬프트 포함
  prompts.push({
    prompt: "지금 뭘 하고 있지?",
    promptType: "awareness",
    priority: "high"
  });

  // 문제 풀이 중이면 이해도 확인
  if (currentActivity?.activityType === "problem_solving") {
    prompts.push({
      prompt: "이 문제를 이해하고 있나요?",
      promptType: "understanding",
      priority: "high"
    });
  }

  // 산만하면 집중도 확인
  if (focusLevel === "distracted") {
    prompts.push({
      prompt: "집중하고 있나요?",
      promptType: "engagement",
      priority: "high"
    });
  }

  // 장시간 활동 시 진행도 확인
  if (currentActivity?.elapsedTime > 1800) {
    prompts.push({
      prompt: "잘 진행되고 있나요?",
      promptType: "progress",
      priority: "medium"
    });
  }

  return prompts;
}
```

### 2. 학습 패턴 식별

```typescript
async function identifyLearningPattern(studentId: string) {
  const activities = await getActivityHistory(studentId, 50);

  // 선호 시간대 분석
  const timeGroups = groupByTimeOfDay(activities);
  const preferredTime = getMostActiveTimeGroup(timeGroups);

  // 평균 세션 길이
  const sessions = groupIntoSessions(activities);
  const averageSessionDuration = calculateAverage(
    sessions.map(s => s.duration)
  );

  // 주의 지속 시간
  const attentionSpan = calculateMedianActivityDuration(activities);

  // 강점 및 개선 영역
  const strengths = identifyStrengths(activities);
  const areasForImprovement = identifyWeaknesses(activities);

  return {
    preferredLearningTime: preferredTime,
    averageSessionDuration,
    attentionSpan,
    breakFrequency: calculateBreakFrequency(activities),
    strengths,
    areasForImprovement
  };
}
```

## 🔌 LMS 연동 가이드

### 1. 연동 방식

**Pull 방식 (Metacognition → LMS)**
- 학생 정보 조회
- 등록 과목 조회

**Push 방식 (Metacognition → LMS)**
- 진행도 동기화
- 메타인지 분석 결과 전송

**Webhook (LMS → Metacognition)**
- 학생 등록/해제 이벤트
- 과목 업데이트 이벤트

### 2. API 계약 (Contract)

```typescript
// LMS가 제공해야 하는 API
interface LMSContract {
  // 학생 정보
  GET /api/students/:studentId
  Response: {
    id: string;
    name: string;
    email: string;
    gradeLevel: string;
  }

  // 등록 과목
  GET /api/students/:studentId/enrollments
  Response: Array<{
    moduleId: string;
    moduleName: string;
    enrolledAt: Date;
  }>

  // 진행도 업데이트
  POST /api/progress
  Body: {
    studentId: string;
    moduleId: string;
    progress: {
      percentage: number;
      timeSpent: number;
      lastAccessedAt: Date;
    }
  }
}
```

### 3. 보안

- **인증**: Bearer Token (JWT)
- **암호화**: HTTPS only
- **Rate Limiting**: 100 req/hour per API key

## 🧪 테스트 시나리오

### 1. 집중도 모니터링

```
시나리오: 학생이 산만해지는 경우
1. 학생이 문제 풀이 시작
2. 5분 동안 활발한 상호작용 (높은 집중도)
3. 탭 전환 시작 (3회)
4. 상호작용 감소
5. 시스템이 집중도 하락 감지
6. "집중하고 있나요?" 프롬프트 표시
7. 집중력 향상 제안 제공
```

### 2. 장시간 학습 경고

```
시나리오: 1시간 이상 쉬지 않고 학습
1. 학생이 학습 활동 시작
2. 60분 경과
3. 시스템이 장시간 학습 감지
4. "장시간 학습 감지" 인사이트 생성
5. 휴식 제안 표시
```

## 📈 성능 최적화

### 1. 프론트엔드

- **이벤트 버퍼링**: 행동 이벤트를 5초마다 일괄 전송
- **컴포넌트 메모이제이션**: React.memo 사용
- **지연 로딩**: 차트 컴포넌트 lazy loading

### 2. 백엔드

- **인메모리 캐싱**: 현재 활동 상태를 Redis에 캐시
- **배치 처리**: 행동 이벤트 일괄 처리
- **비동기 처리**: 인사이트 생성을 비동기로 실행

### 3. 데이터베이스

- **인덱스 최적화**: 자주 조회하는 컬럼에 인덱스
- **파티셔닝**: 시계열 데이터 월별 파티셔닝 고려
- **쿼리 최적화**: N+1 문제 방지

## 🚨 에러 처리

### 1. WebSocket 연결 끊김

```typescript
socket.on('disconnect', () => {
  // 자동 재연결 시도 (최대 3회)
  reconnectWithBackoff(3);
});
```

### 2. API 호출 실패

```typescript
try {
  const data = await apiService.getMetacognitionState(studentId);
} catch (error) {
  // 로컬 캐시 사용
  const cachedData = getCachedData(studentId);
  if (cachedData) return cachedData;

  // 사용자에게 오류 표시
  showError("데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
}
```

## 📱 향후 개선 사항

1. **AI 기반 예측**: 학습 성과 예측 모델
2. **개인화**: 학생별 맞춤형 프롬프트
3. **멀티모달 입력**: 음성, 감정 분석 추가
4. **협업 학습**: 그룹 메타인지 미러링
5. **모바일 앱**: 네이티브 iOS/Android 앱

## 📚 참고 자료

- [Metacognition in Learning](https://en.wikipedia.org/wiki/Metacognition)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [React Best Practices](https://react.dev/learn)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling)

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-18
