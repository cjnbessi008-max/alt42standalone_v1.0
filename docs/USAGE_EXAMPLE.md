# 사용 예제 (Usage Examples)

## 백엔드 사용 예제

### 1. 학습 속도 분석기 사용

```python
from datetime import datetime, timedelta
from backend.services.progress_tracking import (
    LearningSpeedAnalyzer,
    StudentAttempt
)

# 분석기 초기화
analyzer = LearningSpeedAnalyzer()

# 학생 시도 데이터 추가
now = datetime.now()
attempts = [
    StudentAttempt(
        student_id="student-123",
        module_id="math-fractions",
        problem_id="prob-1",
        is_correct=True,
        time_spent_seconds=120,
        attempted_at=now - timedelta(minutes=25)
    ),
    StudentAttempt(
        student_id="student-123",
        module_id="math-fractions",
        problem_id="prob-2",
        is_correct=True,
        time_spent_seconds=150,
        attempted_at=now - timedelta(minutes=20)
    ),
    StudentAttempt(
        student_id="student-123",
        module_id="math-fractions",
        problem_id="prob-3",
        is_correct=False,
        time_spent_seconds=300,
        attempted_at=now - timedelta(minutes=15)
    ),
]

for attempt in attempts:
    analyzer.add_attempt(attempt)

# 진도 분석
current_metric, triggers = analyzer.analyze_student_progress(
    student_id="student-123",
    module_id="math-fractions",
    attempts=attempts,
    previous_metrics=[]
)

# 결과 확인
if current_metric:
    print(f"Speed Score: {current_metric.speed_score:.2f} problems/hour")
    print(f"Accuracy: {current_metric.accuracy_rate:.1%}")
    print(f"Trend: {current_metric.speed_trend.value}")

if triggers:
    print(f"Triggers: {[t.value for t in triggers]}")
    recommendations = analyzer.get_recommendations(triggers)
    print(f"Recommendations: {recommendations}")
```

### 2. 멘탈 케어 메시지 생성

```python
from backend.services.mental_care_messaging import (
    MentalCareMessageGenerator,
    MessageType
)

# 메시지 생성기 초기화
generator = MentalCareMessageGenerator()

# 속도 감소에 대한 메시지 생성
message = generator.generate_message(
    trigger_reason='speed_decrease_40%',
    severity='medium',
    recommended_actions=['encourage', 'suggest_strategy'],
    student_name='민수'
)

print(f"Korean: {message.text_ko}")
print(f"English: {message.text_en}")
print(f"Type: {message.message_type.value}")
print(f"Actions: {message.recommended_actions}")

# 휴식 제안 생성
break_suggestion = generator.get_break_time_suggestion(95)
print(f"\nBreak suggestion: {break_suggestion['ko']}")
```

### 3. FastAPI 서버와 통합

```python
from fastapi import FastAPI
from backend.services.progress_tracking import LearningSpeedAnalyzer
from backend.services.mental_care_messaging import MentalCareMessageGenerator

app = FastAPI()
analyzer = LearningSpeedAnalyzer()
message_generator = MentalCareMessageGenerator()

@app.post("/api/submit-attempt")
async def submit_attempt(attempt_data: dict):
    # 시도 데이터 처리
    attempt = StudentAttempt(**attempt_data)
    analyzer.add_attempt(attempt)

    # 분석
    metric, triggers = analyzer.analyze_student_progress(...)

    # 메시지 생성
    if triggers:
        message = message_generator.generate_message(
            trigger_reason=triggers[0].value,
            severity='medium',
            recommended_actions=['encourage']
        )
        return {"message": message}

    return {"status": "ok"}
```

## 프론트엔드 사용 예제

### 1. React 컴포넌트에서 사용

```tsx
import React, { useEffect, useState } from 'react';
import MentalCareNotificationContainer from './components/MentalCareNotificationContainer';
import mentalCareService from './services/mental-care.service';

function StudentLearningPage() {
  const [studentId] = useState('student-123');
  const [moduleId] = useState('math-fractions');

  // 문제 제출 함수
  const handleSubmitProblem = async (problemData) => {
    try {
      const result = await mentalCareService.submitAttempt({
        student_id: studentId,
        module_id: moduleId,
        problem_id: problemData.id,
        is_correct: problemData.isCorrect,
        time_spent_seconds: problemData.timeSpent,
        hints_used: problemData.hintsUsed,
      });

      console.log('Analysis result:', result);

      if (result.message_sent) {
        console.log('Mental care message:', result.message_sent.text_ko);
      }
    } catch (error) {
      console.error('Error submitting attempt:', error);
    }
  };

  return (
    <div className="learning-page">
      {/* 메인 학습 영역 */}
      <div className="learning-content">
        <h1>분수 학습</h1>
        {/* ... 학습 컨텐츠 ... */}
      </div>

      {/* 멘탈 케어 알림 (우측 상단에 표시) */}
      <MentalCareNotificationContainer
        studentId={studentId}
        language="ko"
        maxVisibleMessages={3}
      />
    </div>
  );
}

export default StudentLearningPage;
```

### 2. WebSocket 직접 사용

