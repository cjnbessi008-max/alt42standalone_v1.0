# Wave Minus 설치 가이드

이 가이드는 Wave Minus 애플리케이션을 Moodle 3.7 환경에 설치하는 단계별 절차를 설명합니다.

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **Moodle**: 3.7 (선택사항)

### 권장 환경
- PHP 메모리 제한: 128MB 이상
- MySQL max_allowed_packet: 16MB 이상
- 디스크 공간: 50MB 이상

## 설치 단계

### 1. 파일 다운로드 및 배포

```bash
# 파일 복사
cd /var/www/html  # 또는 웹 서버의 document root
cp -r /path/to/wave-minus-app ./

# 권한 설정
chown -R www-data:www-data wave-minus-app
chmod 755 wave-minus-app
```

### 2. 데이터베이스 설정

#### 2.1 MySQL 데이터베이스 접속

```bash
mysql -u root -p
```

#### 2.2 SQL 스크립트 실행

```sql
-- Moodle 데이터베이스 사용
USE moodle;

-- Wave Minus 테이블 생성
SOURCE /var/www/html/wave-minus-app/install.sql;
```

또는 명령줄에서:

```bash
mysql -u moodle_user -p moodle < wave-minus-app/install.sql
```

#### 2.3 설치 확인

```sql
-- 테이블 확인
SHOW TABLES LIKE 'mdl_waveminus%';

-- 샘플 문제 확인
SELECT * FROM mdl_waveminus_problems;
```

### 3. PHP 설정

#### 3.1 데이터베이스 연결 정보 수정

`wave-minus-app/php/config.php` 파일을 편집:

```php
define('DB_HOST', 'localhost');        // 데이터베이스 호스트
define('DB_NAME', 'moodle');           // 데이터베이스 이름
define('DB_USER', 'moodle_user');      // 데이터베이스 사용자
define('DB_PASS', 'your_password');    // 데이터베이스 비밀번호
```

#### 3.2 로그 디렉토리 생성

```bash
mkdir -p wave-minus-app/logs
chmod 755 wave-minus-app/logs
chown www-data:www-data wave-minus-app/logs
```

### 4. 웹 서버 설정

#### 4.1 Apache 설정

`.htaccess` 파일 생성 (wave-minus-app/.htaccess):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /wave-minus-app/

    # API 라우팅
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ php/$1.php [L,QSA]

    # CORS 허용
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# 디렉토리 인덱스 비활성화
Options -Indexes

# PHP 설정
<IfModule mod_php7.c>
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value memory_limit 128M
</IfModule>
```

Apache 모듈 활성화:

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

#### 4.2 Nginx 설정

Nginx 가상 호스트 설정 (`/etc/nginx/sites-available/wave-minus`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html index.php;

    # Wave Minus 애플리케이션
    location /wave-minus-app/ {
        try_files $uri $uri/ /wave-minus-app/index.html;

        # CORS 헤더
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 로그 디렉토리 접근 차단
    location ~ /logs/ {
        deny all;
        return 403;
    }
}
```

설정 활성화 및 재시작:

```bash
sudo ln -s /etc/nginx/sites-available/wave-minus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. PHP 확장 모듈 확인

필요한 PHP 확장 모듈이 설치되어 있는지 확인:

```bash
php -m | grep -E 'pdo|pdo_mysql|json|mbstring'
```

없으면 설치:

```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql php7.1-json php7.1-mbstring

# CentOS/RHEL
sudo yum install php71-mysql php71-json php71-mbstring

# PHP-FPM 재시작
sudo systemctl restart php7.1-fpm
```

### 6. 테스트

#### 6.1 웹 브라우저 테스트

브라우저에서 다음 URL에 접속:

```
http://your-domain.com/wave-minus-app/
```

#### 6.2 데모 페이지 테스트

```
http://your-domain.com/wave-minus-app/demo.html
```

#### 6.3 API 테스트

```bash
# 문제 조회 테스트
curl "http://your-domain.com/wave-minus-app/php/get_problem.php?problemId=1&userId=1"

# 답안 제출 테스트
curl -X POST http://your-domain.com/wave-minus-app/php/submit_answer.php \
  -H "Content-Type: application/json" \
  -d '{"problemId":1,"userId":1,"answer":[1,2,3]}'
```

### 7. Moodle 통합 (선택사항)

#### 7.1 Moodle 플러그인 디렉토리에 배포

```bash
# Moodle 플러그인 디렉토리로 복사
cp -r wave-minus-app /path/to/moodle/local/waveminus

