# Moodle LMS Reverse Problem Integration

## Overview

This document describes the integration between the AI Education System and Moodle 3.7 LMS, specifically the **Reverse Problem Reconstruction** feature.

### What is Reverse Problem Reconstruction?

Reverse Problem Reconstruction is an educational technique that:
1. **Analyzes existing problems** from Moodle quiz bank
2. **Extracts complexity metrics** (conditions, nesting depth, entities)
3. **Reconstructs problems** using various strategies:
   - **Reverse Solution**: Work backwards from answer to problem
   - **Decompose-Recompose**: Break down and reassemble problems
   - **Complexity Variation**: Generate easier/harder versions
   - **Pattern Extraction**: Extract patterns and create new problems

## System Requirements

- **Moodle Version**: 3.7+
- **PHP Version**: 7.1.9+
- **MySQL Version**: 5.7+
- **Python Version**: 3.11+
- **FastAPI**: 0.104.1+

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Moodle Client (moodle_client.py)                    │  │
│  │  - Web Services API integration                      │  │
│  │  - Question/Quiz fetching                            │  │
│  │  - Authentication                                     │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  Reverse Problem Reconstructor                        │  │
│  │  - Complexity analysis                                │  │
│  │  - Problem decomposition                              │  │
│  │  - Reconstruction strategies                          │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  REST API Endpoints (complexity_api.py)              │  │
│  │  - /api/v1/moodle/test-connection                    │  │
│  │  - /api/v1/moodle/quiz/{id}/questions                │  │
│  │  - /api/v1/moodle/reconstruct                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐              ┌───────▼────────┐
│  Moodle 3.7    │              │  MySQL 5.7     │
│  Web Services  │              │  Database      │
│  API           │              │                │
└────────────────┘              └────────────────┘
```

## Setup Instructions

### 1. Configure Moodle Web Services

#### Step 1: Enable Web Services in Moodle

1. Log in to Moodle as administrator
2. Navigate to: **Site Administration → Advanced features**
3. Check **Enable web services**
4. Click **Save changes**

#### Step 2: Create a Web Service

1. Navigate to: **Site Administration → Server → Web services → External services**
2. Click **Add** to create a new service
3. Configure:
   - **Name**: AI Education System Integration
   - **Short name**: ai_education
   - **Enabled**: Yes
   - **Authorized users only**: Yes (recommended)
4. Click **Add service**

#### Step 3: Add Functions to Web Service

Add the following functions to your web service:

- `core_webservice_get_site_info` - Test connection
- `mod_quiz_get_quizzes_by_courses` - Get quiz list
- `mod_quiz_get_quiz_structure` - Get quiz structure
- `core_question_get_question_data` - Get question details
- `core_question_get_random_question_summaries` - Get questions by category

To add functions:
1. Click **Functions** next to your service
2. Click **Add functions**
3. Search and add each function above

#### Step 4: Create a User and Assign Role

1. Create a dedicated user: **Site Administration → Users → Add a new user**
   - Username: `ai_education_system`
   - Set a strong password
2. Assign role: **Site Administration → Users → Define roles**
   - Create role: **AI Education Integration**
   - Capabilities needed:
     - `moodle/webservice:createtoken`
     - `mod/quiz:view`
     - `moodle/question:viewall`

#### Step 5: Generate Web Service Token

1. Navigate to: **Site Administration → Server → Web services → Manage tokens**
2. Click **Add**
3. Configure:
   - **User**: Select the user created in Step 4
   - **Service**: Select your service from Step 2
4. Click **Save changes**
5. **Copy the token** - you'll need this for configuration

### 2. Configure Application Environment

#### Step 1: Copy Environment Template

```bash
cd /home/user/alt42standalone_v1.0
cp .env.example .env
```

#### Step 2: Edit Environment Configuration

Edit `.env` file with your Moodle details:

```bash
# Moodle LMS Configuration
MOODLE_BASE_URL=https://your-moodle-site.com
MOODLE_WS_TOKEN=your_webservice_token_from_step_5

