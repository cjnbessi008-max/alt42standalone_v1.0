# Factor Lego 설치 가이드

이 가이드는 Factor Lego 앱을 처음부터 설치하는 과정을 상세히 설명합니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [환경 준비](#환경-준비)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 설정](#애플리케이션-설정)
5. [웹 서버 설정](#웹-서버-설정)
6. [Moodle 연동](#moodle-연동)
7. [테스트](#테스트)
8. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 요구사항

- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server 2016+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7 (기존 설치 필요)

### 권장 사양

- **CPU**: 2 코어 이상
- **RAM**: 4GB 이상
- **디스크**: 10GB 이상 여유 공간

## 환경 준비

### Ubuntu/Debian

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# PHP 및 필요한 확장 설치
sudo apt install -y php7.1 php7.1-fpm php7.1-mysql php7.1-mbstring \
    php7.1-xml php7.1-curl php7.1-json php7.1-zip

# MySQL 설치
sudo apt install -y mysql-server-5.7

# 웹 서버 설치 (Apache 예시)
sudo apt install -y apache2

# 또는 Nginx
sudo apt install -y nginx
```

### CentOS/RHEL

```bash
# EPEL 리포지토리 추가
sudo yum install -y epel-release

# Remi 리포지토리 추가 (PHP 7.1)
sudo yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
sudo yum-config-manager --enable remi-php71

# PHP 설치
sudo yum install -y php php-fpm php-mysqlnd php-mbstring \
    php-xml php-curl php-json php-zip

# MySQL 설치
sudo yum install -y mysql-server

# 웹 서버 설치
sudo yum install -y httpd
```

## 데이터베이스 설정

### 1. MySQL 보안 설정

```bash
sudo mysql_secure_installation
```

다음 질문에 답변:
- Set root password: **Yes** (강력한 비밀번호 설정)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

### 2. Factor Lego 데이터베이스 생성

MySQL에 로그인:

```bash
sudo mysql -u root -p
```

데이터베이스와 사용자 생성:

```sql
-- Factor Lego 데이터베이스 생성
CREATE DATABASE factor_lego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Factor Lego 사용자 생성
CREATE USER 'factor_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON factor_lego.* TO 'factor_user'@'localhost';

-- 변경사항 적용
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 3. 스키마 적용

```bash
# Factor Lego 디렉토리로 이동
cd /path/to/factor-lego

# 스키마 파일 적용
mysql -u factor_user -p factor_lego < database/schema.sql
```

비밀번호 입력 후 스키마가 적용됩니다.

### 4. 데이터베이스 확인

```bash
mysql -u factor_user -p factor_lego
```

```sql
-- 테이블 확인
SHOW TABLES;

-- 샘플 데이터 확인
SELECT * FROM factor_problems LIMIT 5;

-- 종료
EXIT;
```

## 애플리케이션 설정

### 1. 파일 다운로드 및 배치

```bash
# 웹 루트로 이동 (Apache)
cd /var/www/html

# 또는 Nginx
cd /usr/share/nginx/html

# Factor Lego 파일 복사
sudo cp -r /path/to/factor-lego ./factor-lego

# 소유권 설정
sudo chown -R www-data:www-data factor-lego  # Apache/Ubuntu
# 또는
sudo chown -R nginx:nginx factor-lego         # Nginx
# 또는
sudo chown -R apache:apache factor-lego       # Apache/CentOS
```

### 2. 설정 파일 수정

`factor-lego/moodle-integration/config.php` 파일 편집:

```bash
sudo nano factor-lego/moodle-integration/config.php
```

다음 항목을 환경에 맞게 수정:

```php
// Moodle 데이터베이스 정보
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'your_moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');

// Factor Lego 데이터베이스 정보
define('FACTOR_DB_HOST', 'localhost');
define('FACTOR_DB_NAME', 'factor_lego');
define('FACTOR_DB_USER', 'factor_user');
define('FACTOR_DB_PASS', 'StrongPassword123!');

// 디버그 모드 (프로덕션에서는 false로 설정)
define('DEBUG_MODE', false);
```

### 3. 권한 설정

```bash
# 읽기 권한 설정
sudo chmod 755 factor-lego
sudo chmod 644 factor-lego/moodle-integration/config.php

# API 디렉토리 실행 권한
sudo chmod 755 factor-lego/api
```

## 웹 서버 설정

### Apache 설정

#### 1. Virtual Host 생성

```bash
sudo nano /etc/apache2/sites-available/factor-lego.conf
```

다음 내용 추가:

```apache
<VirtualHost *:80>
    ServerName factor-lego.yourdomain.com
    ServerAlias www.factor-lego.yourdomain.com

    DocumentRoot /var/www/html/factor-lego

    <Directory /var/www/html/factor-lego>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 설정
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    # CORS 헤더
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

    ErrorLog ${APACHE_LOG_DIR}/factor-lego-error.log
    CustomLog ${APACHE_LOG_DIR}/factor-lego-access.log combined
</VirtualHost>
```

#### 2. 사이트 활성화

```bash
# 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod proxy_fcgi

# 사이트 활성화
sudo a2ensite factor-lego

# Apache 재시작
sudo systemctl restart apache2
```

### Nginx 설정

#### 1. Server Block 생성

```bash
sudo nano /etc/nginx/sites-available/factor-lego
```

다음 내용 추가:

```nginx
server {
    listen 80;
    server_name factor-lego.yourdomain.com www.factor-lego.yourdomain.com;

    root /usr/share/nginx/html/factor-lego;
    index index.html index.php;

    # 로그 설정
    access_log /var/log/nginx/factor-lego-access.log;
    error_log /var/log/nginx/factor-lego-error.log;

    # CORS 설정
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 캐시 비활성화
    location /api/ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

#### 2. 사이트 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/factor-lego /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

## Moodle 연동

### 방법 1: External Tool (LTI) 설정

#### 1. External Tool 모듈 활성화

Moodle 관리자로 로그인:
1. Site administration → Plugins → Activity modules → Manage activities
2. External tool이 활성화되어 있는지 확인

#### 2. External Tool 추가

1. Site administration → Plugins → Activity modules → External tool → Manage tools
2. "Configure a tool manually" 클릭
3. 다음 정보 입력:
   - **Tool name**: Factor Lego
   - **Tool URL**: `http://factor-lego.yourdomain.com/views/index.html`
   - **Tool description**: 인수분해 레고 학습 앱
   - **Launch container**: New window
   - **Privacy**: Share launcher's name, email
4. "Save changes" 클릭

#### 3. 코스에 활동 추가

1. 원하는 코스로 이동
2. "Add an activity or resource" 클릭
3. "External tool" 선택
4. Factor Lego 선택
5. 설정 저장

### 방법 2: iframe 삽입

#### 1. HTML 편집 모드 활성화

Moodle 페이지 편집 시:
1. "Edit" → "Edit settings"
2. Page content에서 HTML 모드 선택 (</> 아이콘)

#### 2. iframe 코드 추가

```html
<div class="factor-lego-container">
    <iframe
        src="http://factor-lego.yourdomain.com/views/index.html?problem_id=1&student_id={{student_id}}"
        width="100%"
        height="800px"
        frameborder="0"
        allow="fullscreen"
        style="border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    </iframe>
</div>
```

#### 3. Moodle 필터 설정

1. Site administration → Plugins → Filters → Manage filters
2. "Display H5P" 필터가 활성화되어 있는지 확인

## 테스트

### 1. 데이터베이스 연결 테스트

```bash
# 테스트 PHP 스크립트 생성
sudo nano /var/www/html/factor-lego/test-db.php
```

다음 코드 입력:

```php
<?php
require_once 'moodle-integration/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . FACTOR_DB_HOST . ";dbname=" . FACTOR_DB_NAME,
        FACTOR_DB_USER,
        FACTOR_DB_PASS
    );
    echo "✅ 데이터베이스 연결 성공!<br>";

    $stmt = $pdo->query("SELECT COUNT(*) as count FROM factor_problems");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "문제 개수: " . $result['count'];
} catch (PDOException $e) {
    echo "❌ 연결 실패: " . $e->getMessage();
}
?>
```

브라우저에서 접속: `http://factor-lego.yourdomain.com/test-db.php`

### 2. API 테스트

```bash
# curl로 API 테스트
curl http://factor-lego.yourdomain.com/api/problem_api.php?problem_id=1
```

정상 응답 예시:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "expression": "x^2 + 5x + 6",
    ...
  }
}
```

### 3. 프론트엔드 테스트

브라우저에서 접속:
```
http://factor-lego.yourdomain.com/views/index.html?problem_id=1&student_id=1
```

확인 사항:
- ✅ 가상 스마트폰 UI가 표시되는가?
- ✅ 문제가 정상적으로 로드되는가?
- ✅ 레고 조각을 드래그할 수 있는가?
- ✅ 제출 버튼이 작동하는가?
- ✅ 힌트 버튼이 작동하는가?

## 문제 해결

### 문제 1: 데이터베이스 연결 실패

**증상**: "Connection refused" 또는 "Access denied" 오류

**해결 방법**:
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 사용자 권한 확인
sudo mysql -u root -p
```

```sql
SHOW GRANTS FOR 'factor_user'@'localhost';
-- 권한이 없으면 다시 부여
GRANT ALL PRIVILEGES ON factor_lego.* TO 'factor_user'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 2: PHP 파일이 다운로드됨 (실행되지 않음)

**증상**: `.php` 파일 클릭 시 다운로드됨

**해결 방법** (Apache):
```bash
# PHP 모듈 확인
php -m

# PHP-FPM 재시작
sudo systemctl restart php7.1-fpm

# Apache 설정 확인
apache2ctl -t

# Apache 재시작
sudo systemctl restart apache2
```

**해결 방법** (Nginx):
```bash
# PHP-FPM 확인
sudo systemctl status php7.1-fpm

# Nginx 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl restart php7.1-fpm nginx
```

### 문제 3: CORS 오류

**증상**: 브라우저 콘솔에 "CORS policy" 오류

**해결 방법**:

`factor-lego/api/.htaccess` 파일 생성 (Apache):
```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

Nginx는 위의 설정에서 `add_header` 지시어 확인

### 문제 4: Moodle에서 iframe이 표시되지 않음

**증상**: iframe 영역이 비어있음

**해결 방법**:
1. Moodle 필터 설정 확인
2. 브라우저 콘솔에서 오류 확인
3. Moodle의 `$CFG->wwwroot` 설정 확인
4. iframe의 `src` URL이 올바른지 확인

### 문제 5: 권한 오류

**증상**: "Permission denied" 오류

**해결 방법**:
```bash
# 소유권 재설정
sudo chown -R www-data:www-data /var/www/html/factor-lego

# 권한 재설정
sudo chmod -R 755 /var/www/html/factor-lego
sudo chmod 644 /var/www/html/factor-lego/moodle-integration/config.php

# SELinux 비활성화 (CentOS의 경우)
sudo setenforce 0
```

## 프로덕션 체크리스트

배포 전 확인사항:

- [ ] `DEBUG_MODE`를 `false`로 설정
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] HTTPS 설정 (Let's Encrypt 등)
- [ ] 방화벽 설정
- [ ] 정기 백업 설정
- [ ] 로그 모니터링 설정
- [ ] 성능 최적화 (캐싱, 압축 등)

## SSL/HTTPS 설정 (선택사항)

### Let's Encrypt 사용

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-apache

# SSL 인증서 발급 (Apache)
sudo certbot --apache -d factor-lego.yourdomain.com

# 또는 Nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d factor-lego.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

## 완료!

설치가 완료되었습니다. Factor Lego를 즐겁게 사용하세요!

추가 지원이 필요하면 문서를 참조하거나 이슈를 등록해주세요.
