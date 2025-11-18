# Substitution Shift 설치 가이드

## 📋 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache** 또는 **Nginx** 웹 서버
- **Node.js**: 14.x 이상 (프론트엔드 빌드용)

### Moodle 연동 (선택사항)
- **Moodle**: 3.7 이상
- Web Service 활성화 필요

---

## 🚀 설치 단계

### 1. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE substitution_shift CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'subshift_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON substitution_shift.* TO 'subshift_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 적용

```bash
mysql -u subshift_user -p substitution_shift < database/schema.sql
```

---

### 2. 백엔드 설정 (PHP)

#### 파일 배치

웹 서버의 document root에 `substitution-shift` 디렉토리를 복사합니다.

예: Apache의 경우
```bash
sudo cp -r substitution-shift /var/www/html/
```

#### 설정 파일 생성

```bash
cd /var/www/html/substitution-shift/backend/config
cp config.example.php config.php
```

#### config.php 수정

```php
<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'substitution_shift');
define('DB_USER', 'subshift_user');
define('DB_PASS', 'your_secure_password');

// Moodle Integration (선택사항)
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',  // 개발용
    'https://your-domain.com', // 프로덕션용
]);

// 프로덕션 환경에서는 반드시 false로 설정
define('DEBUG_MODE', false);
?>
```

#### 권한 설정

```bash
sudo chown -R www-data:www-data /var/www/html/substitution-shift
sudo chmod -R 755 /var/www/html/substitution-shift
```

#### Apache 설정 (.htaccess)

`backend/api/.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /substitution-shift/backend/api/

    # CORS headers
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# PHP settings
php_flag display_errors off
php_value upload_max_filesize 5M
php_value post_max_size 5M
```

---

### 3. 프론트엔드 설정 (React)

#### 의존성 설치

```bash
cd frontend
npm install
```

#### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
REACT_APP_API_URL=https://your-domain.com/substitution-shift/backend/api
REACT_APP_MOODLE_URL=https://your-moodle-site.com
REACT_APP_DEBUG=false
```

#### 개발 서버 실행 (테스트용)

```bash
npm start
```

브라우저에서 http://localhost:3000 접속

#### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

#### 빌드 파일 배포

```bash
sudo cp -r build/* /var/www/html/substitution-shift/
```

---

### 4. 웹 서버 설정

#### Apache VirtualHost 설정

`/etc/apache2/sites-available/substitution-shift.conf`:

```apache
<VirtualHost *:80>
    ServerName substitution-shift.your-domain.com
    DocumentRoot /var/www/html/substitution-shift

    <Directory /var/www/html/substitution-shift>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/substitution-shift-error.log
    CustomLog ${APACHE_LOG_DIR}/substitution-shift-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite substitution-shift
sudo a2enmod rewrite
sudo systemctl reload apache2
```

#### Nginx 설정 (대안)

`/etc/nginx/sites-available/substitution-shift`:

```nginx
server {
    listen 80;
    server_name substitution-shift.your-domain.com;

    root /var/www/html/substitution-shift;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /backend/api/ {
        try_files $uri $uri/ /backend/api/index.php?$query_string;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}
```

---

### 5. API 테스트

#### 문제 목록 조회

```bash
curl http://your-domain.com/substitution-shift/backend/api/problems.php
```

예상 응답:
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

#### 특정 문제 조회

```bash
curl http://your-domain.com/substitution-shift/backend/api/problems.php?id=1
```

#### 랜덤 문제 조회

```bash
curl http://your-domain.com/substitution-shift/backend/api/problems.php?random=1&difficulty=easy
```

---

## 🔗 Moodle 연동 설정

### 1. Moodle Web Service 활성화

Moodle 관리자 페이지:

1. **사이트 관리** > **고급 기능**
   - "Web services 활성화" 체크

2. **사이트 관리** > **플러그인** > **Web services** > **외부 서비스**
   - 새 서비스 생성: "Substitution Shift Integration"
   - 필요한 함수 추가

3. **토큰 생성**
   - **사이트 관리** > **서버** > **Web services** > **토큰 관리**
   - 새 토큰 생성 후 `config.php`에 복사

### 2. Moodle 플러그인 설치 (선택사항)

`moodle/mod/substitutionshift/` 디렉토리에 플러그인 생성:

```php
<?php
// version.php
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'mod_substitutionshift';
$plugin->version = 2025111800;
$plugin->requires = 2019052000; // Moodle 3.7
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.0.0';
?>
```

### 3. iframe 임베드 방법

Moodle 페이지에 다음 코드 추가:

```html
<iframe
  src="https://your-domain.com/substitution-shift/?moodle_id=123&course_id=456"
  width="100%"
  height="800px"
  frameborder="0"
  allowfullscreen>
</iframe>
```

URL 파라미터:
- `moodle_id`: Moodle 문제 ID
- `course_id`: Moodle 코스 ID
- `student_id`: 학생 ID (자동 전달)

---

## 🔧 문제 해결

### API 호출 시 CORS 에러

**해결책**: `backend/config/config.php`에서 `ALLOWED_ORIGINS`에 프론트엔드 도메인 추가

### 데이터베이스 연결 실패

**확인 사항**:
1. MySQL 서비스 실행 중인지 확인: `sudo systemctl status mysql`
2. 데이터베이스 사용자 권한 확인
3. `config.php`의 DB 정보가 정확한지 확인

### 프론트엔드가 빈 화면으로 표시

**해결책**:
1. 브라우저 콘솔에서 에러 확인
2. `.env` 파일의 API URL이 정확한지 확인
3. 백엔드 API가 정상 작동하는지 테스트

### KaTeX 수식이 표시되지 않음

**해결책**: `public/index.html`에 KaTeX CSS 링크가 있는지 확인

---

## 📊 샘플 데이터 추가

`database/schema.sql`에 이미 2개의 예제 문제가 포함되어 있습니다.

추가 문제를 넣으려면:

```sql
INSERT INTO substitution_problems
  (title, original_integral, substitution_variable, substitution_expression,
   du_expression, steps, final_answer, difficulty_level, category)
VALUES
  ('지수함수 치환적분',
   '\\int x e^{x^2} \\, dx',
   'u',
   'x^2',
   '2x \\, dx',
   JSON_ARRAY(
     JSON_OBJECT('step', 1, 'description', '원본 식', 'expression', '\\int x e^{x^2} \\, dx', 'color', '#000000'),
     -- 추가 단계...
   ),
   '\\frac{1}{2} e^{x^2} + C',
   'medium',
   '치환적분-지수함수');
```

---

## 🎯 다음 단계

1. ✅ 설치 완료 확인
2. 🧪 샘플 문제 테스트
3. 📝 커스텀 문제 추가
4. 🔗 Moodle과 연동 (선택)
5. 📊 학생 진행도 추적 구현

---

## 📞 지원

문제가 발생하면:
- 로그 파일 확인: `/var/log/apache2/substitution-shift-error.log`
- PHP 에러 로그: `/var/log/php7.1-fpm.log`
- 브라우저 콘솔 확인 (F12)

KAIST Touch Math Academy 지원팀에 문의하세요.