# Database Configuration (if using persistence)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alt42_moodle_integration
DB_USER=alt42_app
DB_PASSWORD=your_secure_password
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Setup Database (Optional - for persistence)

If you want to persist Moodle questions and reconstructed problems:

```bash
# Create database
mysql -u root -p
CREATE DATABASE alt42_moodle_integration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema
mysql -u root -p alt42_moodle_integration < backend/database/moodle_integration_schema.sql

# Create application user
CREATE USER 'alt42_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_moodle_integration.* TO 'alt42_app'@'localhost';
FLUSH PRIVILEGES;
```

Enable database persistence in `.env`:

```bash
FEATURE_DATABASE_PERSISTENCE=true
```

### 5. Start the API Server

```bash
cd backend
python -m uvicorn api.complexity_api:app --reload --host 0.0.0.0 --port 8000
```

### 6. Test Connection

```bash
curl http://localhost:8000/api/v1/moodle/test-connection
```

Expected response:
```json
{
  "status": "connected",
  "message": "Successfully connected to Moodle LMS"
}
```

## API Usage

### Authentication

All Moodle endpoints require proper environment configuration. The API will automatically use credentials from `.env` file.

### Endpoints

#### 1. Test Moodle Connection

**Endpoint**: `GET /api/v1/moodle/test-connection`

**Description**: Verify connection to Moodle LMS

**Example**:
```bash
curl http://localhost:8000/api/v1/moodle/test-connection
```

**Response**:
```json
{
  "status": "connected",
  "message": "Successfully connected to Moodle LMS"
}
```

---

#### 2. Get Quiz Questions with Complexity Analysis

**Endpoint**: `GET /api/v1/moodle/quiz/{quiz_id}/questions`

**Parameters**:
- `quiz_id` (path): Moodle quiz ID
- `language` (query, optional): Language for messages (`ko` or `en`, default: `ko`)

**Description**: Fetch all questions from a Moodle quiz and analyze their complexity

**Example**:
```bash
curl "http://localhost:8000/api/v1/moodle/quiz/123/questions?language=ko"
```

**Response**:
```json
[
  {
    "id": 456,
    "name": "분수의 덧셈",
    "question_text": "1/2 + 1/3은 얼마입니까?",
    "question_type": "numerical",
    "complexity_metrics": {
      "condition_count": 2,
      "nesting_depth": 1,
      "entity_count": 3,
      "has_cyclical_dependencies": false
    },
    "complexity_assessment": {
      "metrics": { ... },
      "level": "moderate",
      "requires_focus_card": false,
      "recommendations": [
        "문제가 적절한 복잡도입니다"
      ],
      "focus_message": null
    }
  }
]
```

---

#### 3. Get Single Question

**Endpoint**: `GET /api/v1/moodle/question/{question_id}`

**Parameters**:
- `question_id` (path): Moodle question ID
- `language` (query, optional): Language (`ko` or `en`)

**Example**:
```bash
curl "http://localhost:8000/api/v1/moodle/question/456?language=ko"
```

---

#### 4. Reconstruct Problem (Single)

**Endpoint**: `POST /api/v1/moodle/reconstruct`

**Description**: Reconstruct a Moodle problem using specified strategy

**Request Body**:
```json
{
  "question_id": 456,
  "strategy": "reverse_solution",
  "language": "ko"
}
```

**Reconstruction Strategies**:
- `reverse_solution`: Work backwards from solution to problem
- `decompose_recompose`: Break down and reassemble
- `complexity_variation`: Generate easier/harder versions
- `pattern_extraction`: Extract and apply patterns

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/moodle/reconstruct \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 456,
    "strategy": "reverse_solution",
    "language": "ko"
  }'
