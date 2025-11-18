# 배포 가이드

## 목차
1. [개발 환경 배포](#개발-환경-배포)
2. [프로덕션 환경 배포](#프로덕션-환경-배포)
3. [Moodle 서버 연동](#moodle-서버-연동)
4. [문제 해결](#문제-해결)

---

## 개발 환경 배포

### 1. 빠른 시작 (로컬 테스트)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 설치 스크립트 실행
chmod +x setup.sh
./setup.sh

# 개발 서버 시작
cd public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

### 2. 개발 모드 설정

`api/config.php`:
```php
define('DEV_MODE', true);  // 개발 모드 활성화
```

개발 모드에서는:
- 실제 데이터베이스 연결 없음
- 샘플 데이터 사용
- 상세한 에러 메시지 표시

---

## 프로덕션 환경 배포

### 1. 서버 요구사항

- **OS**: Ubuntu 20.04 LTS 또는 CentOS 7+
- **Web Server**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **메모리**: 최소 1GB RAM
- **디스크**: 최소 500MB 여유 공간

### 2. Apache 배포

#### 2.1 가상 호스트 설정

`/etc/apache2/sites-available/gradient-color.conf`:

```apache
<VirtualHost *:80>
    ServerName gradient-color.yourdomain.com
    ServerAdmin admin@yourdomain.com

    DocumentRoot /var/www/gradient-color/public

    <Directory /var/www/gradient-color/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # URL Rewrite
        RewriteEngine On
        RewriteBase /

        # API 경로 리다이렉션
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^api/(.*)$ /var/www/gradient-color/api/$1 [L,QSA]
    </Directory>

    # API 디렉토리 접근 제어
    <Directory /var/www/gradient-color/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        # PHP 처리
        <FilesMatch \.php$>
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/gradient-color-error.log
    CustomLog ${APACHE_LOG_DIR}/gradient-color-access.log combined

    # 보안 헤더
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

#### 2.2 사이트 활성화

```bash
# 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod php7.4

# 사이트 활성화
sudo a2ensite gradient-color.conf

# Apache 재시작
sudo systemctl restart apache2
```

### 3. Nginx 배포

#### 3.1 서버 블록 설정

`/etc/nginx/sites-available/gradient-color`:

```nginx
server {
    listen 80;
    server_name gradient-color.yourdomain.com;

    root /var/www/gradient-color/public;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/gradient-color-access.log;
    error_log /var/log/nginx/gradient-color-error.log;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }

    # API 요청 처리
    location /api/ {
        alias /var/www/gradient-color/api/;
        try_files $uri $uri/ =404;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # 메인 페이지
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP 파일 숨기기
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # 보안 헤더
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
}
```

#### 3.2 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/gradient-color /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 4. 파일 배포

```bash
# 파일 복사
sudo mkdir -p /var/www/gradient-color
sudo cp -r /path/to/alt42standalone_v1.0/* /var/www/gradient-color/

# 권한 설정
sudo chown -R www-data:www-data /var/www/gradient-color
sudo chmod -R 755 /var/www/gradient-color/public
sudo chmod 644 /var/www/gradient-color/api/*.php
sudo chmod 666 /var/www/gradient-color/api/error.log
```

### 5. 프로덕션 설정

#### 5.1 config.php 수정

```php
// 프로덕션 모드로 전환
define('DEV_MODE', false);

// 실제 데이터베이스 정보 입력
define('DB_HOST', 'your-db-host');
define('DB_NAME', 'your-moodle-db');
define('DB_USER', 'your-db-user');
define('DB_PASS', 'your-db-password');

// Moodle 정보 입력
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your-actual-token');
```

#### 5.2 민감 정보 보호

```bash
# config.php 권한 제한
sudo chmod 600 /var/www/gradient-color/api/config.php

# .git 디렉토리 삭제 (프로덕션)
sudo rm -rf /var/www/gradient-color/.git
```

---

## Moodle 서버 연동

### 1. Moodle WebService 활성화

#### 1.1 Moodle 관리자 페이지 접속

1. **사이트 관리** → **플러그인** → **웹 서비스** → **웹 서비스 관리**
2. "웹 서비스 활성화" 체크

#### 1.2 REST 프로토콜 활성화

1. **웹 서비스** → **프로토콜 관리**
2. REST 프로토콜 활성화

#### 1.3 서비스 생성

1. **웹 서비스** → **외부 서비스**
2. "서비스 추가" 클릭
3. 이름: "Tangent Slope Service"
4. 간단한 이름: tangent_slope
5. 활성화 체크

#### 1.4 기능(Functions) 추가

다음 기능들을 서비스에 추가:
- `core_course_get_contents`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_attempt_data`
- `core_question_get_random_question_summaries`

#### 1.5 토큰 생성

1. **웹 서비스** → **토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택
4. 서비스: "Tangent Slope Service" 선택
5. 토큰 생성 및 복사

### 2. 데이터베이스 스키마 적용

```bash
# Moodle 데이터베이스 접속
mysql -u moodle_user -p moodle

# 스키마 파일 실행
mysql> source /path/to/docs/MOODLE_SCHEMA.sql

# 적용 확인
mysql> SHOW TABLES LIKE 'mdl_question_tangent%';
```

### 3. 연결 테스트

```bash
# API 테스트
curl -X POST http://your-server/api/moodle-connector.php \
  -H "Content-Type: application/json" \
  -d '{"action": "get_problem"}'
```

예상 응답:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "이차함수의 접선",
    "function_type": "quadratic",
    "x_point": 2.0
  }
}
```

---

## 문제 해결

### 1. Apache/Nginx 관련

#### 문제: 404 Not Found
```bash
# .htaccess 확인
cat public/.htaccess

# mod_rewrite 활성화 확인 (Apache)
apache2ctl -M | grep rewrite
```

#### 문제: PHP 파일이 다운로드됨
```bash
# PHP 모듈 확인
php -v
sudo systemctl status php7.4-fpm  # Nginx의 경우
```

### 2. 데이터베이스 연결 오류

#### 문제: Connection refused
```bash
# MySQL 상태 확인
sudo systemctl status mysql

# 포트 확인
sudo netstat -tlnp | grep 3306

# 방화벽 확인
sudo ufw status
sudo ufw allow 3306
```

#### 문제: Access denied
```sql
-- 사용자 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 권한 부여
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. CORS 오류

#### Apache
```apache
# .htaccess에 추가
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

#### Nginx
```nginx
# server 블록에 추가
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
```

### 4. 파일 권한 오류

```bash
# 로그 확인
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx

# 권한 재설정
sudo chown -R www-data:www-data /var/www/gradient-color
sudo chmod -R 755 /var/www/gradient-color
```

---

## SSL/HTTPS 설정 (선택사항)

### Certbot으로 Let's Encrypt 인증서 설치

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache  # Apache
sudo apt-get install certbot python3-certbot-nginx   # Nginx

# 인증서 발급
sudo certbot --apache -d gradient-color.yourdomain.com  # Apache
sudo certbot --nginx -d gradient-color.yourdomain.com   # Nginx

# 자동 갱신 설정
sudo certbot renew --dry-run
```

---

## 모니터링 및 유지보수

### 로그 확인

```bash
# 접속 로그
sudo tail -f /var/log/apache2/gradient-color-access.log

# 에러 로그
sudo tail -f /var/log/apache2/gradient-color-error.log

# 애플리케이션 로그
sudo tail -f /var/www/gradient-color/api/error.log
```

### 성능 모니터링

```bash
# Apache 상태
sudo apache2ctl status

# MySQL 성능
mysql -u root -p -e "SHOW PROCESSLIST;"

# 디스크 사용량
df -h
```

---

## 체크리스트

배포 전 확인사항:

- [ ] PHP 7.1.9 이상 설치
- [ ] MySQL 5.7 이상 설치 및 실행
- [ ] 웹 서버 (Apache/Nginx) 설치 및 설정
- [ ] config.php 설정 완료
- [ ] 데이터베이스 스키마 적용
- [ ] 파일 권한 설정
- [ ] Moodle WebService 활성화
- [ ] API 연결 테스트 완료
- [ ] 방화벽 규칙 설정
- [ ] SSL 인증서 설치 (프로덕션)
- [ ] 백업 설정

---

문의사항이나 추가 도움이 필요한 경우:
- GitHub Issues: [repository-url]/issues
- Email: support@yourdomain.com
