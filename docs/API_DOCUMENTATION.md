# API Documentation

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication
Currently, the API does not require authentication for development. In production, implement JWT-based authentication.

## Endpoints

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "emotion-tracking-api"
}
```

---

## Emotion Endpoints

### POST /emotions
Create a new emotion record.

**Request Body:**
```json
{
  "student_id": "uuid",
  "session_id": "uuid (optional)",
  "emotion_type": "happy|neutral|confused|frustrated|confident",
  "intensity": 1-5,
  "note": "string (optional)",
  "context": {} // optional JSON object
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "session_id": "uuid",
  "emotion_type": "happy",
  "intensity": 4,
  "note": "이해가 되기 시작했어요!",
  "context": null,
  "recorded_at": "2024-01-15T10:30:00.000Z",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### GET /emotions/student/:studentId
Get emotion records for a student.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "emotion_type": "happy",
    "intensity": 4,
    "recorded_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### GET /emotions/session/:sessionId
Get all emotions for a specific learning session.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "emotion_type": "confused",
    "intensity": 3,
    "recorded_at": "2024-01-15T10:15:00.000Z"
  }
]
```

### GET /emotions/student/:studentId/distribution
Get emotion distribution for a student.

**Query Parameters:**
- `days` (optional): Number of days to include (default: 7)

**Response:** `200 OK`
```json
{
  "happy": 10,
  "neutral": 5,
  "confused": 3,
  "frustrated": 2,
  "confident": 8
}
```

### PUT /emotions/:id
Update an emotion record.

**Request Body:**
```json
{
  "emotion_type": "happy",
  "intensity": 5,
  "note": "완전히 이해했어요!"
}
```

**Response:** `200 OK`

### DELETE /emotions/:id
Delete an emotion record.

**Response:** `204 No Content`

---

## Session Endpoints

### POST /sessions/start
Start a new learning session.

**Request Body:**
```json
{
  "student_id": "uuid",
  "course_id": "MATH101",
  "course_name": "미적분학 기초",
  "activity_type": "lecture|assignment|quiz|reading|discussion|video (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "course_id": "MATH101",
  "course_name": "미적분학 기초",
  "started_at": "2024-01-15T10:00:00.000Z",
  "ended_at": null,
  "duration_minutes": null,
  "activity_type": "lecture",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

### PUT /sessions/:id/end
End a learning session.

**Request Body:**
```json
{
  "ended_at": "2024-01-15T11:30:00.000Z (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "course_id": "MATH101",
  "started_at": "2024-01-15T10:00:00.000Z",
  "ended_at": "2024-01-15T11:30:00.000Z",
  "duration_minutes": 90,
  "activity_type": "lecture"
}
```

### GET /sessions/:id
Get a specific session.

**Response:** `200 OK`

### GET /sessions/student/:studentId
Get all sessions for a student.

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)

**Response:** `200 OK`

### GET /sessions/student/:studentId/active
Get active sessions for a student.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "course_name": "미적분학 기초",
    "started_at": "2024-01-15T10:00:00.000Z",
    "ended_at": null
  }
]
```

### GET /sessions/student/:studentId/stats
Get session statistics.

**Query Parameters:**
- `days` (optional): Number of days (default: 7)

**Response:** `200 OK`
```json
{
  "total_sessions": 15,
  "total_minutes": 1350,
  "avg_duration": 90,
  "max_duration": 120
}
```

---

## Summary Endpoints

### GET /summaries/student/:studentId
Get daily summary for a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "summary_date": "2024-01-15",
  "total_learning_minutes": 180,
  "session_count": 2,
  "emotion_distribution": {
    "happy": 5,
    "neutral": 3,
    "confused": 2,
    "frustrated": 1,
    "confident": 4
  },
  "dominant_emotion": "happy",
  "average_intensity": 3.67,
  "emotion_trend": "improving",
  "notes": null,
  "generated_at": "2024-01-16T00:00:00.000Z"
}
```

### GET /summaries/student/:studentId/range
Get daily summaries for a date range.

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "summary_date": "2024-01-15",
    "dominant_emotion": "happy",
    "emotion_trend": "improving"
  }
]
```

### POST /summaries/student/:studentId/generate
Manually generate a daily summary.

**Request Body:**
```json
{
  "date": "2024-01-15"
}
```

**Response:** `201 Created`

### POST /summaries/generate-all
Generate summaries for all students (admin only).

**Request Body:**
```json
{
  "date": "2024-01-15 (optional)"
}
```

**Response:** `201 Created`
```json
{
  "message": "Generated 25 summaries",
  "summaries": [...]
}
```

### POST /summaries/trigger-yesterday
Trigger yesterday's summary generation (for testing cron job).

**Response:** `200 OK`
```json
{
  "message": "Generated 25 summaries for yesterday",
  "count": 25
}
```

---

## LMS Endpoints

### POST /lms/integrations
Create a new LMS integration.

**Request Body:**
```json
{
  "institution_name": "KAIST Touch Math Academy",
  "lms_type": "canvas|moodle|google_classroom|kaist",
  "lms_url": "https://lms.kaist.ac.kr",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "config": {} // optional configuration
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "institution_name": "KAIST Touch Math Academy",
  "lms_type": "kaist",
  "lms_url": "https://lms.kaist.ac.kr",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

### GET /lms/integrations/:id
Get LMS integration details.

**Response:** `200 OK`

### GET /lms/integrations
Get all active LMS integrations.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "institution_name": "KAIST Touch Math Academy",
    "lms_type": "kaist",
    "is_active": true
  }
]
```

### POST /lms/integrations/:id/sync
Sync students from LMS.

**Response:** `200 OK`
```json
{
  "message": "Successfully synced 150 students",
  "count": 150,
  "students": [...]
}
```

### POST /lms/integrations/:id/tokens
Store OAuth tokens.

**Request Body:**
```json
{
  "access_token": "token",
  "refresh_token": "token (optional)",
  "expires_in": 3600
}
```

**Response:** `200 OK`
```json
{
  "message": "Tokens stored successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "..." // only in development mode
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, implement rate limiting to prevent abuse.

## Pagination

For endpoints returning lists, implement pagination in production:
```
GET /emotions/student/:studentId?page=1&limit=20
```

## Filtering and Sorting

Consider adding query parameters for filtering and sorting:
```
GET /emotions/student/:studentId?emotion_type=happy&sort=recorded_at&order=desc
```
