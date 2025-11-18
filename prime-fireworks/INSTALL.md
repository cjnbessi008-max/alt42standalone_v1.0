# Prime Fireworks 설치 가이드

## 빠른 시작 (5분 설치)

### 1단계: 데이터베이스 설정 (2분)

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
mysql -u root -p < backend/database/schema.sql

# 확인
mysql -u root -p -e "USE prime_fireworks; SHOW TABLES;"
```

예상 출력:
```
+---------------------------+
| Tables_in_prime_fireworks |
+---------------------------+
| fireworks_log             |
| moodle_config             |
| prime_problems            |
| student_progress          |
| user_statistics           |
+---------------------------+
```

### 2단계: 설정 파일 수정 (1분)

`backend/api/config.php` 파일에서 다음 항목을 수정:

```php
// 필수 설정
define('DB_HOST', 'localhost');        // MySQL 호스트
define('DB_NAME', 'prime_fireworks');  // 데이터베이스 이름
define('DB_USER', 'root');             // MySQL 사용자
define('DB_PASS', 'your_password');    // MySQL 비밀번호

// Moodle 연동 (선택사항)
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'your_token_here');
```

### 3단계: 웹 서버 실행 (2분)

#### 방법 A: PHP 내장 서버 (개발용)

```bash
# 프로젝트 디렉토리로 이동
cd prime-fireworks

# PHP 서버 시작
php -S localhost:8000 -t frontend/

# 백엔드 서버 시작 (다른 터미널에서)
php -S localhost:8001 -t backend/
```

`frontend/components/api.js`에서 baseURL 수정:
```javascript
baseURL: 'http://localhost:8001/api',
```

브라우저에서 `http://localhost:8000` 접속

#### 방법 B: Apache/Nginx (운영용)

**Apache 설정:**

`/etc/apache2/sites-available/prime-fireworks.conf` 생성:

```apache
<VirtualHost *:80>
    ServerName prime-fireworks.local
    DocumentRoot /var/www/prime-fireworks/frontend

    <Directory /var/www/prime-fireworks/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /prime-fireworks/backend /var/www/prime-fireworks/backend
    <Directory /var/www/prime-fireworks/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/prime-fireworks-error.log
    CustomLog ${APACHE_LOG_DIR}/prime-fireworks-access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite prime-fireworks
sudo systemctl reload apache2
```

`/etc/hosts`에 추가:
```
127.0.0.1   prime-fireworks.local
```

브라우저에서 `http://prime-fireworks.local` 접속

## Moodle 연동 설정 (선택사항)

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. "웹 서비스 활성화" 체크

### 2. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "서비스 추가" 클릭
3. 다음 정보 입력:
   - 이름: `prime_fireworks_service`
   - 약칭: `primefireworks`
   - 활성화됨: 체크
   - 허가된 사용자만: 체크 해제

### 3. 함수 추가

외부 서비스 편집 화면에서 다음 함수 추가:
- `core_user_get_users_by_field`
- `core_webservice_get_site_info`
- `core_enrol_get_enrolled_users`
- `gradereport_user_get_grade_items`

### 4. 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 다음 정보 입력:
   - 사용자: 관리자 또는 교사 선택
   - 서비스: `prime_fireworks_service`
   - IP 제한: (선택사항)
4. "저장" 후 생성된 토큰 복사
5. `backend/api/config.php`의 `MOODLE_TOKEN`에 붙여넣기

### 5. 데이터베이스에 Moodle 설정 저장

```sql
USE prime_fireworks;

UPDATE moodle_config SET config_value = 'http://your-moodle-url/moodle'
WHERE config_key = 'moodle_url';

UPDATE moodle_config SET config_value = 'your_token_here'
WHERE config_key = 'moodle_token';
```

### 6. 연결 테스트

브라우저 콘솔에서:
```javascript
// Moodle 연결 테스트
fetch('/prime-fireworks/backend/api/test-moodle.php')
  .then(r => r.json())
  .then(console.log);
```

