# Hundred Art - API 문서

Base URL: `http://your-domain.com/backend/api`

---

## 인증

현재 버전은 기본 인증을 사용하지 않습니다. 프로덕션 환경에서는 JWT 또는 세션 기반 인증을 구현하는 것을 권장합니다.

---

## 엔드포인트

### 1. Health Check

시스템 상태 확인

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "app": "Hundred Art",
    "version": "1.0.0",
    "environment": "production",
    "timestamp": "2025-01-18 10:00:00"
  }
}
```

---

### 2. Artworks (아트워크)

#### 2.1 전체 아트워크 조회

**Request:**
```http
GET /artworks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": 1,
      "title": "One - 시작",
      "description": "하나의 점으로 시작하는 여정",
      "svg_data": "<svg>...</svg>",
      "color_scheme": "warm",
      "difficulty_level": 1,
      "created_at": "2025-01-18 10:00:00",
      "updated_at": "2025-01-18 10:00:00"
    }
  ]
}
```

#### 2.2 특정 아트워크 조회

**Request:**
```http
GET /artworks/{number}
```

**Path Parameters:**
- `number` (integer): 1-100 사이의 숫자

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "title": "One - 시작",
    "description": "하나의 점으로 시작하는 여정",
    "svg_data": "<svg viewBox=\"0 0 100 100\">...</svg>",
    "color_scheme": "warm",
    "difficulty_level": 1,
    "created_at": "2025-01-18 10:00:00",
    "updated_at": "2025-01-18 10:00:00"
  }
}
```

---

### 3. Problems (문제)

#### 3.1 전체 문제 조회

**Request:**
```http
GET /problems
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moodle_question_id": 123,
      "course_id": 1,
      "quiz_id": 5,
      "question_text": "1 + 1은 무엇인가요?",
      "question_type": "multiple_choice",
      "correct_answer": "2",
      "artwork_number": 2,
      "difficulty": 1,
      "points": 1.00,
      "is_active": true,
      "artwork_title": "Two - 균형",
      "artwork_svg": "<svg>...</svg>",
      "created_at": "2025-01-18 10:00:00",
      "updated_at": "2025-01-18 10:00:00"
    }
  ]
}
```

#### 3.2 특정 문제 조회

**Request:**
```http
GET /problems/{id}
```

**Path Parameters:**
- `id` (integer): 문제 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_question_id": 123,
    "question_text": "1 + 1은 무엇인가요?",
    "correct_answer": "2",
    "artwork_number": 2,
    "difficulty": 1,
    "points": 1.00
  }
}
```

#### 3.3 문제 생성

**Request:**
```http
POST /problems
Content-Type: application/json

{
  "moodle_question_id": 456,
  "course_id": 1,
  "quiz_id": 5,
  "question_text": "3 + 4는 무엇인가요?",
  "question_type": "short_answer",
  "correct_answer": "7",
  "artwork_number": 7,
  "difficulty": 2,
  "points": 2.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2
  }
}
```

---

### 4. Student Progress (학생 진행 상황)

#### 4.1 학생 진행 상황 조회

**Request:**
```http
GET /progress/{student_id}
```

**Path Parameters:**
- `student_id` (integer): 학생 ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "problem_id": 1,
      "artwork_number": 2,
      "attempt_number": 1,
      "user_answer": "2",
      "is_correct": true,
      "time_spent_seconds": 45,
      "score": 1.00,
      "attempted_at": "2025-01-18 10:00:00",
      "completed_at": "2025-01-18 10:01:00",
      "question_text": "1 + 1은 무엇인가요?",
      "artwork_title": "Two - 균형"
    }
  ]
}
```

#### 4.2 답안 제출

**Request:**
```http
POST /progress
Content-Type: application/json

{
  "student_id": 1,
  "problem_id": 1,
  "artwork_number": 2,
  "attempt_number": 1,
  "user_answer": "2",
  "is_correct": true,
  "time_spent_seconds": 45,
  "score": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

---

### 5. Students (학생)

#### 5.1 전체 학생 조회

**Request:**
```http
GET /students
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moodle_user_id": 101,
      "username": "student1",
      "email": "student1@example.com",
      "full_name": "홍길동",
      "grade_level": "3학년",
      "created_at": "2025-01-18 10:00:00",
      "updated_at": "2025-01-18 10:00:00"
    }
  ]
}
```

#### 5.2 특정 학생 조회

**Request:**
```http
GET /students/{id}
```

**Path Parameters:**
- `id` (integer): 학생 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_user_id": 101,
    "username": "student1",
    "email": "student1@example.com",
    "full_name": "홍길동",
    "grade_level": "3학년"
  }
}
```

---

### 6. Moodle Integration (Moodle 연동)

#### 6.1 데이터 동기화

**Request:**
```http
POST /moodle/sync
Content-Type: application/json

{
  "type": "students",
  "course_id": 1
}
```

**Request Body Parameters:**
- `type` (string): 동기화 유형 (`students` 또는 `problems`)
- `course_id` (integer): Moodle 코스 ID
- `quiz_id` (integer, optional): Moodle 퀴즈 ID (type이 `problems`일 때 필수)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "synced": 25
  }
}
```

#### 6.2 동기화 상태 확인

**Request:**
```http
GET /moodle/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "sync_type": "students",
        "status": "success",
        "records_synced": 25,
        "error_message": null,
        "sync_started_at": "2025-01-18 10:00:00",
        "sync_completed_at": "2025-01-18 10:00:15"
      }
    ]
  }
}
```

---

## 에러 응답

모든 API 엔드포인트는 오류 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

- `200` - 성공
- `400` - 잘못된 요청
- `404` - 리소스를 찾을 수 없음
- `405` - 허용되지 않는 메서드
- `500` - 서버 내부 오류

---

## 사용 예시

### cURL 예시

```bash
# 아트워크 조회
curl http://localhost:8000/backend/api/artworks/1

# 문제 생성
curl -X POST http://localhost:8000/backend/api/problems \
  -H "Content-Type: application/json" \
  -d '{"question_text":"2+2는?","correct_answer":"4","artwork_number":4}'

# Moodle 동기화
curl -X POST http://localhost:8000/backend/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"students","course_id":1}'
```

### JavaScript (Fetch API) 예시

```javascript
// 아트워크 조회
fetch('http://localhost:8000/backend/api/artworks/1')
  .then(response => response.json())
  .then(data => console.log(data));

// 답안 제출
fetch('http://localhost:8000/backend/api/progress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    student_id: 1,
    problem_id: 1,
    artwork_number: 2,
    user_answer: '2',
    is_correct: true,
    time_spent_seconds: 45,
    score: 1.0
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 버전 관리

현재 버전: **v1.0.0**

API 버전은 URL에 포함되지 않습니다. 향후 버전에서는 `/api/v2/` 형식으로 관리될 예정입니다.

---

## 지원

API 관련 문의사항은 프로젝트 이슈 트래커에 등록해주세요.
