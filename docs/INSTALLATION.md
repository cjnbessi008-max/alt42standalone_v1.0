# 설치 가이드 (Installation Guide)

이 문서는 부분합 흐름 시각화 시스템의 상세 설치 방법을 안내합니다.

## 📋 사전 요구사항

### 필수 소프트웨어

- **Node.js**: 18.0 이상
- **PHP**: 7.1.9 (Moodle 3.7 호환)
- **MySQL**: 5.7
- **npm**: 9.0 이상
- **Git**: 2.0 이상

### 선택 사항

- **Docker**: 24.0 이상 (Docker를 사용한 설치 시)
- **Docker Compose**: 2.0 이상

## 🚀 설치 방법

### 옵션 1: Docker를 사용한 설치 (권장)

가장 쉽고 빠른 설치 방법입니다.

#### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

#### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일 내용은 기본값으로 Docker 설정과 호환됩니다.

#### 3. Docker Compose 실행

```bash
docker-compose up -d
```

이 명령은 다음 서비스들을 시작합니다:
- MySQL 5.7 (포트 3306)
- PHP 7.1.9 + Apache (포트 8080)
- Node.js Frontend (포트 3000)

#### 4. 데이터베이스 초기화

```bash
# MySQL 컨테이너에 접속
docker exec -it partialsum_mysql mysql -u root -proot moodle

# 또는 자동으로 스키마가 적용됩니다
```

#### 5. 애플리케이션 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api

### 옵션 2: 로컬 설치 (수동)

#### 1. 저장소 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

#### 2. MySQL 설정

```bash
# MySQL 서비스 시작
sudo service mysql start

# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'moodle_pass';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE moodle;
SOURCE src/database/schemas/partial_sum_schema.sql;

# 종료
EXIT;
```

#### 3. PHP 설정

**PHP 7.1.9 설치:**

Ubuntu/Debian:
```bash
sudo add-apt-repository ppa:ondrej/php
sudo apt-get update
sudo apt-get install php7.1 php7.1-mysql php7.1-mbstring php7.1-xml
```

macOS (Homebrew):
```bash
brew install php@7.1
brew link php@7.1
```

**필수 PHP 확장 확인:**
```bash
php -m | grep -E 'pdo|mysqli|mbstring'
```

#### 4. 환경 변수 설정

```bash
cp .env.example .env
nano .env  # 또는 원하는 에디터 사용
```

`.env` 파일 수정:
```env
DB_HOST=localhost
DB_NAME=moodle
DB_USER=moodle_user
DB_PASS=moodle_pass
MOODLE_PREFIX=mdl_
```

#### 5. Frontend 설치

```bash
# Node.js 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

Frontend는 http://localhost:3000에서 실행됩니다.

#### 6. Backend API 시작

새 터미널 창에서:

```bash
cd src/backend
php -S localhost:8080
```

Backend API는 http://localhost:8080/api에서 접근 가능합니다.

## 🔧 Moodle 연동 설정

### 1. 기존 Moodle 데이터베이스 사용

이미 Moodle 3.7이 설치되어 있다면:

```bash
# .env 파일 수정
DB_HOST=your-moodle-db-host
DB_NAME=your-moodle-db-name
DB_USER=your-moodle-db-user
DB_PASS=your-moodle-db-password
MOODLE_PREFIX=mdl_  # Moodle 테이블 prefix
```

### 2. 테이블 생성

Moodle 데이터베이스에 부분합 테이블 추가:

```bash
mysql -u your-moodle-db-user -p your-moodle-db-name < src/database/schemas/partial_sum_schema.sql
```

### 3. 샘플 사용자 생성

테스트를 위해 Moodle 관리 페이지에서 사용자를 생성하거나, 기존 사용자를 사용하세요.

## ✅ 설치 확인

### 1. 데이터베이스 확인

```bash
mysql -u moodle_user -p moodle

# 테이블 확인
SHOW TABLES LIKE '%partialsum%';

