# Balance Machine 설치 가이드

## 빠른 시작 (Docker 사용)

가장 쉬운 방법은 Docker Compose를 사용하는 것입니다.

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 필요한 값 설정:
```env
DB_PASSWORD=your_secure_password
MOODLE_API_URL=http://your-moodle-site.com/webservice/rest/server.php
MOODLE_TOKEN=your_moodle_token
```

### 3. Docker Compose로 실행

```bash
docker-compose up -d
```

### 4. 접속

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001
- MySQL: localhost:3306

## 수동 설치

### 사전 요구사항

- Node.js 18 이상
- MySQL 5.7
- npm 또는 yarn

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE balance_machine;

# 스키마 적용
USE balance_machine;
SOURCE database/schema.sql;

# 샘플 데이터 삽입 (선택사항)
SOURCE database/seed.sql;
```

### 2. 백엔드 설치 및 실행

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 개발 서버 실행
npm run dev

# 또는 프로덕션 빌드
npm run build
npm start
```

### 3. 프론트엔드 설치 및 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 API URL 입력

# 개발 서버 실행
npm run dev

# 또는 프로덕션 빌드
npm run build
npm run preview
```

## 검증

### 1. 백엔드 Health Check

```bash
curl http://localhost:3001/health
```

예상 응답:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Balance Machine API"
}
```

### 2. 문제 목록 조회

```bash
curl http://localhost:3001/api/problems
```

### 3. 프론트엔드 접속

브라우저에서 http://localhost:5173 접속

## 프로덕션 배포

### 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수를 반드시 설정하세요:

```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=strong-password
SESSION_SECRET=random-secret-key
CORS_ORIGIN=https://your-domain.com
```

### 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/dist/` 디렉토리에 생성됩니다.
이를 Nginx, Apache 등의 웹 서버로 서빙하세요.

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 문제 해결

### 데이터베이스 연결 실패

**증상:** `Database connection failed`

**해결:**
1. MySQL이 실행 중인지 확인
2. `.env`의 DB 정보가 올바른지 확인
3. 데이터베이스와 사용자가 생성되었는지 확인

```bash
# MySQL 상태 확인
systemctl status mysql

# 또는 Docker
docker-compose ps mysql
```

### 포트 충돌

**증상:** `Port 3001 already in use`

**해결:**
1. 다른 애플리케이션이 해당 포트를 사용 중인지 확인
2. `.env`에서 다른 포트로 변경

```bash
# 포트 사용 확인
lsof -i :3001
```

### npm 의존성 오류

**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 개발 팁

### 핫 리로드

개발 모드에서는 코드 변경 시 자동으로 재시작됩니다:

```bash
# 백엔드 (tsx watch)
cd backend
npm run dev

# 프론트엔드 (Vite)
cd frontend
npm run dev
```

### 데이터베이스 리셋

```bash
# Docker 사용 시
docker-compose down -v
docker-compose up -d

# 수동 설치 시
mysql -u root -p balance_machine < database/schema.sql
mysql -u root -p balance_machine < database/seed.sql
```

### 로그 확인

```bash
# Docker 로그
docker-compose logs -f backend
docker-compose logs -f frontend

# 백엔드 로그 (수동 실행 시)
# 콘솔에 실시간으로 출력됨
```

## 다음 단계

- [Moodle 연동 설정](./moodle-integration.md)
- [API 문서](../README.md#api-엔드포인트)
- [사용자 가이드](./user-guide.md)
