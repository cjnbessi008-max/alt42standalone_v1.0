# Feature Spotlight API Documentation

## Overview
The Feature Spotlight API provides endpoints for analyzing mathematical functions and integrating with Moodle LMS.

**Base URL**: `/feature-spotlight/backend/api.php`
**Version**: 1.0
**Response Format**: JSON

---

## Authentication
Currently, the API does not require authentication for development. In production, implement token-based authentication or integrate with Moodle session management.

---

## Endpoints

### 1. Get Problem from Moodle

Retrieve a problem/question from the Moodle database.

**Endpoint**: `GET /api.php?action=get_problem`

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | integer | Yes | Moodle question ID |

**Example Request**:
```bash
GET /api.php?action=get_problem&id=123
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Cubic Function Analysis",
    "questiontext": "Analyze the function f(x) = x^3 - 6*x^2 + 9*x + 1",
    "qtype": "calculated",
    "defaultmark": 10,
    "category_name": "Calculus",
    "function": "x^3 - 6*x^2 + 9*x + 1"
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "Question not found"
}
```

---

### 2. Analyze Function

Analyze a mathematical function for key features.

**Endpoint**: `POST /api.php?action=analyze_function`

**Request Body**:
```json
{
  "function": "x^3 - 6*x^2 + 9*x + 1",
  "question_id": 123,
  "x_min": -2,
  "x_max": 5
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `function` | string | Yes | Mathematical function expression |
| `question_id` | integer | No | Moodle question ID (for caching) |
| `x_min` | number | No | Minimum x value (default: -10) |
| `x_max` | number | No | Maximum x value (default: 10) |

**Success Response** (200):
```json
{
  "success": true,
  "message": "Function received. Analysis should be performed client-side using math-analyzer.js",
  "function": "x^3 - 6*x^2 + 9*x + 1",
  "range": {
    "min": -2,
    "max": 5
  },
  "note": "Full numerical analysis requires client-side processing or separate computation service"
}
```

**Note**: Full analysis is performed client-side using JavaScript. For server-side analysis, integrate a Python/MATLAB service.

---

### 3. Get Cached Features

Retrieve cached analysis results for a problem.

**Endpoint**: `GET /api.php?action=get_features`

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question_id` | integer | Yes | Moodle question ID |

**Example Request**:
```bash
GET /api.php?action=get_features&question_id=123
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "timestamp": 1700000000,
    "function": "x^3 - 6*x^2 + 9*x + 1",
    "features": {
      "local_maxima": [
        {"x": 1.0, "y": 5.0, "type": "local_maximum"}
      ],
      "local_minima": [
        {"x": 3.0, "y": 1.0, "type": "local_minimum"}
      ],
      "inflection_points": [
        {"x": 2.0, "y": 3.0}
      ],
      "increasing_intervals": [[3.0, 5.0]],
      "decreasing_intervals": [[-2.0, 1.0]]
    }
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "No cached features found"
}
```

---

### 4. Save Interaction

Track student interactions with highlighted features.

**Endpoint**: `POST /api.php?action=save_interaction`

**Request Body**:
```json
{
  "question_id": 123,
  "user_id": 456,
  "feature_type": "local_maximum",
  "feature_data": {
    "x": 1.0,
    "y": 5.0,
    "timestamp": 1700000000
  }
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `question_id` | integer | Yes | Moodle question ID |
| `user_id` | integer | No | Moodle user ID (0 for anonymous) |
| `feature_type` | string | Yes | Type of feature (local_maximum, local_minimum, inflection_point, etc.) |
| `feature_data` | object | No | Additional interaction data |

**Success Response** (200):
```json
{
  "success": true,
  "message": "Interaction saved",
  "id": 789
}
```

---

### 5. Get Questions List

Retrieve a list of questions from Moodle (for testing/demo).

**Endpoint**: `GET /api.php?action=get_questions_list`

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | string | No | Question type (default: 'calculated') |
| `limit` | integer | No | Maximum results (default: 10) |

**Example Request**:
```bash
GET /api.php?action=get_questions_list&type=calculated&limit=5
```

**Success Response** (200):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 123,
      "name": "Cubic Function",
      "questiontext": "Analyze f(x) = x^3 - 6*x^2 + 9*x + 1",
      "qtype": "calculated",
      "defaultmark": 10,
      "function": "x^3 - 6*x^2 + 9*x + 1"
    }
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (missing or invalid parameters) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## JavaScript Client Library

### MathAnalyzer

Client-side mathematical analysis engine.

```javascript
const analyzer = new MathAnalyzer({
    xMin: -10,
    xMax: 10,
    epsilon: 0.0001,
    samplePoints: 1000
});

