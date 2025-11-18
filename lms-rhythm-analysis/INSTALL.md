# 설치 가이드

## 빠른 설치 (Quick Start)

### 1단계: 시스템 확인

```bash
# PHP 버전 확인 (7.1.9 이상)
php -v

# MySQL 버전 확인 (5.7 이상)
mysql --version

# 필수 PHP 확장 확인
php -m | grep -E 'pdo|curl|json'
```

### 2단계: 파일 배치

```bash
# Apache의 경우
sudo cp -r lms-rhythm-analysis /var/www/html/

# Nginx의 경우
sudo cp -r lms-rhythm-analysis /usr/share/nginx/html/
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE lms_rhythm_analysis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON lms_rhythm_analysis.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u lms_user -p lms_rhythm_analysis < lms-rhythm-analysis/database/schema.sql
```

### 4단계: 환경 설정

```bash
cd /var/www/html/lms-rhythm-analysis
cp .env.example .env
nano .env
```

`.env` 파일 내용:

```env
DB_HOST=localhost
DB_NAME=lms_rhythm_analysis
DB_USER=lms_user
DB_PASS=your_secure_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_WS_TOKEN=your_token_here

APP_ENV=production
APP_DEBUG=false
TIMEZONE=Asia/Seoul
```

### 5단계: 권한 설정

```bash
# Apache의 경우
sudo chown -R www-data:www-data /var/www/html/lms-rhythm-analysis
sudo chmod -R 755 /var/www/html/lms-rhythm-analysis

# Nginx의 경우
sudo chown -R nginx:nginx /usr/share/nginx/html/lms-rhythm-analysis
sudo chmod -R 755 /usr/share/nginx/html/lms-rhythm-analysis
```

## Moodle 설정

### Web Services 활성화

1. **Moodle 관리자로 로그인**

2. **웹 서비스 활성화**
   - 경로: `사이트 관리 > 고급 기능`
   - "웹 서비스 활성화" 체크박스 선택
   - 저장

3. **프로토콜 활성화**
   - 경로: `사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리`
   - REST 프로토콜 활성화

4. **외부 서비스 생성**
   - 경로: `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스`
   - "사용자 정의 서비스 추가" 클릭
   - 이름: "LMS Rhythm Analysis"
   - 약식 이름: "lms_rhythm"
   - 활성화됨: 예
   - 권한 있는 사용자: 예
   - 저장

5. **함수 추가**
   - 생성한 서비스의 "함수" 링크 클릭
   - 다음 함수들을 추가:
     ```
     core_user_get_users
     core_enrol_get_users_courses
     core_course_get_contents
     core_completion_get_activities_completion_status
     mod_quiz_get_user_attempts
     mod_quiz_get_attempt_review
     core_webservice_get_site_info
     ```

6. **토큰 생성**
   - 경로: `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리`
   - "토큰 생성" 클릭
   - 사용자: 권한이 있는 사용자 선택
   - 서비스: "LMS Rhythm Analysis" 선택
   - 토큰 생성 후 복사
   - `.env` 파일의 `MOODLE_WS_TOKEN`에 붙여넣기

### 권한 설정

토큰을 사용할 사용자에게 다음 권한 부여:

- `moodle/course:view`
- `moodle/course:viewhiddencourses`
- `moodle/user:viewdetails`
- `mod/quiz:view`
- `mod/quiz:attempt`
- `mod/quiz:reviewmyattempts`

## 웹 서버 설정

### Apache 설정

`/etc/apache2/sites-available/lms-rhythm.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName lms-rhythm.yourdomain.com
    DocumentRoot /var/www/html/lms-rhythm-analysis/public

    <Directory /var/www/html/lms-rhythm-analysis/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # .env 파일 접근 차단
    <Files ".env">
        Require all denied
    </Files>

    ErrorLog ${APACHE_LOG_DIR}/lms-rhythm-error.log
    CustomLog ${APACHE_LOG_DIR}/lms-rhythm-access.log combined
</VirtualHost>
```

활성화:

```bash
sudo a2ensite lms-rhythm
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Nginx 설정

`/etc/nginx/sites-available/lms-rhythm` 생성:

```nginx
server {
    listen 80;
    server_name lms-rhythm.yourdomain.com;
    root /usr/share/nginx/html/lms-rhythm-analysis/public;

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

    # .env 파일 접근 차단
    location ~ /\.env {
        deny all;
    }

    # 숨김 파일 접근 차단
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/lms-rhythm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 테스트

### 1. 연결 테스트

브라우저에서 접속:
```
http://your-server/lms-rhythm-analysis/public/
```

로그인 페이지가 표시되어야 합니다.

### 2. Moodle 연결 테스트

테스트 스크립트 생성 (`test_connection.php`):

```php
<?php
require_once 'config/database.php';
require_once 'src/api/moodle_connector.php';

$moodle = new MoodleConnector();
$result = $moodle->testConnection();

if ($result['success']) {
    echo "✓ Moodle 연결 성공!\n";
    echo "사이트: " . $result['site_name'] . "\n";
    echo "버전: " . $result['moodle_version'] . "\n";
} else {
    echo "✗ 연결 실패: " . $result['error'] . "\n";
}
```

실행:
```bash
php test_connection.php
```

## 문제 해결

### PHP 버전이 낮은 경우

```bash
# Ubuntu/Debian
sudo add-apt-repository ppa:ondrej/php
sudo apt update
sudo apt install php7.4 php7.4-mysql php7.4-curl php7.4-json

# CentOS/RHEL
sudo yum install php71w php71w-mysql php71w-curl
```

### PDO MySQL 확장 누락

```bash
# Ubuntu/Debian
sudo apt install php7.4-mysql

# CentOS/RHEL
sudo yum install php71w-mysql

# 재시작
sudo systemctl restart apache2  # 또는 nginx + php-fpm
```

### 권한 문제

```bash
# SELinux가 활성화된 경우 (CentOS/RHEL)
sudo setenforce 0
sudo chcon -R -t httpd_sys_rw_content_t /var/www/html/lms-rhythm-analysis
```

### Moodle 토큰 오류

1. Moodle에서 토큰이 만료되지 않았는지 확인
2. 토큰에 필요한 권한이 있는지 확인
3. IP 제한이 설정되어 있지 않은지 확인

## 보안 강화

### HTTPS 설정 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d lms-rhythm.yourdomain.com
```

### 방화벽 설정

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### PHP 보안 설정 (`php.ini`)

```ini
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
session.cookie_httponly = 1
session.cookie_secure = 1
```

## 완료!

설치가 완료되었습니다. 이제 다음을 수행할 수 있습니다:

1. 로그인 페이지에서 Moodle 사용자 ID로 로그인
2. "데이터 수집" 버튼으로 학습 데이터 가져오기
3. "분석 실행" 버튼으로 리듬 및 루틴 분석
4. 대시보드에서 결과 확인

문제가 있으면 README.md의 "문제 해결" 섹션을 참조하세요.
