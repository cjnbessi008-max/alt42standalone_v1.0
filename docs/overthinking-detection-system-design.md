# Overthinking Detection System - Technical Design Document

## 1. Executive Summary

### Purpose
독립형 웹 애플리케이션으로 학습자가 문제를 과도하게 고민하는 상황을 실시간으로 감지하고, 적절한 개입(힌트 제공, 교사 알림)을 수행하는 시스템

### Key Features
- 실시간 학생 행동 추적 (시간, 클릭 패턴, 답변 수정)
- 과도한 고민 자동 감지 알고리즘
- 학생에게 적시 힌트 제공
- 교사 대시보드에 실시간 알림
- 학습 분석 데이터 수집 및 시각화

---

## 2. System Architecture

### 2.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────────────────────┐    ┌────────────────────────┐    │
│  │  Student Interface   │    │  Teacher Dashboard     │    │
│  │  - Problem Solving   │    │  - Real-time Monitor   │    │
│  │  - Behavior Tracking │    │  - Analytics View      │    │
│  │  - Hint System       │    │  - Student List        │    │
│  └──────────────────────┘    └────────────────────────┘    │
└───────────────┬──────────────────────┬──────────────────────┘
                │ REST API             │ WebSocket
┌───────────────▼──────────────────────▼──────────────────────┐
│              Backend (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes:                                          │  │
│  │  - /api/problems (CRUD)                              │  │
│  │  - /api/tracking (behavior events)                   │  │
│  │  - /api/overthinking (detection)                     │  │
│  │  - /api/hints (hint system)                          │  │
│  │  - /api/analytics (dashboard data)                   │  │
│  │                                                        │  │
│  │  Services:                                            │  │
│  │  - Overthinking Detection Engine                     │  │
│  │  - Real-time Event Processor (Socket.io)            │  │
│  │  - Analytics Service                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - students                                                  │
│  - problems                                                  │
│  - student_attempts                                          │
│  - behavior_events                                           │
│  - overthinking_events                                       │
│  - hints                                                     │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite (build tool)
- Socket.io-client (real-time communication)
- Chart.js / Recharts (analytics visualization)
- Tailwind CSS (styling)
- React Hook Form + Zod (validation)

**Backend:**
- Node.js 18+
- Express.js (REST API)
- Socket.io (WebSocket server)
- TypeScript
- Prisma ORM (database access)
- Winston (logging)

**Database:**
- PostgreSQL 15+

**DevOps:**
- Docker + Docker Compose
- ESLint + Prettier (code quality)
- Jest + React Testing Library (testing)

---

## 3. Overthinking Detection Algorithm

### 3.1 Detection Criteria

학생이 "과도하게 고민 중"이라고 판단하는 기준:

#### Primary Indicators (주요 지표)

1. **Time-based Detection (시간 기반)**
   - **Threshold**: 문제 해결 시간 > 난이도별 평균 시간 × 2.5
   - **Example**:
     - 난이도 1 (쉬움) - 평균 60초 → 150초 이상이면 감지
     - 난이도 3 (보통) - 평균 180초 → 450초 이상이면 감지
     - 난이도 5 (어려움) - 평균 300초 → 750초 이상이면 감지

2. **Inactivity Detection (비활동 감지)**
   - **Threshold**: 5분 이상 아무 입력/클릭 없음
   - **Action**: "아직 문제를 풀고 계신가요?" 알림

3. **Answer Modification Pattern (답변 수정 패턴)**
   - **Threshold**: 동일 문제에서 답변 수정 3회 이상
   - **Indicator**: 확신 부족, 개념 혼란 가능성

4. **Repetitive Click Pattern (반복 클릭 패턴)**
   - **Threshold**: 같은 UI 영역에 10초 이내 5회 이상 클릭
   - **Indicator**: 혼란, 도움말 찾기

#### Secondary Indicators (보조 지표)

5. **Error Rate (오답률)**
   - 같은 유형 문제에서 연속 3회 오답
   - 힌트 제공 필요성 증가

6. **Help-Seeking Behavior (도움 요청 행동)**
   - 힌트 버튼에 호버/클릭 후 실행 안 함 (망설임)
   - 도움말 페이지 반복 방문

### 3.2 Scoring Algorithm

```typescript
interface OverthinkingScore {
  total: number;        // 0-100
  confidence: 'low' | 'medium' | 'high';
  triggers: string[];   // 어떤 지표가 발동되었는지
  recommendation: 'hint' | 'alert_teacher' | 'observe';
}

function calculateOverthinkingScore(
  timeSpent: number,
  avgTime: number,
  answerModifications: number,
  inactivityDuration: number,
  repetitiveClicks: number,
  consecutiveErrors: number
): OverthinkingScore {
  let score = 0;
  const triggers: string[] = [];

  // Time-based (max 40 points)
  const timeRatio = timeSpent / avgTime;
  if (timeRatio > 2.5) {
    const timeScore = Math.min(40, (timeRatio - 2.5) * 10);
    score += timeScore;
    triggers.push(`time_exceeded_${timeRatio.toFixed(1)}x`);
  }

  // Inactivity (max 25 points)
  if (inactivityDuration > 300) { // 5 minutes
    const inactivityScore = Math.min(25, (inactivityDuration - 300) / 12);
    score += inactivityScore;
    triggers.push(`inactive_${Math.floor(inactivityDuration / 60)}min`);
  }

  // Answer modifications (max 20 points)
  if (answerModifications >= 3) {
    score += Math.min(20, answerModifications * 5);
    triggers.push(`answer_modifications_${answerModifications}`);
  }

  // Repetitive clicks (max 10 points)
  if (repetitiveClicks >= 5) {
    score += Math.min(10, repetitiveClicks * 2);
    triggers.push(`repetitive_clicks_${repetitiveClicks}`);
  }

  // Consecutive errors (max 5 points)
  if (consecutiveErrors >= 3) {
    score += 5;
    triggers.push(`consecutive_errors_${consecutiveErrors}`);
  }

  // Determine confidence and recommendation
  let confidence: 'low' | 'medium' | 'high';
  let recommendation: 'hint' | 'alert_teacher' | 'observe';

  if (score >= 70) {
    confidence = 'high';
    recommendation = 'alert_teacher';
  } else if (score >= 40) {
    confidence = 'medium';
    recommendation = 'hint';
  } else {
    confidence = 'low';
    recommendation = 'observe';
  }

  return { total: score, confidence, triggers, recommendation };
}
```

### 3.3 Intervention Strategy

#### Level 1: Observe (Score 0-39)
- 아무 행동 안 함
- 백그라운드에서 계속 모니터링

#### Level 2: Hint (Score 40-69)
- **UI**: 부드러운 힌트 제공 UI 표시
  - "힌트가 필요하신가요?" 버튼 (선택적 클릭)
  - 클릭 시 단계별 힌트 제공 (3단계)
    - Level 1: 개념 복습
    - Level 2: 문제 접근 방법
    - Level 3: 답에 가까운 힌트
- **Teacher Dashboard**: 노란색 표시 (관찰 필요)

#### Level 3: Alert Teacher (Score 70+)
- **Student UI**: 힌트 제공 + "선생님께 도움을 요청할까요?" 옵션
- **Teacher Dashboard**: 빨간색 알림 + 실시간 알림음
- **Notification**: "학생 [이름]이(가) [문제]에서 어려움을 겪고 있습니다"

---

## 4. Database Schema

### 4.1 Tables

```sql
-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    problem_type VARCHAR(50), -- 'multiple_choice', 'short_answer', 'calculation'
    correct_answer TEXT NOT NULL,
    avg_solve_time_seconds INTEGER DEFAULT 180, -- Updated as students solve
    hints JSONB, -- Array of hints [{level: 1, text: "..."}, ...]
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student attempts table
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER NOT NULL,
    answer_modifications INTEGER DEFAULT 0, -- How many times answer was changed
    hint_level_used INTEGER DEFAULT 0, -- Highest hint level viewed
    started_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Behavior events table (granular tracking)
CREATE TABLE behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'click', 'input_change', 'focus', 'blur', 'scroll'
    event_data JSONB, -- Additional context
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_behavior_events_student_problem ON behavior_events(student_id, problem_id, timestamp);

-- Overthinking events table
CREATE TABLE overthinking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES student_attempts(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    confidence VARCHAR(20) CHECK (confidence IN ('low', 'medium', 'high')),
    triggers JSONB NOT NULL, -- Array of trigger strings
    recommendation VARCHAR(20) CHECK (recommendation IN ('observe', 'hint', 'alert_teacher')),
    intervention_taken VARCHAR(50), -- 'hint_shown', 'teacher_alerted', 'none'
    student_response VARCHAR(50), -- 'hint_accepted', 'hint_declined', 'teacher_helped'
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_overthinking_events_student ON overthinking_events(student_id, detected_at);
CREATE INDEX idx_overthinking_events_unresolved ON overthinking_events(resolved_at) WHERE resolved_at IS NULL;

-- Teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teacher-Student assignments
CREATE TABLE teacher_students (
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, student_id)
);
```

### 4.2 Key Indexes

```sql
-- Performance optimization
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id, started_at);
CREATE INDEX idx_student_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_student_attempts_active ON student_attempts(student_id, problem_id) WHERE submitted_at IS NULL;
```

---

## 5. API Endpoints

### 5.1 Student APIs

```typescript
// Get problems
GET /api/problems
GET /api/problems/:id

// Submit problem attempt
POST /api/attempts/start
{
  "studentId": "uuid",
  "problemId": "uuid"
}

POST /api/attempts/:attemptId/submit
{
  "answer": "string",
  "timeSpent": number
}

// Track behavior
POST /api/tracking/event
{
  "studentId": "uuid",
  "problemId": "uuid",
  "attemptId": "uuid",
  "eventType": "click" | "input_change" | "focus",
  "eventData": {}
}

// Get hints
GET /api/problems/:problemId/hints/:level
```

### 5.2 Teacher APIs

```typescript
// Get students
GET /api/teachers/:teacherId/students

// Get real-time overthinking alerts
GET /api/teachers/:teacherId/alerts

// Get analytics
GET /api/teachers/:teacherId/analytics?startDate&endDate
```

### 5.3 WebSocket Events

```typescript
// Client → Server
{
  event: 'student:join',
  data: { studentId: 'uuid', problemId: 'uuid' }
}

{
  event: 'behavior:track',
  data: { /* behavior event */ }
}

// Server → Client (Student)
{
  event: 'hint:suggest',
  data: { level: 1, message: '힌트가 필요하신가요?' }
}

// Server → Client (Teacher)
{
  event: 'alert:overthinking',
  data: {
    studentId: 'uuid',
    studentName: 'string',
    problemId: 'uuid',
    problemTitle: 'string',
    score: number,
    triggers: string[]
  }
}
```

---

## 6. Frontend Components

### 6.1 Student Interface

```
StudentApp/
├── ProblemView/
│   ├── ProblemStatement.tsx         # 문제 표시
│   ├── AnswerInput.tsx              # 답변 입력 (tracking 포함)
│   ├── HintPanel.tsx                # 힌트 UI
│   └── ProgressIndicator.tsx        # 진행 상황
├── BehaviorTracker.tsx              # 행동 추적 훅/HOC
└── useOverthinkingDetection.ts      # WebSocket 연결
```

### 6.2 Teacher Dashboard

```
TeacherDashboard/
├── StudentList.tsx                   # 학생 목록
├── RealTimeMonitor.tsx              # 실시간 모니터링
│   ├── StudentCard.tsx              # 학생별 상태 카드
│   └── AlertPanel.tsx               # 과도한 고민 알림
├── Analytics/
│   ├── OverthinkingTrends.tsx       # 고민 패턴 분석
│   ├── ProblemDifficultyChart.tsx   # 문제별 난이도 분석
│   └── StudentPerformance.tsx       # 학생별 성과
└── useTeacherSocket.ts              # 실시간 알림 수신
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Design document
- [ ] Project setup (Vite + Express + PostgreSQL)
- [ ] Database schema creation
- [ ] Basic API structure
- [ ] Authentication (simple JWT)

### Phase 2: Core Tracking (Week 2)
- [ ] Student problem-solving interface
- [ ] Behavior tracking implementation
- [ ] Event storage and processing
- [ ] Basic analytics endpoints

### Phase 3: Detection Engine (Week 3)
- [ ] Overthinking detection algorithm
- [ ] Real-time processing pipeline
- [ ] Hint system implementation
- [ ] WebSocket infrastructure

### Phase 4: Teacher Dashboard (Week 4)
- [ ] Real-time monitoring UI
- [ ] Alert system
- [ ] Analytics visualization
- [ ] Student management

### Phase 5: Polish & Testing (Week 5)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment setup (Docker)

---

## 8. Key Features

### 8.1 Adaptive Thresholds

시스템은 학습하면서 개선됩니다:
- 초기: 고정된 기본값 사용 (난이도별 평균 시간)
- 운영 중: 실제 학생 데이터로 평균 계산
- 개인화: 개별 학생의 평소 패턴 고려 (선택적)

```sql
-- Update average solve time for a problem
UPDATE problems
SET avg_solve_time_seconds = (
    SELECT AVG(time_spent_seconds)
    FROM student_attempts
    WHERE problem_id = $1 AND is_correct = true
)
WHERE id = $1;
```

### 8.2 Privacy & Ethics

- 학생 행동 추적은 **학습 지원 목적**으로만 사용
- 데이터는 암호화되어 저장
- 교사는 자신의 학생만 조회 가능
- 학생/학부모에게 추적 사실 고지
- 언제든지 데이터 삭제 요청 가능

### 8.3 Accessibility

- 키보드 네비게이션 완전 지원
- 스크린 리더 호환
- 색상 외에도 아이콘/텍스트로 상태 표시
- 고대비 모드 지원

---

## 9. Performance Considerations

### 9.1 Real-time Processing

- **WebSocket**: 양방향 실시간 통신
- **Debouncing**: 과도한 이벤트 전송 방지 (input 이벤트는 500ms debounce)
- **Batching**: 여러 이벤트를 모아서 전송 (max 10 events or 2 seconds)

### 9.2 Database Optimization

- 인덱스 최적화 (active attempts, unresolved overthinking events)
- 오래된 behavior_events 주기적 아카이빙 (30일 이상)
- Connection pooling (max 20 connections)

### 9.3 Scalability

- **Current target**: 100 concurrent students, 10 teachers
- **Future**: Horizontal scaling with Redis for session/WebSocket management

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Detection algorithm logic
- Scoring functions
- API endpoint handlers

### 10.2 Integration Tests
- End-to-end problem solving flow
- Real-time event processing
- WebSocket communication

### 10.3 User Testing
- Teacher usability testing
- Student interface testing
- Alert sensitivity calibration

---

## 11. Deployment

### 11.1 Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: overthinking_lms
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:secure_password@postgres:5432/overthinking_lms
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 11.2 Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 12. Success Metrics

### 12.1 System Performance
- **Response time**: API < 200ms, WebSocket latency < 100ms
- **Detection accuracy**: 80%+ true positive rate
- **False positive rate**: < 15%

### 12.2 Educational Impact
- **Time to intervention**: Average < 3 minutes from overthinking start
- **Student satisfaction**: Hint helpfulness rating > 4/5
- **Teacher adoption**: 70%+ use dashboard regularly

### 12.3 Technical Metrics
- **Uptime**: 99.5%+
- **Database query time**: < 50ms (95th percentile)
- **Event processing lag**: < 500ms

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Status**: Ready for Implementation
- **Target Completion**: 5 weeks
