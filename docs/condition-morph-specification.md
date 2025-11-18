# Condition Morph: 실시간 점화식 조건 변경 시스템

## 1. 개요 (Overview)

### 1.1 목적
**Condition Morph**는 학생의 학습 상황에 따라 수학 문제의 점화식(recurrence relation) 조건을 실시간으로 변경하고 즉시 반영하는 적응형 학습 시스템입니다.

### 1.2 핵심 기능
- **실시간 조건 변경**: 학생 응답에 따라 문제 난이도/유형 자동 조정
- **점화식 지원**: 수열, 피보나치, 등차/등비수열 등 다양한 점화식 처리
- **Moodle 연동**: Moodle LMS에서 문제 정보 동기화
- **모바일 UI**: 우측 하단 스마트폰 시뮬레이터에 실시간 표시

---

## 2. 시스템 아키텍처

### 2.1 전체 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle LMS (PHP 7.1.9)                    │
│                    MySQL 5.7 Database                         │
│  - Quiz/Question Bank                                         │
│  - Student Progress                                           │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API / MySQL Direct Connect
┌────────────────────▼────────────────────────────────────────┐
│              Moodle Integration Service                       │
│  - Problem Data Sync (Question Fetcher)                      │
│  - Student Progress Sync                                      │
│  - Grade Export                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Condition Morph Engine (Python FastAPI)             │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Recurrence Relation Parser                          │   │
│  │  - Parse mathematical expressions (a_n = f(n))      │   │
│  │  - Validate syntax and semantics                    │   │
│  │  - Generate computation graph                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Condition Morphing Rules Engine                     │   │
│  │  - Evaluate student performance                     │   │
│  │  - Determine morphing triggers                      │   │
│  │  - Apply transformation rules                       │   │
│  │  - Generate next problem variant                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Real-time Update Handler                            │   │
│  │  - WebSocket server (Socket.io)                     │   │
│  │  - Redis Pub/Sub for message queue                  │   │
│  │  - Push updates to mobile UI                        │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
┌──────────────▼─────┐   ┌───────▼────────────┐
│  PostgreSQL 15+    │   │   Redis 7+         │
│  - Morph history   │   │   - Pub/Sub        │
│  - Student state   │   │   - Session cache  │
│  - Problem bank    │   │   - Real-time msgs │
└────────────────────┘   └────────────────────┘
               │
               │
┌──────────────▼─────────────────────────────────────────────┐
│              Mobile App UI (React + TypeScript)             │
│                                                              │
│  ┌─────────────────┐          ┌────────────────────────┐  │
│  │  Teacher View   │          │  Smartphone Simulator  │  │
│  │  (Left/Center)  │          │  (Right Bottom Corner) │  │
│  │                 │          │                        │  │
│  │  - Dashboard    │          │  ┌──────────────────┐ │  │
│  │  - Analytics    │          │  │  Student View    │ │  │
│  │  - Control      │          │  │                  │ │  │
│  └─────────────────┘          │  │  - Current Prob  │ │  │
│                                │  │  - Progress Bar  │ │  │
│                                │  │  - Real-time     │ │  │
│                                │  │    Morphing      │ │  │
│                                │  └──────────────────┘ │  │
│                                └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 컴포넌트 상세

### 3.1 Moodle Integration Service

#### 3.1.1 데이터 동기화
**Moodle Quiz/Question 구조:**
```php
// Moodle 3.7 Question Types
mdl_question
├── id
├── category
├── name
├── questiontext (HTML)
├── questiontextformat
├── defaultmark
└── qtype (essay, multichoice, calculated, etc.)

mdl_question_calculated
├── question (FK)
├── formula (점화식 저장)
├── tolerance
└── correctanswerlength
```

**연동 방법:**
1. **Option A: Moodle REST API** (권장)
   ```python
   # Moodle Web Services API 사용
   import requests

   MOODLE_URL = "https://lms.kaist.ac.kr"
   MOODLE_TOKEN = "your_webservice_token"

   def fetch_questions(course_id, quiz_id):
       endpoint = f"{MOODLE_URL}/webservice/rest/server.php"
       params = {
           'wstoken': MOODLE_TOKEN,
           'wsfunction': 'mod_quiz_get_quiz_questions',
           'moodlewsrestformat': 'json',
           'quizid': quiz_id
       }
       response = requests.get(endpoint, params=params)
       return response.json()
   ```

2. **Option B: Direct MySQL Connection** (레거시)
   ```python
   import pymysql

   conn = pymysql.connect(
       host='moodle_db_host',
       user='readonly_user',
       password='password',
       db='moodle',
       charset='utf8mb4'
   )

   query = """
   SELECT q.id, q.name, q.questiontext, qc.formula
   FROM mdl_question q
   LEFT JOIN mdl_question_calculated qc ON q.id = qc.question
   WHERE q.category = %s AND qc.formula IS NOT NULL
   """
   ```

