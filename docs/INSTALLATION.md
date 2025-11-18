# Change Wave 설치 가이드

## 시스템 요구사항

### 필수 소프트웨어

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (선택사항)

### 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 설치 단계

### 1. 프로젝트 다운로드

```bash
# Git 클론
git clone https://github.com/your-org/changewave.git
cd changewave

# 또는 ZIP 다운로드 후 압축 해제
unzip changewave.zip
cd changewave
```

### 2. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
mysql> CREATE DATABASE changewave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> CREATE USER 'changewave_user'@'localhost' IDENTIFIED BY 'your_secure_password';
mysql> GRANT SELECT, INSERT, UPDATE ON changewave.* TO 'changewave_user'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> exit;
```

#### 스키마 및 샘플 데이터 가져오기

```bash
mysql -u changewave_user -p changewave < api/db/schema.sql
```

#### 설정 확인

```bash
# MySQL 접속 테스트
mysql -u changewave_user -p changewave

mysql> SHOW TABLES;
# changewave_problems, changewave_learning_logs 등이 표시되어야 함

mysql> SELECT COUNT(*) FROM changewave_problems;
# 8 (샘플 문제 개수)

mysql> exit;
```

### 3. PHP 설정

#### config.php 편집

```bash
cd api
cp config.php config.php.backup
nano config.php
```

다음 값들을 환경에 맞게 수정:

```php
// Change Wave 데이터베이스
define('CHANGEWAVE_DB_HOST', 'localhost');
define('CHANGEWAVE_DB_NAME', 'changewave');
define('CHANGEWAVE_DB_USER', 'changewave_user');
define('CHANGEWAVE_DB_PASS', 'your_secure_password');

// Moodle 데이터베이스 (연동시에만 필요)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');

// 운영 환경에서는 DEBUG_MODE를 false로 설정
define('DEBUG_MODE', false);
```

#### PHP 확장 모듈 확인

필요한 PHP 확장이 설치되어 있는지 확인:

```bash
php -m | grep -E 'mysqli|json|session'
```

출력에 `mysqli`, `json`, `session`이 포함되어야 합니다.

### 4. 웹 서버 설정

#### Apache 설정

**가상 호스트 설정** (`/etc/apache2/sites-available/changewave.conf`):

```apache
<VirtualHost *:80>
    ServerName changewave.local
    DocumentRoot /var/www/changewave/public

    <Directory /var/www/changewave/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/changewave/api>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/changewave_error.log
    CustomLog ${APACHE_LOG_DIR}/changewave_access.log combined
</VirtualHost>
```

**활성화**:

```bash
sudo a2ensite changewave
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx 설정

**서버 블록 설정** (`/etc/nginx/sites-available/changewave`):

```nginx
server {
    listen 80;
    server_name changewave.local;

    root /var/www/changewave/public;
    index index.html index.php;

    # Public 디렉토리
    location / {
        try_files $uri $uri/ =404;
    }

    # API 디렉토리
    location /api {
        alias /var/www/changewave/api;
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    # 로그
    access_log /var/log/nginx/changewave_access.log;
    error_log /var/log/nginx/changewave_error.log;
}
```

**활성화**:

```bash
sudo ln -s /etc/nginx/sites-available/changewave /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 권한 설정

```bash
# 웹 서버 사용자 확인 (Apache: www-data, Nginx: nginx 또는 www-data)
WEB_USER=www-data

# 프로젝트 디렉토리 소유자 설정
sudo chown -R $WEB_USER:$WEB_USER /var/www/changewave

# 권한 설정
sudo chmod -R 755 /var/www/changewave
sudo chmod -R 775 /var/www/changewave/api
sudo chmod 644 /var/www/changewave/api/config.php
```

### 6. 로컬 호스트 설정 (개발 환경)

`/etc/hosts` 파일 편집:

```bash
sudo nano /etc/hosts
```

다음 줄 추가:

```
127.0.0.1   changewave.local
```

### 7. 설치 확인

#### API 테스트

```bash
# curl로 API 테스트
curl http://changewave.local/api/get_problem.php?id=1

# 예상 출력 (JSON):
# {
#     "success": true,
#     "data": {
#         "id": 1,
#         "title": "이차함수의 변화 관찰하기",
#         ...
#     }
# }
```

#### 브라우저 테스트

1. 브라우저에서 `http://changewave.local` 접속
2. 메인 페이지 로딩 확인
3. 우측 하단에 가상 스마트폰 화면 표시 확인
4. "재생" 버튼 클릭하여 파동 애니메이션 확인

#### 디버깅 (문제 발생시)

```bash
# Apache 오류 로그 확인
sudo tail -f /var/log/apache2/changewave_error.log

# Nginx 오류 로그 확인
sudo tail -f /var/log/nginx/changewave_error.log

# PHP 오류 로그 확인
sudo tail -f /var/log/php7.1-fpm.log

# Change Wave API 오류 로그 확인
tail -f /var/www/changewave/api/error.log
```

