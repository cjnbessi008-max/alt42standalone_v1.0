# EquaMap API 문서

## 개요

EquaMap API는 Moodle LMS와 연동하여 방정식 문제를 관리하고 시각화하는 RESTful API입니다.

## 기본 정보

- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json`
- **인코딩**: UTF-8

## 엔드포인트

### 1. 시스템 상태

#### Moodle 연결 상태 확인

```
GET /moodle/health
```

**응답 예시**:
```json
{
  "status": "ok",
  "sitename": "KAIST Touch Math Academy",
  "version": "3.7"
}
```

### 2. 문제 관리

#### 특정 문제 정보 가져오기

```
GET /moodle/question/{questionId}
```

**파라미터**:
- `questionId` (int): Moodle 문제 ID

**응답 예시**:
```json
{
  "id": 123,
  "expression": "2x + 5 = 3x - 7",
  "type": "linear",
  "title": "일차방정식 - 기본",
  "questionText": "다음 방정식을 풀어라: 2x + 5 = 3x - 7",
  "difficulty": "easy"
}
```

#### 퀴즈 문제 목록 가져오기

```
GET /moodle/quiz/{quizId}/questions
```

**파라미터**:
- `quizId` (int): Moodle 퀴즈 ID

**응답 예시**:
```json
[
  {
    "id": 123,
    "expression": "2x + 5 = 3x - 7",
    "type": "linear",
    "title": "일차방정식 - 기본",
    "difficulty": "easy"
  },
  {
    "id": 124,
    "expression": "x^2 - 5x + 6 = 0",
    "type": "quadratic",
    "title": "이차방정식",
    "difficulty": "medium"
  }
]
```

### 3. 답안 제출

#### 학생 답안 제출

```
POST /moodle/submit
```

**요청 본문**:
```json
{
  "questionId": 123,
  "answer": {
    "attemptId": 456,
    "responses": {
      "answer": "x = 12"
    }
  }
}
```

**응답 예시**:
```json
{
  "success": true,
  "result": {
    "attemptid": 456,
    "state": "finished"
  }
}
```

## 방정식 데이터 형식

### 방정식 타입

- `linear`: 일차방정식
- `quadratic`: 이차방정식
- `arithmetic`: 산술식
- `system`: 연립방정식
- `other`: 기타

### 난이도

- `easy`: 쉬움
- `medium`: 보통
- `hard`: 어려움

### 시각화 그래프 형식

프론트엔드로 전달되는 방정식은 다음과 같이 파싱됩니다:

```json
{
  "nodes": [
    {
      "id": "node-0",
      "data": { "label": "방정식" },
      "position": { "x": 150, "y": 50 },
      "style": { "background": "#667eea", "color": "white" }
    },
    {
      "id": "node-1",
      "data": { "label": "2x + 5" },
      "position": { "x": 100, "y": 150 },
      "style": { "background": "#48bb78", "color": "white" }
    }
  ],
  "edges": [
    {
      "id": "edge-0-1",
      "source": "node-0",
      "target": "node-1",
      "label": "좌변",
      "animated": true
    }
  ]
}
```

## 오류 처리

모든 API 오류는 다음 형식으로 반환됩니다:

```json
{
  "error": "오류 메시지",
  "code": 500
}
```

### HTTP 상태 코드

- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

## 예제

### cURL 예제

```bash
# Moodle 연결 확인
curl http://localhost:8000/api/moodle/health

# 문제 가져오기
curl http://localhost:8000/api/moodle/question/123

# 답안 제출
curl -X POST http://localhost:8000/api/moodle/submit \
  -H "Content-Type: application/json" \
  -d '{"questionId": 123, "answer": {"attemptId": 456, "responses": {"answer": "x = 12"}}}'
```

### JavaScript (Axios) 예제

```javascript
import axios from 'axios'

// 문제 가져오기
const response = await axios.get('/api/moodle/question/123')
console.log(response.data)

// 답안 제출
await axios.post('/api/moodle/submit', {
  questionId: 123,
  answer: {
    attemptId: 456,
    responses: { answer: 'x = 12' }
  }
})
```

## 인증

현재 버전은 인증이 필요하지 않습니다. Moodle Web Service 토큰은 백엔드에서 관리됩니다.

향후 버전에서 JWT 기반 인증이 추가될 예정입니다.
