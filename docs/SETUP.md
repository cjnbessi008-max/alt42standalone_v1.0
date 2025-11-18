# ALT42 Standalone - 설치 및 설정 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 단계](#설치-단계)
3. [Moodle 연동 설정](#moodle-연동-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [웹 서버 설정](#웹-서버-설정)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx 1.14 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 권장 사양
- PHP memory_limit: 256M 이상
- MySQL max_connections: 100 이상
- 디스크 공간: 500MB 이상

---

## 설치 단계

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 디렉토리 권한 설정
```bash
chmod -R 755 frontend/
chmod -R 755 backend/
chmod 600 backend/config/config.php  # 보안을 위해
```

### 3. PHP 확장 모듈 확인
```bash
php -m | grep -E "pdo|mysql|curl|json|mbstring"
```

필요한 모듈이 없으면 설치:
```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring

# CentOS/RHEL
sudo yum install php71-mysql php71-curl php71-json php71-mbstring
```

---

## Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리** 로 이동
3. "웹 서비스 활성화" 체크
4. 다음 프로토콜 활성화:
   - REST 프로토콜

### 2. 웹 서비스 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**로 이동
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰 복사

### 3. 필요한 웹 서비스 함수 권한 부여

다음 함수들의 권한이 필요합니다:
- `mod_quiz_get_quiz_by_courses`
- `mod_quiz_get_user_attempts`
- `mod_quiz_get_quiz_attempts`
- `core_question_get_question_data`

### 4. 설정 파일 업데이트

`backend/config/config.php` 파일을 열고 다음 정보를 입력:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_generated_token_here');
```

---

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE alt42_standalone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alt42_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON alt42_standalone.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 스키마 임포트

```bash
mysql -u alt42_user -p alt42_standalone < backend/database/schema.sql
```

### 3. 데이터베이스 연결 설정

`backend/config/config.php` 파일에서:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_standalone');
define('DB_USER', 'alt42_user');
define('DB_PASS', 'your_password_here');
```

### 4. 연결 테스트

```bash
php -r "require 'backend/database/db.php'; Database::getInstance();"
```

오류가 없으면 성공!

---

## 웹 서버 설정

### Apache 설정

1. Virtual Host 파일 생성: `/etc/apache2/sites-available/alt42.conf`

```apache
<VirtualHost *:80>
    ServerName alt42.yourdomain.com
    DocumentRoot /var/www/alt42standalone_v1.0/frontend

    <Directory /var/www/alt42standalone_v1.0/frontend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /var/www/alt42standalone_v1.0/backend
    <Directory /var/www/alt42standalone_v1.0/backend>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

2. 사이트 활성화:

```bash
sudo a2ensite alt42
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### Nginx 설정

파일 생성: `/etc/nginx/sites-available/alt42`

```nginx
server {
    listen 80;
    server_name alt42.yourdomain.com;

    root /var/www/alt42standalone_v1.0/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /backend {
        alias /var/www/alt42standalone_v1.0/backend;
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    access_log /var/log/nginx/alt42_access.log;
    error_log /var/log/nginx/alt42_error.log;
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/alt42 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 테스트

### 1. 백엔드 API 테스트

브라우저에서:
```
http://your-domain/backend/api/graph_data.php?quiz_id=1
```

정상 응답 예시:
```json
{
    "success": true,
    "timestamp": 1234567890,
    "quiz_id": 1,
    "statistics": {
        "total_attempts": 10,
        "average_score": 85.5,
        "completion_rate": 80.0
    }
}
```

### 2. 프론트엔드 테스트

브라우저에서:
```
http://your-domain/
```

다음 사항들을 확인:
- ✅ 페이지가 정상적으로 로드됨
- ✅ 우측 하단에 스마트폰 화면이 표시됨
- ✅ Live Graph가 "숨 쉬는" 애니메이션을 보여줌
- ✅ 퀴즈 선택 드롭다운이 동작함
- ✅ 통계 데이터가 표시됨

### 3. 개발자 도구 확인

브라우저 개발자 도구(F12)에서:
- Console 탭: 에러 메시지가 없는지 확인
- Network 탭: API 요청이 성공하는지 확인 (200 상태 코드)

---

## 문제 해결

### 문제 1: "Database connection failed" 오류

**원인**: MySQL 연결 정보가 잘못되었거나 MySQL 서버가 실행 중이 아님

**해결**:
1. MySQL 서버 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```

2. 연결 정보 재확인: `backend/config/config.php`

3. MySQL 로그 확인:
   ```bash
   sudo tail -f /var/log/mysql/error.log
   ```

### 문제 2: "Moodle API request failed" 오류

**원인**: Moodle 토큰이 잘못되었거나 웹 서비스가 비활성화됨

**해결**:
1. Moodle 토큰 재생성
2. 웹 서비스 활성화 상태 확인
3. Moodle URL이 올바른지 확인
4. curl로 직접 테스트:
   ```bash
   curl "http://your-moodle-site/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
   ```

### 문제 3: 그래프가 표시되지 않음

**원인**: JavaScript 로딩 오류 또는 Canvas API 미지원

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. JavaScript 파일 경로 확인
3. 다른 브라우저에서 테스트
4. 캐시 클리어 후 새로고침 (Ctrl+Shift+R)

### 문제 4: CORS 오류

**원인**: 백엔드 API와 프론트엔드가 다른 도메인에서 실행

**해결**:
`backend/api/graph_data.php` 파일에서:
```php
header('Access-Control-Allow-Origin: *');  // 또는 특정 도메인
```

### 문제 5: PHP 확장 모듈 누락

**오류 메시지**: "Call to undefined function curl_init()"

**해결**:
```bash
# Ubuntu/Debian
sudo apt-get install php7.1-curl
sudo systemctl restart apache2

# CentOS/RHEL
sudo yum install php71-curl
sudo systemctl restart httpd
```

---

## 보안 고려사항

### 1. 프로덕션 환경 설정

`backend/config/config.php`에서:
```php
define('DEBUG_MODE', false);  // 디버그 모드 비활성화
define('CORS_ALLOWED_ORIGINS', 'https://your-domain.com');  // 특정 도메인만 허용
```

### 2. HTTPS 설정 (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d alt42.yourdomain.com
```

### 3. 파일 권한

```bash
# 읽기 전용으로 설정
chmod 444 backend/config/config.php

# 업로드 디렉토리가 있는 경우
chmod 755 uploads/
```

---

## 추가 리소스

- [Moodle Web Services 문서](https://docs.moodle.org/dev/Web_services)
- [PHP PDO 문서](https://www.php.net/manual/en/book.pdo.php)
- [Canvas API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 지원

문제가 발생하면:
1. GitHub Issues에 문제 등록
2. 로그 파일 첨부 (`/var/log/apache2/` 또는 `/var/log/nginx/`)
3. PHP 버전 및 환경 정보 포함

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
