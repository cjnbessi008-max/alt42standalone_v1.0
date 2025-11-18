# 설치 가이드 (Installation Guide)

## 빠른 시작 (Quick Start)

### 1단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 테이블 생성
source database/schema.sql

# 테스트 사용자 생성 (선택사항)
CREATE USER 'shapeguide'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON shape_guide_lines.* TO 'shapeguide'@'localhost';
FLUSH PRIVILEGES;
```

### 2단계: PHP 설정

```bash
# API 설정 파일 편집
cd api
cp config.php config.php.backup
nano config.php
```

`config.php` 파일에서 다음 내용 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_guide_lines');
define('DB_USER', 'shapeguide');
define('DB_PASS', 'your_password');
```

### 3단계: 웹 서버 설정

#### Apache

```bash
# Apache 가상 호스트 설정
sudo nano /etc/apache2/sites-available/shapeguide.conf
```

다음 내용 추가:

```apache
<VirtualHost *:80>
    ServerName shapeguide.local
    DocumentRoot /home/user/alt42standalone_v1.0/public

    <Directory /home/user/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /home/user/alt42standalone_v1.0/api
    <Directory /home/user/alt42standalone_v1.0/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 실행 허용
        <FilesMatch "\.php$">
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/shapeguide_error.log
    CustomLog ${APACHE_LOG_DIR}/shapeguide_access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite shapeguide.conf
sudo systemctl reload apache2
```

#### Nginx

```bash
sudo nano /etc/nginx/sites-available/shapeguide
```

다음 내용 추가:

```nginx
server {
    listen 80;
    server_name shapeguide.local;

    root /home/user/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /home/user/alt42standalone_v1.0/api;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    error_log /var/log/nginx/shapeguide_error.log;
    access_log /var/log/nginx/shapeguide_access.log;
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/shapeguide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4단계: 호스트 파일 설정 (로컬 개발용)

```bash
sudo nano /etc/hosts
```

다음 줄 추가:

```
127.0.0.1  shapeguide.local
```

### 5단계: 파일 권한 설정

```bash
cd /home/user/alt42standalone_v1.0

# 웹 서버가 읽을 수 있도록 권한 설정
sudo chown -R www-data:www-data public api
sudo chmod -R 755 public api

# 로그 디렉토리 생성 (필요시)
mkdir -p logs
sudo chown www-data:www-data logs
sudo chmod 755 logs
```

### 6단계: 테스트

```bash
# 브라우저에서 접속
http://shapeguide.local

# 또는 PHP 내장 서버로 테스트 (개발용)
cd public
php -S localhost:8000
```

## Moodle 통합 설치

### 1단계: Moodle 모듈 복사

```bash
# Moodle 설치 경로 확인
cd /path/to/moodle

# shapeguide 모듈 복사
cp -r /home/user/alt42standalone_v1.0/moodle/mod/shapeguide ./mod/

# 권한 설정
sudo chown -R www-data:www-data mod/shapeguide
sudo chmod -R 755 mod/shapeguide
```

### 2단계: Moodle 데이터베이스 업데이트

1. Moodle 관리자로 로그인
2. `Site administration > Notifications` 접속
3. "Upgrade Moodle database now" 클릭
4. shapeguide 플러그인이 설치되었는지 확인

### 3단계: 웹앱 경로 설정

`moodle/mod/shapeguide/view.php` 파일 수정:

```php
// 웹앱 경로를 실제 경로로 변경
$PAGE->requires->css('http://shapeguide.local/styles.css');
$PAGE->requires->js('http://shapeguide.local/shape-engine.js', true);
$PAGE->requires->js('http://shapeguide.local/app.js', true);

// iframe src도 변경
<iframe src="http://shapeguide.local/index.html?course_id=...">
```

### 4단계: Moodle에서 활동 추가

1. 코스 페이지로 이동
2. "Turn editing on" 클릭
3. "Add an activity or resource" 선택
4. "Shape Guide Lines Generator" 선택
5. 활동 설정 입력 후 저장

## PHP 확장 모듈 확인

필요한 PHP 확장 모듈:

```bash
# 설치된 모듈 확인
php -m | grep -E "pdo|mysql|json|mbstring"

# 없는 경우 설치 (Ubuntu/Debian)
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json

# 서비스 재시작
sudo systemctl restart apache2
# 또는
sudo systemctl restart php7.1-fpm
```

## 환경별 설정

### 개발 환경

```php
// api/config.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
define('DEBUG_MODE', true);
```

### 프로덕션 환경

```php
// api/config.php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/logs/php_errors.log');
define('DEBUG_MODE', false);

// CORS 설정 변경
define('ALLOWED_ORIGINS', 'https://yourdomain.com');
```

### HTTPS 설정

```bash
# Let's Encrypt SSL 인증서 설치
sudo apt-get install certbot python3-certbot-apache

# 인증서 발급
sudo certbot --apache -d shapeguide.yourdomain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 문제 해결

### MySQL 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 포트 확인
sudo netstat -tlnp | grep 3306

# 사용자 권한 확인
mysql -u shapeguide -p
SHOW GRANTS;
```

### PHP 오류

```bash
# PHP 오류 로그 확인
sudo tail -f /var/log/apache2/error.log
# 또는
sudo tail -f /var/log/php7.1-fpm.log
```

### 파일 업로드 제한

```bash
# php.ini 편집
sudo nano /etc/php/7.1/apache2/php.ini

# 다음 값 변경
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 300

# Apache 재시작
sudo systemctl restart apache2
```

### CORS 오류

`api/config.php`에서 CORS 헤더 확인:

```php
function setCORSHeaders() {
    header('Access-Control-Allow-Origin: *'); // 또는 특정 도메인
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
```

## 성능 최적화

### MySQL 인덱스 확인

```sql
USE shape_guide_lines;
SHOW INDEX FROM shapes;
SHOW INDEX FROM guide_lines;
```

### PHP OPcache 활성화

```bash
# php.ini 편집
sudo nano /etc/php/7.1/apache2/php.ini

# OPcache 설정
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

### Gzip 압축 활성화 (Apache)

```bash
sudo a2enmod deflate
sudo systemctl restart apache2
```

`.htaccess` 파일에 추가:

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

## 백업 스크립트

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/shapeguide"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업
mysqldump -u root -p shape_guide_lines > "$BACKUP_DIR/db_$DATE.sql"

# 파일 백업
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /home/user/alt42standalone_v1.0

echo "Backup completed: $DATE"
```

## 업데이트

새 버전으로 업데이트:

```bash
# 백업 먼저!
./backup.sh

# Git으로 업데이트
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u root -p shape_guide_lines < database/migrations/update_v1.1.sql

# 캐시 클리어
sudo systemctl restart apache2
```

---

설치 중 문제가 발생하면 이슈를 등록해주세요!
