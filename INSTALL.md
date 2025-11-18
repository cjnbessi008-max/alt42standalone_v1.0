# 설치 가이드 - Inverse Reflection Module

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx
- **Moodle**: 3.7 이상 (연동 시)

### 권장 사양
- PHP Memory Limit: 128MB 이상
- PHP Max Execution Time: 300초
- 디스크 공간: 50MB 이상

## 설치 단계

### 1. 파일 다운로드 및 배포

```bash
# 프로젝트를 웹 서버 디렉토리로 복사
sudo cp -r alt42standalone_v1.0 /var/www/html/

# 권한 설정
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0
sudo chmod -R 755 /var/www/html/alt42standalone_v1.0
```

### 2. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성 (이미 Moodle DB가 있다면 사용)
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 스키마 적용
USE moodle;
SOURCE /var/www/html/alt42standalone_v1.0/database/schema.sql;

EXIT;
```

#### 직접 명령어로 실행

```bash
mysql -u root -p moodle < /var/www/html/alt42standalone_v1.0/database/schema.sql
```

### 3. 데이터베이스 설정 파일 수정

`config/database.php` 파일을 편집하세요:

```bash
nano /var/www/html/alt42standalone_v1.0/config/database.php
```

다음 값들을 실제 환경에 맞게 수정:

```php
define('DB_HOST', 'localhost');          // DB 호스트
define('DB_NAME', 'moodle');             // DB 이름
define('DB_USER', 'moodle_user');        // DB 사용자
define('DB_PASS', 'your_secure_password'); // DB 비밀번호
```

### 4. Apache 설정 (Apache 사용 시)

#### 가상 호스트 설정

```bash
sudo nano /etc/apache2/sites-available/inverse-reflection.conf
```

다음 내용 추가:

```apache
<VirtualHost *:80>
    ServerName inverse-reflection.yourdomain.com
    DocumentRoot /var/www/html/alt42standalone_v1.0

    <Directory /var/www/html/alt42standalone_v1.0>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/inverse-reflection-error.log
    CustomLog ${APACHE_LOG_DIR}/inverse-reflection-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite inverse-reflection.conf
sudo a2enmod rewrite headers expires deflate
sudo systemctl restart apache2
```

### 5. Nginx 설정 (Nginx 사용 시)

```bash
sudo nano /etc/nginx/sites-available/inverse-reflection
```

```nginx
server {
    listen 80;
    server_name inverse-reflection.yourdomain.com;
    root /var/www/html/alt42standalone_v1.0;
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

    location ~* \.(jpg|jpeg|png|gif|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/inverse-reflection /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. PHP 설정 확인

```bash
php -v  # PHP 버전 확인
php -m  # 설치된 모듈 확인
```

필요한 PHP 확장 모듈:
- PDO
- pdo_mysql
- json
- mbstring

설치되지 않은 경우:

```bash
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json
sudo systemctl restart apache2  # 또는 nginx
```

### 7. 테스트

브라우저에서 접속:

```
http://your-server/alt42standalone_v1.0/frontend/index.html
```

또는

```
http://inverse-reflection.yourdomain.com/frontend/index.html
```

정상적으로 표시되면 설치 완료!

## Moodle 연동 설정

### 1. Moodle 활동 생성

1. Moodle 관리자로 로그인
2. 코스에서 "활동 추가" → "외부 도구(External Tool)" 선택
3. 다음 정보 입력:
   - **활동 이름**: 역함수 시각화
   - **도구 URL**: `http://your-server/alt42standalone_v1.0/frontend/index.html`

### 2. iframe으로 삽입 (권장)

Moodle 페이지 또는 레이블에 다음 HTML 코드 삽입:

```html
<iframe
    src="http://your-server/alt42standalone_v1.0/frontend/index.html?question_id=1&student_id=$USER->id"
    width="100%"
    height="850px"
    frameborder="0"
    style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
</iframe>
```

**Moodle 변수 사용:**
- `$USER->id`: 현재 로그인한 사용자 ID
- `$COURSE->id`: 현재 코스 ID

### 3. SSO 연동 (선택사항)

Moodle 세션을 검증하려면 `backend/moodle_integration.php`의 `verifyMoodleSession()` 함수를 구현하세요.

## 문제 데이터 추가

### SQL로 직접 추가

```sql
INSERT INTO inverse_reflection_problems
    (moodle_question_id, function_type, original_function, inverse_function,
     domain_min, domain_max, difficulty_level, hints)
VALUES
    (101, 'quadratic', 'x^2', 'sqrt(x)',
     0, 10, 'medium',
     '["제곱근을 이용하세요", "정의역에 주의하세요"]');

-- 시각화 설정 추가
INSERT INTO visualization_settings (problem_id, show_grid, show_reflection_line)
VALUES (LAST_INSERT_ID(), TRUE, TRUE);
```

### PHP API로 추가 (향후 구현)

관리자 페이지를 통해 문제를 추가할 수 있도록 확장 가능합니다.

## 보안 체크리스트

- [ ] 데이터베이스 비밀번호 변경
- [ ] CORS 설정을 특정 도메인으로 제한
- [ ] HTTPS 설정 (Let's Encrypt 권장)
- [ ] 파일 권한 확인 (755 for directories, 644 for files)
- [ ] config 파일 외부 접근 차단 확인
- [ ] SQL Injection 방어 확인 (PDO prepared statements)
- [ ] XSS 방어 확인 (입력 검증)

## 성능 최적화

### 1. PHP OPcache 활성화

```bash
sudo nano /etc/php/7.1/apache2/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

### 2. MySQL 튜닝

```sql
-- 인덱스 확인
SHOW INDEX FROM inverse_reflection_problems;
SHOW INDEX FROM student_attempts;

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM student_attempts WHERE student_id = 123;
```

### 3. 브라우저 캐싱

`.htaccess` 파일이 이미 캐싱 설정을 포함하고 있습니다.

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 상태 확인
sudo systemctl status mysql

# 로그 확인
sudo tail -f /var/log/mysql/error.log
```

### PHP 오류

```bash
# Apache 오류 로그
sudo tail -f /var/log/apache2/error.log

# PHP 오류 표시 활성화 (개발 환경에서만)
sudo nano /etc/php/7.1/apache2/php.ini
# display_errors = On
```

### 권한 문제

```bash
# 모든 파일 권한 재설정
sudo chown -R www-data:www-data /var/www/html/alt42standalone_v1.0
sudo find /var/www/html/alt42standalone_v1.0 -type d -exec chmod 755 {} \;
sudo find /var/www/html/alt42standalone_v1.0 -type f -exec chmod 644 {} \;
```

## 업데이트

새 버전으로 업데이트:

```bash
# 백업
sudo cp -r /var/www/html/alt42standalone_v1.0 /var/www/html/alt42standalone_v1.0.backup

# 새 파일로 교체 (config는 보존)
sudo cp config/database.php config/database.php.backup
# ... 새 파일 복사 ...
sudo cp config/database.php.backup config/database.php

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u moodle_user -p moodle < database/migrations/001_update.sql
```

## 지원

문제가 발생하면:
1. 로그 파일 확인
2. 브라우저 콘솔 확인 (F12)
3. PHP 버전 및 모듈 확인
4. 데이터베이스 연결 확인

추가 도움이 필요하면 이슈를 등록해주세요.
