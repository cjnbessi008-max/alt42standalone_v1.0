# Trig Flow Integrator API 문서

## 개요

Trig Flow Integrator는 RESTful API를 제공하여 Moodle LMS와 통합되고 학생 진행 상황을 추적합니다.

## 기본 정보

- **Base URL**: `http://your-domain.com/api`
- **응답 형식**: JSON
- **인코딩**: UTF-8
- **인증**: Moodle 세션 기반 (또는 API 키)

## API 엔드포인트

### 1. Moodle 연동 API

#### 1.1 퀴즈 정보 가져오기

**요청**
```
GET /moodle_connect.php?action=quiz&quiz_id={quiz_id}
```

**매개변수**
- `quiz_id` (필수): Moodle 퀴즈 ID

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "삼각함수 적분 퀴즈",
    "intro": "삼각함수의 적분을 학습합니다",
    "timeopen": 1699948800,
    "timeclose": 1700553600,
    "timelimit": 3600,
    "grade": 100
  }
}
```

#### 1.2 퀴즈 문제 목록 가져오기

**요청**
```
GET /moodle_connect.php?action=questions&quiz_id={quiz_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 101,
      "name": "sin(x) 적분",
      "questiontext": "sin(x)를 적분하세요",
      "qtype": "calculated",
      "defaultmark": 10
    },
    {
      "id": 102,
      "name": "cos(x) 적분",
      "questiontext": "cos(x)를 적분하세요",
      "qtype": "calculated",
      "defaultmark": 10
    }
  ]
}
```

#### 1.3 사용자 정보 가져오기

**요청**
```
GET /moodle_connect.php?action=user&user_id={user_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 123,
    "username": "student01",
    "firstname": "홍",
    "lastname": "길동",
    "email": "student01@example.com"
  }
}
```

#### 1.4 사용자 퀴즈 시도 정보

**요청**
```
GET /moodle_connect.php?action=attempt&quiz_id={quiz_id}&user_id={user_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 456,
    "quiz": 1,
    "userid": 123,
    "attempt": 2,
    "state": "inprogress",
    "timestart": 1700000000,
    "timefinish": null,
    "sumgrades": null
  }
}
```

### 2. 문제 데이터 API

#### 2.1 문제 정보 가져오기

**요청**
```
GET /problem_data.php?action=problem&id={problem_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "moodle_quiz_id": 1,
    "moodle_question_id": 101,
    "problem_type": "integral",
    "function_type": "sin",
    "difficulty_level": 1,
    "coefficient": 1.00,
    "frequency": 1.00,
    "phase_shift": 0.00,
    "vertical_shift": 0.00,
    "integration_constant": 0.00,
    "created_at": "2025-11-15 10:00:00",
    "updated_at": "2025-11-15 10:00:00"
  }
}
```

#### 2.2 퀴즈별 문제 목록

**요청**
```
GET /problem_data.php?action=problems&quiz_id={quiz_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "function_type": "sin",
      "difficulty_level": 1,
      "coefficient": 1.00
    },
    {
      "id": 2,
      "function_type": "cos",
      "difficulty_level": 1,
      "coefficient": 1.00
    }
  ]
}
```

#### 2.3 문제 생성

**요청**
```
POST /problem_data.php
Content-Type: application/json

{
  "action": "create_problem",
  "moodle_quiz_id": 1,
  "moodle_question_id": 104,
  "function_type": "sin",
  "difficulty_level": 2,
  "coefficient": 2.0,
  "frequency": 1.5,
  "phase_shift": 0.5,
  "vertical_shift": 0.0,
  "integration_constant": 0.0
}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Problem created successfully",
  "data": {
    "problem_id": 15
  }
}
```

#### 2.4 진행 상황 시작

**요청**
```
POST /problem_data.php
Content-Type: application/json

{
  "action": "start_progress",
  "user_id": 123,
  "problem_id": 1,
  "session_id": "session_abc123xyz"
}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Progress started",
  "data": {
    "progress_id": 789
  }
}
```

#### 2.5 진행 상황 업데이트

**요청**
```
POST /problem_data.php
Content-Type: application/json

