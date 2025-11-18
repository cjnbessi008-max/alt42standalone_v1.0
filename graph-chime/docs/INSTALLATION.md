# Graph Chime 설치 가이드

이 문서는 Graph Chime을 처음부터 설치하는 방법을 자세히 설명합니다.

## 목차
1. [사전 준비](#사전-준비)
2. [데이터베이스 설치](#데이터베이스-설치)
3. [웹 서버 설정](#웹-서버-설정)
4. [Moodle 연동 설정](#moodle-연동-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

## 사전 준비

### 필수 소프트웨어
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx 1.14 이상
- Moodle 3.7 (선택사항)

### PHP 확장 모듈
다음 PHP 확장 모듈이 필요합니다:
- `pdo_mysql`
- `curl`
- `json`
- `mbstring`

확인 방법:
```bash
php -m | grep -E 'pdo_mysql|curl|json|mbstring'
```

## 데이터베이스 설치

### 1. MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE graph_chime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항 - 보안을 위해 권장)
CREATE USER 'graphchime_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# 권한 부여
GRANT ALL PRIVILEGES ON graph_chime.* TO 'graphchime_user'@'localhost';
FLUSH PRIVILEGES;

# 종료
EXIT;
```

### 2. 스키마 적용

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/graph-chime

# 스키마 적용
mysql -u graphchime_user -p graph_chime < database/schema.sql
```

### 3. 데이터베이스 확인

```bash
mysql -u graphchime_user -p graph_chime

# 테이블 확인
SHOW TABLES;

# 예상 결과:
# +------------------------+
# | Tables_in_graph_chime  |
# +------------------------+
# | audio_settings         |
# | graph_problems         |
# | session_logs           |
# | student_responses      |
# +------------------------+

# 음향 설정 데이터 확인
SELECT * FROM audio_settings;
```

## 웹 서버 설정

### Apache 설정

#### 1. VirtualHost 설정 파일 생성

```bash
sudo nano /etc/apache2/sites-available/graph-chime.conf
```

#### 2. 다음 내용 입력

```apache
<VirtualHost *:80>
    ServerName graph-chime.local
    ServerAlias www.graph-chime.local

    DocumentRoot /var/www/graph-chime/frontend

    <Directory /var/www/graph-chime/frontend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /var/www/graph-chime/backend
    <Directory /var/www/graph-chime/backend>
        Options -Indexes
        AllowOverride All
        Require all granted

        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteRule ^(.*)$ api.php/$1 [QSA,L]
        </IfModule>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/graph-chime-error.log
    CustomLog ${APACHE_LOG_DIR}/graph-chime-access.log combined
</VirtualHost>
```

#### 3. 사이트 활성화

```bash
# 필요한 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers

# 사이트 활성화
sudo a2ensite graph-chime.conf

# Apache 재시작
sudo systemctl restart apache2
```

#### 4. hosts 파일 수정 (로컬 개발용)

```bash
sudo nano /etc/hosts

# 다음 줄 추가
127.0.0.1   graph-chime.local
```

### Nginx 설정

#### 1. 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/graph-chime
```

#### 2. 다음 내용 입력

```nginx
server {
    listen 80;
    server_name graph-chime.local;
    root /var/www/graph-chime/frontend;
    index index.html index.htm;

    access_log /var/log/nginx/graph-chime-access.log;
    error_log /var/log/nginx/graph-chime-error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /var/www/graph-chime/backend;

        if (!-e $request_filename) {
            rewrite ^/api/(.*)$ /api/api.php/$1 last;
        }

        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index api.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/graph-chime /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## 애플리케이션 설정

### 1. 설정 파일 수정

```bash
cd /var/www/graph-chime
nano config/config.php
```

### 2. 데이터베이스 정보 입력

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'graph_chime');
define('DB_USER', 'graphchime_user');
define('DB_PASS', 'your_password_here');
```

### 3. 파일 권한 설정

```bash
# 소유자 설정
sudo chown -R www-data:www-data /var/www/graph-chime

# 권한 설정
sudo chmod -R 755 /var/www/graph-chime
sudo chmod 640 /var/www/graph-chime/config/config.php
```

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. **웹 서비스 사용** 체크박스 활성화
4. 저장

### 2. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**로 이동
2. **서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Graph Chime Service`
   - 단축 이름: `graphchime`
   - 활성화: 체크
4. 저장

### 3. 함수 추가

생성한 서비스의 **함수** 링크 클릭 후 다음 함수들 추가:
- `core_question_get_questions`
- `core_user_get_users_by_field`
- `mod_quiz_save_attempt`

### 4. 사용자 생성 및 토큰 발급

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**로 이동
2. **토큰 추가** 클릭
3. 사용자 선택 (또는 새 사용자 생성)
4. 서비스: `Graph Chime Service` 선택
5. 저장
6. 생성된 토큰 복사

### 5. config.php에 토큰 입력

```bash
nano /var/www/graph-chime/config/config.php
```

```php
// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_copied_token_here');
```

## 테스트

### 1. 기본 접속 테스트

웹 브라우저에서 `http://graph-chime.local` 접속

예상 결과:
- Graph Chime 메인 페이지 표시
- 좌측에 문제 영역
- 우측 하단에 가상 스마트폰 화면

### 2. API 테스트

```bash
# 문제 조회 테스트 (Moodle 문제 ID = 1)
curl "http://graph-chime.local/api/problem?moodle_question_id=1"
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "equation": "y = 2x + 3",
    ...
  }
}
```

### 3. 데이터베이스 연결 테스트

```bash
# PHP 스크립트로 테스트
cd /var/www/graph-chime
php -r "
require_once 'config/config.php';
require_once 'backend/Database.php';
try {
    \$db = Database::getInstance();
    echo 'Database connection successful!\n';
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . '\n';
}
"
```

### 4. 음향 재생 테스트

1. 브라우저에서 `http://graph-chime.local` 접속
2. Moodle 문제 ID 입력 (예: 1)
3. "문제 불러오기" 클릭
4. "🔊 듣기" 버튼들이 활성화되는지 확인
5. 각 버튼 클릭하여 소리 재생 확인

## 문제 해결

### PHP 오류 로그 확인

```bash
# Apache
sudo tail -f /var/log/apache2/graph-chime-error.log

# Nginx
sudo tail -f /var/log/nginx/graph-chime-error.log
```

### MySQL 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u graphchime_user -p -h localhost graph_chime
```

### 파일 권한 오류

```bash
# 모든 파일 권한 재설정
sudo chown -R www-data:www-data /var/www/graph-chime
sudo find /var/www/graph-chime -type d -exec chmod 755 {} \;
sudo find /var/www/graph-chime -type f -exec chmod 644 {} \;
```

### CORS 오류

개발 환경에서 CORS 오류가 발생하면 `config/config.php`에서:

```php
define('ALLOW_CORS', true);
define('ALLOWED_ORIGINS', ['http://localhost', 'http://127.0.0.1', 'http://graph-chime.local']);
```

## 프로덕션 배포시 주의사항

### 1. 디버그 모드 비활성화

```php
// config/config.php
define('APP_DEBUG', false);
```

### 2. HTTPS 사용

```apache
# Apache SSL 설정
<VirtualHost *:443>
    ServerName graph-chime.example.com

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # ... 나머지 설정
</VirtualHost>
```

### 3. 데이터베이스 백업 설정

```bash
# cron 작업으로 일일 백업
0 2 * * * mysqldump -u graphchime_user -p'password' graph_chime > /backup/graph_chime_$(date +\%Y\%m\%d).sql
```

## 도움말

추가 도움이 필요하면 README.md의 문제 해결 섹션을 참조하거나 이슈를 등록해주세요.
