# LMS 사용 알림 시스템 (LMS Usage Notification System)

## 개요

Moodle 3.7 LMS와 연동하여 학습자의 비효율적인 학습 패턴(지나친 몰입, 반복적 오류)을 감지하고 알림을 제공하는 시스템입니다.

## 기술 스택

- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **JavaScript**: ES6+ (프론트엔드 알림)

## 주요 기능

### 1. 학습 패턴 모니터링

#### 감지 대상
- **과도한 시간 소비**: 단일 문제에 설정된 임계값 이상 시간 소비
- **반복적 오류**: 동일한 유형의 문제에서 반복적인 실패
- **비정상적인 시도 횟수**: 평균 시도 횟수를 크게 초과하는 경우
- **학습 진행 정체**: 일정 기간 동안 진도가 없는 경우

#### 임계값 설정
```php
// 기본 임계값 (관리자가 조정 가능)
define('INEFFICIENT_PATTERN_TIME_THRESHOLD', 1800);      // 30분
define('INEFFICIENT_PATTERN_ATTEMPT_THRESHOLD', 10);     // 10회 시도
define('INEFFICIENT_PATTERN_ERROR_RATE_THRESHOLD', 0.8); // 80% 오류율
define('INEFFICIENT_PATTERN_STAGNATION_DAYS', 3);        // 3일 정체
```

### 2. 알림 시스템

#### 알림 유형
- **실시간 알림**: 브라우저 내 팝업 (JavaScript)
- **이메일 알림**: 학습자 및 교수자에게 이메일 전송
- **대시보드 알림**: Moodle 대시보드에 알림 표시
- **SMS 알림**: (선택적) 긴급한 경우

#### 알림 수신자
- **학습자**: 본인의 학습 패턴에 대한 경고
- **교수자**: 담당 학생의 비효율적 학습 패턴 알림
- **시스템 관리자**: 시스템 전체 통계 및 이상 패턴

### 3. 데이터 수집 및 분석

#### 추적 데이터
- 세션 시작/종료 시간
- 문제별 시도 횟수
- 정답/오답 기록
- 힌트 사용 횟수
- 페이지 이동 패턴

#### 분석 알고리즘
1. **시간 기반 분석**: 문제당 소요 시간 계산
2. **성공률 분석**: 시도 대비 성공률 계산
3. **패턴 인식**: 반복되는 오류 패턴 식별
4. **비교 분석**: 동일 과목 다른 학습자와 비교

## 데이터베이스 스키마

### 테이블 구조