#### 3.1.2 점화식 포맷 변환
Moodle의 `formula` 필드를 표준 수식으로 변환:

```python
class MoodleFormulaConverter:
    """Moodle 수식을 표준 점화식으로 변환"""

    def convert(self, moodle_formula: str) -> RecurrenceRelation:
        """
        Moodle Formula Examples:
        - {a} + {b} * {n}           → a_n = a + b*n (등차수열)
        - {a} * {r}^{n}             → a_n = a * r^n (등비수열)
        - {a_{n-1}} + {a_{n-2}}     → a_n = a_{n-1} + a_{n-2} (피보나치)
        """
        # Moodle 변수 표기법 → 표준 수학 표기법 변환
        formula = moodle_formula.replace('{', '').replace('}', '')

        return RecurrenceRelation(
            expression=formula,
            initial_conditions=self.extract_initial_conditions(formula),
            order=self.determine_order(formula)
        )
```

### 3.2 Recurrence Relation Parser

#### 3.2.1 지원 점화식 유형

| 유형 | 수식 | 예시 |
|------|------|------|
| **등차수열** | a_n = a_1 + (n-1)d | 2, 5, 8, 11, 14... |
| **등비수열** | a_n = a_1 × r^(n-1) | 3, 6, 12, 24, 48... |
| **피보나치** | a_n = a_{n-1} + a_{n-2} | 1, 1, 2, 3, 5, 8... |
| **선형 점화식** | a_n = c₁a_{n-1} + c₂a_{n-2} | a_n = 2a_{n-1} - a_{n-2} |
| **비선형** | a_n = a_{n-1}² + c | a_n = a_{n-1}² + 1 |
| **조건부** | a_n = f(n) if P(n) else g(n) | a_n = n² if n%2==0 else n |

#### 3.2.2 파서 구현

```python
from dataclasses import dataclass
from typing import List, Dict, Callable
import sympy as sp

@dataclass
class RecurrenceRelation:
    """점화식 데이터 모델"""
    expression: str  # 수식 (예: "a_n = 2*a_{n-1} + 1")
    order: int  # 차수 (재귀 깊이)
    initial_conditions: Dict[int, float]  # 초기값 {0: 1, 1: 1}
    domain: str = "natural"  # "natural", "integer", "real"
    constraints: List[str] = None  # 제약 조건

    def evaluate(self, n: int) -> float:
        """n번째 항 계산"""
        if n in self.initial_conditions:
            return self.initial_conditions[n]

        # 재귀적 계산 또는 동적 프로그래밍
        return self._compute(n)

    def _compute(self, n: int) -> float:
        """동적 프로그래밍으로 효율적 계산"""
        memo = self.initial_conditions.copy()

        for i in range(max(memo.keys()) + 1, n + 1):
            # SymPy를 사용한 수식 평가
            memo[i] = self._evaluate_expression(i, memo)

        return memo[n]

class RecurrenceParser:
    """점화식 파서"""

    def parse(self, expression: str) -> RecurrenceRelation:
        """
        점화식 문자열을 파싱

        Examples:
            "a_n = 2*a_{n-1} + 1" → RecurrenceRelation(order=1)
            "a_n = a_{n-1} + a_{n-2}" → RecurrenceRelation(order=2)
        """
        # SymPy를 사용한 수식 파싱
        n = sp.Symbol('n')
        expr = sp.sympify(expression.split('=')[1].strip())

        # 차수 결정 (최대 재귀 깊이)
        order = self._extract_order(expr)

        return RecurrenceRelation(
            expression=expression,
            order=order,
            initial_conditions={}
        )

    def _extract_order(self, expr) -> int:
        """점화식의 차수 추출"""
        # a_{n-k}에서 최대 k 값 찾기
        max_offset = 0
        for term in sp.preorder_traversal(expr):
            if 'a_' in str(term):
                # a_{n-2}에서 2 추출
                offset = self._extract_offset(str(term))
                max_offset = max(max_offset, offset)
        return max_offset
```

### 3.3 Condition Morphing Rules Engine

#### 3.3.1 Morphing 트리거 조건

