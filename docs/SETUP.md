# Venn Glow 설치 가이드

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+

## 설치 단계

### 1. 파일 배포

프로젝트 파일을 웹 서버의 document root에 복사합니다.

```bash
git clone <repository-url> /var/www/html/venn-glow
cd /var/www/html/venn-glow
```

### 2. 데이터베이스 설정

Moodle 데이터베이스에 연결하기 위한 설정을 구성합니다.

```bash
cp config/database.example.php config/database.php
```

`config/database.php` 파일을 편집하여 Moodle 데이터베이스 정보를 입력합니다:

```php
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'moodle',
    'username' => 'moodle_user',
    'password' => 'your_secure_password',
    'prefix' => 'mdl_',
];
```

### 3. 파일 권한 설정

```bash
chmod 755 api/*.php
chmod 755 lib/*.php
chmod 644 config/database.php
```

### 4. Apache 설정 (선택사항)

Apache를 사용하는 경우 `.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /venn-glow/

    # public 디렉토리를 기본으로
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>

# PHP 설정
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

### 5. Nginx 설정 (선택사항)

Nginx를 사용하는 경우 설정 예시:

```nginx
server {
    listen 80;
    server_name venn-glow.example.com;
    root /var/www/html/venn-glow/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        alias /var/www/html/venn-glow/api/;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
}
```

### 6. 테스트

브라우저에서 접속하여 테스트:

```
http://your-server/venn-glow/public/
```

## Moodle 연동

### Moodle 데이터베이스 접근 권한

Venn Glow는 Moodle 데이터베이스에서 다음 테이블에 접근합니다:

- `mdl_question` - 문제 정보
- `mdl_question_answers` - 정답 정보
- `mdl_question_hints` - 힌트 정보

읽기 전용 권한으로 충분합니다:

```sql
GRANT SELECT ON moodle.mdl_question TO 'venn_glow_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_answers TO 'venn_glow_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_hints TO 'venn_glow_user'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 형식

Moodle에서 집합 문제를 생성할 때 다음 형식을 사용하세요:

**문제 텍스트 예시:**
```
집합 A = {1,2,3,4,5}, 집합 B = {3,4,5,6,7}
두 집합의 교집합을 구하세요.
```

또는 영어:
```
Set A = {1,2,3,4,5}, Set B = {3,4,5,6,7}
Find the intersection of the two sets.
```

## 문제 해결

### PHP 오류가 발생하는 경우

PHP 오류 로그 확인:
```bash
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

### 데이터베이스 연결 실패

1. MySQL 서비스 상태 확인:
```bash
systemctl status mysql
```

2. 데이터베이스 연결 테스트:
```bash
mysql -h localhost -u moodle_user -p moodle
```

3. 방화벽 설정 확인

### API가 작동하지 않는 경우

1. API 엔드포인트 직접 테스트:
```bash
curl http://your-server/venn-glow/api/get_problem.php
```

2. CORS 설정 확인 (크로스 도메인 요청 시)

## 개발 환경

로컬 개발을 위해 PHP 내장 서버 사용:

```bash
cd public
php -S localhost:8000
```

그리고 브라우저에서 `http://localhost:8000` 접속

## 보안 권장사항

1. **데이터베이스 비밀번호**: 강력한 비밀번호 사용
2. **파일 권한**: config/database.php는 644 권한
3. **HTTPS**: 프로덕션 환경에서는 HTTPS 사용
4. **SQL Injection**: 준비된 문 (Prepared Statements) 사용 (코드에 이미 적용됨)
5. **XSS**: 사용자 입력 검증 및 이스케이프
