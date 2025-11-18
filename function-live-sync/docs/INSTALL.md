# Function Live Sync - 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 파일 복사

```bash
# 웹 서버 디렉토리로 이동
cd /var/www/html

# 또는 사용자 홈 디렉토리
cd ~/public_html

# Function Live Sync 복사
cp -r /path/to/function-live-sync .
cd function-live-sync
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE function_live_sync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항)
CREATE USER 'flsync'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON function_live_sync.* TO 'flsync'@'localhost';
FLUSH PRIVILEGES;
exit;

# 스키마 import
mysql -u root -p function_live_sync < database/schema.sql
```

### 3단계: 설정 파일 수정

```bash
# 백엔드 설정 파일 편집
nano backend/api/config.php
```

다음 부분을 수정:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_live_sync');
define('DB_USER', 'root');        // 또는 'flsync'
define('DB_PASS', 'your_password');
```

### 4단계: 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 부여
mkdir -p logs
chmod 755 logs

# 웹 서버 사용자에게 쓰기 권한 부여
sudo chown -R www-data:www-data logs
# 또는 nginx의 경우
sudo chown -R nginx:nginx logs
```

### 5단계: 웹 서버 설정

#### Apache 사용 시

```bash
# .htaccess 생성 (frontend/)
cat > frontend/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /function-live-sync/frontend/

    # API 요청을 backend로 전달
    RewriteRule ^api/(.*)$ ../backend/api/$1 [L,QSA]
</IfModule>

# CORS 헤더 (개발용)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
EOF

# Apache 재시작
sudo service apache2 restart
```

#### Nginx 사용 시

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/function-live-sync

# 다음 내용 입력:
server {
    listen 80;
    server_name your-domain.com;  # 도메인 변경
    root /var/www/html/function-live-sync/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /var/www/html/function-live-sync/backend/api;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}

# 설정 활성화
sudo ln -s /etc/nginx/sites-available/function-live-sync /etc/nginx/sites-enabled/

# Nginx 재시작
sudo nginx -t
sudo service nginx restart
```

### 6단계: 테스트

브라우저에서 접속:
```
http://localhost/function-live-sync/frontend/
```

또는
```
http://your-domain.com
```

---

## 상세 설치 (Detailed Installation)

### LAMP Stack 설치 (Ubuntu/Debian)

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Apache 설치
sudo apt install apache2 -y

# MySQL 5.7 설치
sudo apt install mysql-server-5.7 -y

# PHP 7.1 및 확장 모듈 설치
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php7.1 php7.1-mysql php7.1-json php7.1-mbstring -y

# Apache 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo service apache2 restart

# MySQL 보안 설정
sudo mysql_secure_installation
```

### CentOS/RHEL

```bash
# Apache 설치
sudo yum install httpd -y
sudo systemctl start httpd
sudo systemctl enable httpd

# MySQL 5.7 설치
wget https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
sudo rpm -ivh mysql57-community-release-el7-11.noarch.rpm
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld

# PHP 7.1 설치
sudo yum install epel-release yum-utils -y
sudo yum install http://rpms.remirepo.net/enterprise/remi-release-7.rpm -y
sudo yum-config-manager --enable remi-php71
sudo yum install php php-mysql php-json php-mbstring -y

# 재시작
sudo systemctl restart httpd
```

---

## Moodle 연동 설정

### 1. Moodle 모듈 설치 (선택사항)

```bash
# Moodle 플러그인 디렉토리로 이동
cd /path/to/moodle/mod/

# Function Live Sync 모듈 복사 (향후 제공)
# cp -r /path/to/function-live-sync/backend/moodle/mod_functionsync .

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

### 2. Moodle 임베드 방식

Moodle 활동/리소스에서 HTML 편집:

```html
<iframe
    src="http://your-domain.com/function-live-sync/frontend/?problem_id=1&student_id={$USER->id}"
    width="100%"
    height="800"
    frameborder="0"
    style="border: 1px solid #ddd; border-radius: 8px;">
</iframe>
```

### 3. Moodle API 연동

`backend/api/config.php`에 Moodle 설정 추가:

```php
// Moodle 설정
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token');
define('MOODLE_ENABLED', true);
```

---

## 프로덕션 환경 설정

### 1. 보안 설정

```php
// backend/api/config.php 수정

// 에러 표시 끄기
error_reporting(0);
ini_set('display_errors', 0);

// CORS를 특정 도메인만 허용
header('Access-Control-Allow-Origin: https://your-moodle-site.com');

// HTTPS 강제
if ($_SERVER['HTTPS'] !== 'on') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit();
}
```

### 2. SSL 인증서 설정

```bash
# Let's Encrypt 사용
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d your-domain.com
```

### 3. 성능 최적화

```bash
# PHP OPcache 활성화
sudo nano /etc/php/7.1/apache2/php.ini

# 다음 설정 추가/수정:
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60

# Apache 재시작
sudo service apache2 restart
```

### 4. 데이터베이스 백업 자동화

```bash
# 백업 스크립트 생성
cat > ~/backup_flsync.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/function-live-sync"
mkdir -p $BACKUP_DIR

mysqldump -u root -p'your_password' function_live_sync > $BACKUP_DIR/flsync_$DATE.sql
gzip $BACKUP_DIR/flsync_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x ~/backup_flsync.sh

# Cron 작업 추가 (매일 새벽 2시)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup_flsync.sh") | crontab -
```

---

## 문제 해결

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo service mysql status

# MySQL 재시작
sudo service mysql restart

# 로그 확인
sudo tail -f /var/log/mysql/error.log
```

### PHP 에러

```bash
# PHP 에러 로그 확인
sudo tail -f /var/log/apache2/error.log

# PHP 버전 확인
php -v

# PHP 모듈 확인
php -m | grep mysql
```

### 권한 문제

```bash
# 파일 소유권 확인
ls -la /var/www/html/function-live-sync

# 권한 수정
sudo chown -R www-data:www-data /var/www/html/function-live-sync
sudo chmod -R 755 /var/www/html/function-live-sync
sudo chmod -R 777 /var/www/html/function-live-sync/logs
```

### 브라우저에서 그래프가 표시되지 않음

1. 브라우저 콘솔(F12) 열기
2. Network 탭에서 API 요청 확인
3. Console 탭에서 JavaScript 오류 확인
4. `frontend/js/app.js`의 `apiBaseUrl` 경로 확인

---

## 개발 환경 설정

### 로컬 개발 서버 (PHP 내장 서버)

```bash
cd function-live-sync

# 백엔드 서버 (포트 8000)
cd backend && php -S localhost:8000 &

# 프론트엔드 서버 (포트 8080)
cd frontend && python3 -m http.server 8080 &

# 브라우저에서 접속
# http://localhost:8080
```

`frontend/js/app.js` 수정:
```javascript
this.config = {
    apiBaseUrl: 'http://localhost:8000/api',  // 개발 서버 URL
    // ...
};
```

### Docker 사용 (선택사항)

```bash
# Dockerfile 생성
cat > Dockerfile << 'EOF'
FROM php:7.1-apache

RUN docker-php-ext-install pdo pdo_mysql mysqli

COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
EOF

# Docker Compose 설정
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html
  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: function_live_sync
    ports:
      - "3306:3306"
EOF

# 실행
docker-compose up -d
```

---

## 다음 단계

1. ✅ 설치 완료 확인
2. 📊 샘플 데이터로 테스트
3. 🎨 디자인 커스터마이징
4. 🔌 Moodle 연동 설정
5. 📈 실제 문제 데이터 입력

문제가 있으면 GitHub Issue를 등록해주세요!
