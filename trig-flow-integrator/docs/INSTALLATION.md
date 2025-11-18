# Trig Flow Integrator 설치 가이드

## 시스템 요구사항

### 필수 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **PHP**: 7.1.9 (Moodle 3.7 호환)
- **MySQL**: 5.7+
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### PHP 확장 모듈

```bash
# 필수 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

필요한 확장 모듈:
- pdo
- pdo_mysql
- json
- curl
- mbstring

## 단계별 설치 가이드

### 1단계: 파일 다운로드

```bash
# Git으로 클론
git clone https://github.com/your-repo/trig-flow-integrator.git

# 또는 ZIP 파일 다운로드 후 압축 해제
cd trig-flow-integrator
```

### 2단계: 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE trig_flow_integrator
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (권장)
CREATE USER 'trig_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON trig_flow_integrator.* TO 'trig_user'@'localhost';
FLUSH PRIVILEGES;

# 종료
EXIT;
```

#### 스키마 임포트

```bash
# 스키마 파일 임포트
mysql -u trig_user -p trig_flow_integrator < database/schema.sql

# 성공 확인
mysql -u trig_user -p trig_flow_integrator -e "SHOW TABLES;"
```

예상 출력:
```
+--------------------------------+
| Tables_in_trig_flow_integrator |
+--------------------------------+
| problem_statistics             |
| session_logs                   |
| student_progress               |
| student_statistics             |
| trig_problems                  |
| visualization_settings         |
+--------------------------------+
```

### 3단계: PHP 설정

#### 데이터베이스 연결 설정

`backend/config/database.php` 파일 편집:

```php
<?php
// Trig Flow Integrator 데이터베이스
define('DB_HOST', 'localhost');
define('DB_NAME', 'trig_flow_integrator');
define('DB_USER', 'trig_user');
define('DB_PASS', 'strong_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');
```

#### 일반 설정

`backend/config/config.php` 파일 편집:

```php
<?php
// 프로덕션 환경에서는 반드시 false로 설정
define('APP_DEBUG', false);

// Moodle URL 및 토큰
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token_here');
```

### 4단계: Moodle Web Service 설정

#### 4.1 Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** → **고급 기능**
3. "웹 서비스 활성화" 체크
4. 변경사항 저장

#### 4.2 외부 서비스 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. "서비스 추가" 클릭
3. 다음 정보 입력:
   - 이름: `Trig Flow Integrator Service`
   - 짧은 이름: `trig_flow`
   - 활성화: 체크
4. 저장 후 "함수 추가" 클릭
5. 필요한 함수 추가:
   - `core_user_get_users`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_access_information`
   - `mod_quiz_get_attempt_data`

#### 4.3 사용자 및 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. "토큰 추가" 클릭
3. 다음 정보 입력:
   - 사용자: 적절한 사용자 선택
   - 서비스: `Trig Flow Integrator Service`
4. 저장 후 생성된 토큰 복사
5. `backend/config/config.php`의 `MOODLE_WS_TOKEN`에 붙여넣기

### 5단계: 웹 서버 설정

#### Apache 설정

##### 5.1 가상 호스트 파일 생성

`/etc/apache2/sites-available/trig-flow.conf`:

```apache
<VirtualHost *:80>
    ServerName trig-flow.local
    ServerAlias www.trig-flow.local

    DocumentRoot /var/www/trig-flow-integrator/frontend

    <Directory /var/www/trig-flow-integrator/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # 보안 헤더
        Header set X-Content-Type-Options "nosniff"
        Header set X-Frame-Options "SAMEORIGIN"
        Header set X-XSS-Protection "1; mode=block"
    </Directory>

    # API 엔드포인트
    Alias /api /var/www/trig-flow-integrator/backend/api

    <Directory /var/www/trig-flow-integrator/backend/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 처리
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    # 로그 파일
    ErrorLog ${APACHE_LOG_DIR}/trig-flow-error.log
    CustomLog ${APACHE_LOG_DIR}/trig-flow-access.log combined
</VirtualHost>
```

##### 5.2 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite trig-flow.conf

# 필요한 Apache 모듈 활성화
sudo a2enmod rewrite headers proxy_fcgi setenvif

# Apache 재시작
sudo systemctl restart apache2
```

##### 5.3 호스트 파일 수정 (로컬 개발용)

`/etc/hosts`:

```
127.0.0.1   trig-flow.local
```

#### Nginx 설정

##### 5.1 서버 블록 파일 생성

`/etc/nginx/sites-available/trig-flow`:

