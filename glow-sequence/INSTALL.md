# Glow Sequence - 설치 가이드

이 문서는 Glow Sequence 애플리케이션을 처음부터 설치하는 방법을 단계별로 안내합니다.

## 📋 시스템 요구사항

### 필수 요구사항

- **운영체제**: Linux, macOS, Windows
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (권장: PHP 7.4)
- **MySQL**: 5.7 이상 (권장: MySQL 8.0 또는 MariaDB 10.3+)
- **디스크 공간**: 최소 100MB
- **메모리**: 최소 256MB RAM

### 선택적 요구사항

- **Moodle**: 3.7 이상 (LMS 연동 시)
- **Composer**: PHP 의존성 관리 (향후 확장 시)
- **Git**: 버전 관리

### PHP 확장 모듈

다음 PHP 확장 모듈이 필요합니다:

```bash
- mysqli
- pdo
- pdo_mysql
- json
- mbstring
- openssl
- session
```

확장 모듈 확인:

```bash
php -m | grep -E 'mysqli|pdo|json|mbstring|openssl|session'
```

---

## 🚀 설치 단계

### 1단계: 프로젝트 다운로드

#### Git 사용

```bash
cd /var/www/html
git clone <repository-url> glow-sequence
cd glow-sequence
```

#### 수동 다운로드

1. 프로젝트 ZIP 파일 다운로드
2. 웹 서버의 루트 디렉토리에 압축 해제
3. 폴더 이름을 `glow-sequence`로 변경

---

### 2단계: 데이터베이스 설정

#### MySQL 접속

```bash
mysql -u root -p
```

#### 데이터베이스 생성

```sql
CREATE DATABASE glow_sequence_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 사용자 생성 및 권한 부여

```sql
CREATE USER 'glow_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON glow_sequence_db.* TO 'glow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 적용

```bash
mysql -u glow_user -p glow_sequence_db < db/schema.sql
```

또는 MySQL 내에서:

```sql
USE glow_sequence_db;
SOURCE /path/to/glow-sequence/db/schema.sql;
```

#### 데이터베이스 확인

```sql
USE glow_sequence_db;
SHOW TABLES;

-- 다음 테이블들이 표시되어야 합니다:
-- glow_sequences
-- glow_students
-- glow_attempts
-- glow_progress
-- glow_sessions
-- glow_settings
```

---

### 3단계: 환경 설정

#### .env 파일 생성

```bash
cp .env.example .env
```

#### .env 파일 편집

```bash
nano .env
# 또는
vim .env
```

**필수 설정 항목**:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=glow_sequence_db
DB_USER=glow_user
DB_PASS=your_secure_password
```

**Moodle 연동 시 추가 설정**:

```env
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=moodle_password
MOODLE_DB_PREFIX=mdl_
```

---

### 4단계: 파일 권한 설정

#### Linux/macOS

```bash
# 소유자 변경
sudo chown -R www-data:www-data /var/www/html/glow-sequence

# 또는 현재 사용자로 (개발 환경)
sudo chown -R $USER:$USER /var/www/html/glow-sequence

# 권한 설정
chmod -R 755 /var/www/html/glow-sequence
chmod -R 775 /var/www/html/glow-sequence/config
```

#### Windows (XAMPP)

1. 프로젝트 폴더 우클릭 → 속성
2. 보안 탭 → 편집
3. Users 그룹에 읽기 및 실행 권한 부여

---

### 5단계: 웹 서버 설정

#### Apache 설정

##### 방법 1: VirtualHost 설정 (권장)

`/etc/apache2/sites-available/glow-sequence.conf` 파일 생성:

```apache
<VirtualHost *:80>
    ServerName glow-sequence.local
    ServerAlias www.glow-sequence.local
    DocumentRoot /var/www/html/glow-sequence/public

    <Directory /var/www/html/glow-sequence/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/glow-sequence-error.log
    CustomLog ${APACHE_LOG_DIR}/glow-sequence-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite glow-sequence
sudo a2enmod rewrite
sudo systemctl restart apache2
```

hosts 파일 수정:

```bash
sudo nano /etc/hosts
```

다음 줄 추가:

```
127.0.0.1   glow-sequence.local
```

##### 방법 2: 기존 디렉토리 사용

`.htaccess` 파일이 이미 `public/` 폴더에 있으므로 별도 설정 불필요

접속 URL: `http://localhost/glow-sequence/public/`

#### Nginx 설정

`/etc/nginx/sites-available/glow-sequence` 파일 생성:

```nginx
server {
    listen 80;
    server_name glow-sequence.local;
    root /var/www/html/glow-sequence/public;

    index index.php index.html;

    # Logging
    access_log /var/log/nginx/glow-sequence-access.log;
    error_log /var/log/nginx/glow-sequence-error.log;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_index index.php;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to sensitive files
    location ~ \.(env|sql|md)$ {
        deny all;
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/glow-sequence /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 6단계: PHP 설정 확인

#### php.ini 설정 확인

```bash
php --ini
```

필요한 설정:

```ini
upload_max_filesize = 10M
post_max_size = 10M
memory_limit = 256M
max_execution_time = 60
display_errors = Off (프로덕션)
log_errors = On
```

---

### 7단계: 애플리케이션 테스트

#### 브라우저에서 접속

```
http://localhost/glow-sequence/public/
# 또는
http://glow-sequence.local/
```

#### 데이터베이스 연결 테스트

브라우저 개발자 도구(F12) → 콘솔에서:

```javascript
fetch('../api/get_problems.php?limit=1')
  .then(r => r.json())
  .then(console.log);