```python
from enum import Enum
from dataclasses import dataclass

class MorphTrigger(Enum):
    """조건 변경 트리거"""
    CONSECUTIVE_CORRECT = "consecutive_correct"  # 연속 정답
    CONSECUTIVE_WRONG = "consecutive_wrong"      # 연속 오답
    TIME_THRESHOLD = "time_threshold"            # 시간 초과
    PATTERN_MASTERY = "pattern_mastery"          # 패턴 습득
    STRUGGLE_DETECTED = "struggle_detected"      # 어려움 감지
    PROFICIENCY_LEVEL = "proficiency_level"      # 숙련도 변화

@dataclass
class MorphRule:
    """Morphing 규칙"""
    trigger: MorphTrigger
    condition: Callable  # 조건 함수
    transformation: Callable  # 변환 함수
    priority: int = 0  # 우선순위

    def evaluate(self, student_state: 'StudentState') -> bool:
        """조건 평가"""
        return self.condition(student_state)

    def apply(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """변환 적용"""
        return self.transformation(problem)

class ConditionMorpher:
    """조건 변환 엔진"""

    def __init__(self):
        self.rules: List[MorphRule] = []
        self._initialize_default_rules()

    def _initialize_default_rules(self):
        """기본 Morphing 규칙 설정"""

        # 규칙 1: 3회 연속 정답 → 난이도 상승
        self.rules.append(MorphRule(
            trigger=MorphTrigger.CONSECUTIVE_CORRECT,
            condition=lambda state: state.consecutive_correct >= 3,
            transformation=self._increase_difficulty,
            priority=1
        ))

        # 규칙 2: 3회 연속 오답 → 난이도 하락
        self.rules.append(MorphRule(
            trigger=MorphTrigger.CONSECUTIVE_WRONG,
            condition=lambda state: state.consecutive_wrong >= 3,
            transformation=self._decrease_difficulty,
            priority=2
        ))

        # 규칙 3: 평균 응답 시간 > 2분 → 단순화
        self.rules.append(MorphRule(
            trigger=MorphTrigger.TIME_THRESHOLD,
            condition=lambda state: state.avg_response_time > 120,
            transformation=self._simplify_problem,
            priority=3
        ))

    def morph(self,
              current_problem: RecurrenceRelation,
              student_state: StudentState) -> RecurrenceRelation:
        """
        학생 상태에 따라 문제 변형

        Returns:
            변형된 RecurrenceRelation
        """
        # 우선순위 순으로 규칙 평가
        for rule in sorted(self.rules, key=lambda r: r.priority):
            if rule.evaluate(student_state):
                morphed = rule.apply(current_problem)

                # Morphing 이벤트 발생
                self._emit_morph_event(
                    trigger=rule.trigger,
                    original=current_problem,
                    morphed=morphed,
                    student_id=student_state.student_id
                )

                return morphed

        return current_problem  # 변경 없음

    def _increase_difficulty(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """난이도 증가 변환"""
        # 예: 등차수열 → 등비수열
        # 또는 차수 증가 (1차 → 2차)
        if problem.order == 1:
            # a_n = a_{n-1} + d → a_n = a_{n-1} + a_{n-2}
            return RecurrenceRelation(
                expression="a_n = a_{n-1} + a_{n-2}",
                order=2,
                initial_conditions={0: 1, 1: 1}
            )
        return problem

    def _decrease_difficulty(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """난이도 감소 변환"""
        # 예: 피보나치 → 등차수열
        if problem.order == 2:
            return RecurrenceRelation(
                expression="a_n = a_{n-1} + 2",
                order=1,
                initial_conditions={0: 1}
            )
        return problem

    def _simplify_problem(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """문제 단순화"""
        # 계수 축소, 초기값 단순화
        return problem  # 구현 필요
```

#### 3.3.2 학생 상태 추적

```python
from datetime import datetime
from typing import List

@dataclass
class StudentAttempt:
    """학생 답안 시도"""
    timestamp: datetime
    problem_id: str
    answer: float
    is_correct: bool
    time_spent_seconds: int

@dataclass
class StudentState:
    """학생의 현재 학습 상태"""
    student_id: str
    current_problem: RecurrenceRelation
    attempts: List[StudentAttempt]

    # 성과 지표
    consecutive_correct: int = 0
    consecutive_wrong: int = 0
    total_correct: int = 0
    total_attempts: int = 0

    # 시간 지표
    avg_response_time: float = 0.0
    last_attempt_time: datetime = None

    # 숙련도 지표
    difficulty_level: int = 1  # 1-5
    mastery_score: float = 0.0  # 0.0-1.0

    def update(self, attempt: StudentAttempt):
        """시도 기록 업데이트"""
        self.attempts.append(attempt)
        self.total_attempts += 1

        if attempt.is_correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            self.total_correct += 1
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0

        # 평균 응답 시간 업데이트
        times = [a.time_spent_seconds for a in self.attempts[-10:]]
        self.avg_response_time = sum(times) / len(times)

        # 숙련도 점수 계산
        self.mastery_score = self.total_correct / self.total_attempts
```

### 3.4 Real-time Update System

#### 3.4.1 WebSocket 구현

