# Case Timeline 설치 가이드

## 빠른 설치 (Quick Start)

### 필수 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7 (LMS 연동 시)

### 1단계: 파일 복사

```bash
# 프로젝트를 웹 서버 디렉토리로 복사
sudo cp -r case-timeline /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/case-timeline
sudo chmod -R 755 /var/www/html/case-timeline
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 아래 SQL 명령어 실행
```

```sql
-- 데이터베이스 생성
CREATE DATABASE case_timeline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'ct_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON case_timeline.* TO 'ct_user'@'localhost';
FLUSH PRIVILEGES;

-- 데이터베이스 선택
USE case_timeline;

-- 스키마 임포트
SOURCE /var/www/html/case-timeline/database/schema.sql;

-- 확인
SHOW TABLES;
```

### 3단계: 백엔드 설정

```bash
# 설정 파일 편집
sudo nano /var/www/html/case-timeline/backend/config/database.php
```

다음 내용을 수정:
```php
private $host = "localhost";
private $db_name = "case_timeline";
private $username = "ct_user";
private $password = "StrongPassword123!";  // 2단계에서 설정한 비밀번호
```

### 4단계: 프론트엔드 설정

```bash
# 설정 파일 편집
sudo nano /var/www/html/case-timeline/frontend/js/config.js
```

다음 내용을 수정:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost/case-timeline/backend/api',
    // 또는 실제 도메인
    // API_BASE_URL: 'http://yourdomain.com/case-timeline/backend/api',
    // ...
};
```

### 5단계: 웹 서버 설정 (Apache)

```bash
# Apache 설정 파일 생성
sudo nano /etc/apache2/sites-available/case-timeline.conf
```

다음 내용 추가:
```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/html

    <Directory /var/www/html/case-timeline>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/case-timeline-error.log
    CustomLog ${APACHE_LOG_DIR}/case-timeline-access.log combined
</VirtualHost>
```

사이트 활성화 및 Apache 재시작:
```bash
sudo a2ensite case-timeline.conf
sudo a2enmod rewrite proxy_fcgi
sudo systemctl restart apache2
```

### 6단계: 테스트

브라우저에서 다음 URL 접속:

1. **앱 테스트**:
   ```
   http://localhost/case-timeline/frontend/app/index.html?case_id=1&user_id=1
   ```

2. **API 테스트**:
   ```
   http://localhost/case-timeline/backend/api/get_case.php?id=1
   ```

## Moodle 플러그인 설치 (선택사항)

Moodle과 연동하려면 다음 단계를 진행하세요.

### 1단계: 플러그인 복사

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리 생성
sudo mkdir -p mod/casetimeline

# 플러그인 파일 복사
sudo cp -r /var/www/html/case-timeline/moodle-plugin/* mod/casetimeline/

# 권한 설정
sudo chown -R www-data:www-data mod/casetimeline
sudo chmod -R 755 mod/casetimeline
```

### 2단계: Moodle에서 플러그인 설치

1. Moodle 관리자로 로그인
2. `Site administration` → `Notifications` 접속
3. 플러그인 설치 진행
4. 설치 완료 후 확인

### 3단계: Moodle view.php 수정

```bash
sudo nano /path/to/moodle/mod/casetimeline/view.php
```

`$app_base_url` 변수를 실제 경로로 수정:
```php
$app_base_url = 'http://localhost/case-timeline/frontend/app/index.html';
// 또는
$app_base_url = 'http://yourdomain.com/case-timeline/frontend/app/index.html';
```

### 4단계: 코스에 활동 추가

1. Moodle 코스 접속
2. `Turn editing on` 클릭
3. `Add an activity or resource` 선택
4. `Case Timeline` 선택
5. 활동 설정:
   - Name: "급성 충수염 케이스"
   - Description: "의료 케이스 학습"
   - Case ID: 1
   - Grade: 25 (선택사항)
6. `Save and display` 클릭

## 문제 해결

### PHP 확장 모듈 확인

```bash
# 필요한 PHP 확장 모듈
php -m | grep -E 'pdo|pdo_mysql|json|mbstring'

# 없는 경우 설치 (Ubuntu/Debian)
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json
sudo systemctl restart apache2
```

### MySQL 연결 테스트

```bash
# PHP에서 MySQL 연결 테스트
php -r "new PDO('mysql:host=localhost;dbname=case_timeline', 'ct_user', 'StrongPassword123!');"

# 에러가 없으면 성공
```

### Apache 에러 로그 확인

```bash
# 실시간 로그 모니터링
sudo tail -f /var/log/apache2/case-timeline-error.log
```

### 권한 문제 해결

```bash
# 웹 서버 사용자 확인
ps aux | grep apache2 | head -n 1

# 디렉토리 권한 재설정
sudo chown -R www-data:www-data /var/www/html/case-timeline
sudo chmod -R 755 /var/www/html/case-timeline
```

## 개발 환경 설정

로컬 개발을 위한 설정:

### XAMPP 사용 (Windows/Mac)

1. XAMPP 설치
2. `htdocs/case-timeline`에 프로젝트 복사
3. phpMyAdmin에서 데이터베이스 생성
4. 브라우저에서 `http://localhost/case-timeline/frontend/app/index.html` 접속

### Docker 사용

```bash
# docker-compose.yml 생성 (예시)
version: '3.8'
services:
  web:
    image: php:7.1-apache
    ports:
      - "8080:80"
    volumes:
      - ./case-timeline:/var/www/html/case-timeline
  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: case_timeline
      MYSQL_USER: ct_user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"

# 실행
docker-compose up -d
```

## 보안 권장사항

1. **프로덕션 환경에서는 반드시**:
   - 강력한 데이터베이스 비밀번호 사용
   - HTTPS 사용 (SSL/TLS 인증서)
   - 정기적인 백업
   - 방화벽 설정

2. **데이터베이스 사용자 권한 최소화**:
```sql
-- 프로덕션 환경용 권한 설정
REVOKE ALL PRIVILEGES ON case_timeline.* FROM 'ct_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON case_timeline.* TO 'ct_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **PHP 설정 강화** (`php.ini`):
```ini
display_errors = Off
log_errors = On
error_log = /var/log/php-errors.log
```

## 다음 단계

설치가 완료되었으면:

1. [README.md](README.md) 문서를 읽고 사용 방법 확인
2. 샘플 케이스로 테스트
3. 자체 케이스 생성
4. 학습자에게 배포

## 지원

문제가 발생하면:
1. 에러 로그 확인
2. 문제 해결 섹션 참고
3. GitHub Issues에 문의