# Moodle 관리자 페이지에서 플러그인 설치
# http://your-moodle.com/admin/index.php
```

#### 7.2 Moodle 문제 유형 추가

Moodle 관리자 계정으로 로그인 후:

1. **사이트 관리 → 플러그인 → 활동 모듈 → 퀴즈**로 이동
2. "문제 유형 관리" 클릭
3. "새 문제 유형 추가" 클릭
4. 문제 유형 이름: "Wave Minus 집합 차집합"
5. 문제 텍스트에 집합 데이터 포함:
   ```
   {"setA": [1,2,3,4,5,6,7], "setB": [4,5,6,7,8,9,10]}
   ```

#### 7.3 iframe으로 임베딩

Moodle 페이지나 퀴즈에 다음 HTML 추가:

```html
<iframe
  src="http://your-domain.com/wave-minus-app/?problemId={QUESTION_ID}&userId={USER_ID}"
  width="400"
  height="700"
  frameborder="0"
  style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"
></iframe>
```

### 8. 문제 해결

#### 문제: "Database connection failed" 오류

**해결책**:
1. `php/config.php`의 데이터베이스 정보 확인
2. MySQL 서비스 실행 확인: `sudo systemctl status mysql`
3. 사용자 권한 확인:
   ```sql
   GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### 문제: 애니메이션이 작동하지 않음

**해결책**:
1. 브라우저 콘솔 확인 (F12 → Console 탭)
2. JavaScript 파일 로드 확인
3. 브라우저 캐시 삭제 (Ctrl+F5)

#### 문제: PHP API가 404 오류 반환

**해결책**:
1. Apache mod_rewrite 활성화 확인
2. .htaccess 파일 존재 확인
3. 직접 경로로 테스트:
   ```
   http://your-domain.com/wave-minus-app/php/get_problem.php
   ```

#### 문제: 권한 오류 (Permission denied)

**해결책**:
```bash
# 파일 소유자 변경
sudo chown -R www-data:www-data wave-minus-app

# 권한 설정
sudo chmod 755 wave-minus-app
sudo chmod 755 wave-minus-app/logs
```

### 9. 보안 강화

#### 9.1 config.php 파일 보호

```apache
# .htaccess에 추가
<Files "config.php">
    Order Allow,Deny
    Deny from all
</Files>
```

#### 9.2 디버그 모드 비활성화 (프로덕션)

`php/config.php` 수정:

```php
define('DEBUG_MODE', false);
ini_set('display_errors', 0);
```

#### 9.3 SQL 인젝션 방지

- 이미 PDO prepared statements 사용 중 (구현됨)
- 추가 검증이 필요하면 입력값 sanitize

#### 9.4 HTTPS 강제

```apache
# .htaccess에 추가
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 10. 성능 최적화

#### 10.1 PHP OPcache 활성화

```bash
# php.ini 편집
sudo nano /etc/php/7.1/fpm/php.ini

# 다음 설정 추가
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000

# PHP-FPM 재시작
sudo systemctl restart php7.1-fpm
```

#### 10.2 MySQL 쿼리 캐싱

```sql
-- my.cnf 편집 후 MySQL 재시작
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

#### 10.3 정적 파일 캐싱 (Nginx)

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 11. 백업

#### 11.1 데이터베이스 백업

```bash
# 백업 스크립트
mysqldump -u moodle_user -p moodle mdl_waveminus_attempts mdl_waveminus_problems > waveminus_backup_$(date +%Y%m%d).sql
```

#### 11.2 파일 백업

```bash
tar -czf waveminus_files_$(date +%Y%m%d).tar.gz wave-minus-app/
```

### 12. 업데이트

새 버전으로 업데이트할 때:

```bash
# 1. 백업
mysqldump -u moodle_user -p moodle > backup.sql
tar -czf waveminus_backup.tar.gz wave-minus-app/

# 2. 새 파일 배포
cp -r wave-minus-app-new/* wave-minus-app/

# 3. 권한 재설정
chown -R www-data:www-data wave-minus-app

# 4. 브라우저 캐시 강제 갱신
# (버전 번호를 URL에 추가하거나 하드 리프레시)
```

### 13. 모니터링

#### 13.1 에러 로그 확인

```bash
# Wave Minus 로그
tail -f wave-minus-app/logs/error.log

# Apache 로그
tail -f /var/log/apache2/error.log

# Nginx 로그
tail -f /var/log/nginx/error.log

# PHP 로그
tail -f /var/log/php7.1-fpm.log
```

#### 13.2 데이터베이스 통계 조회

```sql
-- 문제별 통계
SELECT * FROM mdl_waveminus_stats;

-- 사용자별 진도
SELECT * FROM mdl_waveminus_user_progress;

-- 사용자 통계 (저장 프로시저)
CALL sp_get_user_stats(1);
```

## 지원

문제가 발생하면:
1. 로그 파일 확인
2. 브라우저 콘솔 확인
3. API 테스트 수행
4. 문제 해결 섹션 참조

추가 지원이 필요하면 프로젝트 이슈 트래커에 문의하세요.
