# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer ${TOKEN}
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "service": "3D Matching Guide API"
}
```

---

## Problems

### GET /api/problems

Get all problems with optional filters.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `difficulty` (integer, optional): Filter by difficulty level (1-5)
- `isActive` (boolean, optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "title": "Basic 3D Matching",
      "title_ko": "기본 입체도형 매칭",
      "difficulty_level": 1,
      "category": "geometry_basics",
      "creator_name": "teacher1",
      "pair_count": 6,
      "created_at": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

### GET /api/problems/:id

Get problem details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Basic 3D Matching",
    "title_ko": "기본 입체도형 매칭",
    "description": "Match 3D shapes with their corresponding 2D cross-sections",
    "difficulty_level": 1,
    "time_limit_seconds": 300,
    "creator_name": "teacher1"
  }
}
```

### GET /api/problems/:id/pairs

Get matching pairs for a problem.

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": 1,
      "problem_id": 1,
      "shape_3d_id": 1,
      "shape_3d_name": "Cube",
      "shape_3d_name_ko": "정육면체",
      "shape_2d_id": 1,
      "shape_2d_name": "Square",
      "shape_2d_name_ko": "정사각형",
      "is_correct_match": true,
      "display_order": 1
    }
  ]
}
```

### POST /api/problems

Create a new problem.

**Request Body:**
```json
{
  "title": "Advanced 3D Matching",
  "title_ko": "고급 입체도형 매칭",
  "description": "Match complex 3D shapes",
  "description_ko": "복잡한 입체도형 매칭하기",
  "difficulty_level": 3,
  "category": "geometry_advanced",
  "instructions": "Drag each 3D shape to its matching 2D shape",
  "instructions_ko": "각 입체도형을 해당하는 평면도형으로 드래그하세요",
  "time_limit_seconds": 600,
  "created_by": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Advanced 3D Matching",
    "created_at": "2023-12-01T10:30:00.000Z"
  }
}
```

### PUT /api/problems/:id

Update a problem.

**Request Body:**
```json
{
  "title": "Updated Title",
  "difficulty_level": 2,
  "is_active": true
}
```

### DELETE /api/problems/:id

Delete a problem.

**Response:**
```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

---

## Matching

### POST /api/matching/submit

Submit a matching answer.

**Request Body:**
```json
{
  "student_id": 2,
  "problem_id": 1,
  "shape_3d_id": 1,
  "shape_2d_id": 1,
  "response_time_ms": 3500,
  "attempt_number": 1,
  "gesture_data": {
    "start_x": 100,
    "start_y": 150,
    "end_x": 300,
    "end_y": 450,
    "timestamp": "2023-12-01T10:00:05.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": {
      "id": 123,
      "is_correct": true,
      "submitted_at": "2023-12-01T10:00:05.000Z"
    },
    "is_correct": true,
    "progress": {
      "correct_matches": 3,
      "total_matches": 6,
      "is_completed": false
    }
  }
}
```

### GET /api/matching/progress/:studentId/:problemId

Get student progress for a specific problem.

**Response:**
```json
{
  "success": true,
  "data": {
    "student_id": 2,
    "problem_id": 1,
    "status": "in_progress",
    "score": 50.00,
    "attempts": 5,
    "time_spent_seconds": 120,
    "correct_matches": 3,
    "total_matches": 6,
    "started_at": "2023-12-01T10:00:00.000Z"
  }
}
```

### GET /api/matching/responses/:studentId

Get all responses for a student.

**Query Parameters:**
- `problemId` (integer, optional): Filter by problem ID

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 123,
      "student_id": 2,
      "problem_id": 1,
      "shape_3d_name_ko": "정육면체",
      "shape_2d_name_ko": "정사각형",
      "is_correct": true,
      "response_time_ms": 3500,
      "submitted_at": "2023-12-01T10:00:05.000Z"
    }
  ]
}
```

---

## LMS Integration

### POST /api/lms/sync

Sync with LMS (requires LMS integration enabled).

**Request Body:**
```json
{
  "lms_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "LMS sync initiated",
  "note": "Full LMS integration coming in Phase 3"
}
```

### GET /api/lms/problems/:moduleId

Get problems from LMS module.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "title": "Basic 3D Matching",
      "lms_module_id": "mod_123",
      "pair_count": 6
    }
  ]
}
```

### POST /api/lms/configure

Configure LMS integration.

**Request Body:**
```json
{
  "lms_type": "moodle",
  "lms_url": "https://moodle.kaist.ac.kr",
  "lms_api_key": "your-api-key",
  "consumer_key": "your-consumer-key",
  "shared_secret": "your-shared-secret",
  "course_id": "course_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "lms_type": "moodle",
    "is_active": true
  },
  "message": "LMS integration configured successfully"
}
```

### GET /api/lms/status

Get LMS integration status.

**Response:**
```json
{
  "success": true,
  "enabled": false,
  "integrations": [],
  "note": "Full Moodle LTI integration will be available in Phase 3"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Headers included in response:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## CORS

CORS is enabled for the frontend origin specified in `.env`:

```
CORS_ORIGIN=http://localhost:3000
```

For production, update to your production domain.
