# Absolute Tunnel 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 시스템 요구사항 확인

```bash
# PHP 버전 확인
php -v  # PHP 7.1.9 이상 필요

# MySQL 버전 확인
mysql --version  # MySQL 5.7 이상 필요

# Apache 또는 Nginx 실행 확인
systemctl status apache2
# 또는
systemctl status nginx
```

### 2단계: 프로젝트 복사

```bash
# 웹 서버 루트로 복사
sudo cp -r absolute-tunnel /var/www/html/

# 또는 원하는 위치로 복사
cp -r absolute-tunnel /your/desired/path/
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE absolute_tunnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항)
CREATE USER 'absolute_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON absolute_tunnel.* TO 'absolute_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE absolute_tunnel;
SOURCE /path/to/absolute-tunnel/database/schema.sql;
```

### 4단계: 설정 파일 수정

```bash
cd /var/www/html/absolute-tunnel
nano config/config.php
```

다음 항목을 수정:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'absolute_tunnel');
define('DB_USER', 'absolute_user');  // 3단계에서 생성한 사용자
define('DB_PASS', 'your_password');  // 3단계에서 설정한 비밀번호

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');  // 5단계에서 생성

// Debug Mode (프로덕션에서는 false로 설정)
define('DEBUG_MODE', true);
```

### 5단계: Moodle 웹 서비스 설정

#### 5-1. Moodle 웹 서비스 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리** → **고급 기능** → **웹 서비스 활성화** 체크
3. 저장

#### 5-2. 프로토콜 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **프로토콜 관리**
2. **REST 프로토콜** 활성화

#### 5-3. 외부 서비스 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. **외부 서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Absolute Tunnel Service`
   - 짧은 이름: `absolute_tunnel_service`
   - 활성화: 체크
4. 저장

#### 5-4. 기능(Functions) 추가

외부 서비스 편집 화면에서 다음 기능 추가:

- `core_user_get_users_by_field`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_start_attempt`
- `mod_quiz_process_attempt`
- `core_grades_update_grades`
- `core_webservice_get_site_info`

#### 5-5. 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. **토큰 추가** 클릭
3. 다음 정보 입력:
   - 사용자: 웹 서비스를 사용할 사용자 선택
   - 서비스: `Absolute Tunnel Service` 선택
4. 저장하고 생성된 토큰 복사
5. `config/config.php`의 `MOODLE_TOKEN`에 붙여넣기

### 6단계: 권한 설정

```bash
# 로그 디렉토리 권한
chmod 755 /var/www/html/absolute-tunnel/logs
chown www-data:www-data /var/www/html/absolute-tunnel/logs

# PHP 파일 실행 권한
chmod 644 /var/www/html/absolute-tunnel/api/*.php
chmod 644 /var/www/html/absolute-tunnel/config/*.php
```

### 7단계: 웹 서버 설정

#### Apache 설정

`/etc/apache2/sites-available/absolute-tunnel.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName absolute-tunnel.local
    DocumentRoot /var/www/html/absolute-tunnel

    <Directory /var/www/html/absolute-tunnel>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/absolute-tunnel-error.log
    CustomLog ${APACHE_LOG_DIR}/absolute-tunnel-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite absolute-tunnel.conf
sudo systemctl reload apache2
```

#### Nginx 설정

`/etc/nginx/sites-available/absolute-tunnel` 생성:

```nginx
server {
    listen 80;
    server_name absolute-tunnel.local;
    root /var/www/html/absolute-tunnel;
    index app/index.html;

    # 로그 설정
    access_log /var/log/nginx/absolute-tunnel-access.log;
    error_log /var/log/nginx/absolute-tunnel-error.log;

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    # 정적 파일
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/absolute-tunnel /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 8단계: 호스트 파일 수정 (로컬 테스트용)

```bash
sudo nano /etc/hosts
```

다음 줄 추가:

```
127.0.0.1   absolute-tunnel.local
```

### 9단계: 테스트

브라우저에서 접속:

```
http://absolute-tunnel.local/app/index.html
```

## 프로덕션 배포

### 1. Debug 모드 비활성화

```php
// config/config.php
define('DEBUG_MODE', false);
```

### 2. HTTPS 설정

Let's Encrypt 사용:

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

### 3. 보안 설정

#### config/config.php 보호

```apache
<Files "config.php">
    Require all denied
</Files>
```

#### 데이터베이스 사용자 권한 최소화

```sql
REVOKE ALL PRIVILEGES ON absolute_tunnel.* FROM 'absolute_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON absolute_tunnel.* TO 'absolute_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 성능 최적화

#### PHP OpCache 활성화

```ini
; /etc/php/7.1/apache2/php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

#### MySQL 쿼리 캐시

```ini
; /etc/mysql/my.cnf
query_cache_type = 1
query_cache_size = 32M
```

## 문제 해결

### PHP 확장 모듈 설치

```bash
# PDO MySQL 확장
sudo apt install php7.1-mysql

# cURL 확장 (Moodle API 연동)
sudo apt install php7.1-curl

# JSON 확장
sudo apt install php7.1-json

# Apache/Nginx 재시작
sudo systemctl restart apache2
# 또는
sudo systemctl restart nginx php7.1-fpm
```

### 데이터베이스 연결 테스트

```bash
cd /var/www/html/absolute-tunnel
php -r "
require 'config/config.php';
require 'config/database.php';
try {
    \$db = Database::getInstance()->getConnection();
    echo 'Database connection successful!\n';
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . '\n';
}
"
```

### Moodle API 연결 테스트

```bash
cd /var/www/html/absolute-tunnel
php -r "
require 'config/config.php';
require 'api/moodle_api.php';
\$api = new MoodleAPI();
\$result = \$api->validateUser(MOODLE_TOKEN);
print_r(\$result);
"
```

### 로그 확인

```bash
# 앱 로그
tail -f /var/www/html/absolute-tunnel/logs/error.log
tail -f /var/www/html/absolute-tunnel/logs/api.log

# 웹 서버 로그
tail -f /var/log/apache2/absolute-tunnel-error.log
# 또는
tail -f /var/log/nginx/absolute-tunnel-error.log

# PHP 에러 로그
tail -f /var/log/php7.1-fpm.log
```

## 백업 및 복원

### 백업

```bash
#!/bin/bash
# backup.sh

# 데이터베이스 백업
mysqldump -u absolute_user -p absolute_tunnel > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf absolute-tunnel_backup_$(date +%Y%m%d).tar.gz \
    /var/www/html/absolute-tunnel \
    --exclude=/var/www/html/absolute-tunnel/logs
```

### 복원

```bash
# 데이터베이스 복원
mysql -u absolute_user -p absolute_tunnel < backup_20251118.sql

# 파일 복원
tar -xzf absolute-tunnel_backup_20251118.tar.gz -C /
```

## 업데이트

```bash
# 백업 먼저 수행
./backup.sh

# 새 버전 다운로드
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u absolute_user -p absolute_tunnel < database/migrations/v1.1.0.sql

# 캐시 클리어
php -r "opcache_reset();"

# 권한 재설정
chmod 755 /var/www/html/absolute-tunnel/logs
```

## 지원

문제가 발생하면 다음을 확인하세요:

1. 시스템 요구사항 충족 여부
2. 로그 파일 확인
3. Moodle 웹 서비스 설정
4. 데이터베이스 연결

추가 도움이 필요하면 이슈를 등록해주세요.
