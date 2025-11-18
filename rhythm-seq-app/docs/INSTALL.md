# Rhythm Seq 설치 가이드

## 빠른 시작 (Quick Start)

### 필수 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx
- Moodle 3.7 설치 및 실행 중

### 5분 설치

```bash
# 1. 웹 서버 디렉토리로 이동
cd /var/www/html

# 2. 파일 복사
cp -r /path/to/rhythm-seq-app .

# 3. 권한 설정
chmod -R 755 rhythm-seq-app
chown -R www-data:www-data rhythm-seq-app

# 4. 설정 파일 편집
nano rhythm-seq-app/config.php
```

`config.php` 수정:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_moodle_user');
define('DB_PASS', 'your_moodle_password');
```

```bash
# 5. 브라우저에서 접속
# http://your-server/rhythm-seq-app/
```

---

## 상세 설치 가이드

### 1. 환경 확인

#### PHP 버전 확인
```bash
php -v
# PHP 7.1.9 이상이어야 함
```

#### 필요한 PHP 확장 확인
```bash
php -m | grep -E "pdo|pdo_mysql|json|mbstring"
```

필수 확장:
- PDO
- pdo_mysql
- json
- mbstring

#### MySQL 버전 확인
```bash
mysql --version
# MySQL 5.7 이상
```

### 2. Apache 설정 (Apache 사용 시)

#### mod_rewrite 활성화
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

#### Virtual Host 설정 (선택사항)
```apache
<VirtualHost *:80>
    ServerName rhythmseq.yourdomain.com
    DocumentRoot /var/www/html/rhythm-seq-app

    <Directory /var/www/html/rhythm-seq-app>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/rhythmseq_error.log
    CustomLog ${APACHE_LOG_DIR}/rhythmseq_access.log combined
