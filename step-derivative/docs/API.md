# Step Derivative API 문서

## 개요

Step Derivative의 RESTful API 문서입니다. 모든 엔드포인트는 JSON 형식으로 데이터를 주고받습니다.

## 기본 URL

```
http://your-domain.com/step-derivative/backend/api/problem_handler.php
```

## 인증

세션 토큰 기반 인증을 사용합니다.

```http
Authorization: Bearer {session_token}
```

## 응답 형식

### 성공 응답

```json
{
  "status": "success",
  "data": { ... }
}
```

### 오류 응답

```json
{
  "status": "error",
  "error": "오류 메시지"
}
```

## HTTP 상태 코드

- `200` - 성공
- `400` - 잘못된 요청
- `401` - 인증 실패
- `404` - 리소스를 찾을 수 없음
- `405` - 허용되지 않는 메서드
- `500` - 서버 오류

---

## 엔드포인트

### 1. 문제 생성

새로운 미분 문제를 생성하고 단계별 솔루션을 자동 생성합니다.

**Endpoint:** `POST /create_problem`

**Request Body:**

```json
{
  "expression": "3*x^2 + 2*x + 5",
  "moodle_course_id": 1,
  "moodle_quiz_id": 1,
  "moodle_question_id": 1,
  "difficulty_level": "basic"
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| expression | string | Yes | 미분할 수식 |
| moodle_course_id | integer | Yes | Moodle 코스 ID |
| moodle_quiz_id | integer | Yes | Moodle 퀴즈 ID |
| moodle_question_id | integer | Yes | Moodle 질문 ID |
| difficulty_level | string | No | 난이도: basic, intermediate, advanced (기본값: basic) |

**Response:**

```json
{
  "status": "success",
  "problem_id": 1,
  "steps_count": 5,
  "message": "Problem created successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost/api/problem_handler.php/create_problem \
  -H "Content-Type: application/json" \
  -d '{
    "expression": "x^3 + 2*x",
    "moodle_course_id": 1,
    "moodle_quiz_id": 1,
    "moodle_question_id": 1,
    "difficulty_level": "basic"
  }'
