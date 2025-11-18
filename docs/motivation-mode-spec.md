# Motivation Mode Feature Specification
## "한 문제만 하자" (Just Do One Problem) Mode

**Version**: 1.0.0
**Created**: 2025-11-18
**Status**: Design Document
**Related**: PRD AI Education System Pipeline (Section 4, 5, 6)

---

## 1. Overview

### Background
학생들의 학습 의욕이 저하될 때, 전체 학습 과정이나 많은 문제를 보는 것은 오히려 부담이 될 수 있습니다. "한 문제만 하자" 모드는 이러한 심리적 부담을 줄이고, 작은 성취를 통해 학습 동기를 회복시키는 것을 목표로 합니다.

### Problem Statement
현재 시스템에서는:
- 학생이 전체 진행도와 남은 문제 수를 항상 볼 수 있어 부담감 증가
- 학습 의욕이 낮을 때 시작 자체가 어려움
- 작은 성취에 대한 즉각적인 긍정적 피드백 부족
- 학습 세션을 쉽게 시작하고 종료할 수 있는 메커니즘 부족

### Solution
**Motivation Mode**는:
1. 한 번에 하나의 문제만 보여줌 (전체 진행도 숨김)
2. 문제 완료 시 긍정적 피드백 제공
3. "하나 더?" 방식으로 자연스럽게 학습 연속성 유도
4. 언제든 부담 없이 종료 가능
5. 학습 의욕 패턴 추적 및 분석

### Goal
- 학습 시작 장벽 낮추기 (>30% 증가)
- 평균 세션당 문제 해결 수 증가 (>20%)
- 학생 재방문율 향상 (>25%)
- 학습 스트레스 감소

---

## 2. User Stories

### Story 1: 낮은 의욕 학생
> **As a** 학습 의욕이 낮은 학생
> **I want to** "한 문제만" 풀 수 있는 간단한 모드가 있기를
> **So that** 부담 없이 학습을 시작할 수 있습니다

**Acceptance Criteria**:
- 전체 진행도나 남은 문제 수가 보이지 않음
- 현재 문제 하나만 집중해서 볼 수 있음
- 문제 완료 후 "계속할까?" 선택지 제공
- 언제든 부담 없이 종료 가능

### Story 2: 교사 모니터링
> **As a** 교사
> **I want to** 학생들의 motivation mode 사용 패턴을 볼 수 있기를
> **So that** 어떤 학생이 학습 동기 부족인지 파악할 수 있습니다

**Acceptance Criteria**:
- 학생별 motivation mode 사용 빈도 확인
- 모드별 학습 성과 비교 (일반 모드 vs motivation 모드)
- 학습 의욕 추세 분석

### Story 3: 시스템 자동 추천
> **As a** 시스템
> **I want to** 학생의 행동 패턴을 분석하여 motivation mode를 추천
> **So that** 학생이 포기하기 전에 모드 전환을 제안할 수 있습니다

**Acceptance Criteria**:
- 연속 오답, 긴 비활동 시간 등 패턴 감지
- 적절한 타이밍에 motivation mode 제안
- 학생이 제안을 수락/거절할 수 있음

---

## 3. Functional Requirements

### FR-MM-1: Motivation Mode 활성화
- 시스템은 모든 모듈에 대해 motivation mode 지원 MUST
- 학생은 언제든 일반 모드와 motivation mode 전환 가능 MUST
- 교사는 모듈별로 motivation mode 활성화/비활성화 가능 SHOULD
- 시스템은 학생의 학습 패턴 기반으로 자동 추천 MAY

### FR-MM-2: Single Problem Focus
- 화면에 현재 문제 하나만 표시 MUST
- 전체 진행도, 남은 문제 수, 시간 제한 숨김 MUST
- 문제 번호나 순서 정보 숨김 MUST
- 최소한의 UI 요소로 인지적 부담 감소 MUST

### FR-MM-3: Positive Reinforcement
- 문제 정답 시 긍정적 메시지 표시 MUST
- 연속 정답 시 streak 카운트 표시 SHOULD
- 문제 완료 후 작은 성취감 제공 (애니메이션, 사운드) MAY
- 오답 시에도 격려 메시지 제공 MUST

