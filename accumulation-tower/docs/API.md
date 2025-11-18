# Accumulation Tower API 문서

Backend API 엔드포인트 및 Socket.io 이벤트 문서입니다.

---

## 📡 Base URL

```
http://localhost:3001
```

---

## 🔌 REST API 엔드포인트

### 1. Health Check

서버 상태를 확인합니다.

**Endpoint:** `GET /api/health`

**응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T10:00:00.000Z",
  "service": "Accumulation Tower API"
}
```

---

### 2. 사용자 정보 조회

**Endpoint:** `GET /api/user/:userId`

**파라미터:**
- `userId` (number, required): Moodle 사용자 ID

**응답 성공 (200):**
```json
{
  "id": 2,
  "fullname": "홍길동",
  "email": "hong@example.com"
}
```

**응답 실패 (404):**
```json
{
  "error": "User not found"
}
```

**예시:**
```bash
curl http://localhost:3001/api/user/2
```

---

### 3. 누적 점수 및 타워 데이터 조회

**Endpoint:** `GET /api/accumulation/:userId/:courseId`

**파라미터:**
- `userId` (number, required): Moodle 사용자 ID
- `courseId` (number, required): Moodle 코스 ID

**응답 성공 (200):**
```json
{
  "userId": 2,
  "courseId": 1,
  "totalScore": 85.5,
  "totalPercentage": 85.5,
  "layers": [
    {
      "id": 1,
      "name": "퀴즈 1: 덧셈",
      "score": 18,
      "maxScore": 20,
      "percentage": 90,
      "height": 54,
      "color": "#4CAF50",
      "timestamp": 1700000000
    },
    {
      "id": 2,
      "name": "퀴즈 2: 뺄셈",
      "score": 16,
      "maxScore": 20,
      "percentage": 80,
      "height": 48,
      "color": "#8BC34A",
      "timestamp": 1700010000
    }
  ],
  "height": 102
}
```

**예시:**
```bash
curl http://localhost:3001/api/accumulation/2/1
```

---

### 4. 성적 상세 정보 조회

**Endpoint:** `GET /api/grades/:userId/:courseId`

**파라미터:**
- `userId` (number, required): Moodle 사용자 ID
- `courseId` (number, required): Moodle 코스 ID

**응답 성공 (200):**
```json
{
  "totalScore": 85.5,
  "maxScore": 100,
  "percentage": 85.5,
  "items": [
    {
      "name": "퀴즈 1: 덧셈",
      "score": 18,
      "maxScore": 20,
      "percentage": 90,
      "timestamp": 1700000000
    }
  ]
}
```

---

### 5. 코스의 퀴즈 목록 조회

**Endpoint:** `GET /api/quizzes/:courseId`

**파라미터:**
- `courseId` (number, required): Moodle 코스 ID

**응답 성공 (200):**
```json
{
  "quizzes": [
    {
      "id": 1,
      "course": 1,
      "name": "퀴즈 1: 덧셈",
      "intro": "덧셈 실력을 테스트합니다",
      "timeopen": 1700000000,
      "timeclose": 1700100000
    }
  ]
}
```

---

### 6. 퀴즈 시도 정보 조회

**Endpoint:** `GET /api/quiz-attempts/:quizId/:userId`

**파라미터:**
- `quizId` (number, required): 퀴즈 ID
- `userId` (number, required): Moodle 사용자 ID

**응답 성공 (200):**
```json
{
  "attempts": [
    {
      "id": 1,
      "quiz": 1,
      "userid": 2,
      "attempt": 1,
      "sumgrades": 18,
      "timefinish": 1700001000,
      "state": "finished"
    }
  ]
}
```

---

## ⚡ Socket.io 이벤트

### 연결

**클라이언트 → 서버**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

### 이벤트 목록

#### 1. subscribe

사용자의 점수를 구독하여 실시간 업데이트를 받습니다.

**클라이언트 → 서버:**
```javascript
socket.emit('subscribe', {
  userId: 2,
  courseId: 1
});
```

**서버 → 클라이언트 (초기 데이터):**
```javascript
socket.on('tower-update', (data) => {
  console.log('Tower data:', data);
  // data 구조는 GET /api/accumulation/:userId/:courseId와 동일
});
```

---

#### 2. unsubscribe

구독을 해제합니다.

**클라이언트 → 서버:**
```javascript
socket.emit('unsubscribe');
```

---

#### 3. refresh

수동으로 데이터를 새로고침합니다.

**클라이언트 → 서버:**
```javascript
socket.emit('refresh');
```

**서버 → 클라이언트:**
```javascript
socket.on('tower-update', (data) => {
  // 최신 타워 데이터
});
```

---

#### 4. tower-update

서버가 주기적으로 또는 수동 새로고침 시 타워 데이터를 전송합니다.

**서버 → 클라이언트:**
```javascript
socket.on('tower-update', (data) => {
  console.log('Updated tower data:', data);
  /*
  {
    userId: 2,
    courseId: 1,
    totalScore: 85.5,
    layers: [...],
    height: 102
  }
  */
});
```

**업데이트 주기:**
- 기본값: 5초 (환경 변수 `SCORE_UPDATE_INTERVAL`로 설정 가능)

---

#### 5. error

오류가 발생했을 때 서버에서 전송합니다.

**서버 → 클라이언트:**
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // { message: "Error description" }
});
```

