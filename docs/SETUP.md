# Setup Guide - Term Motion

## 목차

1. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
2. [Docker 환경 설정](#docker-환경-설정)
3. [Moodle 연동](#moodle-연동)
4. [문제 해결](#문제-해결)

## 로컬 개발 환경 설정

### 1. Node.js 설치

Node.js 18 이상이 필요합니다.

```bash
# 버전 확인
node --version
npm --version
```

### 2. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

### 3. PHP 환경 설정

PHP 7.1.9와 MySQL 5.7이 필요합니다.

```bash
# PHP 버전 확인
php --version

# MySQL 버전 확인
mysql --version
```

### 4. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 초기화
source database/schema.sql
```

### 5. Backend 설정

```bash
cd backend

# PHP 내장 서버로 실행
php -S localhost:8080
```

## Docker 환경 설정

### 1. Docker 설치 확인

```bash
docker --version
docker-compose --version
```

### 2. 컨테이너 실행

```bash
# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 시작
docker-compose up -d mysql
docker-compose up -d php
docker-compose up -d frontend
```

### 3. 컨테이너 관리

```bash
# 상태 확인
docker-compose ps

# 중지
docker-compose stop

# 재시작
docker-compose restart

# 완전 삭제 (데이터 포함)
docker-compose down -v
```

### 4. 데이터베이스 접속

```bash
# MySQL 컨테이너 접속
docker-compose exec mysql mysql -u root -p

# 비밀번호: root_password
```

## Moodle 연동

### 1. Moodle 설정

Moodle 3.7 설치 및 설정:

```bash
# Moodle 데이터베이스 정보 확인
# config.php에서 $CFG->dbhost, $CFG->dbname 확인
```

### 2. 환경 변수 설정

`backend/config/database.php` 수정:

```php
define('MOODLE_DB_HOST', 'your_moodle_db_host');
define('MOODLE_DB_NAME', 'your_moodle_db_name');
define('MOODLE_DB_USER', 'your_moodle_db_user');
define('MOODLE_DB_PASS', 'your_moodle_db_password');
```

### 3. Moodle 플러그인 설치 (옵션)

Term Motion을 Moodle 활동 모듈로 추가하려면:

```bash
# Moodle 플러그인 디렉토리로 복사
cp -r moodle-plugin /path/to/moodle/mod/termmotion

# Moodle 관리자 페이지에서 플러그인 설치
```

### 4. API 키 설정

Moodle Web Services 활성화:

1. Site administration → Advanced features
2. Enable web services 체크
3. Web service token 생성
4. frontend/.env에 토큰 추가

```env
VITE_MOODLE_TOKEN=your_moodle_token
```

## 문제 해결

### Frontend 빌드 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### Backend API 연결 실패

1. CORS 설정 확인
   - `backend/config/config.php`의 CORS 헤더 확인

2. PHP 확장 모듈 확인
   ```bash
   php -m | grep pdo
   php -m | grep mysql
   ```

3. Apache .htaccess 설정
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^api/(.*)$ api/$1.php [L]
   ```

### MySQL 연결 오류

1. 연결 정보 확인
   ```bash
   mysql -h localhost -u termmotion_user -p
   ```

2. 권한 확인
   ```sql
   SHOW GRANTS FOR 'termmotion_user'@'localhost';
   ```

3. 포트 충돌
   ```bash
   # 3306 포트 사용 중인 프로세스 확인
   lsof -i :3306
   ```

### Docker 포트 충돌

```bash
# 다른 포트로 변경
# docker-compose.yml 수정
ports:
  - "3001:3000"  # Frontend
  - "8081:80"    # Backend
  - "3307:3306"  # MySQL
```

### 애니메이션이 작동하지 않음

1. Framer Motion 설치 확인
   ```bash
   npm list framer-motion
   ```

2. 브라우저 콘솔 에러 확인

3. React StrictMode 비활성화 (개발 중)
   ```tsx
   // main.tsx
   root.render(<App />)  // StrictMode 제거
   ```

### 데이터베이스 초기화

```bash
# Docker 환경
docker-compose down -v
docker-compose up -d

# 로컬 환경
mysql -u root -p termmotion < database/schema.sql
```

## 개발 팁

### Hot Reload 설정

Frontend는 자동으로 Hot Reload가 됩니다. Backend PHP 파일 수정 시 새로고침 필요.

### 디버깅

Frontend:
```bash
# Chrome DevTools 사용
# React Developer Tools 설치 권장
```

Backend:
```php
// 에러 로그 확인
error_log("Debug: " . print_r($data, true));
tail -f /var/log/php_errors.log
```

### 성능 최적화

1. Frontend 빌드 최적화
   ```bash
   npm run build
   # dist/ 디렉토리 확인
   ```

2. MySQL 인덱스 확인
   ```sql
   EXPLAIN SELECT * FROM problems WHERE category = 'algebra';
   ```

## 추가 리소스

- [React 공식 문서](https://react.dev)
- [Framer Motion 문서](https://www.framer.com/motion/)
- [Moodle 개발자 문서](https://docs.moodle.org)
- [MySQL 5.7 문서](https://dev.mysql.com/doc/refman/5.7/en/)

## 지원

문제가 계속되면 GitHub Issues에 등록해주세요.