### FR-MM-4: Gentle Continuation
- 문제 완료 후 "하나 더 할까요?" 프롬프트 표시 MUST
- "계속하기" 및 "종료하기" 명확한 옵션 제공 MUST
- 종료 시 오늘 푼 문제 수 간단히 요약 SHOULD
- 종료 후에도 부정적 느낌 없도록 긍정 메시지 MUST

### FR-MM-5: Session Tracking
- Motivation mode 세션 시작/종료 추적 MUST
- 세션당 완료한 문제 수 기록 MUST
- 세션 지속 시간 기록 MUST
- 연속 정답 streak 기록 SHOULD

### FR-MM-6: Progress Preservation
- Motivation mode에서의 학습도 전체 진행도에 반영 MUST
- 모드 전환 시 진행 상태 유지 MUST
- 학생 데이터 일관성 보장 MUST

### FR-MM-7: Analytics & Insights
- 학생별 motivation mode 사용 패턴 추적 MUST
- 모드별 성과 비교 (정답률, 평균 시간) SHOULD
- 교사 대시보드에 motivation 지표 표시 SHOULD

---

## 4. Non-Functional Requirements

### Performance
- Motivation mode 전환 < 1초
- 문제 로딩 시간 < 2초
- UI 애니메이션 부드럽게 (60fps)

### Usability
- 모드 진입 2클릭 이내
- 명확한 시각적 구분 (일반 모드 vs motivation 모드)
- 모바일 친화적 디자인

### Accessibility
- WCAG 2.1 AA 준수
- 스크린 리더 지원
- 키보드 네비게이션 완전 지원

### Privacy
- 학습 의욕 데이터 민감 정보로 취급
- 교사만 집계 데이터 접근 가능
- 개별 학생 식별 최소화

---

## 5. Data Models

### 5.1 Database Schema Extensions

#### motivation_mode_sessions
```sql
CREATE TABLE motivation_mode_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),

    -- Session metadata
    session_start TIMESTAMP NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP,
    duration_seconds INTEGER,

    -- Performance metrics
    problems_completed INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    problems_incorrect INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,

    -- Behavioral data
    mode_trigger VARCHAR(50), -- 'student_initiated', 'system_suggested', 'auto_detected'
    exit_reason VARCHAR(50), -- 'student_choice', 'completed_goal', 'timeout', etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_motivation_sessions_student ON motivation_mode_sessions(student_id);
CREATE INDEX idx_motivation_sessions_module ON motivation_mode_sessions(module_id);
CREATE INDEX idx_motivation_sessions_date ON motivation_mode_sessions(session_start);
```

#### motivation_mode_config (per module)
```sql
CREATE TABLE motivation_mode_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) UNIQUE,

    -- Feature flags
    is_enabled BOOLEAN DEFAULT true,
    auto_suggest_enabled BOOLEAN DEFAULT true,

    -- Trigger thresholds
    suggest_after_wrong_answers INTEGER DEFAULT 3,
    suggest_after_idle_seconds INTEGER DEFAULT 300, -- 5 minutes

    -- UI customization
    positive_messages JSONB, -- Array of encouragement messages
    completion_messages JSONB,

    -- Settings
    max_problems_per_session INTEGER, -- NULL = unlimited

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### student_motivation_preferences
```sql
CREATE TABLE student_motivation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) UNIQUE,

    -- Preferences
    prefer_motivation_mode BOOLEAN DEFAULT false,
    auto_accept_suggestions BOOLEAN DEFAULT false,
    show_streak_counter BOOLEAN DEFAULT true,

    -- Stats
    total_motivation_sessions INTEGER DEFAULT 0,
    last_motivation_session TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Module Schema Extension

Add to existing `modules` table:
```sql
ALTER TABLE modules ADD COLUMN motivation_mode_enabled BOOLEAN DEFAULT true;
```

### 5.3 StudentProgress Extension

Track motivation mode within existing progress:
```sql
-- Add to dynamically generated student_progress tables
ALTER TABLE {module}_student_progress
ADD COLUMN total_motivation_mode_problems INTEGER DEFAULT 0,
ADD COLUMN last_motivation_mode_used TIMESTAMP;
```

