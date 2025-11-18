# 인지 회복 감지 시스템 (Cognitive Recovery Detection System)

LMS 학습 중 발생하는 짧은 멍때림(10-60초)을 자동으로 감지하여 **인지 회복 구간**으로 분류하고, 학습자의 최적 학습 패턴을 분석하는 독립형 웹앱입니다.

## 주요 기능

### 🧠 인지 회복 감지
- **10-60초** 비활동 구간을 자동으로 "인지 회복" 구간으로 분류
- **3-10초**: 마이크로 브레이크
- **60초 이상**: 연장된 휴식
- **5분 이상**: 잠재적 이탈

### 📊 실시간 모니터링
- 마우스 움직임, 클릭, 키보드 입력, 스크롤 추적
- 페이지 포커스/블러 감지
- 실시간 활동 강도 계산

### 📈 학습 패턴 분석
- 개인별 최적 학습 시간 분석
- 인지 회복 빈도 및 효과성 측정
- 맞춤형 학습 제안 제공

### 🔗 Moodle 3.7 연동
- REST API를 통한 사용자 정보 동기화
- 학습 활동 데이터 양방향 연동
- 간편한 임베드 코드 제공

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: Vanilla JavaScript (ES6+)
- **Integration**: Moodle REST API

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹서버
- Moodle 3.7 (선택사항)

## 설치 방법

### 1. 파일 복사
```bash
# 웹 서버 디렉토리에 복사
cp -r cognitive-recovery-app /var/www/html/
```

### 2. 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE cognitive_recovery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'cr_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cognitive_recovery_db.* TO 'cr_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
USE cognitive_recovery_db;
SOURCE /var/www/html/cognitive-recovery-app/database/schema.sql;
```

### 3. 설정 파일 구성
```bash
cd /var/www/html/cognitive-recovery-app
cp config.sample.ini config.ini
nano config.ini
```

**config.ini 예시:**
```ini
[database]
db_host = localhost
db_name = cognitive_recovery_db
db_user = cr_user
db_password = your_password
db_charset = utf8mb4

[moodle]
moodle_url = http://your-moodle-site.com
moodle_token = your_web_service_token
```

### 4. 파일 권한 설정
```bash
chmod 755 /var/www/html/cognitive-recovery-app
chmod 644 /var/www/html/cognitive-recovery-app/config.ini
chown -R www-data:www-data /var/www/html/cognitive-recovery-app
```

### 5. Moodle Web Service 설정 (선택사항)

#### 5.1 Web Service 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 > 서버 > 웹 서비스 > 개요**
3. 다음 항목 활성화:
   - ✓ 웹 서비스 활성화
   - ✓ REST 프로토콜 활성화

#### 5.2 Web Service 사용자 생성
1. **사이트 관리 > 사용자 > 계정 > 사용자 추가**
2. 전용 웹 서비스 계정 생성 (예: `ws_cognitive`)

#### 5.3 역할 및 권한 설정
1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. 새 역할 생성: "Cognitive Recovery Service"
3. 필요한 권한 부여:
   - `webservice/rest:use`
   - `moodle/user:viewdetails`
   - `moodle/course:view`

#### 5.4 Web Service 토큰 생성
1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰을 `config.ini`에 복사

#### 5.5 허용된 함수 설정
다음 함수들을 허용 목록에 추가:
- `core_webservice_get_site_info`
- `core_user_get_users_by_field`
- `core_course_get_courses`
- `core_enrol_get_users_courses`
- `core_course_get_contents`

## 사용 방법

### 독립형 대시보드 사용

1. 브라우저에서 접속:
```
http://your-server/cognitive-recovery-app/frontend/index.html
```

2. "학습 시작" 버튼 클릭
3. 학습 활동 진행
4. 실시간으로 인지 회복 구간 감지 및 분석

### Moodle 페이지에 임베드

#### 방법 1: HTML 블록 사용
1. Moodle 코스 페이지 편집 모드 활성화
2. "블록 추가" > "HTML" 선택
3. 다음 코드 삽입:

```html
<script src="http://your-server/cognitive-recovery-app/frontend/js/activity-tracker.js"></script>
<script src="http://your-server/cognitive-recovery-app/frontend/js/cognitive-detector.js"></script>
<link rel="stylesheet" href="http://your-server/cognitive-recovery-app/frontend/css/dashboard.css">
<script>
(function() {
    const tracker = new ActivityTracker({
        apiUrl: 'http://your-server/cognitive-recovery-app/backend/api/track.php',
        userId: 1, // Moodle user ID
        courseId: 2, // Moodle course ID
        enableConsoleLog: false
    });

    const detector = new CognitiveDetector(tracker, {
        showNotifications: true,
        showVisualIndicator: true
    });

    tracker.start();

    window.addEventListener('beforeunload', () => tracker.stop());
})();
</script>
```

#### 방법 2: PHP를 통한 동적 임베드
```php
<?php
require_once('cognitive-recovery-app/backend/lib/MoodleIntegration.php');

