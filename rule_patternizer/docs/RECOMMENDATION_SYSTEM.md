# 적응형 학습 추천 시스템 | Adaptive Learning Recommendation System

## 개요 | Overview

Rule Patternizer의 **적응형 학습 추천 시스템(Adaptive Learning Recommendation System)**은 각 학생의 학습 패턴을 분석하여 최적의 학습 경로를 제안하는 AI 기반 시스템입니다.

---

## 핵심 기능 | Core Features

### 1. 🎯 지능형 문제 추천 (Intelligent Problem Recommendation)

#### 알고리즘 요소:
- **마스터리 레벨 분석 (40%)**: 낮은 마스터리 수준의 규칙을 우선 추천
- **간격 반복 (30%)**: 복습 시기에 맞춰 문제 제시
- **오류율 추적 (20%)**: 틀린 문제가 많은 영역 집중 학습
- **순차적 학습 (10%)**: 선행 개념 마스터 후 다음 단계 진행

#### 작동 방식:
```
1. 사용자 학습 데이터 수집
2. 각 규칙별 우선순위 점수 계산
3. 최적의 규칙 선택
4. 현재 수준에 맞는 난이도 문제 제시
```

---

### 2. 📊 간격 반복 학습 (Spaced Repetition)

연구 기반 복습 간격 시스템:

| 마스터리 레벨 | 최적 복습 시간 | 설명 |
|--------------|-------------|------|
| < 30% | 1시간 후 | 기초 개념 단기 반복 |
| 30-60% | 1일 후 | 중간 수준 일일 복습 |
| 60-80% | 1주일 후 | 고급 수준 주간 복습 |
| > 80% | 1개월 후 | 마스터 수준 장기 유지 |

#### 알고리즘:
```php
if (mastery < 30 && hours_since >= 1) {
    priority = HIGH;  // 즉시 복습 필요
} else if (mastery < 60 && hours_since >= 24) {
    priority = MEDIUM;  // 오늘 복습 권장
} else if (mastery >= 80 && hours_since < 720) {
    priority = LOW;  // 아직 복습 불필요
}
```

---

### 3. 🎓 적응형 난이도 조절 (Adaptive Difficulty)

사용자 마스터리에 따라 문제 난이도 자동 조절:

```javascript
Mastery  0-30%  → Difficulty Level 1 (Easy)
Mastery 30-50%  → Difficulty Level 2 (Medium-Easy)
Mastery 50-70%  → Difficulty Level 3 (Medium)
Mastery 70-85%  → Difficulty Level 4 (Medium-Hard)
Mastery  > 85%  → Difficulty Level 5 (Hard)
```

**장점:**
- 학습자가 압도당하지 않음 (너무 어려운 문제 방지)
- 지루함 방지 (너무 쉬운 문제 회피)
- 최적의 도전 수준 유지 (몰입 상태)

---

### 4. 💡 학습 인사이트 (Learning Insights)

#### 제공 정보:
1. **전체 통계**
   - 시작한 규칙 수
   - 마스터한 규칙 수
   - 평균 마스터리 레벨

2. **강점 영역**
   - 마스터리 80% 이상 규칙 목록
   - 잘하는 개념 영역 식별

3. **집중 필요 영역**
   - 마스터리 50% 미만 규칙
   - 추가 학습이 필요한 부분

4. **복습 추천**
   - 간격 반복 기반 복습 대상
   - 최적 복습 시기 도래한 규칙

---

## API 엔드포인트 | API Endpoints

### 1. 추천 문제 조회
```javascript
// Request
{
    action: 'get_next_problem',
    instanceid: 123
}

// Response
{
    success: true,
    data: {
        id: 45,
        rule_id: 2,
        problem_latex: 'f(x) = x^3',
        difficulty: 2,
        recommendation: {
            rule_name: 'Power Rule',
            current_mastery: 45.5,
            score: 78.3,
            reason: 'Making progress - continue practicing'
        }
    }
}
```

### 2. 학습 인사이트 조회
```javascript
// Request
{
    action: 'get_learning_insights',
    instanceid: 123
}

// Response
{
    success: true,
    data: {
        total_rules: 11,
        rules_started: 7,
        rules_mastered: 3,
        average_mastery: 62.5,
        strongest_areas: ['Constant Rule', 'Power Rule'],
        weakest_areas: ['Chain Rule', 'Product Rule'],
        needs_review: ['Exponential Rule']
    }
}
```

