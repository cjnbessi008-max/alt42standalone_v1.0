# Composition Puzzle - 설치 및 설정 가이드

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [Docker를 이용한 실행](#docker를-이용한-실행)
4. [Moodle LTI 연동 설정](#moodle-lti-연동-설정)
5. [프로덕션 배포](#프로덕션-배포)
6. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 소프트웨어

- **Node.js**: 18.x 이상
- **MySQL**: 5.7 이상
- **Docker** (선택사항): 20.x 이상
- **Docker Compose** (선택사항): 2.x 이상

### 권장 환경

- OS: Ubuntu 20.04+, macOS 12+, Windows 10+
- RAM: 최소 4GB (권장 8GB)
- 저장공간: 최소 2GB

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. MySQL 데이터베이스 설정

#### MySQL 설치 (Ubuntu)

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source database/schema.sql

# 또는
mysql -u root -p < database/schema.sql
```

### 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 MySQL 연결 정보 수정

# 개발 서버 실행
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 4. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드 서버가 `http://localhost:5173`에서 실행됩니다.

### 5. 브라우저에서 확인

브라우저에서 `http://localhost:5173`을 열어 앱을 확인합니다.

---

## Docker를 이용한 실행

### 1. Docker Compose로 전체 스택 실행

```bash
# 개발 모드로 실행
docker-compose up -d mysql backend frontend-dev

# 로그 확인
docker-compose logs -f

# 종료
docker-compose down
```

### 2. 프로덕션 모드 실행

```bash
# 프로덕션 빌드
docker-compose --profile production up -d

# 종료
docker-compose --profile production down
```

### 3. 개별 서비스 재시작

```bash
# 백엔드만 재시작
docker-compose restart backend

# 프론트엔드만 재시작
docker-compose restart frontend-dev
```

---

## Moodle LTI 연동 설정

### 1. Moodle 관리자 설정

1. **Moodle 관리자로 로그인**

2. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리** 이동

3. **외부 도구 구성 추가**

   - **도구 이름**: `Composition Puzzle`
   - **도구 URL**: `http://your-server.com:3000/lti/launch`
   - **도구 설정 URL** (자동 설정용): `http://your-server.com:3000/lti/config.xml`
   - **소비자 키**: `composition_puzzle_key`
   - **공유 비밀**: (backend/.env의 LTI_SECRET 값)

4. **개인정보 보호 설정**

   - ✅ 론치 컨테이너 ID 공유
   - ✅ 사용자 ID 공유
   - ✅ 론처의 이름 공유
   - ✅ 론처의 이메일 공유
   - ✅ 성적 수락

5. **저장**

### 2. 과정에 외부 도구 활동 추가

1. 원하는 과정으로 이동

2. **편집 모드 켜기**

3. **활동 또는 리소스 추가 → 외부 도구** 선택

4. 설정:
   - **활동 이름**: 원하는 이름 (예: "합성함수 퍼즐")
   - **사전 구성된 도구**: `Composition Puzzle` 선택
   - **커스텀 파라미터** (선택사항):
     ```
     problem_id=1
     ```

5. **저장 후 표시**

### 3. LTI 연동 테스트

1. 학생 계정으로 로그인

2. 추가한 활동 클릭

3. Composition Puzzle 앱이 열리는지 확인

4. 문제를 풀고 제출

5. Moodle 성적부에 점수가 자동으로 기록되는지 확인

---

## 프로덕션 배포

### 1. 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일 수정:

```env
NODE_ENV=production
PORT=3000

# 강력한 시크릿으로 변경
LTI_SECRET=<강력한-랜덤-문자열>
SESSION_SECRET=<강력한-랜덤-문자열>

# 실제 도메인으로 변경
ALLOWED_ORIGINS=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# 프로덕션 DB 설정
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=<강력한-비밀번호>
```

### 2. HTTPS 설정 (권장)

#### Let's Encrypt 사용 (Ubuntu)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

#### nginx SSL 설정

`nginx/nginx.conf` 파일 생성:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api {
        proxy_pass http://backend:3000;
    }

    location /lti {
        proxy_pass http://backend:3000;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Docker로 프로덕션 배포

```bash
# 프로덕션 빌드 및 실행
docker-compose --profile production up -d --build

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

### 4. 보안 체크리스트

- ✅ `.env` 파일의 모든 시크릿을 강력한 값으로 변경
- ✅ HTTPS 활성화
- ✅ 데이터베이스 접근 제한 (방화벽 설정)
- ✅ 정기적인 백업 설정
- ✅ 로그 모니터링 설정
- ✅ 보안 업데이트 자동화

---

## 문제 해결

### 데이터베이스 연결 실패

**증상**: `Database connection failed`

**해결**:

```bash
# MySQL 상태 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -h localhost -u root -p
```

### 포트 충돌

**증상**: `Port 3000 already in use`

**해결**:

```bash
# 포트 사용 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>

# 또는 .env에서 다른 포트로 변경
PORT=3001
```

### LTI 서명 오류

**증상**: `Invalid LTI signature`

**해결**:

1. Moodle의 LTI 시크릿과 backend/.env의 LTI_SECRET이 일치하는지 확인
2. 서버 시간이 정확한지 확인 (NTP 동기화)
3. URL이 정확한지 확인 (http vs https)

### Docker 컨테이너 실행 오류

**증상**: 컨테이너가 시작하지 않음

**해결**:

```bash
# 로그 확인
docker-compose logs backend
docker-compose logs mysql

# 컨테이너 재빌드
docker-compose up -d --build --force-recreate

# 볼륨 초기화 (주의: 데이터 삭제됨)
docker-compose down -v
docker-compose up -d
```

### 프론트엔드 빌드 오류

**증상**: npm run build 실패

**해결**:

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm cache clean --force
```

---

## 추가 리소스

- [Moodle LTI 문서](https://docs.moodle.org/en/External_tool)
- [IMS LTI 1.1 스펙](http://www.imsglobal.org/specs/ltiv1p1)
- [React DnD 문서](https://react-dnd.github.io/react-dnd/)

---

## 지원

문제가 계속되면 GitHub Issues에 보고해주세요.
