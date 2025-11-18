# API Documentation

## Base URL

```
http://localhost:8000
```

## Interactive Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication

Currently, the API does not require authentication. For production, implement JWT or API key authentication.

## Endpoints

### Analysis

#### POST /api/analysis/analyze

Analyze PHP code for loop inefficiencies.

**Request Body:**
```json
{
  "code": "<?php\n// Your PHP code here",
  "student_id": "uuid-string",  // optional
  "assignment_id": 123           // optional
}
```

**Response:** `200 OK`
```json
{
  "submission_id": "uuid",
  "total_loops": 5,
  "inefficient_loops": 3,
  "efficiency_score": 72.5,
  "total_issues": 8,
  "critical_issues": 2,
  "warning_issues": 4,
  "info_issues": 2,
  "inefficiencies": [
    {
      "type": "loop_invariant",
      "severity": "warning",
      "line_number": 10,
      "end_line_number": 10,
      "message": "Loop-invariant calculation detected",
      "suggestion": "Move calculation outside loop",
      "code_snippet": "$tax = 0.08 * $price;",
      "estimated_complexity_before": "O(n) redundant calculations",
      "estimated_complexity_after": "O(1)",
      "context": {}
    }
  ],
  "recommendations": [
    "Move calculations outside loops",
    "Avoid database queries in loops"
  ],
  "analysis_duration_ms": 245,
  "analyzed_at": "2024-01-18T10:30:00Z"
}
```

#### GET /api/analysis/submission/{submission_id}

Get analysis results for a submission.

**Response:** Same as analyze endpoint

#### GET /api/analysis/student/{student_id}/submissions

Get all submissions for a student.

**Response:** `200 OK`
```json
{
  "student_id": "uuid",
  "total_submissions": 10,
  "submissions": [
    {
      "id": "uuid",
      "filename": "assignment1.php",
      "submitted_at": "2024-01-18T10:00:00Z",
      "analyzed": true,
      "efficiency_score": 85.5
    }
  ]
}
```

### Students

#### POST /api/students/

Create a new student.

**Request Body:**
```json
{
  "moodle_id": 123,
  "username": "student1",
  "email": "student1@example.com",
  "firstname": "John",
  "lastname": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "moodle_id": 123,
  "username": "student1",
  "email": "student1@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "is_active": true,
  "created_at": "2024-01-18T10:00:00Z"
}
```

#### GET /api/students/{student_id}

Get student by ID.

**Response:** `200 OK` - Student object

#### GET /api/students/moodle/{moodle_id}

Get student by Moodle ID.

**Response:** `200 OK` - Student object

#### GET /api/students/{student_id}/stats

Get student statistics.

**Response:** `200 OK`
```json
{
  "student_id": "uuid",
  "username": "student1",
  "total_submissions": 15,
  "analyzed_submissions": 15,
  "average_efficiency_score": 82.3,
  "latest_submission": "2024-01-18T10:00:00Z"
}
```

### Moodle Integration

#### POST /api/moodle/sync-user/{moodle_user_id}

Sync user from Moodle to local database.

**Response:** `200 OK`
```json
{
  "success": true,
  "student_id": "uuid",
  "message": "User synced successfully"
}
```

#### GET /api/moodle/assignment/{assignment_id}/submissions

Get submissions from Moodle assignment.

**Response:** `200 OK`
```json
{
  "assignment_id": 123,
  "total_submissions": 25,
  "submissions": [...]
}
```

#### POST /api/moodle/send-feedback

Send feedback to student via Moodle.

**Request Body:**
```json
{
  "user_id": 123,
  "subject": "Code Analysis",
  "message": "Your code analysis is complete..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Feedback sent successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid request data"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error: <error message>"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- 100 requests per hour per IP for analysis endpoints
- 1000 requests per hour for read-only endpoints

## Webhook Support (Future)

Future versions will support webhooks for:
- Analysis completion notifications
- Grade updates to Moodle
- Automated feedback delivery
