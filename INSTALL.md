# 설치 가이드

Moodle 문제 자동 표시 시스템의 상세 설치 가이드입니다.

## 1. 사전 준비

### 시스템 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# 필요한 PHP 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json|mbstring'
```

필요한 PHP 확장이 없다면 설치:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json

# CentOS/RHEL
sudo yum install php71-php-mysqlnd php71-php-mbstring php71-php-json
```

## 2. 프로젝트 설치

### 2.1 파일 다운로드

```bash
# Git으로 클론
git clone <repository-url> moodle-display
cd moodle-display
```

### 2.2 디렉토리 구조 확인

```bash
ls -la
# 다음 디렉토리들이 있어야 합니다:
# - config/
# - src/
# - public/
# - cache/ (없으면 생성)
```

### 2.3 캐시 디렉토리 생성

```bash
mkdir -p cache
chmod 755 cache

# 웹 서버 사용자에게 쓰기 권한 부여
sudo chown -R www-data:www-data cache  # Apache
# 또는
sudo chown -R nginx:nginx cache  # Nginx
```

## 3. 데이터베이스 설정

### 3.1 Moodle 데이터베이스 접근 확인

Moodle이 사용하는 데이터베이스 정보 확인:

```bash
# Moodle의 config.php 파일 확인
cat /path/to/moodle/config.php | grep -E 'dbhost|dbname|dbuser|dbpass'
```

### 3.2 읽기 전용 사용자 생성 (권장)

보안을 위해 읽기 전용 사용자를 만드는 것이 좋습니다:

```sql
-- MySQL에 로그인
mysql -u root -p

-- 읽기 전용 사용자 생성
CREATE USER 'moodle_readonly'@'localhost' IDENTIFIED BY 'secure_password';

-- SELECT 권한만 부여
GRANT SELECT ON moodle.mdl_question TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_quiz TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_slots TO 'moodle_readonly'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 연결 테스트
mysql -u moodle_readonly -p moodle -e "SELECT COUNT(*) FROM mdl_question;"
```

## 4. 환경 설정

### 4.1 환경 변수 파일 생성

```bash
cp config/.env.example config/.env
nano config/.env  # 또는 vim, vi 등 사용
```

### 4.2 환경 변수 설정

`.env` 파일 내용:

```ini
# Moodle 데이터베이스 연결 정보
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_readonly
MOODLE_DB_PASS=secure_password
```

### 4.3 파일 권한 설정

```bash
# 환경 파일 보호
chmod 600 config/.env

# PHP 파일 권한
find . -type f -name "*.php" -exec chmod 644 {} \;

# 디렉토리 권한
find . -type d -exec chmod 755 {} \;
```

## 5. 웹 서버 설정

### 5.1 Apache 설정

#### 가상 호스트 생성

```bash
sudo nano /etc/apache2/sites-available/moodle-display.conf
```

설정 내용:

```apache
<VirtualHost *:80>
    ServerName moodle-display.example.com
    ServerAlias www.moodle-display.example.com

    DocumentRoot /var/www/moodle-display/public

    <Directory /var/www/moodle-display/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 설정
        php_flag display_errors Off
        php_value error_log /var/log/apache2/moodle-display-error.log
    </Directory>

    # 로그 파일
    ErrorLog ${APACHE_LOG_DIR}/moodle-display-error.log
    CustomLog ${APACHE_LOG_DIR}/moodle-display-access.log combined

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

#### 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite moodle-display.conf

# 필요한 모듈 활성화
sudo a2enmod rewrite headers

# Apache 재시작
sudo systemctl restart apache2
```

### 5.2 Nginx 설정

#### 서버 블록 생성

```bash
sudo nano /etc/nginx/sites-available/moodle-display
```

설정 내용:

