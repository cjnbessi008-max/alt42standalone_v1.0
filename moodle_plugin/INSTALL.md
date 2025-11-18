# LMS Notification System - 설치 가이드

## 빠른 설치

### 1단계: 파일 배치

Moodle 루트 디렉토리에서:

```bash
cd /var/www/html/moodle  # Moodle 설치 경로
cp -r /path/to/lms_notification local/
```

### 2단계: 권한 설정

```bash
chmod -R 755 local/lms_notification
chown -R www-data:www-data local/lms_notification
```

### 3단계: 플러그인 설치

1. Moodle 관리자 계정으로 로그인
2. 브라우저에서 자동으로 `Site administration > Notifications` 페이지로 리디렉션
3. "Upgrade Moodle database now" 클릭
4. 설치 완료 확인

## 상세 설치 가이드

### 사전 요구사항 확인

```bash
# PHP 버전 확인
php -v  # 7.1.9 이상 필요

# MySQL 버전 확인
mysql --version  # 5.7 이상 필요

# Moodle 버전 확인
# Moodle 관리 페이지에서 Site administration > Server > Environment
```

### 데이터베이스 권한 확인

Moodle 데이터베이스 사용자가 다음 권한을 가지고 있는지 확인:

```sql
-- 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 필요한 권한: SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
```

### 파일 배치 구조

```
moodle/
└── local/
    └── lms_notification/
        ├── version.php          # 플러그인 버전 정보
        ├── db/
        │   ├── install.xml     # 데이터베이스 스키마
        │   ├── access.php      # 권한 정의
        │   └── messages.php    # 메시지 프로바이더
        ├── classes/
        │   ├── tracker.php     # 활동 추적 클래스
        │   ├── analyzer.php    # 패턴 분석 클래스
        │   └── notifier.php    # 알림 전송 클래스
        ├── api/
        │   ├── track_activity.php
        │   ├── get_alerts.php
        │   ├── acknowledge_alert.php
        │   └── get_analytics.php
        ├── amd/
        │   └── src/
        │       └── tracker.js  # JavaScript 모듈
        ├── lang/
        │   ├── en/
        │   │   └── local_lms_notification.php
        │   └── ko/
        │       └── local_lms_notification.php
        └── styles.css
```

### 플러그인 설치 과정

#### 방법 1: 웹 인터페이스 (권장)

1. **플러그인 파일 업로드**
   ```bash
   # 압축 파일로 준비
   cd /path/to
   zip -r lms_notification.zip lms_notification/
   ```

2. **Moodle 관리 페이지에서 설치**
   - `Site administration > Plugins > Install plugins`
   - "Choose a file" 클릭하여 zip 파일 선택
   - "Install plugin from the ZIP file" 클릭

3. **설치 확인**
   - 데이터베이스 테이블 생성 확인
   - 권한 설정 확인

#### 방법 2: CLI (명령줄)

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 복사
cp -r /path/to/lms_notification local/

# CLI로 업그레이드 실행
sudo -u www-data php admin/cli/upgrade.php --non-interactive
```

### 데이터베이스 테이블 확인

설치 후 다음 테이블이 생성되었는지 확인:

```sql
USE moodle_database;

SHOW TABLES LIKE 'mdl_lms_%';

-- 예상 결과:
-- mdl_lms_usage_tracking
-- mdl_lms_inefficiency_alerts
-- mdl_lms_notification_settings
-- mdl_lms_learning_analytics
```

### 초기 설정

#### 1. 기본 임계값 설정

```
Site administration > Plugins > Local plugins > LMS Notification

- Time threshold: 1800 (30분)
- Attempts threshold: 10
- Error rate threshold: 0.80 (80%)
- Stagnation days: 3
```

#### 2. 알림 채널 설정

```
- Email notifications: ✓ Enabled
- Browser notifications: ✓ Enabled
- SMS notifications: ☐ Disabled (선택적)
```

#### 3. 이메일 설정 확인

```
Site administration > Server > Email

- Outgoing mail configuration: SMTP 또는 PHP mail() 설정
- Test outgoing mail: 테스트 이메일 전송하여 확인
```

#### 4. 크론 작업 설정

Moodle 크론이 정상적으로 실행되고 있는지 확인:

```bash
# 크론 작업 확인
crontab -l -u www-data