```

**Response**:
```json
{
  "original_id": 456,
  "original_text": "1/2 + 1/3은 얼마입니까?",
  "reconstructed_text": "[역으로 구성된 문제]\n\n주제: fraction\n연산: addition\n\n다음 답이 주어졌을 때, 원래 문제를 재구성하세요:\n\n답: [정답이 여기에 표시됨]\n\n...",
  "strategy": "reverse_solution",
  "structure": {
    "topic": "fraction",
    "operation": "addition",
    "entities": ["num_1", "num_2", "num_3"],
    "conditions": [],
    "solution_steps": [
      "Step 1: Identify the given values",
      "Step 2: Apply the mathematical operation",
      "Step 3: Calculate the result"
    ],
    "complexity_level": "moderate"
  },
  "complexity_metrics": { ... },
  "complexity_assessment": { ... },
  "variations": [
    "Variation with different numbers",
    "Same structure, different context"
  ]
}
```

---

#### 5. Batch Reconstruct Quiz

**Endpoint**: `POST /api/v1/moodle/reconstruct/batch`

**Description**: Reconstruct all problems in a quiz

**Request Body**:
```json
{
  "quiz_id": 123,
  "strategy": "decompose_recompose",
  "language": "ko"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/v1/moodle/reconstruct/batch \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 123,
    "strategy": "decompose_recompose",
    "language": "ko"
  }'
```

**Response**:
```json
{
  "quiz_id": 123,
  "total_questions": 10,
  "reconstructed_problems": [ ... ],
  "summary": {
    "by_complexity": {
      "simple": 3,
      "moderate": 5,
      "complex": 2,
      "very_complex": 0
    },
    "by_topic": {
      "fraction": 4,
      "algebra": 3,
      "geometry": 3
    },
    "by_operation": {
      "addition": 5,
      "multiplication": 3,
      "comparison": 2
    }
  }
}
```

## Reconstruction Strategies Explained

### 1. Reverse Solution (역순 풀이)

**Purpose**: Help students think backwards from solution to problem

**Process**:
1. Extract the expected answer/solution
2. Generate a problem template
3. Ask: "What problem would lead to this answer?"

**Use Case**: Enhancing problem-solving skills by reverse engineering

**Example**:
```
Original: "2 + 3 = ?"
Reconstructed: "Given the answer is 5, what addition problem was this?"
```

### 2. Decompose-Recompose (분해 재조합)

**Purpose**: Break complex problems into components and reassemble

**Process**:
1. Identify problem components (topic, operation, entities, conditions)
2. Decompose into steps
3. Reassemble in a new presentation format

**Use Case**: Making complex problems more understandable

**Example**:
```
Original: "If x + 5 = 10, what is x?"
Decomposed:
  - Step 1: Understand the equation
  - Step 2: Isolate variable x
  - Step 3: Calculate the result
```

### 3. Complexity Variation (복잡도 변형)

**Purpose**: Generate easier or harder versions of same problem

**Process**:
1. Analyze original complexity level
2. Generate 3 versions: easy, medium, hard
3. Adjust conditions, entities, or constraints

**Use Case**: Adaptive learning and differentiated instruction

**Example**:
```
Easy: "2 + 3 = ?"
Medium: "x + 3 = 5, find x"
Hard: "2x + 3 = 5 and x + y = 4, find x and y"
```

### 4. Pattern Extraction (패턴 추출)

**Purpose**: Identify problem patterns and apply to new contexts

**Process**:
1. Extract mathematical pattern/structure
2. Identify key concepts and relationships
3. Apply pattern to different scenario

**Use Case**: Transfer learning and pattern recognition

**Example**:
```
Original Pattern: "A has 5 apples, B has 3. How many total?"
New Context: "Team A scored 5 goals, Team B scored 3. Total?"
```

## Complexity Metrics

The system analyzes problems using these metrics:

### 1. Condition Count
- Number of logical conditions (if, when, unless)
- **Threshold**: > 5 = complex

### 2. Nesting Depth
- Levels of nested logic
- **Threshold**: > 3 = complex

### 3. Entity Count
- Number of concepts/entities involved
- **Threshold**: > 4 = complex

### 4. Cyclical Dependencies
- Presence of circular relationships
- **Threshold**: Any = very complex

### Complexity Levels
- **Simple**: Low complexity across all metrics
- **Moderate**: Some complexity in 1-2 metrics
- **Complex**: Exceeds 1+ thresholds
- **Very Complex**: Multiple high metrics or cyclical dependencies

## Troubleshooting

### Connection Issues

**Problem**: "Configuration error: Moodle configuration missing"

**Solution**:
```bash
# Check .env file exists and has correct values
cat .env | grep MOODLE