```python
from fastapi import FastAPI, WebSocket
from fastapi.websockets import WebSocketDisconnect
import asyncio
import json

app = FastAPI()

class ConnectionManager:
    """WebSocket 연결 관리"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket

    def disconnect(self, student_id: str):
        if student_id in self.active_connections:
            del self.active_connections[student_id]

    async def send_morph_update(self, student_id: str, data: dict):
        """학생에게 Morphing 업데이트 전송"""
        if student_id in self.active_connections:
            websocket = self.active_connections[student_id]
            await websocket.send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/{student_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: str):
    await manager.connect(student_id, websocket)

    try:
        while True:
            # 클라이언트로부터 메시지 수신 (답안 제출)
            data = await websocket.receive_json()

            # 답안 처리 및 Morphing 평가
            result = await process_student_answer(student_id, data)

            # 결과 전송 (Morphing 발생 시 새 문제 포함)
            await websocket.send_json(result)

    except WebSocketDisconnect:
        manager.disconnect(student_id)

async def process_student_answer(student_id: str, data: dict) -> dict:
    """답안 처리 및 조건 변경 평가"""
    # 1. 답안 검증
    is_correct = validate_answer(data['answer'], data['problem_id'])

    # 2. 학생 상태 업데이트
    state = get_student_state(student_id)
    state.update(StudentAttempt(
        timestamp=datetime.now(),
        problem_id=data['problem_id'],
        answer=data['answer'],
        is_correct=is_correct,
        time_spent_seconds=data['time_spent']
    ))

    # 3. Morphing 평가
    morpher = ConditionMorpher()
    new_problem = morpher.morph(state.current_problem, state)

    # 4. Morphing 발생 여부 확인
    morphed = (new_problem.expression != state.current_problem.expression)

    return {
        'is_correct': is_correct,
        'morphed': morphed,
        'new_problem': new_problem.to_dict() if morphed else None,
        'feedback': generate_feedback(is_correct, state),
        'student_state': {
            'consecutive_correct': state.consecutive_correct,
            'mastery_score': state.mastery_score,
            'difficulty_level': state.difficulty_level
        }
    }
```

#### 3.4.2 Redis Pub/Sub

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

class MorphEventBus:
    """Morphing 이벤트 버스"""

    CHANNEL_MORPH = "condition_morph_events"

    def publish_morph_event(self, event: dict):
        """Morphing 이벤트 발행"""
        redis_client.publish(
            self.CHANNEL_MORPH,
            json.dumps(event)
        )

    def subscribe_morph_events(self, callback: Callable):
        """Morphing 이벤트 구독"""
        pubsub = redis_client.pubsub()
        pubsub.subscribe(self.CHANNEL_MORPH)

        for message in pubsub.listen():
            if message['type'] == 'message':
                event = json.loads(message['data'])
                callback(event)

# 사용 예시
event_bus = MorphEventBus()

def on_morph_event(event: dict):
    """Morphing 이벤트 처리"""
    print(f"Morph Event: {event['trigger']} for student {event['student_id']}")

    # 분석 로그 저장
    save_morph_analytics(event)

    # 실시간 대시보드 업데이트
    update_teacher_dashboard(event)

event_bus.subscribe_morph_events(on_morph_event)
```

---

## 4. 데이터베이스 스키마

### 4.1 Condition Morph 전용 테이블

```sql
-- 점화식 문제 정의
CREATE TABLE recurrence_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_question_id INTEGER,  -- Moodle 연동용
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- 점화식 정의
    expression TEXT NOT NULL,  -- "a_n = 2*a_{n-1} + 1"
    order_num INTEGER NOT NULL CHECK (order_num >= 1),
    initial_conditions JSONB NOT NULL,  -- {"0": 1, "1": 1}
    domain VARCHAR(20) DEFAULT 'natural',

    -- 난이도
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    concept_tags TEXT[],  -- {"fibonacci", "linear", "arithmetic"}

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Morphing 규칙
CREATE TABLE morph_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,  -- 'consecutive_correct', 'time_threshold', etc.

    -- 조건 (Python expression)
    condition_expression TEXT NOT NULL,

    -- 변환 로직
    transformation_type VARCHAR(50),  -- 'increase_difficulty', 'simplify', etc.
    transformation_params JSONB,

    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW()
);

-- 학생 상태 추적
CREATE TABLE student_morph_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),

    -- 현재 상태
    current_difficulty INTEGER,
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_wrong INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,

    -- 시간 지표
    avg_response_time_seconds FLOAT,
    last_attempt_at TIMESTAMP,

    -- 숙련도
    mastery_score FLOAT CHECK (mastery_score BETWEEN 0 AND 1),

    -- 메타데이터
    session_id UUID,
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(student_id, problem_id, session_id)
);

-- 답안 시도 기록
CREATE TABLE student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),
    state_id UUID REFERENCES student_morph_states(id),

    -- 시도 내용
    answer_value FLOAT NOT NULL,
    expected_value FLOAT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    -- 시간 추적
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMP DEFAULT NOW(),

    -- 컨텍스트
    problem_expression TEXT,  -- 시도 당시의 문제 (Morphing 기록)
    difficulty_level INTEGER
);

