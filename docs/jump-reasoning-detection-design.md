# Jump Reasoning Detection System - 설계 문서

## 1. 개요

### 목적
Moodle 3.7 LMS와 연동하여 학습자의 **점프 추론(Jump Reasoning)** 습관을 자동으로 감지하는 시스템입니다. 점프 추론은 학습자가 순차적인 학습 단계를 건너뛰고 상위 단계로 직접 이동하는 패턴을 의미합니다.

### 기술 스택
- **LMS**: Moodle 3.7
- **언어**: PHP 7.1.9
- **데이터베이스**: MySQL 5.7
- **분석**: Python 3.7+ (선택적, 고급 분석용)

---

## 2. 점프 추론 감지 알고리즘

### 2.1 감지 유형

#### 타입 1: 순차적 건너뛰기 (Sequential Jump)
```
정상 경로: Module 1 → Module 2 → Module 3 → Module 4
점프 패턴: Module 1 → Module 4 (2, 3 건너뜀)
```

#### 타입 2: 선수 학습 누락 (Prerequisite Skip)
```
선수 과정: [기초 대수학] 필수
점프 패턴: 선수 과정 미완료 상태에서 [미적분학] 시작
```

#### 타입 3: 시간 비정상 패턴 (Time Anomaly)
```
정상 시간: 각 모듈당 평균 2시간 학습
점프 패턴: 10분만에 모듈 완료 (내용 건너뛰기 의심)
```

#### 타입 4: 퀴즈/과제 회피 (Assessment Evasion)
```
정상 경로: 강의 → 퀴즈 → 다음 강의
점프 패턴: 강의 → (퀴즈 건너뜀) → 다음 강의
```

### 2.2 감지 점수 계산

각 학습자에게 **Jump Score**를 부여합니다:

```
Jump Score = (Sequential_Jumps × 2) +
             (Prerequisite_Skips × 3) +
             (Time_Anomalies × 1.5) +
             (Assessment_Evasions × 2.5)

위험도:
- 0-5점: 정상 (Normal)
- 6-10점: 주의 (Caution)
- 11-20점: 경고 (Warning)
- 21점 이상: 위험 (Critical)
```

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Moodle 3.7 LMS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Courses  │  │ Modules  │  │ Students │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        │   Event Tracking (Moodle Events API)
        │             │             │
┌───────▼─────────────▼─────────────▼───────────────────┐
│         Jump Detection Plugin (local_jumpdetect)       │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Event Listeners (Observer)                      │ │
│  │  - course_module_viewed                          │ │
│  │  - user_enrolment_created                        │ │
│  │  - quiz_attempt_started                          │ │
│  └──────────────┬───────────────────────────────────┘ │
│                 │                                      │
│  ┌──────────────▼───────────────────────────────────┐ │
│  │  Jump Detection Engine                           │ │
│  │  - Sequential Analyzer                           │ │
│  │  - Prerequisite Checker                          │ │
│  │  - Time Pattern Analyzer                         │ │
│  │  - Assessment Tracker                            │ │
│  └──────────────┬───────────────────────────────────┘ │
│                 │                                      │
│  ┌──────────────▼───────────────────────────────────┐ │
│  │  Data Storage (MySQL)                            │ │
│  │  - mdl_jumpdetect_tracking                       │ │
│  │  - mdl_jumpdetect_patterns                       │ │
│  │  - mdl_jumpdetect_alerts                         │ │
│  └──────────────┬───────────────────────────────────┘ │
└─────────────────┼───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Teacher Dashboard                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  - 학생별 점프 점수                          │   │
│  │  - 실시간 알림                               │   │
│  │  - 패턴 시각화 그래프                        │   │
│  │  - 권장 개입 조치                            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 4. 데이터베이스 스키마

