# API 사용 가이드

## Base URL
```
http://localhost:8000/api/v1
```

## 주요 엔드포인트

### 1. 문제 관리

#### 문제 목록 조회
```http
GET /problems
```

#### 문제 생성
```http
POST /problems
Content-Type: application/json

{
  "title": "일차방정식 풀이",
  "description": "다음 방정식을 풀이하시오: 3x + 7 = 16",
  "subject": "MATHEMATICS",
  "difficulty": "EASY",
  "expected_steps": [
    {
      "step": 1,
      "type": "GIVEN",
      "content": "3x + 7 = 16"
    },
    {
      "step": 2,
      "type": "CALCULATION",
      "content": "3x = 16 - 7"
    },
    {
      "step": 3,
      "type": "CALCULATION",
      "content": "3x = 9"
    },
    {
      "step": 4,
      "type": "CONCLUSION",
      "content": "x = 3"
    }
  ],
  "expected_reasoning": "등식의 성질을 이용하여 x의 값을 구합니다."
}
```

### 2. 풀이 제출

#### 풀이 생성
```http
POST /solutions
Content-Type: application/json

{
  "problem_id": "uuid-here",
  "user_id": "uuid-here",
  "submitted_steps": [
    {
      "step": 1,
      "type": "GIVEN",
      "content": "3x + 7 = 16",
      "explanation": "주어진 방정식"
    },
    {
      "step": 2,
      "type": "CALCULATION",
      "content": "3x = 9",
      "explanation": "양변에서 7을 뺌"
    },
    {
      "step": 3,
      "type": "CONCLUSION",
      "content": "x = 3",
      "explanation": "양변을 3으로 나눔"
    }
  ],
  "raw_input": "3x + 7 = 16이므로 3x = 9, 따라서 x = 3"
}
```

#### 풀이 제출
```http
POST /solutions/{solution_id}/submit
```

### 3. 간격 분석

#### 분석 시작
```http
POST /analysis/solutions/{solution_id}
```

응답:
```json
{
  "message": "Gap analysis started",
  "solution_id": "uuid-here",
  "status": "processing"
}
```

#### 분석 결과 조회
```http
GET /analysis/solutions/{solution_id}?include_details=true
```

응답:
```json
{
  "id": "uuid",
  "solution_id": "uuid",
  "completeness_score": 75.0,
  "logic_continuity_score": 80.0,
  "correctness_score": 100.0,
  "overall_score": 85.0,
  "total_gaps_detected": 1,
  "critical_gaps_count": 0,
  "missing_steps_count": 1,
  "logical_errors_count": 0,
  "ai_summary": "전반적으로 올바른 풀이입니다만, 중간 단계 하나가 생략되었습니다.",
  "ai_feedback": "답은 정확합니다. 다만 16-7=9를 계산하는 단계를 명시적으로 보여주면 더 완벽한 풀이가 됩니다.",
  "detected_gaps": [
    {
      "gap_type": "missing_step",
      "severity": "MEDIUM",
      "after_step_number": 1,
      "before_step_number": 2,
      "description": "16 - 7 = 9 계산 과정이 생략됨",
      "suggestion": "중간 계산 과정을 명시적으로 표시하세요"
    }
  ],
  "feedback_items": [
    {
      "feedback_type": "encouragement",
      "content": "최종 답이 정확합니다!",
      "priority": 1
    }
  ]
}
```

### 4. 사용자 관리

#### 사용자 생성
```http
POST /users
Content-Type: application/json

{
  "username": "student01",
  "email": "student01@school.kr",
  "full_name": "홍길동",
  "role": "student"
}
```

## 오류 응답

모든 오류는 다음 형식을 따릅니다:

```json
{
  "detail": "오류 메시지"
}
```

일반적인 HTTP 상태 코드:
- `200 OK`: 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 충돌 (예: 중복된 사용자명)
- `500 Internal Server Error`: 서버 오류

## 전체 API 문서

대화형 API 문서는 다음 URL에서 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
