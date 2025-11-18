# 배포 가이드

## 목차
1. [환경 요구사항](#환경-요구사항)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [Docker를 이용한 배포](#docker를-이용한-배포)
4. [Moodle 연동 설정](#moodle-연동-설정)
5. [프로덕션 배포](#프로덕션-배포)

---

## 환경 요구사항

### 필수 소프트웨어
- **Node.js**: 18.x 이상
- **MySQL**: 5.7
- **Docker** (선택사항): 최신 버전
- **Moodle**: 3.7 이상 (Web Services 활성화)

### 개발 환경
- **운영체제**: Linux, macOS, Windows
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)
- **에디터**: VS Code (권장)

---

## 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. 데이터베이스 설정
```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 및 초기화
source database/schema.sql
source database/seed.sql
```

또는 Docker를 사용하는 경우:
```bash
docker-compose up -d mysql
```

### 4. 환경 변수 설정

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

`.env` 파일 수정:
```env
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=dtuser
DB_PASSWORD=dtpassword
DB_NAME=dynamic_tree

# Moodle
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_moodle_web_service_token
MOODLE_SERVICE=moodle_mobile_app

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**
```bash
cd frontend
```

`.env` 파일 생성:
```env
VITE_API_URL=http://localhost:3001/api
```

### 5. 개발 서버 실행

**터미널 1 - Backend**
```bash
cd backend
npm run dev
```

**터미널 2 - Frontend**
```bash
cd frontend
npm run dev
```

또는 동시에 실행:
```bash
# Root에서
npm run dev
```

### 6. 접속 확인
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/health

---

## Docker를 이용한 배포

### 1. Docker Compose로 전체 스택 실행
```bash
docker-compose up -d
```

이 명령어는 다음을 실행합니다:
- MySQL 5.7 데이터베이스
- Backend API 서버
- Frontend 개발 서버

### 2. 컨테이너 상태 확인
```bash
docker-compose ps
```

### 3. 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. 중지 및 제거
```bash
# 중지
docker-compose stop

# 완전 제거 (데이터 포함)
docker-compose down -v
```

---

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 고급 기능**으로 이동
3. "웹 서비스 활성화" 체크

### 2. 외부 서비스 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
2. "서비스 추가" 클릭
3. 서비스 이름: "Dynamic Tree Service"
4. 활성화됨: 체크

### 3. 필요한 함수 추가

다음 함수들을 서비스에 추가:
- `core_webservice_get_site_info`
- `core_course_get_contents`
- `core_course_get_courses`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_quiz_by_courses`
- `mod_quiz_get_user_attempts`
- `core_user_get_users_by_field`

### 4. 사용자 및 역할 설정

1. **사이트 관리 → 사용자 → 권한 → 역할 정의**
2. 새 역할 생성: "Web Service User"
3. 필요한 권한 부여:
   - `webservice/rest:use`
   - `moodle/course:view`
   - `mod/quiz:view`

### 5. 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자 선택
4. 서비스 선택: "Dynamic Tree Service"
5. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 설정

### 6. 연결 테스트

```bash
# Backend API를 통한 테스트
curl http://localhost:3001/api/moodle/test
```

응답 예시:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "message": "Moodle connection successful"
  }
}
```

### 7. 퀴즈에서 Dynamic Tree 설정 방법

Moodle 퀴즈 설명란(intro)에 JSON 설정 추가:

```json
{
  "type": "probability_tree",
  "levels": 3,
  "rootLabel": "시작",
  "branchLabels": ["앞면", "뒷면"],
  "branchProbabilities": [0.5, 0.5],
  "calculateOutcomes": true,
  "showProbabilities": true,
  "animation": {
    "enabled": true,
    "speed": 500,
    "expandOnClick": true
  }
}
```

### 8. 퀴즈 동기화

```bash
# API를 통해 퀴즈 동기화
curl -X POST http://localhost:3001/api/moodle/sync/[QUIZ_ID]
```

---

## 프로덕션 배포

### 1. 환경 변수 설정

**Backend (.env.production)**
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=dynamic_tree
MOODLE_URL=https://your-moodle-production.com
MOODLE_TOKEN=your-production-token
CORS_ORIGIN=https://your-domain.com
```

### 2. 빌드

```bash
# Backend 빌드
cd backend
npm run build

# Frontend 빌드
cd frontend
npm run build
```

### 3. 프로덕션 서버 실행

**Backend**
```bash
cd backend
npm start
```

**Frontend (정적 파일 서빙)**

Nginx 설정 예시:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
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

### 4. PM2를 이용한 프로세스 관리

```bash
# PM2 설치
npm install -g pm2

# Backend 시작
cd backend
pm2 start dist/server.js --name dynamic-tree-backend

# 자동 재시작 설정
pm2 startup
pm2 save
```

### 5. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d your-domain.com
```

### 6. 모니터링 설정

**Backend 헬스체크 엔드포인트**
```
GET /health
```

**PM2 모니터링**
```bash
pm2 monit
```

### 7. 백업 전략

**데이터베이스 백업**
```bash
# 일일 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -u user -p dynamic_tree > backup_$DATE.sql
```

**Cron 작업 설정**
```bash
# 매일 새벽 2시에 백업
0 2 * * * /path/to/backup-script.sh
```

---

## 문제 해결

### Backend가 시작되지 않을 때
1. 환경 변수 확인
2. 데이터베이스 연결 확인
3. 포트 충돌 확인

```bash
# 포트 사용 확인
lsof -i :3001
```

### Moodle 연결 실패
1. MOODLE_URL이 올바른지 확인
2. MOODLE_TOKEN이 유효한지 확인
3. Moodle Web Services가 활성화되어 있는지 확인
4. 방화벽 설정 확인

### 데이터베이스 연결 오류
1. MySQL 서비스 실행 확인
```bash
sudo service mysql status
```
2. 데이터베이스 및 사용자 권한 확인
```sql
SHOW DATABASES;
SHOW GRANTS FOR 'dtuser'@'localhost';
```

---

## 보안 체크리스트

- [ ] 환경 변수 파일(.env)이 버전 관리에서 제외되어 있는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] HTTPS 사용 (프로덕션)
- [ ] CORS 설정이 특정 도메인으로 제한되어 있는지 확인
- [ ] SQL Injection 방지 (Parameterized queries 사용)
- [ ] Rate limiting 설정
- [ ] 정기적인 보안 업데이트

---

## 추가 리소스

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Production Deployment](https://reactjs.org/docs/optimizing-performance.html)
- [MySQL Security](https://dev.mysql.com/doc/refman/5.7/en/security.html)

---

문제가 발생하면 GitHub Issues에 보고해주세요.
