# 자동 난이도 하향 조정 및 자신감 회복 시스템

## 1. 개요

학생이 어려움을 겪을 때 자동으로 감지하여 난이도를 하향 조정하고, 자신감 회복을 위한 문제를 추천하는 시스템입니다.

## 2. 핵심 기능

### 2.1 자동 감지 트리거
학생의 어려움을 감지하는 조건:
- 연속 3회 이상 오답
- 정답률이 30% 미만으로 하락
- 문제당 평균 소요 시간이 목표 시간의 2배 초과
- 학생이 5분 이상 문제를 풀지 않고 있는 경우

### 2.2 난이도 하향 전략
```
현재 난이도 5 → 하향 후 난이도 3
현재 난이도 4 → 하향 후 난이도 2
현재 난이도 3 → 하향 후 난이도 2
현재 난이도 2 → 하향 후 난이도 1
현재 난이도 1 → 복습 문제 제공
```

### 2.3 자신감 회복 로드맵
1. **즉시 난이도 하향**: 2단계 낮춘 문제 3개 제공
2. **성공 경험 축적**: 연속 3개 정답 시 1단계 상향
3. **점진적 복귀**: 원래 난이도로 단계적 복귀 (1단계씩)
4. **심리적 피드백**: 격려 메시지 및 진행 상황 시각화

## 3. 데이터 모델

### 3.1 학생 신뢰도 점수 (Confidence Score)
- 범위: 0-100
- 초기값: 70
- 갱신 주기: 문제 제출 시마다
- 계산식:
  ```
  새 점수 = 이전 점수 * 0.9 + (정답 여부 * 10) + (속도 보너스)
  속도 보너스 = min(5, (목표시간 - 실제시간) / 목표시간 * 10)
  ```

### 3.2 난이도 조정 이력
각 학생의 난이도 변경 이력 추적:
- 조정 시각
- 이전 난이도 / 새 난이도
- 조정 사유 (트리거 타입)
- 조정 효과 (이후 성과 변화)

## 4. API 설계

### 4.1 자동 추천 확인 API
```
GET /api/students/{student_id}/confidence-check
Response:
{
  "needs_intervention": true,
  "current_confidence_score": 45,
  "recommended_action": "difficulty_downward",
  "recommended_difficulty": 2,
  "current_difficulty": 4,
  "trigger_reason": "consecutive_failures",
  "failure_count": 4
}
```

### 4.2 난이도 하향 적용 API
```
POST /api/students/{student_id}/apply-difficulty-adjustment
Request:
{
  "adjustment_type": "downward",
  "target_difficulty": 2,
  "reason": "confidence_recovery"
}
Response:
{
  "success": true,
  "new_difficulty": 2,
  "recovery_problems": [
    {"id": "prob_001", "difficulty": 2, "type": "confidence_boost"},
    {"id": "prob_002", "difficulty": 2, "type": "confidence_boost"},
    {"id": "prob_003", "difficulty": 2, "type": "confidence_boost"}
  ],
  "recovery_plan": {
    "phase": "immediate_downward",
    "target_success_count": 3,
    "next_phase_difficulty": 3
  }
}
```

### 4.3 LMS 연동 웹훅
```
POST /api/lms/webhook/student-performance
Request:
{
  "lms_student_id": "kaist_12345",
  "course_id": "math_101",
  "recent_scores": [45, 50, 35, 40],
  "timestamp": "2025-11-18T10:30:00Z"
}
Response:
{
  "recommendation": "trigger_confidence_recovery",
  "message": "자신감 회복 모드 추천",
  "details": {
    "current_avg_score": 42.5,
    "threshold": 60,
    "action": "reduce_difficulty_by_2_levels"
  }
}
```

## 5. 알고리즘 상세

### 5.1 자신감 점수 계산 알고리즘
```python
def calculate_confidence_score(previous_score, is_correct, time_spent, target_time):
    base_score = previous_score * 0.9
    correctness_bonus = 10 if is_correct else -15

    if is_correct:
        speed_ratio = (target_time - time_spent) / target_time
        speed_bonus = min(5, max(-5, speed_ratio * 10))
    else:
        speed_bonus = 0

    new_score = base_score + correctness_bonus + speed_bonus
    return max(0, min(100, new_score))
```

### 5.2 난이도 조정 판단 알고리즘
```python
def should_trigger_downward_adjustment(student_data):
    # 조건 1: 연속 오답
    if student_data['consecutive_failures'] >= 3:
        return True, 'consecutive_failures'

    # 조건 2: 정답률 저하
    recent_attempts = student_data['recent_attempts'][-10:]
    if len(recent_attempts) >= 5:
        accuracy = sum(a['is_correct'] for a in recent_attempts) / len(recent_attempts)
        if accuracy < 0.3:
            return True, 'low_accuracy'

    # 조건 3: 신뢰도 점수 저하
    if student_data['confidence_score'] < 40:
        return True, 'low_confidence'

    # 조건 4: 소요 시간 과다
    avg_time = sum(a['time_spent'] for a in recent_attempts) / len(recent_attempts)
    target_time = student_data['target_time_per_problem']
    if avg_time > target_time * 2:
        return True, 'excessive_time'

    return False, None
```

### 5.3 복귀 경로 알고리즘
```python
def generate_recovery_path(current_difficulty, target_difficulty):
    """
    목표 난이도로 단계적 복귀 경로 생성
    """
    path = []

    # 1단계: 즉시 하향 (2단계 낮춤)
    downward_difficulty = max(1, current_difficulty - 2)
    path.append({
        'phase': 'immediate_downward',
        'difficulty': downward_difficulty,
        'required_successes': 3,
        'description': '자신감 회복 단계 - 쉬운 문제로 성공 경험 축적'
    })

    # 2단계: 점진적 복귀
    current = downward_difficulty
    while current < target_difficulty:
        current += 1
        path.append({
            'phase': 'gradual_return',
            'difficulty': current,
            'required_successes': 2,
            'description': f'난이도 {current}로 점진적 복귀'
        })

    return path
```

