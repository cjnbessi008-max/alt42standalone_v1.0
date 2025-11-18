# API 문서

## 개요

Jump Thinking Detection System의 REST API 문서입니다.

**Base URL:** `https://your-domain.com/api`

**인증:** Session-based (LTI 론치 후 자동 세션 생성)

---

## 엔드포인트

### 1. Save Attempt

학생의 문제 풀이 시도를 저장합니다.

**Endpoint:** `POST /api/save_attempt.php`

**인증:** Required (Session)

**Request Body:**
```json
{
  "session_id": 1,
  "problem_id": 3,
  "answer": "7/12",
  "is_correct": true,
  "time_spent": 180,
  "hints_used": 0,
  "skipped": false
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| session_id | integer | ✓ | 세션 ID |
| problem_id | integer | ✓ | 문제 ID |
| answer | string | - | 학생 답안 (건너뛴 경우 null) |
| is_correct | boolean | ✓ | 정답 여부 |
| time_spent | integer | ✓ | 소요 시간 (초) |
| hints_used | integer | - | 사용한 힌트 수 (기본: 0) |
| skipped | boolean | - | 건너뛰기 여부 (기본: false) |

**Response:**
```json
{
  "success": true,
  "attempt_number": 1
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (잘못된 입력)
- `401` - Unauthorized (인증 필요)
- `403` - Forbidden (세션 불일치)
- `500` - Internal Server Error

---

### 2. Get Session Progress

세션의 진행 상황을 조회합니다.

**Endpoint:** `GET /api/session_progress.php?session_id={id}`

**인증:** Required

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| session_id | integer | ✓ | 세션 ID |

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 1,
    "status": "in_progress",
    "total_problems": 6,
    "completed_problems": 3,
    "progress_percentage": 50
  },
  "attempts": [
    {
      "problem_id": 1,
      "is_correct": true,
      "time_spent": 120
    }
  ]
}
```

---

### 3. Get Jump Thinking Analysis

세션의 비약 사고 분석 결과를 조회합니다.

**Endpoint:** `GET /api/analysis.php?session_id={id}`

**인증:** Required

**Response:**
```json
{
  "success": true,
  "analysis": {
    "session_id": 1,
    "jump_score": 85.0,
    "tendency": "jumper",
    "total_events": 5,
    "events_by_type": {
      "step_skips": 2,
      "fast_solves": 2,
      "sequence_violations": 0,
      "direct_answers": 1
    },
    "recommendations": [
      "중간 단계를 건너뛰는 경향이 있습니다.",
      "체계적인 접근 방법을 연습하세요."
    ]
  },
  "events": [
    {
      "type": "step_skip",
      "severity": "high",
      "description": "단계 2를 건너뛰고 단계 3으로 진행"
    }
  ]
}
```

---

### 4. Get Student Statistics (Teacher Only)

학생의 전체 통계를 조회합니다.

**Endpoint:** `GET /api/student_stats.php?student_id={id}`

**인증:** Required (Teacher role)

**Response:**
```json
{
  "success": true,
  "student": {
    "id": 2,
    "name": "박학생",
    "total_sessions": 5,
    "avg_jump_score": 45.5,
    "tendency": "mixed",
    "strengths": ["빠른 계산", "패턴 인식"],
    "improvements": ["단계별 검증", "꼼꼼한 풀이"]
  },
  "session_history": [
    {
      "session_id": 1,
      "date": "2024-01-15",
      "jump_score": 85.0,
      "problems_solved": 6
    }
  ]
}
```

---

### 5. Get Problem Set

문제 세트 정보를 조회합니다.

**Endpoint:** `GET /api/problem_set.php?set_id={id}`

**인증:** Required

**Response:**
```json
{
  "success": true,
  "problem_set": {
    "id": 1,
    "title": "분수의 덧셈과 뺄셈",
    "description": "분수의 기본 연산을 단계별로 학습합니다",
    "difficulty": "medium",
    "total_problems": 6
  },
  "problems": [
    {
      "id": 1,
      "title": "같은 분모 분수 덧셈",
      "step_level": 1,
      "is_required": true,
      "max_time_seconds": 120
    }
  ]
}
```

---

## 에러 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 400 | Bad Request | 잘못된 요청 파라미터 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 500 | Internal Server Error | 서버 오류 |

---

## 인증

### Session-based 인증

LTI 론치를 통해 생성된 세션을 사용합니다.

**세션에 저장되는 정보:**
```php
$_SESSION['user_id']          // 사용자 ID
$_SESSION['user_role']        // 'teacher' 또는 'student'
$_SESSION['lti_user_id']      // LTI 사용자 ID
$_SESSION['consumer_id']      // LTI Consumer ID
$_SESSION['session_token']    // 세션 토큰
```

**인증 확인:**
```php
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
```

---

## Rate Limiting

현재 버전에는 Rate Limiting이 구현되지 않았습니다.

**향후 계획:**
- 학생: 초당 10 요청
- 교사: 초당 30 요청

---

## CORS

기본적으로 동일 출처 정책이 적용됩니다.

**필요시 CORS 활성화:**
```php
// public/api/save_attempt.php
header('Access-Control-Allow-Origin: https://moodle.your-domain.com');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

---

## 예제 코드

### JavaScript (Fetch API)

```javascript
// Save attempt
async function saveAttempt(sessionId, problemId, answer, isCorrect, timeSpent) {
    const response = await fetch('/api/save_attempt.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            problem_id: problemId,
            answer: answer,
            is_correct: isCorrect,
            time_spent: timeSpent,
            hints_used: 0
        })
    });

    const data = await response.json();
    return data;
}

// Usage
saveAttempt(1, 3, '7/12', true, 180)
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
```

### jQuery

```javascript
$.ajax({
    url: '/api/save_attempt.php',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        session_id: 1,
        problem_id: 3,
        answer: '7/12',
        is_correct: true,
        time_spent: 180
    }),
    success: function(data) {
        console.log('Success:', data);
    },
    error: function(xhr, status, error) {
        console.error('Error:', error);
    }
});
```

### PHP (cURL)

```php
$data = [
    'session_id' => 1,
    'problem_id' => 3,
    'answer' => '7/12',
    'is_correct' => true,
    'time_spent' => 180
];

$ch = curl_init('https://your-domain.com/api/save_attempt.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
```

---

## 웹훅 (계획 중)

향후 버전에서 이벤트 웹훅을 지원할 예정입니다:

- `session.completed` - 세션 완료 시
- `jump_thinking.detected` - 비약 사고 감지 시
- `grade.updated` - 성적 업데이트 시

---

## 버전 관리

**현재 버전:** v1.0.0

**변경 사항:**
- v1.0.0 (2024-01-15): 초기 릴리스
