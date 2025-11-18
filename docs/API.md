# ALT42 Standalone - API 문서

## API 엔드포인트

### Base URL
```
http://your-domain/backend/api
```

---

## 1. Get Graph Data

그래프 시각화를 위한 데이터를 가져옵니다.

### Endpoint
```
GET /graph_data.php
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quiz_id | integer | Yes | Moodle 퀴즈 ID |
| user_id | integer | No | 특정 사용자 ID (생략 시 전체 통계) |

### Example Request
```bash
curl "http://your-domain/backend/api/graph_data.php?quiz_id=1&user_id=5"
```

### Example Response (Success)
```json
{
    "success": true,
    "timestamp": 1700000000,
    "quiz_id": 1,
    "statistics": {
        "total_attempts": 25,
        "average_score": 87.5,
        "completion_rate": 92.0
    },
    "time_series": [
        {
            "timestamp": 1699900000,
            "score": 85.5
        },
        {
            "timestamp": 1699910000,
            "score": 92.0
        }
    ],
    "user_progress": {
        "attempts": 3,
        "best_score": 95.0,
        "latest_score": 92.0,
        "trend": "improving"
    },
    "animation_config": {
        "breath_duration": 3000,
        "pulse_intensity": 0.15,
        "update_interval": 5000
    }
}
```

### Example Response (Error)
```json
{
    "success": false,
    "error": "quiz_id parameter is required",
    "timestamp": 1700000000
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 500 | Internal Server Error |

---

## Animation Config

### breath_duration
- **타입**: integer (milliseconds)
- **설명**: 한 번의 "호흡" 사이클 시간
- **기본값**: 3000 (3초)

### pulse_intensity
- **타입**: float (0.0 - 1.0)
- **설명**: 그래프 확대/축소 강도
- **기본값**: 0.15 (15%)

### update_interval
- **타입**: integer (milliseconds)
- **설명**: 자동 업데이트 간격
- **기본값**: 5000 (5초)

---

## Error Codes

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "quiz_id parameter is required" | quiz_id가 제공되지 않음 | URL에 quiz_id 파라미터 추가 |
| "Moodle API request failed" | Moodle 연결 오류 | Moodle URL 및 토큰 확인 |
| "Database connection failed" | DB 연결 오류 | 데이터베이스 설정 확인 |

---

## Rate Limiting

- **제한**: 100 requests/hour per IP
- **초과 시**: HTTP 429 Too Many Requests

---

## CORS Policy

기본적으로 모든 origin 허용 (`*`). 프로덕션에서는 `backend/config/config.php`에서 변경:

```php
define('CORS_ALLOWED_ORIGINS', 'https://your-domain.com');
```

---

## Caching

- **캐시 시간**: 30초
- **캐시 키**: `graph_{quiz_id}_{user_id}`
- **클리어 방법**: 새로고침 버튼 또는 `clearCache()` 호출

---

## Frontend JavaScript API

### MoodleClient

```javascript
const client = new MoodleClient('/backend/api');

// Get graph data
const data = await client.getGraphData(quizId, userId);

// Clear cache
client.clearCache();

// Generate mock data (for testing)
const mockData = client.generateMockData(10);
```

### LiveGraph

```javascript
const graph = new LiveGraph('canvas-id');

// Set data
graph.setData(timeSeriesData);

// Start animation
graph.startBreathingAnimation();

// Stop animation
graph.stopAnimation();

// Destroy instance
graph.destroy();
```

### SmartphoneController

```javascript
const smartphone = new SmartphoneController();

// Show notification
smartphone.showNotification('메시지', 3000);

// Trigger vibration
smartphone.vibrate();
```

---

## Webhooks (Future)

향후 Moodle 이벤트를 실시간으로 받기 위한 웹훅 지원 예정.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
