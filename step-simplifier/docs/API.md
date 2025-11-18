# Step Simplifier API 문서

## 개요

Step Simplifier는 RESTful API를 제공하여 문제 관리, 진행 상황 추적, Moodle 연동 등의 기능을 제공합니다.

**Base URL**: `/step-simplifier/backend/api`

**응답 형식**: JSON

**인증**: 현재 버전에서는 인증이 구현되어 있지 않습니다 (향후 JWT 추가 예정)

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { /* 응답 데이터 */ }
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

## API 엔드포인트

### 1. 헬스 체크

시스템 상태 확인

**Endpoint**: `GET /health`

**응답**:
```json
{
  "success": true,
  "message": "Step Simplifier API is running",
  "version": "1.0.0",
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

---

## 문제 (Problems) API

### 1.1 문제 목록 가져오기

**Endpoint**: `GET /problems`

**Query Parameters**:
- `limit` (선택, 기본값: 50): 가져올 문제 수
- `offset` (선택, 기본값: 0): 시작 위치

**요청 예제**:
```bash
GET /api/problems?limit=10&offset=0
```

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moodle_question_id": 1001,
      "equation_text": "3x + 12 = 27",
      "difficulty_level": "easy",
      "created_at": "2025-11-18 10:00:00",
      "updated_at": "2025-11-18 10:00:00"
    },
    ...
  ]
}
```

### 1.2 특정 문제 가져오기

**Endpoint**: `GET /problems/{id}`

**Path Parameters**:
- `id` (필수): 문제 ID

**요청 예제**:
```bash
GET /api/problems/1
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_question_id": 1001,
    "equation_text": "3x + 12 = 27",
    "difficulty_level": "easy",
    "created_at": "2025-11-18 10:00:00",
    "updated_at": "2025-11-18 10:00:00"
  }
}
```

### 1.3 Moodle 문제 ID로 가져오기

**Endpoint**: `GET /problems/moodle/{moodle_id}`

**Path Parameters**:
- `moodle_id` (필수): Moodle 문제 ID

**요청 예제**:
```bash
GET /api/problems/moodle/1001
```

### 1.4 문제 단계 가져오기

**Endpoint**: `GET /problems/{id}/steps`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "problem_id": 1,
      "step_number": 1,
      "step_description": "Subtract 12 from both sides",
      "step_equation": "3x + 12 - 12 = 27 - 12",
      "step_type": "isolate",
      "hint_text": "To isolate x, first remove the constant term",
      "created_at": "2025-11-18 10:00:00"
    },
    ...
  ]
}
```

### 1.5 특정 단계 가져오기

**Endpoint**: `GET /problems/{id}/steps/{step_number}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "problem_id": 1,
    "step_number": 1,
    "step_description": "Subtract 12 from both sides",
    "step_equation": "3x + 12 - 12 = 27 - 12",
    "step_type": "isolate",
    "hint_text": "To isolate x, first remove the constant term",
    "created_at": "2025-11-18 10:00:00"
  }
}
```

### 1.6 새 문제 생성

**Endpoint**: `POST /problems`

**Request Body**:
```json
{
  "moodle_question_id": 1002,
  "equation_text": "2x - 5 = 11",
  "difficulty": "medium"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "problem": {
      "id": 2,
      "moodle_question_id": 1002,
      "equation_text": "2x - 5 = 11",
      "difficulty_level": "medium",
      "created_at": "2025-11-18 10:05:00"
    },
    "steps": [
      { /* 자동 생성된 단계들 */ }
    ]
  }
}
```

### 1.7 문제 삭제

**Endpoint**: `DELETE /problems/{id}`

**응답**:
```json
{
  "success": true,
  "message": "Problem deleted"
}
```

---

## 진행 상황 (Progress) API

### 2.1 문제 시작

**Endpoint**: `POST /progress/start`

**Request Body**:
```json
{
  "user_id": 1,
  "problem_id": 1
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "current_step": 1,
    "total_steps": 5
  }
}
```

### 2.2 답안 제출

**Endpoint**: `POST /progress/submit`

**Request Body**:
```json
{
  "user_id": 1,
  "problem_id": 1,
  "step_number": 2,
  "user_answer": "3x = 15",
  "time_spent": 30
}
```

**응답 (정답)**:
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "completed": false,
    "message": "Correct! Move to next step."
  }
}
```

**응답 (오답)**:
```json
{
  "success": true,
  "data": {
    "is_correct": false,
    "completed": false,
    "message": "Not quite right. Try again!"
  }
}
```