## 문제 해결

### 오류: "Database connection failed"

**원인**: 데이터베이스 접속 정보 오류

**해결**:
```bash
# MySQL 접속 확인
mysql -u root -p

# 사용자 및 권한 확인
mysql> SELECT user, host FROM mysql.user;
mysql> SHOW GRANTS FOR 'root'@'localhost';

# 필요 시 사용자 생성
mysql> CREATE USER 'primefw'@'localhost' IDENTIFIED BY 'password';
mysql> GRANT ALL PRIVILEGES ON prime_fireworks.* TO 'primefw'@'localhost';
mysql> FLUSH PRIVILEGES;
```

### 오류: "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**원인**: 백엔드 서버 미실행 또는 잘못된 API URL

**해결**:
1. PHP 서버가 실행 중인지 확인
2. `frontend/components/api.js`의 `baseURL` 확인
3. 브라우저 개발자 도구 Network 탭에서 요청 URL 확인

### 오류: "CORS policy" 관련 오류

**원인**: CORS 설정 오류

**해결**:
`backend/api/config.php`에서:
```php
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:8000',
    'http://prime-fireworks.local'
]);
```

### 오류: "No problems available"

**원인**: 데이터베이스에 문제 데이터가 없음

**해결**:
```sql
-- 샘플 데이터 확인
SELECT * FROM prime_problems;

-- 데이터가 없으면 스키마 재실행
source backend/database/schema.sql;
```

### 폭죽 애니메이션이 표시되지 않음

**원인**: Canvas API 미지원 브라우저 또는 JavaScript 오류

**해결**:
1. 모던 브라우저 사용 (Chrome, Firefox, Safari, Edge)
2. 브라우저 콘솔에서 JavaScript 오류 확인
3. `frontend/components/fireworks.js` 로드 확인

## 개발 모드

### 디버깅 활성화

`backend/api/config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
define('LOG_ENABLED', true);
```

### 로그 확인

```bash
# 애플리케이션 로그
tail -f backend/logs/app.log

# Apache 에러 로그
tail -f /var/log/apache2/error.log

# MySQL 쿼리 로그
sudo tail -f /var/log/mysql/query.log
```

### 테스트 사용자로 실행

브라우저 콘솔:
```javascript
// 테스트 사용자 ID 설정
sessionStorage.setItem('user_id', '999');
location.reload();
```

## 성능 최적화

### MySQL 최적화

```sql
-- 인덱스 확인
SHOW INDEX FROM student_progress;

-- 쿼리 분석
EXPLAIN SELECT * FROM student_progress WHERE moodle_user_id = 123;
```

### PHP 최적화

`php.ini`:
```ini
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 10M
post_max_size = 10M
```

### 캐싱 설정

Apache `.htaccess`:
```apache
# 정적 파일 캐싱
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## 보안 체크리스트

- [ ] MySQL root 비밀번호 설정
- [ ] PHP `display_errors` 운영 환경에서 Off
- [ ] HTTPS 설정 (운영 환경)
- [ ] SQL Injection 방어 (Prepared Statements 사용)
- [ ] XSS 방어 (입력값 sanitization)
- [ ] CSRF 토큰 구현
- [ ] 파일 권한 설정 (644 for files, 755 for directories)
- [ ] Moodle 토큰 안전하게 보관

## 업그레이드

### 데이터베이스 마이그레이션

```sql
-- 백업
mysqldump -u root -p prime_fireworks > backup.sql

-- 새 버전 스키마 적용
source backend/database/migrations/v1.1.0.sql
```

### 코드 업데이트

```bash
# Git pull
git pull origin main

# 의존성 확인
# (현재 버전은 외부 의존성 없음)

# 브라우저 캐시 클리어
# Ctrl+Shift+R (하드 리로드)
```

---

**설치 지원**: 문제가 발생하면 GitHub Issues에 등록해주세요.
