# API Documentation

## Base URL

Development: `http://localhost:5000`
Production: `https://your-domain.com`

## Authentication

Most endpoints do not require authentication for demo purposes. In production, implement JWT or session-based authentication.

For LTI launches, authentication is handled automatically through the LTI flow.

---

## Game Endpoints

### Start Game Session

Start a new game session for a student.

**Endpoint:** `POST /api/game/start`

**Request Body:**
```json
{
  "student_id": "string (UUID)",
  "lms_launch_id": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "student_id": "uuid",
    "started_at": "2024-01-01T10:00:00",
    "ended_at": null,
    "total_problems": 0,
    "correct_answers": 0,
    "duration_seconds": null,
    "difficulty_level": 1,
    "is_completed": false,
    "accuracy": 0
  }
}
```

---

### Get Session

Retrieve details of a game session.

**Endpoint:** `GET /api/game/session/{session_id}`

**Response:** `200 OK`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "student_id": "uuid",
    "started_at": "2024-01-01T10:00:00",
    "ended_at": null,
    "total_problems": 5,
    "correct_answers": 4,
    "duration_seconds": null,
    "difficulty_level": 1,
    "is_completed": false,
    "accuracy": 80.0
  }
}
```

---

### Get Next Problem

Generate and retrieve the next problem for a session.

**Endpoint:** `POST /api/game/problem`

**Request Body:**
```json
{
  "session_id": "string (UUID)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "problem": {
    "id": "uuid",
    "session_id": "uuid",
    "problem_type": "addition",
    "operand_1": 5,
    "operand_2": 3,
    "difficulty_level": 1,
    "question": "5 + 3"
  }
}
```

**Problem Types:**
- `addition`: Addition problems
- `subtraction`: Subtraction problems
- `multiplication`: Multiplication problems

---

### Submit Answer

Submit an answer to a problem.

**Endpoint:** `POST /api/game/answer`

**Request Body:**
```json
{
  "problem_id": "string (UUID)",
  "session_id": "string (UUID)",
  "student_id": "string (UUID)",
  "answer": 8,
  "time_spent": 5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "answer_id": "uuid",
  "is_correct": true,
  "correct_answer": null,
  "feedback": "잘했어요! 🌟"
}
```

If incorrect:
```json
{
  "success": true,
  "answer_id": "uuid",
  "is_correct": false,
  "correct_answer": 8,
  "feedback": "아쉬워요. 다시 한번 생각해볼까요? 💪"
}
```

---

### End Session

End a game session and mark it as completed.

**Endpoint:** `POST /api/game/session/{session_id}/end`

**Response:** `200 OK`
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "student_id": "uuid",
    "started_at": "2024-01-01T10:00:00",
    "ended_at": "2024-01-01T10:05:30",
    "total_problems": 10,
    "correct_answers": 8,
    "duration_seconds": 330,
    "difficulty_level": 2,
    "is_completed": true,
    "accuracy": 80.0
  }
}
```

---

### Health Check

Check if the game API is running.

**Endpoint:** `GET /api/game/health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "DMN Math Game API"
}
```

---

## Student Endpoints

### Get Student Progress

Get overall progress statistics for a student.

**Endpoint:** `GET /api/student/{student_id}/progress`

**Response:** `200 OK`
```json
{
  "success": true,
  "progress": {
    "id": "uuid",
    "student_id": "uuid",
    "current_difficulty_level": 2,
    "total_sessions": 15,
    "total_problems_solved": 150,
    "total_correct_answers": 135,
    "average_accuracy": 90.0,
    "last_session_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:05:30"
  }
}
```

If no progress exists:
```json
{
  "success": true,
  "progress": null,
  "message": "No progress data available"
}
```

---

### Get Session History

Get recent game sessions for a student.

