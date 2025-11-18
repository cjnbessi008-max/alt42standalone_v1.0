# 🚀 학습 요약 시스템 설치 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [사전 준비](#사전-준비)
3. [단계별 설치](#단계별-설치)
4. [Moodle 설정](#moodle-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

## 시스템 요구사항

### 서버 환경
- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 ~ 7.4 (PHP 8.0 이상 테스트 필요)
- **MySQL**: 5.7 ~ 8.0
- **디스크 공간**: 최소 500MB

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|mysql|curl|json|mbstring'
```

다음 모듈이 활성화되어 있어야 합니다:
- PDO
- pdo_mysql
- curl
- json
- mbstring
- openssl

### 외부 서비스
- **Moodle LMS 3.7** (Web Services 활성화)
- **Anthropic Claude API** 키

## 사전 준비

### 1. Anthropic API 키 발급

1. https://console.anthropic.com/ 방문
2. 계정 생성 또는 로그인
3. Settings > API Keys에서 새 키 생성
4. 키를 안전한 곳에 보관

### 2. Moodle 접근 권한 확인

- Moodle 관리자 계정 필요
- Moodle 사이트 URL 확인
- Web Services 활성화 권한

## 단계별 설치

### Step 1: 프로젝트 다운로드

```bash
# Git clone
git clone <repository-url> /var/www/learning-summary
cd /var/www/learning-summary

# 또는 압축 파일 다운로드
wget <download-url> -O learning-summary.zip
unzip learning-summary.zip -d /var/www/learning-summary
cd /var/www/learning-summary
```

### Step 2: 디렉토리 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 소유자 설정 (Apache의 경우)
sudo chown -R www-data:www-data /var/www/learning-summary

# 또는 Nginx의 경우
sudo chown -R nginx:nginx /var/www/learning-summary

# 권한 설정
chmod -R 755 /var/www/learning-summary
chmod -R 775 /var/www/learning-summary/logs
```

### Step 3: 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 또는 원격 접속
mysql -h your-db-host -u root -p
```

MySQL 콘솔에서:

```sql
-- 데이터베이스 생성
CREATE DATABASE learning_summary
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (로컬)
CREATE USER 'learning_user'@'localhost'
  IDENTIFIED BY 'secure_password_here';

-- 권한 부여
GRANT ALL PRIVILEGES ON learning_summary.*
  TO 'learning_user'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### Step 4: 스키마 Import

```bash
# 스키마 파일 import
mysql -u learning_user -p learning_summary < database/schema.sql

# 성공 확인
mysql -u learning_user -p learning_summary -e "SHOW TABLES;"
```

예상 출력:
```
+---------------------------+
| Tables_in_learning_summary|
+---------------------------+
| concept_tags              |
| learning_sessions         |
| learning_summaries        |
| question_responses        |
| student_reflections       |
| summary_concepts          |
| system_config             |
+---------------------------+
```

### Step 5: 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# 편집기로 열기
nano .env
# 또는
vi .env
```

`.env` 파일 내용 수정:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=learning_summary
DB_USER=learning_user
DB_PASSWORD=your_secure_password

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com
MOODLE_WS_TOKEN=your_token_will_be_generated_later
MOODLE_WS_SERVICE=moodle_mobile_app

# Claude API Configuration
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=4000
CLAUDE_TEMPERATURE=0.7

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Seoul
APP_LANGUAGE=ko

# AI Summary Settings
ENABLE_AI_SUMMARIES=true
SUMMARY_LANGUAGE=ko
MAX_SUMMARY_LENGTH=500
```

저장 후 권한 설정:
```bash
chmod 600 .env
```

### Step 6: 웹 서버 설정

#### Apache 설정

```bash
# 가상 호스트 파일 생성
sudo nano /etc/apache2/sites-available/learning-summary.conf
```

내용:
```apache
<VirtualHost *:80>
    ServerName learning-summary.yourdomain.com
    ServerAlias www.learning-summary.yourdomain.com
    DocumentRoot /var/www/learning-summary/public

    <Directory /var/www/learning-summary/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Rewrite rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.php [L]
    </Directory>

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/learning-summary-error.log
    CustomLog ${APACHE_LOG_DIR}/learning-summary-access.log combined

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

활성화:
```bash
# 사이트 활성화
sudo a2ensite learning-summary.conf

# mod_rewrite 활성화
sudo a2enmod rewrite
sudo a2enmod headers

# Apache 재시작
sudo systemctl restart apache2
```

#### Nginx 설정

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/learning-summary
```

내용:
```nginx
server {
    listen 80;
    server_name learning-summary.yourdomain.com;
    root /var/www/learning-summary/public;
    index index.php index.html;

    # 로깅
    access_log /var/log/nginx/learning-summary-access.log;
    error_log /var/log/nginx/learning-summary-error.log;

    # PHP 처리
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # Timeout 설정
        fastcgi_read_timeout 300;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # .env 파일 접근 차단
    location ~ /\.env {
        deny all;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

활성화:
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/learning-summary /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## Moodle 설정

### 1. Web Services 활성화

Moodle 관리자로 로그인:

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
   - 저장

2. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - "REST 프로토콜" 활성화

### 2. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭

2. 서비스 정보 입력:
   - 이름: `Learning Summary Service`
   - 약식 이름: `learning_summary`
   - 활성화: 예

3. "함수 추가" 클릭하여 다음 함수 추가:
   ```
   core_webservice_get_site_info
   core_user_get_users_by_field
   core_course_get_courses
   core_enrol_get_users_courses
   mod_quiz_get_quizzes_by_courses
   mod_quiz_get_attempt_data
   mod_quiz_get_attempt_review
   mod_quiz_get_attempt_summary
   mod_quiz_get_user_attempts
   mod_quiz_get_quiz_access_information
   ```

### 3. 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 생성" 클릭

2. 토큰 정보:
   - 사용자: Moodle 관리자 또는 적절한 권한을 가진 사용자
   - 서비스: `Learning Summary Service`

3. 생성된 토큰 복사

4. `.env` 파일에 토큰 추가:
   ```bash
   nano /var/www/learning-summary/.env
   ```

   ```env
   MOODLE_WS_TOKEN=복사한_토큰_여기에_붙여넣기
   ```

### 4. CORS 설정 (필요시)

Moodle `config.php`에 추가:

```php
// CORS 설정
header('Access-Control-Allow-Origin: http://learning-summary.yourdomain.com');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## 테스트

### 1. PHP 설정 확인

```bash
# PHP 버전 확인
php -v

# 필수 모듈 확인
php -m | grep -E 'pdo|mysql|curl|json|mbstring'
```

### 2. 데이터베이스 연결 테스트

```bash
# MySQL 연결 테스트
mysql -u learning_user -p learning_summary -e "SELECT 'Connection OK' as status;"
```

### 3. 웹 서버 접근 테스트

브라우저로 접속:
```
http://learning-summary.yourdomain.com
```

홈페이지가 로드되어야 합니다.

### 4. API 연결 테스트

웹 페이지에서 "연결 테스트" 버튼 클릭:
- ✅ Moodle 연결 성공
- ✅ Claude AI 연결 성공

### 5. 수동 API 테스트

```bash
# Moodle API 테스트
curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"

# Learning Summary API 테스트
curl "http://learning-summary.yourdomain.com/?api=1&action=test_connections"
```

## 문제 해결

### 문제: "Database connection failed"

**해결방법:**
```bash
# 1. MySQL 서비스 확인
sudo systemctl status mysql

# 2. 데이터베이스 존재 확인
mysql -u root -p -e "SHOW DATABASES LIKE 'learning_summary';"

# 3. 사용자 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'learning_user'@'localhost';"

# 4. .env 파일 확인
cat .env | grep DB_
```

### 문제: "Moodle API connection failed"

**해결방법:**
1. Moodle Web Services 활성화 확인
2. 토큰 유효성 확인
3. 방화벽 설정 확인
4. Moodle 로그 확인: `사이트 관리 > 보고서 > 로그`

### 문제: "Claude API error"

**해결방법:**
```bash
# 1. API 키 확인
cat .env | grep CLAUDE_API_KEY

# 2. 인터넷 연결 확인
ping api.anthropic.com

# 3. cURL 테스트
curl -I https://api.anthropic.com/v1/messages
```

### 문제: "Permission denied"

**해결방법:**
```bash
# 디렉토리 소유자 및 권한 재설정
sudo chown -R www-data:www-data /var/www/learning-summary
chmod -R 755 /var/www/learning-summary
chmod -R 775 /var/www/learning-summary/logs
```

### 문제: PHP 오류 로그 확인

```bash
# Apache 오류 로그
sudo tail -f /var/log/apache2/learning-summary-error.log

# Nginx 오류 로그
sudo tail -f /var/log/nginx/learning-summary-error.log

# PHP 오류 로그
sudo tail -f /var/log/php7.1-fpm.log

# 애플리케이션 로그
tail -f /var/www/learning-summary/logs/app.log
```

## 보안 체크리스트

- [ ] `.env` 파일 권한 600으로 설정
- [ ] 데이터베이스 사용자 비밀번호 강력하게 설정
- [ ] API 키를 코드에 하드코딩하지 않음
- [ ] HTTPS 설정 (Let's Encrypt 권장)
- [ ] 방화벽 규칙 설정
- [ ] 정기적인 백업 설정
- [ ] 로그 모니터링 설정

## HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache

# 또는 Nginx의 경우
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --apache -d learning-summary.yourdomain.com

# 또는 Nginx
sudo certbot --nginx -d learning-summary.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 다음 단계

설치가 완료되었습니다! 이제:

1. [README.md](../README.md)에서 사용 방법 확인
2. 테스트 퀴즈로 시스템 테스트
3. 사용자 교육 및 문서 배포

---

**도움이 필요하신가요?**
- GitHub Issues: [프로젝트 이슈](github-issues-url)
- 이메일: support@yourdomain.com
