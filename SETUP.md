# 조건 스캐너 설치 가이드

## 🎯 빠른 시작 (5분 설치)

### 1단계: 의존성 설치

```bash
cd alt42standalone_v1.0
npm run install:all
```

### 2단계: MySQL 데이터베이스 설정

```bash
# MySQL 로그인
mysql -u root -p

# 데이터베이스 생성 (수동)
CREATE DATABASE condition_scanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 또는 자동 초기화
cd database
npm install
npm run init
```

### 3단계: 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 편집하세요:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=condition_scanner

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 4단계: Moodle 토큰 생성

1. Moodle 관리자로 로그인
2. **사이트 관리 → 플러그인 → 웹 서비스 → 개요**
3. "웹 서비스 활성화" 클릭
4. 다음 단계들을 따라 진행:
   - 프로토콜 활성화 (REST)
   - 외부 서비스 생성
   - 함수 추가
   - 사용자 선택
   - 토큰 생성

**필수 함수:**
```
core_course_get_contents
core_webservice_get_site_info
```

5. 생성된 토큰을 복사하여 `.env` 파일에 붙여넣기

### 5단계: 실행

```bash
# 루트 디렉토리에서
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 🔧 상세 설정

### MySQL 상세 설정

#### Windows

```bash
# MySQL 서비스 시작
net start MySQL80

# MySQL 명령줄 접속
mysql -u root -p
```

#### macOS (Homebrew)

```bash
# MySQL 시작
brew services start mysql

# 접속
mysql -u root -p
```

#### Linux (Ubuntu/Debian)

```bash
# MySQL 시작
sudo systemctl start mysql

# 접속
sudo mysql -u root -p
```

#### 새 사용자 생성 (권장)

```sql
CREATE USER 'condition_scanner'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON condition_scanner.* TO 'condition_scanner'@'localhost';
FLUSH PRIVILEGES;
```

### Moodle 상세 설정

#### 1. 웹 서비스 활성화

**사이트 관리 → 고급 기능**
- [ ] "웹 서비스 활성화" 체크

#### 2. REST 프로토콜 활성화

**사이트 관리 → 플러그인 → 웹 서비스 → 프로토콜 관리**
- [ ] REST 프로토콜 활성화

#### 3. 외부 서비스 생성

**사이트 관리 → 플러그인 → 웹 서비스 → 외부 서비스**

1. "추가" 클릭
2. 서비스 정보 입력:
   ```
   이름: Condition Scanner
   짧은 이름: condition_scanner
   활성화: 예
   ```

#### 4. 함수 추가

생성한 서비스에 다음 함수들을 추가:

```
core_course_get_contents
core_webservice_get_site_info
```

선택적 (더 많은 기능을 원할 경우):
```
core_course_get_courses
core_enrol_get_users_courses
mod_assign_get_assignments
mod_quiz_get_quizzes_by_courses
```

#### 5. 토큰 생성

**사이트 관리 → 플러그인 → 웹 서비스 → 토큰 관리**

1. "추가" 클릭
2. 설정:
   ```
   사용자: [관리자 또는 권한이 있는 사용자]
   서비스: Condition Scanner
   ```
3. "저장" 후 토큰 복사

#### 6. CORS 설정 (필요시)

**사이트 관리 → 보안 → HTTP 보안**

개발 환경에서는:
```
허용된 HTTP 방법: GET, POST
```

### 포트 변경

#### 프론트엔드 포트 변경

`frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3001, // 원하는 포트로 변경
  }
})
```

#### 백엔드 포트 변경

`backend/.env`:
```env
PORT=5001
```

`frontend/vite.config.ts`의 proxy도 변경:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5001', // 변경된 포트
    changeOrigin: true,
  }
}
```

## 🧪 테스트

### 1. 백엔드 API 테스트

```bash
# 헬스체크
curl http://localhost:5000/api/health

# Moodle 연결 테스트
curl http://localhost:5000/api/moodle/test

# 활동 가져오기 (코스 ID = 1)
curl http://localhost:5000/api/moodle/activities/1
```

### 2. 데이터베이스 테스트

```bash
mysql -u root -p condition_scanner

# 테이블 확인
SHOW TABLES;

# 샘플 데이터 확인
SELECT * FROM activities;
SELECT * FROM conditions;
```

### 3. 프론트엔드 테스트

브라우저에서 http://localhost:3000 접속 후:

1. 연결 상태가 초록불인지 확인
2. 코스 ID 입력 후 "로드" 클릭
3. 활동 선택
4. "스캔 시작" 클릭
5. 우측 스마트폰 화면에서 하이라이트 확인

## 🚨 문제 해결

### "ECONNREFUSED" 오류

**원인**: MySQL이 실행되지 않음

**해결**:
```bash
# Windows
net start MySQL80

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### "Access denied for user" 오류

**원인**: MySQL 비밀번호가 잘못됨

**해결**:
1. `.env` 파일의 `DB_PASSWORD` 확인
2. MySQL 비밀번호 재설정:
```bash
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
```

### "Moodle token invalid" 오류

**원인**: Moodle 토큰이 올바르지 않음

**해결**:
1. Moodle에서 토큰 재생성
2. `.env` 파일의 `MOODLE_TOKEN` 업데이트
3. 백엔드 재시작

### "Port already in use" 오류

**원인**: 포트가 이미 사용 중

**해결**:
```bash
# 프로세스 찾기 (Linux/macOS)
lsof -i :3000
lsof -i :5000

# 프로세스 종료
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS 오류

**원인**: Moodle CORS 설정

**해결**:
1. Moodle 관리자 로그인
2. **사이트 관리 → 보안 → HTTP 보안**
3. 다음 설정 추가:
   ```
   허용된 원본: http://localhost:3000
   ```

## 📦 프로덕션 배포

### 1. 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 빌드 파일은 frontend/dist/에 생성됨
```

### 2. 환경 변수 설정

```env
NODE_ENV=production
PORT=5000

# 프로덕션 데이터베이스
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=secure_password

# 프로덕션 Moodle
MOODLE_URL=https://your-moodle-site.com
```

### 3. 서버 실행

```bash
cd backend
npm start
```

### 4. 정적 파일 서빙

#### Nginx 설정

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 프론트엔드
    location / {
        root /path/to/alt42standalone_v1.0/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 보안 체크리스트

- [ ] `.env` 파일을 `.gitignore`에 추가
- [ ] 프로덕션에서 강력한 MySQL 비밀번호 사용
- [ ] Moodle 토큰 안전하게 보관
- [ ] HTTPS 사용 (프로덕션)
- [ ] CORS 설정 제한 (프로덕션)
- [ ] MySQL 원격 접속 제한
- [ ] 방화벽 설정

## 📞 추가 도움

문제가 계속되면:

1. 로그 확인:
   ```bash
   # 백엔드 로그
   cd backend
   npm run dev

   # 에러 메시지 복사
   ```

2. 데이터베이스 상태 확인:
   ```sql
   SHOW VARIABLES LIKE '%version%';
   SHOW DATABASES;
   SHOW TABLES;
   ```

3. GitHub Issues에 질문 올리기 (에러 로그 포함)

---

설치 완료! 🎉
