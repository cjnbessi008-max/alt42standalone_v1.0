# Vector 3D Sense - 설치 가이드

## 1. 사전 준비

### 필수 소프트웨어

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Apache 설치
sudo apt install apache2 -y

# PHP 7.1.9 설치
sudo apt install php7.1 php7.1-mysql php7.1-mbstring php7.1-xml php7.1-curl -y

# MySQL 5.7 설치
sudo apt install mysql-server-5.7 -y

# Apache PHP 모듈 활성화
sudo a2enmod php7.1
sudo a2enmod rewrite
sudo a2enmod headers
```

## 2. 데이터베이스 설정

### 2.1 MySQL 보안 설정

```bash
sudo mysql_secure_installation
```

### 2.2 데이터베이스 생성

```bash
# MySQL 접속
sudo mysql -u root -p

# 또는 설정 스크립트 실행
sudo mysql -u root -p < /path/to/vector3d-sense/config/database.sql
```

### 2.3 수동 설정 (선택사항)

```sql
-- 데이터베이스 생성
CREATE DATABASE vector3d_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'vector3d_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 권한 부여
GRANT ALL PRIVILEGES ON vector3d_sense.* TO 'vector3d_user'@'localhost';
FLUSH PRIVILEGES;

-- 테이블 생성
USE vector3d_sense;
SOURCE /path/to/vector3d-sense/database/schema.sql;

-- 설치 확인
SHOW TABLES;
SELECT COUNT(*) FROM vector_templates;
```

## 3. 애플리케이션 설치

### 3.1 파일 배포

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/vector3d-sense

# 웹 서버 디렉토리에 복사
sudo cp -r . /var/www/html/vector3d-sense/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/vector3d-sense
sudo chmod -R 755 /var/www/html/vector3d-sense
sudo chmod -R 775 /var/www/html/vector3d-sense/config
```

### 3.2 설정 파일 수정

```bash
# Moodle 연동 설정 파일 편집
sudo nano /var/www/html/vector3d-sense/moodle-integration/config.php
```

**중요 설정 항목:**

```php
<?php
// 데이터베이스 설정
$CFG->vector3d_dbhost = 'localhost';
$CFG->vector3d_dbname = 'vector3d_sense';
$CFG->vector3d_dbuser = 'vector3d_user';
$CFG->vector3d_dbpass = 'your_actual_password_here';  // 실제 비밀번호로 변경

// API 기본 URL (실제 도메인으로 변경)
$CFG->vector3d_api_base_url = 'https://your-domain.com/vector3d-sense/api';

// 디버그 모드 (프로덕션에서는 false)
$CFG->vector3d_debug = false;
```

## 4. Apache 웹 서버 설정

### 4.1 Virtual Host 생성

```bash
# Apache 설정 파일 생성
sudo nano /etc/apache2/sites-available/vector3d.conf
```

**설정 내용:**

```apache
<VirtualHost *:80>
    ServerName vector3d.example.com
    ServerAdmin admin@example.com

    DocumentRoot /var/www/html/vector3d-sense/webapp

    <Directory /var/www/html/vector3d-sense/webapp>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 경로
    Alias /api /var/www/html/vector3d-sense/api
    <Directory /var/www/html/vector3d-sense/api>
        Options -Indexes
        AllowOverride All
        Require all granted

        <FilesMatch \.php$>
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # CORS (필요시)
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"

    ErrorLog ${APACHE_LOG_DIR}/vector3d-error.log
    CustomLog ${APACHE_LOG_DIR}/vector3d-access.log combined
</VirtualHost>
```

### 4.2 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite vector3d.conf

# 기본 사이트 비활성화 (선택사항)
sudo a2dissite 000-default.conf

# 설정 테스트
sudo apache2ctl configtest

# Apache 재시작
sudo systemctl restart apache2
```

### 4.3 .htaccess 설정

```bash
# webapp/.htaccess 생성
sudo nano /var/www/html/vector3d-sense/webapp/.htaccess
```

```apache
# Enable rewrite engine
RewriteEngine On

# Force HTTPS (선택사항)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security
<FilesMatch "\.(sql|md|json)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

## 5. Moodle 연동

### 5.1 Moodle 플러그인 설치

