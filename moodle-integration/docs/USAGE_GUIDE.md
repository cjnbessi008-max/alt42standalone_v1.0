# Moodle LMS 학습 분석 시스템 - 사용 가이드

## 개요

이 가이드는 Moodle LMS 학습 분석 시스템을 사용하여 학생들의 추론(reasoning)과 계산(calculation) 능력을 분석하는 방법을 설명합니다.

## 주요 기능

1. **데이터 동기화**: Moodle에서 학생, 문제, 시도 데이터 수집
2. **문제 분류**: AI 기반 자동 문제 유형 분류
3. **학생 분석**: 개별 학생의 추론/계산 능력 분석
4. **코스 분석**: 코스 전체 학생의 성과 분석
5. **시각화**: 대시보드를 통한 데이터 시각화

## 1. 데이터 동기화

### 전체 코스 동기화

모든 코스의 데이터를 동기화합니다:

```bash
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "sync_students": true,
    "sync_questions": true,
    "sync_attempts": true
  }'
```

### 특정 코스만 동기화

```bash
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "course_ids": [1, 2, 3],
    "sync_students": true,
    "sync_questions": true,
    "sync_attempts": true
  }'
```

### 특정 기간 데이터만 동기화

```bash
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "course_ids": [1],
    "date_from": "2024-01-01T00:00:00Z",
    "sync_students": true,
    "sync_questions": true,
    "sync_attempts": true
  }'
```

**응답 예시**:
```json
{
  "status": "completed",
  "courses_synced": 3,
  "students_synced": 150,
  "questions_synced": 500,
  "attempts_synced": 5000,
  "errors": [],
  "duration_seconds": 12.5
}
```

## 2. 문제 자동 분류

### AI 기반 문제 유형 분류

동기화된 문제를 추론/계산 유형으로 자동 분류합니다:

```bash
curl -X POST http://localhost:8000/api/classify/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question_ids": [1, 2, 3, 4, 5],
    "force_reclassify": false
  }'
```

**응답 예시**:
```json
{
  "status": "completed",
  "classified_count": 5,
  "statistics": {
    "total": 5,
    "reasoning_count": 2,
    "calculation_count": 3,
    "mixed_count": 0,
    "unknown_count": 0,
    "reasoning_percentage": 40.0,
    "calculation_percentage": 60.0,
    "average_confidence": 0.85
  },
  "results": [
    {
      "question_id": 1,
      "moodle_question_id": 1,
      "question_text": "다음 수열의 패턴을 설명하고 다음 항을 예측하시오...",
      "classified_type": "reasoning",
      "confidence": 0.92,
      "reasoning": "패턴 인식과 설명이 필요한 추론 문제입니다",
      "tags": ["patterns", "sequences", "reasoning"]
    },
    {
      "question_id": 2,
      "moodle_question_id": 2,
      "question_text": "3x + 5 = 20일 때, x의 값을 구하시오.",
      "classified_type": "calculation",
      "confidence": 0.95,
      "reasoning": "방정식을 풀어 수치 답을 구하는 계산 문제입니다",
      "tags": ["algebra", "equations", "calculation"]
    }
  ]
}
```

### 분류 결과 해석

- **reasoning**: 논리적 사고, 패턴 인식, 설명이 필요한 문제
- **calculation**: 수치 계산, 공식 적용이 주된 문제
- **mixed**: 추론과 계산이 모두 필요한 문제
- **confidence**: 0.0 ~ 1.0 (높을수록 분류 신뢰도 높음)

## 3. 학생 성과 분석

### 개별 학생 분석

특정 학생의 추론/계산 능력을 분석합니다:

```bash
curl http://localhost:8000/api/analyze/student/123
```

