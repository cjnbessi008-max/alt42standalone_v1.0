# Logical Linker 설치 가이드

## 사전 요구사항

- **PHP** 7.1.9 이상
- **MySQL** 5.7 이상
- **Node.js** 18 이상
- **Moodle** 3.7 (선택사항)

## 상세 설치 가이드

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE logical_linker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'logical_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON logical_linker.* TO 'logical_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 적용

```bash
mysql -u logical_user -p logical_linker < database/schema.sql
```

### 3. 백엔드 설정

#### 로그 디렉토리 생성

```bash
cd backend
mkdir logs
chmod 755 logs
```

#### 환경 변수 설정

```bash
cp .env.example .env
nano .env  # 또는 선호하는 에디터 사용
```

`.env` 파일 내용:
```
DB_HOST=localhost
DB_NAME=logical_linker
DB_USER=logical_user
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_token

DEBUG_MODE=false
```

#### PHP 서버 실행

```bash
# 개발 서버
php -S localhost:8000 -t .

# 또는 Apache/Nginx 설정
```

### 4. 프론트엔드 설정

#### 의존성 설치

```bash
cd frontend
npm install
```

#### 환경 변수 설정

```bash
cp .env.example .env
nano .env
```

`.env` 파일 내용:
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Logical Linker"
VITE_APP_VERSION="1.0.0"
```

#### 개발 서버 실행

```bash
npm run dev
```

### 5. Moodle 연동 (선택사항)

#### Moodle Web Service 활성화

1. 사이트 관리 → 플러그인 → 웹 서비스 → 개요
2. "웹 서비스 활성화" 체크
3. "REST 프로토콜 활성화" 체크

#### 서비스 생성

1. 사이트 관리 → 서버 → 웹 서비스 → 외부 서비스
2. "서비스 추가" 클릭
3. 이름: "Logical Linker"
4. 활성화 체크

#### 함수 추가

다음 함수들을 서비스에 추가:
- `core_user_get_users_by_field`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_quiz_questions`
- `core_question_get_questions`
- `mod_quiz_save_attempt`
- `core_enrol_get_enrolled_users`

#### 토큰 생성

1. 사이트 관리 → 서버 → 웹 서비스 → 토큰 관리
2. "토큰 생성" 클릭
3. 사용자 선택
4. 서비스: "Logical Linker"
5. 생성된 토큰을 백엔드 `.env`의 `MOODLE_TOKEN`에 설정

#### 연결 테스트

```bash
curl http://localhost:8000/api/moodle/test
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "success": true,
    "site_name": "Your Moodle Site",
    "version": "3.7",
    "user": "webservice_user"
  }
}
```

## 프로덕션 배포

### Apache 설정

```apache
<VirtualHost *:80>
    ServerName logical-linker.example.com
    DocumentRoot /var/www/logical-linker/backend

    <Directory /var/www/logical-linker/backend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/logical-linker-error.log
    CustomLog ${APACHE_LOG_DIR}/logical-linker-access.log combined
</VirtualHost>
```

### Nginx 설정

```nginx
server {
    listen 80;
    server_name logical-linker.example.com;
    root /var/www/logical-linker/backend;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 프론트엔드 빌드 및 배포

```bash
cd frontend
npm run build

# 빌드된 파일은 frontend/dist에 생성됨
# 정적 파일 서버나 CDN에 업로드
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 권한 확인
mysql -u logical_user -p
SHOW GRANTS;
```

### PHP 오류

```bash
# PHP 버전 확인
php -v

# 필요한 확장 설치
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json
```

### CORS 오류

백엔드 `config/config.php`에서 CORS 설정 확인:
```php
header('Access-Control-Allow-Origin: *');
```

프로덕션에서는 특정 도메인만 허용:
```php
header('Access-Control-Allow-Origin: https://your-frontend-domain.com');
```

### Moodle 연동 오류

```bash
# 연결 테스트
curl -X POST "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

## 개발 팁

### Hot Reload 활성화

프론트엔드는 Vite를 사용하므로 자동 리로드가 지원됩니다.

백엔드 변경사항을 적용하려면 PHP 서버를 재시작하세요.

### 디버깅

```bash
# 백엔드 로그 확인
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# 브라우저 개발자 도구 활용
# Chrome DevTools → Network 탭에서 API 요청 확인
```

### 데이터베이스 초기화

```bash
# 전체 데이터베이스 재생성
mysql -u root -p -e "DROP DATABASE IF EXISTS logical_linker;"
mysql -u root -p -e "CREATE DATABASE logical_linker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p logical_linker < database/schema.sql
```

## 지원

문제가 발생하면 다음을 확인하세요:

1. 서버 로그 (`backend/logs/`)
2. 브라우저 콘솔
3. 네트워크 탭 (API 응답 확인)
4. 데이터베이스 연결 상태

추가 도움이 필요하면 이슈를 등록해주세요.
