# Truth Rhythm API 문서

## 개요

Truth Rhythm은 RESTful API를 제공하여 문제 관리, 사용자 인증, Moodle 연동을 지원합니다.

**Base URL**: `/api/`

**응답 형식**: JSON

## 인증 (Authentication)

### POST /api/auth.php?action=login

사용자 로그인

**요청 본문**:
```json
{
  "username": "student123"
}
```

**성공 응답** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "student123",
      "email": "student123@example.com",
      "moodle_user_id": 42
    },
    "progress": {
      "total_questions_attempted": 50,
      "total_correct": 42,
      "accuracy_rate": 84.0,
      "current_streak": 5,
      "best_streak": 12
    }
  }
}
```

### GET /api/auth.php

세션 확인

**성공 응답** (200):
```json
{
  "success": true,
  "data": {
    "logged_in": true,
    "user": {
      "id": 1,
      "username": "student123",
      "email": "student123@example.com"
    },
    "progress": {
      "total_questions_attempted": 50,
      "total_correct": 42,
      "accuracy_rate": 84.0,
      "current_streak": 5,
      "best_streak": 12
    }
  }
}
```

### POST /api/auth.php?action=logout

로그아웃

**성공 응답** (200):
```json
{
  "success": true,
  "message": "Logout successful",
  "data": []
}
```

## 문제 관리 (Questions)

### GET /api/questions.php

문제 목록 조회

**쿼리 파라미터**:
- `page` (optional): 페이지 번호 (기본: 1)
- `limit` (optional): 페이지당 항목 수 (기본: 10)
- `difficulty` (optional): 난이도 (`easy`, `medium`, `hard`)
- `category` (optional): 카테고리

**예시**:
```
GET /api/questions.php?page=1&limit=10&difficulty=medium
```

**성공 응답** (200):
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "question_text": "2 + 2 = 4",
        "correct_answer": true,
        "difficulty_level": "easy",
        "category": "arithmetic",
        "explanation": "2 더하기 2는 4입니다.",
        "created_at": "2025-01-15 10:30:00"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### GET /api/questions.php?id={id}

특정 문제 조회

**예시**:
```
GET /api/questions.php?id=1
```

**성공 응답** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "question_text": "2 + 2 = 4",
    "correct_answer": true,
    "difficulty_level": "easy",
    "category": "arithmetic",
    "explanation": "2 더하기 2는 4입니다."
  }
}
```

### GET /api/questions.php?random=1

랜덤 문제 조회

**쿼리 파라미터**:
- `difficulty` (optional): 난이도 필터
- `category` (optional): 카테고리 필터

**예시**:
```
GET /api/questions.php?random=1&difficulty=medium
```

**성공 응답** (200):
```json
{
  "success": true,
  "data": {
    "id": 42,
    "question_text": "물의 끓는점은 섭씨 100도이다",
    "correct_answer": true,
    "difficulty_level": "medium",
    "category": "science",
    "explanation": "표준 기압에서 물은 섭씨 100도에서 끓습니다."
  }
}
```

### POST /api/questions.php

답안 제출 (인증 필요)

**요청 본문**:
```json
{
  "question_id": 1,
  "user_answer": true,
  "response_time": 5000,
  "session_id": 123
}
```

**필드 설명**:
- `question_id`: 문제 ID (필수)
- `user_answer`: 사용자 답변 (true/false, 필수)
- `response_time`: 응답 시간 (밀리초, 선택)
- `session_id`: 학습 세션 ID (선택, 없으면 자동 생성)

**성공 응답** (200):
```json
{
  "success": true,
  "message": "정답입니다!",
  "data": {
    "is_correct": true,
    "correct_answer": true,
    "explanation": "2 더하기 2는 4입니다.",
    "sound_file": "true-rhythm.mp3",
    "session_id": 123
  }
}
```

### PUT /api/questions.php

문제 업데이트 (관리자용, 인증 필요)

