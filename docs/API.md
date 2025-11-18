# Venn Glow API 문서

## 개요

Venn Glow는 Moodle LMS와 연동하여 집합 문제를 제공하는 RESTful API를 제공합니다.

**Base URL**: `/api/`

**응답 형식**: JSON

## 인증

현재 버전은 인증이 필요하지 않습니다. 프로덕션 환경에서는 적절한 인증 메커니즘 추가를 권장합니다.

---

## 엔드포인트

### 1. 문제 가져오기

특정 문제 또는 무작위 문제를 가져옵니다.

#### 특정 문제 가져오기

```http
GET /api/get_problem.php?problem_id={id}
```

**파라미터:**
- `problem_id` (integer, required): Moodle 문제 ID

**응답 예시:**
```json
{
  "success": true,
  "problem": {
    "id": 123,
    "name": "집합의 교집합",
    "questionText": "집합 A와 집합 B의 교집합을 구하세요.",
    "setA": [1, 2, 3, 4, 5],
    "setB": [3, 4, 5, 6, 7],
    "union": [1, 2, 3, 4, 5, 6, 7],
    "intersection": [3, 4, 5],
    "diffAB": [1, 2],
    "diffBA": [6, 7],
    "correctAnswer": "{3, 4, 5}",
    "points": 1.0
  }
}
```

#### 무작위 문제 가져오기

```http
GET /api/get_problem.php?random=1&category_id={category_id}
```

**파라미터:**
- `random` (integer, required): 1로 설정
- `category_id` (integer, optional): Moodle 카테고리 ID

**응답**: 위와 동일

#### 샘플 문제 가져오기

```http
GET /api/get_problem.php
```

파라미터 없이 호출하면 샘플 문제를 반환합니다.

**응답**: 위와 동일

#### 오류 응답

```json
{
  "success": false,
  "message": "문제를 찾을 수 없습니다."
}
```

**HTTP 상태 코드:**
- `200 OK`: 성공
- `404 Not Found`: 문제를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

### 2. 답안 제출

학생의 답안을 제출하고 검증합니다.

```http
POST /api/submit_answer.php
```

**Content-Type**: `application/json`

**요청 본문:**
```json
{
  "problem_id": 123,
  "student_id": 456,
  "answer": "{3, 4, 5}"
}
```

**파라미터:**
- `problem_id` (integer, required): 문제 ID
- `student_id` (integer, required): 학생 ID
- `answer` (string, required): 학생의 답안

**응답 예시 (정답):**
```json
{
  "success": true,
  "correct": true,
  "correctAnswer": "{3, 4, 5}",
  "points": 1.0
}
```

**응답 예시 (오답):**
```json
{
  "success": true,
  "correct": false,
  "correctAnswer": "{3, 4, 5}",
  "points": 0
}
```

**오류 응답:**
```json
{
  "success": false,
  "message": "필수 파라미터가 누락되었습니다."
}
```

**HTTP 상태 코드:**
- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청
- `405 Method Not Allowed`: POST 외의 메서드 사용
- `500 Internal Server Error`: 서버 오류

---

## 데이터 모델

### Problem 객체

```typescript
interface Problem {
  id: number | string;           // 문제 ID
  name: string;                   // 문제 이름
  questionText: string;           // 문제 텍스트
  setA: Array<number | string>;   // 집합 A의 원소
  setB: Array<number | string>;   // 집합 B의 원소
  union: Array<number | string>;  // 합집합 A ∪ B
  intersection: Array<number | string>; // 교집합 A ∩ B
  diffAB: Array<number | string>; // 차집합 A - B
  diffBA: Array<number | string>; // 차집합 B - A
  correctAnswer: string | null;   // 정답
  points: number;                 // 배점
}
```

---

## 사용 예시

### JavaScript (Fetch API)

#### 문제 가져오기
```javascript
// 샘플 문제
fetch('/api/get_problem.php')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('문제:', data.problem);
    }
  });

// 특정 문제
fetch('/api/get_problem.php?problem_id=123')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('문제:', data.problem);
    }
  });

// 무작위 문제
fetch('/api/get_problem.php?random=1')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('문제:', data.problem);
    }
  });
```

#### 답안 제출
```javascript
fetch('/api/submit_answer.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    problem_id: 123,
    student_id: 456,
    answer: '{3, 4, 5}'
  })
})
  .then(response => response.json())
  .then(data => {
    if (data.success && data.correct) {
      console.log('정답입니다!');
    } else {
      console.log('오답입니다. 정답:', data.correctAnswer);
    }
  });
```

### PHP (cURL)

```php
<?php
// 문제 가져오기
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://your-server/api/get_problem.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if ($data['success']) {
    print_r($data['problem']);
}

// 답안 제출
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://your-server/api/submit_answer.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'problem_id' => 123,
    'student_id' => 456,
    'answer' => '{3, 4, 5}'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if ($data['success'] && $data['correct']) {
    echo "정답입니다!";
}
?>
```

---

## 오류 코드

| HTTP 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (파라미터 누락 또는 형식 오류) |
| 404 | 리소스를 찾을 수 없음 |
| 405 | 허용되지 않는 HTTP 메서드 |
| 500 | 서버 내부 오류 |

---

## CORS 설정

API는 기본적으로 모든 도메인에서의 요청을 허용합니다 (`Access-Control-Allow-Origin: *`).

프로덕션 환경에서는 특정 도메인만 허용하도록 수정하세요:

```php
header('Access-Control-Allow-Origin: https://your-domain.com');
```

---

## 향후 개선사항

- [ ] 인증 및 권한 관리 (JWT)
- [ ] Rate Limiting
- [ ] 문제 생성 API
- [ ] 학생 진도 추적 API
- [ ] 통계 및 분석 API
- [ ] WebSocket을 통한 실시간 업데이트
