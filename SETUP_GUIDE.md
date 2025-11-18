# Mean Center - 설치 및 실행 가이드

Moodle LMS와 연동되는 Mean Center 웹앱 설정 가이드입니다.

## 시스템 요구사항

- **Node.js**: 16.x 이상
- **MySQL**: 5.7
- **npm** 또는 **yarn**
- **(선택사항) Docker & Docker Compose**

## 설치 방법

### 방법 1: Docker 사용 (추천)

가장 간단한 방법입니다. Docker와 Docker Compose만 설치되어 있으면 됩니다.

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 브라우저에서 접속
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

컨테이너 중지:
```bash
docker-compose down
```

데이터베이스 포함 모두 삭제:
```bash
docker-compose down -v
```

---

### 방법 2: 수동 설치

#### 1. MySQL 데이터베이스 설정

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql
```

또는:

```bash
mysql -u root -p < database/schema.sql
```

#### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# .env 파일 수정 (데이터베이스 정보 입력)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=mean_center_db

# 개발 서버 실행
npm run dev
```

백엔드가 http://localhost:3000 에서 실행됩니다.

#### 3. 프론트엔드 설정

새 터미널 창에서:

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (선택사항)
cp .env.example .env

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

---

## Moodle 연동 설정

### 1. Moodle Web Service 활성화

Moodle 관리자 페이지에서:

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. "웹 서비스 활성화" 체크
3. "REST 프로토콜 활성화" 체크

### 2. Moodle 토큰 생성

1. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
2. 새 토큰 생성
3. 생성된 토큰을 복사

### 3. 백엔드 환경 변수 설정

`backend/.env` 파일에 Moodle 정보 추가:

```env
MOODLE_API_URL=http://your-moodle-instance.com/webservice/rest/server.php
MOODLE_TOKEN=your_generated_token_here
```

### 4. 연동 테스트

```bash
# 터미널에서 또는 브라우저에서
curl http://localhost:3000/api/moodle/test
```

성공 시:
```json
{
  "success": true,
  "configured": true,
  "data": {
    "siteName": "Your Moodle Site",
    "version": "3.7",
    "connected": true
  }
}
```

---

## 사용 방법

### 1. 세션 시작

1. 브라우저에서 http://localhost:5173 접속
2. Student ID와 이름 입력
3. "Start Session" 클릭

### 2. 좌표 입력

- 우측 하단 가상 스마트폰 화면을 터치/클릭
- 좌표가 추가될 때마다 Mean Center(빨간 점)가 이동
- 통계 정보가 실시간 업데이트

### 3. 세션 종료

- "End Session" 버튼 클릭
- 결과 요약 확인
- 새 세션 시작 가능

---

## API 엔드포인트

### 세션 관리
- `POST /api/sessions` - 새 세션 생성
- `GET /api/sessions/:sessionId` - 세션 조회
- `POST /api/sessions/:sessionId/end` - 세션 종료

### 좌표 추적
- `POST /api/movement` - 좌표 추가
- `GET /api/movement/:sessionId` - 좌표 조회
- `GET /api/mean-center/:sessionId` - Mean Center 통계 조회

### Moodle 연동
- `POST /api/moodle/auth` - Moodle 인증
- `GET /api/moodle/user/:userId` - 사용자 정보 조회
- `GET /api/moodle/test` - 연동 테스트

전체 API 문서는 http://localhost:3000 에서 확인 가능합니다.

---

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo service mysql status

# MySQL 재시작
sudo service mysql restart

# 연결 테스트
mysql -u root -p -e "SHOW DATABASES;"
```

### 포트 충돌

다른 서비스가 3000 또는 5173 포트를 사용 중이면:

**백엔드:**
`backend/.env`에서 PORT 변경

**프론트엔드:**
`frontend/vite.config.ts`에서 server.port 변경

### CORS 오류

`backend/.env`에서 CORS_ORIGIN 확인:
```env
CORS_ORIGIN=http://localhost:5173
```

프론트엔드 URL과 일치해야 합니다.

---

## 프로덕션 배포

### 백엔드 빌드

```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### 프론트엔드 빌드

```bash
cd frontend
npm run build

# dist 폴더를 웹 서버에 배포
# (Nginx, Apache 등)
```

### 보안 설정

1. `.env` 파일의 비밀번호 강화
2. HTTPS 활성화
3. CORS 도메인 제한
4. Rate limiting 설정
5. MySQL 외부 접근 차단

---

## 라이선스

MIT

## 지원

문제가 발생하면 GitHub Issues에 등록해주세요.
