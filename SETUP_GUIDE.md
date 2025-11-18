# Core Integral 설치 가이드

## 빠른 시작 (Quick Start)

Moodle 연결 없이 샘플 문제로 바로 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
cd alt42standalone_v1.0

# 프론트엔드 설치
cd frontend
npm install

# 백엔드 설치
cd ../backend
npm install
```

### 2. 환경 변수 설정 (선택사항)

샘플 문제만 사용할 경우 기본 설정으로 실행 가능합니다.

```bash
# Backend
cd backend
echo "PORT=3001" > .env
echo "CORS_ORIGIN=http://localhost:3000" >> .env

# Frontend
cd ../frontend
echo "VITE_API_URL=http://localhost:3001" > .env
```

### 3. 개발 서버 실행

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. 브라우저에서 확인

http://localhost:3000 접속

우측 하단에 가상 스마트폰이 표시되며, 샘플 적분 문제를 확인할 수 있습니다.

---

## Moodle 연동 설정 (상세)

### 사전 요구사항

- Moodle 3.7 설치 및 실행 중
- PHP 7.1.9
- MySQL 5.7
- Moodle 관리자 권한

### 1단계: Moodle Web Services 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리** 메뉴 접근
3. **플러그인 > 웹 서비스 > 관리** 이동
4. 다음 항목 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

### 2단계: 외부 서비스 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
2. **외부 서비스 추가** 클릭
3. 다음 정보 입력:
   - **이름**: Core Integral API
   - **짧은 이름**: core_integral
   - **활성화됨**: ✅
   - **인증된 사용자만**: ✅ (권장)

### 3단계: 서비스 기능 추가

1. 생성한 서비스의 **기능** 링크 클릭
2. 다음 기능 추가:
   - `core_question_get_random_question_summaries`
   - `core_question_get_question_data`

### 4단계: 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. **토큰 생성** 클릭
3. 다음 정보 입력:
   - **사용자**: API를 사용할 사용자 선택
   - **서비스**: Core Integral API 선택
4. **저장** 클릭
5. 생성된 토큰 복사 (나중에 사용)

### 5단계: MySQL 사용자 권한 설정

Moodle 데이터베이스에 직접 접근하기 위한 권한 부여:

```sql
-- MySQL에 root로 접속
mysql -u root -p

-- 새 사용자 생성 (선택사항)
CREATE USER 'core_integral'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 읽기 권한 부여
GRANT SELECT ON moodle.mdl_question TO 'core_integral'@'localhost';
GRANT SELECT ON moodle.mdl_question_categories TO 'core_integral'@'localhost';
GRANT SELECT ON moodle.mdl_question_attributes TO 'core_integral'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 테스트
mysql -u core_integral -p
USE moodle;
SELECT COUNT(*) FROM mdl_question;
```

### 6단계: Backend 환경 변수 설정

`backend/.env` 파일 생성 및 편집:

```env
# Server
PORT=3001
NODE_ENV=development

# Moodle Database (MySQL 5.7)
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=core_integral
MOODLE_DB_PASSWORD=your_secure_password

# Moodle API
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token_here

# CORS
CORS_ORIGIN=http://localhost:3000
```

**중요**: 실제 값으로 교체하세요!
- `MOODLE_URL`: Moodle 사이트 주소 (예: http://localhost/moodle)
- `MOODLE_TOKEN`: 4단계에서 생성한 토큰
- `MOODLE_DB_PASSWORD`: 5단계에서 설정한 비밀번호

### 7단계: 연결 테스트

```bash
cd backend
npm run dev
```

다른 터미널에서:

```bash
# Health Check
curl http://localhost:3001/health

# Moodle에서 문제 가져오기 테스트
curl http://localhost:3001/api/problems?limit=5
```

성공 응답 예시:
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

---

## 문제 해결 (Troubleshooting)

### 1. Moodle 연결 실패

**증상**: `Moodle 서버에서 문제를 가져올 수 없습니다.`

**해결**:
```bash
# 1. Moodle Web Services 활성화 확인
# 2. 토큰 유효성 확인
curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"

