# Step Derivative 설치 가이드

## 시스템 요구사항

### 소프트웨어 요구사항

- **운영 체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 (정확히 이 버전 권장)
- **MySQL**: 5.7.x
- **Moodle**: 3.7.x

### 하드웨어 요구사항

- **최소**: 2GB RAM, 10GB 디스크 공간
- **권장**: 4GB+ RAM, 20GB+ 디스크 공간

## 단계별 설치

### 1단계: PHP 7.1.9 설치

#### Ubuntu/Debian

```bash
# 저장소 추가
sudo add-apt-repository ppa:ondrej/php
sudo apt-get update

# PHP 7.1 설치
sudo apt-get install -y php7.1 php7.1-fpm php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring php7.1-xml

# 버전 확인
php -v  # PHP 7.1.9 확인
```

#### CentOS/RHEL

```bash
# Remi 저장소 설치
sudo yum install -y epel-release
sudo yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm

# PHP 7.1 활성화 및 설치
sudo yum-config-manager --enable remi-php71
sudo yum install -y php php-fpm php-mysql php-curl php-json php-mbstring php-xml

# 버전 확인
php -v
```

### 2단계: MySQL 5.7 설치

#### Ubuntu/Debian

```bash
# MySQL 5.7 저장소 추가
wget https://dev.mysql.com/get/mysql-apt-config_0.8.12-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.12-1_all.deb
sudo apt-get update

# MySQL 5.7 설치
sudo apt-get install -y mysql-server-5.7

# MySQL 보안 설정
sudo mysql_secure_installation
```

#### CentOS/RHEL

```bash
# MySQL 5.7 저장소 추가
sudo yum localinstall -y https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm

# MySQL 5.7 설치
sudo yum install -y mysql-community-server

# MySQL 시작
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 임시 비밀번호 확인 및 변경
sudo grep 'temporary password' /var/log/mysqld.log
sudo mysql_secure_installation
```

### 3단계: 웹 서버 설치

#### Apache 설치

```bash
# Ubuntu/Debian
sudo apt-get install -y apache2 libapache2-mod-php7.1

# CentOS/RHEL
sudo yum install -y httpd

# 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod proxy_fcgi

# 시작
sudo systemctl start apache2   # Ubuntu
sudo systemctl start httpd     # CentOS
sudo systemctl enable apache2  # Ubuntu
sudo systemctl enable httpd    # CentOS
```

#### Nginx 설치 (대안)

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx php7.1-fpm

# CentOS/RHEL
sudo yum install -y nginx php-fpm

# 시작
sudo systemctl start nginx
sudo systemctl start php7.1-fpm  # Ubuntu
sudo systemctl start php-fpm     # CentOS
sudo systemctl enable nginx
sudo systemctl enable php7.1-fpm # Ubuntu
sudo systemctl enable php-fpm    # CentOS
```

### 4단계: Step Derivative 다운로드

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/step-derivative
cd /var/www/step-derivative

# 파일 복사 (저장소에서 클론한 경우)
sudo cp -r /path/to/source/step-derivative/* .

# 또는 직접 다운로드
# (GitHub 또는 배포 서버에서)
```

### 5단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE step_derivative CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stepderivative'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON step_derivative.* TO 'stepderivative'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u stepderivative -p step_derivative < database/schema.sql
```

### 6단계: 환경 설정

```bash
# .env 파일 생성
cd /var/www/step-derivative
sudo cp .env.example .env
sudo nano .env
```

`.env` 파일 수정:

```ini
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=step_derivative
DB_USER=stepderivative
DB_PASS=your_secure_password

# Moodle Configuration (다음 단계에서 설정)
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=
MOODLE_SERVICE=step_derivative_service

# Application Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com/step-derivative
```

### 7단계: 파일 권한 설정

```bash
# 소유권 변경
sudo chown -R www-data:www-data /var/www/step-derivative  # Ubuntu
sudo chown -R apache:apache /var/www/step-derivative      # CentOS

# 권한 설정
sudo find /var/www/step-derivative -type d -exec chmod 755 {} \;
sudo find /var/www/step-derivative -type f -exec chmod 644 {} \;

# 로그 디렉토리 생성 (필요시)
sudo mkdir -p /var/www/step-derivative/logs
sudo chown www-data:www-data /var/www/step-derivative/logs  # Ubuntu
sudo chown apache:apache /var/www/step-derivative/logs      # CentOS
sudo chmod 775 /var/www/step-derivative/logs
```

### 8단계: 웹 서버 설정

#### Apache 가상 호스트 설정

```bash
# 설정 파일 생성
sudo nano /etc/apache2/sites-available/step-derivative.conf  # Ubuntu
sudo nano /etc/httpd/conf.d/step-derivative.conf            # CentOS
```

설정 내용:

```apache
<VirtualHost *:80>
    ServerName step-derivative.yourdomain.com
    DocumentRoot /var/www/step-derivative/frontend

    # Frontend 디렉토리
    <Directory /var/www/step-derivative/frontend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Backend API
    Alias /api /var/www/step-derivative/backend/api
    <Directory /var/www/step-derivative/backend/api>
        Options -Indexes
        AllowOverride All
        Require all granted

        # PHP 처리
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/step-derivative-error.log
    CustomLog ${APACHE_LOG_DIR}/step-derivative-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화 (Ubuntu)
