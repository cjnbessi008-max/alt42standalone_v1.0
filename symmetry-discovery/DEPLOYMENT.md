# 배포 가이드 (Deployment Guide)

## 빠른 시작 체크리스트

- [ ] MySQL 5.7+ 설치 및 실행
- [ ] PHP 7.1.9+ 설치 및 설정
- [ ] Moodle 3.7+ 설치 (선택사항)
- [ ] 데이터베이스 생성 및 스키마 적용
- [ ] PHP 설정 파일 구성
- [ ] 웹 서버 설정
- [ ] Moodle 모듈 설치 (Moodle 사용 시)
- [ ] 테스트 및 검증

## 1. 환경 준비

### 1.1 시스템 요구사항 확인

```bash
# PHP 버전 확인
php -v  # 7.1.9 이상

# MySQL 버전 확인
mysql --version  # 5.7 이상

# 웹 서버 확인 (Apache 또는 Nginx)
apache2 -v
# 또는
nginx -v
```

### 1.2 필수 PHP 확장 모듈

```bash
# 필요한 확장 모듈 확인
php -m | grep -E 'pdo|mysql|json|mbstring|openssl'

# Ubuntu/Debian에서 설치
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json php7.1-xml

# CentOS/RHEL에서 설치
sudo yum install php71-mysql php71-mbstring php71-json php71-xml
```

## 2. 데이터베이스 설정

### 2.1 MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE symmetry_discovery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON symmetry_discovery.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 연결 테스트
USE symmetry_discovery;
SHOW TABLES;  # 처음엔 비어있음

# 종료
EXIT;
```

### 2.2 스키마 적용

```bash
# 스키마 파일 실행
mysql -u moodle_user -p symmetry_discovery < db/schema.sql

# 테이블 생성 확인
mysql -u moodle_user -p symmetry_discovery -e "SHOW TABLES;"
```

**예상 결과:**
```
+-------------------------------+
| Tables_in_symmetry_discovery |
+-------------------------------+
| sym_achievements              |
| sym_events                    |
| sym_leaderboard              |
| sym_progress                 |
| sym_scores                   |
| sym_sessions                 |
| sym_settings                 |
| sym_users                    |
+-------------------------------+
```

## 3. 애플리케이션 배포

### 3.1 파일 복사

```bash
# 프로덕션 디렉토리 생성
sudo mkdir -p /var/www/html/symmetry-discovery

