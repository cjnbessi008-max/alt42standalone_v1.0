# LMS Dropout Analysis System Design

## 1. Overview

학습자가 "여기서 멈춘 이유"를 데이터 기반으로 추정하는 시스템입니다. 학습 세션 데이터를 분석하여 dropout 패턴을 식별하고, 교사/관리자에게 인사이트를 제공합니다.

## 2. Dropout Categories (중단 이유 카테고리)

### 2.1 Difficulty-based Dropout (난이도 기반)
- **High Error Rate**: 연속된 오답으로 인한 좌절
- **Complex Content**: 특정 개념에서 반복적인 실패
- **Rapid Decline**: 정답률이 급격히 하락

### 2.2 Engagement-based Dropout (참여도 기반)
- **Decreased Interaction**: 상호작용 빈도 감소
- **Quick Exits**: 문제를 보자마자 빠르게 이탈
- **Passive Behavior**: 클릭/입력 없이 화면만 봄

### 2.3 Time-based Dropout (시간 기반)
- **Session Fatigue**: 장시간 학습 후 피로
- **Time-of-day Effect**: 특정 시간대에 집중력 저하
- **Extended Pause**: 긴 비활동 시간 후 이탈

### 2.4 Content-based Dropout (콘텐츠 기반)
- **Specific Topic Aversion**: 특정 주제에서 반복 이탈
- **Format Preference**: 특정 문제 유형 회피
- **Progression Barrier**: 레벨업 실패로 인한 좌절

### 2.5 Technical Dropout (기술적)
- **Performance Issues**: 느린 응답 시간
- **Error Encounters**: 시스템 오류 경험
- **UI/UX Friction**: 사용성 문제

## 3. Data Model

### 3.1 Core Tables

```sql
-- 학습 세션 추적
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    dropout_point TEXT, -- 중단된 지점 (문제 ID, 섹션 등)
    total_duration_seconds INTEGER,
    active_duration_seconds INTEGER, -- 실제 활동 시간
    created_at TIMESTAMP DEFAULT NOW()
);

-- 학습 활동 이벤트
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    event_type VARCHAR(50) NOT NULL, -- problem_view, answer_submit, hint_request, pause, etc.
    event_data JSONB, -- 이벤트 관련 추가 데이터
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    time_since_last_event_ms INTEGER
);

-- 문제 시도 기록
CREATE TABLE problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    problem_id UUID NOT NULL,
    attempt_number INTEGER NOT NULL, -- 동일 문제에 대한 시도 횟수
    answer_data JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Dropout 분석 결과 캐시
CREATE TABLE dropout_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) UNIQUE,
    primary_reason VARCHAR(100) NOT NULL,
    contributing_factors JSONB, -- [{reason: string, confidence: float, evidence: object}]
    confidence_score FLOAT, -- 0-1 사이의 신뢰도
    recommendations JSONB, -- 교사를 위한 권장사항
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- 학습자 프로필 (패턴 추적)
CREATE TABLE student_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) UNIQUE,
    avg_session_duration_minutes FLOAT,
    preferred_time_of_day VARCHAR(20), -- morning, afternoon, evening
    avg_problems_per_session FLOAT,
    dropout_frequency FLOAT, -- 0-1 (중단 비율)
    strong_topics JSONB, -- [topic_ids]
    weak_topics JSONB, -- [topic_ids]
    engagement_trend VARCHAR(20), -- increasing, stable, decreasing
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_module ON learning_sessions(module_id);
CREATE INDEX idx_events_session ON learning_events(session_id);
CREATE INDEX idx_events_timestamp ON learning_events(timestamp);
CREATE INDEX idx_attempts_session ON problem_attempts(session_id);
CREATE INDEX idx_dropout_session ON dropout_analysis(session_id);
```

### 3.2 Key Metrics

```python
class DropoutMetrics:
    # Session metrics
    total_duration: int  # 총 세션 시간 (초)
    active_duration: int  # 실제 활동 시간 (초)
    idle_time_ratio: float  # 비활동 비율

    # Performance metrics
    total_attempts: int
    correct_attempts: int
    accuracy_rate: float
    accuracy_trend: List[float]  # 시간에 따른 정답률 변화

    # Engagement metrics
    events_per_minute: float
    interaction_frequency: float
    avg_time_per_problem: float
    hint_usage_rate: float

    # Pattern metrics
    consecutive_errors: int
    max_consecutive_errors: int
    problem_skip_count: int
    revisit_count: int  # 같은 문제 재시도
```

## 4. Dropout Analysis Algorithm

### 4.1 Scoring System

각 dropout 이유는 0-1 사이의 신뢰도 점수를 가집니다:

