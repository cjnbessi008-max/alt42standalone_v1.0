# Balance Scale App - 상세 설치 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [프로덕션 배포](#프로덕션-배포)
4. [Moodle 연동 설정](#moodle-연동-설정)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 요구사항

- **PHP**: 7.1.9 이상
  - 필수 확장: PDO, PDO_MySQL, cURL, JSON
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **디스크 공간**: 최소 100MB
- **메모리**: 최소 512MB RAM

### 선택 요구사항

- **Moodle**: 3.7 이상 (LMS 연동 시)
- **SSL 인증서**: HTTPS 지원 (권장)

## 로컬 개발 환경 설정

### 방법 1: XAMPP 사용 (Windows)

1. **XAMPP 설치**
   - [XAMPP 다운로드](https://www.apachefriends.org/)
   - PHP 7.1.9 버전 선택

2. **프로젝트 복사**
   ```bash
   # XAMPP htdocs 디렉토리로 복사
   cp -r balance-scale-app C:/xampp/htdocs/
   ```

3. **데이터베이스 설정**
   - XAMPP 컨트롤 패널에서 MySQL 시작
   - phpMyAdmin 접속 (http://localhost/phpmyadmin)
   - 새 데이터베이스 생성: `balance_scale`
   - SQL 탭에서 `database/schema.sql` 파일 내용 실행

4. **환경 설정**
   ```bash
   # config/database.php 파일 수정
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'balance_scale');
   define('DB_USER', 'root');
   define('DB_PASS', '');  # XAMPP 기본값은 빈 문자열
   ```

5. **실행**
   - 브라우저에서 접속: http://localhost/balance-scale-app/public/index.html

### 방법 2: Docker 사용

1. **Docker Compose 파일 생성**

   `docker-compose.yml` 파일을 프로젝트 루트에 생성:

   ```yaml
   version: '3.8'

   services:
     web:
       image: php:7.1-apache
       ports:
         - "8080:80"
       volumes:
         - ./balance-scale-app:/var/www/html
       depends_on:
         - db
       environment:
         DB_HOST: db
         DB_NAME: balance_scale
         DB_USER: root
         DB_PASS: rootpassword

     db:
       image: mysql:5.7
       environment:
         MYSQL_ROOT_PASSWORD: rootpassword
         MYSQL_DATABASE: balance_scale
       volumes:
         - ./balance-scale-app/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
         - mysql_data:/var/lib/mysql

   volumes:
     mysql_data:
   ```

2. **Docker Compose 실행**
   ```bash
   docker-compose up -d
   ```

3. **접속**
   - http://localhost:8080/public/index.html

### 방법 3: PHP 내장 서버 (간단 테스트용)

```bash
# 프로젝트 디렉토리로 이동
cd balance-scale-app/public

# PHP 내장 서버 실행
php -S localhost:8000

# 브라우저에서 접속
# http://localhost:8000/index.html
```

**주의**: 내장 서버는 개발용이며 프로덕션에는 사용하지 마세요.

## 프로덕션 배포

### Ubuntu/Debian 서버 배포

1. **패키지 설치**

   ```bash
   # 시스템 업데이트
   sudo apt update && sudo apt upgrade -y

   # Apache, PHP, MySQL 설치
   sudo apt install -y apache2 php7.1 php7.1-mysql php7.1-curl php7.1-json mysql-server

   # Apache 모듈 활성화
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. **프로젝트 배포**

   ```bash
   # 웹 루트로 복사
   sudo cp -r balance-scale-app /var/www/html/

   # 권한 설정
   sudo chown -R www-data:www-data /var/www/html/balance-scale-app
   sudo chmod -R 755 /var/www/html/balance-scale-app
   ```

3. **데이터베이스 설정**

   ```bash
   # MySQL 보안 설정
   sudo mysql_secure_installation

   # 데이터베이스 생성
   sudo mysql -u root -p
   ```

   ```sql
   CREATE DATABASE balance_scale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'balance_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON balance_scale.* TO 'balance_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   ```bash
   # 스키마 임포트
   sudo mysql -u root -p balance_scale < /var/www/html/balance-scale-app/database/schema.sql
   ```

4. **Apache 가상 호스트 설정**

   `/etc/apache2/sites-available/balance-scale.conf` 파일 생성:

   ```apache
   <VirtualHost *:80>
       ServerName balance-scale.yourdomain.com
       DocumentRoot /var/www/html/balance-scale-app/public

       <Directory /var/www/html/balance-scale-app/public>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       <Directory /var/www/html/balance-scale-app/api>
           Options -Indexes
           AllowOverride None
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/balance-scale-error.log
       CustomLog ${APACHE_LOG_DIR}/balance-scale-access.log combined
   </VirtualHost>
   ```

   활성화:
   ```bash
   sudo a2ensite balance-scale.conf
   sudo systemctl reload apache2
   ```

5. **SSL 설정 (Let's Encrypt)**

   ```bash
   # Certbot 설치
   sudo apt install -y certbot python3-certbot-apache

   # SSL 인증서 발급
   sudo certbot --apache -d balance-scale.yourdomain.com

   # 자동 갱신 확인
   sudo certbot renew --dry-run
   ```

6. **환경 변수 설정**

   `/var/www/html/balance-scale-app/.env` 파일 생성:

   ```bash
   DB_HOST=localhost
   DB_NAME=balance_scale
   DB_USER=balance_user
   DB_PASS=secure_password

   MOODLE_URL=https://moodle.yourdomain.com
   MOODLE_TOKEN=your_moodle_token_here
   ```

   PHP에서 읽도록 `config/database.php` 수정:

   ```php
   <?php
   // .env 파일 로드
   if (file_exists(__DIR__ . '/../.env')) {
       $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
       foreach ($lines as $line) {
           if (strpos($line, '=') !== false) {
               list($key, $value) = explode('=', $line, 2);
               putenv(trim($key) . '=' . trim($value));
           }
       }
   }
   ```

## Moodle 연동 설정

### 1. Moodle 웹 서비스 활성화

1. **관리자로 Moodle 로그인**

2. **웹 서비스 활성화**
   - 사이트 관리 → 고급 기능
   - "웹 서비스 활성화" 체크
   - 저장

3. **외부 서비스 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스
   - "추가" 클릭
   - 이름: "Balance Scale Service"
   - 짧은 이름: "balance_scale_service"
   - 활성화 체크
   - 저장

4. **함수 추가**
   - 외부 서비스 → Balance Scale Service → 함수
   - 다음 함수들 추가:
     - `core_question_get_question_info`
     - `core_user_get_users_by_field`
     - `mod_quiz_process_attempt`

5. **토큰 생성**
   - 사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리
   - "추가" 클릭
   - 사용자 선택
   - 서비스: Balance Scale Service
   - 토큰 복사

6. **Balance Scale 앱에 토큰 설정**
   ```bash
   # .env 파일에 추가
   MOODLE_TOKEN=복사한_토큰
   ```

### 2. Moodle 활동으로 추가

1. **코스 편집 모드 켜기**

2. **활동 또는 리소스 추가**
   - "URL" 선택

3. **설정**
   - 이름: "방정식 저울 학습"
   - 외부 URL:
     ```
     https://balance-scale.yourdomain.com/public/index.html?moodle_question_id=123&student_id={USER_ID}
     ```
   - 표시: "임베드"
   - 저장

### 3. LTI 통합 (고급)

LTI(Learning Tools Interoperability)를 사용한 심화 연동은 별도 문서 참조.

## 문제 해결

### PHP 확장 누락

```bash
# 누락된 확장 확인
php -m | grep -E 'pdo|mysql|curl|json'

# 누락 시 설치 (Ubuntu/Debian)
sudo apt install php7.1-mysql php7.1-curl php7.1-json
sudo systemctl restart apache2
```

### MySQL 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u balance_user -p -h localhost balance_scale
```

### 파일 권한 문제

```bash
# Apache 사용자 확인
ps aux | grep apache

# 올바른 권한 설정
sudo chown -R www-data:www-data /var/www/html/balance-scale-app
sudo chmod -R 755 /var/www/html/balance-scale-app
```

### API CORS 오류

Apache `.htaccess` 파일에 추가:

```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### 로그 확인

```bash
# Apache 에러 로그
sudo tail -f /var/log/apache2/error.log

# PHP 에러 로그
sudo tail -f /var/log/php7.1-fpm.log

# MySQL 에러 로그
sudo tail -f /var/log/mysql/error.log
```

## 성능 최적화

### PHP OpCache 활성화

`/etc/php/7.1/apache2/php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### MySQL 쿼리 캐시

`/etc/mysql/my.cnf`:

```ini
[mysqld]
query_cache_type = 1
query_cache_size = 128M
```

### Apache 모듈 최적화

```bash
sudo a2enmod deflate
sudo a2enmod expires
sudo a2enmod headers
sudo systemctl restart apache2
```

## 백업

### 자동 백업 스크립트

`/usr/local/bin/backup-balance-scale.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/balance-scale"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 데이터베이스 백업
mysqldump -u balance_user -p balance_scale > $BACKUP_DIR/db_$DATE.sql

# 파일 백업
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/html/balance-scale-app

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -type f -mtime +7 -delete
```

Cron 설정:
```bash
sudo crontab -e
# 매일 새벽 2시 백업
0 2 * * * /usr/local/bin/backup-balance-scale.sh
```

## 모니터링

### Uptime 모니터링

[UptimeRobot](https://uptimerobot.com/) 또는 유사 서비스 사용 권장.

### 애플리케이션 모니터링

로그 기반 모니터링 또는 New Relic, Datadog 등의 서비스 활용.

---

더 많은 정보는 [README.md](../README.md)를 참조하세요.
