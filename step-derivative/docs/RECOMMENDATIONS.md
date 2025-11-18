# Step Derivative 추천 시스템 문서

## 개요

Step Derivative의 AI 기반 개인화 추천 시스템은 학생의 학습 패턴과 성과를 실시간으로 분석하여 맞춤형 학습 경로를 제공합니다.

## 주요 기능

### 1. 적응형 난이도 조정 (Adaptive Difficulty)

학생의 실력에 따라 자동으로 문제 난이도를 조정합니다.

**작동 방식:**
- 평균 스킬 레벨 0.00-0.65: 기본 난이도
- 평균 스킬 레벨 0.55-0.85: 중급 난이도
- 평균 스킬 레벨 0.75-1.00: 고급 난이도

**특징:**
- 최소 3회 이상 시도 후 난이도 조정
- 완료율과 소요 시간을 함께 고려
- 24시간 쿨다운 기간 (설정 가능)

### 2. 스킬 레벨 추적 (Skill Level Tracking)

각 미분 규칙별로 학생의 숙련도를 0.00-1.00 척도로 추적합니다.

**추적되는 스킬:**
- 상수 미분 (constant_rule)
- 거듭제곱 미분 (power_rule)
- 상수배 미분 (constant_multiple)
- 합/차 미분 (sum_rule)
- 곱셈 미분 (product_rule)
- 나눗셈 미분 (quotient_rule)
- 연쇄 법칙 (chain_rule)
- 삼각함수 미분 (sin_rule, cos_rule, tan_rule)
- 지수/로그 미분 (exponential_rule, logarithm_rule)

**스킬 레벨 업데이트 알고리즘:**
```
새로운 레벨 = 현재 레벨 × (1 - 학습률) + 성과 점수 × 학습률
학습률 = 0.15 × 스킬 가중치
```

**성과 점수 계산:**
- 기본 점수: 완료 시 1.0, 미완료 시 0.5
- 시간 보너스: 평균 시간 대비 빠르면 최대 +0.2
- 재시도 패널티: 재시도마다 -0.05 (최대 -0.2)

### 3. 약점 분석 및 보강 학습 (Weakness Detection)

학생이 어려워하는 미분 규칙을 자동으로 감지하고 맞춤형 연습을 제안합니다.

**약점 기준:**
- 스킬 레벨 < 0.50 (기본 임계값)
- 완료율 < 50%
- 평균 시간이 전체 평균의 1.5배 이상

**보강 학습 자동 생성:**
- 약점 스킬을 위한 맞춤 학습 경로 생성
- 선행 학습이 필요한 스킬 자동 식별
- 난이도 순으로 문제 배열

### 4. 다음 문제 추천 (Next Problem Recommendation)

학생에게 가장 적합한 다음 문제를 추천합니다.

**추천 우선순위:**
1. **약점 보강**: 스킬 레벨 < 0.50인 규칙 우선
2. **학습 경로**: 활성화된 학습 경로의 다음 단계
3. **적정 난이도**: 현재 실력에 맞는 난이도

**고려 요소:**
- 최근 학습 기록
- 완료율
- 소요 시간
- 스킬 레벨 분포

### 5. 학습 경로 자동 생성 (Learning Path Generation)

개인별 맞춤 학습 커리큘럼을 자동으로 생성합니다.

**경로 생성 과정:**
1. 목표 스킬 식별 (약점 또는 사용자 지정)
2. 선행 학습 분석 (스킬 의존성 그래프)
3. 위상 정렬로 최적 학습 순서 결정
4. 각 단계별 문제 할당
5. 예상 소요 시간 계산

**스킬 선행 학습 관계:**
```
chain_rule → power_rule (필수)
           → constant_multiple (권장)
           → sum_rule (권장)

product_rule → power_rule (필수)
            → constant_multiple (권장)

quotient_rule → power_rule (필수)
             → product_rule (권장)
```

## 데이터베이스 스키마

### student_skill_levels
학생별 스킬 레벨 저장

```sql
- skill_name: 스킬 이름
- skill_level: 숙련도 (0.00-1.00)
- attempts_count: 시도 횟수
- success_count: 성공 횟수
- average_time_seconds: 평균 소요 시간
- last_practiced: 마지막 연습 시간
```

### problem_skills
문제가 요구하는 스킬 매핑

```sql
- problem_id: 문제 ID
- skill_name: 필요 스킬
- skill_weight: 가중치 (0.00-1.00)
- is_primary: 주요 스킬 여부
```

### recommendations
추천 이력 저장

```sql
- recommendation_type: 추천 유형
- problem_id: 추천 문제
- reasoning: 추천 이유
- was_accepted: 수락 여부
- outcome_score: 결과 점수
```

