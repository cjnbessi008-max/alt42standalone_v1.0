# 설치 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 단계](#설치-단계)
3. [Moodle 플러그인 설치](#moodle-플러그인-설치)
4. [테스트](#테스트)
5. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 서버 환경
- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ (mod_rewrite 활성화) 또는 Nginx 1.14+
- **PHP**: 7.1.9 ~ 7.4 (Moodle 3.7 호환)
- **MySQL**: 5.7 또는 MariaDB 10.2+
- **메모리**: 최소 2GB RAM (권장 4GB+)
- **디스크**: 최소 500MB 여유 공간

### 클라이언트 환경
- **브라우저**:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **WebGL 지원** 필수
- **JavaScript 활성화** 필수
- **해상도**: 최소 1280x720

---

## 설치 단계

### Step 1: 소스 코드 다운로드

```bash
# Git으로 클론
git clone https://github.com/your-org/alt42standalone_v1.0.git

# 또는 ZIP 파일 다운로드 후 압축 해제
unzip alt42standalone_v1.0.zip

# 웹 서버 디렉토리로 이동
sudo mv alt42standalone_v1.0 /var/www/html/
cd /var/www/html/alt42standalone_v1.0
```

### Step 2: 데이터베이스 설정

#### 2.1 MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 또는 특정 호스트로 접속
mysql -h localhost -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (보안을 위해 강력한 비밀번호 사용)
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'Strong_Password_123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 연결 확인
USE moodle;
SELECT DATABASE();
```

#### 2.2 테이블 생성

```bash
# SQL 스크립트 실행
mysql -u moodle_user -p moodle < src/php/database-setup.sql

# 또는 MySQL 내부에서
mysql> USE moodle;
mysql> SOURCE /var/www/html/alt42standalone_v1.0/src/php/database-setup.sql;
```

#### 2.3 테이블 생성 확인

```sql
-- 생성된 테이블 확인
SHOW TABLES LIKE 'mdl_question_3dshape%';

-- 샘플 데이터 확인
SELECT * FROM mdl_question_3dshape_metadata;
```

### Step 3: PHP 설정

#### 3.1 데이터베이스 연결 정보 수정

```bash
# 설정 파일 수정
nano src/php/moodle-api.php
```

다음 부분을 실제 환경에 맞게 수정:

```php
define('DB_HOST', 'localhost');        // DB 호스트
define('DB_NAME', 'moodle');           // DB 이름
define('DB_USER', 'moodle_user');      // DB 사용자
define('DB_PASS', 'Strong_Password_123!'); // DB 비밀번호
define('DB_CHARSET', 'utf8mb4');       // 문자셋
```

#### 3.2 PHP 확장 모듈 확인

```bash
# 필수 PHP 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json|mbstring'

# 없는 경우 설치 (Ubuntu/Debian)
sudo apt-get install php7.1-mysql php7.1-json php7.1-mbstring

# CentOS/RHEL
sudo yum install php71-php-mysqlnd php71-php-json php71-php-mbstring
```

### Step 4: 웹 서버 설정

#### Apache 설정

```bash
# 가상 호스트 설정 파일 생성
sudo nano /etc/apache2/sites-available/3dshape-app.conf
```

```apache
<VirtualHost *:80>
    ServerName 3dshape.yourdomain.com
    DocumentRoot /var/www/html/alt42standalone_v1.0

    <Directory /var/www/html/alt42standalone_v1.0>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 300

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/3dshape-error.log
    CustomLog ${APACHE_LOG_DIR}/3dshape-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite 3dshape-app.conf

# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

#### Nginx 설정

```bash
# 서버 블록 설정 파일 생성
sudo nano /etc/nginx/sites-available/3dshape-app
```

```nginx
server {
    listen 80;
    server_name 3dshape.yourdomain.com;
    root /var/www/html/alt42standalone_v1.0;
    index index.html;

    # 정적 파일 처리
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
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
        rewrite ^/api/(.*)$ /src/php/moodle-api.php?action=$1 last;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/3dshape-app /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### Step 5: 파일 권한 설정

```bash
# 소유자 변경
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0

# 권한 설정
sudo find /var/www/html/alt42standalone_v1.0 -type d -exec chmod 755 {} \;
sudo find /var/www/html/alt42standalone_v1.0 -type f -exec chmod 644 {} \;

# 로그 디렉토리 생성 (있는 경우)
mkdir -p /var/www/html/alt42standalone_v1.0/logs
sudo chmod 775 /var/www/html/alt42standalone_v1.0/logs
```

---

## Moodle 플러그인 설치

### Option 1: 독립 실행 모드 (현재 기본 설정)
별도의 Moodle 설치 없이 독립적으로 실행됩니다. 위의 설치 단계만으로 충분합니다.

### Option 2: Moodle 통합 모드

#### 2.1 Moodle 설정 파일 연결

```bash
# Moodle config.php 경로 확인
ls /var/www/html/moodle/config.php

# moodle-api.php 수정
nano src/php/moodle-api.php
```

다음 주석을 해제하고 경로 수정:

```php
// Moodle 설정 파일 로드
require_once('/var/www/html/moodle/config.php');
require_once($CFG->libdir . '/accesslib.php');
```

#### 2.2 Moodle 플러그인 디렉토리에 복사

```bash
# 커스텀 question type 플러그인으로 설치
sudo mkdir -p /var/www/html/moodle/question/type/3dshape
sudo cp -r src/php/* /var/www/html/moodle/question/type/3dshape/

# Moodle 관리자 페이지에서 플러그인 활성화
# http://yourmoodle.com/admin/
```

---

## 테스트

### 1. 데이터베이스 연결 테스트

```bash
curl http://localhost/alt42standalone_v1.0/src/php/moodle-api.php?action=check_connection
```

예상 출력:
```json
{
  "success": true,
  "moodle_version": "...",
  "php_version": "7.1.9",
  "message": "Moodle 연결 성공"
}
```

### 2. 문제 로드 테스트

```bash
curl http://localhost/alt42standalone_v1.0/src/php/moodle-api.php?action=get_problem&id=1
```

### 3. 프론트엔드 테스트

브라우저에서 접속:
```
http://localhost/alt42standalone_v1.0/
```

확인 사항:
- [ ] 스마트폰 화면이 표시되는가?
- [ ] 3D 도형이 렌더링되는가?
- [ ] Inner View 버튼이 작동하는가?
- [ ] 투명도 슬라이더가 작동하는가?
- [ ] 마우스로 도형을 회전할 수 있는가?

---

## 문제 해결

### PHP 에러 확인

```bash
# Apache 에러 로그
sudo tail -f /var/log/apache2/error.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# PHP-FPM 로그
sudo tail -f /var/log/php7.1-fpm.log
```

### 데이터베이스 연결 실패

```sql
-- MySQL 사용자 권한 확인
SELECT User, Host FROM mysql.user WHERE User = 'moodle_user';
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 연결 테스트
mysql -u moodle_user -p -h localhost moodle
```

### WebGL 오류

브라우저 콘솔(F12)에서 확인:
```javascript
// WebGL 지원 확인
console.log(!!window.WebGLRenderingContext);

// Three.js 로드 확인
console.log(typeof THREE);
```

### CORS 문제

`src/php/moodle-api.php` 파일 상단에 추가:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

## 추가 설정

### SSL/HTTPS 설정 (권장)

```bash
# Let's Encrypt 인증서 설치
sudo apt-get install certbot python3-certbot-apache

# 인증서 발급
sudo certbot --apache -d 3dshape.yourdomain.com
```

### 성능 최적화

```bash
# PHP OpCache 활성화
sudo nano /etc/php/7.1/apache2/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

### 백업 설정

```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
mysqldump -u moodle_user -p moodle > /backup/moodle_$(date +%Y%m%d).sql

# crontab 등록 (매일 새벽 2시)
0 2 * * * /path/to/backup-script.sh
```

---

## 지원

설치 관련 문의: support@yourdomain.com

문서 버전: 1.0.0
최종 업데이트: 2025-11-18
