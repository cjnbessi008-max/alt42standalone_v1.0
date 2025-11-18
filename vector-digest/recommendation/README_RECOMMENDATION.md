# 📚 학습 추천 시스템 (Learning Recommendation System)

Vector Digest와 통합된 **개인화 학습 추천 시스템**입니다. 학생의 학습 패턴을 분석하여 맞춤형 학습 자료를 추천합니다.

## 🎯 주요 기능

### 1. **다중 전략 추천 알고리즘**

- ✅ **Knowledge Gap Analysis** - 취약한 개념 파악 및 보강
- ✅ **Sequential Learning** - 학습 경로 기반 다음 단계 제안
- ✅ **Spaced Repetition** - 복습 필요 개념 식별
- ✅ **Difficulty Adaptation** - 학생 수준 맞춤 난이도 조절
- ✅ **Challenge Mode** - 우수 학생 대상 심화 문제 제공

### 2. **학생 프로필 분석**

- 학습 스타일 자동 감지 (시각형, 분석형, 실습형, 균형형)
- 실시간 숙련도 추적 (개념별 0-100% 점수)
- 학습 속도 분석 (느림/보통/빠름)
- 정확도 및 평균 풀이 시간 계산

### 3. **학습 경로 (Learning Path)**

- 체계적인 학습 로드맵 제공
- 초급/중급/고급 난이도별 경로
- 진행도 추적 및 시각화

### 4. **실시간 피드백**

- 문제 풀이 즉시 프로필 업데이트
- 추천 수락/완료 추적
- 추천 효과 분석

## 📊 데이터베이스 구조

### 핵심 테이블

1. **mdl_recommend_student_profile** - 학생 프로필
   - 학습 스타일, 레벨, 선호 난이도
   - 총 문제 수, 정확도, 평균 시간

2. **mdl_recommend_concept_mastery** - 개념 숙련도
   - 개념별 숙련도 점수 (0.0 ~ 1.0)
   - 시도 횟수, 정답 수, 마지막 연습일
   - 복습 필요 플래그

3. **mdl_recommend_learning_history** - 학습 이력
   - 문제 풀이 기록
   - 정답 여부, 소요 시간, 점수
   - Digest 활용 여부

4. **mdl_recommend_history** - 추천 이력
   - 추천 타입 (복습/다음주제/연습/도전)
   - 수락 여부, 완료 여부, 결과

5. **mdl_recommend_resource_meta** - 학습 자료 메타데이터
   - 난이도, 소요 시간, 개념 태그
   - 성공률, 인기도, 품질 점수

6. **mdl_recommend_learning_path** - 학습 경로 템플릿
   - 경로명, 대상 레벨, 개념 순서
   - 예상 소요 시간

