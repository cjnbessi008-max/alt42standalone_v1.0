# Divisor Molecules API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT-based authentication.

---

## Endpoints

### Health Check

#### `GET /health`

Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-18T12:00:00.000Z"
  }
}
```

---

## Problems

### Get Random Problem

#### `GET /problems/random?difficulty=medium`

Get a random problem, optionally filtered by difficulty.

**Query Parameters:**
- `difficulty` (optional): `easy`, `medium`, or `hard`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prob_001",
    "number": 12,
    "divisors": [1, 2, 3, 4, 6, 12],
    "difficulty": "easy",
    "timeLimit": 120,
    "createdAt": "2025-11-18T12:00:00.000Z"
  }
}
```

### Get Problem by ID

#### `GET /problems/:id`

Get a specific problem by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prob_001",
    "number": 12,
    "divisors": [1, 2, 3, 4, 6, 12],
    "difficulty": "easy",
    "timeLimit": 120
  }
}
```

### Get All Problems

#### `GET /problems?limit=50`

Get all problems with optional limit.

**Query Parameters:**
- `limit` (optional): Number of problems to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prob_001",
      "number": 12,
      "divisors": [1, 2, 3, 4, 6, 12],
      "difficulty": "easy",
      "timeLimit": 120
    }
  ]
}
```

### Create Problem

#### `POST /problems`

Create a new problem.

**Request Body:**
```json
{
  "number": 24,
  "divisors": [1, 2, 3, 4, 6, 8, 12, 24],
  "difficulty": "medium",
  "timeLimit": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prob_002",
    "number": 24,
    "divisors": [1, 2, 3, 4, 6, 8, 12, 24],
    "difficulty": "medium",
    "timeLimit": 180
  }
}
```

---

## Student Progress

### Submit Progress

#### `POST /progress`

Submit student progress for a problem.

**Request Body:**
```json
{
  "studentId": "student_001",
  "problemId": "prob_001",
  "score": 95,
  "timeSpent": 85,
  "attempts": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prog_001",
    "studentId": "student_001",
    "problemId": "prob_001",
    "score": 95,
    "timeSpent": 85,
    "attempts": 1,
    "completedAt": "2025-11-18T12:00:00.000Z"
  }
}
```

### Get Student Progress

#### `GET /progress/student/:studentId?limit=20`

Get progress history for a student.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prog_001",
      "studentId": "student_001",
      "problemId": "prob_001",
      "score": 95,
      "timeSpent": 85,
      "attempts": 1,
      "completedAt": "2025-11-18T12:00:00.000Z"
    }
  ]
}
```

### Get Student Statistics

#### `GET /progress/student/:studentId/stats`

Get aggregate statistics for a student.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProblems": 10,
    "averageScore": 87.5,
    "totalTimeSpent": 1250
  }
}
```

### Get Problem Progress

#### `GET /progress/problem/:problemId`

Get all student attempts for a specific problem.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prog_001",
      "studentId": "student_001",
      "problemId": "prob_001",
      "score": 95,
      "timeSpent": 85,
      "attempts": 1,
      "completedAt": "2025-11-18T12:00:00.000Z"
    }
  ]
}
```

---

## Moodle Integration

### Get Moodle Problems

#### `GET /moodle/problems?courseId=123`

Fetch problems from a Moodle course.

**Query Parameters:**
- `courseId` (required): Moodle course ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "moodle_001",
      "number": 15,
      "divisors": [1, 3, 5, 15],
      "difficulty": "easy",
      "timeLimit": 120
    }
  ]
}
```

### Sync Progress to Moodle

#### `POST /moodle/sync`

Sync student progress to Moodle gradebook.

**Request Body:**
```json
{
  "studentId": "student_001",
  "problemId": "prob_001",
  "score": 95,
  "timeSpent": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": true,
    "moodleGradeId": "grade_123"
  }
}
```

### Get Course Info

#### `GET /moodle/course/:courseId`

Get information about a Moodle course.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "fullname": "Mathematics Grade 4",
    "shortname": "MATH4",
    "categoryid": 1
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently, there is no rate limiting. Implement in production:
- 100 requests per minute per IP
- 1000 requests per hour per API key

---

## CORS

The API allows cross-origin requests from:
- Development: `http://localhost:5173`
- Production: Configure via `CORS_ORIGIN` environment variable

---

## Versioning

Current API version: `1.0.0`

Future versions will be prefixed with `/api/v2`, etc.
