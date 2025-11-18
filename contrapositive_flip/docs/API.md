# Contrapositive Flip - API 문서

## 개요

Contrapositive Flip API는 RESTful 방식으로 설계되었으며, JSON 형식으로 데이터를 주고받습니다.

**Base URL**: `https://your-moodle-site.com/local/contrapositive/api/contrapositive_api.php`

## 인증

모든 API 요청은 Moodle 세션 인증이 필요합니다.

- **방법**: Moodle 로그인 후 세션 쿠키 사용
- **쿠키명**: `MoodleSession`
- **오류 시**: HTTP 401 Unauthorized 또는 Moodle 로그인 페이지로 리다이렉트

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { /* 요청한 데이터 */ },
  "error": null
}
```

### 오류 응답

```json
{
  "success": false,
  "data": null,
  "error": "오류 메시지"
}
```

## API 엔드포인트

### 1. 문제 조회

**설명**: ID로 특정 문제를 조회합니다.

**요청**:
```
GET /contrapositive_api.php?action=get_question&id={question_id}
```

**파라미터**:
- `action` (required): `get_question`
- `id` (required, integer): 문제 ID

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "moodle_question_id": "0",
    "course_id": "0",
    "original_statement": "만약 x > 5이면, x > 3이다",
    "original_antecedent": "x > 5",
    "original_consequent": "x > 3",
    "contrapositive_statement": "만약 x ≤ 3이면, x ≤ 5이다",
    "contrapositive_antecedent": "x ≤ 3",
    "contrapositive_consequent": "x ≤ 5",
    "difficulty_level": "1",
    "language": "ko",
    "timecreated": "1705564800",
    "timemodified": "1705564800"
  },
  "error": null
}
```

**오류 코드**:
- `400`: 잘못된 파라미터
- `404`: 문제를 찾을 수 없음

---

### 2. 문제 생성

**설명**: 새로운 대우 문제를 자동으로 생성합니다.

**요청**:
```
POST /contrapositive_api.php?action=generate
Content-Type: application/json
```

**요청 본문**:
```json
{
  "original_antecedent": "x > 5",
  "original_consequent": "x > 3",
  "language": "ko",
  "difficulty_level": 1,
  "course_id": 1,
  "moodle_question_id": 123
}
```

**파라미터**:
- `original_antecedent` (required, string): 원명제의 P 부분
- `original_consequent` (required, string): 원명제의 Q 부분
- `language` (optional, string): 언어 코드 (`ko` | `en`), 기본값: `ko`
- `difficulty_level` (optional, integer): 난이도 (1-3), 기본값: `1`
- `course_id` (optional, integer): Moodle 코스 ID, 기본값: `0`
- `moodle_question_id` (optional, integer): Moodle 문제 ID, 기본값: `0`

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "id": "2",
    "original_statement": "만약 x > 5이면, x > 3이다",
    "original_antecedent": "x > 5",
    "original_consequent": "x > 3",
    "contrapositive_statement": "만약 x ≤ 3이면, x ≤ 5이다",
    "contrapositive_antecedent": "x ≤ 3",
    "contrapositive_consequent": "x ≤ 5",
    "difficulty_level": "1",
    "language": "ko",
    "timecreated": "1705564900",
    "timemodified": "1705564900"
  },
  "error": null
}
```

**오류 코드**:
- `400`: 필수 파라미터 누락 또는 잘못된 입력
- `500`: 문제 생성 실패

---

### 3. 시도 기록

**설명**: 학생의 문제 풀이 시도를 기록합니다.

**요청**:
```
POST /contrapositive_api.php?action=record_attempt
Content-Type: application/json
```

**요청 본문**:
```json
{
  "question_id": 1,
  "flip_count": 3,
  "time_spent": 45,
  "understood": null,
  "user_answer": ""
}
```

**파라미터**:
- `question_id` (required, integer): 문제 ID
- `user_id` (optional, integer): 사용자 ID (기본값: 현재 로그인 사용자)
- `flip_count` (optional, integer): 카드 뒤집기 횟수, 기본값: `0`
- `time_spent` (optional, integer): 소요 시간(초), 기본값: `0`
- `understood` (optional, integer|null): 이해 여부 (`1`: 이해, `0`: 미이해, `null`: 미답변), 기본값: `null`
- `user_answer` (optional, string): 학생의 설명, 기본값: `""`

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "attempt_id": 5
  },
  "error": null
}
```

**오류 코드**:
- `400`: question_id 누락
- `500`: 시도 기록 실패

---

### 4. 시도 업데이트

**설명**: 기록된 시도 정보를 업데이트합니다.

**요청**:
```
POST /contrapositive_api.php?action=update_attempt
Content-Type: application/json
```

**요청 본문**:
```json
{
  "attempt_id": 5,
  "flip_count": 5,
  "time_spent": 60,
  "understood": 1,
  "user_answer": "대우는 원명제와 논리적으로 동치입니다."
}
```

