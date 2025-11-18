# API 문서 (API Documentation)

## 개요

Breathing Pace Learning Assistant는 PHP 기반 REST API를 제공하여 Moodle LMS와 통신하고 호흡 세션 데이터를 관리합니다.

## 베이스 URL

```
http://your-server/breathing-pace-app/src/api/
```

## 인증

현재 버전은 세션 기반 인증을 사용합니다. 향후 버전에서 JWT 토큰 인증이 추가될 예정입니다.

## 엔드포인트

### 1. Moodle 퀴즈 정보 가져오기

Moodle에서 퀴즈 정보와 첫 번째 문제를 가져옵니다.

**Endpoint**: `POST /src/api/moodle.php`

**Request Body**:
```json
{
  "action": "getQuizInfo",
  "config": {
    "url": "https://your-moodle.com",
    "token": "your_moodle_api_token",
    "quizId": 123
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "question": {
      "id": 1,
      "quizId": 123,
      "title": "문제 1",
      "difficulty": "medium",
      "type": "multichoice",
      "questiontext": "2 + 2는?",
      "url": null
    },
    "quiz": {
      "id": 123,
      "name": "수학 퀴즈"
    }
  },
  "timestamp": 1700000000
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Failed to connect to Moodle",
  "timestamp": 1700000000
}
```

**난이도 값**:
- `easy`: 쉬움
- `medium`: 보통
- `hard`: 어려움
- `very-hard`: 매우 어려움

---

### 2. 퀴즈 문제 목록 가져오기

퀴즈의 모든 문제를 가져옵니다.

**Endpoint**: `POST /src/api/moodle.php`

**Request Body**:
```json
{
  "action": "getQuestions",
  "config": {
    "url": "https://your-moodle.com",
    "token": "your_moodle_api_token",
    "quizId": 123
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "title": "문제 1",
        "difficulty": "easy",
        "type": "multichoice",
        "questiontext": "2 + 2는?",
        "maxmark": 1.0
      },
      {
        "id": 2,
        "title": "문제 2",
        "difficulty": "hard",
        "type": "numerical",
        "questiontext": "π의 값은?",
        "maxmark": 2.0
      }
    ]
  },
  "timestamp": 1700000000
}
```

---

### 3. 답안 제출

학생의 답안을 Moodle에 제출합니다. (현재 버전은 기본 응답만 반환)

**Endpoint**: `POST /src/api/moodle.php`

**Request Body**:
```json
{
  "action": "submitAnswer",
  "config": {
    "url": "https://your-moodle.com",
    "token": "your_moodle_api_token",
    "quizId": 123
  },
  "data": {
    "questionId": 1,
    "answer": "4"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "submitted": true,
    "message": "Answer submitted successfully"
  },
  "timestamp": 1700000000
}
```

---

## 데이터베이스 API

Database 클래스를 통해 다음 메서드를 사용할 수 있습니다.

### Database 클래스 메서드

#### 1. getInstance()

싱글톤 패턴으로 데이터베이스 인스턴스를 가져옵니다.

```php
$db = Database::getInstance();
```

---

#### 2. createSession()

새로운 호흡 세션을 생성합니다.

**매개변수**:
- `$userId` (int): 사용자 ID (NULL 가능)
- `$questionId` (int): 문제 ID
- `$difficulty` (string): 난이도
- `$inhaleDuration` (int): 들숨 시간 (초)
- `$exhaleDuration` (int): 날숨 시간 (초)
- `$totalCycles` (int): 총 사이클 수 (기본값: 3)

**반환값**: 생성된 세션 ID

**예제**:
```php
$sessionId = $db->createSession(
    userId: 1,
    questionId: 10,
    difficulty: 'medium',
    inhaleDuration: 4,
    exhaleDuration: 7,
    totalCycles: 3
);
```

---

#### 3. completeSession()

세션을 완료 처리합니다.

**매개변수**:
- `$sessionId` (int): 세션 ID
- `$completedCycles` (int): 완료한 사이클 수
- `$durationSeconds` (int): 총 세션 시간 (초)

**반환값**: boolean (성공 여부)

**예제**:
```php
$success = $db->completeSession(
    sessionId: 1,
    completedCycles: 3,
    durationSeconds: 33
);
```

---

#### 4. getUserStats()

사용자 통계를 조회합니다.

**매개변수**:
- `$userId` (int): 사용자 ID

**반환값**: 배열 (통계 데이터)