### learning_paths
학습 경로 정의

```sql
- path_name: 경로 이름
- target_skills: 목표 스킬 (JSON)
- current_position: 현재 위치
- total_steps: 전체 단계 수
- is_active: 활성화 상태
```

### student_performance_summary
학생 성과 요약

```sql
- total_attempts: 총 시도 횟수
- average_completion_rate: 평균 완료율
- average_skill_level: 평균 스킬 레벨
- current_difficulty: 현재 난이도
- weak_skills: 약점 스킬 (JSON)
- strong_skills: 강점 스킬 (JSON)
```

## API 엔드포인트

### GET /get_recommendations
종합 추천 정보 조회

**Parameters:**
- `user_id` (required): Moodle 사용자 ID
- `limit` (optional): 최대 추천 개수 (기본: 5)

**Response:**
```json
{
  "status": "success",
  "recommendations": {
    "summary": { /* 성과 요약 */ },
    "next_problem": { /* 다음 문제 */ },
    "recommended_difficulty": "intermediate",
    "suggestions": [ /* 학습 제안 */ ]
  }
}
```

### GET /get_next_problem
다음 추천 문제 조회

**Parameters:**
- `user_id` (required): Moodle 사용자 ID

**Response:**
```json
{
  "status": "success",
  "problem": { /* 문제 정보 */ },
  "recommendation_reason": "약점 보강을 위한 문제입니다"
}
```

### GET /get_performance_summary
성과 요약 조회

**Parameters:**
- `user_id` (required): Moodle 사용자 ID

**Response:**
```json
{
  "status": "success",
  "summary": {
    "total_attempts": 15,
    "total_completed": 12,
    "average_completion_rate": 80.00,
    "average_skill_level": 0.72,
    "current_difficulty": "intermediate",
    "weak_skills": ["chain_rule"],
    "strong_skills": ["power_rule", "constant_rule"]
  }
}
```

### GET /get_skill_analysis
상세 스킬 분석

**Parameters:**
- `user_id` (required): Moodle 사용자 ID

**Response:**
```json
{
  "status": "success",
  "skills": [ /* 전체 스킬 목록 */ ],
  "categorized": {
    "weak": [ /* 약점 스킬 */ ],
    "developing": [ /* 발전 중 스킬 */ ],
    "proficient": [ /* 숙련 스킬 */ ],
    "mastered": [ /* 마스터 스킬 */ ]
  }
}
```

### POST /update_skills
스킬 레벨 수동 업데이트

**Body:**
```json
{
  "user_id": 1,
  "attempt_id": 5
}
```

**Response:**
```json
{
  "status": "success",
  "updated_skills": {
    "power_rule": 0.75,
    "constant_multiple": 0.68
  }
}
```

### POST /create_learning_path
맞춤 학습 경로 생성

**Body:**
```json
{
  "user_id": 1,
  "target_skills": ["chain_rule", "product_rule"],
  "path_name": "고급 미분 마스터하기"
}
```

**Response:**
```json
{
  "status": "success",
  "path_id": 3,
  "target_skills": ["power_rule", "chain_rule", "product_rule"]
}
```

### GET /get_learning_path
학습 경로 조회

**Parameters:**
- `user_id` (required): Moodle 사용자 ID
- `path_id` (optional): 특정 경로 ID

**Response:**
```json
{
  "status": "success",
  "path": { /* 경로 정보 */ },
  "steps": [ /* 단계별 정보 */ ],
  "progress": 60.0,
  "completed_steps": 3,
  "total_steps": 5
}
```

## 프론트엔드 사용법

### JavaScript API

```javascript
// 초기화
Recommendations.init(apiUrl, userId);

// 종합 추천 가져오기
const recommendations = await Recommendations.getRecommendations(5);

// 다음 문제 가져오기
const nextProblem = await Recommendations.getNextProblem();

// 성과 요약 가져오기
const summary = await Recommendations.getPerformanceSummary();

// 스킬 분석 가져오기
const analysis = await Recommendations.getSkillAnalysis();

// 학습 경로 생성
const path = await Recommendations.createLearningPath(
  ['chain_rule', 'product_rule'],
  '고급 미분 학습'
);

// UI에 추천 표시
const container = document.getElementById('recommendations-container');
await Recommendations.displayRecommendations(container);
```

### UI 컴포넌트

추천 시스템은 다음 UI 컴포넌트를 제공합니다:

1. **Performance Overview**: 학습 현황 요약
2. **Next Problem Card**: 추천 문제 카드
3. **Difficulty Recommendation**: 난이도 조정 제안
4. **Suggestions List**: 맞춤 학습 제안
5. **Learning Path**: 학습 경로 진행 상황