sudo a2ensite step-derivative
sudo systemctl reload apache2

# CentOS
sudo systemctl reload httpd
```

#### Nginx 가상 호스트 설정 (대안)

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/step-derivative  # Ubuntu
sudo nano /etc/nginx/conf.d/step-derivative.conf     # CentOS
```

설정 내용:

```nginx
server {
    listen 80;
    server_name step-derivative.yourdomain.com;
    root /var/www/step-derivative/frontend;

    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        alias /var/www/step-derivative/backend/api/;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 로그
    access_log /var/log/nginx/step-derivative-access.log;
    error_log /var/log/nginx/step-derivative-error.log;
}
```

```bash
# 사이트 활성화 (Ubuntu)
sudo ln -s /etc/nginx/sites-available/step-derivative /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# CentOS
sudo nginx -t
sudo systemctl reload nginx
```

### 9단계: Moodle 웹 서비스 설정

1. **Moodle 관리자 계정으로 로그인**

2. **웹 서비스 활성화**
   - **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
   - 저장

3. **외부 서비스 생성**
   - **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "외부 서비스 추가" 클릭
   - 이름: `step_derivative_service`
   - 짧은 이름: `stepderiv`
   - "활성화됨" 체크
   - 저장

4. **함수 추가**
   - 생성한 서비스의 "함수" 클릭
   - 다음 함수들을 추가:
     - `core_question_get_question_data`
     - `core_user_get_users_by_field`
     - `core_course_get_courses`
     - `core_grades_update_grades`
     - `core_webservice_get_site_info`

5. **토큰 생성**
   - **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 추가" 클릭
   - 사용자: 관리자 또는 전용 사용자
   - 서비스: `step_derivative_service`
   - 저장
   - **생성된 토큰을 복사하여 `.env` 파일의 `MOODLE_TOKEN`에 입력**

6. **프로토콜 활성화**
   - **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - "REST 프로토콜" 활성화

### 10단계: 설치 검증

```bash
# 데이터베이스 연결 테스트
mysql -u stepderivative -p step_derivative -e "SHOW TABLES;"

# PHP 설정 확인
php -i | grep -i mysql
php -i | grep -i pdo

# 웹 서버 접근 테스트
curl http://localhost/step-derivative/frontend/index.html

# API 엔드포인트 테스트
curl http://localhost/step-derivative/api/problem_handler.php/get_problem?problem_id=1
```

### 11단계: 테스트 데이터 생성

```bash
# MySQL 접속
mysql -u stepderivative -p step_derivative

# 테스트 문제 삽입
INSERT INTO problems (moodle_course_id, moodle_quiz_id, moodle_question_id, expression, difficulty_level)
VALUES (1, 1, 1, 'x^2', 'basic');

# 브라우저에서 테스트
# http://your-domain/step-derivative/frontend/index.html?problem_id=1&user_id=1
```

## SSL/HTTPS 설정 (프로덕션 권장)

### Let's Encrypt 인증서 설치

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-apache  # Apache
sudo apt-get install -y certbot python3-certbot-nginx   # Nginx

# 인증서 발급 및 자동 설정
sudo certbot --apache -d step-derivative.yourdomain.com  # Apache
sudo certbot --nginx -d step-derivative.yourdomain.com   # Nginx

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 문제 해결

### PHP 확장 모듈 누락

```bash
# 필요한 확장 설치
sudo apt-get install -y php7.1-pdo php7.1-pdo-mysql php7.1-curl

# PHP-FPM 재시작
sudo systemctl restart php7.1-fpm
```

### MySQL 연결 오류

```bash
# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# 포트 확인
sudo netstat -tulpn | grep mysql

# 방화벽 확인
sudo ufw allow 3306  # Ubuntu
sudo firewall-cmd --add-port=3306/tcp --permanent  # CentOS
```

### 권한 문제

```bash
# SELinux 확인 (CentOS)
sudo getenforce
sudo setsebool -P httpd_can_network_connect_db 1
sudo setsebool -P httpd_can_network_connect 1

# AppArmor 확인 (Ubuntu)
sudo aa-status
```

## 성능 튜닝

### PHP-FPM 설정

```bash
sudo nano /etc/php/7.1/fpm/pool.d/www.conf
```

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
```

### MySQL 최적화

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

## 백업 설정

### 데이터베이스 백업 스크립트

```bash
sudo nano /usr/local/bin/backup-stepderivative.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/step-derivative"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
mysqldump -u stepderivative -p'your_password' step_derivative > $BACKUP_DIR/db_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-stepderivative.sh

# Cron 작업 추가 (매일 새벽 2시)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-stepderivative.sh
```

## 다음 단계

설치가 완료되었습니다! 이제 다음을 진행하세요:

1. [사용자 가이드](README.md#사용-방법) 참조
2. Moodle 퀴즈에 통합
3. 커스터마이징 적용
4. 모니터링 설정

## 지원

설치 중 문제가 발생하면 이슈 트래커에 보고해주세요.
