# Ratio Spring API 문서

## 기본 정보

- **Base URL**: `/api/connector.php`
- **응답 형식**: JSON
- **인증**: Bearer Token (선택사항)

## 엔드포인트

### 1. Health Check

서버 상태 확인

**요청**
```
GET /api/connector.php?action=health
```

**응답**
```json
{
  "status": "ok",
  "timestamp": 1700000000
}
```

---

### 2. 문제 가져오기

단일 비율 문제 정보 조회

**요청**
```
GET /api/connector.php?action=get_problem&id={problem_id}
```

**파라미터**
- `id` (required): 문제 ID

**응답**
```json
{
  "id": 1,
  "ratio_a": 2,
  "ratio_b": 3,
  "question": "피자를 2:3 비율로 나누어 보세요",
  "description": "두 명의 친구가 피자를 2:3 비율로 나누어 먹습니다.",
  "difficulty": "easy",
  "hints": [
    "먼저 전체를 5등분 해보세요",
    "2:3은 5조각 중 2조각과 3조각입니다"
  ],
  "metadata": {
    "category": "food",
    "topic": "fractions"
  },
  "created_at": "2025-11-18 10:30:00"
}
```

**오류 응답**
```json
{
  "error": "Problem not found"
}
```
Status: 404

---

### 3. 문제 목록 가져오기

여러 문제 조회

**요청**
```
GET /api/connector.php?action=get_problems&activity_id={id}&limit={n}&offset={m}
```

**파라미터**
- `activity_id` (optional): Moodle 활동 ID
- `limit` (optional): 가져올 문제 수 (기본: 10)
- `offset` (optional): 시작 위치 (기본: 0)

**응답**
```json
{
  "problems": [
    {
      "id": 1,
      "ratio_a": 2,
      "ratio_b": 3,
      "question": "...",
      "difficulty": "easy"
    },
    {
      "id": 2,
      "ratio_a": 3,
      "ratio_b": 4,
      "question": "...",
      "difficulty": "medium"
    }
  ],
  "count": 2
}
```

---

### 4. 답변 제출

학생 답변 제출

**요청**
```
POST /api/connector.php?action=submit_answer
Content-Type: application/json

{
  "problem_id": 1,
  "user_id": 123,
  "answer": {
    "a": 2,
    "b": 3
  },
  "timestamp": "2025-11-18T10:30:00Z"
}
```

**파라미터**
- `problem_id` (required): 문제 ID
- `user_id` (optional): 사용자 ID
- `answer` (required): 답변 데이터
- `timestamp` (optional): 제출 시간

**응답**
```json
{
  "success": true,
  "message": "Answer submitted",
  "data": {
    "is_correct": true,
    "answer_id": 456
  }
}
```

**오류 응답**
```json
{
  "error": "Invalid JSON input"
}
```
Status: 400

---

### 5. 문제 생성 (관리자)

새 비율 문제 생성

**요청**
```
POST /api/connector.php?action=create_problem
Authorization: Bearer {token}
Content-Type: application/json

{
  "ratio_a": 4,
  "ratio_b": 5,
  "question": "사과와 오렌지의 비율은 4:5입니다",
  "description": "과일 바구니에 담긴 과일의 비율",
  "difficulty": "medium",
  "hints": [
    "전체는 9개입니다",
    "사과 4개, 오렌지 5개"
  ],
  "metadata": {
    "category": "fruits",
    "grade": 3
  }
}
```

**파라미터**
- `ratio_a` (required): 비율 A (1-10)
- `ratio_b` (required): 비율 B (1-10)
- `question` (required): 문제 텍스트
- `description` (optional): 설명
- `difficulty` (optional): 난이도 (easy/medium/hard)
- `hints` (optional): 힌트 배열
- `metadata` (optional): 메타데이터

**응답**
```json
{
  "success": true,
  "message": "Problem created",
  "data": {
    "id": 10
  }
}
```

**오류 응답**
```json
{
  "error": "Unauthorized"
}
```
Status: 401

---

## 오류 코드

| 상태 코드 | 설명 |
|---------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 404 | 리소스를 찾을 수 없음 |
| 405 | 허용되지 않는 메서드 |
| 500 | 서버 오류 |

## 인증

보호된 엔드포인트는 Bearer 토큰이 필요합니다:

```
Authorization: Bearer {your_token_here}
```

## CORS

허용된 origin에서만 API 호출 가능. `api/config.php`에서 설정:

```php
define('ALLOWED_ORIGINS', 'http://localhost:8080,http://your-domain.com');
```

## 레이트 리미팅

현재 구현되지 않음. 프로덕션 환경에서는 nginx 또는 API Gateway에서 설정 권장.

## 예제

### cURL

```bash
# 문제 가져오기
curl -X GET "http://localhost:8080/api/connector.php?action=get_problem&id=1"

# 답변 제출
curl -X POST "http://localhost:8080/api/connector.php?action=submit_answer" \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"answer":{"a":2,"b":3}}'
```

### JavaScript (Fetch API)

```javascript
// 문제 가져오기
fetch('/api/connector.php?action=get_problem&id=1')
  .then(response => response.json())
  .then(data => console.log(data));

// 답변 제출
fetch('/api/connector.php?action=submit_answer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    problem_id: 1,
    answer: { a: 2, b: 3 }
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### PHP

```php
// 문제 가져오기
$url = 'http://localhost:8080/api/connector.php?action=get_problem&id=1';
$response = file_get_contents($url);
$data = json_decode($response, true);

// 답변 제출
$url = 'http://localhost:8080/api/connector.php?action=submit_answer';
$data = [
    'problem_id' => 1,
    'answer' => ['a' => 2, 'b' => 3]
];

$options = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);
$result = json_decode($response, true);
```
