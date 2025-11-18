# ALT42 Length Assist API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently using demo mode. JWT authentication will be implemented in production.

## Endpoints

### Length Assist

#### Get Problems

Get a list of problems for a specific module.

```http
GET /length-assist/problems?moduleId={moduleId}&difficulty={1-5}&limit={10}&offset={0}
```

**Query Parameters:**
- `moduleId` (required): UUID of the module
- `difficulty` (optional): Filter by difficulty level (1-5)
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "problem-001",
      "moduleId": "demo-module-1",
      "title": "두 선분의 비율",
      "description": "파란색과 보라색 선분의 양 끝점을 드래그하여...",
      "lines": [...],
      "shapes": [...],
      "targetRatio": 1.5,
      "tolerance": 0.05,
      "hints": ["..."],
      "difficulty": 1,
      "unit": "px"
    }
  ]
}
```

#### Get Problem by ID

```http
GET /length-assist/problems/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "problem-001",
    "moduleId": "demo-module-1",
    "title": "두 선분의 비율",
    "lines": [
      {
        "id": "line-1",
        "start": {"x": 50, "y": 150},
        "end": {"x": 200, "y": 150},
        "length": 150,
        "color": "#1976d2",
        "label": "선분 A",
        "isDraggable": true
      }
    ],
    "targetRatio": 1.5,
    "tolerance": 0.05
  }
}
```

#### Get Next Problem

Get the next appropriate problem for a student based on their progress.

```http
POST /length-assist/next-problem
```

**Body:**
```json
{
  "studentId": "demo-student-1",
  "moduleId": "demo-module-1"
}
```

**Response:** Same as Get Problem by ID

#### Submit Answer

Submit a student's answer for evaluation.

```http
POST /length-assist/submit
```

**Body:**
```json
{
  "problemId": "problem-001",
  "studentId": "demo-student-1",
  "measuredRatio": {
    "line1Length": 150.5,
    "line2Length": 100.2,
    "ratio": 1.502
  },
  "timeSpent": 45,
  "interactions": [
    {
      "type": "drag",
      "timestamp": 1234567890,
      "elementId": "line-1",
      "position": {"x": 200, "y": 150}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "feedback": "정답입니다! 비율 1.50에 매우 가깝습니다.",
    "correctRatio": 1.5,
    "score": 100
  }
}
```

#### Get Student Progress

```http
GET /length-assist/progress/:studentId?moduleId={moduleId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "demo-student-1",
    "moduleId": "demo-module-1",
    "problemsCompleted": 5,
    "totalProblems": 10,
    "accuracyRate": 80.5,
    "averageTimePerProblem": 42,
    "lastActivityAt": "2024-01-15T10:30:00Z"
  }
}
```

### Moodle LTI Integration

#### LTI Launch

Handle LTI launch request from Moodle.

```http
POST /moodle/lti-launch
```

**Body:** (LTI parameters from Moodle)
```
lti_message_type=basic-lti-launch-request
lti_version=LTI-1p0
resource_link_id=...
context_id=...
user_id=...
roles=Learner
lis_person_name_given=John
lis_person_name_family=Doe
lis_person_contact_email_primary=john@example.com
```

**Response:** Redirects to frontend with session token

#### Get Session

```http
GET /moodle/session/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "userId": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "student",
    "contextId": "...",
    "resourceLinkId": "..."
  }
}
```

#### Grade Passback

Send grade back to Moodle.

```http
POST /moodle/grade-passback
```

**Body:**
```json
{
  "sessionId": "...",
  "score": 85.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grade recorded"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting in development. Production will implement rate limiting.

## CORS

Allowed origins configured in `.env`:
```
CORS_ORIGIN=http://localhost:3000
```
