# 과신 오류 탐지 시스템 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7 (데이터베이스 읽기 권한 필요)

### 권장 사양
- PHP 메모리: 256MB 이상
- PHP 실행 시간: 최대 300초
- MySQL 스토리지: 최소 1GB

## 1단계: 파일 설치

### 1.1 소스 코드 다운로드

```bash
cd /var/www/html
git clone <repository-url> overconfidence-detector
cd overconfidence-detector
```

### 1.2 디렉토리 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 권한 설정
chmod 755 public
chmod 755 src
chmod 777 logs

# 웹서버 사용자에게 소유권 부여
chown -R www-data:www-data .
```

## 2단계: 데이터베이스 설정

### 2.1 데이터베이스 생성

MySQL에 로그인:
```bash
mysql -u root -p
```

데이터베이스 생성:
```sql
CREATE DATABASE overconfidence_detector
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 전용 사용자 생성
CREATE USER 'ocd_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON overconfidence_detector.* TO 'ocd_user'@'localhost';

-- Moodle 데이터베이스 읽기 전용 사용자 생성
CREATE USER 'moodle_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 2.2 스키마 임포트

```bash
mysql -u ocd_user -p overconfidence_detector < sql/schema.sql
```

## 3단계: 설정 파일 구성

### 3.1 데이터베이스 설정

```bash
cp config/database.example.php config/database.php
nano config/database.php
```

`config/database.php` 수정:
```php
<?php
return [
    'main' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'overconfidence_detector',
        'username' => 'ocd_user',
        'password' => 'your_secure_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ],
    'moodle' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'moodle',
        'username' => 'moodle_readonly',
        'password' => 'readonly_password',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => 'mdl_', // Moodle 테이블 접두사 확인 필수!
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ]
];
```

### 3.2 앱 설정 확인

`config/app.php`에서 필요한 설정 조정:
```php
'detection' => [
    'thresholds' => [
        'caution' => -1.5,  // Level 1
        'warning' => -2.0,  // Level 2
        'danger' => -2.5,   // Level 3
    ],
    'min_sample_size' => 30,
],
```

## 4단계: 웹서버 설정

### 4.1 Apache 설정

VirtualHost 설정 파일 생성:
```bash
nano /etc/apache2/sites-available/overconfidence.conf
```

내용:
```apache
<VirtualHost *:80>
    ServerName overconfidence.example.com
    DocumentRoot /var/www/html/overconfidence-detector/public

    <Directory /var/www/html/overconfidence-detector/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/overconfidence-error.log
    CustomLog ${APACHE_LOG_DIR}/overconfidence-access.log combined
</VirtualHost>
```

사이트 활성화:
```bash
a2ensite overconfidence
a2enmod rewrite
systemctl reload apache2
```

### 4.2 .htaccess 파일

`public/.htaccess` 생성:
```apache
# 디렉토리 인덱싱 비활성화
Options -Indexes

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300

# 보안 헤더
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# URL 리라이팅
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### 4.3 Nginx 설정 (선택사항)

```nginx
server {
    listen 80;
    server_name overconfidence.example.com;
    root /var/www/html/overconfidence-detector/public;

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
}
```

## 5단계: 초기 데이터 동기화

### 5.1 수동 동기화 실행

```bash
cd /var/www/html/overconfidence-detector
php cron/sync.php
```

출력 예시:
```
=================================================
Overconfidence Detection - Sync & Analysis
Started at: 2024-01-15 10:00:00
=================================================

[1/2] Syncing data from Moodle...
  ✓ Quizzes synced: 15
  ✓ Students synced: 250
  ✓ Questions synced: 120
  ✓ Attempts synced: 3500

[2/2] Running overconfidence detection...
  ✓ New flags created: 42

=================================================
Completed successfully at: 2024-01-15 10:02:30
=================================================
```

## 6단계: Cron 작업 설정

### 6.1 Crontab 등록

```bash
crontab -e
```

추가할 내용:
```cron
# 과신 오류 탐지 - 10분마다 실행
*/10 * * * * php /var/www/html/overconfidence-detector/cron/sync.php >> /var/log/overconfidence-cron.log 2>&1
```

### 6.2 Cron 로그 확인

```bash
tail -f /var/log/overconfidence-cron.log
```

## 7단계: 설치 확인

### 7.1 웹 접속 테스트

브라우저에서 접속:
```
http://overconfidence.example.com
```

### 7.2 데이터 확인

MySQL에서 데이터 확인:
```sql
USE overconfidence_detector;

-- 동기화된 데이터 확인
SELECT COUNT(*) FROM quizzes;
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM attempts;

-- 플래그 확인
SELECT COUNT(*) FROM overconfidence_flags;
SELECT flag_level, COUNT(*) FROM overconfidence_flags GROUP BY flag_level;
```

### 7.3 대시보드 접속

```
http://overconfidence.example.com/dashboard.php
```

## 8단계: 보안 설정 (프로덕션 필수)

### 8.1 디버그 모드 비활성화

`config/app.php`:
```php
'app' => [
    'debug' => false, // 프로덕션에서는 반드시 false
],
```

### 8.2 데이터베이스 비밀번호 강화

```bash
mysql -u root -p
```

```sql
ALTER USER 'ocd_user'@'localhost' IDENTIFIED BY 'very_strong_password_here';
FLUSH PRIVILEGES;
```

### 8.3 파일 권한 재확인

```bash
chmod 640 config/database.php
chmod 755 public
find . -type f -name "*.php" -exec chmod 644 {} \;
```

### 8.4 HTTPS 설정 (권장)

Let's Encrypt를 사용한 무료 SSL 인증서:
```bash
apt install certbot python3-certbot-apache
certbot --apache -d overconfidence.example.com
```

## 문제 해결

### 로그 확인

```bash
# 애플리케이션 로그
tail -f logs/app.log

# 웹서버 로그
tail -f /var/log/apache2/overconfidence-error.log

# PHP 에러 로그
tail -f /var/log/php7.1-fpm.log
```

### 일반적인 문제

#### 1. 데이터베이스 연결 실패
- `config/database.php` 설정 확인
- MySQL 서비스 실행 확인: `systemctl status mysql`
- 방화벽 확인

#### 2. Moodle 데이터 동기화 실패
- Moodle 테이블 접두사(`prefix`) 확인
- Moodle DB 읽기 권한 확인
- Moodle 버전 호환성 확인 (3.7 권장)

#### 3. 과신 오류 탐지 안됨
- 샘플 데이터가 충분한지 확인 (최소 30개)
- `config/app.php`의 `min_sample_size` 설정 확인
- 통계 계산 실행: `php cron/sync.php`

#### 4. 권한 오류
```bash
chown -R www-data:www-data /var/www/html/overconfidence-detector
chmod 777 logs
```

## 업데이트

```bash
cd /var/www/html/overconfidence-detector
git pull origin main
php cron/sync.php  # 데이터 재동기화
```

## 지원

문제가 발생하면:
1. `logs/app.log` 확인
2. GitHub Issues에 보고
3. 문서 확인: README.md

## 다음 단계

설치가 완료되면:
1. 교사 계정으로 대시보드 접속
2. 위험 학생 목록 확인
3. 과신 오류 플래그 검토
4. 학생에게 피드백 제공

설치 완료를 축하합니다! 🎉
