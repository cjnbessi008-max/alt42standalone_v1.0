# API 상세 문서

## 인증

현재 버전은 인증이 구현되지 않았습니다. 프로덕션 환경에서는 JWT 또는 OAuth 2.0을 사용하세요.

미래 버전:
```http
Authorization: Bearer <token>
```

## Confusion Tracking API

### POST /api/confusion/metrics

행동 데이터를 제출하여 혼란도를 업데이트합니다.

**요청:**
```http
POST /api/confusion/metrics
Content-Type: application/json

{
  "studentId": "student-001",
  "conceptId": "concept-001",
  "metrics": {
    "timeSpent": 120,
    "attemptCount": 3,
    "isCorrect": false,
    "hesitationTime": 15,
    "helpRequestCount": 1,
    "mouseMovementScore": 45,
    "inputChangeCount": 7,
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

**응답:**
```json
{
  "studentId": "student-001",
  "studentName": "학생 student-001",
  "moduleId": "module-fractions-01",
  "overallConfusion": 48,
  "conceptConfusion": [
    {
      "conceptId": "concept-001",
      "conceptName": "분수의 덧셈",
      "confusionLevel": 55,
      "category": "MEDIUM",
      "color": "#eab308",
      "metrics": { /* ... */ },
      "history": []
    }
  ],
  "confusionHistory": [],
  "lastUpdated": "2025-11-18T10:30:00Z",
  "needsIntervention": false
}
```

### GET /api/confusion/student/:studentId

학생의 현재 혼란도 상태를 조회합니다.

**요청:**
```http
GET /api/confusion/student/student-001?moduleId=module-fractions-01
```

**응답:**
```json
{
  "studentId": "student-001",
  "studentName": "학생 student-001",
  "moduleId": "module-fractions-01",
  "overallConfusion": 35,
  "conceptConfusion": [ /* ... */ ],
  "confusionHistory": [ /* ... */ ],
  "lastUpdated": "2025-11-18T10:30:00Z",
  "needsIntervention": false
}
```

### GET /api/confusion/concept/:conceptId

특정 개념의 혼란도를 조회합니다.

**요청:**
```http
GET /api/confusion/concept/concept-001?studentId=student-001
```

**응답:**
```json
{
  "conceptId": "concept-001",
  "conceptName": "분수의 덧셈",
  "confusionLevel": 25,
  "category": "LOW",
  "color": "#84cc16",
  "metrics": {
    "timeSpent": 45,
    "attemptCount": 2,
    "isCorrect": true,
    "hesitationTime": 8,
    "helpRequestCount": 0,
    "mouseMovementScore": 25,
    "inputChangeCount": 3,
    "timestamp": "2025-11-18T10:30:00Z"
  },
  "history": []
}
```

### GET /api/confusion/classroom/:classId

교실 전체의 혼란도 분석을 조회합니다.

**요청:**
```http
GET /api/confusion/classroom/class-001?moduleId=module-fractions-01
```

**응답:**
```json
{
  "classId": "class-001",
  "averageConfusion": 42,
  "distribution": {
    "VERY_LOW": 3,
    "LOW": 5,
    "MEDIUM": 8,
    "HIGH": 4,
    "VERY_HIGH": 2
  },
  "studentsNeedingHelp": [],
  "difficultConcepts": [],
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### GET /api/confusion/history/:studentId

학생의 혼란도 이력을 조회합니다.

**요청:**
```http
GET /api/confusion/history/student-001?startDate=2025-11-01&endDate=2025-11-18
```

**응답:**
```json
[
  {
    "timestamp": "2025-11-18T09:00:00Z",
    "confusionLevel": 35,
    "category": "LOW",
    "conceptId": "concept-001"
  },
  {
    "timestamp": "2025-11-18T10:00:00Z",
    "confusionLevel": 48,
    "category": "MEDIUM",
    "conceptId": "concept-002"
  }
]
```

## LMS Integration API

### POST /api/lms/initialize

LMS 세션을 초기화합니다.

**요청:**
```http
POST /api/lms/initialize
Content-Type: application/json

{
  "platform": "Canvas",
  "courseId": "course-123",
  "activityId": "activity-456",
  "lmsUserId": "user-789",
  "ltiData": { /* LTI launch 데이터 */ }
}
```

**응답:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### POST /api/lms/sync

LMS에서 학생 데이터를 동기화합니다.

**요청:**
```http
POST /api/lms/sync
Content-Type: application/json

{
  "courseId": "course-123"
}
```

**응답:**
```json
{
  "synced": 45
}
```

### POST /api/lms/progress

학습 진도를 LMS로 전송합니다.

**요청:**
```http
POST /api/lms/progress
Content-Type: application/json

{
  "studentId": "student-001",
  "activityId": "activity-456",
  "score": 85,
  "completed": true
}
```

**응답:**
```json
{
  "success": true
}
```

### GET /api/lms/course/:courseId

LMS 코스 구조를 조회합니다.

**요청:**
```http
GET /api/lms/course/course-123
```

**응답:**
```json
{
  "id": "course-123",
  "name": "수학 기초 과정",
  "modules": [
    {
      "id": "module-fractions-01",
      "name": "분수의 이해",
      "activities": [
        {
          "id": "activity-001",
          "name": "분수의 덧셈",
          "type": "practice"
        }
      ]
    }
  ]
}
```

## Module/Content API

### GET /api/modules

사용 가능한 모듈 목록을 조회합니다.

**요청:**
```http
GET /api/modules?studentId=student-001
```

**응답:**
```json
[
  {
    "id": "module-fractions-01",
    "name": "분수의 이해",
    "description": "분수의 기본 개념과 연산을 학습합니다",
    "subject": "mathematics",
    "gradeLevel": "초등 4학년",
    "conceptCount": 3
  }
]
```

### GET /api/modules/:moduleId

모듈 상세 정보를 조회합니다.

**요청:**
```http
GET /api/modules/module-fractions-01
```

**응답:**
```json
{
  "id": "module-fractions-01",
  "name": "분수의 이해",
  "description": "분수의 기본 개념과 연산을 학습합니다",
  "concepts": [
    {
      "id": "concept-001",
      "name": "분수의 덧셈",
      "difficulty": 1
    }
  ]
}
```

### POST /api/modules/:moduleId/submit

문제 답안을 제출합니다.

**요청:**
```http
POST /api/modules/module-fractions-01/submit
Content-Type: application/json

{
  "problemId": "problem-001",
  "answer": "3/4"
}
```

**응답:**
```json
{
  "correct": true,
  "feedback": "정답입니다! 잘하셨어요."
}
```

## WebSocket API

### 연결

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/confusion/student-001');
```

### 이벤트

#### CONNECTION_ESTABLISHED

연결이 성공하면 서버가 전송합니다.

```json
{
  "type": "CONNECTION_ESTABLISHED",
  "studentId": "student-001",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

#### CONFUSION_EVENT

혼란도 변화가 있을 때 서버가 전송합니다.

```json
{
  "eventType": "CONFUSION_INCREASE",
  "studentId": "student-001",
  "conceptId": "concept-002",
  "previousLevel": 35,
  "currentLevel": 55,
  "timestamp": "2025-11-18T10:30:00Z"
}
```

이벤트 타입:
- `CONFUSION_INCREASE`: 혼란도 증가
- `CONFUSION_DECREASE`: 혼란도 감소
- `HELP_NEEDED`: 도움 필요
- `MASTERY_ACHIEVED`: 숙달 달성

## 에러 응답

모든 API는 에러 시 다음 형식으로 응답합니다:

```json
{
  "error": "Error message here"
}
```

HTTP 상태 코드:
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류
