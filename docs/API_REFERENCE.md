# Alt42 API 레퍼런스

## 기본 정보

- **Base URL**: `http://localhost:8000`
- **Content-Type**: `application/json`
- **API 버전**: 1.0.0

---

## 인증

현재 버전에서는 인증이 필요하지 않습니다. 프로덕션 환경에서는 JWT 토큰 기반 인증을 구현할 예정입니다.

---

## 엔드포인트 목록

### 1. 시스템 관리

#### GET `/`
루트 엔드포인트

**응답**:
```json
{
  "service": "Alt42 - Sigh Detection & Break Suggestion API",
  "version": "1.0.0",
  "status": "running"
}
```

#### GET `/health`
헬스 체크

**응답**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:00:00"
}
```

---

## 2. 한숨 감지 API

### POST `/api/sigh/analyze`
오디오 신호 분석하여 한숨 감지

**요청 본문**:
```json
{
  "student_id": "string",
  "audio_samples": [0.1, 0.2, 0.3, ...],
  "sample_rate": 16000
}
```

**파라미터**:
- `student_id` (required): 학생 ID
- `audio_samples` (required): 오디오 샘플 데이터 (float 배열)
- `sample_rate` (optional): 샘플링 레이트, 기본값 16000Hz

**응답**:
```json
{
  "detected": true,
  "intensity": "moderate",
  "confidence": 0.85,
  "timestamp": "2025-11-18T10:00:00",
  "should_suggest_break": true,
  "stress_level": 0.7
}
```

**상태 코드**:
- `200`: 성공
- `500`: 서버 오류

---

### POST `/api/sigh/reset/{student_id}`
학생의 한숨 감지 이력 초기화

**경로 파라미터**:
- `student_id`: 학생 ID

**응답**:
```json
{
  "message": "Sigh detection history reset for student student_001",
  "timestamp": "2025-11-18T10:00:00"
}
```

---

### GET `/api/sigh/stress-level`
현재 스트레스 레벨 조회

**응답**:
```json
{
  "stress_level": 0.65,
  "timestamp": "2025-11-18T10:00:00"
}
```

---

## 3. 휴식 제안 API

### POST `/api/break/suggest`
휴식 제안 생성

**요청 본문**:
```json
{
  "student_id": "student_001",
  "stress_level": 0.7,
  "learning_duration_minutes": 90,
  "sigh_count": 3
}
```

**파라미터**:
- `student_id` (required): 학생 ID
- `stress_level` (required): 스트레스 레벨 (0.0 ~ 1.0)
- `learning_duration_minutes` (required): 학습 지속 시간 (분)
- `sigh_count` (optional): 최근 한숨 횟수, 기본값 0

**응답**:
```json
{
  "student_id": "student_001",
  "stress_level": 0.7,
  "reason": "You've shown signs of stress (3 deep sighs detected). Let's take a break!",
  "reason_ko": "스트레스 징후가 감지되었습니다 (3회의 깊은 한숨). 휴식을 취하세요!",
  "recommended_activities": [
    {
      "activity_id": "deep_breathing",
      "name": "Deep Breathing Exercise",
      "name_ko": "심호흡 운동",
      "description": "Take 5 deep breaths...",
      "description_ko": "4초 동안 숨을 들이마시고...",
      "duration_minutes": 5,
      "break_type": "short_break",
      "difficulty": "easy"
    }
  ],
  "timestamp": "2025-11-18T10:00:00"
}
```

---

### GET `/api/break/activities`
사용 가능한 모든 휴식 활동 조회

**응답**:
```json
{
  "activities": [
    {
      "activity_id": "deep_breathing",
      "name": "Deep Breathing Exercise",
      "name_ko": "심호흡 운동",
      "duration_minutes": 5,
      "break_type": "short_break",
      "difficulty": "easy"
    },
    ...
  ],
  "total": 10
}
```

---

### GET `/api/break/history/{student_id}`
학생의 휴식 제안 이력 조회

**경로 파라미터**:
- `student_id`: 학생 ID

**쿼리 파라미터**:
- `limit` (optional): 조회 개수, 기본값 10

**응답**:
```json
{
  "student_id": "student_001",
  "history": [
    {
      "stress_level": 0.7,
      "reason": "...",
      "reason_ko": "...",
      "recommended_activities": [...],
      "timestamp": "2025-11-18T10:00:00"
    }
  ],
  "total": 5
}
```

---

## 4. LMS 연동 API

### POST `/api/lms/register`
LMS 등록

**요청 본문**:
```json
{
  "lms_id": "my_canvas",
  "lms_type": "canvas",
  "base_url": "https://canvas.example.com",
  "api_token": "your_token"
}
```

**파라미터**:
- `lms_id` (required): LMS 식별자
- `lms_type` (required): LMS 유형 (canvas, moodle, kaist, blackboard)
- `base_url` (required): LMS API 베이스 URL
- `api_token` (required): API 인증 토큰

**응답**:
```json
{
  "message": "LMS registered successfully: my_canvas",
  "lms_type": "canvas",
  "timestamp": "2025-11-18T10:00:00"
}
```

---

### POST `/api/lms/session/start`
학습 세션 시작

**요청 본문**:
```json
{
  "lms_id": "my_canvas",
  "student_id": "student_001",
  "course_id": "course_123"
}
```

**응답**:
```json
{
  "message": "Session started successfully",
  "session": {
    "student_id": "student_001",
    "course_id": "course_123",
    "session_id": "student_001_course_123_1700300000.0",
    "start_time": "2025-11-18T10:00:00",
    "end_time": null,
    "stress_level": 0.0,
    "break_taken": false
  }
}
```

---

### POST `/api/lms/session/end`
학습 세션 종료

**쿼리 파라미터**:
- `lms_id` (required): LMS 식별자
- `session_id` (required): 세션 ID

**응답**:
```json
{
  "message": "Session ended successfully",
  "session_id": "student_001_course_123_1700300000.0",
  "timestamp": "2025-11-18T11:00:00"
}
```

---

### PUT `/api/lms/session/stress`
세션 스트레스 레벨 업데이트

**요청 본문**:
```json
{
  "lms_id": "my_canvas",
  "session_id": "student_001_course_123_1700300000.0",
  "stress_level": 0.75
}
```

**응답**:
```json
{
  "message": "Stress level updated successfully",
  "session_id": "student_001_course_123_1700300000.0",
  "stress_level": 0.75,
  "timestamp": "2025-11-18T10:30:00"
}
```

---

### POST `/api/lms/notification/break`
휴식 제안 알림 전송 (LMS를 통해)

**요청 본문**:
```json
{
  "lms_id": "my_canvas",
  "student_id": "student_001",
  "course_id": "course_123",
  "reason": "Time for a break!",
  "reason_ko": "휴식 시간이에요!"
}
```

**응답**:
```json
{
  "message": "Break notification sent",
  "student_id": "student_001",
  "timestamp": "2025-11-18T10:00:00"
}
```

---

## 5. 통합 워크플로우 API

### POST `/api/workflow/analyze-and-suggest`
오디오 분석 + 휴식 제안 + LMS 알림 (통합)

**요청 본문**:
```json
{
  "student_id": "student_001",
  "audio_samples": [0.1, 0.2, 0.3, ...],
  "sample_rate": 16000
}
```

**응답**:
```json
{
  "sigh_detected": true,
  "stress_level": 0.75,
  "break_suggested": true,
  "suggestion": {
    "student_id": "student_001",
    "stress_level": 0.75,
    "reason": "...",
    "reason_ko": "...",
    "recommended_activities": [...]
  },
  "timestamp": "2025-11-18T10:00:00"
}
```

---

## 오류 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

**오류 응답 형식**:
```json
{
  "detail": "Error message here"
}
```

---

## 예제 코드

### Python

```python
import requests

# 한숨 감지
response = requests.post(
    "http://localhost:8000/api/sigh/analyze",
    json={
        "student_id": "student_001",
        "audio_samples": [0.1, 0.2, 0.3],
        "sample_rate": 16000
    }
)
result = response.json()
print(f"한숨 감지: {result['detected']}")
```

### JavaScript

```javascript
// 휴식 제안 받기
fetch('http://localhost:8000/api/break/suggest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    student_id: 'student_001',
    stress_level: 0.7,
    learning_duration_minutes: 90,
    sigh_count: 3
  })
})
  .then(response => response.json())
  .then(data => console.log('휴식 제안:', data));
```

### cURL

```bash
# LMS 등록
curl -X POST "http://localhost:8000/api/lms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "lms_id": "my_canvas",
    "lms_type": "canvas",
    "base_url": "https://canvas.example.com",
    "api_token": "your_token"
  }'
```

---

## 추가 정보

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

---

**문의사항이 있으시면 이슈를 등록해주세요!** 📝
