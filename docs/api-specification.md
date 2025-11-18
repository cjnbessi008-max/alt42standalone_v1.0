# API Specification: LMS Integration & Efficiency Scoring

**Version**: 1.0
**Date**: 2025-11-18
**Protocol**: REST API (JSON)
**Base URL**: `https://our-platform.com/api`
**Authentication**: JWT Bearer Token

---

## 1. Overview

This document defines all API endpoints for:
1. **LTI 1.3 Integration** - Authentication, launch, session management
2. **Efficiency Scoring** - TES calculation, retrieval, analytics
3. **Grade Passback** - Moodle gradebook synchronization
4. **Admin Management** - LMS configuration, user mappings

### API Categories

```
/api
├── /lti                    # LTI 1.3 endpoints (public)
│   ├── /login              # OIDC login initiation
│   ├── /launch             # Resource link launch
│   └── /jwks               # Public key set
│
├── /efficiency             # TES calculation & retrieval (authenticated)
│   ├── /calculate          # Trigger TES calculation
│   ├── /scores             # Get TES scores
│   ├── /dashboard          # Cohort analytics
│   ├── /trends             # Historical trends
│   └── /insights           # Teacher insights
│
├── /lms                    # LMS management (authenticated)
│   ├── /integrations       # Manage LMS connections
│   ├── /users              # User mappings
│   ├── /sessions           # Active sessions
│   └── /grade-sync         # Manual grade passback
│
└── /admin                  # Administrative endpoints (admin-only)
    ├── /lms-config         # Configure LMS integrations
    └── /audit-logs         # View LTI audit logs
```

---

## 2. LTI 1.3 Endpoints (Public)

### 2.1 POST `/api/lti/login`

**Description**: OIDC login initiation endpoint. Moodle redirects here to start LTI launch.

**Authentication**: None (public endpoint)

**Request**:
```http
POST /api/lti/login
Content-Type: application/x-www-form-urlencoded

iss=https://lms.kaist.ac.kr&
login_hint=moodle_user_12345&
target_link_uri=https://our-platform.com/api/lti/launch&
lti_message_hint=eyJjb250ZXh0X2lkIj...&
client_id=kaist_client_2025
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `iss` | string | Yes | LMS issuer URL (Moodle base URL) |
| `login_hint` | string | Yes | Opaque user identifier from LMS |
| `target_link_uri` | string | Yes | Where to send the LTI launch request |
| `lti_message_hint` | string | No | Opaque value from LMS |
| `client_id` | string | Yes | Our registered client ID with Moodle |

**Response**:
```http
HTTP/1.1 302 Found
Location: https://lms.kaist.ac.kr/mod/lti/auth.php?
  scope=openid&
  response_type=id_token&
  client_id=kaist_client_2025&
  redirect_uri=https://our-platform.com/api/lti/launch&
  login_hint=moodle_user_12345&
  state=random_state_xyz&
  nonce=random_nonce_abc&
  lti_message_hint=eyJjb250ZXh0X2lkIj...&
  prompt=none
```

**Error Responses**:
```json
// 400 Bad Request - Missing required parameters
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: client_id"
}

// 404 Not Found - Unknown issuer
{
  "error": "unknown_issuer",
  "error_description": "No LMS integration configured for issuer: https://unknown-lms.com"
}
```

---

### 2.2 POST `/api/lti/launch`

**Description**: LTI resource link launch endpoint. Receives JWT from Moodle and creates session.

**Authentication**: None (JWT in request body)

**Request**:
```http
POST /api/lti/launch
Content-Type: application/x-www-form-urlencoded

