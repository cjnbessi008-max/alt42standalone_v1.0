# Place Stair 설치 가이드

## 빠른 시작 (Quick Start)

### 1. 프로젝트 클론

```bash
cd /path/to/your/workspace
git clone <repository-url>
cd place-stair-app
```

### 2. Backend 설정

```bash
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
nano .env  # 또는 선호하는 에디터로 편집
```

**`.env` 파일 수정:**

```env
PORT=3001
NODE_ENV=development

# Moodle 없이 독립 실행하는 경우 아래 항목은 선택사항
DB_HOST=localhost
DB_PORT=3306
DB_NAME=moodle
DB_USER=your_username
DB_PASSWORD=your_password

MOODLE_URL=http://your-moodle-url
MOODLE_API_TOKEN=your_api_token

CORS_ORIGIN=http://localhost:3000
```

### 3. Frontend 설정

```bash
cd ../frontend
npm install
```

### 4. 실행

**두 개의 터미널을 열어서:**

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

출력 예시:
```
✅ Place Stair Backend API running on port 3001
📚 Environment: development
🔗 Moodle URL: http://localhost/moodle
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

출력 예시:
```
  VITE v4.4.9  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 5. 브라우저에서 확인

`http://localhost:3000` 접속

---

## Moodle LMS 연동 설정

### Moodle Web Service 설정

1. **Moodle 관리자 페이지 접속**
   - `Site administration` → `Plugins` → `Web services` → `Manage protocols`
   - REST protocol 활성화

2. **Web Service 생성**
   - `Site administration` → `Plugins` → `Web services` → `External services`
   - `Add` 클릭
   - Name: "Place Stair Service"
   - Enabled: ✓
   - Authorized users only: ✓

3. **필요한 함수 추가**

   다음 커스텀 함수들을 Moodle에 구현해야 합니다:

   ```php
   // local/placeStair/externallib.php

   class local_placeStair_external extends external_api {

       /**
        * Get problems for student
        */
       public static function get_problems($studentid, $courseid) {
           // 구현 코드
       }

       /**
        * Submit student answer
        */
       public static function submit_answer($studentid, $problemid, $answer, $iscorrect, $timespent) {
           // 구현 코드
       }

       /**
        * Get student progress
        */
       public static function get_progress($studentid, $courseid) {
           // 구현 코드
       }
   }
   ```

4. **API 토큰 생성**
   - `Site administration` → `Plugins` → `Web services` → `Manage tokens`
   - `Add` 클릭
   - User 선택
   - Service: "Place Stair Service"
   - 생성된 토큰을 복사하여 `.env` 파일의 `MOODLE_API_TOKEN`에 입력

### MySQL 데이터베이스 설정

Moodle이 사용하는 MySQL 데이터베이스에 접근 권한이 필요합니다.

```sql
-- MySQL에 로그인
mysql -u root -p

-- 데이터베이스 확인
SHOW DATABASES;

-- Place Stair용 사용자 생성 (선택사항)
CREATE USER 'placeStair_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE ON moodle.* TO 'placeStair_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 독립 실행 모드 (Moodle 없이)

Moodle 연동 없이 앱만 실행하려면:

1. **Backend `.env` 설정 간소화:**

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Moodle 관련 설정은 비워두거나 삭제
```

2. **문제 자동 생성 사용**

앱은 자동으로 로컬에서 문제를 생성합니다. Moodle API 호출이 실패하면 자동으로 `problemGenerator`를 사용합니다.

---

## 프로덕션 배포

### Docker를 이용한 배포 (추천)

**Dockerfile 생성 (Backend):**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**Dockerfile 생성 (Frontend):**

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
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**실행:**

```bash
docker-compose up -d
```

### 일반 서버 배포

**Backend:**

```bash
cd backend
npm run build
pm2 start dist/index.js --name place-stair-backend
```

**Frontend:**

```bash
cd frontend
npm run build
# dist/ 폴더를 Nginx 또는 Apache 서버에 배포
```

**Nginx 설정 예시:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/place-stair/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

---

## 문제 해결 (Troubleshooting)

### Backend 시작 실패

**증상:** `Error: listen EADDRINUSE: address already in use :::3001`

**해결:**
```bash
# 포트를 사용 중인 프로세스 찾기
lsof -ti:3001

# 프로세스 종료
kill -9 $(lsof -ti:3001)

# 또는 .env에서 다른 포트 사용
PORT=3002
```

### Frontend 빌드 오류

**증상:** `Module not found` 또는 type errors

**해결:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Moodle 연결 실패

**증상:** `Error fetching problems from Moodle`

**해결:**
1. Moodle URL이 올바른지 확인
2. API 토큰이 유효한지 확인
3. Web Service가 활성화되어 있는지 확인
4. 네트워크 연결 확인:
   ```bash
   curl http://your-moodle-url/webservice/rest/server.php?wstoken=YOUR_TOKEN
   ```

### CORS 오류

**증상:** `Access to XMLHttpRequest has been blocked by CORS policy`

**해결:**

Backend `.env` 확인:
```env
CORS_ORIGIN=http://localhost:3000
```

또는 여러 origin 허용:
```typescript
// backend/src/index.ts
app.use(cors({
  origin: ['http://localhost:3000', 'http://your-domain.com'],
  credentials: true
}));
```

---

## 성능 최적화

### Backend 최적화

```typescript
// 캐싱 추가
import NodeCache from 'node-cache';
const problemCache = new NodeCache({ stdTTL: 600 }); // 10분

router.get('/generate', (req, res) => {
  const cacheKey = JSON.stringify(req.query);
  const cached = problemCache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  // Generate problems...
  problemCache.set(cacheKey, result);
  res.json(result);
});
```

### Frontend 최적화

```typescript
// React.memo로 불필요한 리렌더링 방지
export default React.memo(PlaceStair);

// 이미지 lazy loading
<img loading="lazy" src="..." alt="..." />
```

---

## 보안 고려사항

1. **환경 변수 보호**
   - `.env` 파일은 절대 Git에 커밋하지 않기
   - 프로덕션에서는 환경 변수를 서버 설정으로 관리

2. **API 인증**
   - 프로덕션에서는 JWT 토큰 기반 인증 구현 추천

3. **입력 검증**
   - 모든 사용자 입력은 서버에서 검증
   - SQL Injection 방지를 위해 prepared statements 사용

---

## 추가 리소스

- [React 공식 문서](https://react.dev/)
- [Express.js 가이드](https://expressjs.com/)
- [Moodle Web Services](https://docs.moodle.org/dev/Web_services)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

문제가 계속되면 GitHub Issues에 문의해주세요.
