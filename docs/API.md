# Similarity Detector API Documentation

REST API for the Similarity Detector system.

## Base URL

```
http://localhost/api
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT or OAuth2.

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": 1700000000,
  "version": "1.0.0"
}
```

---

### 2. Get Problem by ID

Retrieve a specific problem from Moodle with its hints.

**Endpoint**: `GET /api/problems/{problem_id}`

**Parameters**:
- `problem_id` (path, required): Moodle question ID

**Response**:
```json
{
  "id": 1001,
  "name": "삼각형 닮음 문제",
  "questiontext": "두 삼각형 ABC와 DEF에서...",
  "qtype": "multichoice",
  "category": 123,
  "category_name": "기하학",
  "hints": [
    {
      "id": 1,
      "problem_id": 1001,
      "hint_type": "ratio",
      "hint_text": "두 삼각형의 대응하는 변의 길이의 비를 확인해보세요.",
      "hint_data": {
        "ratio": 2,
        "corresponding_sides": ["AB-DE", "BC-EF", "AC-DF"]
      },
      "confidence_score": 0.95
    }
  ]
}
```

---

### 3. List Problems

List problems from Moodle.

**Endpoint**: `GET /api/problems`

**Query Parameters**:
- `limit` (optional, default: 20): Number of results
- `type` (optional): Question type filter (e.g., "multichoice", "numerical")

**Response**:
```json
{
  "problems": [
    {
      "id": 1001,
      "name": "문제 1",
      "questiontext": "문제 내용...",
      "qtype": "multichoice"
    }
  ]
}
```

---

### 4. Get Hints for Problem

Retrieve all hints for a specific problem.

**Endpoint**: `GET /api/hints/{problem_id}`

**Parameters**:
- `problem_id` (path, required): Internal problem ID

**Response**:
```json
{
  "hints": [
    {
      "id": 1,
      "problem_id": 1001,
      "hint_type": "ratio",
      "hint_text": "두 삼각형의 대응하는 변의 길이의 비를 확인해보세요.",
      "hint_data": {
        "ratio": 2,
        "corresponding_sides": ["AB-DE", "BC-EF", "AC-DF"]
      },
      "confidence_score": 0.95,
      "is_active": true,
      "created_at": "2025-01-01 10:00:00"
    }
  ]
}
```

---

### 5. Detect Similarity Hints

Analyze a problem and automatically generate similarity hints.

**Endpoint**: `POST /api/detect`

**Request Body**:
```json
{
  "problem_id": 1001
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "problem_id": 5,
    "shapes_detected": 2,
    "hints": [
      {
        "type": "ratio",
        "text": "두 삼각형 ABC와 DEF의 대응하는 변의 길이의 비를 확인해보세요. 닮음비는 2.00:1입니다.",
        "data": {
          "shape1": "ABC",
          "shape2": "DEF",
          "ratio": 2.0,
          "sides1": [6, 8, 10],
          "sides2": [3, 4, 5]
        },
        "confidence": 0.95
      },
      {
        "type": "angle",
        "text": "삼각형 ABC는 직각삼각형입니다. 피타고라스 정리를 이용하여 확인할 수 있습니다.",
        "data": {
          "shape": "ABC",
          "sides": [6, 8, 10],
          "is_right_triangle": true
        },
        "confidence": 0.92
      }
    ],
    "execution_time_ms": 45.23
  }
}
```

---

### 6. Search Problems

Search for problems containing specific keywords.

**Endpoint**: `GET /api/search`

**Query Parameters**:
- `q` (required): Search query
- `limit` (optional, default: 50): Number of results

**Response**:
```json
{
  "results": [
    {
      "id": 1001,
      "name": "삼각형 닮음",
      "questiontext": "두 삼각형 ABC와 DEF에서...",
      "category_name": "기하학"
    }
  ]
}
```

---

## Hint Types

The system can detect the following hint types:

| Type | Korean | Description |
|------|--------|-------------|
| `ratio` | 비율 | Ratios between corresponding sides |
| `angle` | 각도 | Angle relationships and properties |
| `proportion` | 비례 | Proportional relationships |
| `transformation` | 변환 | Geometric transformations (scale, rotate, reflect) |
| `shape` | 도형 | Shape-specific properties |

## Confidence Scores

Confidence scores range from 0.0 to 1.0:

- **0.90 - 1.00**: Very high confidence (simple ratios, verified properties)
- **0.80 - 0.89**: High confidence (clear patterns)
- **0.70 - 0.79**: Medium confidence (acceptable threshold)
- **Below 0.70**: Low confidence (filtered out by default)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid parameter",
  "message": "problem_id is required"
}
```

### 404 Not Found
```json
{
  "error": "Problem not found"
}
```

### 405 Method Not Allowed
```json
{
  "error": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Rate Limiting

Currently, there is no rate limiting. In production, implement rate limiting:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## CORS

CORS is enabled for all origins (`Access-Control-Allow-Origin: *`). In production, restrict to specific domains.

## Example Usage

### JavaScript (Fetch API)

```javascript
// Detect hints for a problem
async function detectHints(problemId) {
  const response = await fetch('http://localhost/api/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      problem_id: problemId
    })
  });

  const data = await response.json();
  return data;
}

// Get hints for a problem
async function getHints(problemId) {
  const response = await fetch(`http://localhost/api/hints/${problemId}`);
  const data = await response.json();
  return data.hints;
}
```

### PHP (cURL)

```php
// Detect hints
$data = ['problem_id' => 1001];
$options = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents('http://localhost/api/detect', false, $context);
$response = json_decode($result, true);
```

### Python (Requests)

```python
import requests

# Detect hints
response = requests.post('http://localhost/api/detect', json={
    'problem_id': 1001
})

data = response.json()
print(f"Found {len(data['data']['hints'])} hints")
```

## Webhooks (Future)

Future versions may support webhooks for real-time notifications:
- When new hints are detected
- When a problem is analyzed
- When confidence scores are updated