## 6. UI/UX 설계

### 6.1 자신감 회복 모드 진입 알림
```
┌─────────────────────────────────────────┐
│  💪 자신감 회복 모드 추천                │
│                                         │
│  최근 문제가 조금 어려웠나 봐요.        │
│  더 쉬운 문제로 자신감을 되찾아볼까요?  │
│                                         │
│  현재 난이도: ★★★★☆ (4단계)           │
│  추천 난이도: ★★☆☆☆ (2단계)           │
│                                         │
│  [자신감 회복 모드 시작] [나중에]       │
└─────────────────────────────────────────┘
```

### 6.2 진행 상황 표시
```
자신감 회복 진행 중 🌱
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60%

현재 단계: 2단계 문제 (3개 중 2개 완료)
다음 단계: 3단계로 복귀 (연속 2개 정답 필요)

최근 성과: ✓ ✓ ✗ ✓ ✓
신뢰도 점수: 65/100 (↑15)
```

### 6.3 복귀 완료 축하
```
┌─────────────────────────────────────────┐
│  🎉 축하합니다!                         │
│                                         │
│  자신감 회복을 완료했어요!              │
│  이제 다시 원래 난이도로 돌아갑니다.    │
│                                         │
│  회복 통계:                             │
│  - 문제 해결: 8개                       │
│  - 정답률: 87.5%                        │
│  - 신뢰도 상승: +25점                   │
│                                         │
│  [계속하기]                             │
└─────────────────────────────────────────┘
```

## 7. LMS 연동 시나리오

### 7.1 연동 플로우
```
LMS (KAIST 시스템)
    ↓ (학생 성과 데이터 전송)
Webhook 수신기
    ↓ (데이터 분석)
자신감 분석 엔진
    ↓ (추천 생성)
난이도 조정 시스템
    ↓ (문제 선정)
문제 생성 AI
    ↓ (웹앱 표시)
학생 인터페이스
```

### 7.2 LMS 데이터 매핑
```javascript
{
  // LMS에서 받는 데이터
  "lms_student_id": "kaist_2024_12345",
  "course_id": "MATH101_2024F",
  "assignment_scores": [
    {"id": "hw1", "score": 85, "max": 100},
    {"id": "hw2", "score": 60, "max": 100},
    {"id": "hw3", "score": 45, "max": 100}
  ],
  "quiz_scores": [78, 55, 42],
  "last_activity": "2025-11-18T09:15:00Z"
}
```

### 7.3 추천 응답 형식
```javascript
{
  "student_id": "kaist_2024_12345",
  "recommendation_type": "confidence_recovery",
  "confidence_score": 42,
  "trigger_reasons": [
    "declining_scores",
    "low_quiz_performance"
  ],
  "suggested_actions": [
    {
      "action": "reduce_difficulty",
      "from_level": 4,
      "to_level": 2,
      "duration": "3_problems"
    },
    {
      "action": "provide_scaffolding",
      "type": "step_by_step_hints"
    },
    {
      "action": "teacher_notification",
      "priority": "medium",
      "message": "학생이 어려움을 겪고 있습니다. 추가 지원이 필요할 수 있습니다."
    }
  ],
  "expected_outcome": {
    "target_confidence": 70,
    "estimated_problems_needed": 8,
    "estimated_time": "20_minutes"
  }
}
```

## 8. 성공 지표

### 8.1 시스템 지표
- **자동 감지 정확도**: 실제 어려움 겪는 학생의 90% 이상 감지
- **거짓 양성률**: 10% 미만
- **평균 회복 시간**: 20분 이내
- **복귀 성공률**: 80% 이상

### 8.2 학생 성과 지표
- **자신감 점수 회복**: 평균 +25점 이상
- **이후 정답률**: 70% 이상으로 개선
- **학습 지속률**: 중도 포기 30% 감소
- **만족도**: 학생 만족도 4.0/5.0 이상

## 9. 구현 우선순위

### Phase 1: 핵심 기능 (2주)
- [ ] 자신감 점수 계산 알고리즘
- [ ] 자동 감지 트리거 로직
- [ ] 기본 난이도 조정 API
- [ ] 데이터베이스 스키마

### Phase 2: 회복 시스템 (2주)
- [ ] 복귀 경로 알고리즘
- [ ] 회복용 문제 선정 로직
- [ ] UI 컴포넌트 (알림, 진행 상황)
- [ ] 실시간 점수 업데이트

### Phase 3: LMS 연동 (2주)
- [ ] LMS 웹훅 수신기
- [ ] 데이터 매핑 레이어
- [ ] 교사 대시보드 통합
- [ ] 성과 리포팅

### Phase 4: 고도화 (2주)
- [ ] 머신러닝 기반 예측
- [ ] 개인화된 회복 전략
- [ ] A/B 테스팅 프레임워크
- [ ] 성과 분석 대시보드

## 10. 기술 스택

- **Backend**: Python FastAPI (난이도 조정 엔진)
- **API Gateway**: Node.js Express
- **Database**: PostgreSQL (학생 데이터, 이력)
- **Cache**: Redis (실시간 점수 계산)
- **Frontend**: React + TypeScript
- **Real-time**: WebSocket (즉시 알림)
- **LMS Integration**: REST API + Webhooks
