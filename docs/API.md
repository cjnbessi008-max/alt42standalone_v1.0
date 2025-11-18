# DMN Drift Tracker - API 문서

## 기본 정보

**Base URL**: `http://your-domain.com/api`

**Content-Type**: `application/json`

**인증**: Bearer Token (선택사항)

## 📡 API 엔드포인트

---

## Sessions API

학습 세션 관리

### 1. 세션 생성

새로운 학습 세션을 시작합니다.

**Endpoint**: `POST /sessions`

**Request Body**:
```json
{
  "student_id": 1,
  "module_name": "Fractions Module"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "session_id": 123,
    "student_id": 1,
    "module_name": "Fractions Module",
    "status": "active",
    "created_at": "2025-11-18 10:30:00"
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Missing required fields: student_id, module_name"
}
```

---

### 2. 세션 조회

세션 상세 정보를 가져옵니다.

**Endpoint**: `GET /sessions/{session_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "student_id": 1,
    "username": "student01",
    "full_name": "John Doe",
    "module_name": "Fractions Module",
    "session_start": "2025-11-18 10:30:00",
    "session_end": null,
    "total_duration_seconds": 1800,
    "activity_count": 45,
    "dmn_drift_score": 35.2,
    "status": "active",
    "total_attempts": 10,
    "correct_attempts": 8,
    "accuracy_rate": 80.00
  }
}
```

---

### 3. 학생 세션 목록

특정 학생의 모든 세션을 조회합니다.

**Endpoint**: `GET /sessions/student/{student_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 123,
        "module_name": "Fractions Module",
        "session_start": "2025-11-18 10:30:00",
        "total_duration_seconds": 1800,
        "dmn_drift_score": 35.2,
        "accuracy_rate": 80.00,
        "status": "completed"
      }
    ]
  }
}
```

---

### 4. 세션 업데이트

세션 정보를 업데이트합니다.

**Endpoint**: `PUT /sessions/{session_id}`

**Request Body**:
```json
{
  "dmn_drift_score": 42.5,
  "activity_count": 10
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Session updated successfully"
  }
}
```

---

### 5. 세션 종료

활성 세션을 종료합니다.

**Endpoint**: `POST /sessions/{session_id}/end`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Session ended successfully"
  }
}
```

---

## Events API

학생 인터랙션 이벤트 추적

### 1. 이벤트 추적

단일 이벤트를 기록합니다.

**Endpoint**: `POST /events`

**Request Body**:
```json
{
  "session_id": 123,
  "event_type": "click",
  "event_data": {
    "element": "BUTTON",
    "id": "submit-btn",
    "x": 450,
    "y": 320
  },
  "response_time_ms": 1250
}
```

**Event Types**:
- `click` - 클릭 이벤트
- `keypress` - 키 입력
- `scroll` - 스크롤
- `focus_loss` - 포커스 손실
- `focus_gain` - 포커스 획득
- `answer_submit` - 답안 제출
- `idle_start` - 휴지 시작
- `idle_end` - 휴지 종료
- `mouse_move` - 마우스 이동

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "event_id": 4567,
    "tracked_at": "2025-11-18 10:35:22"
  }
}
```

---

### 2. 배치 이벤트 추적

여러 이벤트를 한 번에 기록합니다 (성능 최적화).

**Endpoint**: `POST /events/batch`

**Request Body**:
```json
{
  "events": [
    {
      "session_id": 123,
      "event_type": "click",
      "event_data": {"x": 100, "y": 200}
    },
    {
      "session_id": 123,
      "event_type": "scroll",
      "event_data": {"scrollY": 350}
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "events_tracked": 2,
    "tracked_at": "2025-11-18 10:35:30"
  }
}
```

---

### 3. 세션 이벤트 조회

세션의 모든 이벤트를 조회합니다.

**Endpoint**: `GET /events/session/{session_id}`

**Query Parameters**:
- `limit` (optional): 최대 결과 수 (기본: 100)
- `offset` (optional): 오프셋 (기본: 0)
- `event_type` (optional): 특정 이벤트 타입 필터

**Example**:
```
GET /events/session/123?limit=50&event_type=click
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 4567,
        "session_id": 123,
        "student_id": 1,
        "event_type": "click",
        "event_data": {"element": "BUTTON", "x": 450, "y": 320},
        "response_time_ms": 1250,
        "timestamp": "2025-11-18 10:35:22.123"
      }
    ],
    "limit": 50,
    "offset": 0
  }
}
```

---

## Metrics API

DMN drift 메트릭 계산 및 조회

### 1. 메트릭 계산

세션의 DMN drift 메트릭을 계산합니다.

**Endpoint**: `POST /metrics/calculate/{session_id}`

**Request Body** (optional):
```json
{
  "window_start": "2025-11-18 10:30:00",
  "window_end": "2025-11-18 10:35:00"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "metrics": {
      "session_id": 123,
      "student_id": 1,
      "time_window_start": "2025-11-18 10:30:00",
      "time_window_end": "2025-11-18 10:35:00",
      "avg_response_time_ms": 2350.50,
      "response_time_variance": 450.30,
      "response_time_trend": 12.5,
      "accuracy_rate": 75.00,
      "accuracy_trend": -5.2,
      "click_frequency": 8.5,
      "click_pattern_irregularity": 35.0,
      "idle_time_seconds": 45,
      "idle_event_count": 3,
      "focus_loss_count": 2,
      "tab_switch_count": 2,
      "scroll_activity_score": 12.3,
      "dmn_drift_score": 42.8,
      "drift_level": "moderate",
      "intervention_needed": false,
      "recommended_action": "Monitor closely; consider break if score increases",
      "calculated_at": "2025-11-18 10:35:00"
    },
    "message": "Metrics calculated and saved successfully"
  }
}
```

