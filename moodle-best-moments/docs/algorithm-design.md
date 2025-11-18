# 사고 순간 추출 알고리즘 설계

## 개요
학생들의 학습 활동에서 "가장 잘한 사고 순간"을 자동으로 식별하고 추출하는 알고리즘입니다.

## 핵심 개념

### 사고 순간(Thinking Moment)이란?
학생이 문제를 해결하거나 학습 활동을 수행하면서 다음과 같은 특징을 보이는 순간:
- **돌파구 발견**: 여러 시도 끝에 정답에 도달
- **창의적 접근**: 독특하거나 효율적인 문제 해결 방법
- **지속적 개선**: 이전 시도 대비 눈에 띄는 향상
- **협업 기여**: 동료 학습자에게 도움이 되는 기여
- **끈기 있는 도전**: 어려운 문제에 대한 지속적 시도

## 5가지 평가 기준

### 1. 효율성 점수 (Efficiency Score) - 가중치 0.25

#### 정의
최소한의 시도와 시간으로 문제를 해결하는 능력

#### 계산 공식
```
efficiency_score = (
    (1 - (attempts - 1) / max_attempts) * 0.5 +
    (1 - time_spent / expected_time) * 0.3 +
    (success_rate) * 0.2
) * 100
```

#### 파라미터
- `attempts`: 실제 시도 횟수
- `max_attempts`: 동일 문제에 대한 최대 허용 시도 (기본값: 5)
- `time_spent`: 소요 시간 (초)
- `expected_time`: 예상 소요 시간 (문제 난이도 기반)
- `success_rate`: 정답률 (0.0 ~ 1.0)

#### 예시
```
학생 A: 1회 시도, 60초 소요, 100% 정답 → 95점
학생 B: 3회 시도, 180초 소요, 80% 정답 → 65점
```

### 2. 창의성 점수 (Creativity Score) - 가중치 0.20

#### 정의
독특하거나 혁신적인 문제 해결 접근 방법

#### 계산 공식
```
creativity_score = (
    unique_approach_bonus * 0.4 +
    partial_credit_pattern * 0.3 +
    alternative_solution * 0.3
) * 100
```

#### 지표
- **unique_approach_bonus**: 다른 학생과 다른 접근 (0.0 ~ 1.0)
  - 해당 문제에서 이 접근을 사용한 학생 비율의 역수
- **partial_credit_pattern**: 부분 점수 획득 패턴
  - 여러 단계를 거쳐 점진적으로 정답에 도달
- **alternative_solution**: 대안적 해결 방법 시도
  - 같은 문제를 다른 방식으로 다시 풀기

#### 측정 방법
1. Quiz: 응답 내용의 다양성, 풀이 과정
2. Assignment: 제출물의 독창성 (텍스트 유사도 역수)
3. Forum: 새로운 관점 제시, 창의적 질문

### 3. 개선도 점수 (Improvement Score) - 가중치 0.25

#### 정의
이전 시도 대비 향상된 정도

#### 계산 공식
```
improvement_score = (
    grade_improvement * 0.5 +
    speed_improvement * 0.3 +
    consistency_improvement * 0.2
) * 100
```

#### 세부 계산
```
grade_improvement = (current_grade - previous_average) / previous_average
speed_improvement = (previous_time - current_time) / previous_time
consistency_improvement = 1 - std_deviation(recent_grades)
```

#### 시계열 분석
- 최근 5회 시도 평균과 비교
- 이전 동일 유형 문제와 비교
- 같은 난이도 문제와 비교

### 4. 지속성 점수 (Persistence Score) - 가중치 0.15

#### 정의
어려운 문제에 대한 포기하지 않고 도전하는 태도

#### 계산 공식
```
persistence_score = (
    retry_count_normalized * 0.4 +
    time_investment * 0.3 +
    difficulty_engagement * 0.3
) * 100
```

#### 파라미터
- `retry_count_normalized`: 재시도 횟수 (너무 많으면 감점)
  ```
  optimal_retries = 3~5
  if retries < optimal_retries:
      score = retries / optimal_retries
  else:
      score = max(0, 1 - (retries - optimal_retries) / 10)
  ```
- `time_investment`: 문제에 투자한 총 시간
- `difficulty_engagement`: 어려운 문제 선택 비율

#### 특별 보너스
- 평균 이상 난이도 문제 해결 시 +20점
- 마지막 시도에서 성공 시 +10점

### 5. 협업 점수 (Collaboration Score) - 가중치 0.15

#### 정의
포럼, 그룹 활동 등에서 다른 학생들에게 기여한 정도

#### 계산 공식
```
collaboration_score = (
    helpful_replies * 0.4 +
    discussion_initiation * 0.3 +
    peer_engagement * 0.3
) * 100
```

#### 측정 항목
- **helpful_replies**: 도움이 되는 답변 수
  - 다른 학생의 '좋아요' 또는 교사의 추천
  - 답변 길이 및 품질
- **discussion_initiation**: 의미 있는 토론 시작
  - 질문 게시
  - 새로운 주제 제안
- **peer_engagement**: 동료 학습자 참여 유도
  - 답변에 대한 응답 수
  - 토론 지속 시간

## 종합 점수 계산

### 최종 점수 (Final Score)
```
final_score =
    efficiency_score * 0.25 +
    creativity_score * 0.20 +
    improvement_score * 0.25 +
    persistence_score * 0.15 +
    collaboration_score * 0.15
```

### 정규화 (Normalization)
```
normalized_score = (final_score - min_score) / (max_score - min_score) * 100
```

### 임계값 (Threshold)
- 최소 점수: 60점 (설정 가능)
- 추천 점수: 75점 이상
- 우수 점수: 85점 이상