```bash
# Moodle 디렉토리로 이동
cd /var/www/moodle

# local 플러그인 디렉토리 생성
sudo mkdir -p local/vector3d_sense

# 연동 파일 복사
sudo cp -r /var/www/html/vector3d-sense/moodle-integration/* local/vector3d_sense/

# 권한 설정
sudo chown -R www-data:www-data local/vector3d_sense
```

### 5.2 Moodle 업그레이드

1. 브라우저에서 Moodle 접속
2. 관리자로 로그인
3. **Site administration** → **Notifications**
4. "Upgrade Moodle database now" 클릭

### 5.3 플러그인 설정

1. **Site administration** → **Plugins** → **Local plugins** → **Vector 3D Sense**
2. 설정 확인:
   - API URL: `https://your-domain.com/vector3d-sense/api`
   - Enable: Yes
   - Debug mode: No (프로덕션)

## 6. 설치 검증

### 6.1 데이터베이스 연결 테스트

```bash
# 테스트 스크립트 생성
cat > /tmp/test_db.php << 'EOF'
<?php
require_once('/var/www/html/vector3d-sense/moodle-integration/config.php');
require_once('/var/www/html/vector3d-sense/moodle-integration/db_connector.php');

try {
    $db = Vector3DDatabase::getInstance();
    echo "✓ Database connection successful!\n";

    $conn = $db->getConnection();
    $result = $conn->query("SELECT COUNT(*) as count FROM vector_templates");
    $row = $result->fetch_assoc();
    echo "✓ Found {$row['count']} templates in database\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
EOF

# 실행
php /tmp/test_db.php
```

### 6.2 API 테스트

```bash
# API 엔드포인트 테스트
curl http://your-domain.com/vector3d-sense/api/

# 응답 예시:
# {
#   "status": "success",
#   "message": "Vector 3D Sense API v1.0",
#   "endpoints": [...]
# }
```

### 6.3 웹 인터페이스 테스트

브라우저에서 접속:
```
http://your-domain.com/vector3d-sense/?question_id=1&user_id=1
```

**확인 사항:**
- [ ] 가상 스마트폰 화면 표시
- [ ] 3D 렌더링 정상 동작
- [ ] 벡터 표시 확인
- [ ] 카메라 조작 가능

## 7. SSL/HTTPS 설정 (권장)

### 7.1 Let's Encrypt 인증서 설치

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-apache -y

# SSL 인증서 발급
sudo certbot --apache -d vector3d.example.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

### 7.2 Apache SSL 설정

```bash
# SSL 모듈 활성화
sudo a2enmod ssl

# Apache 재시작
sudo systemctl restart apache2
```

## 8. 성능 최적화

### 8.1 PHP 설정

```bash
sudo nano /etc/php/7.1/apache2/php.ini
```

**권장 설정:**
```ini
memory_limit = 256M
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 300
max_input_time = 300
```

### 8.2 MySQL 최적화

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

**권장 설정:**
```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

### 8.3 Apache 캐싱

```bash
# 캐싱 모듈 활성화
sudo a2enmod expires
sudo a2enmod cache
sudo systemctl restart apache2
```

## 9. 문제 해결

### 문제: "Permission denied" 오류

```bash
# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/vector3d-sense
sudo chmod -R 755 /var/www/html/vector3d-sense
```

### 문제: "Can't connect to MySQL server"

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u vector3d_user -p -h localhost vector3d_sense
```

### 문제: "500 Internal Server Error"

```bash
# Apache 에러 로그 확인
sudo tail -f /var/log/apache2/vector3d-error.log

# PHP 에러 로그 확인
sudo tail -f /var/log/apache2/error.log
```

## 10. 보안 체크리스트

- [ ] 데이터베이스 비밀번호를 강력하게 설정
- [ ] PHP debug 모드를 프로덕션에서 비활성화
- [ ] HTTPS 사용 (SSL 인증서)
- [ ] 파일 권한 확인 (755/644)
- [ ] 불필요한 파일 제거 (.git, tests/)
- [ ] 방화벽 설정 (UFW 등)
- [ ] 정기 백업 설정

## 11. 다음 단계

설치가 완료되면:

1. [사용 가이드](README.md#사용-방법) 참조
2. [API 문서](README.md#api-문서) 확인
3. 샘플 문제 생성 및 테스트
4. 학생 계정으로 접속 테스트

## 지원

문제가 발생하면:
- GitHub Issues: https://github.com/kaist/vector3d-sense/issues
- 이메일: support@kaist-touchmath.ac.kr