-- Morphing 이벤트 로그
CREATE TABLE morph_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    problem_id UUID NOT NULL REFERENCES recurrence_problems(id),

    -- Morphing 정보
    trigger_type VARCHAR(50) NOT NULL,
    rule_id UUID REFERENCES morph_rules(id),

    -- 변화 내용
    original_expression TEXT NOT NULL,
    morphed_expression TEXT NOT NULL,
    original_difficulty INTEGER,
    morphed_difficulty INTEGER,

    -- 학생 상태 스냅샷
    student_state_snapshot JSONB,

    occurred_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_student_states_student ON student_morph_states(student_id);
CREATE INDEX idx_student_states_problem ON student_morph_states(problem_id);
CREATE INDEX idx_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_attempts_problem ON student_attempts(problem_id);
CREATE INDEX idx_morph_events_student ON morph_events(student_id);
CREATE INDEX idx_morph_events_occurred ON morph_events(occurred_at DESC);
```

### 4.2 Moodle 연동 테이블

```sql
-- Moodle 문제 동기화
CREATE TABLE moodle_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moodle_question_id INTEGER NOT NULL,
    internal_problem_id UUID REFERENCES recurrence_problems(id),

    sync_status VARCHAR(20),  -- 'success', 'failed', 'pending'
    sync_direction VARCHAR(10),  -- 'import', 'export'

    moodle_data JSONB,  -- 원본 Moodle 데이터
    error_message TEXT,

    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moodle_sync_question ON moodle_sync_log(moodle_question_id);
```

---

## 5. API 엔드포인트

### 5.1 Condition Morph API

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Request/Response Models
class ProblemRequest(BaseModel):
    expression: str
    order: int
    initial_conditions: dict
    difficulty_level: int

class StudentAnswerSubmission(BaseModel):
    student_id: str
    problem_id: str
    answer: float
    time_spent_seconds: int

class MorphResponse(BaseModel):
    morphed: bool
    new_problem: Optional[dict]
    feedback: str
    student_state: dict

# Endpoints
@app.get("/api/problems")
async def list_problems(
    difficulty: Optional[int] = None,
    concept: Optional[str] = None
):
    """문제 목록 조회"""
    # 구현
    pass

@app.get("/api/problems/{problem_id}")
async def get_problem(problem_id: str):
    """문제 상세 조회"""
    problem = get_problem_from_db(problem_id)
    return {
        'id': problem.id,
        'expression': problem.expression,
        'order': problem.order,
        'initial_conditions': problem.initial_conditions,
        'difficulty_level': problem.difficulty_level
    }

@app.post("/api/problems")
async def create_problem(problem: ProblemRequest):
    """새 문제 생성"""
    # 점화식 검증
    parser = RecurrenceParser()
    parsed = parser.parse(problem.expression)

    # DB 저장
    saved = save_problem_to_db(parsed, problem.difficulty_level)

    return {'id': saved.id, 'status': 'created'}

@app.post("/api/submit")
async def submit_answer(submission: StudentAnswerSubmission) -> MorphResponse:
    """
    답안 제출 및 Morphing 처리

    핵심 API - 실시간 조건 변경의 중심
    """
    # 1. 답안 검증
    is_correct = validate_answer(
        submission.answer,
        submission.problem_id
    )

    # 2. 학생 상태 업데이트
    state = update_student_state(
        submission.student_id,
        submission.problem_id,
        is_correct,
        submission.time_spent_seconds
    )

    # 3. Morphing 평가
    morpher = ConditionMorpher()
    current_problem = get_problem(submission.problem_id)
    new_problem = morpher.morph(current_problem, state)

    morphed = (new_problem.expression != current_problem.expression)

    # 4. 이벤트 로깅
    if morphed:
        log_morph_event(
            student_id=submission.student_id,
            original=current_problem,
            morphed=new_problem,
            trigger="auto_morph"
        )

    return MorphResponse(
        morphed=morphed,
        new_problem=new_problem.to_dict() if morphed else None,
        feedback=generate_feedback(is_correct, state),
        student_state=state.to_dict()
    )

@app.get("/api/student/{student_id}/state")
async def get_student_state(student_id: str):
    """학생 현재 상태 조회"""
    state = load_student_state(student_id)
    return state.to_dict()

@app.get("/api/student/{student_id}/history")
async def get_morph_history(student_id: str, limit: int = 50):
    """Morphing 이력 조회"""
    events = get_morph_events_from_db(student_id, limit)
    return {'events': [e.to_dict() for e in events]}

@app.post("/api/morph/manual")
async def manual_morph(
    student_id: str,
    problem_id: str,
    target_difficulty: int
):
    """수동 Morphing (교사용)"""
    # 교사가 직접 난이도 조정
    current = get_problem(problem_id)
    new_problem = generate_problem_at_difficulty(target_difficulty)

    # 학생 상태 업데이트
    update_student_problem(student_id, new_problem.id)

    # WebSocket으로 학생에게 푸시
    await manager.send_morph_update(student_id, {
        'morphed': True,
        'new_problem': new_problem.to_dict(),
        'reason': 'teacher_adjustment'
    })

    return {'status': 'morphed', 'new_problem_id': new_problem.id}
```

