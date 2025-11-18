# Shape Explainer 설치 가이드

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Web Server**: Apache 2.4+ 또는 Nginx 1.10+
- **Moodle**: 3.7 이상
- **Browser**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 단계

### 1. 프로젝트 다운로드

```bash
git clone <repository-url>
cd alt42standalone_v1.0/shape-explainer
```

### 2. 데이터베이스 설정

MySQL에 접속하여 데이터베이스를 생성하고 스키마를 적용합니다:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE shape_explainer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shape_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON shape_explainer.* TO 'shape_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

스키마 파일 적용:

```bash
mysql -u root -p shape_explainer < database/schema.sql
```

### 3. 설정 파일 구성

```bash
cp backend/config/config.example.php backend/config/config.php
```

`backend/config/config.php` 파일을 편집하여 데이터베이스 및 Moodle 설정을 입력합니다:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'shape_explainer');
define('DB_USER', 'shape_user');
define('DB_PASS', 'your_secure_password');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your-moodle-webservice-token');
```

### 4. Moodle Web Services 설정

#### 4.1 Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. "웹 서비스 사용" 체크박스 활성화
4. 변경사항 저장

#### 4.2 External Service 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**로 이동
2. "사용자 정의 서비스 추가" 클릭
3. 서비스 이름: `shape_explainer_service`
4. 활성화됨: 체크
5. 저장

#### 4.3 필요한 함수 추가

다음 함수들을 서비스에 추가합니다:

- `core_question_get_question`
- `core_course_get_courses`
- `core_user_get_users_by_field`
- `core_grades_update_grades`
- `core_webservice_get_site_info`

#### 4.4 Web Service 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**로 이동
2. "토큰 추가" 클릭
3. 사용자 선택 (관리자 또는 교사 계정)
4. 서비스: `shape_explainer_service` 선택
5. 저장
6. 생성된 토큰을 복사하여 `config.php`의 `MOODLE_TOKEN`에 입력

### 5. 웹 서버 설정

#### Apache

`.htaccess` 파일이 이미 포함되어 있습니다. `mod_rewrite`가 활성화되어 있는지 확인하세요:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

VirtualHost 설정 예시:

```apache
<VirtualHost *:80>
    ServerName shape-explainer.local
    DocumentRoot /var/www/shape-explainer

    <Directory /var/www/shape-explainer>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/shape-explainer-error.log
    CustomLog ${APACHE_LOG_DIR}/shape-explainer-access.log combined
</VirtualHost>
```

#### Nginx

Nginx 설정 예시:

```nginx
server {
    listen 80;
    server_name shape-explainer.local;
    root /var/www/shape-explainer/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /backend/api {
        rewrite ^/backend/api/(.*)$ /backend/api/index.php last;
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

### 6. 권한 설정

```bash
sudo chown -R www-data:www-data /var/www/shape-explainer
sudo chmod -R 755 /var/www/shape-explainer
```

### 7. 테스트

브라우저에서 다음 URL로 접속하여 테스트합니다:

```
http://shape-explainer.local/backend/api/health
```

정상적으로 작동하면 다음과 같은 응답을 받습니다:

```json
{
  "status": "ok",
  "version": "v1"
}
```

애플리케이션 테스트:

```
http://shape-explainer.local/?shape_id=1
```

## Moodle과 통합

### 1. Moodle 활동 모듈로 추가

Moodle 코스에 "외부 도구(External Tool)" 활동을 추가합니다:

1. 코스에서 "활동 또는 리소스 추가" 클릭
2. "외부 도구" 선택
3. URL에 Shape Explainer URL 입력:
   ```
   http://shape-explainer.local/?question_id={questionid}&user_id={userid}&course_id={courseid}
   ```
4. 저장

### 2. iframe으로 삽입

Moodle 페이지나 레이블에 다음 HTML을 추가:

```html
<iframe
    src="http://shape-explainer.local/?shape_id=1"
    width="100%"
    height="800px"
    frameborder="0">
</iframe>
```

## 문제 해결

### 데이터베이스 연결 오류

- MySQL 서비스가 실행 중인지 확인
- 데이터베이스 자격 증명이 올바른지 확인
- MySQL 사용자에게 올바른 권한이 있는지 확인

### Moodle API 오류

- Moodle Web Services가 활성화되어 있는지 확인
- 토큰이 유효한지 확인
- 필요한 함수들이 서비스에 추가되어 있는지 확인

### CORS 오류

- `config.php`의 `ALLOWED_ORIGINS`에 Moodle URL이 포함되어 있는지 확인

### PHP 오류

- PHP 버전이 7.1.9 이상인지 확인
- 필요한 PHP 확장이 설치되어 있는지 확인:
  - `php-mysql`
  - `php-curl`
  - `php-json`
  - `php-mbstring`

## 개발 모드

개발 중에는 `config.php`에서 다음 설정을 사용합니다:

```php
define('APP_DEBUG', true);
```

프로덕션 환경에서는 반드시 `false`로 설정하세요.

## 업데이트

```bash
git pull origin main
mysql -u root -p shape_explainer < database/migrations/update_xxx.sql
```

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요.
