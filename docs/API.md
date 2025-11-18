# Light Interval API Documentation

Base URL: `http://localhost:3001/api`

## 인증

현재 버전에서는 인증이 구현되어 있지 않습니다. 프로덕션 환경에서는 JWT 또는 OAuth를 사용하여 인증을 구현해야 합니다.

## 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

### 실패 응답
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ] // 유효성 검사 오류 시
}
```

---

## 문제 (Problems) API

### GET /api/problems
모든 문제 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "기본 부등식 1",
      "description": "x가 2보다 큰 경우를 찾으세요",
      "inequality": "x > 2",
      "moodle_id": null,
      "difficulty_level": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/problems/:id
특정 문제 조회

**Parameters:**
- `id` (integer, required): 문제 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "기본 부등식 1",
    "description": "x가 2보다 큰 경우를 찾으세요",
    "inequality": "x > 2",
    "moodle_id": null,
    "difficulty_level": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/problems
새 문제 생성

**Request Body:**
```json
{
  "title": "새 문제",
  "description": "문제 설명",
  "inequality": "x > 5",
  "difficulty_level": 2,
  "moodle_id": "optional_moodle_id"
}
```

**Validation:**
- `title`: 필수, 공백 불가
- `description`: 필수, 공백 불가
- `inequality`: 필수, 공백 불가
- `difficulty_level`: 필수, 1-5 사이의 정수
- `moodle_id`: 선택

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 8,
    "title": "새 문제",
    ...
  }
}
```

### PUT /api/problems/:id
문제 수정

**Parameters:**
- `id` (integer, required): 문제 ID

**Request Body:**
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "inequality": "x >= 3",
  "difficulty_level": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "수정된 제목",
    ...
  }
}
```

### DELETE /api/problems/:id
문제 삭제

**Parameters:**
- `id` (integer, required): 문제 ID

**Response:**
```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

---

## Moodle 연동 API

### GET /api/moodle/test
Moodle 연결 테스트

**Response:**
```json
{
  "success": true,
  "message": "Moodle connected successfully"
}
```

### GET /api/moodle/quiz/:quizId/questions
Moodle 퀴즈의 문제 목록 조회

**Parameters:**
- `quizId` (string, required): Moodle 퀴즈 ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "부등식 문제 1",
      "questiontext": "x > 2를 만족하는 x의 범위는?",
      "questiontype": "shortanswer"
    }
  ]
}
```

### GET /api/moodle/question/:questionId
특정 Moodle 문제 조회

**Parameters:**
- `questionId` (string, required): Moodle 문제 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "부등식 문제 1",
    "questiontext": "x > 2를 만족하는 x의 범위는?",
    "questiontype": "shortanswer",
    "answer": "x > 2"
  }
}
```

### POST /api/moodle/sync/:quizId
Moodle 퀴즈에서 문제 동기화

이 엔드포인트는 Moodle 퀴즈의 문제들을 로컬 데이터베이스로 가져옵니다.

**Parameters:**
- `quizId` (string, required): Moodle 퀴즈 ID

**Response:**
```json
{
  "success": true,
  "message": "Synced 5 questions from Moodle",
  "data": [
    {
      "id": 8,
      "moodleId": "123",
      "action": "created"
    },
    {
      "id": 9,
      "moodleId": "124",
      "action": "updated"
    }
  ]
}
```

---

## 헬스 체크

### GET /health
서버 상태 확인

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600.5
}
```

---

## 에러 코드

| HTTP 상태 코드 | 설명 |
|--------------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

---

## 예제

### cURL로 문제 생성
```bash
curl -X POST http://localhost:3001/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 문제",
    "description": "부등식 테스트",
    "inequality": "x > 10",
    "difficulty_level": 2
  }'
```

### JavaScript (Axios)로 문제 조회
```javascript
import axios from 'axios';

const response = await axios.get('http://localhost:3001/api/problems');
console.log(response.data);
```

### Moodle 퀴즈 동기화
```bash
curl -X POST http://localhost:3001/api/moodle/sync/456 \
  -H "Content-Type: application/json"
```

---

## 향후 개선 사항

- [ ] 사용자 인증 및 권한 관리
- [ ] 페이지네이션
- [ ] 검색 및 필터링
- [ ] Rate limiting
- [ ] API 버전 관리
- [ ] WebSocket 실시간 업데이트