## 설정 커스터마이징

`recommendation_settings` 테이블에서 다음 설정을 변경할 수 있습니다:

```sql
-- 스킬 숙달 임계값 (기본: 0.80)
UPDATE recommendation_settings
SET setting_value = '0.85'
WHERE setting_key = 'skill_mastery_threshold';

-- 약점 임계값 (기본: 0.50)
UPDATE recommendation_settings
SET setting_value = '0.45'
WHERE setting_key = 'skill_weakness_threshold';

-- 추천 생성 최소 시도 횟수 (기본: 3)
UPDATE recommendation_settings
SET setting_value = '5'
WHERE setting_key = 'min_attempts_for_recommendation';

-- 난이도 조정 쿨다운 시간 (기본: 24시간)
UPDATE recommendation_settings
SET setting_value = '48'
WHERE setting_key = 'difficulty_adjustment_cooldown_hours';

-- 세션당 최대 추천 개수 (기본: 5)
UPDATE recommendation_settings
SET setting_value = '10'
WHERE setting_key = 'max_recommendations_per_session';

-- 적응형 난이도 활성화 (기본: true)
UPDATE recommendation_settings
SET setting_value = 'false'
WHERE setting_key = 'enable_adaptive_difficulty';
```

## 성능 최적화

### 인덱스 최적화

추천 시스템은 다음 인덱스를 사용합니다:

```sql
-- 스킬 레벨 조회 최적화
INDEX idx_user_skill (moodle_user_id, skill_name)

-- 성과 요약 조회 최적화
INDEX idx_user (moodle_user_id)

-- 추천 이력 조회 최적화
INDEX idx_user_type (moodle_user_id, recommendation_type)
```

### 캐싱 전략

- 성과 요약: 5분 캐시
- 스킬 분석: 10분 캐시
- 학습 경로: 세션 동안 캐시

## 분석 및 모니터링

### 주요 메트릭

1. **추천 수락률**: 제안된 추천 중 실제로 시작한 비율
2. **추천 성공률**: 추천 문제의 완료율
3. **스킬 향상률**: 시간 경과에 따른 평균 스킬 레벨 증가
4. **학습 경로 완료율**: 생성된 학습 경로의 완료 비율

### 데이터 조회

```sql
-- 추천 수락률
SELECT
  recommendation_type,
  COUNT(*) as total,
  SUM(was_accepted) as accepted,
  AVG(was_accepted) * 100 as acceptance_rate
FROM recommendations
GROUP BY recommendation_type;

-- 평균 스킬 향상
SELECT
  AVG(average_skill_level) as avg_skill,
  AVG(average_completion_rate) as avg_completion
FROM student_performance_summary;

-- 가장 어려운 스킬
SELECT
  skill_name,
  AVG(skill_level) as avg_level,
  COUNT(*) as student_count
FROM student_skill_levels
GROUP BY skill_name
ORDER BY avg_level ASC;
```

## 문제 해결

### 추천이 생성되지 않음

**원인:**
- 시도 횟수 부족 (최소 3회 필요)
- 데이터 부족

**해결:**
```sql
-- 최소 시도 횟수 확인
SELECT setting_value
FROM recommendation_settings
WHERE setting_key = 'min_attempts_for_recommendation';

-- 사용자 시도 횟수 확인
SELECT COUNT(*)
FROM student_attempts
WHERE moodle_user_id = 1;
```

### 스킬 레벨이 업데이트되지 않음

**원인:**
- 문제에 스킬이 매핑되지 않음
- 자동 감지 실패

**해결:**
```sql
-- 문제 스킬 수동 추가
INSERT INTO problem_skills (problem_id, skill_name, skill_weight, is_primary)
VALUES (1, 'power_rule', 1.0, 1);
```

### 잘못된 난이도 추천

**원인:**
- 난이도 임계값 설정 문제
- 데이터 편향

**해결:**
```sql
-- 난이도 임계값 조정
UPDATE difficulty_thresholds
SET min_skill_level = 0.60, max_skill_level = 0.80
WHERE difficulty_level = 'intermediate';
```

## 향후 개선 사항

1. **협업 필터링**: 유사한 학생의 학습 패턴 활용
2. **강화 학습**: 추천 성공률 기반 알고리즘 자동 최적화
3. **시간대별 분석**: 학습 시간대에 따른 성과 분석
4. **모바일 알림**: 학습 리마인더 및 추천 알림
5. **게이미피케이션**: 배지, 레벨, 리더보드 통합

## 참고 자료

- [API 문서](API.md)
- [설치 가이드](INSTALLATION.md)
- [메인 README](../README.md)

---

**작성일**: 2024
**버전**: 1.0.0