{
  "action": "update_progress",
  "progress_id": 789,
  "time_spent_seconds": 120,
  "attempts": 2,
  "is_correct": true,
  "student_answer": {
    "answer": "correct",
    "method": "visual"
  },
  "interaction_data": {
    "clicks": 15,
    "slider_changes": 25,
    "animation_views": 5
  },
  "completed": true
}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Progress updated",
  "data": {
    "updated": true
  }
}
```

#### 2.6 학생 통계

**요청**
```
GET /problem_data.php?action=statistics&user_id={user_id}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "moodle_user_id": 123,
    "problems_attempted": 15,
    "problems_correct": 12,
    "success_rate": 80.00,
    "total_time_seconds": 1800,
    "avg_time_per_problem": 120,
    "last_activity": "2025-11-18 14:30:00"
  }
}
```

#### 2.7 이벤트 로깅

**요청**
```
POST /problem_data.php
Content-Type: application/json

{
  "action": "log_event",
  "session_id": "session_abc123xyz",
  "user_id": 123,
  "event_type": "slider_change",
  "event_data": {
    "param": "a",
    "old_value": 1.0,
    "new_value": 2.0,
    "timestamp": "2025-11-18 14:32:15"
  }
}
```

**응답 예시**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "logged": true
  }
}
```

## 오류 처리

### 오류 응답 형식

```json
{
  "error": "Error message",
  "status": 400
}
```

### HTTP 상태 코드

- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청 (필수 매개변수 누락 등)
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 리소스를 찾을 수 없음
- `405 Method Not Allowed`: 허용되지 않은 HTTP 메서드
- `500 Internal Server Error`: 서버 오류

### 일반적인 오류 메시지

```json
{
  "error": "Missing required field: user_id",
  "status": 400
}
```

```json
{
  "error": "Invalid JSON input",
  "status": 400
}
```

```json
{
  "error": "Database connection failed",
  "status": 500
}
```

## 사용 예제

### JavaScript (Fetch API)

```javascript
// 문제 정보 가져오기
async function getProblem(problemId) {
  const response = await fetch(`/api/problem_data.php?action=problem&id=${problemId}`);
  const data = await response.json();
  return data;
}

// 진행 상황 업데이트
async function updateProgress(progressId, progressData) {
  const response = await fetch('/api/problem_data.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'update_progress',
      progress_id: progressId,
      ...progressData
    })
  });
  const data = await response.json();
  return data;
}

// 사용 예시
getProblem(1).then(data => {
  console.log('Problem:', data);
});

updateProgress(789, {
  time_spent_seconds: 150,
  is_correct: true,
  completed: true
}).then(data => {
  console.log('Progress updated:', data);
});
```

### PHP (cURL)

```php
<?php
// 문제 정보 가져오기
function getProblem($problemId) {
    $url = "http://your-domain.com/api/problem_data.php?action=problem&id={$problemId}";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// 진행 상황 업데이트
function updateProgress($progressId, $progressData) {
    $url = "http://your-domain.com/api/problem_data.php";

    $data = array_merge([
        'action' => 'update_progress',
        'progress_id' => $progressId
    ], $progressData);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// 사용 예시
$problem = getProblem(1);
print_r($problem);
?>
```

### Python (requests)

```python
import requests

# 문제 정보 가져오기
def get_problem(problem_id):
    url = f"http://your-domain.com/api/problem_data.php"
    params = {
        'action': 'problem',
        'id': problem_id
    }
    response = requests.get(url, params=params)
    return response.json()

# 진행 상황 업데이트
def update_progress(progress_id, progress_data):
    url = "http://your-domain.com/api/problem_data.php"
    data = {
        'action': 'update_progress',
        'progress_id': progress_id,
        **progress_data
    }
    response = requests.post(url, json=data)
    return response.json()

# 사용 예시
problem = get_problem(1)
print(problem)

result = update_progress(789, {
    'time_spent_seconds': 150,
    'is_correct': True,
    'completed': True
})
print(result)
```

## 보안 고려사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **입력 검증**: 모든 사용자 입력은 서버에서 검증됨
3. **SQL Injection 방지**: PDO prepared statements 사용
4. **XSS 방지**: 출력 시 HTML 이스케이프 처리
5. **Rate Limiting**: API 호출 제한 (선택 사항)

## 버전 관리

현재 버전: **v1.0.0**

API 변경 사항은 하위 호환성을 유지하며, 주요 변경 시 버전 번호를 업데이트합니다.

---

문의사항이나 버그 리포트는 GitHub Issues에 등록해 주세요.
