# Step Simplifier 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (LMS 연동 시)

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|mysql|curl|json|mbstring'
```

필요한 확장 모듈:
- pdo_mysql
- curl
- json
- mbstring

## 설치 단계

### 1. 파일 다운로드 및 배치

```bash
# 프로젝트를 웹 서버 루트에 복사
sudo cp -r step-simplifier /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/step-simplifier
sudo chmod -R 755 /var/www/html/step-simplifier
```

### 2. 데이터베이스 설정

#### 2.1 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE step_simplifier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'step_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON step_simplifier.* TO 'step_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

#### 2.2 스키마 임포트

```bash
# 스키마 파일 실행
mysql -u step_user -p step_simplifier < /var/www/html/step-simplifier/database/schema.sql
```

#### 2.3 데이터베이스 연결 확인

```bash
mysql -u step_user -p step_simplifier -e "SHOW TABLES;"
```

예상 출력:
```
+----------------------------+
| Tables_in_step_simplifier  |
+----------------------------+
| moodle_sync_log           |
| problems                  |
| solution_steps            |
| user_attempts             |
| user_progress             |
| users                     |
+----------------------------+
```

### 3. 환경 설정

#### 3.1 환경 변수 설정

`.env` 파일 생성:

```bash
cd /var/www/html/step-simplifier
nano .env
```

`.env` 파일 내용:
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=step_simplifier
DB_USER=step_user
DB_PASS=your_secure_password

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
MOODLE_SERVICE=moodle_mobile_app

# Application Settings
DEBUG=false
API_BASE_URL=/step-simplifier/backend/api
```

#### 3.2 PHP 설정 파일 업데이트

`backend/config/database.php` 확인:
```php
<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'step_simplifier');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
```

### 4. 웹 서버 설정

#### Apache 설정

##### 4.1 가상 호스트 생성

```bash
sudo nano /etc/apache2/sites-available/step-simplifier.conf
```

```apache
<VirtualHost *:80>
    ServerName step-simplifier.local
    DocumentRoot /var/www/html/step-simplifier

    <Directory /var/www/html/step-simplifier>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 디렉토리 설정
    <Directory /var/www/html/step-simplifier/backend/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        # URL Rewriting
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/step-simplifier-error.log
    CustomLog ${APACHE_LOG_DIR}/step-simplifier-access.log combined
</VirtualHost>
```

##### 4.2 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite step-simplifier.conf

# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

##### 4.3 hosts 파일 수정 (로컬 개발용)

```bash
sudo nano /etc/hosts
```

추가:
```
127.0.0.1    step-simplifier.local
```

#### Nginx 설정 (선택사항)

```bash
sudo nano /etc/nginx/sites-available/step-simplifier
```

```nginx
server {
    listen 80;
    server_name step-simplifier.local;
    root /var/www/html/step-simplifier/frontend;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ =404;
    }

    # Backend API
    location /backend/api {
        root /var/www/html/step-simplifier;
        try_files $uri $uri/ /backend/api/index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    # 로그
    access_log /var/log/nginx/step-simplifier-access.log;
    error_log /var/log/nginx/step-simplifier-error.log;
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/step-simplifier /etc/nginx/sites-enabled/

# Nginx 재시작
sudo systemctl restart nginx
```

### 5. Moodle 연동 설정 (선택사항)

#### 5.1 Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > Web services > 개요**
3. "Enable web services" 체크
4. "Enable protocols" - REST 프로토콜 활성화

#### 5.2 External Service 생성

1. **사이트 관리 > 플러그인 > Web services > External services**
2. "Add" 클릭
3. 설정:
   - Name: `Step Simplifier Service`
   - Short name: `step_simplifier`
   - Enabled: Yes
4. "Add functions" 클릭하여 필요한 함수 추가:
   - `core_user_get_users_by_field`
   - `core_question_get_random_question_summaries`
   - `core_grades_update_grades`

#### 5.3 토큰 생성

1. **사이트 관리 > 플러그인 > Web services > Manage tokens**
2. "Add" 클릭
3. 설정:
   - User: 관리자 또는 서비스 계정
   - Service: `Step Simplifier Service`
4. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 복사

#### 5.4 연결 테스트