## 추출 프로세스

### 단계 1: 데이터 수집 (00:00 ~ 23:59)
```
1. 모든 학생의 오늘 활동 로그 수집
2. 활동 유형별 분류
   - Quiz attempts
   - Assignment submissions
   - Forum posts
   - Lesson attempts
3. 기본 유효성 검증
```

### 단계 2: 점수 계산 (23:00)
```
FOR EACH student:
    FOR EACH activity:
        1. 5가지 기준별 점수 계산
        2. 가중 평균으로 최종 점수 산출
        3. 컨텍스트 정보 저장
        4. local_bestmoments_scores 테이블에 저장
```

### 단계 3: 순위 결정
```
1. 임계값(60점) 이상 활동 필터링
2. 최종 점수 기준 내림차순 정렬
3. 상위 N개 선택 (기본: 10개)
4. 중복 제거 (같은 학생의 유사 활동)
```

### 단계 4: 결과 저장
```
FOR EACH selected moment:
    1. local_bestmoments_moments 테이블에 저장
    2. 상세 설명 생성
    3. 컨텍스트 데이터 JSON 저장
    4. is_featured 플래그 설정 (상위 3개)
```

### 단계 5: 알림 발송 (선택적)
```
IF notification_enabled:
    1. 학생에게 알림: "당신의 사고 순간이 선정되었습니다!"
    2. 교사에게 리포트: "오늘의 우수 사고 순간"
    3. 대시보드 업데이트
```

## 활동 유형별 특화 알고리즘

### Quiz (퀴즈)
```php
function analyze_quiz_moment($attempt) {
    // 효율성: 시도 횟수, 소요 시간
    $efficiency = calculate_quiz_efficiency($attempt);

    // 창의성: 문제 풀이 접근 방식
    $creativity = analyze_answer_patterns($attempt);

    // 개선도: 이전 시도 대비 점수 향상
    $improvement = compare_with_previous_attempts($attempt);

    // 지속성: 어려운 문제 재시도
    $persistence = analyze_retry_patterns($attempt);

    // 협업: 0 (개인 활동)
    $collaboration = 0;

    return weighted_average([
        $efficiency, $creativity, $improvement,
        $persistence, $collaboration
    ]);
}
```

### Assignment (과제)
```php
function analyze_assignment_moment($submission) {
    // 효율성: 제출 시간, 수정 횟수
    $efficiency = calculate_submission_efficiency($submission);

    // 창의성: 내용의 독창성
    $creativity = analyze_content_uniqueness($submission);

    // 개선도: 이전 제출 대비 향상
    $improvement = compare_submissions($submission);

    // 지속성: 수정 및 개선 노력
    $persistence = count_revisions($submission);

    // 협업: 피어 리뷰 참여
    $collaboration = analyze_peer_review($submission);

    return weighted_average([...]);
}
```

### Forum (포럼)
```php
function analyze_forum_moment($post) {
    // 효율성: 명확하고 간결한 답변
    $efficiency = analyze_response_quality($post);

    // 창의성: 새로운 관점 제시
    $creativity = detect_novel_insights($post);

    // 개선도: 이전 게시물 대비 품질
    $improvement = compare_post_quality($post);

    // 지속성: 지속적인 토론 참여
    $persistence = count_follow_ups($post);

    // 협업: 다른 학생 도움, 토론 기여
    $collaboration = measure_collaboration($post);

    return weighted_average([...]);
}
```

## 성능 최적화

### 배치 처리
```
- 학생별로 순차 처리 대신 배치로 처리
- 100명씩 그룹화하여 쿼리
- 병렬 처리 가능한 부분 분리
```

### 캐싱 전략
```
- 학생별 이전 평균 점수 캐시 (24시간)
- 문제별 난이도 캐시 (7일)
- 활동 유형별 통계 캐시 (1시간)
```

### 인덱스 활용
```sql
-- 자주 사용되는 조회에 대한 인덱스
CREATE INDEX idx_user_time ON mdl_logstore_standard_log(userid, timecreated);
CREATE INDEX idx_quiz_user_finish ON mdl_quiz_attempts(userid, timefinish);
```

## 예외 처리

### Edge Cases
1. **데이터 없음**: 활동이 없는 학생 → 건너뛰기
2. **이상치**: 비정상적으로 높거나 낮은 점수 → 검증 후 처리
3. **중복 활동**: 같은 활동 여러 번 → 최신 것만 사용
4. **삭제된 데이터**: 참조하는 데이터 삭제됨 → 로그 기록 후 건너뛰기

### 오류 복구
```
1. 트랜잭션 사용으로 원자성 보장
2. 실패 시 롤백 및 재시도 (최대 3회)
3. 오류 로그 상세 기록
4. 관리자에게 알림
```

## 검증 및 테스트

### 단위 테스트
- 각 점수 계산 함수 개별 테스트
- 경계값 테스트 (0, 100, NULL)
- 가중 평균 계산 검증

### 통합 테스트
- 전체 파이프라인 실행
- 샘플 데이터 사용
- 예상 결과와 비교

### 성능 테스트
- 1000명 학생 데이터 처리 시간
- 메모리 사용량 모니터링
- 데이터베이스 쿼리 최적화

## 향후 개선 사항

1. **머신러닝 통합**: 과거 데이터 학습으로 정확도 향상
2. **실시간 분석**: 하루 종료 대신 실시간 추출
3. **개인화된 가중치**: 학생별 맞춤 평가 기준
4. **시각화**: 점수 변화 그래프, 인사이트 제공
5. **자동 피드백**: AI 기반 개선 제안
