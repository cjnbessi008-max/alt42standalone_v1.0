# Root Wave 설치 가이드

이 문서는 Root Wave 시스템의 상세한 설치 방법을 안내합니다.

## 시스템 요구사항

### 필수 사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7+ (선택사항, 데모 모드로 작동 가능)

### 권장 사항
- PHP 7.4+
- MySQL 8.0+
- 모던 웹 브라우저 (Chrome, Firefox, Edge)

## 단계별 설치

### 1. 시스템 준비

#### Ubuntu/Debian

```bash
# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# Apache, PHP, MySQL 설치
sudo apt install -y apache2 php7.4 php7.4-mysql php7.4-mbstring php7.4-xml php7.4-json mysql-server

# Apache 모듈 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### CentOS/RHEL

```bash
# EPEL 및 Remi 저장소 추가
sudo yum install -y epel-release
sudo yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm

# PHP 7.4 및 MySQL 설치
sudo yum-config-manager --enable remi-php74
sudo yum install -y httpd php php-mysqlnd php-mbstring php-json mysql-server

# 서비스 시작
sudo systemctl start httpd
sudo systemctl start mysqld
sudo systemctl enable httpd
sudo systemctl enable mysqld
```

### 2. MySQL 데이터베이스 설정

```bash
# MySQL 보안 설정
sudo mysql_secure_installation

# MySQL 접속
sudo mysql -u root -p
```

MySQL 콘솔에서:

```sql
-- Root Wave 데이터베이스 생성
CREATE DATABASE root_wave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'rootwave_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON root_wave.* TO 'rootwave_user'@'localhost';

-- Moodle 데이터베이스 접근 권한 (있는 경우)
GRANT SELECT ON moodle.* TO 'rootwave_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 3. 프로젝트 배포

```bash
# 프로젝트 클론
cd /var/www/html
sudo git clone <repository-url> alt42

# 권한 설정
sudo chown -R www-data:www-data alt42
sudo chmod -R 755 alt42

# 로그 디렉토리 생성
sudo mkdir -p alt42/logs
sudo chown -R www-data:www-data alt42/logs
```

### 4. 환경 설정

```bash
# 환경 파일 생성
cd /var/www/html/alt42
sudo cp .env.example .env

# 환경 파일 편집
sudo nano .env
```

`.env` 파일 내용:

```env
# Root Wave Database
DB_HOST=localhost
DB_NAME=root_wave
DB_USER=rootwave_user
DB_PASS=strong_password_here

# Moodle Database (선택사항)
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=rootwave_user
MOODLE_DB_PASS=strong_password_here

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com
```

### 5. 데이터베이스 스키마 생성

```bash
# 스키마 실행
mysql -u rootwave_user -p root_wave < /var/www/html/alt42/database/schema.sql

# 스키마 확인
mysql -u rootwave_user -p root_wave -e "SHOW TABLES;"
```

### 6. 웹 서버 설정

#### Apache 설정

```bash
# 가상 호스트 설정 파일 생성
sudo nano /etc/apache2/sites-available/rootwave.conf
```

`rootwave.conf` 내용:

```apache
<VirtualHost *:80>
    ServerName rootwave.yourdomain.com
    ServerAlias www.rootwave.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/html/alt42/public

    <Directory /var/www/html/alt42/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php7.4-fpm.sock|fcgi://localhost"
    </FilesMatch>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/rootwave_error.log
    CustomLog ${APACHE_LOG_DIR}/rootwave_access.log combined

    # HTTPS 리다이렉트 (SSL 설정 후)
    # Redirect permanent / https://rootwave.yourdomain.com/
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite rootwave.conf
sudo a2enmod proxy_fcgi setenvif
sudo a2enconf php7.4-fpm
sudo systemctl restart apache2
```

#### Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/rootwave
```

`rootwave` 내용:

```nginx
server {
    listen 80;
    server_name rootwave.yourdomain.com www.rootwave.yourdomain.com;
    root /var/www/html/alt42/public;

    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/rootwave_access.log;
    error_log /var/log/nginx/rootwave_error.log;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # HTML5 History Mode
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/rootwave /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. PHP 설정 최적화

```bash
# PHP 설정 파일 편집
sudo nano /etc/php/7.4/fpm/php.ini
```

권장 설정:

```ini
max_execution_time = 300
memory_limit = 256M
post_max_size = 20M
upload_max_filesize = 20M
date.timezone = Asia/Seoul

; 오류 표시 (운영 환경에서는 Off)
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
```

```bash
# PHP-FPM 재시작
sudo systemctl restart php7.4-fpm
```

### 8. 방화벽 설정

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 'Apache Full'
sudo ufw allow 22/tcp
sudo ufw enable

# FirewallD (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 9. SSL 인증서 설치 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-apache  # Apache
# 또는
sudo apt install -y certbot python3-certbot-nginx   # Nginx

# 인증서 발급
sudo certbot --apache -d rootwave.yourdomain.com -d www.rootwave.yourdomain.com
# 또는
sudo certbot --nginx -d rootwave.yourdomain.com -d www.rootwave.yourdomain.com

# 자동 갱신 설정
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 10. 테스트

```bash
# 웹 브라우저에서 접속
# http://rootwave.yourdomain.com

# 또는 curl로 테스트
curl http://localhost/alt42/public/

# API 테스트
curl -X POST http://localhost/alt42/src/php/moodle-api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"ping"}'
```

## Moodle 연동 (선택사항)

### 1. Moodle 데이터베이스 정보 확인

```bash
# Moodle config.php 확인
cat /path/to/moodle/config.php | grep -E "dbhost|dbname|dbuser|dbpass"
```

### 2. Moodle 퀴즈 생성

1. Moodle 관리자로 로그인
2. 코스 생성
3. 퀴즈 활동 추가
4. **계산형(calculated)** 또는 **수치형(numerical)** 문제 추가
5. 문제 텍스트에 방정식 포함 (예: `x^2 - 4 = 0`)

### 3. 연동 테스트

```bash
# Moodle DB 접속 확인
mysql -h localhost -u rootwave_user -p moodle -e "SELECT COUNT(*) FROM mdl_question;"
```

## 트러블슈팅

### 문제 1: "Permission denied" 오류

```bash
# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/alt42
sudo chmod -R 755 /var/www/html/alt42
```

### 문제 2: MySQL 연결 실패

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u rootwave_user -p -e "SELECT 1;"

# 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'rootwave_user'@'localhost';"
```

### 문제 3: PHP 오류

```bash
# PHP 오류 로그 확인
sudo tail -f /var/log/php_errors.log
sudo tail -f /var/log/apache2/error.log  # Apache
sudo tail -f /var/log/nginx/error.log    # Nginx

# PHP 모듈 확인
php -m | grep -E "pdo|mysql|json|mbstring"
```

### 문제 4: CORS 오류

브라우저에서 CORS 오류 발생 시:

```bash
# Apache
sudo nano /etc/apache2/sites-available/rootwave.conf

# 추가:
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"

sudo systemctl restart apache2
```

## 유지보수

### 정기 백업

```bash
# 데이터베이스 백업
mysqldump -u rootwave_user -p root_wave > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf alt42_backup_$(date +%Y%m%d).tar.gz /var/www/html/alt42
```

### 로그 정리

```bash
# 90일 이상 로그 삭제
mysql -u rootwave_user -p root_wave -e "CALL sp_cleanup_old_logs(90);"

# 웹 서버 로그 로테이션 (logrotate 사용)
sudo nano /etc/logrotate.d/rootwave
```

## 성능 모니터링

```bash
# MySQL 쿼리 성능
mysql -u root -p -e "SHOW PROCESSLIST;"

# Apache 상태
sudo systemctl status apache2

# PHP-FPM 상태
sudo systemctl status php7.4-fpm
```

## 보안 권장사항

1. **정기 업데이트**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **강력한 비밀번호 사용**
3. **SSL 인증서 적용**
4. **방화벽 활성화**
5. **불필요한 PHP 함수 비활성화**
```ini
disable_functions = exec,passthru,shell_exec,system
```

## 지원

문제가 발생하면 다음을 확인하세요:
- 로그 파일
- 브라우저 개발자 도구 콘솔
- MySQL 오류 로그

---

설치 완료! 🎉
