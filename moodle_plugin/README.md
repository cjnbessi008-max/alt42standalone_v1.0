# LMS Usage Notification System for Moodle 3.7

## 개요

LMS 사용 알림 시스템은 Moodle 3.7 LMS와 연동하여 학습자의 비효율적인 학습 패턴을 자동으로 감지하고 실시간 알림을 제공하는 플러그인입니다.

### 주요 기능

- **실시간 학습 패턴 모니터링**: 학습자의 활동을 실시간으로 추적하고 분석
- **비효율 패턴 자동 감지**:
  - 과도한 시간 소비 (기본: 30분)
  - 반복적인 오류 (오류율 80% 이상)
  - 과도한 시도 횟수 (기본: 10회)
  - 학습 정체 (기본: 3일)
- **다채널 알림 시스템**:
  - 브라우저 내 실시간 알림
  - 이메일 알림
  - Moodle 대시보드 알림
  - SMS 알림 (선택적)
- **학습 분석 대시보드**: 개인 학습 패턴 시각화
- **교수자 알림**: 학생의 비효율 패턴을 교수자에게 자동 통보

## 시스템 요구사항

- **Moodle**: 3.3 이상 (3.7 권장)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari 최신 버전 (알림 권한 필요)

## 설치 방법

### 1. 플러그인 파일 복사

```bash
cd /path/to/moodle
cp -r /path/to/lms_notification local/
```

### 2. 권한 설정

```bash
chmod -R 755 local/lms_notification
chown -R www-data:www-data local/lms_notification  # 웹 서버 사용자에 맞게 조정
```

### 3. Moodle 관리자 페이지에서 설치

1. Moodle에 관리자로 로그인
2. `Site administration > Notifications` 페이지로 이동
3. 플러그인 설치 안내에 따라 진행
4. 데이터베이스 테이블이 자동으로 생성됨

### 4. 플러그인 설정

1. `Site administration > Plugins > Local plugins > LMS Notification` 이동
2. 기본 임계값 설정:
   - 시간 임계값: 1800초 (30분)
   - 시도 횟수 임계값: 10회
   - 오류율 임계값: 0.80 (80%)
3. 알림 채널 활성화 (이메일, 브라우저, SMS)

## 데이터베이스 스키마

플러그인 설치 시 다음 테이블이 자동으로 생성됩니다:

### 테이블 목록

1. **mdl_lms_usage_tracking**: 학습 활동 추적
2. **mdl_lms_inefficiency_alerts**: 비효율 패턴 알림
3. **mdl_lms_notification_settings**: 사용자 알림 설정
4. **mdl_lms_learning_analytics**: 일일 학습 분석 통계

상세 스키마는 `/docs/LMS_USAGE_NOTIFICATION_SYSTEM.md` 참조

## 사용 방법

### 학습자용

#### 1. 브라우저 알림 권한 설정

웹 브라우저에서 알림 권한을 허용해야 실시간 알림을 받을 수 있습니다.

#### 2. 학습 활동 모니터링

학습 활동이 자동으로 추적되며, 비효율적인 패턴이 감지되면 알림이 표시됩니다.

#### 3. 알림 확인

- 화면 우측 상단에 알림 팝업 표시
- "확인" 버튼을 클릭하여 알림 처리
- 권장사항에 따라 학습 방법 개선

#### 4. 학습 분석 대시보드

`My Dashboard > LMS Notifications`에서:
- 총 학습 시간
- 시도 횟수 및 성공률
- 비효율성 점수
- 일별 학습 통계

### 교수자용

#### 1. 학생 알림 모니터링

`Course > Reports > LMS Notifications`에서:
- 전체 학생의 비효율 패턴 확인
- 심각도 높은 알림 우선 표시
- 개별 학생 상세 분석

#### 2. 자동 알림 수신

심각도가 높거나 긴급한 학생 알림을 자동으로 이메일로 수신

## API 사용법

### 학습 활동 추적 API

```javascript
// JavaScript에서 활동 추적
require(['local_lms_notification/tracker'], function(Tracker) {
    var tracker = Tracker.init(courseId, moduleId, 'quiz_attempt');

    // 활동 추적
    tracker.trackActivity({
        attempts: 1,
        correct: 0,
        incorrect: 1,
        time_spent: 180,
        metadata: {
            question_id: 101,
            answer_given: 'B'
        }
    });
});
```