**Endpoint:** `GET /api/student/{student_id}/sessions?limit=10`

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "started_at": "2024-01-01T10:00:00",
      "ended_at": "2024-01-01T10:05:30",
      "total_problems": 10,
      "correct_answers": 8,
      "duration_seconds": 330,
      "difficulty_level": 2,
      "is_completed": true,
      "accuracy": 80.0
    }
  ],
  "count": 1
}
```

---

### Create Student

Create a new student record.

**Endpoint:** `POST /api/student/create`

**Request Body:**
```json
{
  "name": "Test Student",
  "email": "student@example.com",
  "grade_level": "3",
  "lms_user_id": "optional-lms-id"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "lms_user_id": "optional-lms-id",
    "name": "Test Student",
    "email": "student@example.com",
    "grade_level": "3",
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:00:00"
  }
}
```

---

### Get Student by ID

Get student information by ID.

**Endpoint:** `GET /api/student/{student_id}`

**Response:** `200 OK`
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "lms_user_id": "optional-lms-id",
    "name": "Test Student",
    "email": "student@example.com",
    "grade_level": "3",
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:00:00"
  }
}
```

---

### Get Student by LMS ID

Get student information by LMS user ID.

**Endpoint:** `GET /api/student/lms/{lms_user_id}`

**Response:** `200 OK` or `404 Not Found`
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "lms_user_id": "lms-user-123",
    "name": "Test Student",
    "email": "student@example.com",
    "grade_level": "3",
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:00:00"
  }
}
```

---

## LTI Endpoints

### LTI Login Initiation

LTI 1.3 login initiation endpoint.

**Endpoint:** `POST /api/lti/login` or `GET /api/lti/login`

**Parameters:**
- `target_link_uri`: Target URI after login

**Response:** Redirect to LMS authorization

---

### LTI Launch

LTI 1.3 launch endpoint.

**Endpoint:** `POST /api/lti/launch`

**Request:** LTI launch message from LMS

**Response:** Redirect to game with session ID

---

### JWKS Endpoint

Public JSON Web Key Set for LTI signature verification.

**Endpoint:** `GET /api/lti/jwks`

**Response:** `200 OK`
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-id",
      "n": "modulus",
      "e": "exponent"
    }
  ]
}
```

---

### LTI Configuration

Get LTI tool configuration JSON for LMS registration.

**Endpoint:** `GET /api/lti/config.json`

**Response:** `200 OK`
```json
{
  "title": "DMN Math Game",
  "description": "A mini arithmetic game for Default Mode Network recovery",
  "oidc_initiation_url": "https://your-domain.com/api/lti/login",
  "target_link_uri": "https://your-domain.com/api/lti/launch",
  "scopes": [
    "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
    "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
    "https://purl.imsglobal.org/spec/lti-ags/scope/score"
  ],
  "public_jwk_url": "https://your-domain.com/api/lti/jwks"
}
```

---

### Send Grade to LMS

Send grade back to LMS (for assignments).

**Endpoint:** `POST /api/lti/grade`

**Request Body:**
```json
{
  "session_id": "uuid",
  "score": 85.5
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "score": 85.5,
  "message": "Grade sent to LMS"
}
```

---

## Error Responses

All endpoints may return error responses:

### 400 Bad Request
```json
{
  "error": "student_id is required"
}
```

### 404 Not Found
```json
{
  "error": "Session not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

No rate limiting is currently implemented. For production, consider:
- 100 requests/minute per IP for game endpoints
- 1000 requests/minute for read-only endpoints

---

## CORS

CORS is configured to allow requests from:
- `http://localhost:3000` (development)
- Your production domain

---

## Webhooks (Future)

Future versions may support webhooks for:
- Session completion notifications
- Progress milestones
- Achievement unlocks

---

## SDK/Client Libraries

Currently, the frontend provides a TypeScript API client in `frontend/src/services/api.ts`.

---

## Testing the API

### Using cURL

```bash
# Start a session
curl -X POST http://localhost:5000/api/game/start \
  -H "Content-Type: application/json" \
  -d '{"student_id": "demo-student-123"}'

# Get next problem
curl -X POST http://localhost:5000/api/game/problem \
  -H "Content-Type: application/json" \
  -d '{"session_id": "your-session-id"}'

# Submit answer
curl -X POST http://localhost:5000/api/game/answer \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "problem-id",
    "session_id": "session-id",
    "student_id": "student-id",
    "answer": 8,
    "time_spent": 5
  }'
```

### Using Postman

Import the API into Postman:
1. Create a new collection
2. Add requests for each endpoint
3. Use environment variables for base URL and IDs

---

## Support

For API questions or issues:
- Check the [main README](../README.md)
- Review error messages in responses
- Enable debug mode and check logs