id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1vb2RsZV9rZXlfMjAyNSJ9...&
state=random_state_xyz
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_token` | string (JWT) | Yes | LTI message signed by Moodle |
| `state` | string | Yes | Must match state from login request |

**JWT Claims** (decoded):
```json
{
  "iss": "https://lms.kaist.ac.kr",
  "sub": "moodle_user_12345",
  "aud": "kaist_client_2025",
  "exp": 1732000000,
  "iat": 1731999400,
  "nonce": "random_nonce_abc",
  "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
  "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment_1",
  "https://purl.imsglobal.org/spec/lti/claim/roles": [
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
  ],
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    "id": "course_123",
    "label": "MATH101",
    "title": "Introduction to Mathematics"
  },
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    "id": "resource_456",
    "title": "Fractions Module"
  },
  "https://purl.imsglobal.org/spec/lti/claim/launch_presentation": {
    "return_url": "https://lms.kaist.ac.kr/course/view.php?id=123"
  },
  "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": {
    "scope": [
      "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
      "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
      "https://purl.imsglobal.org/spec/lti-ags/scope/score"
    ],
    "lineitems": "https://lms.kaist.ac.kr/mod/lti/services.php/course_123/lineitems",
    "lineitem": "https://lms.kaist.ac.kr/mod/lti/services.php/course_123/lineitems/789"
  },
  "given_name": "Alice",
  "family_name": "Kim",
  "email": "alice.student@kaist.ac.kr",
  "https://purl.imsglobal.org/spec/lti/claim/custom": {
    "module_id": "fractions-uuid-1234",
    "difficulty": "medium"
  }
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html>
<head>
  <title>Launching Module...</title>
  <script>
    // Auto-redirect to module interface with session token
    sessionStorage.setItem('lti_session', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    window.location.href = '/modules/fractions-uuid-1234';
  </script>
</head>
<body>
  <h1>Loading Fractions Module...</h1>
  <p>If not redirected, <a href="/modules/fractions-uuid-1234">click here</a>.</p>
</body>
</html>
```

**Session Token Payload**:
```json
{
  "session_id": "session-uuid-7890",
  "student_id": "student-uuid-1234",
  "module_id": "fractions-uuid-1234",
  "lms_user_id": "moodle_user_12345",
  "lms_integration_id": "integration-uuid-5678",
  "context_id": "course_123",
  "resource_link_id": "resource_456",
  "roles": ["Learner"],
  "ags_lineitem_url": "https://lms.kaist.ac.kr/mod/lti/services.php/course_123/lineitems/789",
  "return_url": "https://lms.kaist.ac.kr/course/view.php?id=123",
  "iat": 1731999400,
  "exp": 1732003000  // 1 hour from now
}
```

**Error Responses**:
```json
// 400 Bad Request - Invalid JWT
{
  "error": "invalid_jwt",
  "error_description": "JWT signature verification failed",
  "reference_id": "error-abc123"
}

// 401 Unauthorized - Expired token
{
  "error": "token_expired",
  "error_description": "JWT expired at 2025-11-18T09:00:00Z",
  "reference_id": "error-def456"
}

// 403 Forbidden - Nonce reuse detected
{
  "error": "invalid_nonce",
  "error_description": "Nonce already used (possible replay attack)",
  "reference_id": "error-ghi789"
}
```

---

### 2.3 GET `/.well-known/jwks.json`

**Description**: Public key set for JWT signature verification by Moodle.

**Authentication**: None (public endpoint)

**Request**:
```http
GET /.well-known/jwks.json
```

**Success Response**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "our-key-2025",
      "alg": "RS256",
      "n": "xGOr-H7AeJ1NlD8FwONEpJGVP7K_QqLb2V...",  // Base64url-encoded modulus
      "e": "AQAB"                                     // Base64url-encoded exponent
    }
  ]
}
```

---

## 3. Efficiency Scoring Endpoints (Authenticated)

### Authentication Header
```http
Authorization: Bearer {session_token}
```

All efficiency endpoints require a valid session token obtained from LTI launch or direct login.

---

### 3.1 POST `/api/efficiency/calculate`

**Description**: Calculate or recalculate TES score for a student in a module.

**Request**:
```http
POST /api/efficiency/calculate
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "student_id": "student-uuid-1234",
  "module_id": "module-fractions-uuid",
  "force_recalc": false
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | UUID | Yes | Student identifier |
| `module_id` | UUID | Yes | Module identifier |
| `force_recalc` | boolean | No | Recalculate even if cached (default: false) |

**Success Response**:
```json
{
  "tes_score": 96.00,
  "tes_percentile": 95,
  "tes_grade": "A",
  "components": {
    "correctness": {
      "score": 95.00,
      "weight": 0.40,
      "contribution": 38.00
    },
    "speed": {
      "score": 100.00,
      "weight": 0.30,
      "contribution": 30.00
    },
    "first_try_success": {
      "score": 90.00,
      "weight": 0.20,
      "contribution": 18.00
    },
    "consistency": {
      "score": 100.00,
      "weight": 0.10,
      "contribution": 10.00
    }
  },
  "raw_metrics": {
    "total_attempts": 20,
    "correct_attempts": 19,
    "total_problems": 20,
    "first_try_correct": 18,
    "avg_time_seconds": 45.0,
    "cohort_median_time": 90.0
  },
  "problem_type_scores": {
    "visualization": 95,
    "addition": 95,
    "subtraction": 95
  },
  "cohort_context": {
    "cohort_id": "spring-2025-grade3",
    "cohort_avg_tes": 72.00,
    "cohort_median_tes": 70.00,
    "student_percentile": 95
  },
  "sufficient_data": true,
  "calculated_at": "2025-11-18T10:30:00Z",
  "next_update_eligible_at": "2025-11-18T11:30:00Z"
}
```

**Error Responses**:
```json
// 400 Bad Request - Insufficient data
{
  "error": "insufficient_data",
  "message": "Student has only 5 attempts. Minimum 10 required for TES calculation.",
  "current_attempts": 5,
  "required_attempts": 10
}

// 404 Not Found
{
  "error": "not_found",
  "message": "Student or module not found"
}

// 429 Too Many Requests - Rate limiting
{
  "error": "rate_limit_exceeded",
  "message": "TES calculation requested too frequently. Try again in 30 minutes.",
  "retry_after": 1800
}
```

---

### 3.2 GET `/api/efficiency/scores/{student_id}`

**Description**: Get all TES scores for a student across all modules.

**Request**:
```http
GET /api/efficiency/scores/student-uuid-1234
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include_insufficient` | boolean | No | Include modules with <10 attempts (default: false) |
| `sort_by` | string | No | `tes_score`, `calculated_at`, `module_name` (default: `calculated_at`) |
| `order` | string | No | `asc` or `desc` (default: `desc`) |

**Success Response**:
```json
{
  "student_id": "student-uuid-1234",
  "student_name": "Alice Kim",
  "total_modules": 3,
  "avg_tes": 88.33,
  "scores": [
    {
      "module_id": "module-fractions-uuid",
      "module_name": "Fractions Module",
      "tes_score": 96.00,
      "tes_percentile": 95,
      "tes_grade": "A",
      "total_attempts": 20,
      "sufficient_data": true,
      "calculated_at": "2025-11-18T10:30:00Z"
    },
    {
      "module_id": "module-decimals-uuid",
      "module_name": "Decimals Module",
      "tes_score": 85.00,
      "tes_percentile": 80,
      "tes_grade": "B",
      "total_attempts": 15,
      "sufficient_data": true,
      "calculated_at": "2025-11-17T14:20:00Z"
    },
    {
      "module_id": "module-algebra-uuid",
      "module_name": "Algebra Basics",
      "tes_score": 84.00,
      "tes_percentile": 78,
      "tes_grade": "B",
      "total_attempts": 25,
      "sufficient_data": true,
      "calculated_at": "2025-11-16T09:15:00Z"
    }
  ]
}
```

---

### 3.3 GET `/api/efficiency/scores/{student_id}/{module_id}`

**Description**: Get detailed TES score for a specific student-module pair.

**Request**:
```http
GET /api/efficiency/scores/student-uuid-1234/module-fractions-uuid
Authorization: Bearer eyJhbGc...
```

**Success Response**: (Same as `POST /api/efficiency/calculate` response)

---

### 3.4 GET `/api/efficiency/dashboard/{module_id}`

**Description**: Get cohort analytics dashboard for a module (teacher view).

**Request**:
```http
GET /api/efficiency/dashboard/module-fractions-uuid
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cohort_id` | string | No | Filter by specific cohort (default: all) |
| `include_at_risk` | boolean | No | Include at-risk students list (default: true) |

**Success Response**:
```json
{
  "module_id": "module-fractions-uuid",
  "module_name": "Fractions Module",
  "cohort_id": "spring-2025-grade3",
  "statistics": {
    "total_students": 50,
    "avg_tes": 72.00,
    "median_tes": 70.00,
    "std_dev_tes": 12.50,
    "min_tes": 45.00,
    "max_tes": 98.00
  },
  "distribution": {
    "90-100": 8,   // 16% - Excellent
    "80-89": 12,   // 24% - Good
    "70-79": 18,   // 36% - Satisfactory
    "60-69": 7,    // 14% - Below Average
    "0-59": 5      // 10% - Poor
  },
  "performance_bands": {
    "high_performers": {
      "count": 8,
      "threshold": "TES > 85",
      "avg_tes": 93.25
    },
    "medium_performers": {
      "count": 30,
      "threshold": "TES 70-85",
      "avg_tes": 76.50
    },
    "low_performers": {
      "count": 12,
      "threshold": "TES < 70",
      "avg_tes": 58.33
    }
  },
  "top_performers": [
    {
      "student_id": "student-uuid-1234",
      "student_name": "Alice Kim",
      "tes_score": 96.00,
      "tes_percentile": 95
    },
    {
      "student_id": "student-uuid-5678",
      "student_name": "Bob Lee",
      "tes_score": 94.00,
      "tes_percentile": 92
    }
  ],
  "at_risk_students": [
    {
      "student_id": "student-uuid-9999",
      "student_name": "Charlie Park",
      "tes_score": 48.00,
      "tes_percentile": 8,
      "tes_change_week": -12.00,  // Declined 12 points this week
      "priority": "high",
      "recommended_actions": [
        "Schedule 1-on-1 tutoring",
        "Review prerequisite concepts"
      ]
    }
  ],
  "time_metrics": {
    "avg_time_seconds": 95.0,
    "median_time_seconds": 90.0,
    "fastest_avg_time": 30.0,
    "slowest_avg_time": 240.0
  },
  "component_averages": {
    "correctness": 78.50,
    "speed": 72.30,
    "first_try_success": 65.20,
    "consistency": 80.10
  },
  "calculated_at": "2025-11-18T10:00:00Z",
  "calculation_period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-18T23:59:59Z"
  }
}
```

---

### 3.5 GET `/api/efficiency/trends/{student_id}/{module_id}`

**Description**: Get historical TES trends for a student in a module.

**Request**:
```http
GET /api/efficiency/trends/student-uuid-1234/module-fractions-uuid
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period_days` | integer | No | Number of days to include (default: 30) |
| `granularity` | string | No | `daily`, `weekly` (default: `daily`) |

**Success Response**:
```json
{
  "student_id": "student-uuid-1234",
  "module_id": "module-fractions-uuid",
  "period_days": 30,
  "granularity": "daily",
  "data_points": [
    {
      "date": "2025-11-01",
      "tes_score": 65.00,
      "total_attempts": 5,
      "sufficient_data": false
    },
    {
      "date": "2025-11-05",
      "tes_score": 72.00,
      "total_attempts": 10,
      "sufficient_data": true
    },
    {
      "date": "2025-11-10",
      "tes_score": 78.00,
      "total_attempts": 15,
      "sufficient_data": true
    },
    {
      "date": "2025-11-18",
      "tes_score": 96.00,
      "total_attempts": 20,
      "sufficient_data": true
    }
  ],
  "trend_analysis": {
    "direction": "improving",  // "improving", "stable", "declining"
    "rate_of_change": 1.03,    // Points per day
    "total_change": 31.00,     // From first to last data point
    "volatility": "low"         // "low", "medium", "high"
  },
  "component_trends": {
    "correctness": {
      "start": 70.00,
      "end": 95.00,
      "change": 25.00
    },
    "speed": {
      "start": 60.00,
      "end": 100.00,
      "change": 40.00
    },
    "first_try_success": {
      "start": 50.00,
      "end": 90.00,
      "change": 40.00
    },
    "consistency": {
      "start": 80.00,
      "end": 100.00,
      "change": 20.00
    }
  }
}
```

---

### 3.6 GET `/api/efficiency/insights/{teacher_id}`

**Description**: Get AI-generated insights and recommendations for a teacher.

**Request**:
```http
GET /api/efficiency/insights/teacher-uuid-5678
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `module_id` | UUID | No | Filter by module (default: all modules) |
| `status` | string | No | `active`, `acknowledged`, `resolved`, `dismissed` (default: `active`) |
| `priority` | string | No | `low`, `medium`, `high`, `urgent` (default: all) |