### 3. 학습 계획 생성
```javascript
// Request
{
    action: 'get_study_plan',
    instanceid: 123,
    session_length: 5
}

// Response
{
    success: true,
    data: {
        plan: [
            {sequence: 1, problem_id: 12, rule_id: 3, difficulty: 2},
            {sequence: 2, problem_id: 25, rule_id: 3, difficulty: 3},
            {sequence: 3, problem_id: 8, rule_id: 1, difficulty: 1},
            {sequence: 4, problem_id: 31, rule_id: 7, difficulty: 4},
            {sequence: 5, problem_id: 18, rule_id: 5, difficulty: 3}
        ],
        session_length: 5,
        estimated_time: 10  // minutes
    }
}
```

---

## 사용자 인터페이스 | User Interface

### 1. 환영 화면 추천 박스
```
┌─────────────────────────────────┐
│ 📊 Recommended for You          │
│                                 │
│ Power Rule                      │
│ Making progress - continue      │
│ practicing                      │
│ Current mastery: 45%            │
└─────────────────────────────────┘
  [Start Learning] [🎯 Smart Practice]
```

### 2. 연습 화면 추천 배지
```
🎯 Making progress - continue practicing

┌─────────────────────────────────┐
│ Power Rule                      │
│ d/dx[x^n] = nx^(n-1)           │
└─────────────────────────────────┘

Problem: f(x) = x^3
```

### 3. 학습 인사이트 화면
```
💡 Learning Insights

📊 Overview
  Rules Started:  7 / 11
  Rules Mastered: 3
  Average Mastery: 62%

💪 Strengths
  • Constant Rule
  • Power Rule
  • Exponential Rule

🎯 Focus Areas
  • Chain Rule
  • Product Rule

🔄 Review Recommended
  • Logarithm Rule [REVIEW]
```

---

## 알고리즘 상세 | Algorithm Details

### 추천 점수 계산
```php
function calculateScore($stat) {
    $score = 0;

    // 1. Mastery factor (40%)
    $mastery_score = (100 - $stat->mastery) * 0.4;
    $score += $mastery_score;

    // 2. Time decay (30%) - Spaced Repetition
    $hours_since = (time() - $stat->last_attempt) / 3600;
    $time_score = calculateSpacedRepetitionScore($hours_since, $stat->mastery);
    $score += $time_score * 0.3;

    // 3. Error rate (20%)
    if ($stat->attempts > 0) {
        $error_rate = 1 - ($stat->correct / $stat->attempts);
        $score += $error_rate * 20;
    }

    // 4. Sequential learning (10%)
    $sequential_score = calculatePrerequisitesScore($stat);
    $score += $sequential_score;

    return $score;
}
```

### 간격 반복 점수 계산
```php
function calculateSpacedRepetitionScore($hours_since, $mastery) {
    // Determine optimal review interval
    if ($mastery < 30) {
        $optimal_hours = 1;
    } else if ($mastery < 60) {
        $optimal_hours = 24;
    } else if ($mastery < 80) {
        $optimal_hours = 168;
    } else {
        $optimal_hours = 720;
    }

    // Calculate score based on deviation from optimal time
    $ratio = $hours_since / $optimal_hours;

    if ($ratio < 0.5) {
        return $ratio * 40;  // Too soon
    } else if ($ratio < 2) {
        return 80 + (1 - abs($ratio - 1)) * 20;  // Optimal window
    } else {
        return min(100, 60 + ($ratio - 2) * 10);  // Overdue
    }
}
```

---

## 데이터 구조 | Data Structures

### 사용자 통계 테이블
```sql
SELECT
    r.id as rule_id,
    r.rule_name,
    r.difficulty_level,
    COALESCE(AVG(p.mastery_level), 0) as avg_mastery,
    COALESCE(SUM(p.attempts), 0) as total_attempts,
    COALESCE(SUM(p.correct_count), 0) as total_correct,
    MAX(p.last_attempt_time) as last_attempt,
    COUNT(DISTINCT p.problem_id) as problems_attempted
FROM rulepatternizer_rules r
LEFT JOIN rulepatternizer_progress p
    ON r.id = p.rule_id
    AND p.userid = ?
    AND p.rulepatternizer_id = ?
GROUP BY r.id
ORDER BY r.difficulty_level ASC
```

