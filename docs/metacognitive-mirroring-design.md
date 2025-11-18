# Metacognitive Mirroring System Design

## Overview

메타인지 미러링 시스템은 학습자가 문제를 풀어가는 과정에서 **자신이 무엇을 하고 있는지 인식**할 수 있도록 돕는 AI 기반 교육 시스템입니다.

### Core Concept

**메타인지(Metacognition)**: 자신의 사고 과정에 대한 인식과 통제 능력
**미러링(Mirroring)**: 학습자의 행동과 사고를 반영하여 보여줌

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Student Learning Interface                  │
│  ┌──────────────┐    ┌────────────────────────────────┐    │
│  │  Problem UI  │    │  Metacognitive Mirror Panel   │    │
│  │              │    │  "You are analyzing the        │    │
│  │  [Math       │◄───┤   problem by identifying       │    │
│  │   Problem]   │    │   key information..."          │    │
│  └──────────────┘    └────────────────────────────────┘    │
└────────────┬──────────────────────────────────┬─────────────┘
             │ User Actions                     │ WebSocket
             │ (clicks, inputs, time)          │ Updates
┌────────────▼──────────────────────────────────▼─────────────┐
│              Real-time Tracking Service (Node.js)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Action Logger  →  Step Detector  →  Event Publisher  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────┬───────────────┘
             │ Step Events                    │ Historical Data
┌────────────▼────────────────────┐  ┌────────▼───────────────┐
│  AI Summarization Service       │  │   PostgreSQL Database  │
│       (Python + Claude)          │  │  - Steps               │
│  ┌─────────────────────────┐    │  │  - Actions             │
│  │ Prompt Engineering      │    │  │  - Summaries           │
│  │ Claude API Integration  │    │  │  - LMS Integration     │
│  │ Context Management      │    │  └────────────────────────┘
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

## Key Components

### 1. Action Tracking System

**Purpose**: 학습자의 모든 상호작용을 세밀하게 기록

**Tracked Actions**:
- Click events (어디를 클릭했는지)
- Input events (무엇을 입력했는지)
- Time spent (각 단계에 얼마나 시간을 썼는지)
- Scroll and focus (어디를 주목하고 있는지)
- Drawing/manipulation (수학 도구 조작)

**Data Structure**:
```typescript
interface LearningAction {
  id: string;
  sessionId: string;
  studentId: string;
  moduleId: string;
  problemId: string;
  actionType: 'click' | 'input' | 'draw' | 'manipulate' | 'submit' | 'hint';
  actionData: Record<string, any>;
  timestamp: Date;
  sequenceNumber: number;
}
```

### 2. Step Detection Algorithm

**Purpose**: 연속된 액션들을 의미 있는 "단계(step)"로 그룹화

**Detection Criteria**:
- **Time-based**: 5초 이상 간격이 있으면 새 단계
- **Action-based**: 특정 액션 패턴 (예: 입력 → 제출)
- **Semantic-based**: AI가 액션의 의미적 변화를 감지

**Step Types**:
1. **Problem Reading** (문제 읽기)
2. **Information Extraction** (정보 파악)
3. **Strategy Planning** (전략 수립)
4. **Execution** (실행)
5. **Verification** (검증)
6. **Reflection** (반성/수정)

### 3. AI Summarization Service

**Purpose**: 각 단계에서 학습자가 무엇을 하고 있는지 자연어로 요약

**Claude Prompt Template**:
```
You are an educational metacognition assistant.

Student Context:
- Grade Level: {grade}
- Subject: {subject}
- Problem: {problem_text}

Student Actions in Current Step:
{action_sequence}

Task: Generate a concise, encouraging summary of what the student is currently doing.
- Use second person ("You are...")
- Focus on the cognitive process, not just the action
- Be specific about the problem-solving strategy
- Keep it under 2 sentences
- Use Korean language

Example:
"지금 분수 문제에서 분모를 비교하며 통분이 필요한지 파악하고 있어요. 차근차근 접근하는 좋은 전략이에요!"
```

**Response Processing**:
- Real-time generation (< 2 seconds)
- Caching for similar action patterns
- Fallback to template-based summaries if API fails

### 4. Metacognitive Mirror UI

**Purpose**: 학습자에게 자신의 사고 과정을 실시간으로 보여줌

**UI Components**:

**A. Current Step Panel** (현재 단계 패널)
```
┌─────────────────────────────────────────┐
│ 🧠 지금 이런 생각을 하고 있어요         │
├─────────────────────────────────────────┤
│ 분수 문제에서 분모를 비교하며          │
│ 통분이 필요한지 파악하고 있어요.       │
│ 차근차근 접근하는 좋은 전략이에요!     │
└─────────────────────────────────────────┘
```

