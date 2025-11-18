# Probability Grid - 설치 가이드

이 문서는 Probability Grid 웹앱을 처음부터 설치하는 상세한 단계별 가이드입니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [빠른 설치](#빠른-설치)
3. [상세 설치 단계](#상세-설치-단계)
4. [Moodle LTI 설정](#moodle-lti-설정)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 소프트웨어

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (7.4+ 권장)
  - 필수 확장: `pdo`, `pdo_mysql`, `json`, `mbstring`, `openssl`
- **데이터베이스**: MySQL 5.7+ 또는 MariaDB 10.2+
- **Moodle** (선택): 3.7 이상

### 시스템 리소스

- **디스크 공간**: 최소 50MB
- **메모리**: 최소 128MB PHP 메모리
- **대역폭**: 학생당 약 1MB

## 빠른 설치

### Ubuntu/Debian

```bash
# 1. 필수 패키지 설치
sudo apt update
sudo apt install apache2 php7.4 php7.4-mysql mysql-server git

# 2. MySQL 데이터베이스 설정
sudo mysql -u root -p << EOF
CREATE DATABASE probability_grid CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'prob_grid'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON probability_grid.* TO 'prob_grid'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. 애플리케이션 설치
cd /var/www/html
sudo git clone <repository-url> probability-grid-app
cd probability-grid-app

# 4. 환경 설정
sudo cp .env.example .env
sudo nano .env  # 데이터베이스 정보 업데이트

# 5. 데이터베이스 스키마 임포트
mysql -u prob_grid -p probability_grid < database/schema.sql

# 6. 권한 설정
sudo chown -R www-data:www-data /var/www/html/probability-grid-app
sudo chmod -R 755 /var/www/html/probability-grid-app

# 7. Apache 재시작
sudo systemctl restart apache2

# 8. 설치 확인
curl http://localhost/probability-grid-app/public/index.html
```

### CentOS/RHEL

```bash
# 1. 필수 패키지 설치
sudo yum install httpd php php-mysql mysql-server git

# 2. 서비스 시작
sudo systemctl start httpd
sudo systemctl start mysqld
sudo systemctl enable httpd
sudo systemctl enable mysqld

# 3-8. Ubuntu/Debian과 동일한 단계 진행
# (/var/www/html 경로 동일)
```

### macOS (MAMP/XAMPP)

```bash
# 1. MAMP 또는 XAMPP 설치
# https://www.mamp.info/en/downloads/
# 또는 https://www.apachefriends.org/

# 2. htdocs 디렉토리로 이동
cd /Applications/MAMP/htdocs
# 또는 XAMPP: cd /Applications/XAMPP/htdocs

# 3. 애플리케이션 복사
cp -r /path/to/probability-grid-app ./

# 4. 환경 설정
cd probability-grid-app
cp .env.example .env
nano .env

# 5. phpMyAdmin을 통해 데이터베이스 생성 및 스키마 임포트
# http://localhost:8888/phpMyAdmin (MAMP)
# http://localhost/phpmyadmin (XAMPP)
```

### Windows (XAMPP)

```powershell
# 1. XAMPP 설치
# https://www.apachefriends.org/download.html

# 2. htdocs로 이동
cd C:\xampp\htdocs

# 3. 애플리케이션 복사
xcopy /E /I C:\path\to\probability-grid-app probability-grid-app

# 4. 환경 설정
cd probability-grid-app
copy .env.example .env
notepad .env

# 5. XAMPP Control Panel에서 Apache와 MySQL 시작

# 6. phpMyAdmin으로 데이터베이스 설정
# http://localhost/phpmyadmin
```

## 상세 설치 단계

### 1단계: PHP 확장 확인

```bash
# 필수 확장 확인
php -m | grep -E "pdo|pdo_mysql|json|mbstring|openssl"

# 누락된 확장 설치 (Ubuntu/Debian)
sudo apt install php-pdo php-mysql php-json php-mbstring

# 누락된 확장 설치 (CentOS/RHEL)
sudo yum install php-pdo php-mysqlnd php-json php-mbstring
```

### 2단계: 데이터베이스 생성 (상세)

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE probability_grid
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (보안 강화)
CREATE USER 'prob_grid'@'localhost'
    IDENTIFIED BY 'YourVerySecurePassword123!@#';

# 권한 부여 (최소 권한 원칙)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER
    ON probability_grid.*
    TO 'prob_grid'@'localhost';

FLUSH PRIVILEGES;

# 데이터베이스 선택
USE probability_grid;

# 스키마 임포트
SOURCE /var/www/html/probability-grid-app/database/schema.sql;

# 테이블 확인
SHOW TABLES;

# 샘플 데이터 확인
SELECT * FROM problems;

# 종료
EXIT;
```

### 3단계: 환경 변수 설정 (상세)

```bash
# .env 파일 생성
cd /var/www/html/probability-grid-app
cp .env.example .env

# .env 파일 편집
nano .env
```

`.env` 파일 내용:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=probability_grid
DB_USER=prob_grid
DB_PASS=YourVerySecurePassword123!@#

# LTI 설정 (보안 강화)
LTI_CONSUMER_KEY=moodle_prob_grid_$(openssl rand -hex 8)
LTI_SHARED_SECRET=$(openssl rand -base64 32)

# 애플리케이션 URL (실제 도메인으로 변경)
APP_BASE_URL=http://your-domain.com/probability-grid-app
TOOL_URL=http://your-domain.com/probability-grid-app/moodle-plugin/lti_handler.php

# 디버그 모드 (프로덕션에서는 false)
DEBUG_MODE=false

# CORS 설정
CORS_ORIGINS=http://localhost,http://your-moodle-domain.com
```

**중요**: `LTI_CONSUMER_KEY`와 `LTI_SHARED_SECRET` 값을 기록해두세요. Moodle 설정에서 필요합니다.

### 4단계: 파일 권한 설정

```bash
# 소유자 설정 (Apache)
sudo chown -R www-data:www-data /var/www/html/probability-grid-app

# 또는 (Nginx)
sudo chown -R nginx:nginx /var/www/html/probability-grid-app

# 디렉토리 권한
sudo find /var/www/html/probability-grid-app -type d -exec chmod 755 {} \;

# 파일 권한
sudo find /var/www/html/probability-grid-app -type f -exec chmod 644 {} \;

# .env 파일 보호
sudo chmod 600 /var/www/html/probability-grid-app/.env
```

### 5단계: 웹 서버 설정

#### Apache

```bash
# 가상 호스트 생성 (선택사항)
sudo nano /etc/apache2/sites-available/probability-grid.conf
```

```apache
<VirtualHost *:80>
    ServerName probability-grid.your-domain.com
    DocumentRoot /var/www/html/probability-grid-app/public

    <Directory /var/www/html/probability-grid-app/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/probability-grid-error.log
    CustomLog ${APACHE_LOG_DIR}/probability-grid-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite probability-grid.conf

# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

#### Nginx

```bash
# 서버 블록 생성
sudo nano /etc/nginx/sites-available/probability-grid
```

```nginx
server {
    listen 80;
    server_name probability-grid.your-domain.com;

    root /var/www/html/probability-grid-app/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }

    location ~ /\.env {
        deny all;
    }

    access_log /var/log/nginx/probability-grid-access.log;
    error_log /var/log/nginx/probability-grid-error.log;
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/probability-grid /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 6단계: 설치 검증

```bash
# 1. 웹 서버 접근 테스트
curl -I http://localhost/probability-grid-app/public/index.html

# 2. API 엔드포인트 테스트
curl http://localhost/probability-grid-app/src/api/api.php?action=get-problems

# 3. 브라우저에서 확인
# http://localhost/probability-grid-app/public/index.html?problem=1
```

## Moodle LTI 설정

### 1단계: Moodle 관리자 설정

1. **관리자로 로그인**
2. **Site administration** → **Plugins** → **Activity modules** → **External tool** → **Manage tools**
3. **"Configure a tool manually"** 클릭

### 2단계: Tool 설정

다음 정보를 입력:

| 필드 | 값 |
|------|-----|
| Tool name | `Probability Grid` |
| Tool URL | `http://your-domain.com/probability-grid-app/moodle-plugin/lti_handler.php` |
| Tool description | `확률 공간 시각화 학습 도구` |
| Consumer key | `.env` 파일의 `LTI_CONSUMER_KEY` 값 |
| Shared secret | `.env` 파일의 `LTI_SHARED_SECRET` 값 |
| Custom parameters | `custom_question_id=$ResourceLink.id` |
| Default launch container | `New window` |

### 3단계: Privacy 설정

다음 옵션 활성화:

- ✓ Share launcher's name with tool
- ✓ Share launcher's email with tool
- ✓ Accept grades from the tool

### 4단계: 코스에 활동 추가

1. 코스 편집 모드 활성화
2. **Add an activity or resource** 클릭
3. **External tool** 선택
4. **Probability Grid** 도구 선택
5. 활동 제목 입력 (예: "동전 던지기 확률 문제")
6. **Save and display**

## 문제 해결

### Apache가 시작되지 않음

```bash
# 로그 확인
sudo tail -f /var/log/apache2/error.log

# 포트 충돌 확인
sudo netstat -tulpn | grep :80

# 설정 파일 테스트
sudo apachectl configtest
```

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# 연결 테스트
mysql -u prob_grid -p -h localhost probability_grid
```

### PHP 오류

```bash
# PHP 로그 확인
sudo tail -f /var/log/apache2/error.log

# PHP 설정 확인
php -i | grep -E "error_log|display_errors"

# .env 파일 DEBUG_MODE를 true로 설정하여 상세 오류 확인
```

### LTI 서명 검증 실패

1. **시간 동기화 확인**:
   ```bash
   sudo ntpdate pool.ntp.org
   ```

2. **Consumer Key/Secret 재확인**:
   - Moodle 설정과 `.env` 파일의 값이 정확히 일치하는지 확인

3. **URL 확인**:
   - Tool URL이 정확한지 확인
   - HTTP vs HTTPS 일치 확인

### CORS 오류

```bash
# .env 파일에 Moodle 도메인 추가
CORS_ORIGINS=http://localhost,http://moodle.example.com,https://moodle.example.com
```

### 권한 오류

```bash
# 파일 소유자 확인
ls -la /var/www/html/probability-grid-app

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/probability-grid-app
sudo chmod -R 755 /var/www/html/probability-grid-app
```

## 보안 체크리스트

설치 후 다음 보안 사항을 확인하세요:

- [ ] `.env` 파일이 웹에서 접근 불가능한지 확인
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] 프로덕션에서 `DEBUG_MODE=false` 설정
- [ ] HTTPS 사용 (Let's Encrypt 권장)
- [ ] 정기적인 백업 설정
- [ ] 최신 보안 업데이트 적용

## 다음 단계

설치가 완료되었다면:

1. [README.md](README.md)에서 사용법 확인
2. 샘플 문제로 테스트
3. 커스텀 문제 추가
4. 학생들에게 배포

---

**도움이 필요하신가요?** 이슈를 열어주세요!
