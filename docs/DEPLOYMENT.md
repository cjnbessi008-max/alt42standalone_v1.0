# Deviation Breeze - 배포 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [Docker를 이용한 배포 (권장)](#docker를-이용한-배포-권장)
3. [수동 배포](#수동-배포)
4. [Moodle 연동 설정](#moodle-연동-설정)
5. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 최소 요구사항
- **OS**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 macOS
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 10GB 여유 공간

### 소프트웨어
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache**: 2.4+ 또는 Nginx
- **Composer**: 1.x
- **Docker** (Docker 배포 시): 20.10+
- **Docker Compose** (Docker 배포 시): 1.29+

---

## Docker를 이용한 배포 (권장)

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/deviation-breeze.git
cd deviation-breeze
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 설정:

```bash
# Application Settings
APP_NAME="Deviation Breeze"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=deviation_breeze
DB_USERNAME=deviation_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Moodle Integration
MOODLE_URL=https://your-moodle-site.com
MOODLE_WS_TOKEN=YOUR_MOODLE_WS_TOKEN_HERE

# Security
SESSION_SECRET=YOUR_RANDOM_SECRET_HERE
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_HERE
```

### 3. Docker 컨테이너 실행

```bash
cd docker
docker-compose up -d
```

### 4. 서비스 확인

```bash
docker-compose ps
```

모든 컨테이너가 `Up` 상태인지 확인합니다.

### 5. 데이터베이스 초기화 확인

```bash
docker-compose exec mysql mysql -u deviation_user -p -e "USE deviation_breeze; SHOW TABLES;"
```

### 6. 접속 확인

브라우저에서 접속:
- **애플리케이션**: http://localhost:8080/frontend/
- **phpMyAdmin**: http://localhost:8081

### 7. Composer 의존성 설치 (필요시)

```bash
docker-compose exec app composer install --working-dir=/var/www/html/backend
```

---

## 수동 배포

### 1. PHP 및 확장 설치

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y php7.1 php7.1-cli php7.1-fpm php7.1-mysql \
    php7.1-curl php7.1-gd php7.1-mbstring php7.1-xml php7.1-zip
```

#### CentOS/RHEL
```bash
sudo yum install -y php71 php71-cli php71-fpm php71-mysqlnd \
    php71-curl php71-gd php71-mbstring php71-xml php71-zip
```

### 2. MySQL 설치

```bash
# Ubuntu/Debian
sudo apt-get install -y mysql-server-5.7

# CentOS/RHEL
sudo yum install -y mysql-community-server
```

MySQL 시작:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3. 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE deviation_breeze CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'deviation_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON deviation_breeze.* TO 'deviation_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 스키마 적용

```bash
mysql -u deviation_user -p deviation_breeze < database/schema.sql
```

### 5. Apache 설정

`/etc/apache2/sites-available/deviation-breeze.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/deviation-breeze

    <Directory /var/www/deviation-breeze>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /frontend /var/www/deviation-breeze/frontend
    Alias /backend/public /var/www/deviation-breeze/backend/public

    <Directory /var/www/deviation-breeze/backend/public>
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.php [QSA,L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/deviation-breeze-error.log
    CustomLog ${APACHE_LOG_DIR}/deviation-breeze-access.log combined
</VirtualHost>
```

사이트 활성화:
```bash
sudo a2ensite deviation-breeze
sudo a2enmod rewrite headers
sudo systemctl reload apache2
```

### 6. Composer 의존성 설치

```bash
cd backend
composer install --no-dev --optimize-autoloader
```

### 7. 권한 설정

```bash
sudo chown -R www-data:www-data /var/www/deviation-breeze
sudo chmod -R 755 /var/www/deviation-breeze
```

---

## Moodle 연동 설정

상세한 Moodle 설정은 [MOODLE_SETUP.md](MOODLE_SETUP.md)를 참조하세요.

### 간단 요약

1. Moodle 관리자 로그인
2. **사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스 관리**
3. "새 서비스 추가" 클릭
4. 필요한 함수 추가:
   - `core_course_get_courses`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`
   - `core_user_get_users`
   - `core_enrol_get_enrolled_users`
5. 토큰 생성 및 `.env`에 설정

---

## SSL/TLS 설정 (프로덕션)

### Let's Encrypt 사용

```bash
sudo apt-get install -y certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

자동 갱신 설정:
```bash
sudo crontab -e
```

추가:
```
0 3 * * * certbot renew --quiet
```

---

## 성능 최적화

### PHP 최적화

`/etc/php/7.1/apache2/php.ini` 편집:

```ini
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 50M
post_max_size = 50M
opcache.enable = 1
opcache.memory_consumption = 128
opcache.max_accelerated_files = 10000
```

### MySQL 최적화

`/etc/mysql/mysql.conf.d/mysqld.cnf` 편집:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 64M
max_connections = 500
```

MySQL 재시작:
```bash
sudo systemctl restart mysql
```

---

## 백업

### 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/deviation-breeze"

mkdir -p $BACKUP_DIR

mysqldump -u deviation_user -p deviation_breeze > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

크론탭 설정 (매일 새벽 2시):
```bash
0 2 * * * /path/to/backup.sh
```

---

## 모니터링

### 로그 확인

```bash
# Apache 로그
tail -f /var/log/apache2/deviation-breeze-error.log

# MySQL 로그
tail -f /var/log/mysql/error.log

# Docker 로그 (Docker 사용 시)
docker-compose logs -f app
```

### 시스템 상태 확인

```bash
# 서비스 상태
sudo systemctl status apache2
sudo systemctl status mysql

# Docker 상태
docker-compose ps
```

---

## 문제 해결

### Moodle 연결 실패

**증상**: "Moodle 연결 실패" 메시지

**해결 방법**:
1. `.env` 파일에서 `MOODLE_URL`과 `MOODLE_WS_TOKEN` 확인
2. Moodle에서 웹 서비스가 활성화되어 있는지 확인
3. 방화벽 규칙 확인

```bash
curl -X POST "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json"
```

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결 방법**:
1. MySQL 서비스 실행 확인:
   ```bash
   sudo systemctl status mysql
   ```
2. 데이터베이스 자격 증명 확인
3. 연결 테스트:
   ```bash
   mysql -h localhost -u deviation_user -p deviation_breeze
   ```

### PHP 확장 누락

**증상**: "Class 'PDO' not found"

**해결 방법**:
```bash
sudo apt-get install -y php7.1-mysql
sudo systemctl restart apache2
```

### 권한 오류

**증상**: "Permission denied"

**해결 방법**:
```bash
sudo chown -R www-data:www-data /var/www/deviation-breeze
sudo chmod -R 755 /var/www/deviation-breeze
```

### Docker 메모리 부족

**증상**: 컨테이너가 자주 재시작됨

**해결 방법**:
Docker Desktop 설정에서 메모리 할당량 증가 (최소 4GB 권장)

---

## 업데이트

### Git Pull 업데이트

```bash
cd /var/www/deviation-breeze
git pull origin main
composer install --no-dev
sudo systemctl reload apache2
```

### Docker 업데이트

```bash
cd /var/www/deviation-breeze/docker
docker-compose pull
docker-compose up -d --force-recreate
```

---

## 지원

문제가 지속되면:
- **이슈 트래커**: https://github.com/your-org/deviation-breeze/issues
- **이메일**: support@kaist.edu
- **문서**: https://docs.deviation-breeze.com

---

**최종 수정일**: 2025-11-18
**버전**: 1.0.0