---

## 6. API Design

### 6.1 Motivation Mode Endpoints

#### Start Motivation Mode Session
```http
POST /api/modules/{module_id}/motivation-mode/start
Authorization: Bearer {jwt_token}

Request Body:
{
  "trigger": "student_initiated" | "system_suggested" | "auto_detected"
}

Response: 201 Created
{
  "session_id": "uuid",
  "first_problem": {
    "id": "uuid",
    "problem_data": {...},
    "interaction_type": "form" | "interactive"
  },
  "message": "한 문제만 풀어볼까요? 부담 갖지 마세요!"
}
```

#### Get Next Problem
```http
GET /api/modules/{module_id}/motivation-mode/next
Authorization: Bearer {jwt_token}
Query Params:
  - session_id (required)

Response: 200 OK
{
  "problem": {
    "id": "uuid",
    "problem_data": {...}
  },
  "current_streak": 3,
  "session_stats": {
    "completed": 5,
    "correct": 4
  }
}
```

#### Submit Answer
```http
POST /api/modules/{module_id}/motivation-mode/submit
Authorization: Bearer {jwt_token}

Request Body:
{
  "session_id": "uuid",
  "problem_id": "uuid",
  "answer": {...},
  "time_spent_seconds": 45
}

Response: 200 OK
{
  "is_correct": true,
  "feedback": "잘했어요! 정답입니다!",
  "streak": 4,
  "encouragement_message": "벌써 4문제나 맞혔어요! 굉장해요!",
  "next_action_prompt": {
    "message": "하나 더 풀어볼까요?",
    "options": [
      { "action": "continue", "label": "네, 하나 더!" },
      { "action": "exit", "label": "오늘은 여기까지" }
    ]
  }
}
```

#### End Session
```http
POST /api/modules/{module_id}/motivation-mode/exit
Authorization: Bearer {jwt_token}

Request Body:
{
  "session_id": "uuid",
  "exit_reason": "student_choice" | "completed_goal" | "timeout"
}

Response: 200 OK
{
  "session_summary": {
    "problems_completed": 5,
    "problems_correct": 4,
    "duration_seconds": 320,
    "max_streak": 4
  },
  "closing_message": "오늘 5문제나 풀었어요! 정말 잘했어요! 내일 또 만나요!",
  "progress_update": {
    "total_completed": 25,
    "progress_percentage": 25
  }
}
```

#### Get Session Analytics (Teacher)
```http
GET /api/modules/{module_id}/motivation-mode/analytics
Authorization: Bearer {jwt_token} (teacher role)
Query Params:
  - student_id (optional, for specific student)
  - date_from (optional)
  - date_to (optional)

Response: 200 OK
{
  "overall_stats": {
    "total_sessions": 150,
    "avg_problems_per_session": 4.5,
    "avg_accuracy_motivation_mode": 78,
    "avg_accuracy_normal_mode": 72
  },
  "student_breakdown": [
    {
      "student_id": "uuid",
      "student_name": "홍길동",
      "motivation_sessions": 12,
      "last_session": "2025-11-17T14:30:00Z",
      "avg_problems_per_session": 3.5,
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "usage_pattern": {
    "trigger_distribution": {
      "student_initiated": 60,
      "system_suggested": 30,
      "auto_detected": 10
    }
  }
}
```

### 6.2 Module Configuration

#### Get Motivation Mode Config
```http
GET /api/modules/{module_id}/motivation-mode/config
Authorization: Bearer {jwt_token} (teacher role)

Response: 200 OK
{
  "is_enabled": true,
  "auto_suggest_enabled": true,
  "suggest_after_wrong_answers": 3,
  "suggest_after_idle_seconds": 300,
  "positive_messages": [
    "잘했어요!",
    "훌륭해요!",
    "완벽해요!"
  ],
  "completion_messages": [
    "오늘도 열심히 했어요!",
    "정말 대단해요!"
  ]
}
```