**예제**:
```php
$stats = $db->getUserStats(userId: 1);

// 결과:
// [
//     'total_sessions' => 10,
//     'total_cycles' => 30,
//     'total_duration_seconds' => 330,
//     'easy_count' => 2,
//     'medium_count' => 5,
//     'hard_count' => 2,
//     'very_hard_count' => 1,
//     'last_session_at' => '2025-11-18 12:00:00'
// ]
```

---

#### 5. saveQuestion()

문제 정보를 저장하거나 업데이트합니다.

**매개변수**:
- `$moodleQuestionId` (int): Moodle 문제 ID
- `$quizId` (int): 퀴즈 ID
- `$title` (string): 문제 제목
- `$difficulty` (string): 난이도
- `$questionType` (string): 문제 유형
- `$questionText` (string, optional): 문제 내용

**반환값**: 문제 ID

**예제**:
```php
$questionId = $db->saveQuestion(
    moodleQuestionId: 101,
    quizId: 10,
    title: '문제 1',
    difficulty: 'medium',
    questionType: 'multichoice',
    questionText: '2 + 2는?'
);
```

---

#### 6. getDifficultyStats()

난이도별 통계를 조회합니다.

**반환값**: 배열 (난이도별 통계)

**예제**:
```php
$stats = $db->getDifficultyStats();

// 결과:
// [
//     [
//         'difficulty' => 'easy',
//         'session_count' => 50,
//         'avg_cycles' => 3.0,
//         'avg_duration_seconds' => 24.0,
//         'avg_inhale' => 4.0,
//         'avg_exhale' => 4.0
//     ],
//     // ...
// ]
```

---

#### 7. log()

시스템 로그를 기록합니다.

**매개변수**:
- `$userId` (int, optional): 사용자 ID
- `$action` (string): 액션 이름
- `$details` (string, optional): 상세 정보
- `$ipAddress` (string, optional): IP 주소
- `$userAgent` (string, optional): User Agent

**반환값**: boolean (성공 여부)

**예제**:
```php
$db->log(
    userId: 1,
    action: 'session_completed',
    details: 'Session ID: 123',
    ipAddress: $_SERVER['REMOTE_ADDR'],
    userAgent: $_SERVER['HTTP_USER_AGENT']
);
```

---

## 호흡 템포 매핑

각 난이도에 대응하는 호흡 템포:

| 난이도 | 들숨 (초) | 날숨 (초) | 총 사이클 (초) |
|--------|----------|----------|--------------|
| easy | 4 | 4 | 8 |
| medium | 4 | 7 | 11 |
| hard | 4 | 8 | 12 |
| very-hard | 5 | 10 | 15 |

## 오류 코드

| HTTP 코드 | 의미 | 설명 |
|-----------|------|------|
| 200 | OK | 요청 성공 |
| 400 | Bad Request | 잘못된 요청 (필수 파라미터 누락 등) |
| 401 | Unauthorized | 인증 실패 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 500 | Internal Server Error | 서버 내부 오류 |

## 사용 예제

### JavaScript (Frontend)

```javascript
// Moodle 퀴즈 정보 가져오기
async function fetchQuizInfo(moodleUrl, token, quizId) {
  const response = await fetch('src/api/moodle.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'getQuizInfo',
      config: {
        url: moodleUrl,
        token: token,
        quizId: quizId
      }
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('문제:', data.data.question);
    console.log('난이도:', data.data.question.difficulty);
    return data.data;
  } else {
    throw new Error(data.error);
  }
}
```

### PHP (Backend)

```php
<?php
require_once 'src/api/database.php';

// 데이터베이스 인스턴스 가져오기
$db = Database::getInstance();

// 세션 생성
$sessionId = $db->createSession(
    userId: $_SESSION['user_id'] ?? null,
    questionId: 10,
    difficulty: 'medium',
    inhaleDuration: 4,
    exhaleDuration: 7,
    totalCycles: 3
);

// 세션 완료
$db->completeSession($sessionId, 3, 33);

// 사용자 통계 조회
$stats = $db->getUserStats($_SESSION['user_id']);
echo json_encode($stats);
?>
```

## 보안 고려사항

1. **API 토큰 보안**: Moodle API 토큰은 안전하게 저장하고 HTTPS를 통해서만 전송
2. **SQL Injection 방지**: PDO Prepared Statements 사용
3. **XSS 방지**: 사용자 입력 sanitization
4. **CORS**: 신뢰할 수 있는 도메인만 허용
5. **Rate Limiting**: API 남용 방지를 위한 요청 제한 (향후 구현 예정)

## 버전 히스토리

- **v1.0.0** (2025-11-18): 초기 릴리스
  - Moodle API 통합
  - 호흡 세션 관리
  - 통계 기능

---

더 많은 정보는 [README.md](../README.md)를 참조하세요.
