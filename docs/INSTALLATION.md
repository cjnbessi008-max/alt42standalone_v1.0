# Hundred Art - 설치 가이드

## 시스템 요구사항

### 필수 소프트웨어
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Node.js**: 18.0 이상
- **npm**: 8.0 이상
- **Moodle**: 3.7 이상 (LMS 연동 시)

### 권장 환경
- Ubuntu 18.04+ / CentOS 7+ / macOS 10.14+
- Apache 2.4+ 또는 Nginx 1.14+
- PHP-FPM (프로덕션 환경)

---

## 1. 데이터베이스 설정

### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE hundred_art CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'hundred_art_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hundred_art.* TO 'hundred_art_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 스키마 및 초기 데이터 적용

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/alt42standalone_v1.0

# 스키마 생성
mysql -u root -p hundred_art < database/schema.sql

# 초기 아트워크 데이터 (1-10) 삽입
mysql -u root -p hundred_art < database/seed_artworks.sql

# 나머지 아트워크 (11-100) 생성
php database/generate_artworks.php
```

---

## 2. 백엔드 설정

### 환경 변수 설정

```bash
cd backend

# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**`.env` 파일 내용:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hundred_art
DB_USER=root
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token

APP_ENV=production
APP_DEBUG=false

CORS_ORIGINS=http://your-frontend-domain.com
```

### PHP 설정 확인

```bash
# PHP 버전 확인
php -v

# 필수 확장 모듈 확인
php -m | grep -E "pdo|mysql|curl|json"

# 필요한 경우 확장 모듈 설치 (Ubuntu 예시)
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json
```

### 백엔드 테스트

```bash
# PHP 내장 서버로 테스트
cd backend
php -S localhost:8000

# 다른 터미널에서 API 테스트
curl http://localhost:8000/api/health
```

---

## 3. Moodle 연동 설정

### Moodle Web Service 활성화

1. Moodle 관리자 로그인
2. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
3. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - REST 프로토콜 활성화
4. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - 새 서비스 생성: "Hundred Art Integration"
   - 다음 함수 추가:
     - `core_user_get_users_by_field`
     - `core_course_get_courses`
     - `core_enrol_get_enrolled_users`
     - `mod_quiz_get_quiz_access_information`
5. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - 새 토큰 생성
   - 서비스: "Hundred Art Integration"
   - 사용자: 관리자 또는 전용 사용자
   - **토큰 복사** → `.env` 파일의 `MOODLE_TOKEN`에 입력

---

## 4. 프론트엔드 설정

### 의존성 설치

```bash
cd frontend

# npm 패키지 설치
npm install
```

### 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**`.env` 파일 내용:**
```env
REACT_APP_API_URL=http://localhost:8000/backend/api
REACT_APP_NAME=Hundred Art
REACT_APP_VERSION=1.0.0
```

### 개발 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `frontend/build/` 디렉토리에 생성됩니다.

---

## 5. 프로덕션 배포

### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName hundred-art.yourdomain.com
    DocumentRoot /var/www/hundred-art/frontend/build

    # 프론트엔드 (React)
    <Directory /var/www/hundred-art/frontend/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router를 위한 재작성 규칙
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>

    # 백엔드 API (PHP)
    Alias /backend /var/www/hundred-art/backend

    <Directory /var/www/hundred-art/backend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP-FPM 설정
        <FilesMatch \.php$>
            SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/hundred-art-error.log
    CustomLog ${APACHE_LOG_DIR}/hundred-art-access.log combined
</VirtualHost>
```

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name hundred-art.yourdomain.com;
    root /var/www/hundred-art/frontend/build;
    index index.html;

    # 프론트엔드
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /backend/ {
        alias /var/www/hundred-art/backend/;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 파일 권한 설정

```bash
# 프로젝트 디렉토리 권한 설정
sudo chown -R www-data:www-data /var/www/hundred-art

# 로그 디렉토리 생성 및 권한 설정
mkdir -p /var/www/hundred-art/logs
sudo chown -R www-data:www-data /var/www/hundred-art/logs
sudo chmod -R 755 /var/www/hundred-art/logs
```

---

## 6. 초기 설정 및 테스트

### Moodle 데이터 동기화

```bash
# API를 통해 학생 데이터 동기화
curl -X POST http://localhost:8000/backend/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "students", "course_id": 1}'

# 문제 데이터 동기화
curl -X POST http://localhost:8000/backend/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "problems", "course_id": 1, "quiz_id": 1}'
```

### 아트워크 확인

```bash
# 전체 아트워크 조회
curl http://localhost:8000/backend/api/artworks

# 특정 아트워크 조회
curl http://localhost:8000/backend/api/artworks/1
```

### Health Check

```bash
curl http://localhost:8000/backend/api/health
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "app": "Hundred Art",
    "version": "1.0.0",
    "environment": "production",
    "timestamp": "2025-01-18 10:00:00"
  }
}
```

---

## 7. 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 연결 테스트
mysql -u hundred_art_user -p -h localhost hundred_art
```

### PHP 오류

```bash
# PHP 에러 로그 확인
sudo tail -f /var/log/php7.1-fpm.log

# Apache 에러 로그 확인
sudo tail -f /var/log/apache2/hundred-art-error.log
```

### CORS 오류

백엔드 `.env` 파일의 `CORS_ORIGINS` 설정 확인:
```env
CORS_ORIGINS=http://localhost:3000,http://your-domain.com
```

### Moodle 연동 오류

1. Moodle 토큰 확인
2. Web Service 권한 확인
3. Moodle URL 확인 (http/https, trailing slash 등)
4. 방화벽 설정 확인

```bash
# Moodle 연결 테스트
curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

---

## 8. 보안 권장사항

### 프로덕션 환경

1. **HTTPS 사용** (Let's Encrypt 인증서 권장)
2. **방화벽 설정** (필요한 포트만 개방)
3. **데이터베이스 권한 최소화**
4. **정기적인 백업**
5. **보안 업데이트 적용**

### 백업

```bash
# 데이터베이스 백업
mysqldump -u root -p hundred_art > backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf hundred_art_backup_$(date +%Y%m%d).tar.gz /var/www/hundred-art
```

---

## 지원

문제가 발생하면 다음을 확인하세요:
- 로그 파일: `/var/www/hundred-art/logs/`
- PHP 에러 로그
- MySQL 에러 로그
- 브라우저 개발자 도구 콘솔

추가 도움이 필요하면 프로젝트 이슈 트래커에 문의하세요.
