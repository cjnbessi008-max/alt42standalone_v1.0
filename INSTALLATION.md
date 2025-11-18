# Similarity Cards - 설치 가이드

이 문서는 Similarity Cards 앱을 처음부터 설치하고 설정하는 방법을 상세히 설명합니다.

## 📋 사전 준비

### 필수 소프트웨어

1. **Node.js** (16.0 이상)
   ```bash
   node --version  # v16.0.0 이상 확인
   npm --version
   ```

2. **PHP** (7.1.9)
   ```bash
   php --version  # PHP 7.1.9 확인
   ```

3. **MySQL** (5.7)
   ```bash
   mysql --version  # MySQL 5.7 확인
   ```

4. **Moodle** (3.7)
   - 기존 Moodle 3.7 설치 또는 신규 설치

## 🔧 단계별 설치

### 1단계: 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: Frontend 설정

```bash
cd frontend
npm install
```

**주요 의존성 패키지:**
- react, react-dom: UI 프레임워크
- typescript: 타입 시스템
- vite: 빌드 도구
- framer-motion: 애니메이션
- axios: HTTP 클라이언트

**설치 확인:**
```bash
npm list --depth=0
```

### 3단계: MySQL 데이터베이스 설정

#### 3.1 데이터베이스 및 사용자 생성

MySQL에 root로 로그인:
```bash
mysql -u root -p
```

다음 SQL 실행:
```sql
-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

#### 3.2 스키마 생성

```bash
cd backend/database
mysql -u moodle_user -p moodle < schema.sql
```

#### 3.3 데이터 확인

```bash
mysql -u moodle_user -p moodle
```

```sql
SHOW TABLES;
-- 출력: mdl_question_similarity_meta, mdl_question_attempts

SELECT * FROM mdl_question_similarity_meta;
-- 샘플 데이터 3개 확인

EXIT;
```

### 4단계: PHP API 설정

#### 4.1 설정 파일 수정

`backend/api/moodle_api.php` 파일 열기:

```php
// 데이터베이스 설정을 실제 값으로 변경
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'secure_password_here');  // 실제 비밀번호로 변경
```

#### 4.2 PHP 서버 실행

```bash
cd backend/api
php -S localhost:8080
```

**출력:**
```
PHP 7.1.9 Development Server started at ...
Listening on http://localhost:8080
```

#### 4.3 API 테스트

새 터미널에서:
```bash
curl http://localhost:8080/problems
```

**예상 응답:**
```json
[
  {
    "id": "101",
    "questionId": "101",
    "title": "삼각형 닮음 - AAA 조건",
    ...
  }
]
```

### 5단계: Frontend 실행

새 터미널에서:
```bash
cd frontend
npm run dev
```

**출력:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

브라우저에서 `http://localhost:3000` 접속

### 6단계: Moodle LMS 연동 (선택사항)

#### 6.1 Moodle 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리** → **플러그인** → **플러그인 설치**
3. 닮음 조건 문제 타입 플러그인 업로드

#### 6.2 코스 생성

1. **사이트 홈** → **새 코스 추가**
2. 코스 이름: "삼각형 닮음 학습"
3. 코스 ID: similarity-course

#### 6.3 문제 추가

1. 코스 → **퀴즈 추가**
2. 퀴즈 이름: "닮음 조건 연습"
3. 문제 추가 → 문제 타입: **similarity**
4. AAA, SAS, SSS 유형별 문제 각각 추가

#### 6.4 API 연결 설정

`frontend/src/services/moodleService.ts` 수정:

```typescript
const API_BASE_URL = 'http://your-moodle-server.com/api/moodle';
```

## 🧪 설치 확인

### Frontend 확인

1. `http://localhost:3000` 접속
2. 화면에 "Similarity Cards" 제목 표시
3. 우측 하단에 스마트폰 화면 표시
4. 스마트폰 화면 내 3개 카드 (AAA, SAS, SSS) 표시
5. 카드 클릭 시 빛나는 효과 확인

### Backend 확인

```bash
# 문제 목록 조회
curl http://localhost:8080/problems

# 특정 문제 조회
curl http://localhost:8080/problems/101

# 진도 저장 (POST)
curl -X POST http://localhost:8080/progress \
  -H "Content-Type: application/json" \
  -d '{"problemId":101,"attempts":1,"isCorrect":true,"timeSpent":60}'
```

### 통합 테스트

1. Frontend에서 카드 클릭
2. 브라우저 개발자 도구 → Network 탭
3. `/api/moodle/problems` 요청 확인
4. 응답 데이터 확인

## 🔧 문제 해결

### 포트 충돌

**증상:** "Address already in use"

**해결:**
```bash
# Frontend (포트 3000)
lsof -ti:3000 | xargs kill -9

# Backend (포트 8080)
lsof -ti:8080 | xargs kill -9
```

또는 포트 변경:
```bash
# Frontend
vite --port 3001

# Backend
php -S localhost:8081
```

### CORS 에러

**증상:** "CORS policy" 에러

**해결:** `backend/api/moodle_api.php` 확인:
```php
header('Access-Control-Allow-Origin: *');
```

프로덕션에서는 특정 도메인으로 제한:
```php
header('Access-Control-Allow-Origin: http://localhost:3000');
```

### MySQL 연결 실패

**증상:** "Database connection failed"

**해결:**
1. MySQL 서비스 실행 확인:
   ```bash
   sudo systemctl status mysql
   ```

2. 사용자 권한 확인:
   ```sql
   SHOW GRANTS FOR 'moodle_user'@'localhost';
   ```

3. 방화벽 확인:
   ```bash
   sudo ufw allow 3306
   ```

### npm install 실패

**증상:** "EACCES" 권한 에러

**해결:**
```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📦 프로덕션 배포

### Frontend 빌드

```bash
cd frontend
npm run build
```

빌드 파일: `frontend/dist/`

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name similarity-cards.example.com;

    # Frontend
    location / {
        root /var/www/similarity-cards/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/moodle {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName similarity-cards.example.com
    DocumentRoot /var/www/similarity-cards/frontend/dist

    <Directory /var/www/similarity-cards/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPass /api/moodle http://localhost:8080
    ProxyPassReverse /api/moodle http://localhost:8080
</VirtualHost>
```

### 환경변수 설정

`.env` 파일 생성:
```env
# Database
DB_HOST=localhost
DB_NAME=moodle
DB_USER=moodle_user
DB_PASS=secure_password

# API
API_BASE_URL=https://api.example.com

# Moodle
MOODLE_URL=https://moodle.example.com
```

## ✅ 설치 완료 체크리스트

- [ ] Node.js, PHP, MySQL 설치 확인
- [ ] 프로젝트 클론 완료
- [ ] Frontend 의존성 설치 (`npm install`)
- [ ] MySQL 데이터베이스 및 사용자 생성
- [ ] 데이터베이스 스키마 적용
- [ ] PHP API 설정 파일 수정
- [ ] PHP 서버 실행 및 API 테스트
- [ ] Frontend 실행 및 화면 확인
- [ ] 카드 클릭 및 애니메이션 확인
- [ ] API 연동 확인 (Network 탭)
- [ ] (선택) Moodle LMS 연동

## 🎓 다음 단계

설치가 완료되었다면:

1. [README.md](README.md) - 앱 사용법 확인
2. [docs/API.md](docs/API.md) - API 문서 참조
3. [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) - 커스터마이징 가이드

## 📞 도움이 필요하신가요?

- **Issue**: GitHub Issues에 문제 등록
- **Email**: support@example.com
- **Docs**: https://docs.example.com

---

**설치에 성공하셨나요? ⭐ Star를 눌러주세요!**
