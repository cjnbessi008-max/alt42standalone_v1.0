# 설치 가이드

## 사전 요구사항

시스템에 다음 소프트웨어가 설치되어 있어야 합니다:

### 필수 소프트웨어
- **Node.js** 16.x 이상
- **PHP** 7.1.9
- **MySQL** 5.7
- **Moodle** 3.7 (이미 설치되어 있어야 함)

### 설치 확인

```bash
# Node.js 버전 확인
node --version

# PHP 버전 확인
php --version

# MySQL 버전 확인
mysql --version
```

## 단계별 설치

### 1. 프로젝트 복사

```bash
# 프로젝트 디렉토리로 이동
cd alt42standalone_v1.0

# 의존성 설치
npm install
```

### 2. 데이터베이스 설정

#### 2.1 MySQL 접속

```bash
mysql -u root -p
```

#### 2.2 Moodle 데이터베이스 확인

```sql
-- Moodle 데이터베이스 목록 확인
SHOW DATABASES;

-- Moodle 데이터베이스 선택
USE moodle;

-- 기존 테이블 확인
SHOW TABLES;
```

#### 2.3 커스텀 테이블 생성

```bash
# MySQL에 스키마 적용
mysql -u moodle_user -p moodle < backend/schema.sql
```

또는 MySQL 클라이언트에서 직접:

```sql
USE moodle;
SOURCE /path/to/alt42standalone_v1.0/backend/schema.sql;
```

#### 2.4 테이블 생성 확인

```sql
-- 새로 생성된 테이블 확인
SHOW TABLES LIKE 'mdl_custom_function%';

-- 샘플 데이터 확인
SELECT * FROM mdl_custom_function_problems;
```

### 3. 백엔드 설정

#### 3.1 설정 파일 수정

`backend/config.php` 파일을 열어 데이터베이스 정보를 입력:

```php
<?php
// 데이터베이스 설정 (실제 값으로 변경)
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_moodle_user');
define('DB_PASS', 'your_moodle_password');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설치 경로 (실제 경로로 변경)
define('MOODLE_PATH', '/var/www/html/moodle');
?>
```

#### 3.2 권한 설정

```bash
# PHP 파일 실행 권한 부여
chmod +x backend/api/*.php
chmod +x backend/*.php

# 로그 디렉토리 생성 (필요시)
mkdir -p backend/logs
chmod 755 backend/logs
```

### 4. 프론트엔드 설정

#### 4.1 환경 변수 파일 생성

```bash
# .env 파일 생성
cp .env.example .env
```

#### 4.2 .env 파일 수정

```env
# API URL (백엔드 서버 주소)
VITE_API_URL=http://localhost:8000/backend/api

# 개발 모드 설정
VITE_DEV_MODE=true

# Mock 데이터 사용 (백엔드 미연결 시)
VITE_USE_MOCK_DATA=false
```

### 5. 서버 실행

#### 5.1 백엔드 PHP 서버 실행

터미널 1:
```bash
cd backend
php -S localhost:8000
```

출력 확인:
```
PHP 7.1.9 Development Server started at ...
Listening on http://localhost:8000
```

#### 5.2 프론트엔드 Vite 서버 실행

터미널 2 (새 터미널):
```bash
npm run dev
```

출력 확인:
```
VITE v5.0.2  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 6. 설치 확인

#### 6.1 브라우저 접속

```
http://localhost:3000
```

#### 6.2 기능 테스트

1. **컨트롤 패널 확인**
   - 함수 선택 버튼이 표시되는지 확인
   - 값 입력 필드가 작동하는지 확인

2. **가상 스마트폰 화면 확인**
   - 우측 하단에 스마트폰 UI가 표시되는지 확인
   - 문제 정보가 표시되는지 확인

3. **Value Bounce 애니메이션 테스트**
   - 값을 입력하고 "계산하기" 클릭
   - 공이 튀는 애니메이션이 작동하는지 확인
   - 다른 값으로 여러 번 테스트

#### 6.3 API 테스트

브라우저나 curl로 API 테스트:

```bash
# 문제 목록 조회
curl http://localhost:8000/backend/api/problems.php?action=list&course_id=1

# 특정 문제 조회
curl http://localhost:8000/backend/api/problems.php?action=get&id=1
```

## 프로덕션 배포

### 1. 프론트엔드 빌드

```bash
# 프로덕션 빌드
npm run build

# dist 폴더에 빌드 파일 생성됨
ls -la dist/
```

### 2. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName alt42.yourdomain.com
    DocumentRoot /var/www/alt42standalone_v1.0/dist

    # 프론트엔드
    <Directory /var/www/alt42standalone_v1.0/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # 백엔드 API
    Alias /backend /var/www/alt42standalone_v1.0/backend
    <Directory /var/www/alt42standalone_v1.0/backend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        <FilesMatch \.php$>
            SetHandler "proxy:fcgi://127.0.0.1:9000"
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name alt42.yourdomain.com;
    root /var/www/alt42standalone_v1.0/dist;

    index index.html;

    # 프론트엔드
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /backend {
        alias /var/www/alt42standalone_v1.0/backend;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    error_log /var/log/nginx/alt42_error.log;
    access_log /var/log/nginx/alt42_access.log;
}
```

### 3. HTTPS 설정 (권장)

```bash
# Let's Encrypt 인증서 발급
sudo certbot --apache -d alt42.yourdomain.com
# 또는
sudo certbot --nginx -d alt42.yourdomain.com
```

### 4. 프로덕션 설정 변경

#### backend/config.php
```php
// 에러 리포팅 비활성화
error_reporting(0);
ini_set('display_errors', 0);

// CORS 특정 도메인으로 제한
define('CORS_ALLOWED_ORIGINS', 'https://alt42.yourdomain.com');
```

#### .env
```env
VITE_API_URL=https://alt42.yourdomain.com/backend/api
VITE_DEV_MODE=false
VITE_USE_MOCK_DATA=false
```

## 문제 해결

### 문제 1: 데이터베이스 연결 실패

**증상**: "Database connection failed" 에러

**해결 방법**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 데이터베이스 접근 권한 확인
mysql -u moodle_user -p
```

### 문제 2: CORS 에러

**증상**: 브라우저 콘솔에 CORS 에러 표시

**해결 방법**:
1. `backend/config.php`에서 CORS 설정 확인
2. PHP 헤더가 올바르게 전송되는지 확인
3. 브라우저 캐시 삭제

### 문제 3: 애니메이션 작동 안 함

**증상**: Value Bounce 애니메이션이 표시되지 않음

**해결 방법**:
```bash
# Framer Motion 재설치
npm uninstall framer-motion
npm install framer-motion

# 브라우저 캐시 삭제 후 재시작
```

### 문제 4: PHP 서버 포트 충돌

**증상**: "Address already in use" 에러

**해결 방법**:
```bash
# 다른 포트 사용
php -S localhost:8080

# .env 파일의 API URL도 변경
VITE_API_URL=http://localhost:8080/backend/api
```

## 추가 리소스

- [Moodle 3.7 문서](https://docs.moodle.org/37/)
- [React 문서](https://react.dev/)
- [Framer Motion 문서](https://www.framer.com/motion/)
- [Vite 문서](https://vitejs.dev/)

## 지원

설치 중 문제가 발생하면:
1. GitHub 이슈 생성
2. 에러 로그 첨부
3. 시스템 환경 정보 포함

---

**설치 완료!** 🎉
