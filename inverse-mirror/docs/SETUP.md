# Inverse Mirror - 설치 및 설정 가이드

## 1. 시스템 요구사항

### 필수 소프트웨어
- **Node.js**: 18.0 이상
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7

### 권장 환경
- OS: Ubuntu 20.04 LTS 또는 macOS
- RAM: 최소 4GB
- 디스크: 최소 10GB 여유 공간

## 2. 데이터베이스 설정

### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source inverse-mirror/backend/schema.sql
```

또는:

```bash
mysql -u root -p < inverse-mirror/backend/schema.sql
```

### 데이터베이스 확인

```sql
USE inverse_mirror;
SHOW TABLES;
SELECT * FROM problems;
```

## 3. Moodle Web Services 설정

### 3.1 Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** → **고급 기능**
3. **웹 서비스 활성화** 체크박스 선택
4. **변경사항 저장**

### 3.2 외부 서비스 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. **외부 서비스 추가** 클릭
3. 다음 정보 입력:
   - 이름: `Inverse Mirror API`
   - 짧은 이름: `inverse_mirror`
   - 활성화됨: 체크

### 3.3 필요한 함수 추가

다음 함수들을 외부 서비스에 추가:

- `core_webservice_get_site_info`
- `core_course_get_courses`
- `mod_quiz_get_quiz_access_information`
- `mod_quiz_save_attempt`

### 3.4 API 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. **토큰 추가** 클릭
3. 사용자 선택 및 서비스 선택 (`inverse_mirror`)
4. 생성된 토큰 복사

## 4. 백엔드 설정

### 4.1 의존성 설치

```bash
cd inverse-mirror/backend
npm install
```

### 4.2 환경 변수 설정

`.env.example`을 `.env`로 복사하고 설정:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inverse_mirror

# Moodle Configuration
MOODLE_BASE_URL=http://localhost/moodle
MOODLE_WS_TOKEN=your_moodle_token_here
MOODLE_COURSE_ID=2

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4.3 백엔드 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 4.4 API 테스트

브라우저 또는 curl로 확인:

```bash
curl http://localhost:5000/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T...",
  "service": "Inverse Mirror API"
}
```

## 5. 프론트엔드 설정

### 5.1 의존성 설치

```bash
cd inverse-mirror/frontend
npm install
```

### 5.2 프론트엔드 실행

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 5.3 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 6. 전체 시스템 실행

### 개발 환경

**터미널 1 - 백엔드:**
```bash
cd inverse-mirror/backend
npm run dev
```

**터미널 2 - 프론트엔드:**
```bash
cd inverse-mirror/frontend
npm run dev
```

### 프로덕션 환경

#### Option 1: PM2 사용 (권장)

```bash
# PM2 설치
npm install -g pm2

# 백엔드 시작
cd inverse-mirror/backend
npm run build
pm2 start dist/index.js --name inverse-mirror-api

# 프론트엔드 빌드 및 서빙
cd ../frontend
npm run build
pm2 serve dist 3000 --name inverse-mirror-web --spa
```

#### Option 2: Docker 사용

```bash
# Docker Compose로 실행 (추후 제공)
docker-compose up -d
```

## 7. 문제 해결

### MySQL 연결 오류

**증상:** `ER_ACCESS_DENIED_ERROR` 또는 `ECONNREFUSED`

**해결:**
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 사용자 권한 확인
mysql -u root -p
> GRANT ALL PRIVILEGES ON inverse_mirror.* TO 'your_user'@'localhost';
> FLUSH PRIVILEGES;
```

### Moodle 연결 실패

**증상:** `Moodle connection failed`

**해결:**
1. Moodle Web Services가 활성화되었는지 확인
2. 토큰이 올바른지 확인
3. Moodle URL이 정확한지 확인 (http:// 또는 https://)
4. 방화벽 설정 확인

### 프론트엔드 빌드 오류

**증상:** `Module not found` 또는 타입 오류

**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm cache clean --force
```

### CORS 오류

**증상:** `Access-Control-Allow-Origin` 오류

**해결:**
- 백엔드 `.env`에서 `CORS_ORIGIN` 확인
- 프론트엔드 URL과 일치하는지 확인

## 8. API 엔드포인트 목록

### Health Check
```
GET /api/health
```

### Problems
```
GET  /api/problems              # 모든 문제 조회
GET  /api/problems/random       # 랜덤 문제 조회
GET  /api/problems/:id          # 특정 문제 조회
POST /api/problems              # 새 문제 생성
GET  /api/problems/moodle/:id   # Moodle에서 문제 가져오기
```

### Progress
```
POST /api/progress                        # 진행도 저장
GET  /api/progress/:studentId             # 학생 진행도 조회
GET  /api/progress/:studentId/:problemId  # 특정 문제 진행도
GET  /api/progress/:studentId/stats       # 학생 통계
```

## 9. 다음 단계

1. **Moodle 퀴즈 생성**: Moodle에서 역함수 미분 퀴즈 생성
2. **학생 등록**: Moodle 코스에 학생 등록
3. **문제 테스트**: 프론트엔드에서 "Moodle에서 문제 가져오기" 테스트
4. **진행도 확인**: Moodle에서 학생 성적 확인

## 10. 지원

문제가 있으시면:
- GitHub Issues 등록
- 문서 참조: `/docs` 디렉토리
- 로그 확인: 백엔드 콘솔 출력
