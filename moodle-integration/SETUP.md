# Moodle LMS Integration WebApp - Setup Guide

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7
- **웹 서버**: Apache 또는 Nginx
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 설치 단계

### 1. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE moodle_integration_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON moodle_integration_app.* TO 'moodle_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 가져오기

```bash
mysql -u moodle_app -p moodle_integration_app < database/schema.sql
```

### 2. 백엔드 설정

#### 데이터베이스 연결 설정

`backend/config/database.php` 파일을 편집:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle_integration_app');
define('DB_USER', 'moodle_app');
define('DB_PASS', 'your_secure_password');
```

#### Moodle API 설정

`backend/config/moodle.php` 파일을 편집:

```php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_web_service_token');
```

### 3. Moodle 웹 서비스 활성화

Moodle 관리자 계정으로 로그인 후:

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. 다음 항목들을 활성화:
   - ✓ 웹 서비스 활성화
   - ✓ REST 프로토콜 활성화

3. **외부 서비스 생성**:
   - 이름: `Moodle Quiz Integration`
   - 약칭: `moodle_quiz_app`
   - 활성화: 체크

4. **함수 추가**:
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_questions`
   - `mod_quiz_start_attempt`
   - `mod_quiz_process_attempt`
   - `mod_quiz_get_user_attempts`

5. **토큰 생성**:
   - 사용자 선택 (예: admin)
   - 서비스 선택: `moodle_quiz_app`
   - 토큰 복사 → `backend/config/moodle.php`에 붙여넣기

### 4. 웹 서버 설정

#### Apache (.htaccess)

프로젝트 루트에 `.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Allow CORS
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"

    # PHP settings
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 300
</IfModule>
```

#### Nginx

`/etc/nginx/sites-available/moodle-app` 설정:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/moodle-integration/frontend;
    index index.html;

    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP backend
    location /backend/ {
        alias /path/to/moodle-integration/backend/;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 5. 파일 권한 설정

```bash
# 프로젝트 디렉토리 소유자 설정
sudo chown -R www-data:www-data /path/to/moodle-integration

# 실행 권한 설정
chmod -R 755 /path/to/moodle-integration
chmod -R 775 /path/to/moodle-integration/backend/api
```

### 6. 테스트

#### 데이터베이스 연결 테스트

```bash
php -r "require 'backend/config/database.php'; \$db = Database::getInstance(); echo 'Database connected successfully!';"
```

#### API 테스트

브라우저에서 접속:

```
http://your-domain.com/backend/api/get_questions.php?quiz_id=1&user_id=1
```

성공 시 JSON 응답:
```json
{
  "success": true,
  "source": "cache",
  "session_id": 1,
  "quiz_id": 1,
  "questions": [...],
  "total": 5
}
```

### 7. 프론트엔드 실행

브라우저에서 접속:

```
http://your-domain.com/index.html
```

또는 로컬 개발 서버:

```bash
cd frontend
python3 -m http.server 8000
```

그리고 브라우저에서 `http://localhost:8000` 접속

## 설정 옵션

### URL 파라미터

- `quiz_id`: Moodle 퀴즈 ID (기본값: 1)
- `user_id`: 사용자 ID (기본값: 1)
- `api`: API 베이스 URL (기본값: ./backend/api)

예시:
```
http://your-domain.com/index.html?quiz_id=123&user_id=456
```

### Cross Wave 효과 커스터마이징

`frontend/js/app.js`의 CrossWave 초기화 부분 수정:

```javascript
this.crossWave = new CrossWave({
    color: '#4CAF50',      // 색상
    duration: 2000,        // 지속 시간 (ms)
    maxRadius: 500,        // 최대 반지름 (px)
    intensity: 100,        // 강도 (1-100)
    particleCount: 24,     // 파티클 개수
    showMessage: true,     // 메시지 표시 여부
    message: '정답입니다! 🎉'  // 메시지 내용
});
```

## 문제 해결

### 데이터베이스 연결 오류

```
SQLSTATE[HY000] [2002] Connection refused
```

**해결 방법**:
1. MySQL 서비스 확인: `sudo service mysql status`
2. 데이터베이스 자격 증명 확인
3. MySQL 소켓 파일 경로 확인

### CORS 오류

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**해결 방법**:
1. `.htaccess` 또는 Nginx 설정에 CORS 헤더 추가 (위 참조)
2. PHP 파일에 헤더 추가:
```php
header('Access-Control-Allow-Origin: *');
```

### Moodle API 오류

```
Moodle Error: Invalid token
```

**해결 방법**:
1. Moodle에서 웹 서비스가 활성화되어 있는지 확인
2. 토큰이 올바르게 복사되었는지 확인
3. 토큰이 만료되지 않았는지 확인
4. 필요한 함수들이 서비스에 추가되었는지 확인

### Cross Wave 효과가 표시되지 않음

**해결 방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일이 올바르게 로드되었는지 확인
3. z-index 충돌 확인
4. 브라우저 캐시 지우기

## 보안 권장사항

1. **데이터베이스 비밀번호**: 강력한 비밀번호 사용
2. **Moodle 토큰**: 주기적으로 재생성
3. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 사용
4. **SQL Injection**: PDO prepared statements 사용 (이미 구현됨)
5. **XSS 방지**: 사용자 입력 검증 및 이스케이프
6. **파일 권한**: 최소 권한 원칙 적용

## 성능 최적화

1. **데이터베이스 인덱싱**: 이미 스키마에 포함됨
2. **캐싱**: 질문 캐시 활용 (`use_cache=true`)
3. **CDN**: 정적 파일을 CDN으로 제공
4. **Minification**: CSS/JS 파일 압축
5. **Gzip 압축**: 웹 서버에서 활성화

## 개발 모드

개발 중에는 데모 데이터를 사용할 수 있습니다:

```
http://localhost:8000/index.html?quiz_id=1&user_id=1
```

Moodle 연결 실패 시 자동으로 데모 질문이 로드됩니다.

## 지원

문제가 발생하면:
1. 브라우저 개발자 도구의 콘솔 확인
2. PHP 에러 로그 확인: `/var/log/apache2/error.log`
3. MySQL 로그 확인: `/var/log/mysql/error.log`
4. 네트워크 탭에서 API 요청/응답 확인