</VirtualHost>
```

```bash
sudo systemctl restart apache2
```

### 3. Nginx 설정 (Nginx 사용 시)

```nginx
server {
    listen 80;
    server_name rhythmseq.yourdomain.com;
    root /var/www/html/rhythm-seq-app;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
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
sudo systemctl restart nginx
sudo systemctl restart php7.1-fpm
```

### 4. 데이터베이스 설정

#### Moodle DB 정보 확인
```bash
cat /path/to/moodle/config.php | grep -E "dbhost|dbname|dbuser|dbpass|prefix"
```

#### 데이터베이스 접근 테스트
```bash
mysql -h localhost -u moodle_user -p
```

MySQL 콘솔에서:
```sql
USE moodle;
SHOW TABLES LIKE 'mdl_question%';
SELECT COUNT(*) FROM mdl_question;
```

#### 샘플 데이터 삽입 (선택사항)
```bash
mysql -u moodle_user -p moodle < rhythm-seq-app/docs/sample_data.sql
```

### 5. 권한 설정

```bash
# 파일 소유권
sudo chown -R www-data:www-data rhythm-seq-app

# 디렉토리 권한
sudo find rhythm-seq-app -type d -exec chmod 755 {} \;

# 파일 권한
sudo find rhythm-seq-app -type f -exec chmod 644 {} \;

# API 스크립트 실행 권한
sudo chmod 755 rhythm-seq-app/api/*.php
```

### 6. 보안 설정

#### config.php 보호
```bash
chmod 600 rhythm-seq-app/config.php
chown www-data:www-data rhythm-seq-app/config.php
```

#### 프로덕션 모드 설정
`config.php` 편집:
```php
define('DEBUG_MODE', false); // 프로덕션에서는 false로 설정
```

#### PHP 오류 로깅 설정
`php.ini` 편집:
```ini
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
```

### 7. 방화벽 설정 (필요 시)

```bash
# HTTP 허용
sudo ufw allow 80/tcp

# HTTPS 허용
sudo ufw allow 443/tcp

# 방화벽 재시작
sudo ufw reload
```

### 8. SSL/TLS 설정 (프로덕션 권장)

#### Let's Encrypt로 무료 SSL 인증서 설치

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache

# 인증서 발급
sudo certbot --apache -d rhythmseq.yourdomain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

---

## 설치 확인

### 1. 웹 인터페이스 확인

브라우저에서 접속:
```
http://your-server/rhythm-seq-app/
```

확인 사항:
- ✅ 페이지가 정상적으로 로드됨
- ✅ 좌측 컨트롤 패널이 표시됨
- ✅ 우측 스마트폰 UI가 표시됨

### 2. API 연결 확인

브라우저에서 직접 API 호출:
```
http://your-server/rhythm-seq-app/api/get_questions.php?limit=5
```

정상 응답 예시:
```json
{
  "success": true,
  "count": 5,
  "questions": [...]
}
```

### 3. 데이터베이스 연결 확인

터미널에서 테스트:
```bash
php -r "
require 'rhythm-seq-app/config.php';
\$pdo = get_db_connection();
echo 'Database connection successful!';
"
```

### 4. 로그 확인

```bash
# Apache 에러 로그
tail -f /var/log/apache2/error.log

# Nginx 에러 로그
tail -f /var/log/nginx/error.log

# PHP 에러 로그
tail -f /var/log/php_errors.log
```

---

## 문제 해결

### 문제: "Database Connection Failed"

**원인**: DB 연결 정보 오류

**해결**:
```bash
# Moodle config 확인
grep -E "dbhost|dbname|dbuser|dbpass" /path/to/moodle/config.php

# config.php 수정
nano rhythm-seq-app/config.php
```

### 문제: "500 Internal Server Error"

**원인**: PHP 문법 오류 또는 권한 문제

**해결**:
```bash
# PHP 문법 체크
php -l rhythm-seq-app/index.php

# 권한 확인
ls -la rhythm-seq-app/

# 에러 로그 확인
tail -50 /var/log/apache2/error.log
```

### 문제: 문제 목록이 비어있음

**원인**: Moodle DB에 문제 없음

**해결**:
```bash
# 샘플 데이터 삽입
mysql -u moodle_user -p moodle < rhythm-seq-app/docs/sample_data.sql

# 또는 Moodle에서 직접 문제 생성
```

### 문제: CSS/JS 파일이 로드되지 않음

**원인**: 경로 문제 또는 권한 문제

**해결**:
```bash
# 파일 존재 확인
ls -la rhythm-seq-app/css/
ls -la rhythm-seq-app/js/

# 권한 확인
chmod 644 rhythm-seq-app/css/*
chmod 644 rhythm-seq-app/js/*
```

### 문제: CORS 에러

**원인**: 다른 도메인에서 접근 시

**해결**:
`config.php`에 추가:
```php
header('Access-Control-Allow-Origin: https://your-moodle-domain.com');
```

---

## 성능 최적화

### 1. OPcache 활성화

`php.ini` 편집:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

### 2. MySQL 쿼리 캐싱

`my.cnf` 편집:
```ini
[mysqld]
query_cache_type = 1
query_cache_size = 32M
query_cache_limit = 2M
```

### 3. Apache/Nginx 압축 활성화

이미 `.htaccess`에 설정되어 있습니다.

### 4. CDN 사용 (선택사항)

정적 파일(CSS, JS)을 CDN에 호스팅하여 로딩 속도 개선

---

## 백업 및 유지보수

### 정기 백업

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/rhythm-seq"

# 파일 백업
tar -czf $BACKUP_DIR/rhythmseq_files_$DATE.tar.gz rhythm-seq-app/

# DB 백업 (문제 카테고리만)
mysqldump -u moodle_user -p moodle \
  mdl_question \
  mdl_question_categories \
  --where="category IN (SELECT id FROM mdl_question_categories WHERE name LIKE '%Rhythm Seq%')" \
  > $BACKUP_DIR/rhythmseq_db_$DATE.sql

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### 업데이트

```bash
# 1. 백업
./backup.sh

# 2. 새 버전 다운로드 및 압축 해제
# ...

# 3. config.php 백업
cp rhythm-seq-app/config.php config.php.backup

# 4. 파일 교체
rm -rf rhythm-seq-app
cp -r new-rhythm-seq-app rhythm-seq-app

# 5. config.php 복원
cp config.php.backup rhythm-seq-app/config.php

# 6. 권한 설정
chmod -R 755 rhythm-seq-app
chown -R www-data:www-data rhythm-seq-app
```

---

## 다음 단계

설치가 완료되었으면:

1. **Moodle 통합 가이드** 읽기: `docs/MOODLE_INTEGRATION.md`
2. **샘플 문제** 확인 및 테스트
3. **커스터마이징**: 색상, 애니메이션 등 수정
4. **사용자 매뉴얼** 작성하여 선생님들께 배포

---

## 지원

- 📧 기술 지원: [support email]
- 📖 문서: `rhythm-seq-app/README.md`
- 🐛 버그 리포트: GitHub Issues

---

**설치 완료 체크리스트**

- [ ] PHP 7.1.9+ 설치됨
- [ ] MySQL 5.7+ 설치됨
- [ ] Moodle 3.7 실행 중
- [ ] 파일을 웹 서버에 배포함
- [ ] config.php 설정 완료
- [ ] 데이터베이스 연결 테스트 성공
- [ ] 샘플 데이터 삽입 (선택)
- [ ] 웹 인터페이스 정상 작동
- [ ] API 호출 성공
- [ ] 애니메이션 작동 확인
- [ ] 프로덕션 모드 설정 (DEBUG_MODE=false)
- [ ] SSL 인증서 설치 (프로덕션)
- [ ] 백업 스크립트 설정

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