```nginx
server {
    listen 80;
    server_name trig-flow.local www.trig-flow.local;

    root /var/www/trig-flow-integrator/frontend;
    index index.html index.htm;

    # 보안 헤더
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 프론트엔드
    location / {
        try_files $uri $uri/ =404;
    }

    # API 엔드포인트
    location /api {
        alias /var/www/trig-flow-integrator/backend/api;
        try_files $uri $uri/ =404;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_intercept_errors on;
        }
    }

    # 로그 파일
    access_log /var/log/nginx/trig-flow-access.log;
    error_log /var/log/nginx/trig-flow-error.log;
}
```

##### 5.2 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/trig-flow /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 6단계: 권한 설정

```bash
# 소유자 설정 (Apache)
sudo chown -R www-data:www-data /var/www/trig-flow-integrator

# 또는 (Nginx)
sudo chown -R nginx:nginx /var/www/trig-flow-integrator

# 디렉토리 권한
sudo find /var/www/trig-flow-integrator -type d -exec chmod 755 {} \;

# 파일 권한
sudo find /var/www/trig-flow-integrator -type f -exec chmod 644 {} \;

# 로그 디렉토리 생성 (필요시)
sudo mkdir -p /var/www/trig-flow-integrator/logs
sudo chmod 777 /var/www/trig-flow-integrator/logs
```

### 7단계: 설치 확인

#### 데이터베이스 연결 테스트

```bash
# PHP 스크립트로 테스트
php -r "
require 'backend/config/database.php';
try {
    \$db = Database::getInstance()->getConnection();
    echo 'Database connection successful!';
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage();
}
"
```

#### 웹 브라우저 테스트

1. 브라우저에서 `http://trig-flow.local` 접속
2. 가상 스마트폰 화면이 우측 하단에 표시되는지 확인
3. 함수 선택 및 슬라이더 조작 테스트
4. 애니메이션 시작 버튼 테스트

#### API 테스트

```bash
# 문제 데이터 API 테스트
curl http://trig-flow.local/api/problem_data.php?action=statistics&user_id=1

# Moodle 연동 API 테스트
curl http://trig-flow.local/api/moodle_connect.php?action=user&user_id=1
```

## 문제 해결

### 일반적인 문제

#### 1. "Database connection failed" 오류

**원인**: 데이터베이스 접속 정보가 잘못됨

**해결**:
```bash
# MySQL 접속 테스트
mysql -u trig_user -p trig_flow_integrator

# 권한 확인
mysql -u trig_user -p -e "SHOW GRANTS FOR 'trig_user'@'localhost';"
```

#### 2. "500 Internal Server Error"

**원인**: PHP 오류 또는 권한 문제

**해결**:
```bash
# PHP 에러 로그 확인
sudo tail -f /var/log/apache2/trig-flow-error.log
# 또는
sudo tail -f /var/log/nginx/trig-flow-error.log

# PHP 오류 표시 활성화 (개발 환경)
# php.ini에서:
display_errors = On
error_reporting = E_ALL
```

#### 3. Canvas가 표시되지 않음

**원인**: JavaScript 로딩 오류

**해결**:
- 브라우저 개발자 도구 콘솔 확인 (F12)
- JavaScript 파일 경로 확인
- CORS 오류인 경우 웹 서버 설정에서 CORS 헤더 추가

#### 4. Moodle API 오류

**원인**: Web Service 설정 문제

**해결**:
```bash
# 토큰 테스트
curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

## 프로덕션 배포

### 보안 체크리스트

- [ ] `APP_DEBUG`를 `false`로 설정
- [ ] 데이터베이스 비밀번호를 강력하게 설정
- [ ] HTTPS 활성화 (SSL 인증서 설치)
- [ ] 불필요한 파일 제거 (`.git`, 테스트 파일 등)
- [ ] 파일 권한 확인 (민감한 파일은 755/644)
- [ ] 에러 로그 정기 모니터링
- [ ] 정기 백업 설정

### HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-apache
# 또는
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --apache -d trig-flow.yourdomain.com
# 또는
sudo certbot --nginx -d trig-flow.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 업데이트 및 유지보수

### 백업

```bash
# 데이터베이스 백업
mysqldump -u trig_user -p trig_flow_integrator > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf trig-flow-backup_$(date +%Y%m%d).tar.gz /var/www/trig-flow-integrator
```

### 업데이트

```bash
# Git으로 업데이트
cd /var/www/trig-flow-integrator
git pull origin main

# 데이터베이스 마이그레이션 (필요시)
mysql -u trig_user -p trig_flow_integrator < database/migrations/update_xxx.sql
```

---

설치 중 문제가 발생하면 GitHub Issues에 문의하세요.