### REST API 엔드포인트

#### 활동 추적

```bash
POST /local/lms_notification/api/track_activity.php
Content-Type: application/json

{
    "courseid": 123,
    "moduleid": 456,
    "activitytype": "quiz_attempt",
    "attempts": 1,
    "correct": 0,
    "incorrect": 1,
    "time_spent": 180
}
```

#### 알림 조회

```bash
GET /local/lms_notification/api/get_alerts.php?courseid=123&limit=20
```

#### 알림 확인

```bash
POST /local/lms_notification/api/acknowledge_alert.php
Content-Type: application/json

{
    "alert_id": 789
}
```

#### 학습 분석 조회

```bash
GET /local/lms_notification/api/get_analytics.php?userid=123&courseid=456&days=7
```

## 설정 및 커스터마이징

### 임계값 조정

사용자별 임계값 설정:
1. `My Profile > Preferences > LMS Notification Settings`
2. 시간, 시도 횟수, 오류율 임계값 조정

관리자 기본 설정:
1. `Site administration > Plugins > Local plugins > LMS Notification`
2. 전체 사용자 기본값 설정

### 알림 메시지 커스터마이징

언어 파일 수정:
- 한국어: `/local/lms_notification/lang/ko/local_lms_notification.php`
- 영어: `/local/lms_notification/lang/en/local_lms_notification.php`

### CSS 스타일 커스터마이징

`/local/lms_notification/styles.css` 파일 수정

## 성능 최적화

### 1. 크론(Cron) 작업 설정

학습 정체 감지를 위한 일일 크론 작업 설정:

```bash
# /etc/cron.d/moodle-lms-notification
0 2 * * * www-data /usr/bin/php /path/to/moodle/admin/cli/cron.php --execute=\\local_lms_notification\\task\\check_stagnation
```

### 2. 데이터 정리

오래된 추적 데이터 정리 (1년 이상):

```bash
php /path/to/moodle/local/lms_notification/cli/cleanup.php --days=365
```

### 3. 데이터베이스 인덱스

플러그인 설치 시 자동으로 최적화된 인덱스가 생성됩니다.

## 보안

### 권한 시스템

- `local/lms_notification:view`: 기본 뷰 권한
- `local/lms_notification:viewalerts`: 본인 알림 조회
- `local/lms_notification:viewallalerts`: 전체 학생 알림 조회
- `local/lms_notification:managesettings`: 설정 관리
- `local/lms_notification:acknowledge`: 알림 확인
- `local/lms_notification:viewanalytics`: 학습 분석 조회

### API 보안

- 세션 기반 인증
- CSRF 토큰 검증
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 검증 및 출력 이스케이핑)

## 문제 해결

### 알림이 표시되지 않음

1. 브라우저 알림 권한 확인
2. 사용자 알림 설정 확인 (`My Profile > Preferences`)
3. 플러그인 활성화 상태 확인

### 이메일이 전송되지 않음

1. Moodle 이메일 설정 확인 (`Site administration > Server > Email`)
2. SMTP 설정 확인
3. 이메일 큐 상태 확인

### 데이터베이스 오류

```bash
# 데이터베이스 재설치
php /path/to/moodle/admin/cli/uninstall_plugins.php --plugins=local_lms_notification --run
# 플러그인 재설치
```

### 성능 문제

1. 데이터베이스 인덱스 확인
2. 오래된 데이터 정리
3. 크론 작업 빈도 조정

## 지원 및 문의

- **문서**: `/docs/LMS_USAGE_NOTIFICATION_SYSTEM.md`
- **이슈 트래킹**: GitHub Issues
- **이메일**: support@example.com

## 라이선스

이 플러그인은 GNU General Public License v3.0 라이선스 하에 배포됩니다.

## 버전 히스토리

### v1.0.0 (2024-01-15)

- 초기 릴리스
- 학습 패턴 모니터링 기능
- 비효율 패턴 자동 감지
- 다채널 알림 시스템
- 학습 분석 대시보드
- REST API 제공
- 한국어/영어 지원

## 기여

기여를 환영합니다! Pull Request를 제출해주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 개발 팀

- 개발자: [Your Name]
- 프로젝트 관리자: [Project Manager Name]

## 감사의 말

Moodle 커뮤니티의 모든 기여자분들께 감사드립니다.
