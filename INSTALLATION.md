# 설치 가이드

## 📋 필수 요구사항

- **Node.js** 18 이상
- **Docker** 및 **Docker Compose**
- **Moodle 3.7** (MySQL 5.7, PHP 7.1.9)
- **Git**

## 🚀 빠른 시작 (Docker 사용)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어서 Moodle 데이터베이스 연결 정보를 입력하세요:

```env
MOODLE_DB_HOST=your_moodle_host
MOODLE_DB_PORT=3306
MOODLE_DB_USER=relaxation_ro
MOODLE_DB_PASSWORD=your_password
MOODLE_DB_NAME=moodle
JWT_SECRET=change_this_to_random_secret
```

### 3. Moodle 데이터베이스 준비

Moodle MySQL에 읽기 전용 사용자를 생성하세요:

```sql
CREATE USER 'relaxation_ro'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON moodle.* TO 'relaxation_ro'@'%';
FLUSH PRIVILEGES;
```

### 4. Docker Compose로 실행

```bash
docker-compose up -d
```

이 명령은 다음 서비스들을 시작합니다:
- PostgreSQL (포트 5432)
- Backend API (포트 4000)
- Frontend Web App (포트 3000)

### 5. 서비스 확인

```bash
# 모든 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# Health check
curl http://localhost:4000/api/v1/health
```

### 6. 애플리케이션 접속

브라우저에서 http://localhost:3000 으로 접속하세요.

## 🔧 개발 모드 (로컬 실행)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 설정

# PostgreSQL 실행 (Docker)
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=relaxation_db \
  -p 5432:5432 \
  postgres:15-alpine

# Prisma 마이그레이션
npx prisma migrate dev
npx prisma generate

# 개발 서버 시작
npm run dev
```

Backend는 http://localhost:4000 에서 실행됩니다.

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend는 http://localhost:3000 에서 실행됩니다.

## 📊 데이터베이스 관리

### Prisma Studio 실행

```bash
cd backend
npx prisma studio
```

http://localhost:5555 에서 데이터베이스를 GUI로 관리할 수 있습니다.

### 마이그레이션

```bash
cd backend

# 새 마이그레이션 생성
npx prisma migrate dev --name your_migration_name

# 프로덕션 마이그레이션 적용
npx prisma migrate deploy
```

## 🧪 테스트

### Backend 테스트

```bash
cd backend
npm test
```

### Frontend 테스트

```bash
cd frontend
npm test
```

## 📦 프로덕션 배포

### 1. 환경 변수 설정

`.env` 파일에서 프로덕션 설정을 구성하세요:

```env
NODE_ENV=production
JWT_SECRET=very_strong_random_secret
MOODLE_DB_HOST=production_moodle_host
# ... 기타 설정
```

### 2. Docker Compose로 배포

```bash
docker-compose up -d --build
```

### 3. Nginx 리버스 프록시 설정 (선택사항)

프로덕션 환경에서는 Nginx를 리버스 프록시로 사용하는 것을 권장합니다.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔍 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 연결 테스트
docker exec -it relaxation-postgres psql -U postgres -d relaxation_db

# Moodle MySQL 연결 테스트
mysql -h <host> -u relaxation_ro -p moodle
```

### Docker 컨테이너 재시작

```bash
docker-compose restart
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 컨테이너 완전 재구축

```bash
docker-compose down -v
docker-compose up -d --build
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
- 로그 파일: `backend/logs/`
- Health check: `http://localhost:4000/api/v1/health`
- Prisma Studio: `npx prisma studio`

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