**요청 본문**:
```json
{
  "id": 1,
  "question_text": "수정된 문제 텍스트",
  "correct_answer": false,
  "explanation": "수정된 설명"
}
```

**성공 응답** (200):
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": 1
  }
}
```

### DELETE /api/questions.php?id={id}

문제 삭제 (비활성화, 관리자용, 인증 필요)

**예시**:
```
DELETE /api/questions.php?id=1
```

**성공 응답** (200):
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": {
    "id": 1
  }
}
```

## Moodle 연동

### GET /api/moodle-connector.php?action=test

Moodle 연결 테스트

**성공 응답** (200):
```json
{
  "success": true,
  "data": {
    "success": true,
    "site_name": "My Moodle Site",
    "moodle_version": "3.7",
    "user": "admin"
  }
}
```

### GET /api/moodle-connector.php?action=questions

Moodle에서 문제 가져오기

**쿼리 파라미터**:
- `category` (optional): Moodle 카테고리 ID
- `limit` (optional): 문제 수 (기본: 10)

**예시**:
```
GET /api/moodle-connector.php?action=questions&limit=20
```

**성공 응답** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "question_text": "Moodle에서 가져온 문제",
      "correct_answer": true,
      "difficulty_level": "medium",
      "category": "general"
    }
  ]
}
```

### POST /api/moodle-connector.php?action=sync

Moodle 문제 동기화 (관리자용, 인증 필요)

**쿼리 파라미터**:
- `category` (optional): Moodle 카테고리 ID
- `limit` (optional): 동기화할 문제 수 (기본: 50)

**성공 응답** (200):
```json
{
  "success": true,
  "message": "Questions synced successfully",
  "data": {
    "synced": 45,
    "failed": 5,
    "total": 50
  }
}
```

## 오류 응답

모든 API는 오류 시 다음 형식으로 응답합니다:

**오류 응답** (4xx/5xx):
```json
{
  "success": false,
  "error": "오류 메시지",
  "details": "추가 세부 정보 (선택사항)"
}
```

### HTTP 상태 코드

- `200`: 성공
- `400`: 잘못된 요청 (파라미터 누락 등)
- `401`: 인증 필요
- `404`: 리소스를 찾을 수 없음
- `405`: 허용되지 않는 메서드
- `500`: 서버 오류

## 사용 예시

### JavaScript (Fetch API)

```javascript
// 로그인
async function login(username) {
  const response = await fetch('/api/auth.php?action=login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ username })
  });

  const data = await response.json();
  return data;
}

// 랜덤 문제 가져오기
async function getRandomQuestion() {
  const response = await fetch('/api/questions.php?random=1', {
    credentials: 'include'
  });

  const data = await response.json();
  return data;
}

// 답안 제출
async function submitAnswer(questionId, userAnswer) {
  const response = await fetch('/api/questions.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      question_id: questionId,
      user_answer: userAnswer,
      response_time: Date.now() - startTime
    })
  });

  const data = await response.json();
  return data;
}
```

### cURL

```bash
# 로그인
curl -X POST http://localhost/truth-rhythm/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"username":"student123"}' \
  -c cookies.txt

# 랜덤 문제 가져오기
curl http://localhost/truth-rhythm/api/questions.php?random=1 \
  -b cookies.txt

# 답안 제출
curl -X POST http://localhost/truth-rhythm/api/questions.php \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "question_id": 1,
    "user_answer": true,
    "response_time": 5000
  }'
```

## 보안 고려사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **세션 관리**: 세션 타임아웃 설정 (기본: 1시간)
3. **CORS**: 허용된 도메인만 API 접근 가능하도록 설정
4. **Rate Limiting**: API 호출 제한 (100회/시간)
5. **입력 검증**: 모든 입력값에 대한 검증 및 sanitization

## 버전 관리

현재 버전: **1.0.0**

API 변경사항은 CHANGELOG.md에서 확인할 수 있습니다.