7. **mdl_recommend_path_progress** - 학습 경로 진행도
   - 현재 개념 인덱스, 전체 진행률
   - 시작일, 완료일

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│          Smartphone UI (Frontend)       │
│  ┌──────────┐        ┌───────────────┐  │
│  │  Digest  │  Tabs  │Recommendations│  │
│  │  Panel   │◄──────►│    Panel      │  │
│  └──────────┘        └───────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       Recommendation API (PHP)           │
│  ┌────────────────────────────────────┐  │
│  │  RecommendationAPI.php             │  │
│  │  (REST Endpoints)                  │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│RecommendationEngine│StudentProfile    │
│                  │ │Analyzer          │
│ • Knowledge Gap  │ │                  │
│ • Sequential     │ │ • Profile Update │
│ • Spaced Rep.    │ │ • Mastery Calc   │
│ • Challenge      │ │ • Style Detection│
└──────────────────┘ └──────────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────────────────┐
│        MySQL Database (5.7)             │
│  • Student Profiles                      │
│  • Concept Mastery                       │
│  • Learning History                      │
│  • Recommendation History                │
│  • Learning Paths                        │
└─────────────────────────────────────────┘
```

## 🔌 API 엔드포인트

### Base URL
```
/vector-digest/recommendation/RecommendationAPI.php
```

### 1. 추천 조회
```http
GET ?action=get_recommendations&userid={userId}&count=3
```

**응답:**
```json
{
  "success": true,
  "user_id": 123,
  "count": 3,
  "recommendations": [
    {
      "id": 1,
      "recommendation_type": "review",
      "title": "벡터 기초 복습",
      "description": "벡터 기초 개념을 복습하고 실력을 다지세요.",
      "target_concept": "basics",
      "reasoning": "이 개념의 숙련도가 낮아 복습이 필요합니다.",
      "confidence": 0.9,
      "priority": 10,
      "estimated_time": 300,
      "difficulty": 0.4
    }
  ]
}
```

### 2. 학생 프로필 조회
```http
GET ?action=get_profile&userid={userId}
```

**응답:**
```json
{
  "success": true,
  "profile": {
    "userid": 123,
    "learning_style": "balanced",
    "current_level": "intermediate",
    "accuracy_rate": 0.75,
    "total_problems_attempted": 50
  },
  "concept_masteries": [...],
  "strongest_concepts": [...],
  "weakest_concepts": [...],
  "concepts_needing_review": [...]
}
```

### 3. 학습 활동 기록
```http
POST ?action=record_activity
```

**Body:**
```
userid=123
questionid=456
is_correct=1
time_spent=180
score=85
concepts=["basics","addition"]
digest_viewed=1
```

### 4. 추천 수락
```http
POST ?action=accept_recommendation
```

**Body:**
```
userid=123
recommendation_id=789
```

### 5. 추천 완료
```http
POST ?action=complete_recommendation
```

**Body:**
```
userid=123
recommendation_id=789
score=90
time_taken=250
```

### 6. 학습 경로 진행도
```http
GET ?action=get_learning_path&userid={userId}
```

### 7. 통계 조회
```http
GET ?action=get_stats&userid={userId}
```

## 🎨 UI 컴포넌트

### 추천 카드 타입

1. **복습 (Review)** - 분홍색 그라디언트
2. **다음 주제 (Next Topic)** - 파란색 그라디언트
3. **연습 (Practice)** - 녹색 그라디언트
4. **도전 (Challenge)** - 주황색 그라디언트

### 프로필 요약
- 문제 풀이 수
- 정확도 (%)
- 평균 숙련도 (%)
- 개념별 숙련도 그리드

### 학습 경로 진행도
- 경로명 및 설명
- 진행률 바
- 현재 학습 중인 개념

## 🧮 추천 알고리즘 상세

### 1. 복습 추천 (Priority: 10)

**조건:**
- 개념 숙련도 < 60%
- 신뢰도 >= 50% (최소 3회 시도)

**선택:**
- 낮은 난이도 (0.3-0.5)
- 품질 점수 높은 문제 우선

### 2. 다음 주제 추천 (Priority: 8)

**조건:**
- 활성 학습 경로 존재
- 현재 개념 완료

**선택:**
- 경로 상 다음 개념
- 학생 레벨 맞춤 난이도

### 3. 연습 추천 (Priority: 7)

**조건:**
- 취약 개념 2개 이상
- 최소 3회 시도

**선택:**
- 현재 숙련도 기반 난이도 조절
- difficulty = 0.3 + (mastery × 0.4)

### 4. 도전 추천 (Priority: 5)

**조건:**
- 정확도 >= 75%
- 강한 개념 1개 이상

**선택:**
- 높은 난이도 (0.7-1.0)
- 심화 문제

## 📈 숙련도 계산 알고리즘

### Exponential Moving Average (EMA)

```
new_score = (0.7 × accuracy) + (0.3 × time_efficiency)
mastery_score = (0.3 × new_score) + (0.7 × old_mastery_score)
```

**요소:**
- **정확도 (70%)**: 정답률
- **시간 효율성 (30%)**: 예상 시간 대비 실제 소요 시간

**신뢰도:**
```
confidence = min(1.0, attempts / 3)
```
- 최소 3회 시도 후 100% 신뢰도

## 🔧 설치 방법

### 1. 데이터베이스 스키마 설치

```bash
mysql -u root -p moodle < vector-digest/database/recommendation-schema.sql
```

### 2. 파일 배치 확인

```
vector-digest/
├── recommendation/
│   ├── RecommendationAPI.php
│   ├── RecommendationEngine.php
│   ├── StudentProfileAnalyzer.php
│   └── README_RECOMMENDATION.md
├── frontend/
│   ├── css/
│   │   └── recommendation-style.css
│   ├── js/
│   │   └── recommendation-controller.js
│   └── smartphone-display.html (업데이트됨)
└── database/
    └── recommendation-schema.sql
```

### 3. UI 통합

기존 Vector Digest UI에 이미 통합되어 있습니다. **"추천" 탭**을 클릭하여 사용하세요.

## 🧪 테스트

### API 테스트

```bash
# Ping
curl "http://your-site.com/local/vector-digest/recommendation/RecommendationAPI.php?action=ping"

# 추천 조회
curl "http://your-site.com/local/vector-digest/recommendation/RecommendationAPI.php?action=get_recommendations&userid=1&count=3"

