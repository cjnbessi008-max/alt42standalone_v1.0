# API Guide

Base URL: `http://localhost:8000/api`

## Authentication

Currently, no authentication is required (development mode).

## Endpoints

### Students

**List Students**
```
GET /students/
Query Parameters:
  - skip: int (default: 0)
  - limit: int (default: 100)
  - grade_level: string (optional)
  - performance_level: string (optional)
```

**Get Student**
```
GET /students/{student_id}
```

**Create Student**
```
POST /students/
Body: {
  "student_id": "S001",
  "name": "Student A",
  "grade_level": "3",
  "performance_level": "high",
  "gender": "F"
}
```

### Concept Tools

**List Tools**
```
GET /tools/
Query Parameters:
  - skip: int
  - limit: int
  - category: string (optional)
  - difficulty_level: string (optional)
```

**Get Tool**
```
GET /tools/{tool_name}
```

**List Categories**
```
GET /tools/categories/list
```

### Usage Sessions

**List Sessions**
```
GET /sessions/
Query Parameters:
  - skip: int
  - limit: int
  - student_id: UUID (optional)
  - tool_id: UUID (optional)
  - context: string (optional)
  - start_date: datetime (optional)
  - end_date: datetime (optional)
```

**Create Session**
```
POST /sessions/
Body: {
  "student_id": "uuid",
  "tool_id": "uuid",
  "session_start": "2024-11-15T09:00:00",
  "session_end": "2024-11-15T09:15:00",
  "duration_seconds": 900,
  "success_rate": 92.5,
  "context": "classroom"
}
```

**Get Statistics**
```
GET /sessions/stats
Response: {
  "total_sessions": 45,
  "unique_students": 20,
  "unique_tools": 8,
  "average_duration_seconds": 900
}
```

### Bias Analysis

**Frequency Bias Analysis**
```
POST /analysis/frequency
Body: {
  "analysis_type": "frequency",
  "time_period_start": "2024-11-01T00:00:00",
  "time_period_end": "2024-11-30T23:59:59"
}

Response: {
  "id": "uuid",
  "analysis_type": "frequency",
  "results": {
    "tool_usage": [...],
    "over_used_tools": [...],
    "under_used_tools": [...],
    "statistical_tests": {...}
  },
  "statistical_significance": {
    "bias_score": 65.2,
    "chi_square_statistic": 45.3,
    "p_value": 0.0001,
    "gini_coefficient": 0.42,
    "shannon_entropy": 2.1
  },
  "recommendations": [...]
}
```

**Demographic Bias Analysis**
```
POST /analysis/demographic
Body: {
  "analysis_type": "demographic"
}
```

**Temporal Bias Analysis**
```
POST /analysis/temporal
Body: {
  "analysis_type": "temporal"
}
```

**Effectiveness Bias Analysis**
```
POST /analysis/effectiveness
Body: {
  "analysis_type": "effectiveness"
}
```

**Get Analysis History**
```
GET /analysis/history
Query Parameters:
  - analysis_type: string (optional)
  - limit: int (default: 20)
```

**Get Specific Analysis**
```
GET /analysis/{analysis_id}
```

### Data Import

**Import Students CSV**
```
POST /import/csv/students
Content-Type: multipart/form-data
Body: file (CSV file)

Response: {
  "message": "Import completed",
  "imported": 20,
  "errors": []
}
```

**Import Sessions CSV**
```
POST /import/csv/sessions
Content-Type: multipart/form-data
Body: file (CSV file)
```

**Get Student Template**
```
GET /import/template/students
```

**Get Sessions Template**
```
GET /import/template/sessions
```

## Bias Metrics Explained

### Bias Score (0-100)
- **0-30**: Low bias - well-distributed usage
- **31-60**: Moderate bias - some concentration
- **61-100**: High bias - significant concentration

### Chi-Square Test
- Tests if usage deviates from uniform distribution
- p-value < 0.05 indicates significant deviation

### Shannon Entropy
- Measures diversity (higher = more diverse)
- Normalized to 0-1 scale

### Gini Coefficient
- Measures inequality (0 = perfect equality, 1 = total inequality)
- 0-0.3: Low inequality
- 0.3-0.5: Moderate inequality
- 0.5+: High inequality

### Z-Score
- Number of standard deviations from mean
- |z| > 1.5 indicates significant over/under-use

## Error Responses

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Interactive Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation where you can test all endpoints directly.
