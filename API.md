# Log Heat API 문서

## 기본 정보

- **Base URL**: `http://localhost:5000/api`
- **응답 형식**: JSON
- **인증**: 현재 버전에서는 인증 없음 (프로덕션에서는 추가 필요)

## 공통 응답 형식

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
  "error": "Error message"
}
```

---

## 엔드포인트

### 1. Health Check

서버 상태 확인

**엔드포인트**: `GET /health`

**응답 예시**:
```json
{
  "success": true,
  "message": "Log Heat API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. 히트 데이터 조회

특정 시간 윈도우의 히트 데이터 조회

**엔드포인트**: `GET /heat`

**쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `timeWindow` | string | No | `1h` | 시간 윈도우 (`1h`, `6h`, `24h`, `7d`, `30d`) |
| `userId` | number | No | - | 특정 사용자 필터 |
| `courseId` | number | No | - | 특정 코스 필터 |
| `calculate` | boolean | No | `false` | `true`면 실시간 계산, `false`면 저장된 데이터 조회 |

**요청 예시**:
```bash
GET /api/heat?timeWindow=24h&calculate=true
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "userId": null,
    "courseId": null,
    "timeWindow": "24h",
    "windowStart": "2024-01-14T10:30:00.000Z",
    "windowEnd": "2024-01-15T10:30:00.000Z",
    "logCount": 1523,
    "changeRate": 75.5,
    "heatScore": 82.3,
    "colorTemperature": "#FF6600",
    "metadata": {
      "previousCount": 867,
      "eventStats": {
        "course_viewed": 450,
        "quiz_attempted": 230,
        "assignment_submitted": 180
      },
      "heatLevel": "High"
    }
  }
}
```

---

### 3. 모든 시간 윈도우 히트 데이터

모든 시간 윈도우의 히트 데이터를 한 번에 조회

**엔드포인트**: `GET /heat/all`

**쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `userId` | number | No | 특정 사용자 필터 |
| `courseId` | number | No | 특정 코스 필터 |

**요청 예시**:
```bash
GET /api/heat/all?userId=123
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "timeWindow": "1h",
      "logCount": 85,
      "changeRate": 45.2,
      "heatScore": 52.1,
      "colorTemperature": "#00FF66",
      "metadata": { ... }
    },
    {
      "timeWindow": "6h",
      "logCount": 412,
      "changeRate": 68.3,
      "heatScore": 71.5,
      "colorTemperature": "#FFCC00",
      "metadata": { ... }
    },
    // ... 더 많은 시간 윈도우
  ]
}
```

---

### 4. 히트맵 데이터

시간별 히트 데이터 (시각화용)

**엔드포인트**: `GET /heat/heatmap`

**쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `hours` | number | No | `24` | 과거 몇 시간 |
| `userId` | number | No | - | 특정 사용자 필터 |
| `courseId` | number | No | - | 특정 코스 필터 |

**요청 예시**:
```bash
GET /api/heat/heatmap?hours=48
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "hour": "2024-01-14T10:00:00.000Z",
      "logCount": 67,
      "changeRate": 35.2,
      "heatScore": 48.1,
      "colorTemperature": "#00AACC",
      "heatLevel": "Low"
    },
    {
      "hour": "2024-01-14T11:00:00.000Z",
      "logCount": 92,
      "changeRate": 52.8,
      "heatScore": 61.3,
      "colorTemperature": "#FFCC00",
      "heatLevel": "Medium"
    },
    // ... 시간별 데이터
  ]
}
```

---

### 5. 사용자별 히트 랭킹

가장 활동적인 사용자 랭킹

**엔드포인트**: `GET /heat/ranking`

**쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `limit` | number | No | `10` | 상위 N명 |
| `timeWindow` | string | No | `24h` | 시간 윈도우 |

**요청 예시**:
```bash
GET /api/heat/ranking?limit=5&timeWindow=7d
```

**응답 예시**:
```json
{
  "success": true,
  "data": [
    {
      "userId": 123,
      "heatScore": 95.7,
      "logCount": 2340,
      "changeRate": 88.5,
      "colorTemperature": "#FF3300"
    },
    {
      "userId": 456,
      "heatScore": 87.2,
      "logCount": 1890,
      "changeRate": 76.3,
      "colorTemperature": "#FF6600"
    },
    // ... 더 많은 사용자
  ]
}
```

---

### 6. 로그 통계

로그 이벤트 통계

**엔드포인트**: `GET /logs/stats`

**쿼리 파라미터**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `userId` | number | No | 특정 사용자 필터 |
| `courseId` | number | No | 특정 코스 필터 |

**요청 예시**:
```bash
GET /api/logs/stats?courseId=42
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "totalLogs": 1523,
    "period": "24h",
    "eventStats": {
      "course_viewed": 450,
      "quiz_attempted": 230,
      "assignment_submitted": 180,
      "forum_post_created": 120,
      "resource_viewed": 543
    }
  }
}
```

---

### 7. Moodle 동기화

Moodle에서 로그 데이터 가져와 DB에 저장

**엔드포인트**: `POST /sync`

**요청 바디**:

```json
{
  "timefrom": 1699000000,  // Unix timestamp (초)
  "timeto": 1699100000,    // Unix timestamp (초)
  "userId": 123,           // 선택사항
  "courseId": 42           // 선택사항
}
```

**요청 예시**:
```bash
POST /api/sync
Content-Type: application/json

{
  "timefrom": 1699000000,
  "timeto": 1699100000
}
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "fetched": 1500,  // Moodle에서 가져온 로그 개수
    "saved": 1485     // DB에 저장된 로그 개수 (중복 제외)
  }
}
```

---

### 8. Moodle 연결 테스트

Moodle 연결 상태 확인

**엔드포인트**: `GET /moodle/test`

**요청 예시**:
```bash
GET /api/moodle/test
```

**응답 예시** (성공):
```json
{
  "success": true,
  "data": {
    "sitename": "KAIST Moodle",
    "release": "Moodle 3.7.0",
    "fullname": "Admin User",
    "userid": 2,
    "username": "admin"
  }
}
```

**응답 예시** (실패):
```json
{
  "success": false,
  "error": "Moodle API Error: Invalid token"
}
```

---

## 색 온도 (Color Temperature) 값

히트 스코어와 변화율에 따라 다음과 같은 색상이 할당됩니다:

| 변화율 | HEX 색상 | 의미 |
|--------|----------|------|
| 0-20% | `#0066FF` | 파란색 - 매우 낮은 활동 |
| 20-40% | `#00AACC` | 청록색 - 낮은 활동 |
| 40-60% | `#00FF66` | 초록색 - 보통 활동 |
| 60-80% | `#FFCC00` | 노란색 - 높은 활동 |
| 80-100% | `#FF6600` | 주황색 - 매우 높은 활동 |
| 100%+ | `#FF3300` | 빨간색 - 극도로 높은 활동 |

## 히트 레벨 (Heat Level)

히트 스코어에 따른 레벨:

| 히트 스코어 | 레벨 |
|-------------|------|
| 0-20 | Very Low |
| 20-40 | Low |
| 40-60 | Medium |
| 60-80 | High |
| 80-100 | Very High |

## 시간 윈도우 (Time Window)

사용 가능한 시간 윈도우:

| 값 | 의미 | 초 단위 |
|----|------|---------|
| `1h` | 1시간 | 3,600 |
| `6h` | 6시간 | 21,600 |
| `24h` | 24시간 | 86,400 |
| `7d` | 7일 | 604,800 |
| `30d` | 30일 | 2,592,000 |

## 에러 코드

| HTTP 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (파라미터 오류) |
| 404 | 엔드포인트 없음 |
| 500 | 서버 내부 오류 |

## 사용 예시

### cURL

```bash
# 히트 데이터 조회
curl http://localhost:5000/api/heat?timeWindow=24h&calculate=true

# 히트맵 데이터
curl http://localhost:5000/api/heat/heatmap?hours=24

# Moodle 동기화
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"timefrom": 1699000000, "timeto": 1699100000}'
```

### JavaScript (Fetch API)

```javascript
// 히트 데이터 조회
const response = await fetch('http://localhost:5000/api/heat?timeWindow=1h&calculate=true');
const data = await response.json();
console.log(data);

// Moodle 동기화
const syncResponse = await fetch('http://localhost:5000/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timefrom: Math.floor(Date.now() / 1000) - 3600,
    timeto: Math.floor(Date.now() / 1000)
  })
});
const syncData = await syncResponse.json();
console.log(syncData);
```

### Python (requests)

```python
import requests
import time

# 히트 데이터 조회
response = requests.get('http://localhost:5000/api/heat', params={
    'timeWindow': '24h',
    'calculate': 'true'
})
data = response.json()
print(data)

# Moodle 동기화
sync_response = requests.post('http://localhost:5000/api/sync', json={
    'timefrom': int(time.time()) - 3600,
    'timeto': int(time.time())
})
sync_data = sync_response.json()
print(sync_data)
```

---

## 변경 이력

### v1.0.0 (2024-01-15)
- 초기 API 릴리스
- 기본 히트 데이터 조회 기능
- Moodle 연동 기능
- 히트맵 및 랭킹 기능