#### 1. `mdl_lms_usage_tracking` - 학습 활동 추적
```sql
CREATE TABLE mdl_lms_usage_tracking (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    moduleid BIGINT(10) UNSIGNED NOT NULL,
    activitytype VARCHAR(50) NOT NULL,
    sessionid VARCHAR(100) NOT NULL,
    starttime BIGINT(10) UNSIGNED NOT NULL,
    endtime BIGINT(10) UNSIGNED DEFAULT NULL,
    attempts INT(5) UNSIGNED DEFAULT 0,
    correct_answers INT(5) UNSIGNED DEFAULT 0,
    incorrect_answers INT(5) UNSIGNED DEFAULT 0,
    hints_used INT(5) UNSIGNED DEFAULT 0,
    time_spent INT(10) UNSIGNED DEFAULT 0,
    metadata TEXT,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    INDEX idx_userid (userid),
    INDEX idx_courseid (courseid),
    INDEX idx_sessionid (sessionid),
    INDEX idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 2. `mdl_lms_inefficiency_alerts` - 비효율 패턴 알림
```sql
CREATE TABLE mdl_lms_inefficiency_alerts (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    moduleid BIGINT(10) UNSIGNED DEFAULT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT,
    metrics TEXT,
    is_acknowledged TINYINT(1) DEFAULT 0,
    acknowledged_by BIGINT(10) UNSIGNED DEFAULT NULL,
    acknowledged_time BIGINT(10) UNSIGNED DEFAULT NULL,
    notification_sent TINYINT(1) DEFAULT 0,
    notification_time BIGINT(10) UNSIGNED DEFAULT NULL,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    INDEX idx_userid (userid),
    INDEX idx_courseid (courseid),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_is_acknowledged (is_acknowledged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3. `mdl_lms_notification_settings` - 알림 설정
```sql
CREATE TABLE mdl_lms_notification_settings (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    threshold_time INT(10) UNSIGNED DEFAULT 1800,
    threshold_attempts INT(5) UNSIGNED DEFAULT 10,
    threshold_error_rate DECIMAL(3,2) DEFAULT 0.80,
    email_enabled TINYINT(1) DEFAULT 1,
    browser_enabled TINYINT(1) DEFAULT 1,
    sms_enabled TINYINT(1) DEFAULT 0,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    UNIQUE KEY unique_user_type (userid, notification_type),
    INDEX idx_userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4. `mdl_lms_learning_analytics` - 학습 분석 통계
```sql
CREATE TABLE mdl_lms_learning_analytics (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    date DATE NOT NULL,
    total_time_spent INT(10) UNSIGNED DEFAULT 0,
    total_attempts INT(10) UNSIGNED DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    inefficiency_score DECIMAL(5,2) DEFAULT 0.00,
    activities_completed INT(10) UNSIGNED DEFAULT 0,
    alerts_triggered INT(5) UNSIGNED DEFAULT 0,
    metadata TEXT,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,
    UNIQUE KEY unique_user_course_date (userid, courseid, date),
    INDEX idx_userid (userid),
    INDEX idx_courseid (courseid),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API 엔드포인트

### 1. 학습 활동 추적 API

#### POST `/local/lms_notification/api/track_activity.php`
학습자의 활동을 추적합니다.

**Request Body:**
```json
{
    "userid": 123,
    "courseid": 456,
    "moduleid": 789,
    "activitytype": "quiz_attempt",
    "sessionid": "abc123xyz",
    "attempts": 1,
    "correct": 0,
    "incorrect": 1,
    "time_spent": 180,
    "metadata": {
        "question_id": 101,
        "answer_given": "B",
        "correct_answer": "C"
    }
}
```

**Response:**
```json
{
    "success": true,
    "tracking_id": 9876,
    "alert_triggered": true,
    "alert_details": {
        "type": "excessive_time",
        "message": "이 문제에 30분 이상 소요되었습니다. 도움이 필요하신가요?"
    }
}
```

### 2. 알림 조회 API

#### GET `/local/lms_notification/api/get_alerts.php`
사용자의 알림 목록을 조회합니다.

**Query Parameters:**
- `userid`: 사용자 ID
- `courseid`: 코스 ID (선택)
- `limit`: 조회 개수 (기본: 20)
- `offset`: 오프셋 (기본: 0)

**Response:**
```json
{
    "success": true,
    "alerts": [
        {
            "id": 1,
            "alert_type": "excessive_attempts",
            "severity": "high",
            "description": "퀴즈 문제 #5에서 10회 이상 시도했습니다.",
            "metrics": {
                "attempts": 12,
                "success_rate": 0.08
            },
            "timecreated": 1699999999
        }
    ],
    "total_count": 5
}
```

### 3. 알림 확인 API

#### POST `/local/lms_notification/api/acknowledge_alert.php`
알림을 확인 처리합니다.

**Request Body:**
```json
{
    "alert_id": 1,
    "userid": 123
}
```

**Response:**
```json
{
    "success": true,
    "message": "알림이 확인 처리되었습니다."
}
```

### 4. 통계 조회 API

#### GET `/local/lms_notification/api/get_analytics.php`
학습 통계를 조회합니다.

**Query Parameters:**
- `userid`: 사용자 ID
- `courseid`: 코스 ID
- `start_date`: 시작 날짜 (YYYY-MM-DD)
- `end_date`: 종료 날짜 (YYYY-MM-DD)

**Response:**
```json
{
    "success": true,
    "analytics": {
        "total_time_spent": 18000,
        "total_attempts": 150,
        "success_rate": 0.75,
        "inefficiency_score": 0.35,
        "activities_completed": 25,
        "alerts_triggered": 3,
        "daily_breakdown": [
            {
                "date": "2024-01-15",
                "time_spent": 3600,
                "success_rate": 0.80
            }
        ]
    }
}
```

## 비효율 패턴 감지 알고리즘

### 1. 시간 기반 감지
```php
function detect_time_inefficiency($userid, $moduleid, $time_spent) {
    $threshold = get_config('lms_notification', 'time_threshold');
    $avg_time = get_average_time($moduleid);

    if ($time_spent > $threshold || $time_spent > ($avg_time * 2)) {
        trigger_alert([
            'userid' => $userid,
            'alert_type' => 'excessive_time',
            'severity' => 'medium',
            'metrics' => [
                'time_spent' => $time_spent,
                'average_time' => $avg_time,
                'threshold' => $threshold
            ]
        ]);
        return true;
    }
    return false;
}
```

### 2. 시도 횟수 기반 감지
```php
function detect_attempt_inefficiency($userid, $moduleid, $attempts) {
    $threshold = get_config('lms_notification', 'attempt_threshold');
    $success_rate = calculate_success_rate($userid, $moduleid);

    if ($attempts > $threshold && $success_rate < 0.3) {
        trigger_alert([
            'userid' => $userid,
            'alert_type' => 'excessive_attempts',
            'severity' => 'high',
            'metrics' => [
                'attempts' => $attempts,
                'success_rate' => $success_rate,
                'threshold' => $threshold
            ]
        ]);
        return true;
    }
    return false;
}
```

### 3. 오류 패턴 감지
```php
function detect_error_pattern($userid, $courseid) {
    $recent_activities = get_recent_activities($userid, $courseid, 10);
    $error_count = 0;
    $pattern_detected = false;

    foreach ($recent_activities as $activity) {
        if ($activity->incorrect_answers > $activity->correct_answers) {
            $error_count++;
        }
    }

    $error_rate = $error_count / count($recent_activities);

    if ($error_rate > 0.8) {
        trigger_alert([
            'userid' => $userid,
            'alert_type' => 'high_error_rate',
            'severity' => 'high',
            'metrics' => [
                'error_rate' => $error_rate,
                'recent_activities' => count($recent_activities)
            ]
        ]);
        return true;
    }
    return false;
}
```

### 4. 학습 정체 감지
```php
function detect_learning_stagnation($userid, $courseid) {
    $days_threshold = get_config('lms_notification', 'stagnation_days');
    $last_activity = get_last_activity_date($userid, $courseid);
    $days_since_activity = (time() - $last_activity) / 86400;

    if ($days_since_activity > $days_threshold) {
        trigger_alert([
            'userid' => $userid,
            'alert_type' => 'learning_stagnation',
            'severity' => 'medium',
            'metrics' => [
                'days_since_activity' => round($days_since_activity),
                'threshold' => $days_threshold
            ]
        ]);
        return true;
    }
    return false;
}
```

## 알림 전송 메커니즘

### 1. 브라우저 알림 (JavaScript)
```javascript
function showBrowserNotification(alertData) {
    if (Notification.permission === "granted") {
        new Notification("학습 패턴 알림", {
            body: alertData.message,
            icon: "/local/lms_notification/pix/alert_icon.png",
            tag: "lms-inefficiency-alert"
        });
    }
}
```

### 2. 이메일 알림 (PHP)
```php
function send_email_notification($userid, $alert) {
    $user = $DB->get_record('user', ['id' => $userid]);

    $subject = get_string('alert_email_subject', 'local_lms_notification');
    $message = format_email_message($alert);

    email_to_user($user,
        core_user::get_noreply_user(),
        $subject,
        $message
    );
}
```

### 3. Moodle 대시보드 알림
```php
function create_dashboard_notification($userid, $alert) {
    $notification = new \core\message\message();
    $notification->component = 'local_lms_notification';
    $notification->name = 'inefficiency_alert';
    $notification->userfrom = core_user::get_noreply_user();
    $notification->userto = $userid;
    $notification->subject = $alert['description'];
    $notification->fullmessage = format_notification_message($alert);
    $notification->fullmessageformat = FORMAT_HTML;
    $notification->fullmessagehtml = format_notification_html($alert);
    $notification->smallmessage = $alert['description'];

    message_send($notification);
}
```

## 프론트엔드 대시보드

### 학습자 대시보드
- 실시간 학습 진행 상황
- 알림 목록 및 상태
- 학습 패턴 시각화 (차트)
- 추천 학습 방법

### 교수자 대시보드
- 전체 학생 학습 현황
- 비효율 패턴 감지 학생 목록
- 개별 학생 상세 분석
- 알림 통계 및 트렌드

### 관리자 대시보드
- 시스템 전체 통계
- 임계값 설정
- 알림 규칙 관리
- 성능 모니터링

## 설치 및 구성

### 1. 파일 배치
```
moodle/
  └── local/
      └── lms_notification/
          ├── version.php
          ├── db/
          │   ├── install.xml
          │   └── access.php
          ├── classes/
          │   ├── tracker.php
          │   ├── analyzer.php
          │   └── notifier.php
          ├── api/
          │   ├── track_activity.php
          │   ├── get_alerts.php
          │   └── acknowledge_alert.php
          ├── lang/
          │   ├── en/
          │   │   └── local_lms_notification.php
          │   └── ko/
          │       └── local_lms_notification.php
          └── settings.php
```

### 2. 플러그인 설치
1. Moodle 관리자로 로그인
2. Site administration > Notifications
3. 플러그인 설치 확인
4. 데이터베이스 테이블 생성 확인

### 3. 초기 설정
1. Site administration > Plugins > Local plugins > LMS Notification
2. 알림 임계값 설정
3. 이메일 템플릿 구성
4. 알림 수신자 역할 설정

## 성능 고려사항

### 1. 비동기 처리
- 학습 활동 추적은 Ajax로 비동기 처리
- 분석 작업은 Moodle 크론(cron) 작업으로 백그라운드 실행

### 2. 캐싱
- Redis 또는 Memcached를 사용한 통계 캐싱
- 자주 조회되는 데이터는 캐시에 저장

### 3. 데이터베이스 최적화
- 적절한 인덱스 설정
- 오래된 데이터 아카이빙
- 쿼리 최적화

### 4. 알림 빈도 제어
- 동일한 알림 중복 방지 (1시간 내)
- 사용자당 일일 알림 최대 개수 제한

## 보안 고려사항

### 1. 데이터 접근 제어
- Moodle 권한 시스템 활용
- 개인정보 보호 준수
- SQL Injection 방지 (prepared statements)

### 2. API 보안
- 세션 기반 인증
- CSRF 토큰 검증
- Rate limiting

### 3. 데이터 암호화
- 민감한 메타데이터는 암호화 저장
- HTTPS 통신 강제

## 모니터링 및 유지보수

### 1. 로깅
- 모든 알림 생성 및 전송 로그
- 시스템 오류 로그
- 성능 메트릭 로그

### 2. 정기 점검
- 주간: 알림 통계 리뷰
- 월간: 임계값 조정 검토
- 분기: 시스템 성능 평가

### 3. 업데이트
- Moodle 버전 호환성 유지
- 보안 패치 적용
- 기능 개선 및 버그 수정

## 향후 개선 사항

1. **AI 기반 패턴 분석**: 머신러닝을 활용한 고급 패턴 인식
2. **개인화된 학습 추천**: 학습자별 맞춤형 학습 경로 제안
3. **실시간 대시보드**: WebSocket을 활용한 실시간 모니터링
4. **모바일 앱 알림**: iOS/Android 푸시 알림 지원
5. **다국어 지원 확대**: 더 많은 언어 지원

## 라이선스

이 시스템은 Moodle과 동일한 GPL v3 라이선스를 따릅니다.

## 지원

문의사항이나 버그 리포트는 다음 채널을 통해 제출해주세요:
- GitHub Issues
- Moodle Forum
- 이메일: support@example.com