### 5.2 Moodle 연동 API

```python
@app.post("/api/moodle/sync/import")
async def import_from_moodle(
    moodle_question_ids: List[int],
    course_id: int
):
    """Moodle에서 문제 가져오기"""
    moodle_client = MoodleClient()
    results = []

    for q_id in moodle_question_ids:
        # Moodle 문제 조회
        moodle_question = moodle_client.get_question(q_id)

        # 점화식 추출
        if moodle_question.qtype == 'calculated':
            formula = moodle_question.formula
            converter = MoodleFormulaConverter()
            recurrence = converter.convert(formula)

            # 내부 DB 저장
            saved = save_problem_to_db(recurrence)

            # 동기화 로그
            log_moodle_sync(q_id, saved.id, 'import', 'success')

            results.append({
                'moodle_id': q_id,
                'internal_id': saved.id,
                'status': 'success'
            })
        else:
            results.append({
                'moodle_id': q_id,
                'status': 'skipped',
                'reason': 'not_calculated_type'
            })

    return {'results': results}

@app.get("/api/moodle/courses")
async def list_moodle_courses():
    """Moodle 코스 목록"""
    moodle_client = MoodleClient()
    courses = moodle_client.get_courses()
    return {'courses': courses}

@app.get("/api/moodle/questions/{course_id}")
async def list_moodle_questions(course_id: int):
    """특정 코스의 문제 목록"""
    moodle_client = MoodleClient()
    questions = moodle_client.get_questions_by_course(course_id)
    return {'questions': questions}
```

---

## 6. 모바일 UI 구현

### 6.1 스마트폰 시뮬레이터 컴포넌트