# 파일 복사
sudo cp -r symmetry-discovery/* /var/www/html/symmetry-discovery/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/symmetry-discovery
sudo chmod -R 755 /var/www/html/symmetry-discovery

# 로그 디렉토리 생성
sudo mkdir -p /var/www/html/symmetry-discovery/logs
sudo chmod 777 /var/www/html/symmetry-discovery/logs
```

### 3.2 PHP 설정 파일 구성

```bash
# config.php 편집
sudo nano /var/www/html/symmetry-discovery/php/config.php
```

**중요 설정 항목:**

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'symmetry_discovery');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_secure_password_here');

// Moodle 설정 (Moodle 사용 시)
define('MOODLE_ENABLED', true);
define('MOODLE_DIR', '/var/www/html/moodle');
define('MOODLE_WWWROOT', 'https://your-domain.com/moodle');

// 보안 설정
define('API_SECRET_KEY', 'generate-a-random-32-character-key');
define('DEBUG_MODE', false);  // 프로덕션에서는 반드시 false

// CORS 설정 (필요한 경우)
define('ALLOWED_ORIGINS', 'https://your-domain.com');
```

### 3.3 보안 키 생성

```bash
# 랜덤 API 시크릿 키 생성
php -r "echo bin2hex(random_bytes(32));"
# 출력된 키를 config.php의 API_SECRET_KEY에 설정
```

## 4. 웹 서버 설정

### 4.1 Apache 설정

```bash
# Virtual Host 파일 생성
sudo nano /etc/apache2/sites-available/symmetry-discovery.conf
```

**설정 내용:**

```apache
<VirtualHost *:80>
    ServerName symmetry.your-domain.com
    DocumentRoot /var/www/html/symmetry-discovery

    <Directory /var/www/html/symmetry-discovery>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 설정
        php_value upload_max_filesize 10M
        php_value post_max_size 10M
        php_value max_execution_time 300
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/symmetry-error.log
    CustomLog ${APACHE_LOG_DIR}/symmetry-access.log combined

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite symmetry-discovery.conf
sudo a2enmod rewrite headers
sudo systemctl reload apache2
```

### 4.2 Nginx 설정

```bash
# Server 블록 파일 생성
sudo nano /etc/nginx/sites-available/symmetry-discovery
```

**설정 내용:**

```nginx
server {
    listen 80;
    server_name symmetry.your-domain.com;
    root /var/www/html/symmetry-discovery;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/symmetry-access.log;
    error_log /var/log/nginx/symmetry-error.log;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ =404;
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 숨김 파일 접근 차단
    location ~ /\. {
        deny all;
    }
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/symmetry-discovery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.3 SSL/TLS 설정 (권장)

```bash
# Let's Encrypt 설치
sudo apt-get install certbot python3-certbot-apache
# 또는 Nginx용
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --apache -d symmetry.your-domain.com
# 또는
sudo certbot --nginx -d symmetry.your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 5. Moodle 통합 (선택사항)

### 5.1 Moodle 모듈 설치

```bash
# Moodle 모듈 디렉토리로 복사
sudo cp -r moodle/mod_symmetry /var/www/html/moodle/mod/

# 앱 파일 복사
sudo mkdir -p /var/www/html/moodle/mod/symmetry/app
sudo cp index.html /var/www/html/moodle/mod/symmetry/app/
sudo cp -r css js /var/www/html/moodle/mod/symmetry/app/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/moodle/mod/symmetry
sudo chmod -R 755 /var/www/html/moodle/mod/symmetry
```

### 5.2 Moodle에서 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리 → 알림** 이동
3. "Symmetry Discovery" 모듈이 감지됨
4. **데이터베이스 업그레이드** 클릭
5. 설치 완료 확인

### 5.3 첫 활동 생성

1. 코스로 이동
2. **편집 모드 켜기**
3. **활동 또는 리소스 추가**
4. **Symmetry Discovery** 선택
5. 다음 정보 입력:
   - 활동 이름
   - 설명 (학생들에게 표시)
   - 최대 점수 (기본값: 100)
6. **저장하고 표시**

## 6. 테스트 및 검증

### 6.1 기본 연결 테스트

```bash
# 웹 서버 응답 확인
curl -I http://localhost/symmetry-discovery/

# API 엔드포인트 테스트
curl -X POST http://localhost/symmetry-discovery/php/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"verify_session","session_id":"test","user_id":1}'
```

### 6.2 데이터베이스 연결 테스트

**test-db.php 파일 생성:**

```php
<?php
require_once 'php/config.php';
require_once 'php/database.php';

try {
    $db = new Database();
    echo "Database connection successful!\n";

    // 테이블 확인
    $tables = $db->query("SHOW TABLES");
    echo "Found " . count($tables) . " tables\n";

    // 설정 값 확인
    $settings = $db->query("SELECT * FROM sym_settings");
    echo "Settings loaded: " . count($settings) . " entries\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

```bash
# 테스트 실행
php test-db.php
```

### 6.3 브라우저 테스트

1. **독립 실행 모드 테스트:**
   - `http://your-domain.com/symmetry-discovery/` 접속
   - 스마트폰 화면이 우측 하단에 표시되는지 확인
   - 도형을 회전시켜 대칭선이 나타나는지 확인

2. **Moodle 통합 테스트:**
   - Moodle 코스에서 활동 접속
   - 앱이 iframe으로 로드되는지 확인
   - 진행도가 저장되는지 확인
   - 성적표에 점수가 기록되는지 확인

### 6.4 성능 테스트

```bash
# Apache Bench로 부하 테스트
ab -n 100 -c 10 http://your-domain.com/symmetry-discovery/

# 데이터베이스 쿼리 성능 확인
mysql -u moodle_user -p symmetry_discovery -e "SHOW PROCESSLIST;"
```

## 7. 모니터링 및 유지보수

### 7.1 로그 확인

```bash
# 애플리케이션 로그
tail -f /var/www/html/symmetry-discovery/logs/app.log

# 웹 서버 로그
tail -f /var/log/apache2/symmetry-error.log
# 또는
tail -f /var/log/nginx/symmetry-error.log

# MySQL 로그
sudo tail -f /var/log/mysql/error.log
```

### 7.2 데이터베이스 백업

```bash
# 자동 백업 스크립트 생성
sudo nano /usr/local/bin/backup-symmetry-db.sh
```

**스크립트 내용:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/symmetry"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="symmetry_discovery_$DATE.sql"

mkdir -p $BACKUP_DIR

mysqldump -u moodle_user -p'your_password' \
  --single-transaction \
  --routines \
  --triggers \
  symmetry_discovery > "$BACKUP_DIR/$FILENAME"

# 압축
gzip "$BACKUP_DIR/$FILENAME"

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

```bash
# 실행 권한 부여
sudo chmod +x /usr/local/bin/backup-symmetry-db.sh

# Cron 작업 추가 (매일 새벽 2시)
sudo crontab -e
# 다음 줄 추가:
0 2 * * * /usr/local/bin/backup-symmetry-db.sh >> /var/log/symmetry-backup.log 2>&1
```

### 7.3 세션 정리

```bash
# MySQL 이벤트 스케줄러 활성화
mysql -u root -p -e "SET GLOBAL event_scheduler = ON;"

# 자동 정리 이벤트 생성 (schema.sql에 이미 포함됨)
# 만료된 세션은 매일 자동으로 정리됩니다
```

### 7.4 성능 모니터링

```bash
# MySQL 슬로우 쿼리 로그 활성화
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**추가할 내용:**
```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

```bash
# MySQL 재시작
sudo systemctl restart mysql
```

## 8. 보안 강화

### 8.1 파일 권한 확인

```bash
# 중요 파일 권한 설정
sudo chmod 600 /var/www/html/symmetry-discovery/php/config.php
sudo chown www-data:www-data /var/www/html/symmetry-discovery/php/config.php

# 실행 파일만 실행 권한
sudo find /var/www/html/symmetry-discovery -type f -name "*.php" -exec chmod 644 {} \;
sudo find /var/www/html/symmetry-discovery -type d -exec chmod 755 {} \;
```

### 8.2 방화벽 설정

```bash
# UFW 사용 (Ubuntu)
sudo ufw allow 'Apache Full'
# 또는
sudo ufw allow 'Nginx Full'

sudo ufw enable
```

### 8.3 PHP 보안 설정

```bash
# php.ini 편집
sudo nano /etc/php/7.1/apache2/php.ini
```

**권장 설정:**
```ini
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
session.cookie_httponly = 1
session.cookie_secure = 1
```

## 9. 트러블슈팅

### 9.1 데이터베이스 연결 실패

**증상:** "Database connection failed" 오류

**해결:**
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u moodle_user -p -h localhost symmetry_discovery

# 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'moodle_user'@'localhost';"
```

### 9.2 Moodle 통합 문제

**증상:** 활동이 표시되지 않음

**해결:**
1. Moodle 캐시 클리어: **사이트 관리 → 개발 → 캐시 삭제**
2. 파일 권한 확인
3. Moodle 디버그 모드 활성화

### 9.3 성적이 기록되지 않음

**증상:** 점수가 Moodle 성적표에 나타나지 않음

**해결:**
```bash
# API 로그 확인
tail -f /var/www/html/symmetry-discovery/logs/app.log

# MySQL 쿼리 로그 확인
mysql -u moodle_user -p symmetry_discovery -e "SELECT * FROM sym_scores ORDER BY id DESC LIMIT 10;"
```

### 9.4 스마트폰 화면 표시 문제

**증상:** 가상 스마트폰이 표시되지 않음

**해결:**
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일 로드 확인
3. 브라우저 캐시 클리어

## 10. 프로덕션 체크리스트

배포 전 최종 확인:

- [ ] DEBUG_MODE가 false로 설정됨
- [ ] 강력한 데이터베이스 비밀번호 설정
- [ ] API_SECRET_KEY 랜덤 생성 및 설정
- [ ] SSL/TLS 인증서 설치
- [ ] 파일 권한 올바르게 설정
- [ ] 방화벽 규칙 적용
- [ ] 자동 백업 스크립트 설정
- [ ] 로그 로테이션 설정
- [ ] 성능 모니터링 도구 설정
- [ ] 에러 알림 설정
- [ ] 문서화 완료
- [ ] 사용자 테스트 완료

## 11. 롤백 절차

문제 발생 시 이전 버전으로 복원:

```bash
# 1. 데이터베이스 복원
gunzip /var/backups/symmetry/symmetry_discovery_YYYYMMDD_HHMMSS.sql.gz
mysql -u moodle_user -p symmetry_discovery < /var/backups/symmetry/symmetry_discovery_YYYYMMDD_HHMMSS.sql

# 2. 파일 복원
sudo cp -r /var/backups/symmetry/files/backup_date/* /var/www/html/symmetry-discovery/

# 3. 웹 서버 재시작
sudo systemctl restart apache2  # 또는 nginx
```

## 12. 지원 및 문의

문제가 지속되는 경우:
1. 로그 파일 확인
2. 문서 재확인
3. 이슈 리포트 작성

---

**배포 완료!** 🎉

애플리케이션이 성공적으로 배포되었습니다. 학생들이 대칭의 아름다움을 발견하는 즐거운 학습 경험을 제공하세요!