**Drift Score 구성**:
```
DMN Drift Score (0-100) =
  Response Time Component (25%) +
  Accuracy Component (30%) +
  Interaction Component (20%) +
  Focus Component (15%) +
  Idle Component (10%)
```

**Drift Levels**:
- `low` (0-40): 정상 집중
- `moderate` (40-60): 경미한 저하
- `high` (60-80): 심각한 저하
- `critical` (80-100): 즉시 개입 필요

---

### 2. 세션 메트릭 조회

세션의 모든 메트릭을 조회합니다.

**Endpoint**: `GET /metrics/session/{session_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "session_id": 123,
    "metrics": [
      {
        "id": 789,
        "dmn_drift_score": 42.8,
        "drift_level": "moderate",
        "calculated_at": "2025-11-18 10:35:00"
      }
    ],
    "count": 5
  }
}
```

---

### 3. 최신 메트릭 조회

세션의 가장 최근 메트릭을 조회합니다.

**Endpoint**: `GET /metrics/session/{session_id}/latest`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 789,
    "session_id": 123,
    "dmn_drift_score": 42.8,
    "drift_level": "moderate",
    "accuracy_rate": 75.00,
    "recommended_action": "Monitor closely",
    "calculated_at": "2025-11-18 10:35:00"
  }
}
```

---

### 4. 학생 메트릭 조회

학생의 모든 세션에 대한 메트릭을 조회합니다.

**Endpoint**: `GET /metrics/student/{student_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "metrics": [
      {
        "id": 789,
        "session_id": 123,
        "module_name": "Fractions Module",
        "dmn_drift_score": 42.8,
        "accuracy_rate": 75.00,
        "drift_level": "moderate",
        "calculated_at": "2025-11-18 10:35:00"
      }
    ],
    "aggregate_stats": {
      "avg_drift_score": 38.5,
      "max_drift_score": 65.2,
      "min_drift_score": 15.3,
      "avg_accuracy": 78.2,
      "total_measurements": 50,
      "drift_level_distribution": {
        "low": 30,
        "moderate": 15,
        "high": 4,
        "critical": 1
      }
    }
  }
}
```

---

## LTI API

Moodle LTI 통합

### 1. LTI 런치

Moodle에서 LTI 런치를 처리합니다.

**Endpoint**: `POST /lti/launch`

**Content-Type**: `application/x-www-form-urlencoded`

**Request Parameters** (Moodle에서 자동 전송):
```
lti_message_type=basic-lti-launch-request
lti_version=LTI-1p0
resource_link_id=123456
user_id=student123
lis_person_name_full=John Doe
lis_person_contact_email_primary=john@example.com
oauth_consumer_key=your_consumer_key
oauth_signature=...
```

**Response**: HTTP 302 Redirect
```
Location: http://your-app.com/?session=123&token=abc123&student=1
```

---

### 2. 성적 전송

Moodle로 성적을 전송합니다.

**Endpoint**: `POST /lti/grade`

**Request Body**:
```json
{
  "session_id": 123,
  "score": 0.85
}
```

- `score`: 0.0 ~ 1.0 사이의 값 (생략 시 자동 계산)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Grade sent successfully",
    "score": 0.85
  }
}
```

**자동 성적 계산 공식**:
```
Grade = (Accuracy × 70%) + (Engagement × 20%) + (Completion × 10%)

where:
  Engagement = 1 - (DMN Drift Score / 100)
  Completion = min(1, Total Attempts / 10)
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| 200 | OK - 성공 |
| 201 | Created - 리소스 생성 성공 |
| 400 | Bad Request - 잘못된 요청 |
| 404 | Not Found - 리소스 없음 |
| 405 | Method Not Allowed - 허용되지 않은 메서드 |
| 500 | Internal Server Error - 서버 오류 |

**Error Response 형식**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 사용 예시

### Python
```python
import requests

# 세션 생성
response = requests.post('http://api.example.com/sessions', json={
    'student_id': 1,
    'module_name': 'Fractions'
})
session = response.json()['data']

# 이벤트 추적
requests.post('http://api.example.com/events', json={
    'session_id': session['session_id'],
    'event_type': 'click',
    'event_data': {'x': 100, 'y': 200}
})

# 메트릭 계산
metrics = requests.post(f'http://api.example.com/metrics/calculate/{session["session_id"]}')
print(f"DMN Drift Score: {metrics.json()['data']['metrics']['dmn_drift_score']}")
```

### JavaScript
```javascript
// 세션 생성
const session = await fetch('http://api.example.com/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 1,
    module_name: 'Fractions'
  })
}).then(r => r.json());

// 이벤트 추적
await fetch('http://api.example.com/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: session.data.session_id,
    event_type: 'click',
    event_data: { x: 100, y: 200 }
  })
});

// 최신 메트릭 조회
const metrics = await fetch(
  `http://api.example.com/metrics/session/${session.data.session_id}/latest`
).then(r => r.json());

console.log('Drift Score:', metrics.data.dmn_drift_score);
```

---

## 속도 제한

현재 속도 제한은 설정되어 있지 않지만, 프로덕션 환경에서는 다음을 권장합니다:

- **일반 API**: 100 requests/minute
- **이벤트 추적**: 1000 requests/minute
- **메트릭 계산**: 10 requests/minute

---

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 API 릴리스
- Sessions, Events, Metrics, LTI 엔드포인트 구현

---

**API 문서 끝**
