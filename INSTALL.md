# 설치 및 설정 가이드

## 빠른 시작 (Quick Start)

### 1단계: 필수 요구사항 확인

```bash
# PHP 버전 확인
php -v
# PHP 7.1.9 이상 필요

# MySQL 버전 확인
mysql --version
# MySQL 5.7 이상 필요
```

### 2단계: 프로젝트 복사

```bash
# 웹 루트로 프로젝트 복사
sudo cp -r alt42standalone_v1.0 /var/www/html/
cd /var/www/html/alt42standalone_v1.0
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 임포트
mysql -u moodle_user -p moodle < database/schema.sql
```

### 4단계: 설정 파일 수정

```bash
# config.php 편집
nano config/config.php
```

다음 내용 수정:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_secure_password');  // ← 변경
define('DB_NAME', 'moodle');
```

프로덕션 환경인 경우:

```php
define('APP_ENV', 'production');  // 'development'에서 변경
```

### 5단계: 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs cache
chmod 755 logs cache

# 웹서버 사용자에게 권한 부여
sudo chown -R www-data:www-data logs cache

# 또는 nginx 사용 시
sudo chown -R nginx:nginx logs cache
```

### 6단계: 웹서버 설정

#### Apache 사용 시

```bash
# .htaccess 파일 생성
nano public/.htaccess
```