#### Update Motivation Mode Config
```http
PUT /api/modules/{module_id}/motivation-mode/config
Authorization: Bearer {jwt_token} (teacher role)

Request Body:
{
  "is_enabled": true,
  "auto_suggest_enabled": false,
  "suggest_after_wrong_answers": 2,
  "positive_messages": ["Great!", "Excellent!"]
}

Response: 200 OK
{
  "config": {...}
}
```

---

## 7. UI/UX Design

### 7.1 Design Principles

1. **Minimalism**: 최소한의 UI 요소, 산만함 제거
2. **Positive Framing**: 모든 메시지는 긍정적이고 격려하는 톤
3. **Clear Exit**: 언제든 부담 없이 나갈 수 있는 명확한 경로
4. **Immediate Feedback**: 즉각적인 피드백과 성취감
5. **Gentle Nudging**: 강요가 아닌 부드러운 제안

### 7.2 Key UI Components

#### MotivationModeHeader
```
┌────────────────────────────────────────┐
│  🌟 한 문제씩 천천히             [나가기] │
└────────────────────────────────────────┘
```
- 모드 식별 아이콘
- 간단한 설명
- 명확한 exit 버튼

#### SingleProblemView
```
┌────────────────────────────────────────┐
│                                        │
│         [Problem Content]              │
│                                        │
│     [Interactive Element/Form]         │
│                                        │
│            [제출하기]                   │
│                                        │
└────────────────────────────────────────┘
```
- 문제만 집중해서 표시
- 진행도 바, 문제 번호 숨김
- 깨끗한 배경, 여유로운 여백

#### StreakIndicator (optional)
```
🔥 연속 3문제 정답!
```
- 작고 비침해적
- 연속 정답 시에만 표시
- 애니메이션으로 축하

#### FeedbackDisplay
```
┌────────────────────────────────────────┐
│  ✅ 정답이에요!                         │
│                                        │
│  정말 잘했어요! 이해를 잘 하고 있네요.    │
│                                        │
│  [하나 더 풀어볼까요?]  [오늘은 여기까지] │
└────────────────────────────────────────┘
```
- 크고 명확한 정답/오답 표시
- 따뜻한 격려 메시지
- 부드러운 계속/종료 선택

#### SessionSummary (on exit)
```
┌────────────────────────────────────────┐
│  🎉 오늘의 학습 완료!                    │
│                                        │
│  📊 오늘 푼 문제: 5개                   │
│  ✅ 정답: 4개                           │
│  🔥 최고 연속 정답: 4개                 │
│                                        │
│  정말 잘했어요! 내일 또 만나요! 😊        │
│                                        │
│  [확인]                                 │
└────────────────────────────────────────┘
```

### 7.3 Visual Design Tokens

```json
{
  "colors": {
    "primary": "#6366f1", // Calming blue-purple
    "success": "#10b981", // Green for correct
    "encouragement": "#f59e0b", // Warm orange
    "background": "#fafafa", // Light, clean
    "text": "#1f2937" // Easy to read
  },
  "spacing": {
    "problem_padding": "48px", // Generous space
    "section_gap": "32px"
  },
  "typography": {
    "problem_text": "20px", // Larger, comfortable
    "feedback_text": "18px",
    "encouragement": "16px"
  },
  "animations": {
    "feedback_duration": "300ms",
    "celebration_duration": "500ms"
  }
}
```

### 7.4 User Flows

#### Flow 1: Student-Initiated
```
[일반 학습 화면]
    ↓ (학생이 "한 문제씩 모드" 버튼 클릭)
[Motivation Mode 진입 확인]
    ↓ (확인)
[첫 번째 문제 표시]
    ↓ (문제 풀이 및 제출)
[피드백 + 계속/종료 선택]
    ↓ (계속 선택)
[다음 문제]
    ... (반복)
    ↓ (종료 선택)
[세션 요약 및 격려]
    ↓
[일반 모드로 복귀 또는 종료]
```

#### Flow 2: System-Suggested
```
[일반 학습 화면]
    ↓ (연속 3문제 오답 감지)
[Motivation Mode 추천 팝업]
  "조금 쉬어갈까요? 한 문제씩 천천히 해봐요"
    ↓ (수락)
[Motivation Mode 시작]
    ... (이하 Flow 1과 동일)
```

