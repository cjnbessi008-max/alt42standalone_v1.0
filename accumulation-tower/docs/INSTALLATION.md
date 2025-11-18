# Accumulation Tower - 설치 가이드

## 📋 시스템 요구사항

### 필수 사항
- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Moodle**: 3.7 이상
- **MySQL**: 5.7 이상 (선택사항)

### 권장 사항
- 운영체제: Linux, macOS, Windows 10+
- 메모리: 최소 2GB RAM
- 디스크: 500MB 여유 공간

---

## 🚀 설치 단계

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd accumulation-tower
```

### 2. Backend 설정

#### 2.1 의존성 설치

```bash
cd backend
npm install
```

#### 2.2 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# 서버 설정
PORT=3001
NODE_ENV=development

# Moodle 설정
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token_here

# CORS 설정
FRONTEND_URL=http://localhost:3000

# 업데이트 간격 (밀리초)
SCORE_UPDATE_INTERVAL=5000
```

#### 2.3 Moodle Web Service 토큰 발급

1. Moodle 관리자로 로그인
2. **사이트 관리 → 플러그인 → 웹 서비스 → 개요** 이동
3. 다음 단계 수행:
   - ✅ **웹 서비스 활성화**
   - ✅ **프로토콜 활성화** (REST 프로토콜)
   - ✅ **서비스 생성**
   - ✅ **함수 추가**
   - ✅ **사용자에게 권한 부여**
   - ✅ **토큰 생성**

4. 필요한 웹 서비스 함수:
   ```
   core_user_get_users
   mod_quiz_get_quizzes_by_courses
   mod_quiz_get_user_attempts
   gradereport_user_get_grade_items
   ```

5. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

### 3. Frontend 설정

#### 3.1 의존성 설치

```bash
cd ../frontend
npm install
```

#### 3.2 환경 변수 설정 (선택사항)

`.env` 파일 생성:

```env
REACT_APP_API_URL=http://localhost:3001
```

---

## 🏃 실행

### Development 모드

#### Backend 실행 (터미널 1)

```bash
cd backend
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

#### Frontend 실행 (터미널 2)

```bash
cd frontend
npm start
```

앱이 자동으로 `http://localhost:3000`에서 열립니다.

### Production 빌드

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
```

빌드된 파일은 `frontend/build/` 디렉토리에 생성됩니다.

---

## 🔧 설정

### URL 파라미터로 설정 전달

앱 접속 시 URL 파라미터로 설정을 전달할 수 있습니다:

```
http://localhost:3000/?userId=2&courseId=1&serverUrl=http://localhost:3001
```

**파라미터:**
- `userId`: Moodle 사용자 ID
- `courseId`: Moodle 코스 ID
- `serverUrl`: Backend 서버 URL

### 앱 내에서 설정 변경

1. 우측 상단의 ⚙️ (설정) 버튼 클릭
2. 사용자 ID, 코스 ID, 서버 URL 입력
3. "저장" 버튼 클릭

---

## 🐛 문제 해결

### Backend가 시작되지 않음

**증상:** `Error: MOODLE_URL is not defined`

**해결:**
```bash
cd backend
# .env 파일이 있는지 확인
ls -la .env

# 없다면 생성
cp .env.example .env
# .env 파일 편집하여 MOODLE_URL과 MOODLE_TOKEN 설정
```

### Moodle 연결 오류

**증상:** `Failed to fetch accumulation data`

**확인 사항:**
1. Moodle URL이 정확한지 확인
2. 토큰이 유효한지 확인
3. 웹 서비스가 활성화되어 있는지 확인
4. 필요한 함수 권한이 있는지 확인

**테스트:**
```bash
# Moodle API 직접 테스트
curl "https://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
```

### CORS 오류

**증상:** `Access-Control-Allow-Origin` 오류

**해결:**
Backend `.env` 파일에서 `FRONTEND_URL` 확인:
```env
FRONTEND_URL=http://localhost:3000
```

### Socket 연결 실패

**증상:** `Socket connection error`

**해결:**
1. Backend가 실행 중인지 확인
2. 방화벽이 포트 3001을 차단하지 않는지 확인
3. Frontend의 서버 URL 설정 확인

---

## 📦 Docker 설치 (선택사항)

Docker를 사용하여 쉽게 배포할 수 있습니다.

### Docker Compose 파일 생성

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MOODLE_URL=${MOODLE_URL}
      - MOODLE_TOKEN=${MOODLE_TOKEN}
      - FRONTEND_URL=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 실행

```bash
docker-compose up -d
```

---

## 🔒 보안 권장사항

1. **프로덕션 환경에서:**
   - `NODE_ENV=production` 설정
   - HTTPS 사용
   - 토큰은 환경 변수로 관리 (코드에 포함하지 않기)

2. **Moodle 토큰 관리:**
   - 토큰을 정기적으로 갱신
   - 최소 권한 원칙 적용 (필요한 함수만 권한 부여)

3. **방화벽 설정:**
   - Backend 포트는 Frontend에서만 접근 가능하도록 제한

---

## 📞 지원

문제가 발생하면:
1. GitHub Issues에 문제 등록
2. 로그 파일 확인 (Backend 콘솔 출력)
3. 문서 재확인

**유용한 명령어:**

```bash
# Backend 로그 확인
cd backend
npm run dev 2>&1 | tee server.log

# Frontend 빌드 오류 확인
cd frontend
npm run build --verbose
```