```bash
curl -X POST "http://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json"
```

### 6. 프론트엔드 설정

#### 6.1 설정 파일 업데이트

`frontend/js/config.js` 파일 확인:

```javascript
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost/step-simplifier/backend/api'
        : '/step-simplifier/backend/api',

    MOODLE_INTEGRATION: true,

    // 테스트용 기본 사용자 (Moodle 연동 시 무시됨)
    DEFAULT_USER: {
        id: 1,
        moodle_user_id: 1,
        username: 'student',
        email: 'student@example.com'
    },

    DEFAULT_PROBLEM_ID: 1,
    DEBUG: false
};
```

### 7. 테스트

#### 7.1 API 헬스 체크

```bash
curl http://step-simplifier.local/backend/api/health
```

예상 응답:
```json
{
  "success": true,
  "message": "Step Simplifier API is running",
  "version": "1.0.0",
  "timestamp": "2025-11-18T10:00:00+00:00"
}
```

#### 7.2 데이터베이스 연결 테스트

```bash
curl http://step-simplifier.local/backend/api/problems
```

#### 7.3 프론트엔드 테스트

브라우저에서 접속:
```
http://step-simplifier.local/frontend/index.html
```

또는 (Moodle 사용자 ID와 함께):
```
http://step-simplifier.local/frontend/index.html?user_id=123
```

### 8. 문제 해결

#### 데이터베이스 연결 실패

**증상**: "Database connection failed" 오류

**해결**:
```bash
# MySQL 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u step_user -p -h localhost step_simplifier

# PHP PDO 확장 확인
php -m | grep pdo
```

#### API 404 오류

**증상**: API 호출 시 404 Not Found

**해결**:
```bash
# .htaccess 파일 생성 (Apache)
cd /var/www/html/step-simplifier/backend/api
nano .htaccess
```

`.htaccess` 내용:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

```bash
# mod_rewrite 활성화 확인
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### CORS 오류

**증상**: 브라우저 콘솔에서 CORS 오류

**해결**: `backend/api/index.php`에 CORS 헤더 추가 (이미 포함되어 있음):
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

#### 프론트엔드 로딩 오류

**증상**: JavaScript 파일이 로드되지 않음

**해결**:
```bash
# 파일 권한 확인
sudo chmod 644 /var/www/html/step-simplifier/frontend/js/*
sudo chmod 644 /var/www/html/step-simplifier/frontend/css/*

# 브라우저 캐시 삭제
# Ctrl + Shift + R (크롬/파이어폭스)
```

### 9. 프로덕션 배포

#### 9.1 보안 설정

```bash
# .env 파일 권한
chmod 600 /var/www/html/step-simplifier/.env

# API 디렉토리 접근 제한
# backend/api/.htaccess에 추가:
```

```apache
# IP 화이트리스트 (필요시)
# Require ip 192.168.1.0/24

# 디렉토리 리스팅 비활성화
Options -Indexes
```

#### 9.2 성능 최적화

```bash
# PHP OpCache 활성화
sudo nano /etc/php/7.1/apache2/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

```bash
# Apache 재시작
sudo systemctl restart apache2
```

#### 9.3 백업 설정

```bash
# 데이터베이스 백업 스크립트
nano /usr/local/bin/backup-step-simplifier.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/step-simplifier"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# DB 백업
mysqldump -u step_user -p'your_password' step_simplifier > \
  $BACKUP_DIR/db_$DATE.sql

# 파일 백업
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
  /var/www/html/step-simplifier

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -type f -mtime +30 -delete
```

```bash
# 실행 권한
chmod +x /usr/local/bin/backup-step-simplifier.sh

# Cron 작업 추가 (매일 새벽 2시)
crontab -e
```

```cron
0 2 * * * /usr/local/bin/backup-step-simplifier.sh
```

## 설치 완료!

브라우저에서 `http://step-simplifier.local/frontend/index.html`을 열어 앱을 확인하세요.

문제가 발생하면 로그 파일을 확인하세요:
- Apache: `/var/log/apache2/step-simplifier-error.log`
- MySQL: `/var/log/mysql/error.log`
- PHP: `/var/log/php7.1-fpm.log`