**응답 예시**:
```json
{
  "student_id": 123,
  "moodle_user_id": 456,
  "student_name": "홍길동",

  "reasoning_score": 78.5,
  "reasoning_attempts": 20,
  "reasoning_correct": 16,
  "reasoning_accuracy": 80.0,

  "calculation_score": 92.3,
  "calculation_attempts": 30,
  "calculation_correct": 28,
  "calculation_accuracy": 93.3,

  "strength_area": "calculation",
  "strength_score_diff": 13.8,
  "overall_score": 86.0,

  "insights": "계산 문제에서 93.3%의 높은 정확도를 보입니다. 추론 문제는 80.0%로 개선의 여지가 있습니다. 특히 패턴 인식 문제에서 어려움을 겪고 있습니다.",

  "recommendations": "1. 개념 설명 문제를 더 많이 풀어보세요.\n2. 왜 그런지 설명하는 연습을 하세요.\n3. 패턴 인식 문제에 도전하세요.",

  "learning_trend": {
    "trend": "improving",
    "data_points": [
      {"week": "2024-W01", "accuracy": 75.0, "attempts": 10},
      {"week": "2024-W02", "accuracy": 82.5, "attempts": 12},
      {"week": "2024-W03", "accuracy": 88.0, "attempts": 15}
    ]
  },

  "weak_topics": ["pattern_recognition", "proof"],
  "strong_topics": ["algebra", "equations", "arithmetic"]
}
```

### 분석 결과 활용

#### 1. 강점 영역 식별
- **reasoning**: 추론에 강함 → 고급 사고 문제 권장
- **calculation**: 계산에 강함 → 복잡한 수치 문제 도전
- **balanced**: 균형잡힘 → 다양한 문제 유형 제공

#### 2. 학습 추세 파악
- **improving**: 📈 성과 향상 중
- **declining**: 📉 성과 하락 중 (주의 필요)
- **stable**: ➡️ 안정적

#### 3. 약점 토픽 보완
`weak_topics` 리스트를 확인하여 집중 학습 필요 영역 식별

## 4. 코스 전체 분석

### 코스 성과 분석

코스의 모든 학생을 종합 분석합니다:

```bash
curl http://localhost:8000/api/analyze/course/1
```

**응답 예시**:
```json
{
  "course_id": 1,
  "course_name": "대수학 기초",

  "total_students": 30,
  "total_questions": 100,
  "reasoning_questions": 40,
  "calculation_questions": 60,

  "reasoning_strong_count": 8,
  "calculation_strong_count": 15,
  "balanced_count": 7,

  "avg_reasoning_score": 75.2,
  "avg_calculation_score": 82.5,
  "avg_overall_score": 79.1,

  "score_distribution": {
    "0-20": 0,
    "21-40": 2,
    "41-60": 5,
    "61-80": 15,
    "81-100": 8
  },

  "top_performers": [
    {
      "student_id": 101,
      "name": "김수학",
      "score": 95.5,
      "strength": "balanced"
    },
    {
      "student_id": 102,
      "name": "이계산",
      "score": 93.2,
      "strength": "calculation"
    }
  ],

  "struggling_students": [
    {
      "student_id": 201,
      "name": "박학생",
      "score": 45.3,
      "weak_topics": ["algebra", "equations"]
    }
  ]
}
```

### 코스 분석 인사이트

#### 1. 학생 분포 분석
```
추론 강점: 8명 (26.7%)
계산 강점: 15명 (50.0%)
균형잡힘: 7명 (23.3%)
```

**해석**: 절반의 학생들이 계산에 강점 → 추론 능력 향상 프로그램 필요

#### 2. 평균 점수 비교
- 계산 평균 (82.5%) > 추론 평균 (75.2%)
- 차이: 7.3%

**해석**: 코스 전체적으로 추론 문제에 어려움 → 추론 교육 강화 필요

#### 3. 점수 분포
- 상위권 (81-100): 8명
- 중상위권 (61-80): 15명
- 중하위권 (41-60): 5명
- 하위권 (0-40): 2명

## 5. 일괄 분석 작업

대규모 데이터를 백그라운드에서 분석:

### 분석 작업 시작

```bash
curl -X POST http://localhost:8000/api/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "analyze_all": true
  }'
```