**응답 (완료)**:
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "completed": true,
    "score": 85.5,
    "message": "Congratulations! Problem completed!"
  }
}
```

### 2.3 진행 상황 가져오기

**Endpoint**: `GET /progress/{user_id}/{problem_id}`

**응답**:
```json
{
  "success": true,
  "data": {
    "progress": {
      "id": 1,
      "user_id": 1,
      "problem_id": 1,
      "current_step": 3,
      "total_steps": 5,
      "completed": false,
      "score": 0.00,
      "started_at": "2025-11-18 10:00:00",
      "updated_at": "2025-11-18 10:05:00"
    },
    "current_step": {
      "id": 3,
      "step_number": 3,
      "step_description": "Divide both sides by 3",
      "step_equation": "3x ÷ 3 = 15 ÷ 3",
      "step_type": "solve",
      "hint_text": "Isolate the variable by dividing"
    },
    "attempts": [
      {
        "id": 1,
        "step_number": 1,
        "user_answer": "3x + 12 - 12 = 27 - 12",
        "is_correct": true,
        "time_spent": 25,
        "created_at": "2025-11-18 10:01:00"
      },
      ...
    ]
  }
}
```

### 2.4 사용자 생성/가져오기

**Endpoint**: `POST /progress/user`

**Request Body**:
```json
{
  "moodle_user_id": 123,
  "username": "student123",
  "email": "student123@example.com"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_user_id": 123,
    "username": "student123",
    "email": "student123@example.com",
    "created_at": "2025-11-18 10:00:00"
  }
}
```

---

## Moodle 연동 API

### 3.1 Moodle 문제 동기화

**Endpoint**: `POST /moodle/sync`

**Request Body**:
```json
{
  "question_id": 1001
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "problem": {
      "id": 1,
      "moodle_question_id": 1001,
      "equation_text": "3x + 12 = 27",
      "difficulty_level": "easy"
    },
    "moodle_data": {
      /* Moodle에서 가져온 원본 데이터 */
    }
  }
}
```

### 3.2 Moodle 성적 업데이트

**Endpoint**: `POST /moodle/grade`

**Request Body**:
```json
{
  "user_id": 123,
  "item_id": 1001,
  "grade": 85.5
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    /* Moodle API 응답 */
  }
}
```

### 3.3 Moodle 사용자 가져오기

**Endpoint**: `GET /moodle/user/{user_id}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "student123",
    "firstname": "John",
    "lastname": "Doe",
    "email": "student123@example.com"
  }
}
```

---

## 오류 코드

| HTTP 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 404 | 찾을 수 없음 |
| 405 | 허용되지 않는 메서드 |
| 500 | 서버 오류 |

## 사용 예제

### JavaScript (Fetch API)

```javascript
// 문제 가져오기
async function getProblem(problemId) {
  const response = await fetch(`/api/problems/${problemId}`);
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// 답안 제출
async function submitAnswer(userId, problemId, stepNumber, answer) {
  const response = await fetch('/api/progress/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      problem_id: problemId,
      step_number: stepNumber,
      user_answer: answer,
      time_spent: 30
    })
  });

  const result = await response.json();
  return result.data;
}
```

### cURL

```bash
# 문제 목록
curl -X GET "http://localhost/api/problems"

# 특정 문제
curl -X GET "http://localhost/api/problems/1"

# 새 문제 생성
curl -X POST "http://localhost/api/problems" \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_question_id": 1002,
    "equation_text": "2x - 5 = 11",
    "difficulty": "medium"
  }'

# 답안 제출
curl -X POST "http://localhost/api/progress/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "problem_id": 1,
    "step_number": 2,
    "user_answer": "3x = 15",
    "time_spent": 30
  }'
```

### PHP

```php
<?php
// API 클라이언트 예제
function callAPI($endpoint, $method = 'GET', $data = null) {
    $url = 'http://localhost/api/' . $endpoint;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// 사용 예제
$problem = callAPI('problems/1');
$result = callAPI('progress/submit', 'POST', [
    'user_id' => 1,
    'problem_id' => 1,
    'step_number' => 2,
    'user_answer' => '3x = 15',
    'time_spent' => 30
]);
?>
```

## 레이트 리미팅

현재 버전에서는 레이트 리미팅이 구현되어 있지 않습니다. 프로덕션 환경에서는 웹 서버 레벨에서 레이트 리미팅을 설정하는 것을 권장합니다.

## 버전 관리

API 버전: 1.0.0

향후 버전에서는 URL 경로에 버전을 포함할 예정입니다:
```
/api/v1/problems
/api/v2/problems
```

## 지원

문제가 발생하면 이슈를 등록해주세요.