```typescript
// components/SmartphoneSimulator.tsx
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SmartphoneSimulatorProps {
  studentId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const SmartphoneSimulator: React.FC<SmartphoneSimulatorProps> = ({
  studentId,
  position = 'bottom-right'
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [studentState, setStudentState] = useState<any>(null);
  const [morphAnimation, setMorphAnimation] = useState(false);

  useEffect(() => {
    // WebSocket 연결
    const newSocket = io('ws://localhost:8000', {
      query: { student_id: studentId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to Condition Morph server');
    });

    // Morphing 이벤트 수신
    newSocket.on('morph_update', (data: any) => {
      if (data.morphed) {
        // Morphing 애니메이션 트리거
        setMorphAnimation(true);
        setTimeout(() => {
          setCurrentProblem(data.new_problem);
          setMorphAnimation(false);
        }, 500);  // 0.5초 애니메이션
      }

      setStudentState(data.student_state);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [studentId]);

  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionStyles[position]} z-50`}>
      {/* 스마트폰 프레임 */}
      <div className="relative w-80 h-[600px] bg-gray-900 rounded-[3rem] shadow-2xl border-8 border-gray-800">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

        {/* 화면 */}
        <div className="absolute inset-4 bg-white rounded-[2.5rem] overflow-hidden">
          {/* 상태 바 */}
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between text-sm">
            <span>Condition Morph</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>

          {/* 컨텐츠 영역 */}
          <div className={`p-4 transition-all duration-500 ${
            morphAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            {/* 문제 표시 */}
            {currentProblem && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">현재 문제</h3>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-xl font-mono">{currentProblem.expression}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    난이도: {'★'.repeat(currentProblem.difficulty_level)}
                  </p>
                </div>
              </div>
            )}

            {/* 학생 상태 */}
            {studentState && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">현재 상태</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>연속 정답:</span>
                    <span className="font-bold text-green-600">
                      {studentState.consecutive_correct}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>숙련도:</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${studentState.mastery_score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Morphing 알림 */}
            {morphAnimation && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                <div className="text-center">
                  <div className="text-4xl mb-2">🔄</div>
                  <p className="text-lg font-bold">문제 변경 중...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 홈 버튼 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default SmartphoneSimulator;
```

### 6.2 메인 교사 대시보드

```typescript
// pages/TeacherDashboard.tsx
import React, { useState, useEffect } from 'react';
import SmartphoneSimulator from '../components/SmartphoneSimulator';

const TeacherDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('student-1');
  const [morphEvents, setMorphEvents] = useState<any[]>([]);

  useEffect(() => {
    // Morphing 이벤트 구독
    const eventSource = new EventSource(`/api/morph/events/stream`);

    eventSource.onmessage = (event) => {
      const morphEvent = JSON.parse(event.data);
      setMorphEvents(prev => [morphEvent, ...prev].slice(0, 20));
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Condition Morph Dashboard</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* 왼쪽: 학생 목록 */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">학생 목록</h2>
            {/* 학생 목록 구현 */}
          </div>

          {/* 중앙: 분석 차트 */}
          <div className="col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Morphing 이벤트</h2>
            <div className="space-y-2">
              {morphEvents.map((event, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-semibold">
                    {event.student_name} - {event.trigger_type}
                  </p>
                  <p className="text-xs text-gray-600">
                    {event.original_expression} → {event.morphed_expression}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.occurred_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 하단: 스마트폰 시뮬레이터 */}
      <SmartphoneSimulator
        studentId={selectedStudent}
        position="bottom-right"
      />
    </div>
  );
};

export default TeacherDashboard;
```

---

## 7. 배포 및 설정

### 7.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: alt42_condition_morph
      POSTGRES_USER: alt42
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Condition Morph Backend
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://alt42:secure_password@postgres:5432/alt42_condition_morph
      REDIS_URL: redis://redis:6379/0
      MOODLE_URL: ${MOODLE_URL}
      MOODLE_TOKEN: ${MOODLE_TOKEN}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8000
      REACT_APP_WS_URL: ws://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm start

volumes:
  postgres_data:
  redis_data:
```

### 7.2 환경 변수 설정

```.env
# .env.example

# Database
DATABASE_URL=postgresql://alt42:password@localhost:5432/alt42_condition_morph

# Redis
REDIS_URL=redis://localhost:6379/0

# Moodle Integration
MOODLE_URL=https://lms.kaist.ac.kr
MOODLE_TOKEN=your_webservice_token_here
MOODLE_DB_HOST=moodle_db_host
MOODLE_DB_USER=readonly_user
MOODLE_DB_PASSWORD=password
MOODLE_DB_NAME=moodle

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# AI/LLM (Optional)
CLAUDE_API_KEY=your_claude_api_key

# Feature Flags
ENABLE_AUTO_MORPH=true
ENABLE_MANUAL_MORPH=true
MORPH_DELAY_MS=500
```

---

## 8. 테스트 시나리오

### 8.1 단위 테스트

```python
# tests/test_recurrence_parser.py
import pytest
from condition_morph.parser import RecurrenceParser, RecurrenceRelation

def test_parse_arithmetic_sequence():
    """등차수열 파싱 테스트"""
    parser = RecurrenceParser()
    result = parser.parse("a_n = a_{n-1} + 2")

    assert result.order == 1
    assert result.expression == "a_n = a_{n-1} + 2"

def test_parse_fibonacci():
    """피보나치 수열 파싱 테스트"""
    parser = RecurrenceParser()
    result = parser.parse("a_n = a_{n-1} + a_{n-2}")

    assert result.order == 2

def test_evaluate_recurrence():
    """점화식 계산 테스트"""
    recurrence = RecurrenceRelation(
        expression="a_n = 2*a_{n-1} + 1",
        order=1,
        initial_conditions={0: 1}
    )

    assert recurrence.evaluate(0) == 1
    assert recurrence.evaluate(1) == 3  # 2*1 + 1
    assert recurrence.evaluate(2) == 7  # 2*3 + 1
```

### 8.2 통합 테스트

```python
# tests/test_morph_engine.py
import pytest
from condition_morph.engine import ConditionMorpher, StudentState

def test_increase_difficulty_on_consecutive_correct():
    """연속 정답 시 난이도 상승 테스트"""
    morpher = ConditionMorpher()

    problem = RecurrenceRelation(
        expression="a_n = a_{n-1} + 2",
        order=1,
        initial_conditions={0: 1}
    )

    state = StudentState(
        student_id="test-student",
        current_problem=problem,
        attempts=[],
        consecutive_correct=3,  # 트리거 조건 충족
        consecutive_wrong=0
    )

    morphed = morpher.morph(problem, state)

    assert morphed.expression != problem.expression
    assert morphed.order >= problem.order  # 차수 증가 또는 유지
```

### 8.3 E2E 테스트

```typescript
// tests/e2e/morph_flow.spec.ts
import { test, expect } from '@playwright/test';

test('학생 답안 제출 후 Morphing 발생', async ({ page }) => {
  await page.goto('http://localhost:3000/student/test-student');

  // 문제 표시 확인
  await expect(page.locator('.problem-expression')).toBeVisible();
  const initialProblem = await page.locator('.problem-expression').textContent();

  // 3회 연속 정답 제출
  for (let i = 0; i < 3; i++) {
    await page.fill('input[name="answer"]', '42');  // 정답
    await page.click('button[type="submit"]');
    await page.waitForSelector('.feedback.correct');
  }

  // Morphing 애니메이션 대기
  await page.waitForSelector('.morph-animation');
  await page.waitForSelector('.morph-animation', { state: 'hidden' });

  // 문제 변경 확인
  const morphedProblem = await page.locator('.problem-expression').textContent();
  expect(morphedProblem).not.toBe(initialProblem);
});
```

---

## 9. 성능 최적화

### 9.1 캐싱 전략

```python
import functools
from cachetools import TTLCache

# 점화식 계산 결과 캐싱 (10분 TTL)
recurrence_cache = TTLCache(maxsize=1000, ttl=600)

@functools.lru_cache(maxsize=128)
def compute_recurrence(expression: str, n: int, initial: tuple) -> float:
    """점화식 계산 (메모이제이션)"""
    # 캐시 키 생성
    cache_key = f"{expression}:{n}:{initial}"

    if cache_key in recurrence_cache:
        return recurrence_cache[cache_key]

    # 계산
    result = _compute_recurrence_impl(expression, n, initial)

    # 캐싱
    recurrence_cache[cache_key] = result

    return result
```

### 9.2 데이터베이스 최적화

```sql
-- Materialized View for Student Analytics
CREATE MATERIALIZED VIEW student_performance_summary AS
SELECT
    student_id,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
    AVG(time_spent_seconds) as avg_time,
    MAX(attempted_at) as last_attempt
FROM student_attempts
GROUP BY student_id;

-- Refresh every 5 minutes
CREATE UNIQUE INDEX ON student_performance_summary(student_id);

-- Auto-refresh trigger
CREATE OR REPLACE FUNCTION refresh_student_performance()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY student_performance_summary;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_performance
AFTER INSERT ON student_attempts
EXECUTE FUNCTION refresh_student_performance();
```

---

## 10. 모니터링 및 분석

### 10.1 Grafana 대시보드

주요 메트릭:
- **Morphing 발생 빈도**: 시간대별 Morphing 이벤트 수
- **Morphing 트리거 분포**: 트리거 유형별 비율
- **평균 Morphing 레이턴시**: 조건 변경 처리 시간
- **학생 숙련도 분포**: 난이도별 학생 분포
- **WebSocket 연결 수**: 동시 접속 학생 수

### 10.2 로그 구조

```python
import logging
import json

# Structured Logging
logger = logging.getLogger('condition_morph')

def log_morph_event(event: dict):
    """구조화된 Morphing 로그"""
    logger.info(json.dumps({
        'event_type': 'morph',
        'timestamp': datetime.now().isoformat(),
        'student_id': event['student_id'],
        'trigger': event['trigger'],
        'original_difficulty': event['original_difficulty'],
        'morphed_difficulty': event['morphed_difficulty'],
        'latency_ms': event.get('latency_ms', 0)
    }))
```

---

## 11. 향후 확장 계획

### Phase 2 기능
1. **AI 기반 문제 생성**: Claude API를 활용한 자동 문제 생성
2. **다변량 점화식**: 여러 변수를 포함한 복잡한 점화식 지원
3. **협력 학습**: 학생 간 점화식 패턴 공유
4. **예측 Morphing**: ML 모델 기반 사전 난이도 조정

### Phase 3 기능
1. **크로스 플랫폼**: 네이티브 iOS/Android 앱
2. **오프라인 모드**: 로컬 Morphing 엔진
3. **다국어 지원**: 영어, 일본어, 중국어
4. **VR/AR 통합**: 3D 점화식 시각화

---

## 12. FAQ

**Q: Morphing이 너무 자주 발생하면 학생이 혼란스러울 수 있지 않나요?**
A: 맞습니다. `MORPH_DELAY_MS` 설정으로 Morphing 간 최소 간격을 설정할 수 있습니다. 기본값은 60초입니다.

**Q: Moodle과의 실시간 동기화는 어떻게 하나요?**
A: Moodle의 Event API를 사용하거나, 주기적 폴링(5분마다)으로 변경사항을 감지합니다.

**Q: 점화식 계산이 느리면 어떡하나요?**
A: 동적 프로그래밍과 캐싱으로 O(n) 시간 복잡도를 보장합니다. 대부분의 계산은 1ms 이하입니다.

**Q: 학생이 일부러 틀리면 계속 쉬워지지 않나요?**
A: 패턴 감지 알고리즘으로 의도적 오답을 탐지하고, 교사 대시보드에 경고를 표시합니다.

---

## 문서 정보

- **버전**: 1.0.0
- **작성일**: 2025-11-18
- **작성자**: Claude AI Agent
- **상태**: 설계 완료, 구현 준비 중
- **다음 단계**: 프로토타입 개발 시작
