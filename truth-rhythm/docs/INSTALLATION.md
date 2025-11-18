# Truth Rhythm 설치 가이드

## 시스템 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 단계

### 1. 파일 준비

프로젝트 파일을 웹 서버의 document root에 복사합니다.

```bash
# 예: Apache의 경우
cp -r truth-rhythm /var/www/html/

# 또는 특정 도메인 디렉토리
cp -r truth-rhythm /var/www/your-domain.com/
```

### 2. 데이터베이스 설정

MySQL에 접속하여 데이터베이스를 생성하고 스키마를 임포트합니다.

```bash
# MySQL 접속
mysql -u root -p

# 또는 스키마 파일 직접 실행
mysql -u root -p < truth-rhythm/database/schema.sql
```

데이터베이스 사용자 생성 (권장):

```sql
CREATE USER 'truth_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON truth_rhythm.* TO 'truth_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. API 설정

`api/config.php` 파일을 편집하여 환경에 맞게 설정합니다.

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'truth_rhythm');
define('DB_USER', 'truth_user');
define('DB_PASS', 'your_secure_password');

// Moodle 설정
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 4. Moodle 웹 서비스 설정

Moodle에서 웹 서비스를 활성화하고 토큰을 생성합니다.

#### 4.1 Moodle 관리자 페이지 접속

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
   - 저장

2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
   - REST 프로토콜 활성화

3. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
   - 새 서비스 생성: "Truth Rhythm"
   - 필요한 함수 추가:
     - `core_question_get_random_question_summaries`
     - `core_question_get_question_data`
     - `core_user_get_users`
     - `core_webservice_get_site_info`

4. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
   - 토큰 생성
   - 생성된 토큰을 `config.php`에 입력

### 5. 파일 권한 설정

로그 파일을 위한 디렉토리 생성 및 권한 설정:

```bash
cd truth-rhythm
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs  # Ubuntu/Debian
# 또는
chown apache:apache logs       # CentOS/RHEL
```

### 6. 웹 서버 설정

#### Apache 설정

`.htaccess` 파일 생성 (truth-rhythm 디렉토리에):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /truth-rhythm/

    # API 요청 처리
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1 [L]
</IfModule>

# 보안 설정
<FilesMatch "\.(sql|md|json)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# PHP 설정
php_flag display_errors Off
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

#### Nginx 설정

`/etc/nginx/sites-available/truth-rhythm` 파일 생성:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/truth-rhythm/public;
    index index.html;

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    # API 라우팅
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # 보안 파일 차단
    location ~ \.(sql|md|json)$ {
        deny all;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|mp3)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7. 사운드 파일 준비

사운드 파일을 준비하여 `public/sounds/` 디렉토리에 배치합니다.

#### 옵션 1: 사운드 파일 직접 준비

- `true-rhythm.mp3`: 정답 사운드 (경쾌한 리듬)
- `false-rhythm.mp3`: 오답 사운드 (신중한 리듬)

#### 옵션 2: Web Audio API 사용 (기본)

사운드 파일이 없어도 Web Audio API를 통해 프로그래밍 방식으로 리듬이 생성됩니다.

### 8. 테스트

#### 8.1 데이터베이스 연결 테스트

브라우저에서 접속:
```
http://your-domain.com/truth-rhythm/api/test-db.php
```

테스트 파일 생성 (`api/test-db.php`):

```php
<?php
require_once 'config.php';
try {
    $pdo = getDbConnection();
    echo json_encode(['status' => 'success', 'message' => 'Database connected']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
```

#### 8.2 Moodle 연동 테스트

```
http://your-domain.com/truth-rhythm/api/moodle-connector.php?action=test
```

#### 8.3 애플리케이션 접속

```
http://your-domain.com/truth-rhythm/public/
```

## 문제 해결

### 데이터베이스 연결 오류

- `config.php`의 DB 설정 확인
- MySQL 서비스 상태 확인: `systemctl status mysql`
- 사용자 권한 확인

### CORS 오류

`config.php`에서 CORS 설정 확인:

```php
define('ALLOW_ORIGIN', 'http://your-domain.com');
```

### PHP 오류

PHP 로그 확인:

```bash
tail -f /var/log/php7.1-fpm.log
# 또는
tail -f /var/log/apache2/error.log
```

### Moodle 연동 오류

- Moodle 웹 서비스 활성화 확인
- 토큰 유효성 확인
- Moodle URL 및 엔드포인트 확인

## 프로덕션 배포

프로덕션 환경에서는 다음 사항을 반드시 적용하세요:

1. **HTTPS 설정**: Let's Encrypt 등을 사용한 SSL 인증서
2. **오류 숨김**: `php_flag display_errors Off`
3. **강력한 비밀번호**: 데이터베이스 및 Moodle 토큰
4. **정기 백업**: 데이터베이스 및 파일 백업
5. **로그 모니터링**: 정기적인 로그 확인

## 업데이트

새 버전으로 업데이트할 때:

1. 현재 파일 백업
2. 데이터베이스 백업
3. 새 파일로 교체 (config.php 제외)
4. 마이그레이션 스크립트 실행 (있는 경우)

```bash
# 백업
cp -r truth-rhythm truth-rhythm-backup-$(date +%Y%m%d)
mysqldump -u root -p truth_rhythm > truth_rhythm-backup-$(date +%Y%m%d).sql

# 업데이트
# ... 새 파일 복사 ...

# 설정 파일 복원
cp truth-rhythm-backup/api/config.php truth-rhythm/api/
```

## 지원

문제가 발생하면:

1. 로그 파일 확인 (`logs/app.log`)
2. 브라우저 콘솔 확인
3. GitHub Issues에 문의