# 3. 방화벽 확인
# 4. Moodle 로그 확인
```

### 2. MySQL 연결 실패

**증상**: `데이터베이스 연결 실패`

**해결**:
```bash
# MySQL 연결 테스트
mysql -h localhost -u core_integral -p -e "SELECT 1;"

# 권한 확인
mysql -u root -p -e "SHOW GRANTS FOR 'core_integral'@'localhost';"

# Moodle 테이블 존재 확인
mysql -u core_integral -p moodle -e "SHOW TABLES LIKE 'mdl_question';"
```

### 3. CORS 오류

**증상**: 브라우저 콘솔에 `CORS policy` 오류

**해결**:
```env
# backend/.env
CORS_ORIGIN=http://localhost:3000

# 여러 도메인 허용 (production)
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

### 4. MathJax 렌더링 안됨

**증상**: 수식이 LaTeX 코드 그대로 표시

**해결**:
```bash
# 브라우저 콘솔 확인
# 1. index.html의 MathJax CDN 로드 확인
# 2. 네트워크 탭에서 MathJax 스크립트 로드 확인
# 3. 페이지 새로고침
```

### 5. 포트 충돌

**증상**: `EADDRINUSE: address already in use`

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :3001
lsof -i :3000

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
# backend/.env
PORT=3002
```

---

## 개발 팁

### Hot Reload 활성화

프론트엔드와 백엔드 모두 코드 변경 시 자동 재시작됩니다.

```bash
# Frontend: Vite HMR
# 저장하면 즉시 브라우저 업데이트

# Backend: tsx watch
# TypeScript 파일 변경 시 자동 재시작
```

### 디버깅

#### Backend 디버깅
```bash
# 로그 레벨 설정
NODE_ENV=development npm run dev

# 모든 로그 출력 확인
```

#### Frontend 디버깅
```javascript
// Chrome DevTools > Sources > Pause on Exceptions 활성화
// React DevTools 설치 권장
```

### 테스트 데이터 추가

Moodle에 적분 문제 추가:

1. Moodle > **문제 은행** 이동
2. **새 문제 만들기** 클릭
3. **수치** 또는 **계산** 유형 선택
4. 문제 텍스트에 적분 관련 내용 입력
5. **저장** 후 Core Integral에서 확인

---

## 성능 최적화

### Production 빌드

```bash
# Frontend
cd frontend
npm run build
# dist/ 폴더에 최적화된 빌드 생성

# Backend
cd backend
npm run build
# dist/ 폴더에 컴파일된 JavaScript 생성
```

### PM2로 배포 (Production)

```bash
npm install -g pm2

# Backend 실행
cd backend
pm2 start dist/index.js --name core-integral-api

# Frontend (정적 서빙)
pm2 serve frontend/dist 3000 --name core-integral-web

# 프로세스 확인
pm2 list

# 로그 확인
pm2 logs
```

---

## 보안 권장사항

### 1. 환경 변수 보호

```bash
# .env 파일을 절대 git에 커밋하지 마세요
# .gitignore에 이미 포함되어 있습니다

# Production 환경에서는 환경 변수 암호화 사용
```

### 2. Moodle 토큰 관리

- 토큰을 정기적으로 갱신하세요
- 최소 권한 원칙 적용
- 토큰을 공개 저장소에 노출하지 마세요

### 3. MySQL 보안

```sql
-- 최소 권한만 부여
GRANT SELECT ON moodle.mdl_question TO 'core_integral'@'localhost';

-- 원격 접속 차단 (localhost만 허용)
```

### 4. CORS 설정

```env
# Development
CORS_ORIGIN=http://localhost:3000

# Production - 특정 도메인만 허용
CORS_ORIGIN=https://your-domain.com
```

---

## 추가 리소스

- [Moodle Web Services 문서](https://docs.moodle.org/dev/Web_services)
- [MathJax 문서](https://docs.mathjax.org/)
- [React 공식 문서](https://react.dev/)
- [Express.js 가이드](https://expressjs.com/)

## 지원

문제가 발생하면:
1. 이 가이드의 문제 해결 섹션 확인
2. GitHub 이슈 생성
3. 관련 로그 첨부
