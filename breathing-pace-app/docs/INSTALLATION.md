# 설치 가이드 (Installation Guide)

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [단계별 설치](#단계별-설치)
3. [Moodle 설정](#moodle-설정)
4. [테스트](#테스트)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 서버 환경
- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 - 7.4 (Moodle 3.7 호환)
- **MySQL**: 5.7+ 또는 MariaDB 10.2+
- **디스크 공간**: 최소 100MB

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|mysqli|curl|json|mbstring'
```

필수 모듈:
- pdo_mysql
- mysqli
- curl
- json
- mbstring
- openssl

### Moodle 요구사항
- Moodle 3.7 이상
- Web Services 활성화
- REST 프로토콜 지원

## 단계별 설치

### 1. 파일 다운로드 및 배치

```bash
# 프로젝트 클론 또는 다운로드
cd /var/www/html
git clone <repository-url> breathing-pace-app

# 또는 압축 파일 해제
unzip breathing-pace-app.zip
cd breathing-pace-app
```

### 2. 디렉토리 구조 확인

```
breathing-pace-app/
├── public/              # 공개 웹 파일
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── src/
│   ├── api/            # API 엔드포인트
│   │   ├── moodle.php
│   │   └── database.php
│   ├── config/         # 설정 파일
│   │   └── config.php
│   └── utils/          # 유틸리티
├── database/           # 데이터베이스 스키마
│   └── schema.sql
├── docs/              # 문서
└── .htaccess          # Apache 설정
```

### 3. 데이터베이스 설정

#### MySQL 접속
```bash
mysql -u root -p
```

#### 데이터베이스 생성
```sql
-- 데이터베이스 및 사용자 생성
CREATE DATABASE breathing_pace_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'breathing_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON breathing_pace_db.* TO 'breathing_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 적용
```bash
mysql -u breathing_user -p breathing_pace_db < database/schema.sql
```

#### 설치 확인
```bash
mysql -u breathing_user -p breathing_pace_db -e "SHOW TABLES;"
```

예상 출력:
```
+----------------------------+
| Tables_in_breathing_pace_db|
+----------------------------+
| breathing_cycles           |
| breathing_sessions         |
| moodle_connections         |
| questions                  |
| system_logs                |
| user_statistics            |
| users                      |
+----------------------------+
```

### 4. PHP 설정 파일 구성

#### config.php 편집
```bash
nano src/config/config.php
```

```php
<?php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'breathing_pace_db');
define('DB_USER', 'breathing_user');
define('DB_PASS', 'strong_password_here');
define('DB_CHARSET', 'utf8mb4');

// Moodle 기본 설정 (선택사항)
define('MOODLE_URL', '');
define('MOODLE_TOKEN', '');

// 디버그 모드 (프로덕션에서는 false로 설정)
define('DEBUG_MODE', true);
?>
```

### 5. 파일 권한 설정

#### Linux/Unix
```bash
# 소유자 설정
sudo chown -R www-data:www-data /var/www/html/breathing-pace-app

# 권한 설정
sudo chmod -R 755 /var/www/html/breathing-pace-app
sudo chmod 644 /var/www/html/breathing-pace-app/src/config/config.php
```

#### 보안 강화
```bash
# 민감한 파일 보호
sudo chmod 600 /var/www/html/breathing-pace-app/src/config/config.php
```

### 6. 웹 서버 설정

#### Apache

**가상 호스트 설정** (`/etc/apache2/sites-available/breathing-pace.conf`):
```apache
<VirtualHost *:80>
    ServerName breathing.example.com
    DocumentRoot /var/www/html/breathing-pace-app/public

    <Directory /var/www/html/breathing-pace-app/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/html/breathing-pace-app/src>
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/breathing-pace-error.log
    CustomLog ${APACHE_LOG_DIR}/breathing-pace-access.log combined
</VirtualHost>
```

**활성화**:
```bash
sudo a2ensite breathing-pace
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

**서버 블록 설정** (`/etc/nginx/sites-available/breathing-pace`):
```nginx
server {
    listen 80;
    server_name breathing.example.com;
    root /var/www/html/breathing-pace-app/public;

    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /src/ {
        alias /var/www/html/breathing-pace-app/src/;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}
```

**활성화**:
```bash
sudo ln -s /etc/nginx/sites-available/breathing-pace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Moodle 설정

### 1. Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 고급 기능**
3. **Web services 활성화** 체크
4. 저장

### 2. REST 프로토콜 활성화

1. **사이트 관리 → 플러그인 → Web services → 프로토콜 관리**
2. **REST 프로토콜** 활성화

### 3. 외부 서비스 생성

1. **사이트 관리 → 플러그인 → Web services → 외부 서비스**
2. **커스텀 서비스 추가** 클릭
3. 설정:
   - 이름: "Breathing Pace API"
   - 약칭: "breathing_pace"
   - 활성화: 체크

### 4. 함수 추가

외부 서비스에 다음 함수들을 추가:
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_attempt_data`
- `core_course_get_courses`
- `core_user_get_users`

### 5. 토큰 생성

1. **사이트 관리 → 플러그인 → Web services → 토큰 관리**
2. **토큰 추가** 클릭
3. 설정:
   - 사용자: 적절한 사용자 선택
   - 서비스: "Breathing Pace API"
4. **저장** 클릭
5. 생성된 토큰을 복사하여 안전하게 보관

### 6. 권한 설정

선택한 사용자가 다음 권한을 가지고 있는지 확인:
- `webservice/rest:use`
- `mod/quiz:view`
- `mod/quiz:attempt`

## 테스트

### 1. 데이터베이스 연결 테스트

`test_db.php` 생성:
```php
<?php
require_once 'src/config/config.php';
require_once 'src/api/database.php';

try {
    $db = Database::getInstance();
    echo "✓ 데이터베이스 연결 성공!\n";

    $stats = $db->getDifficultyStats();
    echo "✓ 쿼리 실행 성공!\n";
} catch (Exception $e) {
    echo "✗ 오류: " . $e->getMessage() . "\n";
}
?>
```

실행:
```bash
php test_db.php
```

### 2. Moodle API 테스트

브라우저에서 접속:
```
http://your-server/breathing-pace-app/public/index.html
```

Moodle 연결 설정에 다음 정보 입력:
- **Moodle URL**: `https://your-moodle.com`
- **API Token**: `생성한_토큰`
- **퀴즈 ID**: `테스트_퀴즈_ID`

### 3. 호흡 애니메이션 테스트

1. 연결 성공 후 "호흡 가이드 시작" 클릭
2. 호흡 원(circle)이 확대/축소되는지 확인
3. 사이클 카운터가 증가하는지 확인
4. 일시정지/중지 버튼 동작 확인

## 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결방법**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 사용자 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'breathing_user'@'localhost';"
```

### Moodle API 연결 실패

**증상**: "Failed to connect to Moodle"

**해결방법**:
1. Moodle URL이 올바른지 확인 (https:// 포함)
2. 토큰이 유효한지 확인
3. Web Services가 활성화되어 있는지 확인
4. 방화벽 설정 확인:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### PHP 오류

**증상**: 500 Internal Server Error

**해결방법**:
```bash
# PHP 오류 로그 확인
sudo tail -f /var/log/apache2/error.log

# 또는 Nginx의 경우
sudo tail -f /var/log/nginx/error.log

# PHP 설정 확인
php -i | grep error_log
```

### 파일 권한 오류

**증상**: Permission denied

**해결방법**:
```bash
# 올바른 권한 재설정
sudo chown -R www-data:www-data /var/www/html/breathing-pace-app
sudo chmod -R 755 /var/www/html/breathing-pace-app
```

### CORS 오류

**증상**: "Access-Control-Allow-Origin" 오류

**해결방법**:

Apache `.htaccess`에 추가:
```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>
```

## 프로덕션 배포 체크리스트

- [ ] DEBUG_MODE를 false로 설정
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] HTTPS 설정 (SSL/TLS 인증서)
- [ ] 정기 백업 설정
- [ ] 보안 업데이트 적용
- [ ] 로그 모니터링 설정
- [ ] 성능 모니터링 설정
- [ ] 방화벽 규칙 설정

## 추가 리소스

- [Moodle Web Services 문서](https://docs.moodle.org/dev/Web_services)
- [PHP PDO 문서](https://www.php.net/manual/en/book.pdo.php)
- [Apache 가상 호스트](https://httpd.apache.org/docs/2.4/vhosts/)
- [Nginx 서버 블록](https://nginx.org/en/docs/http/ngx_http_core_module.html#server)

---

설치 과정에서 문제가 발생하면 GitHub Issues에 등록해주세요.