```nginx
server {
    listen 80;
    server_name moodle-display.example.com;

    root /var/www/moodle-display/public;
    index index.php;

    # 로그 파일
    access_log /var/log/nginx/moodle-display-access.log;
    error_log /var/log/nginx/moodle-display-error.log;

    # Gzip 압축
    gzip on;
    gzip_types text/css application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # PHP 설정
        fastcgi_param PHP_VALUE "display_errors=Off";
    }

    # 정적 파일 캐싱
    location ~* \.(css|js|jpg|jpeg|png|gif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # .env 파일 접근 차단
    location ~ /\.env {
        deny all;
    }

    # 숨김 파일 접근 차단
    location ~ /\. {
        deny all;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/moodle-display /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 6. 연결 테스트

### 6.1 명령줄 테스트

```bash
# PHP 스크립트로 연결 테스트
cd /var/www/moodle-display
php -r "
require 'config/config.php';
require 'src/autoload.php';
use MoodleIntegration\Database\Connection;
try {
    \$db = Connection::getInstance(require 'config/config.php');
    echo 'Database connection successful!' . PHP_EOL;
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . PHP_EOL;
}
"
```

### 6.2 웹 브라우저 테스트

1. 브라우저에서 접속:
   ```
   http://moodle-display.example.com
   ```

2. 정상 작동 확인:
   - 문제 목록이 표시되는지 확인
   - 카테고리 필터가 작동하는지 확인
   - 페이지네이션이 작동하는지 확인

### 6.3 API 테스트

```bash
# 문제 목록 조회
curl "http://moodle-display.example.com/api.php?action=questions&page=1"

# 카테고리 목록 조회
curl "http://moodle-display.example.com/api.php?action=categories"
```

## 7. 문제 해결

### 7.1 일반적인 오류

#### "Database connection failed"

**원인**: 데이터베이스 연결 정보 오류

**해결**:
```bash
# .env 파일 확인
cat config/.env

# MySQL 연결 테스트
mysql -h localhost -u moodle_readonly -p moodle
```

#### "Permission denied" (캐시 쓰기 오류)

**원인**: 캐시 디렉토리 권한 문제

**해결**:
```bash
sudo chown -R www-data:www-data cache
chmod 755 cache
```

#### "Class not found" 오류

**원인**: 오토로더 경로 문제

**해결**:
```bash
# 파일 구조 확인
ls -la src/
ls -la src/Database/
ls -la src/Services/
```

### 7.2 디버그 모드

개발 중에는 에러를 확인하기 위해 디버그 모드를 활성화할 수 있습니다:

`public/index.php` 상단에:

```php
// 개발 환경에서만 사용
error_reporting(E_ALL);
ini_set('display_errors', '1');
```

## 8. 보안 체크리스트

설치 후 다음 사항을 확인하세요:

- [ ] `.env` 파일 권한이 600인지 확인
- [ ] 웹에서 `.env` 파일 접근이 차단되는지 확인
- [ ] 프로덕션에서 `display_errors = Off`인지 확인
- [ ] 데이터베이스 사용자가 SELECT 권한만 가지는지 확인
- [ ] HTTPS 설정 (Let's Encrypt 등)
- [ ] 정기적인 캐시 정리 cron 설정

## 9. 성능 최적화

### 9.1 PHP OpCache 활성화

```bash
# php.ini 편집
sudo nano /etc/php/7.1/apache2/php.ini
```

다음 설정 추가:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### 9.2 Cron으로 캐시 정리

```bash
# Crontab 편집
crontab -e

# 매일 새벽 3시에 캐시 정리
0 3 * * * find /var/www/moodle-display/cache -type f -name "*.cache" -mtime +1 -delete
```

## 10. 백업

정기적인 백업을 설정하세요:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/moodle-display"
DATE=$(date +%Y%m%d)

# 설정 파일 백업
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" config/

# 로그 백업 (선택사항)
tar -czf "$BACKUP_DIR/logs-$DATE.tar.gz" /var/log/*/moodle-display*

# 30일 이상 된 백업 삭제
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

---

설치 완료! 문제가 있으면 README.md의 문제 해결 섹션을 참조하세요.
