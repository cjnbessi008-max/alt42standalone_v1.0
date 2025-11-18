# 설치 가이드 - Critical Point Highlight

## 빠른 설치 (Quick Start)

### 1단계: 필수 요구사항 확인

```bash
# PHP 버전 확인
php -v
# PHP 7.1.9 이상이어야 합니다

# MySQL 버전 확인
mysql --version
# MySQL 5.7 이상이어야 합니다
```

### 2단계: 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# Moodle 데이터베이스가 이미 있다면 이 단계는 생략
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 권한 부여 (선택사항)
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
EXIT;
```

### 3단계: 스키마 설치

#### 방법 1: 자동 설치 (권장)

웹 브라우저에서:
```
http://your-domain/database/install.php
```

또는 커맨드 라인에서:
```bash
cd critical-point-app/database
php install.php
```

#### 방법 2: 수동 설치

```bash
mysql -u root -p moodle < database/schema.sql
```

### 4단계: API 설정

`api/config.php` 파일을 편집하여 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');           // 데이터베이스 호스트
define('DB_NAME', 'moodle');              // 데이터베이스 이름
define('DB_USER', 'moodle_user');         // 사용자 이름
define('DB_PASS', 'your_password_here');  // 비밀번호
```

### 5단계: 디렉토리 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 웹 서버 사용자에게 쓰기 권한 부여
chmod 755 logs
chown -R www-data:www-data logs  # Ubuntu/Debian
# 또는
chown -R apache:apache logs      # CentOS/RHEL
```

### 6단계: 웹 서버 설정

#### Apache 사용 시

1. 가상 호스트 설정 파일 생성: `/etc/apache2/sites-available/critical-point.conf`

```apache
<VirtualHost *:80>
    ServerName critical-point.local
    DocumentRoot /var/www/critical-point-app/public

    <Directory /var/www/critical-point-app/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /var/www/critical-point-app/api
    <Directory /var/www/critical-point-app/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/critical-point-error.log
    CustomLog ${APACHE_LOG_DIR}/critical-point-access.log combined
</VirtualHost>
```

2. 사이트 활성화

```bash
sudo a2ensite critical-point.conf
sudo a2enmod rewrite
sudo systemctl reload apache2
```

3. hosts 파일 수정 (로컬 테스트용)

```bash
sudo nano /etc/hosts

# 다음 줄 추가
127.0.0.1    critical-point.local
```

#### Nginx 사용 시

1. 설정 파일 생성: `/etc/nginx/sites-available/critical-point`

```nginx
server {
    listen 80;
    server_name critical-point.local;
    root /var/www/critical-point-app/public;
    index index.html;

    access_log /var/log/nginx/critical-point-access.log;
    error_log /var/log/nginx/critical-point-error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /var/www/critical-point-app/api;
        index index.php;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}
```

2. 사이트 활성화

```bash
sudo ln -s /etc/nginx/sites-available/critical-point /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7단계: 테스트

브라우저에서 다음 URL로 접속:

```
http://critical-point.local
```

또는

```
http://localhost/critical-point-app/public/
```

## Moodle 통합

### Moodle 플러그인으로 추가하기

1. Moodle 디렉토리로 이동

```bash
cd /path/to/moodle
```

2. 모듈 디렉토리에 복사

```bash
cp -r /path/to/critical-point-app mod/criticalpoint
```

3. Moodle 관리 페이지에서 플러그인 설치

```
Site administration > Notifications
```

4. 코스에 활동 추가

```
Turn editing on > Add an activity or resource > Critical Point Highlight
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PHP MySQL 확장 설치 확인
php -m | grep -i mysql

# 설치되지 않았다면
sudo apt-get install php7.1-mysql    # Ubuntu/Debian
sudo yum install php71-mysql         # CentOS/RHEL

# 웹 서버 재시작
sudo systemctl restart apache2
# 또는
sudo systemctl restart nginx
```

### 그래프가 표시되지 않는 경우

1. 브라우저 개발자 도구 (F12) 열기
2. Console 탭에서 JavaScript 오류 확인
3. Network 탭에서 리소스 로딩 확인

### API 403/404 오류

```bash
# Apache 모듈 확인
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl reload apache2

# .htaccess 파일 존재 확인
ls -la public/.htaccess
ls -la api/.htaccess
```

### 권한 오류

```bash
# 전체 프로젝트 권한 재설정
sudo chown -R www-data:www-data /var/www/critical-point-app
sudo find /var/www/critical-point-app -type d -exec chmod 755 {} \;
sudo find /var/www/critical-point-app -type f -exec chmod 644 {} \;
```

## 개발 환경 설정

### PHP 내장 서버로 빠른 테스트

```bash
cd critical-point-app/public
php -S localhost:8000

# 다른 터미널에서 API 서버도 실행
cd critical-point-app/api
php -S localhost:8001
```

그 다음 `assets/js/app.js`에서 API URL을 수정:

```javascript
const response = await fetch(`http://localhost:8001/getProblem.php?type=${functionType}`);
```

## 프로덕션 배포

### 보안 강화

1. `api/config.php`에서 디버그 모드 비활성화

```php
define('APP_DEBUG', false);
```

2. 데이터베이스 비밀번호 강화

3. HTTPS 설정 (Let's Encrypt 사용)

```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d critical-point.yourdomain.com
```

### 성능 최적화

1. PHP OPcache 활성화

```bash
sudo nano /etc/php/7.1/apache2/php.ini

# 다음 설정 추가/수정
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
```

2. Gzip 압축 활성화 (`.htaccess`에 이미 포함됨)

3. 브라우저 캐싱 활성화 (`.htaccess`에 이미 포함됨)

## 업데이트

새 버전으로 업데이트 시:

```bash
# 백업
mysqldump -u root -p moodle > backup_$(date +%Y%m%d).sql
cp -r critical-point-app critical-point-app.backup

# 업데이트
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u root -p moodle < database/migrations/update_v2.sql
```

## 지원

문제가 계속되면:
1. `logs/error.log` 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 이슈 트래커에 보고
