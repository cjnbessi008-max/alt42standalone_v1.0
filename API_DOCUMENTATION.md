# API Documentation

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication
Currently using simple user ID authentication. JWT tokens can be implemented for production.

---

## Health Check

### `GET /health`
Check API health status and database connections.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "services": {
    "api": "running",
    "postgresql": "connected",
    "moodleMySQL": "connected"
  }
}
```

---

## Routine Endpoints

### `GET /routines/types`
Get all active routine types.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "4-7-8 Breathing",
      "nameKo": "4-7-8 호흡법",
      "category": "breathing",
      "description": "A relaxing breathing pattern...",
      "duration": 120,
      "difficulty": "easy",
      "content": { "steps": [...], "tips": "..." }
    }
  ]
}
```

### `GET /routines/types/category/:category`
Get routine types by category.

**Parameters**
- `category`: breathing | meditation | stretching | break | message

**Response**
```json
{
  "success": true,
  "data": [...]
}
```

### `GET /routines/recommend/:userId`
Get recommended routine for a user.

**Parameters**
- `userId`: User UUID

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Box Breathing",
    "nameKo": "박스 호흡법",
    ...
  }
}
```

### `POST /routines/start`
Start a new routine session.

**Request Body**
```json
{
  "userId": "uuid",
  "routineTypeId": "uuid",
  "moodleQuizId": 123,
  "moodleAttemptId": 456,
  "triggerReason": "correct_answer"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "record-uuid",
    "userId": "uuid",
    "routineTypeId": "uuid",
    "completed": false,
    "createdAt": "2025-11-18T10:30:00.000Z",
    "routineType": { ... }
  }
}
```

### `POST /routines/complete`
Complete a routine session.

**Request Body**
```json
{
  "routineRecordId": "uuid",
  "rating": 5,
  "feedback": "Very helpful!",
  "duration": 118
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "record-uuid",
    "completed": true,
    "completedAt": "2025-11-18T10:32:00.000Z",
    "rating": 5,
    "feedback": "Very helpful!",
    "duration": 118
  }
}
```

### `GET /routines/history/:userId`
Get user's routine history.

**Parameters**
- `userId`: User UUID
- `limit` (query): Number of records (default: 20)

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "record-uuid",
      "userId": "uuid",
      "completed": true,
      "rating": 4,
      "createdAt": "2025-11-18T10:00:00.000Z",
      "routineType": { ... }
    }
  ]
}
```

### `GET /routines/statistics/:userId`
Get user's routine statistics.

**Response**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "totalRoutines": 25,
    "completedRoutines": 20,
    "totalDuration": 3000,
    "averageRating": 4.2,
    "correctAnswerStreak": 5,
    "lastRoutineAt": "2025-11-18T10:00:00.000Z",
    "favoriteRoutineTypeId": "uuid"
  }
}
```

---

## Moodle Endpoints

### `GET /moodle/user/:userId`
Get Moodle user information.

**Parameters**
- `userId`: Moodle user ID (number)

**Response**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "username": "student01",
    "email": "student@example.com",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### `GET /moodle/attempts/recent`
Get recent quiz attempts.

**Query Parameters**
- `after`: Unix timestamp (optional)

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "quiz": 45,
      "userid": 12345,
      "attempt": 1,
      "state": "finished",
      "timestart": 1700123456,
      "timefinish": 1700123789
    }
  ]
}
```

### `GET /moodle/attempt/:attemptId/analyze`
Analyze a quiz attempt.

**Parameters**
- `attemptId`: Moodle attempt ID

**Response**
```json
{
  "success": true,
  "data": {
    "attemptId": 123,
    "userId": 12345,
    "quizId": 45,
    "correctAnswers": 8,
    "totalQuestions": 10,
    "isCorrectAnswer": true,
    "timefinish": 1700123789
  }
}
```

### `GET /moodle/user/:userId/streak`
Get user's correct answer streak.

**Parameters**
- `userId`: Moodle user ID
- `limit` (query): Number of attempts to check (default: 10)

**Response**
```json
{
  "success": true,
  "data": {
    "userId": 12345,
    "streak": 3
  }
}
```

### `GET /moodle/quiz/:quizId`
Get quiz information.

**Response**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "name": "Mathematics Quiz 1",
    "intro": "Test your knowledge...",
    "timeopen": 1700000000,
    "timeclose": 1700100000
  }
}
```

---

## User Endpoints

### `POST /users/sync`
Sync user from Moodle to application database.

**Request Body**
```json
{
  "moodleUserId": 12345
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "moodleUserId": 12345,
    "username": "student01",
    "email": "student@example.com",
    "fullName": "John Doe",
    "role": "STUDENT",
    "createdAt": "2025-11-18T10:00:00.000Z"
  }
}
```

### `GET /users/:userId`
Get user by application user ID.

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "moodleUserId": 12345,
    "username": "student01",
    "email": "student@example.com",
    "fullName": "John Doe",
    "role": "STUDENT",
    "preferences": { ... },
    "statistics": { ... }
  }
}
```

### `GET /users/moodle/:moodleUserId`
Get user by Moodle user ID.

**Response**
Same as above.

### `PUT /users/:userId/preferences`
Update user preferences.

**Request Body**
```json
{
  "preferences": {
    "favoriteRoutines": ["uuid1", "uuid2"],
    "autoTrigger": true,
    "notificationsEnabled": true
  }
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "preferences": { ... }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Webhook Support (Future)

Future versions will support webhooks for:
- Quiz completion events
- Routine recommendations
- Statistics updates

---

## Example Usage

### JavaScript/Fetch

```javascript
// Start a routine
const response = await fetch('http://localhost:4000/api/v1/routines/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    routineTypeId: 'routine-uuid',
    triggerReason: 'manual',
  }),
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
# Get routine types
curl http://localhost:4000/api/v1/routines/types

# Get recommendation
curl http://localhost:4000/api/v1/routines/recommend/user-uuid

# Complete routine
curl -X POST http://localhost:4000/api/v1/routines/complete \
  -H "Content-Type: application/json" \
  -d '{
    "routineRecordId": "record-uuid",
    "rating": 5,
    "duration": 120
  }'
```

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