**Success Response**:
```json
{
  "teacher_id": "teacher-uuid-5678",
  "total_insights": 12,
  "active_insights": 8,
  "urgent_insights": 2,
  "insights": [
    {
      "insight_id": "insight-uuid-1111",
      "insight_type": "student_performance",
      "insight_category": "at_risk",
      "priority": "high",
      "title": "Student Charlie showing declining efficiency",
      "description": "Charlie's TES has dropped from 78 to 65 over the past week. Heavy reliance on trial-and-error and inconsistent performance on subtraction problems.",
      "student_id": "student-uuid-9999",
      "student_name": "Charlie Park",
      "module_id": "module-fractions-uuid",
      "module_name": "Fractions Module",
      "tes_score": 65.00,
      "tes_change": -13.00,
      "supporting_metrics": {
        "weak_areas": ["subtraction"],
        "strong_areas": ["visualization"],
        "trial_error_rate": "60%"
      },
      "recommended_actions": [
        "Schedule 1-on-1 tutoring session",
        "Review subtraction prerequisites",
        "Provide additional practice problems"
      ],
      "status": "active",
      "generated_at": "2025-11-18T09:00:00Z",
      "expires_at": "2025-11-25T09:00:00Z"
    },
    {
      "insight_id": "insight-uuid-2222",
      "insight_type": "cohort_trend",
      "insight_category": "trend_alert",
      "priority": "medium",
      "title": "Overall cohort speed declining",
      "description": "Average problem-solving speed has decreased 15% over the past two weeks. Students may be encountering more difficult problems or losing engagement.",
      "module_id": "module-fractions-uuid",
      "module_name": "Fractions Module",
      "cohort_id": "spring-2025-grade3",
      "supporting_metrics": {
        "avg_time_before": "85.0 seconds",
        "avg_time_now": "98.0 seconds",
        "change_percent": "-15%"
      },
      "recommended_actions": [
        "Review recent problem difficulty",
        "Consider adding more engaging elements",
        "Check for technical issues slowing interface"
      ],
      "status": "active",
      "generated_at": "2025-11-17T14:00:00Z",
      "expires_at": "2025-11-24T14:00:00Z"
    }
  ]
}
```

