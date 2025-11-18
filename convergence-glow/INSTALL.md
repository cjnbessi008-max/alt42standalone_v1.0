# Convergence Glow 설치 가이드

## 시스템 요구사항

### 최소 요구사항
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 (Moodle 3.7 호환성)
- **MySQL**: 5.7+
- **Moodle**: 3.7+

### 권장 요구사항
- PHP 7.4 (더 나은 성능)
- MySQL 8.0 또는 MariaDB 10.3+
- 최소 2GB RAM
- SSL/TLS 인증서 (프로덕션 환경)

## 단계별 설치

### 1. 파일 다운로드 및 배치

```bash
# 프로젝트 클론 또는 다운로드
git clone https://github.com/your-repo/convergence-glow.git
cd convergence-glow

# 웹 서버 디렉토리로 이동 (예: Apache)
sudo cp -r convergence-glow /var/www/html/
cd /var/www/html/convergence-glow

# 권한 설정
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### 2. MySQL 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE convergence_glow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'convergence_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON convergence_glow.* TO 'convergence_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u convergence_user -p convergence_glow < database/schema.sql
```

### 3. PHP 설정

#### PHP 확장 모듈 확인
```bash
# 필요한 PHP 확장 설치
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring

# 확장 모듈 확인
php -m | grep -E 'pdo|mysql|curl|json|mbstring'
```

#### php.ini 설정
```ini
; /etc/php/7.1/apache2/php.ini 또는 /etc/php/7.1/fpm/php.ini

memory_limit = 128M
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
display_errors = Off  ; 프로덕션에서는 반드시 Off
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
date.timezone = Asia/Seoul
```

### 4. 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# 에디터로 .env 파일 편집
nano .env
```

`.env` 파일 내용:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=convergence_glow
DB_USER=convergence_user
DB_PASS=your_secure_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token

APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com/convergence-glow
```

### 5. Moodle 웹 서비스 설정

#### 5.1 웹 서비스 활성화
1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능** 이동
3. "웹 서비스 활성화" 체크박스 선택
4. 변경사항 저장

#### 5.2 웹 서비스 프로토콜 활성화
1. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
2. "REST 프로토콜" 활성화

#### 5.3 외부 서비스 생성
1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "외부 서비스 추가" 클릭
3. 다음 정보 입력:
   - 이름: Convergence Glow
   - 짧은 이름: convergence_glow
   - 활성화: 체크
4. 저장 후 "함수 추가" 클릭
5. 다음 함수 추가:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`
   - `core_question_get_random_question_summaries`

#### 5.4 사용자 및 토큰 생성
1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택 (또는 새 사용자 생성)
4. 서비스: "Convergence Glow" 선택
5. 생성된 토큰을 복사하여 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 6. 웹 서버 설정

#### Apache 설정

`/etc/apache2/sites-available/convergence-glow.conf`:
```apache
<VirtualHost *:80>
    ServerName convergence-glow.yourdomain.com
    ServerAlias www.convergence-glow.yourdomain.com

    DocumentRoot /var/www/html/convergence-glow/public

    <Directory /var/www/html/convergence-glow/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /var/www/html/convergence-glow/api
    <Directory /var/www/html/convergence-glow/api>
        Options None
        AllowOverride None
        Require all granted

        <FilesMatch "\.php$">
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/convergence-glow-error.log
    CustomLog ${APACHE_LOG_DIR}/convergence-glow-access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite convergence-glow
sudo a2enmod rewrite headers expires deflate
sudo systemctl restart apache2
```

#### Nginx 설정

`/etc/nginx/sites-available/convergence-glow`:
```nginx
server {
    listen 80;
    server_name convergence-glow.yourdomain.com www.convergence-glow.yourdomain.com;

    root /var/www/html/convergence-glow/public;
    index index.html;

    access_log /var/log/nginx/convergence-glow-access.log;
    error_log /var/log/nginx/convergence-glow-error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /var/www/html/convergence-glow/api;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index sequence_api.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

활성화:
```bash
sudo ln -s /etc/nginx/sites-available/convergence-glow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL/TLS 설정 (프로덕션 권장)

#### Let's Encrypt 사용
```bash
sudo apt-get install certbot python3-certbot-apache  # Apache
# 또는
sudo apt-get install certbot python3-certbot-nginx   # Nginx

# 인증서 발급 및 자동 설정
sudo certbot --apache -d convergence-glow.yourdomain.com  # Apache
# 또는
sudo certbot --nginx -d convergence-glow.yourdomain.com   # Nginx

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 8. 테스트

#### 8.1 데이터베이스 연결 테스트
```bash
# test_db.php 생성
cat > /var/www/html/convergence-glow/test_db.php << 'EOF'
<?php
require_once 'api/config.php';
require_once 'api/db.php';

try {
    $db = Database::getInstance();
    echo "데이터베이스 연결 성공!\n";

    $result = $db->fetchAll("SELECT COUNT(*) as count FROM sequence_problems");
    echo "문제 수: " . $result[0]['count'] . "\n";
} catch (Exception $e) {
    echo "에러: " . $e->getMessage() . "\n";
}
EOF

php test_db.php
```

#### 8.2 API 테스트
```bash
# 문제 조회 테스트
curl http://localhost/convergence-glow/api/sequence_api.php/problem?quiz_id=1

# 세션 생성 테스트
curl -X POST http://localhost/convergence-glow/api/sequence_api.php/session \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "quiz_id": 1}'
```

#### 8.3 웹 인터페이스 테스트
브라우저에서 열기:
```
http://localhost/convergence-glow/?quiz_id=1&user_id=1
```

## 문제 해결

### 일반적인 문제

#### "데이터베이스 연결 실패"
- MySQL 서비스 상태 확인: `sudo systemctl status mysql`
- `.env` 파일의 DB 설정 확인
- MySQL 사용자 권한 확인

#### "Permission denied" 에러
```bash
sudo chown -R www-data:www-data /var/www/html/convergence-glow
sudo chmod -R 755 /var/www/html/convergence-glow
```

#### PHP 에러 표시
개발 환경에서만:
```php
// api/config.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

#### Moodle API 연결 실패
- Moodle 웹 서비스가 활성화되었는지 확인
- 토큰이 올바른지 확인
- Moodle 방화벽/CORS 설정 확인

### 로그 확인

```bash
# Apache 에러 로그
sudo tail -f /var/log/apache2/convergence-glow-error.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/convergence-glow-error.log

# PHP 에러 로그
sudo tail -f /var/log/php7.1-fpm.log

# MySQL 에러 로그
sudo tail -f /var/log/mysql/error.log
```

## 유지보수

### 백업

```bash
# 데이터베이스 백업
mysqldump -u convergence_user -p convergence_glow > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf convergence-glow_$(date +%Y%m%d).tar.gz /var/www/html/convergence-glow
```

### 업데이트

```bash
# 백업 후
cd /var/www/html/convergence-glow
git pull origin main
# 또는 새 파일 복사

# 데이터베이스 마이그레이션 (필요시)
mysql -u convergence_user -p convergence_glow < database/migrations/update_xxx.sql
```

## 다음 단계

설치가 완료되었습니다! 이제 다음을 진행할 수 있습니다:

1. Moodle에 퀴즈 및 문제 생성
2. `sequence_problems` 테이블에 문제 데이터 입력
3. 학생들에게 앱 URL 공유
4. 학습 데이터 분석 및 모니터링

자세한 사용법은 `README.md`를 참조하세요.