// Analyze function
const results = analyzer.analyzeFunction('x^3 - 6*x^2 + 9*x + 1');

// Results structure
{
    function: "x^3 - 6*x^2 + 9*x + 1",
    range: { xMin: -10, xMax: 10 },
    features: {
        local_maxima: [{x, y, type}],
        local_minima: [{x, y, type}],
        inflection_points: [{x, y}],
        increasing_intervals: [[x1, x2]],
        decreasing_intervals: [[x1, x2]],
        critical_points: [{x, y, type}]
    },
    summary: {
        total_maxima: 1,
        total_minima: 1,
        total_inflection_points: 1,
        increasing_interval_count: 1,
        decreasing_interval_count: 1
    },
    timestamp: "2025-11-18T..."
}
```

### FeatureSpotlight

Visualization component.

```javascript
const spotlight = new FeatureSpotlight({
    canvasId: 'spotlight-canvas',
    language: 'ko',  // 'ko' or 'en'
    showLabels: true,
    pointSize: 6
});

// Analyze and visualize
await spotlight.analyze('x^3 - 6*x^2 + 9*x + 1', {
    xMin: -2,
    xMax: 5
});

// Get results
const results = spotlight.getResults();

// Export as image
const imageUrl = spotlight.exportImage('png');
```

### SmartphoneDisplay

Virtual smartphone display component.

```javascript
const smartphone = new SmartphoneDisplay({
    position: { bottom: '20px', right: '20px' },
    width: '375px',
    height: '667px'
});

// Load content
smartphone.loadContent('<div>Hello</div>');

// Show loading
smartphone.showLoading('Loading...');

// Show error
smartphone.showError('An error occurred');

// Toggle minimize
smartphone.toggleMinimize();
```

---

## Database Schema

### fs_question_metadata

Stores cached analysis results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `question_id` | INT | Moodle question ID |
| `meta_key` | VARCHAR(100) | Metadata key |
| `meta_value` | JSON | Metadata value |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

### fs_interactions

Tracks student interactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `question_id` | INT | Moodle question ID |
| `user_id` | INT | Moodle user ID |
| `feature_type` | VARCHAR(50) | Feature type |
| `feature_data` | JSON | Interaction data |
| `created_at` | TIMESTAMP | Interaction time |

### fs_feature_definitions

Feature type configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key |
| `feature_type` | VARCHAR(50) | Feature identifier |
| `display_name_en` | VARCHAR(100) | English name |
| `display_name_ko` | VARCHAR(100) | Korean name |
| `color` | VARCHAR(20) | Highlight color |
| `description_en` | TEXT | English description |
| `description_ko` | TEXT | Korean description |

---

## Integration Examples

### Load and Analyze from Moodle

```javascript
async function loadAndAnalyze(questionId) {
    // Fetch question from Moodle
    const response = await fetch(`/api.php?action=get_problem&id=${questionId}`);
    const data = await response.json();

    if (data.success && data.data.function) {
        // Analyze function
        const results = await spotlight.analyze(data.data.function);

        // Display in smartphone
        smartphone.loadContent(canvas);

        return results;
    }
}
```

### Track Student Interaction

```javascript
async function trackInteraction(questionId, userId, featureType, featureData) {
    const response = await fetch('/api.php?action=save_interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question_id: questionId,
            user_id: userId,
            feature_type: featureType,
            feature_data: featureData
        })
    });

    return await response.json();
}
```

---

## Future Enhancements

1. **Server-side Analysis**: Integrate Python/MATLAB for complex function analysis
2. **WebSocket Support**: Real-time collaboration and updates
3. **Advanced Authentication**: OAuth 2.0 or JWT tokens
4. **Analytics Dashboard**: Teacher analytics for student interactions
5. **Export Features**: PDF reports, image export, data export
6. **Multi-language Support**: Additional language support beyond Korean/English

---

## Support

For issues and questions:
- **GitHub**: [Repository URL]
- **Email**: support@kaist.ac.kr
- **Documentation**: [Docs URL]

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