# Ensure environment variables are loaded
export $(cat .env | xargs)
```

---

**Problem**: "Moodle connection failed: HTTP error"

**Solutions**:
1. Verify Moodle URL is correct and accessible
2. Check firewall/network settings
3. Verify Moodle web services are enabled
4. Test token in Moodle: Administration → Web services → API documentation

---

### Authentication Issues

**Problem**: "Invalid token" error

**Solution**:
1. Regenerate token in Moodle
2. Verify token has correct permissions
3. Check user has required capabilities
4. Ensure token hasn't expired

---

### API Issues

**Problem**: "Failed to fetch quiz questions"

**Solutions**:
1. Verify quiz ID is correct
2. Check user has permission to view quiz
3. Ensure quiz contains questions
4. Check Moodle logs: Administration → Reports → Logs

---

### Performance Issues

**Problem**: Slow reconstruction for large quizzes

**Solutions**:
1. Use batch endpoint with smaller batch sizes
2. Enable caching in `.env`:
   ```bash
   FEATURE_COMPLEXITY_CACHE=true
   ```
3. Enable database persistence to avoid re-fetching
4. Consider async processing for large batches

## Development

### Running Tests

```bash
cd backend
pytest services/test_complexity_analyzer.py -v
```

### Code Style

```bash
# Format code
black backend/

# Lint code
pylint backend/services/moodle_client.py
pylint backend/services/reverse_problem_reconstructor.py

# Type checking
mypy backend/
```

### Adding New Reconstruction Strategies

1. Add strategy to `ReconstructionStrategy` enum in `reverse_problem_reconstructor.py`
2. Implement reconstruction method (e.g., `_your_new_strategy()`)
3. Add case to `reconstruct_reverse()` method
4. Update API documentation

Example:
```python
class ReconstructionStrategy(str, Enum):
    # ... existing strategies ...
    YOUR_NEW_STRATEGY = "your_new_strategy"

def _your_new_strategy(self, question, structure):
    # Implementation here
    pass
```

## Security Considerations

### Token Security
- Never commit `.env` file to version control
- Store tokens encrypted in production
- Rotate tokens regularly
- Use HTTPS for all API calls

### API Security
- Implement rate limiting
- Use authentication for production
- Validate all input parameters
- Sanitize user-generated content

### Database Security
- Use strong passwords
- Limit database user permissions
- Enable SSL for database connections
- Regular backups

## Monitoring & Logging

### Logs Location
```bash
logs/app.log
```

### Log Levels
- `DEBUG`: Development debugging
- `INFO`: General information
- `WARNING`: Warning messages
- `ERROR`: Error conditions
- `CRITICAL`: Critical errors

### Monitoring Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Statistics
curl http://localhost:8000/api/v1/statistics
```

## Support

### Documentation
- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PRD Document](../tasks/0001-prd-ai-education-pipeline.md)

### Common Issues
- Check logs: `tail -f logs/app.log`
- Verify configuration: `cat .env | grep MOODLE`
- Test API: Visit http://localhost:8000/docs

### Contact
For technical support, consult the development team or file an issue in the project repository.

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Moodle Compatibility**: 3.7+
**PHP Compatibility**: 7.1.9+
**MySQL Compatibility**: 5.7+