---

## 성능 최적화 | Performance Optimization

### 1. 캐싱 전략
```php
// Cache user statistics for 5 minutes
$cache_key = "user_stats_{$userid}_{$instanceid}";
$stats = cache_get($cache_key);

if (!$stats) {
    $stats = get_user_statistics($userid, $instanceid);
    cache_set($cache_key, $stats, 300);  // 5 minutes
}
```

### 2. 인덱스 최적화
```sql
-- Add composite index for faster queries
CREATE INDEX idx_user_rule_time
ON rulepatternizer_progress(userid, rule_id, last_attempt_time);

-- Index for spaced repetition queries
CREATE INDEX idx_mastery_time
ON rulepatternizer_progress(mastery_level, last_attempt_time);
```

### 3. 쿼리 최적화
- JOIN 대신 서브쿼리 사용 (작은 데이터셋)
- SELECT 시 필요한 컬럼만 조회
- LIMIT를 사용하여 결과 제한

---

## 확장 가능성 | Extensibility

### 향후 추가 기능:
1. **머신러닝 통합**
   - TensorFlow/PyTorch 모델 학습
   - 개인별 학습 패턴 예측
   - 최적 학습 시간 예측

2. **협업 필터링**
   - 유사한 학습 패턴의 학생 식별
   - 다른 학생의 성공 전략 추천

3. **감정 인식**
   - 학습 중 어려움 감지
   - 동기 부여 메시지 제공

4. **게이미피케이션**
   - 배지 및 업적 시스템
   - 학습 스트릭 추적
   - 리더보드

---

## 연구 기반 | Research-Based

이 시스템은 다음 교육 심리학 원리에 기반합니다:

1. **Ebbinghaus의 망각 곡선** (Forgetting Curve)
   - 간격을 두고 복습하면 장기 기억 강화
   - 최적 복습 시기 존재

2. **Zone of Proximal Development (ZPD)**
   - 적절한 난이도 = 현재 수준 + 약간의 도전
   - 너무 쉽거나 어려운 것은 학습 효과 저하

3. **Mastery Learning**
   - 한 개념을 완전히 이해한 후 다음 단계
   - 순차적 학습의 중요성

4. **Deliberate Practice**
   - 약점에 집중하는 연습
   - 즉각적인 피드백

---

## 사용 예제 | Usage Examples

### PHP 예제
```php
// Recommendation engine 사용
require_once('classes/recommendation_engine.php');

$engine = new \mod_rulepatternizer\recommendation_engine($userid, $instanceid);

// Get recommended problem
$problem = $engine->get_recommended_problem();

// Get learning insights
$insights = $engine->get_learning_insights();
```

### JavaScript 예제
```javascript
// Smart practice 시작
document.getElementById('smart-practice-btn').addEventListener('click', function() {
    fetch('/mod/rulepatternizer/ajax.php', {
        method: 'POST',
        body: new FormData({
            action: 'get_next_problem',
            instanceid: App.instanceId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data.recommendation) {
            console.log('Recommended:', data.data.recommendation.rule_name);
            console.log('Reason:', data.data.recommendation.reason);
        }
    });
});
```

---

## 문제 해결 | Troubleshooting

### 문제: 추천이 작동하지 않음
```sql
-- 진행도 데이터 확인
SELECT * FROM mdl_rulepatternizer_progress WHERE userid = ?;

-- 마지막 시도 시간 확인
SELECT rule_id, last_attempt_time,
       (UNIX_TIMESTAMP() - last_attempt_time) / 3600 as hours_since
FROM mdl_rulepatternizer_progress
WHERE userid = ?;
```

### 문제: 잘못된 난이도 추천
```php
// 디버그 로그 추가
error_log("Mastery: " . $mastery . ", Target difficulty: " . $target_difficulty);
```

---

## 라이선스 | License

GNU General Public License v3.0

---

## 참고 문헌 | References

1. Ebbinghaus, H. (1885). "Memory: A Contribution to Experimental Psychology"
2. Vygotsky, L. S. (1978). "Mind in Society"
3. Bloom, B. S. (1968). "Learning for Mastery"
4. Ericsson, K. A. (1993). "The Role of Deliberate Practice"
5. Pimsleur, P. (1967). "A Memory Schedule"

---

**Rule Patternizer** - Intelligent Learning, Personalized Growth! 🧠🚀