**파라미터**:
- `attempt_id` (required, integer): 시도 ID
- `flip_count` (optional, integer): 업데이트할 뒤집기 횟수
- `time_spent` (optional, integer): 업데이트할 소요 시간(초)
- `understood` (optional, integer): 이해 여부 (`1` | `0`)
- `user_answer` (optional, string): 학생의 설명

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "updated": true
  },
  "error": null
}
```

**오류 코드**:
- `400`: attempt_id 누락
- `404`: 시도를 찾을 수 없음
- `500`: 업데이트 실패

---

### 5. 분석 데이터 조회

**설명**: 특정 문제의 학습 분석 데이터를 조회합니다.

**요청**:
```
GET /contrapositive_api.php?action=get_analytics&question_id={id}&days={days}
```

**파라미터**:
- `action` (required): `get_analytics`
- `question_id` (required, integer): 문제 ID
- `days` (optional, integer): 조회 기간(일), 기본값: `30`

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "question_id": "1",
      "total_views": "25",
      "total_flips": "75",
      "avg_time_spent": "52.40",
      "understanding_rate": "80.00",
      "date_recorded": "2025-01-17"
    },
    {
      "id": "2",
      "question_id": "1",
      "total_views": "30",
      "total_flips": "90",
      "avg_time_spent": "48.20",
      "understanding_rate": "83.33",
      "date_recorded": "2025-01-18"
    }
  ],
  "error": null
}
```

**오류 코드**:
- `400`: 잘못된 파라미터

---

### 6. 예제 문제 가져오기

**설명**: 사전 정의된 예제 문제 목록을 가져옵니다.

**요청**:
```
GET /contrapositive_api.php?action=get_examples&language={lang}
```

**파라미터**:
- `action` (required): `get_examples`
- `language` (optional, string): 언어 코드 (`ko` | `en`), 기본값: `ko`

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "original_antecedent": "x > 5",
      "original_consequent": "x > 3",
      "category": "math",
      "difficulty": 1
    },
    {
      "original_antecedent": "어떤 도형이 정사각형",
      "original_consequent": "그 도형은 4개의 변을 가짐",
      "category": "geometry",
      "difficulty": 2
    },
    {
      "original_antecedent": "n이 짝수",
      "original_consequent": "n²은 짝수",
      "category": "number_theory",
      "difficulty": 2
    }
  ],
  "error": null
}
```

**오류 코드**: 없음 (항상 성공)

---

## 사용 예제

### JavaScript (Fetch API)

```javascript
// 문제 생성
async function createQuestion() {
  const response = await fetch('contrapositive_api.php?action=generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      original_antecedent: 'x > 5',
      original_consequent: 'x > 3',
      language: 'ko',
      difficulty_level: 1,
    }),
  });

  const data = await response.json();

  if (data.success) {
    console.log('Question created:', data.data);
  } else {
    console.error('Error:', data.error);
  }
}

// 시도 기록
async function recordAttempt(questionId, flipCount, timeSpent) {
  const response = await fetch('contrapositive_api.php?action=record_attempt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question_id: questionId,
      flip_count: flipCount,
      time_spent: timeSpent,
    }),
  });

  const data = await response.json();

  if (data.success) {
    return data.data.attempt_id;
  } else {
    throw new Error(data.error);
  }
}
```

### PHP

```php
// 문제 조회
function getQuestion($questionId) {
    global $DB;

    $question = local_contrapositive_get_question($questionId);

    if (!$question) {
        throw new Exception('Question not found');
    }

    return $question;
}

// 시도 업데이트
function updateAttempt($attemptId, $understood, $userAnswer) {
    $data = new stdClass();
    $data->understood = $understood;
    $data->user_answer = $userAnswer;

    return local_contrapositive_update_attempt($attemptId, $data);
}
```

### cURL

```bash
# 문제 조회
curl -X GET "https://your-moodle-site.com/local/contrapositive/api/contrapositive_api.php?action=get_question&id=1" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID"

# 문제 생성
curl -X POST "https://your-moodle-site.com/local/contrapositive/api/contrapositive_api.php?action=generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID" \
  -d '{
    "original_antecedent": "x > 5",
    "original_consequent": "x > 3",
    "language": "ko",
    "difficulty_level": 1
  }'
```

## 오류 처리

### 일반적인 오류 응답

| HTTP Status | 의미 | 조치 |
|------------|------|------|
| 200 | 성공 | 정상 처리 |
| 400 | 잘못된 요청 | 파라미터 확인 |
| 401 | 인증 실패 | Moodle 로그인 필요 |
| 403 | 권한 없음 | 접근 권한 확인 |
| 404 | 리소스 없음 | ID 확인 |
| 500 | 서버 오류 | 서버 로그 확인 |

### 오류 메시지 예시

```json
{
  "success": false,
  "data": null,
  "error": "Invalid action: invalid_action"
}
```

```json
{
  "success": false,
  "data": null,
  "error": "Missing required field: original_antecedent"
}
```

## 속도 제한

현재 API는 속도 제한이 없습니다. 향후 버전에서 추가될 예정입니다.

**권장 사항**:
- 초당 최대 10 요청
- 동시 요청 최대 5개

## 버전 관리

**현재 버전**: v1.0.0

API 버전은 URL에 포함되지 않습니다. 주요 변경 사항은 이 문서에 기록됩니다.

## 변경 이력

### v1.0.0 (2025-01-18)
- 초기 API 릴리스
- 6개 엔드포인트 제공
- JSON 형식 지원
- Moodle 세션 인증

## 지원

API 관련 문의:
- 이메일: api-support@kaist-touchmath.edu
- GitHub Issues: https://github.com/your-repo/contrapositive-flip/issues
- 문서: https://docs.contrapositive-flip.edu