# Moodle 크론 설정 (없는 경우)
*/5 * * * * /usr/bin/php /var/www/html/moodle/admin/cli/cron.php > /dev/null 2>&1
```

### 권한 설정

#### 역할별 권한 설정

```
Site administration > Users > Permissions > Define roles
```

**학생 (Student)**
- local/lms_notification:view: ✓
- local/lms_notification:viewalerts: ✓
- local/lms_notification:acknowledge: ✓

**교사 (Teacher)**
- local/lms_notification:view: ✓
- local/lms_notification:viewalerts: ✓
- local/lms_notification:viewallalerts: ✓
- local/lms_notification:viewanalytics: ✓
- local/lms_notification:acknowledge: ✓

**관리자 (Manager)**
- 모든 권한: ✓

### 테스트

#### 1. 기능 테스트

```bash
# 학습자 계정으로 로그인
# 퀴즈 또는 과제 시도
# 의도적으로 많은 시간 소비 또는 오답 제출
# 알림이 표시되는지 확인
```

#### 2. API 테스트

```bash
# curl을 사용한 API 테스트
curl -X POST https://your-moodle-site.com/local/lms_notification/api/track_activity.php \
  -H "Content-Type: application/json" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID" \
  -d '{
    "courseid": 2,
    "moduleid": 10,
    "activitytype": "quiz_attempt",
    "attempts": 15,
    "correct": 1,
    "incorrect": 14,
    "time_spent": 2400
  }'
```

#### 3. 이메일 알림 테스트

```
Site administration > Server > Email > Test outgoing mail configuration
```

### 문제 해결

#### 설치 오류

**오류: "Invalid plugin directory"**

```bash
# 디렉토리 구조 확인
ls -la local/lms_notification/version.php

# version.php 파일이 있는지 확인
```

**오류: "Database error"**

```bash
# 데이터베이스 연결 확인
php admin/cli/check_database_schema.php

# 권한 확인
GRANT ALL PRIVILEGES ON moodle_database.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 권한 오류

```bash
# 파일 권한 재설정
cd /var/www/html/moodle
chmod -R 755 local/lms_notification
chown -R www-data:www-data local/lms_notification

# SELinux가 활성화된 경우
chcon -R -t httpd_sys_rw_content_t local/lms_notification
```

#### 알림이 작동하지 않음

1. **브라우저 콘솔 확인**
   - F12 키를 눌러 개발자 도구 열기
   - Console 탭에서 JavaScript 오류 확인

2. **Moodle 디버깅 활성화**
   ```
   Site administration > Development > Debugging
   - Debug messages: DEVELOPER
   - Display debug messages: Yes
   ```

3. **로그 확인**
   ```bash
   tail -f /var/log/apache2/error.log
   tail -f /var/www/html/moodle/error.log
   ```

### 업그레이드

기존 버전에서 업그레이드:

```bash
# 백업
cp -r local/lms_notification local/lms_notification.backup

# 새 버전 복사
cp -r /path/to/new/lms_notification local/

# Moodle 업그레이드 실행
sudo -u www-data php admin/cli/upgrade.php --non-interactive

# 또는 웹 인터페이스
# Site administration > Notifications
```

### 제거

플러그인 완전 제거:

```bash
# CLI로 제거
php admin/cli/uninstall_plugins.php \
  --plugins=local_lms_notification \
  --run

# 수동 제거
rm -rf local/lms_notification

# 데이터베이스 테이블 제거 (선택)
mysql -u moodle_user -p moodle_database
DROP TABLE mdl_lms_usage_tracking;
DROP TABLE mdl_lms_inefficiency_alerts;
DROP TABLE mdl_lms_notification_settings;
DROP TABLE mdl_lms_learning_analytics;
```

## 프로덕션 배포

### 성능 최적화

1. **Opcode 캐싱 활성화**
   ```ini
   # php.ini
   opcache.enable=1
   opcache.memory_consumption=256
   opcache.max_accelerated_files=20000
   ```

2. **데이터베이스 최적화**
   ```sql
   -- 인덱스 확인
   SHOW INDEX FROM mdl_lms_usage_tracking;

   -- 쿼리 성능 분석
   EXPLAIN SELECT * FROM mdl_lms_usage_tracking
   WHERE userid = 123 AND courseid = 456;
   ```

3. **캐싱 설정**
   ```
   Site administration > Plugins > Caching > Configuration
   - Application cache: Redis 또는 Memcached
   ```

### 보안 강화

1. **HTTPS 강제**
   ```apache
   # Apache .htaccess
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

2. **Rate Limiting**
   ```apache
   # Apache mod_evasive 또는 nginx limit_req 설정
   ```

3. **방화벽 설정**
   ```bash
   # UFW (Ubuntu)
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

### 모니터링

1. **로그 모니터링**
   ```bash
   # Logwatch 설정
   apt-get install logwatch
   ```

2. **성능 모니터링**
   ```bash
   # New Relic 또는 Datadog 설정
   ```

## 지원

추가 도움이 필요하신 경우:

- 문서: `/docs/LMS_USAGE_NOTIFICATION_SYSTEM.md`
- 이슈: GitHub Issues
- 이메일: support@example.com