```

---

### 2. 문제 조회

특정 문제의 정보를 조회합니다.

**Endpoint:** `GET /get_problem`

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| problem_id | integer | Yes | 문제 ID |

**Response:**

```json
{
  "status": "success",
  "problem": {
    "id": 1,
    "moodle_course_id": 1,
    "moodle_quiz_id": 1,
    "moodle_question_id": 1,
    "expression": "3*x^2 + 2*x + 5",
    "difficulty_level": "basic",
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00"
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost/api/problem_handler.php/get_problem?problem_id=1"
```

---

### 3. 솔루션 조회

문제의 단계별 솔루션을 조회합니다.

**Endpoint:** `GET /get_solution`

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| problem_id | integer | Yes | 문제 ID |

**Response:**

```json
{
  "status": "success",
  "steps": [
    {
      "id": 1,
      "problem_id": 1,
      "step_number": 1,
      "step_type": "initial",
      "expression_before": "",
      "expression_after": "3*x^2 + 2*x + 5",
      "explanation": "원래 식: d/dx(3*x^2 + 2*x + 5)",
      "rule_applied": "initial",
      "created_at": "2024-01-15 10:30:01"
    },
    {
      "id": 2,
      "problem_id": 1,
      "step_number": 2,
      "step_type": "sum_rule",
      "expression_before": "3*x^2 + 2*x + 5",
      "expression_after": "각 항을 개별적으로 미분",
      "explanation": "합/차 규칙: 각 항을 따로 미분합니다.",
      "rule_applied": "sum_rule",
      "created_at": "2024-01-15 10:30:01"
    }
  ],
  "total_steps": 5
}
```

**Example:**

```bash
curl -X GET "http://localhost/api/problem_handler.php/get_solution?problem_id=1"
```

---

### 4. 학습 시작

새로운 학습 세션을 시작합니다.

**Endpoint:** `POST /start_attempt`

**Request Body:**

```json
{
  "moodle_user_id": 1,
  "problem_id": 1
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| moodle_user_id | integer | Yes | Moodle 사용자 ID |
| problem_id | integer | Yes | 문제 ID |

**Response:**

```json
{
  "status": "success",
  "attempt_id": 1,
  "attempt_number": 1,
  "session_token": "a1b2c3d4e5f6...32-char-token",
  "expires_at": "2024-01-15 14:30:00"
}
```

**Example:**

```bash
curl -X POST http://localhost/api/problem_handler.php/start_attempt \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_user_id": 1,
    "problem_id": 1
  }'
```

---

### 5. 진행 상황 업데이트

학습 진행 상황을 업데이트합니다.

**Endpoint:** `POST /update_attempt`

**Request Body:**

```json
{
  "attempt_id": 1,
  "current_step": 3,
  "time_spent": 120,
  "completed": false
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| attempt_id | integer | Yes | 학습 세션 ID |
| current_step | integer | Yes | 현재 단계 번호 |
| time_spent | integer | No | 소요 시간 (초) |
| completed | boolean | No | 완료 여부 (기본값: false) |

**Response:**

```json
{
  "status": "success",
  "message": "Attempt updated successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost/api/problem_handler.php/update_attempt \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": 1,
    "current_step": 3,
    "time_spent": 120,
    "completed": false
  }'
```

---

### 6. Moodle 동기화

Moodle에서 문제를 가져와 자동으로 생성합니다.

**Endpoint:** `POST /sync_from_moodle`

**Request Body:**

```json
{
  "question_id": 1,
  "course_id": 1,
  "quiz_id": 1,
  "difficulty_level": "basic"
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| question_id | integer | Yes | Moodle 질문 ID |
| course_id | integer | No | Moodle 코스 ID |
| quiz_id | integer | No | Moodle 퀴즈 ID |
| difficulty_level | string | No | 난이도 |

**Response:**

```json
{
  "status": "success",
  "problem_id": 2,
  "steps_count": 4,
  "message": "Problem created successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost/api/problem_handler.php/sync_from_moodle \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 1,
    "course_id": 1,
    "quiz_id": 1,
    "difficulty_level": "intermediate"
  }'
```

---

## 데이터 타입

### Problem Object

```json
{
  "id": 1,
  "moodle_course_id": 1,
  "moodle_quiz_id": 1,
  "moodle_question_id": 1,
  "expression": "x^2",
  "difficulty_level": "basic",
  "created_at": "2024-01-15 10:30:00",
  "updated_at": "2024-01-15 10:30:00"
}
```

### Solution Step Object

```json
{
  "id": 1,
  "problem_id": 1,
  "step_number": 1,
  "step_type": "power_rule",
  "expression_before": "x^2",
  "expression_after": "2*x",
  "explanation": "거듭제곱 규칙 적용: d/dx(x^2) = 2*x^1",
  "rule_applied": "power_rule",
  "created_at": "2024-01-15 10:30:01"
}
```

### Attempt Object

```json
{
  "id": 1,
  "moodle_user_id": 1,
  "problem_id": 1,
  "attempt_number": 1,
  "current_step": 3,
  "completed": false,
  "time_spent": 120,
  "started_at": "2024-01-15 12:00:00",
  "completed_at": null
}
```

---

## 지원하는 수식 형식

### 기본 연산자

- `+` - 덧셈
- `-` - 뺄셈
- `*` - 곱셈
- `/` - 나눗셈
- `^` - 거듭제곱

### 함수

- `sin(x)` - 사인
- `cos(x)` - 코사인
- `tan(x)` - 탄젠트
- `e^x` - 지수 함수
- `ln(x)` - 자연 로그

### 수식 예제

```
x^2
3*x^2 + 2*x + 5
sin(x)
cos(2*x)
e^x
ln(x)
x^2*sin(x)
(x^2 + 1)/(x - 1)
```

---

## 오류 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| MISSING_FIELD | Missing required field: {field} | 필수 필드 누락 |
| INVALID_JSON | Invalid JSON in request body | JSON 형식 오류 |
| DATABASE_ERROR | Database error occurred | 데이터베이스 오류 |
| NOT_FOUND | Problem not found | 리소스를 찾을 수 없음 |
| METHOD_NOT_ALLOWED | Method not allowed | HTTP 메서드 오류 |
| MOODLE_ERROR | Moodle error: {message} | Moodle API 오류 |

---

## 레이트 리미팅

현재 버전에서는 레이트 리미팅이 구현되어 있지 않습니다. 프로덕션 환경에서는 다음을 권장합니다:

- 사용자당: 100 요청/분
- IP당: 200 요청/분

---

## CORS 설정

기본적으로 모든 출처(`*`)를 허용합니다. 프로덕션에서는 `.env` 파일에서 설정:

```ini
CORS_ALLOWED_ORIGINS=https://your-moodle-site.com,https://your-domain.com
```

---

## 버전 관리

현재 버전: **v1.0.0**

API 버전은 URL에 포함되지 않습니다. 향후 버전에서는 다음 형식을 사용할 예정:

```
/api/v1/problem_handler.php
```

---

## 웹훅 (향후 지원 예정)

학습 완료 시 Moodle로 자동 알림을 보낼 수 있는 웹훅 기능이 향후 추가될 예정입니다.

---

## SDK 및 클라이언트 라이브러리

### JavaScript 클라이언트

프론트엔드에서 사용 가능한 API 클라이언트:

```javascript
// API 초기화
API.init({
  apiUrl: 'http://your-domain/api/problem_handler.php'
});

// 문제 조회
const problem = await API.getProblem(1);

// 솔루션 조회
const solution = await API.getSolution(1);

// 학습 시작
const attempt = await API.startAttempt(userId, problemId);

// 진행 업데이트
await API.updateAttempt(attemptId, currentStep, timeSpent);
```

---

## 테스트

### Postman Collection

API 테스트를 위한 Postman Collection을 제공합니다.

```json
{
  "info": {
    "name": "Step Derivative API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Problem",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"expression\": \"x^2\",\n  \"moodle_course_id\": 1,\n  \"moodle_quiz_id\": 1,\n  \"moodle_question_id\": 1\n}"
        },
        "url": {
          "raw": "{{base_url}}/create_problem",
          "host": ["{{base_url}}"],
          "path": ["create_problem"]
        }
      }
    }
  ]
}
```

---

## 지원

API 관련 질문이나 문제는 이슈 트래커에 보고해주세요.