---

## 4. LMS Management Endpoints (Authenticated)

### 4.1 GET `/api/lms/integrations`

**Description**: List all configured LMS integrations (admin only).

**Request**:
```http
GET /api/lms/integrations
Authorization: Bearer eyJhbGc...
```

**Success Response**:
```json
{
  "integrations": [
    {
      "integration_id": "integration-uuid-5678",
      "lms_platform": "moodle",
      "lms_version": "3.7",
      "institution_name": "KAIST Touch Math Academy",
      "lms_url": "https://lms.kaist.ac.kr",
      "client_id": "kaist_client_2025",
      "is_active": true,
      "grade_passback_enabled": true,
      "total_users_mapped": 523,
      "total_launches": 12453,
      "created_at": "2025-01-15T08:00:00Z",
      "last_launch_at": "2025-11-18T10:30:00Z"
    }
  ]
}
```

---

### 4.2 POST `/api/lms/grade-sync`

**Description**: Manually trigger grade passback to Moodle for a student.

**Request**:
```http
POST /api/lms/grade-sync
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "student_id": "student-uuid-1234",
  "module_id": "module-fractions-uuid",
  "lms_integration_id": "integration-uuid-5678",
  "force": false
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `student_id` | UUID | Yes | Student identifier |
| `module_id` | UUID | Yes | Module identifier |
| `lms_integration_id` | UUID | No | LMS integration (auto-detected if omitted) |
| `force` | boolean | No | Force sync even if recently synced (default: false) |

**Success Response**:
```json
{
  "status": "success",
  "grade_synced": 96.00,
  "moodle_response": {
    "status_code": 200,
    "message": "Grade successfully posted"
  },
  "lineitem_url": "https://lms.kaist.ac.kr/mod/lti/services.php/course_123/lineitems/789",
  "synced_at": "2025-11-18T10:35:00Z"
}
```

**Error Responses**:
```json
// 404 Not Found - No LTI launch context
{
  "error": "no_launch_context",
  "message": "Student never launched this module via LTI. Grade passback unavailable."
}

