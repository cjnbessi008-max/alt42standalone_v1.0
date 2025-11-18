# API 사용 예제

## 기본 URL

```
http://localhost:8000
```

## 1. 학생 관리

### 학생 생성

```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong@example.com",
    "grade_level": "6학년",
    "is_teacher": false
  }'
```

**응답 예시:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "홍길동",
  "email": "hong@example.com",
  "grade_level": "6학년",
  "is_teacher": false,
  "created_at": "2025-11-18T00:00:00Z",
  "updated_at": "2025-11-18T00:00:00Z"
}
```

### 학생 조회

```bash
curl http://localhost:8000/api/students/{student_id}
```

### 학생 목록 조회

```bash
# 모든 학생
curl http://localhost:8000/api/students

# 학생만 필터링 (교사 제외)
curl http://localhost:8000/api/students?is_teacher=false

# 페이지네이션
curl http://localhost:8000/api/students?skip=0&limit=10
```

## 2. 학습 활동 추적

### 학습 세션 시작

```bash
curl -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "{student_id}",
    "subject": "mathematics",
    "topic": "분수의 덧셈",
    "self_confidence_before": 3
  }'
```

**응답:**
```json
{
  "id": "activity-uuid",
  "student_id": "student-uuid",
  "session_start": "2025-11-18T10:00:00Z",
  "session_end": null,
  "duration_minutes": null,
  "subject": "mathematics",
  "topic": "분수의 덧셈",
  "total_problems": 0,
  "correct_answers": 0,
  "incorrect_answers": 0,
  "hints_used": 0,
  "self_confidence_before": 3,
  "self_confidence_after": null,
  "created_at": "2025-11-18T10:00:00Z",
  "updated_at": "2025-11-18T10:00:00Z"
}
```

### 문제 시도 기록

```bash
curl -X POST http://localhost:8000/api/activities/{activity_id}/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "fraction_add_01",
    "problem_type": "fraction_addition",
    "difficulty_level": 2,
    "attempt_number": 1,
    "time_spent_seconds": 120,
    "is_correct": true,
    "hints_requested": 0,
    "gave_up": false,
    "self_assessment_before": 3,
    "self_assessment_after": 4,
    "student_answer": {"numerator": 3, "denominator": 4},
    "correct_answer": {"numerator": 3, "denominator": 4}
  }'
```

### 학습 세션 종료

```bash
curl -X PATCH http://localhost:8000/api/activities/{activity_id} \
  -H "Content-Type: application/json" \
  -d '{
    "session_end": "2025-11-18T11:00:00Z",
    "duration_minutes": 60,
    "self_confidence_after": 4
  }'
```

### 학생의 학습 활동 조회

```bash
curl http://localhost:8000/api/activities/student/{student_id}?limit=10
```

## 3. 메타인지 성장 포인트

### 오늘의 성장 포인트 조회

```bash
curl http://localhost:8000/api/insights/daily/{student_id}
```

**응답 예시:**
```json
{
  "student_id": "student-uuid",
  "report_date": "2025-11-18T00:00:00Z",
  "insights": [
    {
      "id": "insight-uuid",
      "student_id": "student-uuid",
      "insight_date": "2025-11-18T00:00:00Z",
      "period_type": "daily",
      "dimension": "자기_조절_능력",
      "title": "힌트 의존도 감소",
      "description": "오늘 어려운 문제를 만났을 때, 이전보다 40% 적게 힌트를 요청했습니다. 스스로 문제를 해결하려는 시도가 증가했어요!",
      "recommendation": "계속해서 먼저 스스로 생각해보는 습관을 유지하세요. 막힐 때는 문제를 다른 방식으로 접근해보는 것도 좋습니다.",
      "improvement_percentage": 40.0,
      "confidence_score": 0.85,
      "evidence_data": {
        "metric": "힌트 사용 빈도",
        "previous_value": 5,
        "current_value": 3,
        "comparison_period": "지난 7일 평균"
      },
      "ai_model": "claude-3-5-sonnet-20241022",
      "created_at": "2025-11-18T12:00:00Z"
    }
  ],
  "summary": "오늘 학습에서 자기 조절 능력과 학습 효율성에서 눈에 띄는 성장을 보였습니다.",
  "overall_improvement": 25.5,
  "key_achievements": [
    "힌트 없이 해결한 문제 수 증가",
    "문제 해결 시간 20% 단축",
    "자기 평가 정확도 향상"
  ],
  "recommendations": [
    "더 어려운 문제에 도전해보세요",
    "배운 개념을 다양한 상황에 적용해보세요"
  ]
}
```

### 특정 날짜의 성장 포인트 조회

```bash
curl "http://localhost:8000/api/insights/daily/{student_id}?date=2025-11-17"
```

### 최근 성장 포인트 목록 조회

```bash
# 최근 7일
curl http://localhost:8000/api/insights/student/{student_id}?days=7

# 최근 30일
curl http://localhost:8000/api/insights/student/{student_id}?days=30
```

### 비동기 성장 포인트 생성

```bash
curl -X POST http://localhost:8000/api/insights/generate/{student_id}
```

**응답:**
```json
{
  "message": "Insight generation started",
  "student_id": "student-uuid"
}
```

## 4. 완전한 학습 플로우 예제

### 1단계: 학생 생성

```bash
STUDENT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 학생",
    "grade_level": "6학년",
    "is_teacher": false
  }')

STUDENT_ID=$(echo $STUDENT_RESPONSE | jq -r '.id')
echo "학생 ID: $STUDENT_ID"
```

### 2단계: 학습 세션 시작

```bash
ACTIVITY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": \"$STUDENT_ID\",
    \"subject\": \"mathematics\",
    \"topic\": \"분수의 곱셈\",
    \"self_confidence_before\": 3
  }")

ACTIVITY_ID=$(echo $ACTIVITY_RESPONSE | jq -r '.id')
echo "활동 ID: $ACTIVITY_ID"
```

### 3단계: 문제 풀이 기록 (10문제)

```bash
for i in {1..10}; do
  CORRECT=$([ $i -le 8 ] && echo "true" || echo "false")
  HINTS=$([ $i -le 8 ] && echo "0" || echo "1")

  curl -s -X POST http://localhost:8000/api/activities/$ACTIVITY_ID/attempts \
    -H "Content-Type: application/json" \
    -d "{
      \"problem_id\": \"mult_frac_$i\",
      \"difficulty_level\": 2,
      \"time_spent_seconds\": $((60 + RANDOM % 120)),
      \"is_correct\": $CORRECT,
      \"hints_requested\": $HINTS
    }" > /dev/null

  echo "문제 $i 기록 완료"
done
```

### 4단계: 학습 세션 종료

```bash
curl -s -X PATCH http://localhost:8000/api/activities/$ACTIVITY_ID \
  -H "Content-Type: application/json" \
  -d '{
    "duration_minutes": 45,
    "self_confidence_after": 4
  }'

echo "학습 세션 종료"
```

### 5단계: 메타인지 성장 포인트 생성

```bash
curl -s http://localhost:8000/api/insights/daily/$STUDENT_ID | jq
```

## 5. 헬스 체크

```bash
curl http://localhost:8000/health
```

**응답:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T00:00:00Z"
}
```

## 6. API 문서

인터랙티브 API 문서:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 에러 처리

모든 API는 다음과 같은 형식으로 에러를 반환합니다:

```json
{
  "detail": "에러 메시지"
}
```

HTTP 상태 코드:
- `200`: 성공
- `201`: 생성 성공
- `204`: 삭제 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류
