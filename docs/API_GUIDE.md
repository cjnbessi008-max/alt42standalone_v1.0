# API 사용 가이드

## 기본 정보

- **Base URL**: `http://localhost:8000/api`
- **인증 방식**: JWT Bearer Token (향후 구현)
- **응답 포맷**: JSON
- **문자 인코딩**: UTF-8

## 엔드포인트 목록

### 1. 감정 데이터 수집

학생의 감정 데이터를 수집합니다.

**Endpoint**: `POST /api/emotions/collect`

**요청 헤더**:
```http
Content-Type: application/json
```

**요청 본문**:
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "module_id": "660e8400-e29b-41d4-a716-446655440001",
  "session_id": "770e8400-e29b-41d4-a716-446655440002",
  "emotion_type": "frustrated",
  "emotion_intensity": 7,
  "context": {
    "activity_type": "problem_solving",
    "difficulty": "hard",
    "problem_id": "math_101"
  }
}
```

**필드 설명**:
- `student_id` (string, required): 학생 고유 ID (UUID)
- `module_id` (string, required): 학습 모듈 ID (UUID)
- `session_id` (string, required): 학습 세션 ID (UUID)
- `emotion_type` (string, required): 감정 유형
  - 가능한 값: `happy`, `excited`, `neutral`, `confused`, `frustrated`, `anxious`, `bored`, `engaged`
- `emotion_intensity` (integer, required): 감정 강도 (1-10)
- `context` (object, optional): 추가 컨텍스트 정보

**응답 (200 OK)**:
```json
{
  "status": "success",
  "emotion_data_id": "880e8400-e29b-41d4-a716-446655440003",
  "message": "Emotion data collected successfully"
}
```

**오류 응답 (400 Bad Request)**:
```json
{
  "detail": "Emotion intensity must be between 1 and 10"
}
```

---

### 2. LMS 웹훅 수신

LMS에서 발생한 학습 활동 이벤트를 수신하고 감정을 추론합니다.

**Endpoint**: `POST /api/lms/webhook/learning-activity`

**요청 본문**:
```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "module_id": "660e8400-e29b-41d4-a716-446655440001",
  "session_id": "770e8400-e29b-41d4-a716-446655440002",
  "activity_type": "problem_solving",
  "result": "incorrect",
  "time_spent": 180,
  "timestamp": "2025-11-18T14:30:00Z"
}
```

**필드 설명**:
- `activity_type` (string): 활동 유형 (예: problem_solving, quiz, reading)
- `result` (string): 결과 (correct, incorrect, partial)
- `time_spent` (integer): 소요 시간 (초)
- `timestamp` (string, optional): 이벤트 발생 시각 (ISO 8601)

**응답 (200 OK)**:
```json
{
  "status": "success",
  "emotion_data_id": "880e8400-e29b-41d4-a716-446655440003",
  "inferred_emotion": {
    "emotion_type": "frustrated",
    "intensity": 7,
    "confidence": 0.75
  },
  "message": "Webhook processed successfully"
}
```

---

### 3. 감정 기복 분석 리포트

학생 또는 모듈의 시간대별 감정 기복 분석 리포트를 조회합니다.

**Endpoint**: `GET /api/analysis/volatility-report`

**쿼리 파라미터**:
- `student_id` (string, optional): 학생 ID (미지정시 전체 학생)
- `module_id` (string, optional): 모듈 ID (미지정시 전체 모듈)

**요청 예시**:
```http
GET /api/analysis/volatility-report?student_id=550e8400-e29b-41d4-a716-446655440000
```

**응답 (200 OK)**:
```json
{
  "status": "success",
  "summary": {
    "total_timeslots_analyzed": 50,
    "avg_volatility": 2.8,
    "max_volatility": 5.2,
    "most_volatile_day": {
      "day": "Wednesday",
      "avg_volatility": 3.5
    },
    "most_volatile_hour": {
      "hour": "14:00",
      "avg_volatility": 4.1
    }
  },
  "top_volatile_timeslots": [
    {
      "time_slot": {
        "hour": 14,
        "day_of_week": 3,
        "label": "Wednesday 14:00-15:00"
      },
      "volatility_score": 5.2,
      "avg_intensity": 7.5,
      "emotion_distribution": {
        "frustrated": 8,
        "confused": 5,
        "neutral": 2
      },
      "sample_count": 15,
      "volatility_level": "extreme"
    }
  ],
  "volatility_by_day": {
    "Monday": 3.2,
    "Tuesday": 2.5,
    "Wednesday": 3.5,
    "Thursday": 2.8,
    "Friday": 3.1
  },
  "volatility_by_hour": {
    "09:00": 2.3,
    "10:00": 3.1,
    "14:00": 4.1
  },
  "recommendations": [
    "⚠️ Wednesday 14:00-15:00 시간대에 감정 기복이 가장 심합니다 (기복 점수: 5.20).",
    "주요 감정: frustrated (8회), confused (5회). 이 시간대의 학습 난이도나 활동 유형을 조정해보세요."
  ]
}
```

---

### 4. 높은 기복 시간대 조회

감정 기복이 높은 시간대를 조회합니다.

**Endpoint**: `GET /api/analysis/high-volatility-timeslots`

**쿼리 파라미터**:
- `student_id` (string, optional): 학생 ID
- `module_id` (string, optional): 모듈 ID
- `threshold` (string, optional): 기복 레벨 임계값 (기본값: "high")
  - 가능한 값: `medium`, `high`, `extreme`
- `limit` (integer, optional): 최대 결과 개수 (기본값: 10, 최대: 50)

**요청 예시**:
```http
GET /api/analysis/high-volatility-timeslots?threshold=high&limit=5
```

**응답 (200 OK)**:
```json
{
  "status": "success",
  "count": 3,
  "timeslots": [
    {
      "time_slot": {
        "hour": 14,
        "day_of_week": 3,
        "label": "Wednesday 14:00-15:00"
      },
      "volatility_score": 5.2,
      "avg_intensity": 7.5,
      "volatility_level": "extreme",
      "sample_count": 15
    }
  ]
}
```

---

## 오류 코드

| 상태 코드 | 설명 |
|----------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (유효하지 않은 파라미터) |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 429 | 요청 제한 초과 (Rate Limit) |
| 500 | 서버 내부 오류 |

## 사용 예시

### Python (requests)

```python
import requests

