# Triple Light Stats - Deployment Guide

Moodle LMS 환경에서 Triple Light 통계 표시 시스템을 배포하는 상세 가이드입니다.

## 목차

1. [사전 준비](#사전-준비)
2. [개발 환경 설정](#개발-환경-설정)
3. [프로덕션 배포](#프로덕션-배포)
4. [Docker 배포](#docker-배포)
5. [모니터링 및 유지보수](#모니터링-및-유지보수)

---

## 사전 준비

### 시스템 요구사항

- **OS**: Ubuntu 20.04 LTS 이상 (또는 CentOS 7+, Debian 10+)
- **Node.js**: 18.x LTS
- **MySQL**: 5.7 (Moodle 데이터베이스)
- **메모리**: 최소 2GB RAM
- **디스크**: 최소 5GB 여유 공간
- **네트워크**: 80/443 포트 개방

### 필수 소프트웨어

```bash
# Node.js 18 설치 (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build tools 설치
sudo apt-get install -y build-essential

# PM2 설치 (프로세스 관리)
sudo npm install -g pm2

# Nginx 설치 (웹 서버)
sudo apt-get install -y nginx
```

---

## 개발 환경 설정

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd triple-light-stats
```

### 2. 백엔드 설정

```bash
cd backend
npm install
cp .env.example .env
```

`.env` 파일 편집:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_readonly
DB_PASSWORD=secure_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Moodle Configuration
MOODLE_PREFIX=mdl_
```

### 3. 데이터베이스 사용자 생성

Moodle MySQL에 읽기 전용 사용자 생성:

```sql
-- MySQL에 접속
mysql -u root -p

-- 읽기 전용 사용자 생성
CREATE USER 'moodle_readonly'@'localhost' IDENTIFIED BY 'secure_password_here';

-- 필요한 테이블에 SELECT 권한 부여
GRANT SELECT ON moodle.mdl_quiz TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_attempts TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_grades TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_course TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_user TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_question TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_slots TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_question_attempts TO 'moodle_readonly'@'localhost';
GRANT SELECT ON moodle.mdl_question_attempt_steps TO 'moodle_readonly'@'localhost';

FLUSH PRIVILEGES;
```

### 4. 백엔드 테스트

```bash
cd backend
npm run dev
```

브라우저에서 `http://localhost:3001/api/health` 확인

### 5. 프론트엔드 설정

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` 파일 편집:

```env
VITE_API_URL=http://localhost:3001
```

### 6. 프론트엔드 테스트

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 확인

---

## 프로덕션 배포

### 1. 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드 파일 확인:
```bash
ls -la dist/
```

### 2. 배포 디렉토리 생성

```bash
sudo mkdir -p /var/www/triple-light-stats
sudo chown -R $USER:$USER /var/www/triple-light-stats
```

### 3. 프론트엔드 배포

```bash
cp -r frontend/dist/* /var/www/triple-light-stats/
```

### 4. 백엔드 배포

```bash
# 백엔드 파일 복사
mkdir -p /opt/triple-light-backend
cp -r backend/* /opt/triple-light-backend/
cd /opt/triple-light-backend

# 프로덕션 의존성 설치
npm install --production

# 환경 변수 설정
cp .env.example .env
nano .env
```

프로덕션 `.env` 설정:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_readonly
DB_PASSWORD=your_secure_password

PORT=3001
NODE_ENV=production

ALLOWED_ORIGINS=https://yourdomain.com

MOODLE_PREFIX=mdl_
```

### 5. PM2로 백엔드 실행

```bash
cd /opt/triple-light-backend

# PM2 ecosystem 파일 생성
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'triple-light-api',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 로그 디렉토리 생성
mkdir -p logs

# PM2로 시작
pm2 start ecosystem.config.js

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 6. Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/triple-light-stats
```

Nginx 설정 내용:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (SSL 설정 후)
    # return 301 https://$server_name$request_uri;

    root /var/www/triple-light-stats;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Nginx 설정 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/triple-light-stats /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## Docker 배포

### 1. Dockerfile 생성

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend Nginx 설정** (`frontend/nginx.conf`):

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 2. Docker Compose 설정

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: triple-light-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - PORT=3001
      - ALLOWED_ORIGINS=http://localhost
    ports:
      - "3001:3001"
    networks:
      - triple-light-network
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    container_name: triple-light-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    networks:
      - triple-light-network
    depends_on:
      - backend

  mysql:
    image: mysql:5.7
    container_name: triple-light-mysql
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - triple-light-network

networks:
  triple-light-network:
    driver: bridge

volumes:
  mysql-data:
```

### 3. Docker Compose 실행

``bash
# 환경 변수 파일 생성
cat > .env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_NAME=moodle
DB_USER=moodle_user
DB_PASSWORD=secure_password
MYSQL_ROOT_PASSWORD=root_password
EOF

# 컨테이너 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

---

## 모니터링 및 유지보수

### PM2 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 로그 확인
pm2 logs triple-light-api

# 재시작
pm2 restart triple-light-api

# 메모리 사용량 확인
pm2 show triple-light-api
```

### Nginx 로그

```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

### 데이터베이스 성능 모니터링

```sql
-- 느린 쿼리 확인
SHOW PROCESSLIST;

-- 테이블 인덱스 확인
SHOW INDEX FROM mdl_quiz_grades;

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM mdl_quiz_grades WHERE quiz = 1;
```

### 자동 백업

```bash
# 백업 스크립트 생성
cat > /opt/backup-triple-light.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/triple-light"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 백엔드 코드 백업
tar -czf $BACKUP_DIR/backend_$DATE.tar.gz /opt/triple-light-backend

# PM2 설정 백업
pm2 save

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backup-triple-light.sh

# Cron 작업 등록 (매일 새벽 2시)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-triple-light.sh") | crontab -
```

### 성능 최적화

**MySQL 인덱스 추가**:

```sql
-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_quiz_visible ON mdl_quiz(visible);
CREATE INDEX idx_attempts_quiz ON mdl_quiz_attempts(quiz, state);
CREATE INDEX idx_grades_quiz ON mdl_quiz_grades(quiz);
```

**Nginx 캐싱 설정**:

```nginx
# /etc/nginx/nginx.conf에 추가
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# API 캐싱 (선택적)
location /api/quizzes {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key $scheme$request_method$host$request_uri;
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://localhost:3001;
}
```

### 보안 강화

```bash
# 방화벽 설정 (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban 설치 (브루트포스 방지)
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 문제 해결 체크리스트

### 서비스가 시작되지 않을 때

1. 포트 충돌 확인:
   ```bash
   sudo lsof -i :3001
   sudo lsof -i :80
   ```

2. 로그 확인:
   ```bash
   pm2 logs
   sudo journalctl -u nginx -f
   ```

3. 환경 변수 확인:
   ```bash
   pm2 env 0
   ```

### 데이터베이스 연결 실패

1. MySQL 연결 테스트:
   ```bash
   mysql -h localhost -u moodle_readonly -p
   ```

2. 권한 확인:
   ```sql
   SHOW GRANTS FOR 'moodle_readonly'@'localhost';
   ```

### 프론트엔드 빌드 실패

1. Node 버전 확인:
   ```bash
   node --version  # 18.x 이상
   ```

2. 캐시 삭제 후 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

---

**배포 체크리스트**:

- [ ] Node.js 18+ 설치 완료
- [ ] MySQL 읽기 전용 계정 생성
- [ ] 환경 변수 (.env) 설정
- [ ] 백엔드 API 정상 동작 확인
- [ ] 프론트엔드 빌드 완료
- [ ] Nginx 설정 및 재시작
- [ ] SSL 인증서 설정 (프로덕션)
- [ ] PM2로 백엔드 프로세스 관리
- [ ] 방화벽 설정
- [ ] 백업 스크립트 등록
- [ ] 모니터링 도구 설정

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