다음 내용 추가:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # CORS 헤더 (필요시)
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"

    # API 라우팅
    RewriteRule ^api/(.*)$ api/$1 [L]

    # 정적 파일은 그대로 서빙
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # 모든 요청을 index.html로
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value memory_limit 256M
php_value max_execution_time 60
```

Apache 가상 호스트 설정:

```bash
sudo nano /etc/apache2/sites-available/math-app.conf
```

```apache
<VirtualHost *:80>
    ServerName math-app.local
    ServerAlias www.math-app.local

    DocumentRoot /var/www/html/alt42standalone_v1.0/public

    <Directory /var/www/html/alt42standalone_v1.0/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # 로그 파일
    ErrorLog ${APACHE_LOG_DIR}/math-app-error.log
    CustomLog ${APACHE_LOG_DIR}/math-app-access.log combined

    # PHP-FPM (선택사항)
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite math-app.conf
sudo a2enmod rewrite headers proxy_fcgi
sudo systemctl reload apache2
```

#### Nginx 사용 시

```bash
sudo nano /etc/nginx/sites-available/math-app
```

```nginx
server {
    listen 80;
    server_name math-app.local www.math-app.local;

    root /var/www/html/alt42standalone_v1.0/public;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/math-app-access.log;
    error_log /var/log/nginx/math-app-error.log;

    # Gzip 압축
    gzip on;
    gzip_types text/css application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP 처리
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }

    # API 엔드포인트
    location /api {
        try_files $uri $uri/ /api/problems.php?$query_string;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 숨겨진 파일 차단
    location ~ /\. {
        deny all;
    }

    # config 디렉토리 차단
    location ~ ^/(config|database|logs|cache)/ {
        deny all;
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/math-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7단계: 로컬 호스트 파일 수정 (개발 환경)

```bash
sudo nano /etc/hosts
```

다음 줄 추가:

```
127.0.0.1   math-app.local
```

### 8단계: 테스트

브라우저에서 접속:

```
http://math-app.local/
```

또는 IP 주소로:

```
http://your-server-ip/
```

API 테스트:

```bash
curl http://math-app.local/api/problems.php?problem_id=1
```

## Moodle 연동 설정

### Moodle 3.7과 연동

1. **Moodle 데이터베이스 정보 확인**

```bash
# Moodle config.php 확인
cat /path/to/moodle/config.php | grep CFG
```

2. **동일한 데이터베이스 사용**

`config/config.php`에서 Moodle과 동일한 DB 설정 사용:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');  // Moodle과 동일
define('DB_USER', 'moodle');   // Moodle과 동일
define('DB_PASS', 'moodle_password');

define('MOODLE_PREFIX', 'mdl_');  // Moodle 테이블 프리픽스
```

3. **추가 테이블 생성**

Moodle DB에 커스텀 테이블 추가:

```bash
mysql -u moodle -p moodle < database/schema.sql
```

4. **Moodle에서 링크 생성**

Moodle 코스에 외부 도구로 추가:

- 관리 > 플러그인 > 활동 모듈 > 외부 도구
- URL: `http://math-app.local/?session_id={user_id}`

## 고급 설정

### SSL/HTTPS 설정

#### Let's Encrypt 사용

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d math-app.yourdomain.com
```

`config/config.php` 업데이트:

```php
define('SESSION_SECURE', true);  // HTTPS 사용 시
```

### 성능 최적화

#### PHP OPcache 활성화

```bash
sudo nano /etc/php/7.1/fpm/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

#### MySQL 쿼리 캐시

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

### 보안 강화

#### 1. 파일 권한 강화

```bash
# 읽기 전용으로 설정
chmod 644 config/config.php
chmod 644 database/schema.sql

# 디렉토리는 실행 권한 필요
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# PHP 파일은 실행 불필요
chmod 644 src/php/*.php public/api/*.php
```

#### 2. config.php 보호

```apache
# .htaccess에 추가
<FilesMatch "config\.php$">
    Require all denied
</FilesMatch>
```

#### 3. SQL Injection 방지

이미 prepared statements 사용 중 (`src/php/database.php`)

#### 4. XSS 방지

헤더 추가 (`.htaccess` 또는 nginx 설정):

```apache
Header set X-XSS-Protection "1; mode=block"
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
```

### 로깅 설정

```bash
# 로그 로테이션 설정
sudo nano /etc/logrotate.d/math-app
```

```
/var/www/html/alt42standalone_v1.0/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
}
```

## 문제 해결

### 오류: "Database connection failed"

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u moodle_user -p -h localhost moodle
```

### 오류: "Canvas not found"

JavaScript 파일 경로 확인:

```html
<!-- index.html에서 -->
<script src="../src/js/graphRenderer.js"></script>
<script src="../src/js/app.js"></script>
```

### 오류: "Permission denied" (logs/)

```bash
sudo chown -R www-data:www-data logs/
sudo chmod 755 logs/
```

### API 응답 없음

```bash
# PHP 오류 로그 확인
sudo tail -f /var/log/php7.1-fpm.log
sudo tail -f /var/log/apache2/error.log  # 또는
sudo tail -f /var/log/nginx/error.log

# 애플리케이션 로그 확인
tail -f logs/app.log
```

## 백업 및 복원

### 데이터베이스 백업

```bash
# 전체 백업
mysqldump -u moodle_user -p moodle > backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
mysqldump -u moodle_user -p moodle math_problems student_sessions > backup_custom.sql
```

### 복원

```bash
mysql -u moodle_user -p moodle < backup_20250101.sql
```

### 파일 백업

```bash
tar -czf math-app-backup-$(date +%Y%m%d).tar.gz \
    --exclude='logs/*' \
    --exclude='cache/*' \
    /var/www/html/alt42standalone_v1.0/
```

## 업그레이드

새 버전으로 업그레이드:

```bash
# 백업 먼저!
# 새 파일 복사
cp -r alt42standalone_v1.0_new/* /var/www/html/alt42standalone_v1.0/

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u moodle_user -p moodle < database/migrations/001_update.sql

# 캐시 클리어
rm -rf cache/*

# 웹서버 재시작
sudo systemctl reload apache2  # 또는 nginx
```

## 모니터링

### 시스템 리소스 모니터링

```bash
# 실시간 로그 모니터링
tail -f logs/app.log

# MySQL 프로세스
mysqladmin -u root -p processlist

# PHP-FPM 상태
sudo systemctl status php7.1-fpm
```

---

설치 중 문제가 발생하면 README.md의 "문제 해결" 섹션을 참조하세요.
