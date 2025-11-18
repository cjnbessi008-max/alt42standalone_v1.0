# Shape Explainer API Documentation

## Base URL

```
/backend/api/
```

## Endpoints

### Health Check

#### GET /health

서버 상태 확인

**Response:**
```json
{
  "status": "ok",
  "version": "v1"
}
```

---

### Shapes

#### GET /shapes/list

모든 도형 목록 조회

**Query Parameters:**
- `category` (optional): '2D' 또는 '3D'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_ko": "삼각형",
      "name_en": "Triangle",
      "category": "2D",
      "description": "3개의 변과 3개의 꼭짓점을 가진 도형"
    }
  ]
}
```

#### GET /shapes/{id}

특정 도형의 상세 정보 조회 (속성 및 애니메이션 단계 포함)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name_ko": "삼각형",
    "name_en": "Triangle",
    "category": "2D",
    "description": "3개의 변과 3개의 꼭짓점을 가진 도형",
    "properties": [
      {
        "id": 1,
        "property_key": "vertices",
        "property_value": "3",
        "description_ko": "3개의 꼭짓점"
      }
    ],
    "animation_steps": [
      {
        "id": 1,
        "step_number": 1,
        "step_type": "highlight",
        "step_config": "{\"element\": \"vertices\", \"color\": \"#ff0000\"}",
        "description_ko": "꼭짓점 강조",
        "duration_ms": 1000
      }
    ]
  }
}
```

#### GET /shapes/search

도형 검색

**Query Parameters:**
- `q` (required): 검색어
- `lang` (optional): 'ko' 또는 'en' (기본값: 'ko')

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

#### POST /shapes/create

새 도형 생성 (관리자용)

**Request Body:**
```json
{
  "name_ko": "팔각형",
  "name_en": "Octagon",
  "category": "2D",
  "description": "8개의 변을 가진 도형"
}
```

**Response:**
```json
{
  "success": true,
  "id": 11
}
```

---

### Questions

#### GET /questions/{moodle_question_id}

Moodle 문제 ID로 문제 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_question_id": 123,
    "moodle_course_id": 1,
    "shape_type_id": 1,
    "question_text": "삼각형의 성질을 설명하세요",
    "question_type": "properties",
    "difficulty_level": 1
  }
}
```

#### POST /questions/create

문제 생성 또는 조회

**Request Body:**
```json
{
  "moodle_question_id": 123,
  "course_id": 1,
  "shape_type_id": 1,
  "question_text": "삼각형의 성질을 설명하세요",
  "question_type": "properties",
  "difficulty_level": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

#### GET /questions/stats/{moodle_question_id}

문제 통계 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "total_attempts": 50,
    "avg_score": 85.5,
    "avg_time": 120,
    "animation_views": 45
  }
}
```

---

### Progress

#### POST /progress/start

학습 진행 시작

**Request Body:**
```json
{
  "user_id": 1,
  "question_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "progress_id": 456
}
```

#### POST /progress/update/{progress_id}

진행 상황 업데이트

**Request Body:**
```json
{
  "time_spent": 60,
  "interaction_count": 5,
  "animation_viewed": true
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /progress/complete/{progress_id}

학습 완료

**Request Body:**
```json
{
  "score": 100,
  "time_spent": 120
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /progress/interaction/{progress_id}

상호작용 횟수 증가

**Response:**
```json
{
  "success": true
}
```

#### GET /progress/user/{user_id}

사용자의 학습 진행 기록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shape_name": "삼각형",
      "started_at": "2025-11-18 10:00:00",
      "completed_at": "2025-11-18 10:05:00",
      "score": 100
    }
  ]
}
```

---

### Moodle Integration

#### GET /moodle/validate

Moodle 토큰 유효성 검증

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

#### GET /moodle/question/{question_id}

Moodle에서 문제 정보 가져오기

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

#### GET /moodle/user/{user_id}

Moodle에서 사용자 정보 가져오기

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "student1",
    "fullname": "홍길동"
  }
}
```

#### GET /moodle/course/{course_id}

Moodle에서 코스 정보 가져오기

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullname": "수학 기초",
    "shortname": "MATH101"
  }
}
```

#### POST /moodle/grade

Moodle 성적부에 점수 제출

**Request Body:**
```json
{
  "user_id": 1,
  "item_id": 123,
  "grade": 100
}
```

**Response:**
```json
{
  "success": true,
  "result": {...}
}
```

---

## Error Responses

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

**HTTP Status Codes:**
- 200: 성공
- 201: 생성 성공
- 400: 잘못된 요청
- 404: 리소스를 찾을 수 없음
- 405: 허용되지 않은 메소드
- 500: 서버 오류

---

## Authentication

현재 버전은 Moodle 세션 기반 인증을 사용합니다. 추후 JWT 토큰 인증이 추가될 예정입니다.

---

## Rate Limiting

API 요청은 시간당 100회로 제한됩니다.

---

## CORS

CORS는 설정 파일에서 지정된 도메인에 대해 활성화됩니다.

기본 허용 도메인:
- http://localhost
- http://localhost/moodle