**B. Step History Timeline** (단계 히스토리)
```
┌─────────────────────────────────────────┐
│ 📊 지금까지의 문제 풀이 과정            │
├─────────────────────────────────────────┤
│ ✅ 1. 문제 읽기 (30초)                  │
│ ✅ 2. 핵심 정보 파악 (45초)             │
│ 🔄 3. 전략 수립 중... (진행중)          │
└─────────────────────────────────────────┘
```

**C. Cognitive Strategy Indicators** (인지 전략 표시)
```
사용한 전략:
[✓] 문제 분석
[✓] 정보 추출
[ ] 시각화
[✓] 단계별 계획
```

### 5. LMS Integration Layer

**Purpose**: 외부 LMS와 학습 데이터 연동

**Supported Standards**:
- LTI 1.3 (Learning Tools Interoperability)
- xAPI (Experience API / Tin Can API)
- SCORM 2004 (optional)

**Integration Flow**:
```
LMS → Launch Request → Our System
       ↓
Student Learning Session
       ↓
Step Data + Summaries
       ↓
xAPI Statements → LMS
```

**xAPI Statement Example**:
```json
{
  "actor": {
    "mbox": "mailto:student@example.com",
    "name": "학생 이름"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/progressed",
    "display": {"ko": "진행함"}
  },
  "object": {
    "id": "https://touchmath.kaist.ac.kr/modules/fractions/problem-1",
    "definition": {
      "name": {"ko": "분수 덧셈 문제"},
      "description": {"ko": "2/3 + 1/4 계산하기"}
    }
  },
  "result": {
    "extensions": {
      "http://touchmath.kaist.ac.kr/step": "strategy-planning",
      "http://touchmath.kaist.ac.kr/metacognitive-summary": "통분 전략 수립 중"
    }
  },
  "context": {
    "contextActivities": {
      "parent": [{
        "id": "https://touchmath.kaist.ac.kr/modules/fractions"
      }]
    }
  }
}
```

## Database Schema

### Tables

**1. learning_sessions**
```sql
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    module_id UUID NOT NULL,
    problem_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_steps INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'abandoned')),
    lms_context JSONB, -- LTI/LMS integration data
    created_at TIMESTAMP DEFAULT NOW()
);
```

**2. learning_steps**
```sql
CREATE TABLE learning_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'reading', 'analyzing', 'executing', etc.
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    action_count INTEGER DEFAULT 0,
    metacognitive_summary TEXT, -- AI-generated summary
    cognitive_strategies JSONB, -- Array of strategies used
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_steps_session ON learning_steps(session_id);
```

**3. learning_actions**
```sql
CREATE TABLE learning_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES learning_steps(id),
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    sequence_number INTEGER NOT NULL
);

CREATE INDEX idx_actions_step ON learning_actions(step_id);
CREATE INDEX idx_actions_session ON learning_actions(session_id);
```

**4. metacognitive_summaries**
```sql
CREATE TABLE metacognitive_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES learning_steps(id),
    summary_text TEXT NOT NULL,
    summary_type VARCHAR(50) DEFAULT 'ai-generated', -- 'ai-generated', 'template', 'cached'
    language VARCHAR(10) DEFAULT 'ko',
    generated_at TIMESTAMP DEFAULT NOW(),
    ai_model VARCHAR(50), -- 'claude-3-sonnet', etc.
    generation_time_ms INTEGER,
    confidence_score FLOAT -- Optional: AI confidence in the summary
);
```

**5. lms_integration_log**
```sql
CREATE TABLE lms_integration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id),
    integration_type VARCHAR(50), -- 'lti', 'xapi', 'scorm'
    event_type VARCHAR(50), -- 'launch', 'progress', 'completion'
    payload JSONB NOT NULL,
    response JSONB,
    status VARCHAR(20), -- 'success', 'failed', 'pending'
    sent_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT
);
```

## Real-time Communication

### WebSocket Events

**Client → Server**:
```typescript
// Action tracking
{
  event: 'action',
  data: {
    actionType: 'input',
    actionData: { field: 'numerator', value: '2' },
    timestamp: 1700000000000
  }
}

// Request current summary
{
  event: 'request_summary',
  data: { sessionId: 'uuid' }
}
```

**Server → Client**:
```typescript
// New step detected
{
  event: 'step_change',
  data: {
    stepNumber: 3,
    stepType: 'strategy-planning',
    summary: '지금 문제 해결 전략을 수립하고 있어요!'
  }
}

// Summary update
{
  event: 'summary_update',
  data: {
    summary: '분수를 통분하여 계산하는 방법을 적용하고 있어요.',
    strategies: ['problem-analysis', 'step-planning']
  }
}

// Progress update
{
  event: 'progress',
  data: {
    totalSteps: 4,
    currentStep: 3,
    timeSpent: 180
  }
}
```

## AI Prompt Engineering Strategy

### Context Building

