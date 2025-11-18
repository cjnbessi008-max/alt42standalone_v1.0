# API Documentation

## Base URL

```
http://localhost:8080/api
```

## Authentication

Currently, the API does not require authentication for development. In production, use JWT tokens:

```
Authorization: Bearer <token>
```

## Endpoints

### Problems

#### Get All Problems

```http
GET /api/problems
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10)
- `category` (optional): Filter by category (e.g., "algebra")

**Response:**

```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": 1,
        "title": "Combining Like Terms",
        "description": "Learn how to combine like terms",
        "initial_expression": "2x + 3x + 5",
        "target_expression": "5x + 5",
        "steps": [...],
        "difficulty": "easy",
        "category": "algebra",
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "perPage": 10
  }
}
```

#### Get Single Problem

```http
GET /api/problems/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Combining Like Terms",
    "description": "Learn how to combine like terms",
    "initial_expression": "2x + 3x + 5",
    "target_expression": "5x + 5",
    "steps": [
      {
        "id": "step1",
        "description": "Initial expression",
        "descriptionKo": "초기 수식",
        "duration": 2
      }
    ],
    "difficulty": "easy",
    "category": "algebra"
  }
}
```

#### Create Problem

```http
POST /api/problems
```

**Request Body:**

```json
{
  "title": "New Problem",
  "description": "Problem description",
  "initialExpression": "x + 2x",
  "targetExpression": "3x",
  "steps": [
    {
      "id": "step1",
      "description": "Combine like terms",
      "descriptionKo": "동류항 결합",
      "duration": 3
    }
  ],
  "difficulty": "easy",
  "category": "algebra"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 3
  },
  "message": "Problem created successfully"
}
```

#### Update Problem

```http
PUT /api/problems/:id
```

**Request Body:** (All fields optional)

```json
{
  "title": "Updated Title",
  "difficulty": "medium"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Problem updated successfully"
}
```

#### Delete Problem

```http
DELETE /api/problems/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

### Progress

#### Get Student Progress

```http
GET /api/progress?problem_id=1&student_id=1
```

**Query Parameters:**
- `problem_id` (required): Problem ID
- `student_id` (required): Student ID (Moodle user ID)

**Response:**

```json
{
  "success": true,
  "data": {
    "problemId": 1,
    "studentId": 1,
    "currentStep": 2,
    "totalSteps": 3,
    "completed": false,
    "timeSpent": 45,
    "attempts": 3
  }
}
```

#### Update Progress

```http
POST /api/progress
```

**Request Body:**

```json
{
  "problemId": 1,
  "studentId": 1,
  "currentStep": 2,
  "totalSteps": 3,
  "completed": false,
  "timeSpent": 15
}
```

**Response:**

```json
{
  "success": true,
  "message": "Progress updated successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required fields: title, description"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Problem not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Database connection failed"
}
```

## Data Models

### Problem Object

```typescript
{
  id: number;
  title: string;
  description: string;
  initial_expression: string;
  target_expression: string;
  steps: AnimationStep[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at: string;
  updated_at: string;
}
```

### AnimationStep Object

```typescript
{
  id: string;
  description: string;
  descriptionKo: string;
  duration: number;
}
```

### Progress Object

```typescript
{
  problemId: number;
  studentId: number;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  timeSpent: number;  // in seconds
  attempts: number;
}
```

## Rate Limiting

Currently no rate limiting in development. Production will have:
- 100 requests per minute per IP
- 1000 requests per day per user

## CORS

CORS is enabled for all origins in development:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Examples

### cURL

```bash
# Get all problems
curl http://localhost:8080/api/problems

# Get specific problem
curl http://localhost:8080/api/problems/1

# Create problem
curl -X POST http://localhost:8080/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Problem",
    "description": "Description",
    "initialExpression": "x + 2x",
    "targetExpression": "3x",
    "steps": [],
    "difficulty": "easy",
    "category": "algebra"
  }'

# Update progress
curl -X POST http://localhost:8080/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": 1,
    "studentId": 1,
    "currentStep": 2,
    "timeSpent": 30
  }'
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get problems
const response = await api.get('/problems', {
  params: { category: 'algebra', page: 1 }
});

// Update progress
await api.post('/progress', {
  problemId: 1,
  studentId: 1,
  currentStep: 2,
  timeSpent: 30
});
```