**응답**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "total_students": 100,
  "completed": 0,
  "failed": 0,
  "estimated_time_remaining": null
}
```

### 작업 진행 상황 확인

```bash
curl http://localhost:8000/api/analyze/batch/550e8400-e29b-41d4-a716-446655440000
```

**응답**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress",
  "total_students": 100,
  "completed": 45,
  "failed": 2,
  "estimated_time_remaining": 300
}
```

## 6. 통계 및 리포트

### 코스 기본 통계

```bash
curl http://localhost:8000/api/stats/course/1
```

### 학생 학습 타임라인

```bash
curl http://localhost:8000/api/reports/student/123/timeline
```

**응답**:
```json
{
  "student_id": 123,
  "timeline": [
    {
      "date": "2024-01-15T10:30:00Z",
      "quiz_name": "중간고사",
      "score": 85.0,
      "question_count": 20
    },
    {
      "date": "2024-01-22T14:20:00Z",
      "quiz_name": "주간 퀴즈 1",
      "score": 92.0,
      "question_count": 10
    }
  ]
}
```

## 7. 프론트엔드 대시보드 사용

### 학생 분석 대시보드

브라우저에서 `http://localhost:3000/student/123` 접속

**주요 기능**:
- 📊 추론 vs 계산 점수 비교 차트
- 🕸️ 종합 능력 레이더 차트
- 📈 주간별 학습 추이 그래프
- 📝 약점/강점 토픽 분석
- 💡 AI 생성 인사이트 및 추천

### 코스 분석 대시보드

브라우저에서 `http://localhost:3000/course/1` 접속

**주요 기능**:
- 👥 학생 강점 분포 파이 차트
- 📊 평균 점수 비교 막대 차트
- 📉 점수 분포 히스토그램
- 🏆 상위 학생 목록
- ⚠️ 도움 필요 학생 목록

## 8. 실전 활용 시나리오

### 시나리오 1: 신규 코스 분석

```bash
# 1. 데이터 동기화
curl -X POST http://localhost:8000/api/sync -d '{"course_ids": [5]}'

# 2. 문제 분류
curl -X POST http://localhost:8000/api/classify/questions -d '{"force_reclassify": true}'

# 3. 코스 분석
curl http://localhost:8000/api/analyze/course/5

# 4. 대시보드 확인
# 브라우저: http://localhost:3000/course/5
```

### 시나리오 2: 학생 개별 상담 준비

```bash
# 1. 학생 분석
curl http://localhost:8000/api/analyze/student/123

# 2. 학습 타임라인 확인
curl http://localhost:8000/api/reports/student/123/timeline

# 3. 대시보드 확인
# 브라우저: http://localhost:3000/student/123
```

### 시나리오 3: 주간 성과 모니터링

```bash
# 1. 지난 주 데이터 동기화
curl -X POST http://localhost:8000/api/sync \
  -d '{
    "date_from": "2024-01-15T00:00:00Z",
    "sync_attempts": true
  }'

# 2. 일괄 분석
curl -X POST http://localhost:8000/api/analyze/batch \
  -d '{"analyze_all": true}'

# 3. 코스별 리포트 확인
for course_id in 1 2 3; do
  curl http://localhost:8000/api/analyze/course/$course_id
done
```

## 9. 모범 사례

### 데이터 동기화 주기
- **일일**: 활발한 코스
- **주간**: 일반 코스
- **월간**: 아카이브 코스

### 문제 재분류 시기
- 새 문제 추가 시
- 문제 내용 수정 시
- 분류 정확도 의심 시

### 분석 빈도
- **학생 분석**: 학기당 3-4회
- **코스 분석**: 학기 초/중/말
- **실시간 모니터링**: 시험 기간

## 10. 문제 해결

### 분석 결과가 나오지 않음
- 데이터 동기화 확인
- 문제 분류 완료 여부 확인
- 최소 시도 수(5회) 충족 확인

### 분류 정확도가 낮음
- AI 모델 설정 확인
- 문제 텍스트 품질 확인
- 재분류 실행

## 다음 단계

- [API 레퍼런스](http://localhost:8000/docs) 참조
- [설치 가이드](SETUP_GUIDE.md) 재확인
- 샘플 데이터로 연습