# 감정 데이터 수집
response = requests.post(
    'http://localhost:8000/api/emotions/collect',
    json={
        'student_id': '550e8400-e29b-41d4-a716-446655440000',
        'module_id': '660e8400-e29b-41d4-a716-446655440001',
        'session_id': '770e8400-e29b-41d4-a716-446655440002',
        'emotion_type': 'frustrated',
        'emotion_intensity': 7,
        'context': {'activity_type': 'problem_solving'}
    }
)

print(response.json())

# 분석 리포트 조회
response = requests.get(
    'http://localhost:8000/api/analysis/volatility-report',
    params={'student_id': '550e8400-e29b-41d4-a716-446655440000'}
)

report = response.json()
print(f"평균 기복: {report['summary']['avg_volatility']}")
```

### JavaScript (fetch)

```javascript
// 감정 데이터 수집
const collectEmotion = async () => {
  const response = await fetch('http://localhost:8000/api/emotions/collect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: '550e8400-e29b-41d4-a716-446655440000',
      module_id: '660e8400-e29b-41d4-a716-446655440001',
      session_id: '770e8400-e29b-41d4-a716-446655440002',
      emotion_type: 'happy',
      emotion_intensity: 8,
      context: { activity_type: 'quiz' }
    })
  });

  const data = await response.json();
  console.log(data);
};

// 분석 리포트 조회
const getReport = async (studentId) => {
  const response = await fetch(
    `http://localhost:8000/api/analysis/volatility-report?student_id=${studentId}`
  );

  const report = await response.json();
  console.log('평균 기복:', report.summary.avg_volatility);
};
```

### cURL

```bash
# 감정 데이터 수집
curl -X POST http://localhost:8000/api/emotions/collect \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "module_id": "660e8400-e29b-41d4-a716-446655440001",
    "session_id": "770e8400-e29b-41d4-a716-446655440002",
    "emotion_type": "confused",
    "emotion_intensity": 6
  }'

# 분석 리포트 조회
curl http://localhost:8000/api/analysis/volatility-report?student_id=550e8400-e29b-41d4-a716-446655440000
```

## Rate Limiting

- 감정 데이터 수집: 1000 req/hour per student
- 분석 리포트 조회: 100 req/hour per user
- 웹훅: 무제한 (LMS에서 발생)

## 웹훅 설정

LMS에서 다음 이벤트 발생시 웹훅을 설정하세요:

1. **문제 제출**: 학생이 문제를 풀고 제출할 때
2. **퀴즈 완료**: 퀴즈를 완료할 때
3. **학습 세션 시작/종료**: 세션 경계를 추적하기 위해
4. **시간 기반 체크포인트**: 5분마다 활동 상태 전송

**웹훅 URL**: `http://your-server.com/api/lms/webhook/learning-activity`
