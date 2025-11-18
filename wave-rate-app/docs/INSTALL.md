# Wave Rate 설치 가이드

## 시스템 요구사항

### 필수 소프트웨어

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache**: 2.4 이상 (또는 Nginx)
- **Moodle**: 3.7 (LMS 연동 시)

### PHP 확장 모듈

```bash
# 필수 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

필요한 모듈:
- pdo
- pdo_mysql
- json
- curl
- mbstring

## 단계별 설치

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/wave-rate-app.git
cd wave-rate-app
```

### 2. 환경 설정 파일 생성

```bash
cp .env.example .env
nano .env
```

`.env` 파일 수정:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wave_rate_db
DB_USER=your_mysql_user
DB_PASS=your_mysql_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 3. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE wave_rate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'wave_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON wave_rate_db.* TO 'wave_user'@'localhost';
FLUSH PRIVILEGES;

-- 스키마 가져오기
USE wave_rate_db;
SOURCE database/schema.sql;

-- 확인
SHOW TABLES;
SELECT * FROM problems;

EXIT;
```

### 4. 웹 서버 설정

#### Apache 설정

**방법 1: VirtualHost 설정**

`/etc/apache2/sites-available/wave-rate.conf` 파일 생성:

```apache
<VirtualHost *:80>
    ServerName wave-rate.local
    ServerAlias www.wave-rate.local

    DocumentRoot /var/www/wave-rate-app/public

    <Directory /var/www/wave-rate-app/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/wave-rate-error.log
    CustomLog ${APACHE_LOG_DIR}/wave-rate-access.log combined
</VirtualHost>
```

사이트 활성화:
```bash
sudo a2ensite wave-rate.conf
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

hosts 파일 수정 (`/etc/hosts`):
```
127.0.0.1   wave-rate.local
```

**방법 2: PHP Built-in Server (개발용)**

```bash
cd wave-rate-app/public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

#### Nginx 설정 (선택사항)

`/etc/nginx/sites-available/wave-rate` 파일 생성:

```nginx
server {
    listen 80;
    server_name wave-rate.local;
    root /var/www/wave-rate-app/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

사이트 활성화:
```bash
sudo ln -s /etc/nginx/sites-available/wave-rate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Moodle Web Service 설정

#### Moodle에서 Web Service 활성화

1. **사이트 관리** → **고급 기능**
   - "웹 서비스 사용" 활성화

2. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
   - 새 서비스 생성: "Wave Rate Integration"

3. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
   - 새 토큰 생성
   - 서비스: "Wave Rate Integration" 선택
   - 사용자: 적절한 권한을 가진 사용자 선택
   - 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

4. **사이트 관리** → **플러그인** → **웹 서비스** → **프로토콜**
   - REST 프로토콜 활성화

#### 필요한 Web Service 함수

서비스에 다음 함수들을 추가:
- `core_question_get_random_question_summaries`
- `core_course_get_contents`
- `mod_quiz_save_attempt`
- `gradereport_user_get_grade_items`

### 6. 권한 설정

```bash
# 소유권 변경
sudo chown -R www-data:www-data /var/www/wave-rate-app

# 권한 설정
sudo find /var/www/wave-rate-app -type d -exec chmod 755 {} \;
sudo find /var/www/wave-rate-app -type f -exec chmod 644 {} \;
```

### 7. 테스트

#### 데이터베이스 연결 테스트

`test_db.php` 파일 생성:

```php
<?php
require_once '../config/database.php';

try {
    $db = Database::getInstance();
    echo "✓ Database connection successful!\n";

    $result = $db->query("SELECT COUNT(*) as count FROM problems");
    $row = $result->fetch();
    echo "✓ Found {$row['count']} problems in database\n";
} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}
```

실행:
```bash
cd wave-rate-app/public
php test_db.php
```

#### API 테스트

```bash
# 문제 목록 조회
curl http://localhost:8000/api/get_problems.php

# 특정 문제 조회
curl http://localhost:8000/api/get_problems.php?id=1
```

#### 브라우저 테스트

1. `http://localhost:8000` 접속
2. 문제 선택 드롭다운에서 문제 확인
3. 문제 선택 후 '시작' 버튼 클릭
4. 우측 하단 스마트폰 화면에서 Wave Rate 애니메이션 확인

## 문제 해결

### PHP 확장 모듈 설치

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-curl php7.1-mbstring php7.1-json

# CentOS/RHEL
sudo yum install php71-mysqlnd php71-curl php71-mbstring php71-json
```

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u root -p -e "SHOW DATABASES;"
```

### Apache mod_rewrite 활성화

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### CORS 오류

`.htaccess` 파일 또는 Apache 설정에서 CORS 헤더 확인:

```apache
Header set Access-Control-Allow-Origin "*"
```

### Moodle 토큰 오류

- Moodle Web Service가 활성화되었는지 확인
- 토큰이 만료되지 않았는지 확인
- 토큰에 필요한 함수 권한이 있는지 확인

## 개발 환경 설정

### Hot Reload (개발용)

Browser-Sync 사용:

```bash
npm install -g browser-sync
cd wave-rate-app/public
browser-sync start --proxy "localhost:8000" --files "**/*.php, **/*.js, **/*.css"
```

### 디버깅

PHP 오류 로그 확인:

```bash
# Apache
tail -f /var/log/apache2/error.log

# PHP-FPM
tail -f /var/log/php7.1-fpm.log

# Application
tail -f /var/log/apache2/wave-rate-error.log
```

JavaScript 디버깅:
- 브라우저 개발자 도구 (F12) 사용
- Console 탭에서 오류 메시지 확인

## 프로덕션 배포

### 보안 설정

1. `.env` 파일 보호:
```apache
<Files .env>
    Require all denied
</Files>
```

2. PHP 디버그 모드 비활성화:
```env
APP_DEBUG=false
```

3. HTTPS 설정 (Let's Encrypt):
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d wave-rate.example.com
```

### 성능 최적화

1. OPcache 활성화
2. MySQL 쿼리 캐싱
3. CDN 사용 (정적 파일)
4. Gzip 압축 활성화

## 지원

문제가 발생하면 다음을 확인하세요:
- README.md의 문제 해결 섹션
- 프로젝트 GitHub Issues
- 로그 파일 (`/var/log/apache2/`)

## 다음 단계

- [사용자 가이드](USER_GUIDE.md) 참조
- [API 문서](API_DOCS.md) 참조
- Moodle 코스에 문제 추가
- 커스텀 함수 추가
