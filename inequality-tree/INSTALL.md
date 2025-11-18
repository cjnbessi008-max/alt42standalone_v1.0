# 📦 Inequality Tree - 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 선택적 요구사항
- **Moodle**: 3.7 이상 (LMS 연동 시)

## 설치 단계

### 1. 파일 다운로드 및 배치

```bash
# 웹 서버 루트 디렉토리로 이동
cd /var/www/html

# 프로젝트 복사 (또는 git clone)
cp -r /path/to/inequality-tree ./
cd inequality-tree

# 파일 권한 설정
chmod -R 755 .
chmod -R 777 api/  # PHP에서 쓰기 가능하도록
```

### 2. MySQL 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE inequality_tree_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'inequality_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON inequality_tree_db.* TO 'inequality_user'@'localhost';
FLUSH PRIVILEGES;

-- 연결 종료
EXIT;
```

```bash
# 스키마 적용
mysql -u inequality_user -p inequality_tree_db < sql/schema.sql
```

### 3. PHP 설정 파일 구성

```bash
# 설정 파일 복사
cd api
cp config.sample.php config.php

# 설정 파일 편집
nano config.php
```

`config.php` 파일을 다음과 같이 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'inequality_tree_db');
define('DB_USER', 'inequality_user');       // ← 생성한 사용자명
define('DB_PASS', 'your_password');         // ← 설정한 비밀번호
```

### 4. 웹 서버 설정

#### Apache 설정

```bash
# Apache 설정 파일 편집
sudo nano /etc/apache2/sites-available/inequality-tree.conf
```

```apache
<VirtualHost *:80>
    ServerName inequality-tree.local
    DocumentRoot /var/www/html/inequality-tree

    <Directory /var/www/html/inequality-tree>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/inequality-tree-error.log
    CustomLog ${APACHE_LOG_DIR}/inequality-tree-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite inequality-tree
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx 설정

```bash
# Nginx 설정 파일 편집
sudo nano /etc/nginx/sites-available/inequality-tree
```

```nginx
server {
    listen 80;
    server_name inequality-tree.local;
    root /var/www/html/inequality-tree;
    index index.html index.php;

    # 로깅
    access_log /var/log/nginx/inequality-tree-access.log;
    error_log /var/log/nginx/inequality-tree-error.log;

    # 정적 파일
    location ~* \.(css|js|jpg|jpeg|png|gif|svg|ico)$ {
        expires 1M;
        access_log off;
        add_header Cache-Control "public";
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # API 라우팅
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # 디렉토리 브라우징 금지
    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# 심볼릭 링크 생성 및 재시작
sudo ln -s /etc/nginx/sites-available/inequality-tree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. PHP 확장 모듈 확인

```bash
# PDO MySQL 확장 설치 (없는 경우)
sudo apt-get install php7.1-mysql php7.1-pdo

# PHP-FPM 재시작
sudo systemctl restart php7.1-fpm
```

### 6. 데이터베이스 연결 테스트

```bash
# 테스트 스크립트 실행
php -r "
\$pdo = new PDO('mysql:host=localhost;dbname=inequality_tree_db', 'inequality_user', 'your_password');
echo 'Database connection successful!';
"
```

### 7. 웹 브라우저에서 접속

```
http://localhost/inequality-tree/
또는
http://inequality-tree.local/
```

## Moodle 연동 (선택적)

### 1. Moodle 데이터베이스 정보 확인

Moodle 설정 파일 확인:
```bash
cat /path/to/moodle/config.php
```

### 2. Inequality Tree config.php 업데이트

```php
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');          // Moodle DB 이름
define('MOODLE_DB_USER', 'moodle_user');     // Moodle DB 사용자
define('MOODLE_DB_PASS', 'moodle_password'); // Moodle DB 비밀번호
```

### 3. Moodle에 임베드

Moodle 활동 추가 → HTML 블록:

```html
<iframe
  src="http://your-server/inequality-tree/?user_id={{user_id}}&question_id={{question_id}}"
  width="100%"
  height="850px"
  style="border: none; border-radius: 12px;">
</iframe>
```

## 문제 해결

### 문제 1: "Database connection failed"

**해결책**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# config.php 설정 재확인
nano api/config.php

# MySQL 사용자 권한 확인
mysql -u root -p
SHOW GRANTS FOR 'inequality_user'@'localhost';
```

### 문제 2: "No such file or directory"

**해결책**:
```bash
# 파일 경로 확인
ls -la /var/www/html/inequality-tree/

# 심볼릭 링크 확인
readlink -f /var/www/html/inequality-tree
```

### 문제 3: PHP 파일이 다운로드됨

**해결책**:
```bash
# PHP-FPM 설치 확인
php -v
sudo systemctl status php7.1-fpm

# Apache의 경우 모듈 활성화
sudo a2enmod proxy_fcgi setenvif
sudo systemctl restart apache2
```

### 문제 4: CORS 오류

**해결책**:
`api/config.php`에서 CORS 헤더 확인:
```php
header('Access-Control-Allow-Origin: *');
```

## 성능 최적화

### 1. MySQL 쿼리 캐싱

```sql
-- my.cnf 편집
[mysqld]
query_cache_type = 1
query_cache_size = 64M
```

### 2. PHP OPcache 활성화

```bash
# php.ini 편집
sudo nano /etc/php/7.1/fpm/php.ini
```

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 3. Gzip 압축 (Apache)

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

## 보안 설정

### 1. SQL 인젝션 방지
- 이미 PDO prepared statements 사용 중 ✅

### 2. XSS 방지
- `htmlspecialchars()` 사용 중 ✅

### 3. HTTPS 설정 (프로덕션)

```bash
# Let's Encrypt SSL 인증서 발급
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

### 4. 파일 권한

```bash
# 프로덕션 권한 설정
chmod 644 index.html
chmod 644 css/*.css
chmod 644 js/*.js
chmod 600 api/config.php  # 중요!
chmod 755 api/*.php
```

## 업데이트

```bash
# 백업
cp -r /var/www/html/inequality-tree /backup/inequality-tree-$(date +%Y%m%d)

# 새 파일 복사
cp -r /new/inequality-tree/* /var/www/html/inequality-tree/

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u inequality_user -p inequality_tree_db < updates/migration-v1.1.sql

# 캐시 클리어
rm -rf /tmp/php-cache/*
sudo systemctl restart php7.1-fpm
```

## 제거

```bash
# 파일 삭제
sudo rm -rf /var/www/html/inequality-tree

# 데이터베이스 삭제
mysql -u root -p
DROP DATABASE inequality_tree_db;
DROP USER 'inequality_user'@'localhost';
EXIT;

# Apache/Nginx 설정 제거
sudo a2dissite inequality-tree
sudo rm /etc/apache2/sites-available/inequality-tree.conf
sudo systemctl restart apache2
```

## 지원

문제가 계속되면 다음 정보와 함께 문의하세요:
- OS 버전: `lsb_release -a`
- PHP 버전: `php -v`
- MySQL 버전: `mysql --version`
- 에러 로그: `/var/log/apache2/inequality-tree-error.log`