### 7.5 Responsive Design

#### Mobile (< 768px)
- 전체 화면 사용
- 큰 터치 타겟 (최소 44x44px)
- 간소화된 메시지
- 스와이프 제스처 지원

#### Tablet (768px - 1024px)
- 중앙 정렬된 카드 레이아웃
- 적절한 여백 활용
- 풍부한 피드백 메시지

#### Desktop (> 1024px)
- 최대 너비 제한 (800px)
- 중앙 정렬
- 애니메이션 강화

---

## 8. Implementation Details

### 8.1 Frontend Component Structure

```
src/
└── features/
    └── motivation-mode/
        ├── components/
        │   ├── MotivationModeHeader.tsx
        │   ├── SingleProblemView.tsx
        │   ├── StreakIndicator.tsx
        │   ├── FeedbackDisplay.tsx
        │   ├── ContinuationPrompt.tsx
        │   └── SessionSummary.tsx
        ├── hooks/
        │   ├── useMotivationSession.ts
        │   ├── useMotivationAnalytics.ts
        │   └── useMotivationConfig.ts
        ├── services/
        │   └── motivationModeApi.ts
        ├── store/
        │   └── motivationModeSlice.ts
        └── types/
            └── motivationMode.types.ts
```

### 8.2 Backend Service Structure

```
backend/
└── services/
    └── motivation_mode/
        ├── __init__.py
        ├── session_manager.py
        ├── analytics_service.py
        ├── suggestion_engine.py
        ├── config_manager.py
        └── models/
            ├── session.py
            ├── config.py
            └── analytics.py
```

### 8.3 Key Algorithms

#### Suggestion Trigger Algorithm
```python
def should_suggest_motivation_mode(
    student_id: str,
    module_id: str,
    recent_attempts: List[Attempt]
) -> bool:
    """
    Determine if system should suggest motivation mode
    """
    config = get_motivation_config(module_id)

    if not config.auto_suggest_enabled:
        return False

    # Check consecutive wrong answers
    consecutive_wrong = count_consecutive_wrong(recent_attempts)
    if consecutive_wrong >= config.suggest_after_wrong_answers:
        return True

    # Check idle time
    last_activity = get_last_activity(student_id, module_id)
    idle_seconds = (datetime.now() - last_activity).total_seconds()
    if idle_seconds >= config.suggest_after_idle_seconds:
        return True

    # Check frustration indicators (future enhancement)
    # - Rapid incorrect submissions
    # - Decreasing time spent per problem
    # - Pattern of starting but not finishing problems

    return False
```

#### Problem Selection for Motivation Mode
```python
def select_next_problem(
    session: MotivationSession,
    student_progress: StudentProgress
) -> Problem:
    """
    Select appropriate problem for motivation mode
    Strategy: Slightly easier than current level to build confidence
    """
    current_level = student_progress.current_difficulty_level

    # Use slightly lower difficulty in motivation mode
    target_difficulty = max(1, current_level - 1)

    # Avoid recently attempted problems
    recent_problem_ids = get_recent_attempts(
        session.student_id,
        limit=10
    )

    problem = get_random_problem(
        module_id=session.module_id,
        difficulty_level=target_difficulty,
        exclude_ids=recent_problem_ids
    )

    return problem
```

### 8.4 Integration with Existing Pipeline

#### World Model Phase Extension
```python
# Add to world model analysis
motivation_model = {
    "concepts": {
        "motivation_mode": {
            "description": "Low-pressure learning mode",
            "triggers": ["low_motivation", "consecutive_errors", "prolonged_idle"]
        }
    },
    "user_states": {
        "motivated": "normal learning flow",
        "demotivated": "suggest motivation mode",
        "frustrated": "auto-trigger motivation mode"
    }
}
```

#### Input Strategy Phase Extension
```python
# Add motivation mode to input strategies
input_strategies.append({
    "mode": "motivation",
    "characteristics": {
        "single_problem_focus": True,
        "progress_visibility": "hidden",
        "feedback_style": "highly_positive",
        "continuation": "optional"
    }
})
```