```python
def calculate_dropout_scores(session_data: SessionData) -> Dict[str, float]:
    scores = {}

    # 1. Difficulty-based
    if session_data.accuracy_rate < 0.3 and session_data.consecutive_errors >= 3:
        scores['high_error_rate'] = min(1.0, session_data.consecutive_errors / 5)

    if session_data.accuracy_trend_slope < -0.1:  # 정답률 하락
        scores['rapid_decline'] = abs(session_data.accuracy_trend_slope)

    # 2. Engagement-based
    if session_data.events_per_minute < 0.5:
        scores['decreased_interaction'] = 1.0 - (session_data.events_per_minute / 2.0)

    if session_data.avg_time_per_problem < 10:  # 10초 미만
        scores['quick_exits'] = 1.0 - (session_data.avg_time_per_problem / 30)

    # 3. Time-based
    if session_data.total_duration > 60 * 60:  # 1시간 이상
        scores['session_fatigue'] = min(1.0, session_data.total_duration / (90 * 60))

    if session_data.idle_time_ratio > 0.5:
        scores['extended_pause'] = session_data.idle_time_ratio

    # 4. Content-based
    if session_data.problem_skip_count > 2:
        scores['content_aversion'] = min(1.0, session_data.problem_skip_count / 5)

    return scores
```

### 4.2 Primary Reason Selection

```python
def determine_primary_reason(scores: Dict[str, float]) -> Tuple[str, float]:
    if not scores:
        return 'unknown', 0.0

    # 가장 높은 점수의 이유 선택
    primary_reason = max(scores.items(), key=lambda x: x[1])

    return primary_reason
```

### 4.3 Recommendation Engine

```python
RECOMMENDATIONS = {
    'high_error_rate': {
        'ko': '이 학생은 연속된 오답으로 좌절감을 느낀 것으로 보입니다. 더 쉬운 난이도부터 시작하거나, 힌트를 더 많이 제공해보세요.',
        'en': 'This student appears frustrated by consecutive errors. Consider starting with easier difficulty or providing more hints.',
        'actions': ['adjust_difficulty_down', 'enable_hints', 'provide_examples']
    },
    'session_fatigue': {
        'ko': '학습 시간이 너무 길어 피로도가 높습니다. 짧은 세션으로 나누거나 휴식 시간을 권장하세요.',
        'en': 'The learning session was too long, causing fatigue. Consider shorter sessions or scheduled breaks.',
        'actions': ['limit_session_duration', 'schedule_breaks', 'gamify_progress']
    },
    'decreased_interaction': {
        'ko': '학생의 참여도가 낮아졌습니다. 더 상호작용적인 콘텐츠나 즉각적인 피드백을 제공해보세요.',
        'en': 'Student engagement has decreased. Try more interactive content or immediate feedback.',
        'actions': ['add_interactive_elements', 'immediate_feedback', 'reward_participation']
    }
    # ... more recommendations
}
```

## 5. API Endpoints

### 5.1 Dropout Analysis API

```python
# GET /api/analytics/dropout/sessions/{session_id}
# Response:
{
    "session_id": "uuid",
    "student_id": "uuid",
    "module_id": "uuid",
    "dropout_point": "problem_45",
    "primary_reason": "high_error_rate",
    "confidence": 0.85,
    "contributing_factors": [
        {
            "reason": "rapid_decline",
            "confidence": 0.72,
            "evidence": {
                "accuracy_trend": [0.8, 0.6, 0.4, 0.2],
                "slope": -0.2
            }
        }
    ],
    "recommendations": {
        "ko": "...",
        "en": "...",
        "actions": ["adjust_difficulty_down", "enable_hints"]
    },
    "metrics": {
        "total_duration_seconds": 2400,
        "active_duration_seconds": 1800,
        "accuracy_rate": 0.35,
        "total_attempts": 20,
        "correct_attempts": 7
    }
}

# GET /api/analytics/dropout/students/{student_id}/pattern
# Response:
{
    "student_id": "uuid",
    "total_sessions": 25,
    "dropout_sessions": 8,
    "dropout_rate": 0.32,
    "common_reasons": [
        {"reason": "high_error_rate", "frequency": 5},
        {"reason": "session_fatigue", "frequency": 2}
    ],
    "learning_profile": {
        "avg_session_duration_minutes": 35,
        "preferred_time": "afternoon",
        "engagement_trend": "decreasing"
    },
    "recommendations": [...]
}

# GET /api/analytics/dropout/modules/{module_id}/summary
# Response:
{
    "module_id": "uuid",
    "total_sessions": 150,
    "dropout_sessions": 45,
    "dropout_rate": 0.30,
    "dropout_hotspots": [
        {
            "location": "section_3_problem_12",
            "dropout_count": 15,
            "common_reason": "high_error_rate"
        }
    ],
    "recommendations": [...]
}
```