## Moodle 연동 (선택사항)

### 1. Moodle 데이터베이스 접근 권한 부여

```bash
mysql -u root -p

# Change Wave 사용자에게 Moodle DB 읽기 권한 부여
mysql> GRANT SELECT ON moodle.* TO 'changewave_user'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> exit;
```

### 2. config.php에서 Moodle 연동 활성화

```php
// Moodle 데이터베이스 정보 입력
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'changewave_user');
define('MOODLE_DB_PASS', 'your_password');
define('MOODLE_TABLE_PREFIX', 'mdl_');
```

### 3. Moodle 퀴즈와 Change Wave 문제 연동

```sql
-- Change Wave 문제에 Moodle 퀴즈 ID 연결
UPDATE changewave_problems
SET moodle_quiz_id = 123
WHERE id = 1;
```

### 4. Moodle에서 Change Wave 링크 생성

Moodle 퀴즈 또는 코스에 다음 URL 추가:

```
http://changewave.local/public/index.html?problem=1
```

## 프로덕션 배포

### 1. 보안 설정

#### HTTPS 설정 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d changewave.yourdomain.com
```

#### config.php 보안 강화

```php
// DEBUG_MODE 비활성화
define('DEBUG_MODE', false);

// 오류 표시 비활성화
error_reporting(0);
ini_set('display_errors', 0);
```

#### 파일 권한 강화

```bash
# config.php 읽기 전용
sudo chmod 400 /var/www/changewave/api/config.php

# API 디렉토리 쓰기 금지
sudo chmod -R 555 /var/www/changewave/api
```

### 2. 성능 최적화

#### PHP OPcache 활성화

`/etc/php/7.1/apache2/php.ini` 또는 `/etc/php/7.1/fpm/php.ini` 편집:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

#### MySQL 쿼리 캐시

`/etc/mysql/mysql.conf.d/mysqld.cnf` 편집:

```ini
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

#### Gzip 압축 (Apache)

```bash
sudo a2enmod deflate
```

Apache 설정에 추가:

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### 3. 모니터링 설정

#### 로그 로테이션

`/etc/logrotate.d/changewave` 파일 생성:

```
/var/log/apache2/changewave*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        /usr/sbin/apache2ctl graceful > /dev/null
    endscript
}
```

#### 모니터링 스크립트

```bash
#!/bin/bash
# /usr/local/bin/check_changewave.sh

# API 응답 확인
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://changewave.local/api/get_problem.php?id=1)

if [ $HTTP_CODE -ne 200 ]; then
    echo "Change Wave API 오류: HTTP $HTTP_CODE"
    # 알림 전송 (이메일, Slack 등)
fi
```

Cron 등록:

```bash
# 5분마다 체크
*/5 * * * * /usr/local/bin/check_changewave.sh
```

## 업데이트 방법

### Git으로 업데이트

```bash
cd /var/www/changewave
git pull origin main

# DB 스키마 변경사항 적용 (필요시)
mysql -u changewave_user -p changewave < api/db/migrations/v1.1.0.sql

# 캐시 클리어
sudo systemctl restart apache2
```

### 수동 업데이트

1. 백업 생성
2. 새 파일로 교체
3. config.php 설정 유지
4. DB 마이그레이션 실행

## 백업 및 복구

### 데이터베이스 백업

```bash
# 백업
mysqldump -u changewave_user -p changewave > backup_$(date +%Y%m%d).sql

# 복구
mysql -u changewave_user -p changewave < backup_20251118.sql
```

### 전체 백업

```bash
# 프로젝트 디렉토리 백업
tar -czf changewave_backup_$(date +%Y%m%d).tar.gz /var/www/changewave

# 복구
tar -xzf changewave_backup_20251118.tar.gz -C /var/www/
```

## 문제 해결

### 일반적인 오류

#### "Connection refused" 오류

**원인**: MySQL 서버 미실행

**해결**:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### "Access denied" 오류

**원인**: DB 권한 문제

**해결**:
```bash
mysql -u root -p
mysql> GRANT ALL PRIVILEGES ON changewave.* TO 'changewave_user'@'localhost';
mysql> FLUSH PRIVILEGES;
```

#### 빈 화면 표시

**원인**: PHP 오류

**해결**:
```bash
# 오류 로그 확인
tail -f /var/log/apache2/changewave_error.log

# PHP 오류 표시 임시 활성화 (config.php)
define('DEBUG_MODE', true);
```

## 지원

문제가 발생하면 다음 정보와 함께 이슈를 제출하세요:

- OS 버전
- PHP 버전 (`php -v`)
- MySQL 버전 (`mysql --version`)
- 오류 로그
- 재현 단계

## 다음 단계

- [Change Wave 기능 명세서](CHANGEWAVE.md)
- [API 문서](API.md)
- [사용자 가이드](USER_GUIDE.md)