// 500 Internal Server Error - Moodle rejected grade
{
  "error": "grade_passback_failed",
  "message": "Moodle returned error",
  "moodle_error": {
    "status_code": 401,
    "message": "Invalid access token"
  },
  "will_retry": true,
  "retry_at": "2025-11-18T10:40:00Z"
}
```

---

### 4.3 GET `/api/lms/sessions/{session_id}`

**Description**: Get details about an LTI launch session.

**Request**:
```http
GET /api/lms/sessions/session-uuid-7890
Authorization: Bearer eyJhbGc...
```

**Success Response**:
```json
{
  "session_id": "session-uuid-7890",
  "lms_integration_id": "integration-uuid-5678",
  "student_id": "student-uuid-1234",
  "module_id": "module-fractions-uuid",
  "context_id": "course_123",
  "resource_link_id": "resource_456",
  "launched_at": "2025-11-18T10:00:00Z",
  "expires_at": "2025-11-18T11:00:00Z",
  "last_activity_at": "2025-11-18T10:30:00Z",
  "is_active": true,
  "return_url": "https://lms.kaist.ac.kr/course/view.php?id=123",
  "ags_lineitem_url": "https://lms.kaist.ac.kr/mod/lti/services.php/course_123/lineitems/789"
}
```

---

## 5. Rate Limiting

All authenticated endpoints enforce rate limits:

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| TES Calculation | 10 requests | per minute |
| Dashboard/Analytics | 50 requests | per minute |
| Grade Passback | 10 requests | per second |
| LMS Management | 100 requests | per minute |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1731999600
```

