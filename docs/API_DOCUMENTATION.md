# API 문서

## 개요

AI Education System의 RESTful API 문서입니다. 모든 엔드포인트는 `/api/v1` 접두사를 사용합니다.

## 인증

현재 버전에서는 인증이 구현되지 않았습니다. 프로덕션 환경에서는 JWT 또는 OAuth2 인증을 추가해야 합니다.

## 기본 URL

```
http://localhost:8000/api/v1
```

## 엔드포인트

### 학생 관리

#### 학생 생성
```http
POST /students/
Content-Type: application/json

{
  "name": "홍길동",
  "email": "hong@example.com",
  "grade_level": 10,
  "institution": "테스트 학교",
  "external_lms_id": "lms_12345"
}
```

**응답**
```json
{
  "id": "uuid",
  "name": "홍길동",
  "email": "hong@example.com",
  "grade_level": 10,
  "institution": "테스트 학교",
  "external_lms_id": "lms_12345",
  "metadata": {},
  "created_at": "2025-11-18T10:00:00Z",
  "updated_at": "2025-11-18T10:00:00Z"
}
```

#### 학생 조회
```http
GET /students/{student_id}
```

#### 답안 제출
```http
POST /students/attempts/
Content-Type: application/json

{
  "student_id": "uuid",
  "problem_id": "uuid",
  "module_id": "uuid",
  "submitted_answer": {
    "value": 42
  },
  "time_spent_seconds": 120
}
```

**응답**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "problem_id": "uuid",
  "module_id": "uuid",
  "submitted_answer": {"value": 42},
  "is_correct": true,
  "time_spent_seconds": 120,
  "attempt_number": 1,
  "attempted_at": "2025-11-18T10:05:00Z",
  "metadata": {}
}
```

### 패턴 분석

#### AI 패턴 분석 실행
```http
POST /patterns/analyze/{student_id}?module_id=uuid&days_back=30&min_frequency=2
```

**응답**
```json
{
  "student_id": "uuid",
  "patterns": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "pattern_type": "calculation_error",
      "pattern_category": "arithmetic",
      "description": "덧셈 계산 시 자릿수 실수",
      "frequency": 5,
      "severity": "high",
      "problem_types": ["addition", "multi_digit_addition"],
      "is_active": true,
      ...
    }
  ],
  "total_patterns": 3,
  "analysis_timestamp": "2025-11-18T10:10:00Z"
}
```

#### 패턴 요약 조회
```http
GET /patterns/summary/{student_id}?module_id=uuid
```

**응답**
```json
{
  "total_patterns": 5,
  "severity_breakdown": {
    "high": 2,
    "medium": 2,
    "low": 1
  },
  "by_category": {
    "arithmetic": 3,
    "algebra": 2
  },
  "patterns": [...]
}
```

#### 경고 확인
```http
POST /patterns/check-warnings
Content-Type: application/json

{
  "student_id": "uuid",
  "problem_id": "uuid",
  "problem_content": {
    "question": "3 + 5 = ?",
    "type": "addition"
  }
}
```

**응답**
```json
{
  "has_warnings": true,
  "warnings": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "problem_id": "uuid",
      "pattern_id": "uuid",
      "warning_type": "calculation_error",
      "message": "이 유형의 문제에서 과거 5번 실수했습니다. 자릿수를 정확히 맞추어 계산하세요.",
      "severity": "high",
      "is_dismissed": false,
      "shown_at": "2025-11-18T10:15:00Z"
    }
  ],
  "recommended_focus_areas": ["arithmetic", "place_value"]
}
```

#### 경고 닫기
```http
POST /patterns/warnings/{warning_id}/dismiss
```

### LMS 연동

#### 동기화 시작
```http
POST /lms/sync
Content-Type: application/json

{
  "sync_type": "students",
  "lms_endpoint": "https://lms.example.com/api/students",
  "filters": {
    "grade": 10
  }
}
```

**응답**
```json
{
  "sync_id": "uuid",
  "status": "pending",
  "records_synced": 0,
  "started_at": "2025-11-18T10:20:00Z",
  "completed_at": null
}
```

#### 동기화 상태 확인
```http
GET /lms/sync/{sync_id}
```

**응답**
```json
{
  "sync_id": "uuid",
  "status": "completed",
  "records_synced": 150,
  "started_at": "2025-11-18T10:20:00Z",
  "completed_at": "2025-11-18T10:25:00Z",
  "error_message": null
}
```

## 오류 응답

모든 오류는 다음 형식으로 반환됩니다:

```json
{
  "detail": "오류 메시지"
}
```

### HTTP 상태 코드

- `200 OK` - 성공
- `201 Created` - 리소스 생성 성공
- `400 Bad Request` - 잘못된 요청
- `404 Not Found` - 리소스를 찾을 수 없음
- `500 Internal Server Error` - 서버 오류

## 페이지네이션

대량의 데이터를 반환하는 엔드포인트는 `limit` 매개변수를 지원합니다:

```http
GET /students/{student_id}/attempts?limit=50
```

## 필터링

일부 엔드포인트는 쿼리 파라미터를 통한 필터링을 지원합니다:

```http
GET /patterns/student/{student_id}?module_id=uuid&include_inactive=false
```

## Rate Limiting

현재 버전에서는 rate limiting이 구현되지 않았습니다. 프로덕션 환경에서는 추가 권장됩니다.

## 버전 관리

API 버전은 URL 경로에 포함됩니다 (`/api/v1/`). 주요 변경사항이 있을 경우 새 버전이 생성됩니다.
