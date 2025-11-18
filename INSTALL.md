# 설치 가이드

## AI 개인화 학습 시스템 - 상세 설치 가이드

이 문서는 AI 개인화 학습 시스템을 처음부터 설치하는 방법을 단계별로 설명합니다.

## 목차

1. [시스템 요구사항](#1-시스템-요구사항)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [프로덕션 환경 설정](#3-프로덕션-환경-설정)
4. [문제 해결](#4-문제-해결)

---

## 1. 시스템 요구사항

### 소프트웨어 요구사항

- **운영체제**: Linux (Ubuntu 18.04+), Windows 10+, macOS 10.14+
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **웹 브라우저**: Chrome, Firefox, Safari 최신 버전

### 하드웨어 요구사항

- **최소**: 2GB RAM, 10GB 디스크 공간
- **권장**: 4GB RAM, 20GB 디스크 공간

---

## 2. 개발 환경 설정

### Option 1: XAMPP 사용 (Windows/Mac/Linux)

#### 1. XAMPP 설치

1. [XAMPP 다운로드](https://www.apachefriends.org/download.html)
2. PHP 7.1.9+ 버전 선택
3. 설치 진행

#### 2. XAMPP 실행

```bash
# Windows
C:\xampp\xampp-control.exe 실행

# Linux/Mac
sudo /opt/lampp/lampp start
```

#### 3. 프로젝트 복사

```bash
# Windows
xcopy /E /I alt42standalone_v1.0 C:\xampp\htdocs\lms

# Linux/Mac
sudo cp -r alt42standalone_v1.0 /opt/lampp/htdocs/lms
```

#### 4. MySQL 설정

```bash
# phpMyAdmin 접속: http://localhost/phpmyadmin
# 또는 MySQL 콘솔:
mysql -u root -p
```

```sql
CREATE DATABASE ai_education_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_education_lms;
SOURCE C:/xampp/htdocs/lms/database/schema.sql;
```

#### 5. 데이터베이스 연결 설정

`C:\xampp\htdocs\lms\api\config\database.php` 수정:

```php
private $host = "localhost";
private $db_name = "ai_education_lms";
private $username = "root";
private $password = "";  // XAMPP 기본값은 빈 문자열
```

#### 6. 테스트

브라우저에서 접속:
```
http://localhost/lms/public/
```

---

### Option 2: Docker 사용

#### 1. Docker 설치

- [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop)

#### 2. docker-compose.yml 생성

프로젝트 루트에 `docker-compose.yml` 생성:

```yaml
version: '3.8'

services:
  web:
    image: php:7.4-apache
    container_name: lms_web
    ports:
      - "8080:80"
    volumes:
      - ./:/var/www/html
      - ./docker/apache.conf:/etc/apache2/sites-available/000-default.conf
    depends_on:
      - db
    environment:
      - APACHE_DOCUMENT_ROOT=/var/www/html/public

  db:
    image: mysql:5.7
    container_name: lms_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ai_education_lms
      MYSQL_USER: lms_user
      MYSQL_PASSWORD: lms_password
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: lms_phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: db
      PMA_USER: root
      PMA_PASSWORD: root

volumes:
  db_data:
```

#### 3. Docker 실행

```bash
docker-compose up -d
```

#### 4. 데이터베이스 연결 설정

`api/config/database.php` 수정:

```php
private $host = "db";  // Docker 컨테이너 이름
private $db_name = "ai_education_lms";
private $username = "lms_user";
private $password = "lms_password";
```

#### 5. 테스트

```
http://localhost:8080
http://localhost:8081 (phpMyAdmin)
```

---

### Option 3: 네이티브 설치 (Linux Ubuntu)

#### 1. Apache, PHP, MySQL 설치

```bash
sudo apt update
sudo apt install apache2 -y
sudo apt install php php-mysql php-pdo php-mbstring php-json -y
sudo apt install mysql-server -y
```

#### 2. MySQL 보안 설정

```bash
sudo mysql_secure_installation
```

#### 3. Apache 설정

```bash
# DocumentRoot 설정
sudo nano /etc/apache2/sites-available/000-default.conf
```

DocumentRoot를 `/var/www/html/lms/public`으로 변경

```bash
# mod_rewrite 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### 4. 프로젝트 설치

```bash
sudo cp -r alt42standalone_v1.0 /var/www/html/lms
sudo chown -R www-data:www-data /var/www/html/lms
sudo chmod -R 755 /var/www/html/lms
```

#### 5. MySQL 설정

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ai_education_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ai_education_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
USE ai_education_lms;
SOURCE /var/www/html/lms/database/schema.sql;
EXIT;
```

#### 6. 데이터베이스 연결 설정

```bash
sudo nano /var/www/html/lms/api/config/database.php
```

```php
private $host = "localhost";
private $db_name = "ai_education_lms";
private $username = "lms_user";
private $password = "your_secure_password";
```

#### 7. 테스트

```
http://localhost
```

---

## 3. 프로덕션 환경 설정

### 보안 설정

#### 1. PHP 에러 표시 비활성화

`api/config/config.php` 수정:

```php
// Production 환경
error_reporting(0);
ini_set('display_errors', 0);
```

#### 2. 데이터베이스 사용자 권한 제한

```sql
-- 읽기/쓰기만 허용, DDL 권한 제거
REVOKE ALL PRIVILEGES ON ai_education_lms.* FROM 'lms_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_education_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. HTTPS 설정 (SSL/TLS)

```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

#### 4. 방화벽 설정

```bash
sudo ufw allow 'Apache Full'
sudo ufw allow 22  # SSH
sudo ufw enable
```

### 성능 최적화

#### 1. PHP OPcache 활성화

```bash
sudo nano /etc/php/7.4/apache2/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

#### 2. MySQL 쿼리 캐시 설정

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

#### 3. Apache 압축 활성화

```bash
sudo a2enmod deflate
sudo systemctl restart apache2
```

### 백업 설정

#### 1. MySQL 백업 스크립트

`/usr/local/bin/backup_lms.sh` 생성:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/lms"
mkdir -p $BACKUP_DIR

mysqldump -u lms_user -p'your_password' ai_education_lms > $BACKUP_DIR/lms_$TIMESTAMP.sql
find $BACKUP_DIR -type f -mtime +7 -delete  # 7일 이상 된 백업 삭제
```

#### 2. Cron 작업 설정

```bash
sudo crontab -e
```

```
# 매일 새벽 2시에 백업
0 2 * * * /usr/local/bin/backup_lms.sh
```

---

## 4. 문제 해결

### 일반적인 문제

#### 1. "Connection refused" 오류

**원인**: MySQL이 실행되지 않음

**해결**:
```bash
# Linux
sudo systemctl start mysql
sudo systemctl status mysql

# Windows (XAMPP)
XAMPP Control Panel에서 MySQL Start
```

#### 2. "Access denied" 오류

**원인**: 잘못된 데이터베이스 자격 증명

**해결**:
1. `api/config/database.php`에서 사용자명/비밀번호 확인
2. MySQL에서 사용자 권한 확인:
```sql
SHOW GRANTS FOR 'lms_user'@'localhost';
```

#### 3. "404 Not Found" - API 엔드포인트

**원인**: mod_rewrite가 활성화되지 않음

**해결**:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### 4. JavaScript CORS 오류

**원인**: API Base URL이 잘못 설정됨

**해결**:
`public/js/app.js`에서 API_BASE_URL 수정:
```javascript
const API_BASE_URL = 'http://your-domain.com/api/endpoints';
```

#### 5. 한글이 깨짐

**원인**: 데이터베이스 인코딩 문제

**해결**:
```sql
ALTER DATABASE ai_education_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE students CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 로그 확인

#### Apache 로그
```bash
# Error log
sudo tail -f /var/log/apache2/error.log

# Access log
sudo tail -f /var/log/apache2/access.log
```

#### MySQL 로그
```bash
sudo tail -f /var/log/mysql/error.log
```

#### PHP 로그
```bash
sudo tail -f /var/log/php7.4-fpm.log
```

---

## 추가 리소스

- [PHP 공식 문서](https://www.php.net/docs.php)
- [MySQL 공식 문서](https://dev.mysql.com/doc/)
- [Apache 공식 문서](https://httpd.apache.org/docs/)
- [Bootstrap 4 문서](https://getbootstrap.com/docs/4.5/)

## 지원

설치 중 문제가 발생하면 GitHub Issues에 등록해주세요.