**Rate Limit Exceeded Response**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 30 seconds.",
  "retry_after": 30
}
```

---

## 6. Pagination

Endpoints returning lists support pagination:

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `per_page` | integer | 20 | Items per page (max: 100) |

**Paginated Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false,
    "next_page": 2,
    "prev_page": null
  }
}
```

---

## 7. Error Handling

### Standard Error Response Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    // Optional: Additional context
  },
  "reference_id": "error-abc123",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request` | 400 | Missing or invalid parameters |
| `unauthorized` | 401 | Missing or invalid auth token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `conflict` | 409 | Resource state conflict |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_error` | 500 | Server error |
| `service_unavailable` | 503 | Temporary outage |

---

## 8. Webhooks (Optional - Future Enhancement)

Allow Moodle to send events to our platform.

### 8.1 POST `/api/webhooks/moodle/roster-sync`

**Description**: Receive roster updates from Moodle.

**Request**:
```http
POST /api/webhooks/moodle/roster-sync
Content-Type: application/json
X-Moodle-Signature: sha256=abc123...

{
  "event": "user_enrolled",
  "course_id": "course_123",
  "user_id": "moodle_user_12345",
  "role": "student",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

**Success Response**:
```http
HTTP/1.1 200 OK
```

---

## 9. Testing with cURL

### Example: Calculate TES

```bash
curl -X POST https://our-platform.com/api/efficiency/calculate \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid-1234",
    "module_id": "module-fractions-uuid"
  }'
```

### Example: Get Dashboard

```bash
curl https://our-platform.com/api/efficiency/dashboard/module-fractions-uuid \
  -H "Authorization: Bearer eyJhbGc..."
```

### Example: Manual Grade Sync

```bash
curl -X POST https://our-platform.com/api/lms/grade-sync \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid-1234",
    "module_id": "module-fractions-uuid"
  }'
```

---

## 10. OpenAPI Specification

Full OpenAPI 3.0 specification available at:
```
GET https://our-platform.com/api/docs/openapi.json
```

Interactive API documentation:
```
https://our-platform.com/api/docs
```

---

**Document Status**: Complete - Ready for Implementation
**Next Steps**: Implement backend services and API handlers
**Dependencies**:
- Database schema (see `database-schema-lms-efficiency.md`)
- LTI architecture (see `lms-integration-architecture.md`)
