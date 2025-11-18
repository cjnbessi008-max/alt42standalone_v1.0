# Truth Temperature - 상세 설치 가이드

이 문서는 Truth Temperature 앱을 처음부터 설치하는 방법을 단계별로 안내합니다.

---

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [사전 준비](#사전-준비)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 설치](#애플리케이션-설치)
5. [웹 서버 설정](#웹-서버-설정)
6. [Moodle 연동](#moodle-연동)
7. [테스트 및 검증](#테스트-및-검증)
8. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 소프트웨어

| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| PHP | 7.1.9 이상 | 백엔드 처리 |
| MySQL | 5.7 | 데이터베이스 |
| Apache | 2.4 이상 | 웹 서버 |
| Moodle | 3.7 이상 | LMS 연동 (선택) |

### PHP 확장 모듈

다음 PHP 확장 모듈이 필요합니다:

```bash
# 설치 확인
php -m | grep -E 'pdo|mysqli|json|mbstring'

# Ubuntu/Debian 설치
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json

# CentOS/RHEL 설치
sudo yum install php71-mysql php71-mbstring php71-json
```

### 디스크 공간

- 최소: 50MB
- 권장: 500MB (로그 및 데이터 포함)

---

## 사전 준비

### 1. 패키지 다운로드

```bash
# Git으로 클론
git clone <repository-url> truth-temperature
cd truth-temperature

# 또는 압축 파일 다운로드 후 압축 해제
unzip truth-temperature.zip
cd truth-temperature
```

### 2. 디렉토리 권한 설정

```bash
# Apache 사용자에게 권한 부여 (Ubuntu/Debian)
sudo chown -R www-data:www-data truth-temperature/

# CentOS/RHEL
sudo chown -R apache:apache truth-temperature/

# 권한 설정
sudo chmod -R 755 truth-temperature/
```

---

## 데이터베이스 설정

### 1. MySQL 접속

```bash
mysql -u root -p
```

### 2. 데이터베이스 및 사용자 생성

```sql
-- 데이터베이스 생성
CREATE DATABASE truth_temperature CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'truthtemp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON truth_temperature.* TO 'truthtemp_user'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 3. 스키마 적용

```bash
# 스키마 파일 실행
mysql -u truthtemp_user -p truth_temperature < database/schema.sql

# 확인
mysql -u truthtemp_user -p truth_temperature -e "SHOW TABLES;"
```

**예상 출력:**
```
+----------------------------+
| Tables_in_truth_temperature|
+----------------------------+
| app_config                 |
| problems                   |
| temperature_logs           |
| user_responses             |
| user_sessions              |
+----------------------------+
```

### 4. 샘플 데이터 확인

```bash
mysql -u truthtemp_user -p truth_temperature -e "SELECT * FROM problems;"
```

5개의 샘플 문제가 표시되어야 합니다.

---

## 애플리케이션 설치

### 1. 웹 서버 디렉토리에 복사

```bash
# Apache 기본 문서 루트로 복사
sudo cp -r truth-temperature /var/www/html/

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/truth-temperature/
```

### 2. 데이터베이스 연결 설정

`backend/config/database.php` 파일 수정:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'truth_temperature');
define('DB_USER', 'truthtemp_user');
define('DB_PASS', 'your_secure_password');  // 위에서 설정한 비밀번호
define('DB_CHARSET', 'utf8mb4');
```

### 3. 설정 파일 보안

```bash
# 설정 파일 권한 제한
sudo chmod 640 /var/www/html/truth-temperature/backend/config/database.php
sudo chown www-data:www-data /var/www/html/truth-temperature/backend/config/database.php
```

---

## 웹 서버 설정

### Apache 설정

#### 방법 1: .htaccess 사용 (권장)

1. `.htaccess` 파일이 이미 프로젝트에 포함되어 있습니다
2. Apache에서 `.htaccess` 허용 확인:

```bash
# Apache 설정 파일 편집 (Ubuntu/Debian)
sudo nano /etc/apache2/sites-available/000-default.conf
```

다음 내용 추가:

```apache
<Directory /var/www/html/truth-temperature>
    AllowOverride All
    Require all granted
</Directory>
```

3. mod_rewrite 활성화:

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

#### 방법 2: VirtualHost 설정

```bash
# 새 VirtualHost 생성
sudo nano /etc/apache2/sites-available/truthtemp.conf
```

다음 내용 입력:

```apache
<VirtualHost *:80>
    ServerName truthtemp.local
    DocumentRoot /var/www/html/truth-temperature

    <Directory /var/www/html/truth-temperature>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/truthtemp_error.log
    CustomLog ${APACHE_LOG_DIR}/truthtemp_access.log combined
</VirtualHost>
```

활성화:

```bash
sudo a2ensite truthtemp.conf
sudo systemctl reload apache2

# /etc/hosts 파일에 추가
echo "127.0.0.1 truthtemp.local" | sudo tee -a /etc/hosts
```

### Nginx 설정 (대안)

```bash
sudo nano /etc/nginx/sites-available/truthtemp
```

```nginx
server {
    listen 80;
    server_name truthtemp.local;
    root /var/www/html/truth-temperature;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /frontend/index.html;
    }

    location /api/ {
        try_files $uri $uri/ /backend/api/api.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\. {
        deny all;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/truthtemp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Moodle 연동

### 1. Moodle 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
sudo cp -r /var/www/html/truth-temperature/moodle-plugin/ mod/truthtemp/

# 권한 설정
sudo chown -R www-data:www-data mod/truthtemp/
```

### 2. Moodle에서 플러그인 활성화

1. Moodle 관리자로 로그인
2. **Site administration** → **Notifications** 이동
3. "Upgrade Moodle database now" 클릭
4. 설치 완료 확인

### 3. Web Service 활성화

1. **Site administration** → **Advanced features**
2. "Enable web services" 체크
3. 저장

### 4. 외부 서비스 생성

1. **Site administration** → **Server** → **Web services** → **External services**
2. "Add" 클릭
3. 이름: "Truth Temperature API"
4. 활성화 및 저장

### 5. API 토큰 생성

1. **Site administration** → **Server** → **Web services** → **Manage tokens**
2. 사용자 선택 및 서비스 선택
3. 생성된 토큰 복사

### 6. API 토큰 설정

```sql
-- MySQL에 접속하여 토큰 저장
mysql -u truthtemp_user -p truth_temperature

UPDATE app_config
SET config_value = 'your_moodle_token_here'
WHERE config_key = 'moodle_api_token';

UPDATE app_config
SET config_value = 'http://your-moodle-site.com'
WHERE config_key = 'moodle_api_url';

EXIT;
```

---

## 테스트 및 검증

### 1. 독립 실행형 테스트

브라우저에서 열기:
```
http://localhost/truth-temperature/frontend/index.html
```

**확인 사항:**
- [ ] 페이지가 정상적으로 로드됨
- [ ] 문제가 표시됨
- [ ] 우측 하단에 스마트폰 화면이 표시됨
- [ ] 답변 클릭 시 온도가 변경됨

### 2. API 테스트

#### 문제 조회

```bash
curl http://localhost/truth-temperature/backend/api/api.php/problems
```

**예상 출력:**
```json
{
  "success": true,
  "data": [...]
}
```

#### 세션 생성

```bash
curl -X POST http://localhost/truth-temperature/backend/api/api.php/session \
  -H "Content-Type: application/json" \
  -d '{"moodle_user_id": 1, "username": "test"}'
```

**예상 출력:**
```json
{
  "success": true,
  "session_id": 1,
  "session_token": "..."
}
```

### 3. 데이터베이스 테스트

```bash
# 문제 수 확인
mysql -u truthtemp_user -p truth_temperature -e "SELECT COUNT(*) FROM problems;"

# 세션 확인
mysql -u truthtemp_user -p truth_temperature -e "SELECT * FROM user_sessions;"
```

### 4. Moodle 통합 테스트 (플러그인 설치 시)

1. Moodle 코스에 진입
2. "Turn editing on" 클릭
3. "Add an activity or resource" 선택
4. "Truth Temperature" 활동 추가
5. 활동 열기 및 테스트

---

## 문제 해결

### 문제 1: "Database connection failed"

**원인:** 데이터베이스 연결 정보 오류

**해결:**
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 정보 재확인
nano backend/config/database.php

# MySQL 접속 테스트
mysql -u truthtemp_user -p truth_temperature
```

### 문제 2: "500 Internal Server Error"

**원인:** PHP 오류 또는 권한 문제

**해결:**
```bash
# Apache 에러 로그 확인
sudo tail -f /var/log/apache2/error.log

# PHP 에러 표시 활성화 (개발 중에만)
sudo nano /etc/php/7.1/apache2/php.ini
# display_errors = On

# Apache 재시작
sudo systemctl restart apache2
```

### 문제 3: API 호출이 404 반환

**원인:** mod_rewrite가 비활성화되었거나 .htaccess 미적용

**해결:**
```bash
# mod_rewrite 활성화
sudo a2enmod rewrite

# AllowOverride 확인
grep -r "AllowOverride" /etc/apache2/

# Apache 재시작
sudo systemctl restart apache2
```

### 문제 4: 온도가 표시되지 않음

**원인:** JavaScript 로드 오류 또는 API 경로 문제

**해결:**
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 에러 확인
3. Network 탭에서 API 호출 확인
4. `frontend/js/smartphone.js`에서 `API_BASE_URL` 수정

### 문제 5: CORS 오류

**원인:** 도메인이 다른 경우 발생

**해결:**
```php
// backend/api/api.php 파일 상단에 추가
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

## 보안 권장사항

### 1. 프로덕션 환경 설정

```bash
# PHP 에러 표시 비활성화
sudo nano /etc/php/7.1/apache2/php.ini
# display_errors = Off
# log_errors = On

# Apache 재시작
sudo systemctl restart apache2
```

### 2. 데이터베이스 보안

```sql
-- 강력한 비밀번호 사용
ALTER USER 'truthtemp_user'@'localhost' IDENTIFIED BY 'VeryStrongPassword123!@#';

-- 원격 접속 제한
REVOKE ALL PRIVILEGES ON *.* FROM 'truthtemp_user'@'%';
FLUSH PRIVILEGES;
```

### 3. 파일 권한

```bash
# 민감한 파일 권한 제한
chmod 640 backend/config/database.php
chmod 644 backend/api/api.php

# 디렉토리 권한
chmod 755 truth-temperature/
```

---

## 성능 최적화

### 1. PHP OpCache 활성화

```bash
sudo nano /etc/php/7.1/apache2/php.ini
```

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### 2. MySQL 튜닝

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_size = 64M
query_cache_limit = 2M
```

### 3. Gzip 압축 (Apache)

`.htaccess` 파일에 이미 포함되어 있습니다.

---

## 백업 및 복원

### 백업

```bash
# 데이터베이스 백업
mysqldump -u truthtemp_user -p truth_temperature > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf truthtemp_backup_$(date +%Y%m%d).tar.gz /var/www/html/truth-temperature/
```

### 복원

```bash
# 데이터베이스 복원
mysql -u truthtemp_user -p truth_temperature < backup_20251118.sql

# 파일 복원
tar -xzf truthtemp_backup_20251118.tar.gz -C /var/www/html/
```

---

## 업데이트

```bash
# Git으로 최신 버전 받기
cd /var/www/html/truth-temperature/
sudo git pull origin main

# 데이터베이스 마이그레이션 (필요시)
mysql -u truthtemp_user -p truth_temperature < database/migrations/latest.sql

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/truth-temperature/

# 캐시 지우기 (브라우저)
# Ctrl + Shift + R
```

---

## 지원 및 문의

설치 중 문제가 발생하면:

1. **로그 확인**: `/var/log/apache2/error.log`
2. **GitHub Issues**: 이슈 등록
3. **문서 참조**: `README.md`

---

**최종 업데이트**: 2025-11-18
**버전**: 1.0.0
