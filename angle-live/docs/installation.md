# Angle Live - 상세 설치 가이드

이 문서는 Angle Live 애플리케이션의 상세한 설치 및 구성 방법을 설명합니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설치](#데이터베이스-설치)
4. [백엔드 설치](#백엔드-설치)
5. [프론트엔드 설치](#프론트엔드-설치)
6. [Moodle 연동](#moodle-연동)
7. [테스트](#테스트)
8. [운영 환경 배포](#운영-환경-배포)

## 시스템 요구사항

### 최소 요구사항

- **운영체제**: Linux (Ubuntu 18.04+), Windows Server 2016+, macOS 10.14+
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 - 7.4 (PHP 8.0+는 테스트되지 않음)
- **MySQL**: 5.7+
- **디스크 공간**: 최소 500MB
- **메모리**: 최소 512MB RAM

### 권장 사양

- **PHP**: 7.3 이상
- **MySQL**: 5.7.22 이상
- **메모리**: 1GB+ RAM
- **디스크**: 1GB+ 여유 공간

### PHP 확장 모듈

다음 PHP 확장이 필요합니다:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-json php7.1-mbstring php7.1-xml

# CentOS/RHEL
sudo yum install php71-mysql php71-json php71-mbstring php71-xml
```

## 환경 설정

### 1. PHP 설정

`php.ini` 파일 수정:

```ini
# 메모리 제한
memory_limit = 256M

# 최대 실행 시간
max_execution_time = 300

# 파일 업로드 크기
upload_max_filesize = 20M
post_max_size = 20M

# 타임존 설정
date.timezone = Asia/Seoul

# 에러 표시 (개발 환경)
display_errors = On
error_reporting = E_ALL

# 에러 표시 (운영 환경)
display_errors = Off
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
log_errors = On
error_log = /var/log/php/error.log
```

### 2. Apache 설정

`/etc/apache2/sites-available/anglelive.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName anglelive.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/anglelive/frontend

    # 프론트엔드 디렉토리
    <Directory /var/www/anglelive/frontend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # URL Rewriting
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.html [QSA,L]
    </Directory>

    # 백엔드 API 별칭
    Alias /api /var/www/anglelive/backend

    <Directory /var/www/anglelive/backend>
        Options -Indexes
        AllowOverride None
        Require all granted

        # PHP 설정
        php_value upload_max_filesize 20M
        php_value post_max_size 20M
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/anglelive_error.log
    CustomLog ${APACHE_LOG_DIR}/anglelive_access.log combined

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite anglelive.conf
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

### 3. Nginx 설정 (대안)

`/etc/nginx/sites-available/anglelive` 생성:

```nginx
server {
    listen 80;
    server_name anglelive.yourdomain.com;

    root /var/www/anglelive/frontend;
    index index.html;

    # 로그
    access_log /var/log/nginx/anglelive_access.log;
    error_log /var/log/nginx/anglelive_error.log;

    # 프론트엔드
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /api {
        alias /var/www/anglelive/backend;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 정적 파일 캐싱
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/anglelive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 데이터베이스 설치

### 1. MySQL 서버 설치

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server-5.7

# CentOS/RHEL
sudo yum install mysql-community-server
```

### 2. MySQL 보안 설정

```bash
sudo mysql_secure_installation
```

### 3. 데이터베이스 및 사용자 생성

```bash
# MySQL에 root로 로그인
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE angle_live DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'anglelive_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON angle_live.* TO 'anglelive_user'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 4. 스키마 적용

```bash
# 프로젝트 디렉토리로 이동
cd /var/www/anglelive

# 스키마 적용
mysql -u anglelive_user -p angle_live < database/schema.sql
```

### 5. 데이터 확인

```bash
mysql -u anglelive_user -p angle_live
```

```sql
-- 테이블 확인
SHOW TABLES;

-- 각도 임계값 확인
SELECT * FROM angle_thresholds;

-- 종료
EXIT;
```

## 백엔드 설치

### 1. 파일 배치

```bash
# 디렉토리 생성
sudo mkdir -p /var/www/anglelive/backend

# 파일 복사
sudo cp -r angle-live/backend/* /var/www/anglelive/backend/

# 권한 설정
sudo chown -R www-data:www-data /var/www/anglelive/backend
sudo chmod -R 755 /var/www/anglelive/backend
```

### 2. 설정 파일 수정

`/var/www/anglelive/backend/config.php` 편집:

```php
<?php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'angle_live');
define('DB_USER', 'anglelive_user');
define('DB_PASS', 'secure_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정 (필요한 경우)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');

// 운영 환경 설정
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
ini_set('display_errors', 0);  // 운영 환경에서는 0으로 설정

// CORS 설정 (필요에 따라 조정)
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

### 3. API 테스트

```bash
# 상태 확인
curl http://anglelive.yourdomain.com/api/api.php?action=get_status

# 임계값 조회
curl http://anglelive.yourdomain.com/api/api.php?action=get_thresholds
```

## 프론트엔드 설치

### 1. 파일 배치

```bash
# 디렉토리 생성
sudo mkdir -p /var/www/anglelive/frontend

# 파일 복사
sudo cp -r angle-live/frontend/* /var/www/anglelive/frontend/

# 권한 설정
sudo chown -R www-data:www-data /var/www/anglelive/frontend
sudo chmod -R 755 /var/www/anglelive/frontend
```

### 2. 설정 파일 수정

`/var/www/anglelive/frontend/js/config.js` 편집:

```javascript
const CONFIG = {
    // API URL 수정
    API_BASE_URL: 'https://anglelive.yourdomain.com/api/api.php',

    // 운영 환경 설정
    DEBUG: false,  // 운영 환경에서는 false로 설정

    // 기타 설정은 유지
    // ...
};
```

### 3. 프론트엔드 테스트

브라우저에서 `http://anglelive.yourdomain.com` 접속하여 확인

## Moodle 연동

### 1. Moodle 모듈 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/moodle

# 모듈 디렉토리 생성
sudo mkdir -p mod/anglelive

# 파일 복사
sudo cp angle-live/moodle/* mod/anglelive/

# 권한 설정
sudo chown -R www-data:www-data mod/anglelive
```

### 2. Moodle 데이터베이스 테이블 생성

`mod/anglelive/db/install.xml` 생성:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="mod/anglelive/db" VERSION="20251118" COMMENT="XMLDB file for Angle Live module">
  <TABLES>
    <TABLE NAME="anglelive" COMMENT="Main Angle Live activity table">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="course" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
        <FIELD NAME="name" TYPE="char" LENGTH="255" NOTNULL="true"/>
        <FIELD NAME="intro" TYPE="text" NOTNULL="true"/>
        <FIELD NAME="introformat" TYPE="int" LENGTH="4" NOTNULL="true" DEFAULT="0"/>
        <FIELD NAME="grade" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="100"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
        <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="course" UNIQUE="false" FIELDS="course"/>
      </INDEXES>
    </TABLE>
  </TABLES>
</XMLDB>
```

### 3. Moodle 플러그인 활성화

1. Moodle 관리자로 로그인
2. `사이트 관리` > `알림` 메뉴 접속
3. "Angle Live" 플러그인 설치 확인 및 업그레이드 실행
4. 설치 완료

### 4. Moodle에서 사용하기

1. 코스에 들어가기
2. "활동 추가" 클릭
3. "Angle Live" 선택
4. 활동 이름 및 설정 입력
5. 저장

## 테스트

### 1. 기본 기능 테스트

```bash
# API 상태 확인
curl http://anglelive.yourdomain.com/api/api.php?action=get_status

# 각도 업데이트 테스트
curl -X POST http://anglelive.yourdomain.com/api/api.php?action=update_angle \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"session_id":"test-123","angle_value":45}'

# 진행 상황 조회
curl http://anglelive.yourdomain.com/api/api.php?action=get_progress&user_id=1
```

### 2. 브라우저 테스트

1. 프론트엔드 URL 접속
2. 슬라이더 조작하여 각도 변경
3. 메인 화면 시각화 확인
4. 스마트폰 화면 표시 확인
5. 브라우저 콘솔에서 에러 확인

### 3. Moodle 연동 테스트

1. Moodle 코스에 Angle Live 활동 생성
2. 학생 계정으로 로그인
3. 활동 접속 및 각도 조작
4. 관리자 계정으로 성적부 확인

## 운영 환경 배포

### 1. 보안 강화

#### HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache

# 인증서 발급
sudo certbot --apache -d anglelive.yourdomain.com
```

#### 파일 권한 강화

```bash
# 실행 권한 제거
sudo find /var/www/anglelive -type f -exec chmod 644 {} \;

# PHP 파일만 실행 가능하도록
sudo find /var/www/anglelive/backend -name "*.php" -exec chmod 755 {} \;

# 디렉토리 권한
sudo find /var/www/anglelive -type d -exec chmod 755 {} \;
```

### 2. 성능 최적화

#### PHP OpCache 활성화

`php.ini` 수정:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

#### MySQL 최적화

`/etc/mysql/my.cnf` 수정:

```ini
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_size = 64M
query_cache_limit = 2M
max_connections = 200
```

### 3. 모니터링 설정

#### 로그 로테이션

`/etc/logrotate.d/anglelive` 생성:

```
/var/log/apache2/anglelive_*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload apache2 > /dev/null
    endscript
}
```

### 4. 백업 설정

```bash
#!/bin/bash
# /usr/local/bin/backup-anglelive.sh

BACKUP_DIR="/backup/anglelive"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업
mysqldump -u anglelive_user -p'password' angle_live > "$BACKUP_DIR/db_$DATE.sql"

# 파일 백업
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/www/anglelive

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -type f -mtime +30 -delete
```

Cron 등록:

```bash
# crontab -e
0 2 * * * /usr/local/bin/backup-anglelive.sh
```

## 문제 해결

### 일반적인 문제

1. **500 Internal Server Error**
   - PHP 에러 로그 확인: `/var/log/php/error.log`
   - Apache 에러 로그 확인: `/var/log/apache2/error.log`

2. **Database Connection Error**
   - MySQL 서비스 상태 확인: `systemctl status mysql`
   - 데이터베이스 연결 정보 확인

3. **CORS 에러**
   - `config.php`에서 올바른 도메인 설정 확인
   - 웹 서버 헤더 설정 확인

## 지원

문제가 지속되면 로그 파일과 함께 이슈를 등록해 주세요.

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-18
