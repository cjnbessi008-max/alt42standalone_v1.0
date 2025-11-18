# Alt42 Standalone 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **Node.js**: 14.x 이상
- **MySQL**: 5.7
- **npm**: 6.x 이상

### Moodle 연동 시 (선택사항)
- **PHP**: 7.1.9
- **Moodle**: 3.7

---

## 설치 단계

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

MySQL에 로그인하여 데이터베이스와 사용자를 생성합니다:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE alt42_standalone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alt42_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON alt42_standalone.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경변수 파일 생성
cp .env.example .env

# .env 파일을 편집하여 데이터베이스 정보 입력
# nano .env 또는 원하는 에디터 사용
```

#### .env 파일 설정

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=alt42_standalone
DB_USER=alt42_user
DB_PASSWORD=your_secure_password

CORS_ORIGIN=http://localhost:3000
```

#### 데이터베이스 마이그레이션 및 시드

```bash
# 테이블 생성
npm run migrate

# 샘플 데이터 삽입
npm run seed
```

#### 백엔드 서버 시작

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 또는 프로덕션 모드
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 4. 프론트엔드 설정

새 터미널 창을 열고:

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

브라우저가 자동으로 열리고 `http://localhost:3000`에 접속됩니다.

---

## Moodle 연동 (선택사항)

### 1. Moodle 플러그인 설치

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/your/moodle

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/moodle-plugin/mod_alt42 ./mod/

# 파일 권한 설정
chown -R www-data:www-data mod/alt42
```

### 2. Moodle 관리자 페이지에서 플러그인 활성화

1. Moodle 관리자로 로그인
2. `Site administration` > `Notifications` 접속
3. Alt42 플러그인 설치 확인 및 업그레이드

### 3. Moodle 웹서비스 설정

#### 웹서비스 활성화

1. `Site administration` > `Advanced features`
2. "Enable web services" 체크
3. 저장

#### 외부 서비스 생성

1. `Site administration` > `Server` > `Web services` > `External services`
2. "Add" 클릭
3. 다음 정보 입력:
   - Name: `Alt42 Integration`
   - Short name: `alt42_integration`
   - Enabled: 체크

#### 토큰 생성

1. `Site administration` > `Server` > `Web services` > `Manage tokens`
2. "Create token" 클릭
3. 사용자 선택 및 서비스(`Alt42 Integration`) 선택
4. 생성된 토큰을 복사

#### 백엔드 .env 파일에 Moodle 정보 추가

```env
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here
```

---

## 동작 확인

### 1. 백엔드 Health Check

```bash
curl http://localhost:3001/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T...",
  "service": "Alt42 Backend API"
}
```

### 2. 프론트엔드 접속

브라우저에서 `http://localhost:3000` 접속

- 우측 하단에 가상 스마트폰이 표시되어야 함
- "새 문제 시작" 버튼 클릭하여 테스트

### 3. 타임라인 동작 확인

1. 가상 스마트폰에서 "새 문제 시작" 클릭
2. 문제가 표시되면 풀이 진행
3. 왼쪽 패널에서 타임라인이 실시간으로 업데이트되는지 확인

---

## 문제 해결

### 데이터베이스 연결 실패

**증상:** `Database connection failed` 에러

**해결방법:**
1. MySQL 서비스 실행 확인: `sudo systemctl status mysql`
2. .env 파일의 데이터베이스 정보 확인
3. 사용자 권한 확인

### 포트 충돌

**증상:** `Port 3001 already in use` 에러

**해결방법:**
1. 다른 프로세스 종료: `lsof -ti:3001 | xargs kill -9`
2. 또는 .env에서 다른 포트 사용

### CORS 에러

**증상:** 프론트엔드에서 API 호출 시 CORS 에러

**해결방법:**
1. 백엔드 .env에서 `CORS_ORIGIN` 확인
2. 프론트엔드 URL과 일치하는지 확인

---

## 프로덕션 배포

### 백엔드

```bash
cd backend

# 프로덕션 의존성만 설치
npm install --production

# PM2로 실행 (권장)
npm install -g pm2
pm2 start src/index.js --name alt42-backend
pm2 save
pm2 startup
```

### 프론트엔드

```bash
cd frontend

# 프로덕션 빌드
npm run build

# Nginx 또는 Apache로 build 폴더 서빙
# 또는 serve 패키지 사용
npx serve -s build -l 3000
```

### 환경변수 설정

프로덕션 .env 파일:

```env
NODE_ENV=production
PORT=3001

DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password

MOODLE_URL=https://your-production-moodle.com
MOODLE_TOKEN=your_production_token

CORS_ORIGIN=https://your-production-domain.com
```

---

## 추가 리소스

- [API 문서](./API.md)
- [README](../README.md)
- [Moodle 문서](https://docs.moodle.org/)

## 지원

문제가 발생하면 GitHub Issues에 문의하세요.
