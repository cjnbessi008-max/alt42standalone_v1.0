# Function Digest 설치 가이드

## 🚀 빠른 시작 (Quick Start)

### 1단계: 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 스키마 생성
mysql -u root -p < src/database/schema.sql
```

### 3단계: PHP 설정 파일 수정
```bash
# config.php 파일 열기
nano src/backend/config.php

# 다음 항목 수정:
# - DB_HOST, DB_NAME, DB_USER, DB_PASS
# - MOODLE_URL, MOODLE_WS_TOKEN
```

### 4단계: 웹 서버 시작
```bash
# PHP 내장 서버 사용 (개발용)
cd src/frontend
php -S localhost:8000

# 브라우저에서 접속
# http://localhost:8000/index.html
```

---

## 📋 상세 설치 가이드

### 시스템 요구사항

#### 필수 소프트웨어
- **PHP**: 7.1.9 이상
  - 확장: `pdo`, `pdo_mysql`, `curl`, `json`
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **Moodle**: 3.7 (Web Services 활성화 필요)

#### 권장 사양
- CPU: 2 cores 이상
- RAM: 2GB 이상
- 디스크: 1GB 여유 공간

---

### 1. 데이터베이스 설정

#### MySQL 설치 확인
```bash
mysql --version
# mysql  Ver 14.14 Distrib 5.7.x
```

#### 데이터베이스 생성
```bash
mysql -u root -p
```

```sql
-- 새 데이터베이스 생성
CREATE DATABASE function_digest_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'digest_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON function_digest_db.* TO 'digest_user'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

#### 스키마 적용
```bash
mysql -u digest_user -p function_digest_db < src/database/schema.sql
```

#### 테이블 확인
```bash
mysql -u digest_user -p function_digest_db -e "SHOW TABLES;"
```

예상 출력:
```
+-------------------------------+
| Tables_in_function_digest_db  |
+-------------------------------+
| problems                      |
| function_digests              |
| user_digest_views             |
+-------------------------------+
```

---

### 2. PHP 환경 설정

#### PHP 설치 확인
```bash
php -v
# PHP 7.1.9 (cli)
```

#### 필요한 PHP 확장 확인
```bash
php -m | grep -E 'pdo|mysql|curl|json'
```

출력 예:
```
curl
json
pdo_mysql
PDO
```

#### 없는 확장 설치 (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json
```

#### config.php 설정
```bash
cd src/backend
cp config.php config.php.example  # 백업
nano config.php
```

수정할 내용:
```php
// Database Configuration
define('DB_HOST', 'localhost');           // MySQL 호스트
define('DB_NAME', 'function_digest_db');  // 데이터베이스 이름
define('DB_USER', 'digest_user');         // MySQL 사용자
define('DB_PASS', 'your_password');       // MySQL 비밀번호

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle.com');  // Moodle URL
define('MOODLE_WS_TOKEN', 'your_token_here');    // Web Service 토큰

// CORS Settings (프로덕션에서 변경)
define('ALLOW_ORIGIN', '*');  // 특정 도메인으로 제한 권장
```

---

### 3. Moodle 설정

#### Web Services 활성화

**Step 1**: 관리자로 Moodle 로그인

**Step 2**: Site administration → Advanced features
- ☑ Enable web services 체크
- Save changes

**Step 3**: Site administration → Plugins → Web services → Manage protocols
- ☑ REST protocol 활성화

**Step 4**: Site administration → Plugins → Web services → External services
- "Add" 클릭
- Name: `Function Digest Service`
- Short name: `function_digest`
- Enabled: ☑
- Add functions:
  - `core_question_get_questions`
  - `core_question_get_random_question_summaries`
  - `core_question_update_flag`

**Step 5**: Site administration → Plugins → Web services → Manage tokens
- "Add" 클릭
- User: 선택
- Service: `Function Digest Service`
- Save changes
- **토큰 복사** (한 번만 표시됨!)

**Step 6**: `config.php`에 토큰 입력
```php
define('MOODLE_WS_TOKEN', '복사한_토큰_여기에_붙여넣기');
```

---

### 4. 웹 서버 설정

#### 옵션 A: PHP 내장 서버 (개발용)
```bash
cd /home/user/alt42standalone_v1.0
php -S localhost:8000 -t src/frontend

# 접속: http://localhost:8000/index.html
```

#### 옵션 B: Apache 설정 (프로덕션)

**Apache 가상 호스트 설정**:
```bash
sudo nano /etc/apache2/sites-available/function-digest.conf
```

```apache
<VirtualHost *:80>
    ServerName function-digest.local
    DocumentRoot /home/user/alt42standalone_v1.0/src/frontend

    <Directory /home/user/alt42standalone_v1.0/src/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /home/user/alt42standalone_v1.0/src/backend/api.php

    <Directory /home/user/alt42standalone_v1.0/src/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/function-digest-error.log
    CustomLog ${APACHE_LOG_DIR}/function-digest-access.log combined
