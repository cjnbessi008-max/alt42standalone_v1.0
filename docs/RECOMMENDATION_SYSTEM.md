# AI 기반 추천 시스템 가이드

## 개요

Dot Collector는 AI 기반 적응형 학습 시스템을 통해 각 학생에게 최적화된 문제를 추천합니다. 학생의 성과, 학습 패턴, 선호도를 분석하여 개인화된 학습 경험을 제공합니다.

## 핵심 기능

### 1. 학생 프로필 관리

시스템은 각 학생의 학습 프로필을 자동으로 생성하고 관리합니다:

```sql
- 현재 스킬 레벨 (1.0 ~ 5.0)
- 전체 정답률 (%)
- 평균 소요 시간 (초)
- 가장 잘하는 도형 타입
- 가장 약한 도형 타입
- 선호 난이도
- 학습 속도 (slow, medium, fast)
```

### 2. 학습 분석

모든 학생의 시도는 실시간으로 분석됩니다:

- 문제별 정답/오답
- 소요 시간
- 힌트 사용 횟수
- 도트 배치 효율성
- 난이도별 성공률

### 3. 추천 알고리즘

#### 3.1 적응형 추천 (Adaptive Recommendation)

**기본 추천 방식** - 학생의 현재 스킬 레벨과 최근 성과를 기반으로 추천

**알고리즘:**
```
1. 학생의 현재 스킬 레벨 확인
2. 최근 정답률 분석
3. 목표 난이도 계산:
   - 정답률 >= 80%: 스킬 레벨 + 1 (도전)
   - 정답률 60-80%: 현재 스킬 레벨 (유지)
   - 정답률 < 60%: 스킬 레벨 - 1 (복습)
4. 약한 도형 타입에 우선순위 부여
5. 최근에 풀지 않은 문제 우선 선택
```

**예시:**
```php
// 학생 A: 스킬 레벨 2.5, 정답률 85%
→ 목표 난이도: 3-4 범위의 문제 추천
→ 약한 도형(삼각형)에 가중치 2.0 부여

// 학생 B: 스킬 레벨 3.2, 정답률 55%
→ 목표 난이도: 2-3 범위의 문제 추천 (복습)
→ 기초 개념 강화에 집중
```

#### 3.2 협업 필터링 (Collaborative Filtering)

**유사한 학생들의 성과 기반 추천**

**알고리즘:**
```
1. 학습 패턴이 유사한 학생 찾기 (similarity >= 0.7)
2. 유사 학생들이 성공한 문제 추출
3. 아직 시도하지 않은 문제 우선 추천
4. 성공률이 높은 문제 순으로 정렬
```

**유사도 계산:**
```
- 스킬 레벨 차이
- 정답률 패턴
- 소요 시간 패턴
- 선호 도형 타입
```

#### 3.3 다양성 추천 (Diverse Recommendation)

**다양한 도형 타입을 골고루 학습**

**알고리즘:**
```
1. 각 도형 타입(직사각형, 삼각형, 원)에서 균등하게 문제 선택
2. 난이도 범위를 넓게 설정
3. 학습 경험의 다양성 증대
```

#### 3.4 스킬 갭 추천 (Skill Gap Recommendation)

**약한 부분 집중 학습**

**알고리즘:**
```
1. 모든 기술의 숙련도 분석
2. 숙련도가 낮은 기술 3개 선택
3. 해당 기술 관련 문제 집중 추천
4. 쉬운 난이도부터 시작
```

## 데이터베이스 구조

### 주요 테이블

#### `student_profiles`
학생의 전체 학습 프로필
```sql
- current_skill_level: 현재 스킬 레벨
- overall_accuracy_rate: 전체 정답률
- total_questions_attempted: 총 시도 문제 수
- strongest_shape_type: 가장 잘하는 도형
- weakest_shape_type: 가장 약한 도형
```

#### `learning_analytics`
개별 시도 분석 데이터
```sql
- question_id: 문제 ID
- was_correct: 정답 여부
- time_spent_seconds: 소요 시간
- difficulty_level: 문제 난이도
- dot_placement_efficiency: 도트 배치 효율성
```

#### `skill_progression`
기술별 진행도 추적
```sql
- skill_name: 기술 이름 (예: rectangle_area)
- proficiency_level: 숙련도 (1.0-5.0)
- questions_attempted: 시도 횟수
- questions_mastered: 숙달 횟수
```

#### `question_recommendations`
추천 이력 및 성과
```sql
- question_id: 추천된 문제
- recommendation_algorithm: 사용된 알고리즘
- predicted_success_rate: 예상 성공률
- actual_success: 실제 성공 여부
```

## API 엔드포인트

### 추천 관련 API

#### 1. 추천 문제 받기
```javascript
GET /api.php?action=get_recommended_questions
Body: {
    count: 5,
    strategy: 'adaptive' // adaptive, collaborative, diverse, skill_gap
}

Response: [
    {
        id: 1,
        question_text: "직사각형의 넓이를 구하세요...",
        difficulty_level: 3,
        shape_type: "rectangle"
    },
    ...
]
```

#### 2. 학생 프로필 조회
```javascript
GET /api.php?action=get_student_profile

Response: {
    current_skill_level: 2.5,
    overall_accuracy_rate: 78.5,
    total_questions_attempted: 42,
    strongest_shape_type: "rectangle",
    weakest_shape_type: "triangle",
    preferred_difficulty: 3,
    learning_pace: "medium"
}
```

