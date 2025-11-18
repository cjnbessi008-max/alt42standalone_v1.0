# DMN 모니터링 시스템 설치 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [설치 방법](#설치-방법)
3. [Moodle 연동 설정](#moodle-연동-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [프로덕션 배포](#프로덕션-배포)

## 시스템 요구사항

### 최소 사양
- CPU: 2 cores
- RAM: 4GB
- 저장공간: 10GB
- OS: Linux, macOS, Windows (Docker 지원)

### 권장 사양
- CPU: 4 cores
- RAM: 8GB
- 저장공간: 20GB
- OS: Ubuntu 20.04 LTS 이상

### 소프트웨어
- Docker 20.10 이상
- Docker Compose 2.0 이상

## 설치 방법

### 1단계: Docker 설치

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### macOS
```bash
brew install --cask docker
```

#### Windows
Docker Desktop for Windows 다운로드 및 설치:
https://www.docker.com/products/docker-desktop

### 2단계: 프로젝트 설정

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 환경 변수 파일 생성
cp .env.example .env
```

### 3단계: 환경 변수 구성

`.env` 파일 편집:

```env
# 데이터베이스 설정
POSTGRES_DB=dmn_monitoring
POSTGRES_USER=dmn_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD  # 반드시 변경!

# Redis 설정
REDIS_PASSWORD=  # 선택사항, 보안 강화 시 설정

# API Gateway
API_GATEWAY_PORT=3000
JWT_SECRET=CHANGE_THIS_SECRET_KEY  # 반드시 변경!

# DMN Service
DMN_SERVICE_PORT=8000

# Moodle 연동 (선택)
MOODLE_URL=https://your-moodle-instance.com
MOODLE_API_TOKEN=your_moodle_api_token

# CORS 설정
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4단계: 서비스 시작

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f dmn-service
```

### 5단계: 설치 확인

```bash
# 헬스 체크
curl http://localhost:3000/health
curl http://localhost:8000/health

# 데이터베이스 확인
docker-compose exec postgres psql -U dmn_user -d dmn_monitoring -c "SELECT version();"
```

브라우저에서 http://localhost:5173 접속하여 프론트엔드 확인

## Moodle 연동 설정

### 1단계: Moodle Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **Site administration > Advanced features**
3. "Enable web services" 체크
4. 저장

### 2단계: Web Service 프로토콜 활성화

1. **Site administration > Plugins > Web services > Manage protocols**
2. "REST protocol" 활성화

### 3단계: 외부 서비스 생성

1. **Site administration > Plugins > Web services > External services**
2. "Add" 클릭
3. 서비스 정보 입력:
   - Name: DMN Monitoring
   - Short name: dmn_monitoring
   - Enabled: Yes
   - Authorized users only: Yes

### 4단계: 함수 추가

서비스에 다음 함수들을 추가:
- `core_enrol_get_enrolled_users`
- `core_course_get_courses`
- `core_user_get_users_by_field`
- `core_webservice_get_site_info`

### 5단계: API 사용자 생성

1. **Site administration > Users > Accounts > Add a new user**
2. 사용자 정보 입력 (예: dmn_api_user)
3. 적절한 권한 부여

### 6단계: 토큰 생성

1. **Site administration > Plugins > Web services > Manage tokens**
2. "Add" 클릭
3. 설정:
   - User: 5단계에서 생성한 사용자
   - Service: DMN Monitoring
4. 토큰 복사

### 7단계: 환경 변수 설정

`.env` 파일에 토큰 추가:

```env
MOODLE_URL=https://your-moodle.com
MOODLE_API_TOKEN=복사한_토큰
```

### 8단계: 서비스 재시작 및 테스트

```bash
# 서비스 재시작
docker-compose restart api-gateway

# 연결 테스트
curl http://localhost:3000/api/moodle/status
```

### 9단계: 데이터 동기화

```bash
# 과정 동기화
curl -X POST http://localhost:3000/api/moodle/sync/courses

# 특정 과정의 학생 동기화 (courseId는 Moodle에서 확인)
curl -X POST http://localhost:3000/api/moodle/sync/students \
  -H "Content-Type: application/json" \
  -d '{"courseId": 2}'
```

## 데이터베이스 설정

### 수동 스키마 적용 (필요 시)

```bash
# PostgreSQL 컨테이너 접속
docker-compose exec postgres psql -U dmn_user -d dmn_monitoring

# 스키마 파일 실행
\i /docker-entrypoint-initdb.d/01-schema.sql

# 테이블 확인
\dt

# 종료
\q
```

### 백업 및 복원

#### 백업
```bash
docker-compose exec postgres pg_dump -U dmn_user dmn_monitoring > backup.sql
```

#### 복원
```bash
docker-compose exec -T postgres psql -U dmn_user dmn_monitoring < backup.sql
```

### 데이터 초기화 (주의!)

```bash
# 모든 데이터 삭제 후 재생성
docker-compose down -v
docker-compose up -d
```

## 프로덕션 배포

### 1. HTTPS 설정 (Nginx + Let's Encrypt)

`nginx.conf` 예시:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 2. 프로덕션 환경 변수

```env
NODE_ENV=production
LOG_LEVEL=warn

# 강력한 비밀번호 사용
POSTGRES_PASSWORD=complex_secure_password_here
JWT_SECRET=very_long_random_secret_key_here

# CORS를 프로덕션 도메인으로 제한
ALLOWED_ORIGINS=https://your-domain.com
```

### 3. Docker Compose 프로덕션 설정

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    restart: always
    volumes:
      - /var/lib/dmn-data/postgres:/var/lib/postgresql/data

  redis:
    restart: always
    volumes:
      - /var/lib/dmn-data/redis:/data

  dmn-service:
    restart: always
    environment:
      - LOG_LEVEL=info

  api-gateway:
    restart: always
    environment:
      - NODE_ENV=production

  frontend:
    restart: always
    build:
      args:
        - NODE_ENV=production
```

실행:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. 모니터링 설정

```bash
# 로그 확인
docker-compose logs --tail=100 -f

# 리소스 사용량 확인
docker stats

# 헬스 체크 스크립트 (cron으로 실행)
#!/bin/bash
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "API Gateway is down, restarting..."
    docker-compose restart api-gateway
fi
```

### 5. 자동 시작 설정

```bash
# systemd 서비스 파일 생성
sudo nano /etc/systemd/system/dmn-monitoring.service
```

내용:
```ini
[Unit]
Description=DMN Monitoring System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/alt42standalone_v1.0
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

활성화:
```bash
sudo systemctl enable dmn-monitoring
sudo systemctl start dmn-monitoring
```

## 문제 해결

### 포트 충돌
```bash
# 사용 중인 포트 확인
sudo netstat -tulpn | grep :3000

# .env에서 포트 변경
API_GATEWAY_PORT=3001
```

### 메모리 부족
```bash
# Docker 메모리 제한 설정
docker-compose.yml에 추가:
services:
  dmn-service:
    mem_limit: 1g
```

### 데이터베이스 권한 문제
```bash
docker-compose exec postgres psql -U dmn_user -d dmn_monitoring
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dmn_user;
```

## 추가 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Moodle Web Services](https://docs.moodle.org/en/Web_services)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [React 문서](https://react.dev/)

---

문제가 계속되면 GitHub Issues에 질문을 올려주세요!