---

#### 6. disconnect

연결이 해제될 때 발생합니다.

**클라이언트 → 서버:**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## 🔧 사용 예시

### React에서 사용

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function TowerComponent({ userId, courseId }) {
  const [towerData, setTowerData] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 소켓 연결
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // 이벤트 리스너
    newSocket.on('connect', () => {
      console.log('Connected');
      newSocket.emit('subscribe', { userId, courseId });
    });

    newSocket.on('tower-update', (data) => {
      setTowerData(data);
    });

    newSocket.on('error', (error) => {
      console.error('Error:', error);
    });

    // 정리
    return () => {
      newSocket.emit('unsubscribe');
      newSocket.disconnect();
    };
  }, [userId, courseId]);

  // 수동 새로고침
  const handleRefresh = () => {
    if (socket) {
      socket.emit('refresh');
    }
  };

  return (
    <div>
      <button onClick={handleRefresh}>새로고침</button>
      {towerData && (
        <div>
          <p>총점: {towerData.totalScore}</p>
          {/* 타워 시각화 */}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 데이터 모델

### TowerData

```typescript
interface TowerData {
  userId: number;
  courseId: number;
  totalScore: number;        // 총 점수
  totalPercentage: number;   // 전체 달성률 (0-100)
  layers: Layer[];           // 타워 층 배열
  height: number;            // 타워 총 높이 (픽셀)
}
```

### Layer

```typescript
interface Layer {
  id: number;                // 레이어 ID
  name: string;              // 항목 이름 (예: "퀴즈 1")
  score: number;             // 획득 점수
  maxScore: number;          // 최대 점수
  percentage: number;        // 달성률 (0-100)
  height: number;            // 레이어 높이 (픽셀)
  color: string;             // 색상 코드 (hex)
  timestamp: number;         // 제출 시간 (Unix timestamp)
}
```

---

## 🔒 보안 고려사항

### 인증 (현재 미구현)

현재 버전은 인증이 없습니다. 프로덕션 환경에서는 다음을 구현하세요:

1. **JWT 토큰 인증**
2. **Moodle SSO 연동**
3. **세션 관리**

### Rate Limiting

현재 Rate Limiting이 없습니다. 프로덕션에서는 추가 권장:

```javascript
// Express Rate Limiting 예시
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // 최대 100 요청
});

app.use('/api/', limiter);
```

---

## 🐛 에러 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (파라미터 오류) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

**에러 응답 형식:**
```json
{
  "error": "Error message",
  "details": "Optional detailed description"
}
```

---

## 📝 변경 이력

- **v1.0.0** (2025-11-18): 초기 API 릴리스