# 프로필 조회
curl "http://your-site.com/local/vector-digest/recommendation/RecommendationAPI.php?action=get_profile&userid=1"
```

### 테스트 데이터 생성

```sql
-- 샘플 학생 프로필
INSERT INTO mdl_recommend_student_profile
  (userid, learning_style, current_level, total_problems_attempted,
   total_problems_correct, accuracy_rate, timecreated, timemodified)
VALUES
  (1, 'balanced', 'beginner', 20, 15, 0.75, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 샘플 개념 숙련도
INSERT INTO mdl_recommend_concept_mastery
  (userid, concept, mastery_score, confidence_score, problems_attempted,
   problems_correct, timecreated, timemodified)
VALUES
  (1, 'basics', 0.80, 0.90, 10, 8, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (1, 'addition', 0.45, 0.60, 5, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- 샘플 학습 자료
INSERT INTO mdl_recommend_resource_meta
  (resource_type, resource_id, title, concepts, difficulty, estimated_time,
   quality_score, timecreated, timemodified)
VALUES
  ('question', 101, '벡터 기초 문제', '["basics"]', 0.3, 180, 0.85,
   UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  ('question', 102, '벡터 덧셈 연습', '["addition"]', 0.5, 240, 0.90,
   UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

## 🎯 사용 시나리오

### 시나리오 1: 신규 학생

1. 첫 문제 풀이 → 프로필 자동 생성
2. 3-5개 문제 풀이 후 → 학습 스타일 감지
3. 기본 학습 경로 자동 시작
4. 맞춤 추천 제공 시작

### 시나리오 2: 취약 개념 보강

1. 벡터 덧셈 문제에서 낮은 점수
2. 시스템이 숙련도 하락 감지
3. **복습 추천** 생성 (Priority: 10)
4. 학생이 복습 문제 풀이
5. 숙련도 향상 → 다음 단계로 진행

### 시나리오 3: 우수 학생

1. 지속적으로 높은 정확도 (>75%)
2. 여러 개념에서 숙련도 > 80%
3. **도전 추천** 생성
4. 심화 문제 제공
5. 레벨 상향 조정

## 📊 분석 쿼리

### 추천 수락률

```sql
SELECT
    recommendation_type,
    COUNT(*) as total,
    SUM(was_accepted) as accepted,
    ROUND(SUM(was_accepted) / COUNT(*) * 100, 2) as acceptance_rate
FROM mdl_recommend_history
GROUP BY recommendation_type;
```

### 학생별 진행도

```sql
SELECT
    sp.userid,
    sp.current_level,
    sp.accuracy_rate,
    COUNT(DISTINCT cm.concept) as concepts_studied,
    AVG(cm.mastery_score) as avg_mastery
FROM mdl_recommend_student_profile sp
LEFT JOIN mdl_recommend_concept_mastery cm ON sp.userid = cm.userid
GROUP BY sp.userid;
```

### 가장 효과적인 추천 타입

```sql
SELECT
    recommendation_type,
    AVG(result_score) as avg_score,
    AVG(completion_time) as avg_time,
    COUNT(*) as completed_count
FROM mdl_recommend_history
WHERE was_accepted = 1 AND time_completed IS NOT NULL
GROUP BY recommendation_type
ORDER BY avg_score DESC;
```

## 🚀 향후 확장

- [ ] Collaborative Filtering (비슷한 학생 기반 추천)
- [ ] Content-Based Filtering (문제 유사도 기반)
- [ ] A/B Testing 프레임워크
- [ ] ML 모델 통합 (TensorFlow.js)
- [ ] 실시간 난이도 조절
- [ ] 게이미피케이션 (배지, 레벨업)
- [ ] 학습 목표 설정 및 추적

## 🔐 보안 및 성능

### 보안
- PDO Prepared Statements (SQL Injection 방지)
- 사용자 입력 검증
- Moodle 세션 기반 인증

### 성능
- 인덱스 최적화
- 추천 캐싱 (필요시)
- Lazy Loading
- 백그라운드 프로필 업데이트

## 📞 문제 해결

### 추천이 생성되지 않음

1. 학습 자료 메타데이터 확인:
```sql
SELECT * FROM mdl_recommend_resource_meta LIMIT 5;
```

2. 학생 프로필 확인:
```sql
SELECT * FROM mdl_recommend_student_profile WHERE userid = ?;
```

3. 학습 경로 확인:
```sql
SELECT * FROM mdl_recommend_learning_path WHERE is_default = 1;
```

### 숙련도가 업데이트되지 않음

- `record_activity` API가 호출되는지 확인
- 개념(concepts) 배열이 올바르게 전달되는지 확인
- PHP 에러 로그 확인

## 📄 라이선스

MIT License

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Author**: KAIST Touch Math Academy