각 요약 생성 시 다음 정보를 Claude에 제공:

1. **Student Profile**:
   - Grade level
   - Previous performance
   - Preferred learning style (if known)

2. **Problem Context**:
   - Problem type and difficulty
   - Learning objectives
   - Key concepts involved

3. **Action Sequence**:
   - Last 5-10 actions
   - Time spent on each
   - Pattern analysis (e.g., hesitation, confidence)

4. **Educational Framework**:
   - Bloom's Taxonomy level
   - Problem-solving stages (Polya's framework)
   - Metacognitive processes (planning, monitoring, evaluating)

### Prompt Optimization

**Version A (Detailed)**:
```
You are an expert educational psychologist specializing in metacognition.

Context:
- Student: Grade 3, learning fractions
- Problem: Add 2/3 + 1/4
- Current actions: [clicked denominator field, typed "12", paused 3 seconds]

Analyze the student's cognitive process and generate an encouraging, specific summary in Korean.
Focus on WHY the student is doing this action, not just WHAT they're doing.
```

**Version B (Concise)**:
```
Student (Grade 3) solving fractions problem: 2/3 + 1/4
Actions: Typed "12" in denominator field after 3-second pause

Generate Korean metacognitive summary (2 sentences max):
```

**A/B Testing**: Track which prompt style produces better educational outcomes

## Performance Optimization

### Caching Strategy

**1. Action Pattern Cache**:
- Cache common action sequences → summary mappings
- Example: "Read problem + highlight numbers" → "문제의 핵심 정보를 파악하고 있어요"
- Reduces AI API calls by ~40%

**2. Step Template Cache**:
- Pre-generated templates for common step types
- Fallback when AI service is slow/unavailable

**3. Student Context Cache**:
- Keep student profile and session context in Redis
- TTL: 2 hours (during active learning session)

### Real-time Requirements

**Target Latency**:
- Action recording: < 50ms
- Step detection: < 200ms
- Summary generation: < 2 seconds
- UI update: < 100ms

**Optimization Techniques**:
- Parallel processing (action logging + step detection)
- WebSocket batching (group multiple actions)
- Lazy AI generation (generate summary when UI is visible)

## Privacy & Security

### Student Data Protection

**Principles**:
- Minimal data collection (only learning-relevant actions)
- Anonymization in logs (use hashed IDs)
- Consent management (opt-in for detailed tracking)
- Data retention policy (auto-delete after 1 year)

**Compliance**:
- FERPA (Family Educational Rights and Privacy Act)
- COPPA (Children's Online Privacy Protection Act)
- Korean PIPA (Personal Information Protection Act)

### Security Measures

**API Security**:
- Rate limiting: 1000 actions/minute per student
- Authentication: JWT with short expiration
- Input sanitization: Prevent injection attacks

**Data Encryption**:
- At rest: AES-256
- In transit: TLS 1.3
- Sensitive fields: Additional field-level encryption

## Educational Research Integration

### Data for Research

메타인지 미러링 시스템은 교육 연구를 위한 풍부한 데이터 제공:

**Research Questions**:
1. 메타인지 피드백이 학습 성과를 향상시키는가?
2. 어떤 학습 전략이 가장 효과적인가?
3. 학생들의 문제 해결 패턴은 무엇인가?

**Analysis Capabilities**:
- Step sequence analysis (common paths to success)
- Time distribution analysis (where students struggle)
- Strategy effectiveness (which cognitive approaches work)
- Personalized recommendations (adaptive scaffolding)

### Experimental Design

**A/B Testing Setup**:
- Control Group: No metacognitive mirror (traditional problem UI)
- Experiment Group: With metacognitive mirror
- Measure: Completion rate, accuracy, time-to-mastery, self-efficacy

## Future Enhancements

1. **Adaptive Mirroring**:
   - Adjust summary detail based on student level
   - Personalize language and encouragement style

2. **Predictive Analytics**:
   - Predict when student is stuck (offer proactive hints)
   - Identify misconceptions early

3. **Collaborative Mirroring**:
   - Show how peers approached similar problems
   - Group metacognitive awareness

4. **Voice Integration**:
   - Spoken summaries for accessibility
   - Voice-based reflection prompts

5. **Teacher Dashboard**:
   - Aggregate metacognitive insights across class
   - Identify students needing support

## Success Metrics

**Educational Impact**:
- Metacognitive awareness increase (pre/post survey)
- Problem-solving accuracy improvement
- Student self-efficacy scores

**System Performance**:
- Summary generation latency < 2s (95th percentile)
- System uptime > 99.5%
- Action tracking accuracy > 99.9%

**User Engagement**:
- Students viewing metacognitive panel > 80% of time
- Positive feedback on summaries > 75%
- Teachers reporting value > 85%

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Status**: Design Complete - Ready for Implementation
