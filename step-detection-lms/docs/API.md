# API Documentation

## Base URL

```
http://your-domain.com/api/v1
```

## Authentication

현재 버전은 간단한 학생 ID 기반 인증을 사용합니다. 프로덕션 환경에서는 JWT 또는 OAuth 2.0을 권장합니다.

---

## Endpoints

### Problems

#### GET /problems

문제 목록 조회

**Query Parameters:**
- `type_id` (optional): 문제 유형 ID
- `difficulty` (optional): 난이도 (1-5)
- `category` (optional): 카테고리 (fractions, equations, geometry)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "분수 덧셈 기초",
      "description": "다음 분수의 덧셈을 계산하세요: 1/3 + 1/4",
      "difficulty_level": 2,
      "expected_time_seconds": 300,
      "type_name": "분수 덧셈",
      "category": "fractions"
    }
  ]
}
```

#### GET /problems/{id}

특정 문제 상세 조회 (단계 포함)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "분수 덧셈 기초",
    "description": "다음 분수의 덧셈을 계산하세요: 1/3 + 1/4",
    "difficulty_level": 2,
    "steps": [
      {
        "id": 1,
        "step_order": 1,
        "step_name": "identify_denominators",
        "display_name": "분모 확인하기",
        "description": "두 분수의 분모를 확인합니다",
        "is_required": 1,
        "expected_time_seconds": 30,
        "hint_text": "첫 번째 분수의 분모는 3, 두 번째 분수의 분모는 4입니다."
      }
    ]
  }
}
```

#### GET /problem-types

문제 유형 목록 조회

---

### Solutions

#### POST /solutions/start

새 풀이 세션 시작

**Request Body:**
```json
{
  "student_id": 1,
  "problem_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "solution_id": 1,
    "session_token": "a1b2c3d4e5f6...",
    "problem": { /* problem details */ }
  },
  "message": "Solution session started"
}
```

#### POST /solutions/submit-step

단계 답안 제출

**Request Body:**
```json
{
  "solution_id": 1,
  "step_id": 1,
  "student_input": "분모는 3과 4입니다",
  "is_correct": true,
  "time_spent": 25,
  "hint_used": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": 1
  },
  "message": "Step submitted successfully"
}
```

#### POST /solutions/submit-final

최종 풀이 제출

**Request Body:**
```json
{
  "solution_id": 1,
  "final_answer": "7/12",
  "is_correct": true,
  "score": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "type": "time_anomaly",
        "severity": "medium",
        "confidence": 75,
        "description": "평균 소요 시간 대비 50% 빠른 완료",
        "affected_steps": [2, 3],
        "evidence": {
          "avg_time_expected": 300,
          "actual_time": 150
        }
      }
    ],
    "trust_score": 85.5
  },
  "message": "Solution submitted successfully"
}
```

#### POST /solutions/hint

힌트 보기 기록

**Request Body:**
```json
{
  "solution_id": 1,
  "step_id": 1
}
```

#### GET /solutions/{id}

풀이 상세 조회

---

### Detections

#### GET /detections/solution/{id}

특정 풀이의 탐지 결과 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "solution_id": 1,
    "detections": [
      {
        "id": 1,
        "detection_type": "time_anomaly",
        "severity": "high",
        "confidence_score": 85.50,
        "description": "평균 소요 시간 대비 73% 빠른 완료",
        "affected_steps": [2, 3, 4],
        "evidence_data": {
          "avg_time_expected": 330,
          "actual_time": 90
        }
      }
    ],
    "trust_score": 75.5
  }
}
```

#### GET /detections/student/{id}

학생의 모든 탐지 기록 조회

#### POST /detections/analyze/{id}

풀이 재분석 (강제 재탐지)

---

### Students (Teacher Dashboard)

#### GET /students

학생 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "student001",
      "full_name": "홍길동",
      "grade_level": "5학년",
      "overall_trust_score": 95.00,
      "total_solutions": 10,
      "suspicious_solutions": 1
    }
  ]
}
```

#### GET /students/{id}

학생 상세 정보 조회

#### GET /students/{id}/trust-profile

학생 신뢰도 프로필 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "student_id": 1,
    "overall_trust_score": 85.00,
    "total_solutions": 5,
    "suspicious_solutions": 2,
    "time_anomaly_count": 1,
    "logical_inconsistency_count": 0,
    "sequence_violation_count": 0,
    "hint_dependency_count": 1,
    "detection_breakdown": [
      {
        "detection_type": "time_anomaly",
        "count": 1,
        "avg_confidence": 85.00
      }
    ]
  }
}
```

---

### Statistics

#### GET /statistics/problem/{id}

문제별 통계 조회

#### GET /statistics/overview

전체 통계 조회

---

## Error Responses

모든 API는 오류 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200`: 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

---

## Skip Detection Types

### 1. time_anomaly
시간 이상 탐지 - 평균 대비 너무 빠르거나 느린 완료

### 2. logical_inconsistency
논리적 불일치 - 이전 단계와 다음 단계 간 연결 오류

### 3. sequence_violation
순서 위반 - 필수 단계 건너뛰기

### 4. hint_dependency
힌트 의존 - 과도한 힌트 사용

---

## Rate Limiting

현재 버전은 rate limiting이 구현되지 않았습니다. 프로덕션 환경에서는 다음을 권장합니다:

- API 호출: 100 requests/minute per IP
- 풀이 제출: 10 submissions/hour per student

---

## Webhooks (Future)

향후 버전에서는 다음 이벤트에 대한 webhook을 지원할 예정입니다:

- `solution.submitted`: 풀이 제출 완료
- `detection.found`: 건너뛰기 탐지 발견
- `student.flagged`: 학생 플래그 (신뢰도 낮음)
