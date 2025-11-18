# Edge Melody 설치 가이드

## 시스템 요구사항

### 백엔드
- PHP 7.1.9 이상
- MySQL 5.7
- Apache 2.4 (mod_rewrite 필요)
- PDO MySQL 확장

### 프론트엔드
- Node.js 18 이상
- npm 또는 yarn

---

## 설치 방법

### 1. Docker를 사용한 설치 (권장)

#### 전제조건
- Docker 20.10 이상
- Docker Compose 1.29 이상

#### 설치 단계

```bash
# 1. 저장소 클론
git clone <repository-url>
cd edge-melody

# 2. 환경 변수 설정
cd frontend
cp .env.example .env
cd ..

# 3. Docker Compose로 실행
docker-compose up -d

# 4. 서비스 확인
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api
# MySQL: localhost:3306
```

#### 서비스 중지
```bash
docker-compose down
```

#### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f frontend
docker-compose logs -f backend
```

---

### 2. 수동 설치

#### 백엔드 설정

##### 2.1. MySQL 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

##### 2.2. Moodle 데이터베이스 연결

기존 Moodle 3.7 데이터베이스를 사용하거나, 테스트용 데이터를 생성합니다.

```bash
# Moodle 샘플 데이터 import (선택적)
mysql -u moodle_user -p moodle < moodle_sample_data.sql
```

##### 2.3. PHP 설정

`config/database.php` 파일 수정:

```php
return [
    'host' => 'localhost',
    'port' => '3306',
    'database' => 'moodle',
    'username' => 'moodle_user',
    'password' => 'your_password',
    'charset' => 'utf8mb4',
    'prefix' => 'mdl_',
];
```

##### 2.4. Apache 설정

```apache
<VirtualHost *:8080>
    ServerName edge-melody.local
    DocumentRoot /path/to/edge-melody/backend

    <Directory /path/to/edge-melody/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/edge-melody-error.log
    CustomLog ${APACHE_LOG_DIR}/edge-melody-access.log combined
</VirtualHost>
```

Apache 재시작:
```bash
sudo systemctl restart apache2
```

#### 프론트엔드 설정

##### 2.5. Node.js 의존성 설치

```bash
cd frontend
npm install
```

##### 2.6. 환경 변수 설정

`.env` 파일 생성:
```bash
cp .env.example .env
```

`.env` 파일 수정:
```env
VITE_API_URL=http://localhost:8080/api
VITE_ENV=development
```

##### 2.7. 개발 서버 실행

```bash
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

---

## 프로덕션 배포

### 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist` 디렉토리에 생성됩니다.

### Apache에 배포

```bash
# 빌드 파일을 Apache 디렉토리로 복사
sudo cp -r frontend/dist/* /var/www/html/edge-melody/
```

Apache VirtualHost 설정:
```apache
<VirtualHost *:80>
    ServerName edge-melody.yourdomain.com

    DocumentRoot /var/www/html/edge-melody

    <Directory /var/www/html/edge-melody>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA 라우팅 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

---

## 트러블슈팅

### CORS 에러

백엔드 `.htaccess` 파일에 CORS 헤더가 올바르게 설정되어 있는지 확인:

```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

### 데이터베이스 연결 실패

1. MySQL 서비스 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```

2. 데이터베이스 연결 정보 확인:
   ```bash
   mysql -u moodle_user -p moodle
   ```

3. PHP PDO MySQL 확장 설치 확인:
   ```bash
   php -m | grep pdo_mysql
   ```

### API 404 에러

1. Apache mod_rewrite 활성화 확인:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. `.htaccess` 파일이 `backend` 디렉토리에 있는지 확인

### 프론트엔드 빌드 실패

Node.js 및 npm 버전 확인:
```bash
node --version  # v18 이상
npm --version   # v9 이상
```

의존성 재설치:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 테스트 데이터

Moodle 테스트 문제를 생성하려면 다음 SQL을 실행하세요:

```sql
-- 카테고리 생성
INSERT INTO mdl_question_categories (name, contextid, info, parent)
VALUES ('수학', 1, '수학 문제', 1);

-- 샘플 문제 생성
INSERT INTO mdl_question (category, name, questiontext, qtype, defaultmark, timecreated, timemodified)
VALUES (LAST_INSERT_ID(), '덧셈 문제', '5 + 3 = ?', 'multichoice', 1.0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

---

## 개발 환경 설정

### VS Code 추천 확장

- **PHP Intelephense**: PHP 자동완성
- **ESLint**: JavaScript 린팅
- **Volar**: Vue.js 지원 (React에도 유용)
- **Prettier**: 코드 포매팅

### 핫 리로드

프론트엔드는 Vite를 사용하여 자동으로 핫 리로드됩니다.
백엔드 PHP 파일 수정 시 Apache 재시작이 필요할 수 있습니다.

---

## 다음 단계

- [API 문서](./API.md) 참조
- [사용 가이드](./USAGE.md) 참조
- [기여 가이드](./CONTRIBUTING.md) 참조
