# 배포 가이드

## Docker를 사용한 배포

### 1. Docker 이미지 빌드

#### 백엔드

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### 프론트엔드

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 3. 실행

```bash
docker-compose up -d
```

## 클라우드 배포

### AWS (Elastic Beanstalk)

1. EB CLI 설치
```bash
pip install awsebcli
```

2. 초기화
```bash
eb init
```

3. 배포
```bash
eb create confusion-tracking-env
eb deploy
```

### Google Cloud Platform (App Engine)

```yaml
# app.yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
```

```bash
gcloud app deploy
```

### Vercel (프론트엔드)

```bash
cd frontend
vercel --prod
```

### Railway (풀스택)

```bash
railway login
railway init
railway up
```

## 환경 변수 설정

프로덕션 환경에서 다음 환경 변수를 설정하세요:

### 백엔드
- `PORT`: 서버 포트 (기본: 5000)
- `NODE_ENV`: production
- `ALLOWED_ORIGINS`: CORS 허용 도메인
- `LMS_API_KEY`: LMS API 키
- `SESSION_SECRET`: 세션 암호화 키

### 프론트엔드
- `VITE_API_URL`: 백엔드 API URL
- `VITE_WS_URL`: WebSocket URL
- `VITE_LMS_PLATFORM`: 사용하는 LMS 플랫폼

## 성능 최적화

### 1. 프론트엔드 최적화
- Vite 빌드 최적화 활성화
- 청크 분할 설정
- 이미지 최적화
- CDN 사용

### 2. 백엔드 최적화
- Redis 캐싱 추가
- 데이터베이스 인덱싱
- 로드 밸런싱
- PM2를 통한 클러스터링

```bash
npm install -g pm2
pm2 start dist/index.js -i max
```

## 모니터링

### 로그 수집
- CloudWatch (AWS)
- Stackdriver (GCP)
- Papertrail
- Datadog

### 성능 모니터링
- New Relic
- AppDynamics
- Prometheus + Grafana

## 보안

### SSL/TLS 인증서
- Let's Encrypt 사용
- Cloudflare SSL

### 방화벽 규칙
- 필요한 포트만 개방
- DDoS 보호 활성화

### API 레이트 리미팅
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```
