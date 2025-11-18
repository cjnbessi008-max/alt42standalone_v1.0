# API Documentation

REST API endpoints for ALT42 Trap Shadow backend.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently no authentication required for development.
In production, implement JWT tokens or Moodle session tokens.

## Response Format

All responses follow this format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

## Endpoints

### Health Check

Check if server is running.

**GET** `/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "service": "ALT42 Trap Shadow Backend"
}
```

---

### Get Quiz

Retrieve quiz with all questions and trap points.

**GET** `/api/quiz/:quizId`

**Parameters**:
- `quizId` (number, required) - Moodle quiz ID

**Response**:
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": 1,
      "name": "Fractions Quiz",
      "course": 5,
      "intro": "Quiz about fractions"
    },
    "problems": [
      {
        "question": {
          "id": 1,
          "questiontext": "What is 1/4 + 1/2?",
          "qtype": "multichoice",
          "name": "Fraction Addition"
        },
        "answers": [
          {
            "id": 1,
            "answer": "3/4",
            "fraction": 1,
            "feedback": "Correct!"
          }
        ],
        "trapPoints": [
          {
            "id": 1,
            "questionId": 1,
            "type": "text",
            "position": { "x": 20, "y": 30, "width": 60, "height": 10 },
            "severity": "high",
            "description": "Common mistake area",
            "errorRate": 75.5
          }
        ]
      }
    ]
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid quiz ID
- `404` - Quiz not found
- `500` - Server error

---

### Get Problem

Retrieve single problem with trap points.

**GET** `/api/problem/:problemId`

**Parameters**:
- `problemId` (number, required) - Moodle question ID

**Response**:
```json
{
  "success": true,
  "data": {
    "question": {
      "id": 1,
      "questiontext": "<p>What is 1/4 + 1/2?</p>",
      "questiontextformat": 1,
      "qtype": "multichoice",
      "name": "Fraction Addition",
      "penalty": 0.33,
      "defaultmark": 1.0
    },
    "answers": [
      {
        "id": 1,
        "answer": "2/6",
        "fraction": 0,
        "feedback": "Incorrect denominator"
      },
      {
        "id": 2,
        "answer": "3/4",
        "fraction": 1,
        "feedback": "Correct! 1/4 + 2/4 = 3/4"
      }
    ],
    "trapPoints": [
      {
        "id": 1,
        "questionId": 1,
        "type": "text",
        "position": {
          "x": 20.0,
          "y": 30.0,
          "width": 60.0,
          "height": 10.0
        },
        "severity": "high",
        "description": "Students often forget to find common denominator",
        "errorRate": 72.5,
        "createdAt": "2025-11-18T10:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid problem ID
- `404` - Problem not found
- `500` - Server error

---

### Get Trap Points

Get trap points for specific question.

**GET** `/api/trap-points/:questionId`

**Parameters**:
- `questionId` (number, required) - Moodle question ID

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "questionId": 1,
      "type": "text",
      "position": {
        "x": 20.0,
        "y": 30.0,
        "width": 60.0,
        "height": 10.0
      },
      "severity": "high",
      "description": "Common mistake: forgetting to find common denominator",
      "errorRate": 72.5,
      "createdAt": "2025-11-18T10:00:00.000Z"
    }
  ],
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

---

### Create/Update Trap Point

Create new trap point or update existing one.

**POST** `/api/trap-points`

**Request Body**:
```json
{
  "questionId": 1,
  "type": "text",
  "position": {
    "x": 20.0,
    "y": 30.0,
    "width": 60.0,
    "height": 10.0
  },
  "severity": "high",
  "description": "Common mistake area",
  "errorRate": 72.5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses**:
- `400` - Missing required fields
- `500` - Server error

---

### Delete Trap Point

Delete trap point by ID.

**DELETE** `/api/trap-points/:trapPointId`

**Parameters**:
- `trapPointId` (number, required) - Trap point ID

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid trap point ID
- `404` - Trap point not found
- `500` - Server error

---

## Data Types

### TrapPoint

```typescript
interface TrapPoint {
  id: number;
  questionId: number;
  type: 'text' | 'number' | 'diagram' | 'option';
  position: TrapPointPosition;
  severity: 'low' | 'medium' | 'high';
  description: string;
  errorRate: number; // 0-100
  createdAt?: Date;
}
```

### TrapPointPosition

```typescript
interface TrapPointPosition {
  x: number;      // X coordinate as percentage (0-100)
  y: number;      // Y coordinate as percentage (0-100)
  width: number;  // Width as percentage (0-100)
  height: number; // Height as percentage (0-100)
}
```

### TrapType

```typescript
enum TrapType {
  TEXT = 'text',        // Text-based trap
  NUMBER = 'number',    // Numerical trap
  DIAGRAM = 'diagram',  // Diagram/image trap
  OPTION = 'option'     // Answer option trap
}
```

### TrapSeverity

```typescript
enum TrapSeverity {
  LOW = 'low',          // Error rate 0-33%
  MEDIUM = 'medium',    // Error rate 34-66%
  HIGH = 'high'         // Error rate 67-100%
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid parameters |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting in development.

Production recommendations:
- 100 requests per hour per IP
- 1000 requests per day per user

---

## CORS

Configured origins in backend `.env`:
```env
CORS_ORIGIN=http://localhost:3000
```

For production, set to your frontend domain.

---

## Examples

### cURL Examples

**Get Problem**:
```bash
curl http://localhost:3001/api/problem/1
```

**Create Trap Point**:
```bash
curl -X POST http://localhost:3001/api/trap-points \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": 1,
    "type": "text",
    "position": {"x": 20, "y": 30, "width": 60, "height": 10},
    "severity": "high",
    "description": "Common mistake",
    "errorRate": 75.5
  }'
```

**Delete Trap Point**:
```bash
curl -X DELETE http://localhost:3001/api/trap-points/1
```

### JavaScript Examples

```javascript
// Get problem
const response = await fetch('http://localhost:3001/api/problem/1');
const data = await response.json();

// Create trap point
const response = await fetch('http://localhost:3001/api/trap-points', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionId: 1,
    type: 'text',
    position: { x: 20, y: 30, width: 60, height: 10 },
    severity: 'high',
    description: 'Common mistake',
    errorRate: 75.5
  })
});
```

---

## Changelog

### v1.0.0 (2025-11-18)
- Initial API implementation
- CRUD operations for trap points
- Quiz and problem endpoints
- Moodle integration
