# Zone Breeze API Documentation
# API 문서

## Base URL
```
http://your-server/zone-breeze/backend/api.php
```

## Authentication
Currently, authentication is handled through Moodle session validation.
API calls should include `user_id` and `session_key` parameters.

## Response Format
All responses are in JSON format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": 1234567890
}
```

## Endpoints

### 1. Get Problem
Retrieve problem information from Moodle activity.

**Endpoint:** `POST /api.php?action=get_problem`

**Request:**
```json
{
  "activity_id": 1,
  "user_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "moodle_activity_id": 1,
    "title": "연립부등식 문제 1",
    "description": "다음 연립부등식의 해 영역을 구하세요.",
    "inequalities": [
      "x + y <= 8",
      "2x + y <= 12",
      "x >= 0",
      "y >= 0"
    ],
    "visualization_bounds": {
      "xMin": -2,
      "xMax": 10,
      "yMin": -2,
      "yMax": 10
    },
    "difficulty_level": "easy"
  }
}
```

### 2. Solve Inequalities
Calculate solution region for system of inequalities.

**Endpoint:** `POST /api.php?action=solve`

**Request:**
```json
{
  "inequalities": [
    "x + y <= 8",
    "2x + y <= 12",
    "x >= 0",
    "y >= 0"
  ],
  "bounds": {
    "xMin": -2,
    "xMax": 10,
    "yMin": -2,
    "yMax": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "solution": {
    "vertices": [
      {"x": 0, "y": 0},
      {"x": 6, "y": 0},
      {"x": 4, "y": 4},
      {"x": 0, "y": 8}
    ],
    "energyMap": [
      {"x": 1, "y": 1, "intensity": 0.85},
      {"x": 2, "y": 2, "intensity": 0.92}
    ],
    "bounds": {
      "xMin": -2,
      "xMax": 10,
      "yMin": -2,
      "yMax": 10
    },
    "inequalityCount": 4
  },
  "cached": false,
  "computation_time_ms": 45.23
}
```

### 3. Submit Solution
Submit student's solution attempt.

**Endpoint:** `POST /api.php?action=submit`

**Request:**
```json
{
  "problem_id": 1,
  "user_id": 123,
  "solution_data": {
    "vertices": [...],
    "area": 24.5
  },
  "time_spent_seconds": 180
}
```

**Response:**
```json
{
  "success": true,
  "submission_id": 456,
  "grade": 100,
  "feedback": "문제를 완료했습니다!"
}
```

### 4. Get Templates
Retrieve problem templates.

**Endpoint:** `GET /api.php?action=templates`

**Query Parameters:**
- `category` (optional): linear, quadratic, absolute_value, mixed
- `difficulty` (optional): easy, medium, hard

**Example:**
```
GET /api.php?action=templates&category=linear&difficulty=easy
```

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "template_name": "기본 선형 연립부등식 1",
      "description": "두 개의 선형 부등식으로 구성된 기본 문제",
      "category": "linear",
      "template_inequalities": [
        "x + y <= 5",
        "x - y >= 2",
        "x >= 0",
        "y >= 0"
      ],
      "suggested_bounds": {
        "xMin": -2,
        "xMax": 8,
        "yMin": -2,
        "yMax": 8
      },
      "difficulty_level": "easy"
    }
  ]
}
```

### 5. Get Analytics
Retrieve student performance analytics.

**Endpoint:** `GET /api.php?action=analytics`

**Query Parameters:**
- `user_id`: Student user ID (for individual analytics)
- `problem_id`: Problem ID (for problem statistics)

**Example:**
```
GET /api.php?action=analytics&user_id=123
```

**Response (Student Performance):**
```json
{
  "success": true,
  "analytics": {
    "moodle_user_id": 123,
    "student_name": "홍길동",
    "problems_attempted": 15,
    "problems_correct": 12,
    "average_grade": 87.5,
    "total_time_spent": 2700,
    "avg_time_per_problem": 180
  }
}
```

**Response (Problem Statistics):**
```json
{
  "success": true,
  "statistics": {
    "id": 1,
    "title": "기본 연립부등식 1",
    "difficulty_level": "easy",
    "students_attempted": 50,
    "correct_submissions": 45,
    "total_submissions": 52,
    "success_rate": 86.54,
    "avg_time_spent": 175,
    "avg_grade": 89.23
  }
}
```

### 6. Track Interaction
Track student interaction events.

**Endpoint:** `POST /api.php?action=track`

**Request:**
```json
{
  "session_id": 1234567890,
  "event_type": "zoom",
  "event_data": {
    "zoom_level": 1.5
  }
}
```

**Event Types:**
- `zoom`: Zoom in/out
- `hover`: Mouse hover on canvas
- `click`: Click on canvas

**Response:**
```json
{
  "success": true,
  "tracked": true
}
```

### 7. Health Check
Check API health status.

**Endpoint:** `GET /api.php?action=health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1234567890
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication failed |
| 404 | Not Found - Resource not found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

## Rate Limiting
- 100 requests per hour per user for computation endpoints
- 1000 requests per hour for read-only endpoints
- Exceeded limits return HTTP 429

## Caching
Solution computation results are cached for performance:
- Cache key: SHA256 hash of inequalities + bounds
- Cache TTL: 30 days
- Automatic cleanup of unused cache entries

## Examples

### JavaScript (Fetch API)
```javascript
async function solveProblem(inequalities, bounds) {
  const response = await fetch('/zone-breeze/backend/api.php?action=solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inequalities, bounds })
  });

  const result = await response.json();
  return result;
}
```

### PHP (cURL)
```php
$data = [
    'inequalities' => ['x + y <= 5', 'x >= 0', 'y >= 0'],
    'bounds' => ['xMin' => -1, 'xMax' => 6, 'yMin' => -1, 'yMax' => 6]
];

$ch = curl_init('http://localhost/zone-breeze/backend/api.php?action=solve');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
```

### Python (requests)
```python
import requests

data = {
    'inequalities': ['x + y <= 5', 'x >= 0', 'y >= 0'],
    'bounds': {'xMin': -1, 'xMax': 6, 'yMin': -1, 'yMax': 6}
}

response = requests.post(
    'http://localhost/zone-breeze/backend/api.php?action=solve',
    json=data
)

result = response.json()
```

## Support
For API support and questions, contact: support@your-organization.com
