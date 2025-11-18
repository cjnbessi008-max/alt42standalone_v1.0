# 설치 가이드 (Installation Guide)

넓이 재조합기 앱의 상세 설치 가이드입니다.

## 빠른 설치 (Quick Installation)

### 1단계: 시스템 준비

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install apache2 mysql-server php7.1 php7.1-mysql php7.1-json

# CentOS/RHEL
sudo yum install httpd mysql-server php71w php71w-mysql php71w-json
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
sudo mysql -u root -p

# 데이터베이스 생성 및 사용자 설정
CREATE DATABASE area_recombination CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arearecom_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON area_recombination.* TO 'arearecom_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 임포트
mysql -u arearecom_user -p area_recombination < database/schema.sql
```

### 3단계: 파일 배포

```bash
# 프로젝트 복사
sudo cp -r alt42standalone_v1.0 /var/www/html/area-recom

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/area-recom
sudo chmod -R 755 /var/www/html/area-recom

# 로그 디렉토리
sudo mkdir -p /var/www/html/area-recom/logs
sudo chmod 777 /var/www/html/area-recom/logs
```

### 4단계: 설정 파일 수정

```bash
# 설정 파일 편집
sudo nano /var/www/html/area-recom/php/config.php
```

다음 항목들을 수정하세요:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'area_recombination');
define('DB_USER', 'arearecom_user');
define('DB_PASS', 'your_secure_password');

// Moodle 데이터베이스 (Moodle 사용 시)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
```

### 5단계: 웹 서버 설정

#### Apache 설정

```bash
# 가상 호스트 파일 생성
sudo nano /etc/apache2/sites-available/area-recom.conf
```

다음 내용을 추가:

```apache
<VirtualHost *:80>
    ServerName area-recom.example.com
    ServerAlias www.area-recom.example.com

    DocumentRoot /var/www/html/area-recom/public

    <Directory /var/www/html/area-recom/public>
        Options -Indexes +FollowSymLinks +MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 처리
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/area-recom-error.log
    CustomLog ${APACHE_LOG_DIR}/area-recom-access.log combined

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite area-recom
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

#### Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/area-recom
```

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name area-recom.example.com www.area-recom.example.com;
    root /var/www/html/area-recom/public;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/area-recom-access.log;
    error_log /var/log/nginx/area-recom-error.log;

    # Gzip 압축
    gzip on;
    gzip_types text/css application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /php/ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index api.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }

    location ~ /\.ht {
        deny all;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/area-recom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6단계: PHP 설정

```bash
sudo nano /etc/php/7.1/apache2/php.ini
# 또는 Nginx의 경우
sudo nano /etc/php/7.1/fpm/php.ini
```

다음 설정을 확인/수정:

```ini
upload_max_filesize = 20M
post_max_size = 20M
memory_limit = 256M
max_execution_time = 60
display_errors = Off
error_reporting = E_ALL & ~E_DEPRECATED & ~E_NOTICE
log_errors = On
error_log = /var/log/php_errors.log

# PDO MySQL 확장 활성화 확인
extension=pdo_mysql
```

### 7단계: 테스트

```bash
# 웹 브라우저에서 접속
http://area-recom.example.com

# 또는 로컬 테스트
http://localhost/area-recom?user_id=1&course_id=1
```

## Moodle 통합 설치

### 1단계: 파일 복사

```bash
# Moodle 플러그인 디렉토리로 복사
sudo cp -r moodle/mod/arearecom /path/to/moodle/mod/

# 앱 파일 복사
sudo mkdir -p /path/to/moodle/mod/arearecom/app
sudo cp -r public/* /path/to/moodle/mod/arearecom/app/
sudo cp -r php /path/to/moodle/mod/arearecom/app/

# 권한 설정
sudo chown -R www-data:www-data /path/to/moodle/mod/arearecom
sudo chmod -R 755 /path/to/moodle/mod/arearecom
```

### 2단계: Moodle 업그레이드

1. 웹 브라우저에서 Moodle 접속
2. 관리자로 로그인
3. Moodle이 자동으로 새 플러그인을 감지합니다
4. **사이트 관리 > 알림**으로 이동
5. **데이터베이스 업그레이드** 버튼 클릭
6. 설치 완료 확인

### 3단계: 플러그인 설정

1. **사이트 관리 > 플러그인 > 활동 모듈 > 넓이 재조합기**로 이동
2. 기본 설정 구성:
   - 기본 난이도
   - 기본 최대 시도 횟수
   - 기본 통과 점수

### 4단계: 첫 활동 만들기

1. 코스로 이동
2. **편집 모드 켜기**
3. **활동 또는 리소스 추가**
4. **넓이 재조합기** 선택
5. 설정 입력 후 저장

## Docker를 사용한 설치

### docker-compose.yml 생성

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: area_recombination
      MYSQL_USER: arearecom_user
      MYSQL_PASSWORD: userpassword
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  php:
    image: php:7.1-apache
    volumes:
      - ./:/var/www/html/
    ports:
      - "80:80"
    depends_on:
      - mysql
    environment:
      - DB_HOST=mysql
      - DB_NAME=area_recombination
      - DB_USER=arearecom_user
      - DB_PASS=userpassword

volumes:
  mysql_data:
```

### Docker 실행

```bash
# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

## 문제 해결

### PHP 확장 모듈 설치

```bash
# PDO MySQL 확장
sudo apt-get install php7.1-mysql

# JSON 확장
sudo apt-get install php7.1-json

# 설치 확인
php -m | grep -E 'pdo_mysql|json'

# Apache 재시작
sudo systemctl restart apache2
```

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u arearecom_user -p -h localhost area_recombination
```

### 권한 문제

```bash
# 소유자 설정
sudo chown -R www-data:www-data /var/www/html/area-recom

# 권한 설정
sudo find /var/www/html/area-recom -type d -exec chmod 755 {} \;
sudo find /var/www/html/area-recom -type f -exec chmod 644 {} \;

# 로그 디렉토리
sudo chmod 777 /var/www/html/area-recom/logs
```

### SELinux 문제 (CentOS/RHEL)

```bash
# SELinux 상태 확인
getenforce

# 임시로 비활성화 (테스트용)
sudo setenforce 0

# 영구 비활성화 (권장하지 않음)
sudo nano /etc/selinux/config
# SELINUX=disabled

# 또는 적절한 컨텍스트 설정
sudo chcon -R -t httpd_sys_content_t /var/www/html/area-recom
sudo chcon -R -t httpd_sys_rw_content_t /var/www/html/area-recom/logs
```

## 성능 튜닝

### MySQL 최적화

```sql
-- my.cnf 또는 my.ini 설정
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
max_connections = 100
```

### PHP OPcache 활성화

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
```

### Apache MPM 설정

```apache
<IfModule mpm_prefork_module>
    StartServers             5
    MinSpareServers          5
    MaxSpareServers         10
    MaxRequestWorkers      150
    MaxConnectionsPerChild   0
</IfModule>
```

## 보안 강화

### SSL/TLS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache

# SSL 인증서 발급
sudo certbot --apache -d area-recom.example.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

### 방화벽 설정

```bash
# UFW (Ubuntu)
sudo ufw allow 'Apache Full'
sudo ufw allow 22
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 데이터베이스 보안

```sql
-- 원격 root 로그인 비활성화
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- 익명 사용자 제거
DELETE FROM mysql.user WHERE User='';

-- 테스트 데이터베이스 제거
DROP DATABASE IF EXISTS test;

-- 권한 새로고침
FLUSH PRIVILEGES;
```

## 백업

### 데이터베이스 백업

```bash
# 백업 스크립트
#!/bin/bash
BACKUP_DIR="/backup/area-recom"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u arearecom_user -p area_recombination \
  > $BACKUP_DIR/area_recom_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### 파일 백업

```bash
# rsync를 사용한 백업
rsync -avz /var/www/html/area-recom /backup/area-recom-files/
```

## 모니터링

### 로그 모니터링

```bash
# Apache 로그 실시간 확인
tail -f /var/log/apache2/area-recom-error.log

# 애플리케이션 로그
tail -f /var/www/html/area-recom/logs/error.log

# MySQL 슬로우 쿼리 로그
tail -f /var/log/mysql/mysql-slow.log
```

### 상태 확인 스크립트

```bash
#!/bin/bash
# check-status.sh

# 웹 서버 확인
curl -s http://area-recom.example.com > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Web server is running"
else
    echo "✗ Web server is down"
fi

# MySQL 확인
mysqladmin -u arearecom_user -p ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ MySQL is running"
else
    echo "✗ MySQL is down"
fi
```

---

설치 과정에서 문제가 발생하면 로그 파일을 확인하고 README.md의 문제 해결 섹션을 참조하세요.
