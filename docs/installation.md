# 설치 가이드 (Installation Guide)

## 목차 (Table of Contents)

1. [시스템 요구사항](#시스템-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [백엔드 설정](#백엔드-설정)
4. [Moodle 플러그인 설치](#moodle-플러그인-설치)
5. [웹 서버 설정](#웹-서버-설정)
6. [HTTPS 설정](#https-설정)
7. [테스트](#테스트)
8. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **HTTPS**: WebRTC 웹캠 액세스를 위해 필수

### PHP 확장 모듈

다음 PHP 확장 모듈이 필요합니다:

```bash
sudo apt-get install php-mysql php-json php-mbstring php-curl php-gd php-xml
```

### 브라우저 요구사항 (클라이언트)

- Chrome 60+
- Firefox 55+
- Edge 79+
- Safari 11+ (일부 제한)

---

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE eye_tracking_attention DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eyetrack_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON eye_tracking_attention.* TO 'eyetrack_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 스키마 설치

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/alt42standalone_v1.0

# 스키마 적용
mysql -u eyetrack_user -p eye_tracking_attention < database/schema.sql
```

### 3. 데이터베이스 연결 확인

```bash
mysql -u eyetrack_user -p eye_tracking_attention

# 테이블 확인
SHOW TABLES;

# 다음 테이블들이 보여야 합니다:
# - tracking_sessions
# - eye_tracking_events
# - attention_metrics
# - attention_alerts
# - user_settings
# - calibration_data
# - analytics_summary
# - system_logs
```

---

## 백엔드 설정

### 1. 백엔드 파일 배치

```bash
# 웹 서버 문서 루트로 백엔드 파일 복사
sudo cp -r backend /var/www/html/eye-tracking-backend

# 또는 심볼릭 링크 생성
sudo ln -s /path/to/alt42standalone_v1.0/backend /var/www/html/eye-tracking-backend
```

### 2. 설정 파일 생성

```bash
cd /var/www/html/eye-tracking-backend/config

# 샘플 설정 파일 복사
cp config.sample.php config.php

# 설정 파일 편집
nano config.php
```

**config.php 주요 설정 항목:**

```php
'database' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'eye_tracking_attention',
    'username' => 'eyetrack_user',
    'password' => 'your_secure_password',
],

'moodle' => [
    'url' => 'https://your-moodle-site.com',
    'webservice_token' => 'your_moodle_token',
],

'cors' => [
    'enabled' => true,
    'allowed_origins' => [
        'https://your-moodle-site.com',
    ],
],
```

### 3. 권한 설정

```bash
# 웹 서버 사용자에게 쓰기 권한 부여
sudo chown -R www-data:www-data /var/www/html/eye-tracking-backend
sudo chmod -R 755 /var/www/html/eye-tracking-backend

# 로그 디렉토리 생성 및 권한 설정
sudo mkdir -p /var/www/html/eye-tracking-backend/logs
sudo chown www-data:www-data /var/www/html/eye-tracking-backend/logs
sudo chmod 755 /var/www/html/eye-tracking-backend/logs
```

### 4. API 엔드포인트 테스트

```bash
# 간단한 테스트
curl http://localhost/eye-tracking-backend/api/sessions.php

# 오류 메시지가 아닌 JSON 응답이 와야 합니다
```

---

## Moodle 플러그인 설치

### 1. 플러그인 파일 복사

```bash
# Moodle 블록 디렉토리로 플러그인 복사
sudo cp -r moodle-plugin/blocks/attention_monitor /path/to/moodle/blocks/

# 권한 설정
sudo chown -R www-data:www-data /path/to/moodle/blocks/attention_monitor
sudo chmod -R 755 /path/to/moodle/blocks/attention_monitor
```

### 2. Moodle에서 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리 (Site Administration)** 접속
3. **알림 (Notifications)** 클릭
4. "Attention Monitor" 플러그인 설치 확인
5. **설치 (Install)** 클릭

### 3. 플러그인 설정

1. **사이트 관리 > 플러그인 > 블록 > Attention Monitor**로 이동
2. 다음 설정 입력:
   - **API Endpoint**: `https://your-site.com/eye-tracking-backend/api`
   - **Sampling Rate**: `100` (밀리초)
   - **Window Size**: `30000` (30초)
   - **Show Video**: 체크 (선택사항)
   - **Show Prediction**: 체크 (선택사항)
3. **변경사항 저장**

### 4. 코스에 블록 추가

1. Moodle 코스로 이동
2. **편집 모드 켜기 (Turn editing on)**
3. **블록 추가 (Add a block)** 클릭
4. **Attention Monitor** 선택

---

## 웹 서버 설정

### Apache 설정

**`/etc/apache2/sites-available/eye-tracking.conf` 생성:**

```apache
<VirtualHost *:80>
    ServerName your-site.com
    DocumentRoot /var/www/html

    <Directory /var/www/html/eye-tracking-backend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # CORS 헤더 (필요시)
    <FilesMatch "\.(php)$">
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Session-ID"
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/eye-tracking-error.log
    CustomLog ${APACHE_LOG_DIR}/eye-tracking-access.log combined
</VirtualHost>
```

**Apache 모듈 활성화 및 재시작:**

```bash
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2ensite eye-tracking
sudo systemctl restart apache2
```

### Nginx 설정

**`/etc/nginx/sites-available/eye-tracking` 생성:**

```nginx
server {
    listen 80;
    server_name your-site.com;
    root /var/www/html;
    index index.php index.html;

    location /eye-tracking-backend {
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }

        # CORS 헤더
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Session-ID" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    access_log /var/log/nginx/eye-tracking-access.log;
    error_log /var/log/nginx/eye-tracking-error.log;
}
```

**Nginx 재시작:**

```bash
sudo ln -s /etc/nginx/sites-available/eye-tracking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## HTTPS 설정

**웹캠 액세스를 위해 HTTPS는 필수입니다!**

### Let's Encrypt를 사용한 무료 SSL 인증서

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache  # Apache용
# 또는
sudo apt-get install certbot python3-certbot-nginx   # Nginx용

# SSL 인증서 발급
sudo certbot --apache -d your-site.com
# 또는
sudo certbot --nginx -d your-site.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 자체 서명 인증서 (개발용)

```bash
# 개발 환경용 자체 서명 인증서 생성
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/eyetracking-selfsigned.key \
  -out /etc/ssl/certs/eyetracking-selfsigned.crt

# Apache 설정에 추가
SSLEngine on
SSLCertificateFile /etc/ssl/certs/eyetracking-selfsigned.crt
SSLCertificateKeyFile /etc/ssl/private/eyetracking-selfsigned.key
```

---

## 테스트

### 1. 프론트엔드 파일 배치

```bash
# 테스트 페이지 생성
sudo cp -r frontend /var/www/html/eye-tracking-frontend
```

### 2. 테스트 HTML 페이지 생성

**`/var/www/html/eye-tracking-test.html` 생성:**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Eye Tracking Test</title>
    <script src="https://webgazer.cs.brown.edu/webgazer.js"></script>
    <script src="/eye-tracking-frontend/js/api-client.js"></script>
    <script src="/eye-tracking-frontend/js/blink-detector.js"></script>
    <script src="/eye-tracking-frontend/js/eye-tracker.js"></script>
    <script src="/eye-tracking-frontend/js/attention-analyzer.js"></script>
</head>
<body>
    <h1>Eye Tracking Attention Detection - Test Page</h1>

    <div id="status">Status: <span id="status-text">Not started</span></div>
    <div id="score">Attention Score: <span id="score-text">--</span></div>

    <button onclick="startTest()">Start Tracking</button>
    <button onclick="stopTest()">Stop Tracking</button>

    <div id="alerts"></div>

    <script>
        let tracker, analyzer, apiClient;

        async function startTest() {
            // Initialize API client
            apiClient = new APIClient({
                baseURL: '/eye-tracking-backend/api',
                userID: 1,
                courseID: 1
            });

            // Start session
            const session = await apiClient.startSession();
            console.log('Session started:', session);

            // Initialize eye tracker
            tracker = new EyeTracker({
                samplingRate: 100,
                onGaze: (data) => {
                    console.log('Gaze:', data);
                },
                onBlink: (data) => {
                    console.log('Blink:', data);
                }
            });

            await tracker.init();
            await tracker.start(apiClient);

            document.getElementById('status-text').textContent = 'Active';
        }

        async function stopTest() {
            if (tracker) {
                await tracker.stop();
                await apiClient.endSession();
                document.getElementById('status-text').textContent = 'Stopped';
            }
        }
    </script>
</body>
</html>
```

### 3. 테스트 실행

1. 브라우저에서 `https://your-site.com/eye-tracking-test.html` 접속
2. **Start Tracking** 클릭
3. 웹캠 권한 허용
4. 화면을 보며 정상 동작 확인
5. MySQL에서 데이터 확인:

```sql
USE eye_tracking_attention;
SELECT * FROM tracking_sessions ORDER BY started_at DESC LIMIT 1;
SELECT * FROM eye_tracking_events ORDER BY timestamp DESC LIMIT 10;
```

---

## 문제 해결

### 웹캠 권한 오류

**증상**: "NotAllowedError: Permission denied"

**해결방법**:
- HTTPS 사용 확인 (HTTP는 웹캠 액세스 불가)
- 브라우저 권한 설정 확인
- 웹캠이 다른 앱에서 사용 중인지 확인

### CORS 오류

**증상**: "Access to XMLHttpRequest blocked by CORS policy"

**해결방법**:
- `config.php`의 CORS 설정 확인
- `allowed_origins`에 Moodle URL 추가
- 웹 서버 CORS 헤더 설정 확인

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결방법**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 데이터베이스 사용자 권한 확인
mysql -u root -p
SHOW GRANTS FOR 'eyetrack_user'@'localhost';

# config.php 데이터베이스 설정 재확인
```

### API 엔드포인트 404 오류

**증상**: "404 Not Found" when accessing API

**해결방법**:
- API 파일 경로 확인
- 웹 서버 rewrite 규칙 확인
- PHP 실행 권한 확인

### 성능 문제

**증상**: 느린 응답 또는 높은 서버 부하

**최적화 방법**:
```bash
# MySQL 쿼리 캐시 활성화
sudo nano /etc/mysql/my.cnf
# 추가:
# query_cache_type = 1
# query_cache_size = 128M

# PHP OPcache 활성화
sudo nano /etc/php/7.4/apache2/php.ini
# 추가:
# opcache.enable=1
# opcache.memory_consumption=128

# 웹 서버 재시작
sudo systemctl restart apache2  # 또는 nginx
sudo systemctl restart mysql
```

---

## 로그 확인

### 시스템 로그

```bash
# Apache 로그
sudo tail -f /var/log/apache2/eye-tracking-error.log

# Nginx 로그
sudo tail -f /var/log/nginx/eye-tracking-error.log

# PHP 로그
sudo tail -f /var/log/php7.4-fpm.log

# MySQL 로그
sudo tail -f /var/log/mysql/error.log
```

### 애플리케이션 로그

```sql
-- 데이터베이스 로그 조회
USE eye_tracking_attention;
SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50;

-- 오류 로그만 조회
SELECT * FROM system_logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 20;
```

---

## 보안 권장사항

1. **데이터베이스 비밀번호 강화**: 최소 16자 이상의 복잡한 비밀번호 사용
2. **API 키 인증 활성화**: `config.php`에서 `api_key_required` 활성화
3. **Rate Limiting 활성화**: 무차별 대입 공격 방지
4. **정기 백업**: 데이터베이스 및 설정 파일 정기 백업
5. **보안 업데이트**: PHP, MySQL, 웹 서버 정기 업데이트

---

## 다음 단계

설치가 완료되었습니다! 다음을 참조하세요:

- [API Reference](api-reference.md) - API 상세 문서
- [알고리즘 설명](algorithms.md) - 집중도 감지 알고리즘 설명
- [사용자 가이드](user-guide.md) - 학생/교사용 사용 가이드

## 지원

문제가 발생하면 다음을 확인하세요:
- [GitHub Issues](https://github.com/yourusername/eye-tracking-attention)
- [FAQ](faq.md)
- Email: support@example.com