#### UI Generation Phase Extension
```python
# Generate motivation mode UI components
ui_components["motivation_mode"] = {
    "MotivationModeWrapper": generate_wrapper_component(),
    "SingleProblemView": generate_problem_view(minimal=True),
    "PositiveFeedback": generate_feedback(tone="encouraging"),
    "ContinuationPrompt": generate_prompt(pressure="low")
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Session creation and management
- Streak calculation
- Suggestion trigger logic
- Problem selection algorithm
- Configuration validation

### 9.2 Integration Tests
- End-to-end session flow
- Mode switching (normal ↔ motivation)
- Progress tracking consistency
- API endpoint workflows

### 9.3 User Acceptance Testing

**Test Scenarios**:
1. **Low motivation student**: Can easily start and complete problems
2. **High performer**: Doesn't feel patronized by encouragement
3. **Teacher monitoring**: Can identify struggling students
4. **Mode switching**: Seamless transition between modes

**Success Criteria**:
- 80% of test students prefer having the option
- 90% find it "easy to use"
- 85% report "less pressure" in motivation mode
- Teachers can identify at-risk students within 1 week

### 9.4 A/B Testing

**Experiment Design**:
- **Group A**: With motivation mode available
- **Group B**: Without motivation mode (control)

**Metrics**:
- Session start rate
- Average problems per session
- Completion rate
- Return rate (next day engagement)
- Overall learning progress

---

## 10. Analytics & Metrics

### 10.1 Key Performance Indicators

**Adoption Metrics**:
- % of students who try motivation mode
- % of students who use it regularly (>3 times/week)
- Mode preference distribution

**Engagement Metrics**:
- Average problems per motivation session
- Session completion rate (finished vs. abandoned)
- Time to first problem (reduced barrier to entry)

**Learning Effectiveness**:
- Accuracy in motivation mode vs. normal mode
- Progress speed comparison
- Retention rate (next day return)

**Emotional/Behavioral**:
- Suggestion acceptance rate (when system recommends)
- Exit reason distribution
- Streak achievement frequency

### 10.2 Teacher Dashboard Widgets

```
┌─────────────────────────────────────────────────┐
│  📊 Motivation Mode Summary                     │
├─────────────────────────────────────────────────┤
│  Active Students: 45/50 (90%)                   │
│  Total Sessions This Week: 234                  │
│  Avg Problems per Session: 4.2 (↑ 15%)         │
│                                                 │
│  🚨 Students Needing Attention:                 │
│    • 김민수 (12 motivation sessions this week)  │
│    • 이영희 (low completion rate)               │
└─────────────────────────────────────────────────┘
```

### 10.3 Data Export

**CSV Export for Research**:
```csv
student_id,session_date,problems_completed,accuracy,max_streak,duration_sec,trigger_type,exit_reason
uuid1,2025-11-18,5,80,4,320,student_initiated,student_choice
uuid2,2025-11-18,3,100,3,180,system_suggested,completed_goal
```

---

## 11. Future Enhancements

### Phase 2 (Post-MVP)
1. **Adaptive Difficulty**: AI adjusts problem difficulty in real-time based on performance
2. **Personalized Encouragement**: AI generates custom messages based on student personality
3. **Gamification**: Optional badges, achievements for motivation mode milestones
4. **Peer Encouragement**: Anonymous "You can do it!" messages from classmates
5. **Voice Mode**: Audio-based encouragement for younger students

### Phase 3 (Advanced)
1. **Emotion Detection**: Use webcam/sensors to detect frustration, auto-trigger mode
2. **Parent Dashboard**: Weekly motivation reports for parents
3. **AI Coach**: Virtual tutor that provides gentle guidance in motivation mode
4. **Group Motivation Mode**: Small groups solve one problem together
5. **Meditation Integration**: Brief mindfulness breaks between problems

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Students abuse easy mode, avoid challenges | High | Medium | Track long-term progress; gently encourage normal mode after success streak |
| Patronizing tone annoys older students | Medium | High | Customizable encouragement level; age-appropriate messaging |
| Teachers misuse data to label students | High | Low | Clear privacy guidelines; aggregate data emphasis |
| Over-reliance on system suggestions | Medium | Medium | Student always has control; optional auto-suggestions |
| Technical complexity delays implementation | Medium | Low | Start with simple version; iterate based on feedback |

---

## 13. Success Criteria

### Launch Criteria (Ready to Deploy)
- [ ] All core APIs implemented and tested
- [ ] Basic UI components functional
- [ ] Database migrations applied
- [ ] Teacher configuration interface working
- [ ] Analytics tracking operational

### Success Criteria (After 1 Month)
- [ ] >40% of students try motivation mode at least once
- [ ] >60% of users find it helpful (survey)
- [ ] Average problems per motivation session > 3
- [ ] No negative impact on overall learning progress
- [ ] Teachers report it helps identify struggling students

### Success Criteria (After 3 Months)
- [ ] >25% of all learning sessions use motivation mode
- [ ] Students using motivation mode show improved engagement (+20%)
- [ ] Return rate for struggling students increases >15%
- [ ] Teacher satisfaction with feature > 75%
- [ ] System suggestion acceptance rate > 40%

---

## 14. Open Questions

### Technical
1. How to detect student frustration without intrusive monitoring?
2. Optimal threshold for auto-suggestions (avoid annoyance)?
3. Should motivation mode have separate difficulty curve?

### Pedagogical
4. What's the right balance of encouragement vs. authenticity?
5. Should there be a "graduation" from motivation mode?
6. How to prevent dependency on low-pressure mode?

### UX
7. Should there be visual distinction (theme) for motivation mode?
8. Mobile vs. desktop: different UX approaches?
9. How to make exit feel positive, not like giving up?

---

## 15. Appendix

### A. Message Library (Korean)

**Positive Feedback Messages**:
```json
{
  "correct_answers": [
    "잘했어요! 정답이에요!",
    "완벽해요! 👏",
    "훌륭해요! 계속 이런 식으로!",
    "정말 잘 이해하고 있네요!",
    "대단해요! 🌟"
  ],
  "incorrect_answers": [
    "괜찮아요! 다시 한 번 생각해볼까요?",
    "조금 아쉽지만 잘 시도했어요!",
    "이런 실수는 배우는 과정이에요!",
    "천천히 다시 풀어봐요. 할 수 있어요!"
  ],
  "streak_achievements": [
    "🔥 연속 3문제! 정말 잘하고 있어요!",
    "🔥 5문제 연속! 굉장해요!",
    "🔥 와! 10문제 연속 정답! 놀라워요!"
  ],
  "continuation_prompts": [
    "하나 더 풀어볼까요?",
    "잘하고 있어요! 계속할까요?",
    "이 기세로 하나 더?",
    "다음 문제도 해볼까요?"
  ],
  "exit_messages": [
    "오늘도 열심히 했어요! 잘했어요!",
    "정말 잘했어요! 내일 또 만나요!",
    "이만큼 했으면 충분해요! 수고했어요!",
    "오늘 많이 배웠어요! 자랑스러워요!"
  ]
}
```

### B. Configuration Template

```json
{
  "motivation_mode_config": {
    "global_settings": {
      "enabled_by_default": true,
      "min_age_recommendation": 7,
      "max_age_recommendation": 14
    },
    "trigger_thresholds": {
      "consecutive_wrong_answers": 3,
      "idle_seconds": 300,
      "low_accuracy_threshold": 40,
      "observation_window_minutes": 30
    },
    "session_limits": {
      "min_problems_per_session": 1,
      "max_problems_per_session": 10,
      "recommended_problems_per_session": 5
    },
    "ui_preferences": {
      "show_streak_counter": true,
      "enable_sound_effects": false,
      "enable_animations": true,
      "theme": "gentle"
    }
  }
}
```

---

## Document Control

**Status**: Draft for Implementation
**Next Review**: After technical feasibility validation
**Approval Required From**:
- Educational Lead (pedagogical soundness)
- Technical Lead (implementation feasibility)
- UX Designer (user experience validation)

**Related Documents**:
- PRD: AI Education System Pipeline
- Database Schema Design
- API Specification
- UI Component Library
