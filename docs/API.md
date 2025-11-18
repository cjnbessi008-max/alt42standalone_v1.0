# Alt42 Standalone API Documentation

## Base URL
```
http://localhost:3001/api
```

## Timeline API

### 1. Create Timeline (타임라인 시작)

새로운 방정식 풀이 타임라인을 생성합니다.

**Endpoint:** `POST /timelines`

**Request Body:**
```json
{
  "student_id": "student-001",
  "student_name": "홍길동",
  "equation": "2x + 4 = 10",
  "module_id": "module-001",
  "problem_id": "prob-001",
  "difficulty_level": "easy"
}
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "id": "uuid-here",
    "student_id": "student-001",
    "student_name": "홍길동",
    "equation": "2x + 4 = 10",
    "initial_equation": "2x + 4 = 10",
    "started_at": "2025-01-18T10:00:00.000Z",
    "total_steps": 0,
    "is_correct": 0
  }
}
```

### 2. Get Timeline by ID

타임라인 상세 정보를 조회합니다 (단계 포함).

**Endpoint:** `GET /timelines/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "student_id": "student-001",
    "equation": "2x + 4 = 10",
    "total_steps": 3,
    "steps": [
      {
        "id": "step-uuid-1",
        "step_number": 1,
        "action_type": "subtract_both_sides",
        "from_expression": "2x + 4 = 10",
        "to_expression": "2x = 6",
        "rule_applied": "subtract_both_sides",
        "explanation": "양변에서 4를 뺍니다",
        "duration_ms": 45000
      }
    ]
  }
}
```

### 3. Add Step (단계 추가)

타임라인에 새로운 풀이 단계를 추가합니다.

**Endpoint:** `POST /timelines/:id/steps`

**Request Body:**
```json
{
  "action_type": "subtract_both_sides",
  "from_expression": "2x + 4 = 10",
  "to_expression": "2x = 6",
  "rule_applied": "subtract_both_sides",
  "rule_category": "algebraic",
  "explanation": "양변에서 4를 뺍니다",
  "is_correct": true,
  "hint_used": false,
  "duration_ms": 45000,
  "user_input": "2x = 6"
}
```

**Response:**
```json
{
  "success": true,
  "step": {
    "id": "step-uuid",
    "timeline_id": "timeline-uuid",
    "step_number": 1,
    "action_type": "subtract_both_sides",
    "from_expression": "2x + 4 = 10",
    "to_expression": "2x = 6"
  }
}
```

### 4. Complete Timeline

타임라인을 완료 처리합니다.

**Endpoint:** `POST /timelines/:id/complete`

**Request Body:**
```json
{
  "final_answer": "x = 3",
  "is_correct": true
}
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "id": "uuid-here",
    "final_answer": "x = 3",
    "is_correct": true,
    "completed_at": "2025-01-18T10:05:00.000Z",
    "time_spent_seconds": 300
  }
}
```

### 5. Get Student Timelines

학생별 타임라인 목록을 조회합니다.

**Endpoint:** `GET /timelines/student/:studentId`

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "equation": "2x + 4 = 10",
      "is_correct": true,
      "total_steps": 3,
      "started_at": "2025-01-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 6. Get Student Statistics

학생의 통계 정보를 조회합니다.

**Endpoint:** `GET /timelines/student/:studentId/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_attempts": 10,
    "correct_count": 8,
    "avg_steps": 4.5,
    "avg_time": 285.5,
    "success_rate": 80.00
  }
}
```

---

## Moodle Integration API

### 1. Receive Problem from Moodle

Moodle에서 문제 정보를 수신하고 세션을 시작합니다.

**Endpoint:** `POST /moodle/problem`

**Request Body:**
```json
{
  "moodle_user_id": "123",
  "moodle_course_id": "456",
  "moodle_activity_id": "789",
  "problem_data": {
    "equation": "3x - 2 = 10",
    "difficulty": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "session-uuid",
  "session_token": "token-uuid",
  "problem_data": {
    "equation": "3x - 2 = 10",
    "difficulty": "medium"
  }
}
```

### 2. Submit Result to Moodle

풀이 결과를 Moodle로 전송합니다.

**Endpoint:** `POST /moodle/submit`

**Request Body:**
```json
{
  "session_token": "token-uuid",
  "timeline_id": "timeline-uuid",
  "final_answer": "x = 4",
  "is_correct": true,
  "time_spent": 300,
  "steps_count": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Result submitted successfully",
  "session_id": "session-uuid"
}
```

### 3. Get Session Info

세션 정보를 조회합니다.

**Endpoint:** `GET /moodle/session/:token`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "moodle_user_id": "123",
    "moodle_course_id": "456",
    "timeline_id": "timeline-uuid",
    "is_active": true
  }
}
```

---

## Error Responses

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": {
    "message": "Error message here",
    "status": 400
  }
}
```

**Common Error Codes:**
- `400`: Bad Request (잘못된 요청)
- `401`: Unauthorized (인증 실패)
- `404`: Not Found (리소스를 찾을 수 없음)
- `500`: Internal Server Error (서버 오류)

---

## Action Types (규칙 종류)

다음은 단계 추가 시 사용 가능한 `action_type` 목록입니다:

| Action Type | 설명 | Category |
|------------|------|----------|
| `add_both_sides` | 양변에 같은 수를 더하기 | algebraic |
| `subtract_both_sides` | 양변에서 같은 수를 빼기 | algebraic |
| `multiply_both_sides` | 양변에 같은 수를 곱하기 | algebraic |
| `divide_both_sides` | 양변을 같은 수로 나누기 | algebraic |
| `combine_like_terms` | 동류항 정리 | algebraic |
| `distribute` | 분배법칙 적용 | algebraic |
| `factor` | 인수분해 | algebraic |
| `simplify_fraction` | 분수 약분 | arithmetic |
| `cross_multiply` | 교차 곱셈 | algebraic |
| `isolate_variable` | 변수 고립시키기 | algebraic |

---

## Usage Example (사용 예제)

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// 타임라인 시작
async function startSolving() {
  const response = await axios.post(`${API_URL}/timelines`, {
    student_id: 'student-001',
    student_name: '홍길동',
    equation: '2x + 4 = 10',
    difficulty_level: 'easy'
  });

  const timelineId = response.data.timeline.id;

  // 단계 추가
  await axios.post(`${API_URL}/timelines/${timelineId}/steps`, {
    action_type: 'subtract_both_sides',
    from_expression: '2x + 4 = 10',
    to_expression: '2x = 6',
    rule_applied: 'subtract_both_sides',
    explanation: '양변에서 4를 뺍니다'
  });

  // 완료
  await axios.post(`${API_URL}/timelines/${timelineId}/complete`, {
    final_answer: 'x = 3',
    is_correct: true
  });
}
```
