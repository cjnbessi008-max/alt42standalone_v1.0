# 테스트 가이드 (Testing Guide)

## 개요

이 문서는 Best Thinking Moments 플러그인의 테스트 절차를 설명합니다.

## 테스트 환경 준비

### 1. 테스트 데이터 생성

#### 테스트 사용자 생성
```sql
-- 테스트 학생 계정 생성
INSERT INTO mdl_user (username, password, firstname, lastname, email, confirmed)
VALUES ('teststudent', MD5('Test123!'), 'Test', 'Student', 'test@example.com', 1);
```

#### 테스트 코스 생성
Moodle 관리자 페이지에서:
1. 사이트 관리 → 코스 → 새 코스 추가
2. 코스명: "Best Moments Test Course"
3. 코스 ID번호: "BMTEST01"

#### 테스트 활동 추가
- 퀴즈 2개
- 과제 2개
- 포럼 1개
- 레슨 1개

### 2. 샘플 데이터 삽입

```sql
-- 샘플 Quiz 시도 데이터
INSERT INTO mdl_quiz_attempts
(quiz, userid, attempt, sumgrades, timestart, timefinish, state)
VALUES
(1, 2, 1, 75.0, UNIX_TIMESTAMP() - 3600, UNIX_TIMESTAMP() - 3000, 'finished'),
(1, 2, 2, 85.0, UNIX_TIMESTAMP() - 2400, UNIX_TIMESTAMP() - 1800, 'finished'),
(1, 2, 3, 95.0, UNIX_TIMESTAMP() - 1200, UNIX_TIMESTAMP() - 600, 'finished');

-- 샘플 포럼 게시물
INSERT INTO mdl_forum_posts
(discussion, parent, userid, created, modified, subject, message)
VALUES
(1, 0, 2, UNIX_TIMESTAMP() - 7200, UNIX_TIMESTAMP() - 7200,
 '흥미로운 문제 해결 방법', '이 문제를 다른 방식으로 접근해보았습니다...');
```

## 단위 테스트 (Unit Tests)

### 1. Score Calculator 테스트

```php
// tests/score_calculator_test.php
<?php
namespace local_bestmoments;

class score_calculator_test extends \advanced_testcase {

    public function test_efficiency_score() {
        $this->resetAfterTest(true);

        $calculator = new \local_bestmoments\analyzer\score_calculator();

        // Test case 1: Perfect efficiency
        $activity = array(
            'attempts' => 1,
            'time_spent' => 300,
            'success_rate' => 1.0,
            'expected_time' => 300
        );
        $scores = $calculator->calculate_moment_score($activity);
        $this->assertGreaterThan(80, $scores['efficiency']);

        // Test case 2: Poor efficiency
        $activity = array(
            'attempts' => 5,
            'time_spent' => 1800,
            'success_rate' => 0.5,
            'expected_time' => 300
        );
        $scores = $calculator->calculate_moment_score($activity);
        $this->assertLessThan(50, $scores['efficiency']);
    }

    public function test_final_score_calculation() {
        $calculator = new \local_bestmoments\analyzer\score_calculator();

        $activity = array(
            'userid' => 2,
            'type' => 'quiz',
            'attempts' => 2,
            'time_spent' => 400,
            'success_rate' => 0.85,
            'expected_time' => 300,
            'grade' => 85
        );

        $scores = $calculator->calculate_moment_score($activity);

        $this->assertArrayHasKey('final_score', $scores);
        $this->assertGreaterThanOrEqual(0, $scores['final_score']);
        $this->assertLessThanOrEqual(100, $scores['final_score']);
    }
}
```

### 2. Activity Collector 테스트

```php
// tests/activity_collector_test.php
<?php
namespace local_bestmoments;

class activity_collector_test extends \advanced_testcase {

    public function test_collect_quiz_attempts() {
        global $DB;
        $this->resetAfterTest(true);

        // Create test data
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();

        $collector = new \local_bestmoments\collector\activity_collector();

        $timestart = strtotime('today');
        $timeend = strtotime('tomorrow');

        $activities = $collector->collect_course_activities(
            $course->id, $timestart, $timeend
        );

        $this->assertIsArray($activities);
    }
}
```