### 4.1 학습 추적 테이블
```sql
CREATE TABLE mdl_jumpdetect_tracking (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    moduleid BIGINT(10) UNSIGNED NOT NULL,
    eventname VARCHAR(255) NOT NULL,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    sessionid VARCHAR(255),
    INDEX idx_user_course (userid, courseid),
    INDEX idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.2 점프 패턴 테이블
```sql
CREATE TABLE mdl_jumpdetect_patterns (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    jump_type ENUM('sequential', 'prerequisite', 'time_anomaly', 'assessment_evasion'),
    jump_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    skipped_modules TEXT,
    detected_at BIGINT(10) UNSIGNED NOT NULL,
    severity ENUM('normal', 'caution', 'warning', 'critical'),
    INDEX idx_user_course_severity (userid, courseid, severity),
    INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3 알림 테이블
```sql
CREATE TABLE mdl_jumpdetect_alerts (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    teacherid BIGINT(10) UNSIGNED NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    INDEX idx_teacher_read (teacherid, is_read),
    INDEX idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.4 코스 경로 설정 테이블
```sql
CREATE TABLE mdl_jumpdetect_course_paths (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    module_sequence TEXT NOT NULL,
    prerequisites TEXT,
    min_time_per_module INT(10) UNSIGNED,
    max_time_per_module INT(10) UNSIGNED,
    require_assessment TINYINT(1) DEFAULT 1,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    UNIQUE KEY idx_courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. 핵심 알고리즘 구현

### 5.1 순차적 건너뛰기 감지

```php
/**
 * 순차적 모듈 건너뛰기 감지
 *
 * @param int $userid 사용자 ID
 * @param int $courseid 코스 ID
 * @param int $current_moduleid 현재 접근한 모듈 ID
 * @return array 감지 결과
 */
function detect_sequential_jump($userid, $courseid, $current_moduleid) {
    global $DB;

    // 1. 코스의 정상 모듈 순서 가져오기
    $expected_sequence = get_course_module_sequence($courseid);

    // 2. 사용자의 실제 학습 순서 가져오기
    $user_sequence = $DB->get_records('jumpdetect_tracking',
        ['userid' => $userid, 'courseid' => $courseid],
        'timecreated ASC',
        'moduleid'
    );

    // 3. 현재 모듈 위치 찾기
    $current_position = array_search($current_moduleid, $expected_sequence);

    // 4. 건너뛴 모듈 찾기
    $skipped_modules = [];
    $last_completed_position = get_last_completed_position($user_sequence, $expected_sequence);

    if ($current_position - $last_completed_position > 1) {
        for ($i = $last_completed_position + 1; $i < $current_position; $i++) {
            $skipped_modules[] = $expected_sequence[$i];
        }
    }

    // 5. 점프 점수 계산
    $jump_score = count($skipped_modules) * 2;

    return [
        'detected' => !empty($skipped_modules),
        'skipped_modules' => $skipped_modules,
        'jump_score' => $jump_score,
        'severity' => calculate_severity($jump_score)
    ];
}
```

### 5.2 시간 비정상 패턴 감지

```php
/**
 * 학습 시간 비정상 패턴 감지
 *
 * @param int $userid 사용자 ID
 * @param int $moduleid 모듈 ID
 * @param int $time_spent 소요 시간 (초)
 * @return array 감지 결과
 */
function detect_time_anomaly($userid, $moduleid, $time_spent) {
    global $DB;

    // 1. 해당 모듈의 평균 학습 시간 계산
    $sql = "SELECT AVG(timemodified - timecreated) as avg_time,
                   STDDEV(timemodified - timecreated) as stddev_time
            FROM {jumpdetect_tracking}
            WHERE moduleid = :moduleid
            AND userid != :userid";

    $stats = $DB->get_record_sql($sql, [
        'moduleid' => $moduleid,
        'userid' => $userid
    ]);

    $avg_time = $stats->avg_time ?? 3600; // 기본값: 1시간
    $stddev_time = $stats->stddev_time ?? 600; // 기본값: 10분

    // 2. Z-Score 계산 (표준점수)
    $z_score = ($time_spent - $avg_time) / $stddev_time;

    // 3. 비정상 판단 (Z-Score < -2: 너무 빠름)
    $is_anomaly = $z_score < -2;

    // 4. 점프 점수 계산
    $jump_score = $is_anomaly ? abs($z_score) * 1.5 : 0;

    return [
        'detected' => $is_anomaly,
        'time_spent' => $time_spent,
        'avg_time' => $avg_time,
        'z_score' => $z_score,
        'jump_score' => $jump_score,
        'severity' => calculate_severity($jump_score)
    ];
}
```

### 5.3 선수 학습 누락 감지

```php
/**
 * 선수 학습 누락 감지
 *
 * @param int $userid 사용자 ID
 * @param int $courseid 코스 ID
 * @param int $moduleid 모듈 ID
 * @return array 감지 결과
 */
function detect_prerequisite_skip($userid, $courseid, $moduleid) {
    global $DB;

    // 1. 현재 모듈의 선수 과정 가져오기
    $prerequisites = get_module_prerequisites($moduleid);

    if (empty($prerequisites)) {
        return ['detected' => false, 'jump_score' => 0];
    }

    // 2. 사용자의 선수 과정 완료 여부 확인
    $missing_prerequisites = [];

    foreach ($prerequisites as $prereq_id) {
        $completed = $DB->record_exists('jumpdetect_tracking', [
            'userid' => $userid,
            'moduleid' => $prereq_id,
            'eventname' => 'course_module_completion'
        ]);

        if (!$completed) {
            $missing_prerequisites[] = $prereq_id;
        }
    }

    // 3. 점프 점수 계산
    $jump_score = count($missing_prerequisites) * 3;

    return [
        'detected' => !empty($missing_prerequisites),
        'missing_prerequisites' => $missing_prerequisites,
        'jump_score' => $jump_score,
        'severity' => calculate_severity($jump_score)
    ];
}
```

---

## 6. Moodle 이벤트 통합

### 6.1 이벤트 리스너 등록

`db/events.php`:
```php
<?php
defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\core\event\course_module_viewed',
        'callback' => 'local_jumpdetect_observer::module_viewed',
    ],
    [
        'eventname' => '\core\event\course_module_completion_updated',
        'callback' => 'local_jumpdetect_observer::module_completed',
    ],
    [
        'eventname' => '\mod_quiz\event\attempt_started',
        'callback' => 'local_jumpdetect_observer::quiz_attempted',
    ],
    [
        'eventname' => '\core\event\user_enrolment_created',
        'callback' => 'local_jumpdetect_observer::user_enrolled',
    ],
];
```

### 6.2 이벤트 처리기

`classes/observer.php`:
```php
<?php
namespace local_jumpdetect;

defined('MOODLE_INTERNAL') || die();

class observer {

    /**
     * 모듈 조회 이벤트 처리
     */
    public static function module_viewed(\core\event\course_module_viewed $event) {
        global $DB;

        $data = $event->get_data();
        $userid = $data['userid'];
        $courseid = $data['courseid'];
        $moduleid = $data['contextinstanceid'];

        // 1. 이벤트 기록
        $tracking = new \stdClass();
        $tracking->userid = $userid;
        $tracking->courseid = $courseid;
        $tracking->moduleid = $moduleid;
        $tracking->eventname = 'course_module_viewed';
        $tracking->timecreated = time();
        $tracking->timemodified = time();
        $tracking->sessionid = session_id();

        $DB->insert_record('jumpdetect_tracking', $tracking);

        // 2. 점프 패턴 감지 실행
        $detector = new \local_jumpdetect\detector();
        $result = $detector->analyze_user_behavior($userid, $courseid, $moduleid);

        // 3. 점프 감지 시 알림 생성
        if ($result['detected']) {
            self::create_alert($userid, $courseid, $result);
        }
    }

    /**
     * 알림 생성
     */
    private static function create_alert($userid, $courseid, $result) {
        global $DB;

        // 코스 교사 가져오기
        $teachers = get_enrolled_users(
            \context_course::instance($courseid),
            'mod/course:update'
        );

        foreach ($teachers as $teacher) {
            $alert = new \stdClass();
            $alert->userid = $userid;
            $alert->courseid = $courseid;
            $alert->teacherid = $teacher->id;
            $alert->alert_type = $result['jump_type'];
            $alert->message = generate_alert_message($result);
            $alert->is_read = 0;
            $alert->timecreated = time();

            $DB->insert_record('jumpdetect_alerts', $alert);

            // 실시간 알림 전송 (선택사항)
            \core\notification::warning($alert->message);
        }
    }
}
```

---

## 7. 교사 대시보드

### 7.1 주요 기능

1. **실시간 알림**
   - 학생이 점프 패턴을 보일 때 즉시 알림
   - 심각도별 색상 구분 (초록/노랑/주황/빨강)

2. **학생별 점프 점수 대시보드**
   - 각 학생의 누적 점프 점수
   - 최근 7일간 추세 그래프

3. **패턴 분석 차트**
   - 가장 많이 건너뛴 모듈 TOP 5
   - 시간대별 점프 패턴

4. **권장 조치**
   - 개입이 필요한 학생 우선순위 목록
   - 자동 생성된 개입 메시지 템플릿

### 7.2 UI 예시

```
┌─────────────────────────────────────────────────────────┐
│  점프 추론 감지 대시보드                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔴 위험 (3명)  🟠 경고 (5명)  🟡 주의 (12명)  🟢 정상  │
│                                                          │
│  최근 알림:                                              │
│  ┌────────────────────────────────────────────────┐    │
│  │ [위험] 김철수 - 선수 과정 3개 미완료 (5분 전)  │    │
│  │ [경고] 이영희 - 모듈 2-5 건너뛰고 6번 진입     │    │
│  │ [주의] 박민수 - 10분만에 모듈 완료 (의심)      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  학생별 점프 점수 (상위 10명):                           │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. 김철수    [████████████████░░] 18.5점       │    │
│  │ 2. 이영희    [████████████░░░░░░] 12.0점       │    │
│  │ 3. 박민수    [████████░░░░░░░░░░]  8.5점       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [자세히 보기] [설정] [보고서 다운로드]                  │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 구현 단계

### Phase 1: 기본 추적 (Week 1-2)
- [ ] MySQL 스키마 생성
- [ ] Moodle 이벤트 리스너 구현
- [ ] 기본 데이터 수집 로직

### Phase 2: 감지 알고리즘 (Week 3-4)
- [ ] 순차적 건너뛰기 감지
- [ ] 시간 비정상 패턴 감지
- [ ] 선수 학습 누락 감지
- [ ] 점프 점수 계산

### Phase 3: 대시보드 (Week 5-6)
- [ ] 교사 대시보드 UI
- [ ] 실시간 알림 시스템
- [ ] 보고서 생성 기능

### Phase 4: 테스트 & 최적화 (Week 7-8)
- [ ] 단위 테스트
- [ ] 성능 최적화
- [ ] 사용자 피드백 반영

---

## 9. 설치 및 설정

### 9.1 시스템 요구사항
- Moodle 3.7 이상
- PHP 7.1.9 이상
- MySQL 5.7 이상
- 디스크 공간: 최소 100MB

### 9.2 설치 절차
1. 플러그인 다운로드
2. `/local/jumpdetect/` 디렉토리에 압축 해제
3. Moodle 관리자 페이지에서 플러그인 설치
4. 데이터베이스 자동 생성 확인
5. 설정 페이지에서 감지 임계값 조정

### 9.3 설정 옵션
```php
// config.php
$CFG->jumpdetect_sequential_threshold = 2;  // 건너뛴 모듈 수
$CFG->jumpdetect_time_threshold = -2;       // Z-Score 임계값
$CFG->jumpdetect_alert_severity = 'warning'; // 알림 최소 심각도
```

---

## 10. 향후 개선 사항

1. **머신러닝 통합**
   - 학습 패턴 예측 모델
   - 개인화된 학습 경로 추천

2. **AI 분석**
   - Claude API를 활용한 자연어 리포트
   - 자동 개입 메시지 생성

3. **실시간 개입**
   - 학생이 점프하려 할 때 자동 경고
   - 선수 학습 권장 팝업

4. **통계 분석**
   - 코스별 점프 경향 분석
   - 개선 효과 측정 리포트

---

## 문의
- 개발자: AI Education System Team
- 프로젝트: alt42standalone_v1.0
- 문서 버전: 1.0
- 마지막 업데이트: 2025-11-18