```typescript
import { mentalCareService } from './services/mental-care.service';
import { MentalCareMessage } from './types/mental-care.types';

// WebSocket 연결
mentalCareService.connectWebSocket('student-123', (message: MentalCareMessage) => {
  console.log('New message received:', message);

  // 메시지를 UI에 표시
  showNotification(message);

  // 소리 재생
  playNotificationSound();
});

// 메시지 표시 함수
function showNotification(message: MentalCareMessage) {
  // Toast 알림이나 모달로 표시
  const notification = document.createElement('div');
  notification.className = 'mental-care-toast';
  notification.innerHTML = `
    <div class="message-icon">${getMessageIcon(message.message_type)}</div>
    <div class="message-text">${message.text_ko}</div>
  `;

  document.body.appendChild(notification);

  // 5초 후 제거
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// 컴포넌트 언마운트 시 연결 해제
useEffect(() => {
  return () => {
    mentalCareService.disconnectWebSocket();
  };
}, []);
```

### 3. 독립 실행형 메시지 카드

```tsx
import React from 'react';
import MentalCareMessageCard from './components/MentalCareMessageCard';
import { MentalCareMessage, MessageType, MessageSeverity } from './types/mental-care.types';

function TestMessageCard() {
  const testMessage: MentalCareMessage = {
    message_id: 'test-123',
    message_type: MessageType.ENCOURAGEMENT,
    trigger_reason: 'speed_decrease_20%',
    text_ko: '잠깐! 조금 천천히 풀고 있는 것 같아요. 괜찮아요!',
    text_en: "Taking your time? That's okay!",
    severity: MessageSeverity.LOW,
    recommended_actions: ['encourage'],
    sent_at: new Date().toISOString(),
  };

  return (
    <div style={{ padding: '20px' }}>
      <MentalCareMessageCard
        message={testMessage}
        language="ko"
        studentId="student-123"
        showFeedback={true}
        onClose={() => console.log('Message closed')}
      />
    </div>
  );
}
```

## 데이터베이스 쿼리 예제

### 1. 학생의 최근 학습 속도 조회

```sql
SELECT
  time_window_start,
  time_window_end,
  problems_completed,
  speed_score,
  accuracy_rate,
  speed_trend
FROM learning_speed_metrics
WHERE student_id = 'student-123'
  AND module_id = 'math-fractions'
ORDER BY time_window_start DESC
LIMIT 10;
```

### 2. 메시지 효과성 분석

```sql
SELECT
  trigger_reason,
  COUNT(*) as total_messages,
  SUM(CASE WHEN student_reaction = 'helpful' THEN 1 ELSE 0 END) as helpful_count,
  SUM(CASE WHEN student_reaction = 'not_helpful' THEN 1 ELSE 0 END) as not_helpful_count,
  AVG(CASE WHEN student_reaction = 'helpful' THEN 1.0 ELSE 0.0 END) as effectiveness_rate
FROM mental_care_messages_sent
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY trigger_reason
ORDER BY effectiveness_rate DESC;
```

### 3. 학생 진도 대시보드 데이터

```sql
SELECT
  s.name as student_name,
  m.name as module_name,
  sp.progress_percentage,
  sp.accuracy_rate,
  sp.total_problems_attempted,
  sp.last_activity_at,
  (
    SELECT COUNT(*)
    FROM mental_care_messages_sent
    WHERE student_id = sp.student_id
      AND module_id = sp.module_id
      AND sent_at >= NOW() - INTERVAL '7 days'
  ) as messages_last_week
FROM student_progress sp
JOIN students s ON sp.student_id = s.id
JOIN modules m ON sp.module_id = m.id
WHERE sp.last_activity_at >= NOW() - INTERVAL '1 day'
ORDER BY sp.last_activity_at DESC;
```

## 통합 시나리오

### 전체 워크플로우

```python
# 1. 학생이 문제를 풀기 시작
start_time = datetime.now()

# 2. 문제를 제출
problem_time = (datetime.now() - start_time).total_seconds()

attempt_data = {
    "student_id": "student-123",
    "module_id": "math-fractions",
    "problem_id": "prob-42",
    "is_correct": True,
    "time_spent_seconds": int(problem_time),
    "hints_used": 0,
    "attempts_count": 1,
    "difficulty_level": 3
}

# 3. API로 제출
response = await mentalCareService.submitAttempt(attempt_data)

# 4. 분석 결과 확인
if response.triggers_detected:
    print(f"Triggers: {response.triggers_detected}")

# 5. 메시지가 있으면 WebSocket을 통해 실시간 수신
# (자동으로 MentalCareNotificationContainer에 표시됨)

# 6. 학생이 메시지에 피드백 제공
if response.message_sent:
    await mentalCareService.submitMessageFeedback(
        message_id=response.message_sent.message_id,
        student_id="student-123",
        reaction="helpful"
    )
```

## 커스터마이제이션

### 커스텀 메시지 추가

```python
# message_generator.py에 새로운 메시지 템플릿 추가
custom_templates = {
    'custom_trigger': [
        {
            'ko': '새로운 한국어 메시지 😊',
            'en': 'New English message 😊',
            'type': MessageType.ENCOURAGEMENT,
            'severity': 'low'
        }
    ]
}

generator.message_templates.update(custom_templates)
```

### 커스텀 트리거 조건

```python
# learning_speed_analyzer.py 확장
class CustomAnalyzer(LearningSpeedAnalyzer):
    def detect_custom_triggers(self, attempts):
        triggers = []

        # 예: 3문제 연속으로 힌트를 많이 사용한 경우
        if len(attempts) >= 3:
            recent_hints = [a.hints_used for a in attempts[-3:]]
            if sum(recent_hints) > 5:
                triggers.append(MessageTrigger.CUSTOM_HINT_OVERUSE)

        return triggers
```

---

더 많은 예제와 튜토리얼은 [문서 웹사이트](https://docs.example.com)를 참조하세요.