### 5.2 Real-time Tracking API

```python
# POST /api/tracking/events
# Request:
{
    "session_id": "uuid",
    "event_type": "problem_view",
    "event_data": {
        "problem_id": "problem_45",
        "timestamp": "2025-11-18T10:30:00Z"
    }
}

# POST /api/tracking/attempts
# Request:
{
    "session_id": "uuid",
    "problem_id": "problem_45",
    "answer_data": {...},
    "is_correct": false,
    "time_spent_seconds": 120
}
```

## 6. Web Dashboard UI

### 6.1 Teacher Dashboard - Dropout Overview

```
┌─────────────────────────────────────────────────────────┐
│  Dropout Analysis Dashboard                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Overview (Last 30 days)                            │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Total        │ Dropout      │ Dropout      │       │
│  │ Sessions     │ Count        │ Rate         │       │
│  │    250       │     65       │    26%       │       │
│  └──────────────┴──────────────┴──────────────┘       │
│                                                         │
│  🔥 Dropout Hotspots                                   │
│  1. Section 3 - Problem 12 (15 dropouts)              │
│     Reason: High error rate                            │
│     Action: Reduce difficulty ▼                        │
│                                                         │
│  2. Section 5 - Problem 20 (12 dropouts)              │
│     Reason: Session fatigue                            │
│     Action: Add checkpoint ▼                           │
│                                                         │
│  📈 Trends                                             │
│  [Graph: Dropout rate over time]                      │
│                                                         │
│  👥 Students at Risk                                   │
│  • Kim Min-soo - 4 recent dropouts                    │
│  • Lee Soo-jin - Decreasing engagement                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Individual Student View

```
┌─────────────────────────────────────────────────────────┐
│  Student: Kim Min-soo                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Learning Profile                                       │
│  • Total Sessions: 25                                   │
│  • Dropout Rate: 32% (8 of 25)                         │
│  • Engagement Trend: ⬇ Decreasing                      │
│                                                         │
│  Common Dropout Reasons                                 │
│  1. High Error Rate (5 times)                          │
│  2. Session Fatigue (2 times)                          │
│  3. Decreased Interaction (1 time)                     │
│                                                         │
│  Recent Dropout Details                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2025-11-18 10:45 - Fractions Module            │   │
│  │ Dropout Point: Problem 45                       │   │
│  │ Reason: High error rate (85% confidence)       │   │
│  │ Evidence:                                       │   │
│  │  - 5 consecutive errors                         │   │
│  │  - Accuracy dropped from 80% to 20%            │   │
│  │  - Spent only 15 sec on last problem           │   │
│  │                                                  │   │
│  │ 💡 Recommendations:                             │   │
│  │  - Start with easier problems                   │   │
│  │  - Enable progressive hints                     │   │
│  │  - Review prerequisite concepts                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [View Full History] [Export Report]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 7. Implementation Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with TimescaleDB extension (시계열 데이터 최적화)
- **Cache**: Redis (분석 결과 캐싱)
- **Queue**: Celery (비동기 분석 처리)

### Frontend
- **Framework**: React 18+ with TypeScript
- **State**: Redux Toolkit + RTK Query
- **Charts**: Recharts or Chart.js
- **UI**: Material-UI or Ant Design

### Analytics
- **Statistical Analysis**: NumPy, Pandas, SciPy
- **ML (Future)**: Scikit-learn (패턴 학습)

## 8. Privacy & Security

### 8.1 Data Anonymization
- 교사는 자신의 학생 데이터만 접근
- 집계 데이터는 익명화
- 개인 식별 정보 암호화

### 8.2 GDPR/FERPA Compliance
- 데이터 보존 기간: 2년
- 학생/학부모 요청 시 데이터 삭제
- 데이터 접근 로그 유지

## 9. Future Enhancements

### 9.1 Predictive Analytics
- ML 모델로 dropout 예측 (이탈 가능성 사전 감지)
- 개인화된 intervention 타이밍

### 9.2 Intervention System
- 자동 난이도 조정
- 실시간 힌트 제공
- 교사 알림 시스템

### 9.3 A/B Testing
- Intervention 효과 측정
- 최적의 개입 전략 발견

## 10. Success Metrics

- **Dropout Prediction Accuracy**: >75%
- **Recommendation Effectiveness**: 30% dropout 감소
- **Teacher Adoption**: >60% 월간 활성 사용
- **Response Time**: 분석 결과 <2초 내 제공