### 3. Moment Analyzer 테스트

```php
// tests/moment_analyzer_test.php
<?php
namespace local_bestmoments;

class moment_analyzer_test extends \advanced_testcase {

    public function test_analyze_course() {
        $this->resetAfterTest(true);

        $course = $this->getDataGenerator()->create_course();

        $analyzer = new \local_bestmoments\analyzer\moment_analyzer();

        $result = $analyzer->analyze_course($course->id);

        $this->assertArrayHasKey('moments_extracted', $result);
        $this->assertArrayHasKey('activities_analyzed', $result);
    }
}
```

## 통합 테스트 (Integration Tests)

### 1. 전체 분석 파이프라인 테스트

```bash
# CLI에서 실행
cd /path/to/moodle
php admin/cli/scheduled_task.php \
  --execute='\\local_bestmoments\\task\\analyze_moments'
```

**확인 사항**:
- 로그 테이블에 작업 기록 생성
- moments 테이블에 데이터 삽입
- scores 테이블에 점수 저장
- 오류 없이 완료

### 2. 데이터 수집 테스트

```sql
-- 오늘 수집된 활동 확인
SELECT activitytype, COUNT(*) as count
FROM mdl_local_bestmoments_scores
WHERE timecreated >= UNIX_TIMESTAMP(DATE(NOW()))
GROUP BY activitytype;

-- 예상 결과:
-- quiz: 10
-- assignment: 5
-- forum: 8
```

### 3. 점수 계산 검증

```sql
-- 점수 분포 확인
SELECT
    FLOOR(score / 10) * 10 as score_range,
    COUNT(*) as count
FROM mdl_local_bestmoments_moments
GROUP BY score_range
ORDER BY score_range;

-- 모든 점수가 0-100 범위인지 확인
SELECT COUNT(*) FROM mdl_local_bestmoments_moments
WHERE score < 0 OR score > 100;
-- 결과: 0 (범위 밖 데이터 없음)
```

## 기능 테스트 (Functional Tests)

### 1. UI 테스트

#### 대시보드 접근
1. 브라우저에서 `/local/bestmoments/` 접근
2. 대시보드 로드 확인
3. 통계 카드 표시 확인
4. Moments 카드 표시 확인

#### 뷰 전환
1. "Today" 탭 클릭 → 오늘 데이터만 표시
2. "This Week" 탭 클릭 → 주간 데이터 표시
3. "All Time" 탭 클릭 → 전체 데이터 표시

#### 점수 바 표시
- 각 moment 카드에 5개 점수 바 표시
- 점수에 따른 색상 변경 확인
  - < 50: 빨강
  - 50-70: 노랑
  - > 70: 초록

### 2. 권한 테스트

#### 교사 권한
```php
// 교사 계정으로 로그인
// 확인 사항:
// - 모든 학생의 moments 볼 수 있음
// - Export 버튼 표시
// - Trigger Analysis 버튼 표시
```

#### 학생 권한
```php
// 학생 계정으로 로그인
// 확인 사항:
// - 자신의 moments만 볼 수 있음
// - 다른 학생 데이터 접근 불가
// - Export 버튼 숨김
```

### 3. 성능 테스트

#### 대량 데이터 테스트

```sql
-- 1000개 샘플 데이터 생성
INSERT INTO mdl_local_bestmoments_moments
(userid, courseid, activitytype, activityid, momentdate,
 score, efficiency_score, creativity_score, improvement_score,
 persistence_score, collaboration_score, description,
 timecreated, timemodified)
SELECT
    2 + (n % 100) as userid,
    1 as courseid,
    CASE (n % 4)
        WHEN 0 THEN 'quiz'
        WHEN 1 THEN 'assignment'
        WHEN 2 THEN 'forum'
        ELSE 'lesson'
    END as activitytype,
    1 as activityid,
    UNIX_TIMESTAMP() - (n * 3600) as momentdate,
    60 + (n % 40) as score,
    60 + (n % 40) as efficiency_score,
    60 + ((n+10) % 40) as creativity_score,
    60 + ((n+20) % 40) as improvement_score,
    60 + ((n+30) % 40) as persistence_score,
    60 + ((n+40) % 40) as collaboration_score,
    CONCAT('Test moment ', n),
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
FROM
    (SELECT @row := @row + 1 as n FROM
     (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t1,
     (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t2,
     (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t3,
     (SELECT 0 UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t4,
     (SELECT @row := 0) t5
    ) numbers
LIMIT 1000;
```