$integration = new MoodleIntegration();
$embedCode = $integration->getEmbedCode(
    $USER->id,  // Moodle 사용자 ID
    $COURSE->id, // 코스 ID
    $cm->id      // 모듈 ID (선택사항)
);

echo $embedCode;
?>
```

## API 엔드포인트

### 활동 추적 API (`track.php`)

#### 세션 시작
```javascript
POST /backend/api/track.php
{
    "action": "start_session",
    "user_id": 1,
    "course_id": 2,
    "module_id": 3
}
```

#### 이벤트 추적
```javascript
POST /backend/api/track.php
{
    "action": "track_events",
    "session_token": "...",
    "events": [
        {
            "type": "click",
            "timestamp": "2025-01-18 10:30:45.123",
            "metadata": {"x": 100, "y": 200}
        }
    ]
}
```

#### 인지 회복 감지
```javascript
POST /backend/api/track.php
{
    "action": "detect_recovery",
    "session_token": "...",
    "min_gap_seconds": 10
}
```

### 대시보드 API (`dashboard.php`)

#### 세션 통계
```javascript
GET /backend/api/dashboard.php?action=session_stats&session_id=123
```

#### 사용자 패턴
```javascript
GET /backend/api/dashboard.php?action=user_patterns&user_id=1&days=30
```

#### 실시간 상태
```javascript
GET /backend/api/dashboard.php?action=realtime_status&session_token=...
```

## 데이터베이스 구조

### 주요 테이블

- **users**: 사용자 정보 (Moodle 동기화)
- **activity_sessions**: 학습 세션
- **activity_events**: 활동 이벤트 (클릭, 키입력 등)
- **cognitive_recovery_periods**: 감지된 인지 회복 구간
- **activity_metrics**: 분당 활동 강도 집계
- **user_cognitive_patterns**: 사용자별 학습 패턴

## 인지 회복 분류 기준

| 구분 | 비활동 시간 | 분류 |
|------|------------|------|
| 마이크로 브레이크 | 3-10초 | `micro_break` |
| **인지 회복** | **10-60초** | `cognitive_recovery` |
| 연장된 휴식 | 60초-5분 | `extended_pause` |
| 잠재적 이탈 | 5분 이상 | `potential_dropout` |

### 유익한 인지 회복 판단 기준

1. ✓ 회복 후 활동 강도가 증가
2. ✓ 지속 시간이 10-60초 범위
3. ✓ 이탈이 아닌 경우

## 맞춤형 제안 예시

- **완벽한 패턴**: "완벽한 인지 회복 패턴입니다! 현재의 학습 리듬을 유지하세요."
- **짧은 휴식**: "짧은 멍때림이 자주 발생하고 있네요. 15-30초 정도의 짧은 휴식이 학습에 도움이 됩니다."
- **긴 휴식**: "잠깐 쉬는 시간이 너무 길어지고 있어요. 5분 이상 자리를 비우면 집중력이 떨어질 수 있습니다."

## 문제 해결

### 데이터베이스 연결 오류
```bash
# PHP PDO MySQL 확장 확인
php -m | grep pdo_mysql

# 없으면 설치
sudo apt-get install php7.1-mysql
sudo service apache2 restart
```

### Moodle API 연결 실패
1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. 방화벽 설정 확인
4. PHP `allow_url_fopen` 및 `curl` 활성화 확인

### 활동 추적이 작동하지 않음
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. API URL이 올바른지 확인
3. CORS 설정 확인 (필요시 `.htaccess` 수정)

## 성능 최적화

### 데이터베이스 인덱스
스키마에 이미 최적화된 인덱스가 포함되어 있습니다:
- `activity_events`: session_id, event_timestamp
- `cognitive_recovery_periods`: session_id, recovery_type
- `activity_metrics`: session_id, minute_timestamp

### 데이터 정리
```sql
-- 90일 이상 된 이벤트 삭제 (스케줄러 등록 권장)
DELETE FROM activity_events
WHERE event_timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 배치 처리
- 이벤트는 기본적으로 10개씩 배치로 전송
- `batchSize` 설정으로 조정 가능

## 보안 고려사항

1. **SQL Injection 방지**: 모든 쿼리에 PDO prepared statements 사용
2. **XSS 방지**: 사용자 입력 필터링 및 이스케이프
3. **CSRF 방지**: 세션 토큰 검증
4. **데이터 암호화**: HTTPS 사용 권장
5. **접근 제어**: 사용자별 데이터 격리

## 라이선스

MIT License

## 지원

문제가 발생하거나 기능 제안이 있으시면 이슈를 등록해 주세요.

## 버전 히스토리

### v1.0.0 (2025-01-18)
- 초기 릴리스
- 인지 회복 자동 감지
- 실시간 모니터링 대시보드
- Moodle 3.7 연동
- 맞춤형 학습 제안
