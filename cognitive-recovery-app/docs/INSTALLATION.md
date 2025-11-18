# 설치 가이드

## 빠른 시작 (Quick Start)

### 1단계: 시스템 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# 필요한 PHP 확장 확인
php -m | grep -E 'pdo|pdo_mysql|json|curl'
```

### 2단계: 데이터베이스 설치

```bash
# MySQL 접속
mysql -u root -p

# 다음 SQL 실행
```

```sql
-- 데이터베이스 생성
CREATE DATABASE cognitive_recovery_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 전용 사용자 생성
CREATE USER 'cr_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON cognitive_recovery_db.* TO 'cr_user'@'localhost';
FLUSH PRIVILEGES;

-- 데이터베이스 선택
USE cognitive_recovery_db;

-- 스키마 임포트 (경로는 실제 위치로 변경)
SOURCE /path/to/cognitive-recovery-app/database/schema.sql;

-- 확인
SHOW TABLES;
```

### 3단계: 설정 파일 구성

```bash
cd /path/to/cognitive-recovery-app

# 샘플 설정 파일 복사
cp config.sample.ini config.ini

# 설정 파일 편집
nano config.ini
```

**최소 설정:**
```ini
[database]
db_host = localhost
db_name = cognitive_recovery_db
db_user = cr_user
db_password = SecurePassword123!

[application]
base_url = http://localhost/cognitive-recovery-app
debug_mode = true
```

### 4단계: 테스트

브라우저에서 접속:
```
http://localhost/cognitive-recovery-app/frontend/index.html
```

"학습 시작" 버튼을 클릭하여 정상 작동 확인.

---

## Moodle 연동 설정

### 1단계: Moodle Web Service 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 → 고급 기능**
   - "웹 서비스 활성화" 체크
   - 저장

3. **사이트 관리 → 서버 → 웹 서비스 → 프로토콜 관리**
   - REST 프로토콜 활성화

### 2단계: 외부 서비스 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
2. "서비스 추가" 클릭
3. 설정:
   - **이름**: Cognitive Recovery Service
   - **약식 이름**: cognitive_recovery
   - **활성화**: 예
   - **승인된 사용자만**: 아니오 (또는 예로 설정 후 사용자 추가)

4. "함수 추가" 클릭하여 다음 함수들 추가:
   ```
   core_webservice_get_site_info
   core_user_get_users_by_field
   core_course_get_courses
   core_enrol_get_users_courses
   core_course_get_contents
   ```

### 3단계: 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
2. "토큰 추가" 클릭
3. 설정:
   - **사용자**: 관리자 또는 전용 계정
   - **서비스**: Cognitive Recovery Service
   - **IP 제한**: (선택사항) 웹서버 IP
   - **유효 기간**: (선택사항) 무제한

4. 생성된 토큰 복사

### 4단계: 설정 파일 업데이트

```ini
[moodle]
moodle_url = http://your-moodle-site.com
moodle_token = d41d8cd98f00b204e9800998ecf8427e  # 실제 토큰으로 교체
```

### 5단계: 연결 테스트

```bash
# 테스트 스크립트 실행 (아래 참조)
php backend/test_moodle_connection.php
```

---

## Apache 설정

### .htaccess 생성

```apache
# /cognitive-recovery-app/.htaccess

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
php_value max_input_time 300

# 보안 헤더
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# CORS 설정 (Moodle과 다른 도메인인 경우)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# URL 재작성
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /cognitive-recovery-app/

    # API 요청 처리
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ backend/api/$1 [L]
</IfModule>

# 디렉토리 인덱스 비활성화
Options -Indexes

# 민감한 파일 접근 차단
<FilesMatch "\.(ini|sql|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Nginx 설정

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/cognitive-recovery-app;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/cognitive-recovery-access.log;
    error_log /var/log/nginx/cognitive-recovery-error.log;

    # 정적 파일 처리
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
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

    # CORS 헤더
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    # OPTIONS 요청 처리
    if ($request_method = OPTIONS) {
        return 204;
    }

    # 민감한 파일 차단
    location ~ \.(ini|sql|md)$ {
        deny all;
        return 404;
    }

    # API 별칭
    location /api/ {
        rewrite ^/api/(.*)$ /backend/api/$1 break;
    }
}
```

---

## 파일 권한 설정

```bash
# 소유권 설정
chown -R www-data:www-data /path/to/cognitive-recovery-app

# 디렉토리 권한
find /path/to/cognitive-recovery-app -type d -exec chmod 755 {} \;

# 파일 권한
find /path/to/cognitive-recovery-app -type f -exec chmod 644 {} \;

# 설정 파일 보호
chmod 600 /path/to/cognitive-recovery-app/config.ini

# 실행 권한 (필요시)
chmod 755 /path/to/cognitive-recovery-app/backend/api/*.php
```

---

## 데이터베이스 백업 설정

### 자동 백업 스크립트

```bash
#!/bin/bash
# /usr/local/bin/backup-cognitive-recovery.sh

BACKUP_DIR="/var/backups/cognitive-recovery"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="cognitive_recovery_${DATE}.sql.gz"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 백업 실행
mysqldump -u cr_user -p'SecurePassword123!' cognitive_recovery_db | gzip > $BACKUP_DIR/$FILENAME

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

### Cron 작업 추가

```bash
# crontab 편집
crontab -e

# 매일 새벽 2시 백업 실행
0 2 * * * /usr/local/bin/backup-cognitive-recovery.sh
```

---

## 성능 최적화

### MySQL 최적화

```sql
-- 데이터베이스 선택
USE cognitive_recovery_db;

-- 테이블 최적화
OPTIMIZE TABLE activity_sessions;
OPTIMIZE TABLE activity_events;
OPTIMIZE TABLE cognitive_recovery_periods;

-- 분석
ANALYZE TABLE activity_sessions;
ANALYZE TABLE activity_events;
```

### PHP OPcache 활성화

```ini
# /etc/php/7.1/apache2/php.ini (또는 해당 경로)

opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

---

## 문제 해결

### 데이터베이스 연결 실패

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u cr_user -p'SecurePassword123!' -h localhost cognitive_recovery_db
```

### PHP 오류 확인

```bash
# PHP 에러 로그 확인
tail -f /var/log/apache2/error.log

# 또는
tail -f /var/log/php7.1-fpm.log
```

### JavaScript 콘솔 오류

1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭 확인
3. Network 탭에서 API 요청 상태 확인

---

## 보안 체크리스트

- [ ] 데이터베이스 비밀번호가 강력한가?
- [ ] config.ini 파일이 웹에서 접근 불가능한가?
- [ ] HTTPS가 활성화되어 있는가?
- [ ] SQL Injection 방어가 적용되어 있는가? (기본 적용됨)
- [ ] XSS 방어가 적용되어 있는가? (기본 적용됨)
- [ ] 정기 백업이 설정되어 있는가?
- [ ] 에러 로그가 모니터링되고 있는가?

---

## 다음 단계

설치가 완료되었다면:

1. [사용자 가이드](USER_GUIDE.md) 참조
2. [API 문서](API_DOCUMENTATION.md) 확인
3. [Moodle 플러그인 개발 가이드](MOODLE_PLUGIN.md) 참조

문제가 발생하면 GitHub Issues에 보고해 주세요.
