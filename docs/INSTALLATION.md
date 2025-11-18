# Focus Light 설치 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [단계별 설치](#단계별-설치)
3. [웹 서버 설정](#웹-서버-설정)
4. [테스트](#테스트)
5. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 소프트웨어
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 권장 사양
- PHP 7.4 이상
- MySQL 8.0 이상
- 메모리: 최소 512MB
- 디스크 공간: 최소 100MB

## 단계별 설치

### 1. 파일 다운로드 및 배치

```bash
# 프로젝트를 웹 서버 디렉토리로 복사
sudo cp -r alt42standalone_v1.0 /var/www/html/focus-light
cd /var/www/html/focus-light

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/focus-light
sudo chmod -R 755 /var/www/html/focus-light
```

### 2. MySQL 데이터베이스 설정

#### Option A: 명령줄에서 설치

```bash
# MySQL 접속
mysql -u root -p

# 스키마 적용
mysql -u root -p < database/schema.sql
```

#### Option B: phpMyAdmin 사용

1. phpMyAdmin 접속 (http://localhost/phpmyadmin)
2. '새로 만들기' 클릭
3. 데이터베이스 이름: `focus_light_app`
4. 인코딩: `utf8mb4_unicode_ci`
5. '만들기' 클릭
6. '가져오기' 탭에서 `database/schema.sql` 업로드

#### Option C: GUI 도구 사용

MySQL Workbench, DBeaver 등을 사용하여:
1. 새 연결 생성
2. `database/schema.sql` 파일 열기
3. 실행 (Execute)

### 3. PHP 설정 파일 수정

```bash
# config.php 편집
nano api/config.php
```

다음 부분을 환경에 맞게 수정:

```php
define('DB_HOST', 'localhost');      // MySQL 호스트
define('DB_NAME', 'focus_light_app'); // 데이터베이스 이름
define('DB_USER', 'your_username');   // MySQL 사용자명
define('DB_PASS', 'your_password');   // MySQL 비밀번호
```

**보안 팁**: 프로덕션 환경에서는:
```php
error_reporting(0);
ini_set('display_errors', 0);
```

### 4. PHP 확장 모듈 확인

필요한 PHP 확장 모듈이 활성화되어 있는지 확인:

```bash
php -m | grep -E "pdo|pdo_mysql|json|mbstring"
```

없다면 설치:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json

# CentOS/RHEL
sudo yum install php71-mysqlnd php71-mbstring php71-json
```

## 웹 서버 설정

### Apache 설정

#### 방법 1: VirtualHost 설정 (권장)

```bash
# 설정 파일 생성
sudo nano /etc/apache2/sites-available/focus-light.conf
```

다음 내용 입력:

```apache
<VirtualHost *:80>
    ServerName focus-light.local
    ServerAdmin admin@focus-light.local
    DocumentRoot /var/www/html/focus-light/public

    <Directory /var/www/html/focus-light/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 설정
        php_value upload_max_filesize 10M
        php_value post_max_size 10M
    </Directory>

    # API 디렉토리
    Alias /api /var/www/html/focus-light/api
    <Directory /var/www/html/focus-light/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/focus-light-error.log
    CustomLog ${APACHE_LOG_DIR}/focus-light-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
# 사이트 활성화
sudo a2ensite focus-light.conf

# mod_rewrite 활성화 (필요시)
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

hosts 파일 수정:

```bash
sudo nano /etc/hosts

# 다음 줄 추가
127.0.0.1   focus-light.local
```

#### 방법 2: .htaccess 사용

public 디렉토리에 .htaccess 파일 생성:

```bash
nano public/.htaccess
```

```apache
# CORS 헤더
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
</IfModule>

# 디렉토리 인덱스 비활성화
Options -Indexes

# UTF-8 인코딩
AddDefaultCharset UTF-8

# 캐싱 설정
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

### Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/focus-light
```

```nginx
server {
    listen 80;
    server_name focus-light.local;
    root /var/www/html/focus-light/public;
    index index.html;

    # 로그 설정
    access_log /var/log/nginx/focus-light-access.log;
    error_log /var/log/nginx/focus-light-error.log;

    # 정적 파일
    location / {
        try_files $uri $uri/ =404;
    }

    # CSS/JS 캐싱
    location ~* \.(css|js|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 라우팅
    location /api {
        alias /var/www/html/focus-light/api;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # PHP 파일 직접 접근 차단
    location ~ \.php$ {
        return 404;
    }

    # 숨김 파일 접근 차단
    location ~ /\. {
        deny all;
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/focus-light /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 테스트

### 1. 데이터베이스 연결 테스트

```bash
# 테스트 스크립트 생성
cat > test-db.php << 'EOF'
<?php
require_once 'api/config.php';
try {
    $pdo = getDBConnection();
    echo "✅ 데이터베이스 연결 성공!\n";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM problems");
    $result = $stmt->fetch();
    echo "✅ 문제 수: " . $result['count'] . "개\n";
} catch (Exception $e) {
    echo "❌ 오류: " . $e->getMessage() . "\n";
}
EOF

php test-db.php
```

### 2. API 테스트

```bash
# 문제 목록 조회
curl http://localhost/api/problems.php

# 특정 문제 조회
curl http://localhost/api/problems.php?id=1

# 도형 조회
curl http://localhost/api/shapes.php?problem_id=1
```

### 3. 웹 브라우저 테스트

1. 브라우저에서 `http://localhost` 또는 `http://focus-light.local` 접속
2. 문제 목록이 표시되는지 확인
3. 문제를 클릭하여 도형이 표시되는지 확인
4. Focus Light 효과가 작동하는지 확인

### 4. 브라우저 콘솔 확인

F12 키를 눌러 개발자 도구 열기:
- Console 탭에서 JavaScript 에러 확인
- Network 탭에서 API 요청/응답 확인
- Elements 탭에서 SVG 렌더링 확인

## 문제 해결

### 문제 1: "Database connection failed"

**원인**: 데이터베이스 연결 정보 오류

**해결**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 데이터베이스 존재 확인
mysql -u root -p -e "SHOW DATABASES LIKE 'focus_light_app';"

# 사용자 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'your_username'@'localhost';"
```

### 문제 2: API 응답이 없음 (404 오류)

**원인**: 웹 서버 설정 오류

**해결**:
```bash
# Apache의 경우
sudo a2enmod rewrite
sudo systemctl restart apache2

# Nginx의 경우
sudo nginx -t
sudo systemctl restart nginx

# 파일 권한 확인
ls -la api/
```

### 문제 3: 도형이 표시되지 않음

**원인**: JavaScript 에러 또는 SVG 데이터 오류

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. SVG 데이터 검증:
```sql
SELECT id, shape_type, svg_data FROM shapes LIMIT 1;
```

### 문제 4: Focus Light 효과가 작동하지 않음

**원인**: CSS 파일 로드 실패 또는 선택자 불일치

**해결**:
1. CSS 파일 로드 확인:
```bash
curl http://localhost/css/focus-light.css
```

2. 선택자 확인:
```sql
SELECT element_selector FROM focus_elements;
```

### 문제 5: CORS 오류

**원인**: API와 프론트엔드가 다른 도메인

**해결**:
`api/config.php`에서:
```php
header('Access-Control-Allow-Origin: *');
```

또는 특정 도메인만 허용:
```php
header('Access-Control-Allow-Origin: http://your-domain.com');
```

### 문제 6: 느린 응답 속도

**해결**:
1. MySQL 쿼리 최적화:
```sql
EXPLAIN SELECT * FROM problems;
```

2. PHP Opcache 활성화:
```bash
sudo nano /etc/php/7.1/apache2/php.ini

# 다음 설정 추가
opcache.enable=1
opcache.memory_consumption=128
```

3. 서버 재시작:
```bash
sudo systemctl restart apache2
```

## 프로덕션 배포 체크리스트

- [ ] 에러 리포팅 비활성화 (`config.php`)
- [ ] 강력한 데이터베이스 비밀번호 설정
- [ ] HTTPS 활성화 (SSL 인증서)
- [ ] 파일 권한 최소화 (644 for files, 755 for dirs)
- [ ] 불필요한 파일 제거 (test-db.php 등)
- [ ] 데이터베이스 백업 설정
- [ ] 로그 모니터링 설정
- [ ] 방화벽 규칙 설정
- [ ] rate limiting 구현
- [ ] SQL injection 방어 확인

## 추가 리소스

- [PHP 공식 문서](https://www.php.net/docs.php)
- [MySQL 공식 문서](https://dev.mysql.com/doc/)
- [Apache 설정 가이드](https://httpd.apache.org/docs/)
- [Nginx 설정 가이드](https://nginx.org/en/docs/)

## 지원

설치 중 문제가 발생하면 다음 정보와 함께 이슈를 등록해 주세요:

- OS 및 버전
- PHP 버전 (`php -v`)
- MySQL 버전 (`mysql --version`)
- 웹 서버 종류 및 버전
- 에러 로그 내용
- 브라우저 콘솔 에러