**성능 목표**:
- 페이지 로드 시간: < 2초
- 쿼리 실행 시간: < 500ms
- 메모리 사용: < 64MB

#### 분석 성능 측정

```bash
# 시간 측정
time php admin/cli/scheduled_task.php \
  --execute='\\local_bestmoments\\task\\analyze_moments'
```

**목표 시간**:
- 100개 활동: < 10초
- 1000개 활동: < 60초
- 10000개 활동: < 300초

## 회귀 테스트 (Regression Tests)

### 체크리스트

- [ ] 모든 단위 테스트 통과
- [ ] 데이터베이스 스키마 변경 없음
- [ ] 기존 데이터 마이그레이션 성공
- [ ] UI 레이아웃 깨짐 없음
- [ ] 권한 설정 유지
- [ ] Scheduled task 정상 실행
- [ ] 다국어 지원 (영어/한국어) 정상

## 버그 리포팅

### 버그 발견 시 포함할 정보

1. **환경 정보**
   - Moodle 버전
   - PHP 버전
   - MySQL 버전
   - 브라우저 (UI 버그의 경우)

2. **재현 단계**
   ```
   1. 관리자로 로그인
   2. /local/bestmoments/ 접근
   3. "Today" 탭 클릭
   4. 오류 발생
   ```

3. **예상 결과**
   - 오늘의 moments 표시

4. **실제 결과**
   - 빈 페이지 또는 오류 메시지

5. **로그 및 오류 메시지**
   ```sql
   SELECT * FROM mdl_local_bestmoments_logs
   ORDER BY timecreated DESC LIMIT 1;
   ```

6. **스크린샷** (UI 버그의 경우)

## 자동화된 테스트 실행

### PHPUnit 설정

```bash
# PHPUnit 초기화
php admin/tool/phpunit/cli/init.php

# 플러그인 테스트 실행
vendor/bin/phpunit --testsuite local_bestmoments_testsuite

# 커버리지 리포트 생성
vendor/bin/phpunit --coverage-html coverage/ \
  local/bestmoments/tests/
```

### Behat 테스트 (UI 자동화)

```gherkin
# tests/behat/view_moments.feature
Feature: View best thinking moments
  As a student
  I want to view my best thinking moments
  So that I can track my learning progress

  Scenario: Student views own moments
    Given I log in as "student1"
    And I am on "/local/bestmoments/" page
    Then I should see "Best Moments Dashboard"
    And I should see my moments list
```

## 테스트 결과 문서화

### 테스트 리포트 양식

```markdown
# Test Report - [날짜]

## Test Summary
- Total Tests: 25
- Passed: 23
- Failed: 2
- Skipped: 0

## Failed Tests
1. test_efficiency_score_edge_case
   - Expected: 85
   - Actual: 82
   - Status: Under investigation

2. test_ui_responsive_mobile
   - Issue: Score bars overflow on mobile
   - Status: Fix in progress

## Performance Results
- Average page load: 1.2s
- Analysis time (1000 activities): 45s
- Memory usage: 52MB

## Recommendations
1. Add index on momentdate column
2. Optimize score calculation for mobile
3. Add caching for statistics
```

## 지속적 통합 (CI)

### GitHub Actions 예시

```yaml
# .github/workflows/moodle-plugin-ci.yml
name: Moodle Plugin CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['7.1', '7.2', '7.3']
        moodle: ['MOODLE_37_STABLE', 'MOODLE_38_STABLE']

    steps:
    - name: Check out code
      uses: actions/checkout@v2

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: ${{ matrix.php }}

    - name: Install Moodle
      run: |
        # Moodle 설치 스크립트

    - name: Run PHPUnit
      run: vendor/bin/phpunit

    - name: Run Behat
      run: vendor/bin/behat
```
