# API Documentation

## Base URL

```
http://localhost:8000/api/v1
```

## Interactive Documentation

FastAPI provides interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication

Currently the API does not require authentication for development.
In production, implement JWT token-based authentication.

## Endpoints

### Health Check

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### Students

#### POST /api/v1/students/

Create a new student.

**Request Body:**
```json
{
  "moodle_user_id": 123,
  "username": "student1",
  "email": "student@example.com",
  "full_name": "John Doe",
  "grade_level": "Grade 5"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "moodle_user_id": 123,
  "username": "student1",
  "email": "student@example.com",
  "full_name": "John Doe",
  "grade_level": "Grade 5",
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

#### GET /api/v1/students/{student_id}

Get student by ID.

**Response:** `200 OK`

#### GET /api/v1/students/moodle/{moodle_user_id}

Get student by Moodle user ID.

**Response:** `200 OK`

#### POST /api/v1/students/sync/{moodle_user_id}

Sync student data from Moodle.

**Response:** `200 OK`

---

### Problems

#### GET /api/v1/problems/pattern-types

Get all pattern types.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Rotation",
    "description": "Elements rotate positions in a circular pattern",
    "difficulty_level": "beginner",
    "pattern_rule": "{\"type\": \"rotation\", \"direction\": \"right\", \"steps\": 1}"
  }
]
```

#### GET /api/v1/problems/

Get problems with optional filters.

**Query Parameters:**
- `difficulty`: `beginner` | `intermediate` | `advanced` | `expert`
- `pattern_type_id`: integer
- `is_active`: boolean
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "pattern_type_id": 1,
    "moodle_question_id": 1001,
    "title": "Basic Rotation",
    "description": "Rotate the elements one position to the right",
    "initial_sequence": ["A", "B", "C", "D"],
    "pattern_hint": "Each element moves one position to the right",
    "difficulty_level": "beginner",
    "time_limit_seconds": 300,
    "max_attempts": 3,
    "points": 10,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

#### GET /api/v1/problems/{problem_id}

Get problem by ID with full details including pattern type.

**Response:** `200 OK`

#### GET /api/v1/problems/random/next

Get a random problem for practice.

**Query Parameters:**
- `difficulty`: `beginner` | `intermediate` | `advanced` | `expert`
- `pattern_type_id`: integer

**Response:** `200 OK`

#### POST /api/v1/problems/

Create a new problem.

**Request Body:**
```json
{
  "pattern_type_id": 1,
  "moodle_question_id": 2001,
  "title": "New Pattern",
  "description": "Description here",
  "initial_sequence": ["1", "2", "3"],
  "target_sequence": ["3", "1", "2"],
  "pattern_hint": "Hint here",
  "difficulty_level": "intermediate",
  "time_limit_seconds": 300,
  "max_attempts": 3,
  "points": 15
}
```

**Response:** `201 Created`

---

### Attempts

#### POST /api/v1/attempts/

Submit an attempt for a problem.

**Request Body:**
```json
{
  "problem_id": 1,
  "student_id": 1,
  "submitted_sequence": ["D", "A", "B", "C"],
  "time_spent_seconds": 45
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "student_id": 1,
  "problem_id": 1,
  "submitted_sequence": ["D", "A", "B", "C"],
  "is_correct": true,
  "time_spent_seconds": 45,
  "score": 15,
  "attempt_number": 1,
  "feedback": "Correct! Well done!",
  "submitted_at": "2025-01-01T00:00:00"
}
```

#### GET /api/v1/attempts/student/{student_id}

Get all attempts for a student.

**Query Parameters:**
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "student_id": 1,
    "problem_id": 1,
    "submitted_sequence": ["D", "A", "B", "C"],
    "is_correct": true,
    "time_spent_seconds": 45,
    "score": 15,
    "attempt_number": 1,
    "feedback": "Correct! Well done!",
    "submitted_at": "2025-01-01T00:00:00"
  }
]
```

#### GET /api/v1/attempts/progress/{student_id}

Get student progress across all pattern types.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "student_id": 1,
    "pattern_type_id": 1,
    "problems_attempted": 5,
    "problems_solved": 4,
    "total_score": 75,
    "average_time_seconds": 60.5,
    "mastery_level": 80.0,
    "last_activity_at": "2025-01-01T00:00:00",
    "pattern_type": {
      "id": 1,
      "name": "Rotation",
      "description": "Elements rotate positions",
      "difficulty_level": "beginner",
      "pattern_rule": "{...}"
    }
  }
]
```

---

## Scoring System

The scoring algorithm considers:

1. **Base Points**: Defined per problem (default: 10)
2. **Time Bonus**: Up to 50% extra for fast completion
   - < 50% of time limit: 1.5x points
   - < 75% of time limit: 1.25x points
3. **Attempt Penalty**: 10% reduction per retry
   - 1st attempt: 100%
   - 2nd attempt: 90%
   - 3rd attempt: 80%

**Formula:**
```
if incorrect: score = 0
else:
  score = base_points
  if time < limit * 0.5: score *= 1.5
  elif time < limit * 0.75: score *= 1.25
  score *= (1 - 0.1 * (attempt_number - 1))
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "detail": "Error message here"
}
```

**Common Status Codes:**
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production.

## CORS

CORS is configured to allow requests from:
- `http://localhost:3000`
- `http://localhost:5173`

Update `backend/app/core/config.py` for production domains.