```

정상적으로 응답이 오면 설정 완료!

---

## 🔧 Moodle 연동 설정 (선택사항)

### Moodle 데이터베이스 정보 확인

Moodle의 `config.php` 파일에서 다음 정보 확인:

```php
$CFG->dbtype    = 'mysqli';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'localhost';
$CFG->dbname    = 'moodle';
$CFG->dbuser    = 'moodle_user';
$CFG->dbpass    = 'moodle_password';
$CFG->prefix    = 'mdl_';
```

### .env 파일 업데이트

위 정보를 `.env` 파일의 Moodle 섹션에 입력

### Moodle 사용자 테스트

```bash
# Moodle 데이터베이스 접속
mysql -u moodle_user -p moodle

# 사용자 확인
SELECT id, username, firstname, lastname, email
FROM mdl_user
WHERE deleted = 0
LIMIT 5;
```

사용자 ID를 메모하고 애플리케이션에서 테스트

---

## 🧪 설치 검증

### 체크리스트

- [ ] 웹 페이지가 정상적으로 로드됨
- [ ] 데이터베이스 테이블이 모두 생성됨
- [ ] 샘플 문제 7개가 데이터베이스에 있음
- [ ] 사용자 로드 기능 작동
- [ ] 문제 불러오기 기능 작동
- [ ] 스마트폰 화면에 앱이 표시됨
- [ ] 답안 제출 및 채점 기능 작동
- [ ] Glow 애니메이션 효과 작동
- [ ] 진행 상황 통계 표시됨

### 문제 해결

#### 1. "Database connection failed" 오류

```bash
# 해결 방법:
# 1. .env 파일의 DB 정보 확인
# 2. MySQL 서비스 실행 확인
sudo systemctl status mysql

# 3. 사용자 권한 확인
mysql -u glow_user -p -e "SHOW GRANTS;"
```

#### 2. "500 Internal Server Error"

```bash
# Apache 에러 로그 확인
sudo tail -f /var/log/apache2/error.log

# PHP 에러 로그 확인
sudo tail -f /var/log/php/error.log

# 파일 권한 확인
ls -la /var/www/html/glow-sequence
```

#### 3. 페이지가 비어 있음

```bash
# 브라우저 개발자 도구(F12) → 콘솔에서 에러 확인
# 네트워크 탭에서 API 요청 실패 여부 확인
```

#### 4. Glow 애니메이션이 작동하지 않음

- 최신 브라우저 사용 확인 (Chrome, Firefox, Safari, Edge)
- JavaScript 활성화 확인
- 브라우저 콘솔에서 에러 메시지 확인

---

## 📊 성능 최적화 (선택사항)

### MySQL 쿼리 캐싱

```sql
SET GLOBAL query_cache_size = 1000000;
SET GLOBAL query_cache_type = ON;
```

### PHP OPcache 활성화

```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### GZIP 압축 (이미 .htaccess에 포함됨)

---

## 🔒 보안 강화 (프로덕션 환경)

### 1. HTTPS 설정

Let's Encrypt를 사용한 무료 SSL 인증서:

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d glow-sequence.yourdomain.com
```

### 2. 데이터베이스 보안

```sql
-- 루트 사용자 비밀번호 변경
ALTER USER 'root'@'localhost' IDENTIFIED BY 'strong_password';

-- 원격 접속 비활성화
DELETE FROM mysql.user WHERE Host != 'localhost' AND User = 'root';
FLUSH PRIVILEGES;
```

### 3. 파일 권한 강화

```bash
chmod 640 .env
chmod 644 public/.htaccess
```

### 4. PHP 보안 설정

```ini
; php.ini (프로덕션)
display_errors = Off
expose_php = Off
allow_url_fopen = Off
allow_url_include = Off
```

---

## 📦 백업

### 데이터베이스 백업

```bash
# 백업
mysqldump -u glow_user -p glow_sequence_db > backup_$(date +%Y%m%d).sql

# 복원
mysql -u glow_user -p glow_sequence_db < backup_20251118.sql
```

### 파일 백업

```bash
tar -czf glow-sequence-backup-$(date +%Y%m%d).tar.gz /var/www/html/glow-sequence
```

---

## 🆘 지원

설치 중 문제가 발생하면:

1. 에러 로그 확인
2. README.md의 FAQ 참조
3. GitHub Issues에 문의
4. 이메일: support@example.com

---

## ✅ 설치 완료!

축하합니다! Glow Sequence가 성공적으로 설치되었습니다.

이제 다음을 시작할 수 있습니다:
- 사용자 추가
- 새로운 수열 문제 생성
- Moodle과 연동
- 커스터마이징

즐거운 학습 되세요! 🎉