#### 3. 학습 분석 데이터
```javascript
GET /api.php?action=get_analytics

Response: {
    summary: {
        total_questions_attempted: 50,
        total_correct_answers: 38,
        overall_accuracy_rate: 76.0,
        avg_time: 45
    },
    skills: [
        {
            skill_name: "rectangle_area",
            proficiency_level: 3.2,
            questions_attempted: 20,
            questions_mastered: 16
        },
        ...
    ]
}
```

#### 4. 시도 후 프로필 업데이트
```javascript
POST /api.php?action=update_after_attempt
Body: {
    question_id: 5,
    is_correct: true,
    time_spent: 45
}

Response: {
    updated: true
}
```

#### 5. 기술 진행도 조회
```javascript
GET /api.php?action=get_skill_progression

Response: [
    {
        skill_name: "rectangle_area",
        proficiency_level: 3.5,
        questions_attempted: 25,
        questions_mastered: 20,
        last_practiced: "2025-11-18 10:30:00"
    },
    ...
]
```

#### 6. 학습 설정 저장
```javascript
POST /api.php?action=set_learning_preference
Body: {
    preferred_difficulty: 4,
    learning_pace: "fast"
}

Response: {
    updated: true
}
```

## 스킬 레벨 시스템

### 레벨 범위
- **1.0 - 2.0**: 초급 (기초 개념 학습)
- **2.0 - 3.0**: 중급 (개념 적용 및 연습)
- **3.0 - 4.0**: 고급 (복잡한 문제 해결)
- **4.0 - 5.0**: 전문가 (도전적인 문제)

### 레벨 조정 로직

#### 정답 시:
```php
if (is_correct && difficulty >= current_skill_level) {
    current_skill_level = min(5.0, current_skill_level + 0.1);
}
```

#### 오답 시:
```php
if (!is_correct) {
    current_skill_level = max(1.0, current_skill_level - 0.05);
}
```

## 학습 분석 대시보드

### 접근 방법
메인 화면 우측 상단의 📊 버튼 클릭

### 제공 정보

#### 1. 학습 프로필
- 현재 스킬 레벨
- 선호 난이도
- 학습 속도
- 전체 정답률
- 강점/약점 도형

#### 2. 성과 요약
- 총 문제 수
- 정답 수
- 정답률 (%)
- 평균 소요 시간

#### 3. 기술 진행도
- 기술별 숙련도 차트
- 시도 횟수 및 숙달 횟수
- 마지막 연습 시간

#### 4. 학습 추천
- AI 기반 개인화 학습 조언
- 다음 학습 단계 제안
- 약점 보완 방법

#### 5. 성취 뱃지
- 첫 정답 🎯
- 연속 정답 🔥
- 100% 정답률 ⭐
- 빠른 해결사 🏃
- 학습왕 📚
- 전문가 🎓

## 추천 품질 향상

### 1. 피드백 루프

모든 추천은 성과 데이터로 다시 학습:
```
추천 → 학생 시도 → 결과 분석 → 알고리즘 조정
```

### 2. A/B 테스트

다양한 추천 전략의 효과 비교:
```sql
SELECT
    recommendation_algorithm,
    COUNT(*) as total_recommendations,
    AVG(CASE WHEN actual_success = 1 THEN 1 ELSE 0 END) as success_rate
FROM question_recommendations
WHERE was_attempted = 1
GROUP BY recommendation_algorithm;
```

### 3. 유사도 갱신

학생 간 유사도는 주기적으로 재계산:
```sql
-- 코사인 유사도 기반 학생 클러스터링
-- 주 1회 배치 작업으로 실행
```

## 모범 사례

### 교사를 위한 팁

1. **초기 평가**: 새 학생은 먼저 다양한 난이도의 문제로 스킬 레벨 파악
2. **정기 리뷰**: 학습 분석 대시보드를 주기적으로 확인
3. **개입 시점**: 정답률이 50% 이하로 떨어지면 교사의 직접 지도 필요
4. **학습 속도 조절**: 학생의 학습 설정을 함께 조정

### 학생을 위한 팁

1. **꾸준한 학습**: 매일 5-10문제씩 푸는 것이 효과적
2. **약점 보완**: 대시보드에서 약한 도형 타입 집중 연습
3. **난이도 조절**: 정답률 70-80% 유지가 최적
4. **시간 관리**: 문제당 평균 시간 단축 노력

## 문제 해결

### 추천이 너무 쉬운 경우
```javascript
// 선호 난이도 상향 조정
await api.setLearningPreference(4, 'fast');
```

### 추천이 너무 어려운 경우
```javascript
// 선호 난이도 하향 조정
await api.setLearningPreference(2, 'slow');
```

### 프로필 리셋
```sql
-- 관리자만 실행
DELETE FROM student_profiles WHERE moodle_user_id = ?;
DELETE FROM learning_analytics WHERE moodle_user_id = ?;
DELETE FROM skill_progression WHERE moodle_user_id = ?;
```

## 향후 개선 계획

- [ ] 딥러닝 기반 성과 예측
- [ ] 실시간 난이도 조정
- [ ] 학습 패턴 시각화 (그래프)
- [ ] 교사 대시보드 (전체 학생 관리)
- [ ] 학부모 리포트 생성
- [ ] 학습 목표 설정 및 추적
- [ ] 게임화 요소 강화

---

**Dot Collector v1.0 - AI-Powered Adaptive Learning**
KAIST Touch Math Academy