</VirtualHost>
```

**가상 호스트 활성화**:
```bash
sudo a2ensite function-digest
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**hosts 파일 수정** (로컬 테스트용):
```bash
sudo nano /etc/hosts
```
추가:
```
127.0.0.1   function-digest.local
```

**접속**:
```
http://function-digest.local
```

#### 옵션 C: Nginx 설정 (프로덕션)

```bash
sudo nano /etc/nginx/sites-available/function-digest
```

```nginx
server {
    listen 80;
    server_name function-digest.local;

    root /home/user/alt42standalone_v1.0/src/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        root /home/user/alt42standalone_v1.0/src/backend;
        rewrite ^/api/(.*)$ /api.php?endpoint=$1 last;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        }
    }

    error_log /var/log/nginx/function-digest-error.log;
    access_log /var/log/nginx/function-digest-access.log;
}
```

**사이트 활성화**:
```bash
sudo ln -s /etc/nginx/sites-available/function-digest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 5. 설치 확인

#### API Health Check
```bash
curl http://localhost:8000/api.php?endpoint=health
```

예상 응답:
```json
{
  "success": true,
  "message": "Function Digest API is running",
  "timestamp": "2025-11-18 12:00:00",
  "php_version": "7.1.9",
  "mysql_version": "5.7.x"
}
```

#### 데이터베이스 연결 확인
```bash
curl http://localhost:8000/api.php?endpoint=digest&question_id=1
```

#### 프론트엔드 확인
브라우저에서:
```
http://localhost:8000/index.html
```

- 우측 하단에 스마트폰 UI가 보여야 함
- "Load Digest" 버튼 클릭 시 샘플 데이터 표시

---

## 🔧 문제 해결 (Troubleshooting)

### 문제 1: 데이터베이스 연결 실패
**증상**: "Database connection failed"
**해결**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 비밀번호 확인
mysql -u digest_user -p

# config.php 설정 재확인
nano src/backend/config.php
```

### 문제 2: Moodle API 연결 실패
**증상**: "Moodle API Error"
**해결**:
```bash
# Moodle URL 확인
curl http://your-moodle-site.com

# Web Service 토큰 재확인
# Moodle 관리자 페이지에서 토큰 상태 확인

# curl로 직접 테스트
curl "http://your-moodle.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

### 문제 3: PHP 확장 없음
**증상**: "Call to undefined function PDO"
**해결**:
```bash
# PHP 버전 확인
php -v

# 확장 설치
sudo apt-get install php7.1-mysql php7.1-curl

# Apache 재시작
sudo systemctl restart apache2
```

### 문제 4: CORS 에러
**증상**: 브라우저 콘솔에 "CORS policy" 에러
**해결**:
```php
// config.php에서
define('ALLOW_ORIGIN', 'http://localhost:8000');  // 정확한 origin 지정
```

---

## 🧪 테스트

### 단위 테스트
```bash
# 데이터베이스 연결
php -r "require 'src/backend/config.php'; require 'src/backend/Database.php'; $db = new Database(); echo 'DB OK';"

# Moodle 연결
php -r "require 'src/backend/config.php'; require 'src/backend/MoodleAPI.php'; $api = new MoodleAPI(); print_r($api->getQuestion(1));"
```

### API 테스트
```bash
# Health check
curl http://localhost:8000/api.php?endpoint=health

# Digest 조회
curl http://localhost:8000/api.php?endpoint=digest&question_id=1

# Moodle 동기화
curl http://localhost:8000/api.php?endpoint=moodle_sync&question_id=1001
```

---

## 📦 프로덕션 배포

### 보안 강화
```php
// config.php
error_reporting(0);  // 에러 표시 끄기
ini_set('display_errors', '0');

define('ALLOW_ORIGIN', 'https://your-domain.com');  // CORS 제한
```

### HTTPS 설정 (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d function-digest.yourdomain.com
```

### 성능 최적화
```apache
# .htaccess
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

---

## 🎉 완료!

설치가 완료되었습니다. 이제 다음을 확인하세요:

- [ ] 데이터베이스 연결 성공
- [ ] Moodle API 연결 성공
- [ ] 프론트엔드 페이지 로딩
- [ ] 스마트폰 UI 표시
- [ ] Function Digest 로딩 성공

문제가 있으면 README.md의 지원 섹션을 참고하세요.