# 샘플 데이터 확인
SELECT * FROM mdl_partialsum_problems;
```

예상 출력:
```
+----+-------------+------------------+------------------+-------------+-----------------+------------------+------------+---------------------+---------------------+---------+
| id | question_id | title            | description      | data_array  | expected_answer | difficulty_level | created_by | created_at          | updated_at          | deleted |
+----+-------------+------------------+------------------+-------------+-----------------+------------------+------------+---------------------+---------------------+---------+
|  1 | NULL        | 부분합 문제 1... | ...              | [1,2,3,4,5] | 15              | easy             | 2          | 2025-11-18 10:00:00 | 2025-11-18 10:00:00 | 0       |
+----+-------------+------------------+------------------+-------------+-----------------+------------------+------------+---------------------+---------------------+---------+
```

### 2. Backend API 확인

```bash
curl http://localhost:8080/api/problems
```

첫 API 호출은 인증 오류(401)를 반환해야 합니다:
```json
{"error": "Unauthorized"}
```

### 3. Frontend 확인

브라우저에서 http://localhost:3000 접속

다음이 표시되어야 합니다:
- "부분합 흐름 시각화 시스템" 제목
- 문제 선택 드롭다운 (데모 모드)
- 우측 하단에 가상 스마트폰 디스플레이

## 🎯 테스트 데이터 추가

### 샘플 문제 추가

```sql
USE moodle;

INSERT INTO mdl_partialsum_problems
  (title, description, data_array, expected_answer, difficulty_level, created_by)
VALUES
  ('테스트 문제', '배열 [2,4,6,8,10]의 부분합을 계산하세요', '[2,4,6,8,10]', 30, 'easy', 2);
```

### 테스트 사용자 추가

Moodle이 설치되어 있다면 Moodle 관리 페이지에서 사용자를 추가하세요.

독립 실행 모드라면 `mdl_user` 테이블에 직접 추가:

```sql
INSERT INTO mdl_user
  (username, password, firstname, lastname, email, deleted, suspended)
VALUES
  ('student1', '$2y$10$...bcrypt-hash...', '학생', '일', 'student1@example.com', 0, 0);
```

비밀번호 해시 생성:
```php
<?php
echo password_hash('password123', PASSWORD_BCRYPT);
?>
```

## 🐛 일반적인 문제 해결

### 문제 1: MySQL 연결 실패

**증상:**
```
Error: Database connection failed
```

**해결 방법:**
1. MySQL 서비스 확인:
   ```bash
   sudo service mysql status
   sudo service mysql start
   ```

2. 연결 정보 확인:
   ```bash
   mysql -u moodle_user -p
   # 비밀번호 입력
   ```

3. `.env` 파일의 DB 설정 재확인

### 문제 2: PHP PDO 확장 없음

**증상:**
```
Fatal error: Uncaught Error: Class 'PDO' not found
```

**해결 방법:**
```bash
# Ubuntu/Debian
sudo apt-get install php7.1-mysql

# macOS
brew install php@7.1

# 확인
php -m | grep pdo
```

### 문제 3: npm install 실패

**증상:**
```
npm ERR! code ERESOLVE
```

**해결 방법:**
```bash
# npm 캐시 클리어
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 또는 레거시 의존성 해결 사용
npm install --legacy-peer-deps
```

### 문제 4: CORS 오류

**증상:**
```
Access to fetch blocked by CORS policy
```

**해결 방법:**

`src/backend/api/index.php` 파일 상단 확인:
```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
```

### 문제 5: Port 이미 사용 중

**증상:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결 방법:**

포트 사용 프로세스 확인:
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

또는 다른 포트 사용:
```bash
npm run dev -- --port 3001
```

## 📦 Production 배포

### 1. Frontend 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 2. Apache 설정

```bash
sudo nano /etc/apache2/sites-available/partialsum.conf
```

```apache
<VirtualHost *:80>
    ServerName partialsum.yourdomain.com
    DocumentRoot /var/www/alt42standalone_v1.0/dist

    <Directory /var/www/alt42standalone_v1.0/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    Alias /api /var/www/alt42standalone_v1.0/src/backend/api
    <Directory /var/www/alt42standalone_v1.0/src/backend/api>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

활성화:
```bash
sudo a2ensite partialsum
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### 3. 보안 설정

**JWT Secret 변경:**

`.env` 파일에서:
```env
JWT_SECRET=your-very-long-random-secret-key-min-32-characters
```

**파일 권한 설정:**
```bash
chmod 600 .env
chmod 644 src/backend/api/*.php
chmod 755 dist/
```

## 🔄 업데이트

### Git Pull로 업데이트

```bash
git pull origin main

# 의존성 업데이트
npm install

# 데이터베이스 마이그레이션 (필요시)
mysql -u moodle_user -p moodle < src/database/migrations/latest.sql

# 재빌드
npm run build
```

## 📞 지원

설치 중 문제가 발생하면:

1. 이 문서의 "일반적인 문제 해결" 섹션 확인
2. GitHub Issues 확인: https://github.com/your-org/alt42standalone_v1.0/issues
3. 새 이슈 생성: 오류 메시지, 환경 정보 포함

---

**설치가 완료되었습니다!** 🎉

이제 http://localhost:3000에서 애플리케이션을 사용할 수 있습니다.
