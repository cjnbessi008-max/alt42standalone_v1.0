# Ratio Spring 설치 가이드

## 시스템 요구사항

- **웹서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 단계

### 1. 파일 배포

```bash
# 프로젝트를 웹서버 디렉토리에 복사
cp -r ratio-spring-app /var/www/html/

# 또는 심볼릭 링크 생성
ln -s /path/to/ratio-spring-app /var/www/html/ratio-spring
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 파일 실행
source /path/to/ratio-spring-app/database/schema.sql

# 또는 명령줄에서 직접 실행
mysql -u root -p < /path/to/ratio-spring-app/database/schema.sql
```

### 3. API 설정

`api/config.php` 파일을 수정하여 데이터베이스 연결 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'ratio_spring_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 설정 (선택사항)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 4. 권한 설정

```bash
# Apache 사용자에게 쓰기 권한 부여 (로그 등)
chown -R www-data:www-data /var/www/html/ratio-spring-app
chmod -R 755 /var/www/html/ratio-spring-app

# 민감한 파일 보호
chmod 600 /var/www/html/ratio-spring-app/api/config.php
```

### 5. 웹서버 설정

#### Apache

`.htaccess` 파일 생성 (api 디렉토리):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /ratio-spring/api/

    # CORS 허용 (필요한 경우)
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

#### Nginx

nginx 설정 파일에 추가:

```nginx
location /ratio-spring/ {
    try_files $uri $uri/ /ratio-spring/public/index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 6. PHP 내장 서버로 테스트 (개발 환경)

```bash
cd ratio-spring-app/public
php -S localhost:8080
```

브라우저에서 `http://localhost:8080` 접속

## Moodle 통합

### 1. Moodle Web Service 활성화

Moodle 관리자 패널에서:

1. **사이트 관리 → 플러그인 → 웹 서비스 → 관리**
2. "웹 서비스 활성화" 체크
3. REST 프로토콜 활성화

### 2. 사용자 및 토큰 생성

1. 웹 서비스 전용 사용자 생성
2. 토큰 생성 (사이트 관리 → 서버 → 웹 서비스 → 토큰 관리)
3. 생성된 토큰을 `api/config.php`에 입력

### 3. iframe 또는 LTI로 임베드

Moodle 활동에서 Ratio Spring 앱을 임베드:

```html
<iframe
    src="http://your-server/ratio-spring/public/?course_id=123&activity_id=456"
    width="400"
    height="700"
    frameborder="0"
    allowfullscreen>
</iframe>
```

## 테스트

### 1. API 테스트

```bash
# Health check
curl http://localhost:8080/api/connector.php?action=health

# 문제 목록 가져오기
curl http://localhost:8080/api/connector.php?action=get_problems

# 특정 문제 가져오기
curl http://localhost:8080/api/connector.php?action=get_problem&id=1
```

### 2. 프론트엔드 테스트

브라우저에서 `http://localhost:8080` 접속 후:

1. 비율 입력 (예: A=2, B=3)
2. "비율 업데이트" 버튼 클릭
3. 스프링 애니메이션 확인
4. "Moodle에서 불러오기" 버튼으로 랜덤 문제 테스트

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -h localhost -u your_user -p -e "USE ratio_spring_db; SHOW TABLES;"
```

### PHP 오류

```bash
# PHP 오류 로그 확인
tail -f /var/log/php7.1-fpm.log

# 또는 Apache 로그
tail -f /var/log/apache2/error.log
```

### CORS 오류

`api/config.php`에서 CORS 설정 확인:

```php
define('ALLOWED_ORIGINS', 'http://localhost:8080,http://your-moodle-site.com');
```

## 보안 권장사항

1. **프로덕션 환경에서 디버그 모드 비활성화**
   ```php
   // config.php
   error_reporting(0);
   ini_set('display_errors', 0);
   ```

2. **HTTPS 사용**
   - SSL 인증서 설치
   - HTTP에서 HTTPS로 리다이렉트

3. **데이터베이스 사용자 권한 최소화**
   - 전용 사용자 생성
   - 필요한 권한만 부여

4. **API 보안**
   - 강력한 시크릿 키 사용
   - 레이트 리미팅 구현
   - 입력 검증 강화

## 업그레이드

```bash
# 백업
mysqldump -u root -p ratio_spring_db > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf ratio-spring-backup-$(date +%Y%m%d).tar.gz ratio-spring-app/

# 새 버전 배포
# ... (파일 복사 및 데이터베이스 마이그레이션)
```

## 지원

문제가 발생하면 다음을 확인하세요:

- 브라우저 콘솔 (F12)
- PHP 오류 로그
- MySQL 로그
- 네트워크 탭 (API 호출 확인)
